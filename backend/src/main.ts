import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 app.setGlobalPrefix('api');
 app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:8081').split(',') });
 app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
 const port = Number(process.env.PORT ?? 3000);
 await app.listen(port);
 const logger = new Logger('Bootstrap');
 logger.log('MongoDB connected successfully');
 logger.log(`Backend running at http://localhost:${port}`);
 logger.log(`API available at http://localhost:${port}/api`);
}
bootstrap();
