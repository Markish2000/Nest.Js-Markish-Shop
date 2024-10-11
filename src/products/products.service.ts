import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  DeleteResult,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { validate as isUUID } from 'uuid';

import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from '../common/dtos';

import { Product, ProductImage } from './entities';
import { User } from 'src/auth/entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}

  public async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product: Product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ),
        user,
      });

      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;

      const products: Product[] = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: { images: true },
      });

      return products.map(({ images, ...rest }) => ({
        ...rest,
        images: images.map((image) => image.url),
      }));
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
          this.productRepository.createQueryBuilder('prod');

        product = await queryBuilder
          .where('UPPER(title) =:title or slug =:slug', {
            title: term.toUpperCase(),
            slug: term.toLocaleLowerCase(),
          })
          .leftJoinAndSelect('prod.images', 'prodImages')
          .getOne();
      }

      if (product) return product;

      const message: string = `Product with id ${term} not found.`;
      throw new NotFoundException(message);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  public async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);

    return { ...rest, images: images.map((image) => image.url) };
  }

  public async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: User,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const { images, ...toUpdate } = updateProductDto;

      const product: Product = await this.productRepository.preload({
        id,
        ...toUpdate,
      });

      if (product) {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        if (images) {
          await queryRunner.manager.delete(ProductImage, { product: { id } });
          product.images = images.map((image) =>
            this.productImageRepository.create({ url: image }),
          );
        }

        product.user = user;
        await queryRunner.manager.save(product);

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return this.findOnePlain(id);
      }

      const message: string = `Product with id: ${id} not found.`;

      throw new NotFoundException(message);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

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

  public async deleteAllProducts(): Promise<DeleteResult> {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query.delete().where({}).execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
