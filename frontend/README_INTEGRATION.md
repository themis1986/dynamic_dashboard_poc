# Custom Dashboard Application - Full-Stack Integration

## Overview

This is a **full-stack custom dashboard application** that enables users to create, customize, and persist interactive data visualizations. The application combines a **Vue 3 frontend** with a **NestJS backend** to deliver a seamless, modern dashboard experience with drag-and-drop widgets, real-time data visualization, and automatic state persistence.

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                     (Vue 3 + Vite)                          │
│                   Port: 5173                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App.vue   │  │ DashboardGrid│  │AddWidgetWizard│     │
│  │  (Manager)  │  │   (Layout)   │  │   (Creator)   │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                │                  │               │
│         └────────────────┴──────────────────┘               │
│                          │                                  │
│                    ┌─────▼──────┐                          │
│                    │  API Layer │                           │
│                    │(dashboardApi.js)                       │
│                    └─────┬──────┘                           │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP/REST
                           │ CORS Enabled
                           │ Authorization Header
┌──────────────────────────▼──────────────────────────────────┐
│                         BACKEND                             │
│                     (NestJS + TypeORM)                      │
│                   Port: 3000                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Domains  │  │ Datasets │  │   Data   │  │ Dashboards │ │
│  │ Module   │  │  Module  │  │  Module  │  │   Module   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘ │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                          │                                  │
│                    ┌─────▼──────┐                          │
│                    │  TypeORM   │                           │
│                    │(Repository)│                           │
│                    └─────┬──────┘                           │
│                          │                                  │
│                    ┌─────▼──────┐                          │
│                    │   SQLite   │                           │
│                    │  Database  │                           │
│                    └────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Summary

### Frontend Technologies

| Technology       | Version | Purpose                                               |
| ---------------- | ------- | ----------------------------------------------------- |
| **Vue 3**        | 3.5.31  | Progressive JavaScript framework with Composition API |
| **Vite**         | 8.0.3   | Lightning-fast build tool with HMR                    |
| **Vue Router**   | 5.0.4   | Client-side routing                                   |
| **GridStack.js** | 12.4.2  | Drag-and-drop grid layout system                      |
| **Highcharts**   | 12.5.0  | Professional charting library                         |
| **AG-Grid**      | 31.3.2  | Enterprise data grid for tables                       |
| **Pinia**        | 3.0.4   | Vue's official state management                       |

### Backend Technologies

| Technology          | Version | Purpose                                |
| ------------------- | ------- | -------------------------------------- |
| **NestJS**          | 11.1.17 | Enterprise Node.js framework           |
| **TypeORM**         | 0.3.28  | TypeScript ORM for database operations |
| **SQLite**          | 5.1.7   | Embedded relational database           |
| **class-validator** | 0.15.1  | DTO validation                         |
| **cache-manager**   | 7.2.8   | In-memory caching layer                |
| **Express**         | -       | HTTP server (via NestJS)               |

---

## Integration Points

### 1. Authentication Flow

**Current Implementation (Development):**

```
┌─────────┐                           ┌─────────┐
│Frontend │                           │Backend  │
└────┬────┘                           └────┬────┘
     │                                     │
     │ 1. User loads dashboard             │
     │─────────────────────────────────────│
     │                                     │
     │ 2. API Request with                 │
     │    Authorization: 'user-1'          │
     │────────────────────────────────────▶│
     │                                     │
     │                                3. AuthGuard validates
     │                                   header & extracts userId
     │                                     │
     │                                4. Request processed
     │                                   with userId attached
     │                                     │
     │ 5. Response with data               │
     │◀────────────────────────────────────│
     │                                     │
```

**Frontend (dashboardApi.js):**

```javascript
const USER_ID = "user-1"; // Hardcoded for demo

async function apiRequest(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: USER_ID, // Sent with every request
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  return response.json();
}
```

**Backend (auth.guard.ts):**

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const userId = authHeader.replace("Bearer ", "").trim();
    request.userId = userId; // Attach to request

    return true;
  }
}
```

**Production Recommendations:**

- Implement JWT (JSON Web Tokens)
- Add OAuth2 integration (Google, Microsoft, Auth0)
- Use secure token storage (httpOnly cookies or localStorage with XSS protection)
- Implement token refresh mechanism
- Add role-based access control (RBAC)

---

### 2. Data Flow: Application Initialization

**Complete Initialization Sequence:**

```
┌─────────┐                           ┌─────────┐                ┌──────────┐
│Frontend │                           │Backend  │                │Database  │
└────┬────┘                           └────┬────┘                └────┬─────┘
     │                                     │                          │
     │ User opens browser                  │                          │
     │ App.vue onMounted() executes        │                          │
     │                                     │                          │
     │ 1. GET /api/domains                 │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 2. Query domains table   │
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 3. Return domains        │
     │                                     │◀─────────────────────────│
     │ 4. [Sales, Finance, Marketing...]   │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
     │ 5. For each domain:                 │                          │
     │    GET /api/domains/:key/datasets   │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 6. Query datasets table  │
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 7. Return filtered datasets
     │                                     │◀─────────────────────────│
     │ 8. Dataset arrays per domain        │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
     │ 9. GET /api/dashboards/user-1       │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 10. Query dashboard + widgets
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 11. Return config        │
     │                                     │◀─────────────────────────│
     │                                     │                          │
     │                                     │ 12. Convert DB IDs to keys
     │                                     │     (domain.id → domain.key)
     │                                     │                          │
     │ 13. Dashboard with widgets          │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
     │ 14. For each saved widget:          │                          │
     │     GET /api/data/:domain/:dataset  │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 15. Check cache          │
     │                                     │     (5-min TTL)          │
     │                                     │                          │
     │                                     │ 16. If miss: generate data
     │                                     │     If hit: return cached│
     │                                     │                          │
     │ 17. { cats, series, rows, kpi }     │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
     │ 18. Render all widgets on grid      │                          │
     │                                     │                          │
```

**Frontend Code (App.vue):**

```javascript
onMounted(async () => {
  loading.value = true;

  // Step 1: Load domains
  DOMAINS.value = await api.fetchDomains();

  // Step 2: Load all datasets
  const datasetsMap = {};
  for (const domain of DOMAINS.value) {
    datasetsMap[domain.id] = await api.fetchDatasets(domain.id);
  }
  DATASETS.value = datasetsMap;

  // Step 3: Load user's dashboard
  const dashboard = await api.fetchDashboard();

  // Step 4: Restore widgets with data
  if (dashboard?.widgets) {
    for (const savedWidget of dashboard.widgets) {
      const data = await api.fetchData(
        savedWidget.domainId,
        savedWidget.datasetId,
      );
      widgets.value.push({ ...savedWidget, _data: data });
    }
  }

  loading.value = false;
});
```

**Backend Code (dashboards.service.ts):**

```typescript
async getDashboard(userId: string) {
  let dashboard = await this.dashboardsRepository.findOne({
    where: { userId },
    relations: ['widgets']
  })

  if (!dashboard) {
    // Create empty dashboard for new user
    dashboard = this.dashboardsRepository.create({
      userId,
      name: 'My Dashboard',
      widgets: []
    })
    await this.dashboardsRepository.save(dashboard)
  }

  // Convert database IDs to keys for frontend
  const domains = await this.domainsRepository.find()
  const datasets = await this.datasetsRepository.find()

  const domainMap = new Map(domains.map(d => [d.id, d.key]))
  const datasetMap = new Map(datasets.map(d => [d.id, d.key]))

  return {
    id: dashboard.id,
    userId: dashboard.userId,
    name: dashboard.name,
    widgets: dashboard.widgets.map(w => ({
      id: w.id,
      domainId: domainMap.get(w.domainId),  // ID → key
      datasetId: datasetMap.get(w.datasetId), // ID → key
      vizType: w.vizType,
      x: w.x, y: w.y, w: w.w, h: w.h
    }))
  }
}
```

---

### 3. Data Flow: Widget Creation

**Complete Widget Addition Flow:**

```
┌─────────┐                           ┌─────────┐                ┌──────────┐
│Frontend │                           │Backend  │                │Database  │
└────┬────┘                           └────┬────┘                └────┬─────┘
     │                                     │                          │
     │ User clicks "+ Add Widget"          │                          │
     │ Wizard modal opens                  │                          │
     │                                     │                          │
     │ Step 1: Select domain (Sales)       │                          │
     │ Step 2: Select dataset (Monthly Revenue)                      │
     │ Step 3: Select viz type (Line Chart)│                          │
     │                                     │                          │
     │ User clicks "Add Widget"            │                          │
     │                                     │                          │
     │ 1. GET /api/data/sales/monthly_rev  │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 2. Check cache           │
     │                                     │    Key: data:sales:monthly_rev:user-1
     │                                     │                          │
     │                                     │ 3. Cache MISS            │
     │                                     │                          │
     │                                     │ 4. Verify domain exists  │
     │                                     │─────────────────────────▶│
     │                                     │◀─────────────────────────│
     │                                     │                          │
     │                                     │ 5. Verify dataset exists │
     │                                     │─────────────────────────▶│
     │                                     │◀─────────────────────────│
     │                                     │                          │
     │                                     │ 6. Generate mock data    │
     │                                     │    { cats, series, rows, kpi }
     │                                     │                          │
     │                                     │ 7. Store in cache (5 min)│
     │                                     │                          │
     │ 8. Return data                      │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
     │ 9. Create widget object:            │                          │
     │    {                                │                          │
     │      id: ++counter,                 │                          │
     │      domainId: 'sales',             │                          │
     │      datasetId: 'monthly_rev',      │                          │
     │      vizType: 'line',               │                          │
     │      x: 0, y: 0, w: 6, h: 5,        │                          │
     │      _data: { ... }                 │                          │
     │    }                                │                          │
     │                                     │                          │
     │ 10. Add to widgets array            │                          │
     │     (Vue reactivity triggers)       │                          │
     │                                     │                          │
     │ 11. DashboardGrid watches widgets   │                          │
     │     Renders new widget with Highcharts│                        │
     │                                     │                          │
     │ 12. GridStack 'change' event fires  │                          │
     │     (new widget added to grid)      │                          │
     │                                     │                          │
     │ 13. handleLayoutChange() called     │                          │
     │     (debounced 500ms)               │                          │
     │                                     │                          │
     │ 14. POST /api/dashboards/user-1     │                          │
     │     Body: { widgets: [...] }        │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 15. DELETE all widgets   │
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 16. Convert keys to IDs  │
     │                                     │     'sales' → domain.id  │
     │                                     │─────────────────────────▶│
     │                                     │◀─────────────────────────│
     │                                     │                          │
     │                                     │ 17. INSERT new widgets   │
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │ 18. Dashboard saved successfully    │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
```

**Frontend Code (App.vue):**

```javascript
async function addWidget({ domainId, datasetId, vizType }) {
  // Step 1: Fetch data
  const data = await api.fetchData(domainId, datasetId);

  // Step 2: Create widget object
  const newWidget = {
    id: ++widgetCounter,
    domainId,
    datasetId,
    vizType,
    ...sizeForVizType(vizType), // { w: 6, h: 5 }
    x: 0,
    y: 0,
    kpiData: data.kpi,
    _data: data,
  };

  // Step 3: Add to widgets (triggers reactivity)
  widgets.value.push(newWidget);

  // Step 4: Auto-save handled by layout change listener
}

// Debounced save function
const handleLayoutChange = debounce(async (items) => {
  const layoutData = items.map((item) => {
    const widget = widgets.value.find((w) => w.id === parseInt(item.id));
    return {
      id: widget.id,
      domainId: widget.domainId,
      datasetId: widget.datasetId,
      vizType: widget.vizType,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    };
  });

  await api.saveDashboard(layoutData);
}, 500);
```

**Backend Code (dashboards.service.ts):**

```typescript
async saveDashboard(userId: string, widgets: any[]) {
  let dashboard = await this.dashboardsRepository.findOne({
    where: { userId },
    relations: ['widgets']
  })

  // Delete all existing widgets
  await this.widgetsRepository
    .createQueryBuilder()
    .delete()
    .where('dashboardId = :dashboardId', { dashboardId: dashboard.id })
    .execute()

  // Convert keys to database IDs
  const newWidgets = await Promise.all(
    widgets.map(async (w) => {
      const domain = await this.domainsRepository.findOne({
        where: { key: w.domainId }
      })
      const dataset = await this.datasetsRepository.findOne({
        where: { key: w.datasetId }
      })

      return {
        dashboardId: dashboard.id,
        domainId: domain.id,        // key → ID
        datasetId: dataset.id,      // key → ID
        vizType: w.vizType,
        x: w.x, y: w.y, w: w.w, h: w.h
      }
    })
  )

  // Insert new widgets
  if (newWidgets.length > 0) {
    await this.widgetsRepository.insert(newWidgets)
  }

  return this.getDashboard(userId)
}
```

---

### 4. Data Flow: Layout Changes (Drag/Resize)

**Real-Time Layout Persistence:**

```
┌─────────┐                           ┌─────────┐                ┌──────────┐
│Frontend │                           │Backend  │                │Database  │
└────┬────┘                           └────┬────┘                └────┬─────┘
     │                                     │                          │
     │ User drags widget                   │                          │
     │ or resizes widget                   │                          │
     │                                     │                          │
     │ 1. GridStack 'change' event         │                          │
     │    { id, x, y, w, h }               │                          │
     │                                     │                          │
     │ 2. DashboardGrid emits              │                          │
     │    'layout-changed' event           │                          │
     │                                     │                          │
     │ 3. App.vue receives event           │                          │
     │    handleLayoutChange() called      │                          │
     │                                     │                          │
     │ 4. Wait 500ms (debounce)            │                          │
     │    (ignores rapid changes)          │                          │
     │                                     │                          │
     │ 5. POST /api/dashboards/user-1      │                          │
     │────────────────────────────────────▶│                          │
     │                                     │ 6. Begin transaction     │
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 7. DELETE old widgets    │
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 8. INSERT new widgets    │
     │                                     │    (with updated x,y,w,h)│
     │                                     │─────────────────────────▶│
     │                                     │                          │
     │                                     │ 9. Commit transaction    │
     │                                     │◀─────────────────────────│
     │                                     │                          │
     │ 10. Success response                │                          │
     │◀────────────────────────────────────│                          │
     │                                     │                          │
     │ No UI update needed                 │                          │
     │ (UI already reflects change)        │                          │
     │                                     │                          │
```

**Frontend Code (DashboardGrid.vue):**

```javascript
onMounted(() => {
  grid = GridStack.init(
    {
      cellHeight: 60,
      margin: 12,
      animate: true,
    },
    gridEl.value,
  );

  // Listen for any layout changes
  grid.on("change", (event, items) => {
    emit("layout-changed", items);
  });
});
```

**Debouncing Explanation:**

- GridStack fires many 'change' events during drag operations
- Debouncing (500ms) ensures we only save after user finishes action
- Prevents API spam and database thrashing
- Improves user experience with reduced network traffic

---

### 5. Caching Strategy

**Backend Caching Implementation:**

```typescript
// In data.service.ts
async getData(domainKey: string, datasetKey: string, userId: string) {
  const cacheKey = `data:${domainKey}:${datasetKey}:${userId}`

  // Try cache first
  const cached = await this.cacheManager.get(cacheKey)
  if (cached) {
    return cached  // Cache HIT
  }

  // Cache MISS: generate data
  const result = this.generateMockData(domainKey, datasetKey)

  // Store in cache (TTL: 5 minutes)
  await this.cacheManager.set(cacheKey, result)

  return result
}
```

**Cache Configuration:**

```typescript
// In app.module.ts
CacheModule.register({
  isGlobal: true,
  ttl: 300000, // 5 minutes = 300,000 ms
  max: 100, // Max 100 items in cache
});
```

**Cache Benefits:**

- **Performance:** Instant responses for cached data
- **Reduced Load:** Less database/API queries
- **Scalability:** Can handle more concurrent users
- **Cost Savings:** Fewer external API calls (in production)

**Production Caching:**

```typescript
// Use Redis for distributed caching
import * as redisStore from "cache-manager-redis-store";

CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  ttl: 300,
});
```

---

## Communication Protocol

### HTTP REST API

**Base URL:**

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api`

### Request/Response Format

**All API requests:**

```http
GET /api/domains HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: user-1
```

**Standard Success Response:**

```json
{
  "data": [...],
  "statusCode": 200
}
```

**Standard Error Response:**

```json
{
  "statusCode": 404,
  "message": "Domain 'invalid' not found",
  "error": "Not Found"
}
```

### CORS Configuration

**Backend CORS Setup:**

```typescript
// In main.ts
app.enableCors({
  origin: "http://localhost:5173", // Frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
```

**Why CORS is Needed:**

- Frontend (5173) and backend (3000) are different origins
- Browser security blocks cross-origin requests by default
- CORS headers allow frontend to access backend APIs

---

## Complete API Reference

### Domain Operations

| Method | Endpoint                     | Auth | Description              |
| ------ | ---------------------------- | ---- | ------------------------ |
| GET    | `/api/domains`               | No   | List all domains         |
| GET    | `/api/domains/:key/datasets` | No   | List datasets for domain |

### Data Operations

| Method | Endpoint                     | Auth | Description              |
| ------ | ---------------------------- | ---- | ------------------------ |
| GET    | `/api/data/:domain/:dataset` | Yes  | Fetch visualization data |

### Dashboard Operations

| Method | Endpoint                  | Auth | Description           |
| ------ | ------------------------- | ---- | --------------------- |
| GET    | `/api/dashboards/:userId` | Yes  | Get user's dashboard  |
| POST   | `/api/dashboards/:userId` | Yes  | Save dashboard config |

---

## Development Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd custom-dashboard-app

# Install backend dependencies
cd backend
npm install
npm run seed  # Seed database with initial data

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Running the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev
```

**Output:**

```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [RoutesResolver] DomainsController {/api/domains}
[Nest] LOG [RoutesResolver] DataController {/api/data}
[Nest] LOG [RoutesResolver] DashboardsController {/api/dashboards}
🚀  Backend API is running on: http://localhost:3000/api
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

**Output:**

```
VITE v8.0.3  ready in 342 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Accessing the Application

1. Open browser: `http://localhost:5173`
2. Dashboard loads with any previously saved widgets
3. Click "+ Add Widget" to create new visualizations
4. Drag and resize widgets—changes auto-save
5. Refresh page—layout persists

### 4. Development Tools

**Frontend DevTools:**

- Vue DevTools (Chrome/Firefox extension)
- Vite HMR (instant updates on file save)
- Browser console for debugging

**Backend DevTools:**

- NestJS CLI for code generation
- TypeORM logging for SQL queries
- SQLite Browser for database inspection

---

## Project Structure

```
custom-dashboard-app/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── decorators/        # Custom decorators (@UserId)
│   │   ├── entities/          # TypeORM entities
│   │   ├── guards/            # Authentication guards
│   │   ├── modules/           # Feature modules
│   │   │   ├── dashboards/
│   │   │   ├── data/
│   │   │   ├── datasets/
│   │   │   └── domains/
│   │   ├── app.module.ts      # Root module
│   │   ├── main.ts            # Application entry
│   │   └── seed.ts            # Database seeder
│   ├── dashboard.sqlite       # SQLite database file
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                   # Vue 3 frontend application
│   ├── src/
│   │   ├── api/               # API client layer
│   │   ├── assets/            # Global styles
│   │   ├── components/        # Reusable components
│   │   ├── router/            # Vue Router config
│   │   ├── views/             # Page components
│   │   ├── App.vue            # Root component
│   │   ├── DashboardGrid.vue  # Grid layout component
│   │   ├── AddWidgetWizard.vue # Widget creator
│   │   └── main.js            # Application entry
│   ├── public/                # Static assets
│   ├── index.html             # HTML template
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
└── README.md                   # This file (integration docs)
```

---

## Key Integration Patterns

### 1. ID Mapping (Key ↔ Database ID)

**Problem:** Frontend uses human-readable keys ('sales', 'monthly_rev'), database uses numeric IDs

**Solution:** Backend converts between keys and IDs

**Frontend → Backend (Save):**

```javascript
// Frontend sends
{
  domainId: 'sales',
  datasetId: 'monthly_rev'
}

// Backend converts to
{
  domainId: 1,  // WHERE key = 'sales'
  datasetId: 5  // WHERE key = 'monthly_rev'
}
```

**Backend → Frontend (Load):**

```typescript
// Database has
{
  domainId: 1,
  datasetId: 5
}

// Backend converts to
{
  domainId: 'sales',      // FROM domains WHERE id = 1
  datasetId: 'monthly_rev' // FROM datasets WHERE id = 5
}
```

### 2. State Synchronization

**Frontend State:**

- `widgets` array in App.vue
- Reactive Vue refs for automatic UI updates

**Backend State:**

- `widgets` table in SQLite database
- Persistent storage survives server restarts

**Synchronization Strategy:**

- Frontend is source of truth during session
- Backend persists on layout changes (debounced)
- On page reload, backend state restores frontend

### 3. Optimistic UI Updates

**Pattern:**

- UI updates immediately when user drags widget
- Save happens in background (500ms debounced)
- If save fails, show error but UI already updated
- No save confirmation needed for smooth UX

**Implementation:**

```javascript
// UI updates instantly via GridStack
grid.on("change", (event, items) => {
  // Items already updated in UI
  emit("layout-changed", items);
});

// Background save (doesn't block UI)
const handleLayoutChange = debounce(async (items) => {
  try {
    await api.saveDashboard(items);
    // Success: no UI change needed
  } catch (error) {
    // Error: show toast notification
    console.error("Failed to save layout", error);
  }
}, 500);
```

---

## Data Models

### Domain Model

```typescript
// Backend Entity
@Entity('domains')
class Domain {
  id: number          // Primary key
  key: string         // 'sales', 'finance' (unique)
  name: string        // 'Sales', 'Finance'
  icon: string        // '📈', '💰'
  description: string
}

// Frontend API Response
{
  id: 'sales',        // Uses 'key' field as 'id'
  name: 'Sales',
  icon: '📈',
  description: 'Revenue, pipeline & product performance'
}
```

### Dataset Model

```typescript
// Backend Entity
@Entity('datasets')
class Dataset {
  id: number          // Primary key
  domainId: number    // Foreign key → domains.id
  key: string         // 'monthly_rev'
  name: string        // 'Monthly Revenue'
  description: string
  tags: string[]
}

// Frontend API Response
{
  id: 'monthly_rev',
  name: 'Monthly Revenue',
  description: '12-month revenue vs. target',
  tags: ['Revenue', 'KPI']
}
```

### Widget Model

```typescript
// Backend Entity
@Entity('widgets')
class Widget {
  id: number          // Primary key
  dashboardId: number // Foreign key → dashboards.id
  domainId: number    // Foreign key → domains.id
  datasetId: number   // Foreign key → datasets.id
  vizType: string     // 'line', 'bar', 'pie', etc.
  x: number           // Grid X position
  y: number           // Grid Y position
  w: number           // Grid width
  h: number           // Grid height
}

// Frontend API Response (after key conversion)
{
  id: 1,
  domainId: 'sales',        // Converted from domain.id
  datasetId: 'monthly_rev', // Converted from dataset.id
  vizType: 'line',
  x: 0, y: 0, w: 6, h: 5
}

// Frontend Runtime (with data attached)
{
  ...widget,
  _data: {              // Fetched separately
    cats: [...],
    series: [...],
    rows: [...],
    kpi: {...}
  }
}
```

---

## Error Handling & Resilience

### Frontend Error Handling

```javascript
// API layer wrapper
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error; // Re-throw for caller to handle
  }
}

// Component error handling
try {
  const data = await api.fetchData(domainId, datasetId);
  // Success path
} catch (error) {
  console.error("Failed to load widget data:", error);
  // Show error toast/notification to user
}
```

### Backend Error Handling

```typescript
// Custom exceptions
if (!domain) {
  throw new NotFoundException(`Domain '${domainKey}' not found`)
}

// Global exception filter (built-in)
// Returns standardized error responses
{
  "statusCode": 404,
  "message": "Domain 'invalid' not found",
  "error": "Not Found"
}
```

### Retry Logic (Production Recommendation)

```javascript
// Implement exponential backoff for failed requests
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
    }
  }
}
```

---

## Performance Optimization

### Frontend Optimizations

1. **Debounced Layout Saves** (500ms)
   - Reduces API calls during drag operations
   - Improves responsiveness

2. **Component-Level Rendering**
   - Vue reactive system only updates changed widgets
   - GridStack efficiently handles DOM updates

3. **Lazy Loading** (Future)
   - Code split heavy libraries (Highcharts, AG-Grid)
   - Load on-demand per visualization type

4. **Virtual Scrolling** (AG-Grid built-in)
   - Only renders visible table rows
   - Handles thousands of rows efficiently

### Backend Optimizations

1. **Caching Layer**
   - 5-minute TTL for data endpoints
   - Reduces data generation overhead
   - Can scale to Redis for multi-instance deployments

2. **Database Indexing**
   - Primary keys automatically indexed
   - Add indexes on frequently queried columns:

     ```typescript
     @Index(['userId'])
     @Column()
     userId: string

     @Index(['key'])
     @Column()
     key: string
     ```

3. **Query Optimization**
   - Use `relations` to eager-load related entities
   - Avoid N+1 query problems
   - Consider pagination for large result sets

4. **Connection Pooling** (Production)
   ```typescript
   TypeOrmModule.forRoot({
     // ...
     extra: {
       connectionLimit: 10,
     },
   });
   ```

---

## Security Considerations

### Current Implementation (Development)

- ❌ No password authentication
- ❌ No HTTPS enforcement
- ✅ Basic header-based user identification
- ✅ CORS configured correctly
- ✅ Input validation via DTOs

### Production Security Checklist

#### Authentication & Authorization

- [ ] Implement JWT token-based authentication
- [ ] Add OAuth2 integration (Google, Microsoft, Auth0)
- [ ] Use httpOnly cookies for token storage
- [ ] Implement token refresh mechanism
- [ ] Add role-based access control (RBAC)
- [ ] Verify user owns dashboard before allowing access

#### Data Protection

- [ ] Enable HTTPS/TLS for all communications
- [ ] Encrypt sensitive data at rest
- [ ] Sanitize user inputs to prevent XSS
- [ ] Use parameterized queries (TypeORM does this)
- [ ] Add rate limiting to prevent abuse
- [ ] Implement CSRF protection

#### Infrastructure

- [ ] Set secure HTTP headers (Helmet.js)
- [ ] Enable request logging and audit trails
- [ ] Monitor for suspicious activity
- [ ] Regular security updates and patches
- [ ] Implement WAF (Web Application Firewall)

**Example Helmet.js Setup:**

```typescript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  }),
);
```

---

## Deployment

### Development Environment

**Requirements:**

- Node.js 20.19+ or 22.12+
- npm or yarn
- SQLite (included)

**Setup:**

```bash
# Backend
cd backend
npm install
npm run seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production Deployment

#### Backend (NestJS)

**Platform Options:**

- AWS (EC2, ECS, Lambda)
- Google Cloud (Compute Engine, Cloud Run)
- Azure (App Service, Functions)
- Heroku
- DigitalOcean
- Vercel (Serverless Functions)

**Build & Deploy:**

```bash
# Build
cd backend
npm run build

# Deploy built files from /dist directory
PM2, Docker, or platform-specific deployment
```

**Dockerfile Example:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Environment Variables:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=your_secure_secret
FRONTEND_URL=https://dashboard.yourdomain.com
```

#### Frontend (Vue)

**Platform Options:**

- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps
- GitHub Pages
- Cloudflare Pages

**Build & Deploy:**

```bash
# Build
cd frontend
npm run build

# Deploy /dist directory to static hosting
```

**Environment Variables:**

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

#### Database Migration

**SQLite → PostgreSQL:**

1. Export data from SQLite
2. Update TypeORM configuration
3. Run migrations
4. Import data to PostgreSQL

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [...],
  synchronize: false,  // Use migrations in production
  migrations: ['dist/migrations/*.js'],
})
```

---

## Monitoring & Logging

### Application Monitoring

**Recommended Tools:**

- **Sentry** - Error tracking and performance monitoring
- **LogRocket** - Session replay and debugging
- **DataDog** - Full-stack monitoring
- **New Relic** - APM and infrastructure monitoring

### Logging Strategy

**Backend Logging:**

```typescript
import { Logger } from '@nestjs/common'

private readonly logger = new Logger(ServiceName.name)

// Log levels
this.logger.log('Info message')      // General info
this.logger.error('Error message')   // Errors
this.logger.warn('Warning message')  // Warnings
this.logger.debug('Debug message')   // Debug info
```

**Production Logging:**

- Use structured logging (JSON format)
- Send logs to centralized service (CloudWatch, Loggly, Papertrail)
- Set retention policies
- Monitor error rates and patterns

---

## Testing Strategy

### Frontend Testing (Future)

**Unit Tests (Vitest):**

```javascript
import { describe, it, expect } from "vitest";
import { sizeForVizType } from "./utils";

describe("sizeForVizType", () => {
  it("returns correct size for KPI", () => {
    expect(sizeForVizType("kpi")).toEqual({ w: 3, h: 4 });
  });
});
```

**Component Tests (Vue Test Utils):**

```javascript
import { mount } from "@vue/test-utils";
import AddWidgetWizard from "./AddWidgetWizard.vue";

it("disables next button when no domain selected", () => {
  const wrapper = mount(AddWidgetWizard);
  expect(wrapper.find(".btn-primary").attributes("disabled")).toBeTruthy();
});
```

### Backend Testing (Future)

**Unit Tests (Jest):**

```typescript
describe("DashboardsService", () => {
  it("creates dashboard for new user", async () => {
    const dashboard = await service.getDashboard("new-user");
    expect(dashboard.userId).toBe("new-user");
    expect(dashboard.widgets).toEqual([]);
  });
});
```

**E2E Tests (Supertest):**

```typescript
it("/api/domains (GET)", () => {
  return request(app.getHttpServer())
    .get("/api/domains")
    .expect(200)
    .expect((res) => {
      expect(res.body).toBeInstanceOf(Array);
    });
});
```

---

## Future Enhancements

### Phase 1: Core Improvements

- [ ] Implement JWT authentication
- [ ] Add user registration and login
- [ ] Multiple dashboards per user
- [ ] Dashboard templates library
- [ ] Export dashboard as PDF/PNG

### Phase 2: Advanced Features

- [ ] Real-time data updates (WebSockets)
- [ ] Collaborative dashboards (multi-user editing)
- [ ] Custom widget configurations
- [ ] Advanced chart types (heatmap, scatter, gauge)
- [ ] Scheduled data refreshes

### Phase 3: Enterprise Features

- [ ] Role-based access control
- [ ] Data source integrations (Salesforce, Google Analytics, etc.)
- [ ] Custom data transformations
- [ ] Audit logs and compliance reporting
- [ ] White-label customization

---

## Troubleshooting

### Frontend Connection Issues

**Problem:** "Failed to fetch" errors

**Solutions:**

1. Verify backend is running on port 3000
2. Check CORS configuration in backend
3. Inspect Network tab in DevTools
4. Verify Authorization header is being sent

### Backend Connection Issues

**Problem:** "Connection refused" or "ECONNREFUSED"

**Solutions:**

1. Check if port 3000 is already in use: `lsof -i :3000`
2. Restart backend server
3. Check firewall settings
4. Verify database file permissions

### Database Issues

**Problem:** "SQLITE_CANTOPEN" or "database locked"

**Solutions:**

1. Check dashboard.sqlite file exists
2. Verify file permissions (chmod 644)
3. Close all database connections
4. Re-run `npm run seed`

### GridStack Issues

**Problem:** Widgets not draggable or overlapping incorrectly

**Solutions:**

1. Check GridStack CSS is loaded
2. Verify init options are correct
3. Clear browser cache
4. Check for JavaScript errors in console

---

## Documentation

### Additional Resources

**Frontend:**

- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- Vue 3 Docs: https://vuejs.org/
- Vite Docs: https://vitejs.dev/
- GridStack Docs: https://gridstackjs.com/

**Backend:**

- [Backend README](./backend/README.md) - Detailed backend documentation
- NestJS Docs: https://docs.nestjs.com/
- TypeORM Docs: https://typeorm.io/

**Integration:**

- This README - Full-stack integration guide

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Code Style:**

- Frontend: ESLint + Prettier
- Backend: ESLint + Prettier
- Commit messages: Conventional Commits format

---

## License

[Your License Here]

---

## Contact & Support

For questions, issues, or contributions:

- GitHub Issues: [Repository Issues Page]
- Email: [Your Email]
- Documentation: [Wiki or Documentation Site]

---

**Last Updated:** March 2026  
**Version:** 1.0.0  
**Authors:** [Your Name/Team]
