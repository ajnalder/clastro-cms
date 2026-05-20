function normalizeCmsMediaPath(pathname: string) {
  try {
    return encodeURI(decodeURI(pathname));
  } catch {
    return encodeURI(pathname);
  }
}

export function normalizeCmsMediaUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    if (parsed.pathname.startsWith("/api/media/file/")) {
      return normalizeCmsMediaPath(parsed.pathname) + parsed.search + parsed.hash;
    }

    return value;
  } catch {
    if (value.startsWith("/api/media/file/")) {
      return normalizeCmsMediaPath(value);
    }

    return value;
  }
}

export function normalizeCmsMediaUrlsInHtml(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.replace(
    /https?:\/\/(?:localhost:\d+|127\.0\.0\.1:\d+|clastro-cms-demo\.ajnalder\.workers\.dev)(\/api\/media\/file\/[^"'\s>]+)/g,
    (_match, path) => path,
  );
}
