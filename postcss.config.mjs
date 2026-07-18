// 把 Tailwind v4 输出的 CSS cascade layers（@layer）展平为等价的普通规则，
// 兼容不支持 @layer 的旧 WebView 内核（如百度 App 的 X5/T7 内核，Chromium < 99），
// 否则整段 @layer 会被旧内核忽略、导致页面裸样式。
export default {
  plugins: {
    '@csstools/postcss-cascade-layers': {},
  },
};
