import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { DatasetsService } from "./datasets.service";
import { AuthGuard } from "../../guards/auth.guard";
import { UserId } from "../../decorators/user-id.decorator";

@Controller("domains")
@UseGuards(AuthGuard)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get(":id/datasets")
  async findByDomain(@Param("id") domainKey: string, @UserId() userId: string) {
    return this.datasetsService.findByDomain(domainKey, userId);
  }
}
