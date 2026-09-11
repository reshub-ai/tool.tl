import config from '../astro.config.mjs';

// jsencrypt 的 Node ESM 入口缺少扩展名；仅在开发验收中交给 Vite 打包。
// 生产配置保持不变，另以正式构建验收。
export default {
  ...config,
  vite: { ...config.vite, ssr: { noExternal: ['jsencrypt'] } },
};
