import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Widget } from "./widget.entity";

@Entity("dashboards")
export class Dashboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column({ default: "My Dashboard" })
  name: string;

  @Column({ nullable: true, default: "single" })
  layout: string;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;

  @OneToMany(() => Widget, (widget) => widget.dashboard, { cascade: true })
  widgets: Widget[];
}
