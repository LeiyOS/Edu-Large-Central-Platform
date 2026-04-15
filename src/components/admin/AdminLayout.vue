<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import logoUrl from '../../assets/logo.png'
import logoNorUrl from '../../assets/logo_nor.png'

const props = defineProps<{
  /** 当前选中的顶部业务模块 Tab */
  activeTopNav: string
}>()

const emit = defineEmits<{
  logout: []
  /** 侧栏菜单文案，用于主区切换页面 */
  'sidebar-nav': [label: string]
  /** 顶部业务模块切换 */
  'top-nav': [label: string]
}>()

const topNavLabels = ['教学', '教务', '运营', '电商', '系统'] as const

/** 小于此宽度时侧栏固定为仅图标（与点击收起一致） */
const SIDEBAR_AUTO_COLLAPSE_MQ = '(max-width: 1024px)'

const isNarrowViewport = ref(false)
let narrowMql: MediaQueryList | null = null

function syncNarrow() {
  isNarrowViewport.value = narrowMql?.matches ?? false
}

onMounted(() => {
  narrowMql = window.matchMedia(SIDEBAR_AUTO_COLLAPSE_MQ)
  syncNarrow()
  narrowMql.addEventListener('change', syncNarrow)
})

onUnmounted(() => {
  narrowMql?.removeEventListener('change', syncNarrow)
})

/** 仅窄屏时自动收起为图标模式（已移除手动折叠按钮） */
const isSidebarCollapsed = computed(() => isNarrowViewport.value)

const sidebarLogoSrc = computed(() =>
  isSidebarCollapsed.value ? logoNorUrl : logoUrl,
)

/** 侧栏条目：可有下级（如「扫雷管理」→ 随堂测 / 学案 / 导学） */
type SidebarNavItemDef = {
  label: string
  icon: string
  children?: readonly SidebarNavItemDef[]
}

type SidebarSection = {
  /** 二级折叠条文案；仅当分组内 section 多于 1 时展示 */
  title?: string
  /** 该段内顶层条目按三级视觉处理（内缩）；有 children 时仅子级为三级样式 */
  subTier?: boolean
  items: readonly SidebarNavItemDef[]
}

type SidebarGroupDef = {
  title: string
  sections: readonly SidebarSection[]
}

const sidebarGroupsSource: readonly SidebarGroupDef[] = [
  {
    title: '用户管理',
    sections: [
      {
        items: [
          { label: '账号管理', icon: 'lucide:circle-user' },
          { label: '角色管理', icon: 'lucide:shield-check' },
        ],
      },
    ],
  },
  {
    title: '平台配置',
    sections: [
      {
        items: [
          { label: '菜单管理', icon: 'lucide:square-menu' },
          { label: '组织管理', icon: 'lucide:users-round' },
        ],
      },
    ],
  },
] as const

/**
 * 教学侧栏：一级分组可收起；题库管理内「扫雷管理」下挂三级入口（随堂测 / 学案 / 导学）。
 * 分割线仅在一级分组之间；已移除「测验与学案」分段标题。
 */
const teachingSidebarGroupsSource: readonly SidebarGroupDef[] = [
  {
    title: '题库管理',
    sections: [
      {
        title: '检索与工具',
        items: [
          { label: '题库搜题', icon: 'lucide:search' },
          {
            label: '扫雷管理',
            icon: 'lucide:scan-search',
            children: [
              { label: '随堂测', icon: 'lucide:clipboard-list' },
              { label: '学案题库', icon: 'lucide:book-open' },
              { label: '导学题库', icon: 'lucide:book-marked' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: '课程管理',
    sections: [
      {
        items: [
          { label: '课程列表', icon: 'lucide:layout-list' },
          { label: '课表编排', icon: 'lucide:calendar-range' },
          { label: '授课班级', icon: 'lucide:school' },
        ],
      },
    ],
  },
  {
    title: '配置中心',
    sections: [
      {
        items: [
          { label: '学科管理', icon: 'lucide:library' },
          { label: '年级学制', icon: 'lucide:layers' },
          { label: '系统参数', icon: 'lucide:sliders-horizontal' },
        ],
      },
    ],
  },
] as const

function collectTeachingLabels(items: readonly SidebarNavItemDef[]): string[] {
  return items.flatMap((i) => [i.label, ...(i.children ? collectTeachingLabels(i.children) : [])])
}

const TEACHING_SIDEBAR_LABELS = new Set<string>(
  teachingSidebarGroupsSource.flatMap((g) => g.sections.flatMap((s) => collectTeachingLabels(s.items))),
)

const activeSidebarLabel = ref('组织管理')

/** 一级：分组整体；二级：分组内多段时各段单独收起 */
const l1Expanded = ref<Record<number, boolean>>({})
const l2Expanded = ref<Record<string, boolean>>({})

function isL1Open(gi: number) {
  return l1Expanded.value[gi] !== false
}

function toggleL1(gi: number) {
  l1Expanded.value = { ...l1Expanded.value, [gi]: !isL1Open(gi) }
}

function l2Key(gi: number, si: number) {
  return `${gi}-${si}`
}

function isL2Open(gi: number, si: number, sectionCount: number) {
  if (sectionCount <= 1) return true
  return l2Expanded.value[l2Key(gi, si)] !== false
}

function toggleL2(gi: number, si: number, sectionCount: number) {
  if (sectionCount <= 1) return
  const key = l2Key(gi, si)
  const nextOpen = !isL2Open(gi, si, sectionCount)
  l2Expanded.value = { ...l2Expanded.value, [key]: nextOpen }
}

/** 带下级的条目（如扫雷管理）展开/收起三级 */
const branchExpanded = ref<Record<string, boolean>>({})

function branchKey(gi: number, si: number, ii: number) {
  return `${gi}-${si}-${ii}`
}

function isBranchOpen(gi: number, si: number, ii: number) {
  return branchExpanded.value[branchKey(gi, si, ii)] !== false
}

function toggleBranch(gi: number, si: number, ii: number) {
  const k = branchKey(gi, si, ii)
  branchExpanded.value = { ...branchExpanded.value, [k]: !isBranchOpen(gi, si, ii) }
}

function onL1TitleClick(gi: number, itemCount: number) {
  if (isSidebarCollapsed.value || itemCount === 0) return
  toggleL1(gi)
}

type NavItemVm = {
  label: string
  icon: string
  active: boolean
  isSubTier: boolean
  hasChildren: boolean
  /** 扫雷管理下三级：展开态无图标，与二级文案左对齐 */
  isBranchLeaf?: boolean
  children?: NavItemVm[]
}

function mapNavItemFromDef(
  item: SidebarNavItemDef,
  activeLabel: string,
  isSubTier: boolean,
  isBranchLeaf = false,
): NavItemVm {
  const children = item.children?.map((c) => mapNavItemFromDef(c, activeLabel, false, true))
  return {
    label: item.label,
    icon: item.icon,
    active: item.label === activeLabel,
    isSubTier,
    hasChildren: Boolean(children?.length),
    children,
    isBranchLeaf,
  }
}

function mapNavItems(items: readonly SidebarNavItemDef[], activeLabel: string, isSubTier: boolean) {
  return items.map((item) => mapNavItemFromDef(item, activeLabel, isSubTier, false))
}

function flattenNavTreeForCollapsed(items: NavItemVm[]): NavItemVm[] {
  const r: NavItemVm[] = []
  for (const it of items) {
    r.push({
      label: it.label,
      icon: it.icon,
      active: it.active,
      isSubTier: it.isSubTier,
      hasChildren: false,
      isBranchLeaf: it.isBranchLeaf,
    })
    if (it.children?.length) r.push(...flattenNavTreeForCollapsed(it.children))
  }
  return r
}

const sidebarGroups = computed(() => {
  const src = props.activeTopNav === '教学' ? teachingSidebarGroupsSource : sidebarGroupsSource
  const active = activeSidebarLabel.value
  return src.map((group) => {
    const sections = group.sections.map((section) => ({
      title: section.title,
      subTier: section.subTier ?? false,
      items: mapNavItems(section.items, active, section.subTier ?? false),
    }))
    const itemsFlat = sections.flatMap((s) => flattenNavTreeForCollapsed(s.items))
    const itemCount = itemsFlat.length
    return {
      title: group.title,
      sections,
      itemsFlat,
      sectionCount: group.sections.length,
      itemCount,
    }
  })
})

watch(
  () => props.activeTopNav,
  (nav) => {
    if (nav === '教学') {
      activeSidebarLabel.value = '学案题库'
    } else if (TEACHING_SIDEBAR_LABELS.has(activeSidebarLabel.value)) {
      activeSidebarLabel.value = '组织管理'
    }
  },
)

function onSidebarItemClick(label: string) {
  activeSidebarLabel.value = label
  emit('sidebar-nav', label)
}
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--sidebar-collapsed': isSidebarCollapsed }">
    <header class="admin-header">
      <div class="admin-header__brand">
        <img
          :src="logoUrl"
          alt="想象力大中台"
          class="admin-header__logo"
          width="218"
          height="59"
          decoding="async"
        />
      </div>
      <div class="admin-header__nav-panel">
        <nav class="admin-header__nav" aria-label="业务模块">
          <button
            v-for="label in topNavLabels"
            :key="label"
            type="button"
            class="admin-header__nav-item"
            :class="{ 'admin-header__nav-item--active': props.activeTopNav === label }"
            aria-haspopup="menu"
            aria-expanded="false"
            @click="emit('top-nav', label)"
          >
            <span class="admin-header__nav-text">{{ label }}</span>
            <Icon icon="lucide:chevron-down" class="admin-header__nav-chevron" aria-hidden="true" />
          </button>
        </nav>
      </div>
      <div class="admin-header__actions">
        <button type="button" class="admin-header__tool" aria-label="消息">
          <Icon icon="lucide:message-circle" class="admin-header__tool-ico" aria-hidden="true" />
          <span class="admin-header__tool-text">消息</span>
        </button>
        <button type="button" class="admin-header__tool" aria-label="用户">
          <Icon icon="lucide:user" class="admin-header__tool-ico" aria-hidden="true" />
          <span class="admin-header__tool-text">用户</span>
        </button>
        <button
          type="button"
          class="admin-header__tool admin-header__tool--logout"
          aria-label="退出登录"
          @click="emit('logout')"
        >
          <Icon icon="lucide:log-out" class="admin-header__tool-ico" aria-hidden="true" />
          <span class="admin-header__tool-text">退出</span>
        </button>
      </div>
    </header>

    <div class="admin-shell__body">
    <aside id="admin-sidebar-nav" class="admin-sidebar" aria-label="侧栏导航">
      <div class="admin-sidebar__inner">
        <div class="admin-sidebar__brand">
          <img
            :src="sidebarLogoSrc"
            alt="想象力大中台"
            class="admin-sidebar__logo"
            width="218"
            height="59"
            decoding="async"
          />
        </div>

        <div class="admin-sidebar__scroll">
          <div
            v-for="(group, gi) in sidebarGroups"
            :key="gi"
            class="admin-sidebar__group"
            :class="{ 'admin-sidebar__group--empty': group.itemCount === 0 }"
          >
            <button
              v-if="group.title"
              type="button"
              class="admin-sidebar__group-title admin-sidebar__group-title--toggle"
              :aria-expanded="isSidebarCollapsed ? undefined : group.itemCount === 0 ? undefined : isL1Open(gi)"
              @click="onL1TitleClick(gi, group.itemCount)"
            >
              <span class="admin-sidebar__group-title-text">{{ group.title }}</span>
            </button>

            <ul v-if="isSidebarCollapsed && group.itemCount > 0" class="admin-sidebar__list">
              <li v-for="(item, ii) in group.itemsFlat" :key="`${gi}-${ii}-${item.label}`">
                <button
                  type="button"
                  class="admin-sidebar__item"
                  :class="{
                    'admin-sidebar__item--active': item.active,
                    'admin-sidebar__item--sub': item.isSubTier,
                  }"
                  :title="item.label"
                  @click="onSidebarItemClick(item.label)"
                >
                  <span
                    v-if="item.isBranchLeaf"
                    class="admin-sidebar__item-leaf-dot"
                    aria-hidden="true"
                  />
                  <Icon
                    v-else
                    :icon="item.icon"
                    class="admin-sidebar__item-ico"
                    aria-hidden="true"
                  />
                  <span class="admin-sidebar__item-text">{{ item.label }}</span>
                </button>
              </li>
            </ul>

            <div
              v-else-if="!isSidebarCollapsed && isL1Open(gi) && group.itemCount > 0"
              class="admin-sidebar__group-body"
            >
              <template v-for="(section, si) in group.sections" :key="si">
                <button
                  v-if="group.sectionCount > 1 && section.title"
                  type="button"
                  class="admin-sidebar__section-head"
                  :aria-expanded="isL2Open(gi, si, group.sectionCount)"
                  @click="toggleL2(gi, si, group.sectionCount)"
                >
                  <span class="admin-sidebar__section-head-text">{{ section.title }}</span>
                  <Icon
                    :icon="isL2Open(gi, si, group.sectionCount) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                    class="admin-sidebar__section-head-chevron"
                    aria-hidden="true"
                  />
                </button>
                <ul
                  v-show="group.sectionCount <= 1 || isL2Open(gi, si, group.sectionCount)"
                  class="admin-sidebar__list"
                >
                  <li v-for="(item, ii) in section.items" :key="ii">
                    <div v-if="item.hasChildren && item.children?.length" class="admin-sidebar__branch">
                      <div class="admin-sidebar__branch-row">
                        <div class="admin-sidebar__branch-cell-main">
                          <button
                            type="button"
                            class="admin-sidebar__item admin-sidebar__item--branch-main"
                            :class="{ 'admin-sidebar__item--active': item.active }"
                            :title="item.label"
                            @click="onSidebarItemClick(item.label)"
                          >
                            <Icon :icon="item.icon" class="admin-sidebar__item-ico" aria-hidden="true" />
                            <span class="admin-sidebar__item-text">{{ item.label }}</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          class="admin-sidebar__branch-toggle"
                          :aria-expanded="isBranchOpen(gi, si, ii)"
                          :aria-label="`${isBranchOpen(gi, si, ii) ? '收起' : '展开'}${item.label}下级`"
                          @click="toggleBranch(gi, si, ii)"
                        >
                          <Icon
                            :icon="isBranchOpen(gi, si, ii) ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                            class="admin-sidebar__branch-toggle-ico"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                      <ul v-show="isBranchOpen(gi, si, ii)" class="admin-sidebar__list admin-sidebar__list--branch">
                        <li v-for="(child, ci) in item.children" :key="ci">
                          <button
                            type="button"
                            class="admin-sidebar__item admin-sidebar__item--branch-child"
                            :class="{ 'admin-sidebar__item--active': child.active }"
                            :title="child.label"
                            @click="onSidebarItemClick(child.label)"
                          >
                            <span class="admin-sidebar__item-text">{{ child.label }}</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                    <button
                      v-else
                      type="button"
                      class="admin-sidebar__item"
                      :class="{
                        'admin-sidebar__item--active': item.active,
                        'admin-sidebar__item--sub': item.isSubTier,
                      }"
                      :title="item.label"
                      @click="onSidebarItemClick(item.label)"
                    >
                      <Icon :icon="item.icon" class="admin-sidebar__item-ico" aria-hidden="true" />
                      <span class="admin-sidebar__item-text">{{ item.label }}</span>
                    </button>
                  </li>
                </ul>
              </template>
            </div>
          </div>
        </div>

        <div class="admin-sidebar__account">
          <div class="admin-sidebar__account-card" role="group" aria-label="当前账号">
            <span class="admin-sidebar__account-avatar" aria-hidden="true">
              <Icon icon="lucide:user" class="admin-sidebar__account-avatar-icon" />
            </span>
            <div class="admin-sidebar__account-text">
              <span class="admin-sidebar__account-name">刘飞</span>
              <span class="admin-sidebar__account-meta">管理员 · imagination.cn</span>
            </div>
            <Icon icon="lucide:chevron-down" class="admin-sidebar__account-chevron" aria-hidden="true" />
          </div>
          <button
            type="button"
            class="admin-sidebar__account-logout"
            title="退出登录"
            @click="emit('logout')"
          >
            <Icon icon="lucide:log-out" class="admin-sidebar__account-logout-ico" aria-hidden="true" />
            <span class="admin-sidebar__account-logout-text">退出登录</span>
          </button>
        </div>
      </div>
    </aside>

    <div class="admin-body">
      <main class="admin-main">
        <slot />
      </main>
    </div>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  /** Paper「tab」画板顶栏高度 48px */
  --header-h: 48px;
  --sidebar-w: 244px;
  --sidebar-w-collapsed: 72px;
  /** 主区（顶栏 + main）左右对称留白，中间内容随宽度拉伸 */
  --admin-inline-gutter: 32px;
  /** 与 `.admin-main` 上内边距一致，子页通栏负 margin 对齐顶栏下沿 */
  --admin-main-pad-top: 20px;
  /** 顶栏底边、教学通栏底边等同色分割线（与原 `admin-header` 底边一致） */
  --admin-header-hairline: rgba(15, 23, 42, 0.05);
  --admin-canvas: #fefefe;
  font-family: var(--font-sans);
  color: var(--color-text);
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #fff;
}

.admin-shell__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-width: 0;
  min-height: 0;
}

.admin-shell--sidebar-collapsed {
  --sidebar-w: var(--sidebar-w-collapsed);
}

/** 通栏顶栏：左白底 Logo（同侧栏展开图）、中区浅灰蓝 Tab 带、右侧操作（Paper「tab」画板 token） */
.admin-header {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  height: var(--header-h);
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  padding: 0;
  background: #ffffff;
  box-shadow: rgba(18, 17, 42, 0.07) 0 1px 0;
  color: #19191a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.admin-header__brand {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 12px 0 max(16px, env(safe-area-inset-left));
  background: #ffffff;
}

.admin-header__logo {
  height: 32px;
  width: auto;
  max-width: min(200px, 28vw);
  object-fit: contain;
  display: block;
}

/** 中间 Tab 区域：浅灰蓝底，与 Paper 示意一致 */
.admin-header__nav-panel {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #eef2f7;
}

.admin-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.admin-header__nav::-webkit-scrollbar {
  display: none;
}

.admin-header__nav-item {
  flex-shrink: 0;
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: #19191a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.admin-header__nav-text {
  letter-spacing: -0.01em;
}

.admin-header__nav-chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.85;
  color: inherit;
}

.admin-header__nav-item:hover {
  background: rgba(255, 255, 255, 0.55);
}

.admin-header__nav-item--active {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 1px rgba(2, 9, 16, 0.08);
  font-weight: 500;
}

.admin-header__nav-item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-header__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 max(16px, env(safe-area-inset-right)) 0 10px;
  background: #ffffff;
}

.admin-header__tool {
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  min-height: 32px;
  box-sizing: border-box;
  border: 1px solid rgba(2, 9, 16, 0.13);
  border-radius: 6px;
  background: #ffffff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: #19191a;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.admin-header__tool:hover {
  background: rgba(2, 9, 16, 0.04);
  border-color: rgba(2, 9, 16, 0.18);
}

.admin-header__tool:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-header__tool-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.admin-header__tool-text {
  white-space: nowrap;
}

.admin-header__tool--logout {
  border-color: rgba(231, 56, 40, 0.35);
  color: #c53030;
}

.admin-header__tool--logout:hover {
  background: rgba(231, 56, 40, 0.06);
  border-color: rgba(231, 56, 40, 0.5);
  color: #9b2c2c;
}

.admin-sidebar {
  position: relative;
  z-index: 40;
  flex: 0 0 var(--sidebar-w);
  width: var(--sidebar-w);
  box-sizing: border-box;
  align-self: stretch;
  min-height: 0;
  padding-left: max(0px, env(safe-area-inset-left));
  transition:
    flex-basis 0.28s ease,
    width 0.28s ease;
}

.admin-sidebar__inner {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 16px 24px;
  transition: padding 0.28s ease;
  /** Paper「cebianlan」：纯白底 + system-ui 层级（get_computed_styles / get_jsx） */
  background: #ffffff;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.admin-sidebar__brand {
  flex-shrink: 0;
  padding: 4px 0 24px;
  margin-bottom: 0;
}

.admin-sidebar__logo {
  height: 40px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
}

.admin-sidebar__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.admin-sidebar__group + .admin-sidebar__group {
  margin-top: 40px;
  padding-top: 0;
  border-top: none;
  position: relative;
}

/** 一级分组之间仅用留白分隔，无横线（参考极简侧栏） */
.admin-sidebar__group + .admin-sidebar__group::before {
  display: none;
}

/** 一级分组标题：同 Paper 分段标签（#A19E99 12/600）+ 可收起 */
.admin-sidebar__group-title--toggle {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  width: 100%;
  margin: 0 0 4px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: normal;
  color: #a19e99;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    opacity 0.2s ease,
    height 0.2s ease,
    margin 0.2s ease;
}

.admin-sidebar__group-title-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-sidebar__group-title--toggle:hover {
  color: #8a8783;
  background: rgba(0, 0, 0, 0.04);
}

.admin-sidebar__group-title--toggle:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__group-body {
  margin: 0;
  padding: 0;
}

/** 二级分段标题：可收起其下条目；与一级、三级之间无分割线 */
.admin-sidebar__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  margin: 8px 0 4px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: #a19e99;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.admin-sidebar__group-body > .admin-sidebar__section-head:first-child {
  margin-top: 0;
}

.admin-sidebar__section-head:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #8a8783;
}

.admin-sidebar__section-head:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__section-head-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-sidebar__section-head-chevron {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #a19e99;
}

/**
 * 无二级菜单的分组：去掉过大的 padding-top，用标题上下等距 margin，
 * 使与上、下分割线的视觉间距一致；后续分组顶距略收紧。
 */
.admin-sidebar__group + .admin-sidebar__group.admin-sidebar__group--empty {
  padding-top: 0;
}

.admin-sidebar__group--empty .admin-sidebar__group-title--toggle {
  margin: 40px 0;
}

.admin-sidebar__group--empty + .admin-sidebar__group {
  margin-top: 40px;
  padding-top: 0;
}

.admin-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0 8px;
}

.admin-sidebar__branch {
  margin: 0 0 4px;
}

.admin-sidebar__branch-row {
  display: flex;
  align-items: stretch;
  gap: 2px;
  width: 100%;
}

/** 左侧图标+文案共用一块圆角底，hover 与右侧展开箭头分离 */
.admin-sidebar__branch-cell-main {
  flex: 1 1 auto;
  min-width: 0;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.admin-sidebar__branch-cell-main:has(.admin-sidebar__item--branch-main:hover) {
  background: rgba(0, 0, 0, 0.04);
}

.admin-sidebar__branch-cell-main .admin-sidebar__item--branch-main:hover {
  background: transparent;
}

.admin-sidebar__branch-cell-main .admin-sidebar__item--branch-main.admin-sidebar__item--active:hover {
  background: transparent;
}

.admin-sidebar__item--branch-main {
  width: 100%;
  min-width: 0;
  margin: 0;
}

.admin-sidebar__branch-toggle {
  flex: 0 0 28px;
  width: 28px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  box-sizing: border-box;
  background: transparent;
  color: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  /** 去掉 UA 给 button 的额外内边距，使整行高度与左侧 .admin-sidebar__item 一致 */
  appearance: none;
  -webkit-appearance: none;
  font-size: 0;
  line-height: 0;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.admin-sidebar__branch-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.55);
}

.admin-sidebar__branch-toggle:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0;
}

.admin-sidebar__branch-toggle-ico {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.admin-sidebar__list--branch {
  margin: 0;
  padding: 0;
}

/** 扫雷下三级：无图标；与 Paper 条目同字号；左缘与二级文案对齐 */
.admin-sidebar__item--branch-child {
  gap: 0;
  justify-content: flex-start;
  min-height: 28px;
  padding: 5px 8px 5px calc(8px + 20px + 6px);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
}

.admin-sidebar__item--branch-child:hover {
  color: rgba(0, 0, 0, 0.55);
}

.admin-sidebar__item--branch-child.admin-sidebar__item--active {
  font-size: 15px;
  font-weight: 500;
  color: #040404;
}

.admin-sidebar__item--branch-child.admin-sidebar__item--active:hover {
  color: #040404;
}

.admin-sidebar__item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin: 0 0 4px;
  min-height: 28px;
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  box-sizing: border-box;
  background: transparent;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.4);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.admin-sidebar__item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.55);
}

.admin-sidebar__item--active:hover {
  color: #040404;
  background: rgba(0, 0, 0, 0.04);
}

.admin-sidebar__item--active:hover .admin-sidebar__item-ico {
  color: #040404;
}

.admin-sidebar__item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__item--active {
  background: transparent;
  color: #040404;
  font-weight: 500;
}

.admin-sidebar__item--active .admin-sidebar__item-ico {
  color: #040404;
}

.admin-sidebar__item-ico {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: rgba(0, 0, 0, 0.4);
}

/** 收起侧栏：三级无业务图标，用圆点占位保持可点区域 */
.admin-sidebar__item-leaf-dot {
  width: 8px;
  height: 8px;
  margin: 0 6px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.admin-sidebar__item--active .admin-sidebar__item-leaf-dot {
  background: #040404;
}

.admin-sidebar__item:hover .admin-sidebar__item-ico {
  color: rgba(0, 0, 0, 0.55);
}

.admin-sidebar__item-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/** 分组内第三级：与 Paper 条目同尺度，仅内缩区分层级 */
.admin-sidebar__item--sub {
  padding: 5px 8px 5px 28px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.4);
}

.admin-sidebar__item--sub .admin-sidebar__item-ico {
  width: 20px;
  height: 20px;
  opacity: 1;
}

.admin-sidebar__item--sub:hover {
  color: rgba(0, 0, 0, 0.55);
}

.admin-sidebar__item--sub.admin-sidebar__item--active {
  font-size: 15px;
  font-weight: 500;
  color: #040404;
}

.admin-sidebar__item--sub.admin-sidebar__item--active .admin-sidebar__item-ico {
  color: #040404;
  opacity: 1;
}

.admin-sidebar__item--sub.admin-sidebar__item--active:hover {
  color: #040404;
}

.admin-sidebar__account {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-sidebar__account-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: default;
}

.admin-sidebar__account-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
}

.admin-sidebar__account-avatar-icon {
  width: 20px;
  height: 20px;
}

.admin-sidebar__account-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-sidebar__account-name {
  font-size: 14px;
  font-weight: 600;
  color: #040404;
  letter-spacing: -0.02em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-sidebar__account-meta {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.4);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-sidebar__account-chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: rgba(0, 0, 0, 0.35);
  transform: rotate(-90deg);
}

.admin-sidebar__account-logout {
  align-self: stretch;
  margin: 0;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.admin-sidebar__account-logout-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.9;
}

.admin-sidebar__account-logout-text {
  white-space: nowrap;
}

.admin-sidebar__account-logout:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #040404;
}

.admin-sidebar__account-logout:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background-color: var(--admin-canvas);
}

.admin-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: var(--admin-main-pad-top) max(var(--admin-inline-gutter), env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(var(--admin-inline-gutter), env(safe-area-inset-left));
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: var(--admin-canvas);
}

/** 单页根节点铺满主区高度，子页内再各自 overflow（如教学页双栏） */
.admin-main > *:only-child {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  align-self: stretch;
}

/* 收起：仅保留图标与必要控件 */
.admin-shell--sidebar-collapsed .admin-sidebar {
  border-right: 1px solid #e8ecf1;
}

/* 收起时仅收宽度，纵向与展开态同一套留白，避免整体高度/Y 向错位 */
.admin-shell--sidebar-collapsed .admin-sidebar__inner {
  padding: 20px 8px 24px;
  border-right: none;
}

.admin-shell--sidebar-collapsed .admin-sidebar__brand {
  padding: 4px 0 20px;
  margin-bottom: 0;
  display: flex;
  justify-content: center;
}

.admin-shell--sidebar-collapsed .admin-sidebar__logo {
  height: 28px;
  max-width: 44px;
  margin: 0 auto;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group + .admin-sidebar__group {
  margin-top: 40px;
  padding-top: 0;
  border-top: none;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group + .admin-sidebar__group::before {
  display: none;
}

/* 保留首个分组标题占位；第二组见下条 */
.admin-shell--sidebar-collapsed .admin-sidebar__group-title--toggle {
  position: static;
  opacity: 0;
  pointer-events: none;
  margin: 0 0 4px;
  width: auto;
  height: auto;
  padding: 0;
  overflow: hidden;
  clip: auto;
  white-space: nowrap;
  border: 0;
}

/* 收起：「平台配置」标题不占高，菜单管理 / 组织管理 与标题行 Y 向对齐 */
.admin-shell--sidebar-collapsed
  .admin-sidebar__group
  + .admin-sidebar__group
  .admin-sidebar__group-title--toggle {
  margin: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  font-size: 0;
  line-height: 0;
  padding: 0;
  width: 0;
  white-space: nowrap;
}

.admin-shell--sidebar-collapsed .admin-sidebar__list {
  padding: 0;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group + .admin-sidebar__group .admin-sidebar__list {
  margin-top: -4px;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item {
  justify-content: center;
  padding: 5px 8px;
  gap: 0;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item--sub {
  padding: 5px 8px;
  font-size: inherit;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item--sub .admin-sidebar__item-ico {
  width: 20px;
  height: 20px;
  opacity: 1;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item-text {
  display: none;
}

.admin-shell--sidebar-collapsed .admin-sidebar__account-card {
  justify-content: center;
  padding: 12px;
  gap: 0;
  min-height: 64px;
  box-sizing: border-box;
}

.admin-shell--sidebar-collapsed .admin-sidebar__account-text,
.admin-shell--sidebar-collapsed .admin-sidebar__account-chevron {
  visibility: hidden;
  width: 0;
  flex: 0 0 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.admin-shell--sidebar-collapsed .admin-sidebar__account-avatar {
  margin: 0;
}

.admin-shell--sidebar-collapsed .admin-sidebar__account-logout {
  padding: 8px 12px;
  min-height: 36px;
  box-sizing: border-box;
}

.admin-shell--sidebar-collapsed .admin-sidebar__account-logout-text {
  display: none;
}

@media (max-width: 720px) {
  .admin-shell {
    --admin-inline-gutter: 16px;
  }

  .admin-sidebar__inner {
    padding: 16px 12px 20px;
  }

  .admin-header {
    flex-wrap: wrap;
    height: auto;
    min-height: var(--header-h);
    row-gap: 6px;
    padding-block: 8px;
  }

  .admin-header__nav-panel {
    flex: 1 1 100%;
    order: 3;
    padding-block: 4px 6px;
  }

  .admin-header__tool-text {
    display: none;
  }

  .admin-header__tool {
    padding: 8px;
    min-width: 36px;
  }
}
</style>
