<script setup>
import { withBase } from 'vitepress'
import kit from '../../../public/downloads/package-manifest.json'
const size = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(kit.bytes / 1024)
const sources = 'https://github.com/DmiBear/docrelease/tree/main/application/' + kit.app_version + '/configuration'
</script>

<template>
  <section class="download-package" aria-label="Комплект DocRelease для установки">
    <p class="package-title">DocRelease</p>
    <p class="package-details">ZIP · {{ size }} КБ · {{ kit.configuration_file_count }} файлов конфигурации · платформа 1С устанавливается отдельно</p>
    <div class="package-actions">
      <a class="package-download" :href="withBase('/downloads/' + kit.filename)" :download="kit.filename">Скачать DocRelease <span aria-hidden="true">↓</span></a>
      <a class="package-source" :href="sources">Посмотреть конфигурацию на GitHub</a>
    </div>
    <p class="package-integrity"><a :href="withBase('/downloads/package-manifest.json')">Состав комплекта</a> · <a :href="withBase('/downloads/SHA256SUMS.txt')">Контрольная сумма SHA-256</a></p>
  </section>
</template>
