interface Metrics {
  requestCount: number
  errorCount: number
  totalResponseTimeMs: number
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTimeMs: 0,
}

export function incrementRequests(durationMs: number): void {
  metrics.requestCount++
  metrics.totalResponseTimeMs += durationMs
}

export function incrementErrors(): void {
  metrics.errorCount++
}

export function getMetrics() {
  const avgResponseTimeMs =
    metrics.requestCount > 0
      ? Math.round(metrics.totalResponseTimeMs / metrics.requestCount)
      : 0

  return {
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    avgResponseTimeMs,
    errorRate:
      metrics.requestCount > 0
        ? Math.round((metrics.errorCount / metrics.requestCount) * 100)
        : 0,
  }
}
