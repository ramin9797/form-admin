import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '@src/tokens/token.service';
import { Cache } from 'cache-manager';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private jwtService:JwtService,
    private config:ConfigService,
    private tokenService:TokenService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
    ){

  }

  async canActivate(
    context: ExecutionContext,
  ):   Promise<boolean>  {
    const request = context.switchToHttp().getRequest();
    const refresh_token = request.cookies.refresh_token;
    const token = this.extractTokenFromHeader(request);
    if(!token || !refresh_token){
      throw new UnauthorizedException()
    }
    try{
      // 1) Нужно проверить есть ли вообще данный токен в базе и не revoke ли он и не закончилось его время
      await this.jwtService.verifyAsync(request.cookies.refresh_token,{
        secret:this.config.get<string>("JWT_REFRESH_SECRET")
      })
      
      let findRefreshToken = await this.tokenService.findToken(refresh_token)
      if(!findRefreshToken){
        throw new UnauthorizedException()
      }
      
      const payload = await this.jwtService.verifyAsync(token,{
        secret:this.config.get<string>("JWT_SECRET")
      })

      request.user = payload;
    }
    catch(e){
      console.log('erer',e);
      throw new UnauthorizedException({message:"Session expired"})
    }
    return true;

  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
