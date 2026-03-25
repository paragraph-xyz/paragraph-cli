import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface Config {
  apiKey?: string;
}

function getConfigDir(): string {
  return path.join(os.homedir(), ".paragraph");
}

function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function readConfig(): Config {
  try {
    const data = fs.readFileSync(getConfigPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function writeConfig(update: Config): void {
  const dir = getConfigDir();
  const existing = readConfig();
  const merged = { ...existing, ...update };
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + "\n", {
    mode: 0o600,
  });
  // Enforce permissions even if the file already existed
  fs.chmodSync(configPath, 0o600);
}

export function deleteConfig(): void {
  try {
    fs.unlinkSync(getConfigPath());
  } catch (err) {
    // Only ignore "file not found" errors
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
