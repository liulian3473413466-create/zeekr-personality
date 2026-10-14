# 极氪人格网站：v1.2 迁移与回退

## 生产环境

- 前台：https://liulian3473413466-create.github.io/zeekr-personality/
- 后台：https://liulian3473413466-create.github.io/zeekr-personality/#/admin
- 仓库：https://github.com/liulian3473413466-create/zeekr-personality
- Supabase：`lkqiceztiqiqhrqbdvnr`，项目 `zeekr-personality`，区域 `us-west-2`（运营实际创建的项目）。
- 旧版保留：https://zeekr-personality-lab.ready-cod-2086.chatgpt.site/
- 上线日期：2026-10-13。密钥、管理员初始化链接、私人数据仅保留在本地忽略目录或受控数据库中。

## 版本记录

当前版本 v1.4.0：v1.4.0：12题岗位版（quizVersion=3, questionRevision=1），第1—10题采集摄影/编导/出镜/剪辑的经历、自报熟练度与意愿，第11—12题采集协作习惯。分组先最大化可独立岗位覆盖，在相同覆盖下比较80%岗位匹配＋20%协作偏好多样性。四岗各一人；无熟练人选标需指导。不根据车型推断能力；旧版参考答卷需改选岗位版或手动分组。公开结果接口剔除roleProfile，只在后台返回岗位信息。旧30题及两版12题完整保留，原题2修订2冻结于lib/quiz-v2-intuitive.ts；独立草稿键v4。完整题库与规则见docs/题库与邀约-v1.4.html。

发布顺序：新增role_quiz迁移 → quiz-api（含全部6个_shared文件）→ Pages前端。回退时保留支持版本3的数据库、API和后台；不得把岗位版答案套入旧题库。回退公开题目需在兼容层上选择冻结旧题库，不能直接整体恢复旧版后台。旧Git标签继续保留，可按差异回退代码；不执行破坏性逆迁移。

`v1.3.1`：12题表述简化，选项改为更短的口语反应或具体偏好；计分规则不变。结果/提交增加 questionRevision=2；旧12题记录（无修订号或1）使用 lib/quiz-v2.ts 冻结文案，后台与CSV分别解释。无需数据库迁移。部署 Edge Function 时包含 quiz.ts、quiz-v1.ts、quiz-v2.ts 三个共享文件，再发布前端。

`v1.3`：昵称入口、12道KOC创作情境题（题库版本2），全部计分。旧30题库冻结为版本1，旧记录、分享链接及已用次数保留。后台按结果版本查看答案、导出CSV，分组倾向按各题库的出现机会校正。前端请求显式带 quizVersion=2；缺省版本1以兼容尚未刷新的旧客户端。完整题库与邀约见 docs/题库与邀约-v1.3.html。

迁移顺序：先应用新增 short_quiz_nicknames SQL 迁移，再部署 quiz-api 及两个 _shared 题库文件，最后发布 Pages 前端。迁移支持两版记录，不删除或重算历史结果。回退时保留兼容两版记录的数据库、API及后台；不要在已有12题记录后直接恢复旧后台（旧后台固定按30题解释）。修复或回退文案/前台流程时以 v1.3 兼容层为基础；旧 v1.2.2 标签仍留存参考，数据库不做破坏性逆迁移。

`v1.2.2`：实际车图完成加载与解码后，才揭晓结果并启动驶入动效；等待中显示准备状态，图片失败或超过20秒时可重试。`node tests/result-loading.test.mjs`（使用受控API的预览构建）验证延迟下载、延迟解码、动画启动时机、失败后重试和离开页面后的清理。原答题、分享、长图和后台浏览器流程亦通过。

`v1.2.1`：用户结果、分享页、导出长图仅展示最高分主人格和对应车型；最高分完全并列时沿用计分排序取首位，旧结果也使用同一展示规则。后台继续保留全部分数、接近倾向与答案，不修改数据库记录或原计分逻辑。删除页面品牌副标题与车图来源文字。9组前端样例覆盖七种主人格以及原双/多倾向结果，均仅显示一个最高分人格；手机长图与原完整流程检查通过。

- v1.1：原 Sites / Workers / D1 版本。Git 标签 `v1.1` 指向 `320202e13160325c7cbcb7bb434778d1e784d034`，工作区 `outputs/zeekr-personality-v1.1.bundle` 为独立 Git 备份。原网址继续保留。
- v1.2：Vite 静态前端（GitHub Pages）+ Supabase Edge Function / Postgres / Auth。题库与计分版本仍为1，没有改动题目或分数解释。
- v1.1 不能直接部署到 GitHub Pages，因为它依赖服务端。需要恢复时，使用旧网址或在 Sites 重新发布原已保存版本。后续 GitHub Pages 版本可通过 Actions 的手动发布选择 Git 标签回退。
- 数据库回退与前端回退是两件事。回退前端不会删除新测评数据，也不应回滚个人记录。两个平台不会自动互相同步新记录。

后续回退：进入 GitHub 仓库 Actions → Publish quiz frontend → Run workflow，把 ref 填为已验证标签（例如 `v1.2`）。后台接口若有变化，必须同时恢复对应 `supabase/functions/quiz-api` 版本；不要删除或重建数据库。

原 Sites 项目：`appgprj_6ace077c69b48191b3dd3e7bd7b80a03`；v1.1 已保存版本：`appgprj_6ace077c69b48191b3dd3e7bd7b80a03~appgver_f6d5df664fdc819188ea3a452be96b50`。

## 前端发布

Node 24，运行 `npm ci`、`npm run build`。输出目录 `dist-pages/`，不需要服务器。路由使用哈希：`#/r/<uuid>`、`#/admin`，GitHub Pages 刷新分享链接不会404。

GitHub 仓库 Variables 配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`，只放公开 publishable key；严禁 service_role / secret key。Pages 使用 GitHub Actions 发布，工作流在 `.github/workflows/pages.yml`。

`npm run dev` 在5174端口提供开发预览；`npm run preview` 预览构建结果。

## 后端配置

1. 建立专用 Supabase 项目。新账号/新组织需由运营确认；不要复用未知项目。
2. 按文件名顺序应用 `supabase/migrations/` 中的 SQL 迁移；线上迁移历史与本地文件保持一致。
3. `npm run build` 会同步 `lib/quiz.ts`、冻结的 `lib/quiz-v1.ts` 和 `lib/quiz-v2.ts` 到 Edge Function 的 `_shared/`，部署时同步脚本列出的全部文件均须包含。
4. 部署 `supabase/functions/quiz-api`，`verify_jwt=false`；函数自身校验参与者随机会话与管理员 Supabase Auth JWT。公开读取结果仅返回结果内容，所有管理接口逐次校验管理员表。
5. 所有表启用 RLS，anon/authenticated 没有直接读表、写表或执行内部 RPC 的权限；仅 Edge Function 的服务端角色访问。
6. 初始化管理员时生成32字节随机十六进制令牌，仅将 SHA256 摘要、管理员邮箱与短期过期时间写入 `quiz_setup`。一次性链接为 `#/admin/setup?token=<令牌>`。运营本人设定至少12位密码；激活后令牌记录删除。令牌、密码、私人邮箱与用户数据不提交到Git。

## 数据迁移

通过 Sites 的受控数据库读取接口导出 participants/results，存入忽略的 `work/legacy-data.json`。导入时保持结果 UUID、创建时间、原始答案、计分结果与姓名归一化键，source 记为 `v1.1`；同名的历史结果继续占用三次额度。不得导入旧会话 token。

迁移须检查旧表/新表人数、结果数、每人次数、结果 UUID 和答案/计分逐条一致。公开分享网址会换域名，旧网址仍由保留的 v1.1 服务承载。正式切换前再读取一次旧表并补齐差异。

## 验证范围

- v1.4：20项计分、岗位覆盖、20%协作权重、历史兼容、权限、次数及事务测试通过。受控浏览器通过第五选项/返回/刷新、匿名分享、1074×3990长图、四组建议、CSV和320/390/768/1440宽度检查；车图加载/解码门控继续通过。云端已验证岗位分服务端计算、公开响应移除岗位画像、后台可见岗位画像、三版共享三次额度、旧两版提交与权限隔离。

- v1.3：13项计分、昵称、SQL迁移兼容与分组检查通过；受控浏览器覆盖12题自动继续、返回/刷新、幂等重试、1074×3990长图、匿名分享及后台新旧题库切换，320/390/768/1440宽度无溢出。图片加载与解码等待检查通过。
- v1.3云端接口：新12题服务端计分、旧客户端30题兼容、不同版本共同占用三次额度、重复提交幂等、并发上限、后台混合历史、匿名读表拒绝均已检查。迁移前现有7份结果的整行摘要在迁移后逐条不变。测试数据仅使用临时账户，验后清理。
- 当前安全顾问另提示 Supabase Auth 未开启泄露密码检查（既有配置，本次未改动管理员密码或套餐）。[官方说明与启用条件](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)。RLS无策略仍为预期的客户端默认拒绝访问设置。

- `node --test tests/core.test.mjs tests/teams.test.mjs tests/database.test.mjs`：问卷配平、计分、分组、CSV安全、真实 Postgres 内核本地SQL权限与事务规则。
- `tests/frontend.test.mjs`：使用明确标记的受控 API 测试数据验证浏览器行为；不能代替云端验证。要求测试构建使用 `https://quiz-test.supabase.co` 和测试公开key，预览端口5174。
- 云端必须另外验证：实际数据库权限、真实 Edge Function、访客匿名结果、姓名次数限制、后台登录与保存、GitHub Pages完整访问链路。
- 2026-10-13 云端实测：匿名读表与后台访问被拒绝；管理员登录、一次性激活、进度、服务端计分、重复请求幂等、并发三次限制、姓名归一化、分组保存和版本冲突均通过。已认证但未授权的账号返回403。
- 正式 GitHub Pages 浏览器实测：自动下一题、返回与刷新续答、提交、匿名分享及刷新、车图、复制链接、1074×5550 PNG导出、再测一次、后台保存后重读与CSV导出均通过。320 / 390 / 768 / 1440宽度无横向溢出，浏览器无JS异常。仅验证当前网络环境，不代表所有地区或微信内置浏览器都可用。
- 上线迁入1名参与者、1份旧结果，姓名归一化键、结果UUID、答案、分数与创建时间逐项一致；联调创建的参与者、结果、会话及测试管理员已清理。验证截图和原始报告位于忽略的本地 `outputs/`，不作为正式参与数据发布。
- 车图为懂车帝原生透明 PNG，来源、下载地址、SHA256记录在 `public/cars/sources.json`，保留原图水印。
- Supabase 数据库检查仅提示「启用RLS但无策略」和新索引未使用。前者为此架构的预期拒绝访问规则，所有读取经服务端授权接口；[官方说明](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)。新项目的索引使用统计暂不足以判断是否删除；[官方说明](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)。

## 可用性

GitHub Pages + Supabase 依赖公网与地区网络状态，不能承诺所有网络均可用。Supabase 免费项目官方说明闲置一周可能暂停；持续生产运行需运营评估套餐。测试数据与实际用户数据分开，不能把模拟测试通过称为线上验收完成。
