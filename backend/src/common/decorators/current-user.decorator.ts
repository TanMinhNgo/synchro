import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserClaims = {
  sub: string;
  email: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserClaims | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
