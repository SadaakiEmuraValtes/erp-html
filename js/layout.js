// ============================================================
//  VALTES ERP Demo – Layout (header / side menu / footer) & UI helpers
//  各ページは <div id="page"> に本文を書き、buildPage() で左メニュー＋右本文の枠に組み込む
// ============================================================

const t = (ja, en) => I18n.t(ja, en);
const L = pair => (pair ? I18n.t(pair[0], pair[1]) : "");
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const qp = name => new URLSearchParams(window.location.search).get(name);

// ── 左メニュー定義（id は #menu-{id}） ──────────────────────
const MENU = [
  { group: ["ホーム", "Home"], items: [
    { id: "dashboard", href: "index.html", icon: "📊", label: ["ダッシュボード", "Dashboard"] },
  ]},
  { group: ["販売管理", "Sales"], items: [
    { id: "sales-orders",    href: "sales-orders.html", icon: "🧾", label: ["受注一覧", "Sales Orders"] },
    { id: "sales-order-new", href: "sales-order.html?mode=new", icon: "➕", label: ["受注登録", "New Sales Order"], perm: "so_edit" },
  ]},
  { group: ["購買管理", "Purchasing"], items: [
    { id: "purchase-orders",    href: "purchase-orders.html", icon: "📦", label: ["発注一覧", "Purchase Orders"] },
    { id: "purchase-order-new", href: "purchase-order.html?mode=new", icon: "➕", label: ["発注登録", "New Purchase Order"], perm: "po_edit" },
  ]},
  { group: ["物流", "Logistics"], items: [
    { id: "shipments", href: "shipments.html", icon: "🚚", label: ["配送管理", "Shipments"] },
  ]},
  { group: ["在庫管理", "Inventory"], items: [
    { id: "inventory", href: "inventory.html", icon: "🏬", label: ["在庫照会", "Stock Inquiry"] },
    { id: "movements", href: "movements.html", icon: "🔁", label: ["入出庫履歴", "Stock Movements"] },
  ]},
  { group: ["マスター", "Master Data"], items: [
    { id: "products",    href: "products.html", icon: "🗂", label: ["商品マスター", "Products"] },
    { id: "product-new", href: "product.html?mode=new", icon: "➕", label: ["商品登録", "New Product"], perm: "product_edit" },
    { id: "partners",    href: "partners.html", icon: "🏢", label: ["取引先マスター", "Business Partners"] },
  ]},
  { group: ["その他", "Other"], items: [
    { id: "help", href: "help.html", icon: "❔", label: ["ヘルプ・テストデータ", "Help & Test Data"] },
  ]},
];

function buildDisclaimer() {
  return `<div class="disclaimer-banner" id="disclaimer-banner">⚠️ <strong>${t("デモサイト：", "Demo Site:")}</strong>
    ${t("このサイトはテスト自動化の学習・デモ用に作成された架空のERPシステムです。掲載されている会社名・品名・メーカー・人物・金額はすべてフィクションです。",
        "This is a fictitious ERP system for test automation training and demos. All companies, products, makers, people and amounts are fictional.")}</div>`;
}

function buildHeader() {
  const u = ERP.currentUser();
  return `
<header class="erp-header" id="erp-header">
  <button class="menu-toggle" id="btn-menu-toggle" onclick="document.body.classList.toggle('menu-open')" title="${t("メニュー", "Menu")}">☰</button>
  <a href="${I18n.urlWith("index.html")}" class="erp-logo" id="logo"><span class="logo-mark">V</span> VALTES ERP <span class="logo-demo">Demo</span></a>
  <span class="erp-company" id="header-company">${t("バルテス商事株式会社（架空）", "Valtes Trading Co., Ltd. (fictional)")}</span>
  <div class="header-right">
    ${u ? `<span class="header-user" id="header-user" data-user-id="${u.id}" data-role="${u.role}">
        <span class="header-avatar">${esc((I18n.isEN() ? u.nameEn : u.name).charAt(0))}</span>
        <span><span id="header-user-name">${esc(t(u.name, u.nameEn))}</span><span class="header-role" id="header-user-role">${ERP.roleName(u.role)}</span></span>
      </span>` : ""}
    <button id="btn-lang-toggle" class="btn-lang" onclick="toggleLang()">${t("EN", "日本語")}</button>
    ${u ? `<button id="btn-logout" class="btn-header" onclick="logout()">${t("ログアウト", "Log Out")}</button>` : ""}
  </div>
</header>`;
}

function buildSideMenu(active) {
  return `
<nav class="side-menu" id="side-menu">
  ${MENU.map((g, gi) => `
    <div class="menu-group" id="menu-group-${gi + 1}">
      <div class="menu-group-title">${L(g.group)}</div>
      ${g.items.map(it => {
        const allowed = !it.perm || ERP.can(it.perm);
        return `<a href="${I18n.urlWith(it.href)}" id="menu-${it.id}" data-menu="${it.id}" class="menu-item${active === it.id ? " active" : ""}${allowed ? "" : " no-perm"}"
          ${allowed ? "" : `title="${t("権限がありません（閲覧のみ）", "No permission (view only)")}"`}><span class="menu-icon">${it.icon}</span>${L(it.label)}</a>`;
      }).join("")}
    </div>`).join("")}
</nav>`;
}

function buildFooter() {
  return `
<footer class="erp-footer" id="erp-footer">
  <div>© 2026 VALTES ERP Demo – Valtes Inc.</div>
  <div class="disclaimer-footer">${t(
    "【免責事項】本サイトはテスト自動化のデモンストレーション目的で作成された架空のシステムです。掲載されている会社名・品名・メーカー・取引先・人物・金額・在庫数はすべて架空であり、実在の企業・製品・人物とは一切関係ありません。実際の受発注・決済・配送は行われません。",
    "[Disclaimer] This site is a fictitious system created to demonstrate test automation. All company names, products, makers, partners, people, amounts and stock figures are fictional and unrelated to any real company, product or person. No real orders, payments or deliveries take place.")}</div>
</footer>
<div id="toast-container"></div>`;
}

// buildPage({ title, menu, crumbs: [[ja,en,href?], ...], requireLogin=true })
function buildPage({ title, menu = "", crumbs = [], requireLogin = true }) {
  ERP.init();
  if (requireLogin && !ERP.currentUser()) {
    window.location.replace(I18n.urlWith("login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search)));
    return false;
  }
  document.title = `${title} | VALTES ERP Demo`;
  if (I18n.isEN()) document.documentElement.lang = "en";
  const page = document.getElementById("page");
  const crumbHtml = crumbs.length ? `<ol class="breadcrumb" id="breadcrumb">
      <li><a href="${I18n.urlWith("index.html")}" id="crumb-home">${t("ホーム", "Home")}</a></li>
      ${crumbs.map((c, i) => `<li id="crumb-${i + 1}">${c[2] ? `<a href="${I18n.urlWith(c[2])}">${esc(L(c))}</a>` : esc(L(c))}</li>`).join("")}
    </ol>` : "";
  document.body.insertAdjacentHTML("afterbegin", buildDisclaimer() + buildHeader() +
    `<div class="erp-body" id="erp-body">${requireLogin ? buildSideMenu(menu) : ""}<main class="erp-main" id="main">${crumbHtml}</main></div>`);
  document.getElementById("main").appendChild(page);
  page.classList.remove("hidden");
  document.body.insertAdjacentHTML("beforeend", buildFooter());
  if (!requireLogin) document.body.classList.add("no-menu");
  I18n.apply();
  return true;
}

function toggleLang() {
  const url = new URL(window.location.href);
  if (I18n.isEN()) url.searchParams.delete("lang"); else url.searchParams.set("lang", "en");
  window.location.href = url.toString();
}

function logout() {
  if (!confirm(t("ログアウトしますか？", "Log out?"))) return;
  ERP.logout();
  I18n.go("login.html");
}

// ── UI ヘルパー ───────────────────────────────────────────────
function toast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.setAttribute("role", "status");
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 400); }, 3000);
}

// <option> 群。list: [{value, label}]
function optionsHtml(list, selected = "", emptyLabel = null) {
  return (emptyLabel !== null ? `<option value="">${esc(emptyLabel)}</option>` : "") +
    list.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(selected) ? " selected" : ""}>${esc(o.label)}</option>`).join("");
}
const OPTS = {
  category:    () => CATEGORIES.map(c => ({ value: c.code, label: `${c.code} ${L([c.name, c.en])}` })),
  // シリーズ（カテゴリ・ブランドで絞り込み）
  subCategory: (cat, mk) => CATEGORIES.filter(c => !cat || c.code === cat).flatMap(c => c.subs.filter(s => !mk || s.maker === mk).map(s => ({ value: s.code, label: `${s.code} ${L([s.name, s.en])}` }))),
  storage:     () => STORAGES.map(x => ({ value: x.code, label: ERP.label.storage(x.code) })),
  color:       () => COLORS.map(x => ({ value: x.code, label: ERP.label.color(x.code) })),
  maker:       () => MAKERS.map(m => ({ value: m.code, label: `${m.code} ${L([m.name, m.en])}` })),
  supplier:    (activeOnly) => PARTNERS.filter(p => p.kind === "supplier" && (!activeOnly || p.status === "active")).map(p => ({ value: p.code, label: `${p.code} ${ERP.partnerName(p.code)}` })),
  customer:    (activeOnly) => PARTNERS.filter(p => p.kind === "customer" && (!activeOnly || p.status === "active")).map(p => ({ value: p.code, label: `${p.code} ${ERP.partnerName(p.code)}` })),
  unit:        () => Object.keys(UNITS).map(k => ({ value: k, label: ERP.label.unit(k) })),
  tax:         () => Object.keys(TAX_TYPES).map(k => ({ value: k, label: ERP.label.tax(k) })),
  status:      () => Object.keys(PRODUCT_STATUS).map(k => ({ value: k, label: ERP.label.status(k) })),
  stockStatus: () => Object.keys(STOCK_STATUS).map(k => ({ value: k, label: ERP.label.stockStatus(k) })),
  warehouse:   () => WAREHOUSES.map(w => ({ value: w.code, label: `${w.code} ${ERP.label.warehouse(w.code)}` })),
  origin:      () => ORIGINS.map(o => ({ value: o.code, label: ERP.label.origin(o.code) })),
  carrier:     () => CARRIERS.map(c => ({ value: c.code, label: ERP.label.carrier(c.code) })),
  reason:      () => Object.keys(ADJUST_REASONS).map(k => ({ value: k, label: ERP.label.adjustReason(k) })),
};

// ステータスバッジ（data-status で値を取れる）
const BADGE_CLS = {
  active: "ok", suspended: "warn", discontinued: "gray", in: "ok", low: "warn", out: "danger",
  ordered: "info", instructed: "purple", shipped: "teal", delivered: "ok", cancelled: "gray", received: "ok",
  pending: "warn", in_transit: "teal", receive: "ok", ship: "info", adjust: "purple", customer: "info", supplier: "purple",
};
function badge(kind, value) {
  const text = { status: ERP.label.status, stockStatus: ERP.label.stockStatus, soStatus: ERP.label.soStatus, poStatus: ERP.label.poStatus,
    shStatus: ERP.label.shStatus, moveType: ERP.label.moveType, partnerKind: ERP.label.partnerKind, partnerStatus: ERP.label.partnerStatus }[kind](value);
  return `<span class="badge badge-${BADGE_CLS[value] || "gray"}" data-status="${value}">${esc(text)}</span>`;
}

// ── データテーブル ──────────────────────────────────────────
// XPath で特定しやすいように以下を必ず付与する:
//   <table id="{id}">  <th data-col="{key}">  <tr id="{rowPrefix}-{key}" data-key="{key}">
//   <td data-col="{key}" data-value="{生の値}" id="{rowPrefix}-{key}-{col}">
// columns: [{ key, label:[ja,en], cls, value(row) => 生の値, html(row) => 表示HTML(省略時は value をエスケープ) }]
function tableHtml({ id, columns, rows, rowKey, rowPrefix, emptyText, rowAttrs }) {
  if (!rows.length) return `<div class="empty" id="${id}-empty">${esc(emptyText || t("該当するデータがありません。", "No data found."))}</div>`;
  return `<div class="table-wrap"><table class="data-table" id="${id}">
    <thead><tr>${columns.map(c => `<th data-col="${c.key}" class="${c.cls || ""}">${esc(L(c.label))}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r, i) => {
      const k = rowKey(r);
      return `<tr id="${rowPrefix}-${k}" data-key="${esc(k)}" data-row="${i + 1}" ${rowAttrs ? rowAttrs(r) : ""}>${columns.map(c => {
        const v = c.value ? c.value(r) : "";
        return `<td data-col="${c.key}" data-value="${esc(v)}" id="${rowPrefix}-${k}-${c.key}" class="${c.cls || ""}">${c.html ? c.html(r) : esc(v)}</td>`;
      }).join("")}</tr>`;
    }).join("")}</tbody></table></div>`;
}

// ── ページャー（ボタンID: {pre}prev / {pre}next / {pre}first / {pre}last / {pre}page-N） ──
function pagerHtml(pre, current, total, fnName) {
  if (total <= 1) return "";
  const pages = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 2) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const b = (id, label, page, disabled, cls) => `<button class="pager-btn ${cls}" id="${pre}${id}" ${disabled ? "disabled" : ""} onclick="${fnName}(${page})">${label}</button>`;
  return `<nav class="pager" id="${pre}pager" data-current="${current}" data-total="${total}">` +
    b("first", "«", 1, current === 1, "pager-first") + b("prev", t("‹ 前へ", "‹ Prev"), current - 1, current === 1, "pager-prev") +
    pages.map(p => p === "…" ? `<span class="pager-ellipsis">…</span>` :
      `<button class="pager-btn pager-page${p === current ? " active" : ""}" id="${pre}page-${p}" data-page="${p}" onclick="${fnName}(${p})">${p}</button>`).join("") +
    b("next", t("次へ ›", "Next ›"), current + 1, current === total, "pager-next") + b("last", "»", total, current === total, "pager-last") + `</nav>`;
}

// ── モーダル ────────────────────────────────────────────────
function openModal(id, title, bodyHtml, footerHtml) {
  closeModal(id);
  const o = document.createElement("div");
  o.className = "modal-overlay"; o.id = id;
  o.innerHTML = `<div class="modal-box" role="dialog" aria-labelledby="${id}-title">
    <button class="modal-close" id="${id}-close" onclick="closeModal('${id}')">✕</button>
    <div class="modal-title" id="${id}-title">${title}</div>
    <div class="modal-body" id="${id}-body">${bodyHtml}</div>
    <div class="modal-footer" id="${id}-footer">${footerHtml}</div></div>`;
  o.addEventListener("click", e => { if (e.target === o) closeModal(id); });
  document.body.appendChild(o);
  return o;
}
function closeModal(id) { document.getElementById(id)?.remove(); }

// ── フォームエラー表示（#g-{field} に .has-error、#err-{field} に文言） ──
function showErrors(errors, fields) {
  fields.forEach(f => {
    document.getElementById("g-" + f)?.classList.toggle("has-error", !!errors[f]);
    const el = document.getElementById("err-" + f);
    if (el) el.textContent = errors[f] || "";
  });
  const box = document.getElementById("form-errors");
  if (box) {
    const msgs = Object.values(errors);
    box.innerHTML = msgs.length ? `<strong>${t("入力内容を確認してください", "Please check your input")}</strong><ul>${msgs.map(m => `<li class="form-error-item">${esc(m)}</li>`).join("")}</ul>` : "";
    box.classList.toggle("hidden", !msgs.length);
  }
}

// ── CSV ダウンロード（UTF-8 BOM付き） ─────────────────────────
function downloadCsv(filename, header, rows) {
  const q = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = "﻿" + [header, ...rows].map(r => r.map(q).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename; a.id = "csv-download-link";
  document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 100);
}

// 権限がないボタンは disabled＋理由を title に（data-perm で必要権限を判別できる）
function permAttr(perm) {
  return ERP.can(perm) ? `data-perm="${perm}"` : `data-perm="${perm}" disabled title="${t("この操作の権限がありません", "You do not have permission for this action")}"`;
}

const yen = n => ERP.fmtMoney(n);
const num = n => ERP.fmtNum(n);
const dt = s => ERP.fmtDate(s);

// ── 一覧画面の共通処理（検索条件 ⇔ URLパラメータ、ページ送り） ──
// 検索条件は URL に反映されるため、データドリブンテストでは URL を直接開いて検証できる
// fields: 検索フォームの項目名（要素ID は s-{項目名}）。checks: チェックボックス群（name=s-{項目名}、値はカンマ区切り）
function readSearchForm(fields, checks = []) {
  const c = {};
  fields.forEach(f => {
    const el = document.getElementById("s-" + f);
    if (!el) return;
    const v = el.type === "checkbox" ? (el.checked ? "1" : "") : el.value.trim();
    if (v !== "") c[f] = v;
  });
  checks.forEach(f => {
    const v = [...document.querySelectorAll(`input[name="s-${f}"]:checked`)].map(x => x.value);
    if (v.length) c[f] = v.join(",");
  });
  return c;
}
function fillSearchForm(fields, checks = []) {
  const q = new URLSearchParams(window.location.search);
  fields.forEach(f => {
    const el = document.getElementById("s-" + f);
    if (!el || !q.has(f)) return;
    if (el.type === "checkbox") el.checked = q.get(f) === "1"; else el.value = q.get(f);
    el.dispatchEvent(new Event("change"));
  });
  checks.forEach(f => {
    if (!q.has(f)) return;
    const vals = q.get(f).split(",");
    document.querySelectorAll(`input[name="s-${f}"]`).forEach(x => { x.checked = vals.includes(x.value); });
  });
  return Number(q.get("page")) || 1;
}
function writeSearchUrl(c, page) {
  const url = new URL(window.location.href);
  [...url.searchParams.keys()].filter(k => k !== "lang").forEach(k => url.searchParams.delete(k));
  Object.entries(c).forEach(([k, v]) => url.searchParams.set(k, v));
  if (page > 1) url.searchParams.set("page", page);
  history.replaceState(null, "", url);
}

// rows を size 件ずつに区切って描画。#result-count / #result-range / #pager-top / #pager-bottom を更新
function renderPaged(rows, page, size, renderRows, fnName) {
  const total = Math.max(1, Math.ceil(rows.length / size));
  const cur = Math.min(Math.max(1, page), total);
  const start = (cur - 1) * size, slice = rows.slice(start, start + size);
  const cnt = document.getElementById("result-count");
  cnt.textContent = t(`${num(rows.length)} 件`, `${num(rows.length)} records`);
  cnt.dataset.count = rows.length;
  document.getElementById("result-range").textContent = rows.length
    ? t(`${start + 1}〜${start + slice.length} 件目を表示`, `Showing ${start + 1}-${start + slice.length}`) : "";
  document.getElementById("pager-top").innerHTML = pagerHtml("top-", cur, total, fnName);
  document.getElementById("pager-bottom").innerHTML = pagerHtml("", cur, total, fnName);
  renderRows(slice, start);
  return cur;
}

// 遷移後に表示するメッセージ（#flash）
function setFlash(msg) { sessionStorage.setItem("erp_flash", msg); }
function showFlash() {
  const msg = sessionStorage.getItem("erp_flash");
  if (!msg) return;
  sessionStorage.removeItem("erp_flash");
  document.getElementById("page").insertAdjacentHTML("afterbegin", `<div class="alert alert-ok" id="flash" role="status">${esc(msg)}</div>`);
}
