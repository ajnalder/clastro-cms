export interface InternalLinkOption {
  href: string;
  label: string;
}

export interface SanitizedInternalLinksResult {
  html: string;
  normalizedInternalHrefs: string[];
  removedInternalHrefs: string[];
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/{2,}/g, "/");

  if (!normalized || normalized === "/") {
    return "/";
  }

  return normalized.replace(/\/+$/g, "") || "/";
}

export function buildAllowedInternalOrigins(siteUrl?: string) {
  const configuredOrigin = siteUrl?.trim();
  return Array.from(
    new Set(
      [
        configuredOrigin,
        "https://clastro-cms-demo.ajnalder.workers.dev",
        "http://localhost:4321",
        "http://localhost:8787",
      ].filter(Boolean) as string[],
    ),
  );
}

export function normalizeCandidateInternalHref(
  href: string,
  allowedOrigins: string[],
): { href: string; path: string } | null {
  const value = href.trim();

  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return null;
  }

  if (value.startsWith("//")) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);

      if (!allowedOrigins.some((origin) => url.origin === origin)) {
        return null;
      }

      const path = normalizePathname(url.pathname);
      return {
        href: `${path}${url.search}${url.hash}`,
        path,
      };
    } catch {
      return null;
    }
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return null;
  }

  const rootRelative = value.startsWith("/") ? value : `/${value.replace(/^\.?\//, "")}`;
  const url = new URL(rootRelative, allowedOrigins[0] || "https://clastro-cms-demo.ajnalder.workers.dev");
  const path = normalizePathname(url.pathname);

  return {
    href: `${path}${url.search}${url.hash}`,
    path,
  };
}

export function makeInternalLinkPathSet(entries: InternalLinkOption[]) {
  return new Set(
    entries.map((entry) => normalizePathname(entry.href.split(/[?#]/, 1)[0] || "/")),
  );
}

export function formatInternalLinksForPrompt(entries: InternalLinkOption[]) {
  return entries
    .map((entry) => `- ${entry.label}: ${entry.href}`)
    .join("\n");
}

export function sanitizeInternalLinksInHtml(
  html: string,
  allowedPaths: Set<string>,
  allowedOrigins: string[],
): SanitizedInternalLinksResult {
  const normalizedInternalHrefs: string[] = [];
  const removedInternalHrefs: string[] = [];
  const anchorPattern = /<a\b([^>]*?)href=(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi;

  const sanitizedHtml = html.replace(anchorPattern, (_match, beforeAttrs, _quote, href, afterAttrs, innerHtml) => {
    const normalized = normalizeCandidateInternalHref(String(href || ""), allowedOrigins);

    if (!normalized) {
      return _match;
    }

    if (!allowedPaths.has(normalized.path)) {
      removedInternalHrefs.push(normalized.href);
      return innerHtml;
    }

    const combinedAttrs = `${beforeAttrs || ""} ${afterAttrs || ""}`
      .replace(/\s+(?:target|rel)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const rebuiltAttrs = combinedAttrs ? ` ${combinedAttrs}` : "";

    if (normalized.href !== href.trim()) {
      normalizedInternalHrefs.push(`${href.trim()} -> ${normalized.href}`);
    }

    return `<a${rebuiltAttrs} href="${escapeAttribute(normalized.href)}">${innerHtml}</a>`;
  });

  return {
    html: sanitizedHtml,
    normalizedInternalHrefs: unique(normalizedInternalHrefs),
    removedInternalHrefs: unique(removedInternalHrefs),
  };
}
