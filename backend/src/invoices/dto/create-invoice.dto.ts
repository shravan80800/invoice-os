import { IsString, IsNumber, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceLineItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  taxAmount: number;

  @IsNumber()
  totalAmount: number;
}

export class CreateInvoiceDto {
  @IsString()
  customerId: string;

  @IsString()
  invoiceNumber: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  subTotal: number;

  @IsNumber()
  taxTotal: number;

  @IsNumber()
  grandTotal: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  lineItems: CreateInvoiceLineItemDto[];
}