# `vite-plugin-layout`

A file-based HTML layout system for Vite + React that lets you define hierarchical layouts and inject dynamic content via simple TypeScript files.

## Install

```bash
npm install -D @tothattila05/vite-plugin-layout
```

## Usage

```ts
import { defineLayout, RobotsDirective } from "@tothattila05/vite-plugin-layout";

export default defineLayout(({ head, body }) => {
  head.meta({
    charset: "UTF-8",
  });
  head.meta({
    "http-equiv": "X-UA-Compatible",
    content: "IE=edge",
  });
  head.meta({
    name: "viewport",
    content: "width=device-width, initial-scale=1.0",
  });

  head.meta({
    name: "robots",
    content: "index, follow, max-image-preview:large",
  });
  head.meta({
    name: "google",
    content: "notranslate",
  });

  const robotMetas = RobotsDirective(true);
  robotMetas.forEach((meta) => head.meta(meta));

  head.link({
    rel: "icon",
    type: "image/png",
    href: "/favicon.png",
  });
});
```

## Support

Write a mail: `support@vpl.tothattila05.hu`
