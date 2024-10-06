import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsArray, IsOptional } from 'class-validator';

import { ProductImage } from './product-image.entity';

@Entity({ name: 'products' })
export class Product {
  @Column('text', { nullable: true })
  description: string;

  @Column('text')
  gender: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @Column('float', { default: 0 })
  price: number;

  @Column('text', { array: true })
  sizes: string[];

  @Column('text', { unique: true })
  slug: string;

  @Column('int', { default: 0 })
  stock: number;

  @Column('text', { array: true, default: [] })
  @IsArray()
  @IsOptional()
  tags: string[];

  @Column('text', { unique: true })
  title: string;

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
