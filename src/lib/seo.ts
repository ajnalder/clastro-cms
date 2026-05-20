export const SITE_NAME = "Clastro Demo";
export const SITE_URL = "https://clastro-cms-demo.ajnalder.workers.dev";
export const DEFAULT_DESCRIPTION =
  "A generic Clastro CMS demonstration site for testing pages, blog posts, media, products, users, and live WYSIWYG editing.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/clastro-logo.svg`;
export const SITE_LOGO = `${SITE_URL}/images/clastro-logo.svg`;

export interface SchemaValue {
  [key: string]: unknown;
}

interface SeoInput {
  description?: string;
  image?: string;
  noindex?: boolean;
  title?: string;
  type?: "article" | "website";
}

export interface ResolvedSeo {
  canonicalUrl: string;
  description: string;
  image: string;
  noindex: boolean;
  pathname: string;
  robots: string;
  title: string;
  type: "article" | "website";
}

interface ArticleSchemaInput {
  authorName?: string;
  datePublished?: string;
  description: string;
  image?: string;
  title: string;
  url: string;
}

interface GenericSchemaInput {
  description: string;
  image?: string;
  title: string;
  url: string;
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return trimmed || "/";
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&nbsp;", " ");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function cleanMetaText(value?: string) {
  if (!value) {
    return "";
  }

  return decodeEntities(stripHtml(value)).replace(/\s+/g, " ").trim();
}

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    !normalized ||
    normalized === "meta_title" ||
    normalized === "meta description" ||
    normalized === "meta_description" ||
    normalized === "description"
  );
}

function titleFromPath(pathname: string) {
  const normalized = normalizePathname(pathname);

  if (normalized === "/") {
    return SITE_NAME;
  }

  const label =
    normalized
      .slice(1)
      .split("/")
      .pop()
      ?.replaceAll("-", " ")
      .replace(/\b\w/g, (match) => match.toUpperCase()) ?? SITE_NAME;

  return `${label} | ${SITE_NAME}`;
}

function absolutizeUrl(value?: string) {
  if (!value) {
    return DEFAULT_OG_IMAGE;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return new URL(value, SITE_URL).toString();
}

export function resolvePageSeo(pathname: string, input: SeoInput = {}): ResolvedSeo {
  const normalizedPath = normalizePathname(pathname);
  const inputTitle = cleanMetaText(input.title);
  const inputDescription = cleanMetaText(input.description);
  const title = isPlaceholder(inputTitle) ? titleFromPath(normalizedPath) : inputTitle;
  const description = isPlaceholder(inputDescription) ? DEFAULT_DESCRIPTION : inputDescription;
  const type = input.type || (normalizedPath.startsWith("/blog/") ? "article" : "website");
  const noindex = Boolean(input.noindex);
  const canonicalUrl = new URL(normalizedPath, SITE_URL).toString();

  return {
    canonicalUrl,
    description,
    image: absolutizeUrl(input.image),
    noindex,
    pathname: normalizedPath,
    robots: noindex ? "noindex,nofollow" : "index,follow",
    title,
    type,
  };
}

export function buildOrganizationSchema(): SchemaValue {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    email: "hello@clastro.local",
  };
}

export function buildWebSiteSchema(): SchemaValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
  };
}

export function buildWebPageSchema(input: GenericSchemaInput): SchemaValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url: input.url,
    image: input.image,
    isPartOf: SITE_URL,
  };
}

export function buildBlogSchema(input: GenericSchemaInput): SchemaValue {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: input.title,
    description: input.description,
    url: input.url,
    image: input.image,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO,
      },
    },
  };
}

export function buildArticleSchema(input: ArticleSchemaInput): SchemaValue {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.image ? [input.image] : undefined,
    datePublished: input.datePublished,
    author: {
      "@type": "Person",
      name: input.authorName || "Clastro Editor",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO,
      },
    },
    mainEntityOfPage: input.url,
  };
}

export function extractFaqItemsFromHtml(
  contentHtml: string,
): Array<{ answer: string; question: string }> {
  const blockPattern = /<(h2|h3|p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const items: Array<{ answer: string; question: string }> = [];
  let insideFaqSection = false;
  let currentQuestion = "";
  let currentAnswerParts: string[] = [];

  function flushCurrentItem() {
    const question = cleanMetaText(currentQuestion);
    const answer = cleanMetaText(currentAnswerParts.join(" "));

    if (question && answer) {
      items.push({ question, answer });
    }

    currentQuestion = "";
    currentAnswerParts = [];
  }

  for (const match of contentHtml.matchAll(blockPattern)) {
    const tag = match[1]?.toLowerCase();
    const innerHtml = match[2] || "";
    const text = cleanMetaText(innerHtml);

    if (!text) {
      continue;
    }

    if (tag === "h2") {
      if (/^frequently asked questions(?:\s*\(faqs?\))?$|^faqs?$/i.test(text)) {
        insideFaqSection = true;
        flushCurrentItem();
        continue;
      }

      if (insideFaqSection) {
        break;
      }
    }

    if (!insideFaqSection) {
      continue;
    }

    if (tag === "h3") {
      flushCurrentItem();
      currentQuestion = text;
      continue;
    }

    if ((tag === "p" || tag === "ul" || tag === "ol") && currentQuestion) {
      currentAnswerParts.push(text);
    }
  }

  flushCurrentItem();
  return items.slice(0, 5);
}

export function buildFaqPageSchema(
  items: Array<{ answer: string; question: string }>,
): SchemaValue {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
