import { config as loadEnv } from 'dotenv';
import * as Sentry from '@sentry/nestjs';

loadEnv();

const tracesSampleRateRaw = Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1');
const tracesSampleRate = Number.isFinite(tracesSampleRateRaw)
  ? Math.min(1, Math.max(0, tracesSampleRateRaw))
  : 0.1;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate,
  sendDefaultPii: false,
});