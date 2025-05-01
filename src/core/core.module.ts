import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          store: redisStore,
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          ttl: configService.get<number>('redis.ttl', 60 * 60 * 24 * 7), // 7 days default
          password: configService.get<string>('redis.password') || undefined,
          tls: configService.get<boolean>('redis.tls') ? {} : undefined,
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class CoreModule {}
