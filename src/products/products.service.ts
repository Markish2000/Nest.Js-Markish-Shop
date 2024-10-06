import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, SelectQueryBuilder } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from 'src/common/dtos';

import { Product } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product: Product = this.productRepository.create(createProductDto);

      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public async findAll(paginationDto: PaginationDto): Promise<Product[]> {
    try {
      const { limit = 10, offset = 0 } = paginationDto;

      const products: Product[] = await this.productRepository.find({
        take: limit,
        skip: offset,
      });

      return products;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public async findOne(term: string): Promise<Product> {
    try {
      let product: Product;

      if (isUUID(term)) {
        product = await this.productRepository.findOneBy({ id: term });
      } else {
        const queryBuilder: SelectQueryBuilder<Product> =
          this.productRepository.createQueryBuilder();

        product = await queryBuilder
          .where('UPPER(title) =:title or slug =:slug', {
            title: term.toUpperCase(),
            slug: term.toLocaleLowerCase(),
          })
          .getOne();
      }

      if (product) return product;

      const message: string = `Product with id ${term} not found.`;
      throw new NotFoundException(message);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      const product: Product = await this.productRepository.preload({
        id: id,
        ...updateProductDto,
      });

      if (product) return this.productRepository.save(product);

      const message: string = `Product with id: ${id} not found.`;

      throw new NotFoundException(message);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public async remove(id: string): Promise<void> {
    try {
      const product: Product = await this.findOne(id);

      await this.productRepository.remove(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any): void {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);

    const message: string = 'Unexpected error, check server logs.';
    throw new InternalServerErrorException(message);
  }
}
