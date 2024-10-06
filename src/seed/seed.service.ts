import { Injectable } from '@nestjs/common';

import { ProductsService } from '../products/products.service';
import { initialData } from './data';

@Injectable()
export class SeedService {
  constructor(private readonly productsService: ProductsService) {}

  public async runSeed(): Promise<string> {
    await this.insertNewProducts();

    return 'Seed executed';
  }

  private async insertNewProducts(): Promise<boolean> {
    await this.productsService.deleteAllProducts();

    const products = initialData.products;

    const insertPromises = [];

    products.forEach((product) => {
      insertPromises.push(this.productsService.create(product));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
