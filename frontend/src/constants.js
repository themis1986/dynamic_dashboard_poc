// ── Domain reference data ─────────────────────────────────────────────────────
export const DOMAINS = [
  {
    id: 'sales',
    name: 'Sales',
    icon: '📈',
    description: 'Revenue, pipeline & product performance',
  },
  { id: 'finance', name: 'Finance', icon: '💰', description: 'P&L, budgets & cash flow analysis' },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📣',
    description: 'Campaigns, channels & conversion funnels',
  },
  {
    id: 'operations',
    name: 'Operations',
    icon: '⚙️',
    description: 'Inventory, fulfillment & supplier metrics',
  },
  {
    id: 'hr',
    name: 'Human Resources',
    icon: '👥',
    description: 'Headcount, attrition & satisfaction',
  },
]

// ── Dataset reference data ────────────────────────────────────────────────────
export const DATASETS = {
  sales: [
    {
      id: 'monthly_rev',
      name: 'Monthly Revenue',
      description: '12-month revenue vs. target',
      tags: ['Revenue', 'KPI'],
    },
    {
      id: 'top_products',
      name: 'Top Products',
      description: 'Best-performing products',
      tags: ['Products'],
    },
    { id: 'pipeline', name: 'Sales Pipeline', description: 'Deals by stage', tags: ['Pipeline'] },
    {
      id: 'regional',
      name: 'Regional Performance',
      description: 'Revenue by region',
      tags: ['Geo'],
    },
  ],
  finance: [
    { id: 'pnl', name: 'P&L Summary', description: 'Monthly income & expenses', tags: ['P&L'] },
    {
      id: 'budget',
      name: 'Budget vs Actual',
      description: 'Dept-level adherence',
      tags: ['Budget'],
    },
    { id: 'cashflow', name: 'Cash Flow', description: 'Weekly inflow/outflow', tags: ['Cash'] },
  ],
  marketing: [
    {
      id: 'campaigns',
      name: 'Campaign Performance',
      description: 'Impressions, clicks, conversions',
      tags: ['Campaigns'],
    },
    {
      id: 'channels',
      name: 'Channel Attribution',
      description: 'Traffic by channel',
      tags: ['Attribution'],
    },
    {
      id: 'funnel',
      name: 'Funnel Analysis',
      description: 'Stage-by-stage drop-off',
      tags: ['Funnel'],
    },
  ],
  operations: [
    {
      id: 'inventory',
      name: 'Inventory Levels',
      description: 'Stock vs reorder levels',
      tags: ['Inventory'],
    },
    {
      id: 'fulfillment',
      name: 'Order Fulfillment',
      description: 'Fulfilled and pending orders',
      tags: ['Orders'],
    },
    {
      id: 'suppliers',
      name: 'Supplier Performance',
      description: 'On-time and quality scores',
      tags: ['Suppliers'],
    },
  ],
  hr: [
    {
      id: 'headcount',
      name: 'Headcount by Dept',
      description: 'Current staff & open roles',
      tags: ['Headcount'],
    },
    {
      id: 'attrition',
      name: 'Attrition Rate',
      description: 'Quarterly attrition & hires',
      tags: ['Attrition'],
    },
    {
      id: 'satisfaction',
      name: 'Employee Satisfaction',
      description: 'Monthly eNPS scores',
      tags: ['eNPS'],
    },
  ],
}

// ── Visualization types ───────────────────────────────────────────────────────
export const VIZ_TYPES = [
  { id: 'line', name: 'Line Chart', icon: '📉', desc: 'Trends over time' },
  { id: 'bar', name: 'Bar Chart', icon: '📊', desc: 'Compare categories' },
  { id: 'column', name: 'Column Chart', icon: '📶', desc: 'Vertical bars' },
  { id: 'pie', name: 'Pie / Donut', icon: '🥧', desc: 'Part-to-whole' },
  { id: 'area', name: 'Area Chart', icon: '🏔️', desc: 'Volume & trends' },
  { id: 'table', name: 'Data Table', icon: '📋', desc: 'Detailed rows' },
  { id: 'kpi', name: 'KPI Card', icon: '🎯', desc: 'Single metric' },
]

// ── Highcharts theme ──────────────────────────────────────────────────────────
export const HC_THEME = {
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

// ── Mock data generator (replace with real API calls in production) ───────────
export function getMockData(domainId, datasetId) {
  const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  return {
    cats: months,
    series: [
      { name: 'Value A', data: months.map(() => r(100, 500)) },
      { name: 'Value B', data: months.map(() => r(80, 450)) },
    ],
    rows: months.map((m) => ({ Month: m, ValueA: r(100, 500), ValueB: r(80, 450) })),
    kpi: {
      value: `$${r(1, 9)}.${r(1, 9)}M`,
      label: `${domainId} · ${datasetId}`,
      change: `+${r(1, 20)}% MoM`,
      trend: 'up',
    },
  }
}

// ── Widget sizing configuration ───────────────────────────────────────────────
export function sizeForVizType(vizType) {
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

// ── Wizard steps configuration ────────────────────────────────────────────────
export const WIZARD_STEPS = [
  { id: 1, label: 'Choose Domain' },
  { id: 2, label: 'Select Dataset' },
  { id: 3, label: 'Pick Visualization' },
]
