import toolsData from '@/data/tools.json';
import type { Locale } from '@/i18n/config';

export interface ToolVariant {
  slug: string;
  name: Record<string, string>;
  defaultMode: string;
  title: Record<string, string>;
  description: Record<string, string>;
}

export interface Tool {
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  subtitle: Record<string, string>;
  category: string;
  component: string;
  keywords: string;
  apiType: 'frontend' | 'convert' | 'network' | 'content';
  apiEndpoint?: string;
  variants: ToolVariant[];
  relatedTools?: string[];
}

export interface ToolGroup {
  key: string;
  name: Record<string, string>;
  icon: string;
  order: number;
  tools: string[];
}

const data = toolsData as { groups: ToolGroup[]; tools: Tool[] };

export function getAllTools(): Tool[] {
  return data.tools;
}

export function getToolBySlug(slug: string): Tool | undefined {
  return data.tools.find((t) => t.slug === slug);
}

export function getToolGroups(): ToolGroup[] {
  return data.groups.sort((a, b) => a.order - b.order);
}

export function getToolsByCategory(category: string): Tool[] {
  return data.tools.filter((t) => t.category === category);
}

export function getToolName(tool: Tool, locale: Locale): string {
  return tool.name[locale] || tool.name.en;
}

export function getToolDescription(tool: Tool, locale: Locale): string {
  return tool.description[locale] || tool.description.en;
}

export function getRelatedTools(tool: Tool, limit = 5): Tool[] {
  if (tool.relatedTools && tool.relatedTools.length > 0) {
    const explicit = tool.relatedTools
      .map((slug) => data.tools.find((t) => t.slug === slug))
      .filter((t): t is Tool => t !== undefined);
    const rest = data.tools
      .filter((t) => t.category === tool.category && t.slug !== tool.slug && !tool.relatedTools!.includes(t.slug));
    return [...explicit, ...rest].slice(0, limit);
  }
  return data.tools
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, limit);
}

export function getRelatedVariants(tool: Tool, currentSlug: string, limit = 5): ToolVariant[] {
  return tool.variants
    .filter((v) => v.slug !== currentSlug)
    .slice(0, limit);
}

/** Get a tool and its variant by variant slug path (e.g. "pdf-to-word/free-online") */
export function getToolByVariantSlug(
  toolSlug: string,
  variantSlug: string,
): { tool: Tool; variant: ToolVariant } | undefined {
  const tool = data.tools.find((t) => t.slug === toolSlug);
  if (!tool) return undefined;
  const variant = tool.variants.find((v) => v.slug === variantSlug);
  if (!variant) return undefined;
  return { tool, variant };
}

/** Get all tool+variant pairs for static path generation */
export function getAllVariantPaths(): Array<{ toolSlug: string; variantSlug: string }> {
  const paths: Array<{ toolSlug: string; variantSlug: string }> = [];
  for (const tool of data.tools) {
    for (const variant of tool.variants) {
      paths.push({ toolSlug: tool.slug, variantSlug: variant.slug });
    }
  }
  return paths;
}

/** Get variant name for a given locale */
export function getVariantTitle(variant: ToolVariant, locale: Locale): string {
  return variant.title[locale] || variant.title.en;
}

/** Get variant description for a given locale */
export function getVariantDescription(variant: ToolVariant, locale: Locale): string {
  return variant.description[locale] || variant.description.en;
}
