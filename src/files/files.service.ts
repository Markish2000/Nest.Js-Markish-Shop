import { existsSync } from 'fs';
import { join } from 'path';

import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  public getStaticProductImage(imageName: string) {
    const path = join(__dirname, '../../static/products', imageName);

    if (existsSync(path)) return path;

    const message = `No product found with image ${imageName}`;
    throw new BadRequestException(message);
  }
}
