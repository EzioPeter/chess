#!/usr/bin/env node

const http = require("node:http");
const https = require("node:https");

const BASE_URL = process.env.XIANGQI_INTERFACE_URL || "http://127.0.0.1:3000";

function printUsage() {
  console.log(`用法:
  node interface/send-command.js prepare
  node interface/send-command.js reset
  node interface/send-command.js move red 兵三进一
  node interface/send-command.js move black 炮2平5

可选环境变量:
  XIANGQI_INTERFACE_URL=http://127.0.0.1:3000`);
}

function requestJson(method, pathname, payload = null) {
  const url = new URL(pathname, BASE_URL);
  const transport = url.protocol === "https:" ? https : http;
  const body = payload ? JSON.stringify(payload) : null;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method,
        headers: body
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body),
            }
          : {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let parsed = null;

          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            reject(new Error(`服务端返回了非 JSON 内容：${raw}`));
            return;
          }

          if (res.statusCode >= 400) {
            reject(new Error(parsed?.error || `${res.statusCode} ${res.statusMessage}`));
            return;
          }

          resolve(parsed);
        });
      },
    );

    req.on("error", reject);

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

function normalizeSide(side) {
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

async function sendCommand(command) {
  const payload = await requestJson("POST", "/api/interface/command", command);
  return payload.command;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "prepare" || command === "reset") {
    const result = await sendCommand({
      type: command,
      reset: true,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "move") {
    const side = normalizeSide(args[0]);
    const notation = args.slice(1).join(" ").trim();

    if (!side || !notation) {
      throw new Error("move 命令需要 side 和 notation，例如：move red 兵三进一");
    }

    const result = await sendCommand({
      type: "move",
      side,
      notation,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`未知命令：${command}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`发送失败：${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  sendCommand,
};
