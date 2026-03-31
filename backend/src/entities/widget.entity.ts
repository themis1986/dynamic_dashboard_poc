import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Dashboard } from "./dashboard.entity";

@Entity("widgets")
export class Widget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dashboardId: number;

  @Column()
  domainId: number;

  @Column()
  datasetId: number;

  @Column()
  vizType: string; // 'line', 'bar', 'pie', etc.

  @Column({ type: "integer" })
  x: number;

  @Column({ type: "integer" })
  y: number;

  @Column({ type: "integer" })
  w: number;

  @Column({ type: "integer" })
  h: number;

  @ManyToOne(() => Dashboard, (dashboard) => dashboard.widgets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "dashboardId" })
  dashboard: Dashboard;
}
