import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class WidgetDto {
  @IsString()
  domainId: string; // Accept domain key (e.g., 'sales')

  @IsString()
  datasetId: string; // Accept dataset key (e.g., 'monthly_rev')

  @IsString()
  vizType: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  w: number;

  @IsNumber()
  h: number;
}

export class SaveDashboardDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetDto)
  widgets: WidgetDto[];

  @IsOptional()
  @IsString()
  layout?: string;
}
