import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type Preview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 4000;

/** Addresses a server must never fetch on someone's behalf. */
function isPrivateAddress(address: string) {
  if (address === "::1" || address === "::") return true;

  const lower = address.toLowerCase();

  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  if (lower.startsWith("fe80")) return true;
  if (lower.startsWith("::ffff:")) {
    return isPrivateAddress(lower.slice("::ffff:".length));
  }

  const parts = address.split(".").map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts as [number, number, number, number];

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

/** True when the address is a public web address that is safe to fetch. */
export async function isSafeUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && !["80", "443"].includes(url.port)) return false;

  const host = url.hostname.replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (isIP(host)) return !isPrivateAddress(host);

  try {
    const addresses = await lookup(host, { all: true });

    return (
      addresses.length > 0 &&
      addresses.every((entry) => !isPrivateAddress(entry.address))
    );
  } catch {
    return false;
  }
}

function meta(html: string, ...names: string[]) {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`,
      "i",
    );
    const tag = html.match(pattern)?.[0];
    const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];

    if (content) return decode(content.trim());
  }

  return null;
}

function decode(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .slice(0, 400);
}

/** The title, description and image a page describes itself with. */
export async function fetchPreview(value: string): Promise<Preview | null> {
  if (!(await isSafeUrl(value))) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Redirects are followed by hand so each hop is checked too.
    let url = value;

    for (let hop = 0; hop < 3; hop += 1) {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "user-agent": "ZentroLinkPreview/1.0",
          accept: "text/html",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const next = response.headers.get("location");

        if (!next) return null;

        url = new URL(next, url).toString();

        if (!(await isSafeUrl(url))) return null;

        continue;
      }

      const type = response.headers.get("content-type") ?? "";

      if (!response.ok || !type.includes("text/html") || !response.body) {
        return null;
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;

      while (size < MAX_BYTES) {
        const { done, value: chunk } = await reader.read();

        if (done || !chunk) break;

        chunks.push(chunk);
        size += chunk.length;
      }

      void reader.cancel().catch(() => undefined);

      const html = Buffer.concat(chunks).toString("utf8");
      const title =
        meta(html, "og:title", "twitter:title") ??
        (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]
          ? decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)![1]!.trim())
          : null);
      const image = meta(html, "og:image", "twitter:image");

      return {
        url: value,
        title,
        description: meta(html, "og:description", "description"),
        image: image ? new URL(image, url).toString() : null,
        siteName: meta(html, "og:site_name") ?? new URL(url).hostname,
      };
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** External addresses written in a message body. */
export function externalUrls(body: string) {
  const urls = body.match(/https?:\/\/[^\s<>)\]]+/g) ?? [];

  return [...new Set(urls.map((url) => url.replace(/[.,;:!?]+$/, "")))].slice(
    0,
    3,
  );
}
