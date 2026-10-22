import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import DocContext from './components/DocContext.vue'
import DocReleaseHome from './components/DocReleaseHome.vue'
import DownloadPackage from './components/DownloadPackage.vue'
import './style.css'
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, { 'doc-before': () => h(DocContext) })
  },
  enhanceApp({ app }) {
    app.component('DocReleaseHome', DocReleaseHome)
    app.component('DownloadPackage', DownloadPackage)
  }
}
