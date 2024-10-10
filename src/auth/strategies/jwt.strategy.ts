import { PassportStrategy } from '@nestjs/passport';

import { Strategy } from 'passport-jwt';

import { User } from '../entities';

import { JwtPayload } from '../interfaces';

export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload): Promise<User> {
    const { email } = payload;

    return;
  }
}
