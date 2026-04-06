/**
 * Refactor script: Add credentials:'include' and remove Authorization headers
 * from all fetch calls to the backend API (getApiUrl / API_BASE_URL), while
 * leaving third-party API calls (komoot, openstreetmap, etc.) untouched.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

// Patterns that identify a backend fetch call (skip third-party URLs)
const BACKEND_PATTERNS = [
  /getApiUrl\(/,
  /API_BASE_URL/,
];

// Matches a complete fetch call and its options object (handles multiline)
// We'll process file content as a string and use a state-machine approach.

let totalFiles = 0;
let modifiedFiles = 0;

function getAllFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue;
      results.push(...getAllFiles(full));
    } else if (['.vue', '.ts', '.js'].includes(extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Find the matching closing brace position starting from `start` in `src`.
 * Assumes src[start] === '{'.
 */
function findMatchingBrace(src, start) {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === stringChar) inString = false;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function processFile(filePath) {
  let src = readFileSync(filePath, 'utf8');
  let changed = false;

  // Find each fetch( call
  let searchFrom = 0;
  while (true) {
    const fetchIdx = src.indexOf('fetch(', searchFrom);
    if (fetchIdx === -1) break;

    // Determine what's inside the fetch call
    // fetch(url) or fetch(url, { ... })
    // First, find the content of this fetch call to check if it's a backend call
    // We'll grab a window around the fetch to check
    const windowEnd = Math.min(fetchIdx + 400, src.length);
    const window = src.slice(fetchIdx, windowEnd);

    const isBackend = BACKEND_PATTERNS.some(p => p.test(window));

    if (!isBackend) {
      searchFrom = fetchIdx + 6;
      continue;
    }

    // Now find the options object (second arg). We need to locate the opening { 
    // after the first argument (the URL).
    // Strategy: start after 'fetch(', find the comma that separates url from options.
    // We do this by tracking depth after the opening paren.
    let parenStart = fetchIdx + 5; // position of '('
    let depth = 0;
    let inStr = false;
    let strChar = '';
    let commaIdx = -1;
    let fetchCallEnd = -1;

    for (let i = parenStart; i < src.length; i++) {
      const ch = src[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === strChar) inStr = false;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; continue; }
      if (ch === '(') { depth++; continue; }
      if (ch === ')') {
        depth--;
        if (depth === 0) { fetchCallEnd = i; break; }
        continue;
      }
      if (ch === ',' && depth === 1 && commaIdx === -1) {
        commaIdx = i;
      }
    }

    if (fetchCallEnd === -1) {
      searchFrom = fetchIdx + 6;
      continue;
    }

    if (commaIdx === -1) {
      // No options object — add one: fetch(url) → fetch(url, { credentials: 'include' })
      const before = src.slice(0, fetchCallEnd);
      const after = src.slice(fetchCallEnd);
      src = before + ", { credentials: 'include' }" + after;
      changed = true;
      searchFrom = fetchCallEnd + 1;
      continue;
    }

    // Options object exists. Find its opening brace.
    let optionsStart = -1;
    for (let i = commaIdx + 1; i < fetchCallEnd; i++) {
      if (src[i] === '{') { optionsStart = i; break; }
      if (src[i] !== ' ' && src[i] !== '\n' && src[i] !== '\r' && src[i] !== '\t') break;
    }

    if (optionsStart === -1) {
      searchFrom = fetchCallEnd + 1;
      continue;
    }

    const optionsEnd = findMatchingBrace(src, optionsStart);
    if (optionsEnd === -1) {
      searchFrom = fetchCallEnd + 1;
      continue;
    }

    let optionsBlock = src.slice(optionsStart, optionsEnd + 1);

    // 1. Remove 'Authorization': `Bearer ${...}` line
    const authLineRe = /[ \t]*'Authorization':\s*`Bearer \$\{[^`]*\}`\s*,?\r?\n?/g;
    const newBlock = optionsBlock.replace(authLineRe, '');
    if (newBlock !== optionsBlock) {
      optionsBlock = newBlock;
      changed = true;
    }

    // 2. Add credentials: 'include' if not already present
    if (!/credentials\s*:/.test(optionsBlock)) {
      // Insert after the opening brace
      optionsBlock = optionsBlock.replace(/^\{/, "{ credentials: 'include', ");
      changed = true;
    }

    // Also clean up token guard (const token = localStorage.getItem('access_token'); if (!token) return;)
    // We'll handle that separately below.

    src = src.slice(0, optionsStart) + optionsBlock + src.slice(optionsEnd + 1);
    searchFrom = optionsStart + optionsBlock.length;
  }

  // 3. Remove token-gating guards: lines like:
  //    const token = localStorage.getItem('access_token');
  //    if (!token) return;   (or return null;)
  // These are now unnecessary since auth is cookie-based.
  // We replace them with a comment to be safe.
  const tokenGetRe = /[ \t]*const token = (?:localStorage|storage)\.getItem\(['"]access_token['"]\);\r?\n/g;
  if (tokenGetRe.test(src)) {
    src = src.replace(tokenGetRe, '');
    changed = true;
  }

  // Also remove "if (!token) return;" / "if (!token) return null;"
  const tokenGuardRe = /[ \t]*if \(!token\) return(?: null)?;\r?\n/g;
  if (tokenGuardRe.test(src)) {
    src = src.replace(tokenGuardRe, '');
    changed = true;
  }

  // Remove uses of token in headers that weren't caught by the above (leftover references)
  // e.g.   const proId = ...token   — these are non-header token reads that may remain.
  // We DO NOT remove those; we only target Authorization headers and guard statements.

  totalFiles++;
  if (changed) {
    writeFileSync(filePath, src, 'utf8');
    modifiedFiles++;
    console.log(`✅ Modified: ${filePath}`);
  }
}

const files = getAllFiles(SRC_DIR);
for (const f of files) {
  processFile(f);
}

console.log(`\nDone. Processed ${totalFiles} files, modified ${modifiedFiles}.`);
