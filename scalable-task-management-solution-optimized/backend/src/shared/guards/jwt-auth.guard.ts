import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on the "info" object or other factors
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}