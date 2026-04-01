# Backend API - Custom Dashboard

## Overview

The backend is a **NestJS** application providing a RESTful API for the custom dashboard frontend. It manages domains, datasets, dashboard configurations, and widget data. The application uses **SQLite** for data persistence, **TypeORM** as the ORM layer, and implements caching for performance optimization.

---

## Technology Stack

### Core Framework

- **NestJS 11.1.17** - Progressive Node.js framework built with TypeScript
  - Modular architecture inspired by Angular
  - Dependency injection for loose coupling
  - Decorator-based routing and middleware
  - Built-in support for validation, guards, and interceptors

### Database & ORM

- **TypeORM 0.3.28** - Feature-rich ORM for TypeScript/JavaScript
  - Entity-based data modeling
  - Repository pattern for database operations
  - Support for migrations, relations, and transactions
  - Query builder for complex queries

- **SQLite 5.1.7** - Embedded relational database
  - Zero-configuration file-based database
  - Perfect for development and small-to-medium deployments
  - `dashboard.sqlite` file in project root
  - Easy migration to PostgreSQL/MySQL for production

### Validation & Transformation

- **class-validator 0.15.1** - Decorator-based validation
  - DTO validation with decorators like `@IsString()`, `@IsNumber()`
  - Custom validation rules
  - Automatic error message generation

- **class-transformer 0.5.1** - Object transformation
  - Converts plain objects to class instances
  - Excludes sensitive data from responses
  - Type transformation for request payloads

### Performance & Caching

- **@nestjs/cache-manager 3.1.0** - Built-in caching module
  - In-memory caching with configurable TTL
  - 5-minute cache for data endpoints
  - Prevents redundant data generation
  - Can be extended to Redis for production

### Additional Libraries

- **RxJS 7.8.2** - Reactive programming library
- **reflect-metadata 0.2.2** - Metadata reflection API for decorators

---

## Application Architecture

### Module Structure

NestJS follows a modular architecture where each feature is encapsulated in its own module.

```
AppModule (Root)
├── TypeORM Configuration (SQLite)
├── Cache Configuration (In-Memory)
├── DomainsModule
│   ├── DomainsController
│   ├── DomainsService
│   └── Domain Entity
├── DatasetsModule
│   ├── DatasetsController
│   ├── DatasetsService
│   └── Dataset Entity
├── DataModule
│   ├── DataController
│   ├── DataService
│   └── (uses Domain & Dataset entities)
└── DashboardsModule
    ├── DashboardsController
    ├── DashboardsService
    ├── Dashboard Entity
    ├── Widget Entity
    └── DTOs (SaveDashboardDto)
```

### Shared Components

- **Guards:** `AuthGuard` - Simple authentication middleware
- **Decorators:** `@UserId()` - Extracts user ID from request

---

## Core Modules Explained

### 1. **AppModule** - Application Root

**File:** `src/app.module.ts`

The root module that bootstraps the entire application.

**Configuration:**

```typescript
@Module({
  imports: [
    // SQLite Database Configuration
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'dashboard.sqlite',
      entities: [Domain, Dataset, Dashboard, Widget],
      synchronize: true, // Auto-create tables (disable in production)
      logging: false,
    }),

    // Cache Configuration
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes in milliseconds
      max: 100, // Maximum 100 items in cache
    }),

    // Feature Modules
    DomainsModule,
    DatasetsModule,
    DataModule,
    DashboardsModule,
  ],
})
export class AppModule {}
```

**Key Features:**

- **TypeORM Integration:** Auto-generates database schema from entities
- **Global Caching:** Cache manager available in all modules
- **Modular Design:** Each business domain is a separate module

**Database Auto-Creation:**

- On first run, TypeORM creates tables based on entity definitions
- `synchronize: true` enables auto-schema generation (development only)
- In production, use migrations for schema changes

---

### 2. **DomainsModule** - Business Domain Management

**Entities:** Sales, Finance, Marketing, Operations, HR

**Controller:** `src/modules/domains/domains.controller.ts`

```typescript
@Controller('domains')
export class DomainsController {
  @Get()
  async findAll(): Promise<Domain[]>

  @Get(':domainKey/datasets')
  async getDatasets(@Param('domainKey') domainKey: string): Promise<Dataset[]>
}
```

**Service:** `src/modules/domains/domains.service.ts`

- `findAll()` - Returns all available domains with metadata
- `getDatasetsByDomain(domainKey)` - Returns datasets for a specific domain

**Domain Entity:**

```typescript
@Entity('domains')
export class Domain {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  key: string // e.g., 'sales', 'finance'

  @Column()
  name: string

  @Column()
  icon: string

  @Column()
  description: string

  @OneToMany(() => Dataset, (dataset) => dataset.domain)
  datasets: Dataset[]
}
```

**Database Seeding:**

- Domains are seeded via `src/seed.ts`
- Run with: `npm run seed`
- Pre-populated domains: Sales, Finance, Marketing, Operations, HR

---

### 3. **DatasetsModule** - Dataset Catalog

**Purpose:** Manages available data sources within each domain

**Controller:** `src/modules/datasets/datasets.controller.ts`

```typescript
@Controller('datasets')
export class DatasetsController {
  @Get()
  async findAll(): Promise<Dataset[]>
}
```

**Dataset Entity:**

```typescript
@Entity('datasets')
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  domainId: number

  @Column()
  key: string // e.g., 'monthly_rev', 'pipeline'

  @Column()
  name: string

  @Column()
  description: string

  @Column('simple-array')
  tags: string[]

  @ManyToOne(() => Domain, (domain) => domain.datasets)
  domain: Domain
}
```

**Example Datasets:**

**Sales Domain:**

- Monthly Revenue
- Top Products
- Sales Pipeline
- Regional Performance

**Finance Domain:**

- P&L Summary
- Budget vs Actual
- Cash Flow

_(See `src/seed.ts` for complete dataset list)_

---

### 4. **DataModule** - Data Generation & Caching

**Purpose:** Provides actual data for visualizations

**Controller:** `src/modules/data/data.controller.ts`

```typescript
@Controller('data')
export class DataController {
  @Get(':domainKey/:datasetKey')
  async getData(
    @Param('domainKey') domainKey: string,
    @Param('datasetKey') datasetKey: string,
    @UserId() userId: string
  )
}
```

**Service:** `src/modules/data/data.service.ts`

**Data Generation Flow:**

```typescript
async getData(domainKey: string, datasetKey: string, userId: string) {
  const cacheKey = `data:${domainKey}:${datasetKey}:${userId}`

  // 1. Check cache
  const cached = await this.cacheManager.get(cacheKey)
  if (cached) return cached

  // 2. Verify domain and dataset exist
  const domain = await this.domainsRepository.findOne({ where: { key: domainKey } })
  const dataset = await this.datasetsRepository.findOne({ where: { key: datasetKey } })

  // 3. Generate mock data
  const result = this.generateMockData(domainKey, datasetKey)

  // 4. Cache result (5 minutes TTL)
  await this.cacheManager.set(cacheKey, result)

  return result
}
```

**Data Structure:**

```typescript
{
  cats: string[],        // Categories for X-axis (e.g., months)
  series: Array<{        // Multiple data series for charts
    name: string,
    data: number[]
  }>,
  rows: Array<Object>,   // Row data for tables
  kpi: {                 // KPI metrics
    value: string,       // e.g., "$4.5M"
    label: string,       // Description
    change: string,      // e.g., "+12% MoM"
    trend: 'up' | 'down'
  }
}
```

**Mock Data Generation:**

Currently generates random data for demonstration purposes.

```typescript
private generateMockData(domainKey: string, datasetKey: string) {
  const r = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return {
    cats: months,
    series: [
      { name: 'Value A', data: months.map(() => r(100, 500)) },
      { name: 'Value B', data: months.map(() => r(80, 450)) }
    ],
    rows: months.map(m => ({
      Month: m,
      ValueA: r(100, 500),
      ValueB: r(80, 450)
    })),
    kpi: {
      value: `$${r(1, 9)}.${r(1, 9)}M`,
      label: `${domainKey} · ${datasetKey}`,
      change: `+${r(1, 20)}% MoM`,
      trend: 'up'
    }
  }
}
```

**Production Integration:**

In production, replace `generateMockData()` with real data queries:

- Database queries (PostgreSQL, MySQL)
- External APIs (Salesforce, Google Analytics, etc.)
- Data warehouses (Snowflake, BigQuery)
- Time-series databases (InfluxDB, TimescaleDB)

---

### 5. **DashboardsModule** - User Dashboard Persistence

**Purpose:** Saves and retrieves user dashboard configurations

**Controller:** `src/modules/dashboards/dashboards.controller.ts`

```typescript
@Controller('dashboards')
@UseGuards(AuthGuard)
export class DashboardsController {
  @Get(':userId')
  async getDashboard(@Param('userId') userId: string)

  @Post(':userId')
  async saveDashboard(
    @Param('userId') userId: string,
    @Body() saveDto: SaveDashboardDto
  )
}
```

**Service:** `src/modules/dashboards/dashboards.service.ts`

**Key Operations:**

1. **Get Dashboard:**
   - Fetches dashboard with all widgets
   - Creates empty dashboard if none exists
   - Converts internal IDs to domain/dataset keys for frontend
   - Returns layout preference (defaults to 'single' if not set)

2. **Save Dashboard:**
   - Updates layout preference if provided
   - Deletes all existing widgets
   - Converts domain/dataset keys to internal IDs
   - Inserts new widget configurations
   - Updates dashboard timestamp

**Dashboard Entity:**

```typescript
@Entity('dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userId: string

  @Column({ default: 'My Dashboard' })
  name: string

  @Column({ nullable: true, default: 'single' })
  layout: string // Layout type: 'single', 'two-equal', 'two-left-small', 'two-left-large', 'three-equal'

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date

  @OneToMany(() => Widget, (widget) => widget.dashboard, { cascade: true })
  widgets: Widget[]
}
```

**Widget Entity:**

```typescript
@Entity('widgets')
export class Widget {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  dashboardId: number

  @Column()
  domainId: number

  @Column()
  datasetId: number

  @Column()
  vizType: string // 'line', 'bar', 'pie', 'table', 'kpi'

  @Column({ type: 'integer' })
  x: number // Grid X position

  @Column({ type: 'integer' })
  y: number // Grid Y position

  @Column({ type: 'integer' })
  w: number // Grid width

  @Column({ type: 'integer' })
  h: number // Grid height

  @ManyToOne(() => Dashboard, (dashboard) => dashboard.widgets, {
    onDelete: 'CASCADE',
  })
  dashboard: Dashboard
}
```

**Widget Storage Logic:**

```typescript
async saveDashboard(userId: string, widgets: any[], layout?: string) {
  let dashboard = await this.dashboardsRepository.findOne({
    where: { userId },
    relations: ['widgets']
  })

  if (!dashboard) {
    dashboard = this.dashboardsRepository.create({
      userId,
      name: 'My Dashboard',
      layout: layout || 'single'
    })
    await this.dashboardsRepository.save(dashboard)
  } else {
    // Update layout if provided
    if (layout) {
      dashboard.layout = layout
      await this.dashboardsRepository.save(dashboard)
    }
  }

  // Delete all existing widgets
  await this.widgetsRepository
    .createQueryBuilder()
    .delete()
    .where('dashboardId = :dashboardId', { dashboardId: dashboard.id })
    .execute()

  // Convert keys to IDs and insert new widgets
  const newWidgets = await Promise.all(
    widgets.map(async (w) => {
      const domain = await this.domainsRepository.findOne({ where: { key: w.domainId } })
      const dataset = await this.datasetsRepository.findOne({ where: { key: w.datasetId } })

      return {
        dashboardId: dashboard.id,
        domainId: domain.id,
        datasetId: dataset.id,
        vizType: w.vizType,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h
      }
    })
  )

  if (newWidgets.length > 0) {
    await this.widgetsRepository.insert(newWidgets)
  }

  return this.getDashboard(userId)
}
```

---

## Authentication & Security

### AuthGuard Implementation

**File:** `src/guards/auth.guard.ts`

Simple authentication guard that validates the `Authorization` header.

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers['authorization']

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header')
    }

    const userId = authHeader.replace('Bearer ', '').trim()

    if (!userId) {
      throw new UnauthorizedException('Invalid Authorization header')
    }

    // Attach userId to request
    request.userId = userId
    return true
  }
}
```

**Usage:**

```typescript
@Controller('dashboards')
@UseGuards(AuthGuard)
export class DashboardsController {
  // All routes in this controller require authentication
}
```

### @UserId() Decorator

**File:** `src/decorators/user-id.decorator.ts`

Custom parameter decorator to extract user ID from the request.

```typescript
export const UserId = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest()
  return request.userId
})
```

**Usage:**

```typescript
@Get(':userId')
async getDashboard(
  @Param('userId') userId: string,
  @UserId() requestUserId: string  // From Authorization header
) {
  // Can compare userId with requestUserId for authorization
  return this.dashboardsService.getDashboard(userId)
}
```

**Current Implementation:**

- Simple header-based authentication (user ID in Authorization header)
- No password validation
- Suitable for development/demo

**Production Recommendations:**

- Implement JWT (JSON Web Tokens) with access/refresh tokens
- Integrate with OAuth2 providers (Google, Microsoft, Auth0)
- Add role-based access control (RBAC)
- Implement rate limiting and request throttling
- Use HTTPS for all communications

---

## API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Domains

**GET /domains**

- Fetch all available domains
- No authentication required
- Response:
  ```json
  [
    {
      "id": "sales",
      "name": "Sales",
      "icon": "📈",
      "description": "Revenue, pipeline & product performance"
    }
  ]
  ```

**GET /domains/:domainKey/datasets**

- Fetch datasets for a specific domain
- Path parameter: `domainKey` (e.g., 'sales', 'finance')
- Response:
  ```json
  [
    {
      "id": "monthly_rev",
      "name": "Monthly Revenue",
      "description": "12-month revenue vs. target",
      "tags": ["Revenue", "KPI"]
    }
  ]
  ```

### Data

**GET /data/:domainKey/:datasetKey**

- Fetch data for visualization
- Path parameters:
  - `domainKey`: Domain identifier
  - `datasetKey`: Dataset identifier
- Headers:
  - `Authorization`: User ID
- Caching: 5 minutes
- Response:
  ```json
  {
    "cats": ["Jan", "Feb", "Mar", ...],
    "series": [
      { "name": "Value A", "data": [120, 150, 180, ...] },
      { "name": "Value B", "data": [90, 110, 130, ...] }
    ],
    "rows": [
      { "Month": "Jan", "ValueA": 120, "ValueB": 90 },
      ...
    ],
    "kpi": {
      "value": "$4.5M",
      "label": "sales · monthly_rev",
      "change": "+12% MoM",
      "trend": "up"
    }
  }
  ```

### Dashboards

**GET /dashboards/:userId**

- Fetch user's dashboard configuration
- Path parameter: `userId`
- Headers:
  - `Authorization`: User ID
- Guards: `AuthGuard`
- Response:
  ```json
  {
    "id": 1,
    "userId": "user-1",
    "name": "My Dashboard",
    "layout": "two-equal",
    "widgets": [
      {
        "id": 1,
        "domainId": "sales",
        "datasetId": "monthly_rev",
        "vizType": "line",
        "x": 0,
        "y": 0,
        "w": 6,
        "h": 5
      }
    ]
  }
  ```

**POST /dashboards/:userId**

- Save dashboard configuration
- Path parameter: `userId`
- Headers:
  - `Authorization`: User ID
  - `Content-Type`: application/json
- Guards: `AuthGuard`
- Request body:
  ```json
  {
    "widgets": [
      {
        "domainId": "sales",
        "datasetId": "monthly_rev",
        "vizType": "line",
        "x": 0,
        "y": 0,
        "w": 6,
        "h": 5
      }
    ],
    "layout": "two-equal"
  }
  ```
- Response: Same as GET response

---

## Validation & DTOs

### SaveDashboardDto

**File:** `src/modules/dashboards/dto/save-dashboard.dto.ts`

Data Transfer Object for dashboard save operations.

```typescript
export class SaveDashboardDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetDto)
  widgets: WidgetDto[]

  @IsOptional()
  @IsString()
  layout?: string // Layout type: 'single', 'two-equal', 'two-left-small', 'two-left-large', 'three-equal'
}

class WidgetDto {
  @IsString()
  domainId: string

  @IsString()
  datasetId: string

  @IsString()
  vizType: string

  @IsNumber()
  x: number

  @IsNumber()
  y: number

  @IsNumber()
  w: number

  @IsNumber()
  h: number
}
```

**Validation Pipe Configuration:**

```typescript
// In main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip non-whitelisted properties
    transform: true, // Transform payloads to DTO instances
  }),
)
```

---

## Database Schema

### ERD (Entity Relationship Diagram)

```
┌─────────────┐
│   domains   │
├─────────────┤
│ id          │ PK
│ key         │ UNIQUE
│ name        │
│ icon        │
│ description │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────┐
│  datasets   │
├─────────────┤
│ id          │ PK
│ domainId    │ FK → domains.id
│ key         │
│ name        │
│ description │
│ tags        │
└─────────────┘

┌──────────────┐
│  dashboards  │
├──────────────┤
│ id           │ PK
│ userId       │
│ name         │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────┴───────┐
│   widgets    │
├──────────────┤
│ id           │ PK
│ dashboardId  │ FK → dashboards.id (CASCADE DELETE)
│ domainId     │ FK → domains.id
│ datasetId    │ FK → datasets.id
│ vizType      │
│ x            │
│ y            │
│ w            │
│ h            │
└──────────────┘
```

### Database File

- **Location:** `dashboard.sqlite` in project root
- **Size:** ~100KB (empty) to several MB (with data)
- **Management:** SQLite Browser or `sqlite3` command-line tool

**View Data:**

```bash
# Install SQLite3
brew install sqlite3  # macOS
apt install sqlite3   # Linux

# Open database
sqlite3 dashboard.sqlite

# View tables
.tables

# Query domains
SELECT * FROM domains;

# Query widgets
SELECT * FROM widgets;
```

---

## CORS Configuration

**File:** `src/main.ts`

```typescript
app.enableCors({
  origin: 'http://localhost:5173', // Vite frontend URL
  credentials: true,
})
```

**Production Configuration:**

```typescript
app.enableCors({
  origin: ['https://dashboard.yourdomain.com', process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

---

## Database Seeding

### Seed Script

**File:** `src/seed.ts`

Populates the database with initial domains and datasets.

**Run Seed:**

```bash
npm run seed
```

**Output:**

```
🌱 Starting database seed...
   Cleared existing data
   ✓ Created domain: Sales
   ✓ Created 4 datasets for Sales
   ✓ Created domain: Finance
   ✓ Created 3 datasets for Finance
   ...
✅ Database seeding completed!
```

**Seed Data Structure:**

```typescript
const DOMAINS = [
  {
    key: 'sales',
    name: 'Sales',
    icon: '📈',
    description: 'Revenue, pipeline & product performance'
  },
  ...
]

const DATASETS = {
  sales: [
    {
      key: 'monthly_rev',
      name: 'Monthly Revenue',
      description: '12-month revenue vs. target',
      tags: ['Revenue', 'KPI']
    },
    ...
  ],
  ...
}
```

**When to Re-Seed:**

- Fresh database setup
- Schema changes requiring data refresh
- Adding new domains or datasets
- Testing with clean data

---

## Error Handling

### Global Exception Filter

NestJS provides built-in exception handling with standardized error responses.

**Common HTTP Exceptions:**

- `NotFoundException` - 404 Not Found
- `UnauthorizedException` - 401 Unauthorized
- `BadRequestException` - 400 Bad Request
- `ForbiddenException` - 403 Forbidden

**Example Usage:**

```typescript
if (!domain) {
  throw new NotFoundException(`Domain '${domainKey}' not found`)
}
```

**Response Format:**

```json
{
  "statusCode": 404,
  "message": "Domain 'invalid' not found",
  "error": "Not Found"
}
```

### Logging

NestJS built-in logger used throughout the application.

```typescript
private readonly logger = new Logger(DashboardsService.name)

this.logger.log(`Saving dashboard for user ${userId}`)
this.logger.error(`Failed to save dashboard`, error.stack)
this.logger.debug(`Widget data: ${JSON.stringify(widgets)}`)
```

---

## Development Setup

### Prerequisites

- Node.js 20.19.0 or 22.12.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Seed database
npm run seed

# Start development server
npm run start:dev
```

### Available Scripts

```json
{
  "build": "nest build", // Compile TypeScript to JavaScript
  "start": "nest start", // Start production server
  "start:dev": "nest start --watch", // Start with auto-reload
  "start:debug": "nest start --debug --watch", // Start with debugger
  "start:prod": "node dist/main", // Start compiled production build
  "seed": "ts-node src/seed.ts" // Seed database
}
```

### Development Server

**Start Command:**

```bash
npm run start:dev
```

**Output:**

```
[Nest] 12345  - 03/31/2026, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 03/31/2026, 10:00:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 03/31/2026, 10:00:00 AM     LOG [RoutesResolver] DomainsController {/api/domains}
[Nest] 12345  - 03/31/2026, 10:00:00 AM     LOG [RoutesResolver] DatasetsController {/api/datasets}
[Nest] 12345  - 03/31/2026, 10:00:00 AM     LOG [RoutesResolver] DataController {/api/data}
[Nest] 12345  - 03/31/2026, 10:00:00 AM     LOG [RoutesResolver] DashboardsController {/api/dashboards}
🚀  Backend API is running on: http://localhost:3000/api
```

**Features:**

- Auto-reload on file changes
- TypeScript compilation in watch mode
- Immediate error feedback

---

## Production Deployment

### Build Process

```bash
# Compile TypeScript
npm run build

# Output directory: dist/
```

### Production Configuration

**Environment Variables:**

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=production

# Database (for production, use PostgreSQL/MySQL)
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dashboard_user
DB_PASSWORD=secure_password
DB_DATABASE=dashboard_prod

# CORS
FRONTEND_URL=https://dashboard.yourdomain.com

# Cache (use Redis for production)
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=3600
```

### Database Migration

**For PostgreSQL/MySQL:**

1. Update `app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  type: process.env.DB_TYPE as 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Domain, Dataset, Dashboard, Widget],
  synchronize: false, // IMPORTANT: Disable in production
  logging: true,
})
```

2. Generate migrations:

```bash
npm run typeorm migration:generate -- -n InitialSchema
npm run typeorm migration:run
```

### Performance Optimizations

1. **Use Redis for Caching:**

```typescript
CacheModule.register({
  isGlobal: true,
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  ttl: 300,
})
```

2. **Enable Compression:**

```typescript
import * as compression from 'compression'
app.use(compression())
```

3. **Add Rate Limiting:**

```typescript
import * as rateLimit from 'express-rate-limit'

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit per IP
  }),
)
```

4. **Database Connection Pooling:**

```typescript
TypeOrmModule.forRoot({
  // ...
  extra: {
    connectionLimit: 10,
  },
})
```

---

## File Structure

```
backend/
├── src/
│   ├── decorators/
│   │   └── user-id.decorator.ts       # Custom @UserId() decorator
│   ├── entities/
│   │   ├── dashboard.entity.ts        # Dashboard entity
│   │   ├── dataset.entity.ts          # Dataset entity
│   │   ├── domain.entity.ts           # Domain entity
│   │   └── widget.entity.ts           # Widget entity
│   ├── guards/
│   │   └── auth.guard.ts              # Authentication guard
│   ├── modules/
│   │   ├── dashboards/
│   │   │   ├── dto/
│   │   │   │   └── save-dashboard.dto.ts
│   │   │   ├── dashboards.controller.ts
│   │   │   ├── dashboards.module.ts
│   │   │   └── dashboards.service.ts
│   │   ├── data/
│   │   │   ├── data.controller.ts
│   │   │   ├── data.module.ts
│   │   │   └── data.service.ts
│   │   ├── datasets/
│   │   │   ├── datasets.controller.ts
│   │   │   ├── datasets.module.ts
│   │   │   └── datasets.service.ts
│   │   └── domains/
│   │       ├── domains.controller.ts
│   │       ├── domains.module.ts
│   │       └── domains.service.ts
│   ├── app.module.ts                  # Root module
│   ├── main.ts                        # Application entry point
│   └── seed.ts                        # Database seeding script
├── nest-cli.json                      # NestJS CLI configuration
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript configuration
├── tsconfig.build.json                # Build-specific TS config
└── README.md                          # This file
```

---

## Testing (Future Implementation)

### Unit Tests

```bash
npm run test
```

**Example Test:**

```typescript
describe('DashboardsService', () => {
  it('should create a dashboard for new user', async () => {
    const dashboard = await service.getDashboard('user-new')
    expect(dashboard).toBeDefined()
    expect(dashboard.userId).toBe('user-new')
    expect(dashboard.widgets).toEqual([])
  })
})
```

### E2E Tests

```bash
npm run test:e2e
```

**Example E2E Test:**

```typescript
it('/api/domains (GET)', () => {
  return request(app.getHttpServer())
    .get('/api/domains')
    .expect(200)
    .expect((res) => {
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThan(0)
    })
})
```

---

## Troubleshooting

### Common Issues

**Issue: Database locked**

- SQLite is single-writer
- Close all connections before migrations
- Consider PostgreSQL for multi-user environments

**Issue: CORS errors**

- Verify frontend URL in `main.ts` CORS config
- Check that credentials are included in frontend requests

**Issue: Cache not working**

- Verify `CacheModule` is registered globally
- Check TTL configuration
- Clear cache: restart server (in-memory cache)

**Issue: TypeORM synchronize not creating tables**

- Delete `dashboard.sqlite` and restart
- Run seed script after fresh start
- Check entity decorator syntax

---

## Best Practices

### Code Organization

- One feature per module
- Use DTOs for all input validation
- Keep services focused and testable
- Use dependency injection consistently

### Security

- Never commit `.env` files
- Use environment variables for sensitive data
- Implement proper authentication in production
- Validate all user input with DTOs
- Use parameterized queries (TypeORM does this)

### Performance

- Cache expensive operations
- Use database indexes for frequent queries
- Paginate large result sets
- Monitor database query performance
- Use connection pooling

---

## Dependencies Deep Dive

### Production Dependencies

| Package                  | Version | Purpose                |
| ------------------------ | ------- | ---------------------- |
| @nestjs/common           | 11.1.17 | Core NestJS framework  |
| @nestjs/core             | 11.1.17 | NestJS runtime         |
| @nestjs/platform-express | 11.1.17 | Express adapter        |
| @nestjs/typeorm          | 11.0.0  | TypeORM integration    |
| @nestjs/cache-manager    | 3.1.0   | Caching module         |
| typeorm                  | 0.3.28  | ORM for TypeScript     |
| sqlite3                  | 5.1.7   | SQLite database driver |
| class-validator          | 0.15.1  | DTO validation         |
| class-transformer        | 0.5.1   | Object transformation  |
| cache-manager            | 7.2.8   | Cache abstraction      |
| rxjs                     | 7.8.2   | Reactive programming   |
| reflect-metadata         | 0.2.2   | Decorator metadata API |

### Development Dependencies

| Package     | Version | Purpose                  |
| ----------- | ------- | ------------------------ |
| @nestjs/cli | 11.0.17 | NestJS CLI tools         |
| @types/node | 25.5.0  | Node.js type definitions |
| ts-node     | 10.9.2  | TypeScript execution     |
| typescript  | 6.0.2   | TypeScript compiler      |

---

## API Documentation (Future)

Consider adding Swagger/OpenAPI documentation:

```bash
npm install @nestjs/swagger swagger-ui-express
```

```typescript
// In main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

const config = new DocumentBuilder()
  .setTitle('Dashboard API')
  .setDescription('Custom Dashboard Backend API')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

Access at: `http://localhost:3000/api/docs`

---

## Resources

- **NestJS Documentation:** https://docs.nestjs.com/
- **TypeORM Documentation:** https://typeorm.io/
- **SQLite Documentation:** https://www.sqlite.org/docs.html
- **class-validator:** https://github.com/typestack/class-validator

---

**Last Updated:** March 2026  
**Application Version:** 1.0.0
