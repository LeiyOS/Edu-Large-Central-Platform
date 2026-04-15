<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { showToast } from 'vant'

/** 与 design.md / 组织页一致 */
const PRIMARY = '#F10C0C'

/** 须与 `.teach-tree__menu-pop` 的 min-width 一致，用于弹层定位 */
const TEACH_TREE_MENU_MIN_WIDTH = 133

interface TeachNode {
  id: string
  name: string
  children?: TeachNode[]
}

/** 左侧版本树：与原型学案题库 / 编辑版本一致（一级除置灰项外均含模拟子卷） */
const versionTree: TeachNode[] = [
  {
    id: 'common',
    name: '通用版',
    children: [
      { id: 'cm-gk-2024', name: '2024 新课标全国甲卷 · 物理' },
      { id: 'cm-gk-2023', name: '2023 新课标全国乙卷 · 物理' },
      { id: 'cm-sync-1', name: '必修一 · 运动与力（同步练习）' },
    ],
  },
  {
    id: 'henan',
    name: '河南版',
    children: [
      { id: 'hn-2024', name: '2024年河南省普通高中学业水平选择性考试 · 物理' },
      { id: 'hn-2023', name: '2023年河南省高考物理试卷' },
      { id: 'hn-mock-zz', name: '2025年郑州一中高三一模 · 物理' },
    ],
  },
  {
    id: 'tianjin',
    name: '天津版',
    children: [
      { id: 'tj-2024', name: '2024年天津市高考物理试卷 (等级性)' },
      { id: 'tj-2023', name: '2023年天津市高考物理试卷 (等级性)' },
      { id: 'tj-2025-sy', name: '2025年天津实验中学高三物理模拟试卷' },
      { id: 'tj-2025-yh', name: '2025年天津市耀华中学高三物理一模试卷' },
    ],
  },
  {
    id: 'chongqing',
    name: '重庆版',
    children: [
      { id: 'cq-2024', name: '2024年重庆市高考物理试卷' },
      { id: 'cq-2023', name: '2023年重庆市高考物理试卷' },
      { id: 'cq-mock-bs', name: '2025年巴蜀中学高三二诊 · 物理' },
    ],
  },
  {
    id: 'chengdu',
    name: '成都版',
    children: [
      { id: 'cd-2024', name: '2024年四川省高考物理试卷（成都阅卷区样例）' },
      { id: 'cd-mock-7', name: '2025年成都七中高三热身卷 · 物理' },
      { id: 'cd-sync-j', name: '选修3-1 · 静电场单元卷' },
    ],
  },
  { id: 'shanghai', name: '上海版' },
  {
    id: 'jiangsu',
    name: '江苏版',
    children: [
      { id: 'js-2024', name: '2024年江苏省高考物理试卷' },
      { id: 'js-2023', name: '2023年江苏省高考物理试卷' },
      { id: 'js-mock-nj', name: '2025年南京外国语学校模拟 · 物理' },
    ],
  },
  { id: 'zhejiang', name: '浙江版' },
]

const expandedIds = ref<Set<string>>(new Set(['tianjin']))
const selectedId = ref('tianjin')
/** 通栏前进/后退：在版本树内切换选中项 */
const historyPast = ref<string[]>([])
const historyFuture = ref<string[]>([])
const canGoForward = computed(() => historyFuture.value.length > 0)

const treeSearch = ref('')
const regionFilter = ref('')

const regionRows = ref<{ id: string; name: string }[]>([])

function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function selectNode(id: string) {
  closeTreeMenu()
  if (id === selectedId.value) return
  historyPast.value.push(selectedId.value)
  historyFuture.value = []
  selectedId.value = id
}

function onContextBack() {
  if (historyPast.value.length === 0) {
    onBack()
    return
  }
  const prev = historyPast.value.pop()!
  historyFuture.value.unshift(selectedId.value)
  selectedId.value = prev
  closeTreeMenu()
}

function onContextForward() {
  if (!canGoForward.value) return
  const next = historyFuture.value.shift()!
  historyPast.value.push(selectedId.value)
  selectedId.value = next
  closeTreeMenu()
}

function onContextAdd() {
  showToast('新建（示例）')
}

function findAncestors(
  nodes: TeachNode[],
  target: string,
  chain: TeachNode[] = [],
): TeachNode[] | null {
  for (const n of nodes) {
    const next = [...chain, n]
    if (n.id === target) return next
    if (n.children?.length) {
      const r = findAncestors(n.children, target, next)
      if (r) return r
    }
  }
  return null
}

const selectedChain = computed(() => findAncestors(versionTree, selectedId.value) ?? [])

const currentVersionName = computed(() => selectedChain.value[0]?.name ?? '—')

const versionTypeLabel = computed(() => {
  const chain = selectedChain.value
  if (chain.length <= 1) return '通用版本'
  return `子卷 · ${chain[chain.length - 1]?.name ?? ''}`
})

function nodeMatchesSearch(node: TeachNode, q: string): boolean {
  if (!q) return true
  const ql = q.toLowerCase()
  if (node.name.toLowerCase().includes(ql)) return true
  return node.children?.some((c) => nodeMatchesSearch(c, q)) ?? false
}

type FlatTreeRow = { node: TeachNode; depth: number; hasChildren: boolean; isExpanded: boolean }

function buildFlat(nodes: TeachNode[], depth: number, expanded: Set<string>, out: FlatTreeRow[]) {
  const q = treeSearch.value.trim().toLowerCase()
  for (const node of nodes) {
    if (q && !nodeMatchesSearch(node, q)) continue
    const hasChildren = Boolean(node.children?.length)
    const isExpanded = expanded.has(node.id)
    out.push({ node, depth, hasChildren, isExpanded })
    if (hasChildren && isExpanded && node.children) {
      buildFlat(node.children, depth + 1, expanded, out)
    }
  }
}

const flatTreeRows = computed(() => {
  const out: FlatTreeRow[] = []
  buildFlat(versionTree, 0, expandedIds.value, out)
  return out
})

/** 有子节点：点击行（除「更多」外）即展开/收起；无子节点：仅选中 */
function onTreeRowClick(row: FlatTreeRow) {
  if (row.hasChildren) {
    toggleExpand(row.node.id)
  }
  selectNode(row.node.id)
}

function onExpandChevronClick(row: FlatTreeRow, e: Event) {
  e.stopPropagation()
  onTreeRowClick(row)
}

function findNodeById(nodes: TeachNode[], id: string): TeachNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children?.length) {
      const f = findNodeById(n.children, id)
      if (f) return f
    }
  }
  return null
}

/** 树行「更多」菜单：fixed 到 body，避免 teach-tree 滚动裁切 */
const treeMenuOpenId = ref<string | null>(null)
const treeMenuPos = ref<{ top: number; left: number } | null>(null)

const treeMenuTargetNode = computed(() =>
  treeMenuOpenId.value ? findNodeById(versionTree, treeMenuOpenId.value) : null,
)

function closeTreeMenu() {
  treeMenuOpenId.value = null
  treeMenuPos.value = null
}

function toggleTreeRowMenu(nodeId: string, e: MouseEvent) {
  e.stopPropagation()
  if (treeMenuOpenId.value === nodeId) {
    closeTreeMenu()
    return
  }
  const btn = e.currentTarget as HTMLElement
  const r = btn.getBoundingClientRect()
  const mw = TEACH_TREE_MENU_MIN_WIDTH
  /** 弹窗在「更多」按钮正下方，右缘与按钮右缘对齐 */
  let left = r.right - mw
  left = Math.max(8, Math.min(left, window.innerWidth - mw - 8))
  treeMenuOpenId.value = nodeId
  treeMenuPos.value = {
    top: r.bottom + 4,
    left,
  }
}

function onTreeMenuDocClick(e: MouseEvent) {
  const t = e.target
  if (t instanceof Element) {
    if (t.closest('.teach-tree__menu-pop')) return
    if (t.closest('.teach-tree__actions')) return
  }
  closeTreeMenu()
}

function onTreeMenuKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeTreeMenu()
}

function onTreeMenuAction(action: string, node: TeachNode) {
  closeTreeMenu()
  showToast(`${action}（示例）· ${node.name}`)
}

onMounted(() => {
  document.addEventListener('click', onTreeMenuDocClick)
  document.addEventListener('keydown', onTreeMenuKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onTreeMenuDocClick)
  document.removeEventListener('keydown', onTreeMenuKeydown)
})

function onBack() {
  showToast('返回上一级（示例）')
}

function onLinkOutline() {
  showToast('关联大纲（示例）')
}

function onLinkRegion() {
  showToast('关联区域（示例）')
}

function onQuery() {
  showToast('查询（示例）')
}

function resetRegionFilter() {
  regionFilter.value = ''
}
</script>

<template>
  <div class="teach-page">
    <header class="teach-page__context" aria-label="页面导航与位置">
      <div class="teach-page__ctx-nav">
        <button type="button" class="teach-page__ctx-icon-btn" aria-label="返回" @click="onContextBack">
          <Icon icon="lucide:chevron-left" class="teach-page__ctx-ico" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="teach-page__ctx-icon-btn"
          aria-label="前进"
          :disabled="!canGoForward"
          @click="onContextForward"
        >
          <Icon icon="lucide:chevron-right" class="teach-page__ctx-ico" aria-hidden="true" />
        </button>
      </div>
      <span class="teach-page__ctx-vsep" aria-hidden="true" />
      <div class="teach-page__ctx-crumb" aria-current="page">
        <Icon icon="lucide:library" class="teach-page__ctx-lib" aria-hidden="true" />
        <span class="teach-page__ctx-crumb-text">
          <span class="teach-page__ctx-crumb-a">学案题库</span>
          <span class="teach-page__ctx-crumb-sep">/</span>
          <span class="teach-page__ctx-crumb-b">编辑版本</span>
        </span>
      </div>
      <span class="teach-page__ctx-vsep" aria-hidden="true" />
      <button type="button" class="teach-page__ctx-icon-btn" aria-label="新建" @click="onContextAdd">
        <Icon icon="lucide:plus" class="teach-page__ctx-ico" aria-hidden="true" />
      </button>
    </header>

    <div class="teach-page__columns">
      <aside class="teach-aside" aria-label="学案版本与大纲">
      <div class="teach-aside__toolbar">
        <div class="teach-tree-search" role="search">
          <Icon icon="lucide:search" class="teach-tree-search__ico" aria-hidden="true" />
          <input
            v-model="treeSearch"
            type="search"
            class="teach-tree-search__input"
            placeholder="输入并搜索..."
            autocomplete="off"
            aria-label="搜索版本树"
          />
        </div>
        <button type="button" class="teach-btn teach-btn--primary teach-aside__outline-btn" @click="onLinkOutline">
          关联大纲
        </button>
      </div>

      <div class="teach-tree" role="tree" @scroll.passive="closeTreeMenu">
        <div
          v-for="row in flatTreeRows"
          :key="row.node.id"
          class="teach-tree__row"
          :class="{
            'teach-tree__row--active': selectedId === row.node.id,
            'teach-tree__row--menu-open': treeMenuOpenId === row.node.id,
            'teach-tree__row--expanded': row.hasChildren && row.isExpanded,
          }"
          :style="row.depth > 0 ? { paddingLeft: `calc(12px + ${row.depth}ch)` } : undefined"
          role="treeitem"
          :aria-expanded="row.hasChildren ? row.isExpanded : undefined"
          @click="onTreeRowClick(row)"
        >
          <div class="teach-tree__label-wrap">
            <Icon
              v-if="row.depth === 1"
              icon="lucide:file-text"
              class="teach-tree__paper-ico"
              aria-hidden="true"
            />
            <span class="teach-tree__label">{{ row.node.name }}</span>
            <button
              v-if="row.hasChildren"
              type="button"
              class="teach-tree__expand-chev"
              :aria-label="row.isExpanded ? '收起' : '展开'"
              @click="onExpandChevronClick(row, $event)"
            >
              <Icon
                :icon="row.isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                class="teach-tree__expand-chev-ico"
                aria-hidden="true"
              />
            </button>
          </div>

          <div class="teach-tree__actions" @click.stop>
            <button
              type="button"
              class="teach-tree__action teach-tree__action--more"
              :aria-expanded="treeMenuOpenId === row.node.id"
              aria-haspopup="menu"
              :aria-controls="`teach-tree-menu-${row.node.id}`"
              :title="`更多操作：${row.node.name}`"
              @click="toggleTreeRowMenu(row.node.id, $event)"
            >
              <Icon icon="lucide:ellipsis" class="teach-tree__action-ico" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="treeMenuOpenId && treeMenuPos && treeMenuTargetNode"
          :id="`teach-tree-menu-${treeMenuOpenId}`"
          class="teach-tree__menu-pop"
          role="menu"
          :aria-label="`${treeMenuTargetNode.name} 操作`"
          :style="{
            position: 'fixed',
            top: `${treeMenuPos.top}px`,
            left: `${treeMenuPos.left}px`,
            zIndex: 3000,
          }"
          @click.stop
        >
          <button
            type="button"
            class="teach-tree__menu-item"
            role="menuitem"
            @click="onTreeMenuAction('新增', treeMenuTargetNode)"
          >
            <Icon icon="lucide:plus" class="teach-tree__menu-item-ico" aria-hidden="true" />
            新增
          </button>
          <button
            type="button"
            class="teach-tree__menu-item"
            role="menuitem"
            @click="onTreeMenuAction('编辑', treeMenuTargetNode)"
          >
            <Icon icon="lucide:pencil" class="teach-tree__menu-item-ico" aria-hidden="true" />
            编辑
          </button>
          <button
            type="button"
            class="teach-tree__menu-item"
            role="menuitem"
            @click="onTreeMenuAction('查看', treeMenuTargetNode)"
          >
            <Icon icon="lucide:search" class="teach-tree__menu-item-ico" aria-hidden="true" />
            查看
          </button>
          <div class="teach-tree__menu-sep" role="separator" />
          <button
            type="button"
            class="teach-tree__menu-item teach-tree__menu-item--danger"
            role="menuitem"
            @click="onTreeMenuAction('删除', treeMenuTargetNode)"
          >
            <Icon icon="lucide:trash-2" class="teach-tree__menu-item-ico" aria-hidden="true" />
            删除
          </button>
        </div>
      </Teleport>
    </aside>

    <section class="teach-panel" aria-labelledby="teach-panel-title">
      <div class="teach-panel__toolbar">
        <div class="teach-panel__meta">
          <h2 id="teach-panel-title" class="teach-panel__title">
            当前版本：<span class="teach-panel__title-em">{{ currentVersionName }}</span>
          </h2>
          <p class="teach-panel__sub">版本类型：{{ versionTypeLabel }}</p>
        </div>
        <button type="button" class="teach-btn teach-btn--primary" @click="onLinkRegion">
          关联区域
        </button>
      </div>

      <section class="teach-filter" aria-label="筛选区域">
        <label class="teach-filter__label" for="teach-region-input">区域</label>
        <div class="teach-filter__line">
          <input
            id="teach-region-input"
            v-model="regionFilter"
            type="search"
            class="teach-filter__input"
            placeholder="请输入区域名称"
            autocomplete="off"
          />
        </div>
        <div class="teach-filter__actions">
          <button type="button" class="teach-btn teach-btn--primary teach-btn--filter" @click="onQuery">
            查询
          </button>
          <button type="button" class="teach-btn teach-btn--outline teach-btn--filter" @click="resetRegionFilter">
            重置
          </button>
        </div>
      </section>

      <div class="teach-table-wrap">
        <table class="teach-table">
          <thead>
            <tr>
              <th scope="col" class="teach-table__th">区域</th>
              <th scope="col" class="teach-table__th teach-table__th--act">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in regionRows" :key="r.id">
              <td class="teach-table__td">{{ r.name }}</td>
              <td class="teach-table__td">—</td>
            </tr>
          </tbody>
        </table>

        <div v-if="regionRows.length === 0" class="teach-empty">
          <div class="teach-empty__art" aria-hidden="true">
            <Icon icon="lucide:package-open" class="teach-empty__art-ico" />
            <span class="teach-empty__spark" />
          </div>
          <p class="teach-empty__text">还没有设置关联区域</p>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
.teach-page {
  --primary: v-bind(PRIMARY);
  /** 与 `.admin-main > *:only-child` 配合铺满主区 */
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  font-family: var(--font-sans);
  color: var(--color-text);
}

/**
 * 通栏：抵消 admin-main 内边距，紧贴顶栏下沿与侧栏右侧（与主区左缘对齐）
 * 依赖 .admin-shell 上的 --admin-inline-gutter、--admin-main-pad-top
 */
.teach-page__context {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-height: 40px;
  margin-top: calc(-1 * var(--admin-main-pad-top, 20px));
  margin-left: calc(-1 * max(var(--admin-inline-gutter, 32px), env(safe-area-inset-left)));
  margin-right: calc(-1 * max(var(--admin-inline-gutter, 32px), env(safe-area-inset-right)));
  margin-bottom: 0;
  padding: 0 8px 0 6px;
  border-radius: 0;
  background: #f8f8f7;
  border: none;
  /** 与顶栏底边同一 token（继承自 `.admin-shell --admin-header-hairline`） */
  border-bottom: 1px solid var(--admin-header-hairline, rgba(15, 23, 42, 0.05));
  box-sizing: border-box;
}

.teach-page__ctx-nav {
  display: flex;
  align-items: center;
  gap: 0;
}

.teach-page__ctx-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease,
    opacity 0.12s ease;
}

.teach-page__ctx-icon-btn:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.07);
  color: #334155;
}

.teach-page__ctx-icon-btn:disabled {
  opacity: 0.32;
  cursor: not-allowed;
  color: #94a3b8;
}

.teach-page__ctx-icon-btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.teach-page__ctx-ico {
  width: 18px;
  height: 18px;
}

.teach-page__ctx-vsep {
  width: 1px;
  align-self: stretch;
  min-height: 22px;
  margin: 8px 6px;
  background: rgba(15, 23, 42, 0.1);
  flex-shrink: 0;
}

.teach-page__ctx-crumb {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0 8px;
}

.teach-page__ctx-lib {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.teach-page__ctx-crumb-text {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teach-page__ctx-crumb-a {
  color: #64748b;
}

.teach-page__ctx-crumb-sep {
  margin: 0 4px;
  color: #cbd5e1;
}

.teach-page__ctx-crumb-b {
  color: #475569;
  font-weight: 600;
}

.teach-page__columns {
  /** flex-basis 0 + grow：吃满通栏以下剩余纵向空间 */
  flex: 1 1 0%;
  display: flex;
  align-items: stretch;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  /** 与通栏同宽：左缘贴主区与侧栏接缝、右缘贴主区右内边距 */
  margin-left: calc(-1 * max(var(--admin-inline-gutter, 32px), env(safe-area-inset-left)));
  margin-right: calc(-1 * max(var(--admin-inline-gutter, 32px), env(safe-area-inset-right)));
}

.teach-aside {
  flex: 0 0 min(308px, 34vw);
  max-width: 360px;
  display: flex;
  flex-direction: column;
  min-width: 260px;
  min-height: 0;
  height: 100%;
  align-self: stretch;
  padding: 16px 14px 18px;
  background: #f9f8f7;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-left: none;
  border-top: none;
  border-radius: 0;
  box-sizing: border-box;
}

.teach-aside__toolbar {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  min-width: 0;
}

/** 侧栏搜索：无边框、无底色，仅图标 + 文案（参考极简稿） */
.teach-tree-search {
  flex: 1 1 auto;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 40px;
  padding: 0 4px 0 2px;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.teach-tree-search:focus-within {
  border: none;
  background: transparent;
  box-shadow: none;
}

.teach-tree-search__ico {
  width: 16px;
  height: 16px;
  color: #999;
  flex-shrink: 0;
  opacity: 0.95;
}

.teach-tree-search__ico :deep(svg) {
  stroke-width: 1.5;
}

.teach-tree-search__input {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  padding: 0;
  min-height: 0;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text);
  background: transparent;
  outline: none;
  box-shadow: none;
}

.teach-tree-search__input:focus,
.teach-tree-search__input:focus-visible {
  outline: none;
  box-shadow: none;
}

.teach-tree-search__input::placeholder {
  color: #999;
}

.teach-btn {
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-radius: 10px;
  transition:
    filter 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.teach-btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.teach-btn--primary {
  height: 40px;
  padding: 0 16px;
  border: none;
  background: var(--primary);
  color: #fff;
}

/** 侧栏「关联大纲」：略矮于主按钮 40px，需覆盖 .teach-btn--primary */
.teach-aside__outline-btn.teach-btn--primary {
  flex-shrink: 0;
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  white-space: nowrap;
}

.teach-btn--primary:hover {
  filter: brightness(1.06);
}

.teach-btn--primary:active {
  transform: scale(0.99);
}

.teach-btn--block {
  width: 100%;
}

.teach-btn--outline {
  height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #0f172a;
}

.teach-btn--outline:hover {
  background: rgba(15, 23, 42, 0.02);
}

.teach-btn--filter {
  height: 40px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 14px;
}

.teach-tree {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
}

.teach-tree__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  /** 行高收紧，拉近上下条文案；hover/选中高亮由 ::before 内缩保证胶囊高度 */
  min-height: 32px;
  /** 与一级目录左对齐：不按 depth 增加缩进 */
  padding: 0 8px 0 12px;
  margin-bottom: 0;
  cursor: pointer;
  background: transparent;
}

/**
 * 高亮条：上下内缩；在 4px 胶囊基础上再抬高（行盒与文案间距不变）
 */
.teach-tree__row::before {
  content: '';
  position: absolute;
  z-index: 0;
  left: 4px;
  right: 4px;
  top: 1px;
  bottom: 1px;
  border-radius: 6px;
  background: transparent;
  pointer-events: none;
  transition: background 0.15s ease;
}

/** 悬停 / 键盘聚焦 / 菜单打开 — 浅灰圆角条（展开父行在选中子项时不再单独铺底） */
.teach-tree__row:hover::before,
.teach-tree__row--menu-open::before,
.teach-tree__row:focus-within::before {
  background: rgba(15, 23, 42, 0.06);
}

/** 选中：与悬停同系灰色条 */
.teach-tree__row--active::before {
  background: rgba(15, 23, 42, 0.06);
}

.teach-tree__row--active:hover::before,
.teach-tree__row--active.teach-tree__row--menu-open::before,
.teach-tree__row--active:focus-within::before {
  background: rgba(15, 23, 42, 0.07);
}

.teach-tree__label-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1 1 auto;
  min-width: 0;
  padding-right: 0;
  transition: padding-right 0.15s ease;
}

.teach-tree__paper-ico {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: #94a3b8;
}

.teach-tree__paper-ico :deep(svg) {
  stroke-width: 1.75;
}

.teach-tree__row--active .teach-tree__paper-ico {
  color: #64748b;
}

.teach-tree__row:hover .teach-tree__paper-ico,
.teach-tree__row--menu-open .teach-tree__paper-ico,
.teach-tree__row:focus-within .teach-tree__paper-ico {
  color: #64748b;
}

.teach-tree__label {
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.28;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teach-tree__row--active .teach-tree__label {
  color: var(--color-text-strong);
  font-weight: 600;
}

.teach-tree__row:hover .teach-tree__label,
.teach-tree__row--menu-open .teach-tree__label,
.teach-tree__row:focus-within .teach-tree__label {
  color: #334155;
}

/** 文案右侧 chevron：仅悬停 / 键盘聚焦 / 行菜单打开时显示；行点击也可展开收起 */
.teach-tree__expand-chev {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  line-height: 1;
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.15s ease,
    min-width 0.15s ease,
    width 0.15s ease,
    background 0.12s ease,
    color 0.12s ease;
}

.teach-tree__row:hover .teach-tree__expand-chev,
.teach-tree__row--menu-open .teach-tree__expand-chev,
.teach-tree__row:focus-within .teach-tree__expand-chev {
  width: 20px;
  min-width: 20px;
  margin-left: -1px;
  overflow: visible;
  opacity: 1;
  pointer-events: auto;
  color: #94a3b8;
}

.teach-tree__expand-chev:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #64748b;
}

.teach-tree__expand-chev:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.teach-tree__expand-chev-ico {
  width: 14px;
  height: 14px;
}

/** 右侧操作组：悬停 / 菜单 / focus 时显示，与文案避让 */
.teach-tree__row:hover .teach-tree__label-wrap,
.teach-tree__row--menu-open .teach-tree__label-wrap,
.teach-tree__row:focus-within .teach-tree__label-wrap {
  padding-right: 32px;
}

.teach-tree__actions {
  position: absolute;
  top: 50%;
  right: 6px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: -12px;
  height: 24px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.teach-tree__row:hover .teach-tree__actions,
.teach-tree__row--menu-open .teach-tree__actions,
.teach-tree__row:focus-within .teach-tree__actions {
  opacity: 1;
  pointer-events: auto;
}

.teach-tree__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.teach-tree__action:hover {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.teach-tree__action:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/** 图二：「更多」在悬停时略深底，贴近参考稿 */
.teach-tree__action--more {
  background: rgba(15, 23, 42, 0.06);
}

.teach-tree__action--more:hover {
  background: rgba(15, 23, 42, 0.12);
  color: #0f172a;
}

.teach-tree__action-ico {
  width: 15px;
  height: 15px;
}

.teach-tree__menu-pop {
  min-width: 133px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: var(--color-surface);
  box-shadow:
    0 4px 24px rgba(15, 23, 42, 0.1),
    0 1px 3px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.teach-tree__menu-item {
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
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
}

.teach-tree__menu-item:hover {
  background: rgba(15, 23, 42, 0.05);
}

.teach-tree__menu-item:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 0;
}

.teach-tree__menu-item--danger {
  color: var(--primary);
}

.teach-tree__menu-item--danger:hover {
  background: rgba(241, 12, 12, 0.08);
}

.teach-tree__menu-item-ico {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.88;
}

.teach-tree__menu-sep {
  height: 1px;
  margin: 4px 6px;
  background: rgba(15, 23, 42, 0.08);
}

.teach-panel {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  margin-left: 16px;
  padding: 18px 20px 20px;
  background: var(--color-surface);
  border: none;
  border-radius: 0;
  box-sizing: border-box;
}

.teach-panel__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  margin-bottom: 16px;
}

.teach-panel__title {
  margin: 0 0 6px;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-strong);
  letter-spacing: -0.02em;
}

.teach-panel__title-em {
  font-weight: 800;
  color: var(--color-text);
}

.teach-panel__sub {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.teach-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 18px;
}

.teach-filter__label {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-right: auto;
}

.teach-filter__line {
  flex: 0 1 280px;
  min-width: 160px;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.022),
    0 6px 18px rgba(15, 23, 42, 0.028);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.teach-filter:focus-within .teach-filter__line,
.teach-filter__line:focus-within {
  border-color: rgba(241, 12, 12, 0.38);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 8px 24px rgba(15, 23, 42, 0.04),
    0 0 0 2px rgba(241, 12, 12, 0.14);
}

.teach-filter__input {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  padding: 10px 0;
  font: inherit;
  font-size: 14px;
  color: var(--color-text);
  background: transparent;
  outline: none;
}

.teach-filter__input::placeholder {
  color: var(--color-placeholder);
}

.teach-filter__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.teach-table-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 280px;
  overflow: auto;
  border-radius: 0;
  border: none;
}

.teach-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.teach-table__th {
  text-align: left;
  padding: 12px 18px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.teach-table__th--act {
  width: 120px;
}

.teach-table__td {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
  color: var(--color-text);
}

.teach-empty {
  position: absolute;
  inset: 48px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 24px;
  pointer-events: none;
}

.teach-empty__art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  border-radius: 20px;
  background: linear-gradient(145deg, #e0e7ff 0%, #f1f5f9 48%, #e2e8f0 100%);
  color: #6366f1;
}

.teach-empty__art-ico {
  width: 40px;
  height: 40px;
  opacity: 0.9;
}

.teach-empty__spark {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: #93c5fd;
  opacity: 0.85;
  transform: rotate(12deg);
}

.teach-empty__text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

@media (max-width: 960px) {
  .teach-page {
    min-height: 0;
  }

  .teach-page__columns {
    flex-direction: column;
    min-height: 0;
    overflow: visible;
  }

  .teach-aside {
    flex: 0 0 auto;
    max-width: none;
    width: 100%;
    height: auto;
    min-height: 280px;
    max-height: 42vh;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 0;
  }

  .teach-panel {
    margin-left: 0;
    margin-top: 14px;
    flex: 1 1 auto;
    height: auto;
  }

  .teach-filter__label {
    width: 100%;
    margin-right: 0;
  }
}
</style>
