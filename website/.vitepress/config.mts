import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OryxOS',
  description: 'Enterprise-Controlled, Java-Native, Privately-Auditable Agent Runtime.',
  lang: 'en-US',
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

  themeConfig: {
    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'GitHub', link: 'https://github.com/liujp2015/OryxOS' },
    ],
    sidebar: [],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/liujp2015/OryxOS' },
    ],
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright © 2026 OryxOS Authors',
    },
  },
})
