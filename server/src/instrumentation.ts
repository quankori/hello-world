import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { defaultResource } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

console.log('Initializing OpenTelemetry SDK...');

const resource = defaultResource();
console.log(resource)
console.log(process.env.OTEL_SERVICE_NAME)

const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    'http://localhost:4318/v1/traces',
  // headers: {}, // Optional headers
});

const spanProcessor = new BatchSpanProcessor(traceExporter);

const instrumentations = [getNodeAutoInstrumentations()];

const sdk = new NodeSDK({
  resource: resource, // Use the defaultResource instance
  spanProcessor: spanProcessor,
  instrumentations: instrumentations,
});

try {
  sdk.start();
  console.log('OpenTelemetry SDK started successfully.');

  // Graceful shutdown handling
  const shutdown = () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully.'))
      .catch((error) =>
        console.error('Error shutting down OpenTelemetry SDK:', error),
      )
      .finally(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  console.error('Error starting OpenTelemetry SDK:', error);
  process.exit(1);
}
