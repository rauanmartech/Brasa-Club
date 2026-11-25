import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));
const publicDirectories = new Set(["assets", "scripts", "styles"]);
const types = new Map(Object.entries({
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8"
}));

function isPublicPath(path) {
  return path === "index.html" || publicDirectories.has(path.split("/")[0]);
}

function reject(response, code) {
  response.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(code === 404 ? "Arquivo não encontrado." : "Requisição indisponível.");
}

async function serve(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return reject(response, 405);
  }
  let pathname;
  try {
    pathname = decodeURIComponent(request.url.split("?")[0]);
  } catch {
    return reject(response, 400);
  }
  if (!pathname.startsWith("/") || /[\\:\u0000]/.test(pathname) ||
      pathname.split("/").some(part => part.startsWith("."))) {
    return reject(response, 404);
  }
  const path = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!isPublicPath(path)) return reject(response, 404);
  try {
    const file = await realpath(resolve(root, path));
    const target = relative(root, file).split(sep).join("/");
    if (isAbsolute(target) || !isPublicPath(target) || !types.has(extname(file))) {
      return reject(response, 404);
    }
    const info = await stat(file);
    if (!info.isFile()) return reject(response, 404);
    response.writeHead(200, {
      "Content-Type": types.get(extname(file)),
      "Content-Length": info.size,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") return response.end();
    await pipeline(createReadStream(file), response);
  } catch (error) {
    if (response.headersSent) return response.destroy();
    reject(response, ["ENOENT", "ENOTDIR", "EACCES", "EISDIR"].includes(error.code) ? 404 : 500);
  }
}

let options;
try {
  options = parseArgs({ options: {
    host: { type: "string", default: "127.0.0.1" },
    port: { type: "string", default: "5173" }
  }}).values;
  if (!/^\d+$/.test(options.port) || Number(options.port) < 1 || Number(options.port) > 65535) {
    throw new Error("A porta deve ser um número de 1 a 65535.");
  }
} catch (error) {
  console.error(error.message);
  console.error("Uso: npm run dev -- --host 0.0.0.0 --port 5173");
  process.exit(1);
}

const server = createServer(serve);
server.on("error", error => {
  console.error(error.code === "EADDRINUSE"
    ? `A porta ${options.port} está ocupada. Escolha outra com --port.`
    : error.message);
  process.exitCode = 1;
});

server.listen(Number(options.port), options.host, () => {
  const hosts = options.host === "0.0.0.0"
    ? ["localhost", ...Object.values(networkInterfaces()).flat().filter(address => address?.family === "IPv4" && !address.internal).map(address => address.address)]
    : [options.host === "127.0.0.1" ? "localhost" : options.host];
  for (const host of new Set(hosts)) {
    const address = host.includes(":") ? `[${host}]` : host;
    console.log(`Brasa Club em http://${address}:${options.port}`);
  }
});
