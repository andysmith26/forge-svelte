import type { Clock } from '$lib/application/ports/Clock';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
