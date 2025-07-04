import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'db';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<Omit<User, 'password'>> {
    // Here you could fetch the user from the database to ensure they still exist
    // For simplicity, we'll just return the payload's user information.
    // The 'sub' property from the payload is the user's ID.
    return { id: payload.sub, email: payload.email } as Omit<User, 'password'>;
  }
}
