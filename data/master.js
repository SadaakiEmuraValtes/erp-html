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
  { code: "DE", name: "ドイツ", en: "Germany" }, { code: "US", name: "米国", en: "USA" },
];
const MAKERS = [
  { code: "MK01", name: "バルテス精工", en: "Valtes Seiko" },
  { code: "MK02", name: "アオバ工業",   en: "Aoba Kogyo" },
  { code: "MK03", name: "ホクト精機",   en: "Hokuto Seiki" },
  { code: "MK04", name: "コウヨウ製作所", en: "Koyo Works" },
  { code: "MK05", name: "サクラ化成",   en: "Sakura Kasei" },
  { code: "MK06", name: "ツバサ電子",   en: "Tsubasa Denshi" },
  { code: "MK07", name: "ミナモ産業",   en: "Minamo Sangyo" },
  { code: "MK08", name: "カザミ技研",   en: "Kazami Giken" },
];
const UNITS = {
  pcs:  { name: "個", en: "pcs" },  bag:  { name: "袋", en: "bag" },  box:  { name: "箱", en: "box" },
  set:  { name: "セット", en: "set" }, unit: { name: "台", en: "unit" }, roll: { name: "巻", en: "roll" },
  pack: { name: "束", en: "bundle" }, ream: { name: "冊", en: "ream" },
};

// ── カテゴリ・サブカテゴリ（商品生成の元データ） ──────────
// bases: [和名, 英名] × 3、specs: 仕様 × 5（[和, 英] or 共通文字列）→ サブカテゴリごとに15品目
const CATEGORIES = [
  { code: "ELC", name: "電子部品", en: "Electronic Parts", subs: [
    { code: "ELC-RES", name: "抵抗器", en: "Resistors", unit: "bag", price: [200, 1200], bases: [["炭素皮膜抵抗", "Carbon Film Resistor"], ["金属皮膜抵抗", "Metal Film Resistor"], ["チップ抵抗", "Chip Resistor"]], specs: ["100Ω", "1kΩ", "4.7kΩ", "10kΩ", "100kΩ"] },
    { code: "ELC-CAP", name: "コンデンサ", en: "Capacitors", unit: "bag", price: [300, 2500], bases: [["セラミックコンデンサ", "Ceramic Capacitor"], ["電解コンデンサ", "Electrolytic Capacitor"], ["フィルムコンデンサ", "Film Capacitor"]], specs: ["10pF", "100nF", "1μF", "47μF", "470μF"] },
    { code: "ELC-IC",  name: "IC", en: "ICs", unit: "pcs", price: [150, 4800], bases: [["マイコン", "Microcontroller"], ["オペアンプ", "Op-Amp"], ["電源IC", "Power IC"]], specs: ["VX-100", "VX-200", "VX-300", "VX-500", "VX-900"] },
    { code: "ELC-CON", name: "コネクタ", en: "Connectors", unit: "pcs", price: [50, 900], bases: [["ピンヘッダ", "Pin Header"], ["USBコネクタ", "USB Connector"], ["端子台", "Terminal Block"]], specs: ["2P", "4P", "8P", "20P", "40P"] },
  ]},
  { code: "MEC", name: "機械部品", en: "Mechanical Parts", subs: [
    { code: "MEC-SCR", name: "ねじ・ボルト", en: "Screws & Bolts", unit: "box", price: [400, 3000], bases: [["六角ボルト", "Hex Bolt"], ["なべ小ねじ", "Pan Head Screw"], ["皿小ねじ", "Flat Head Screw"]], specs: ["M3×10", "M4×12", "M5×16", "M6×20", "M8×30"] },
    { code: "MEC-BRG", name: "ベアリング", en: "Bearings", unit: "pcs", price: [600, 8000], bases: [["深溝玉軸受", "Deep Groove Ball Bearing"], ["円すいころ軸受", "Tapered Roller Bearing"], ["スラスト軸受", "Thrust Bearing"]], specs: [["内径10mm", "ID 10mm"], ["内径15mm", "ID 15mm"], ["内径20mm", "ID 20mm"], ["内径25mm", "ID 25mm"], ["内径30mm", "ID 30mm"]] },
    { code: "MEC-GER", name: "ギア", en: "Gears", unit: "pcs", price: [1200, 9800], bases: [["平歯車", "Spur Gear"], ["はすば歯車", "Helical Gear"], ["かさ歯車", "Bevel Gear"]], specs: ["M1 20T", "M1 40T", "M1.5 30T", "M2 20T", "M2 50T"] },
    { code: "MEC-SPR", name: "スプリング", en: "Springs", unit: "bag", price: [300, 2400], bases: [["圧縮ばね", "Compression Spring"], ["引張ばね", "Extension Spring"], ["ねじりばね", "Torsion Spring"]], specs: ["φ5×20", "φ8×30", "φ10×40", "φ12×50", "φ20×80"] },
  ]},
  { code: "OFS", name: "事務用品", en: "Office Supplies", subs: [
    { code: "OFS-STA", name: "文具", en: "Stationery", unit: "set", price: [300, 3500], bases: [["ボールペン", "Ballpoint Pen"], ["油性マーカー", "Oil Marker"], ["修正テープ", "Correction Tape"]], specs: [["黒 10本", "Black x10"], ["赤 10本", "Red x10"], ["青 10本", "Blue x10"], ["3色 30本", "3 colors x30"], ["黒 50本", "Black x50"]] },
    { code: "OFS-PAP", name: "用紙", en: "Paper", unit: "box", price: [1800, 9800], bases: [["コピー用紙", "Copy Paper"], ["再生紙", "Recycled Paper"], ["厚口用紙", "Heavy Paper"]], specs: [["A4 2500枚", "A4 2500 sheets"], ["A3 1500枚", "A3 1500 sheets"], ["B5 2500枚", "B5 2500 sheets"], ["B4 2000枚", "B4 2000 sheets"], ["A4 5000枚", "A4 5000 sheets"]] },
    { code: "OFS-FIL", name: "ファイル", en: "Files", unit: "pack", price: [250, 2800], bases: [["クリアファイル", "Clear Folder"], ["フラットファイル", "Flat File"], ["リングファイル", "Ring Binder"]], specs: [["A4 10冊", "A4 x10"], ["A4 50冊", "A4 x50"], ["A3 10冊", "A3 x10"], ["B5 10冊", "B5 x10"], ["A4 色込 20冊", "A4 assorted x20"]] },
  ]},
  { code: "TLS", name: "工具", en: "Tools", subs: [
    { code: "TLS-PWR", name: "電動工具", en: "Power Tools", unit: "unit", price: [8000, 48000], bases: [["電動ドリル", "Power Drill"], ["インパクトドライバー", "Impact Driver"], ["ディスクグラインダー", "Angle Grinder"]], specs: ["10.8V", "14.4V", "18V", "36V", "AC100V"] },
    { code: "TLS-HND", name: "手工具", en: "Hand Tools", unit: "pcs", price: [600, 6800], bases: [["モンキーレンチ", "Adjustable Wrench"], ["ドライバーセット", "Screwdriver Set"], ["ペンチ", "Pliers"]], specs: ["150mm", "200mm", "250mm", "300mm", ["プロ仕様", "Pro"]] },
    { code: "TLS-MSR", name: "測定工具", en: "Measuring Tools", unit: "pcs", price: [1200, 28000], bases: [["ノギス", "Caliper"], ["マイクロメーター", "Micrometer"], ["水平器", "Spirit Level"]], specs: ["100mm", "150mm", "200mm", "300mm", ["デジタル", "Digital"]] },
  ]},
  { code: "PKG", name: "梱包資材", en: "Packaging", subs: [
    { code: "PKG-BOX", name: "段ボール", en: "Cardboard", unit: "pack", price: [800, 4800], bases: [["段ボール箱", "Cardboard Box"], ["宅配箱", "Shipping Box"], ["保管箱", "Storage Box"]], specs: [["60サイズ", "Size 60"], ["80サイズ", "Size 80"], ["100サイズ", "Size 100"], ["120サイズ", "Size 120"], ["140サイズ", "Size 140"]] },
    { code: "PKG-TAP", name: "テープ", en: "Tape", unit: "roll", price: [120, 980], bases: [["OPPテープ", "OPP Tape"], ["クラフトテープ", "Kraft Tape"], ["布テープ", "Cloth Tape"]], specs: ["48mm×50m", "48mm×100m", "75mm×50m", ["透明 48mm", "Clear 48mm"], ["茶 48mm", "Brown 48mm"]] },
    { code: "PKG-CSN", name: "緩衝材", en: "Cushioning", unit: "roll", price: [900, 6800], bases: [["エアキャップ", "Bubble Wrap"], ["ミラーマット", "Foam Sheet"], ["紙緩衝材", "Paper Cushion"]], specs: ["300mm×42m", "600mm×42m", "1200mm×42m", ["小巻", "Small roll"], ["大巻", "Large roll"]] },
  ]},
  { code: "SFT", name: "安全用品", en: "Safety Equipment", subs: [
    { code: "SFT-GLV", name: "手袋", en: "Gloves", unit: "box", price: [400, 3800], bases: [["ニトリル手袋", "Nitrile Gloves"], ["作業用手袋", "Work Gloves"], ["耐切創手袋", "Cut-Resistant Gloves"]], specs: ["S", "M", "L", "XL", ["フリー", "Free size"]] },
    { code: "SFT-HLM", name: "ヘルメット", en: "Helmets", unit: "pcs", price: [1800, 7800], bases: [["作業用ヘルメット", "Safety Helmet"], ["軽量ヘルメット", "Lightweight Helmet"], ["通気孔付ヘルメット", "Vented Helmet"]], specs: [["白", "White"], ["黄", "Yellow"], ["青", "Blue"], ["赤", "Red"], ["緑", "Green"]] },
    { code: "SFT-EYE", name: "保護メガネ", en: "Eye Protection", unit: "pcs", price: [500, 4200], bases: [["保護メガネ", "Safety Glasses"], ["ゴーグル", "Goggles"], ["遮光メガネ", "Shading Glasses"]], specs: [["クリア", "Clear"], ["曇り止め", "Anti-fog"], ["スモーク", "Smoke"], ["一眼型", "Single lens"], ["二眼型", "Twin lens"]] },
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
      creditLimit: kind === "customer" ? (1 + Math.floor(r() * 50)) * 100000 : 0,
      status: r() < 0.9 ? "active" : "suspended",
    };
  };
  for (let i = 0; i < 25; i++) list.push(make("customer", i));
  for (let i = 0; i < 12; i++) list.push(make("supplier", i));
  // テスト用の固定値
  list[0].status = "active"; list[0].creditLimit = 5000000;   // C-0001: 標準得意先
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

// ── 商品マスター（テスト用12件＋自動生成300件） ─────────────
function _jan(seq) {
  const body = "4900" + String(seq).padStart(8, "0");
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 ? 3 : 1);
  return body + ((10 - sum % 10) % 10);
}

const PRODUCTS = (() => {
  const r = _lcg(20260401);
  const pick = a => a[Math.floor(r() * a.length)];
  const round10 = v => Math.round(v / 10) * 10;
  const list = [];
  const base = (o) => Object.assign({
    maker: "MK01", supplier: "S-001", origin: "JP", taxType: "standard", status: "active", lotControl: false,
    leadTimeDays: 7, safetyStock: 50, weight: 100, registeredAt: "2024-04-01", updatedAt: "2026-09-01",
    remarks: "", remarksEn: "",
  }, o);

  // テスト用の固定品目（P-00001〜P-00012）
  const T = (code, name, nameEn, cat, sub, unit, unitPrice, cost, stock, o = {}) =>
    list.push(base({ code, name, nameEn, category: cat, subCategory: sub, unit, unitPrice, cost, stock, jan: _jan(Number(code.slice(2))), ...o }));
  T("P-00001", "バルテス 標準テスト品", "Valtes Standard Test Item", "MEC", "MEC-SCR", "box", 1000, 600, { WH01: 300, WH02: 200, WH03: 100 },
    { remarks: "標準的な値のテスト用品目", remarksEn: "Test item with standard values" });
  T("P-00002", "在庫ゼロ品", "Zero Stock Item", "ELC", "ELC-IC", "pcs", 2500, 1500, { WH01: 0, WH02: 0, WH03: 0 },
    { remarks: "全倉庫で在庫0（在庫なし）", remarksEn: "No stock in any warehouse" });
  T("P-00003", "安全在庫割れ品", "Low Stock Item", "SFT", "SFT-GLV", "box", 1200, 700, { WH01: 10, WH02: 5, WH03: 0 },
    { safetyStock: 100, remarks: "有効在庫が安全在庫を下回る", remarksEn: "Available stock below safety stock" });
  T("P-00004", "販売停止品", "Suspended Item", "OFS", "OFS-STA", "set", 800, 400, { WH01: 120, WH02: 0, WH03: 0 },
    { status: "suspended", remarks: "販売停止中（受注不可）", remarksEn: "Suspended (cannot be ordered)" });
  T("P-00005", "廃番品", "Discontinued Item", "TLS", "TLS-HND", "pcs", 3200, 1800, { WH01: 15, WH02: 0, WH03: 0 },
    { status: "discontinued", registeredAt: "2022-04-01", remarks: "廃番（受注・発注不可）", remarksEn: "Discontinued (cannot be ordered)" });
  T("P-00006", "高額品 精密測定ユニット", "High-Price Precision Measuring Unit", "TLS", "TLS-MSR", "unit", 9800000, 7200000, { WH01: 2, WH02: 1, WH03: 0 },
    { safetyStock: 1, leadTimeDays: 60, origin: "DE", maker: "MK03", weight: 85000, remarks: "単価が7桁の高額品", remarksEn: "Item with 7-digit unit price" });
  T("P-00007", "サンプル品（単価0円）", "Free Sample Item", "OFS", "OFS-FIL", "pack", 0, 0, { WH01: 500, WH02: 500, WH03: 500 },
    { safetyStock: 0, remarks: "単価0円のサンプル品", remarksEn: "Free of charge sample" });
  T("P-00008", "【長い品名テスト】超高耐久ステンレス製多機能ユニバーサルブラケット取付金具セット（屋内外兼用・防錆加工済み）",
    "[Long Name Test] Ultra-Durable Stainless Multi-Purpose Universal Bracket Mounting Hardware Set (Indoor/Outdoor, Rust-Proof)",
    "MEC", "MEC-SCR", "set", 4800, 2900, { WH01: 80, WH02: 60, WH03: 40 }, { remarks: "表示崩れ確認用の長い品名", remarksEn: "Long name for layout checks" });
  T("P-00009", "記号テスト品 A&B <特殊> \"記号\" 'テスト'", "Symbol Test A&B <Special> \"Quote\" 'Test'", "PKG", "PKG-TAP", "roll", 450, 200, { WH01: 200, WH02: 200, WH03: 200 },
    { remarks: "HTMLエスケープ確認用（& < > \" '）", remarksEn: "For HTML escaping checks (& < > \" ')" });
  T("P-00010", "軽減税率テスト品", "Reduced Tax Test Item", "OFS", "OFS-PAP", "box", 2160, 1300, { WH01: 100, WH02: 100, WH03: 100 },
    { taxType: "reduced", remarks: "課税区分：軽減8%", remarksEn: "Tax type: reduced 8%" });
  T("P-00011", "非課税テスト品", "Tax-Exempt Test Item", "OFS", "OFS-PAP", "box", 3000, 1800, { WH01: 100, WH02: 100, WH03: 100 },
    { taxType: "exempt", remarks: "課税区分：非課税", remarksEn: "Tax type: tax-exempt" });
  T("P-00012", "ロット管理品 東京在庫のみ", "Lot-Controlled Item (Tokyo Only)", "ELC", "ELC-CAP", "bag", 1500, 900, { WH01: 250, WH02: 0, WH03: 0 },
    { lotControl: true, origin: "VN", maker: "MK06", remarks: "ロット管理あり。在庫は東京中央倉庫のみ", remarksEn: "Lot-controlled. Stock only in Tokyo" });

  // 自動生成（P-10001〜P-10300）
  let seq = 10001;
  CATEGORIES.forEach(cat => cat.subs.forEach(sub => {
    sub.bases.forEach(([bj, be]) => sub.specs.forEach(sp => {
      const [sj, se] = Array.isArray(sp) ? sp : [sp, sp];
      const unitPrice = round10(sub.price[0] + r() * (sub.price[1] - sub.price[0]));
      const cost = round10(unitPrice * (0.45 + r() * 0.35));
      const stock = {};
      // 在庫の傾向：約6%は全倉庫在庫なし、約12%は少量（安全在庫割れになりやすい）、残りは通常
      const prof = r();
      WAREHOUSES.forEach(w => { const x = r(); stock[w.code] = prof < 0.06 ? 0 : prof < 0.18 ? Math.floor(x * 25) : x < 0.15 ? 0 : Math.floor(x * 600); });
      const st = r(), tx = r();
      const reg = _addDays("2022-04-01", Math.floor(r() * 1640));
      list.push(base({
        code: `P-${seq}`, name: `${bj} ${sj}`, nameEn: `${be} ${se}`, category: cat.code, subCategory: sub.code, unit: sub.unit,
        unitPrice, cost, stock, jan: _jan(seq),
        maker: pick(MAKERS).code, supplier: `S-${String(1 + Math.floor(r() * 12)).padStart(3, "0")}`,
        origin: r() < 0.55 ? "JP" : pick(ORIGINS).code,
        taxType: tx < 0.88 ? "standard" : tx < 0.95 ? "reduced" : "exempt",
        status: st < 0.86 ? "active" : st < 0.94 ? "suspended" : "discontinued",
        lotControl: ["ELC", "SFT"].includes(cat.code) ? r() < 0.6 : r() < 0.15,
        leadTimeDays: 3 + Math.floor(r() * 28),
        safetyStock: (1 + Math.floor(r() * 30)) * 10,
        weight: 10 + Math.floor(r() * 3000),
        registeredAt: reg, updatedAt: _addDays(reg, Math.floor(r() * 120)) > "2026-10-31" ? "2026-10-31" : _addDays(reg, Math.floor(r() * 120)),
      }));
      seq++;
    }));
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
      const qty = 1 + Math.floor(r() * 20);
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
