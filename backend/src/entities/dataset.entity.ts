import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Domain } from './domain.entity';

@Entity('datasets')
export class Dataset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string; // e.g., 'monthly_rev', 'top_products'

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('simple-json')
  tags: string[];

  @Column()
  domainId: number;

  @ManyToOne(() => Domain, domain => domain.datasets)
  @JoinColumn({ name: 'domainId' })
  domain: Domain;
}
