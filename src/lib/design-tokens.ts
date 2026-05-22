/**
 * Design tokens — single source of truth for the public-site type scale,
 * font choices, and colour palette.
 *
 * AGENTS: edit DESIGN_TOKENS below to brand a new client site. The values
 * are emitted as CSS custom properties on `:root` (via SiteLayout) and
 * referenced everywhere headings, body text, and brand colours appear in
 * the public site, including content the live editor inserts.
 *
 * Scope (v1): fonts, type scale, brand colour. Spacing, radius, shadows
 * remain in src/styles/tokens.css for now and will migrate here later.
 *
 * The admin theme is intentionally separate: editors should see the same
 * deep-navy + cyan Clastro shell across every project, regardless of the
 * client brand.
 */

export interface DesignTokens {
  color: {
    accent: string;
    accentForeground: string;
    background: string;
    ink: string;
    line: string;
    muted: string;
    primary: string;
    primaryForeground: string;
    surface: string;
  };
  fonts: {
    body: string;
    heading: string;
  };
  type: {
    /** Base body size, in rem. Drives the whole scale via `scale`. */
    base: number;
    /** Type scale ratio. 1.2 (minor third), 1.25 (major third), 1.333 (perfect fourth), 1.414 (augmented fourth), 1.5 (perfect fifth). */
    scale: number;
    /** Tighter line-height for headings. */
    lineHeading: number;
    /** Looser line-height for body copy. */
    lineBody: number;
    /** Optional negative tracking on headings. e.g. '-0.02em'. */
    trackingHeading: string;
    /** Optional tracking on body. e.g. '0'. */
    trackingBody: string;
    weightBody: number;
    weightHeading: number;
  };
}

export const DESIGN_TOKENS: DesignTokens = {
  fonts: {
    body: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading: '"Outfit", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  type: {
    base: 1,
    scale: 1.25,
    lineHeading: 1.15,
    lineBody: 1.65,
    trackingHeading: "-0.02em",
    trackingBody: "0",
    weightBody: 400,
    weightHeading: 700,
  },
  color: {
    accent: "#06b6d4",
    accentForeground: "#06121f",
    background: "#f6f8fc",
    ink: "#0b1733",
    line: "#e2e8f0",
    muted: "#5a6678",
    primary: "#0b1733",
    primaryForeground: "#ecfeff",
    surface: "#ffffff",
  },
};

/** Compute the visible size for a given heading level (h1=largest). */
function headingSize(level: 1 | 2 | 3 | 4 | 5 | 6, tokens: DesignTokens): string {
  // h6 = base, h5 = base * scale, ..., h1 = base * scale^5
  const steps = 6 - level;
  const size = tokens.type.base * tokens.type.scale ** steps;
  return `${size.toFixed(4)}rem`;
}

/**
 * Render the design tokens as a CSS string. Intended to be inlined in a
 * `<style>` block in the page <head>, before any other stylesheets, so
 * the variables are available everywhere.
 */
export function renderDesignTokensCss(tokens: DesignTokens = DESIGN_TOKENS): string {
  return `:root {
  --font-body: ${tokens.fonts.body};
  --font-heading: ${tokens.fonts.heading};
  --font-weight-body: ${tokens.type.weightBody};
  --font-weight-heading: ${tokens.type.weightHeading};
  --line-body: ${tokens.type.lineBody};
  --line-heading: ${tokens.type.lineHeading};
  --tracking-body: ${tokens.type.trackingBody};
  --tracking-heading: ${tokens.type.trackingHeading};
  --type-base: ${tokens.type.base}rem;
  --type-h1: ${headingSize(1, tokens)};
  --type-h2: ${headingSize(2, tokens)};
  --type-h3: ${headingSize(3, tokens)};
  --type-h4: ${headingSize(4, tokens)};
  --type-h5: ${headingSize(5, tokens)};
  --type-h6: ${headingSize(6, tokens)};
  --color-primary: ${tokens.color.primary};
  --color-primary-foreground: ${tokens.color.primaryForeground};
  --color-accent: ${tokens.color.accent};
  --color-accent-foreground: ${tokens.color.accentForeground};
  --color-ink: ${tokens.color.ink};
  --color-muted: ${tokens.color.muted};
  --color-line: ${tokens.color.line};
  --color-surface: ${tokens.color.surface};
  --color-bg: ${tokens.color.background};
}`;
}
