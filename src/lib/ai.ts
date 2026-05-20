import {
  buildMediaUrl,
  getAiSettings,
  getPostBySlug,
  getSiteSettings,
  listAllowedInternalLinks,
  putMediaObject,
  saveMediaRecord,
  type CmsPostRecord,
} from "./repository";
import {
  buildAllowedInternalOrigins,
  formatInternalLinksForPrompt,
  makeInternalLinkPathSet,
  sanitizeInternalLinksInHtml,
} from "./internal-links";

type TitleIdeasResponse = {
  titleIdeas: string[];
};

type PostDraftResponse = {
  bodyHtml: string;
  categories: string[];
  excerpt: string;
  faqItems: Array<{
    answer: string;
    question: string;
  }>;
  primaryCategory: string;
  title: string;
};

type SeoResponse = {
  seoDescription: string;
  seoTitle: string;
};

type AltTextResponse = {
  altText: string;
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

type OpenAiImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
  };
};

export interface AiTitleIdeasRequest {
  audience?: string;
  count?: number;
  goal?: string;
  topic: string;
}

export interface AiTitleIdeasResult {
  titleIdeas: string[];
}

export interface AiGeneratePostRequest {
  audience?: string;
  generateImage?: boolean;
  goal?: string;
  imagePrompt?: string;
  selectedTitle?: string;
  topic: string;
}

export interface AiGeneratePostResult {
  post: CmsPostRecord;
  warnings: string[];
}

function renderTemplate(template: string, values: Record<string, string | number | undefined>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = values[key];
    return value == null ? "" : String(value);
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function stripTags(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadTime(contentHtml: string) {
  const wordCount = stripTags(contentHtml).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

function normalizeBodyHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function deriveExcerpt(contentHtml: string) {
  const plainText = stripTags(contentHtml);
  return plainText.slice(0, 220).replace(/\s+\S*$/, "").trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderFaqHtml(items: Array<{ answer: string; question: string }>) {
  const normalizedItems = items
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 5);

  if (!normalizedItems.length) {
    return "";
  }

  return [
    "<h2>Frequently Asked Questions</h2>",
    ...normalizedItems.flatMap((item) => [
      `<h3>${escapeHtml(item.question)}</h3>`,
      `<p>${escapeHtml(item.answer)}</p>`,
    ]),
  ].join("");
}

async function ensureUniqueSlug(locals: App.Locals | undefined, title: string) {
  const baseSlug = slugify(title) || `post-${Date.now()}`;
  let slug = baseSlug;
  let counter = 2;

  while (await getPostBySlug(locals, slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

async function getOpenAiAccess(locals?: App.Locals) {
  const settings = await getAiSettings(locals);

  if (settings.provider.trim().toLowerCase() !== "openai") {
    throw new Error(`Unsupported AI provider "${settings.provider}".`);
  }

  if (!settings.apiKey.trim()) {
    throw new Error("No OpenAI API key is stored in AI Settings.");
  }

  return settings;
}

async function openAiJsonRequest<T>(input: {
  apiKey: string;
  model: string;
  schema: Record<string, unknown>;
  schemaName: string;
  systemPrompt: string;
  userPrompt: string;
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: input.userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: input.schemaName,
          strict: true,
          schema: input.schema,
        },
      },
    }),
  });

  const payload = (await response.json()) as OpenAiChatResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI request failed with status ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("OpenAI returned invalid structured JSON.");
  }
}

async function openAiImageRequest(input: {
  apiKey: string;
  background?: string;
  model: string;
  prompt: string;
  quality?: string;
  size?: string;
}) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      ...(input.size ? { size: input.size } : {}),
      ...(input.quality ? { quality: input.quality } : {}),
      ...(input.background ? { background: input.background } : {}),
    }),
  });

  const payload = (await response.json()) as OpenAiImageResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI image generation failed with status ${response.status}.`);
  }

  const image = payload.data?.[0];

  if (!image) {
    throw new Error("OpenAI did not return an image.");
  }

  if (image.b64_json) {
    return {
      body: Uint8Array.from(Buffer.from(image.b64_json, "base64")),
      contentType: "image/png",
    };
  }

  if (image.url) {
    const remote = await fetch(image.url);

    if (!remote.ok) {
      throw new Error("OpenAI returned an image URL that could not be fetched.");
    }

    return {
      body: new Uint8Array(await remote.arrayBuffer()),
      contentType: remote.headers.get("content-type") || "image/png",
    };
  }

  throw new Error("OpenAI returned an unsupported image payload.");
}

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("webp")) {
    return "webp";
  }

  if (mimeType.includes("jpeg")) {
    return "jpg";
  }

  return "png";
}

export async function generateAiPostTitleIdeas(
  locals: App.Locals | undefined,
  request: AiTitleIdeasRequest,
): Promise<AiTitleIdeasResult> {
  const settings = await getOpenAiAccess(locals);
  const siteSettings = await getSiteSettings(locals);
  const count = Math.max(1, Math.min(10, request.count || 5));
  const topic = request.topic.trim();

  if (!topic) {
    throw new Error("A topic is required to generate title ideas.");
  }

  const userPrompt = renderTemplate(settings.blogGeneration.titleIdeasPromptTemplate, {
    audience: request.audience?.trim() || "website owners and content editors",
    count,
    goal: request.goal?.trim() || "educate and build trust",
    siteName: siteSettings.siteName,
    topic,
  });

  const response = await openAiJsonRequest<TitleIdeasResponse>({
    apiKey: settings.apiKey,
    model: settings.blogGeneration.model,
    schemaName: "blog_title_ideas",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        titleIdeas: {
          type: "array",
          minItems: 1,
          maxItems: count,
          items: {
            type: "string",
            minLength: 12,
            maxLength: 120,
          },
        },
      },
      required: ["titleIdeas"],
    },
    systemPrompt: `${settings.defaultBrandPrompt}\n\nYou generate human blog post title ideas for a modern business website. Titles should be clear, practical, useful, and search-friendly. Avoid clickbait and empty hype.`,
    userPrompt,
  });

  return {
    titleIdeas: response.titleIdeas
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, count),
  };
}

export async function generateAiPostDraft(
  locals: App.Locals | undefined,
  request: AiGeneratePostRequest,
): Promise<AiGeneratePostResult> {
  const settings = await getOpenAiAccess(locals);
  const siteSettings = await getSiteSettings(locals);
  const allowedInternalLinks = await listAllowedInternalLinks(locals);
  const allowedInternalLinkPrompt = formatInternalLinksForPrompt(allowedInternalLinks);
  const allowedInternalPaths = makeInternalLinkPathSet(
    await listAllowedInternalLinks(locals, { includePosts: true }),
  );
  const allowedInternalOrigins = buildAllowedInternalOrigins(siteSettings.siteUrl);
  const warnings: string[] = [];
  const topic = request.topic.trim();
  const selectedTitle = request.selectedTitle?.trim() || "";
  const audience = request.audience?.trim() || "website owners and content editors";
  const goal = request.goal?.trim() || "educate and build trust";
  const imagePromptAddon = request.imagePrompt?.trim() || "";

  if (!topic) {
    throw new Error("A topic is required to generate a post.");
  }

  if (!settings.blogGeneration.enabled) {
    throw new Error("Blog generation is disabled in AI Settings.");
  }

  const blogPrompt = renderTemplate(settings.blogGeneration.promptTemplate, {
    audience,
    goal,
    availableInternalLinks: allowedInternalLinkPrompt,
    siteName: siteSettings.siteName,
    title: selectedTitle,
    topic,
  });

  const draftResponse = await openAiJsonRequest<PostDraftResponse>({
    apiKey: settings.apiKey,
    model: settings.blogGeneration.model,
    schemaName: "blog_post_draft",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 12, maxLength: 140 },
        excerpt: { type: "string", minLength: 80, maxLength: 260 },
        primaryCategory: { type: "string", minLength: 2, maxLength: 80 },
        categories: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: { type: "string", minLength: 2, maxLength: 80 },
        },
        bodyHtml: { type: "string", minLength: 400 },
        faqItems: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: { type: "string", minLength: 12, maxLength: 140 },
              answer: { type: "string", minLength: 40, maxLength: 280 },
            },
            required: ["question", "answer"],
          },
        },
      },
      required: ["title", "excerpt", "primaryCategory", "categories", "bodyHtml", "faqItems"],
    },
    systemPrompt: `${settings.defaultBrandPrompt}

You write blog articles for a modern business website and CMS demo.

Output rules:
- Return valid fragment HTML in bodyHtml only.
- Use only p, h2, h3, ul, ol, li, blockquote, strong, em, and a tags.
- Do not include an h1 in bodyHtml.
- Do not include the FAQ section in bodyHtml.
- Do not include html, body, article, section, style, or script tags.
- No markdown and no code fences.
- If you include internal links, use only exact href values from AVAILABLE_INTERNAL_LINKS.
- Use root-relative internal links only, such as /services.
- Never invent, guess, paraphrase, or simplify a slug.
- If no exact relevant internal URL exists, leave the text unlinked.
- Do not use target="_blank" on internal links.
- Keep the article practical, calm, clear, and trustworthy.
- Avoid unsupported claims and avoid keyword stuffing.
- Return exactly five faqItems for AEO. Each question should sound natural and search-friendly, and each answer should be direct, useful, and concise.
- End with a short, natural call to action aligned with the brand.`,
    userPrompt: [
      blogPrompt,
      selectedTitle ? `Use this exact title for the article: "${selectedTitle}".` : "",
      `AVAILABLE_INTERNAL_LINKS:\n${allowedInternalLinkPrompt}`,
      "No other internal URLs are valid.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const finalTitle = selectedTitle || draftResponse.title.trim();
  const faqHtml = renderFaqHtml(draftResponse.faqItems);
  const sanitizedBody = sanitizeInternalLinksInHtml(
    normalizeBodyHtml(`${draftResponse.bodyHtml}${faqHtml}`),
    allowedInternalPaths,
    allowedInternalOrigins,
  );
  const bodyHtml = sanitizedBody.html;
  const excerpt = truncate(draftResponse.excerpt.trim() || deriveExcerpt(bodyHtml), 220);

  if (sanitizedBody.removedInternalHrefs.length) {
    warnings.push(
      `Removed invalid internal links: ${sanitizedBody.removedInternalHrefs.join(", ")}`,
    );
  }

  const seoPrompt = renderTemplate(settings.blogGeneration.seoPromptTemplate, {
    audience,
    excerpt,
    goal,
    siteName: siteSettings.siteName,
    title: finalTitle,
    topic,
  });

  const seoResponse = await openAiJsonRequest<SeoResponse>({
    apiKey: settings.apiKey,
    model: settings.blogGeneration.model,
    schemaName: "blog_post_seo",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        seoTitle: { type: "string", minLength: 20, maxLength: 70 },
        seoDescription: { type: "string", minLength: 80, maxLength: 170 },
      },
      required: ["seoTitle", "seoDescription"],
    },
    systemPrompt: `${settings.defaultBrandPrompt}\n\nYou write search metadata for blog posts. Keep it human, clear, and search-friendly. Avoid clickbait and spammy phrasing.`,
    userPrompt: `${seoPrompt}\n\nTitle: ${finalTitle}\n\nExcerpt: ${excerpt}\n\nBody:\n${stripTags(bodyHtml)}`,
  });

  let coverImageUrl: string | undefined;
  let coverImageAlt: string | undefined;

  if (request.generateImage !== false) {
    if (!settings.imageGeneration.enabled) {
      warnings.push("Image generation is disabled in AI Settings, so no cover image was created.");
    } else {
      try {
        const baseImagePrompt = renderTemplate(settings.imageGeneration.promptTemplate, {
          audience,
          excerpt,
          goal,
          siteName: siteSettings.siteName,
          title: finalTitle,
          topic,
        });
        const finalImagePrompt = [
          settings.defaultBrandPrompt,
          baseImagePrompt,
          imagePromptAddon
            ? `Additional image direction: ${imagePromptAddon}`
            : "Avoid repeating stale or overly generic stock-photo compositions. Seek a distinct but brand-aligned scene for this specific article.",
        ]
          .filter(Boolean)
          .join("\n\n");
        const generatedImage = await openAiImageRequest({
          apiKey: settings.apiKey,
          model: settings.imageGeneration.model,
          prompt: finalImagePrompt,
          size: settings.imageGeneration.size,
          quality: settings.imageGeneration.quality,
          background: settings.imageGeneration.background,
        });
        const altTextModel = settings.altTextGeneration.model || settings.blogGeneration.model;
        const fallbackAlt = `${finalTitle} cover image`;

        if (settings.altTextGeneration.enabled) {
          try {
            const altPrompt = renderTemplate(settings.altTextGeneration.promptTemplate, {
              audience,
              excerpt,
              goal,
              maxLength: settings.altTextGeneration.maxLength,
              siteName: siteSettings.siteName,
              title: finalTitle,
              topic,
            });
            const altResponse = await openAiJsonRequest<AltTextResponse>({
              apiKey: settings.apiKey,
              model: altTextModel,
              schemaName: "cover_image_alt_text",
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  altText: {
                    type: "string",
                    minLength: 12,
                    maxLength: Math.max(settings.altTextGeneration.maxLength, 180),
                  },
                },
                required: ["altText"],
              },
              systemPrompt: `${settings.defaultBrandPrompt}\n\nYou write concise, accurate alt text for blog cover images.`,
              userPrompt: `${altPrompt}\n\nBlog title: ${finalTitle}\nExcerpt: ${excerpt}\nImage brief: ${[
                baseImagePrompt,
                imagePromptAddon ? `Additional image direction: ${imagePromptAddon}` : "",
              ]
                .filter(Boolean)
                .join("\n")}\nMaximum length: ${settings.altTextGeneration.maxLength} characters.`,
            });
            coverImageAlt = truncate(altResponse.altText.trim() || fallbackAlt, settings.altTextGeneration.maxLength);
          } catch (error) {
            warnings.push(error instanceof Error ? `Alt text generation failed: ${error.message}` : "Alt text generation failed.");
            coverImageAlt = fallbackAlt;
          }
        } else {
          coverImageAlt = fallbackAlt;
        }

        const extension = extensionForMimeType(generatedImage.contentType);
        const filename = `${slugify(finalTitle) || `post-${Date.now()}`}-cover-${Date.now()}.${extension}`;
        const r2Key = `${Date.now()}-${filename}`;

        await putMediaObject(locals, r2Key, generatedImage.body.buffer.slice(
          generatedImage.body.byteOffset,
          generatedImage.body.byteOffset + generatedImage.body.byteLength,
        ), {
          contentType: generatedImage.contentType,
        });

        const mediaRecord = await saveMediaRecord(locals, {
          filename,
          r2Key,
          alt: coverImageAlt,
          mimeType: generatedImage.contentType,
          sizeBytes: generatedImage.body.byteLength,
        });

        coverImageUrl = mediaRecord.publicUrl || buildMediaUrl(locals, filename);
      } catch (error) {
        warnings.push(error instanceof Error ? `Cover image generation failed: ${error.message}` : "Cover image generation failed.");
      }
    }
  }

  return {
    post: {
      slug: await ensureUniqueSlug(locals, finalTitle),
      title: finalTitle,
      excerpt,
      contentHtml: bodyHtml,
      coverImageUrl,
      coverImageAlt,
      featured: false,
      published: true,
      publishedAt: new Date().toISOString(),
      readTime: estimateReadTime(bodyHtml),
      authorName: "Clastro Editor",
      authorRole: "CMS Demo Author",
      primaryCategory: draftResponse.primaryCategory.trim() || "CMS",
      categories: Array.from(
        new Set(
          draftResponse.categories
            .map((entry) => entry.trim())
            .filter(Boolean),
        ),
      ).map((label) => ({ label })),
      seoTitle: truncate(seoResponse.seoTitle.trim() || finalTitle, 70),
      seoDescription: truncate(seoResponse.seoDescription.trim() || excerpt, 170),
    },
    warnings,
  };
}
