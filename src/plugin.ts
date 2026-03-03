import type { IndexHtmlTransformContext, Plugin } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import esbuild from "esbuild";

import type { LayoutContext } from "./layout";
import { attrs, type CrossOrigin } from "./html";

type LayoutFn = (ctx: LayoutContext) => void | Promise<void>;

const c = {
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};

const log = {
  info: (msg: string) => console.log(c.green("\n[layout]"), msg),
  file: (msg: string) => console.log(c.gray("  ↳"), msg),
  error: (msg: string) => console.error(c.red("[layout error]"), msg),
};

export function layoutPlugin(): Plugin {
  return {
    name: "dynamic-layout",
    enforce: "pre",

    async transformIndexHtml(html, ctx) {
      const root = ctx.server?.config.root ?? process.cwd();

      const htmlFsPath =
        ctx.server && ctx.path
          ? path.resolve(root, ctx.path.replace(/^\//, ""))
          : "filename" in ctx
            ? ctx.filename
            : undefined;

      if (!htmlFsPath?.endsWith(".html")) return html;

      const headParts: string[] = [];
      const bodyStart: string[] = [];
      const bodyEnd: string[] = [];
      const errorHandlers: ((e: Error) => void)[] = [];
      let defaultCrossOrigin: CrossOrigin | undefined;

      const ctxApi: LayoutContext = {
        head: {
          meta: (m) => headParts.push(`<meta ${attrs(m)} />`),
          link: (l) =>
            headParts.push(
              `<link ${attrs({
                ...l,
                crossorigin: l.crossorigin ?? defaultCrossOrigin,
              })} />`,
            ),
          script: (s) =>
            headParts.push(
              `<script ${attrs({
                ...s,
                crossorigin: s.crossorigin ?? defaultCrossOrigin,
              })}></script>`,
            ),
          raw: (h) => headParts.push(h),
          crossorigin: (v) => {
            defaultCrossOrigin = v;
          },
        },
        body: {
          start: (h) => bodyStart.push(h),
          end: (h) => bodyEnd.push(h),
        },
        on: {
          error: (cb) => errorHandlers.push(cb),
        },
      };

      await loadGlobalLayouts(htmlFsPath, root, ctx, ctxApi, errorHandlers);

      const specificLayoutPath = htmlFsPath.replace(/\.html$/, ".layout.ts");
      await loadAndRunLayout(specificLayoutPath, ctx, ctxApi, errorHandlers);

      let result = html;
      const headIndent = detectIndent(html, "head");
      const headInnerIndent = headIndent + " ".repeat(2);
      const bodyIndent = detectIndent(html, "body");
      const bodyInnerIndent = bodyIndent + " ".repeat(2);

      result = result.replace(
        /<\/head>/i,
        `\n${headParts
          .map((p) => indentRawBlock(p, headInnerIndent))
          .join("\n")}\n${headIndent}</head>`,
      );

      result = result.replace(
        /<body([^>]*)>/i,
        (_m, attrs) =>
          `<body${attrs}>\n${bodyStart
            .map((p) => indentRawBlock(p, bodyInnerIndent))
            .join("\n")}`,
      );

      result = result.replace(
        /<\/body>/i,
        `${bodyEnd
          .map((p) => indentRawBlock(p, bodyInnerIndent))
          .join("\n")}\n${bodyIndent}</body>`,
      );

      return result;
    },
  };
}

async function loadAndRunLayout(
  layoutPath: string,
  ctx: IndexHtmlTransformContext,
  ctxApi: LayoutContext,
  errorHandlers: ((e: Error) => void)[],
) {
  try {
    await fs.access(layoutPath);
  } catch {
    return;
  }

  log.info(`layout found (${path.basename(layoutPath)})`);
  log.file(layoutPath);

  let layout: LayoutFn;

  try {
    if (ctx.server) {
      const mod = await ctx.server.ssrLoadModule(layoutPath);
      layout = mod.default;
    } else {
      const code = await fs.readFile(layoutPath, "utf-8");
      const hash = crypto.createHash("md5").update(code).digest("hex");
      const outFile = path.join(os.tmpdir(), `layout-${hash}.mjs`);

      await esbuild.build({
        stdin: {
          contents: code,
          resolveDir: path.dirname(layoutPath),
          sourcefile: layoutPath,
          loader: "ts",
        },
        bundle: true,
        platform: "node",
        format: "esm",
        outfile: outFile,
      });

      const mod = await import(/* @vite-ignore */ pathToFileURL(outFile).href);
      layout = mod.default;
    }
    await layout(ctxApi);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    log.error(err.message);

    errorHandlers.forEach((h) => h(err));
  }
}

function indentRawBlock(block: string, baseIndent: string): string {
  const lines = block.split("\n");
  while (lines.length && lines[0]?.trim() === "") {
    lines.shift();
  }
  while (lines.length && lines[lines.length - 1]?.trim() === "") {
    lines.pop();
  }
  return lines
    .map((line) => (line.trim() === "" ? "" : baseIndent + line))
    .join("\n");
}

function detectIndent(html: string, tag: "head" | "body") {
  const match = html.match(new RegExp(`^(\\s*)<${tag}[^>]*>`, "mi"));
  return match?.[1] ?? "";
}

async function loadGlobalLayouts(
  htmlFsPath: string,
  root: string,
  ctx: IndexHtmlTransformContext,
  ctxApi: LayoutContext,
  errorHandlers: ((e: Error) => void)[],
) {
  let currentDir = path.dirname(htmlFsPath);

  const layoutsToRun: string[] = [];

  while (true) {
    const candidate = path.join(currentDir, "global.layout.ts");
    try {
      await fs.access(candidate);
      layoutsToRun.unshift(candidate);
    } catch {
      // nincs layout itt
    }

    if (currentDir === root) break;
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  for (const layoutPath of layoutsToRun) {
    await loadAndRunLayout(layoutPath, ctx, ctxApi, errorHandlers);
  }
}
