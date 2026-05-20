export interface NavigationLink {
  label: string;
  link: string;
}

export interface FooterColumn {
  heading: string;
  links: NavigationLink[];
}

export interface AiSettings {
  altTextGeneration: {
    enabled: boolean;
    maxLength: number;
    model: string;
    promptTemplate: string;
  };
  apiKey: string;
  blogGeneration: {
    enabled: boolean;
    model: string;
    promptTemplate: string;
    seoPromptTemplate: string;
    titleIdeasPromptTemplate: string;
  };
  defaultBrandPrompt: string;
  imageGeneration: {
    background: string;
    enabled: boolean;
    model: string;
    promptTemplate: string;
    quality: string;
    size: string;
  };
  provider: string;
}

export interface CmsFeatureFlags {
  showAiDashboard: boolean;
  showBlog: boolean;
}

export interface LinkedInSettings {
  accessToken: string;
  authorUrn: string;
  clientId: string;
  clientSecret: string;
  defaultPostCta: string;
  enabled: boolean;
  organizationUrn: string;
}

export interface SiteSettings {
  booking: {
    consultation: {
      description: string;
      duration: string;
      href: string;
      price: string;
      title: string;
    };
    note: string;
    session: {
      description: string;
      duration: string;
      href: string;
      price: string;
      title: string;
    };
  };
  contactEmail: string;
  contactPhone: string;
  defaultOgImage: string;
  footer: {
    columns: FooterColumn[];
    ctaLink: string;
    ctaText: string;
    emailText: string;
    phoneText: string;
    tagline: string;
  };
  navigation: {
    ctaButtonLink: string;
    ctaButtonText: string;
    navLinks: NavigationLink[];
    phoneLink: string;
    phoneText: string;
  };
  siteName: string;
  siteUrl: string;
}

export const LEGACY_BLOG_PROMPT_TEMPLATE =
  'Write a blog post for "{{siteName}}" about "{{topic}}". Primary audience: {{audience}}. Goal: {{goal}}. Use a practical, expert, approachable tone. Structure the article with a strong H1, clear H2/H3 sections, an excerpt, and a final CTA aligned with the brand prompt.';

export const LEGACY_BLOG_PROMPT_TEMPLATE_WITH_GENERIC_INTERNAL_LINKS =
  'Write a blog post for "{{siteName}}" about "{{topic}}". Primary audience: {{audience}}. Goal: {{goal}}. Use a practical, expert, approachable tone. Structure the article with a strong H1, clear H2/H3 sections, a concise excerpt, a clear final CTA, and five FAQ-style answers suitable for AEO and FAQ schema. Posts to be approximately 1500 words long. Please add internal links to appropriate pages where possible.';

export const LEGACY_IMAGE_MODEL = "gpt-image-1";

export const LEGACY_IMAGE_PROMPT_TEMPLATE =
  'Create a realistic blog header image for "{{title}}". Article summary: {{excerpt}}. Visual direction: clean modern business website, content management, digital publishing, natural light, no text, no logos, no watermarks.';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Clastro Demo",
  siteUrl: "https://clastro-cms-demo.ajnalder.workers.dev",
  defaultOgImage: "/images/clastro-logo.svg",
  contactEmail: "hello@clastro.local",
  contactPhone: "+64 21 000 0000",
  navigation: {
    navLinks: [
      { label: "Home", link: "/" },
      { label: "About", link: "/about" },
      { label: "Services", link: "/services" },
      { label: "Products", link: "/products" },
      { label: "Blog", link: "/blog" },
      { label: "Contact", link: "/contact" },
    ],
    phoneText: "+64 21 000 0000",
    phoneLink: "tel:+64210000000",
    ctaButtonText: "Open CMS",
    ctaButtonLink: "/admin",
  },
  footer: {
    tagline:
      "A generic Clastro demonstration site for testing pages, repeatable content, media, roles, and the WYSIWYG editor.",
    phoneText: "+64 21 000 0000",
    emailText: "hello@clastro.local",
    columns: [
      {
        heading: "Demo Site",
        links: [
          { label: "Home", link: "/" },
          { label: "About", link: "/about" },
          { label: "Services", link: "/services" },
          { label: "Products", link: "/products" },
        ],
      },
      {
        heading: "CMS",
        links: [
          { label: "Admin", link: "/admin" },
          { label: "Live Editor", link: "/admin/edit" },
          { label: "Blog", link: "/blog" },
          { label: "Changelog", link: "/changelog" },
        ],
      },
      {
        heading: "Contact",
        links: [
          { label: "Email", link: "mailto:hello@clastro.local" },
          { label: "Contact Page", link: "/contact" },
        ],
      },
    ],
    ctaText: "Open Admin",
    ctaLink: "/admin",
  },
  booking: {
    consultation: {
      title: "Demo Enquiry",
      duration: "15 minutes",
      price: "Free",
      description: "A placeholder enquiry flow for testing buttons, modals, and CMS-managed links.",
      href: "/contact",
    },
    session: {
      title: "Implementation Session",
      duration: "60 minutes",
      price: "Demo",
      description: "A second placeholder action for checking multi-card booking content.",
      href: "/contact",
    },
    note: "This is dummy booking content. Replace it per client.",
  },
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: "openai",
  apiKey: "",
  defaultBrandPrompt:
    "Clastro Demo is a neutral CMS starter brand. Outputs should be clear, structured, implementation-friendly, and easy to adapt for client sites. Avoid client-specific names, hype, and vague filler.",
  imageGeneration: {
    enabled: true,
    model: "gpt-image-1.5",
    size: "1536x1024",
    quality: "high",
    background: "auto",
    promptTemplate:
      'Create a realistic editorial image for "{{title}}". Article summary: {{excerpt}}. Visual direction: clean modern business website, content management, digital publishing, natural light, no text, no logos, no watermarks.',
  },
  blogGeneration: {
    enabled: true,
    model: "gpt-4.1",
    titleIdeasPromptTemplate:
      'Suggest {{count}} blog post titles for "{{siteName}}" about "{{topic}}". Primary audience: {{audience}}. Goal: {{goal}}. Keep them clear, practical, and useful for a website CMS demo.',
    promptTemplate:
      'Write a blog post for "{{siteName}}" about "{{topic}}". Primary audience: {{audience}}. Goal: {{goal}}. Use a practical, expert, approachable tone. Structure the article with a strong H1, clear H2/H3 sections, a concise excerpt, a clear final CTA, and five FAQ-style answers suitable for AEO and FAQ schema. If you add internal links, use only exact root-relative URLs from the provided AVAILABLE_INTERNAL_LINKS list.',
    seoPromptTemplate:
      "Based on the article draft, generate an SEO title and meta description that are clear, human, and search-friendly.",
  },
  altTextGeneration: {
    enabled: true,
    model: "gpt-4.1-mini",
    maxLength: 160,
    promptTemplate:
      "Write concise, accurate alt text for this image in a generic business website CMS demo. Describe what is visually important. Do not keyword stuff and do not start with 'image of'.",
  },
};

export const DEFAULT_CMS_FEATURE_FLAGS: CmsFeatureFlags = {
  showAiDashboard: true,
  showBlog: true,
};

export const DEFAULT_LINKEDIN_SETTINGS: LinkedInSettings = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  accessToken: "",
  authorUrn: "",
  organizationUrn: "",
  defaultPostCta: "Read more on the site.",
};
