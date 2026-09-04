import cluster from 'node:cluster'
import http from 'node:http'
import os from 'node:os'

const numCPUs = os.cpus().length
console.log('numCPUs:', numCPUs)

if (cluster.isPrimary) {
  console.log(`primary process ${process.pid} — forking ${numCPUs} workers`)

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker) => {
    console.log(`worker ${worker.process.pid} died`)
  })
} else {
  // each worker runs a small HTTP server
  http
    .createServer((req, res) => {
      res.writeHead(200)
      res.end(`handled by worker ${process.pid}\n`)
    })
    .listen(3001)

  console.log(`worker ${process.pid} started`)
}
