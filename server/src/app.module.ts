import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule global
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
        // Important: Never use synchronize: true in production
        synchronize: false, // Should only be true during development
        autoLoadEntities: true, // Automatically load entities (if any)
        logging: configService.get<string>('NODE_ENV') === 'development', // Log SQL queries during development
      }),
    }),

    // 4. Mongoose Module for MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
      ): MongooseModuleFactoryOptions => {
        // Get necessary config values (NO user/pass/authSource needed)
        const nodes = configService.get<string>('MONGO_REPLICA_URI_NODES'); // e.g., "mongo1:27017,mongo2:27017"
        const dbName = configService.get<string>('MONGO_DB_NAME');
        const replicaSet = configService.get<string>('MONGO_REPLICA_SET_NAME');

        // Construct the Replica Set URI WITHOUT authentication part
        const uri = `mongodb://${nodes}/${dbName}?replicaSet=${replicaSet}`;

        console.log('MongoDB Replica Set URI (No Auth):', uri); // Debug URI

        return {
          uri: uri,
          // You can still specify read preference
          readPreference: 'secondaryPreferred',
          // Other Mongoose options if needed
        };
      },
    }),
  ],
  controllers: [AppController],
  // Remove AppService if getHello is removed from AppController
  // providers: [AppService],
  providers: [], // Provide AppService if needed elsewhere, otherwise empty
})
export class AppModule {}
