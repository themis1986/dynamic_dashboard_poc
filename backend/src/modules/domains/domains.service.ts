import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Domain } from "../../entities/domain.entity";

@Injectable()
export class DomainsService {
  constructor(
    @InjectRepository(Domain)
    private domainsRepository: Repository<Domain>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findAll(userId: string) {
    const cacheKey = `domains:${userId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const domains = await this.domainsRepository.find({
      select: ["id", "key", "name", "icon", "description"],
    });

    const result = domains.map((d) => ({
      id: d.key,
      name: d.name,
      icon: d.icon,
      description: d.description,
    }));

    // Cache the result
    await this.cacheManager.set(cacheKey, result);

    return result;
  }
}
