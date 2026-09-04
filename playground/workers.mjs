import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
console.log('filename:', __filename)

function heavyWork(limit) {
  let total = 0
  for (let i = 0; i < limit; i++) total += i
  return total
}

if (isMainThread) {
  console.log('main thread: starting')
  console.time('worker')

  // spawn a worker to do the heavy work
  const worker = new Worker(__filename, {
    workerData: { limit: 1_000_000_000 },
  })

  worker.on('message', (result) => {
    console.timeEnd('worker')
    console.log('main thread: got result from worker:', result)
  })

  worker.on('error', (err) => console.error('worker error:', err))

  // main thread stays free — this logs while worker is computing
  console.log('main thread: still running while worker computes...')
} else {
  // this runs inside the worker thread
  const result = heavyWork(workerData.limit)
  parentPort.postMessage(result)
}
