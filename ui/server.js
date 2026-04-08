const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const UI_DIR = __dirname;
const INTERFACE_DIR = path.resolve(__dirname, "../interface");
const ENGINE_DIR = path.resolve(__dirname, "../Pikafish/src");
const ENGINE_BIN = path.join(ENGINE_DIR, "pikafish");
const START_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const INTERFACE_COMMAND_LIMIT = 200;

let nextInterfaceCommandId = 1;
const interfaceCommands = [];

class UciEngine {
  constructor() {
    this.child = null;
    this.stdoutBuffer = "";
    this.stderrBuffer = "";
    this.waiters = [];
    this.ready = false;
    this.busy = false;
    this.initPromise = null;
    this.infoCollector = null;
    this.lastInfoLine = null;
  }

  startProcess() {
    if (this.child) {
      return;
    }

    if (!fs.existsSync(ENGINE_BIN)) {
      throw new Error(
        `没有找到 Pikafish 可执行文件：${ENGINE_BIN}。请先在 ../Pikafish/src 执行 make -j4 build。`,
      );
    }

    this.child = spawn(ENGINE_BIN, [], {
      cwd: ENGINE_DIR,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.child.stdout.setEncoding("utf8");
    this.child.stderr.setEncoding("utf8");

    this.child.stdout.on("data", (chunk) => {
      this.handleStdout(chunk);
    });

    this.child.stderr.on("data", (chunk) => {
      this.handleStderr(chunk);
    });

    this.child.on("exit", (code, signal) => {
      const reason = new Error(`Pikafish 已退出（code=${code ?? "null"}, signal=${signal ?? "null"}）。`);
      this.rejectWaiters(reason);
      this.child = null;
      this.ready = false;
      this.infoCollector = null;
      this.lastInfoLine = null;
    });
  }

  handleStdout(chunk) {
    this.stdoutBuffer += chunk;

    while (this.stdoutBuffer.includes("\n")) {
      const newlineIndex = this.stdoutBuffer.indexOf("\n");
      const line = this.stdoutBuffer.slice(0, newlineIndex).replace(/\r$/, "").trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      if (this.infoCollector && line.startsWith("info ")) {
        this.infoCollector.push(line);
        this.lastInfoLine = line;
      }

      this.resolveWaiters(line);
    }
  }

  handleStderr(chunk) {
    this.stderrBuffer += chunk;

    while (this.stderrBuffer.includes("\n")) {
      const newlineIndex = this.stderrBuffer.indexOf("\n");
      const line = this.stderrBuffer.slice(0, newlineIndex).replace(/\r$/, "").trim();
      this.stderrBuffer = this.stderrBuffer.slice(newlineIndex + 1);

      if (!line) {
        continue;
      }

      if (this.infoCollector && line.startsWith("info ")) {
        this.infoCollector.push(line);
        this.lastInfoLine = line;
      }
    }
  }

  resolveWaiters(line) {
    const remaining = [];

    this.waiters.forEach((waiter) => {
      if (waiter.predicate(line)) {
        clearTimeout(waiter.timer);
        waiter.resolve(line);
      } else {
        remaining.push(waiter);
      }
    });

    this.waiters = remaining;
  }

  rejectWaiters(error) {
    this.waiters.forEach((waiter) => {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    });
    this.waiters = [];
  }

  waitFor(predicate, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((item) => item !== waiter);
          reject(new Error("等待 Pikafish 响应超时。"));
        }, timeoutMs),
      };

      this.waiters.push(waiter);
    });
  }

  send(command) {
    if (!this.child) {
      throw new Error("Pikafish 进程尚未启动。");
    }

    this.child.stdin.write(`${command}\n`);
  }

  async ensureReady() {
    this.send("isready");
    await this.waitFor((line) => line === "readyok", 10000);
  }

  async init() {
    if (this.ready) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      this.startProcess();
      this.send("uci");
      await this.waitFor((line) => line === "uciok", 10000);
      this.send("setoption name Threads value 1");
      this.send("setoption name Hash value 64");
      await this.ensureReady();
      this.ready = true;
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  async getStatus() {
    if (!fs.existsSync(ENGINE_BIN)) {
      return {
        available: false,
        ready: false,
        message: "未找到 Pikafish 可执行文件，请先编译引擎。",
        binaryPath: ENGINE_BIN,
      };
    }

    try {
      await this.init();
      return {
        available: true,
        ready: true,
        message: "Pikafish 已连接",
        binaryPath: ENGINE_BIN,
      };
    } catch (error) {
      return {
        available: false,
        ready: false,
        message: error.message,
        binaryPath: ENGINE_BIN,
      };
    }
  }

  async bestMove({ moves = [], movetime = 800 }) {
    if (this.busy) {
      throw new Error("Pikafish 正在处理上一条请求，请稍后重试。");
    }

    this.busy = true;

    try {
      await this.init();
      this.infoCollector = [];
      this.lastInfoLine = null;

      const normalizedMoves = Array.isArray(moves)
        ? moves.filter((move) => typeof move === "string" && /^[a-i][0-9][a-i][0-9]$/.test(move))
        : [];

      const fenCommand = normalizedMoves.length
        ? `fen ${START_FEN} moves ${normalizedMoves.join(" ")}`
        : `fen ${START_FEN}`;

      this.send(fenCommand);
      await this.ensureReady();

      const safeMoveTime = Math.max(80, Math.floor(Number(movetime) || 800));
      this.send(`go movetime ${safeMoveTime}`);

      const bestLine = await this.waitFor((line) => line.startsWith("bestmove "), safeMoveTime + 12000);
      const tokens = bestLine.trim().split(/\s+/);

      return {
        bestmove: tokens[1] ?? null,
        ponder: tokens[2] === "ponder" ? tokens[3] ?? null : null,
        rawInfo: this.infoCollector.at(-1) ?? this.lastInfoLine,
        message: "Pikafish 已完成计算",
      };
    } finally {
      this.busy = false;
      this.infoCollector = null;
    }
  }
}

const engine = new UciEngine();

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("请求体不是合法的 JSON。");
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": MIME_TYPES[".json"],
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function enqueueInterfaceCommand(command) {
  const nextCommand = {
    id: nextInterfaceCommandId,
    type: command.type,
    side: command.side ?? null,
    notation: command.notation ?? null,
    reset: typeof command.reset === "boolean" ? command.reset : undefined,
    createdAt: new Date().toISOString(),
  };

  nextInterfaceCommandId += 1;
  interfaceCommands.push(nextCommand);

  if (interfaceCommands.length > INTERFACE_COMMAND_LIMIT) {
    interfaceCommands.splice(0, interfaceCommands.length - INTERFACE_COMMAND_LIMIT);
  }

  return nextCommand;
}

function normalizeCommandSide(side) {
  if (side === "red" || side === "black") {
    return side;
  }

  if (side === "红" || side === "红方") {
    return "red";
  }

  if (side === "黑" || side === "黑方") {
    return "black";
  }

  return null;
}

function validateInterfaceCommand(body) {
  const type = typeof body?.type === "string" ? body.type.trim() : "";

  if (type === "move") {
    const side = normalizeCommandSide(body.side);
    const notation = typeof body.notation === "string" ? body.notation.trim() : "";

    if (!side) {
      throw new Error("move 命令需要提供 side，且只能是 red 或 black。");
    }

    if (!notation) {
      throw new Error("move 命令需要提供 notation。");
    }

    return { type, side, notation };
  }

  if (type === "reset" || type === "prepare") {
    return {
      type,
      reset: body.reset !== false,
    };
  }

  throw new Error("不支持的 interface 命令类型。");
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = requestUrl.pathname;

  if (pathname === "/") {
    pathname = "/index.html";
  } else if (pathname === "/interface" || pathname === "/interface/") {
    pathname = "/interface/index.html";
  }

  const isInterfaceRequest = pathname.startsWith("/interface/");
  const rootDir = isInterfaceRequest ? INTERFACE_DIR : UI_DIR;
  const relativePath = isInterfaceRequest ? pathname.slice("/interface".length) || "/index.html" : pathname;
  const resolvedPath = path.resolve(rootDir, `.${relativePath}`);

  if (!resolvedPath.startsWith(rootDir)) {
    sendJson(res, 403, { error: "禁止访问该路径。" });
    return;
  }

  try {
    const data = await fsp.readFile(resolvedPath);
    const ext = path.extname(resolvedPath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(res, 404, { error: "文件不存在。" });
      return;
    }

    sendJson(res, 500, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && requestUrl.pathname === "/api/engine/status") {
      const status = await engine.getStatus();
      sendJson(res, status.available ? 200 : 503, status);
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/engine/bestmove") {
      const body = await readRequestBody(req);
      const result = await engine.bestMove({
        moves: body.moves,
        movetime: body.movetime,
      });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/interface/commands") {
      const after = Math.max(0, Number(requestUrl.searchParams.get("after")) || 0);
      const commands = interfaceCommands.filter((command) => command.id > after);
      sendJson(res, 200, {
        commands,
        latestId: interfaceCommands.at(-1)?.id ?? 0,
      });
      return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/interface/command") {
      const body = await readRequestBody(req);
      const command = enqueueInterfaceCommand(validateInterfaceCommand(body));
      sendJson(res, 200, {
        ok: true,
        command,
      });
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 404, { error: "接口不存在。" });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`UI bridge running at http://${HOST}:${PORT}`);
  console.log(`Serving static files from ${UI_DIR}`);
  console.log(`Using Pikafish binary at ${ENGINE_BIN}`);
});
