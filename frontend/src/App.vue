<script setup>
import { ref, defineComponent, h, onMounted } from 'vue'
import DashboardGrid from './DashboardGrid.vue'
import AddWidgetWizard from './AddWidgetWizard.vue'
import * as api from './api/dashboardApi.js'

// ── Simple Plus Icon ───────────────────────────────────────────────────────────
const PlusIcon = defineComponent({
  render: () =>
    h(
      'svg',
      {
        width: 14,
        height: 14,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 2.5,
      },
      [h('line', { x1: 12, y1: 5, x2: 12, y2: 19 }), h('line', { x1: 5, y1: 12, x2: 19, y2: 12 })],
    ),
})

// ── Reference data from backend ────────────────────────────────────────────────
const DOMAINS = ref([])
const DATASETS = ref({})

const VIZ_TYPES = [
  { id: 'line', name: 'Line Chart', icon: '📉', desc: 'Trends over time' },
  { id: 'bar', name: 'Bar Chart', icon: '📊', desc: 'Compare categories' },
  { id: 'column', name: 'Column Chart', icon: '📶', desc: 'Vertical bars' },
  { id: 'pie', name: 'Pie / Donut', icon: '🥧', desc: 'Part-to-whole' },
  { id: 'area', name: 'Area Chart', icon: '🏔️', desc: 'Volume & trends' },
  { id: 'table', name: 'Data Table', icon: '📋', desc: 'Detailed rows' },
  { id: 'kpi', name: 'KPI Card', icon: '🎯', desc: 'Single metric' },
]

// ── State ──────────────────────────────────────────────────────────────────────
const wizardOpen = ref(false)
const widgets = ref([])
const loading = ref(true)
let widgetCounter = 0

// ── Initialize app data ────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    loading.value = true

    // Load domains
    DOMAINS.value = await api.fetchDomains()

    // Load datasets for each domain
    const datasetsMap = {}
    for (const domain of DOMAINS.value) {
      datasetsMap[domain.id] = await api.fetchDatasets(domain.id)
    }
    DATASETS.value = datasetsMap

    // Load user's dashboard
    const dashboard = await api.fetchDashboard()
    if (dashboard?.widgets && Array.isArray(dashboard.widgets)) {
      // Restore widgets with their data
      for (const savedWidget of dashboard.widgets) {
        const data = await api.fetchData(savedWidget.domainId, savedWidget.datasetId)
        widgets.value.push({
          ...savedWidget,
          kpiData: data.kpi,
          _data: data,
        })
        if (savedWidget.id > widgetCounter) {
          widgetCounter = savedWidget.id
        }
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  } finally {
    loading.value = false
  }
})

// ── Widget sizing ──────────────────────────────────────────────────────────────
function sizeForVizType(vizType) {
  const sizes = {
    kpi: { w: 3, h: 4 },
    table: { w: 8, h: 6 },
    pie: { w: 5, h: 5 },
    line: { w: 6, h: 5 },
    area: { w: 6, h: 5 },
    bar: { w: 6, h: 5 },
    column: { w: 6, h: 5 },
  }
  return sizes[vizType] ?? { w: 6, h: 5 }
}

// ── Add widget ─────────────────────────────────────────────────────────────────
async function addWidget({ domainId, datasetId, vizType }) {
  try {
    // Fetch real data from API
    const data = await api.fetchData(domainId, datasetId)
    const { w, h } = sizeForVizType(vizType)
    const id = ++widgetCounter

    const newWidget = {
      id,
      domainId,
      datasetId,
      vizType,
      w,
      h,
      x: 0,
      y: widgets.value.length * 5, // simple auto-stack
      kpiData: data.kpi,
      _data: data,
    }

    widgets.value.push(newWidget)

    // Save to backend
    await saveDashboardToBackend()
  } catch (error) {
    console.error('Failed to add widget:', error)
    alert('Failed to add widget. Please try again.')
  }
}

// ── Remove widget ──────────────────────────────────────────────────────────────
async function removeWidget(id) {
  widgets.value = widgets.value.filter((w) => w.id !== id)
  // Save to backend
  await saveDashboardToBackend()
}

// ── Persist layout changes ─────────────────────────────────────────────────────
async function onLayoutChanged(layout) {
  // Update x, y, w, h in widgets array so layout persists on re-render
  layout.forEach(({ id, x, y, w, h }) => {
    const widget = widgets.value.find((wid) => String(wid.id) === String(id))
    if (widget) Object.assign(widget, { x, y, w, h })
  })
  // Save to backend
  await saveDashboardToBackend()
}

// ── Save dashboard to backend ──────────────────────────────────────────────────
async function saveDashboardToBackend() {
  try {
    // Only save the necessary widget properties (exclude _data for efficiency)
    const widgetsToSave = widgets.value.map(({ id, domainId, datasetId, vizType, w, h, x, y }) => ({
      id,
      domainId,
      datasetId,
      vizType,
      w,
      h,
      x,
      y,
    }))
    await api.saveDashboard(widgetsToSave)
  } catch (error) {
    console.error('Failed to save dashboard:', error)
  }
}
</script>

<template>
  <div class="app">
    <!-- ── App Header ── -->
    <header class="app-header">
      <div class="logo">dash<span>craft</span></div>
      <div class="header-right">
        <span class="widget-count"
          >{{ widgets.length }} widget{{ widgets.length !== 1 ? 's' : '' }}</span
        >
        <button class="btn btn-primary" @click="wizardOpen = true">
          <PlusIcon />
          Add Widget
        </button>
      </div>
    </header>

    <!-- ── Main Content ── -->
    <main class="main-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Dashboard</h1>
          <p class="page-hint">Drag to reorder · Resize from corner · Click × to remove</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>

      <DashboardGrid
        v-else
        :widgets="widgets"
        :domains="DOMAINS"
        :datasets-by-domain="DATASETS"
        :viz-types="VIZ_TYPES"
        @remove-widget="removeWidget"
        @layout-changed="onLayoutChanged"
      />
    </main>

    <!-- ── Add Widget Wizard ── -->
    <AddWidgetWizard
      v-model="wizardOpen"
      :domains="DOMAINS"
      :datasets-by-domain="DATASETS"
      :viz-types="VIZ_TYPES"
      @add-widget="addWidget"
    />
  </div>
</template>

<style>
/* ── Global CSS variables (place in your main.css / index.css) ── */
:root {
  --bg: #0b0d14;
  --surface: #12151f;
  --surface-2: #191d2b;
  --surface-3: #20253a;
  --border: #252b40;
  --border-hov: #3a4060;
  --accent: #f59e0b;
  --accent-dim: rgba(245, 158, 11, 0.12);
  --text: #e4e8f7;
  --text-muted: #7c85a8;
  --text-dim: #3e4565;
  --green: #10b981;
  --red: #ef4444;
  --shadow-lg: 0 12px 56px rgba(0, 0, 0, 0.65);
}
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: var(--text);
}
.logo span {
  color: var(--accent);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.widget-count {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 4px 12px;
  border-radius: 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn-primary {
  background: var(--accent);
  color: var(--bg);
}
.btn-primary:hover {
  background: #fbbf24;
  transform: translateY(-1px);
}

.main-content {
  padding: 28px 32px;
  flex: 1;
}

.page-header {
  margin-bottom: 20px;
}
.page-title {
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.4px;
}
.page-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.loading-state p {
  font-size: 14px;
  color: var(--text-muted);
}
</style>
