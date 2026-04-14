# 设计规范 — 想象力大中台（Web）

本文档与仓库代码对齐，定义产品级视觉与交互约定。**新增或改版页面应优先使用 `src/styles/design-tokens.css` 中的 CSS 变量**，并与下列参考实现一致；若产品明确变更设计，请**同步改代码与本文件**。

**参考实现（优先级）：**

1. 全局令牌：`src/styles/design-tokens.css`
2. 登录页：`src/components/LoginPage.vue`
3. 管理后台壳层：`src/components/admin/AdminLayout.vue`
4. 列表示例（账号列表）：`src/components/admin/AccountListPage.vue`

---

## 1. 设计原则

- **清晰克制**：白底或极浅灰衬底 + 浅灰分割线层级；主色仅用于关键行动、选中态与强提示。
- **登录 / 底边线表单**：登录场景输入区以 **底边线** 表达边界，聚焦时底边线为主色（与令牌 `--color-line` / `--color-primary` 一致）。
- **后台筛选 / 浅卡片输入**：列表页筛选使用 **白底圆角条**（细描边 + 轻阴影），聚焦时 **主色描边 + 外发光环**，与登录底边线模式并存、分场景使用。
- **圆角语言**：主交互控件为 **圆角矩形**，避免大面积极简 UI 默认使用 **全圆胶囊**（`border-radius: 999px`）。全局令牌：`--radius-control: 14px`（主控件）、`--radius-nested: 10px`（嵌套块）、`--radius-panel: 24px`（大面板）。后台侧栏导航项、顶栏 Tab、部分按钮实际使用 **12px**；分页块、状态徽标等使用 **10px**。
- **安全区**：固定 Logo、分栏与主区内边距须叠加 `env(safe-area-inset-*)`。
- **图标**：统一 **Iconify + `lucide:*`**，与实现保持一致。

---

## 2. 色彩与 CSS 变量

全局变量定义于 `**design-tokens.css**`，与下表对应；组件中可直接使用 `var(--color-*)` 等。


| 令牌（CSS 变量）                | 色值                                | 用途                          |
| ------------------------- | --------------------------------- | --------------------------- |
| `--color-primary`         | `#f10c0c`（与 `#F10C0C` 同色；令牌文件为小写） | 主按钮、分页当前页、通知角标、筛选聚焦环、链接强调色等 |
| `--color-page-bg`         | `#f8fafc`                         | 整页底层（登录等场景）                 |
| `--color-surface`         | `#ffffff`                         | 卡片 / 输入条表面                  |
| `--color-text`            | `#0f172a`                         | 正文默认                        |
| `--color-text-strong`     | `#020617`                         | 标题、顶栏字色（偏重）                 |
| `--color-text-secondary`  | `#64748b`                         | 次要说明、侧栏默认导航字色               |
| `--color-placeholder`     | `#94a3b8`                         | 占位符、弱化图标                    |
| `--color-line`            | `#e8edf2`                         | 分割线、输入底边（登录）                |
| `--color-segmented-track` | `#f1f5f9`                         | 分段器轨道（登录）                   |
| `--color-focus-ring`      | `#2563eb`                         | `focus-visible` 轮廓（键盘可达性）   |


**管理后台补充（壳层局部变量 / 硬编码与语义）：**


| 名称               | 色值                                                                                                          | 用途                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `--admin-canvas` | `#fefefe`                                                                                                   | 顶栏 + 主内容区衬底（`AdminLayout`）      |
| 顶栏底边             | `rgba(15, 23, 42, 0.05)`                                                                                    | 与主区分隔                           |
| 侧栏渐变衬底           | 紫 / 蓝 / 粉轻量径向 + 纵向灰渐变（见实现）                                                                                  | 侧栏品牌氛围，保持可读                     |
| 侧栏右缘             | `#e8e8e8` + 轻阴影                                                                                             | 与主区分界                           |
| 表格分割线（列表页）       | `rgba(15, 23, 42, 0.055)`（`AccountListPage` 内 `--hairline`）；更浅分隔 `--hairline-faint: rgba(15, 23, 42, 0.04)` | 单元格 / 表头区域分隔                    |
| 列表页主色别名          | `--primary: #F10C0C`（与 `--color-primary` 对齐，`AccountListPage` 内 `v-bind`）                                   | 按钮、幽灵按钮底等                       |
| 状态徽标             | 绿 / 红 / 橙透明底                                                                                                | 正常、已禁用、已离职（见 `AccountListPage`） |


**主按钮不可用**：在保持品牌色的前提下使用 `**opacity: 0.4`**（逻辑示意），避免随意改为灰色实底。

---

## 3. 字体与排版

**字体栈（全局 `--font-sans`，与登录页一致）：**

```text
Inter, system-ui, -apple-system, "Segoe UI", Roboto,
"PingFang SC", "Microsoft YaHei", sans-serif
```


| 层级 / 场景      | 参考                             | 字号                                      | 字重                   | 字色 / 说明                    |
| ------------ | ------------------------------ | --------------------------------------- | -------------------- | -------------------------- |
| 登录主标题        | `login-panel__title`           | `clamp(1.75rem, 2.5vw, 2.125rem) - 2px` | 700                  | `#020617`，负字距              |
| 登录副标题        | `login-panel__subtitle`        | `calc(0.9375rem + 2px)`                 | 400                  | `#64748b`                  |
| 登录表单标签       | `field-label`                  | 12px                                    | 500                  | `#64748b`                  |
| 登录输入         | —                              | 15px                                    | 400                  | `#0f172a`                  |
| 顶栏业务 Tab     | `admin-header__nav-item`       | 14px                                    | 500 / 当前 600         | `var(--color-text-strong)` |
| 侧栏分组标题       | `admin-sidebar__group-title`   | 11px                                    | 700                  | `#94a3b8`，字间距加宽            |
| 侧栏菜单项        | `admin-sidebar__item`          | 14px                                    | 500 / 当前 600         | 次要色 → 当前深字                 |
| 侧栏账号名        | `admin-sidebar__account-name`  | 14px                                    | 700                  | `#0f172a`                  |
| 列表标题         | `account-panel__title`         | 18px（`1.125rem`）                        | 700                  | `#0f172a`                  |
| 列表副说明        | `account-panel__note`          | 13px                                    | 500                  | `#64748b`                  |
| 筛选标签         | `filter-field__label`          | 15px                                    | 600                  | `#475569`                  |
| 表格表头         | `data-table th`                | 12px                                    | 600                  | `#64748b`                  |
| 表格正文         | `data-table td`                | 14px                                    | 400                  | `var(--color-text)`        |
| 列表主按钮（表格区）   | `btn-primary`                  | 15px                                    | 600                  | 白字 on 主色                   |
| 筛选栏「查询 / 重置」 | `.account-filter__actions` 内按钮 | 14px                                    | 600                  | 与筛选行同高 **46px**，圆角 **8px** |
| 登录主按钮        | `submit-btn`                   | 16px                                    | 600                  | 白字，高 **52px**              |
| 分段器 Tab      | `segmented__tab`               | 14px                                    | 600（未选中字色 `#64748b`） | 选中字色为主色                    |
| 列表次要按钮       | `btn-outline`                  | 15px                                    | 600                  | `#0f172a`                  |


**移动端**：登录主标题可在 ≤768px 固定约 `20px`（见登录页媒体查询）。

---

## 4. 布局与栅格

### 4.1 登录页


| 约定         | 值                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| 桌面左右分栏     | 左表单 `flex: 0 0 50%`，右品牌 `flex: 0 0 50%`；子项 `min-width: 0`                                                                |
| 表单内容最大宽度   | `420px`，于左栏居中                                                                                                            |
| 全页最小高度     | `100vh` / `100dvh` / `100svh` 兼容书写                                                                                       |
| 左栏内边距      | 垂直 / 水平 `clamp` + `safe-area`（见 `LoginPage`）                                                                             |
| 右栏内边距      | `30px` + `safe-area`                                                                                                     |
| 品牌画框       | `border-radius: 24px`（`--radius-panel`），`overflow: hidden`，背景 `cover` + `center`                                         |
| Logo       | `position: fixed`，高度 **40px**，`top: calc(15px + safe-area-top)`，`left: calc(17px + safe-area-left)`，`max-width` 防裁切（见代码） |
| 登录 Tab 面板区 | `login-panel__tab-panels` 固定高度（桌面约 **30rem** / `min-height` **26rem**；≤768px 约 **28rem** / **24rem**）                    |


**≤768px**：纵向堆叠；表单区为 Logo 预留顶距；品牌区 `min-height: min(360px, 42vh)` 等（见代码）。

### 4.2 管理后台（`AdminLayout`）


| 约定        | 值                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 整体        | `.admin-shell` 横向 flex：**侧栏 + 主区域**；全屏最小高度 `100vh` / `100dvh`；外壳背景 `#fff`                                                        |
| 侧栏宽度      | 展开 `**244px`**，收起 `**72px`**（CSS 变量 `--sidebar-w` / `--sidebar-w-collapsed`）                                                     |
| 窄屏        | `max-width: 1024px` 时侧栏**强制等同收起**（仅图标）；宽屏可点击中部 **FAB** 切换展开 / 收起                                                                 |
| 顶栏高度      | `**64px`**（`--header-h`），`sticky`                                                                                                |
| 主区水平留白    | `**--admin-inline-gutter: 32px`**，顶栏与 `main.admin-main` **左右对称**，并与 `max(..., env(safe-area-inset-*))` 取较大值                      |
| 小屏留白      | `**@media (max-width: 720px)`** 时 `--admin-inline-gutter: 16px`**                                                                |
| 主内容衬底     | `**--admin-canvas: #fefefe`**                                                                                                    |
| 主内容区      | `slot` 置于 `main.admin-main`；**中间区块随视口变宽变窄横向铺满**（列表页根节点 `width: 100%`，不再使用版心 `max-width` 居中）                                      |
| 主区内边距（纵向） | `main.admin-main`：**上 20px**，**下** `max(24px, env(safe-area-inset-bottom))`                                                      |
| ≤720px 适配 | `--admin-inline-gutter: 16px`；**顶栏**可折行（`height: auto`，`min-height: var(--header-h)`，上下各 **10px** 内边距）；**侧栏内轨** `16px 12px 20px` |


---

## 5. 圆角与形状


| 元素                                   | 圆角       | 说明                                                                       |
| ------------------------------------ | -------- | ------------------------------------------------------------------------ |
| 登录主按钮 / 分段器轨道                        | **14px** | 与 `--radius-control` 一致；Vant 配合 `--van-button-radius: 14px`              |
| 分段器滑块                                | **10px** | 与轨道 `padding: 4px` 配套（`--radius-nested`）                                 |
| 品牌外框 / 大面板                           | **24px** | `--radius-panel`                                                         |
| 后台顶栏 Tab、侧栏项、图标按钮                    | **12px** | 与 14px 令牌并存，属后台密度略高的控件层                                                  |
| 列表页 `btn-primary` / `btn-outline` 外框 | **12px** | 仍设 `--van-button-radius: 14px` 以兼容 Vant 变量                               |
| 侧栏账号卡片                               | **14px** | 白底弱描边 + 轻阴影                                                              |
| 侧栏收起 FAB                             | **圆形**   | 唯一推荐的圆形控件；`30px`，跨在侧栏右缘                                                  |
| 账号列表外层卡片、筛选行、筛选「展开」钮                 | **12px** | `filter-field__line`、`account-panel__table-box`、`account-filter__expand` |
| 筛选栏「查询 / 重置」                         | **8px**  | 与表格区 **12px** 主按钮区分（`account-filter__actions`）                           |
| 状态徽标、分页单项                            | **10px** | `--radius-nested`                                                        |
| 侧栏账号区「退出」按钮                          | **10px** | 次级操作                                                                     |


**禁止**：主流程按钮默认不做 **999px 胶囊**（除非单页产品专项设计）。

---

## 6. 间距与尺寸（摘录）


| 用途              | 参考                                                          |
| --------------- | ----------------------------------------------------------- |
| 登录：标题区与表单       | `login-panel__head` `margin-bottom: 1.5rem`                 |
| 登录：表单项间距        | `field-block` `margin-bottom: 0.625rem`                     |
| 登录：主按钮高度        | **52px**                                                    |
| 登录：行内图标         | 约 **20px**，色接近 `--color-placeholder`                        |
| 列表：筛选行最小高度      | **46px**，内边距左右 **14px**                                     |
| 列表：筛选「展开更多」     | **46×46** 方钮，**12px** 圆角（`account-filter__expand`）          |
| 列表：筛选栏「查询 / 重置」 | 高 **46px**，圆角 **8px**（`account-filter__actions`）            |
| 列表：主按钮高度        | **44px**；紧凑幽灵按钮 **42px**                                    |
| 列表：表格单元格纵向      | `th` 约 `12+14` px padding；`td` `14+16`                      |
| 列表：表格横向留白       | `account-panel__table-box .table-wrap` 左右 **24px**          |
| 列表：筛选区下留白       | `.account-hero` `padding: 4px 0 22px`                       |
| 列表：表头标题区内边距     | `account-panel__head`：**20px 24px 18px**                    |
| 侧栏内轨            | `admin-sidebar__inner` **22px 16px 20px**（收起时缩至 **8px** 水平） |


---

## 7. 组件模式

### 7.1 登录：分段器（Segmented）

- 两列等宽 `grid`；轨道 `--color-segmented-track`，内边距 `4px`。
- 白滑块 + 轻阴影；位移动画 `transform` + `**0.28s`** `cubic-bezier(0.25, 0.8, 0.25, 1)`。

### 7.2 登录：行内输入（底边线 + 图标）

- 外层底边 `var(--color-line)`；`focus-within` 主色底边。
- Iconify `lucide:*`。

### 7.3 登录：主按钮

- Vant `van-button`，不用 `round`；Hover `brightness`；Active `scale(0.99)`；字号 **16px**、高 **52px**。

### 7.4 登录：扫码 Tab（企业微信）

- 说明文案 + **企业微信** 图标（`WeCom.svg`）；占位二维码外框 **200×200**，外层 `**#f1f5f9**`、**16px** 圆角；内层棋盘格占位 **8px** 圆角（见 `qr-frame` / `qr-frame__inner`）。
- 辅助说明 **12px**、`#94a3b8`。

### 7.5 列表页：筛选行（`filter-field__line`）

- 白底、**12px** 圆角、浅描边 `rgba(15, 23, 42, 0.06)`、轻阴影（双层）。
- `focus-within`或与弹出层打开态：**主色半透明描边** `rgba(241, 12, 12, 0.38)` + **2px 外扩环** `rgba(241, 12, 12, 0.14)` + 阴影抬升（与实现一致）。
- 文本用 **无底边** 的 `input`；**部门 / 角色 / 状态** 使用 `**button` 触发器 + Teleport 弹出层**（`filter-field--filter-picker`），Chevron 打开时旋转 **180°**；样式表中保留 `.filter-field__select` 等规则供其它页面复用原生 `select` 时对齐字级与箭头（当前账号列表筛选模板未使用 `<select>`）。
- **首行四列**（员工号、姓名、手机号、部门）+ **展开钮**；展开后第二行 **角色、状态**（`filtersExpanded`）；栅格变量 `--filter-col-min: 84px`、列间距 **12px**。

### 7.6 列表页：按钮

- **主按钮** `btn-primary`（表格区）：主色实底，**12px** 圆角，高 **44px**，字 **15px**。
- **筛选栏右侧**「查询 / 重置」：高 **46px**、圆角 **8px**、字 **14px**（`account-filter__actions`），与筛选条视觉对齐。
- **幽灵主按钮** `btn-primary--ghost`：浅主色透明底 + 主色字（如「添加新账号」）；紧凑变体 **42px** / **14px** 字。
- **线框按钮** `btn-outline`：浅灰描边（`--hairline`），白底。

### 7.7 列表页：表格与状态

- 表头 / 行 **底部分割线**（非「无分割」）；行 **hover** 浅灰底。
- **状态徽标** `status-badge`：**10px** 圆角，绿 / 红 / 橙语义底（见代码）。
- **操作列**：圆角块级操作按钮（重置密码、禁用 / 启用、编辑、删除等），多色浅底区分语义。

### 7.8 分页（`van-pagination`）

- `mode="multi"`；**每项独立圆角块**（约 **10px**），默认描边，**当前页主色实底白字**；`:deep` 去掉 Vant 默认连体描边（`::after`）。

### 7.9 管理后台壳层

- **顶栏**：业务 Tab 带 **chevron-down**（`aria-haspopup`）；右侧 **通知** **主色角标**（约 **18px** 高、**6px** 圆角、**11px** 字重 **700**）。**消息** 入口由 `showHeaderMessageBtn` 控制，当前实现为 `**false**`（不展示），需要时改为 `true`。
- **侧栏**：**相邻分组之间** **1px** 分隔线（`::before`，**左右各内缩 10px`**，非通栏）；色 `rgba(15, 23, 42, 0.07)`，收起态略加深 **0.08**。当前项 **半透明白底 + 轻阴影 + 内高光描边**，字 / 图标为 **深色**（`#0f172a`）。
- **收起态**：Logo **28px** 高、`max-width: 44px`；**第二组分组标题**在收起时 **不占高**（避免与首组菜单纵向错位，见 `.admin-shell--sidebar-collapsed` 下规则）。
- **账号块**：白卡片；**chevron** 使用 `lucide:chevron-down`，样式上 **`transform: rotate(-90deg)`** 呈现为指向右侧（与实现一致）。
- **退出登录**：浅灰底 **10px** 圆角条；**12px** 字、**600** 字重，带 `log-out` 图标；收起时 **仅图标**（文案 `display: none`）。

### 7.10 新增账号弹窗（`AccountListPage`）

- Vant `van-popup`；表单行采用 **浮动标签** 样式（`add-account-float`，与筛选区模式分离）。
- **角色** 为 **Teleport到 `body` 的列表框**（`add-account-role-panel`），触发器 +定位面板，选中项带 **check** 图标。

### 7.11 无障碍

- 表单控件 `label` / `id` 关联；侧栏 FAB 带 `aria-expanded`、`aria-controls`；可聚焦控件 `focus-visible` 使用 `var(--color-focus-ring)`。

---

## 8. 动效

- 颜色 / 透明 / 阴影：**约 `0.2s ease`**。
- 侧栏宽度 / 内边距过渡：**约 `0.28s ease`**。
- 按钮按压：`**transform 0.15s ease**`。
- 分段器滑块：见 §7.1。

---

## 9. 技术栈注意

- **Vue 3 + Vant 4**：列表页按钮同时设置 `border-radius` 与 `--van-button-radius`。
- **@iconify/vue + Lucide**：统一 `lucide:` 前缀。
- **Scoped**：`:deep(...)` 仅用于 Vant 分页等第三方内部，控制最小范围。

---

## 10. 业务文案约定（示例数据）

- 账号列表等部门下拉与表格列：部门名称前缀常量 **想象力教育科技**（代码中 `DEPT_PREFIX`），与筛选、表格列保持一致。

---

## 11. 新页面自检清单

- 是否优先使用 `**design-tokens.css`** 中的变量而非随意硬编码色值
- 主操作是否使用 `**--color-primary` / `#F10C0C`**；禁用是否倾向 **opacity**
- 主按钮与筛选 / Tab 是否为 **12px～14px** 圆角矩形，而非默认胶囊；**筛选栏右侧**操作钮是否使用 **8px** 圆角（与 **12px** 主按钮区分）
- 登录类页面是否采用 **底边线 + 主色聚焦**；后台筛选是否采用 **白卡片 + 主色环聚焦**
- `**safe-area`** 与 `**focus-visible`** 是否覆盖
- 管理后台主内容是否 **左右对称 gutter**，且内容区 **横向可随屏拉伸**（避免无意的 `margin: 0 auto` + `max-width` 造成仅单侧留白增大）
- 列表类 **可折叠筛选**、**弹出层选择器** 是否与 `AccountListPage` 的聚焦环、动效与无障碍约定一致
- 图标是否统一 **Lucide**

---

## 12. 参考实现与冲突处理


| 文件                                         | 内容                          |
| ------------------------------------------ | --------------------------- |
| `src/styles/design-tokens.css`             | 全局颜色、圆角、字体栈                 |
| `src/components/LoginPage.vue`             | 登录布局、分段器、底边线输入、扫码 Tab       |
| `src/components/admin/AdminLayout.vue`     | 侧栏 / 顶栏 / 主区槽位、留白变量、通知角标    |
| `src/components/admin/AccountListPage.vue` | 可展开筛选、弹出选择器、表格、状态、分页、新增账号弹窗 |


若**代码与本文冲突**：以**当前已合并的代码**为准更新本文件，或由产品裁定后双端同步修改。

---

*文档与仓库实现同步维护；交付静态预览包见 `vite.config.ts` 单文件构建与 `public/客户预览说明.txt`。*