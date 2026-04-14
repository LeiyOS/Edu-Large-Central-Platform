<script setup lang="ts">
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import AdminLayout from './components/admin/AdminLayout.vue'
import AccountListPage from './components/admin/AccountListPage.vue'
import OrganizationPage from './components/admin/OrganizationPage.vue'

const loggedIn = ref(false)
/** 与 AdminLayout 默认选中「组织管理」一致 */
const adminSidebarLabel = ref('组织管理')
</script>

<template>
  <LoginPage v-if="!loggedIn" @logged-in="loggedIn = true" />
  <AdminLayout v-else @logout="loggedIn = false" @sidebar-nav="adminSidebarLabel = $event">
    <AccountListPage v-if="adminSidebarLabel === '账号管理'" />
    <OrganizationPage v-else-if="adminSidebarLabel === '组织管理'" />
    <div v-else class="admin-placeholder">
      <p class="admin-placeholder__text">{{ adminSidebarLabel }}（示例路由占位）</p>
    </div>
  </AdminLayout>
</template>

<style>
.admin-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  font-family: var(--font-sans);
  color: var(--color-text-secondary);
}
.admin-placeholder__text {
  margin: 0;
  font-size: 15px;
}
</style>
