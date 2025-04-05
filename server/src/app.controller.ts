import { BadRequestException, Controller, Get, InternalServerErrorException } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator, // For PostgreSQL
  MongooseHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator, // For MongoDB
} from '@nestjs/terminus';

@Controller() // This controller now handles the root route '/'
export class AppController {
  constructor(
    private health: HealthCheckService,
    private typeOrmHealth: TypeOrmHealthIndicator, // Inject TypeOrm indicator
    private mongooseHealth: MongooseHealthIndicator, // Inject Mongoose indicator
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get() // Change: Endpoint is now the root route '/'
  @HealthCheck() // Terminus decorator
  async checkHealth() {
    // Add async because health.check() is asynchronous
    // Get the original health check result
    const healthResult = await this.health.check([
      () => this.typeOrmHealth.pingCheck('postgres', { timeout: 3000 }), // 'postgres' is an optional key, timeout prevents long hangs
      () => this.mongooseHealth.pingCheck('mongodb', { timeout: 3000 }), // 'mongodb' is an optional key
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);

    // Add the custom message to the response object
    return {
      message: 'Hello, world', // Add your custom message here
      ...healthResult, // Keep the original status, info, error, details structure from Terminus
    };
  }

  @Get('cpu-load')
  simulateCpuLoad() {
    const n = 35
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

    try {
      const result = this.fibonacci(n);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; 
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

  /**
   * Calculates the nth Fibonacci number using a naive recursive approach.
   * WARNING: This is intentionally inefficient for CPU load simulation.
   * Do not use for actual Fibonacci calculation in production for large n.
   * @param n The index in the Fibonacci sequence (non-negative integer).
   * @returns The nth Fibonacci number.
   */
  private fibonacci(n: number): bigint {
    // Use bigint for potentially large results
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
