# 现代女性人设 Roll 机

由Codex协助制作的一个零依赖、零后端的现代 ACGN 女性人设随机生成器。打开网页即可生成姓名、身材、发型发色、瞳色、身体数据、肤色、穿搭、鞋袜配饰、融合性格，以及可直接用于动漫绘图模型的英文提示词。

不想下载可以访问: https://aurigacapella.github.io/modern-persona-roller/

## 当前版本

- 版本：Modern v1.5
- 默认角色：成年女性（18+）
- 运行方式：纯 HTML / CSS / JavaScript
- 数据保存：访客自己的浏览器 `localStorage`
- 后端与数据库：不需要

## 功能

- 中式、日式、西式姓名体系
- 三种成年女性体型及相关区间身体数据
- 可自定义 135–210 cm 身高上下限，并以体型常见值进行低边缘概率加权
- 纯色、染色发色与协调色板
- 根据头发长度选择兼容发型
- 瞳色选择
- 多种现代、ACGN 与日系穿搭档案
- 可指定 1、2、3 个或随机数量的无冲突融合性格标签
- NovelAI、Animagine XL、通用 Anime 与 GPT Image 2 提示词格式
- 自动整理正向/负向标签或 GPT Image 图像描述/约束条件，并支持分别或整组复制
- 单项重抽、锁定、复制人设与 JSON 导出
- 响应式布局和本地状态保存

## 直接使用

双击根目录的 `index.html` 即可运行。

部分浏览器会限制 `file://` 页面使用剪贴板。需要模拟线上环境时，可以在仓库根目录运行：

```powershell
python -m http.server 8080
```

然后访问 `http://localhost:8080/`。

## 仓库结构

```text
.
├── index.html              # 完整网页、样式、词库和生成逻辑
├── README.md               # 项目说明与快速开始
├── CHANGELOG.md            # 版本变更记录
├── .gitignore              # 本地文件与秘密信息忽略规则
├── .nojekyll               # GitHub Pages 静态文件兼容
├── tests/
│   └── prompt-smoke.js     # 提示词批量生成与词条映射检查
└── docs/
    ├── data-model.md       # 随机池、依赖关系和冲突规则
    └── deployment.md       # 静态托管方案
```

`index.html` 保持自包含是有意设计：下载、镜像、静态托管和离线使用时不需要处理资源路径或构建步骤。

## 修改随机池

所有数据都在 `index.html` 的 `<script>` 中，主要常量包括：

- `NAMES`：姓名库
- `BODY_TYPES`：体型及身体数据区间
- `HAIR_LENGTHS`：长度与发型池
- `HAIR_COLORS`、`DYE_PAIRS`：纯色与染发配色
- `EYE_COLORS`、`HETERO_EYES`：瞳色
- `SKINS`：肤色
- `OUTFITS`：服装、鞋袜和配饰档案
- `FINISHING_EXPANSIONS`：按风格隔离的鞋袜配饰扩充池
- `PERSONALITY_LAYERS`：性格标签及冲突关系
- `PROMPT_PRESETS`、`OUTFIT_PROMPTS`：模型预设与绘图标签映射

修改后至少执行一次 JavaScript 语法检查，并在桌面与窄屏浏览器中各生成数次结果。

提示词批量冒烟测试可运行：

```powershell
node tests/prompt-smoke.js
```

## 发布

这是标准静态站点，托管平台只需把仓库根目录作为发布目录，不需要安装命令或构建命令。具体配置见 [部署文档](docs/deployment.md)。

## 隐私与安全

- 当前版本不上传或集中保存生成记录。
- 不要把 API 密钥、账号凭证等文件写入 `index.html`。
