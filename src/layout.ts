import type { MetaAttrs, ScriptAttrs, LinkAttrs, CrossOrigin } from "./html";

export type LayoutContext = {
  head: {
    meta: (meta: MetaAttrs) => void;
    link: (attrs: LinkAttrs) => void;
    script: (attrs: ScriptAttrs) => void;
    raw: (html: string) => void;
    crossorigin: (value: CrossOrigin) => void;
  };
  body: {
    start: (html: string) => void;
    end: (html: string) => void;
  };
  on: {
    error: (cb: (err: Error) => void) => void;
  };
};

export function defineLayout(fn: (ctx: LayoutContext) => void | Promise<void>) {
  return fn;
}
