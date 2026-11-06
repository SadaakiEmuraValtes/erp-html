// ============================================================
//  データドリブンテスト用の期待値CSVを生成する
//    node tools/gen-testdata.js
//  出力（初期データ＝ヘルプ画面で「データを初期化」した直後の状態）:
//    testdata/products_expected.csv     … 全商品の一覧表示値（商品マスター一覧の各セル data-value と一致）
//    testdata/product_search_cases.csv  … 商品検索の条件と期待結果（件数・先頭/末尾の品目など）
//    testdata/inventory_expected.csv    … 品目×倉庫の在庫（在庫照会の各セル data-value と一致）
//    testdata/sales_orders_expected.csv … 受注一覧の値
// ============================================================
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const ctx = { console };
vm.createContext(ctx);
for (const f of ["data/master.js", "js/core.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8") + "\n;globalThis.ERP = typeof ERP !== 'undefined' ? ERP : undefined;", ctx, { filename: f });
const ERP = ctx.ERP;
ERP.init();

const q = v => { const s = String(v ?? ""); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const writeCsv = (file, header, rows) => {
  fs.mkdirSync(path.join(root, "testdata"), { recursive: true });
  fs.writeFileSync(path.join(root, "testdata", file), [header, ...rows].map(r => r.map(q).join(",")).join("\r\n") + "\r\n", "utf8");
  console.log(`testdata/${file}: ${rows.length} rows`);
};

// ── 商品一覧の期待値 ──
const PCOLS = ["code", "name", "nameEn", "category", "subCategory", "maker", "supplier", "unit", "unitPrice", "cost", "marginRate", "taxType",
  "totalStock", "allocated", "available", "onOrder", "stockStatus", "lotControl", "origin", "safetyStock", "leadTimeDays", "weight", "jan", "status",
  "registeredAt", "updatedAt", "stock_WH01", "stock_WH02", "stock_WH03"];
const pval = (r, c) => c === "marginRate" ? r.marginRate.toFixed(1) : c === "lotControl" ? (r.lotControl ? "yes" : "no") : r[c];
writeCsv("products_expected.csv", PCOLS, ERP.searchProducts({}).map(r => PCOLS.map(c => pval(r, c))));

// ── 商品検索ケース ──
// 条件のキーは products.html の URL パラメータ／検索フォーム（#s-{キー}）と同じ。statuses はカンマ区切り
const CRITERIA = ["code", "name", "category", "subCategory", "maker", "supplier", "unit", "priceMin", "priceMax", "statuses", "stockStatus",
  "warehouse", "taxType", "lotControl", "origin", "regFrom", "regTo", "sort"];
const CASES = [
  ["全件（条件なし）", {}],
  ["品目コード部分一致：テスト用品目", { code: "P-000" }],
  ["品目コード完全一致：高額品", { code: "P-00006" }],
  ["品名部分一致（日本語）", { name: "ボルト" }],
  ["品名部分一致（英語・大文字小文字区別なし）", { name: "bearing" }],
  ["品名：該当なし", { name: "存在しない品名" }],
  ["品名：記号を含む", { name: "A&B" }],
  ["カテゴリ", { category: "ELC" }],
  ["カテゴリ＋サブカテゴリ", { category: "MEC", subCategory: "MEC-GER" }],
  ["メーカー", { maker: "MK03" }],
  ["仕入先", { supplier: "S-001" }],
  ["単位", { unit: "roll" }],
  ["単価下限", { priceMin: "10000" }],
  ["単価上限", { priceMax: "500" }],
  ["単価範囲", { priceMin: "1000", priceMax: "2000" }],
  ["単価範囲（境界値：同値）", { priceMin: "1000", priceMax: "1000" }],
  ["ステータス：有効のみ", { statuses: "active" }],
  ["ステータス：販売停止＋廃番", { statuses: "suspended,discontinued" }],
  ["在庫状態：在庫なし", { stockStatus: "out" }],
  ["在庫状態：安全在庫割れ", { stockStatus: "low" }],
  ["在庫のある倉庫：福岡", { warehouse: "WH03" }],
  ["課税区分：軽減8%", { taxType: "reduced" }],
  ["課税区分：非課税", { taxType: "exempt" }],
  ["ロット管理あり", { lotControl: "yes" }],
  ["ロット管理なし×電子部品", { lotControl: "no", category: "ELC" }],
  ["原産国：ドイツ", { origin: "DE" }],
  ["登録日：2026/01/01以降", { regFrom: "2026-01-01" }],
  ["登録日：範囲指定", { regFrom: "2023-04-01", regTo: "2023-09-30" }],
  ["並び順：単価が高い順（工具）", { category: "TLS", sort: "price_desc" }],
  ["並び順：有効在庫が少ない順（有効品）", { statuses: "active", sort: "stock_asc" }],
  ["並び順：登録日が新しい順", { sort: "reg_desc" }],
  ["複合：事務用品×標準税率×有効×在庫あり×単価安い順", { category: "OFS", taxType: "standard", statuses: "active", stockStatus: "in", sort: "price_asc" }],
  ["複合：安全用品×メーカーMK02×単価3000以下×品名順", { category: "SFT", maker: "MK02", priceMax: "3000", sort: "name_asc" }],
  ["複合：東京在庫あり×ロット管理×中国産", { warehouse: "WH01", lotControl: "yes", origin: "CN" }],
  ["複合：該当なし（単価範囲×カテゴリ）", { category: "OFS", priceMin: "9000000" }],
];
writeCsv("product_search_cases.csv",
  ["case_id", "description", "url", ...CRITERIA, "expected_count", "expected_pages_20", "expected_first_code", "expected_first_name", "expected_first_unitPrice",
   "expected_first_available", "expected_first_stockStatus", "expected_last_code", "expected_sum_unitPrice"],
  CASES.map(([desc, c], i) => {
    const rows = ERP.searchProducts({ ...c, statuses: c.statuses ? c.statuses.split(",") : [] });
    const f = rows[0], l = rows[rows.length - 1];
    const url = "products.html" + (Object.keys(c).length ? "?" + new URLSearchParams(c).toString() : "");
    return [`PS-${String(i + 1).padStart(3, "0")}`, desc, url, ...CRITERIA.map(k => c[k] ?? ""), rows.length, Math.max(1, Math.ceil(rows.length / 20)),
      f?.code ?? "", f?.name ?? "", f?.unitPrice ?? "", f?.available ?? "", f?.stockStatus ?? "", l?.code ?? "", rows.reduce((s, r) => s + r.unitPrice, 0)];
  }));

// ── 在庫照会の期待値 ──
writeCsv("inventory_expected.csv", ["key", "productCode", "warehouse", "qty", "allocated", "available", "onOrder", "safety", "status"],
  ERP.searchInventory({}).map(i => [`${i.productCode}-${i.warehouse}`, i.productCode, i.warehouse, i.qty, i.allocated, i.available, i.onOrder, i.safety, i.status]));

// ── 受注一覧の期待値 ──
writeCsv("sales_orders_expected.csv", ["no", "orderDate", "customer", "warehouse", "requestedDate", "lineCount", "qty", "subtotal", "tax", "total", "status"],
  ERP.searchSalesOrders({}).map(o => { const a = ERP.orderAmounts(o); return [o.no, o.orderDate, o.customer, o.warehouse, o.requestedDate, o.lines.length, a.qty, a.subtotal, a.tax, a.total, o.status]; }));
