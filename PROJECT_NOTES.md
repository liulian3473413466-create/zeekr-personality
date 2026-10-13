# 当前版本状态

当前为 GitHub Pages + Supabase 版本，最新运行与发布说明见 DEPLOYMENT.md。

v1.2.1 展示规则：用户结果页、分享页及长图只展示最高分主人格，不展示双/多面配置、副人格或七维分布；完全同分时按既有稳定顺序取首位。完整倾向与答案继续保留在运营后台。页面不显示“人格实验室”及车图来源说明，素材溯源仍保存在 public/cars/sources.json。

以下为 v1.1 的历史说明，保留用于回退参考。

# 极氪人格测评网站

已确认内容：30道题（28道计分题、2道彩蛋）、7种车型人格、主/双/多面结果；不包含岗位登记问卷，也不直接公布组队名单。

## 产品规则

- 真实姓名必填，按NFKC、去首尾空格、忽略空白及英文大小写后的姓名统计。此模式不能阻止改名，也不能区分同名者。
- 只有成功提交全部30道答案、在数据库中生成结果才计一次。每个姓名最多3次；独立标签页并发同样受限。
- 答案在当前标签页的 sessionStorage 中暂存，可返回改选、刷新恢复。新一轮答题不会覆盖旧结果。
- 分数在服务端按 lib/quiz.ts 计算。requestId保证失败重试及重复点击不额外计次。
- 真实姓名、完整答案保留在D1中供活动记录使用；没有公开名单或公开答案接口。分享接口只返回随机结果ID、时间与人格结果。
- 分享链接为 /r/<随机UUID>，无需测评会话。真实姓名不进入分享页、长图或URL。
- 长图从结果卡实际DOM生成。电脑触发PNG下载；移动端提供图片长按保存、下载和支持时的系统分享。网站不能绕过手机权限直接写相册。
- 车型人格为活动创意，不是心理诊断或创作能力认证。分组仍需结合运营已有资料。

## 技术与运行

Vinext / React / Cloudflare Workers / D1；html-to-image用于长图；qrcode用于分享二维码。数据库结构位于db/schema.ts，迁移位于drizzle/。

常规：npm ci；npm run build；npm run dev。Node >=22.13。

本机Sites的Windows包管理器调用有路径兼容问题，已使用等效入口安装和构建：

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run install:ci
node scripts\run-framework.mjs build
node scripts\run-framework.mjs dev
```

首次本地数据库初始化（不要对已应用数据库重复执行）：

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_perpetual_mad_thinker.sql
```

托管数据库与本地测试数据库分离，Sites发布时自动应用迁移。保留.openai/hosting.json中既有project_id。

## 验证

- node --test tests/core.test.mjs：题目计分配平、七种主结果、平局、多面、彩蛋隔离、非法输入。
- node node_modules/typescript/bin/tsc --noEmit。
- node tests/e2e.mjs：浏览器全流程，返回修改、刷新恢复、导图、匿名分享、复制、再次测评、三次上限、幂等和并发；320/390/768/1440视口。
- e2e默认使用本机Chrome与127.0.0.1:5173；测试记录仅写本地数据库，outputs/截图不提交。
- 实测PNG样本：单人格1074×5340，七倾向并列1074×12573。尺寸随设备和结果内容变化。

可用性检查已在桌面Chrome及移动视口完成；真实iOS/微信中的“保存到相册”菜单仍需设备现场验证。

## 修改入口

- lib/quiz.ts：已确认的题目、计分键、结果文案。
- components/QuizApp.tsx：姓名与答题流程。
- components/ResultCard.tsx：分享长图的正文。
- components/ResultView.tsx：导图、复制、再次测评。
- lib/server.ts：服务端校验与原子次数限制。
- app/styles.css：移动端与桌面样式。

不要将测试结果、.wrangler、凭据、原始姓名和完整答案加入Git或前端代码。后续问卷或计分变更需保留旧版本结果的解释依据。
