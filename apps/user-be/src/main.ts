import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes( new ValidationPipe({whitelist: true}))

  app.enableCors({
    // origin: false,  // Completely disables cross-origin requests
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow only these origins
    Credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Users-Backend')
    .setDescription('Service for user authentication and database upload')
    .setVersion('1.0')
    .addTag('user-be')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);


  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
