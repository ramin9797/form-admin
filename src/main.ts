import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './exception-filters/all.filter';
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionFilter())
  app.use(cookieParser())
  app.enableCors({
    origin:"http://localhost:3001",
    credentials:true
  });
  const port = process.env.PORT || 4000;
  await app.listen(port,()=>console.log("Server run on port",port));
}
bootstrap();
