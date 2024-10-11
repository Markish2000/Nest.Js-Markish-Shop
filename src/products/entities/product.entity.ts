import { ApiProperty } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsArray, IsOptional } from 'class-validator';

import { ProductImage } from './product-image.entity';
import { User } from '../../auth/entities';

@Entity({ name: 'products' })
export class Product {
  @ApiProperty({
    example: 'Anim reprehende null',
    description: 'Product description',
    default: null,
  })
  @Column('text', { nullable: true })
  description: string;

  @ApiProperty({
    example: 'Women',
    description: 'Product gender',
  })
  @Column('text')
  gender: string;

  @ApiProperty({
    example: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8',
    description: 'Product id',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @ApiProperty({
    example: 0,
    description: 'Product price',
  })
  @Column('float', { default: 0 })
  price: number;

  @ApiProperty({
    example: ['M', 'XL', 'XXL'],
    description: 'Product sizes',
  })
  @Column('text', { array: true })
  sizes: string[];

  @ApiProperty({
    example: 't_shirt',
    description: 'Product slug - for SEO',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  slug: string;

  @ApiProperty({
    example: 10,
    description: 'Product stock',
    default: 0,
  })
  @Column('int', { default: 0 })
  stock: number;

  @ApiProperty()
  @Column('text', { array: true, default: [] })
  @IsArray()
  @IsOptional()
  tags: string[];

  @ApiProperty({
    example: 'T-Shirt',
    description: 'Product title',
    uniqueItems: true,
  })
  @Column('text', { unique: true })
  title: string;

  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  @BeforeInsert()
  checkSlugInsert(): void {
    if (!this.slug) this.slug = this.title;

    this.slug.toLowerCase().replaceAll(' ', '_').replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate(): void {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
