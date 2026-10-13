# 极氪人格网站：v1.2 迁移与回退

## 生产环境

- 前台：https://liulian3473413466-create.github.io/zeekr-personality/
- 后台：https://liulian3473413466-create.github.io/zeekr-personality/#/admin
- 仓库：https://github.com/liulian3473413466-create/zeekr-personality
- Supabase：`lkqiceztiqiqhrqbdvnr`，项目 `zeekr-personality`，区域 `us-west-2`（运营实际创建的项目）。
- 旧版保留：https://zeekr-personality-lab.ready-cod-2086.chatgpt.site/
- 上线日期：2026-10-13。密钥、管理员初始化链接、私人数据仅保留在本地忽略目录或受控数据库中。

## 两个版本

当前补丁 `v1.2.1`：用户结果、分享页、导出长图仅展示最高分主人格和对应车型；最高分完全并列时沿用计分排序取首位，旧结果也使用同一展示规则。后台继续保留全部分数、接近倾向与答案，不修改数据库记录或原计分逻辑。删除页面品牌副标题与车图来源文字。9组前端样例覆盖七种主人格以及原双/多倾向结果，均仅显示一个最高分人格；手机长图与原完整流程检查通过。

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
2. 应用 `supabase/migrations/20261013125133_quiz_initial.sql`。
3. `npm run build` 会同步唯一题库 `lib/quiz.ts` 到 Edge Function 的 `_shared/quiz.ts`。
4. 部署 `supabase/functions/quiz-api`，`verify_jwt=false`；函数自身校验参与者随机会话与管理员 Supabase Auth JWT。公开读取结果仅返回结果内容，所有管理接口逐次校验管理员表。
5. 所有表启用 RLS，anon/authenticated 没有直接读表、写表或执行内部 RPC 的权限；仅 Edge Function 的服务端角色访问。
6. 初始化管理员时生成32字节随机十六进制令牌，仅将 SHA256 摘要、管理员邮箱与短期过期时间写入 `quiz_setup`。一次性链接为 `#/admin/setup?token=<令牌>`。运营本人设定至少12位密码；激活后令牌记录删除。令牌、密码、私人邮箱与用户数据不提交到Git。

## 数据迁移

通过 Sites 的受控数据库读取接口导出 participants/results，存入忽略的 `work/legacy-data.json`。导入时保持结果 UUID、创建时间、原始答案、计分结果与姓名归一化键，source 记为 `v1.1`；同名的历史结果继续占用三次额度。不得导入旧会话 token。

迁移须检查旧表/新表人数、结果数、每人次数、结果 UUID 和答案/计分逐条一致。公开分享网址会换域名，旧网址仍由保留的 v1.1 服务承载。正式切换前再读取一次旧表并补齐差异。

## 验证范围

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
