import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MongooseHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Counter, Histogram } from 'prom-client';
import {
  InjectMetric,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Injectable()
export class AppService {
  constructor(
    private health: HealthCheckService,
    private typeOrmHealth: TypeOrmHealthIndicator,
    private mongooseHealth: MongooseHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    @InjectMetric('fibonacci_requests_total')
    private readonly fibonacciRequestCounter: Counter<string>,
    @InjectMetric('fibonacci_calculation_duration_seconds')
    private readonly fibonacciDurationHistogram: Histogram<string>,
  ) {}

  async getHealthCheck() {
    const healthResult = await this.health.check([
      () => this.typeOrmHealth.pingCheck('postgres', { timeout: 3000 }),
      () => this.mongooseHealth.pingCheck('mongodb', { timeout: 3000 }),
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);

    return {
      message: 'Hello, world',
      ...healthResult,
    };
  }

  cpuBound(n = 35) {
    this.fibonacciRequestCounter.inc();

    console.log(`Starting CPU-intensive task with n = ${n}...`);

    if (n <= 0) {
      throw new BadRequestException(
        'Query parameter "n" must be a positive integer.',
      );
    }
    if (n > 45) {
      throw new BadRequestException(
        '"n" is too large and may cause excessive load or timeout (max recommended: 45).',
      );
    }

    const startTime = Date.now();
    const endTimer = this.fibonacciDurationHistogram.startTimer();

    try {
      const result = this.fibonacci(n);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      endTimer();

      console.log(
        `Finished CPU-intensive task with n = ${n}. Result: ${result}, Duration: ${duration}s`,
      );

      return {
        message: `CPU-intensive task completed for n = ${n}`,
        result: result.toString(),
        duration_seconds: duration,
      };
    } catch (error) {
      console.error(`Error during Fibonacci calculation for n = ${n}:`, error);
      throw new InternalServerErrorException(
        'Calculation failed due to recursion depth or other error.',
      );
    }
  }

  private fibonacci(n: number): bigint {
    if (n <= 1) {
      return BigInt(n);
    }
    if (n > 1000) {
      throw new Error(
        'Input too large for recursive Fibonacci due to stack limits',
      );
    }
    try {
      return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    } catch (e) {
      if (e instanceof RangeError) {
        console.error(`Stack overflow likely for fibonacci(${n})`);
        throw new Error(`Input ${n} caused stack overflow.`);
      }
      throw e;
    }
  }
}
