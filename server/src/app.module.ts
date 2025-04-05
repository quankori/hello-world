import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { AppService } from './app.service';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TerminusModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        synchronize: false,
        autoLoadEntities: true,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
      ): MongooseModuleFactoryOptions => {
        const nodes = configService.get<string>('MONGO_REPLICA_URI_NODES');
        const dbName = configService.get<string>('MONGO_DB_NAME');
        const replicaSet = configService.get<string>('MONGO_REPLICA_SET_NAME');

        const uri = `mongodb://${nodes}/${dbName}?replicaSet=${replicaSet}`;

        console.log('MongoDB Replica Set URI (No Auth):', uri); // Debug URI

        return {
          uri: uri,
          readPreference: 'secondaryPreferred',
        };
      },
    }),

    PrometheusModule.register(),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    makeCounterProvider({
      name: 'fibonacci_requests_total',
      help: 'Total number of requests to the /cpu-load endpoint',
    }),
    makeHistogramProvider({
      name: 'fibonacci_calculation_duration_seconds',
      help: 'Duration of Fibonacci calculation in seconds',
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60], 
    }),
  ],
})
export class AppModule {}
