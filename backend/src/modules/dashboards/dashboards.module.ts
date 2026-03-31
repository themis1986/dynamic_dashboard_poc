import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardsController } from "./dashboards.controller";
import { DashboardsService } from "./dashboards.service";
import { Dashboard } from "../../entities/dashboard.entity";
import { Widget } from "../../entities/widget.entity";
import { Domain } from "../../entities/domain.entity";
import { Dataset } from "../../entities/dataset.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Dashboard, Widget, Domain, Dataset])],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}
