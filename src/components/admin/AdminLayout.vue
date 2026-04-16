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

/** 教学 Tab：侧栏入口（主区由 App.vue 固定为 TeachingPage） */
const teachingSidebarGroupsSource: { title: string; items: TeachingSidebarEntry[] }[] = [
  {
    title: '题库管理',
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
      activeSidebarLabel.value = '学案题库'
      emit('sidebar-nav', '学案题库')
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

        <div class="admin-sidebar__footer">
          <button
            type="button"
            class="admin-sidebar__collapse-btn"
            :aria-expanded="isNarrowViewport ? undefined : !isSidebarCollapsed"
            :aria-label="
              isNarrowViewport
                ? '当前为窄屏，侧栏固定为图标模式'
                : isSidebarCollapsed
                  ? '展开侧栏'
                  : '收起侧栏'
            "
            aria-controls="admin-sidebar-nav"
            :disabled="isNarrowViewport"
            :title="isNarrowViewport ? '窄屏下侧栏固定为图标模式' : isSidebarCollapsed ? '展开侧栏' : '收起侧栏'"
            @click="toggleSidebarCollapse"
          >
            <Icon
              :icon="isSidebarCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'"
              class="admin-sidebar__collapse-btn-ico"
              aria-hidden="true"
            />
            <span v-if="!isSidebarCollapsed" class="admin-sidebar__collapse-btn-label">收起侧栏</span>
          </button>
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
  --sidebar-w-expanded: 244px;
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

/* 与历史侧栏底部「退出登录」按钮同款底色与字号；通栏宽度，图标与文案在按钮内居中 */
.admin-sidebar__footer {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 16px;
}

.admin-sidebar__collapse-btn {
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.05);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.admin-sidebar__collapse-btn:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.admin-sidebar__collapse-btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__collapse-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.admin-sidebar__collapse-btn-ico {
  width: calc(18px * 1.2 * 0.95);
  height: calc(18px * 1.2 * 0.95);
  flex-shrink: 0;
  opacity: 0.9;
}

.admin-sidebar__collapse-btn-label {
  white-space: nowrap;
}

.admin-shell--sidebar-collapsed .admin-sidebar__collapse-btn {
  padding: 8px 12px;
  min-height: 36px;
  box-sizing: border-box;
}

.admin-sidebar__inner {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 22px 16px 20px;
  transition: padding 0.28s ease;
  background:
    radial-gradient(120% 90% at 0% -8%, rgba(167, 139, 250, 0.2) 0%, transparent 52%),
    radial-gradient(100% 70% at 15% 0%, rgba(96, 165, 250, 0.16) 0%, transparent 48%),
    radial-gradient(80% 50% at 100% 20%, rgba(244, 114, 182, 0.08) 0%, transparent 45%),
    linear-gradient(180deg, #f8f9fc 0%, #f1f2f8 48%, #eceef5 100%);
  border-right: 1px solid #e8e8e8;
  box-sizing: border-box;
}

.admin-sidebar__brand {
  flex-shrink: 0;
  padding: 4px 4px 20px;
  margin-bottom: 4px;
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
  margin-top: 28px;
  padding-top: 20px;
  border-top: none;
  position: relative;
}

/* 与下方「平台配置」等分组标题同宽（.admin-sidebar__group-title 左右 10px margin） */
.admin-sidebar__group + .admin-sidebar__group::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  top: -10px;
  width: auto;
  height: 1px;
  background: rgba(15, 23, 42, 0.07);
  pointer-events: none;
}

.admin-sidebar__group-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #94a3b8;
  margin: 0 10px 12px;
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
}

.admin-sidebar__item {
  position: relative;
  z-index: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0 0 -2px;
  padding: 9px 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s ease,
    box-shadow 0.2s ease;
}

/** hover / 选中背景：比按钮块高度缩短 4px（上下各内收 2px），不改变 padding，行距与相邻项间距不变 */
.admin-sidebar__item::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 2px;
  bottom: 2px;
  border-radius: 10px;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.admin-sidebar__item > * {
  position: relative;
  z-index: 1;
}

.admin-sidebar__item:hover::before {
  opacity: 1;
  background: rgba(15, 23, 42, 0.05);
}

.admin-sidebar__item:hover {
  color: var(--color-text-strong);
}

.admin-sidebar__item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__item--active {
  color: #0f172a;
  font-weight: 600;
  box-shadow: none;
}

.admin-sidebar__item--active::before {
  opacity: 1;
  background: rgba(255, 255, 255, 0.72);
}

.admin-sidebar__item--active .admin-sidebar__item-ico {
  color: #0f172a;
}

.admin-sidebar__item-ico {
  flex-shrink: 0;
  width: calc(20px * 1.2 * 0.95);
  height: calc(20px * 1.2 * 0.95);
  color: #64748b;
}

.admin-sidebar__item:hover .admin-sidebar__item-ico {
  color: #0f172a;
}

.admin-sidebar__item-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  width: calc(16px * 1.2 * 0.95);
  height: calc(16px * 1.2 * 0.95);
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

/** 默认朝下；展开子菜单时旋转为朝上 */
.admin-sidebar__item-parent-chev--expanded {
  transform: rotate(180deg);
}

.admin-sidebar__item--active-parent::before {
  opacity: 1;
  background: rgba(15, 23, 42, 0.04);
}

.admin-sidebar__sublist {
  list-style: none;
  margin: 0 0 2px;
  padding: 4px 0 0;
  /** 不在此缩进容器，子项按钮与一级同宽；缩进由 .admin-sidebar__item--sub 的 padding-left 承担 */
  padding-left: 0;
  margin-left: 0;
}

.admin-sidebar__sublist-item {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-sidebar__item--sub {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  /** 无图标：左内边距 = 一级与 .admin-sidebar__item-ico + gap 同宽，文案与一级菜单文案左对齐 */
  padding-left: calc(14px + (20px * 1.2 * 0.95) + 12px);
  gap: 0;
}

/** 二级选中：文案与 .admin-sidebar__item--active .admin-sidebar__item-ico 同色（避免 --sub 的 color 覆盖选中态） */
.admin-sidebar__item--sub.admin-sidebar__item--active {
  color: #0f172a;
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
  border-right: 1px solid rgba(15, 23, 42, 0.08);
}

/* 收起时仅收宽度，纵向与展开态同一套留白，避免整体高度/Y 向错位 */
.admin-shell--sidebar-collapsed .admin-sidebar__inner {
  padding: 22px 8px 20px;
  border-right: none;
  /* 背景层按展开宽度绘制，窄栏水平居中裁剪，显示中间段、避免径向渐变被横向挤压 */
  overflow-x: hidden;
  background-size:
    var(--sidebar-w-expanded) 100%,
    var(--sidebar-w-expanded) 100%,
    var(--sidebar-w-expanded) 100%,
    100% 100%;
  background-position:
    center top,
    center top,
    center top,
    center top;
  background-repeat: no-repeat;
}

.admin-shell--sidebar-collapsed .admin-sidebar__brand {
  padding: 4px 4px 20px;
  margin-bottom: 4px;
  display: flex;
  justify-content: center;
}

.admin-shell--sidebar-collapsed .admin-sidebar__logo {
  height: 28px;
  max-width: 44px;
  margin: 0 auto;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group + .admin-sidebar__group {
  margin-top: 28px;
  padding-top: 20px;
  border-top: none;
}

.admin-shell--sidebar-collapsed .admin-sidebar__group + .admin-sidebar__group::before {
  /* 与标题区块 margin 规则一致，收起时仍对齐同一套版心 */
  left: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.08);
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
  padding: 9px 10px;
  gap: 0;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item-text {
  display: none;
}

/** 收起：默认图标 80% 不透明；hover / 选中 / 父级选中 / 键盘聚焦 保持原样（不透明） */
.admin-shell--sidebar-collapsed .admin-sidebar__item-ico {
  opacity: 0.8;
}

.admin-shell--sidebar-collapsed .admin-sidebar__item:hover:not(:disabled) .admin-sidebar__item-ico,
.admin-shell--sidebar-collapsed .admin-sidebar__item:focus-visible .admin-sidebar__item-ico,
.admin-shell--sidebar-collapsed .admin-sidebar__item--active .admin-sidebar__item-ico,
.admin-shell--sidebar-collapsed .admin-sidebar__item--active-parent .admin-sidebar__item-ico {
  opacity: 1;
}

.admin-shell--sidebar-collapsed .admin-sidebar__collapse-btn:not(:disabled) .admin-sidebar__collapse-btn-ico {
  opacity: 0.8;
}

.admin-shell--sidebar-collapsed .admin-sidebar__collapse-btn:hover:not(:disabled) .admin-sidebar__collapse-btn-ico {
  opacity: 1;
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
    padding-top: 10px;
    padding-bottom: 10px;
  }
}
</style>
