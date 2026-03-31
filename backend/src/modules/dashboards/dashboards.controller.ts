import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { DashboardsService } from "./dashboards.service";
import { AuthGuard } from "../../guards/auth.guard";
import { UserId } from "../../decorators/user-id.decorator";
import { SaveDashboardDto } from "./dto/save-dashboard.dto";

@Controller("dashboards")
@UseGuards(AuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get(":userId")
  async getDashboard(
    @Param("userId") userId: string,
    @UserId() requestUserId: string,
  ) {
    // In production, verify that requestUserId matches userId or has permission
    return this.dashboardsService.getDashboard(userId);
  }

  @Post(":userId")
  async saveDashboard(
    @Param("userId") userId: string,
    @Body() saveDto: SaveDashboardDto,
    @UserId() requestUserId: string,
  ) {
    // In production, verify that requestUserId matches userId or has permission
    return this.dashboardsService.saveDashboard(userId, saveDto.widgets);
  }
}
