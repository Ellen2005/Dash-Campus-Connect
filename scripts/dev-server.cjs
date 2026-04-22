// Next.js v16 defaults to Turbopack. Turbopack requires spawning a child process,
// which is blocked in some sandboxed environments (Node throws "spawn EPERM").
// Force webpack bundler to keep dev server working without child process spawning.
process.env.IS_WEBPACK_TEST = process.env.IS_WEBPACK_TEST || "1";
delete process.env.TURBOPACK;

const http = require("http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "9002", 10);
const hostname = process.env.HOSTNAME || "localhost";

async function main() {
  const app = next({
    dev: true,
    dir: __dirname + "/..",
    hostname,
    port,
  });

  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => handle(req, res));

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, hostname, resolve);
  });

  // Keep output format similar to Next.
  // eslint-disable-next-line no-console
  console.log(`> Dash dev server ready on http://${hostname}:${port}`);

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
