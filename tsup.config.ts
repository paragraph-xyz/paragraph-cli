import { defineConfig } from "tsup";
import { builtinModules } from "module";

const nodeExternals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: "node18",
  // Bundle most deps, but externalize ESM-only packages with top-level await
  // and Node builtins (so bundled CJS require() calls work)
  external: [
    "ink",
    "react",
    "react-dom",
    "react-devtools-core",
    "@inkjs/ui",
    "yoga-layout",
    "yoga-wasm-web",
    "yoga-wasm-web2",
    ...nodeExternals,
  ],
  noExternal: [
    "@paragraph-com/sdk",
    "axios",
    "doppler-router",
    "picocolors",
    "cli-table3",
    "commander",
    "follow-redirects",
    "form-data",
    "combined-stream",
    "delayed-stream",
    "asynckit",
    "mime-types",
    "mime-db",
    "proxy-from-env",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  banner: {
    js: [
      "#!/usr/bin/env node",
      'import { createRequire as __createRequire } from "module";',
      "const require = __createRequire(import.meta.url);",
    ].join("\n"),
  },
});
