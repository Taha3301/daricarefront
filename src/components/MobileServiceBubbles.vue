<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';

type Service = {
  id: number;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  image?: string | null;
  soins?: any[];
};

const props = defineProps<{
  services: Service[];
  isAr: boolean;
}>();

const emit = defineEmits<{
  (e: 'navigate', view: string, serviceId?: number): void;
}>();

const selectedId = ref<number | null>(null);

const displayServices = computed(() => props.services.slice(0, 8));

const getServiceName = (s: Service) =>
  props.isAr && s.name_ar ? s.name_ar : s.name;

const getServiceDesc = (s: Service) =>
  props.isAr && s.description_ar ? s.description_ar : (s.description || '');

const getShortLabel = (s: Service) => {
  const name = getServiceName(s);
  const words = name.split(' ');
  if (words.length <= 2) return name;
  return (words[0]?.length ?? 0) > 2 ? words[0] : words.slice(0, 2).join(' ');
};

const thumbUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', '/upload/w_200,h_200,c_fill,g_auto,f_auto,q_auto/');
  }
  return url;
};

// Drag & Spin Logic
const rotation = ref(0);
let isDragging = false;
let startX = 0;
let startRotation = 0;
let velocity = 0;
let lastX = 0;
let lastTime = 0;
let rafId: number | null = null;
let hasDragged = false;

const onTouchStart = (e: TouchEvent | MouseEvent) => {
  if (rafId) cancelAnimationFrame(rafId);
  isDragging = true;
  hasDragged = false;
  const clientX = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
  startX = clientX;
  startRotation = rotation.value;
  lastX = clientX;
  lastTime = Date.now();
  velocity = 0;
};

const onTouchMove = (e: TouchEvent | MouseEvent) => {
  if (!isDragging) return;
  const clientX = 'touches' in e ? (e as TouchEvent).touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
  const dx = clientX - startX;
  
  if (Math.abs(dx) > 5) {
    hasDragged = true; // Mark as dragged to prevent accidental clicks
  }
  
  const now = Date.now();
  const dt = now - lastTime;
  if (dt > 0) {
    velocity = (clientX - lastX) / dt;
  }
  lastX = clientX;
  lastTime = now;
  
  // Turn like a machine gun (increase multiplier for faster spin)
  rotation.value = startRotation + (dx * 1.5); 
};

const onTouchEnd = () => {
  if (!isDragging) return;
  isDragging = false;
  
  const momentum = () => {
    if (Math.abs(velocity) > 0.01) {
      // Rotate by velocity, multiplied for machine-gun effect
      rotation.value += velocity * 25; 
      velocity *= 0.92; // Friction
      rafId = requestAnimationFrame(momentum);
    }
  };
  rafId = requestAnimationFrame(momentum);
};

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
});

const getBubbleStyle = (index: number, total: number) => {
  const angleStep = 360 / total;
  const angle = angleStep * index + rotation.value;
  // Radius is 36vw to fit the larger bubbles inside the container
  return {
    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-36vw) rotate(${-angle}deg)`
  };
};

const handleBubbleTap = (service: Service, e: Event) => {
  if (hasDragged) {
    e.preventDefault();
    return;
  }
  if (selectedId.value === service.id) {
    emit('navigate', 'service-soins', service.id);
  } else {
    selectedId.value = service.id;
  }
};

const handleCanvasClick = (e: MouseEvent) => {
  if (hasDragged) return;
  const target = e.target as HTMLElement;
  if (!target.closest('.sb-bubble') && !target.closest('.sb-info-panel')) {
    selectedId.value = null;
  }
};

const selectedService = computed(() =>
  displayServices.value.find(s => s.id === selectedId.value) || null
);
</script>

<template>
  <div class="sb-wrapper">
    <!-- Circular canvas with drag events -->
    <div class="sb-canvas"
         @mousedown="onTouchStart"
         @mousemove="onTouchMove"
         @mouseup="onTouchEnd"
         @mouseleave="onTouchEnd"
         @touchstart.passive="onTouchStart"
         @touchmove.passive="onTouchMove"
         @touchend="onTouchEnd"
         @click="handleCanvasClick">

      <!-- Center decorative element -->
      <div class="sb-dial-center"></div>

      <!-- Service bubbles -->
      <button
        v-for="(service, i) in displayServices"
        :key="service.id"
        class="sb-bubble"
        :class="{
          'sb-bubble--selected': selectedId === service.id,
          'sb-bubble--dimmed': selectedId !== null && selectedId !== service.id
        }"
        :style="getBubbleStyle(i, displayServices.length)"
        @click.stop="handleBubbleTap(service, $event)"
      >
        <div class="sb-img-wrap">
          <img
            v-if="service.image"
            :src="thumbUrl(service.image)"
            :alt="getServiceName(service)"
            class="sb-img"
            draggable="false"
            loading="lazy"
          />
          <div v-else class="sb-img-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="1.8"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 5h2v4h4v2h-4v4h-2v-4H7v-2h4V7z"/>
            </svg>
          </div>
        </div>
        <span class="sb-label">{{ getShortLabel(service) }}</span>
      </button>

      <!-- Info panel -->
      <Transition name="sb-panel">
        <div v-if="selectedService" class="sb-info-panel" @click.stop>
          <button class="sb-close" @click="selectedId = null" aria-label="Fermer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <div class="sb-panel-img">
            <img v-if="selectedService.image" :src="thumbUrl(selectedService.image)" :alt="getServiceName(selectedService)" />
          </div>
          <h3 class="sb-panel-name">{{ getServiceName(selectedService) }}</h3>
          <p class="sb-panel-desc">{{ getServiceDesc(selectedService) }}</p>
          <button class="sb-panel-cta" @click="emit('navigate', 'service-soins', selectedService.id)">
            Voir les soins
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.sb-wrapper {
  padding: 0;
  width: 100vw; /* fill all section */
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  background: transparent;
  padding-top: 40px; /* Room for the top bubble when it scales */
  overflow: hidden; /* Hides the info panel when it slides out */
}

/* ── Canvas ── */
.sb-canvas {
  position: relative;
  width: 100vw;
  height: 100vw; /* square layout matching width */
  max-height: 500px;
  margin: 0 auto;
  overflow: visible;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y; /* Allow vertical scroll but capture horizontal swipe for the wheel */
  cursor: grab;
}
.sb-canvas:active {
  cursor: grabbing;
}

/* Optional central dial to make it look like a wheel */
.sb-dial-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20vw;
  height: 20vw;
  border-radius: 50%;
  background: #e2e8f0;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05);
  pointer-events: none;
  opacity: 0.5;
}

/* ── Bubbles ── */
.sb-bubble {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  z-index: 2;
  padding: 0;
  border: none;
  background: transparent;
  font-family: 'Outfit', sans-serif;
  transition: opacity 0.3s ease;
  -webkit-tap-highlight-color: transparent;
}

/* Selected scaling handled inside the element so we don't conflict with positioning transform */
.sb-img-wrap {
  width: clamp(72px, 22vw, 96px); /* Bigger circles */
  height: clamp(72px, 22vw, 96px);
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: #e2e8f0;
  flex-shrink: 0;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none; /* Let the button handle clicks */
}

.sb-bubble:active .sb-img-wrap {
  transform: scale(0.92);
}

.sb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sb-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eff6ff;
  color: #2b69ad;
}

.sb-label {
  font-size: 0.75rem; /* slightly larger font */
  font-weight: 700;
  color: #334155;
  letter-spacing: 0.01em;
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  pointer-events: none;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(255,255,255,0.8);
  transition: color 0.3s, font-weight 0.3s;
}

/* ── Selected state ── */
.sb-bubble--selected {
  z-index: 10;
}
.sb-bubble--selected .sb-img-wrap {
  transform: scale(1.15);
  border-color: #2b69ad;
  box-shadow: 0 0 0 5px rgba(43, 105, 173, 0.2), 0 8px 24px rgba(43, 105, 173, 0.2);
}
.sb-bubble--selected:active .sb-img-wrap {
  transform: scale(1.08);
}
.sb-bubble--selected .sb-label {
  color: #1e40af;
  font-weight: 800;
}

/* ── Dimmed state ── */
.sb-bubble--dimmed {
  opacity: 0.35;
}
.sb-bubble--dimmed .sb-img-wrap {
  transform: scale(0.85);
}
.sb-bubble--dimmed:active .sb-img-wrap {
  transform: scale(0.8);
}

/* ── Info panel (compact bottom sheet inside canvas) ── */
.sb-info-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: #ffffff;
  border-radius: 28px 28px 0 0;
  padding: 20px 24px 28px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.sb-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
}
.sb-close:active { background: #e2e8f0; }

.sb-panel-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  background: #f1f5f9;
  flex-shrink: 0;
}
.sb-panel-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sb-panel-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.sb-panel-desc {
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
  max-width: 280px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sb-panel-cta {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 99px;
  border: none;
  background: #2b69ad;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  touch-action: manipulation;
}
.sb-panel-cta:active { background: #1e4f8a; }

/* ── Panel transition ── */
.sb-panel-enter-active { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease; }
.sb-panel-leave-active { transition: transform 0.3s ease, opacity 0.2s ease; }
.sb-panel-enter-from   { transform: translateY(100%); opacity: 0; }
.sb-panel-leave-to     { transform: translateY(100%); opacity: 0; }
</style>
