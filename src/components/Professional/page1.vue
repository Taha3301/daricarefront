```
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storage } from '../../utils/storage';
const localStorage = storage;
import { io, Socket } from 'socket.io-client';
import { getApiUrl, SOCKET_URL } from '../../config/api';
import SidebarProf from './SidebarProf.vue';
import AgendaComponent from './AgendaComponent.vue';
import AnalyticsDashboard from './AnalyticsDashboard.vue';

interface MedicalRequest {
  id: number;
  clientName: string;
  type: string;
  urgency: 'high' | 'medium' | 'low';
  time: string;
  distance: string;
  description: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  reference_id: number;
  created_at: string;
  bookingDetails?: any;
}

const props = defineProps({
  requests: {
    type: Array as () => MedicalRequest[],
    required: true
  }
});

const userName = ref(localStorage.getItem('user_name') || 'Professionnel');
const userEmail = ref('');
const userSpeciality = ref('');
const userUserProfile = ref<any>(null);
const notifications = ref<Notification[]>([]);
const socket = ref<Socket | null>(null);
const isConnected = ref(false);
const activeRequests = ref<any[]>([]); 
const isLoading = ref(false);
const isProMenuOpen = ref(false);
const isDetailsModalOpen = ref(false);
const selectedRequest = ref<any>(null);
const isFetchingDetails = ref(false);
const activeSubView = ref('requests'); // 'requests' or 'accepted'
const acceptedRequestsList = ref<any[]>([]);
const distances = ref<Record<number, number>>({});
const professionalId = ref<number | null>(null);
const patients = ref<any[]>([]);

// Pagination & Filtering State
const searchQueryPending = ref('');
const dateFilterPending = ref('');
const searchQueryAll = ref('');
const dateFilterAll = ref('');
const searchQueryHistory = ref('');
const dateFilterHistory = ref('');
const currentPage = ref(1);
const itemsPerPage = 4;
const professionalContent = ref<any>(null);
const isProfileModalOpen = ref(false);
const isPreviewModalOpen = ref(false);
const previewImageUrl = ref('');
const allDemandsFilter = ref('all'); // 'all', 'accepted', 'denied', 'pending'




const allDemands = computed(() => {
  const combined = [
    ...activeRequests.value.map(r => ({ ...r, displayStatus: 'pending' })),
    ...acceptedRequestsList.value.map(r => {
      const s = r.status?.toLowerCase();
      const as = r.assignmentStatus?.toLowerCase();
      const effectiveStatus = (s === 'done' || as === 'done') ? 'done' : (as || s);
      return { ...r, displayStatus: effectiveStatus?.toLowerCase() };
    })
  ];

  let filtered = combined;
  if (allDemandsFilter.value !== 'all') {
    filtered = filtered.filter(r => r.displayStatus === allDemandsFilter.value);
  }

  // Use the all_history specific filters
  if (searchQueryAll.value) {
    const query = searchQueryAll.value.toLowerCase();
    filtered = filtered.filter(req => {
      const matchService = req.service?.name?.toLowerCase().includes(query) ||
                          translateType(req.service?.name).toLowerCase().includes(query);
      return matchService || (req.patientFirstname + ' ' + req.patientLastname).toLowerCase().includes(query);
    });
  }

  if (dateFilterAll.value) {
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
      return reqDate === dateFilterAll.value;
    });
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const filteredPendingRequests = computed(() => {
  let filtered = [...activeRequests.value];

  // Search by soin name (service name or internal soins)
  if (searchQueryPending.value) {
    const query = searchQueryPending.value.toLowerCase();
    filtered = filtered.filter(req => {
      const matchService = req.service?.name?.toLowerCase().includes(query) ||
                          translateType(req.service?.name).toLowerCase().includes(query);
      
      const matchSoin = req.requestSoins?.some((rs: any) => 
        rs.soin?.name?.toLowerCase().includes(query)
      );
      
      return matchService || matchSoin;
    });
  }

  // Filter by date
  if (dateFilterPending.value) {
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
      return reqDate === dateFilterPending.value;
    });
  }

  // Always sort by newest first
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const filteredHistory = computed(() => {
  let filtered = acceptedRequestsList.value.filter(req => {
    const s = req.status?.toLowerCase();
    const as = req.assignmentStatus?.toLowerCase();
    return s !== 'done' && as !== 'done';
  });

  if (searchQueryHistory.value) {
    const query = searchQueryHistory.value.toLowerCase();
    filtered = filtered.filter(req => {
      const matchService = req.service?.name?.toLowerCase().includes(query) ||
                          translateType(req.service?.name).toLowerCase().includes(query);
      return matchService || (req.patientFirstname + ' ' + req.patientLastname).toLowerCase().includes(query);
    });
  }

  if (dateFilterHistory.value) {
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
      return reqDate === dateFilterHistory.value;
    });
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const filteredCompleted = computed(() => {
  let filtered = acceptedRequestsList.value.filter(req => {
    const s = req.status?.toLowerCase();
    const as = req.assignmentStatus?.toLowerCase();
    return s === 'done' || as === 'done';
  });

  if (searchQueryHistory.value) {
    const query = searchQueryHistory.value.toLowerCase();
    filtered = filtered.filter(req => {
      const matchService = req.service?.name?.toLowerCase().includes(query) ||
                          translateType(req.service?.name).toLowerCase().includes(query);
      return matchService || (req.patientFirstname + ' ' + req.patientLastname).toLowerCase().includes(query);
    });
  }

  if (dateFilterHistory.value) {
    filtered = filtered.filter(req => {
      const reqDate = new Date(req.createdAt).toISOString().split('T')[0];
      return reqDate === dateFilterHistory.value;
    });
  }

  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const fetchProfessionalContent = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl('/services/professional/my-content'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });
    if (response.ok) {
      professionalContent.value = await response.json();
      console.log('💊 Professional Content loaded:', professionalContent.value);
    }
  } catch (err) {
    console.error('Error fetching professional content:', err);
  }
};

const availableSoins = computed(() => professionalContent.value?.soins || []);

const getSoinDescription = (soinName: string) => {
  const soin = availableSoins.value.find((s: any) => s.name === soinName);
  return soin?.description || '';
};

// Removed currentRequestDocuments computed as selectedRequest.documents is used directly

const totalPages = computed(() => {
  return Math.ceil(filteredPendingRequests.value.length / itemsPerPage);
});

const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredPendingRequests.value.slice(start, start + itemsPerPage);
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const toggleProMenu = () => {
  isProMenuOpen.value = !isProMenuOpen.value;
};

const emit = defineEmits(['navigate']);

// Sound effect using Web Audio API
const playNotificationSound = () => {
  console.log('🔈 playNotificationSound called');
  // Mobile vibration
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
  
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume context if suspended (common in browsers)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
};

const triggerTestNotification = () => {
  const testNotif: Notification = {
    id: Date.now(),
    type: 'test',
    message: 'Ceci est une notification de test pour vérifier le son et la vibration.',
    reference_id: 0,
    created_at: new Date().toISOString()
  };
  
  playNotificationSound();
  notifications.value.unshift(testNotif);
  showBrowserNotification('Daricare Test', 'Le système de notification est opérationnel !');
  
  // Auto-remove test notif after 5s
  setTimeout(() => {
    removeNotification(testNotif.id);
  }, 5000);
};

const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPushNotifications();
    }
  }
};

/**
 * Helper to convert VAPID key for the browser
 */
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Subscribes the device to the System Push Service (Messenger-style background notifications)
 */
const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('System notifications are not supported on this device/browser');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if subscription already exists
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // ⚠️ IMPORTANT: YOU MUST REPLACE THIS WITH YOUR REAL VAPID PUBLIC KEY FROM BACKEND
      // Without a real key, background notifications will NOT work.
      const VAPID_PUBLIC_KEY = 'REPLACE_WITH_YOUR_BACKEND_VAPID_PUBLIC_KEY'; 
      
      console.log('Registering device for background notifications...');
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      } catch (subErr) {
        console.error('Push registration failed. Check your VAPID key.', subErr);
        return;
      }
    }

    console.log('Device successfully registered for background push:', subscription);

    // Send the unique Device ID (Subscription) to your backend
    const token = localStorage.getItem('access_token');
    if (token) {
      await fetch(getApiUrl('/notifications/subscribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
      console.log('Subscription saved on backend. Background notifications are now active.');
    }
  } catch (err) {
    console.error('Error in background notification setup:', err);
  }
};

const showBrowserNotification = (title: string, body: string) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return;
  }
  
  const options: any = {
    body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'new-booking',
    vibrate: [200, 100, 200],
    data: window.location.origin,
    actions: [
      { action: 'accept', title: '✅ Accepter', icon: '/favicon.png' },
      { action: 'decline', title: '❌ Refuser', icon: '/favicon.png' }
    ]
  };

  if (Notification.permission === 'granted') {
    // 1. Send message to Service Worker (Best for background/mobile persistence)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options
      });
    } else {
      // 2. Fallback to registration.showNotification if controller is busy
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showBrowserNotification(title, body);
      }
    });
  }
};

const fetchUserProfile = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl('/auth/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('👤 Professional Profile:', data);
      userUserProfile.value = data;
      userSpeciality.value = data.speciality;
      userEmail.value = data.email;
      professionalId.value = data.id;
      if (data.id) {
        localStorage.setItem('user_id', data.id.toString());
      }
      
      if (!userSpeciality.value) {
        console.warn('⚠️ No speciality found for this user. Speciality-based notifications will not work.');
      }

      initWebSocket();
    } else {
      console.error('❌ Failed to fetch profile:', response.status);
    }
  } catch (err) {
    console.error('❌ Error in fetchUserProfile:', err);
  }
};

const fetchBookingDetails = async (id: number) => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const response = await fetch(getApiUrl(`/bookings/${id}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error(`Error fetching booking ${id}:`, err);
  }
  return null;
};

const fetchDistance = async (requestId: number) => {
  const token = localStorage.getItem('access_token');
  const proId = professionalId.value || parseInt(localStorage.getItem('user_id') || '0');
  if (!token || !proId) return;

  try {
    const response = await fetch(getApiUrl(`/bookings/distance/${requestId}/${proId}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });
    if (response.ok) {
      const data = await response.json();
      distances.value[requestId] = data.distance;
    }
  } catch (err) {
    console.error(`Error fetching distance for request ${requestId}:`, err);
  }
};

const fetchInitialData = async () => {
  const token = localStorage.getItem('access_token');
  const proId = professionalId.value || parseInt(localStorage.getItem('user_id') || '0');
  if (!token || !userSpeciality.value) return;

  isLoading.value = true;
  try {
    // 1. Fetch specific assignments for this professional
    let myAssignments: any[] = [];
    if (proId) {
      const assignRes = await fetch(getApiUrl(`/bookings/professional/${proId}/assignments`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json'
        }
      });
      if (assignRes.ok) {
        myAssignments = await assignRes.json();
        console.log('📊 My Assignments:', myAssignments);
      }
    }

    // 2. Fetch all bookings to cross-reference
    const response = await fetch(getApiUrl('/bookings'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const allBookings: any[] = await response.json();
      console.log('📦 All Bookings fetched:', allBookings);
      
      // Pending requests: Global status 'pending' or 'en attente' AND no HANDLED interaction from this professional yet
      activeRequests.value = allBookings.filter(b => {
        const isGlobalPending = b.status === 'pending' || b.status === 'en attente';
        if (!isGlobalPending) return false;

        const isRightSpeciality = b.service && b.service.name === userSpeciality.value;
        if (!isRightSpeciality) return false;

        const myAssign = myAssignments.find(a => a.medicalRequestId === b.id);
        // If no assignment or if the person-specific assignment is still pending
        return !myAssign || (myAssign.status === 'pending' || myAssign.status === 'en attente');
      });
      
      // History: Handled assignments (accepted/denied/validated/etc)
      const historyItems: any[] = [];
      myAssignments.forEach(assign => {
        // Skip unhandled assignments
        const s = assign.status?.toLowerCase();
        if (s === 'pending' || s === 'en attente') return;

        const booking = allBookings.find(b => b.id === assign.medicalRequestId);
        if (booking) {
          historyItems.push({
            ...booking,
            assignmentStatus: assign.status 
          });
        }
      });
      acceptedRequestsList.value = historyItems.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(`✅ Filtered ${activeRequests.value.length} pending and ${acceptedRequestsList.value.length} history items.`);
      
      // Fetch distances
      activeRequests.value.forEach(req => fetchDistance(req.id));
      acceptedRequestsList.value.forEach(req => fetchDistance(req.id));
    }
  } catch (err) {
    console.error('Failed to fetch initial data:', err);
  } finally {
    isLoading.value = false;
  }
};

const initWebSocket = () => {
  if (!userSpeciality.value) {
    console.error('❌ Cannot init WebSocket: userSpeciality is empty');
    return;
  }

  console.log('🔌 Initializing WebSocket for:', userSpeciality.value);
  // use the standardized SOCKET_URL
  socket.value = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.value.on('connect', () => {
    console.log('✅ WebSocket Connected');
    isConnected.value = true;
    socket.value?.emit('joinSpeciality', userSpeciality.value);
  });

  socket.value.on('connect_error', (err) => {
    console.error('❌ WebSocket Connection Error:', err);
    isConnected.value = false;
  });

  socket.value.on('disconnect', () => {
    console.log('🔌 WebSocket Disconnected');
    isConnected.value = false;
  });

  socket.value.on('newBookingRequest', async (notification: Notification) => {
    console.log('🔔 RECEIVED newBookingRequest:', notification);
    
    // Ensure unique ID for Vue reactivity
    if (!notification.id) notification.id = Date.now();
    playNotificationSound();
    notifications.value.unshift(notification);
    
    // 2. Fetch full details in background
    const details = await fetchBookingDetails(notification.reference_id);
    if (details) {
      // Find the notification in the list and update its details
      const targetNotif = notifications.value.find(n => n.reference_id === notification.reference_id);
      if (targetNotif) {
        targetNotif.bookingDetails = details;
      }
      
      // 3. Show RICH Browser Notification once we have details
      const formattedDate = details.date ? formatDate(details.date) : formatDate(details.createdAt);
      const title = `📅 ${formattedDate} - ${details.patientFirstname} ${details.patientLastname}`;
      const body = `🩺 Soin: ${translateType(details.service?.name)}\n📍 ${details.address}\n⚠️ Urgence: ${details.urgency}`;
      showBrowserNotification(title, body);

      // Update the main requests list if not already there
      if (!activeRequests.value.find(r => r.id === details.id)) {
        activeRequests.value.unshift(details);
      }
      await fetchDistance(details.id);
    } else {
      // Fallback to simple notification if details fail to fetch
      showBrowserNotification('Nouvelle demande de soin', notification.message);
    }
  });

  socket.value.on('joined', (room) => {
    console.log(`🚀 Joined room: ${room}`);
  });
};

const fetchPatients = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  isLoading.value = true;
  try {
    const response = await fetch(getApiUrl('/patients'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });

    if (response.ok) {
      patients.value = await response.json();
      console.log('👥 Patients loaded:', patients.value);
    }
  } catch (err) {
    console.error('Error fetching patients:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([
    fetchUserProfile(),
    fetchProfessionalContent()
  ]);
  // Fetch data after profile and content are loaded
  await fetchInitialData();
  isLoading.value = false;
  requestNotificationPermission();
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});

const handleLogout = () => {
  storage.clear();
  emit('navigate', 'landing');
};

const translateType = (type: string) => {
  const translations: Record<string, string> = {
    'Post-partum help': 'Soin post-partum',
    'Wound Dressing': 'Pansement',
    'Medication Admin': 'Admin. médicaments',
    'nursing': 'Soins infirmiers',
    'post-partum': 'Soin post-partum',
    'wound': 'Pansement',
    'medication': 'Admin. médicaments',
    'kine': 'Kinésithérapie'
  };
  return translations[type] || type;
};

const acceptRequest = async (id: number) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/bookings/${id}/accept`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      activeRequests.value = activeRequests.value.filter(n => n.id !== id);
      notifications.value = notifications.value.filter(n => n.reference_id !== id);
      await fetchInitialData();
      alert('Demande acceptée avec succès !');
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message || 'Impossible d\'accepter la demande'}`);
    }
  } catch (err) {
    console.error('Error accepting request:', err);
  }
};

const declineRequest = async (id: number) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/bookings/${id}/deny`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      activeRequests.value = activeRequests.value.filter(n => n.id !== id);
      notifications.value = notifications.value.filter(n => n.reference_id !== id);
      await fetchInitialData();
      alert('Demande refusée.');
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message || 'Impossible de refuser la demande'}`);
    }
  } catch (err) {
    console.error('Error declining request:', err);
  }
};

const completeRequest = async (id: number) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  if (!confirm('Voulez-vous marquer cette demande comme terminée ?')) return;

  try {
    const response = await fetch(getApiUrl(`/bookings/${id}/complete`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      await fetchInitialData();
      alert('Demande marquée comme terminée !');
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message || 'Impossible de terminer la demande'}`);
    }
  } catch (err) {
    console.error('Error completing request:', err);
  }
};

const showRequestDetails = async (req: any) => {
  selectedRequest.value = { ...req }; // Initial data
  isDetailsModalOpen.value = true;
  isFetchingDetails.value = true;

  try {
    const fullDetails = await fetchBookingDetails(req.id);
    if (fullDetails) {
      selectedRequest.value = fullDetails;
    }
  } catch (err) {
    console.error('Failed to fetch full booking details:', err);
  } finally {
    isFetchingDetails.value = false;
  }
};

const openPreview = (url: string) => {
  previewImageUrl.value = url;
  isPreviewModalOpen.value = true;
};

const closePreview = () => {
  isPreviewModalOpen.value = false;
  previewImageUrl.value = '';
};

const downloadFile = (url: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || url.split('/').pop() || 'document';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const removeNotification = (id: number) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="dashboard-container">
    <!-- Mobile Top Bar -->
    <header class="mobile-top-bar">
      <div class="logo-compact">
        <img src="../../assets/LOGO H.png" alt="daricare logo" class="mobile-logo-img" />
      </div>
      <div class="mobile-actions">
        <div class="mobile-status">
          <div class="status-indicator" :class="isConnected ? 'online' : 'offline'"></div>
        </div>
        <button class="pro-hamburger" @click="toggleProMenu" :class="{ 'is-active': isProMenuOpen }">
          <span class="pro-bar"></span>
          <span class="pro-bar"></span>
          <span class="pro-bar"></span>
        </button>
      </div>
    </header>

    <!-- Overlay for mobile menu -->
    <div class="pro-menu-overlay" v-if="isProMenuOpen" @click="toggleProMenu"></div>

    <!-- Notifications Toast Area -->
    <div class="notifications-container">
      <div v-for="notif in notifications" :key="notif.id" class="notif-toast">
        <div class="notif-content">
          <div class="notif-icon pulsate">🔔</div>
          <div class="notif-text">
            <div class="notif-header">
              <h4 v-if="!notif.bookingDetails">Nouvelle Demande</h4>
              <h4 v-else>{{ formatDate(notif.bookingDetails.date || notif.bookingDetails.createdAt) }} - {{ notif.bookingDetails.patientFirstname }} {{ notif.bookingDetails.patientLastname }}</h4>
              <span v-if="notif.bookingDetails" class="urgency-dot" :class="notif.bookingDetails.urgency"></span>
            </div>
            <p v-if="notif.bookingDetails">
              <strong>{{ notif.bookingDetails.patientFirstname }} {{ notif.bookingDetails.patientLastname }}</strong>
              <br/>
              {{ notif.bookingDetails.address }}
              <br/>
              <span v-if="notif.bookingDetails.service" class="type-tag">{{ translateType(notif.bookingDetails.service.name) }}</span>
            </p>
            <p v-else class="loading-data">{{ notif.message }}...</p>
          </div>
          <button class="notif-close" @click="removeNotification(notif.id)">×</button>
        </div>
        <div class="notif-actions">
          <button class="btn-mini btn-decline" @click="declineRequest(notif.reference_id)">Refuser</button>
          <button class="btn-mini btn-accept" @click="acceptRequest(notif.reference_id)">Accepter</button>
        </div>
      </div>
    </div>

    <SidebarProf 
      :isOpen="isProMenuOpen"
      :isConnected="isConnected"
      :userName="userName"
      :userEmail="userEmail"
      :userSpeciality="userSpeciality"
      :activeRequestsCount="activeRequests.length"
      :activeView="activeSubView"
      @logout="handleLogout"
      @navigate="(page) => { 
        activeSubView = page; 
        isProMenuOpen = false; 
        if (page === 'patients') fetchPatients();
      }"
      @view-profile="isProfileModalOpen = true"
      @toggle="toggleProMenu"
    />

    <!-- Main Content -->
    <main class="main-content">
      <header class="content-header">
        <div class="header-titles">
          <h1 v-if="activeSubView === 'requests'">Demandes en attente</h1>
          <h1 v-else-if="activeSubView === 'all_history'">Toutes les demandes</h1>
          <h1 v-else-if="activeSubView === 'accepted'">Demandes Acceptées</h1>
          <h1 v-else-if="activeSubView === 'completed'">Demandes Complétées</h1>
          <h1 v-else-if="activeSubView === 'calendar'">Agenda Professionnel</h1>
          <h1 v-else>{{ activeSubView.charAt(0).toUpperCase() + activeSubView.slice(1) }}</h1>
          <p>
            Notifications en temps réel des patients dans votre zone.
            <span v-if="activeSubView === 'requests'">Nouveaux soins disponibles pour votre spécialité.</span>
            <span v-if="activeSubView === 'all_history'">Visualisez l'état de toutes les sollicitations (Acceptés, Refusés, Attente).</span>
            <span v-if="activeSubView === 'accepted'">Retrouvez ici vos demandes acceptées en attente d'intervention.</span>
            <span v-if="activeSubView === 'completed'">Visualisez ici toutes les demandes que vous avez terminées.</span>
            <span v-if="activeSubView === 'calendar'">Gérez vos rendez-vous et visualisez votre planning mensuel.</span>
            <span v-if="!isConnected" class="offline-warning">⚠️ Déconnecté</span>
          </p>
        </div>
        <div class="header-actions">
          <button class="btn-test-notif" @click="triggerTestNotification" title="Tester les notifications">
            Test
          </button>
          <button class="btn-refresh" @click="fetchInitialData" :disabled="isLoading">
            {{ isLoading ? 'Chargement...' : 'Actualiser le flux' }}
          </button>
        </div>
      </header>

      <!-- Filter Section -->
      <section class="filter-section">
        <div class="filter-bar">
          <div v-if="activeSubView !== 'all_history'" class="search-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              v-if="activeSubView === 'requests'"
              type="text" 
              v-model="searchQueryPending" 
              list="care-suggestions"
              placeholder="Rechercher dans En attente..."
              @input="currentPage = 1"
            />
            <input 
              v-else
              type="text" 
              v-model="searchQueryHistory" 
              list="care-suggestions"
              :placeholder="activeSubView === 'completed' ? 'Rechercher dans Complétées...' : 'Rechercher dans Acceptés...'"
            />
            <datalist id="care-suggestions">
              <option v-for="soin in availableSoins" :key="soin.id" :value="soin.name" />
            </datalist>
          </div>
          <div v-if="activeSubView !== 'all_history'" class="filter-group">
            <label>Filtrer par date:</label>
            <input 
              v-if="activeSubView === 'requests'"
              type="date" 
              v-model="dateFilterPending" 
              class="date-picker-filter"
              @change="currentPage = 1"
            />
            <input 
              v-else
              type="date" 
              v-model="dateFilterHistory" 
              class="date-picker-filter"
            />
          </div>
          
          <div v-if="activeSubView === 'all_history'" class="status-filters">
            <button 
              class="status-tab" 
              :class="{ active: allDemandsFilter === 'all' }"
              @click="allDemandsFilter = 'all'"
            >Tout</button>
            <button 
              class="status-tab pending" 
              :class="{ active: allDemandsFilter === 'pending' }"
              @click="allDemandsFilter = 'pending'"
            >En attente</button>
            <button 
              class="status-tab accepted" 
              :class="{ active: allDemandsFilter === 'accepted' }"
              @click="allDemandsFilter = 'accepted'"
            >Acceptés</button>
            <button 
              class="status-tab denied" 
              :class="{ active: allDemandsFilter === 'denied' }"
              @click="allDemandsFilter = 'denied'"
            >Refusés</button>
          </div>
        </div>
      </section>

      <!-- Pending Requests View -->
      <template v-if="activeSubView === 'requests'">
        <div class="requests-grid">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Récupération des soins disponibles...</p>
          </div>
          <div v-else-if="filteredPendingRequests.length === 0" class="empty-state">
            <div class="empty-icon"></div>
            <h3>Aucun résultat</h3>
            <p>Aucune demande ne correspond à vos filtres.</p>
          </div>
          <div 
            v-for="req in paginatedRequests" 
            :key="req.id" 
            class="request-card"
            :class="`urgency-${req.urgency || 'low'}`"
          >
            <div class="card-header">
              <div class="header-top">
                <div class="patient-info">
                  <div class="avatar">{{ req.patientFirstname?.charAt(0) || 'P' }}</div>
                  <div>
                    <h3>{{ req.patientFirstname }} {{ req.patientLastname }}</h3>
                  </div>
                </div>
                <div class="header-right">
                  <div v-if="req.totalPrice" class="card-price-badge">
                    {{ req.totalPrice }} DT
                  </div>
                  <div class="urgency-badge">
                    {{ req.urgency === 'high' ? 'Urgent' : req.urgency === 'medium' ? 'Moyen' : 'Faible' }}
                  </div>
                </div>
              </div>
              <span class="timestamp">{{ formatDate(req.createdAt) }} • 📍 {{ req.address }}</span>
              <div v-if="distances[req.id] !== undefined" class="card-distance-badge">
                <span class="dist-icon">📏</span>
                <span class="dist-val">{{ distances[req.id] }} km</span>
                <span class="dist-label">de vous</span>
              </div>
            </div>
            
            <div class="card-body">
              <div class="request-type">
                {{ translateType(req.service?.name) }}
              </div>
              <p class="request-description">Demande de soin pour le service {{ req.service?.name }}.</p>
              <div v-if="req.requestSoins?.length" class="soins-tags">
                <span v-for="soinItem in req.requestSoins" :key="soinItem.id" class="soin-tag">
                  {{ soinItem.soin?.name }}
                </span>
              </div>
            </div>
  
            <div class="card-actions">
              <button class="btn btn-details" @click="showRequestDetails(req)">Détails</button>
              <button class="btn btn-decline" @click="declineRequest(req.id)">Refuser</button>
              <button class="btn btn-accept" @click="acceptRequest(req.id)">Accepter la demande</button>
            </div>
          </div>
        </div>
  
        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pagination-controls">
          <button 
            :disabled="currentPage === 1" 
            @click="handlePageChange(currentPage - 1)"
            class="btn-pagination"
          >
            Précédent
          </button>
          
          <div class="page-numbers">
            <span 
              v-for="page in totalPages" 
              :key="page"
              :class="{ active: currentPage === page }"
              @click="handlePageChange(page)"
            >
              {{ page }}
            </span>
          </div>
  
          <button 
            :disabled="currentPage === totalPages" 
            @click="handlePageChange(currentPage + 1)"
            class="btn-pagination"
          >
            Suivant
          </button>
        </div>
      </template>

      <!-- All Demands View -->
      <template v-else-if="activeSubView === 'all_history'">
        <div class="requests-grid">
          <div v-if="allDemands.length === 0" class="empty-state">
            <div class="empty-icon">📂</div>
            <h3>Aucune demande trouvée</h3>
            <p>Essayez de modifier vos filtres ou le statut sélectionné.</p>
          </div>
          
          <div 
            v-for="req in allDemands" 
            :key="req.id" 
            class="request-card"
            :class="req.displayStatus"
          >
            <div class="card-header">
              <div class="header-top">
                <div class="patient-info">
                  <div class="avatar">{{ req.patientFirstname?.charAt(0) || 'P' }}</div>
                  <div>
                    <h3>{{ req.patientFirstname }} {{ req.patientLastname }}</h3>
                  </div>
                </div>
                <div class="header-right">
                  <div v-if="req.totalPrice" class="card-price-badge">
                    {{ req.totalPrice }} DT
                  </div>
                  <div class="status-pill" :class="req.displayStatus">
                    {{ req.displayStatus === 'pending' ? 'En attente' : 
                       (req.displayStatus === 'accepted' || req.displayStatus === 'done') ? 'Accepté' : 
                       req.displayStatus === 'validated' ? 'Validé' : 'Refusé' }}
                  </div>
                </div>
              </div>
              <span class="timestamp">{{ formatDate(req.createdAt) }} • 📍 {{ req.address }}</span>
              <div v-if="distances[req.id] !== undefined" class="card-distance-badge">
                <span class="dist-icon">📏</span>
                <span class="dist-val">{{ distances[req.id] }} km</span>
                <span class="dist-label">de vous</span>
              </div>
            </div>
            
            <div class="card-body">
              <div class="request-type">
                {{ translateType(req.service?.name) }}
              </div>
              <p class="request-description">Demande de soin pour le service {{ req.service?.name }}.</p>
              <div v-if="req.requestSoins?.length" class="soins-tags">
                <span v-for="soinItem in req.requestSoins" :key="soinItem.id" class="soin-tag">
                  {{ soinItem.soin?.name }}
                </span>
              </div>
            </div>
  
            <div class="card-actions">
              <button class="btn btn-details" @click="showRequestDetails(req)">Détails</button>
              <template v-if="req.displayStatus === 'pending'">
                <button class="btn btn-decline" @click="declineRequest(req.id)">Refuser</button>
                <button class="btn btn-accept" @click="acceptRequest(req.id)">Accepter</button>
              </template>
              <a v-if="req.displayStatus === 'accepted' && req.phone" :href="'tel:' + req.phone" class="btn btn-contact">Appeler</a>
            </div>
          </div>
        </div>
      </template>

      <!-- Accepted Services View -->
      <template v-else-if="activeSubView === 'accepted'">
        <div class="requests-grid">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement de vos engagements...</p>
          </div>
          <div v-else-if="filteredHistory.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>Aucun historique trouvé</h3>
            <p>Vous n'avez pas encore d'historique de demandes traitées.</p>
          </div>
          <div 
            v-for="req in filteredHistory" 
            :key="req.id" 
            class="request-card"
            :class="`status-${req.status}`"
          >
            <div class="card-header">
              <div class="header-top">
                <div class="patient-info">
                  <div class="avatar">{{ req.patientFirstname?.charAt(0) || 'P' }}</div>
                  <div>
                    <h3>{{ req.patientFirstname }} {{ req.patientLastname }}</h3>
                  </div>
                </div>
                <div class="header-right">
                  <div v-if="req.totalPrice" class="card-price-badge">
                    {{ req.totalPrice }} DT
                  </div>
                  <div class="status-pill" :class="req.status">
                    {{ req.status === 'accepted' ? 'Accepté' : req.status === 'validated' ? 'Validé' : 'Refusé' }}
                  </div>
                </div>
              </div>
              <span class="timestamp">{{ formatDate(req.createdAt) }} • 📍 {{ req.address }}</span>
              <div v-if="distances[req.id] !== undefined" class="card-distance-badge">
                <span class="dist-icon">📏</span>
                <span class="dist-val">{{ distances[req.id] }} km</span>
                <span class="dist-label">de vous</span>
              </div>
            </div>
            
            <div class="card-body">
              <div class="request-type">
                {{ translateType(req.service?.name) }}
              </div>
              <p class="request-description">Soin programmé pour {{ req.patientFirstname }}.</p>
              <div v-if="req.requestSoins?.length" class="soins-tags">
                <span v-for="soinItem in req.requestSoins" :key="soinItem.id" class="soin-tag">
                  {{ soinItem.soin?.name }}
                </span>
              </div>
            </div>

            <div class="card-actions accepted-actions">
              <button class="btn btn-details" @click="showRequestDetails(req)">Dossier</button>
              <div class="utility-actions">
                <a :href="'tel:' + req.phone" class="btn btn-util" v-if="req.phone" title="Appeler">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </a>
                <a v-if="req.latitude && req.longitude" 
                   :href="`https://www.google.com/maps?q=${req.latitude},${req.longitude}`" 
                   target="_blank" 
                   class="btn btn-util"
                   title="Voir sur la carte"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </a>
              </div>
              <button v-if="req.assignmentStatus === 'accepted'" class="btn btn-accept" @click="completeRequest(req.id)">Terminer</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Completed Services View -->
      <template v-else-if="activeSubView === 'completed'">
        <div class="requests-grid">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des demandes complétées...</p>
          </div>
          <div v-else-if="filteredCompleted.length === 0" class="empty-state">
            <div class="empty-icon">✅</div>
            <h3>Aucune demande complétée</h3>
            <p>Vous n'avez pas encore de demandes marquées comme terminées.</p>
          </div>
          <div 
            v-for="req in filteredCompleted" 
            :key="req.id" 
            class="request-card status-done"
          >
            <div class="card-header">
              <div class="header-top">
                <div class="patient-info">
                  <div class="avatar">{{ req.patientFirstname?.charAt(0) || 'P' }}</div>
                  <div>
                    <h3>{{ req.patientFirstname }} {{ req.patientLastname }}</h3>
                  </div>
                </div>
                <div class="header-right">
                  <div v-if="req.totalPrice" class="card-price-badge">
                    {{ req.totalPrice }} DT
                  </div>
                  <div class="status-pill done">Terminée</div>
                </div>
              </div>
              <span class="timestamp">{{ formatDate(req.createdAt) }} • 📍 {{ req.address }}</span>
              <div v-if="distances[req.id] !== undefined" class="card-distance-badge">
                <span class="dist-icon">📏</span>
                <span class="dist-val">{{ distances[req.id] }} km</span>
                <span class="dist-label">de vous</span>
              </div>
            </div>
            
            <div class="card-body">
              <div class="request-type">
                {{ translateType(req.service?.name) }}
              </div>
              <p class="request-description">Soin terminé avec succès.</p>
              <div v-if="req.requestSoins?.length" class="soins-tags">
                <span v-for="soinItem in req.requestSoins" :key="soinItem.id" class="soin-tag">
                  {{ soinItem.soin?.name }}
                </span>
              </div>
            </div>

            <div class="card-actions">
              <button class="btn btn-details" @click="showRequestDetails(req)">Détails</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Calendar View -->
      <template v-else-if="activeSubView === 'calendar'">
        <AgendaComponent 
          :activeRequests="activeRequests"
          :acceptedRequestsList="acceptedRequestsList"
          @show-details="showRequestDetails"
        />
      </template>

      <!-- Patients View -->
      <template v-else-if="activeSubView === 'patients'">
        <div class="requests-grid">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des patients...</p>
          </div>
          <div v-else-if="patients.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Aucun patient</h3>
            <p>Vous n'avez pas encore de patients enregistrés.</p>
          </div>
          <div 
            v-for="patient in patients" 
            :key="patient.id" 
            class="request-card patient-card"
          >
            <div class="card-header">
              <div class="patient-info">
                <div class="avatar">{{ patient.firstname?.charAt(0) || 'P' }}</div>
                <div>
                  <h3 class="patient-name">{{ patient.civility }} {{ patient.firstname }} {{ patient.lastname }}</h3>
                  <span class="timestamp">Membre depuis {{ formatDate(patient.createdAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="card-body">
              <div class="patient-detail-row">
                <div class="detail-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div class="detail-content">
                  <label>Téléphone</label>
                  <span>{{ patient.phone }}</span>
                </div>
              </div>

              <div v-if="patient.email" class="patient-detail-row">
                <div class="detail-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  </svg>
                </div>
                <div class="detail-content">
                  <label>Email</label>
                  <span>{{ patient.email }}</span>
                </div>
              </div>

              <div class="patient-detail-row">
                <div class="detail-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                </div>
                <div class="detail-content">
                  <label>Date de naissance</label>
                  <span>{{ formatDate(patient.birthdate) }}</span>
                </div>
              </div>
            </div>

            <div class="card-actions mt-auto">
              <a v-if="patient.phone" :href="'tel:' + patient.phone" class="btn btn-accept">
                Contacter le patient
              </a>
            </div>
          </div>
        </div>
      </template>

      <!-- Analytics View -->
      <template v-else-if="activeSubView === 'analytics'">
        <AnalyticsDashboard />
      </template>

      <!-- Fallback for other sections -->
      <template v-else>
        <div class="empty-state">
          <div class="empty-icon">🚧</div>
          <h3>En construction</h3>
          <p>La section <strong>{{ activeSubView }}</strong> sera bientôt disponible.</p>
          <button class="btn btn-refresh" @click="activeSubView = 'requests'">Retour aux demandes</button>
        </div>
      </template>

      <!-- Details Modal -->
      <Teleport to="body">
        <div v-if="isDetailsModalOpen" class="modal-overlay" @click.self="isDetailsModalOpen = false">
          <div class="modal-content">
            <header class="modal-header">
              <h2>Détails de la demande</h2>
              <button class="close-modal" @click="isDetailsModalOpen = false">&times;</button>
            </header>

            <div v-if="isFetchingDetails" class="modal-loading">
              <div class="spinner"></div>
              <p>Chargement des détails...</p>
            </div>
            
            <div v-else-if="selectedRequest" class="modal-body">
              <section class="details-section">
                <div class="patient-profile">
                  <div class="modal-avatar">{{ selectedRequest.patientFirstname?.charAt(0) }}</div>
                  <div class="patient-main">
                    <h3>{{ selectedRequest.patientCivility }} {{ selectedRequest.patientFirstname }} {{ selectedRequest.patientLastname }}</h3>
                    <p class="patient-meta">Né(e) le: {{ formatDate(selectedRequest.patientBirthdate) || 'Non renseigné' }}</p>
                  </div>
                  <div class="status-indicators">
                    <div class="status-pill-mini" :class="selectedRequest.status">
                      {{ selectedRequest.status === 'pending' ? 'En attente' : selectedRequest.status }}
                    </div>
                    <div class="urgency-badge" :class="selectedRequest.urgency">
                      {{ selectedRequest.urgency === 'high' ? 'Urgent' : selectedRequest.urgency === 'medium' ? 'Moyen' : 'Faible' }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="booking-schedule-section">
                <div class="section-title">📅 Planification & Disponibilité</div>
                <div class="details-grid">
                  <div class="detail-item">
                    <label>Date de début</label>
                    <span class="highlight-val">{{ formatDate(selectedRequest.startDate) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Durée de l'intervention</label>
                    <span>{{ selectedRequest.durationValue }} jour(s) ({{ selectedRequest.durationMode === 'fixed' ? 'Fixe' : 'Récurrent' }})</span>
                  </div>
                  <div class="detail-item">
                    <label>Fenêtre de disponibilité</label>
                    <span class="highlight-val">{{ selectedRequest.availabilityStart?.substring(0, 5) }} — {{ selectedRequest.availabilityEnd?.substring(0, 5) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Préférence "Indifférent"</label>
                    <span :class="selectedRequest.isIndifferent ? 'text-success' : 'text-muted'">
                      {{ selectedRequest.isIndifferent ? '✅ Oui (Peut intervenir à tout moment)' : '❌ Non (Respecter les horaires)' }}
                    </span>
                  </div>
                  <div class="detail-item price-item">
                    <label>Montant Total</label>
                    <span class="price-tag-large">{{ selectedRequest.totalPrice || 0 }} DT</span>
                  </div>
                </div>
              </section>

              <div v-if="professionalContent?.description" class="service-description-box">
                <label>À propos du service {{ professionalContent.name }}</label>
                <p>{{ professionalContent.description }}</p>
              </div>

              <div class="details-grid">
                <div class="detail-item">
                  <label>Service</label>
                  <span>{{ translateType(selectedRequest.service?.name) }}</span>
                </div>
                <div class="detail-item">
                  <label>Date de la demande</label>
                  <span>{{ formatDate(selectedRequest.createdAt) }}</span>
                </div>
                <div class="detail-item full-width">
                  <label>📍 Adresse de l'intervention</label>
                  <div class="address-with-map">
                    <span>{{ selectedRequest.address }}</span>
                    <a v-if="selectedRequest.latitude && selectedRequest.longitude" 
                       :href="`https://www.google.com/maps?q=${selectedRequest.latitude},${selectedRequest.longitude}`" 
                       target="_blank" 
                       class="map-link-inline"
                    >
                       Voir sur Google Maps ↗
                    </a>
                  </div>
                  <p v-if="distances[selectedRequest.id]" class="distance-info-modal">
                    <small>📏 Distance: <strong>{{ distances[selectedRequest.id] }} km</strong></small>
                  </p>
                  <p v-if="selectedRequest.addressComplement" class="address-complement">
                    <small>Complément: {{ selectedRequest.addressComplement }}</small>
                  </p>
                </div>
                <div v-if="selectedRequest.patientPhone" class="detail-item">
                  <label>📞 Téléphone</label>
                  <span>{{ selectedRequest.patientPhone }}</span>
                </div>
                <div v-if="selectedRequest.patientEmail" class="detail-item">
                  <label>📧 Email</label>
                  <span>{{ selectedRequest.patientEmail }}</span>
                </div>
                <div class="detail-item">
                  <label>📜 Statut Ordonnance</label>
                  <span class="prescription-status" :class="selectedRequest.prescriptionStatus">
                    {{ selectedRequest.prescriptionStatus === 'available' ? 'Disponible' : selectedRequest.prescriptionStatus }}
                  </span>
                </div>
              </div>

              <section v-if="selectedRequest.requestSoins?.length" class="soins-details">
                <div class="section-title">🩺 Soins spécifiques demandés</div>
                <div class="soins-list">
                  <div v-for="rs in selectedRequest.requestSoins" :key="rs.id" class="soin-detail-card">
                    <div class="soin-header">
                      <div class="soin-title-row">
                        <strong>{{ rs.soin?.name }}</strong>
                        <span class="frequency-badge">
                          {{ rs.visitType === 'once' ? 'Une seule fois' : 'Récurrent' }} 
                          <template v-if="rs.visitType === 'recurring'">
                            — {{ rs.frequencyCount }} fois / {{ rs.frequencyPeriod }}
                          </template>
                        </span>
                      </div>
                      <p v-if="getSoinDescription(rs.soin?.name)" class="soin-catalog-desc">
                        {{ getSoinDescription(rs.soin?.name) }}
                      </p>
                    </div>
                    
                    <!-- Answers -->
                    <div v-if="rs.questionAnswers && rs.questionAnswers.length" class="soin-config mt-2">
                      <label class="config-label">Réponses au questionnaire :</label>
                      <div class="answers-grid">
                        <div v-for="(qa, index) in rs.questionAnswers" :key="index" class="answer-item">
                          <span class="answer-key">{{ qa.question }} :</span>
                          <span class="answer-val">{{ Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Clinical Documents (Prescriptions, etc) -->
              <section v-if="selectedRequest.documents?.length" class="clinical-docs">
                <div class="section-title">📄 Documents cliniques</div>
                <div class="docs-grid-mini">
                  <div v-for="doc in selectedRequest.documents" :key="doc.id" class="doc-link-card">
                    <div class="doc-main-click" @click="openPreview(`/${doc.filePath}`)">
                      <div class="doc-icon">📁</div>
                      <div class="doc-meta">
                        <span class="doc-name">{{ doc.fileOriginalName || 'Document' }}</span>
                        <span class="doc-secondary">{{ doc.mimeType }}</span>
                      </div>
                    </div>
                    <div class="doc-actions-mini">
                      <button class="btn-icon-mini" @click="openPreview(`/${doc.filePath}`)" title="Voir">👁️</button>
                      <button class="btn-icon-mini" @click="downloadFile(`/${doc.filePath}`, doc.fileOriginalName)" title="Télécharger">↓</button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <footer v-if="selectedRequest.status === 'pending'" class="modal-footer">
              <button class="btn btn-decline" @click="declineRequest(selectedRequest.id); isDetailsModalOpen = false">Refuser</button>
              <button class="btn btn-accept" @click="acceptRequest(selectedRequest.id); isDetailsModalOpen = false">Accepter la demande</button>
            </footer>
          </div>
        </div>
      </Teleport>

      <!-- Profile Modal -->
      <Teleport to="body">
        <div v-if="isProfileModalOpen" class="modal-overlay" @click.self="isProfileModalOpen = false">
          <div class="modal-content profile-modal">
            <header class="modal-header">
              <h2>Mon Profil Professionnel</h2>
              <button class="close-modal" @click="isProfileModalOpen = false">&times;</button>
            </header>
            
            <div class="modal-body">
              <section class="profile-header-section">
                <div class="profile-avatar-large">{{ userName.charAt(0) }}</div>
                <div class="profile-main-info">
                  <h3>{{ userName }}</h3>
                  <p class="speciality-text">{{ userSpeciality }}</p>
                  <span class="status-pill" :class="userUserProfile?.status?.toLowerCase()">
                    {{ userUserProfile?.status || 'VÉRIFICATION EN COURS' }}
                  </span>
                </div>
              </section>

              <div class="profile-details-grid">
                <div class="detail-item">
                  <label>Email</label>
                  <span>{{ userEmail }}</span>
                </div>
                <div class="detail-item">
                  <label>Téléphone Professionnel</label>
                  <span>{{ userUserProfile?.professionalPhone || 'Non renseigné' }}</span>
                </div>
                <div class="detail-item full-width">
                  <label>Adresse Professionnelle</label>
                  <span>{{ userUserProfile?.professionalAddress || 'Non renseigné' }}</span>
                </div>
              </div>

              <section class="documents-section">
                <h4>Documents de vérification</h4>
                <div class="documents-list">
                  <div v-for="doc in userUserProfile?.documents" :key="doc.id" class="document-card clickable">
                    <div class="doc-main-click" @click="openPreview(`/${doc.filePath}`)">
                      <div class="doc-icon">📄</div>
                      <div class="doc-info">
                        <span class="doc-type">{{ doc.type }}</span>
                        <span class="doc-desc">{{ doc.description }}</span>
                      </div>
                    </div>
                    <div class="doc-status-and-actions">
                      <div class="doc-status" :class="{ verified: doc.verified }">
                        {{ doc.verified ? 'Vérifié' : 'En attente' }}
                      </div>
                      <button class="btn-icon-mini" @click="downloadFile(`/${doc.filePath}`)" title="Télécharger">↓</button>
                    </div>
                  </div>
                  <div v-if="!userUserProfile?.documents?.length" class="no-documents">
                    Aucun document téléchargé.
                  </div>
                </div>
              </section>
            </div>

            <footer class="modal-footer">
              <button class="btn btn-details" @click="isProfileModalOpen = false">Fermer</button>
            </footer>
          </div>
        </div>
      </Teleport>

      <!-- Image Preview Modal -->
      <Teleport to="body">
        <div v-if="isPreviewModalOpen" class="preview-overlay" @click.self="closePreview">
          <div class="preview-container">
            <div class="preview-top-actions">
              <button class="btn-preview-action" @click="downloadFile(previewImageUrl)" title="Télécharger">
                <span class="icon">↓</span> Télécharger
              </button>
              <button class="close-preview" @click="closePreview">&times;</button>
            </div>
            <img :src="previewImageUrl" alt="Clinical Document" class="preview-image" />
          </div>
        </div>
      </Teleport>
    </main>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #f8fafc;
  position: relative;
  overflow-x: hidden;
  box-sizing: border-box;
}

.dashboard-container * {
  box-sizing: border-box;
}

.mobile-top-bar {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  z-index: 100;
  padding: 0 1.5rem;
  align-items: center;
  justify-content: space-between;
}

.logo-compact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  color: #2b69ad;
  letter-spacing: -0.5px;
}

.mobile-logo-img {
  height: 25px;
  width: auto;
}

.mobile-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pro-hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 24px;
  height: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.pro-bar {
  width: 100%;
  height: 2px;
  background-color: #2b69ad;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.pro-hamburger.is-active .pro-bar:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.pro-hamburger.is-active .pro-bar:nth-child(2) { opacity: 0; }
.pro-hamburger.is-active .pro-bar:nth-child(3) { transform: translateY(-10px) rotate(-45deg); }

.pro-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(4px);
  z-index: 90;
}

.offline-warning {
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 700;
  margin-left: 1rem;
}

/* Notifications Styling */
.notifications-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.notif-toast {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.pulsate {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% { transform: scale(0.95); opacity: 0.8; }
  70% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.notif-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.urgency-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
}
.urgency-dot.high { background: #ef4444; }
.urgency-dot.medium { background: #f59e0b; }
.urgency-dot.low { background: #10b981; }

.type-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  color: #2b69ad;
}

.notif-icon {
  font-size: 1.5rem;
}

.notif-text {
  flex: 1;
}

.loading-data {
  font-style: italic;
  font-size: 0.8rem;
  color: #94a3b8;
}

.notif-text h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.notif-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
}

.notif-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

/* Nav Item Styling */
.nav-icon {
  font-size: 1.25rem;
  display: block;
}

.nav-label {
  display: block;
}

.notif-actions {
  display: flex;
  border-top: 1px solid #f1f5f9;
}

.btn-mini {
  flex: 1;
  padding: 0.75rem;
  border: none;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-mini.btn-accept {
  background: #2b69ad;
  color: white;
}

.btn-mini.btn-decline {
  background: #f8fafc;
  color: #64748b;
}

.btn-mini.btn-accept:hover {
  background: #1d4d82;
}

.btn-mini.btn-decline:hover {
  background: #f1f5f9;
}


/* Main Content Styling */
.main-content {
  flex: 1;
  padding: 3rem 4rem;
  max-width: 1400px;
  margin-left: 240px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-titles h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
}

.filter-section {
  margin-bottom: 2.5rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.filter-bar {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: space-between;
}

.search-input {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.search-input svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #2b69ad;
  pointer-events: none;
}

.search-input input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.2s;
}

.search-input input:focus {
  outline: none;
  border-color: #2b69ad;
  background: white;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
}

.date-picker-filter {
  padding: 0.7rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.9rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 160px;
}

.date-picker-filter:focus {
  border-color: #2b69ad;
  background: white;
  outline: none;
}

.btn-refresh {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.btn-test-notif {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  color: #2b69ad;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.btn-refresh:hover:not(:disabled), .btn-test-notif:hover {
  background: #f8fafc;
  border-color: #2b69ad;
  transform: translateY(-1px);
}

.loading-state {
  text-align: center;
  padding: 5rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 24px;
  border: 2px dashed #e2e8f0;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.requests-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

/* Request Card Styling */
.request-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.request-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Patient Card Polish */
.patient-card {
  padding: 1.25rem;
  min-height: 280px;
}

.patient-name {
  color: #0f172a;
  font-size: 1.1rem !important;
  margin-bottom: 0.25rem !important;
}

.patient-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.5rem 0;
}

.detail-icon-wrapper {
  width: 32px;
  height: 32px;
  background: #f0f7ff;
  color: #2b69ad;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.detail-content label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 700;
}

.detail-content span {
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 600;
  word-break: break-all;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.soins-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.soin-tag {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  border: 1px solid #e2e8f0;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 32px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #475569;
}

.patient-info h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.timestamp {
  font-size: 0.85rem;
  color: #64748b;
}

.urgency-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.urgency-high .urgency-badge {
  background: #fee2e2;
  color: #991b1b;
}

.urgency-medium .urgency-badge {
  background: #fef3c7;
  color: #92400e;
}

.urgency-low .urgency-badge {
  background: #dcfce7;
  color: #166534;
}

.urgency-high {
  border-left: 6px solid #ef4444;
}

.card-body {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.request-type {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.request-description {
  color: #475569;
  line-height: 1.5;
  margin: 0;
  font-size: 0.9rem;
}

.card-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.65rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-accept {
  background: #2b69ad;
  color: white;
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.3);
}

.btn-accept:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(43, 105, 173, 0.4);
}

.btn-details:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.card-price-badge {
  background: #f0fdf4;
  color: #166534;
  padding: 0.2rem 0.65rem;
  border-radius: 8px;
  font-weight: 800;
  font-size: 0.85rem;
  border: 1px solid #bbf7d0;
  line-height: 1;
}

.price-tag-large {
  font-size: 1.5rem;
  font-weight: 800;
  color: #15803d;
  background: #f0fdf4;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  border: 2px solid #bbf7d0;
  display: inline-block;
}

.price-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-decline {
  background: #f1f5f9;
  color: #475569;
}

.btn-decline:hover {
  background: #e2e8f0;
}

@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    flex-direction: column;
    padding-top: 60px; /* Space for mobile top bar */
    padding-bottom: 0; /* No more bottom nav padding */
  }
  
  .mobile-top-bar {
    display: flex;
  }

  .requests-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    width: 100%;
  }

  
  .main-content {
    padding: 0.75rem 0.5rem;
    margin-left: 0;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .header-titles h1 {
    font-size: 1.75rem;
  }

  .header-actions {
    width: 100%;
    display: flex;
    gap: 0.75rem;
  }

  .header-actions button {
    flex: 1;
    justify-content: center;
  }
  
  .notifications-container {
    left: 0.5rem;
    right: 0.5rem;
    top: 4.5rem; /* Below mobile top bar */
    max-width: none;
  }

  .notif-toast {
    box-shadow: 0 15px 30px rgba(0,0,0,0.15);
  }

  .request-card {
    padding: 0.5rem;
    border-radius: 12px;
    min-width: 0;
    gap: 0.4rem;
  }

  .request-card .patient-info {
    gap: 0.5rem;
  }

  .request-card .avatar {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
    border-radius: 8px;
  }

  .request-card .patient-info h3 {
    font-size: 0.9rem;
  }

  .request-card .timestamp {
    font-size: 0.7rem;
  }

  .request-card .urgency-badge {
    padding: 0.2rem 0.5rem;
    font-size: 0.6rem;
  }

  .request-card .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.25rem;
  }

  .request-card .patient-info {
    width: 100%;
    min-width: 0;
  }

  .request-card .patient-info > div:last-child {
    min-width: 0;
    flex: 1;
  }

  .request-card .card-body {
    margin-bottom: 0.75rem;
  }

  .request-card .request-type {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .request-card .request-description {
    font-size: 0.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .request-card .btn {
    padding: 0.45rem;
    font-size: 0.7rem;
    border-radius: 6px;
  }

  .accepted-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .accepted-actions .btn {
    padding: 0.45rem 0.3rem !important;
    font-size: 0.725rem !important;
    border-radius: 6px !important;
    height: 32px !important;
  }

  .utility-actions {
    display: flex;
    gap: 0.25rem;
  }

  .btn-util {
    width: 32px !important;
    height: 32px !important;
    padding: 0 !important;
    background: #f1f5f9 !important;
    color: #475569 !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: none !important;
  }

  .btn-accept {
    flex: 1.2 !important;
  }

  .btn-details {
    flex: 1 !important;
  }

  .patient-card {
    padding: 1rem;
    min-height: auto;
  }

  .patient-detail-row {
    gap: 0.75rem;
  }

  .detail-icon-wrapper {
    width: 28px;
    height: 28px;
  }

  .detail-icon-wrapper svg {
    width: 14px;
    height: 14px;
  }

  .filter-bar {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    min-width: 0;
  }
}

@media (min-width: 769px) and (max-width: 1200px) {
  .requests-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Pagination Styling */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 3rem;
  padding-bottom: 2rem;
}

.btn-pagination {
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pagination:hover:not(:disabled) {
  border-color: #2b69ad;
  color: #2b69ad;
  background: #f8fafc;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.75rem;
}

.page-numbers span {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  color: #64748b;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.page-numbers span:hover {
  background: #f1f5f9;
  color: #2b69ad;
}

.page-numbers span.active {
  background: #2b69ad;
  color: white;
  box-shadow: 0 4px 6px rgba(43, 105, 173, 0.2);
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #0f172a;
  margin: 0;
}

.close-modal {
  background: none;
  border: none;
  font-size: 2rem;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 2rem;
}

.modal-loading {
  padding: 4rem 2rem;
  text-align: center;
  color: #64748b;
}

.patient-profile {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px dashed #e2e8f0;
}

.modal-avatar {
  width: 64px;
  height: 64px;
  background: #eff6ff;
  color: #2b69ad;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.patient-main h3 {
  font-size: 1.25rem;
  margin: 0 0 0.25rem 0;
  color: #0f172a;
}

.patient-meta {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.service-description-box {
  background: #fdf2f2;
  border-left: 4px solid #ef4444;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

/* Override color if it's not actually an alert, but the user might want it to pop.
   Let's use a softer blue theme instead to match daricare. */
.service-description-box {
  background: #f0f7ff;
  border-left: 4px solid #2b69ad;
}

.service-description-box label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #2b69ad;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
}

.service-description-box p {
  font-size: 0.95rem;
  color: #1e3a8a;
  line-height: 1.5;
  margin: 0;
}

/* Profile Modal Specifics */
.profile-header-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: #f8fafc;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.profile-avatar-large {
  width: 80px;
  height: 80px;
  background: white;
  border: 4px solid #2b69ad;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  color: #2b69ad;
  box-shadow: 0 10px 15px -3px rgba(43, 105, 173, 0.2);
}

.profile-main-info h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #0f172a;
}

.speciality-text {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
  margin: 0 0 1rem 0;
}

.status-pill {
  display: inline-block;
  padding: 0.35rem 1rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pill.accepted {
  background: #dcfce7;
  color: #166534;
}

.status-pill.pending {
  background: #fef9c3;
  color: #854d0e;
}

.profile-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
  padding: 0 1rem;
}

.documents-section h4 {
  font-size: 1.25rem;
  color: #0f172a;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.documents-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.document-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.document-card:hover {
  border-color: #2b69ad;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.doc-main-click {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  cursor: pointer;
}

.doc-main-click:hover .doc-type {
  color: #2b69ad;
}

.doc-status-and-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.btn-icon-mini {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-icon-mini:hover {
  border-color: #2b69ad;
  color: #2b69ad;
  background: #f0f7ff;
  transform: scale(1.05);
}

.doc-actions-mini {
  display: flex;
  gap: 0.5rem;
}

.doc-icon {
  font-size: 1.5rem;
}

.doc-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.doc-type {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.doc-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.doc-status {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  padding: 0.25rem 0.6rem;
  background: #f1f5f9;
  border-radius: 6px;
}

.doc-status.verified {
  background: #dcfce7;
  color: #15803d;
}

.no-documents {
  grid-column: 1 / -1;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 16px;
  color: #94a3b8;
  text-align: center;
  border: 2px dashed #e2e8f0;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: span 2;
}

.detail-item label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.detail-item span {
  font-size: 1rem;
  color: #1e293b;
  font-weight: 500;
}

.address-with-map {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.map-link-inline {
  color: #2b69ad;
  font-size: 0.85rem;
  font-weight: 800;
  text-decoration: none;
  background: #f0f7ff;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  white-space: nowrap;
}

.map-link-inline:hover {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.utility-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-util {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  flex-shrink: 0;
  transition: all 0.2s;
  padding: 0 !important;
}

.btn-util:hover {
  background: #f1f5f9;
  color: #2b69ad;
  border-color: #2b69ad;
  transform: translateY(-2px);
}

.accepted-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.accepted-actions .btn {
  flex: none;
  min-width: 100px;
}

.accepted-actions .btn-accept {
  flex: 1;
}

.soins-details h4 {
  font-size: 1.1rem;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.soins-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.soin-detail-card {
  background: #f8fafc;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}

.soin-header {
  margin-bottom: 1rem;
}

.soin-header strong {
  font-size: 1rem;
  color: #2b69ad;
}

.soin-config {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  padding-bottom: 0.5rem;
}

.config-item label {
  color: #64748b;
  font-weight: 500;
}

.config-item span {
  color: #1e293b;
  font-weight: 600;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;
}

@media (max-width: 640px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .detail-item.full-width {
    grid-column: span 1;
  }
  .modal-content {
    border-radius: 20px 20px 0 0;
    max-height: 95vh;
  }
  .modal-body {
    padding: 1.5rem;
  }
  .docs-grid-mini {
    grid-template-columns: 1fr;
  }
  .doc-link-card {
    padding: 0.75rem 1rem;
  }
}
.soin-catalog-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
  font-weight: 400;
  line-height: 1.4;
}

.clinical-docs {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.clinical-docs h4 {
  font-size: 1.1rem;
  color: #0f172a;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.docs-grid-mini {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.doc-link-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  width: 100%;
}

.doc-link-card:hover {
  border-color: #2b69ad;
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(47, 105, 173, 0.1);
}

.doc-main-click {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0; /* Critical for text truncation */
}

.doc-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.doc-size {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.doc-view-icon {
  font-size: 1.25rem;
  color: #94a3b8;
}

/* Image Preview Modal Mapping */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-top-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.btn-preview-action {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.btn-preview-action:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
}

.close-preview {
  background: none;
  border: none;
  color: white;
  font-size: 2.5rem;
  cursor: pointer;
  line-height: 1;
  transition: transform 0.2s;
}

.close-preview:hover {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .close-preview {
    top: -50px;
    right: 0;
  }
}

.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: #f1f5f9;
  color: #64748b;
  display: inline-flex;
  align-items: center;
}

.status-pill.accepted, .status-pill.validated {
  background: #ecfdf5;
  color: #059669;
}

.status-pill.denied {
  background: #1e293b;
  color: #ffffff;
}

.request-card.status-accepted, .request-card.status-validated {
  border-left: 4px solid #10b981;
}

.request-card.status-denied {
  border-left: 4px solid #0f172a;
  opacity: 0.9;
}

.btn-contact {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
  flex: 1;
}

.btn-contact:hover {
  background: #dcfce7;
  border-color: #86efac;
}

/* Enhanced Booking Details Styles */
.section-title {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
  margin-bottom: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  margin-top: 1.5rem;
}

.status-indicators {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-pill-mini {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pill-mini.pending { background: #fef3c7; color: #b45309; }
.status-pill-mini.accepted { background: #dcfce7; color: #15803d; }

.highlight-val {
  font-weight: 700;
  color: #2b69ad;
}

.text-success { color: #10b981; }
.text-muted { color: #94a3b8; }

.address-complement {
  margin-top: 0.25rem;
  color: #64748b;
  font-style: italic;
}

.prescription-status {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  background: #f1f5f9;
  color: #475569;
}

.prescription-status.available { background: #dcfce7; color: #15803d; }

.soin-header {
  margin-bottom: 1rem;
}

.soin-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 0.25rem;
}

.frequency-badge {
  background: #f0fdf4;
  color: #15803d;
  padding: 0.2rem 0.65rem;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
}

.answer-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.answer-key {
  font-size: 0.65rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.answer-val {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
  line-height: 1.4;
}

.config-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.5rem;
}

.mt-2 { margin-top: 1rem; }

.doc-name {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-secondary {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 600;
}

.booking-schedule-section {
  background: white;
  border-radius: 16px;
  margin-bottom: 1.5rem;
}

.modal-overlay {
  z-index: 2000;
}

.patient-profile {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
}

.distance-tag {
  color: #2b69ad;
  font-size: 0.8rem;
  background: #f0f7ff;
  padding: 0.2rem 0.75rem;
  border-radius: 99px;
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
  border: 1px solid #d0e7ff;
  transition: all 0.2s ease;
  font-weight: 600;
}

.distance-tag:hover {
  background: #2b69ad;
  color: white;
  transform: translateY(-1px);
}

.distance-info-modal {
  margin-top: 0.75rem;
  color: #2b69ad;
  background: #f0f7ff;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #d0e7ff;
}

.distance-info-modal strong {
  font-size: 1.1rem;
  font-weight: 800;
}

/* Card Distance Badge */
.card-distance-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0f7ff;
  border: 1px solid #d0e7ff;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  margin-top: 0.5rem;
  animation: slideInLeft 0.3s ease;
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

.dist-icon {
  font-size: 1.1rem;
}

.dist-val {
  font-weight: 800;
  color: #2b69ad;
  font-size: 1rem;
}

.dist-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}


/* Status Filter Tabs */
.status-filters {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  flex-wrap: wrap;
}

/* Add margin/border only if there's content above */
.search-input + .status-filters,
.filter-group + .status-filters {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.status-tab {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.status-tab:hover {
  background: #f8fafc;
  color: #1e293b;
}

.status-tab.active {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.status-tab.active.pending { background: #f59e0b; border-color: #f59e0b; }
.status-tab.active.accepted { background: #10b981; border-color: #10b981; }
.status-tab.active.denied { background: #1e293b; border-color: #1e293b; }

.dist-mini {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  margin-top: 0.1rem;
  display: block;
}

.status-pill.pending {
  background: #fffbeb;
  color: #b45309;
}

.request-card.pending {
  border-top: 4px solid #f59e0b;
}

.request-card.accepted {
  border-top: 4px solid #10b981;
}

.request-card.denied {
  border-top: 4px solid #1e293b;
  opacity: 0.85;
}

/* Done styles */
.request-card.status-done {
  border-top: 4px solid #10b981;
}

.status-pill.done {
  background: #dcfce7;
  color: #15803d;
}

.status-pill-mini.done {
  background: #dcfce7;
  color: #15803d;
}



</style>
