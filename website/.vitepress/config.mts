import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OryxOS',
  description: 'Enterprise-Controlled, Java-Native, Privately-Auditable Agent Runtime.',
  base: '/OryxOS/',
  cleanUrls: true,
  appearance: 'force-light',

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap'
    }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { property: 'og:title', content: 'OryxOS — Enterprise Agent Runtime' }],
    ['meta', { property: 'og:description', content: 'A unified runtime for AI Agents in Java. Spring Boot 3.x, single binary, fully auditable.' }],
    ['meta', { property: 'og:type', content: 'website' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      description: 'Enterprise-Controlled, Java-Native, Privately-Auditable Agent Runtime.',
      themeConfig: {
        logo: { src: '/logo-mark.svg', alt: 'OryxOS' },
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Docs', link: '/docs/' },
          { text: 'GitHub', link: 'https://github.com/liujp2015/OryxOS' },
        ],
        sidebar: {
          '/docs/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Overview', link: '/docs/overview' },
              ],
            },
            {
              text: 'Documentation',
              items: [
                { text: 'Requirements', link: '/docs/demand' },
                { text: 'Architecture', link: '/docs/tech' },
                { text: 'AI Dev Guide', link: '/docs/ai-guide' },
              ],
            },
          ],
        },
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      description: '企业可控、Java 原生、私有可审计的 Agent 统一底座。',
      themeConfig: {
        logo: { src: '/logo-mark.svg', alt: 'OryxOS' },
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '文档', link: '/zh/docs/' },
          { text: 'GitHub', link: 'https://github.com/liujp2015/OryxOS' },
        ],
        sidebar: {
          '/zh/docs/': [
            {
              text: '快速开始',
              items: [
                { text: '概览', link: '/zh/docs/overview' },
              ],
            },
            {
              text: '文档',
              items: [
                { text: '需求分析', link: '/zh/docs/demand' },
                { text: '技术方案', link: '/zh/docs/tech' },
                { text: 'AI 开发指南', link: '/zh/docs/ai-guide' },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/liujp2015/OryxOS' },
    ],
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright © 2026 OryxOS Authors',
    },
  },
})