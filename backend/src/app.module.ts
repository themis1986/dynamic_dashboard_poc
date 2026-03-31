import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from "@nestjs/cache-manager";
import { DomainsModule } from "./modules/domains/domains.module";
import { DatasetsModule } from "./modules/datasets/datasets.module";
import { DataModule } from "./modules/data/data.module";
import { DashboardsModule } from "./modules/dashboards/dashboards.module";
import { Domain } from "./entities/domain.entity";
import { Dataset } from "./entities/dataset.entity";
import { Dashboard } from "./entities/dashboard.entity";
import { Widget } from "./entities/widget.entity";

@Module({
  imports: [
    // SQLite Database Configuration
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "dashboard.sqlite",
      entities: [Domain, Dataset, Dashboard, Widget],
      synchronize: true, // Auto-create tables (disable in production)
      logging: false,
    }),
    // Cache Configuration
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes in milliseconds
      max: 100, // maximum number of items in cache
    }),
    DomainsModule,
    DatasetsModule,
    DataModule,
    DashboardsModule,
  ],
})
export class AppModule {}
