<script setup lang="ts">
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'
import AdminLayout from './components/admin/AdminLayout.vue'
import AccountListPage from './components/admin/AccountListPage.vue'

const loggedIn = ref(false)
</script>

<template>
  <LoginPage v-if="!loggedIn" @logged-in="loggedIn = true" />
  <AdminLayout v-else @logout="loggedIn = false">
    <AccountListPage />
  </AdminLayout>
</template>
