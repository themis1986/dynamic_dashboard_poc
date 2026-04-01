import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Dashboard } from "../../entities/dashboard.entity";
import { Widget } from "../../entities/widget.entity";
import { Domain } from "../../entities/domain.entity";
import { Dataset } from "../../entities/dataset.entity";

@Injectable()
export class DashboardsService {
  private readonly logger = new Logger(DashboardsService.name);

  constructor(
    @InjectRepository(Dashboard)
    private dashboardsRepository: Repository<Dashboard>,
    @InjectRepository(Widget)
    private widgetsRepository: Repository<Widget>,
    @InjectRepository(Domain)
    private domainsRepository: Repository<Domain>,
    @InjectRepository(Dataset)
    private datasetsRepository: Repository<Dataset>,
  ) {}

  async getDashboard(userId: string) {
    let dashboard = await this.dashboardsRepository.findOne({
      where: { userId },
      relations: ["widgets"],
    });

    if (!dashboard) {
      // Create empty dashboard for new user
      dashboard = this.dashboardsRepository.create({
        userId,
        name: "My Dashboard",
        widgets: [],
      });
      await this.dashboardsRepository.save(dashboard);
    }

    // Load all domains and datasets to map IDs to keys
    const domains = await this.domainsRepository.find();
    const datasets = await this.datasetsRepository.find();

    const domainMap = new Map(domains.map((d) => [d.id, d.key]));
    const datasetMap = new Map(datasets.map((d) => [d.id, d.key]));

    return {
      id: dashboard.id,
      userId: dashboard.userId,
      name: dashboard.name,
      layout: dashboard.layout || "single",
      widgets: dashboard.widgets.map((w) => ({
        id: w.id,
        domainId: domainMap.get(w.domainId) || w.domainId,
        datasetId: datasetMap.get(w.datasetId) || w.datasetId,
        vizType: w.vizType,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
      })),
    };
  }

  async saveDashboard(userId: string, widgets: any[], layout?: string) {
    this.logger.log(
      `Saving dashboard for user ${userId} with ${widgets.length} widgets and layout ${layout}`,
    );
    this.logger.debug(`Widget data received: ${JSON.stringify(widgets)}`);

    try {
      let dashboard = await this.dashboardsRepository.findOne({
        where: { userId },
        relations: ["widgets"],
      });

      if (!dashboard) {
        dashboard = this.dashboardsRepository.create({
          userId,
          name: "My Dashboard",
          layout: layout || "single",
        });
        await this.dashboardsRepository.save(dashboard);
        this.logger.log(`Created new dashboard with ID: ${dashboard.id}`);
      } else {
        // Update layout if provided
        if (layout) {
          dashboard.layout = layout;
        }
      }

      // Delete ALL existing widgets for this dashboard using a direct delete query
      const existingCount = dashboard.widgets?.length || 0;
      if (existingCount > 0) {
        this.logger.log(
          `Deleting ${existingCount} existing widgets for dashboard ${dashboard.id}`,
        );
        const deleteResult = await this.widgetsRepository
          .createQueryBuilder()
          .delete()
          .from(Widget)
          .where("dashboardId = :dashboardId", { dashboardId: dashboard.id })
          .execute();
        this.logger.log(
          `Deleted ${deleteResult.affected} widgets from database`,
        );

        // Clear the widgets array to prevent TypeORM from trying to update orphaned entities
        dashboard.widgets = [];
      }

      // Convert domain/dataset keys to numeric IDs and create new widgets
      const newWidgets = await Promise.all(
        widgets.map(async (w) => {
          const domain = await this.domainsRepository.findOne({
            where: { key: w.domainId },
          });
          const dataset = await this.datasetsRepository.findOne({
            where: { key: w.datasetId },
          });

          if (!domain) {
            this.logger.error(`Domain '${w.domainId}' not found`);
            throw new NotFoundException(`Domain '${w.domainId}' not found`);
          }
          if (!dataset) {
            this.logger.error(`Dataset '${w.datasetId}' not found`);
            throw new NotFoundException(`Dataset '${w.datasetId}' not found`);
          }

          // Return plain object for insert (no ID - let DB generate it)
          return {
            dashboardId: dashboard.id,
            domainId: domain.id,
            datasetId: dataset.id,
            vizType: w.vizType,
            x: w.x,
            y: w.y,
            w: w.w,
            h: w.h,
          };
        }),
      );

      if (newWidgets.length > 0) {
        this.logger.log(`Inserting ${newWidgets.length} new widgets`);
        this.logger.debug(`New widgets: ${JSON.stringify(newWidgets)}`);
        await this.widgetsRepository.insert(newWidgets);
      }

      // Update dashboard timestamp and layout directly via query to avoid cascade issues
      await this.dashboardsRepository
        .createQueryBuilder()
        .update(Dashboard)
        .set({ updatedAt: new Date(), ...(layout && { layout }) })
        .where("id = :id", { id: dashboard.id })
        .execute();

      this.logger.log(
        `Dashboard saved successfully with ${newWidgets.length} widgets`,
      );
      return {
        success: true,
        message: "Dashboard saved successfully",
        widgetCount: newWidgets.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to save dashboard: ${message}`, stack);
      throw error;
    }
  }
}
