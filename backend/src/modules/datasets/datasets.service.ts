import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Dataset } from "../../entities/dataset.entity";
import { Domain } from "../../entities/domain.entity";

@Injectable()
export class DatasetsService {
  constructor(
    @InjectRepository(Dataset)
    private datasetsRepository: Repository<Dataset>,
    @InjectRepository(Domain)
    private domainsRepository: Repository<Domain>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async findByDomain(domainKey: string, userId: string) {
    const cacheKey = `datasets:${domainKey}:${userId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Find the domain first
    const domain = await this.domainsRepository.findOne({
      where: { key: domainKey },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainKey}' not found`);
    }

    // Fetch datasets for this domain
    const datasets = await this.datasetsRepository.find({
      where: { domainId: domain.id },
    });

    const result = datasets.map((d) => ({
      id: d.key,
      name: d.name,
      description: d.description,
      tags: d.tags,
    }));

    // Cache the result
    await this.cacheManager.set(cacheKey, result);

    return result;
  }
}
