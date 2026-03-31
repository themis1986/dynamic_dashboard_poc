import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { DataService } from "./data.service";
import { AuthGuard } from "../../guards/auth.guard";
import { UserId } from "../../decorators/user-id.decorator";

@Controller("data")
@UseGuards(AuthGuard)
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get(":domainId/:datasetId")
  async getData(
    @Param("domainId") domainId: string,
    @Param("datasetId") datasetId: string,
    @UserId() userId: string,
  ) {
    return this.dataService.getData(domainId, datasetId, userId);
  }
}
