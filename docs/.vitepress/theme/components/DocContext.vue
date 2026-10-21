<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { frontmatter, page } = useData()
const section = computed(() => page.value.relativePath === 'quickstart.md'
  ? { title: 'Порядок работы', href: '/quickstart' }
  : ({
  'DR-USER': { title: 'Руководство пользователя', href: '/user/' },
  'DR-ADMIN': { title: 'Руководство администратора', href: '/admin/' },
  'DR-INSTALL': { title: 'Установка', href: '/deployment/' }
}[frontmatter.value.doc_id] || { title: 'Справочник', href: '/reference/roles' }))
</script>

<template>
  <nav class="doc-context" aria-label="Путь к разделу">
    <a :href="withBase('/')">Главная</a>
    <span aria-hidden="true">/</span>
    <a :href="withBase(section.href)">{{ section.title }}</a>
  </nav>
</template>
