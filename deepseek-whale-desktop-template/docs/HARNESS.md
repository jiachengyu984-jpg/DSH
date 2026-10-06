# 可选 Harness 工作台与小鲸鱼余额

不需要工作台时，请保持 `harness.enabled: false`。本地 Ollama 聊天、启动页和桌宠可以独立运行。

这里的 Harness 是单独安装的上游软件；本模板只是启动它并提供独立窗口。工作台的模型与鲸伴首页的模型分别配置。

## 1. 安装 Harness

在项目根目录执行：

```powershell
npm install --prefix tools/harness --no-save @deepseek-ai/dsh@0.1.5-rc.3
```

示例固定为本模板对接时使用的 CLI 版本，并不宣称它是最新版。依赖和插件可能随上游变化；更新时请先验证兼容性。

`tools/harness` 属于本机安装产物，不应提交到源码仓库。也可以使用已经安装的 Harness，填写实际的 CLI 路径即可。

如果后续插件命令提示找不到 `pnpm`，需要先按 Harness 的要求安装 pnpm，并保证从 PowerShell 可以运行它，再重新启动桌面应用。

上游项目：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)。

## 2. 配置入口

复制 `config.example.json` 为 `config.local.json` 后，在其中设置 `harness` 部分：

```json
{
  "enabled": true,
  "cliPath": "tools/harness/node_modules/@deepseek-ai/dsh/lib/bin.js",
  "nodePath": "node",
  "patchPath": "",
  "workspace": ""
}
```

上面是 `harness` 字段的值，不是整份配置文件；保留同级的 `ollama` 和 `dataDir`。

- `nodePath` 可以使用 PATH 中的 `node`，也可以填写自己的 Node.js 可执行文件路径。
- `workspace` 为空时，使用模板数据目录下的 `harness-workspace`。可指定专门用于工作台的目录。
- `patchPath` 为空时不额外叠加 patch。模板不会寻找、复制或自动启用其他安装的 Ollama launch patch。

完全退出应用后重新运行 `npm start`，点击侧栏「Harness 工作台」。应用用回环地址和动态端口启动 Harness，并使用启动时返回的认证地址打开工作台。

工作台可能需要等待依赖或 profile 初始化。本地聊天可以先使用；如果工作台无法启动，请核对 CLI 路径、Node 版本，并在终端单独启动 Harness 排查。模板不会保存可能含启动令牌的 Harness 输出。

## 3. 配置自己的模型

在 Harness 的设置中配置要使用的模型。首页已经能连接 Ollama，不代表 Harness 已配置好同一个模型。

对于本地 Ollama，在 Harness 中按其当前模型设置方式添加本机提供方与实际安装的模型。若自己的安装需要 patch，可在 `harness.patchPath` 中填写自行准备的文件；不要把含个人设置的 patch 当成共享模板提交。

对于云端 DeepSeek，在 Harness 的「设置 → 模型」中添加 DeepSeek 提供方和自己的 API Key，随后选择可用模型。密钥应由 Harness 的凭据管理保存；不要写进本模板的配置、源码或聊天消息。

Harness 会使用当前用户自己的 profile（默认 web profile）、设置和凭据，通常存储在 `%USERPROFILE%\.dsh`。模板的独立 `dataDir` **不会让 Harness profile 自动隔离**。如果电脑已经使用 Harness，启用前应确认当前 web profile 是自己要使用的环境。

## 4. 安装小鲸鱼记账插件

退出正在运行的工作台 / 桌面应用后，在项目根目录运行：

```powershell
node tools/harness/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile web add dsh-whale-widget@0.3.16
```

若使用其他位置的 Harness，请将命令中的 CLI 路径替换成自己的路径。此操作安装到当前用户的 Harness web profile，并非安装到鲸伴的聊天渲染器中。

插件上游：[MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)。插件及其图片、音效不随本模板分发；它们的更新、凭据处理和外部网络请求由插件自身负责。

重新启动桌面应用和工作台后，在 Harness 中确认插件已启用。DeepSeek 的余额查询需要可用的 DeepSeek 官方账户凭据，通常使用凭据名 `DEEPSEEK_API_KEY`。优先在 Harness 的模型设置中配置凭据，并确认插件读取同一个凭据名。

对接过的插件版本为 `0.3.16`。某些插件界面的内置 DeepSeek 模板编辑功能可能出现模板选项缺失或保存失败；本模板没有修改第三方插件文件。如果发生这类错误，请使用 Harness 的凭据设置或查看插件上游的修复说明，不要反复把密钥填进其他厂商模板。

## 5. 显示到桌面鲸鱼娘

安装并配置好插件后，在桌宠右键菜单中开启「显示账户余额」。可通过卡片上的刷新按钮手动查询，正常运行时也会定时更新。

工作台窗口可以关闭，但负责提供余额的 Harness 后台进程仍须运行。完全退出鲸伴会结束由它启动的 Harness 进程。

对接流程：

1. 主进程从自己启动的 Harness 获得本机认证 URL。
2. 用认证 URL 换取本机服务的会话 Cookie。
3. 读取插件提供的 `/dsh-whale/balance.json` 接口。
4. 只把状态、金额、币种和更新时间发给桌宠渲染器。

API Key 仍由 Harness / 插件管理，桌宠渲染器不接收它。模板不会自行扫描其他应用的密钥文件，也不提供共享密钥。

可以参考 `pet-balance.cjs` 中的错误处理和过期数据保留逻辑，接入其他受控的本机服务。这个接口依赖插件版本，并不是 DeepSeek 官方云端余额接口本身。

## 常见问题

| 现象 | 检查方向 |
| --- | --- |
| 工作台未启用 | 确认 `harness.enabled` 为 `true`，CLI 路径正确，重启应用 |
| 提示需要启用小鲸鱼记账 | 插件尚未安装 / 启用，或者运行中的 profile 不是安装插件的 web profile |
| 未配置密钥 | 在 Harness 中保存凭据，并核对插件读取的凭据名；输入框填过但未保存不算配置完成 |
| 余额查询失败 | 检查凭据有效性、网络连接、上游接口和插件版本；该提示不表示余额一定为零 |
| 余额暂未更新 | 等待下一次轮询或手动刷新；网络失败时可能保留上次数据并标记过期 |
| 本地 Ollama 没有余额 | 正常。本地推理不对应云端充值账户 |
| 首页聊天没有记入插件用量 | 首页直接调用 Ollama，未经过 Harness 的会话与计费事件链 |

这里显示的是自己配置的平台账户余额；不会因为分享了模板，就让其他人读取自己的账户或使用自己的本机模型。
