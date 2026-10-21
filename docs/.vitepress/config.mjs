import { defineConfig } from 'vitepress'
import fs from 'node:fs'
const sidebar = JSON.parse(fs.readFileSync(new URL('./sidebar.json', import.meta.url), 'utf8'))
const base = process.env.DOCS_BASE || '/'
if (!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(base)) throw new Error('DOCS_BASE must start and end with / and contain path segments only')

export default defineConfig({
  lang:'ru-RU', title:'DocRelease', description:'Руководства по работе с DocRelease: документы, проверка и выпуск комплекта',
  appearance:{ initialValue:'light' },
  base, cleanUrls:true, lastUpdated:false, ignoreDeadLinks:false,
  head:[['link',{rel:'icon',type:'image/svg+xml',href:base+'logo.svg'}],['meta',{name:'theme-color',content:'#ffdb35'}]],
  markdown:{ lineNumbers:true },
  themeConfig:{
    logo:'/logo.svg', siteTitle:'DocRelease',
    nav:[{"text": "Пользователю", "link": "/user/"}, {"text": "Администратору", "link": "/admin/"}, {"text": "Установка", "link": "/deployment/"}, {"text": "Справочник", "link": "/reference/roles"}],
    sidebar, outline:{level:[2,3],label:'На этой странице'},
    notFound:{title:'Страница не найдена',quote:'Выберите нужное руководство в меню или вернитесь на главную страницу.',linkLabel:'На главную страницу DocRelease',linkText:'На главную'},
    docFooter:{prev:'Назад',next:'Далее'}, sidebarMenuLabel:'Разделы', returnToTopLabel:'К началу',
    darkModeSwitchLabel:'Тема',lightModeSwitchTitle:'Светлая тема',darkModeSwitchTitle:'Тёмная тема',
    skipToContentLabel:'Перейти к содержанию',
    footer:{message:'DocRelease · Подготовка и выпуск документации'},
    search:{provider:'local',options:{
      translations:{button:{buttonText:'Поиск',buttonAriaLabel:'Поиск по документации'},modal:{
        noResultsText:'Ничего не найдено',resetButtonTitle:'Очистить поиск',backButtonTitle:'Закрыть поиск',
        displayDetails:'Показать подробности',footer:{selectText:'Открыть',navigateText:'Выбрать',closeText:'Закрыть'}}}
    }}
  }
})
