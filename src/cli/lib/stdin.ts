const STDIN_TIMEOUT_MS = 30_000;
const STDIN_MAX_BYTES = 10 * 1024 * 1024; // 10MB

export function readStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const timer = setTimeout(() => {
      process.stdin.destroy();
      reject(new Error("Timed out waiting for stdin input."));
    }, STDIN_TIMEOUT_MS);
    process.stdin.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > STDIN_MAX_BYTES) {
        clearTimeout(timer);
        process.stdin.destroy();
        reject(new Error(`Stdin input exceeds ${STDIN_MAX_BYTES / 1024 / 1024}MB limit.`));
        return;
      }
      chunks.push(chunk);
    });
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    process.stdin.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
