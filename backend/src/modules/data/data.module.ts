import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataController } from "./data.controller";
import { DataService } from "./data.service";
import { Domain } from "../../entities/domain.entity";
import { Dataset } from "../../entities/dataset.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Domain, Dataset])],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}
