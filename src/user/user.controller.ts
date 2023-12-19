import { Body, Controller, Get, Header, Headers, HttpException, HttpStatus, Inject, Post, Request, Res, UnauthorizedException, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { LoginUserDto, UserCreateDto } from './dto/user-create.dto';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { CookieOptions, Request as ExpressRequest, Response } from 'express';
import { AuthGuard } from '@src/guards/auth.guard';
import { IToken } from '@src/tokens/token.interface';
import { Cookie } from '@src/decorators/cookie.decorator';
import { Agent } from '@src/decorators/agent.decorator';
import { IAuthResult } from './user.interface';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller('auth')
export class UserController {
    
    constructor(private userService:UserService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
        ){}

    @UsePipes(ValidationPipe)
    @Post("register")
    async register(@Body() userData:UserCreateDto,@Res() res:Response){
        let result = await this.userService.register(userData);
        await this.setRefreshCookie(result.refresh_token,res);
        await this.cacheManager.set(`${result.user.id}`,result.user,3600);
        console.log('111',await this.cacheManager.get(`${result.user.id}`))
        
        res.status(HttpStatus.CREATED).json({
            userId:result.user.id,
            access_token:result.access_token
        });
    }


    @Post("login")
    async login(@Body() userData:LoginUserDto,@Res() res:Response){
        let tokens = await this.userService.login(userData.email,userData.password);
        await this.setRefreshCookie(tokens.refresh_token,res);
        res.status(HttpStatus.CREATED).json(tokens);
    }

    async setRefreshCookie(token:string,res:Response){
        if(!token){
            throw new UnauthorizedException({message:"Token not found"});
        }
        let cookieOptions:CookieOptions = {
            maxAge:30 * 24 *60 *60 ,// 30 days
            // domain:'/',
            sameSite:'strict',
            secure:false
        }
        res.cookie("refresh_token",token,cookieOptions)
    }

    @UseGuards(AuthGuard)
    @Get("all")
    async findAll(@Request() req:ExpressRequest,@Headers("user-agent") agent2:string){
        console.log(req.user.id)
        // console.log("agent",agent2)
        let cache = await this.cacheManager.store.get(`${req.user.id}`)
        console.log(cache);        
        console.log('111',await this.cacheManager.get(`${req.user.id}`))
        // return await this.userService.findAll();
    }

    @Post("refresh")
    async refresh_token(@Res() res:Response,@Request() req:ExpressRequest,@Cookie("refresh_token") token:string){
        console.log("token",token);
        
        const tokens:IToken =  await this.userService.refresh_token(token)
        this.setRefreshCookie(tokens.refresh_token,res);
        res.status(HttpStatus.CREATED).json(tokens);
    }


    @UseGuards(AuthGuard)
    @Get("getMe")
    async getMe(@Res() res:Response,@Request() req:ExpressRequest){
        res.status(HttpStatus.OK).json(req.user)
    }

}
