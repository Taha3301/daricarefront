<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  activeRequests: {
    type: Array as () => any[],
    required: true,
    default: () => []
  },
  acceptedRequestsList: {
    type: Array as () => any[],
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['show-details']);

// Calendar State
const currentCalendarDate = ref(new Date());
const expandedDay = ref<string | null>(null);

const calendarTitle = computed(() => {
  const title = currentCalendarDate.value.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  return title.charAt(0).toUpperCase() + title.slice(1);
});

const calendarDays = computed(() => {
  const date = currentCalendarDate.value;
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Adjust to start on Monday (0-6 -> Mon-Sun)
  let firstDayOfMonth = new Date(year, month, 1).getDay();
  firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  
  // Padding for previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth; i > 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i + 1);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      currentMonth: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      currentMonth: true
    });
  }
  
  // Padding for next month (fill up to 42 cells for 6 rows)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      currentMonth: false
    });
  }
  
  return days;
});

const isToday = (dayObj: any) => {
  const today = new Date();
  return today.getDate() === dayObj.day && 
         today.getMonth() === dayObj.month && 
         today.getFullYear() === dayObj.year;
};

const parseDateSafe = (dateStr: any) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  
  // If dateStr is just YYYY-MM-DD, parsing it as a local date is safer
  // by replacing dashes with slashes (some browsers treat YYYY-MM-DD as UTC)
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, day] = parts as [number, number, number];
      return new Date(y, m - 1, day);
    }
  }
  
  return d;
};

const eventsByDate = computed(() => {
  const eventsMap: Record<string, any[]> = {};
  
  // Combine all sources of truth
  const allToProcess = [
    ...props.activeRequests.map(r => ({ ...r, calendarStatus: 'pending' })),
    ...props.acceptedRequestsList.map(r => ({ ...r, calendarStatus: r.status }))
  ];

  allToProcess.forEach(req => {
    // Try to find the most relevant date
    const d = parseDateSafe(req.startDate) || parseDateSafe(req.date) || parseDateSafe(req.createdAt);
    
    if (d) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!eventsMap[key]) eventsMap[key] = [];
      
      // Avoid duplication
      if (!eventsMap[key].some(e => e.id === req.id)) {
        eventsMap[key].push(req);
      }
    }
  });

  return eventsMap;
});

const allDemandsCount = computed(() => {
  // Simple count of all events for the header
  return props.activeRequests.length + props.acceptedRequestsList.length;
});

const prevMonth = () => {
  currentCalendarDate.value = new Date(currentCalendarDate.value.getFullYear(), currentCalendarDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentCalendarDate.value = new Date(currentCalendarDate.value.getFullYear(), currentCalendarDate.value.getMonth() + 1, 1);
};

const toggleDayExpansion = (dayKey: string, event: Event) => {
  event.stopPropagation();
  if (expandedDay.value === dayKey) {
    expandedDay.value = null;
  } else {
    expandedDay.value = dayKey;
  }
};

const formatTime = (dateStr: string) => {
  const d = parseDateSafe(dateStr);
  if (!d) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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

const onShowRequestDetails = (event: any) => {
  emit('show-details', event);
};

</script>

<template>
  <div class="calendar-wrapper">
    <div class="calendar-header-bar">
      <div class="month-nav">
        <button class="btn-nav" @click="prevMonth">‹</button>
        <h2>{{ calendarTitle }}</h2>
        <button class="btn-nav" @click="nextMonth">›</button>
      </div>
      <div class="calendar-info">
        <span class="event-count">{{ allDemandsCount }} soins au total</span>
      </div>
    </div>
    
    <div class="calendar-grid">
      <div class="day-header">Lundi</div>
      <div class="day-header">Mardi</div>
      <div class="day-header">Mercredi</div>
      <div class="day-header">Jeudi</div>
      <div class="day-header">Vendredi</div>
      <div class="day-header">Samedi</div>
      <div class="day-header">Dimanche</div>
      
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="calendar-day"
        :class="{ 
          'other-month': !day.currentMonth, 
          'today': isToday(day),
          'has-multiple': (eventsByDate[`${day.year}-${day.month}-${day.day}`]?.length || 0) > 2,
          'is-expanded': expandedDay === `${day.year}-${day.month}-${day.day}`
        }"
        @click="toggleDayExpansion(`${day.year}-${day.month}-${day.day}`, $event)"
      >
        <span class="day-number">{{ day.day }}</span>
        <div class="day-events">
          <!-- Main Grid: Only show first 2 events -->
          <div 
            v-for="event in eventsByDate[`${day.year}-${day.month}-${day.day}`]?.slice(0, 2) || []" 
            :key="event.id"
            class="calendar-event"
            :class="event.calendarStatus"
            @click.stop="onShowRequestDetails(event)"
            :title="`${event.patientFirstname} ${event.patientLastname} (${event.calendarStatus === 'pending' ? 'En attente' : event.calendarStatus === 'accepted' ? 'Accepté' : event.calendarStatus === 'validated' ? 'Validé' : 'Refusé'})`"
          >
            <div class="event-meta">
              <span class="event-time">{{ formatTime(event.startDate || event.createdAt) }}</span>
              <span class="urgency-dot-mini" :class="event.urgency"></span>
            </div>
            <div class="event-title">{{ event.patientFirstname }} {{ event.patientLastname?.charAt(0) }}.</div>
          </div>

          <!-- Show More Indicator -->
          <div 
            v-if="(eventsByDate[`${day.year}-${day.month}-${day.day}`]?.length || 0) > 2" 
            class="more-indicator"
          >
            + {{ (eventsByDate[`${day.year}-${day.month}-${day.day}`]?.length || 0) - 2 }} de plus
          </div>
        </div>

        <!-- Expanded Popover -->
        <div v-if="expandedDay === `${day.year}-${day.month}-${day.day}`" class="events-dropdown" @click.stop>
          <header class="dropdown-header">
            <span>{{ day.day }} {{ calendarTitle }}</span>
            <button class="close-dropdown" @click="expandedDay = null">&times;</button>
          </header>
          <div class="dropdown-list">
            <div 
              v-for="event in eventsByDate[`${day.year}-${day.month}-${day.day}`] || []" 
              :key="event.id"
              class="dropdown-event"
              :class="event.calendarStatus"
              @click="onShowRequestDetails(event)"
            >
              <div class="event-meta">
                <span class="event-time">{{ formatTime(event.startDate || event.createdAt) }}</span>
                <span class="urgency-dot-mini" :class="event.urgency"></span>
              </div>
              <div class="event-info">
                <div class="event-title">{{ event.patientFirstname }} {{ event.patientLastname }}</div>
                <div class="event-service">{{ translateType(event.service?.name) }}</div>
              </div>
              <div class="event-status-tag">{{ event.calendarStatus === 'pending' ? 'Attente' : event.calendarStatus }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Calendar View Styles */
.calendar-wrapper {
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  overflow: hidden;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
}

.calendar-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}

.month-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.month-nav h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  min-width: 200px;
  text-align: center;
  letter-spacing: -0.5px;
}

.btn-nav {
  background: white;
  border: 1px solid #e2e8f0;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #2b69ad;
}

.btn-nav:hover {
  background: #f8fafc;
  color: #1d4ed8;
  border-color: #2b69ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(47, 105, 173, 0.15);
}

.calendar-info .event-count {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid #dbeafe;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #e2e8f0;
  gap: 1px;
}

.day-header {
  background: #f8fafc;
  padding: 1rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
}

.calendar-day {
  background: white;
  min-height: 140px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  background: #fcfcfc;
}

.calendar-day.other-month {
  background: #fcfcfc;
  color: #cbd5e1;
}

.calendar-day.other-month .day-number {
  color: #cbd5e1;
  background: transparent;
}

.calendar-day.today {
  background: #f0f9ff;
}

.calendar-day.today .day-number {
  background: #2b69ad;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(43, 105, 173, 0.3);
}

.day-number {
  font-size: 0.95rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.75rem;
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.calendar-event {
  background: #f0f9ff;
  border-left: 3px solid #2b69ad;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.75rem;
  position: relative;
  overflow: hidden;
}

.calendar-event.pending {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.calendar-event.accepted {
  background: #f0f9ff;
  border-left-color: #2b69ad;
}

.calendar-event.validated {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.calendar-event.denied {
  background: #f8fafc;
  border-left-color: #94a3b8;
  opacity: 0.8;
  color: #64748b;
}

.calendar-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  z-index: 2;
}

.event-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.event-time {
  font-weight: 800;
  color: #334155;
  font-size: 0.7rem;
}

.calendar-event.pending .event-time { color: #b45309; }
.calendar-event.accepted .event-time { color: #1e40af; }
.calendar-event.validated .event-time { color: #166534; }

.urgency-dot-mini {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.5);
}
.urgency-dot-mini.high { background: #ef4444; }
.urgency-dot-mini.medium { background: #f59e0b; }
.urgency-dot-mini.low { background: #10b981; }

.event-title {
  color: #1e293b;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
}

.more-indicator {
  margin-top: auto;
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  padding: 0.25rem;
  text-align: center;
  border-radius: 4px;
  transition: color 0.2s;
}

.calendar-day:hover .more-indicator {
  color: #2b69ad;
  background: #f0f9ff;
}

/* Dropdown / Popover */
.events-dropdown {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  max-width: 90vw;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
  z-index: 500;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: translate(-50%, -40%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.dropdown-header {
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  font-size: 0.95rem;
  color: #0f172a;
}

.close-dropdown {
  background: white;
  border: 1px solid #e2e8f0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.close-dropdown:hover {
  background: #f1f5f9;
  color: #ef4444;
  border-color: #ef4444;
}

.dropdown-list {
  max-height: 350px;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dropdown-event {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}

.dropdown-event:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.05);
}

.dropdown-event.pending { background: #fffbeb; border-color: #fce7f3; }
.dropdown-event.accepted { background: #f0f9ff; border-color: #e0f2fe; }
.dropdown-event.validated { background: #f0fdf4; border-color: #dcfce7; }
.dropdown-event.denied { background: #f8fafc; opacity: 0.8; }

.event-info {
  flex: 1;
  min-width: 0;
}

.dropdown-event .event-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.1rem;
}

.dropdown-event .event-service {
  font-size: 0.75rem;
  margin: 0;
  color: #64748b;
  font-weight: 600;
}

.event-status-tag {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Responsiveness */
@media (max-width: 1024px) {
  .calendar-day {
    min-height: 110px;
  }
  .event-title {
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .calendar-header-bar {
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
  }
  
  .month-nav {
    width: 100%;
    justify-content: space-between;
  }
  
  .month-nav h2 {
    min-width: auto;
    font-size: 1.25rem;
    text-align: center;
    flex: 1;
  }

  .calendar-grid {
    gap: 1px;
  }

  .day-header {
    font-size: 0.6rem;
    padding: 0.5rem 0.25rem;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  
  /* Mobile View for Calendar Cells */
  .calendar-day {
    min-height: 80px;
    padding: 0.4rem;
    align-items: center; /* Center content on mobile */
  }

  /* Hide detailed events on very small screens, show dots only */
  .day-events {
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .calendar-event {
    width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 50%;
    border: none;
    overflow: hidden;
    text-indent: -9999px; /* Hide text */
  }

  .calendar-event.pending { background: #f59e0b; }
  .calendar-event.accepted { background: #2b69ad; }
  .calendar-event.validated { background: #10b981; }

  .more-indicator {
    display: none;
  }
  
  .day-number {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    width: 24px;
    height: 24px;
    line-height: 24px;
  }

  .calendar-day.today .day-number {
    width: 24px;
    height: 24px;
    line-height: 24px;
  }

  /* Popover adjustments for mobile */
  .events-dropdown {
    width: 90%;
    position: fixed;
    top: 50%;
    left: 50%;
  }
}
</style>
