import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_LOCALE_ALT,
  SITE_NAME,
  SITE_URL,
  THEME_COLOR,
  absoluteUrl,
  buildGraphJsonLd,
  getRouteSeo,
} from "./site";

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const extraSel = extra
    ? Object.entries(extra)
        .map(([k, v]) => `[${k}="${v}"]`)
        .join("")
    : "";
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]${extraSel}`,
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Syncs document head (title, meta, canonical, JSON-LD) to the active route. */
export default function SeoHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = getRouteSeo(pathname);
    const url = absoluteUrl(seo.path);

    document.title = seo.title;
    document.documentElement.lang = "fa";

    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "author", SITE_NAME);
    upsertMeta("name", "theme-color", THEME_COLOR);
    upsertMeta("name", "robots", "index,follow,max-image-preview:large");
    upsertMeta("name", "googlebot", "index,follow,max-image-preview:large");

    upsertMeta("property", "og:type", seo.ogType || "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", SITE_LOCALE);
    upsertMeta("property", "og:locale:alternate", SITE_LOCALE_ALT);
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", DEFAULT_OG_IMAGE);
    upsertMeta("property", "og:image:alt", `${SITE_NAME} — Full-stack Engineer`);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", DEFAULT_OG_IMAGE);

    upsertLink("canonical", url);
    upsertLink("alternate", url, { hrefLang: "fa" });
    upsertLink("alternate", url, { hrefLang: "x-default" });

    upsertJsonLd("seo-jsonld", buildGraphJsonLd(pathname));
  }, [pathname]);

  return null;
}

/** Used only so SITE_URL stays referenced in tree-shaken builds if needed. */
export const __seoSiteUrl = SITE_URL;
