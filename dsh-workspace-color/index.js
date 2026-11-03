/**
 * dsh-workspace-color —— 宿主侧空实现。
 *
 * 全部逻辑在浏览器半侧（client.js）：注入一段按工作区身份着色的 CSS，并用
 * MutationObserver 给每个工作区文件夹的 groupSection 及其文件夹行打上稳定
 * 的着色标签（按 workspaceId 哈希取色）。宿主侧不需要提供任何服务、设置或
 * HTTP 路由。
 */

export const name = 'dsh-workspace-color'

export const inject = []

/** 无宿主侧行为。 */
export function apply() {}
