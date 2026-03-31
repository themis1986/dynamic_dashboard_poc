import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatasetsController } from "./datasets.controller";
import { DatasetsService } from "./datasets.service";
import { Dataset } from "../../entities/dataset.entity";
import { Domain } from "../../entities/domain.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Dataset, Domain])],
  controllers: [DatasetsController],
  providers: [DatasetsService],
})
export class DatasetsModule {}
