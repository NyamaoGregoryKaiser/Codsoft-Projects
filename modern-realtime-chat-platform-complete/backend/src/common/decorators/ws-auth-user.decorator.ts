import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { User } from '../../users/user.entity'; // Adjust path as needed

/**
 * Custom decorator to extract the authenticated user from a WebSocket context.
 * This assumes `WsJwtAuthGuard` has already run and attached the `user` object to the socket.
 *
 * Usage in a WebSocket gateway:
 * `@SubscribeMessage('someEvent')`
 * `async someHandler(@WsAuthUser() user: User, @MessageBody() data: any) { ... }`
 */
export const WsAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const client: Socket = ctx.switchToWs().getClient<Socket>();
    const user = (client as any).user;

    if (!user) {
      // This should ideally not happen if WsJwtAuthGuard is correctly applied
      // before the handler, but it's a good fallback.
      throw new WsException('User not found in WebSocket context. Is WsJwtAuthGuard applied?');
    }

    return user;
  },
);