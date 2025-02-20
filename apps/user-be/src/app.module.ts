import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
// import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { DatasetModule } from './dataset/dataset.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }), 
    AuthModule, 
    UserModule, 
    PrismaModule, ProjectModule, DatasetModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
