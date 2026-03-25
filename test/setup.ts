import { vi } from "vitest";

// Mock the SDK client to avoid loading doppler-router (which has
// extensionless ESM imports that can't resolve outside a bundler).
vi.mock("../src/services/client.js", () => ({
  createClient: () => ({
    posts: { get: vi.fn(), list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), sendTestEmail: vi.fn() },
    subscribers: { get: vi.fn(), create: vi.fn(), getCount: vi.fn(), importCsv: vi.fn() },
    feed: { get: vi.fn() },
    me: { get: vi.fn() },
  }),
}));
