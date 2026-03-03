import type { MetaAttrs } from "../html";

export const MetaNames = {
  description: "description",
  viewport: "viewport",
  charset: "charset",
  robots: "robots",
  author: "author",
  ogTitle: "og:title",
  ogDescription: "og:description",
  ogImage: "og:image",
  ogUrl: "og:url",
  twitterCard: "twitter:card",
  twitterTitle: "twitter:title",
  twitterDescription: "twitter:description",
} as const;

/* BASIC */
export const Description = (content: string): MetaAttrs => ({
  name: "description",
  content,
});

export const Charset = (value = "utf-8"): MetaAttrs => ({
  charset: value,
});

export const Viewport = (
  content = "width=device-width, initial-scale=1",
): MetaAttrs => ({
  name: "viewport",
  content,
});

/* OG */
export const OgTitle = (content: string): MetaAttrs => ({
  property: "og:title",
  content,
});

export const OgDescription = (content: string): MetaAttrs => ({
  property: "og:description",
  content,
});

export const OgImage = (url: string): MetaAttrs => ({
  property: "og:image",
  content: url,
});

/* TWITTER */
export const TwitterCard = (
  value: "summary" | "summary_large_image",
): MetaAttrs => ({
  name: "twitter:card",
  content: value,
});

/* ROBOTS */
const DEFAULT_BOTS = [
  "slurp",
  "exabot",
  "yandex",
  "bingbot",
  "googlebot",
  "duckduckbot",
  "baiduspider",
  "sogouspider",
];

export const RobotsDirective = (
  allow: boolean = true,
  bots: string[] = DEFAULT_BOTS,
): MetaAttrs[] => {
  const content = allow ? "index, follow" : "noindex, nofollow";

  return bots.map((botName) => ({
    name: botName,
    content,
  }));
};

export const CustomRobot = (name: string, content: string): MetaAttrs => ({
  name,
  content,
});

export type MetaName = (typeof MetaNames)[keyof typeof MetaNames];
