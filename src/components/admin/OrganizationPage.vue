<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, ref } from 'vue'
import { showToast } from 'vant'

/** 与 design.md / 账号列表一致 */
const DEPT_ROOT = '想象力教育科技'
const PRIMARY = '#F10C0C'

interface OrgNode {
  id: string
  name: string
  syncTime: string
  children?: OrgNode[]
}

const tree: OrgNode = {
  id: 'root',
  name: DEPT_ROOT,
  syncTime: '2026-04-01 10:00:00',
  children: [
    {
      id: 'rd',
      name: '研发中心',
      syncTime: '2026-04-01 10:00:00',
      children: [
        { id: 'rd-it', name: 'IT部门', syncTime: '2026-04-01 10:00:00' },
        { id: 'rd-pd', name: '产品部', syncTime: '2026-04-01 10:00:00' },
        { id: 'rd-gk', name: '中高考教研', syncTime: '2026-04-01 10:00:00' },
        { id: 'rd-en', name: '英语教研部', syncTime: '2026-04-01 10:00:00' },
      ],
    },
    { id: 'mkt', name: '市场中心', syncTime: '2026-04-01 10:00:00' },
    { id: 'ops', name: '运营中心', syncTime: '2026-04-01 10:00:00' },
    { id: 'biz', name: '业务中心', syncTime: '2026-04-01 10:00:00' },
    { id: 'exec', name: '总经办', syncTime: '2026-04-01 10:00:00' },
    { id: 'sup', name: '支持中心', syncTime: '2026-04-01 10:00:00' },
    { id: 'campus', name: '龙阳校区', syncTime: '2026-04-01 10:00:00' },
  ],
}

function collectBranchIds(node: OrgNode, out: Set<string>) {
  if (node.children?.length) {
    out.add(node.id)
    for (const c of node.children) collectBranchIds(c, out)
  }
}

const allBranchIds = computed(() => {
  const s = new Set<string>()
  collectBranchIds(tree, s)
  return s
})

/** 默认展开根 + 研发中心（对齐原型） */
const expandedIds = ref<Set<string>>(
  new Set(['root', 'rd']),
)

const deptFilter = ref('')

type FlatRow = {
  node: OrgNode
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

function buildFlat(node: OrgNode, depth: number, expanded: Set<string>, out: FlatRow[]) {
  const children = node.children ?? []
  const hasChildren = children.length > 0
  const isExpanded = expanded.has(node.id)
  out.push({ node, depth, hasChildren, isExpanded })
  if (hasChildren && isExpanded) {
    for (const c of children) {
      buildFlat(c, depth + 1, expanded, out)
    }
  }
}

const flatRows = computed(() => {
  const exp = expandedIds.value
  const out: FlatRow[] = []
  buildFlat(tree, 0, exp, out)
  return out.filter((row) => {
    const q = deptFilter.value.trim().toLowerCase()
    if (!q) return true
    return row.node.name.toLowerCase().includes(q)
  })
})

/**
 * 一级部门标签：统一浅灰底 + 灰阶线框图标（Lucide 描边，圆角路径、简约）。
 */
const DEPT_LABEL_BG = '#f1f5f9'
const DEPT_LABEL_ICON = '#64748b'

type DeptChip = { icon: string; fg: string; bg: string }

const DEPT_ROW_ICON: Record<string, string> = {
  rd: 'lucide:flask-conical',
  'rd-it': 'lucide:monitor',
  'rd-pd': 'lucide:package',
  'rd-gk': 'lucide:graduation-cap',
  'rd-en': 'lucide:languages',
  mkt: 'lucide:megaphone',
  ops: 'lucide:line-chart',
  biz: 'lucide:briefcase',
  exec: 'lucide:landmark',
  sup: 'lucide:headset',
  campus: 'lucide:school',
}

function deptRowChip(row: FlatRow): DeptChip {
  return {
    icon: DEPT_ROW_ICON[row.node.id] ?? 'lucide:folder',
    fg: DEPT_LABEL_ICON,
    bg: DEPT_LABEL_BG,
  }
}

function toggleRow(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function onTreeToggle(row: FlatRow) {
  if (row.hasChildren) toggleRow(row.node.id)
}

function expandAll() {
  expandedIds.value = new Set(allBranchIds.value)
}

function collapseAll() {
  expandedIds.value = new Set()
}

/** 全部可展开节点均已展开时为 true，按钮在「全部收起」与「全部展开」之间切换 */
const isOrgTreeFullyExpanded = computed(() => {
  const branches = allBranchIds.value
  if (branches.size === 0) return false
  const exp = expandedIds.value
  for (const id of branches) {
    if (!exp.has(id)) return false
  }
  return true
})

function onExpandCollapseToggle() {
  if (isOrgTreeFullyExpanded.value) collapseAll()
  else expandAll()
}

/** 手动同步：未同步时可点（主色）；同步完成后置灰禁用；同步过程中图标旋转 */
const isOrgManuallySynced = ref(false)
const isOrgSyncSpinning = ref(false)
let orgSyncFinishTimer: ReturnType<typeof setTimeout> | null = null

function onManualSync() {
  if (isOrgManuallySynced.value || isOrgSyncSpinning.value) return
  isOrgSyncSpinning.value = true
  showToast('已触发同步（示例）')
  orgSyncFinishTimer = window.setTimeout(() => {
    orgSyncFinishTimer = null
    isOrgSyncSpinning.value = false
    isOrgManuallySynced.value = true
  }, 1000)
}

onBeforeUnmount(() => {
  if (orgSyncFinishTimer !== null) {
    clearTimeout(orgSyncFinishTimer)
    orgSyncFinishTimer = null
  }
})

function resetFilter() {
  deptFilter.value = ''
}
</script>

<template>
  <div class="org-page">
    <div class="org-page__head">
      <h2 id="org-structure-title" class="org-panel__title org-page__head-title">
        组织架构
      </h2>
      <section class="org-filter" aria-label="筛选">
        <div class="org-filter__line">
          <label class="org-filter__sr-only" for="org-dept-filter">部门名称</label>
          <span class="org-filter__search-ico-wrap" aria-hidden="true">
            <Icon icon="lucide:search" class="org-filter__search-ico" />
          </span>
          <input
            id="org-dept-filter"
            v-model="deptFilter"
            type="search"
            class="org-filter__input"
            placeholder="请输入部门名称"
            autocomplete="off"
          />
        </div>
        <div class="org-filter__actions">
          <button type="button" class="org-btn org-btn--primary" @click="() => {}">查询</button>
          <button type="button" class="org-btn org-btn--outline" @click="resetFilter">重置</button>
        </div>
      </section>
    </div>

    <section class="org-panel" aria-labelledby="org-structure-title">
      <div class="org-panel__toolbar">
        <div class="org-panel__toolbar-left">
          <div class="org-panel__toolbar-expand">
            <button
              id="org-expand-toggle"
              type="button"
              class="org-expand-menu__trigger"
              :aria-expanded="isOrgTreeFullyExpanded"
              :aria-label="isOrgTreeFullyExpanded ? '全部收起' : '全部展开'"
              @click="onExpandCollapseToggle"
            >
              <Icon
                icon="lucide:layers"
                class="org-expand-menu__trigger-ico"
                aria-hidden="true"
              />
              展开/收起
            </button>
          </div>
        </div>
        <div class="org-panel__toolbar-right">
          <span class="org-panel__sync-meta">最新同步时间：2026-04-01</span>
          <button
            type="button"
            class="org-btn org-btn--ghost org-panel__sync-btn"
            :disabled="isOrgManuallySynced || isOrgSyncSpinning"
            :aria-busy="isOrgSyncSpinning"
            :aria-label="
              isOrgManuallySynced ? '已同步' : isOrgSyncSpinning ? '正在同步' : '手动同步'
            "
            @click="onManualSync"
          >
            <Icon
              icon="lucide:refresh-cw"
              class="org-btn__ico"
              :class="{ 'org-panel__sync-ico--spin': isOrgSyncSpinning }"
              aria-hidden="true"
            />
            {{ isOrgManuallySynced ? '已同步' : isOrgSyncSpinning ? '同步中…' : '手动同步' }}
          </button>
        </div>
      </div>

      <div class="org-table-wrap">
        <table class="org-table" role="treegrid">
          <thead>
            <tr>
              <th scope="col" class="org-table__th org-table__th--name">部门名称</th>
              <th scope="col" class="org-table__th org-table__th--time">同步时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in flatRows" :key="row.node.id" class="org-table__row">
              <td class="org-table__td">
                <div class="org-table__name-cell">
                  <span class="org-tree__indent" :style="{ width: `${row.depth * 20}px` }" />
                  <!-- 二级及以下不展示展开控件，与名称区对齐 -->
                  <button
                    v-if="row.depth < 2"
                    type="button"
                    class="org-tree__toggle"
                    :disabled="!row.hasChildren"
                    :aria-expanded="row.hasChildren ? row.isExpanded : undefined"
                    :aria-label="
                      row.hasChildren ? (row.isExpanded ? '收起' : '展开') : '无下级部门'
                    "
                    @click="onTreeToggle(row)"
                  >
                    <span aria-hidden="true">{{
                      row.hasChildren ? (row.isExpanded ? '−' : '+') : '+'
                    }}</span>
                  </button>
                  <span v-else class="org-tree__toggle-spacer" aria-hidden="true" />
                  <!-- 根节点仅文字；depth1 一级部门：图标 + 浅灰底；depth≥2：二级及以下仅文字 -->
                  <span
                    v-if="row.depth < 2 && row.node.id !== 'root'"
                    class="org-tree__label-chip"
                    :style="{ backgroundColor: deptRowChip(row).bg }"
                  >
                    <Icon
                      :icon="deptRowChip(row).icon"
                      class="org-tree__label-chip-ico"
                      :style="{ color: deptRowChip(row).fg }"
                      aria-hidden="true"
                    />
                    <span class="org-tree__name">{{ row.node.name }}</span>
                  </span>
                  <span v-else class="org-tree__name org-tree__name--plain">{{ row.node.name }}</span>
                </div>
              </td>
              <td class="org-table__td org-table__td--time">{{ row.node.syncTime }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.org-page {
  --primary: v-bind(PRIMARY);
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-family: var(--font-sans);
  color: var(--color-text);
}

.org-page__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 20px;
  width: 100%;
  min-width: 0;
}

.org-page__head-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

/* 覆盖后文 .org-panel__title 的默认字号，确保页头标题与“账号列表”一致 */
.org-panel__title.org-page__head-title {
  font-size: 1.25rem;
}

.org-page__head-title-ico {
  width: 1.35em;
  height: 1.35em;
  flex-shrink: 0;
  color: #94a3b8;
}

.org-page__head-title-ico :deep(svg) {
  display: block;
}

.org-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin: 0;
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
}

/**
 * 默认约为筛选行可用宽的 1/3；
 * 聚焦时增至约 1/2（原「再加 1/3」的加长量减半：约 33% → 50%）。
 */
.org-filter__line {
  position: relative;
  flex: 0 1 26.4%;
  max-width: 26.4%;
  min-width: 0;
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.0225);
  transition:
    flex-basis 0.28s ease,
    max-width 0.28s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.org-filter__line:hover:not(:focus-within) {
  box-shadow: 0 2px 14px rgba(15, 23, 42, 0.065);
}

/** 输入框或同排操作钮任一聚焦时拉长，避免点「查询」后条立刻缩回 */
.org-filter:focus-within .org-filter__line {
  flex: 0 1 40%;
  max-width: 40%;
}

.org-filter__line:focus-within {
  border-color: rgba(241, 12, 12, 0.38);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 10px 28px rgba(15, 23, 42, 0.038),
    0 0 0 2px rgba(241, 12, 12, 0.14);
}

.org-filter__sr-only {
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

.org-filter__search-ico-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.org-filter__search-ico {
  width: 18px;
  height: 18px;
  color: #475569;
}

.org-filter__search-ico :deep(svg) {
  stroke-width: 1.65;
}

.org-filter__input {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  padding: 10px 0;
  font: inherit;
  font-size: 15px;
  color: var(--color-text);
  background: transparent;
  outline: none;
}

.org-filter__input::placeholder {
  color: var(--color-placeholder);
}

.org-filter__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.org-btn {
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-radius: 8px;
  transition:
    filter 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.15s ease;
}

.org-btn:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.org-btn__ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.org-btn--primary {
  height: 40px;
  padding: 0 18px;
  border: none;
  background: var(--primary);
  color: #fff;
}

.org-btn--primary:hover {
  filter: brightness(1.06);
}

.org-btn--primary:active {
  transform: scale(0.99);
}

.org-btn--outline {
  height: 40px;
  padding: 0 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #0f172a;
}

.org-btn--outline:hover {
  background: rgba(15, 23, 42, 0.02);
}

.org-btn--ghost {
  height: 40px;
  padding: 0 14px;
  border: none;
  background: rgba(241, 12, 12, 0.1);
  color: var(--primary);
}

.org-btn--ghost:hover:not(:disabled) {
  background: rgba(241, 12, 12, 0.14);
}

.org-btn--ghost:disabled {
  background: rgba(15, 23, 42, 0.06);
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 1;
  filter: none;
}

.org-btn--ghost:disabled:hover {
  background: rgba(15, 23, 42, 0.06);
}

.org-btn--ghost:disabled .org-btn__ico {
  color: #94a3b8;
  opacity: 0.9;
}

/** 工具栏次要操作：低对比，不抢标题视觉 */
.org-btn--subtle {
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  gap: 5px;
}

.org-btn--subtle:hover {
  background: rgba(15, 23, 42, 0.04);
  color: #475569;
  border-color: rgba(15, 23, 42, 0.12);
}

.org-btn--subtle:active {
  transform: scale(0.99);
}

.org-btn--subtle .org-btn__ico {
  width: 16px;
  height: 16px;
  opacity: 0.9;
}

.org-panel {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  /** 避免裁剪标题旁下拉菜单 */
  overflow: visible;
  box-shadow: none;
}

.org-panel__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px 24px;
  padding: 18px 24px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}

.org-panel__toolbar-left {
  flex: 1 1 auto;
  min-width: 0;
}

.org-panel__toolbar-expand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.org-expand-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  margin: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.org-expand-menu__trigger:hover {
  background: rgba(15, 23, 42, 0.04);
  color: #475569;
  border-color: rgba(15, 23, 42, 0.12);
}

.org-expand-menu__trigger:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.org-expand-menu__trigger-ico {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.9;
}

.org-panel__toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  flex-shrink: 0;
}

/** 同步前后文案切换时保持与「手动同步」同宽 */
.org-panel__sync-btn {
  min-width: 109px;
  box-sizing: border-box;
}

.org-panel__sync-ico--spin :deep(svg) {
  display: block;
  transform-origin: center;
  animation: org-panel-sync-spin 0.7s linear infinite;
}

@keyframes org-panel-sync-spin {
  to {
    transform: rotate(360deg);
  }
}

.org-panel__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  min-width: 0;
}

.org-panel__sync-meta {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.org-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.org-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.org-table__th {
  text-align: left;
  padding: 12px 24px;
  font-size: 12px;
  font-weight: 400;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.org-table__th--time {
  text-align: right;
  width: 1%;
  min-width: 12.5rem;
  white-space: nowrap;
}

.org-table__row:hover {
  background: rgba(15, 23, 42, 0.025);
}

.org-table__td {
  padding: 14px 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.055);
  vertical-align: middle;
  color: var(--color-text);
}

.org-table__name-cell {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
}

.org-table__td--time {
  text-align: right;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.org-tree__indent {
  flex-shrink: 0;
  display: inline-block;
}

.org-tree__toggle {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin: 0 6px 0 0;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  color: #475569;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.org-tree__toggle:hover:not(:disabled) {
  background: rgba(15, 23, 42, 0.04);
}

.org-tree__toggle:disabled {
  opacity: 0.48;
  cursor: not-allowed;
  color: #94a3b8;
}

.org-tree__toggle:disabled:hover {
  background: #fff;
}

.org-tree__toggle-spacer {
  width: 22px;
  height: 22px;
  margin: 0 6px 0 0;
  flex-shrink: 0;
}

/** 图标 + 部门名共用一个浅色圆角底 */
.org-tree__label-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 32px;
  padding: 4px 14px 4px 10px;
  border-radius: 10px;
  box-sizing: border-box;
}

.org-tree__label-chip-ico {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/** Lucide 线框略细，视觉更轻 */
.org-tree__label-chip :deep(svg) {
  stroke-width: 1.65;
}

.org-tree__name {
  min-width: 0;
  font-weight: 400;
  font-size: 14px;
  color: #334155;
  line-height: 1.35;
}

.org-tree__name--plain {
  color: var(--color-text);
  font-weight: 400;
}
</style>
