import {
  Assert,
  IsObject,
  IsString,
  IsArray,
  Checker,
} from "https://deno.land/x/safe_type@2.2.3/mod.ts";
import { exists } from "https://deno.land/std@0.97.0/fs/mod.ts";

export async function ReadJson<T>(path: string, checker: Checker<T>) {
  const text = await Deno.readTextFile(path);
  const data = JSON.parse(text);
  Assert(checker, data);

  return data;
}

const config = await ReadJson(
  "./config.json",
  IsObject({ strapi_url: IsString, strapi_external: IsString })
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
  const encode = (value: string) =>
    encodeURIComponent(value).replaceAll("%20", "+");
  const rendered = Object.keys(query)
    .map((k) => {
      const val = query[k];
      if (IsArray(IsString)(val)) {
        return val.map((v) => encode(k) + "=" + encode(v)).join("&");
      }

      return encode(k) + "=" + encode(val);
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

let site = undefined;
while (!site) {
  try {
    site = await SingleItem("site-metadata");
  } catch {
    console.log("Failed to connect to a CMS. Retrying in 5 seconds.");
    await new Promise((res) => setTimeout(res, 5000));
  }
}

export const Site = await SingleItem("site-metadata");
export const Metadata = await SingleItem("manga-description");

export function AssetUrl(base: { url: string }) {
  return Combine(config.strapi_external, base.url);
}

export async function SavePage(
  manga_slug: string,
  page: number,
  data: Uint8Array
) {
  if (!await exists(`./_/manga/${manga_slug}`)) {
    await Deno.mkdir(`./_/manga/${manga_slug}`);
  }

  await Deno.writeFile(`./_/manga/${manga_slug}/${Pad(page, 3)}.png`, data);
}
