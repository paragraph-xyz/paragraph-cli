import { defineConfig } from "tsup";
import { builtinModules } from "module";
import { readFileSync } from "fs";

const nodeExternals = [
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  entry: ["src/index.ts"],
  define: {
    "process.env.CLI_VERSION": JSON.stringify(pkg.version),
  },
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
    // SDK's optional blockchain peers — CLI never calls buy/sell, so these
    // stay as dynamic imports and only resolve if the user installs them.
    "viem",
    "viem/chains",
    "@whetstone-research/doppler-sdk",
    "doppler-router",
    "doppler-router/dist/Permit2",
    ...nodeExternals,
  ],
  noExternal: [
    "@paragraph-com/sdk",
    "picocolors",
    "cli-table3",
    "commander",
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
