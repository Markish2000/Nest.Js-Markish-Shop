import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { compareSync, hashSync } from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto, LoginUserDto } from './dto';

import { User } from './entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  public async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: hashSync(password, 10),
      });

      await this.userRepository.save(user);
      delete user.password;

      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  public async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true },
    });

    if (user) {
      if (compareSync(password, user.password)) return user;

      const message = 'Credentials are not valid (password).';
      throw new UnauthorizedException(message);
    }

    const message = 'Credentials are not valid (email).';
    throw new UnauthorizedException(message);
  }

  private handleDBErrors(error: any): void {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    const message = 'Please check server logs.';
    throw new InternalServerErrorException(message);
  }
}
