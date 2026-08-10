import type { CSSProperties } from 'react';
import pbLinksData from '@/data/pb-links.json';

const PB_LINKS: Record<string, string> = pbLinksData.links;
const PB_BRAND_FALLBACK: Record<string, string> = pbLinksData.brandFallback;
export const PB_GENERIC_LINK = pbLinksData.genericLink;

// The active brand tab's text colour is a more vivid override (wins via
// !important in the "bold palette" theme block) than its own border colour
// — accentMap matches the border, this matches the text, so the "Shop this
// groupset" button can match both exactly instead of looking washed out
// next to the tabs.
export const PB_VIVID_TEXT: Record<string, string> = {
  shimano: '#2b8bff',
  sram: '#ff1f2b',
  campagnolo: '#ffcf1a',
  custom: '#17c86c',
};

export function pbLinkFor(discipline: string, brand: string, groupset: string): { url: string; exact: boolean } {
  const key = `${discipline}|${brand}|${groupset}`;
  if (PB_LINKS[key]) return { url: PB_LINKS[key], exact: true };
  return { url: PB_BRAND_FALLBACK[brand] || pbLinksData.categoryFallback, exact: false };
}

// React port of pbSetBrandColor(): the source mutates a DOM element's style
// directly (linkEl.style.setProperty(...)); here it returns a style object
// instead, since React owns the DOM. Sets CSS custom properties rather than
// background/color directly so the CSS's own :hover rule keeps working —
// inline background/color would otherwise permanently override it.
export function pbBrandColorStyle(hex = '#e24c00', textHex?: string): CSSProperties {
  const finalTextHex = textHex || hex;
  const h = hex.replace('#', '');
  const rgb = `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
  return {
    '--pb-rgb': rgb,
    '--pb-hex': hex,
    '--pb-text': finalTextHex,
  } as CSSProperties;
}
