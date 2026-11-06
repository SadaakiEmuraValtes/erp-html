// ============================================================
//  VALTES ERP Demo – i18n (Internationalization) Module
//  ?lang=en を付けると英語表示。遷移先URLにも自動で引き継ぐ
// ============================================================

const I18n = (() => {
  // ── 英語モード判定（URLパラメータのみで制御）──────────────
  function isEN() {
    return new URLSearchParams(window.location.search).get("lang") === "en";
  }

  // ── 言語に応じた文字列を返す ──────────────────────────────
  function t(ja, en) {
    return isEN() ? en : ja;
  }

  // ── URL に ?lang=en を付加して返す ────────────────────────
  function urlWith(url) {
    if (!isEN() || !url) return url;
    if (url.startsWith("#")) return url;
    if (url.includes("lang=en")) return url;
    const hashIdx = url.indexOf("#");
    if (hashIdx !== -1) {
      const base = url.slice(0, hashIdx), anchor = url.slice(hashIdx);
      return base + (base.includes("?") ? "&" : "?") + "lang=en" + anchor;
    }
    return url + (url.includes("?") ? "&" : "?") + "lang=en";
  }

  // ── window.location.href の代替（lang 付加）──────────────
  function go(url) { window.location.href = urlWith(url); }

  // ── window.open の代替（lang 付加）───────────────────────
  function open(url, target, features) { window.open(urlWith(url), target || "_blank", features); }

  // ── [data-i18n-en] 属性を持つ要素に英語テキストを適用 ────
  // buildPage() の末尾から呼ぶ
  function apply() {
    if (!isEN()) return;
    document.documentElement.lang = "en";

    document.querySelectorAll("[data-i18n-en]").forEach(el => {
      const en = el.getAttribute("data-i18n-en");
      if (en === null) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.placeholder = en;
      else el.textContent = en;
    });

    document.querySelectorAll("[data-i18n-ph-en]").forEach(el => {
      el.placeholder = el.getAttribute("data-i18n-ph-en");
    });

    // 内部リンクに ?lang=en を付加
    document.querySelectorAll("a[href]").forEach(el => {
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") ||
          href.startsWith("javascript") || href.startsWith("mailto")) return;
      el.setAttribute("href", urlWith(href));
    });
  }

  return { isEN, t, urlWith, go, open, apply };
})();
