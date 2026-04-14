import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
// 单文件交付：内联 JS/CSS，客户解压后可 file:// 或静态服务器打开。
// - removeViteModuleLoader 必须为 false：其正则会在巨型压缩代码上误截断，导致白屏。
// - 切勿把 <script type="module"> 改成普通 script：模块脚本推迟执行，#app 在 body 中已存在；
//   普通 script 在 head 内同步执行时 #app 尚未插入 DOM，挂载失败。
export default defineConfig({
  plugins: [
    vue(),
    viteSingleFile({
      removeViteModuleLoader: false,
    }),
  ],
})
