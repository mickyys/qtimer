export const GOOGLE_RANKING_PREVIEW_EXAMPLE =
  "https://drive.google.com/file/d/ID_DEL_ARCHIVO/preview";

const isGoogleRankingLink = (url: string) => {
  return /(?:drive\.google\.com|docs\.google\.com)/i.test(url);
};

export const getRankingPreviewUrl = (url?: string) => {
  if (!url) return "";

  const trimmedUrl = url.trim().replace(/\/+$/, "");
  if (!trimmedUrl) return "";
  if (!isGoogleRankingLink(trimmedUrl)) return trimmedUrl;
  if (trimmedUrl.endsWith("/preview")) return trimmedUrl;

  try {
    const parsedUrl = new URL(trimmedUrl);
    const pathname = parsedUrl.pathname.replace(/\/+$/, "");
    const previewPath =
      pathname.match(/\/(edit|view|copy)$/i)
        ? pathname.replace(/\/(edit|view|copy)$/i, "/preview")
        : `${pathname}/preview`;

    parsedUrl.pathname = previewPath;
    return parsedUrl.toString().replace(/\/+$/, "");
  } catch {
    return `${trimmedUrl}/preview`;
  }
};

export const getRankingPreviewExample = (url?: string) => {
  const previewUrl = getRankingPreviewUrl(url);
  return previewUrl || GOOGLE_RANKING_PREVIEW_EXAMPLE;
};
