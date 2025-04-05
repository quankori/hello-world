import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  @HealthCheck()
  async checkHealth() {
    return this.appService.getHealthCheck();
  }

  @Get('cpu-load')
  simulateCpuLoad(@Query('n', new DefaultValuePipe(35), ParseIntPipe) n: number) {
    return this.appService.cpuBound(n);
  }
}
