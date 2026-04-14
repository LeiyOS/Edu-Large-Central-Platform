<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import logoUrl from '../../assets/logo.png'
import logoNorUrl from '../../assets/logo_nor.png'

defineEmits<{
  logout: []
}>()

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

/** 宽屏下用户手动收起；窄屏时由 isNarrowViewport 强制等同收起 */
const userCollapsed = ref(false)
const isSidebarCollapsed = computed(
  () => isNarrowViewport.value || userCollapsed.value,
)

function toggleSidebarCollapse() {
  if (isNarrowViewport.value) return
  userCollapsed.value = !userCollapsed.value
}

/** 暂时隐藏顶部「消息」入口，需要时改为 true */
const showHeaderMessageBtn = false

const sidebarLogoSrc = computed(() =>
  isSidebarCollapsed.value ? logoNorUrl : logoUrl,
)

const topNav = [
  { label: '教学' },
  { label: '教务' },
  { label: '运营' },
  { label: '电商' },
  { label: '系统', active: true },
]

const sidebarGroups = [
  {
    title: '用户管理',
    items: [
      { label: '账号管理', icon: 'lucide:circle-user', active: true },
      { label: '角色管理', icon: 'lucide:shield-check', active: false },
    ],
  },
  {
    title: '平台配置',
    items: [
      { label: '菜单管理', icon: 'lucide:square-menu', active: false },
      { label: '组织管理', icon: 'lucide:users-round', active: false },
    ],
  },
]
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--sidebar-collapsed': isSidebarCollapsed }">
    <aside id="admin-sidebar-nav" class="admin-sidebar" aria-label="侧栏导航">
      <button
        type="button"
        class="admin-sidebar__collapse-fab"
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
          class="admin-sidebar__collapse-fab-icon"
          aria-hidden="true"
        />
      </button>
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
              <li v-for="(item, ii) in group.items" :key="ii">
                <button
                  type="button"
                  class="admin-sidebar__item"
                  :class="{ 'admin-sidebar__item--active': item.active }"
                  :title="item.label"
                >
                  <Icon :icon="item.icon" class="admin-sidebar__item-ico" aria-hidden="true" />
                  <span class="admin-sidebar__item-text">
                    {{ item.label }}
                  </span>
                </button>
              </li>
            </ul>
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
            @click="$emit('logout')"
          >
            <Icon icon="lucide:log-out" class="admin-sidebar__account-logout-ico" aria-hidden="true" />
            <span class="admin-sidebar__account-logout-text">退出登录</span>
          </button>
        </div>
      </div>
    </aside>

    <div class="admin-body">
      <header class="admin-header">
        <div class="admin-header__left">
          <nav class="admin-header__nav" aria-label="业务模块">
            <button
              v-for="(item, i) in topNav"
              :key="i"
              type="button"
              class="admin-header__nav-item"
              :class="{ 'admin-header__nav-item--active': item.active }"
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <span class="admin-header__nav-text">{{ item.label }}</span>
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
        </div>
      </header>

      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  --header-h: 64px;
  --sidebar-w: 244px;
  --sidebar-w-collapsed: 72px;
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
  gap: 4px;
  flex-shrink: 0;
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

.admin-sidebar__collapse-fab {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 50;
  width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.08),
    0 1px 2px rgba(15, 23, 42, 0.04);
  transform: translate(50%, -50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    box-shadow 0.2s ease;
}

.admin-sidebar__collapse-fab:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  box-shadow:
    0 4px 14px rgba(15, 23, 42, 0.1),
    0 1px 2px rgba(15, 23, 42, 0.06);
}

.admin-sidebar__collapse-fab:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__collapse-fab:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.admin-sidebar__collapse-fab-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
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
  box-shadow: 6px 0 28px rgba(15, 23, 42, 0.045);
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
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 0 0 4px;
  padding: 11px 14px;
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
    background 0.2s ease,
    color 0.2s ease;
}

.admin-sidebar__item:hover {
  background: rgba(15, 23, 42, 0.05);
  color: var(--color-text-strong);
}

.admin-sidebar__item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.admin-sidebar__item--active {
  background: rgba(255, 255, 255, 0.72);
  color: #0f172a;
  font-weight: 600;
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.06),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);
}

.admin-sidebar__item--active .admin-sidebar__item-ico {
  color: #0f172a;
}

.admin-sidebar__item-ico {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
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

.admin-sidebar__account {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 16px;
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
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.07);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.022),
    0 10px 28px rgba(15, 23, 42, 0.032);
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
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-sidebar__account-meta {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-sidebar__account-chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  transform: rotate(-90deg);
}

.admin-sidebar__account-logout {
  align-self: stretch;
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
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
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
  padding: 20px max(var(--admin-inline-gutter), env(safe-area-inset-right))
    max(24px, env(safe-area-inset-bottom)) max(var(--admin-inline-gutter), env(safe-area-inset-left));
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: var(--admin-canvas);
}

/* 收起：仅保留图标与必要控件 */
.admin-shell--sidebar-collapsed .admin-sidebar {
  border-right: 1px solid rgba(15, 23, 42, 0.08);
}

/* 收起时仅收宽度，纵向与展开态同一套留白，避免整体高度/Y 向错位 */
.admin-shell--sidebar-collapsed .admin-sidebar__inner {
  padding: 22px 8px 20px;
  border-right: none;
  box-shadow: none;
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
  padding: 11px 10px;
  gap: 0;
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
    padding-top: 10px;
    padding-bottom: 10px;
  }
}
</style>
