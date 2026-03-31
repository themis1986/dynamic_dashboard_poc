import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Dataset } from "./dataset.entity";

@Entity("domains")
export class Domain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string; // e.g., 'sales', 'finance'

  @Column()
  name: string;

  @Column()
  icon: string;

  @Column()
  description: string;

  @OneToMany(() => Dataset, (dataset) => dataset.domain)
  datasets: Dataset[];
}
