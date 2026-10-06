# 第三方软件、素材与名称说明

本文件说明模板使用或可选对接的外部项目，不替代各项目随软件分发的许可证。模板本身尚未指定统一开源许可证，不能将本说明理解为对全部内容的授权声明。

## 运行依赖

### Electron

- npm 包：`electron`，模板锁定版本见 `package.json` 和 `package-lock.json`。
- 项目：https://github.com/electron/electron
- 包内许可证声明：MIT。
- 版权声明包括 Electron contributors 以及 GitHub Inc.，完整文本见安装后 `node_modules/electron/LICENSE`。
- Electron 分发物还包含 Chromium、Node.js 及其他组件。若制作并分发安装包，应保留运行时自带的第三方许可证与 notices，不要只保留 Electron 的 MIT 文本。

npm 安装的间接依赖各自适用其发布包中的许可证。`package-lock.json` 用于记录依赖版本，不等同于完整许可证汇总。本源码模板不打包 `node_modules` 或 Electron 可执行文件。

## 需要使用者自行安装的外部软件

### Ollama 与模型

- Ollama 项目：https://github.com/ollama/ollama
- 使用者自行安装 Ollama，并自行下载模型。
- 本仓库不包含 Ollama 安装包或模型权重。
- `deepseek-r1:8b` 是示例配置中的模型名称。模型本身的使用、修改和分发条件以实际下载版本的模型说明及许可证为准；不能因为桌面界面可运行它，就推定模型权重可随意再分发。

### DeepSeek Harness（可选）

- npm 包：`@deepseek-ai/dsh`。
- 项目：https://github.com/deepseek-ai/deepseek-harness
- 对接参考版本 `0.1.5-rc.3` 的包内许可证声明：MIT。
- Harness 与其传递依赖不随本源码模板分发，需使用者自行安装和配置。

### 小鲸鱼记账插件（可选）

- npm 包：`dsh-whale-widget`。
- 项目：https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget
- 对接参考版本 `0.3.16` 的包内许可证声明：MIT。
- 本模板只实现了对插件本机余额接口的读取，不包含该插件代码、图片、动图、音效、凭据或本机安装补丁。
- 插件素材来源及其他限制请查阅上游仓库和发布包中的说明，包括其 `PROVENANCE.md`；不要仅根据 npm 包的许可证字段推定所有角色素材具有同样授权。

## 模板中的插画素材

`assets/` 中的鲸鱼娘插画、动作姿势图集、启动背景及从插画制作的图标由 AI 图像生成流程制作，作为桌面交互示例使用。

这些素材采用鲸鱼娘同人风格，不表示已取得 DeepSeek、特定角色、艺术家或其他权利人的官方授权。AI 生成来源也不等于对角色设计、商标或其他相关权利作出许可保证。

本模板没有对这些素材授予额外的第三方权利。如果准备公开发行成品、用于品牌宣传或商业用途，请自行确认素材的使用条件，或替换成自己拥有适当权利的角色、背景和图标。

## 名称与关联

DeepSeek、Ollama、Electron 以及其他项目名称用于说明兼容的软件和接口，相关名称、标识和商标归各自权利人所有。

「DeepSeek · 鲸伴」是此参考实现的界面名称。该项目不代表 DeepSeek 官方产品、官方支持、官方授权角色或与上述项目存在合作关系。
