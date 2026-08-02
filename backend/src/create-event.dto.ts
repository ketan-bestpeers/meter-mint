import { IsString, IsNotEmpty, IsInt, IsPositive, IsISO8601 } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  meter: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsISO8601()
  timestamp: string;
}
