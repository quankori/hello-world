import { Injectable } from '@nestjs/common';
import { Response } from './app.types';

@Injectable()
export class AppService {
  async getHello(): Promise<Response> {
    return {
      server: 'Hello World!',
      status: 200,
    };
  }
}
