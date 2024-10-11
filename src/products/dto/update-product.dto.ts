import { PartialType } from '@nestjs/swagger';

import { CreateProductDto } from './';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
