export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeout)
      cleanup()
      reject(new Error('Operation aborted'))
    }

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort)
    }

    if (signal?.aborted) {
      clearTimeout(timeout)
      cleanup()
      reject(new Error('Operation aborted'))
      return
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
