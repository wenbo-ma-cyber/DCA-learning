# 定投生长记

60 天中文定投学习网站，附 8 节量化算法进阶课程与 4 个策略实验。原生 HTML / CSS / JavaScript，Three.js 0.180.0 生长树；无需构建、账号或服务器。所有交付都在本文件夹内。

## 量化算法学习

从「我的学习空间 → 量化算法」进入，也可直接访问 `#quant`。

- 课程覆盖收益与回撤、同类基金筛选、动量、逆波动权重、再平衡、定投现金流、无前视回测和样本外验证。
- 每课包含目标、讲解、公式、手算例子、练习、两道自测、Python 标准库示例和笔记。
- `#quant/lab` 提供基金筛选、动量窗口、逆波动权重与定投再平衡四个实验；数据均为人工构造，不接入实时行情、不执行交易。
- 8 节量化课程单独统计进度，原有 60 课与成长树的计数不变。量化笔记同时出现在「我的笔记」。
- 沿用现有 v1 学习记录和备份格式，旧备份可以导入。导入始终完整替换全部记录；只含基础课程的旧备份会清除当前量化记录，导入前请先导出。含 `quant-*` 记录的新备份需在本次更新后的网站使用，未更新的旧网站不认识新课程 ID。

新增文件：`quant-curriculum.js`（课程）、`quant-core.js`（纯计算）、`quant.js`（页面和实验）、`quant.css`（响应式样式）。发布时应一起上传这四个文件及更新后的 `index.html`、`app.js`。本版本也移除了原页面中指向仓库缺失文件的 5 个资源引用，避免加载 404；没有从其他本地副本覆盖旧功能。

可复现检查（每条上限 60 秒；无第三方依赖）：

```bash
timeout 60s node tests/quant-core.test.cjs
timeout 60s node tests/quant-integration.test.cjs
node --check quant.js
node --check app.js
```

第二条检查还需 Python 3，用于运行课程内的 8 段标准库示例。网站为静态文件，没有构建步骤。浏览器验证记录见 `tests/quant-verification.md`。

## 直接使用

用本地 HTTP 预览或上传 GitHub Pages 后访问。双击 `index.html` 通常可以阅读课程，但部分浏览器会限制本地文件的模块与存储，三维树可能回退为静态图，因此推荐 HTTP 方式。

有 Python 时，在本文件夹打开终端执行：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows 可用 `python` 替换 `python3`。访问 `http://127.0.0.1:8000/`。按 Ctrl+C 停止预览。

## 部署到 GitHub Pages（无需购买服务器）

1. 在 GitHub 新建一个仓库，例如 `dca-learning`。使用免费个人账户时，可选择公开仓库。
2. 将本文件夹里的 `index.html`、`styles.css`、`experience.css`、`app.js`、`core.js`、`player.js`、`tree.js`、三个 `curriculum-*.js`、四个 `quant*` 文件（不含测试）、`assets/`、`downloads/`、`.nojekyll` 和本说明上传到仓库根目录。**根目录应直接有 index.html，不要再套一层 dca-learning 文件夹。** `tests/` 和 ZIP 压缩包是本地验收材料，不需要上传。
3. 在仓库 **Settings → Pages → Build and deployment** 中，将 Source 设为 **Deploy from a branch**，选择 **main** 分支、**/(root)**，保存。
4. 等 GitHub 部署完成，打开 Pages 页面显示的网址，通常是 `https://你的用户名.github.io/dca-learning/`。
5. 以后修改课程或页面后上传同名文件，GitHub Pages 会更新；不要改动课程 ID，否则旧进度无法正确对应。

所有资源使用相对路径、课程使用 `#lesson/day-01` 形式的哈希导航，支持仓库子路径，不需要单页应用重写规则。Three.js 及其许可证已本地打包，没有 CDN、远程字体或在线行情依赖。

GitHub 官方指南：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 怎样学习

- 首页会推荐第一节未完成的课程，全部 60 课随时可以查看。
- 每课有目标、讲解、示例、练习、两道带解析的自测和笔记区。
- 在课末勾选“我学完了”；可以撤销，不要求答题全部正确。
- 每五课组成一周，每完成一周小树增加一组枝叶；已完成总课数也影响树的高度。
- 三个实验分别演示复利、定投份额和最大回撤。参数和结果仅用于学习。
- 后四周的 Python 代码在本地运行，先阅读 `downloads/README-template.md`。下载项目含明确标注的模拟行情，绝非真实指数历史业绩。

## 保存、备份与隐私

- 打卡、笔记、自测答案和动画偏好使用当前浏览器的 `localStorage`，键名为 `dca-growth-state-v1`。
- **不会上传到 GitHub，也不会在设备间自动同步。** 不同浏览器、域名和端口拥有独立记录；本地预览与正式网址之间也需要备份迁移。
- 点击“数据与备份”导出 JSON。换设备后打开网站，选择备份文件，查看数量并确认覆盖。
- 导入是完整替换，不合并。先导出当前记录再导入；格式错误、不兼容版本不会覆盖记录。
- 每课笔记最多 50,000 个字符；备份导入上限 32 MB。备份版本为 1，不支持其他应用的任意 JSON。
- 隐私模式、浏览器配额或权限限制可能阻止保存。页面会显示提示，保留当前内存中的输入；请在关闭/刷新前导出。
- 如果原有数据损坏，网站不会自动覆盖，恢复前先备份或使用有效备份文件导入。
- 网站课程可以公开访问。私人笔记只在你的浏览器里，但导出的备份含私人内容，**不要上传到公开仓库**。
- 请避免同时在多个标签页编辑；本版不合并多个标签页的并发修改。

## 文件说明

- `index.html` / `styles.css`：页面骨架、响应式布局与视觉样式。
- `app.js`：导航、课程、测验、笔记、备份与交互实验。
- `core.js`：独立数学函数、备份校验和版本约定。
- `curriculum-1.js` / `curriculum-2.js` / `curriculum-3.js`：三阶段各 20 课。
- `tree.js` / `assets/vendor/`：Three.js 生长树及固定版本依赖。WebGL 不可用时显示静态树，不阻断学习。
- `downloads/`：Python 项目、模拟 CSV、示例结果、模板及 Python 验证记录。
- `tests/`：数学与数据校验测试、浏览器测试、验收截图、验收记录。

没有后端 API。课程条目包含稳定 ID、周次、周内天数、讲解、例题、练习、测验与来源；备份包含 version、completed、notes、answers、visited、lastLesson、motion，导出附 exportedAt。笔记只作为文本显示，不解释为 HTML。

## 验证

量化模块的可复现命令见本文开头。浏览器测试通过本机 HTTP 服务进行，具体用例与结果见 `tests/quant-verification.md`；它不要求安装浏览器测试依赖。

原有 Python 定投项目的验证按 `downloads/README-template.md` 执行；本次量化模块更新没有重新运行该项目的回测。

网站为静态文件，无需构建。本地验证不等于线上发布成功；本次尚未推送或部署。

## 内容与许可

投资课程只用于建立基础认知和做模拟实验，不承诺盈利、不推荐购买具体产品。真实产品费用、指数规则和市场数据需要以发布机构最新资料为准。

Three.js 采用 MIT 许可证，原始许可位于 `assets/vendor/THREE-LICENSE.txt`。本网站未使用远程图片或付费字体。
