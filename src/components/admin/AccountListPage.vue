<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { showToast } from 'vant'

const PRIMARY = '#F10C0C'
const LINE = '#e8edf2'
/** 部门名称统一前缀（表格与筛选一致） */
const DEPT_PREFIX = '想象力教育科技'

type RowStatus = 'ok' | 'disabled' | 'left'

interface AccountRow {
  id: string
  account: string
  name: string
  phone: string
  dept: string
  entId: string
  deptLead: string
  role: string
  status: RowStatus
}

const filters = ref({
  staffId: '',
  name: '',
  phone: '',
  dept: '',
  role: '',
  status: '',
})

const allRows = ref<AccountRow[]>([
  {
    id: '100001',
    account: 'zhangsan',
    name: '张三',
    phone: '138****1234',
    dept: `${DEPT_PREFIX}教研部`,
    entId: 'E90821',
    deptLead: '李主任',
    role: '教师',
    status: 'ok',
  },
  {
    id: '100002',
    account: 'lisi',
    name: '李四',
    phone: '139****5678',
    dept: `${DEPT_PREFIX}教务部`,
    entId: 'E90821',
    deptLead: '王主管',
    role: '教务',
    status: 'ok',
  },
  {
    id: '100003',
    account: 'wangwu',
    name: '王五',
    phone: '136****9012',
    dept: `${DEPT_PREFIX}运营中心`,
    entId: 'E11203',
    deptLead: '赵经理',
    role: '管理员',
    status: 'disabled',
  },
  {
    id: '100004',
    account: 'zhaoliu',
    name: '赵六',
    phone: '137****3456',
    dept: `${DEPT_PREFIX}客服组`,
    entId: 'E11203',
    deptLead: '钱组长',
    role: '客服',
    status: 'left',
  },
  {
    id: '100005',
    account: 'sunqi',
    name: '孙七',
    phone: '135****7890',
    dept: `${DEPT_PREFIX}教研部`,
    entId: 'E90821',
    deptLead: '李主任',
    role: '讲师',
    status: 'ok',
  },
  {
    id: '100006',
    account: 'zhouba',
    name: '周八',
    phone: '134****2468',
    dept: `${DEPT_PREFIX}教务部`,
    entId: 'E90821',
    deptLead: '王主管',
    role: '讲师',
    status: 'ok',
  },
  {
    id: '100007',
    account: 'wujiu',
    name: '吴九',
    phone: '133****1357',
    dept: `${DEPT_PREFIX}运营中心`,
    entId: 'E11203',
    deptLead: '赵经理',
    role: '运营',
    status: 'ok',
  },
  {
    id: '100008',
    account: 'zhengshi',
    name: '郑十',
    phone: '132****9753',
    dept: `${DEPT_PREFIX}客服组`,
    entId: 'E11203',
    deptLead: '钱组长',
    role: '客服',
    status: 'disabled',
  },
  {
    id: '100009',
    account: 'feng11',
    name: '冯十一',
    phone: '131****8642',
    dept: `${DEPT_PREFIX}教研部`,
    entId: 'E90821',
    deptLead: '李主任',
    role: '教师',
    status: 'ok',
  },
  {
    id: '100010',
    account: 'chen12',
    name: '陈十二',
    phone: '130****7531',
    dept: `${DEPT_PREFIX}教务部`,
    entId: 'E90821',
    deptLead: '王主管',
    role: '教务',
    status: 'left',
  },
  {
    id: '100011',
    account: 'chu13',
    name: '褚十三',
    phone: '159****6420',
    dept: `${DEPT_PREFIX}运营中心`,
    entId: 'E11203',
    deptLead: '赵经理',
    role: '管理员',
    status: 'ok',
  },
  {
    id: '100012',
    account: 'wei14',
    name: '卫十四',
    phone: '158****5309',
    dept: `${DEPT_PREFIX}客服组`,
    entId: 'E11203',
    deptLead: '钱组长',
    role: '客服',
    status: 'ok',
  },
  {
    id: '100013',
    account: 'jiang15',
    name: '蒋十五',
    phone: '157****4198',
    dept: `${DEPT_PREFIX}教研部`,
    entId: 'E90821',
    deptLead: '李主任',
    role: '讲师',
    status: 'disabled',
  },
  {
    id: '100014',
    account: 'shen16',
    name: '沈十六',
    phone: '156****3087',
    dept: `${DEPT_PREFIX}教务部`,
    entId: 'E90821',
    deptLead: '王主管',
    role: '教师',
    status: 'ok',
  },
  {
    id: '100015',
    account: 'han17',
    name: '韩十七',
    phone: '155****1976',
    dept: `${DEPT_PREFIX}运营中心`,
    entId: 'E11203',
    deptLead: '赵经理',
    role: '运营',
    status: 'ok',
  },
])

const page = ref(1)
const pageSize = ref(20)
const total = computed(() => allRows.value.length)

function statusLabel(s: RowStatus) {
  const m: Record<RowStatus, string> = {
    ok: '正常',
    disabled: '已禁用',
    left: '已离职',
  }
  return m[s]
}

function onSearch() {
  page.value = 1
}

function resetFilters() {
  filters.value = {
    staffId: '',
    name: '',
    phone: '',
    dept: '',
    role: '',
    status: '',
  }
  deptMenuOpen.value = false
  filterRoleMenuOpen.value = false
  filterStatusMenuOpen.value = false
  page.value = 1
}

function pageSlice() {
  const start = (page.value - 1) * pageSize.value
  return allRows.value.slice(start, start + pageSize.value)
}

/** 展开后显示角色、状态 */
const filtersExpanded = ref(false)

function toggleFiltersExpanded() {
  filtersExpanded.value = !filtersExpanded.value
}

/** 新增账号弹窗 */
const showAddModal = ref(false)

const addForm = ref({
  account: '',
  employeeName: '',
  phoneNumber: '',
  roleGroup: '管理员组',
})

/** 新增账号 — 角色自定义下拉选项 */
const addRoleMenuItems = [
  '管理员组',
  '教师组',
  '教务组',
  '讲师组',
  '运营组',
  '客服组',
] as const

const roleGroupToRole: Record<string, string> = {
  管理员组: '管理员',
  教师组: '教师',
  教务组: '教务',
  讲师组: '讲师',
  运营组: '运营',
  客服组: '客服',
}

/** 筛选区 — 部门选项（与新增账号角色面板同一样式） */
const deptMenuItems: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: `${DEPT_PREFIX}教研部`, label: `${DEPT_PREFIX}教研部` },
  { value: `${DEPT_PREFIX}教务部`, label: `${DEPT_PREFIX}教务部` },
  { value: `${DEPT_PREFIX}运营中心`, label: `${DEPT_PREFIX}运营中心` },
  { value: `${DEPT_PREFIX}客服组`, label: `${DEPT_PREFIX}客服组` },
]

const deptMenuOpen = ref(false)
const deptSelectWrapRef = ref<HTMLElement | null>(null)
const deptTriggerRef = ref<HTMLButtonElement | null>(null)
const deptPanelRef = ref<HTMLElement | null>(null)
const deptPanelStyle = ref<Record<string, string>>({})

function applyPanelStyleBelowTrigger(
  triggerEl: HTMLElement | null,
  styleRef: typeof deptPanelStyle,
  panelEl: HTMLElement | null = null,
) {
  if (!triggerEl) {
    styleRef.value = {}
    return
  }
  const r = triggerEl.getBoundingClientRect()
  const gap = 8
  const triggerW = Math.round(r.width)
  const centerX = r.left + r.width / 2
  const margin = 12
  let leftPx = centerX
  if (panelEl) {
    const pw = panelEl.getBoundingClientRect().width
    if (pw > 0) {
      const half = pw / 2
      leftPx = Math.max(margin + half, Math.min(centerX, window.innerWidth - margin - half))
    }
  }
  styleRef.value = {
    position: 'fixed',
    top: `${Math.round(r.bottom + gap)}px`,
    left: `${Math.round(leftPx)}px`,
    transform: 'translateX(-50%)',
    /* 至少与触发器同宽；按内容加宽；水平以触发器中心对齐 */
    minWidth: `${triggerW}px`,
    width: 'max-content',
    maxWidth: 'calc(100vw - 24px)',
    boxSizing: 'border-box',
    zIndex: '10000',
  }
}

/** 首帧后面板宽可能未稳定，再跑一帧以便居中的同时做视口夹紧 */
function runPanelPositionSync(
  triggerEl: HTMLElement | null,
  styleRef: typeof deptPanelStyle,
  panelEl: HTMLElement | null,
) {
  const run = () => applyPanelStyleBelowTrigger(triggerEl, styleRef, panelEl)
  run()
  requestAnimationFrame(run)
}

const deptDisplayText = computed(() => {
  const d = filters.value.dept
  if (d === '') return '全部'
  return d
})

function updateDeptPanelPosition() {
  runPanelPositionSync(deptTriggerRef.value, deptPanelStyle, deptPanelRef.value)
}

async function toggleDeptMenu() {
  deptMenuOpen.value = !deptMenuOpen.value
  if (deptMenuOpen.value) {
    roleMenuOpen.value = false
    filterRoleMenuOpen.value = false
    filterStatusMenuOpen.value = false
    await nextTick()
    updateDeptPanelPosition()
  }
}

function selectDeptItem(value: string) {
  filters.value.dept = value
  deptMenuOpen.value = false
}

/** 筛选区 — 角色 / 状态（与部门同交互与面板样式） */
const filterRoleMenuItems: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: '教师', label: '教师' },
  { value: '教务', label: '教务' },
  { value: '管理员', label: '管理员' },
  { value: '客服', label: '客服' },
  { value: '讲师', label: '讲师' },
]

const filterStatusMenuItems: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'ok', label: '正常' },
  { value: 'disabled', label: '已禁用' },
  { value: 'left', label: '已离职' },
]

const filterRoleMenuOpen = ref(false)
const filterRoleWrapRef = ref<HTMLElement | null>(null)
const filterRoleTriggerRef = ref<HTMLButtonElement | null>(null)
const filterRolePanelRef = ref<HTMLElement | null>(null)
const filterRolePanelStyle = ref<Record<string, string>>({})

const filterStatusMenuOpen = ref(false)
const filterStatusWrapRef = ref<HTMLElement | null>(null)
const filterStatusTriggerRef = ref<HTMLButtonElement | null>(null)
const filterStatusPanelRef = ref<HTMLElement | null>(null)
const filterStatusPanelStyle = ref<Record<string, string>>({})

const filterRoleDisplayText = computed(() => {
  const v = filters.value.role
  if (v === '') return '全部'
  return v
})

const filterStatusDisplayText = computed(() => {
  const v = filters.value.status
  const hit = filterStatusMenuItems.find((i) => i.value === v)
  return hit?.label ?? '全部'
})

function updateFilterRolePanelPosition() {
  runPanelPositionSync(
    filterRoleTriggerRef.value,
    filterRolePanelStyle,
    filterRolePanelRef.value,
  )
}

function updateFilterStatusPanelPosition() {
  runPanelPositionSync(
    filterStatusTriggerRef.value,
    filterStatusPanelStyle,
    filterStatusPanelRef.value,
  )
}

async function toggleFilterRoleMenu() {
  filterRoleMenuOpen.value = !filterRoleMenuOpen.value
  if (filterRoleMenuOpen.value) {
    deptMenuOpen.value = false
    filterStatusMenuOpen.value = false
    roleMenuOpen.value = false
    await nextTick()
    updateFilterRolePanelPosition()
  }
}

async function toggleFilterStatusMenu() {
  filterStatusMenuOpen.value = !filterStatusMenuOpen.value
  if (filterStatusMenuOpen.value) {
    deptMenuOpen.value = false
    filterRoleMenuOpen.value = false
    roleMenuOpen.value = false
    await nextTick()
    updateFilterStatusPanelPosition()
  }
}

function selectFilterRoleItem(value: string) {
  filters.value.role = value
  filterRoleMenuOpen.value = false
}

function selectFilterStatusItem(value: string) {
  filters.value.status = value
  filterStatusMenuOpen.value = false
}

function resetAddForm() {
  addForm.value = {
    account: '',
    employeeName: '',
    phoneNumber: '',
    roleGroup: '管理员组',
  }
}

const roleMenuOpen = ref(false)
const roleSelectWrapRef = ref<HTMLElement | null>(null)
const roleTriggerRef = ref<HTMLButtonElement | null>(null)
const rolePanelRef = ref<HTMLElement | null>(null)

/** Teleport 到 body 时的 fixed 坐标（避免落在弹窗滚动层内被裁切） */
const rolePanelStyle = ref<Record<string, string>>({})

function updateRolePanelPosition() {
  runPanelPositionSync(roleTriggerRef.value, rolePanelStyle, rolePanelRef.value)
}

async function toggleRoleMenu() {
  roleMenuOpen.value = !roleMenuOpen.value
  if (roleMenuOpen.value) {
    deptMenuOpen.value = false
    filterRoleMenuOpen.value = false
    filterStatusMenuOpen.value = false
    await nextTick()
    updateRolePanelPosition()
  }
}

function selectRoleMenu(value: string) {
  addForm.value.roleGroup = value
  roleMenuOpen.value = false
}

function onGlobalDropdownDocClick(e: MouseEvent) {
  const el = e.target instanceof Node ? e.target : null
  if (!el) return
  if (roleMenuOpen.value) {
    if (!roleSelectWrapRef.value?.contains(el) && !rolePanelRef.value?.contains(el)) {
      roleMenuOpen.value = false
    }
  }
  if (deptMenuOpen.value) {
    if (!deptSelectWrapRef.value?.contains(el) && !deptPanelRef.value?.contains(el)) {
      deptMenuOpen.value = false
    }
  }
  if (filterRoleMenuOpen.value) {
    if (
      !filterRoleWrapRef.value?.contains(el) &&
      !filterRolePanelRef.value?.contains(el)
    ) {
      filterRoleMenuOpen.value = false
    }
  }
  if (filterStatusMenuOpen.value) {
    if (
      !filterStatusWrapRef.value?.contains(el) &&
      !filterStatusPanelRef.value?.contains(el)
    ) {
      filterStatusMenuOpen.value = false
    }
  }
}

function onDropdownViewportChange() {
  if (roleMenuOpen.value) updateRolePanelPosition()
  if (deptMenuOpen.value) updateDeptPanelPosition()
  if (filterRoleMenuOpen.value) updateFilterRolePanelPosition()
  if (filterStatusMenuOpen.value) updateFilterStatusPanelPosition()
}

onMounted(() => {
  document.addEventListener('click', onGlobalDropdownDocClick, true)
  window.addEventListener('scroll', onDropdownViewportChange, true)
  window.addEventListener('resize', onDropdownViewportChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalDropdownDocClick, true)
  window.removeEventListener('scroll', onDropdownViewportChange, true)
  window.removeEventListener('resize', onDropdownViewportChange)
})

watch(roleMenuOpen, async (open) => {
  if (open) {
    await nextTick()
    updateRolePanelPosition()
  }
})

watch(deptMenuOpen, async (open) => {
  if (open) {
    await nextTick()
    updateDeptPanelPosition()
  }
})

watch(filterRoleMenuOpen, async (open) => {
  if (open) {
    await nextTick()
    updateFilterRolePanelPosition()
  }
})

watch(filterStatusMenuOpen, async (open) => {
  if (open) {
    await nextTick()
    updateFilterStatusPanelPosition()
  }
})

watch(showAddModal, (open) => {
  if (open) {
    resetAddForm()
    deptMenuOpen.value = false
    filterRoleMenuOpen.value = false
    filterStatusMenuOpen.value = false
  } else {
    roleMenuOpen.value = false
  }
})

function openAddModal() {
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
}

/** 账号、员工姓名、手机号均填写后视为填完，确认按钮恢复不透明 */
const isAddFormFilled = computed(() => {
  const f = addForm.value
  return (
    f.account.trim() !== '' &&
    f.employeeName.trim() !== '' &&
    f.phoneNumber.trim() !== ''
  )
})

function onConfirmAdd() {
  const acc = addForm.value.account.trim()
  if (!acc) {
    showToast('请填写登录账号')
    return
  }
  if (!addForm.value.employeeName.trim()) {
    showToast('请填写员工姓名')
    return
  }
  if (!addForm.value.phoneNumber.trim()) {
    showToast('请填写手机号码')
    return
  }
  const nextNum =
    allRows.value.reduce((max, r) => {
      const n = parseInt(r.id, 10)
      return Number.isFinite(n) ? Math.max(max, n) : max
    }, 100000) + 1
  const role = roleGroupToRole[addForm.value.roleGroup] ?? '管理员'
  allRows.value = [
    ...allRows.value,
    {
      id: String(nextNum),
      account: acc,
      name: addForm.value.employeeName.trim() || '—',
      phone: addForm.value.phoneNumber.trim() || '—',
      dept: `${DEPT_PREFIX}教研部`,
      entId: 'E90821',
      deptLead: '—',
      role,
      status: 'ok',
    },
  ]
  showToast('添加成功')
  closeAddModal()
  page.value = 1
}

</script>

<template>
  <div class="account-page">
    <section class="account-hero" aria-label="筛选条件">
      <div class="account-filter">
        <div class="account-filter__leader">
          <div class="account-filter__leader-top">
            <div class="account-filter__fields account-filter__fields--main">
            <div class="filter-field">
              <div class="filter-field__line">
                <label class="filter-field__label" for="f-staff-id">员工号</label>
                <input
                  id="f-staff-id"
                  v-model="filters.staffId"
                  type="text"
                  class="filter-field__input"
                  placeholder="请输入"
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="filter-field">
              <div class="filter-field__line">
                <label class="filter-field__label" for="f-name">员工姓名</label>
                <input
                  id="f-name"
                  v-model="filters.name"
                  type="text"
                  class="filter-field__input"
                  placeholder="请输入"
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="filter-field">
              <div class="filter-field__line">
                <label class="filter-field__label" for="f-phone">手机号</label>
                <input
                  id="f-phone"
                  v-model="filters.phone"
                  type="text"
                  class="filter-field__input"
                  placeholder="请输入"
                  autocomplete="off"
                />
              </div>
            </div>
            <div class="filter-field">
              <div
                ref="deptSelectWrapRef"
                class="filter-field__line filter-field__line--select filter-field--filter-picker"
                :class="{ 'filter-field--filter-picker-open': deptMenuOpen }"
              >
                <label class="filter-field__label" for="f-dept-trigger">部门</label>
                <button
                  id="f-dept-trigger"
                  ref="deptTriggerRef"
                  type="button"
                  class="filter-field__select-trigger"
                  aria-haspopup="listbox"
                  :aria-expanded="deptMenuOpen"
                  aria-label="选择部门"
                  @click.stop="toggleDeptMenu"
                >
                  <span class="filter-field__select-trigger-text">{{ deptDisplayText }}</span>
                  <Icon
                    icon="lucide:chevron-down"
                    class="filter-field__select-trigger-chevron"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
            </div>

            <button
              type="button"
              class="account-filter__expand"
              :class="{ 'account-filter__expand--open': filtersExpanded }"
              :aria-expanded="filtersExpanded"
              aria-controls="account-filter-extra"
              :title="filtersExpanded ? '收起更多筛选' : '展开更多筛选'"
              @click="toggleFiltersExpanded"
            >
              <Icon
                icon="lucide:chevrons-down"
                class="account-filter__expand-icon"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            v-show="filtersExpanded"
            id="account-filter-extra"
            class="account-filter__expand-panel"
          >
            <div class="account-filter__fields account-filter__fields--extra">
              <div class="filter-field">
                <div
                  ref="filterRoleWrapRef"
                  class="filter-field__line filter-field__line--select filter-field--filter-picker"
                  :class="{ 'filter-field--filter-picker-open': filterRoleMenuOpen }"
                >
                  <label class="filter-field__label" for="f-role-trigger">角色</label>
                  <button
                    id="f-role-trigger"
                    ref="filterRoleTriggerRef"
                    type="button"
                    class="filter-field__select-trigger"
                    aria-haspopup="listbox"
                    :aria-expanded="filterRoleMenuOpen"
                    aria-label="选择角色"
                    @click.stop="toggleFilterRoleMenu"
                  >
                    <span class="filter-field__select-trigger-text">{{
                      filterRoleDisplayText
                    }}</span>
                    <Icon
                      icon="lucide:chevron-down"
                      class="filter-field__select-trigger-chevron"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
              <div class="filter-field">
                <div
                  ref="filterStatusWrapRef"
                  class="filter-field__line filter-field__line--select filter-field--filter-picker"
                  :class="{ 'filter-field--filter-picker-open': filterStatusMenuOpen }"
                >
                  <label class="filter-field__label" for="f-status-trigger">状态</label>
                  <button
                    id="f-status-trigger"
                    ref="filterStatusTriggerRef"
                    type="button"
                    class="filter-field__select-trigger"
                    aria-haspopup="listbox"
                    :aria-expanded="filterStatusMenuOpen"
                    aria-label="选择状态"
                    @click.stop="toggleFilterStatusMenu"
                  >
                    <span class="filter-field__select-trigger-text">{{
                      filterStatusDisplayText
                    }}</span>
                    <Icon
                      icon="lucide:chevron-down"
                      class="filter-field__select-trigger-chevron"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="account-filter__actions">
          <button type="button" class="btn-primary" @click="onSearch">查询</button>
          <button type="button" class="btn-outline" @click="resetFilters">重置</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-show="deptMenuOpen"
        ref="deptPanelRef"
        class="add-account-role-panel"
        role="listbox"
        aria-label="部门"
        :style="deptPanelStyle"
        @click.stop
      >
        <ul class="add-account-role-panel__list">
          <li
            v-for="item in deptMenuItems"
            :key="item.value === '' ? '__all' : item.value"
            role="option"
            :aria-selected="filters.dept === item.value"
            class="add-account-role-panel__option"
            :class="{
              'add-account-role-panel__option--active': filters.dept === item.value,
            }"
            @click="selectDeptItem(item.value)"
          >
            <div class="add-account-role-panel__option-text">
              <span class="add-account-role-panel__title">{{ item.label }}</span>
            </div>
            <Icon
              v-if="filters.dept === item.value"
              icon="lucide:check"
              class="add-account-role-panel__check"
              aria-hidden="true"
            />
          </li>
        </ul>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-show="filterRoleMenuOpen"
        ref="filterRolePanelRef"
        class="add-account-role-panel"
        role="listbox"
        aria-label="角色筛选"
        :style="filterRolePanelStyle"
        @click.stop
      >
        <ul class="add-account-role-panel__list">
          <li
            v-for="item in filterRoleMenuItems"
            :key="item.value === '' ? '__all' : item.value"
            role="option"
            :aria-selected="filters.role === item.value"
            class="add-account-role-panel__option"
            :class="{
              'add-account-role-panel__option--active': filters.role === item.value,
            }"
            @click="selectFilterRoleItem(item.value)"
          >
            <div class="add-account-role-panel__option-text">
              <span class="add-account-role-panel__title">{{ item.label }}</span>
            </div>
            <Icon
              v-if="filters.role === item.value"
              icon="lucide:check"
              class="add-account-role-panel__check"
              aria-hidden="true"
            />
          </li>
        </ul>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-show="filterStatusMenuOpen"
        ref="filterStatusPanelRef"
        class="add-account-role-panel"
        role="listbox"
        aria-label="状态筛选"
        :style="filterStatusPanelStyle"
        @click.stop
      >
        <ul class="add-account-role-panel__list">
          <li
            v-for="item in filterStatusMenuItems"
            :key="item.value === '' ? '__all' : item.value"
            role="option"
            :aria-selected="filters.status === item.value"
            class="add-account-role-panel__option"
            :class="{
              'add-account-role-panel__option--active': filters.status === item.value,
            }"
            @click="selectFilterStatusItem(item.value)"
          >
            <div class="add-account-role-panel__option-text">
              <span class="add-account-role-panel__title">{{ item.label }}</span>
            </div>
            <Icon
              v-if="filters.status === item.value"
              icon="lucide:check"
              class="add-account-role-panel__check"
              aria-hidden="true"
            />
          </li>
        </ul>
      </div>
    </Teleport>

    <section class="account-panel" aria-labelledby="account-list-title">
      <div class="account-panel__table-box">
        <div class="account-panel__head">
          <div class="account-panel__titles">
            <h2 id="account-list-title" class="account-panel__title">账号列表</h2>
            <p class="account-panel__note">新创建账号修改密码：88888888</p>
          </div>
          <button
            type="button"
            class="btn-primary btn-primary--ghost btn-primary--compact account-panel__add"
            @click="openAddModal"
          >
            <Icon icon="lucide:plus" class="btn-primary__icon" aria-hidden="true" />
            添加新账号
          </button>
        </div>

        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>员工号</th>
              <th>账号</th>
              <th>员工姓名</th>
              <th>手机号</th>
              <th>部门</th>
              <th>关联企业ID</th>
              <th>部门负责人</th>
              <th>角色</th>
              <th>状态</th>
              <th class="data-table__col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageSlice()" :key="row.id">
              <td class="data-table__mono">{{ row.id }}</td>
              <td class="data-table__accent">{{ row.account }}</td>
              <td class="data-table__accent">{{ row.name }}</td>
              <td>{{ row.phone }}</td>
              <td :title="row.dept">{{ row.dept }}</td>
              <td class="data-table__mono" :title="row.entId">{{ row.entId }}</td>
              <td>{{ row.deptLead }}</td>
              <td class="data-table__accent data-table__accent--medium">{{ row.role }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="{
                    'status-badge--ok': row.status === 'ok',
                    'status-badge--disabled': row.status === 'disabled',
                    'status-badge--left': row.status === 'left',
                  }"
                >
                  {{ statusLabel(row.status) }}
                </span>
              </td>
              <td class="data-table__cell-actions">
                <div class="data-table__actions">
                  <button type="button" class="link-action link-action--pill link-action--reset">
                    <Icon icon="lucide:key-round" class="link-action__ico" aria-hidden="true" />
                    重置密码
                  </button>
                  <button
                    type="button"
                    class="link-action link-action--pill"
                    :class="
                      row.status === 'disabled' ? 'link-action--enable' : 'link-action--disable'
                    "
                  >
                    <Icon
                      :icon="row.status === 'disabled' ? 'lucide:circle-check' : 'lucide:ban'"
                      class="link-action__ico"
                      aria-hidden="true"
                    />
                    {{ row.status === 'disabled' ? '启用' : '禁用' }}
                  </button>
                  <button
                    type="button"
                    class="link-action link-action--pill link-action--pill-icon link-action--edit"
                    aria-label="编辑"
                  >
                    <Icon icon="lucide:pencil" class="link-action__ico" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="link-action link-action--pill link-action--pill-icon link-action--delete"
                    aria-label="删除"
                  >
                    <Icon icon="lucide:trash-2" class="link-action__ico" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <div class="account-panel__footer">
          <van-pagination
            v-model="page"
            mode="multi"
            :total-items="total"
            :items-per-page="pageSize"
            :show-page-size="5"
            force-ellipses
            class="account-pagination"
          />
        </div>
      </div>
    </section>

    <van-popup
      v-model:show="showAddModal"
      round
      position="center"
      :overlay-style="{ background: 'rgba(15, 23, 42, 0.45)' }"
      class="add-account-popup"
      teleport="body"
    >
      <div
        class="add-account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
        @click.stop
      >
        <button
          type="button"
          class="add-account-modal__close"
          aria-label="关闭"
          @click="closeAddModal"
        >
          <Icon icon="lucide:x" class="add-account-modal__close-icon" aria-hidden="true" />
        </button>
        <div class="add-account-modal__intro">
          <h2 id="add-account-title" class="add-account-modal__title">新增账号</h2>
          <p class="add-account-form__hint">
            为确保企业微信正常登录，账号请使用企微绑定的手机号
          </p>
        </div>

        <form class="add-account-form" @submit.prevent="onConfirmAdd">
          <div class="add-account-form__row">
            <div class="add-account-float">
              <input
                id="add-modal-account"
                v-model="addForm.account"
                type="text"
                class="add-account-float__input"
                placeholder=" "
                autocomplete="username"
              />
              <label class="add-account-float__label" for="add-modal-account">
                账号<span class="add-account-float__req" aria-hidden="true">*</span>
              </label>
            </div>
          </div>

          <div class="add-account-form__row">
            <div class="add-account-float">
              <input
                id="add-modal-name"
                v-model="addForm.employeeName"
                type="text"
                class="add-account-float__input"
                placeholder=" "
                autocomplete="name"
              />
              <label class="add-account-float__label" for="add-modal-name">员工姓名</label>
            </div>
          </div>

          <div class="add-account-form__row">
            <div class="add-account-float">
              <input
                id="add-modal-phone"
                v-model="addForm.phoneNumber"
                type="tel"
                class="add-account-float__input"
                placeholder=" "
                autocomplete="tel"
              />
              <label class="add-account-float__label" for="add-modal-phone">手机号</label>
            </div>
          </div>

          <div class="add-account-form__row">
            <div
              ref="roleSelectWrapRef"
              class="add-account-float add-account-float--select add-account-float--role-picker"
              :class="{ 'add-account-float--role-picker-open': roleMenuOpen }"
            >
              <button
                id="add-modal-role"
                ref="roleTriggerRef"
                type="button"
                class="add-account-float__trigger"
                aria-haspopup="listbox"
                :aria-expanded="roleMenuOpen"
                @click.stop="toggleRoleMenu"
              >
                <span class="add-account-float__trigger-text">{{ addForm.roleGroup }}</span>
                <Icon
                  icon="lucide:chevron-down"
                  class="add-account-float__trigger-chevron"
                  aria-hidden="true"
                />
              </button>
              <label class="add-account-float__label" for="add-modal-role">角色</label>
            </div>
          </div>

          <Teleport to="body">
            <div
              v-show="roleMenuOpen"
              ref="rolePanelRef"
              class="add-account-role-panel"
              role="listbox"
              aria-label="角色列表"
              :style="rolePanelStyle"
              @click.stop
            >
              <ul class="add-account-role-panel__list">
                <li
                  v-for="opt in addRoleMenuItems"
                  :key="opt"
                  role="option"
                  :aria-selected="addForm.roleGroup === opt"
                  class="add-account-role-panel__option"
                  :class="{
                    'add-account-role-panel__option--active': addForm.roleGroup === opt,
                  }"
                  @click="selectRoleMenu(opt)"
                >
                  <div class="add-account-role-panel__option-text">
                    <span class="add-account-role-panel__title">{{ opt }}</span>
                  </div>
                  <Icon
                    v-if="addForm.roleGroup === opt"
                    icon="lucide:check"
                    class="add-account-role-panel__check"
                    aria-hidden="true"
                  />
                </li>
              </ul>
            </div>
          </Teleport>

          <div class="add-account-modal__actions">
            <button
              type="submit"
              class="add-account-modal__btn add-account-modal__btn--confirm"
              :class="{ 'add-account-modal__btn--confirm--dim': !isAddFormFilled }"
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.account-page {
  --line: v-bind(LINE);
  --primary: v-bind(PRIMARY);
  --hairline: rgba(15, 23, 42, 0.055);
  --hairline-faint: rgba(15, 23, 42, 0.04);
  /** 与 #fff 主区衬底融合；左右留白由 AdminLayout .admin-main 对称内边距承担；高度随内容撑开，由 .admin-main 统一纵向滚动 */
  width: 100%;
  min-width: 0;
  background: transparent;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}

.account-hero {
  flex-shrink: 0;
  margin: 0;
  padding: 4px 0 22px;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  box-sizing: border-box;
}

.account-filter {
  margin-bottom: 0;
  /** 单列最小宽度（略小以减少过早换行）；与 leader 内 min-width 联动 */
  --filter-col-min: 84px;
  --filter-col-gap: 12px;
  --filter-expand-w: 46px;
  --filter-leader-gap: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: var(--filter-leader-gap);
  row-gap: var(--filter-leader-gap);
}

/**
 * 左列：首行（四格 + 展开）、展开后第二行与首行栅格同宽（扣除展开钮占位）。
 * 右列：查询 / 重置；窄屏见 @media。
 */
.account-filter__leader {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--filter-leader-gap);
  min-width: calc(
    4 * var(--filter-col-min) + 3 * var(--filter-col-gap) + var(--filter-leader-gap) +
      var(--filter-expand-w)
  );
}

.account-filter__leader-top {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--filter-leader-gap);
  min-width: 0;
}

/** 与 .account-filter__fields--main 可用宽度一致，保证「角色/状态」列宽与「员工号」等对齐 */
.account-filter__expand-panel {
  width: calc(100% - var(--filter-expand-w) - var(--filter-leader-gap));
  max-width: 100%;
  align-self: flex-start;
  box-sizing: border-box;
}

.account-filter__fields--main {
  flex: 1 1 0;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(var(--filter-col-min), 1fr));
  gap: 12px var(--filter-col-gap);
  align-items: start;
}

.account-filter__fields--main > .filter-field {
  min-width: 0;
}

.account-filter__expand {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  background: #fff;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.022),
    0 8px 22px rgba(15, 23, 42, 0.028);
  /** 与 .filter-field__input::placeholder 一致（--color-placeholder） */
  color: var(--color-placeholder);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.account-filter__expand:hover {
  border-color: rgba(15, 23, 42, 0.1);
  color: #0f172a;
}

.account-filter__expand:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.account-filter__expand-icon {
  width: 20px;
  height: 20px;
  color: inherit;
  transition: transform 0.22s ease;
}

.account-filter__expand :deep(svg) {
  color: inherit;
}

.account-filter__expand--open .account-filter__expand-icon {
  transform: rotate(180deg);
}

.account-filter__actions {
  grid-column: 2;
  grid-row: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

/* 查询 / 重置：略收窄以减少与 leader 并排时的总宽度 */
.account-filter__actions .btn-primary,
.account-filter__actions .btn-outline {
  box-sizing: border-box;
  height: 46px;
  min-width: 56px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 8px;
}

.account-filter__fields--extra {
  display: grid;
  grid-template-columns: repeat(4, minmax(var(--filter-col-min), 1fr));
  gap: 12px var(--filter-col-gap);
  align-items: start;
  width: 100%;
}

.account-filter__fields--extra .filter-field {
  grid-column: span 1;
}

@media (max-width: 480px) {
  .account-filter {
    grid-template-columns: 1fr;
  }

  .account-filter__leader {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
  }

  .account-filter__actions {
    grid-column: 1;
    grid-row: 2;
    justify-content: stretch;
  }

  .account-filter__fields--main {
    grid-template-columns: 1fr;
  }

  .account-filter__expand-panel {
    width: 100%;
  }

  .account-filter__fields--extra {
    grid-template-columns: 1fr;
  }

  .account-filter__actions .btn-primary,
  .account-filter__actions .btn-outline {
    flex: 1 1 auto;
    min-width: 0;
  }
}

.filter-field__label {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin: 0 12px 0 0;
  /* 与 .filter-field__input / __select 同为 15px，避免上下排标题与控件视觉不一致 */
  font-size: 15px;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.02em;
  line-height: 1.4;
  cursor: pointer;
  user-select: none;
}

.filter-field__line {
  min-height: 46px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.022),
    0 8px 22px rgba(15, 23, 42, 0.028);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.filter-field__line:focus-within {
  background: #fff;
  border-color: rgba(241, 12, 12, 0.38);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 10px 28px rgba(15, 23, 42, 0.038),
    0 0 0 2px rgba(241, 12, 12, 0.14);
}

.filter-field__input {
  flex: 1 1 auto;
  align-self: center;
  min-width: 0;
  width: 100%;
  border: none;
  margin: 0;
  padding: 10px 0;
  font: inherit;
  font-size: 15px;
  color: var(--color-text);
  background: transparent;
  outline: none;
  line-height: 1.4;
}

.filter-field__input::placeholder {
  color: var(--color-placeholder);
  /* 与 .filter-field__select 展示字一致，避免部分浏览器默认缩小 placeholder */
  font-size: 15px;
  line-height: 1.4;
  font-weight: 400;
  font-family: inherit;
  opacity: 1;
}

.filter-field__select {
  flex: 1 1 auto;
  align-self: center;
  min-width: 0;
  width: 100%;
  border: none;
  margin: 0;
  padding: 10px 24px 10px 0;
  font: inherit;
  font-size: 15px;
  color: var(--color-text);
  background: transparent;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 2px center;
}

.filter-field__select-trigger {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  align-self: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  margin: 0;
  padding: 10px 0;
  border: none;
  font: inherit;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-text);
  background: transparent;
  cursor: pointer;
  text-align: left;
  outline: none;
}

.filter-field__select-trigger:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.filter-field__select-trigger-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-field__select-trigger-chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.filter-field--filter-picker.filter-field--filter-picker-open {
  border-color: rgba(241, 12, 12, 0.38);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 10px 28px rgba(15, 23, 42, 0.038),
    0 0 0 2px rgba(241, 12, 12, 0.14);
}

.filter-field--filter-picker-open .filter-field__select-trigger-chevron {
  transform: rotate(180deg);
}

.filter-field__line--select:focus-within {
  border-color: rgba(241, 12, 12, 0.38);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 10px 28px rgba(15, 23, 42, 0.038),
    0 0 0 2px rgba(241, 12, 12, 0.14);
}

.btn-primary {
  --van-button-radius: 14px;
  margin: 0;
  padding: 0 22px;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    filter 0.2s ease,
    transform 0.15s ease,
    opacity 0.2s ease;
}

.btn-primary:hover {
  filter: brightness(1.06);
}

.btn-primary:active {
  transform: scale(0.99);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.btn-primary--ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  background: rgba(241, 12, 12, 0.1);
  color: var(--primary);
  border: none;
}

.btn-primary--ghost:hover {
  background: rgba(241, 12, 12, 0.12);
  filter: none;
}

.btn-primary--compact {
  height: 42px;
  padding: 0 18px;
  font-size: 14px;
}

.btn-primary__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-outline {
  margin: 0;
  padding: 0 22px;
  height: 44px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.btn-outline:hover {
  background: rgba(15, 23, 42, 0.02);
  border-color: rgba(15, 23, 42, 0.09);
}

.btn-outline:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.account-panel {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  margin-top: 0;
  background: transparent;
  border-radius: 0;
  padding: 0;
  border: none;
  box-shadow: none;
  box-sizing: border-box;
  overflow: visible;
}

.account-panel__head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px 24px;
  margin: 0;
  padding: 20px 24px 18px;
  border-bottom: 1px solid var(--hairline-faint);
}

.account-panel__titles {
  min-width: 0;
  flex: 1 1 auto;
}

.account-panel__add {
  flex-shrink: 0;
}

.account-panel__table-box {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--hairline-faint);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  box-sizing: border-box;
}

.account-panel__table-box .table-wrap {
  padding: 0 24px;
}

.account-panel__title {
  margin: 0 0 6px;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.account-panel__note {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.5;
}

.data-table__accent {
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.data-table__accent--medium {
  font-weight: 600;
}

.table-wrap {
  flex: 0 0 auto;
  margin: 0;
  overflow-x: hidden;
  overflow-y: visible;
}

.data-table {
  width: 100%;
  max-width: 100%;
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

/*
 * 普通列：1% + max-width 压低占位，剩余宽度让给部门 / 企业 ID / 状态 / 操作。
 * 部门、关联企业 ID：不设固定列宽，短内容时列随文字收窄；max-width 仍大于普通列，长文案可占更多空间。
 */
.data-table thead th:nth-child(1),
.data-table thead th:nth-child(2),
.data-table thead th:nth-child(3),
.data-table thead th:nth-child(4),
.data-table thead th:nth-child(7),
.data-table thead th:nth-child(8),
.data-table tbody td:nth-child(1),
.data-table tbody td:nth-child(2),
.data-table tbody td:nth-child(3),
.data-table tbody td:nth-child(4),
.data-table tbody td:nth-child(7),
.data-table tbody td:nth-child(8) {
  width: 1%;
  max-width: 11%;
}

.data-table thead th:nth-child(5),
.data-table thead th:nth-child(6),
.data-table tbody td:nth-child(5),
.data-table tbody td:nth-child(6) {
  width: max-content;
  max-width: min(32%, 380px);
}

.data-table thead th:nth-child(9),
.data-table tbody td:nth-child(9) {
  width: auto;
  white-space: nowrap;
}

.data-table thead th:nth-child(-n + 9),
.data-table tbody td:nth-child(-n + 9) {
  min-width: 0;
}

.data-table th {
  text-align: left;
  padding: 12px 12px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.03em;
  background: transparent;
  border-bottom: 1px solid var(--hairline-faint);
  white-space: nowrap;
}

.data-table th:first-child {
  padding-left: 0;
}

.data-table th:last-child {
  padding-right: 0;
}

.data-table td {
  padding: 14px 12px 16px;
  border-bottom: 1px solid var(--hairline-faint);
  color: var(--color-text);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr {
  transition: background 0.15s ease;
}

.data-table tbody tr:hover {
  background: rgba(15, 23, 42, 0.02);
}

.data-table td:first-child {
  padding-left: 0;
}

.data-table td:last-child {
  padding-right: 0;
}

/* 部门与关联企业 ID 之间：原两侧各 12px，改为各 8px，总间距缩短 1/3 */
.data-table thead th:nth-child(5),
.data-table tbody td:nth-child(5) {
  padding-right: 8px;
}

.data-table thead th:nth-child(6),
.data-table tbody td:nth-child(6) {
  padding-left: 8px;
}

/* 前 8 列单行省略；第 9 列为状态徽章，不参与截断 */
.data-table tbody td:nth-child(-n + 8) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-table__mono {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  color: #64748b;
  font-weight: 500;
}

/* 操作列：td 保持 table-cell，避免 display:flex 打断行分割线；flex 仅用于内层 */
.data-table .data-table__col-actions,
.data-table .data-table__cell-actions {
  width: 1%;
  max-width: max-content;
  min-width: min-content;
  padding-right: 0;
  padding-left: 12px;
  box-sizing: border-box;
  white-space: nowrap;
  vertical-align: middle;
}

.data-table .data-table__col-actions {
  text-align: left;
}

.data-table__actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  line-height: 1.6;
  width: 100%;
}

.link-action {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

.link-action:hover {
  opacity: 0.85;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-action:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
  border-radius: 4px;
}

.link-action--pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  opacity: 1;
  transition:
    filter 0.15s ease,
    opacity 0.15s ease;
}

.link-action--pill:hover {
  opacity: 1;
  filter: brightness(0.96);
  text-decoration: none;
}

.link-action--pill:focus-visible {
  border-radius: 10px;
}

.link-action__ico {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.link-action--pill.link-action--pill-icon {
  gap: 0;
  padding: 8px;
  justify-content: center;
}

.link-action--pill-icon .link-action__ico {
  width: 16px;
  height: 16px;
}

/* 重置密码：浅蓝底 + 深蓝图标/字 */
.link-action--reset {
  background: rgba(59, 130, 246, 0.16);
  color: #1e40af;
}

.link-action--reset .link-action__ico {
  color: #1e3a8a;
}

/* 禁用：浅琥珀 */
.link-action--disable {
  background: rgba(245, 158, 11, 0.2);
  color: #92400e;
}

.link-action--disable .link-action__ico {
  color: #78350f;
}

/* 启用：浅绿 */
.link-action--enable {
  background: rgba(16, 185, 129, 0.18);
  color: #047857;
}

.link-action--enable .link-action__ico {
  color: #065f46;
}

/* 编辑：浅青绿 */
.link-action--edit {
  background: rgba(20, 184, 166, 0.18);
  color: #0f766e;
}

.link-action--edit .link-action__ico {
  color: #115e59;
}

/* 删除：浅红 */
.link-action--delete {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

.link-action--delete .link-action__ico {
  color: #991b1b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  border-radius: 10px;
  border: none;
}

.status-badge--ok {
  color: #166534;
  background: rgba(34, 197, 94, 0.12);
}

.status-badge--disabled {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.1);
}

.status-badge--left {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.12);
}

.account-panel__footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 14px 24px 16px;
  margin: 0;
  margin-top: auto;
}

.account-pagination :deep(.van-pagination__items) {
  gap: 4px;
  align-items: center;
}

/* 拆开默认「连成一整条」的布局与描边，每项单独圆角 */
.account-pagination :deep(.van-pagination__item) {
  flex: 0 0 auto;
  min-width: var(--van-pagination-item-width, 36px);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-sizing: border-box;
  color: var(--primary);
}

.account-pagination :deep(.van-pagination__item::after) {
  display: none !important;
}

.account-pagination :deep(.van-pagination__item--prev),
.account-pagination :deep(.van-pagination__item--next) {
  flex: 0 0 auto;
  padding: 0 14px;
}

.account-pagination :deep(.van-pagination__item--active) {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.account-pagination :deep(.van-pagination__item--disabled) {
  border-color: rgba(15, 23, 42, 0.06);
  color: #94a3b8;
}

.account-pagination :deep(.van-pagination__item button) {
  color: inherit;
}

/* 覆盖 Vant 默认 :active 白字，与主题红字/红底一致 */
.account-pagination
  :deep(
    .van-pagination__item:active:not(.van-pagination__item--active):not(.van-pagination__item--disabled)
  ) {
  color: #fff;
  background-color: var(--primary);
}

/* —— 新增账号弹窗（与筛选区、主色一致） —— */
.add-account-popup {
  width: min(480px, calc(100vw - 32px));
  max-width: 100%;
  box-sizing: border-box;
}

.add-account-modal {
  position: relative;
  padding-block: 24px 26px;
  padding-inline: 24px;
  box-sizing: border-box;
  font-family: var(--font-sans);
  overflow: visible;
}

.add-account-modal__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  -webkit-appearance: none;
  appearance: none;
}

.add-account-modal__close:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

.add-account-modal__close:focus {
  outline: none;
}

.add-account-modal__close:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.add-account-modal__close-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.add-account-modal__intro {
  width: 100%;
  margin: 0 0 18px;
  padding-right: 36px;
  text-align: left;
  box-sizing: border-box;
}

.add-account-modal__title {
  margin: 0 0 4px;
  padding: 0;
  font-size: 24px;
  font-weight: 500;
  color: var(--color-text-strong);
  text-align: left;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.add-account-form {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.add-account-form__row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.add-account-form__hint {
  margin: 0;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.5;
  text-align: left;
}

/* 浮动标签输入（聚焦或已填写时标签缩小并移至顶部） */
.add-account-float {
  position: relative;
  width: 100%;
  min-height: 57px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.022),
    0 8px 22px rgba(15, 23, 42, 0.028);
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.add-account-float:focus-within {
  border-color: rgba(241, 12, 12, 0.38);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.03),
    0 10px 28px rgba(15, 23, 42, 0.038),
    0 0 0 2px rgba(241, 12, 12, 0.14);
}

.add-account-float__input {
  display: block;
  width: 100%;
  margin: 0;
  padding: 24px 14px 10px;
  border: none;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  background: transparent;
  outline: none;
  line-height: 1.4;
  box-sizing: border-box;
  border-radius: 12px;
}

.add-account-float__input::placeholder {
  opacity: 0;
}

.add-account-float__label {
  position: absolute;
  left: 14px;
  right: 2rem;
  top: 50%;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.02em;
  line-height: 1.25;
  pointer-events: none;
  transform: translateY(-50%);
  transform-origin: left center;
  transition:
    top 0.2s ease,
    font-size 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.add-account-float:focus-within .add-account-float__label,
.add-account-float__input:not(:placeholder-shown) + .add-account-float__label {
  top: 0.5rem;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  transform: translateY(0);
}

.add-account-float__req {
  color: var(--color-primary);
  font-weight: 700;
}

/* 下拉：始终有选中值，标签保持顶部态 */
.add-account-float--select {
  min-height: 57px;
}

.add-account-float--role-picker {
  position: relative;
  overflow: visible;
  z-index: 1;
}

.add-account-float--role-picker-open {
  z-index: 20;
}

.add-account-float__trigger {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 24px 12px 10px 14px;
  border: none;
  font: inherit;
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  background: transparent;
  outline: none;
  cursor: pointer;
  line-height: 1.4;
  box-sizing: border-box;
  border-radius: 12px;
  text-align: left;
  -webkit-appearance: none;
  appearance: none;
}

.add-account-float__trigger:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.add-account-float__trigger-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-account-float__trigger-chevron {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.add-account-float--role-picker-open .add-account-float__trigger-chevron {
  transform: rotate(180deg);
}

.add-account-float--select .add-account-float__label {
  top: 0.5rem;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  transform: translateY(0);
}

/* 角色自定义下拉面板（Teleport + fixed，位置由 rolePanelStyle 控制） */
.add-account-role-panel {
  padding: 0;
  margin: 0;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  box-shadow:
    0 4px 6px rgba(15, 23, 42, 0.04),
    0 12px 28px rgba(15, 23, 42, 0.12);
  box-sizing: border-box;
  max-height: min(340px, 70vh);
  overflow-x: auto;
  overflow-y: auto;
}

.add-account-role-panel__list {
  list-style: none;
  margin: 0;
  padding: 6px 8px;
}

.add-account-role-panel__option {
  display: grid;
  grid-template-columns: auto 18px;
  align-items: center;
  column-gap: 10px;
  margin: 0;
  padding: 10px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s ease;
}

.add-account-role-panel__option:hover {
  background: rgba(15, 23, 42, 0.04);
}

.add-account-role-panel__option-text {
  min-width: min-content;
}

.add-account-role-panel__title {
  font-size: 15px;
  font-weight: 400;
  color: #0f172a;
  letter-spacing: -0.01em;
  line-height: 1.35;
  white-space: nowrap;
}

.add-account-role-panel__check {
  width: 18px;
  height: 18px;
  justify-self: end;
  color: #475569;
}

.add-account-modal__actions {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: stretch;
  width: 100%;
  margin-top: 8px;
  padding-top: 2px;
  box-sizing: border-box;
}

.add-account-modal__btn {
  width: 100%;
  flex: 1 1 auto;
  min-width: 0;
  height: 44px;
  margin: 0;
  padding: 0 18px;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: visible;
  transition:
    filter 0.2s ease,
    transform 0.15s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.add-account-modal__btn--confirm {
  border: 1px solid transparent;
  background-color: var(--color-primary);
  color: #fff;
}

.add-account-modal__btn--confirm:hover {
  filter: brightness(1.06);
}

.add-account-modal__btn--confirm--dim {
  opacity: 0.4;
}

.add-account-modal__btn--confirm--dim:hover {
  filter: none;
}

.add-account-modal__btn--confirm:active {
  transform: scale(0.99);
}

.add-account-modal__btn--confirm:focus {
  outline: none;
}

.add-account-modal__btn--confirm:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

</style>
