import {
  Assert,
  IsObject,
  IsString,
  IsArray,
  Checker,
} from "https://deno.land/x/safe_type/mod.ts";

export async function ReadJson<T>(path: string, checker: Checker<T>) {
  const text = await Deno.readTextFile(path);
  const data = JSON.parse(text);
  Assert(checker, data);

  return data;
}

const config = await ReadJson(
  "./config.json",
  IsObject({ strapi_url: IsString })
);

export async function Collection(
  collection: string,
  query?: Record<string, string>
) {
  const url = WithQuery(Combine(config.strapi_url, collection), query ?? {});
  const res = await fetch(url);
  const data = await res.json();
  if (res.status > 399) {
    console.error(url + " => " + res.status);
    try {
      console.error(data);
    } catch {}
  }

  return data;
}

export async function CollectionCount(collection: string) {
  const url = Combine(config.strapi_url, collection, "count");
  const res = await fetch(url);
  const data = await res.text();
  if (res.status > 399) {
    console.error(url + " => " + res.status);
    try {
      console.error(data);
    } catch {}
  }

  return parseInt(data);
}

export async function CollectionItem(collection: string, id: string) {
  const url = WithQuery(Combine(config.strapi_url, collection), { slug: id });
  const res = await fetch(url);
  const data = await res.json();
  if (res.status > 399) {
    console.error(url + " => " + res.status);
    try {
      console.error(data);
    } catch {}
  }

  return data[0];
}

export async function CollectionItemId(collection: string, id: string) {
  const url = Combine(config.strapi_url, collection, id);
  const res = await fetch(url);
  const data = await res.json();
  if (res.status > 399) {
    console.error(url + " => " + res.status);
    try {
      console.error(data);
    } catch {}
  }

  return data;
}

export async function SingleItem(id: string) {
  const url = Combine(config.strapi_url, id);
  const res = await fetch(url);
  const data = await res.json();
  if (res.status > 399) {
    console.error(url + " => " + res.status);
    try {
      console.error(data);
    } catch {}
  }

  return data;
}

export function Combine(...parts: string[]) {
  return parts
    .map((p, i) => {
      let result = p;
      if (!result.endsWith("/") && i < parts.length - 1) {
        result = result + "/";
      }

      if (result.startsWith("/") && i > 0) {
        result = result.substr(1);
      }

      return result;
    })
    .join("");
}

export function WithQuery(
  url: string,
  query: Record<string, string[] | string>
) {
  const rendered = Object.keys(query)
    .map((k) => {
      const val = query[k];
      if (IsArray(IsString)(val)) {
        return val
          .map((v) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
          .join("&");
      }

      return encodeURIComponent(k) + "=" + encodeURIComponent(val);
    })
    .join("&");

  if (!rendered.trim()) {
    return url;
  }

  if (url.includes("?")) {
    return url + "&" + rendered;
  }

  return url + "?" + rendered;
}

export function Classes(
  ...parts: (
    | string
    | Record<string, string | number | boolean | undefined | null>
  )[]
) {
  return parts
    .map((p) => {
      if (IsString(p)) {
        return p;
      }

      return Object.keys(p)
        .filter((k) => p[k])
        .join(" ");
    })
    .join(" ");
}

function Pad(num: number, size: number) {
  let result = num.toString();
  while (result.length < size) result = "0" + result;
  return result;
}

export function PageUrl(
  manga: { page_template: string; slug: string },
  page: number
) {
  return manga.page_template
    .replace("{{slug}}", manga.slug)
    .replace("{{page}}", Pad(page, 3));
}

export const Site = await SingleItem("site-metadata");
export const Metadata = await SingleItem("manga-description");

export function AssetUrl(base: { url: string }) {
  return Combine(config.strapi_url, base.url);
}