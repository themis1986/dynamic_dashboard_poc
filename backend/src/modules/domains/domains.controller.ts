import { Controller, Get, UseGuards } from "@nestjs/common";
import { DomainsService } from "./domains.service";
import { AuthGuard } from "../../guards/auth.guard";
import { UserId } from "../../decorators/user-id.decorator";

@Controller("domains")
@UseGuards(AuthGuard)
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  async findAll(@UserId() userId: string) {
    return this.domainsService.findAll(userId);
  }
}
