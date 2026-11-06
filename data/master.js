// ============================================================
//  VALTES ERP Demo – Master Data
//  ※ すべてデモ用の架空データです（会社名・品名・メーカー・人物は架空）
//  データドリブンテストで期待値が変わらないよう、日付は固定・乱数は固定シードの LCG
// ============================================================

// ── 乱数（固定シード LCG） ──────────────────────────────────
function _lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
}
function _addDays(ymd, n) {
  const d = new Date(ymd + "T00:00:00"); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── ユーザー（ロール別） ────────────────────────────────────
const USERS = [
  { id: "admin",    password: "Erp#Admin2026",  name: "山田 太郎", nameEn: "Taro Yamada",    role: "admin",     dept: "情報システム部", deptEn: "IT Dept." },
  { id: "sales01",  password: "Sales!Order77",  name: "鈴木 花子", nameEn: "Hanako Suzuki",  role: "sales",     dept: "営業部",         deptEn: "Sales Dept." },
  { id: "buyer01",  password: "Buy$Supply88",   name: "田中 健一", nameEn: "Kenichi Tanaka", role: "purchase",  dept: "購買部",         deptEn: "Purchasing Dept." },
  { id: "wh01",     password: "Wh@Stock2026",   name: "佐藤 美咲", nameEn: "Misaki Sato",    role: "warehouse", dept: "物流部",         deptEn: "Logistics Dept." },
  { id: "viewer01", password: "View%Only55",    name: "中村 龍也", nameEn: "Ryuya Nakamura", role: "viewer",    dept: "経理部",         deptEn: "Accounting Dept." },
];

const ROLES = {
  admin:     { name: "システム管理者", en: "Administrator" },
  sales:     { name: "営業",           en: "Sales" },
  purchase:  { name: "購買",           en: "Purchasing" },
  warehouse: { name: "倉庫",           en: "Warehouse" },
  viewer:    { name: "閲覧のみ",       en: "Read-only" },
};

// 権限 → 操作できるロール
const PERMISSIONS = {
  product_edit: ["admin", "purchase"],             // 商品マスター登録・編集
  so_edit:      ["admin", "sales"],                // 受注登録・キャンセル・出荷指示
  po_edit:      ["admin", "purchase"],             // 発注登録・キャンセル
  po_receive:   ["admin", "purchase", "warehouse"],// 入荷処理
  ship:         ["admin", "warehouse"],            // 出荷確定・配達完了
  inv_adjust:   ["admin", "warehouse"],            // 在庫調整
};
const PERMISSION_LABELS = {
  product_edit: ["商品マスター登録・編集", "Edit product master"],
  so_edit:      ["受注登録・キャンセル・出荷指示", "Create / cancel sales orders, shipping instruction"],
  po_edit:      ["発注登録・キャンセル", "Create / cancel purchase orders"],
  po_receive:   ["入荷処理", "Goods receipt"],
  ship:         ["出荷確定・配達完了", "Confirm shipment / delivery"],
  inv_adjust:   ["在庫調整", "Inventory adjustment"],
};

// ── 倉庫 ───────────────────────────────────────────────────
const WAREHOUSES = [
  { code: "WH01", name: "東京中央倉庫",     en: "Tokyo Central Warehouse" },
  { code: "WH02", name: "大阪物流センター", en: "Osaka Logistics Center" },
  { code: "WH03", name: "福岡配送センター", en: "Fukuoka Distribution Center" },
];

// ── 区分値 ─────────────────────────────────────────────────
const TAX_TYPES = {
  standard: { name: "標準10%", en: "Standard 10%", rate: 0.10 },
  reduced:  { name: "軽減8%",  en: "Reduced 8%",   rate: 0.08 },
  exempt:   { name: "非課税",  en: "Tax-exempt",   rate: 0 },
};
const PRODUCT_STATUS = {
  active:       { name: "有効",     en: "Active" },
  suspended:    { name: "販売停止", en: "Suspended" },
  discontinued: { name: "廃番",     en: "Discontinued" },
};
const STOCK_STATUS = {
  in:  { name: "在庫あり",     en: "In stock" },
  low: { name: "安全在庫割れ", en: "Low stock" },
  out: { name: "在庫なし",     en: "Out of stock" },
};
const ORIGINS = [
  { code: "JP", name: "日本", en: "Japan" }, { code: "CN", name: "中国", en: "China" },
  { code: "VN", name: "ベトナム", en: "Vietnam" }, { code: "TH", name: "タイ", en: "Thailand" },
  { code: "TW", name: "台湾", en: "Taiwan" }, { code: "IN", name: "インド", en: "India" },
];
// ブランド（すべて架空）
const MAKERS = [
  { code: "MK01", name: "バルテスモバイル", en: "Valtes Mobile" },
  { code: "MK02", name: "アオバ電機",       en: "Aoba Denki" },
  { code: "MK03", name: "ホクトテック",     en: "Hokuto Tech" },
  { code: "MK04", name: "ツバサ電子",       en: "Tsubasa Denshi" },
];
const UNITS = {
  unit: { name: "台", en: "unit" }, set: { name: "セット", en: "set" }, pcs: { name: "個", en: "pcs" },
};
// ストレージ容量（add: 64GB からの価格差）
const STORAGES = [
  { code: "64",  name: "64GB",  en: "64GB",  add: 0 },
  { code: "128", name: "128GB", en: "128GB", add: 10000 },
  { code: "256", name: "256GB", en: "256GB", add: 25000 },
  { code: "512", name: "512GB", en: "512GB", add: 50000 },
];
const COLORS = [
  { code: "BK", name: "ブラック", en: "Black" },
  { code: "WH", name: "ホワイト", en: "White" },
  { code: "BL", name: "ブルー",   en: "Blue" },
  { code: "PK", name: "ピンク",   en: "Pink" },
];

// ── カテゴリ・シリーズ（商品生成の元データ） ──────────────
// カテゴリ＝スマートフォン／タブレット、シリーズ（subCategory）＝ブランドごとの機種（ブランド×カテゴリに2シリーズずつ）
// 各シリーズを ストレージ4 × カラー4 ＝16品目に展開する（どの組み合わせでも必ず品目が存在する）
// price: 64GB の販売単価 / screen: 画面サイズ（インチ） / weight: g / release: 発売日（＝登録日）
const CATEGORIES = [
  { code: "SPH", name: "スマートフォン", en: "Smartphones", subs: [
    { code: "SPH-VP15", name: "Vフォン 15",     en: "V-Phone 15",     maker: "MK01", price: 89800,  screen: 6.1, weight: 172, release: "2025-09-19", origin: "JP" },
    { code: "SPH-VPLT", name: "Vフォン Lite",   en: "V-Phone Lite",   maker: "MK01", price: 39800,  screen: 6.1, weight: 165, release: "2024-03-08", origin: "VN" },
    { code: "SPH-LFX",  name: "リーフ X",       en: "Leaf X",         maker: "MK02", price: 99800,  screen: 6.7, weight: 205, release: "2026-02-20", origin: "TW" },
    { code: "SPH-LFS",  name: "リーフ S",       en: "Leaf S",         maker: "MK02", price: 49800,  screen: 6.4, weight: 188, release: "2023-11-17", origin: "CN" },
    { code: "SPH-STU",  name: "ステラ Ultra",   en: "Stella Ultra",   maker: "MK03", price: 129800, screen: 6.8, weight: 228, release: "2026-06-12", origin: "JP" },
    { code: "SPH-STN",  name: "ステラ Neo",     en: "Stella Neo",     maker: "MK03", price: 34800,  screen: 6.5, weight: 190, release: "2024-08-23", origin: "IN" },
    { code: "SPH-WG1",  name: "ウイング One",   en: "Wing One",       maker: "MK04", price: 79800,  screen: 6.3, weight: 180, release: "2025-04-25", origin: "TH" },
    { code: "SPH-WGG",  name: "ウイング Go",    en: "Wing Go",        maker: "MK04", price: 24800,  screen: 6.0, weight: 158, release: "2023-06-30", origin: "CN" },
  ]},
  { code: "TAB", name: "タブレット", en: "Tablets", subs: [
    { code: "TAB-VTP",  name: "Vタブ Pro 12",   en: "V-Tab Pro 12",   maker: "MK01", price: 119800, screen: 12.4, weight: 610, release: "2025-11-14", origin: "JP" },
    { code: "TAB-VT8",  name: "Vタブ 8",        en: "V-Tab 8",        maker: "MK01", price: 29800,  screen: 8.0,  weight: 320, release: "2023-09-08", origin: "VN" },
    { code: "TAB-LP11", name: "リーフパッド 11",   en: "LeafPad 11",   maker: "MK02", price: 64800,  screen: 11.0, weight: 480, release: "2024-10-11", origin: "TW" },
    { code: "TAB-LPM",  name: "リーフパッド mini", en: "LeafPad mini", maker: "MK02", price: 39800,  screen: 8.3,  weight: 300, release: "2026-04-17", origin: "CN" },
    { code: "TAB-ST13", name: "ステラタブ 13",     en: "Stella Tab 13",   maker: "MK03", price: 99800, screen: 13.0, weight: 680, release: "2026-09-04", origin: "JP" },
    { code: "TAB-STL",  name: "ステラタブ Lite",   en: "Stella Tab Lite", maker: "MK03", price: 32800, screen: 10.1, weight: 450, release: "2024-01-26", origin: "IN" },
    { code: "TAB-WP11", name: "ウイングパッド 11",   en: "WingPad 11",   maker: "MK04", price: 54800, screen: 11.0, weight: 500, release: "2025-07-18", origin: "TH" },
    { code: "TAB-WPK",  name: "ウイングパッド Kids", en: "WingPad Kids", maker: "MK04", price: 19800, screen: 8.0,  weight: 360, release: "2023-04-14", origin: "CN" },
  ]},
];

// ── 取引先（得意先・仕入先） ────────────────────────────────
const _PARTNER_HEAD = [["青葉", "Aoba"], ["若葉", "Wakaba"], ["大和", "Yamato"], ["富士見", "Fujimi"], ["港南", "Konan"], ["東和", "Towa"], ["朝日丘", "Asahigaoka"],
  ["白樺", "Shirakaba"], ["瑞穂", "Mizuho"], ["北斗", "Hokuto"], ["光輝", "Koki"], ["緑川", "Midorikawa"], ["星川", "Hoshikawa"], ["千早", "Chihaya"], ["高砂", "Takasago"]];
const _PARTNER_TAIL = [["商事", "Shoji"], ["工業", "Kogyo"], ["製作所", "Works"], ["電機", "Denki"], ["物産", "Bussan"], ["テクノ", "Techno"], ["産業", "Sangyo"]];
const _PREFS = ["東京都", "神奈川県", "埼玉県", "愛知県", "大阪府", "兵庫県", "福岡県", "宮城県", "北海道", "広島県"];
const PAY_TERMS = {
  m1: { name: "月末締め翌月末払い", en: "Net end of next month" },
  m2: { name: "20日締め翌月10日払い", en: "20th close, paid 10th next month" },
  cash: { name: "前払い", en: "Prepayment" },
};

const PARTNERS = (() => {
  const r = _lcg(7001), list = [];
  const make = (kind, i) => {
    const h = _PARTNER_HEAD[(i * 7 + (kind === "supplier" ? 3 : 0)) % _PARTNER_HEAD.length];
    const t = _PARTNER_TAIL[(i * 3 + (kind === "supplier" ? 1 : 0)) % _PARTNER_TAIL.length];
    const pref = _PREFS[Math.floor(r() * _PREFS.length)];
    return {
      code: kind === "customer" ? `C-${String(i + 1).padStart(4, "0")}` : `S-${String(i + 1).padStart(3, "0")}`,
      kind, name: `株式会社${h[0]}${t[0]}`, nameEn: `${h[1]} ${t[1]} Co., Ltd.`, pref,
      phone: `0${3 + Math.floor(r() * 6)}-${1000 + Math.floor(r() * 9000)}-${1000 + Math.floor(r() * 9000)}`,
      contact: ["佐々木", "高橋", "伊藤", "渡辺", "小林", "加藤", "吉田", "山口"][Math.floor(r() * 8)],
      payTerm: ["m1", "m1", "m2", "cash"][Math.floor(r() * 4)],
      creditLimit: kind === "customer" ? (1 + Math.floor(r() * 50)) * 500000 : 0,
      status: r() < 0.9 ? "active" : "suspended",
    };
  };
  for (let i = 0; i < 25; i++) list.push(make("customer", i));
  for (let i = 0; i < 12; i++) list.push(make("supplier", i));
  // テスト用の固定値
  list[0].status = "active"; list[0].creditLimit = 30000000;  // C-0001: 標準得意先
  list[1].status = "suspended";                              // C-0002: 取引停止の得意先
  list[25].status = "active";                                // S-001: 標準仕入先
  return list;
})();

const ADJUST_REASONS = {
  stocktake: { name: "棚卸差異", en: "Stocktaking difference" },
  damage:    { name: "破損・不良", en: "Damage / defect" },
  sample:    { name: "サンプル出荷", en: "Sample shipment" },
  other:     { name: "その他", en: "Other" },
};

const CARRIERS = [
  { code: "CR1", name: "バルテス運輸", en: "Valtes Transport" },
  { code: "CR2", name: "青空急便",     en: "Aozora Express" },
  { code: "CR3", name: "港湾ロジ",     en: "Kowan Logi" },
];

// ── 商品マスター（テスト用12件＋自動生成256件） ─────────────
function _jan(seq) {
  const body = "4900" + String(seq).padStart(8, "0");
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 ? 3 : 1);
  return body + ((10 - sum % 10) % 10);
}
function _series(code) { for (const c of CATEGORIES) { const s = c.subs.find(x => x.code === code); if (s) return { cat: c, sub: s }; } return null; }

const PRODUCTS = (() => {
  const r = _lcg(20260401);
  const round100 = v => Math.round(v / 100) * 100;
  const list = [];
  const base = (o) => Object.assign({
    supplier: "S-001", origin: "JP", taxType: "standard", status: "active", lotControl: false,
    leadTimeDays: 7, safetyStock: 50, weight: 180, registeredAt: "2024-04-01", updatedAt: "2026-09-01",
    remarks: "", remarksEn: "",
  }, o);

  // テスト用の固定品目（P-00001〜P-00012）。カテゴリ・ブランドはシリーズから決まる
  const T = (code, name, nameEn, series, storage, color, unit, unitPrice, cost, stock, o = {}) => {
    const { cat, sub } = _series(series);
    list.push(base({ code, name, nameEn, category: cat.code, subCategory: sub.code, maker: sub.maker, storage, color, unit, unitPrice, cost, stock,
      jan: _jan(Number(code.slice(2))), lotControl: cat.code === "SPH", weight: sub.weight, ...o }));
  };
  T("P-00001", "バルテス 標準テスト品", "Valtes Standard Test Item", "SPH-VP15", "128", "BK", "unit", 1000, 600, { WH01: 300, WH02: 200, WH03: 100 },
    { remarks: "標準的な値のテスト用品目", remarksEn: "Test item with standard values" });
  T("P-00002", "在庫ゼロ品", "Zero Stock Item", "TAB-VT8", "64", "WH", "unit", 2500, 1500, { WH01: 0, WH02: 0, WH03: 0 },
    { remarks: "全倉庫で在庫0（在庫なし）", remarksEn: "No stock in any warehouse" });
  T("P-00003", "安全在庫割れ品", "Low Stock Item", "SPH-LFS", "128", "BL", "unit", 1200, 700, { WH01: 10, WH02: 5, WH03: 0 },
    { safetyStock: 100, remarks: "有効在庫が安全在庫を下回る", remarksEn: "Available stock below safety stock" });
  T("P-00004", "販売停止品", "Suspended Item", "SPH-STN", "64", "PK", "unit", 800, 400, { WH01: 120, WH02: 0, WH03: 0 },
    { status: "suspended", remarks: "販売停止中（受注不可）", remarksEn: "Suspended (cannot be ordered)" });
  T("P-00005", "廃番品", "Discontinued Item", "TAB-STL", "64", "BK", "unit", 3200, 1800, { WH01: 15, WH02: 0, WH03: 0 },
    { status: "discontinued", registeredAt: "2022-04-01", remarks: "廃番（受注・発注不可）", remarksEn: "Discontinued (cannot be ordered)" });
  T("P-00006", "高額品 法人向けタブレット100台セット", "High-Price Corporate Tablet Set (100 units)", "TAB-VTP", "512", "BK", "set", 9800000, 7200000, { WH01: 2, WH02: 1, WH03: 0 },
    { safetyStock: 1, leadTimeDays: 60, weight: 61000, remarks: "単価が7桁の高額品", remarksEn: "Item with 7-digit unit price" });
  T("P-00007", "サンプル品（単価0円）", "Free Sample Item", "SPH-WGG", "64", "WH", "unit", 0, 0, { WH01: 500, WH02: 500, WH03: 500 },
    { safetyStock: 0, remarks: "単価0円のサンプル品", remarksEn: "Free of charge sample" });
  T("P-00008", "【長い品名テスト】超高耐久防水防塵ハイエンドフラッグシップ折りたたみ式スマートフォン大容量バッテリー搭載モデル（法人向け・保護ケース・強化ガラスフィルム同梱）",
    "[Long Name Test] Ultra-Durable Waterproof Dustproof High-End Flagship Foldable Smartphone with Large Battery (Business, Case & Tempered Glass Included)",
    "SPH-STU", "256", "BK", "unit", 4800, 2900, { WH01: 80, WH02: 60, WH03: 40 }, { remarks: "表示崩れ確認用の長い品名", remarksEn: "Long name for layout checks" });
  T("P-00009", "記号テスト品 A&B <特殊> \"記号\" 'テスト'", "Symbol Test A&B <Special> \"Quote\" 'Test'", "SPH-LFX", "256", "WH", "unit", 450, 200, { WH01: 200, WH02: 200, WH03: 200 },
    { remarks: "HTMLエスケープ確認用（& < > \" '）", remarksEn: "For HTML escaping checks (& < > \" ')" });
  T("P-00010", "軽減税率テスト品", "Reduced Tax Test Item", "TAB-LPM", "128", "PK", "unit", 2160, 1300, { WH01: 100, WH02: 100, WH03: 100 },
    { taxType: "reduced", remarks: "課税区分：軽減8%", remarksEn: "Tax type: reduced 8%" });
  T("P-00011", "非課税テスト品", "Tax-Exempt Test Item", "TAB-WPK", "64", "BL", "unit", 3000, 1800, { WH01: 100, WH02: 100, WH03: 100 },
    { taxType: "exempt", remarks: "課税区分：非課税", remarksEn: "Tax type: tax-exempt" });
  T("P-00012", "ロット管理品 東京在庫のみ", "Lot-Controlled Item (Tokyo Only)", "SPH-WG1", "128", "BL", "unit", 1500, 900, { WH01: 250, WH02: 0, WH03: 0 },
    { lotControl: true, origin: "VN", remarks: "ロット管理あり。在庫は東京中央倉庫のみ", remarksEn: "Lot-controlled. Stock only in Tokyo" });

  // 自動生成（P-10001〜P-10256）：シリーズ16 × ストレージ4 × カラー4
  // ステータス・在庫の傾向は (シリーズ番号 i, ストレージ番号 s, カラー番号 k) から規則的に決める。
  // → どのシリーズ・ストレージ・カラー・ブランドにも「販売停止」「廃番」「安全在庫割れ」「在庫なし」「一部倉庫のみ在庫」が含まれる
  let seq = 10001, i = 0;
  CATEGORIES.forEach(cat => cat.subs.forEach(sub => {
    STORAGES.forEach((st, s) => COLORS.forEach((col, k) => {
      const unitPrice = sub.price + st.add;
      const cost = round100(unitPrice * (0.6 + r() * 0.2));
      const sv = (s + 2 * k + i) % 8;          // 0-5:有効 6:販売停止 7:廃番
      const pv = (3 * s + k + 2 * i + 1) % 8;  // 0-4:通常 5:1倉庫のみ 6:少量（安全在庫割れ） 7:在庫なし
      const only = (i + s + k) % WAREHOUSES.length;
      const stock = {};
      WAREHOUSES.forEach((w, n) => {
        const x = r();
        stock[w.code] = pv === 7 ? 0 : pv === 6 ? Math.floor(x * 6) : pv === 5 ? (n === only ? 40 + Math.floor(x * 120) : 0) : 30 + Math.floor(x * 170);
      });
      const reg = sub.release;
      const upd = _addDays(reg, 7 + Math.floor(r() * 300));
      list.push(base({
        code: `P-${seq}`, name: `${sub.name} ${st.name} ${col.name}`, nameEn: `${sub.en} ${st.en} ${col.en}`,
        category: cat.code, subCategory: sub.code, maker: sub.maker, storage: st.code, color: col.code,
        unit: "unit", unitPrice, cost, stock, jan: _jan(seq),
        supplier: `S-${String(1 + (i * 5 + s * 3 + k) % 12).padStart(3, "0")}`,
        origin: sub.origin, taxType: "standard",
        status: sv < 6 ? "active" : sv === 6 ? "suspended" : "discontinued",
        lotControl: cat.code === "SPH",          // スマートフォンは製造番号（ロット）管理
        leadTimeDays: 7 + (i % 4) * 7,
        safetyStock: 30 + (i % 4) * 10,
        weight: sub.weight,
        registeredAt: reg, updatedAt: upd > "2026-10-31" ? "2026-10-31" : upd,
      }));
      seq++;
    }));
    i++;
  }));
  return list;
})();

// ── サンプル取引（受注・発注・配送・入出庫）初回起動時のみ投入 ──
// 引当数・発注残は「受注済/出荷指示済の受注」「発注済の発注」から都度計算する
// PRODUCTS の stock は下記サンプル取引を反映した後の数量
const SAMPLE_TX = (() => {
  const r = _lcg(31415);
  const pick = a => a[Math.floor(r() * a.length)];
  const customers = PARTNERS.filter(p => p.kind === "customer" && p.status === "active");
  const suppliers = PARTNERS.filter(p => p.kind === "supplier" && p.status === "active");
  const sellable = PRODUCTS.filter(p => p.status === "active" && p.unitPrice > 0 && p.code !== "P-00006");
  const alloc = {}; // 受注済み・出荷指示済みの引当（サンプル生成時に在庫を超えないよう管理）
  const salesOrders = [], shipments = [], purchaseOrders = [], movements = [];
  const users = ["sales01", "admin"];

  // 受注 40件（2026/08/03〜）
  const soStatus = ["delivered", "delivered", "delivered", "shipped", "shipped", "instructed", "instructed", "ordered", "ordered", "ordered", "cancelled"];
  for (let i = 0; i < 40; i++) {
    const date = _addDays("2026-08-03", Math.floor(i * 2.2));
    const status = i === 0 ? "delivered" : i === 1 ? "ordered" : pick(soStatus);
    const wh = pick(WAREHOUSES).code;
    const lines = [];
    const n = 1 + Math.floor(r() * 4);
    for (let k = 0; k < n * 3 && lines.length < n; k++) {
      const p = pick(sellable);
      if (lines.some(l => l.productCode === p.code)) continue;
      const qty = 1 + Math.floor(r() * 5);
      const key = p.code + "@" + wh;
      if (["ordered", "instructed"].includes(status) && (p.stock[wh] || 0) - (alloc[key] || 0) < qty) continue;
      if (["ordered", "instructed"].includes(status)) alloc[key] = (alloc[key] || 0) + qty;
      lines.push({ productCode: p.code, qty, unitPrice: p.unitPrice });
    }
    if (!lines.length) continue;
    const no = `SO-2026-${String(salesOrders.length + 1).padStart(5, "0")}`;
    const so = {
      no, orderDate: date, customer: i === 0 || i === 1 ? "C-0001" : pick(customers).code, warehouse: wh,
      requestedDate: _addDays(date, 5 + Math.floor(r() * 10)), status, lines, createdBy: pick(users),
      customerRef: `PO-${String(70000 + i * 37)}`, note: "",
    };
    salesOrders.push(so);
    if (["instructed", "shipped", "delivered"].includes(status)) {
      const shipNo = `SH-2026-${String(shipments.length + 1).padStart(5, "0")}`;
      const shipDate = status === "instructed" ? null : _addDays(date, 2);
      shipments.push({
        no: shipNo, salesOrderNo: no, warehouse: wh, carrier: pick(CARRIERS).code,
        trackingNo: status === "instructed" ? "" : String(400000000000 + Math.floor(r() * 99999999999)),
        plannedDate: _addDays(date, 2), shipDate, deliveredDate: status === "delivered" ? _addDays(date, 4) : null,
        status: status === "instructed" ? "pending" : status === "shipped" ? "in_transit" : "delivered",
      });
      if (shipDate) lines.forEach(l => movements.push({ date: shipDate, type: "ship", productCode: l.productCode, warehouse: wh, qty: -l.qty, ref: shipNo, user: "wh01" }));
    }
  }

  // 全数引当の受注（倉庫ごとに1件）：その倉庫だけに在庫がある品目の現在庫を全数引き当てる
  // → 「現在庫はあるが有効在庫0＝在庫なし」の品目ができ、在庫状態「在庫なし」×「在庫のある倉庫」の組み合わせでもHITする
  const bigCustomers = customers.filter(c => c.code !== "C-0001").sort((a, b) => b.creditLimit - a.creditLimit || a.code.localeCompare(b.code));
  WAREHOUSES.forEach((w, n) => {
    const p = sellable.find(x => x.code > "P-10000" && !alloc[x.code + "@" + w.code] &&
      Object.keys(x.stock).every(k => (k === w.code) === (x.stock[k] > 0)));
    if (!p) return;
    const qty = p.stock[w.code];
    alloc[p.code + "@" + w.code] = qty;
    const date = _addDays("2026-10-26", n);
    salesOrders.push({
      no: `SO-2026-${String(salesOrders.length + 1).padStart(5, "0")}`, orderDate: date, customer: bigCustomers[n].code, warehouse: w.code,
      requestedDate: _addDays(date, 30), status: "ordered", lines: [{ productCode: p.code, qty, unitPrice: p.unitPrice }], createdBy: "sales01",
      customerRef: `PO-${80000 + n}`, note: "全数引当（有効在庫0）",
    });
  });

  // 発注 24件（2026/08/05〜）
  const poStatus = ["received", "received", "received", "ordered", "ordered", "cancelled"];
  const buyable = PRODUCTS.filter(p => p.status === "active" && p.code !== "P-00007");
  for (let i = 0; i < 24; i++) {
    const date = _addDays("2026-08-05", Math.floor(i * 3.5));
    const status = i === 0 ? "ordered" : pick(poStatus);
    const sup = i === 0 ? "S-001" : pick(suppliers).code;
    const wh = pick(WAREHOUSES).code;
    const lines = [];
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const p = pick(buyable);
      if (lines.some(l => l.productCode === p.code)) continue;
      lines.push({ productCode: p.code, qty: (1 + Math.floor(r() * 10)) * 10, unitPrice: p.cost });
    }
    const no = `PO-2026-${String(i + 1).padStart(5, "0")}`;
    const expectedDate = _addDays(date, 7 + Math.floor(r() * 14));
    purchaseOrders.push({ no, orderDate: date, supplier: sup, warehouse: wh, expectedDate, status, lines, createdBy: "buyer01", note: "",
      receivedDate: status === "received" ? expectedDate : null });
    if (status === "received") lines.forEach(l => movements.push({ date: expectedDate, type: "receive", productCode: l.productCode, warehouse: wh, qty: l.qty, ref: no, user: "wh01" }));
  }

  // 在庫調整の履歴
  [["2026-09-10", "P-00003", "WH01", -5, "damage"], ["2026-09-24", "P-10005", "WH02", 12, "stocktake"], ["2026-10-08", "P-00001", "WH03", -2, "sample"]]
    .forEach(([date, productCode, warehouse, qty, reason]) => movements.push({ date, type: "adjust", productCode, warehouse, qty, ref: "ADJ-" + date.replace(/-/g, ""), reason, user: "wh01" }));
  movements.sort((a, b) => a.date.localeCompare(b.date));
  return { salesOrders, shipments, purchaseOrders, movements };
})();
