import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Domain } from "../../entities/domain.entity";
import { Dataset } from "../../entities/dataset.entity";

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(Domain)
    private domainsRepository: Repository<Domain>,
    @InjectRepository(Dataset)
    private datasetsRepository: Repository<Dataset>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getData(domainKey: string, datasetKey: string, userId: string) {
    const cacheKey = `data:${domainKey}:${datasetKey}:${userId}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Verify domain and dataset exist
    const domain = await this.domainsRepository.findOne({
      where: { key: domainKey },
    });

    if (!domain) {
      throw new NotFoundException(`Domain '${domainKey}' not found`);
    }

    const dataset = await this.datasetsRepository.findOne({
      where: { key: datasetKey, domainId: domain.id },
    });

    if (!dataset) {
      throw new NotFoundException(
        `Dataset '${datasetKey}' not found in domain '${domainKey}'`,
      );
    }

    // Generate mock data
    // In production, this would query your actual data sources
    const result = this.generateMockData(domainKey, datasetKey);

    // Cache the result
    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  private generateMockData(domainKey: string, datasetKey: string) {
    const r = (a: number, b: number) =>
      Math.floor(Math.random() * (b - a + 1)) + a;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return {
      cats: months,
      series: [
        { name: "Value A", data: months.map(() => r(100, 500)) },
        { name: "Value B", data: months.map(() => r(80, 450)) },
      ],
      rows: months.map((m) => ({
        Month: m,
        ValueA: r(100, 500),
        ValueB: r(80, 450),
      })),
      kpi: {
        value: `$${r(1, 9)}.${r(1, 9)}M`,
        label: `${domainKey} · ${datasetKey}`,
        change: `+${r(1, 20)}% MoM`,
        trend: "up",
      },
    };
  }
}
