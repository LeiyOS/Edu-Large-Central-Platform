<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { showToast } from 'vant'
import teachEmptyArtUrl from '../../assets/404-img.png'

/** 与 design.md / 组织页一致 */
const PRIMARY = '#F10C0C'

/** 学案页左侧版本树（teach-aside）显隐，与 AdminLayout 全局侧栏无关 */
const teachAsideExpanded = ref(true)

const teachAsideToggleAria = computed(() =>
  teachAsideExpanded.value ? '收起学案侧栏' : '展开学案侧栏',
)

/** 学案侧栏展开：panel-left-close（左箭+竖条）；收起：panel-left-open（竖条+右箭） */
const teachAsideToggleIcon = computed(() =>
  teachAsideExpanded.value ? 'lucide:panel-left-close' : 'lucide:panel-left-open',
)

function toggleTeachAside() {
  teachAsideExpanded.value = !teachAsideExpanded.value
}

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
/** 通栏返回：在版本树内回退选中项 */
const historyPast = ref<string[]>([])

const treeSearch = ref('')
const treeSearchInputRef = ref<HTMLInputElement | null>(null)
const regionFilter = ref('')
const regionInputRef = ref<HTMLInputElement | null>(null)
/** 区域搜索输入默认收起，点击放大镜展开，再次点击收起 */
const regionSearchExpanded = ref(false)

const regionSearchToggleAria = computed(() =>
  regionSearchExpanded.value ? '收起区域搜索' : '展开区域搜索',
)

function toggleRegionSearch() {
  const next = !regionSearchExpanded.value
  if (regionSearchExpanded.value && !next) {
    regionInputRef.value?.blur()
  }
  regionSearchExpanded.value = next
  if (next) {
    nextTick(() => regionInputRef.value?.focus())
  }
}

function clearRegionFilter() {
  regionFilter.value = ''
  regionInputRef.value?.blur()
  regionSearchExpanded.value = false
}

function clearTreeSearch() {
  treeSearch.value = ''
  nextTick(() => treeSearchInputRef.value?.focus())
}

/** 示例数据，便于预览表格；接入关联区域接口后改为空数组或由接口填充 */
const regionRows = ref<{ id: string; name: string }[]>([
  { id: 'r-1', name: '天津市' },
  { id: 'r-2', name: '成都市' },
  { id: 'r-3', name: '南京市' },
  { id: 'r-4', name: '北京市' },
  { id: 'r-5', name: '上海市' },
  { id: 'r-6', name: '重庆市' },
  { id: 'r-7', name: '广州市' },
  { id: 'r-8', name: '深圳市' },
  { id: 'r-9', name: '杭州市' },
  { id: 'r-10', name: '武汉市' },
  { id: 'r-11', name: '西安市' },
  { id: 'r-12', name: '苏州市' },
  { id: 'r-13', name: '郑州市' },
  { id: 'r-14', name: '长沙市' },
  { id: 'r-15', name: '济南市' },
  { id: 'r-16', name: '合肥市' },
  { id: 'r-17', name: '福州市' },
  { id: 'r-18', name: '厦门市' },
  { id: 'r-19', name: '青岛市' },
  { id: 'r-20', name: '大连市' },
  { id: 'r-21', name: '沈阳市' },
  { id: 'r-22', name: '哈尔滨市' },
  { id: 'r-23', name: '昆明市' },
  { id: 'r-24', name: '贵阳市' },
  { id: 'r-25', name: '南宁市' },
  { id: 'r-26', name: '石家庄市' },
  { id: 'r-27', name: '太原市' },
  { id: 'r-28', name: '南昌市' },
  { id: 'r-29', name: '海口市' },
  { id: 'r-30', name: '兰州市' },
])

/** 与「请输入区域名称」输入框绑定：按区域名称包含匹配（不区分大小写） */
const filteredRegionRows = computed(() => {
  const q = regionFilter.value.trim().toLowerCase()
  if (!q) return regionRows.value
  return regionRows.value.filter((r) => r.name.toLowerCase().includes(q))
})

const showRegionTableEmpty = computed(
  () => regionRows.value.length === 0 || filteredRegionRows.value.length === 0,
)

const regionTableEmptyText = computed(() =>
  regionRows.value.length === 0 ? '还没有设置关联区域' : '未找到匹配的区域',
)

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
  selectedId.value = id
}

function onContextBack() {
  if (historyPast.value.length === 0) {
    onBack()
    return
  }
  const prev = historyPast.value.pop()!
  selectedId.value = prev
  closeTreeMenu()
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

function removeRegionRow(id: string) {
  regionRows.value = regionRows.value.filter((r) => r.id !== id)
}
</script>

<template>
  <div class="teach-page">
    <header class="teach-page__context" aria-label="页面导航与位置">
      <div class="teach-page__ctx-lead">
        <div class="teach-page__ctx-nav">
          <button type="button" class="teach-page__ctx-icon-btn" aria-label="返回" @click="onContextBack">
            <Icon icon="lucide:chevron-left" class="teach-page__ctx-ico" aria-hidden="true" />
          </button>
        </div>
        <span class="teach-page__ctx-vsep" aria-hidden="true" />
      </div>
      <div class="teach-page__ctx-crumb" aria-current="page">
        <Icon icon="lucide:library" class="teach-page__ctx-lib" aria-hidden="true" />
        <span class="teach-page__ctx-crumb-text">
          <span class="teach-page__ctx-crumb-a">学案题库</span>
          <span class="teach-page__ctx-crumb-sep">/</span>
          <span class="teach-page__ctx-crumb-b">编辑版本</span>
        </span>
      </div>
    </header>

    <div class="teach-page__columns">
      <aside v-show="teachAsideExpanded" class="teach-aside" aria-label="学案版本与大纲">
      <div class="teach-aside__toolbar">
        <div class="teach-tree-search" role="search">
          <Icon icon="lucide:search" class="teach-tree-search__ico" aria-hidden="true" />
          <input
            id="teach-tree-search-input"
            ref="treeSearchInputRef"
            v-model="treeSearch"
            type="text"
            class="teach-tree-search__input"
            placeholder="输入并搜索..."
            autocomplete="off"
            enterkeyhint="search"
            aria-label="搜索版本树"
          />
          <button
            v-show="treeSearch.length > 0"
            type="button"
            class="teach-tree-search__clear"
            aria-label="清除搜索内容"
            @click="clearTreeSearch"
          >
            <Icon icon="lucide:x" class="teach-tree-search__clear-ico" aria-hidden="true" />
          </button>
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
          <div class="teach-panel__title-row">
            <button
              type="button"
              class="teach-page__ctx-icon-btn"
              :aria-label="teachAsideToggleAria"
              :title="teachAsideToggleAria"
              @click="toggleTeachAside"
            >
              <Icon :icon="teachAsideToggleIcon" class="teach-page__ctx-ico" aria-hidden="true" />
            </button>
            <h2 id="teach-panel-title" class="teach-panel__title">
              <span class="teach-panel__title-em">{{ currentVersionName }}</span>
            </h2>
          </div>
          <div class="teach-panel__meta-row">
            <span class="teach-panel__pill" role="note">
              <Icon icon="lucide:check-square" class="teach-panel__pill-ico" aria-hidden="true" />
              <span class="teach-panel__pill-text">版本类型：{{ versionTypeLabel }}</span>
            </span>
          </div>
        </div>

        <section class="teach-filter teach-filter--toolbar" aria-label="筛选区域">
          <label class="teach-filter__sr-only" for="teach-region-input">区域</label>
          <div class="teach-filter__toolbar-row">
            <div
              class="teach-filter__line"
              :class="{ 'teach-filter__line--search-collapsed': !regionSearchExpanded }"
            >
              <button
                type="button"
                class="teach-filter__search-trigger"
                :aria-label="regionSearchToggleAria"
                :aria-expanded="regionSearchExpanded"
                aria-controls="teach-region-input"
                @click.stop="toggleRegionSearch"
              >
                <Icon icon="lucide:search" class="teach-filter__search-trigger-ico" aria-hidden="true" />
              </button>
              <div
                class="teach-filter__input-wrap"
                :class="{ 'teach-filter__input-wrap--collapsed': !regionSearchExpanded }"
              >
                <input
                  id="teach-region-input"
                  ref="regionInputRef"
                  v-model="regionFilter"
                  type="text"
                  class="teach-filter__input"
                  placeholder="请输入区域名称"
                  autocomplete="off"
                  enterkeyhint="search"
                />
                <button
                  v-show="regionFilter.length > 0"
                  type="button"
                  class="teach-filter__clear"
                  aria-label="清除搜索内容"
                  @click="clearRegionFilter"
                >
                  <Icon icon="lucide:x" class="teach-filter__clear-ico" aria-hidden="true" />
                </button>
              </div>
            </div>
            <button type="button" class="teach-filter__region-btn" @click="onLinkRegion">关联区域</button>
          </div>
        </section>
      </div>

      <div class="teach-table-wrap">
        <table class="teach-table">
          <colgroup>
            <col class="teach-table__col-region" />
            <col class="teach-table__col-act" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" class="teach-table__th">
                <span class="teach-table__th-inner teach-table__th-inner--region">
                  <Icon icon="mdi:map-marker" class="teach-table__th-ico teach-table__th-ico--region" aria-hidden="true" />
                  <span>区域</span>
                </span>
              </th>
              <th scope="col" class="teach-table__th teach-table__th--act">
                <span class="teach-table__th-inner">
                  <Icon icon="mdi:tune" class="teach-table__th-ico teach-table__th-ico--act" aria-hidden="true" />
                  <span>操作</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredRegionRows" :key="r.id" class="teach-table__tr">
              <td class="teach-table__td">
                <span class="teach-table__cell-region">
                  <Icon icon="lucide:building-2" class="teach-table__row-ico" aria-hidden="true" />
                  <span class="teach-table__region-name">{{ r.name }}</span>
                </span>
              </td>
              <td class="teach-table__td teach-table__td--act">
                <button
                  type="button"
                  class="teach-table__del"
                  aria-label="删除该区域"
                  @click="removeRegionRow(r.id)"
                >
                  <Icon icon="lucide:trash-2" class="teach-table__del-ico" aria-hidden="true" />
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="showRegionTableEmpty" class="teach-empty teach-empty--inline" role="status">
          <div class="teach-empty__art" aria-hidden="true">
            <img :src="teachEmptyArtUrl" alt="" class="teach-empty__art-img" width="237" height="237" decoding="async" />
          </div>
          <p
            class="teach-empty__text"
            :class="{ 'teach-empty__text--filter-miss': regionRows.length > 0 }"
          >
            {{ regionTableEmptyText }}
          </p>
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
  padding: 0 8px 0 10px;
  border-radius: 0;
  background: #f8f8f7;
  border: none;
  /** 与顶栏底边同一 token（继承自 `.admin-shell --admin-header-hairline`） */
  border-bottom: 1px solid var(--admin-header-hairline, rgba(15, 23, 42, 0.05));
  box-sizing: border-box;
}

/** 侧栏切换、返回与首条竖线 */
.teach-page__ctx-lead {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  margin-left: -2px;
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
  align-self: stretch;
  /** 高度随 teach-page__columns 拉伸（勿用 height:100%，在部分 flex 链路上百分比不成立） */
  padding: 16px 14px 18px 16px;
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

/** 侧栏版本树搜索：无边框、无底色，仅图标 + 输入（与早期稿一致） */
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
  position: relative;
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
  padding: 0 22px 0 0;
  min-height: 0;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text);
  background: transparent;
  outline: none;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
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
  flex: 1 1 0%;
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
  /** 一级区域名：略浅于原 #64748b，与二级 #475569 拉开层次 */
  color: #8091a4;
  line-height: 1.28;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/** 二级（子卷）文案：略深于一级区域名，仍轻于正文 */
.teach-tree__label-wrap:has(.teach-tree__paper-ico) .teach-tree__label {
  color: #475569;
}

.teach-tree__row--active .teach-tree__label-wrap .teach-tree__label {
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
  right: 8px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: -11px;
  height: 22px;
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
  width: 22px;
  height: 22px;
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
  /** 标题↔版本类型 pill、工具栏↔表格 使用同一垂直间距 */
  --teach-panel-stack-gap: 10px;

  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  margin-left: 0;
  /** 底内边距交给 `.teach-table-wrap`，使表格区外缘与面板底缘对齐，避免栏下留白缝 */
  padding: 28px 20px 0 20px;
  background: var(--color-surface);
  border: none;
  border-radius: 0;
  box-sizing: border-box;
}

.teach-panel__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 0;
  margin-bottom: var(--teach-panel-stack-gap);
}

.teach-panel__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--teach-panel-stack-gap);
  min-width: 0;
}

.teach-panel__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.teach-panel__title-row .teach-panel__title {
  flex: 1 1 auto;
  min-width: 0;
}

.teach-panel__title-row .teach-page__ctx-ico {
  width: calc(18px * 1.2);
  height: calc(18px * 1.2);
}

.teach-panel__title-row .teach-page__ctx-icon-btn {
  color: #999999;
}

.teach-panel__title-row .teach-page__ctx-icon-btn:hover:not(:disabled) {
  color: #999999;
}

.teach-panel__title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-strong);
  letter-spacing: -0.03em;
  line-height: 1.25;
}

.teach-panel__title-em {
  font-weight: 800;
  color: var(--color-text);
}

.teach-panel__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.teach-panel__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px 9px 10px;
  border-radius: 999px;
  background: #f3f3f3;
  box-sizing: border-box;
}

.teach-panel__pill-ico {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: #a6a299;
}

.teach-panel__pill-ico :deep(svg) {
  stroke-width: 1.75;
}

.teach-panel__pill-text {
  font-size: 13px;
  font-weight: 500;
  color: #7d7a75;
  letter-spacing: -0.01em;
  line-height: 1.3;
  white-space: nowrap;
}

.teach-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 18px;
}

/** 与「版本类型」行底对齐，靠工具栏最右；单行极简搜索条 */
.teach-filter--toolbar {
  /** 与侧栏「关联大纲」`.teach-aside__outline-btn` 高度一致 */
  --teach-filter-ctrl-height: 34px;

  margin-bottom: 0;
  margin-left: auto;
  flex: 0 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0;
}

/** 搜索条与「关联区域」同一行，项间距 8px */
.teach-filter__toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.teach-filter__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.teach-filter__line {
  /** flex-grow:0 不吃掉行内剩余宽度，右缘贴齐输入/图标，与「关联区域」仅隔工具栏 gap（收起/展开一致） */
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
  max-width: min(calc(460px * 4 / 3 * 5 / 6), 100%);
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--teach-filter-ctrl-height);
  min-height: var(--teach-filter-ctrl-height);
  margin-left: 6px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  outline: none;
  box-sizing: border-box;
}

/** 输入收起时只占放大镜宽度，不把整行撑到 max-width */
.teach-filter__line--search-collapsed {
  flex: 0 0 auto;
  max-width: none;
  width: auto;
}

/** 32×32 热区；hover 浅灰底与圆角与框选范围一致 */
.teach-filter__search-trigger {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 0 0 6px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.teach-filter__search-trigger:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.08);
}

.teach-filter__search-trigger:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.teach-filter__search-trigger-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.teach-filter__search-trigger-ico :deep(svg) {
  stroke-width: 1.75;
}

.teach-filter__input-wrap {
  /** 在上一版基础上再缩短 1/6（×5/6）；不超出时占满行内剩余，窄屏随父级收缩 */
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  max-width: calc((460px - 42px) * 3 / 4 * 4 / 3 * 5 / 6);
  overflow: hidden;
  align-self: center;
  /** 与搜索 icon 间距为行 gap 的一半（8px→4px） */
  margin-left: -4px;
  /** 清除钮绝对定位，避免参与 flex 占位导致输入区随叉显隐左右跳 */
  position: relative;
}

/**
 * 收起态：不用仅依赖 v-show（部分环境下 flex 子项的 display 可能被覆盖），用 !important 保证不占位、不可见
 */
.teach-filter__input-wrap--collapsed {
  display: none !important;
  flex: 0 0 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  margin-left: 0 !important;
  overflow: hidden !important;
}

/** 区域筛选与版本树搜索共用：小圆底 #ADA9A3 + 居中白叉（叠在输入区右侧，不占 flex 宽度） */
.teach-filter__clear,
.teach-tree-search__clear {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #ada9a3;
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    filter 0.15s ease;
}

.teach-filter__clear:hover,
.teach-tree-search__clear:hover {
  background: #9d9993;
}

.teach-filter__clear:focus-visible,
.teach-tree-search__clear:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.teach-filter__clear-ico,
.teach-tree-search__clear-ico {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  display: block;
  margin: 0;
}

.teach-filter__clear-ico :deep(svg),
.teach-tree-search__clear-ico :deep(svg) {
  stroke-width: 2.85;
}

.teach-filter__input {
  display: block;
  flex: 1 1 auto;
  width: auto;
  /** 与输入区上限同比 ×5/6 */
  min-width: calc(140px * 2 / 3 * 3 / 4 * 4 / 3 * 5 / 6);
  box-sizing: border-box;
  border: none;
  /** 恒为清除钮预留宽度，叉显隐时输入区不再左移 */
  padding: 0 22px 0 0;
  height: 32px;
  line-height: 32px;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text);
  background: transparent;
  outline: none;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
}

.teach-filter__input:focus,
.teach-filter__input:focus-visible {
  outline: none;
  box-shadow: none;
}

.teach-filter__input::placeholder {
  color: #999;
}

/** 主题主色（与 teach-btn--primary 一致） */
.teach-filter__region-btn {
  flex-shrink: 0;
  margin: 0;
  height: var(--teach-filter-ctrl-height);
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition:
    filter 0.2s ease,
    transform 0.15s ease;
}

.teach-filter__region-btn:hover {
  filter: brightness(1.06);
}

.teach-filter__region-btn:active {
  transform: scale(0.99);
}

.teach-filter__region-btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.teach-table-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  /** 原 teach-panel 底部留白与安全区，改在滚动容器内，底边与面板齐平 */
  padding-bottom: calc(20px + max(24px, env(safe-area-inset-bottom)));
  overflow: auto;
  border-radius: 0;
  border: none;
  background: var(--color-surface, #fff);
}

/** 参考极简表：仅横线、无竖线、表头图标+文案 */
.teach-table {
  width: 100%;
  min-width: 0;
  flex-shrink: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
  table-layout: fixed;
}

/** 两列固定比例：区域自适应剩余宽 + 操作 140px，整表同一通栏不换行断列 */
.teach-table__col-region {
  width: auto;
  min-width: 0;
}

.teach-table__col-act {
  width: 140px;
}

.teach-table__th {
  text-align: left;
  /** 与 `.teach-table__td` 同上下内边距，表头行高与数据行一致 */
  padding: 6px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: -0.01em;
  line-height: 1.35;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  vertical-align: middle;
}

.teach-table__th-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.teach-table__th-inner--region {
  gap: 6px;
  margin-left: -15px;
}

.teach-table__th-ico {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
  opacity: 0.95;
}

/** 区域列：实心定位标 */
.teach-table__th-ico--region {
  width: calc(16px * 1.2 * 1.2 * 0.9 * 0.86);
  height: calc(16px * 1.2 * 1.2 * 0.9 * 0.86);
  color: #8e8b86;
  opacity: 1;
}

.teach-table__th-ico :deep(svg) {
  stroke-width: 1.75;
}

.teach-table__th-ico--region :deep(svg) {
  stroke: none;
  fill: currentColor;
}

/** 「操作」表头：实心图标，尺寸与色值同「区域」 */
.teach-table__th-ico--act {
  width: calc(16px * 1.2 * 1.2 * 0.9 * 0.86);
  height: calc(16px * 1.2 * 1.2 * 0.9 * 0.86);
  color: #8e8b86;
  opacity: 1;
}

.teach-table__th-ico--act :deep(svg) {
  stroke: none;
  fill: currentColor;
}

.teach-table__th--act {
  width: 140px;
  text-align: left;
  /** 操作列整体较默认单元格向右 8px（左 +8 / 右 −8，相对通栏 20px 内边距） */
  padding: 6px 12px 6px 28px;
}

.teach-table__th--act .teach-table__th-inner {
  justify-content: flex-start;
}

.teach-table__tr {
  transition: background 0.12s ease;
}

.teach-table tbody .teach-table__tr:hover {
  background: rgba(15, 23, 42, 0.02);
}

.teach-table__td {
  padding: 6px 20px;
  border: none;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: var(--color-text);
  line-height: 1.35;
  vertical-align: middle;
}

.teach-table__cell-region {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.teach-table__row-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #94a3b8;
}

.teach-table__row-ico :deep(svg) {
  stroke-width: 1.65;
}

.teach-table__region-name {
  font-weight: 500;
  color: var(--color-text-strong, var(--color-text));
}

.teach-table__td--act {
  text-align: left;
  padding: 6px 12px 6px 28px;
}

.teach-table__del {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.teach-table__del:hover {
  background: rgba(241, 65, 65, 0.08);
  color: #dc2626;
}

.teach-table__del:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 1px;
}

.teach-table__del-ico {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.teach-table__del-ico :deep(svg) {
  stroke-width: 1.85;
}

.teach-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 32px 24px;
  pointer-events: none;
}

/** 表头常驻时：空状态排在表格下方，不占满整格 */
.teach-empty.teach-empty--inline {
  position: static;
  inset: auto;
  flex: 1 1 auto;
  min-height: 200px;
  width: 100%;
  box-sizing: border-box;
  pointer-events: auto;
}

.teach-empty__art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 237px;
  height: 237px;
  flex-shrink: 0;
  margin-left: -10px;
}

.teach-empty__art-img {
  width: 237px;
  height: 237px;
  object-fit: contain;
  display: block;
}

.teach-empty__text {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #222222;
}

/** 筛选无结果：较默认放大两档、字重最粗、浅灰字 */
.teach-empty__text--filter-miss {
  font-size: 22px;
  font-weight: 900;
  color: #bdbdbd;
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
    margin-bottom: 0;
    padding: 16px 14px 18px 16px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 0;
  }

  .teach-panel {
    margin-left: 0;
    margin-top: 14px;
    flex: 1 1 auto;
    height: auto;
  }

  .teach-panel__toolbar {
    align-items: stretch;
  }

  .teach-filter--toolbar {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .teach-filter__toolbar-row {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
</style>
