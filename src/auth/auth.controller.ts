import { AuthGuard } from '@nestjs/passport';
import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';

import { AuthService } from './auth.service';

import { CreateUserDto, LoginUserDto } from './dto';

import { Auth, GetUser, RawHeaders } from './decorators';

import { User } from './entities';

import { UserAccount, ValidRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto): Promise<UserAccount> {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto): Promise<UserAccount> {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  checkStatus(@GetUser() user: User) {
    return this.authService.checkStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string,
  ) {
    return {
      ok: true,
      message: 'Hola Mundo',
      user,
    };
  }

  @Get('private2')
  @Auth(ValidRoles.admin, ValidRoles.superUser)
  privateRoute2(@GetUser() user: User) {
    return { ok: true, user };
  }
}
