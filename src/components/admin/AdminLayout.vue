<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import logoUrl from '../../assets/logo.png'
import logoNorUrl from '../../assets/logo_nor.png'

const props = defineProps<{
  /** 当前选中的顶部业务模块 Tab（与 App.vue 同步） */
  activeTopNav: string
}>()

const emit = defineEmits<{
  logout: []
  /** 侧栏菜单文案，用于主区切换页面 */
  'sidebar-nav': [label: string]
  /** 顶部业务模块切换 */
  'top-nav': [label: string]
}>()

/** 小于此宽度时侧栏固定为仅图标（与点击收起一致） */
const SIDEBAR_AUTO_COLLAPSE_MQ = '(max-width: 1024px)'

const isNarrowViewport = ref(false)
let narrowMql: MediaQueryList | null = null

const accountMenuOpen = ref(false)
const accountMenuRootRef = ref<HTMLElement | null>(null)
const accountMenuTriggerRef = ref<HTMLElement | null>(null)
const accountMenuPosition = ref({ top: 0, left: 0 })

function syncNarrow() {
  isNarrowViewport.value = narrowMql?.matches ?? false
}

function onAccountDocClick(e: MouseEvent) {
  if (!accountMenuOpen.value) return
  const t = e.target
  if (!(t instanceof Node)) return
  if (accountMenuRootRef.value?.contains(t)) return
  const menu = document.getElementById('admin-header-account-menu')
  if (menu?.contains(t)) return
  accountMenuOpen.value = false
}

function onAccountMenuEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') accountMenuOpen.value = false
}

onMounted(() => {
  narrowMql = window.matchMedia(SIDEBAR_AUTO_COLLAPSE_MQ)
  syncNarrow()
  narrowMql.addEventListener('change', syncNarrow)
  document.addEventListener('click', onAccountDocClick, true)
  document.addEventListener('keydown', onAccountMenuEscape)
})

function updateAccountMenuPosition() {
  const el = accountMenuTriggerRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const mw = 288
  let left = r.right - mw
  left = Math.max(8, Math.min(left, window.innerWidth - mw - 8))
  accountMenuPosition.value = {
    top: Math.round(r.bottom + 6),
    left: Math.round(left),
  }
}

function onAccountMenuScrollClose() {
  if (accountMenuOpen.value) accountMenuOpen.value = false
}

watch(accountMenuOpen, (open) => {
  if (open) {
    window.addEventListener('scroll', onAccountMenuScrollClose, true)
    window.addEventListener('resize', updateAccountMenuPosition)
  } else {
    window.removeEventListener('scroll', onAccountMenuScrollClose, true)
    window.removeEventListener('resize', updateAccountMenuPosition)
  }
})

onUnmounted(() => {
  narrowMql?.removeEventListener('change', syncNarrow)
  document.removeEventListener('click', onAccountDocClick, true)
  document.removeEventListener('keydown', onAccountMenuEscape)
  window.removeEventListener('scroll', onAccountMenuScrollClose, true)
  window.removeEventListener('resize', updateAccountMenuPosition)
})

/** 宽屏下用户手动收起；窄屏时由 isNarrowViewport 强制等同收起 */
const userCollapsed = ref(false)
const isSidebarCollapsed = computed(
  () => isNarrowViewport.value || userCollapsed.value,
)

function toggleSidebarCollapse() {
  if (isNarrowViewport.value) return
  userCollapsed.value = !userCollapsed.value
}

/** 教学页通栏等子组件内收起/展开全局侧栏 */
provide('adminSidebarApi', {
  toggle: toggleSidebarCollapse,
  isNarrow: isNarrowViewport,
  isCollapsed: isSidebarCollapsed,
})

/** 暂时隐藏顶部「消息」入口，需要时改为 true */
const showHeaderMessageBtn = false

const sidebarLogoSrc = computed(() =>
  isSidebarCollapsed.value ? logoNorUrl : logoUrl,
)

const topNavLabels = ['教学', '教务', '运营', '电商', '系统'] as const

const sidebarGroupsSource = [
  {
    title: '用户管理',
    items: [
      { label: '账号管理', icon: 'lucide:circle-user' },
      { label: '角色管理', icon: 'lucide:shield-check' },
    ],
  },
  {
    title: '平台配置',
    items: [
      { label: '菜单管理', icon: 'lucide:square-menu' },
      { label: '组织管理', icon: 'lucide:users-round' },
    ],
  },
] as const

type TeachingSidebarLeaf = { label: string; icon: string }
type TeachingSidebarEntry = TeachingSidebarLeaf | (TeachingSidebarLeaf & { children: TeachingSidebarLeaf[] })

/** 教学 Tab：与 Paper「demo」画板 1:1；扫雷管理含二级菜单 */
const teachingSidebarGroupsSource: { title: string; items: TeachingSidebarEntry[] }[] = [
  {
    title: '题库管理',
    items: [
      { label: '题库搜索', icon: 'lucide:search' },
      {
        label: '扫雷管理',
        icon: 'lucide:scan-search',
        children: [
          { label: '规则配置', icon: 'lucide:clipboard-list' },
          { label: '场次管理', icon: 'lucide:calendar-range' },
          { label: '数据报表', icon: 'lucide:chart-column' },
        ],
      },
    ],
  },
  {
    title: '课程管理',
    items: [
      { label: '课程列表', icon: 'lucide:layout-list' },
      { label: '课表编排', icon: 'lucide:calendar-range' },
      { label: '授课班级', icon: 'lucide:school' },
    ],
  },
  {
    title: '配置中心',
    items: [
      { label: '学科管理', icon: 'lucide:library' },
      { label: '年级学制', icon: 'lucide:layers' },
      { label: '系统参数', icon: 'lucide:sliders-horizontal' },
    ],
  },
]

const TEACHING_SIDEBAR_LABELS: Set<string> = new Set(
  teachingSidebarGroupsSource.flatMap((g) =>
    g.items.flatMap((i) => ('children' in i && i.children ? i.children.map((c) => c.label) : [i.label])),
  ),
)

const activeSidebarLabel = ref('组织管理')

type SidebarListItem =
  | { label: string; icon: string; active: boolean; children?: undefined }
  | {
      label: string
      icon: string
      children: { label: string; icon: string; active: boolean }[]
      active?: undefined
    }

const sidebarGroups = computed((): { title: string; items: SidebarListItem[] }[] => {
  const src = props.activeTopNav === '教学' ? teachingSidebarGroupsSource : sidebarGroupsSource
  return src.map((group) => ({
    title: group.title,
    items: group.items.map((item): SidebarListItem => {
      if ('children' in item && item.children) {
        return {
          label: item.label,
          icon: item.icon,
          children: item.children.map((c) => ({
            ...c,
            active: c.label === activeSidebarLabel.value,
          })),
        }
      }
      return {
        label: item.label,
        icon: item.icon,
        active: item.label === activeSidebarLabel.value,
      }
    }),
  }))
})

watch(
  () => props.activeTopNav,
  (nav) => {
    if (nav === '教学') {
      activeSidebarLabel.value = '题库搜索'
      emit('sidebar-nav', '题库搜索')
    } else if (TEACHING_SIDEBAR_LABELS.has(activeSidebarLabel.value)) {
      activeSidebarLabel.value = '组织管理'
      emit('sidebar-nav', '组织管理')
    }
  },
  { immediate: true },
)

function onSidebarItemClick(label: string) {
  activeSidebarLabel.value = label
  emit('sidebar-nav', label)
}

/** 扫雷管理等二级分组：true 表示展开；缺省为展开 */
const teachingSubExpanded = ref<Record<string, boolean>>({})

function isTeachingSubExpanded(parentLabel: string): boolean {
  return teachingSubExpanded.value[parentLabel] !== false
}

function showTeachingSublist(parentLabel: string): boolean {
  if (isSidebarCollapsed.value) return false
  return isTeachingSubExpanded(parentLabel)
}

function onTeachingParentClick(parentLabel: string) {
  if (isSidebarCollapsed.value) return
  const cur = isTeachingSubExpanded(parentLabel)
  teachingSubExpanded.value = { ...teachingSubExpanded.value, [parentLabel]: !cur }
}

function toggleAccountMenu() {
  accountMenuOpen.value = !accountMenuOpen.value
  if (accountMenuOpen.value) {
    void nextTick(() => updateAccountMenuPosition())
  }
}

function onAccountMenuLogout() {
  accountMenuOpen.value = false
  emit('logout')
}
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--sidebar-collapsed': isSidebarCollapsed }">
    <aside id="admin-sidebar-nav" class="admin-sidebar" aria-label="侧栏导航">
      <button
        v-if="!isNarrowViewport"
        type="button"
        class="admin-sidebar__edge-toggle"
        :class="{ 'admin-sidebar__edge-toggle--collapsed': isSidebarCollapsed }"
        :aria-expanded="!isSidebarCollapsed"
        :aria-label="isSidebarCollapsed ? '展开侧栏' : '收起侧栏'"
        aria-controls="admin-sidebar-nav"
        :title="isSidebarCollapsed ? '展开侧栏' : '收起侧栏'"
        @click="toggleSidebarCollapse"
      >
        <svg
          class="admin-sidebar__edge-toggle-tri"
          width="7.56"
          height="9.72"
          viewBox="0 0 9 11"
          aria-hidden="true"
        >
          <path
            d="M6.343 2.342 A2 2 0 0 1 7.25 2.833 L7.25 8.167 A2 2 0 0 1 6.343 8.658 L2.593 6.213 A2 2 0 0 1 2.593 4.787 L6.343 2.342 Z"
            fill="#4e5969"
          />
        </svg>
      </button>
      <div class="admin-sidebar__inner">
        <div class="admin-sidebar__brand">
          <img
            :src="sidebarLogoSrc"
            alt="想象力智能中高考"
            class="admin-sidebar__logo"
            width="184"
            height="32"
            decoding="async"
          />
        </div>

        <div class="admin-sidebar__scroll">
          <div v-for="(group, gi) in sidebarGroups" :key="gi" class="admin-sidebar__group">
            <div class="admin-sidebar__group-title">
              {{ group.title }}
            </div>
            <ul class="admin-sidebar__list">
              <template v-for="(item, ii) in group.items" :key="`${item.label}-${ii}`">
                <li v-if="item.children?.length" class="admin-sidebar__nest">
                  <button
                    type="button"
                    class="admin-sidebar__item admin-sidebar__item--parent"
                    :class="{
                      'admin-sidebar__item--active-parent':
                        item.children.some((c) => c.active) && !isSidebarCollapsed,
                      'admin-sidebar__item--active':
                        isSidebarCollapsed && item.children.some((c) => c.active),
                    }"
                    :aria-expanded="showTeachingSublist(item.label)"
                    :title="item.label"
                    @click="onTeachingParentClick(item.label)"
                  >
                    <Icon :icon="item.icon" class="admin-sidebar__item-ico" aria-hidden="true" />
                    <span class="admin-sidebar__item-text">{{ item.label }}</span>
                    <Icon
                      v-if="!isSidebarCollapsed"
                      icon="lucide:chevron-down"
                      class="admin-sidebar__item-parent-chev"
                      :class="{ 'admin-sidebar__item-parent-chev--expanded': isTeachingSubExpanded(item.label) }"
                      aria-hidden="true"
                    />
                  </button>
                  <ul
                    v-show="showTeachingSublist(item.label)"
                    class="admin-sidebar__sublist"
                    role="group"
                    :aria-label="`${item.label}子菜单`"
                  >
                    <li v-for="child in item.children" :key="child.label" class="admin-sidebar__sublist-item">
                      <button
                        type="button"
                        class="admin-sidebar__item admin-sidebar__item--sub"
                        :class="{ 'admin-sidebar__item--active': child.active }"
                        :title="child.label"
                        @click="onSidebarItemClick(child.label)"
                      >
                        <span class="admin-sidebar__item-text">{{ child.label }}</span>
                      </button>
                    </li>
                  </ul>
                </li>
                <li v-else class="admin-sidebar__nest">
                  <button
                    type="button"
                    class="admin-sidebar__item"
                    :class="{ 'admin-sidebar__item--active': item.active }"
                    :title="item.label"
                    @click="onSidebarItemClick(item.label)"
                  >
                    <Icon :icon="item.icon" class="admin-sidebar__item-ico" aria-hidden="true" />
                    <span class="admin-sidebar__item-text">
                      {{ item.label }}
                    </span>
                  </button>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </div>
    </aside>

    <div class="admin-body">
      <header class="admin-header">
        <div class="admin-header__left">
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
        <div class="admin-header__right">
          <button
            v-if="showHeaderMessageBtn"
            type="button"
            class="admin-header__icon-btn"
            aria-label="消息"
          >
            <Icon icon="lucide:message-circle" class="admin-header__icon" />
          </button>
          <button type="button" class="admin-header__icon-btn" aria-label="通知">
            <Icon icon="lucide:bell" class="admin-header__icon" />
            <span class="admin-header__badge">23</span>
          </button>
          <div
            ref="accountMenuRootRef"
            class="admin-header__account"
            :class="{ 'admin-header__account--open': accountMenuOpen }"
          >
            <button
              id="admin-header-account-trigger"
              ref="accountMenuTriggerRef"
              type="button"
              class="admin-header__account-trigger"
              :class="{ 'admin-header__account-trigger--open': accountMenuOpen }"
              aria-label="打开账号菜单（刘飞）"
              :aria-expanded="accountMenuOpen"
              aria-haspopup="menu"
              aria-controls="admin-header-account-menu"
              @click="toggleAccountMenu"
            >
              <span class="admin-header__account-avatar" aria-hidden="true">
                <Icon icon="lucide:user" class="admin-header__account-avatar-icon" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <Teleport to="body">
        <div
          v-show="accountMenuOpen"
          id="admin-header-account-menu"
          class="admin-header__account-menu"
          role="menu"
          aria-label="账号菜单"
          :style="{
            position: 'fixed',
            top: `${accountMenuPosition.top}px`,
            left: `${accountMenuPosition.left}px`,
            zIndex: 4000,
          }"
        >
          <div class="admin-header__account-menu-profile" role="group" aria-label="当前账号">
            <span class="admin-header__account-menu-profile-avatar" aria-hidden="true">
              <Icon icon="lucide:user" class="admin-header__account-menu-profile-ico" />
            </span>
            <div class="admin-header__account-menu-profile-text">
              <span id="admin-header-account-profile-name" class="admin-header__account-menu-profile-name">
                刘飞
              </span>
              <span class="admin-header__account-menu-profile-meta">管理员 · imagination.cn</span>
            </div>
            <Icon
              icon="lucide:check"
              class="admin-header__account-menu-profile-check"
              aria-hidden="true"
            />
          </div>
          <button
            type="button"
            class="admin-header__account-menu-item admin-header__account-menu-item--logout"
            role="menuitem"
            @click="onAccountMenuLogout"
          >
            <Icon icon="lucide:log-out" class="admin-header__account-menu-ico" aria-hidden="true" />
            退出登录
          </button>
        </div>
      </Teleport>

      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  --header-h: 64px;
  /* Paper「demo」画板宽度 220px */
  --sidebar-w-expanded: 220px;
  --sidebar-w-collapsed: 72px;
  --sidebar-w: var(--sidebar-w-expanded);
  /** 主区（顶栏 + main）左右对称留白，中间内容随宽度拉伸 */
  --admin-inline-gutter: 32px;
  --admin-canvas: #fefefe;
  font-family: var(--font-sans);
  color: var(--color-text);
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: #fff;
}

.admin-shell--sidebar-collapsed {
  --sidebar-w: var(--sidebar-w-collapsed);
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  height: var(--header-h);
  padding: 0 max(var(--admin-inline-gutter), env(safe-area-inset-right)) 0
    max(var(--admin-inline-gutter), env(safe-area-inset-left));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background-color: var(--admin-canvas);
  background-image: none;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  color: var(--color-text-strong);
}

.admin-header__left {
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vw, 40px);
  min-width: 0;
}

.admin-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
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
  padding: 9px 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-strong);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s ease, background 0.2s ease;
}

.admin-header__nav-text {
  letter-spacing: -0.01em;
}

.admin-header__nav-chevron {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 1;
  color: inherit;
}

.admin-header__nav-item:hover {
  background: rgba(15, 23, 42, 0.05);
}

.admin-header__nav-item--active {
  background: rgba(15, 23, 42, 0.07);
  font-weight: 600;
}

.admin-header__nav-item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}

.admin-header__icon-btn {
  position: relative;
  margin: 0;
  padding: 10px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.admin-header__icon-btn:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

.admin-header__icon-btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-header__icon {
  display: block;
  width: 20px;
  height: 20px;
}

.admin-header__badge {
  position: absolute;
  top: 6px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 6px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

.admin-header__account {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 0;
}

.admin-header__account--open {
  z-index: 200;
}

.admin-header__account-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 2px;
  border: none;
  border-radius: 50%;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}

.admin-header__account-trigger:hover {
  background: rgba(15, 23, 42, 0.06);
}

.admin-header__account-trigger:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-header__account-trigger--open {
  background: rgba(15, 23, 42, 0.06);
}

.admin-header__account-menu {
  min-width: 288px;
  padding: 8px;
  margin: 0;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  box-shadow:
    0 4px 24px rgba(15, 23, 42, 0.1),
    0 1px 3px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.admin-header__account-menu-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  margin-bottom: 6px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.05);
}

.admin-header__account-menu-profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.08);
  color: #475569;
}

.admin-header__account-menu-profile-ico {
  width: 20px;
  height: 20px;
}

.admin-header__account-menu-profile-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.admin-header__account-menu-profile-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-header__account-menu-profile-meta {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-header__account-menu-profile-check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #22c55e;
}

.admin-header__account-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.admin-header__account-menu-item:hover {
  background: rgba(15, 23, 42, 0.05);
}

.admin-header__account-menu-item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0;
}

.admin-header__account-menu-item--logout {
  color: #dc2626;
}

.admin-header__account-menu-item--logout .admin-header__account-menu-ico {
  color: #dc2626;
  opacity: 1;
}

.admin-header__account-menu-item--logout:hover {
  background: rgba(220, 38, 38, 0.08);
}

.admin-header__account-menu-item--logout:focus-visible {
  outline-color: #dc2626;
}

.admin-header__account-menu-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.88;
  color: #475569;
}

.admin-header__account-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
}

.admin-header__account-avatar-icon {
  width: 18px;
  height: 18px;
}

.admin-sidebar {
  position: relative;
  z-index: 40;
  flex: 0 0 var(--sidebar-w);
  width: var(--sidebar-w);
  box-sizing: border-box;
  align-self: stretch;
  min-height: 100vh;
  min-height: 100dvh;
  padding-left: max(0px, env(safe-area-inset-left));
  transition:
    flex-basis 0.28s ease,
    width 0.28s ease;
}

/**
 * 侧栏内侧折叠把手：无描边、无阴影；底色固定 #EAEBEE（无 hover 变化）；16×46；全圆角胶囊；三角 SVG
 */
.admin-sidebar__edge-toggle {
  position: absolute;
  top: 50%;
  right: 4px;
  z-index: 45;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 46px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: #eaebee;
  box-shadow: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.admin-sidebar__edge-toggle:hover,
.admin-sidebar__edge-toggle:active {
  background: #eaebee;
}

.admin-sidebar__edge-toggle:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__edge-toggle-tri {
  display: block;
  flex-shrink: 0;
}

/** 收起态：三角指向右（展开） */
.admin-sidebar__edge-toggle--collapsed .admin-sidebar__edge-toggle-tri {
  transform: scaleX(-1);
}

/* 顶浅蓝灰 → 底白（云文件侧栏参考） */
.admin-sidebar__inner {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 0 16px;
  transition: padding 0.28s ease;
  background: linear-gradient(180deg, #e8eef5 0%, #f0f3f8 38%, #fafbfc 72%, #ffffff 100%);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  font-size: 12px;
  line-height: 16px;
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.admin-sidebar__brand {
  flex-shrink: 0;
  padding: 34px 20px 16px;
  margin: 0;
  box-sizing: border-box;
}

.admin-sidebar__logo {
  height: calc(31px * 1.02);
  width: auto;
  max-width: calc(180px * 1.02);
  object-fit: contain;
  object-position: left center;
  display: block;
}

.admin-sidebar__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.admin-sidebar__group {
  margin: 0 20px;
  padding-top: 17px;
  border-top: 1px solid rgba(0, 0, 0, 0.031);
  box-sizing: border-box;
}

.admin-sidebar__group:first-child {
  border-top: none;
  padding-top: 17px;
}

/** 每组底部与下一组顶部分割线之间的额外间距 */
.admin-sidebar__group:not(:last-child) {
  margin-bottom: 8px;
}

.admin-sidebar__group-title {
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: normal;
  color: #86909c;
  margin: 0 0 4px 14px;
  transition:
    opacity 0.2s ease,
    height 0.2s ease,
    margin 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.admin-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-sidebar__item {
  position: relative;
  z-index: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  min-height: 40px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: normal;
  color: #4e5969;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  box-shadow: none;
  filter: none;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.admin-sidebar__item > * {
  position: relative;
  z-index: 1;
}

.admin-sidebar__item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.78);
}

.admin-sidebar__item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/** 选中项：白底；图标与文案使用设计主题色（--color-primary）；无投影 */
.admin-sidebar__item--active {
  background: #ffffff;
  color: var(--color-primary);
  font-weight: 400;
  box-shadow: none;
  filter: none;
}

.admin-sidebar__item--active:hover {
  background: #ffffff;
  color: var(--color-primary);
  box-shadow: none;
  filter: none;
}

.admin-sidebar__item:active,
.admin-sidebar__item--active:active {
  box-shadow: none;
  filter: none;
}

/**
 * 细线描边图标：在 14.4px 基础上再 ×0.95；stroke 约 1px 量级（Lucide 在 24 视图下用 1.15）
 */
.admin-sidebar__item-ico {
  flex-shrink: 0;
  width: 20.52px;
  height: 20.52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4e5969;
}

.admin-sidebar__item-ico :deep(svg) {
  width: 13.68px !important;
  height: 13.68px !important;
  min-width: 13.68px;
  min-height: 13.68px;
  display: block;
  flex-shrink: 0;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.15;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.admin-sidebar__item-ico :deep(path),
.admin-sidebar__item-ico :deep(circle),
.admin-sidebar__item-ico :deep(line),
.admin-sidebar__item-ico :deep(polyline),
.admin-sidebar__item-ico :deep(rect) {
  stroke: currentColor;
  stroke-width: 1.15;
}

.admin-sidebar__item-ico :deep(path[fill='currentColor']),
.admin-sidebar__item-ico :deep(circle[fill='currentColor']) {
  fill: currentColor;
  stroke: none;
}

.admin-sidebar__item:hover .admin-sidebar__item-ico {
  color: rgba(0, 0, 0, 0.78);
}

.admin-sidebar__item--active:hover .admin-sidebar__item-ico,
.admin-sidebar__item--active .admin-sidebar__item-ico {
  color: var(--color-primary);
}

.admin-sidebar__item-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: inherit;
  font-size: 13px;
  line-height: 38px;
}

.admin-sidebar__nest {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-sidebar__item--parent {
  width: 100%;
}

.admin-sidebar__item-parent-chev {
  margin-left: auto;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /** 与 teach-page__ctx-ico 同尺寸；略深于 60% 混色；整体靠侧栏右缘 6px */
  color: color-mix(in srgb, #4e5969 68%, white);
  transform: translateX(6px);
  transition: transform 0.2s ease;
}

.admin-sidebar__item-parent-chev :deep(svg) {
  width: 18px !important;
  height: 18px !important;
  min-width: 18px;
  min-height: 18px;
  display: block;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.15;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.admin-sidebar__item-parent-chev :deep(path),
.admin-sidebar__item-parent-chev :deep(line),
.admin-sidebar__item-parent-chev :deep(polyline),
.admin-sidebar__item-parent-chev :deep(rect),
.admin-sidebar__item-parent-chev :deep(circle) {
  stroke: currentColor;
  stroke-width: 1.15;
}

.admin-sidebar__item:hover .admin-sidebar__item-parent-chev {
  color: color-mix(in srgb, rgba(0, 0, 0, 0.78) 68%, white);
}

.admin-sidebar__item--active-parent .admin-sidebar__item-parent-chev,
.admin-sidebar__item--active-parent:hover .admin-sidebar__item-parent-chev {
  color: color-mix(in srgb, rgba(0, 0, 0, 0.78) 68%, white);
}

.admin-sidebar__item--active .admin-sidebar__item-parent-chev,
.admin-sidebar__item--active:hover .admin-sidebar__item-parent-chev {
  color: color-mix(in srgb, var(--color-primary) 68%, white);
}

/** 默认朝下；展开子菜单时旋转为朝上（保留右移 6px） */
.admin-sidebar__item-parent-chev--expanded {
  transform: translateX(6px) rotate(180deg);
}

.admin-sidebar__item--active-parent {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.78);
}

.admin-sidebar__item--active-parent:hover {
  background: rgba(0, 0, 0, 0.05);
}

.admin-sidebar__sublist {
  list-style: none;
  margin: 0 0 2px;
  padding: 2px 0 0;
  /** 不在此缩进容器，子项按钮与一级同宽；缩进由 .admin-sidebar__item--sub 的 padding-left 承担 */
  padding-left: 0;
  margin-left: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.admin-sidebar__sublist-item {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-sidebar__item--sub {
  font-size: 13px;
  font-weight: 400;
  color: #4e5969;
  /** 与一级 12px padding + 20.52px 图标槽 + 10px gap 对齐 */
  padding-left: 42.52px;
  gap: 0;
}

.admin-sidebar__item--sub.admin-sidebar__item--active {
  color: var(--color-primary);
  font-weight: 400;
}

.admin-shell--sidebar-collapsed .admin-sidebar__sublist {
  margin-left: 0;
  padding-left: 0;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item--sub {
  font-size: inherit;
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
  padding: 20px max(var(--admin-inline-gutter), env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(var(--admin-inline-gutter), env(safe-area-inset-left));
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: var(--admin-canvas);
}

/**
 * 学案页：左侧 teach-aside 需与 main 边框盒底对齐；默认 24px 底内边距会使整块主区内容整体上移，
 * 侧栏比 main 底缘短一截。此处仅保留 safe-area，底部留白由 teach-panel 等子块 padding 承担。
 */
.admin-main:has(.teach-page) {
  padding-bottom: max(0px, env(safe-area-inset-bottom));
}

/* 收起：仅保留图标与必要控件 */
.admin-shell--sidebar-collapsed .admin-sidebar {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

/* 收起时仅收宽度，纵向与展开态同一套留白，避免整体高度/Y 向错位 */
.admin-shell--sidebar-collapsed .admin-sidebar__inner {
  padding: 0 0 16px;
  border-right: none;
  overflow-x: hidden;
  background: linear-gradient(180deg, #e8eef5 0%, #f0f3f8 38%, #fafbfc 72%, #ffffff 100%);
}

.admin-shell--sidebar-collapsed .admin-sidebar__brand {
  padding: 22px 8px 12px;
  margin: 0;
  display: flex;
  justify-content: center;
}

.admin-shell--sidebar-collapsed .admin-sidebar__logo {
  height: calc(28px * 1.02);
  max-width: calc(44px * 1.02);
  margin: 0 auto;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group {
  margin: 0 8px;
  padding-top: 12px;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group:not(:last-child) {
  margin-bottom: 8px;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group:first-child {
  padding-top: 12px;
}

/* 保留首个分组标题占位；第二组见下条 */
.admin-shell--sidebar-collapsed .admin-sidebar__group-title {
  position: static;
  opacity: 0;
  pointer-events: none;
  margin: 0 10px 12px;
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
  .admin-sidebar__group-title {
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

.admin-shell--sidebar-collapsed .admin-sidebar__group + .admin-sidebar__group .admin-sidebar__list {
  margin-top: -6px;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item {
  justify-content: center;
  padding: 0 10px;
  min-height: 40px;
  gap: 0;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item-text {
  display: none;
}

@media (max-width: 720px) {
  .admin-shell {
    --admin-inline-gutter: 16px;
  }

  .admin-sidebar__inner {
    padding: 0 0 16px;
  }

  .admin-sidebar__group {
    margin-left: 16px;
    margin-right: 16px;
  }

  .admin-header {
    flex-wrap: wrap;
    height: auto;
    min-height: var(--header-h);
    padding-top: 10px;
    padding-bottom: 10px;
  }
}
</style>
