<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, defineComponent, h, computed } from 'vue'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import Highcharts from 'highcharts'
import { createGrid } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
// ── Drag icon component ────────────────────────────────────────────────────────
const DragIcon = defineComponent({
  render: () =>
    h(
      'svg',
      { width: 10, height: 16, viewBox: '0 0 10 16', fill: 'currentColor', style: 'opacity:0.3' },
      [
        [0, 0],
        [4, 0],
        [0, 4],
        [4, 4],
        [0, 8],
        [4, 8],
        [0, 12],
        [4, 12],
      ].map(([x, y]) => h('circle', { cx: x + 1, cy: y + 1, r: 1.5 })),
    ),
})

// ── Props & Emits ──────────────────────────────────────────────────────────────
const props = defineProps({
  widgets: { type: Array, required: true },
  domains: { type: Array, required: true },
  datasetsByDomain: { type: Object, required: true },
  vizTypes: { type: Array, required: true },
  layout: { type: String, default: 'single' },
})

const emit = defineEmits(['remove-widget', 'layout-changed'])

// ── Layout Configuration ───────────────────────────────────────────────────────
const layoutColumns = computed(() => {
  // GridStack uses a 12-column grid system
  // Define column positions based on layout type
  const layouts = {
    single: [{ start: 0, width: 12 }],
    'two-equal': [
      { start: 0, width: 6 },
      { start: 6, width: 6 },
    ],
    'two-left-small': [
      { start: 0, width: 4 },
      { start: 4, width: 8 },
    ],
    'two-left-large': [
      { start: 0, width: 8 },
      { start: 8, width: 4 },
    ],
    'three-equal': [
      { start: 0, width: 4 },
      { start: 4, width: 4 },
      { start: 8, width: 4 },
    ],
  }
  return layouts[props.layout] || layouts.single
})

// ── Refs ───────────────────────────────────────────────────────────────────────
const gridEl = ref(null)
let grid = null

// Track AG-Grid instances to destroy on widget removal
const agGridInstances = new Map()

// ── Helper: Find which column a widget belongs to ─────────────────────────────
function findColumnForWidget(x, w) {
  // Find the column that the widget's center is in
  const widgetCenter = x + w / 2
  
  for (const col of layoutColumns.value) {
    const colStart = col.start
    const colEnd = col.start + col.width
    
    if (widgetCenter >= colStart && widgetCenter < colEnd) {
      return col
    }
  }
  
  // If not found, return the closest column
  let closestCol = layoutColumns.value[0]
  let minDistance = Math.abs(widgetCenter - (closestCol.start + closestCol.width / 2))
  
  for (const col of layoutColumns.value) {
    const colCenter = col.start + col.width / 2
    const distance = Math.abs(widgetCenter - colCenter)
    
    if (distance < minDistance) {
      minDistance = distance
      closestCol = col
    }
  }
  
  return closestCol
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const getDomain = (id) => props.domains.find((d) => d.id === id)
const getDataset = (did, sid) => (props.datasetsByDomain[did] ?? []).find((d) => d.id === sid)
const getVizType = (id) => props.vizTypes.find((v) => v.id === id)

// ── Highcharts theme ───────────────────────────────────────────────────────────
const HC_THEME = {
  lang: {
    decimalPoint: '.',
    thousandsSep: ',',
  },
  chart: {
    backgroundColor: 'transparent',
    style: { fontFamily: "'DM Sans', sans-serif" },
    animation: { duration: 600 },
    spacing: [8, 8, 8, 8],
  },
  title: { text: null },
  credits: { enabled: false },
  colors: ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'],
  xAxis: {
    labels: { style: { color: '#7c85a8', fontSize: '11px' } },
    lineColor: '#252b40',
    tickColor: '#252b40',
    gridLineColor: 'transparent',
  },
  yAxis: {
    labels: { style: { color: '#7c85a8', fontSize: '11px' } },
    gridLineColor: '#1a1e2e',
    title: { text: null },
  },
  legend: {
    itemStyle: { color: '#7c85a8', fontSize: '11px', fontWeight: '400' },
    itemHoverStyle: { color: '#e4e8f7' },
  },
  tooltip: {
    backgroundColor: '#191d2b',
    borderColor: '#252b40',
    borderRadius: 8,
    style: { color: '#e4e8f7', fontSize: '12px' },
  },
  plotOptions: {
    series: { animation: { duration: 600 } },
    column: { borderRadius: 4, borderWidth: 0 },
    bar: { borderRadius: 4, borderWidth: 0 },
    area: { fillOpacity: 0.18 },
    line: { marker: { radius: 3 } },
    pie: { dataLabels: { color: '#7c85a8', style: { textOutline: 'none', fontSize: '11px' } } },
  },
}

// ── Chart / Table renderers ────────────────────────────────────────────────────
function renderChart(widgetId, vizType, data) {
  const containerId = `hc-chart-${widgetId}`
  const el = document.getElementById(containerId)
  if (!el) return

  const isPie = vizType === 'pie'
  Highcharts.chart(containerId, {
    ...HC_THEME,
    chart: { ...HC_THEME.chart, type: isPie ? 'pie' : vizType },
    xAxis: isPie ? undefined : { ...HC_THEME.xAxis, categories: data.cats },
    yAxis: isPie ? undefined : HC_THEME.yAxis,
    series: isPie
      ? [
          {
            type: 'pie',
            name: data.series[0]?.name ?? 'Value',
            innerSize: '50%',
            data: data.cats.map((c, i) => ({ name: c, y: data.series[0]?.data[i] ?? 0 })),
          },
        ]
      : data.series,
  })
}

function renderTable(widgetId, rows) {
  const el = document.getElementById(`ag-table-${widgetId}`)
  if (!el || !rows?.length) return

  const colDefs = Object.keys(rows[0]).map((k) => ({
    field: k,
    headerName: k,
    flex: 1,
    sortable: true,
    filter: true,
    cellStyle: { color: '#e4e8f7', fontSize: '12px' },
  }))

  // Destroy previous instance if re-rendering
  if (agGridInstances.has(widgetId)) {
    agGridInstances.get(widgetId).destroy?.()
    agGridInstances.delete(widgetId)
  }

  const api = createGrid(el, {
    columnDefs: colDefs,
    rowData: rows,
    defaultColDef: { resizable: true },
    headerHeight: 34,
    rowHeight: 30,
    onGridReady: (p) => p.api.sizeColumnsToFit(),
  })
  agGridInstances.set(widgetId, api)
}

// ── GridStack lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  grid = GridStack.init(
    {
      cellHeight: 68,
      minRow: 2,
      animate: true,
      float: true,
      margin: 8,
      resizable: { handles: 'se,sw' },
      draggable: { handle: '.widget-drag-handle' },
    },
    gridEl.value,
  )

  // Emit layout changes so parent can persist positions
  grid.on('change', (_, items) => {
    const layout = items.map((i) => {
      const widgetId = i.el?.id?.replace('gs-widget-', '')
      let { x, y, w, h } = i
      
      // Auto-adjust width when widget is dragged to a different column
      const targetColumn = findColumnForWidget(x, w)
      if (targetColumn) {
        // Snap to column start and set width to full column width
        x = targetColumn.start
        w = targetColumn.width
        
        // Update the GridStack widget immediately to reflect the new width
        const gsWidget = grid.engine.nodes.find(node => node.el?.id === `gs-widget-${widgetId}`)
        if (gsWidget && (gsWidget.w !== w || gsWidget.x !== x)) {
          grid.update(i.el, { x, w })
        }
      }
      
      return {
        id: widgetId,
        x,
        y,
        w,
        h,
      }
    })
    emit('layout-changed', layout)
  })

  // Render any existing widgets that were loaded from backend
  await nextTick()
  if (props.widgets.length > 0) {
    setTimeout(() => {
      props.widgets.forEach((widget) => {
        if (widget.vizType === 'kpi') return // KPI widgets don't need rendering

        if (widget.vizType === 'table') {
          renderTable(widget.id, widget._data?.rows ?? [])
        } else {
          renderChart(widget.id, widget.vizType, widget._data)
        }
      })
    }, 150)
  }
})

onBeforeUnmount(() => {
  agGridInstances.forEach((api) => api.destroy?.())
  agGridInstances.clear()
  grid?.destroy(false)
})

// ── Watch for new widgets ──────────────────────────────────────────────────────
watch(
  () => props.widgets.length,
  async (newLen, oldLen) => {
    if (newLen <= oldLen) return // removal handled by removeWidget

    // Wait for Vue to render the new DOM node
    await nextTick()

    const newest = props.widgets[props.widgets.length - 1]
    const el = document.getElementById(`gs-widget-${newest.id}`)
    if (el && grid) {
      grid.makeWidget(el)
    }

    // Initialize content after GridStack positions the widget
    if (newest.vizType !== 'kpi') {
      setTimeout(() => {
        if (newest.vizType === 'table') {
          renderTable(newest.id, newest._data?.rows ?? [])
        } else {
          renderChart(newest.id, newest.vizType, newest._data)
        }
      }, 150)
    }
  },
)

// ── Expose render helpers for parent use (optional) ───────────────────────────
defineExpose({ renderChart, renderTable })
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Empty state -->
    <div v-if="widgets.length === 0" class="empty-state">
      <div class="empty-icon">🧩</div>
      <h3 class="empty-title">No widgets yet</h3>
      <p class="empty-desc">Click "Add Widget" to start building your personalized dashboard.</p>
    </div>

    <!-- Layout guides (visual only) -->
    <div v-if="widgets.length > 0 && layoutColumns.length > 1" class="layout-guides">
      <div
        v-for="(col, idx) in layoutColumns"
        :key="idx"
        class="layout-column"
        :style="{
          left: `${(col.start / 12) * 100}%`,
          width: `${(col.width / 12) * 100}%`,
        }"
      >
        <div class="column-label">Column {{ idx + 1 }}</div>
      </div>
    </div>

    <!-- GridStack container -->
    <div ref="gridEl" class="grid-stack">
      <div
        v-for="w in widgets"
        :key="w.id"
        :id="`gs-widget-${w.id}`"
        class="grid-stack-item"
        :gs-w="w.w"
        :gs-h="w.h"
        :gs-x="w.x"
        :gs-y="w.y"
      >
        <div class="grid-stack-item-content widget-card">
          <!-- Widget Header -->
          <div class="widget-header">
            <div class="widget-drag-handle">
              <DragIcon class="drag-icon" />
              <div class="widget-meta">
                <span class="domain-badge">
                  {{ getDomain(w.domainId)?.icon }}
                  {{ getDomain(w.domainId)?.name }}
                </span>
                <p class="widget-title">{{ getDataset(w.domainId, w.datasetId)?.name }}</p>
                <p class="widget-sub">{{ getVizType(w.vizType)?.name }}</p>
              </div>
            </div>
            <button class="close-btn" @click.stop="$emit('remove-widget', w.id)" title="Remove">
              ✕
            </button>
          </div>

          <!-- Widget Body -->
          <div class="widget-body">
            <!-- KPI Card -->
            <div v-if="w.vizType === 'kpi'" class="kpi-display">
              <span class="kpi-value">{{ w.kpiData.value }}</span>
              <span class="kpi-label">{{ w.kpiData.label }}</span>
              <span class="kpi-change" :class="w.kpiData.trend">{{ w.kpiData.change }}</span>
            </div>
            <!-- Table -->
            <div
              v-else-if="w.vizType === 'table'"
              :id="`ag-table-${w.id}`"
              class="fill ag-theme-quartz-dark"
            />
            <!-- Chart -->
            <div v-else :id="`hc-chart-${w.id}`" class="fill" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  position: relative;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  border: 2px dashed var(--border);
  border-radius: 12px;
}
.empty-icon {
  font-size: 44px;
  margin-bottom: 14px;
  opacity: 0.4;
}
.empty-title {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.empty-desc {
  font-size: 13px;
  color: var(--text-dim);
  max-width: 280px;
  line-height: 1.6;
}

/* Widget card */
.widget-card {
  display: flex;
  flex-direction: column;
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  transition: border-color 0.2s;
}
.widget-card:hover {
  border-color: var(--border-hov) !important;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.widget-drag-handle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  cursor: grab;
}
.widget-drag-handle:active {
  cursor: grabbing;
}
.drag-icon {
  flex-shrink: 0;
  color: var(--text);
}

.widget-meta {
  min-width: 0;
}
.domain-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.widget-title {
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.widget-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.close-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  flex-shrink: 0;
  transition: all 0.15s;
}
.close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: var(--red);
}

.widget-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}
.fill {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

/* KPI */
.kpi-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 12px;
  text-align: center;
}
.kpi-value {
  font-family: 'Syne', sans-serif;
  font-size: 42px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}
.kpi-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}
.kpi-change {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 20px;
}
.kpi-change.up {
  background: rgba(16, 185, 129, 0.14);
  color: var(--green);
}
.kpi-change.down {
  background: rgba(239, 68, 68, 0.14);
  color: var(--red);
}

/* Layout guides */
.layout-guides {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  display: flex;
}

.layout-column {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px dashed rgba(245, 158, 11, 0.2);
  border-right: 1px dashed rgba(245, 158, 11, 0.2);
  background: rgba(245, 158, 11, 0.02);
  transition: all 0.3s;
}

.layout-column:first-child {
  border-left: none;
}

.layout-column:last-child {
  border-right: none;
}

.column-label {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: rgba(245, 158, 11, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--surface);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px dashed rgba(245, 158, 11, 0.2);
  white-space: nowrap;
}

.grid-stack {
  position: relative;
  z-index: 1;
}
</style>
