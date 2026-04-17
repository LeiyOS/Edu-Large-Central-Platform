<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { showToast } from 'vant'
import wecomIconUrl from '../assets/WeCom.svg?url'
import logoUrl from '../assets/logo.png'
import brandBgUrl from '../assets/bg_img.png'

const emit = defineEmits<{
  'logged-in': []
}>()

/** 登录按钮与分段 Tab 选中文字 */
const LOGIN_BUTTON_COLOR = '#F10C0C'

const activeTab = ref(0)
const phone = ref('')
const password = ref('')
const showPassword = ref(false)

const submitBtnStyle = computed(() => {
  const filled = phone.value.trim() !== '' && password.value !== ''
  return {
    background: LOGIN_BUTTON_COLOR,
    borderColor: LOGIN_BUTTON_COLOR,
    opacity: filled ? 1 : 0.4,
  }
})

function onSubmitPassword() {
  if (!phone.value.trim() || !password.value) {
    showToast('请填写手机号和密码')
    return
  }
  showToast('登录成功')
  emit('logged-in')
}

function togglePasswordVisible() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="login-page">
    <img
      :src="logoUrl"
      alt="想象力大中台"
      class="login-panel__logo"
      decoding="async"
    />
    <section class="login-page__form-side">
      <div class="login-panel">
        <div class="login-panel__head">
          <h1 class="login-panel__title">登录</h1>
          <p class="login-panel__subtitle">想象力大中台</p>
        </div>

        <div class="login-panel__narrow">
          <div class="segmented" role="tablist" aria-label="登录方式">
            <div class="segmented__track">
              <span
                class="segmented__thumb"
                :style="{ transform: `translateX(${activeTab * 100}%)` }"
                aria-hidden="true"
              />
              <button
                type="button"
                role="tab"
                class="segmented__tab"
                :class="{ 'segmented__tab--active': activeTab === 0 }"
                :aria-selected="activeTab === 0"
                @click="activeTab = 0"
              >
                密码登录
              </button>
              <button
                type="button"
                role="tab"
                class="segmented__tab"
                :class="{ 'segmented__tab--active': activeTab === 1 }"
                :aria-selected="activeTab === 1"
                @click="activeTab = 1"
              >
                扫码登录
              </button>
            </div>
          </div>

          <div class="login-panel__tab-panels">
            <div v-show="activeTab === 0" role="tabpanel" :aria-hidden="activeTab !== 0" class="tab-pad">
              <van-form class="login-form" @submit="onSubmitPassword">
                <div class="field-block">
                  <label class="field-label" for="login-phone">手机号</label>
                  <div class="line-input-wrap">
                    <span class="line-input-wrap__icon" aria-hidden="true">
                      <Icon icon="lucide:phone" class="line-input-wrap__iconify" />
                    </span>
                    <van-field
                      id="login-phone"
                      v-model="phone"
                      name="phone"
                      placeholder="请输入手机号"
                      :border="false"
                      class="line-field line-field--in-wrap"
                    />
                  </div>
                </div>
                <div class="field-block">
                  <label class="field-label" for="login-password">密码</label>
                  <div class="line-input-wrap">
                    <span class="line-input-wrap__icon" aria-hidden="true">
                      <Icon icon="lucide:lock" class="line-input-wrap__iconify" />
                    </span>
                    <van-field
                      id="login-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      name="password"
                      placeholder="请输入密码"
                      :border="false"
                      class="line-field line-field--in-wrap"
                      autocomplete="current-password"
                      @click-right-icon="togglePasswordVisible"
                    >
                      <template #right-icon>
                        <Icon
                          :icon="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                          class="line-field__iconify-right"
                        />
                      </template>
                    </van-field>
                  </div>
                </div>

                <div class="submit-wrap">
                  <van-button
                    block
                    native-type="submit"
                    class="submit-btn"
                    :style="submitBtnStyle"
                  >
                    登录
                  </van-button>
                </div>
              </van-form>
            </div>

            <div
              v-show="activeTab === 1"
              role="tabpanel"
              :aria-hidden="activeTab !== 1"
              class="tab-pad qr-tab"
            >
              <p class="qr-tab__hint">
                <img :src="wecomIconUrl" alt="" class="qr-tab__hint-icon" decoding="async" />
                <span>企业微信扫码登录</span>
              </p>
              <div class="qr-frame" aria-hidden="true">
                <div class="qr-frame__inner" />
              </div>
              <p class="qr-tab__sub">请使用企业微信扫描二维码登录</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="login-page__brand-side" aria-hidden="true">
      <div class="brand-frame">
        <div
          class="brand-frame__grid"
          :style="{ backgroundImage: `url(${brandBgUrl})` }"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex: 1 1 auto;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  min-height: 100svh;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  color: #0f172a;
  background: #f8fafc;
}

/* 50% / 50% 分栏；左侧登录块 */
.login-page__form-side {
  /* 与 fixed 左上角 Logo（top 15px + height 40px）留出间距，避免标题与品牌条重叠 */
  --login-logo-zone: calc(
    15px + 40px + 1.75rem + env(safe-area-inset-top, 0px)
  );
  --form-side-pad-y: max(
    clamp(1.5rem, 3vw, 2.5rem),
    env(safe-area-inset-top, 0px),
    env(safe-area-inset-bottom, 0px)
  );
  position: relative;
  z-index: 1;
  flex: 0 0 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  min-height: 100svh;
  padding: max(var(--form-side-pad-y), var(--login-logo-zone))
    clamp(1.25rem, 4vw, 2.5rem)
    var(--form-side-pad-y);
  overflow-y: auto;
  background: #ffffff;
  box-sizing: border-box;
}

.login-panel {
  --line-border: #e8edf2;
  --line-border-focus: v-bind(LOGIN_BUTTON_COLOR);
  flex: 0 0 auto;
  width: 100%;
  max-width: 420px;
  padding: 0;
  box-sizing: border-box;
  text-align: left;
}

.login-panel__head {
  margin-bottom: 1.5rem;
}

.login-panel__title {
  margin: 0 0 calc(0.35rem + 6px);
  font-size: calc(clamp(1.75rem, 2.5vw, 2.125rem) - 2px);
  font-weight: 700;
  color: #020617;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.login-panel__subtitle {
  margin: 0;
  font-size: calc(0.9375rem + 2px);
  color: #64748b;
  line-height: 1.5;
}

.login-panel__narrow {
  width: 100%;
  box-sizing: border-box;
}

.segmented__track {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  background: #f1f5f9;
  border-radius: 14px;
  box-sizing: border-box;
}

.segmented__thumb {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  width: calc((100% - 8px) / 2);
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  transition: transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: none;
  z-index: 0;
}

.segmented {
  width: 100%;
  box-sizing: border-box;
}

.segmented__tab {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 9px 10px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-radius: 10px;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.segmented__tab:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.segmented__tab--active {
  color: v-bind(LOGIN_BUTTON_COLOR);
}

/* 右侧品牌图区域 */
.login-page__brand-side {
  flex: 0 0 50%;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(30px + env(safe-area-inset-top, 0px))
    calc(30px + env(safe-area-inset-right, 0px))
    calc(30px + env(safe-area-inset-bottom, 0px))
    calc(30px + env(safe-area-inset-left, 0px));
  background: #ffffff;
  box-sizing: border-box;
}

.brand-frame {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: none;
}

.brand-frame__grid {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 固定在视口左上角，叠加 safe-area */
.login-panel__logo {
  position: fixed;
  top: calc(15px + env(safe-area-inset-top, 0px));
  left: calc(17px + env(safe-area-inset-left, 0px));
  right: auto;
  z-index: 1000;
  display: block;
  height: 40px;
  width: auto;
  max-width: min(280px, calc(100vw - 50px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)));
  margin: 0;
  object-fit: contain;
  object-position: left center;
  pointer-events: none;
}

.login-panel__tab-panels {
  position: relative;
  width: 100%;
  min-height: 26rem;
  height: 30rem;
  flex-shrink: 0;
  box-sizing: border-box;
  overflow: visible;
}

.login-panel__tab-panels > .tab-pad {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.tab-pad {
  padding-top: calc(0.625rem + 16px);
  padding-bottom: 0.75rem;
}

.login-form {
  margin: 0;
  width: 100%;
  overflow: visible;
}

.field-block {
  margin-bottom: 0.625rem;
  width: 100%;
}

.login-form > .field-block:nth-child(2) {
  margin-top: 4px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.25rem;
  letter-spacing: 0.02em;
  line-height: 1.45;
  padding-top: 1px;
}

.line-input-wrap {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  padding: 4px 8px 5px 0;
  overflow: visible;
  border-bottom: 1px solid var(--line-border);
  transition: border-color 0.2s ease;
}

.line-input-wrap:focus-within {
  border-bottom-color: var(--line-border-focus);
}

.line-input-wrap__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  margin-right: 10px;
  color: #94a3b8;
  font-size: 18px;
}

.line-input-wrap__iconify {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.line-field {
  width: 100%;
  display: block;
  box-sizing: border-box;
  --van-cell-horizontal-padding: 0;
}

.line-field :deep(.van-cell) {
  width: 100%;
  max-width: 100%;
  padding: 0;
  overflow: visible;
  background: transparent;
}

.line-field :deep(.van-cell__value) {
  flex: 1;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.line-field :deep(.van-field) {
  width: 100%;
}

.line-field :deep(.van-field__body) {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  min-height: 44px;
  padding: 8px 4px 10px 0;
  background: transparent;
  border-radius: 0;
  border-bottom: 1px solid var(--line-border);
  transition: border-color 0.2s ease;
}

.line-field :deep(.van-field__body):focus-within {
  border-bottom-color: var(--line-border-focus);
}

.line-field.line-field--in-wrap {
  flex: 1;
  min-width: 0;
}

.line-field.line-field--in-wrap :deep(.van-cell__value) {
  text-align: left;
  overflow: visible;
}

.line-field.line-field--in-wrap :deep(.van-field__body) {
  min-height: 0;
  padding: 0;
  border-bottom: none;
  box-shadow: none;
  overflow: visible;
}

.line-field.line-field--in-wrap :deep(.van-field__body):focus-within {
  border-bottom: none;
  box-shadow: none;
}

.line-field :deep(.van-field__left-icon) {
  display: flex;
  align-items: center;
  align-self: center;
  margin-right: 10px;
  color: #94a3b8;
  flex-shrink: 0;
}

.line-field :deep(.van-field__right-icon) {
  display: flex;
  align-items: center;
  align-self: center;
  flex-shrink: 0;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}

.line-field.line-field--in-wrap :deep(.van-field__right-icon) {
  padding: 0 6px 0 14px;
  overflow: visible;
  transform: translateX(-2px);
}

.line-field__iconify-right {
  display: block;
  width: 20px;
  height: 20px;
}

.line-field :deep(.van-field__control) {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: #0f172a;
  line-height: 1.4;
}

.line-field :deep(.van-field__control::placeholder) {
  color: #94a3b8;
}

.submit-wrap {
  margin-top: calc(0.25rem + 30px + 4px);
}

.submit-btn {
  --van-button-radius: 14px;
  width: 100%;
  box-sizing: border-box;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: none;
  border-radius: 14px;
  box-shadow: none;
  transition:
    opacity 0.2s ease,
    filter 0.2s ease,
    transform 0.15s ease;
}

.submit-btn:hover {
  filter: brightness(1.05);
}

.submit-btn:active {
  transform: scale(0.99);
}

.submit-btn :deep(.van-button__text) {
  color: #ffffff;
}

.qr-tab {
  text-align: center;
  margin-top: 4px;
}

.qr-tab__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0 0 0.625rem;
  font-size: 15px;
  color: #64748b;
  line-height: 1.55;
}

.qr-tab__hint-icon {
  flex-shrink: 0;
  width: 21.6px;
  height: 21.6px;
  object-fit: contain;
  display: block;
}

.qr-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 16px;
  box-sizing: border-box;
}

.qr-frame__inner {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background:
    linear-gradient(90deg, #e2e8f0 50%, transparent 50%) 0 0 / 16px 16px,
    linear-gradient(#e2e8f0 50%, transparent 50%) 0 0 / 16px 16px;
  opacity: 0.9;
}

.qr-tab__sub {
  margin: 0.625rem 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.55;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    min-height: 100svh;
    min-height: 100dvh;
  }

  .login-page__form-side {
    --form-side-pad-y: max(
      1.25rem,
      env(safe-area-inset-top, 0px),
      env(safe-area-inset-bottom, 0px)
    );
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    flex-basis: auto;
    max-width: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: max(var(--form-side-pad-y), var(--login-logo-zone)) 1.25rem
      var(--form-side-pad-y);
    overflow-y: auto;
    z-index: 1;
  }

  .login-panel {
    max-width: none;
  }

  .login-panel__title {
    font-size: 20px;
  }

  .login-panel__tab-panels {
    min-height: 24rem;
    height: 28rem;
  }

  .login-page__brand-side {
    flex: none;
    min-height: min(360px, 42vh);
    padding: calc(30px + env(safe-area-inset-top, 0px))
      calc(30px + env(safe-area-inset-right, 0px))
      calc(30px + env(safe-area-inset-bottom, 0px))
      calc(30px + env(safe-area-inset-left, 0px));
  }

  .brand-frame {
    flex: 1 1 auto;
    min-height: 200px;
    border-radius: 24px;
  }
}
</style>
