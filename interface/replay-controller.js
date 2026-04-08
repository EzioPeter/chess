const sideInput = document.querySelector("#sideInput");
const notationInput = document.querySelector("#notationInput");
const sendBtn = document.querySelector("#sendBtn");
const prepareBtn = document.querySelector("#prepareBtn");
const resetBtn = document.querySelector("#resetBtn");
const runtimeLog = document.querySelector("#runtimeLog");
const connectionState = document.querySelector("#connectionState");
const turnState = document.querySelector("#turnState");
const commandState = document.querySelector("#commandState");
const boardFrame = document.querySelector("#boardFrame");

let lastCommandId = 0;
let pollTimer = null;
let commandInFlight = false;

function appendLog(message) {
  const timestamp = new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
  });
  const nextLine = `[${timestamp}] ${message}`;
  runtimeLog.textContent = `${nextLine}\n${runtimeLog.textContent}`.trim();
}

function normalizeSideLabel(side) {
  return side === "black" ? "黑方" : "红方";
}

function getFrameApi() {
  const frameWindow = boardFrame.contentWindow;
  if (!frameWindow?.XiangqiAutomation) {
    throw new Error("主界面的自动化 API 还没有准备好。");
  }

  return frameWindow.XiangqiAutomation;
}

async function waitForFrameApi(timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const api = getFrameApi();
      connectionState.textContent = "棋盘已连接";
      updateBoardState();
      return api;
    } catch {}

    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }

  connectionState.textContent = "棋盘连接超时";
  throw new Error("等待主界面自动化 API 超时，请确认主界面已经加载完成。");
}

function updateBoardState() {
  try {
    const state = getFrameApi().getState();
    turnState.textContent = state.winner
      ? `${normalizeSideLabel(state.winner)}胜`
      : `轮到${normalizeSideLabel(state.turn)}`;
  } catch {
    turnState.textContent = "轮到未知";
  }
}

async function sendCommand(command) {
  const response = await fetch("/api/interface/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "命令发送失败。");
  }

  commandState.textContent = `命令 #${payload.command.id}`;
  return payload.command;
}

async function primeCommandCursor() {
  const response = await fetch("/api/interface/commands?after=0", {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "初始化命令游标失败。");
  }

  lastCommandId = payload.latestId || 0;
  commandState.textContent = `命令 #${lastCommandId}`;
}

async function executeCommand(api, command) {
  if (command.type === "prepare" || command.type === "reset") {
    await api.applyLiveCommand({
      type: command.type,
      reset: command.reset !== false,
    });
    appendLog(`已执行 ${command.type} 命令。`);
    updateBoardState();
    return;
  }

  if (command.type === "move") {
    await api.applyLiveCommand({
      type: "move",
      side: command.side,
      notation: command.notation,
    });
    appendLog(`已执行 ${normalizeSideLabel(command.side)} ${command.notation}`);
    updateBoardState();
    return;
  }

  appendLog(`收到未知命令类型：${command.type}`);
}

async function pollCommands() {
  if (commandInFlight) {
    scheduleNextPoll();
    return;
  }

  commandInFlight = true;

  try {
    const response = await fetch(`/api/interface/commands?after=${lastCommandId}`, {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "读取命令队列失败。");
    }

    if (!payload.commands?.length) {
      return;
    }

    const api = await waitForFrameApi();

    for (const command of payload.commands ?? []) {
      try {
        await executeCommand(api, command);
      } catch (error) {
        appendLog(`命令 #${command.id} 执行失败：${error.message}`);
      } finally {
        lastCommandId = command.id;
        commandState.textContent = `命令 #${lastCommandId}`;
      }
    }
  } catch (error) {
    appendLog(`命令轮询失败：${error.message}`);
  } finally {
    commandInFlight = false;
    scheduleNextPoll();
  }
}

function scheduleNextPoll() {
  window.clearTimeout(pollTimer);
  pollTimer = window.setTimeout(() => {
    void pollCommands();
  }, 350);
}

sendBtn.addEventListener("click", async () => {
  try {
    const notation = notationInput.value.trim();
    if (!notation) {
      throw new Error("请输入棋谱着法。");
    }

    const command = await sendCommand({
      type: "move",
      side: sideInput.value,
      notation,
    });
    appendLog(`已投递命令 #${command.id}: ${normalizeSideLabel(command.side)} ${command.notation}`);
    notationInput.value = "";
  } catch (error) {
    appendLog(`发送着法失败：${error.message}`);
  }
});

prepareBtn.addEventListener("click", async () => {
  try {
    const command = await sendCommand({
      type: "prepare",
      reset: true,
    });
    appendLog(`已投递命令 #${command.id}: 切到本地双人并重置。`);
  } catch (error) {
    appendLog(`准备棋盘失败：${error.message}`);
  }
});

resetBtn.addEventListener("click", async () => {
  try {
    const command = await sendCommand({
      type: "reset",
      reset: true,
    });
    appendLog(`已投递命令 #${command.id}: 重置棋盘。`);
  } catch (error) {
    appendLog(`重置棋盘失败：${error.message}`);
  }
});

notationInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendBtn.click();
  }
});

boardFrame.addEventListener("load", async () => {
  try {
    connectionState.textContent = "棋盘连接中";
    await waitForFrameApi();
    await primeCommandCursor();
    appendLog("棋盘已连接，命令游标已对齐，开始监听新命令。");
    scheduleNextPoll();
  } catch (error) {
    appendLog(error.message);
  }
});

appendLog("命令监听器已启动，等待棋盘连接。");
