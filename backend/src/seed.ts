import { DataSource } from "typeorm";
import { Domain } from "./entities/domain.entity";
import { Dataset } from "./entities/dataset.entity";

// Seed data from constants
const DOMAINS = [
  {
    key: "sales",
    name: "Sales",
    icon: "📈",
    description: "Revenue, pipeline & product performance",
  },
  {
    key: "finance",
    name: "Finance",
    icon: "💰",
    description: "P&L, budgets & cash flow analysis",
  },
  {
    key: "marketing",
    name: "Marketing",
    icon: "📣",
    description: "Campaigns, channels & conversion funnels",
  },
  {
    key: "operations",
    name: "Operations",
    icon: "⚙️",
    description: "Inventory, fulfillment & supplier metrics",
  },
  {
    key: "hr",
    name: "Human Resources",
    icon: "👥",
    description: "Headcount, attrition & satisfaction",
  },
];

const DATASETS = {
  sales: [
    {
      key: "monthly_rev",
      name: "Monthly Revenue",
      description: "12-month revenue vs. target",
      tags: ["Revenue", "KPI"],
    },
    {
      key: "top_products",
      name: "Top Products",
      description: "Best-performing products",
      tags: ["Products"],
    },
    {
      key: "pipeline",
      name: "Sales Pipeline",
      description: "Deals by stage",
      tags: ["Pipeline"],
    },
    {
      key: "regional",
      name: "Regional Performance",
      description: "Revenue by region",
      tags: ["Geo"],
    },
  ],
  finance: [
    {
      key: "pnl",
      name: "P&L Summary",
      description: "Monthly income & expenses",
      tags: ["P&L"],
    },
    {
      key: "budget",
      name: "Budget vs Actual",
      description: "Dept-level adherence",
      tags: ["Budget"],
    },
    {
      key: "cashflow",
      name: "Cash Flow",
      description: "Weekly inflow/outflow",
      tags: ["Cash"],
    },
  ],
  marketing: [
    {
      key: "campaigns",
      name: "Campaign Performance",
      description: "Impressions, clicks, conversions",
      tags: ["Campaigns"],
    },
    {
      key: "channels",
      name: "Channel Attribution",
      description: "Traffic by channel",
      tags: ["Attribution"],
    },
    {
      key: "funnel",
      name: "Funnel Analysis",
      description: "Stage-by-stage drop-off",
      tags: ["Funnel"],
    },
  ],
  operations: [
    {
      key: "inventory",
      name: "Inventory Levels",
      description: "Stock vs reorder levels",
      tags: ["Inventory"],
    },
    {
      key: "fulfillment",
      name: "Order Fulfillment",
      description: "Fulfilled and pending orders",
      tags: ["Orders"],
    },
    {
      key: "suppliers",
      name: "Supplier Performance",
      description: "On-time and quality scores",
      tags: ["Suppliers"],
    },
  ],
  hr: [
    {
      key: "headcount",
      name: "Headcount by Dept",
      description: "Current staff & open roles",
      tags: ["Headcount"],
    },
    {
      key: "attrition",
      name: "Attrition Rate",
      description: "Quarterly attrition & hires",
      tags: ["Attrition"],
    },
    {
      key: "satisfaction",
      name: "Employee Satisfaction",
      description: "Monthly eNPS scores",
      tags: ["eNPS"],
    },
  ],
};

export async function seedDatabase() {
  const dataSource = new DataSource({
    type: "sqlite",
    database: "dashboard.sqlite",
    entities: [Domain, Dataset],
    synchronize: true, // Create tables if they don't exist
  });

  await dataSource.initialize();
  console.log("🌱 Starting database seed...");

  const domainRepo = dataSource.getRepository(Domain);
  const datasetRepo = dataSource.getRepository(Dataset);

  // Clear existing data
  await datasetRepo.clear();
  await domainRepo.clear();
  console.log("   Cleared existing data");

  // Seed domains and datasets
  for (const domainData of DOMAINS) {
    const domain = domainRepo.create(domainData);
    await domainRepo.save(domain);
    console.log(`   ✓ Created domain: ${domain.name}`);

    const datasets = DATASETS[domainData.key] || [];
    for (const datasetData of datasets) {
      const dataset = datasetRepo.create({
        ...datasetData,
        domainId: domain.id,
      });
      await datasetRepo.save(dataset);
    }
    console.log(`   ✓ Created ${datasets.length} datasets for ${domain.name}`);
  }

  await dataSource.destroy();
  console.log("✅ Database seeding completed!");
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
