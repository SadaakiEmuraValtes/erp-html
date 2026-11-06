// ============================================================
//  データドリブンテスト用の期待値CSVを生成する
//    node tools/gen-testdata.js
//  出力（初期データ＝ヘルプ画面で「データを初期化」した直後の状態）:
//    testdata/products_expected.csv     … 全商品の一覧表示値（商品マスター一覧の各セル data-value と一致）
//    testdata/product_search_cases.csv  … 商品検索の条件と期待結果（件数・先頭/末尾の品目など）
//    testdata/product_combination_cases.csv … 検索項目2つの全組み合わせ＋主要4項目の全組み合わせ（すべて1件以上HITすることを検証）
//    testdata/inventory_expected.csv    … 品目×倉庫の在庫（在庫照会の各セル data-value と一致）
//    testdata/sales_orders_expected.csv … 受注一覧の値
// ============================================================
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { console };
vm.createContext(ctx);
for (const f of ["data/master.js", "js/core.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8") + "\n;globalThis.ERP = typeof ERP !== 'undefined' ? ERP : undefined;", ctx, { filename: f });
const ERP = ctx.ERP;
const { CATEGORIES, MAKERS, STORAGES, COLORS, PRODUCT_STATUS, STOCK_STATUS, WAREHOUSES } = vm.runInContext("({ CATEGORIES, MAKERS, STORAGES, COLORS, PRODUCT_STATUS, STOCK_STATUS, WAREHOUSES })", ctx);
ERP.init();

const q = v => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const writeCsv = (file, header, rows) => {
  fs.mkdirSync(path.join(root, "testdata"), { recursive: true });
  fs.writeFileSync(path.join(root, "testdata", file), [header, ...rows].map(r => r.map(q).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`testdata/${file}: ${rows.length} rows`);
};

// ── 商品一覧の期待値 ──
const PCOLS = ["code", "name", "nameEn", "category", "maker", "subCategory", "storage", "color", "supplier", "unit", "unitPrice", "cost", "marginRate", "taxType",
  "totalStock", "allocated", "available", "onOrder", "stockStatus", "lotControl", "origin", "safetyStock", "leadTimeDays", "weight", "jan", "status",
  "registeredAt", "updatedAt", "stock_WH01", "stock_WH02", "stock_WH03"];
const pval = (r, c) => c === "marginRate" ? r.marginRate.toFixed(1) : c === "lotControl" ? (r.lotControl ? "yes" : "no") : r[c];
writeCsv("products_expected.csv", PCOLS, ERP.searchProducts({}).map(r => PCOLS.map(c => pval(r, c))));

// ── 商品検索ケース ──
// 条件のキーは products.html の URL パラメータ／検索フォーム（#s-{キー}）と同じ。storages / colors / statuses はカンマ区切り（中はOR）
const CRITERIA = ["keyword", "code", "category", "maker", "subCategory", "storages", "colors", "priceMin", "priceMax", "statuses", "stockStatus",
  "warehouse", "regFrom", "regTo", "sort"];
const urlOf = c => "products.html" + (Object.keys(c).length ? "?" + new URLSearchParams(c).toString() : "");
const CASES = [
  ["全件（条件なし）", {}],
  ["品目コード部分一致：テスト用品目", { code: "P-000" }],
  ["品目コード完全一致：高額品", { code: "P-00006" }],
  ["キーワード：シリーズ名（日本語）", { keyword: "Vフォン" }],
  ["キーワード：英名（大文字小文字区別なし）", { keyword: "leafpad" }],
  ["キーワード：全角英数（全角半角を区別しない）", { keyword: "ＳＴＥＬＬＡ" }],
  ["キーワード：複数語AND（シリーズ＋容量＋カラー）", { keyword: "Vフォン 128GB ブラック" }],
  ["キーワード：複数語AND（ブランド名＋カラー英名）", { keyword: "ツバサ pink" }],
  ["キーワード：該当なし", { keyword: "存在しない品名" }],
  ["キーワード：記号を含む", { keyword: "A&B" }],
  ["カテゴリ：スマートフォン", { category: "SPH" }],
  ["カテゴリ：タブレット", { category: "TAB" }],
  ["ブランド", { maker: "MK03" }],
  ["カテゴリ＋ブランド", { category: "TAB", maker: "MK02" }],
  ["シリーズ", { subCategory: "SPH-STU" }],
  ["ストレージ：単一", { storages: "512" }],
  ["ストレージ：複数（OR）", { storages: "128,256" }],
  ["カラー：単一", { colors: "PK" }],
  ["カラー：複数（OR）", { colors: "BK,WH" }],
  ["単価下限", { priceMin: "100000" }],
  ["単価上限", { priceMax: "40000" }],
  ["単価範囲", { priceMin: "50000", priceMax: "80000" }],
  ["単価範囲（境界値：同値）", { priceMin: "89800", priceMax: "89800" }],
  ["ステータス：有効のみ", { statuses: "active" }],
  ["ステータス：販売停止＋廃番", { statuses: "suspended,discontinued" }],
  ["在庫状態：在庫なし", { stockStatus: "out" }],
  ["在庫状態：安全在庫割れ", { stockStatus: "low" }],
  ["在庫のある倉庫：福岡", { warehouse: "WH03" }],
  ["発売日：2026/01/01以降", { regFrom: "2026-01-01" }],
  ["発売日：範囲指定", { regFrom: "2024-01-01", regTo: "2024-12-31" }],
  ["並び順：単価が高い順（タブレット）", { category: "TAB", sort: "price_desc" }],
  ["並び順：有効在庫が少ない順（有効品）", { statuses: "active", sort: "stock_asc" }],
  ["並び順：発売日が新しい順", { sort: "reg_desc" }],
  ["複合：スマホ×ブランド×容量×カラー", { category: "SPH", maker: "MK01", storages: "256", colors: "BL" }],
  ["複合：タブレット×容量複数×カラー複数×有効", { category: "TAB", storages: "64,128", colors: "WH,PK", statuses: "active" }],
  ["複合：在庫なし×東京に現在庫あり（全数引当済み）", { stockStatus: "out", warehouse: "WH01" }],
  ["複合：スマホ×単価10万以下×在庫あり×大阪在庫×安い順", { category: "SPH", priceMax: "100000", stockStatus: "in", warehouse: "WH02", sort: "price_asc" }],
  ["複合：キーワード×シリーズ×販売停止＋廃番", { keyword: "lite", subCategory: "TAB-STL", statuses: "suspended,discontinued" }],
  ["複合：ブランド×容量×安全在庫割れ", { maker: "MK04", storages: "512", stockStatus: "low" }],
  ["複合：カテゴリ×ブランド×シリーズ×容量×カラー×ステータス×発売日", { category: "TAB", maker: "MK03", subCategory: "TAB-ST13", storages: "128,512", colors: "BK,BL", statuses: "active,suspended", regFrom: "2026-01-01" }],
  ["複合：該当なし（単価範囲×カテゴリ）", { category: "TAB", priceMin: "9000000", priceMax: "9000000" }],
];
writeCsv("product_search_cases.csv",
  ["case_id", "description", "url", ...CRITERIA, "expected_count", "expected_pages_20", "expected_first_code", "expected_first_name", "expected_first_unitPrice",
   "expected_first_available", "expected_first_stockStatus", "expected_last_code", "expected_sum_unitPrice"],
  CASES.map(([desc, c], i) => {
    const rows = ERP.searchProducts(c);
    const f = rows[0], l = rows[rows.length - 1];
    return [`PS-${String(i + 1).padStart(3, "0")}`, desc, urlOf(c), ...CRITERIA.map(k => c[k] ?? ""), rows.length, Math.max(1, Math.ceil(rows.length / 20)),
      f?.code ?? "", f?.name ?? "", f?.unitPrice ?? "", f?.available ?? "", f?.stockStatus ?? "", l?.code ?? "", rows.reduce((s, r) => s + r.unitPrice, 0)];
  }));

// ── 組み合わせ網羅ケース（選択式の検索項目を2つ組み合わせた全パターン） ──
// どの2項目の組み合わせでも1件以上HITすることをここで検証する（0件があれば生成を失敗させる）。
// シリーズはカテゴリ・ブランドに従属するため、シリーズ×カテゴリ／ブランドは整合する組み合わせのみ。
const DIMS = [
  ["category", CATEGORIES.map(c => c.code)],
  ["maker", MAKERS.map(m => m.code)],
  ["subCategory", CATEGORIES.flatMap(c => c.subs.map(s => s.code))],
  ["storages", STORAGES.map(s => s.code)],
  ["colors", COLORS.map(c => c.code)],
  ["statuses", Object.keys(PRODUCT_STATUS)],
  ["stockStatus", Object.keys(STOCK_STATUS)],
  ["warehouse", WAREHOUSES.map(w => w.code)],
];
const seriesOf = code => CATEGORIES.flatMap(c => c.subs.map(s => ({ ...s, category: c.code }))).find(s => s.code === code);
const consistent = c => {
  if (!c.subCategory) return true;
  const s = seriesOf(c.subCategory);
  return (!c.category || c.category === s.category) && (!c.maker || c.maker === s.maker);
};
const combos = [];
for (let a = 0; a < DIMS.length; a++) for (let b = a + 1; b < DIMS.length; b++)
  DIMS[a][1].forEach(va => DIMS[b][1].forEach(vb => { const c = { [DIMS[a][0]]: va, [DIMS[b][0]]: vb }; if (consistent(c)) combos.push(c); }));
// 主要4項目（カテゴリ×ブランド×容量×カラー）の全組み合わせも追加
CATEGORIES.forEach(cat => MAKERS.forEach(m => STORAGES.forEach(st => COLORS.forEach(co =>
  combos.push({ category: cat.code, maker: m.code, storages: st.code, colors: co.code })))));
const COMBO_KEYS = DIMS.map(d => d[0]);
const zero = [];
writeCsv("product_combination_cases.csv",
  ["case_id", "fields", "url", ...COMBO_KEYS, "expected_count", "expected_first_code", "expected_last_code"],
  combos.map((c, i) => {
    const rows = ERP.searchProducts(c);
    if (!rows.length) zero.push(c);
    return [`PC-${String(i + 1).padStart(4, "0")}`, Object.keys(c).join("+"), urlOf(c), ...COMBO_KEYS.map(k => c[k] ?? ""), rows.length, rows[0]?.code ?? "", rows[rows.length - 1]?.code ?? ""];
  }));
if (zero.length) {
  console.error(`✗ ${zero.length} combinations have no hits:`);
  zero.forEach(c => console.error("  " + JSON.stringify(c)));
  process.exitCode = 1;
} else console.log(`✓ all ${combos.length} combinations hit at least 1 product`);

// ── 在庫照会の期待値 ──
writeCsv("inventory_expected.csv", ["key", "productCode", "warehouse", "qty", "allocated", "available", "onOrder", "safety", "status"],
  ERP.searchInventory({}).map(i => [`${i.productCode}-${i.warehouse}`, i.productCode, i.warehouse, i.qty, i.allocated, i.available, i.onOrder, i.safety, i.status]));

// ── 受注一覧の期待値 ──
writeCsv("sales_orders_expected.csv", ["no", "orderDate", "customer", "warehouse", "requestedDate", "lineCount", "qty", "subtotal", "tax", "total", "status"],
  ERP.searchSalesOrders({}).map(o => { const a = ERP.orderAmounts(o); return [o.no, o.orderDate, o.customer, o.warehouse, o.requestedDate, o.lines.length, a.qty, a.subtotal, a.tax, a.total, o.status]; }));
