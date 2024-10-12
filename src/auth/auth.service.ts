import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

import { compareSync, hashSync } from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto, LoginUserDto } from './dto';

import { User } from './entities';

import { JwtPayload, UserAccount } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserAccount> {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: hashSync(password, 10),
      });

      await this.userRepository.save(user);
      delete user.password;

      return { ...user, token: this.getJwtToken({ id: user.id }) };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<UserAccount> {
    let message: string;

    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });

    if (user) {
      if (compareSync(password, user.password)) {
        return { ...user, token: this.getJwtToken({ id: user.id }) };
      }

      message = 'Credentials are not valid (password).';
      throw new UnauthorizedException(message);
    }

    message = 'Credentials are not valid (email).';
    throw new UnauthorizedException(message);
  }

  async checkStatus(user: User) {
    return { ...user, token: this.getJwtToken({ id: user.id }) };
  }

  private getJwtToken(payload: JwtPayload): string {
    const token: string = this.jwtService.sign(payload);

    return token;
  }

  private handleDBErrors(error: any): void {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    const message: string = 'Please check server logs.';
    throw new InternalServerErrorException(message);
  }
}
