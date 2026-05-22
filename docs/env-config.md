# Dream Offer Matcher Env Config

`Dream Offer Matcher` 继续保持纯浏览器架构，不引入打包器。

为了让网页配置改为 `.env`，项目现在会在启动时由 `src/config/index.js` 读取仓库根目录下的 `.env`。如果某个字段缺失，会自动回退到代码中的默认值，保证页面仍然可用。

## 使用方式

1. 修改仓库根目录的 `.env`
2. 启动本地静态服务器：

```bash
python3 -m http.server 4173
```

3. 打开 `http://localhost:4173`

如果本机有 `npm`，也可以执行 `npm run dev`，它会调用同一个 `python3` 静态服务。

## 当前支持的配置项

```dotenv
JDM_APP_TITLE
JDM_APP_NAME
JDM_RESUME_URL
JDM_CLAUDE_ENDPOINT
JDM_CLAUDE_MODEL
JDM_CLAUDE_MAX_TOKENS
JDM_OPENAI_ENDPOINT
JDM_OPENAI_MODEL
JDM_OPENAI_MAX_TOKENS
```

## 说明

- `AGENTS.md` 和 `CLAUDE.md` 中的 harness 协议内容保持不变。
- UI 不直接读取 `.env`，仍然通过 `config -> runtime -> ui` 的依赖方向工作。
- AI Key 依然由用户在页面输入，不写入 `.env`。
