import { spawn } from "node:child_process";
const production = process.argv.includes("--production");
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", production ? "start" : "dev", "--port", production ? "43200" : "43210", "-H", "127.0.0.1"], {
  stdio: "inherit",
  env: { ...process.env, SAMA_QA_FIXTURE: production ? "" : "1", NEXT_PUBLIC_SAMA_API_MODE: "mock" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code ?? 1));
