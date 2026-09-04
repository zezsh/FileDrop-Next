/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  // 仅写非默认项：默认已是 semi: true、tabWidth: 2、trailingComma: 'all'、endOfLine: 'lf' 等
  singleQuote: true,
  printWidth: 100,

  // 自动排序 Tailwind class（官方插件）
  plugins: ['prettier-plugin-tailwindcss'],
  // Tailwind v4 没有 config 文件，插件需要指向入口样式表
  tailwindStylesheet: './app/globals.css',
  // 让 cn() / cva() 等工具函数中的 class 也参与排序
  tailwindFunctions: ['cn', 'cva', 'clsx', 'twMerge'],
};

export default config;
