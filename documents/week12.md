# In production your app runs behind a load balancer or orchestrator (Kubernetes, ECS, etc). These systems need to know:

Is the app alive? — if not, restart it

Is the app ready to serve traffic? — if not, stop sending requests to it

How is it performing? — latency, error rate, throughput

Without proper health endpoints, a crashed or overloaded app keeps receiving traffic until someone notices manually.

# /health → "is the process alive?"

           simple check — is the Node process running?
           used by: Docker, Kubernetes liveness probe
           if this fails → restart the container

# /ready → "can this instance handle requests right now?"

           deeper check — DB connected? Redis connected?
           used by: load balancer, Kubernetes readiness probe
           if this fails → stop sending traffic, but don't restart

# App starts up → /health returns 200 immediately

               /ready returns 503 until DB connection is established
               load balancer waits before sending traffic
               DB connects → /ready returns 200
               traffic starts flowing

# Basic metrics to track

You don't need Prometheus yet (that's a later topic). For now track these in-process:
| Metric | What it tells you |
| --------------- | ------------------------------------- |
| uptime | how long the process has been running |
| requestCount | total requests handled |
| errorCount | total errors |
| avgResponseTime | average request duration |
| memoryUsage | heap used vs total |


# How this fits in production

Load balancer
  → polls /ready every 5s
  → if 503, removes instance from rotation
  → if 200, sends traffic

Kubernetes
  → liveness probe: /health every 10s → restart if fails
  → readiness probe: /ready every 5s → remove from service if fails

Monitoring (Datadog, BetterStack)
  → polls /metrics
  → alerts if errorRate > 5% or avgResponseTime > 500ms

