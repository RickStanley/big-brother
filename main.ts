import { serve } from "https://deno.land/std@v0.36.0/http/server.ts";
// import * as envJson from "./env.json";
import {
  acceptWebSocket,
  acceptable,
  WebSocket,
  isWebSocketCloseEvent,
} from "https://deno.land/std@v0.36.0/ws/mod.ts";

const s = serve({ port: 8000 });

console.log("http://localhost:8000/");

const clients = new Map<number, WebSocket>();
let clientId = 0;

function dispatch(msg: string): void {
  for (const client of clients.values()) {
    client.send(msg);
  }
}

async function wsHandler(ws: WebSocket): Promise<void> {
  const id = ++clientId;
  clients.set(id, ws);
  dispatch(`Connected: [${id}]`);
  for await (const msg of ws.receive()) {
    console.log(`msg:${id}`, msg);
    if (typeof msg === "string") {
      dispatch(`[${id}]: ${msg}`);
    } else if (isWebSocketCloseEvent(msg)) {
      clients.delete(id);
      dispatch(`Closed: [${id}]`);
      break;
    }
  }
}

for await (const req of s) {
  /** Possibility of beign a browser. */
  const isBrowser = /Mozilla|Chrome|Safaria/.test(
    req.headers.get("user-agent") || "",
  );
  /** Response headers. */
  const responseHeaders = new Headers();

  // We only support one of these
  if (isBrowser) {
    responseHeaders.append("content-type", "text/html; charset=utf-8");
    switch (req.url) {
      case "/":
        if (req.method === "GET") {
          req.respond(
            {
              headers: responseHeaders,
              body: await Deno.readFile("./view/index.html"),
              status: 200,
            },
          );
        } else {
          responseHeaders.append("Allow", "GET");
          req.respond(
            {
              headers: responseHeaders,
              body: await Deno.readFile("./view/405.html"),
              status: 405,
            },
          );
        }
        break;
      case "/favicon.svg":
        if (req.method === "GET") {
          req.respond(
            {
              headers: new Headers({
                "content-type": "image/svg+xml",
              }),
              status: 200,
              body: await Deno.readFile("./view/favicon.svg"),
            },
          );
        }
        break;
      case "/favicon.png":
        if (req.method === "GET") {
          req.respond(
            {
              headers: new Headers({
                "content-type": "image/png",
              }),
              status: 200,
              body: await Deno.readFile("./view/favicon.png"),
            },
          );
        }
        break;
      case "/ws":
        if (req.method === "GET") {
          if (acceptable(req)) {
            acceptWebSocket({
              conn: req.conn,
              bufReader: req.r,
              bufWriter: req.w,
              headers: req.headers,
            }).then(wsHandler);
          }
        } else {
          responseHeaders.append("Allow", "GET");
          req.respond(
            {
              headers: responseHeaders,
              body: await Deno.readFile("./view/405.html"),
              status: 405,
            },
          );
        }
        break;
      default:
        req.respond(
          { body: await Deno.readFile("./view/404.html"), status: 404 },
        );
        break;
    }
  } else {
    responseHeaders.append("content-type", "application/json; charset=utf-8");
  }
}
