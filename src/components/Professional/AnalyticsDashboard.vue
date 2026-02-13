<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';

interface AnalyticsSummary {
  totalEarning: number;
  totalRequests: number;
  acceptedCount: number;
  completionRate: number;
  acceptanceRate: number;
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

interface TopService {
  name: string;
  count: number;
  gains: number;
}

interface ActivityItem {
  requestId: number;
  service: string;
  status: string;
  date: string;
  price: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  graphData: {
    monthlyEarnings: MonthlyEarning[];
  };
  topServices: TopService[];
  recentActivity: ActivityItem[];
}

const analyticsData = ref<AnalyticsData | null>(null);
const isLoading = ref(true);
const error = ref('');

const fetchAnalytics = async () => {
  isLoading.value = true;
  error.value = '';
  const token = storage.getItem('access_token');
  
  try {
    const response = await fetch(getApiUrl('/professionals/analytics'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });

    if (response.ok) {
      analyticsData.value = await response.json();
    } else {
      error.value = 'Impossible de charger les analyses.';
    }
  } catch (err) {
    console.error('Error fetching analytics:', err);
    error.value = 'Erreur de connexion.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAnalytics);

// Helper for bar chart height calculation
const maxEarning = computed(() => {
  if (!analyticsData.value?.graphData?.monthlyEarnings?.length) return 100;
  return Math.max(...analyticsData.value.graphData.monthlyEarnings.map(d => d.amount)) || 100;
});

const getBarHeight = (amount: number) => {
  const percentage = (amount / maxEarning.value) * 100;
  return `${Math.max(percentage, 5)}%`; // Min height 5% for visibility
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted': return 'status-accepted';
    case 'denied': 
    case 'rejected': return 'status-rejected';
    case 'done':
    case 'completed': return 'status-completed';
    default: return 'status-pending';
  }
};

const translateStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'accepted': return 'Accepté';
    case 'denied':
    case 'rejected': return 'Refusé';
    case 'done':
    case 'completed': return 'Terminé';
    case 'pending': return 'En attente';
    default: return status;
  }
};
</script>

<template>
  <div class="analytics-container">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement de vos statistiques...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn-retry" @click="fetchAnalytics">Réessayer</button>
    </div>

    <div v-else-if="analyticsData" class="dashboard-content">
      
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="kpi-card highlight">
          <div class="kpi-icon">💰</div>
          <div class="kpi-info">
            <span class="kpi-label">Revenu Total</span>
            <span class="kpi-value">{{ analyticsData.summary.totalEarning.toLocaleString() }} DT</span>
          </div>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-info">
            <span class="kpi-label">Total Demandes</span>
            <span class="kpi-value">{{ analyticsData.summary.totalRequests }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <span class="kpi-label">Taux d'Acceptation</span>
            <span class="kpi-value">{{ analyticsData.summary.acceptanceRate }}%</span>
          </div>
        </div>
        
        <div class="kpi-card">
          <div class="kpi-icon">⭐</div>
          <div class="kpi-info">
            <span class="kpi-label">Taux de Complétion</span>
            <span class="kpi-value">{{ analyticsData.summary.completionRate }}%</span>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <!-- Monthly Earnings Chart -->
        <div class="chart-card main-chart">
          <h3>Revenus Mensuels</h3>
          <div class="bar-chart-container">
            <div v-if="!analyticsData.graphData.monthlyEarnings.length" class="empty-chart">
              Pas assez de données
            </div>
            <div v-else class="bar-chart">
              <div 
                v-for="item in analyticsData.graphData.monthlyEarnings" 
                :key="item.month" 
                class="bar-column"
              >
                <div class="bar-tooltip">{{ item.amount }} DT</div>
                <div class="bar-fill" :style="{ height: getBarHeight(item.amount) }"></div>
                <span class="bar-label">{{ item.month }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Services -->
        <div class="chart-card side-chart">
          <h3>Top Services</h3>
          <div class="top-services-list">
            <div 
              v-for="(service, index) in analyticsData.topServices" 
              :key="index"
              class="service-item"
            >
              <div class="service-rank">{{ index + 1 }}</div>
              <div class="service-details">
                <span class="service-name">{{ service.name }}</span>
                <span class="service-stats">{{ service.count }} demandes</span>
              </div>
              <div class="service-gain">{{ service.gains }} DT</div>
            </div>
            <div v-if="!analyticsData.topServices.length" class="empty-list">
              Aucun service enregistré
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Table -->
      <div class="activity-section">
        <h3>Activité Récente</h3>
        <div class="table-responsive">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in analyticsData.recentActivity" :key="item.requestId">
                <td class="font-medium">{{ item.service }}</td>
                <td class="text-gray">{{ formatDate(item.date) }}</td>
                <td class="font-bold">{{ item.price }} DT</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(item.status)">
                    {{ translateStatus(item.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!analyticsData.recentActivity.length">
                <td colspan="4" class="text-center py-4 text-gray">Aucune activité récente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.analytics-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #64748b;
}

.spinner {
  border: 3px solid #f1f5f9;
  border-top: 3px solid #2b69ad;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #2b69ad;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Summary Cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #f1f5f9;
  transition: transform 0.2s;
}

.kpi-card:hover { transform: translateY(-3px); }

.kpi-card.highlight {
  background: linear-gradient(135deg, #2b69ad 0%, #1e40af 100%);
  color: white;
}

.kpi-card.highlight .kpi-label { color: rgba(255,255,255,0.8); }
.kpi-card.highlight .kpi-value { color: white; }
.kpi-card.highlight .kpi-icon { background: rgba(255,255,255,0.2); }

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

/* Charts Section */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (max-width: 900px) {
  .charts-row { grid-template-columns: 1fr; }
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.chart-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

/* Bar Chart */
.bar-chart-container {
  height: 250px;
  display: flex;
  align-items: flex-end;
}

.bar-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  gap: 0.5rem;
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.bar-fill {
  width: 100%;
  background: #e2e8f0;
  border-radius: 6px 6px 0 0;
  transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
  max-width: 40px;
}

.bar-column:hover .bar-fill {
  background: #2b69ad;
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.bar-tooltip {
  position: absolute;
  top: -30px;
  background: #0f172a;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.2s;
  pointer-events: none;
  white-space: nowrap;
}

.bar-column:hover .bar-tooltip {
  opacity: 1;
  transform: translateY(0);
}

/* Top Services */
.top-services-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 12px;
}

.service-rank {
  width: 24px;
  height: 24px;
  background: #2b69ad;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.service-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.service-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
}

.service-stats {
  font-size: 0.75rem;
  color: #64748b;
}

.service-gain {
  font-weight: 700;
  color: #15803d;
  font-size: 0.9rem;
}

/* Activity Table */
.activity-section {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
}

.activity-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.table-responsive {
  overflow-x: auto;
}

.activity-table {
  width: 100%;
  border-collapse: collapse;
}

.activity-table th {
  text-align: left;
  padding: 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 700;
}

.activity-table td {
  padding: 1rem 0.75rem;
  font-size: 0.9rem;
  border-bottom: 1px solid #f8fafc;
  color: #334155;
}

.font-medium { font-weight: 600; color: #1e293b; }
.font-bold { font-weight: 700; color: #0f172a; }
.text-gray { color: #64748b; font-size: 0.85rem; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-accepted { background: #dcfce7; color: #15803d; }
.status-rejected { background: #fee2e2; color: #991b1b; }
.status-completed { background: #eff6ff; color: #1e40af; }
.status-pending { background: #fef3c7; color: #92400e; }
</style>
