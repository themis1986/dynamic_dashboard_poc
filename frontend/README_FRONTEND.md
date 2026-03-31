# Frontend Application - Custom Dashboard

## Overview

The frontend is a **Vue 3** single-page application (SPA) built with **Vite** as the build tool and module bundler. It provides a highly interactive, drag-and-drop dashboard interface where users can create, arrange, and visualize widgets from various business domains (Sales, Finance, Marketing, Operations, HR).

---

## Technology Stack

### Core Framework & Build Tools

- **Vue 3.5.31** - Progressive JavaScript framework using Composition API
- **Vite 8.0.3** - Next-generation frontend build tool with lightning-fast HMR
- **Vue Router 5.0.4** - Official routing library for Vue.js
- **Pinia 3.0.4** - Vue's official state management library (currently unused but available)

### UI & Visualization Libraries

- **GridStack.js 12.4.2** - Complete drag-and-drop grid layout system
  - Enables widget resizing, repositioning, and responsive layouts
  - Grid-based positioning system with collision detection
- **Highcharts 12.5.0** - Professional charting library
  - Supports Line, Bar, Column, Area, and Pie charts
  - Highly customizable with theme support
  - Smooth animations and responsive design

- **AG-Grid Community 31.3.2** - Enterprise-grade data grid
  - High-performance table rendering with virtual scrolling
  - Built-in sorting, filtering, and column resizing
  - Used for tabular data visualization

### Development Tools

- **ESLint 10.1.0** + **Prettier 3.8.1** - Code quality and formatting
- **oxlint** - Fast Rust-based linter for additional validation
- **Vite DevTools** - Vue-specific debugging and inspection

---

## Application Architecture

### Component Hierarchy

```
App.vue (Root)
│
├── DashboardGrid.vue
│   ├── GridStack container
│   ├── Widget cards (dynamically rendered)
│   │   ├── Highcharts visualizations (Line, Bar, Pie, Area, Column)
│   │   ├── AG-Grid tables
│   │   └── KPI cards
│   └── Widget controls (remove, drag handle)
│
└── AddWidgetWizard.vue
    ├── Step 1: Domain selection
    ├── Step 2: Dataset selection
    └── Step 3: Visualization type selection
```

### Core Components

#### 1. **App.vue** - Application Root & State Manager

**Responsibilities:**

- Initializes application data on mount
- Fetches domains, datasets, and user's saved dashboard from backend
- Manages global widget state
- Handles widget addition, removal, and layout persistence

**Key Features:**

- **Data Loading Flow:**

  ```javascript
  onMounted(async () => {
    // 1. Fetch all domains
    DOMAINS.value = await api.fetchDomains()

    // 2. Fetch all datasets for each domain
    for (const domain of DOMAINS.value) {
      datasetsMap[domain.id] = await api.fetchDatasets(domain.id)
    }

    // 3. Load user's saved dashboard
    const dashboard = await api.fetchDashboard()

    // 4. Restore widgets with their data
    for (const savedWidget of dashboard.widgets) {
      const data = await api.fetchData(savedWidget.domainId, savedWidget.datasetId)
      widgets.value.push({ ...savedWidget, _data: data })
    }
  })
  ```

- **Widget Management:**
  - `addWidget()` - Creates new widget with fetched data
  - `removeWidget()` - Removes widget and persists state
  - `handleLayoutChange()` - Saves layout changes to backend with 500ms debounce
  - `sizeForVizType()` - Maps visualization types to optimal grid dimensions

- **Auto-save Mechanism:**
  - Debounced layout changes (500ms delay)
  - Saves complete widget configuration including position, size, and data references

**State Management:**

```javascript
const DOMAINS = ref([]) // All available domains
const DATASETS = ref({}) // Datasets grouped by domain
const widgets = ref([]) // Current dashboard widgets
const wizardOpen = ref(false) // Wizard modal state
const loading = ref(true) // Loading indicator
```

---

#### 2. **DashboardGrid.vue** - Grid Layout & Widget Rendering

**Responsibilities:**

- Manages GridStack layout engine
- Renders widgets based on visualization type
- Handles real-time drag-and-drop and resize operations
- Integrates Highcharts and AG-Grid renderers

**GridStack Implementation:**

```javascript
onMounted(() => {
  grid = GridStack.init(
    {
      cellHeight: 60, // Grid cell height in pixels
      margin: 12, // Gap between widgets
      minRow: 1, // Minimum rows
      animate: true, // Smooth animations
      disableOneColumnMode: true, // Always maintain grid layout
    },
    gridEl.value,
  )

  // Listen to layout changes
  grid.on('change', (event, items) => {
    emit('layout-changed', items)
  })
})
```

**Widget Lifecycle Management:**

1. **Mounting Widgets:**
   - Watches `props.widgets` for changes
   - Uses `nextTick()` to ensure DOM is ready
   - Adds widgets to GridStack with position/size data
   - Renders appropriate visualization type

2. **Rendering Visualizations:**
   - **Charts (Highcharts):** Line, Bar, Column, Area, Pie
     - Custom dark theme with carefully tuned colors
     - Responsive chart sizing
     - Animated transitions
   - **Tables (AG-Grid):**
     - Auto-generates column definitions from data
     - Sortable and filterable columns
     - Auto-fits columns to container width
   - **KPI Cards:**
     - Large metric display with trend indicator
     - Shows change percentage and direction

3. **Cleanup:**
   - Destroys AG-Grid instances on widget removal to prevent memory leaks
   - Properly unmounts GridStack on component destruction

**Custom Styling:**

- Dark theme optimized for data visualization
- Subtle gradients and shadows for depth
- Hover effects for interactive elements
- Responsive font sizing

---

#### 3. **AddWidgetWizard.vue** - Multi-Step Widget Creation

**Three-Step Wizard Flow:**

**Step 1: Domain Selection**

```html
<div class="domain-grid">
  <button
    v-for="d in domains"
    :class="{ selected: wizard.domainId === d.id }"
    @click="selectDomain(d.id)"
  >
    <span class="domain-icon">{{ d.icon }}</span>
    <span class="domain-name">{{ d.name }}</span>
    <span class="domain-desc">{{ d.description }}</span>
  </button>
</div>
```

**Step 2: Dataset Selection**

- Filters datasets based on selected domain
- Displays dataset name, description, and tags
- Radio-style selection UI

**Step 3: Visualization Type Selection**

- Shows 7 visualization options:
  - Line Chart, Bar Chart, Column Chart
  - Pie/Donut Chart, Area Chart
  - Data Table, KPI Card
- Each with icon, name, and description

**Features:**

- **Progress Indicator:** Visual stepper showing current step
- **Validation:** "Next" button disabled until valid selection made
- **Reset on Open:** Wizard state resets when modal reopens
- **Smooth Transitions:** Slide-fade animations between steps

**State Management:**

```javascript
const wizard = reactive({
  domainId: null,
  datasetId: null,
  vizType: null,
})

const canProceed = computed(() => {
  if (step.value === 1) return !!wizard.domainId
  if (step.value === 2) return !!wizard.datasetId
  if (step.value === 3) return !!wizard.vizType
  return false
})
```

---

### API Layer

**File:** `src/api/dashboardApi.js`

Centralized API client using native Fetch API with error handling.

**Configuration:**

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const USER_ID = 'user-1' // Placeholder for authentication
```

**API Methods:**

1. **`fetchDomains()`** - Get all business domains

   ```javascript
   GET /api/domains
   Returns: Array<{ id, name, icon, description }>
   ```

2. **`fetchDatasets(domainKey)`** - Get datasets for a domain

   ```javascript
   GET /api/domains/:domainKey/datasets
   Returns: Array<{ id, name, description, tags[] }>
   ```

3. **`fetchData(domainKey, datasetKey)`** - Get data for visualization

   ```javascript
   GET /api/data/:domainKey/:datasetKey
   Returns: { cats[], series[], rows[], kpi }
   ```

4. **`fetchDashboard(userId)`** - Get user's dashboard configuration

   ```javascript
   GET /api/dashboards/:userId
   Returns: { id, userId, name, widgets[] }
   ```

5. **`saveDashboard(widgets, userId)`** - Save dashboard layout
   ```javascript
   POST /api/dashboards/:userId
   Body: { widgets: Array<Widget> }
   Returns: { id, userId, name, widgets[] }
   ```

**Authentication:**

- Uses `Authorization` header with user ID
- Currently hardcoded as 'user-1' for demo purposes
- Production would integrate with OAuth2/JWT authentication

**Error Handling:**

```javascript
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    if (!response.ok) {
      throw new Error(`API Error (${response.status})`)
    }
    return await response.json()
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
    throw error
  }
}
```

---

## Data Flow

### Application Initialization Flow

```
1. User loads application
2. App.vue onMounted() executes
3. Fetch domains → Fetch datasets per domain
4. Fetch user's dashboard configuration
5. For each saved widget:
   - Fetch widget data from API
   - Restore widget to grid with position/size
6. DashboardGrid.vue renders all widgets
7. User can interact with dashboard
```

### Widget Addition Flow

```
1. User clicks "+ Add Widget" button
2. AddWidgetWizard modal opens
3. User selects:
   - Domain (e.g., "Sales")
   - Dataset (e.g., "Monthly Revenue")
   - Viz Type (e.g., "Line Chart")
4. Wizard emits 'add-widget' event
5. App.vue.addWidget() executes:
   - Fetches data from API
   - Creates widget object with data and layout info
   - Adds to widgets array
6. DashboardGrid.vue reactively renders new widget
7. Layout auto-saves to backend
```

### Layout Change Flow

```
1. User drags or resizes widget
2. GridStack fires 'change' event
3. DashboardGrid emits 'layout-changed'
4. App.vue.handleLayoutChange() called
5. Debounced save (500ms) triggers
6. API call to POST /dashboards/:userId
7. Backend persists new layout
```

---

## Styling & Theming

### CSS Architecture

- **Global Styles:** `src/assets/main.css` and `src/assets/base.css`
- **Component-Scoped Styles:** Each `.vue` file has `<style scoped>` section
- **CSS Custom Properties:** Used for consistent theming

**Color Palette (Dark Theme):**

```css
--bg-primary: #0d0f17 /* Main background */ --bg-secondary: #14161f /* Card background */
  --bg-tertiary: #191d2b /* Elevated elements */ --border-color: #252b40 /* Subtle borders */
  --text-primary: #e4e8f7 /* Main text */ --text-secondary: #7c85a8 /* Secondary text */
  --accent: #6366f1 /* Primary accent (indigo) */ --accent-hover: #5558e3 /* Hover state */;
```

**Typography:**

- Primary font: "DM Sans" (modern sans-serif)
- Fallback: system-ui, sans-serif
- Font weights: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)

### Highcharts Theme Customization

Custom theme applied to all Highcharts visualizations:

- Transparent chart background for seamless integration
- Custom color palette: `['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']`
- Dark-themed tooltips and legends
- Smooth animations (600ms duration)
- Rounded column/bar corners (4px border radius)

---

## Build & Development

### Available Scripts

```json
{
  "dev": "vite", // Start dev server (http://localhost:5173)
  "build": "vite build", // Production build to /dist
  "preview": "vite preview", // Preview production build
  "lint": "run-s lint:*", // Run all linters
  "lint:oxlint": "oxlint . --fix", // Fast Rust linter
  "lint:eslint": "eslint . --fix", // ESLint with auto-fix
  "format": "prettier --write src/" // Format code
}
```

### Development Server

**Start Command:**

```bash
npm run dev
```

**Configuration (vite.config.js):**

- Dev server runs on `http://localhost:5173`
- Hot Module Replacement (HMR) enabled
- Vue DevTools plugin integrated
- Path alias: `@` → `src/`

**Environment Variables:**
Create `.env` file in frontend root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Production Build

**Build Process:**

```bash
npm run build
```

**Output:**

- Compiled assets in `/dist` directory
- JavaScript and CSS minified and bundled
- Assets hashed for cache busting
- Source maps generated for debugging

**Build Optimizations:**

- Tree-shaking to remove unused code
- Code splitting for lazy loading
- Asset optimization (images, fonts)
- Minification with Terser

---

## Performance Considerations

### Optimization Strategies

1. **Virtual Scrolling (AG-Grid):**
   - Only renders visible rows
   - Handles large datasets efficiently

2. **Debounced API Calls:**
   - Layout saves debounced to 500ms
   - Prevents excessive backend requests

3. **Component-Level Code Splitting:**
   - Ready for dynamic imports if needed
   - Can lazy-load heavy visualization libraries

4. **Memory Management:**
   - AG-Grid instances destroyed on widget removal
   - Highcharts charts properly disposed
   - GridStack cleanup on unmount

5. **Reactive Efficiency:**
   - Uses `ref()` for primitives and `reactive()` for objects
   - Computed properties for derived state
   - Watchers only where necessary

### Browser Compatibility

**Target Browsers:**

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Modern JavaScript Features Used:**

- ES Modules (ESM)
- Async/await
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Template literals

---

## File Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/
│   │   └── dashboardApi.js       # API client layer
│   ├── assets/
│   │   ├── base.css              # CSS reset & variables
│   │   └── main.css              # Global styles
│   ├── components/               # Reusable components (empty currently)
│   ├── router/
│   │   └── index.js              # Vue Router configuration
│   ├── views/
│   │   └── HomeView.vue          # Main dashboard view (wrapper)
│   ├── App.vue                   # Root component & state
│   ├── DashboardGrid.vue         # Grid layout manager
│   ├── AddWidgetWizard.vue       # Widget creation wizard
│   ├── constants.js              # App constants (if needed)
│   └── main.js                   # Application entry point
├── index.html                    # HTML entry point
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies & scripts
└── README.md                     # This file
```

---

## Future Enhancements

### Potential Improvements

1. **Authentication & Multi-User:**
   - Integrate OAuth2 or JWT authentication
   - User profile management
   - Shared dashboards

2. **Advanced Visualizations:**
   - Heatmaps, scatter plots, gauges
   - Real-time data streaming with WebSockets
   - Custom chart configurations per widget

3. **Dashboard Management:**
   - Multiple dashboards per user
   - Dashboard templates
   - Export/import dashboard configurations

4. **Collaboration:**
   - Dashboard sharing with permissions
   - Comments and annotations
   - Activity feed

5. **Performance:**
   - Service worker for offline support
   - Progressive Web App (PWA) capabilities
   - Implement Pinia for more complex state management

6. **Accessibility:**
   - ARIA labels for screen readers
   - Keyboard navigation for all interactions
   - High-contrast theme option

---

## Troubleshooting

### Common Issues

**Issue: Widgets not loading**

- Check browser console for API errors
- Verify backend is running on `http://localhost:3000`
- Check CORS configuration in backend

**Issue: Layout not saving**

- Check network tab for failed POST requests
- Verify Authorization header is being sent
- Check backend database write permissions

**Issue: Charts not rendering**

- Ensure Highcharts container has non-zero dimensions
- Check browser console for Highcharts errors
- Verify data format matches expected structure

**Issue: GridStack drag/drop not working**

- Check for JavaScript errors in console
- Verify GridStack CSS is loaded
- Clear browser cache and reload

---

## Development Guidelines

### Code Style

- Use Composition API (`setup` script)
- Prefer `const` over `let` unless reassignment needed
- Use descriptive variable names
- Keep components focused and single-purpose
- Add comments for complex logic

### Component Design

- Keep components under 300 lines when possible
- Extract reusable logic into composables
- Use props for parent-to-child communication
- Use events for child-to-parent communication
- Avoid prop drilling (use provide/inject if needed)

### Testing (Future)

- Unit tests with Vitest
- Component tests with Vue Test Utils
- E2E tests with Playwright/Cypress

---

## Dependencies Deep Dive

### Production Dependencies

| Package           | Version | Purpose            |
| ----------------- | ------- | ------------------ |
| vue               | 3.5.31  | Core framework     |
| vue-router        | 5.0.4   | Routing            |
| pinia             | 3.0.4   | State management   |
| gridstack         | 12.4.2  | Grid layout engine |
| highcharts        | 12.5.0  | Chart library      |
| ag-grid-community | 31.3.2  | Data grid          |

### Development Dependencies

| Package            | Version | Purpose             |
| ------------------ | ------- | ------------------- |
| vite               | 8.0.3   | Build tool          |
| @vitejs/plugin-vue | 6.0.5   | Vue plugin for Vite |
| eslint             | 10.1.0  | JavaScript linter   |
| prettier           | 3.8.1   | Code formatter      |
| oxlint             | 1.57.0  | Fast Rust linter    |

---

## Contact & Support

For questions or issues related to the frontend application, consult:

- Vue 3 documentation: https://vuejs.org/
- Vite documentation: https://vitejs.dev/
- GridStack documentation: https://gridstackjs.com/
- Highcharts API: https://api.highcharts.com/

---

**Last Updated:** March 2026  
**Application Version:** 0.0.0
