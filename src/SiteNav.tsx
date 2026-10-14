import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "./i18n/LocaleContext";
import { SITE_NAV } from "./worksData";

function linkTo(href: string, pathname: string): string {
  if (href === "/#expertise") {
    return pathname === "/" ? "#expertise" : "/#expertise";
  }
  return href;
}

function isActive(href: string, pathname: string, hash: string): boolean {
  if (href === "/works") return pathname === "/works";
  if (href === "/experience") return pathname === "/experience";
  if (href === "/contact") return pathname === "/contact";
  if (href === "/#expertise") return pathname === "/" && hash === "#expertise";
  return false;
}

/** Shared top nav — homepage style on every page. Styles live in index.css. */
export default function SiteNav() {
  const { pathname, hash } = useLocation();
  const { locale, setLocale, t, dir } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    if (isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, isHome]);

  return (
    <header
      className={`site-nav${!isHome && scrolled ? " site-nav--scrolled" : ""}`}
      lang={locale}
      dir={dir}
    >
      <Link to="/" className="site-nav-logo">
        Mahdi<span>.</span>
      </Link>
      <div className="site-nav-end">
        <nav className="site-nav-links" aria-label={locale === "fa" ? "ناوبری سایت" : "Site navigation"}>
          {SITE_NAV.map((link) => {
            const active = isActive(link.href, pathname, hash);
            return (
              <Link
                key={link.href}
                to={linkTo(link.href, pathname)}
                className={active ? "site-nav-active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                {t.nav[link.key]}
              </Link>
            );
          })}
        </nav>
        <div className="site-nav-lang" role="group" aria-label={t.langToggle.aria}>
          <button
            type="button"
            className={locale === "fa" ? "is-active" : undefined}
            aria-pressed={locale === "fa"}
            onClick={() => setLocale("fa")}
          >
            {t.langToggle.fa}
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            className={locale === "en" ? "is-active" : undefined}
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            {t.langToggle.en}
          </button>
        </div>
      </div>
    </header>
  );
}
