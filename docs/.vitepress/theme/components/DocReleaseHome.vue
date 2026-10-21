<script setup>
import { withBase } from 'vitepress'

const guides = [
  { title: 'Пользователю', subtitle: 'Редакции, проверка и выпуск', text: 'Добавьте документ, передайте текст на проверку и соберите согласованный комплект.', href: '/user/' },
  { title: 'Администратору', subtitle: 'Доступ и обслуживание базы', text: 'Настройте пользователей и права, сохраните резервную копию и обновите приложение.', href: '/admin/' },
  { title: 'Установка', subtitle: 'От новой базы до первого входа', text: 'Подготовьте платформу, загрузите конфигурацию и начните работу в DocRelease.', href: '/deployment/' }
]
const steps = [
  { title: 'Добавьте редакцию', text: 'Сохраните сведения о тексте.', href: '/user/author' },
  { title: 'Согласуйте текст', text: 'Передайте его проверяющему.', href: '/user/transfer' },
  { title: 'Составьте план', text: 'Выберите документы для релиза.', href: '/user/plan' },
  { title: 'Проверьте готовность', text: 'Устраните причины неготовности.', href: '/user/readiness' },
  { title: 'Выпустите комплект', text: 'Зафиксируйте согласованный состав.', href: '/user/release' }
]
</script>

<template>
  <div class="docs-home">
    <section class="home-intro" aria-labelledby="home-title">
      <div class="home-intro-copy">
        <p class="home-eyebrow">DocRelease · Руководства</p>
        <h1 id="home-title">Подготовка и выпуск документации</h1>
        <p class="home-lead">Добавляйте редакции, передавайте тексты на проверку и выпускайте согласованные комплекты в DocRelease.</p>
        <div class="home-actions">
          <a class="home-button primary" :href="withBase('/quickstart')">Начать работу <span aria-hidden="true">→</span></a>
          <a class="home-button secondary" :href="withBase('/deployment/')">Установить DocRelease</a>
        </div>
        <p class="home-intro-note">Для автора, проверяющего и руководителя выпуска.</p>
      </div>
      <div class="home-brand-visual" aria-hidden="true">
        <img :src="withBase('/logo.svg')" width="156" height="156" alt="">
        <span class="home-brand-name">DocRelease</span>
        <span class="home-brand-caption">Документы. Проверка. Выпуск.</span>
      </div>
    </section>

    <section class="home-guides" aria-labelledby="guides-title">
      <div class="home-section-heading">
        <h2 id="guides-title">Выберите руководство</h2>
        <p>По вашей задаче</p>
      </div>
      <div class="guide-grid">
        <a v-for="guide in guides" :key="guide.href" class="guide-card" :href="withBase(guide.href)">
          <h3>{{ guide.title }} <span aria-hidden="true">↗</span></h3>
          <p class="guide-subtitle">{{ guide.subtitle }}</p>
          <p class="guide-description">{{ guide.text }}</p>
          <span class="guide-link">Открыть руководство <span aria-hidden="true">→</span></span>
        </a>
      </div>
    </section>

    <section class="home-workflow" aria-labelledby="workflow-title">
      <div class="home-section-heading">
        <h2 id="workflow-title">От текста до выпуска</h2>
        <a :href="withBase('/quickstart')">Весь порядок на примере <span aria-hidden="true">→</span></a>
      </div>
      <ol class="workflow-list">
        <li v-for="(step, index) in steps" :key="step.href">
          <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
          <a :href="withBase(step.href)">{{ step.title }}</a>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <nav class="home-reference" aria-label="Полезные разделы справочника">
      <span>Справочник</span>
      <a :href="withBase('/reference/roles')">Роли и доступ <span aria-hidden="true">→</span></a>
      <a :href="withBase('/reference/troubleshooting')">Сообщения и исправления <span aria-hidden="true">→</span></a>
      <a :href="withBase('/reference/glossary')">Термины <span aria-hidden="true">→</span></a>
    </nav>
  </div>
</template>
