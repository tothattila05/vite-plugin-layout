export type CrossOrigin = "anonymous" | "use-credentials";

export type HtmlAttrValue = string | number | boolean | undefined;
export type HtmlAttrs = Record<string, HtmlAttrValue>;

export type MetaAttrs = {
  name?: string;
  property?: string;
  charset?: string;
  content?: string;
  "http-equiv"?: string;
};

export type ScriptAttrs = {
  src?: string;
  type?: string;
  defer?: boolean;
  async?: boolean;
  crossorigin?: CrossOrigin;
};

export type LinkAttrs = {
  rel: string;
  type?: string;
  href: string;
  crossorigin?: CrossOrigin;
};

function isValidAttrValue(v: unknown): v is HtmlAttrValue {
  return (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    v === undefined
  );
}

export function attrs(obj: HtmlAttrs): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== false)
    .filter(([, v]) => isValidAttrValue(v))
    .map(([k, v]) => (v === true ? k : `${k}="${String(v)}"`))
    .join(" ");
}
