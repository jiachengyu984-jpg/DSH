# DeepSeek · 鲸伴：桌面端源码模板

一个以 **Electron + 本机 Ollama** 为核心的 Windows 桌面应用示例：聊天窗口、鲸鱼娘启动页、透明桌宠，以及可选的 DeepSeek Harness 工作台入口。适合参考桌面窗口管理、本地模型流式对话和桌宠交互的实现。

这是独立整理的学习参考项目，不是 DeepSeek 官方桌面客户端。仓库不包含模型权重、API Key、账户信息、个人聊天记录或预装的 Harness 插件。下载源码后，使用者需要准备自己的运行环境。

## 快速开始

当前目标平台为 Windows。使用 Node.js 24 或更新版本（含 npm），并自行安装 [Ollama](https://ollama.com/)。其他系统未作桌面兼容性验证。

在 PowerShell 中进入项目根目录，执行：

```powershell
# 下载模型；也可选择其他已经安装的 Ollama 聊天模型
ollama pull deepseek-r1:8b

# 安装锁定的 Node / Electron 依赖
npm ci

# 创建自己的配置；已经存在时请直接编辑，不要覆盖
Copy-Item config.example.json config.local.json

# 启动桌面应用
npm start
```

模型下载和依赖安装需要联网。锁定的 Electron 版本会在首次 `npm start` 时自动下载桌面运行时，因此首次启动也需要访问 Electron 的官方 GitHub 发布源。模型的下载体积、内存和显存需求由所选模型决定；源码仓库不携带这些文件。首次生成会等待模型加载。

默认连接 `http://127.0.0.1:11434`，默认模型为 `deepseek-r1:8b`。如果 Ollama 已运行，应用直接连接；如果未运行，应用会尝试启动本机已安装的 Ollama。它不会自动安装 Ollama 或下载模型。

启动后点击启动页的「开启探索」，或按 Enter 进入聊天。模型列表来自自己的 Ollama 安装，可在界面中切换。聊天窗口按 Enter 发送，Shift + Enter 换行，生成时可以停止。

需要桌面快捷方式时，在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/create-shortcut.ps1
```

快捷方式依赖这个源码目录和 `node_modules`，移动或删除项目后需要重新创建。此模板没有提供独立安装包。

## 配置

配置示例见 [config.example.json](config.example.json)。个人修改保存到 `config.local.json`，该文件应保留在本机，不提交到仓库。不要在配置中写入 API Key。

| 字段 | 默认值 | 用途 |
| --- | --- | --- |
| `ollama.baseUrl` | `http://127.0.0.1:11434` | 本机 Ollama 服务地址，可调整端口 |
| `ollama.executable` | 空字符串 | 自动查找标准安装位置或 PATH 中的 `ollama`；也可指定可执行文件路径 |
| `ollama.autoStart` | `true` | 连接失败时尝试启动已安装的 Ollama |
| `ollama.model` | `deepseek-r1:8b` | 初次运行的默认模型；之后界面选择会保存在偏好中 |
| `harness.enabled` | `false` | 是否启动可选 Harness 工作台 |
| `harness.cliPath` | 空字符串 | Harness 的 `lib/bin.js` 路径 |
| `harness.nodePath` | `node` | 用于启动 Harness 的 Node.js 命令或路径 |
| `harness.patchPath` | 空字符串 | 可选的 Harness patch 文件路径 |
| `harness.workspace` | 空字符串 | 为空时使用应用数据目录中的 `harness-workspace` |
| `dataDir` | 空字符串 | 为空时使用 Windows `%APPDATA%\DeepSeekWhaleTemplate` |

Ollama 地址仅允许本机 HTTP 地址：`127.0.0.1`、`localhost` 或 `[::1]`，可带端口，不支持远程主机、账号密码或额外路径。当前聊天接口面向 Ollama，不能直接把 `baseUrl` 改成云端 OpenAI / DeepSeek 地址使用。

文件路径支持绝对路径，或相对于项目根目录的路径。在 JSON 中 Windows 路径可使用正斜杠，如 `C:/Tools/Ollama/ollama.exe`；使用反斜杠时需写成 `\\`。

可在启动前覆盖配置位置或数据目录：

```powershell
$env:WHALE_CONFIG = 'config.local.json'
$env:WHALE_DATA_DIR = 'C:/WhaleTemplateData'
npm start
```

`WHALE_DATA_DIR` 优先于配置中的 `dataDir`。若不需要覆盖，直接使用默认配置即可。修改配置后完全退出应用，再重新启动。

## 功能与操作

- **本地聊天**：流式回答、思考内容展示、历史搜索、删除对话、Markdown 导出，以及明暗主题。聊天记录保存在本机。
- **桌面鲸鱼娘**：单击随机小动作，双击打开聊天，拖动移动位置；右键可以调整大小、选择动作、隐藏桌宠或退出。
- **启动页**：冰蓝线稿背景；可在设置中再次播放。
- **托盘运行**：关闭聊天窗口会收进托盘，桌宠可继续显示。要完全结束应用，请从托盘或桌宠菜单选择「退出」。
- **可选 Harness**：独立工作台窗口使用自己的模型、工具和插件配置；默认关闭，不影响本地聊天。
- **可选桌宠余额卡片**：对接 Harness 的小鲸鱼记账插件，显示已配置账户的余额。它不是家庭收支记账本。

桌宠使用 AI 生成插画、姿势图集和 CSS / Web Animations 动画，不是 Live2D 骨骼模型。现有动作可在 `pet-actions.js` 中调整。

## 可选 Harness 与余额插件

本地聊天和桌宠不要求安装 Harness。需要工具工作台、云端模型或账户余额时，请按 [Harness 配置说明](docs/HARNESS.md) 选装。

模板不复制任何人的 Harness 配置、插件、凭据或 Ollama launch patch。你需要在自己的 Harness 中配置模型与密钥。桌宠余额来自 Harness 本机认证接口，渲染界面不会接收原始 API Key。

Ollama 本地模型没有云端账户余额。桌宠显示的云端账户余额与本地聊天模型不是同一回事；鲸伴首页的独立聊天也不会自动纳入 Harness 插件的逐轮用量统计。

## 代码入口

| 文件 | 职责 |
| --- | --- |
| `main.cjs` | Electron 生命周期、托盘和窗口、Ollama 流式请求、可选 Harness 子进程、IPC |
| `app-config.cjs` | 配置读取、类型和本机地址检查、默认路径 |
| `preload.cjs` | 聊天界面的受限 IPC 桥接 |
| `index.html` / `renderer.js` / `style.css` | 聊天、历史、设置与启动页界面 |
| `chat-context.cjs` | 时间上下文、聊天消息准备及时间问题处理 |
| `pet-controller.cjs` | 桌宠窗口尺寸、位置和拖动管理 |
| `pet.html` / `pet.js` / `pet.css` | 桌宠显示、姿势切换、动作与待机交互 |
| `pet-actions.js` | 动作名称、关键帧、姿势与文案 |
| `pet-preload.cjs` | 桌宠的受限 IPC 桥接 |
| `pet-balance.cjs` / `pet-balance-ui.js` | 本机余额读取、轮询和卡片显示 |
| `assets/` | 启动背景、桌宠图集和图标 |
| `tests/` | 可离线执行的核心逻辑测试 |
| `scripts/` | 源码检查与 Windows 快捷方式辅助脚本 |

界面关闭 Node 集成，使用 `contextIsolation`、预加载桥接和 Electron sandbox。模型请求、文件保存以及子进程操作放在主进程；新增 IPC 功能时应继续限制可接受的参数和动作。

```text
聊天界面 ──受限 IPC──> Electron 主进程 ──本机 HTTP──> Ollama
桌宠界面 ──受限 IPC──> 桌宠控制器 / 余额监控
                                   └──> 可选 Harness 本机服务
                                            └──> 用户自行配置的模型与插件
```

## 验证与开发

```powershell
npm test
npm run check
npm run test:desktop
npm start
```

`npm run test:desktop` 使用真实 Electron 窗口、本机模拟 Ollama 接口和临时数据目录，检查启动、流式回答、记录保存与桌宠，不需要模型权重或 API Key。核心单元测试验证配置、聊天上下文、桌宠窗口与余额处理等可隔离逻辑。它们不替代真实模型、桌面显示缩放、显卡驱动、云端 API 或第三方插件的端到端验证。

修改聊天功能后，至少手动确认发送、停止、历史恢复；修改桌宠后，确认拖动、连续点击、不同尺寸以及关闭后重开；开启 Harness 后，再验证工作台加载和退出行为。

## 数据与分享边界

应用默认使用独立数据目录 `%APPDATA%\DeepSeekWhaleTemplate`，包含聊天记录、界面偏好和运行日志。它不会自动迁移原应用的数据。自定义 `dataDir` 时，请不要指向其他实例正在使用的数据目录。

Harness 自己的 profile、模型配置和凭据由 Harness 管理，通常位于当前用户的 `.dsh` 目录；不属于这个模板的数据目录。启用 Harness 时，可能读取本机已有的同名 profile，详见配置说明。

分享源码时保留 `.gitignore`，只提交代码、示例配置和必要素材。不要提交 `config.local.json`、`.env`、应用数据、日志、截图、模型文件、`node_modules` 或自己的 Harness 用户目录。忽略规则不能自动移除已经被 Git 跟踪的文件，发布前仍需检查待提交内容。

把源码放到 GitHub 不会开放自己的本机模型给别人。其他使用者需安装自己的模型；使用云端 API 时也需提供自己的账号和 Key。

## 素材与项目状态

本项目用于代码结构和交互实现参考，目前未指定整个项目的开源许可证。分享源码不等于授予所有代码、素材、角色或商标的任意再分发权利。第三方依赖及素材说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 导出纯源码

运行 powershell -File scripts/export-source.ps1，可按 source-files.json 白名单生成源码 ZIP，排除依赖和本地数据。新增源码文件时也需要更新白名单。输出文件已存在时脚本不会覆盖，可使用 -OutputPath 指定新文件名。

CI 在 Windows / Node.js 24 下执行源码检查和单元测试；真实 Electron 桌面验证由 npm run test:desktop 在本机执行。
