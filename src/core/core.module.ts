import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerService } from './services/logger.service';
import configuration from './config/configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          ttl: configService.get<number>('redis.ttl', 60 * 60 * 24 * 7),
          max: 100,
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CoreModule {}
