# 双人对战动态指令接口

先启动主界面服务：

```bash
cd /home/xjy/entertainment/chess/ui
node server.js
```

然后打开动态指令台：

```text
http://127.0.0.1:3000/interface/
```

这个页面会在浏览器里加载主界面的本地双人模式，并持续监听动态命令。
先把这个页面保持打开，再从外部程序发送命令。

## 终端实时发命令

```bash
node /home/xjy/entertainment/chess/interface/send-command.js prepare
node /home/xjy/entertainment/chess/interface/send-command.js move red 兵三进一
node /home/xjy/entertainment/chess/interface/send-command.js move black 炮2平5
node /home/xjy/entertainment/chess/interface/send-command.js reset
```

也可以用 HTTP 直接发：

```bash
curl -X POST http://127.0.0.1:3000/api/interface/command \
  -H 'Content-Type: application/json' \
  -d '{"type":"move","side":"red","notation":"兵三进一"}'
```

## 支持的命令

- `prepare`: 切到本地双人模式并重置棋盘
- `reset`: 只重置当前棋盘
- `move`: 实时发送一步棋，格式为 `side + notation`

其中：

- `side` 只能是 `red` / `black`，也兼容 `红方` / `黑方`
- `notation` 使用中国象棋棋谱写法，例如 `兵三进一`、`炮2平5`

如果发送的行棋方和当前回合不一致，页面会拒绝这条命令并在日志里显示错误。
