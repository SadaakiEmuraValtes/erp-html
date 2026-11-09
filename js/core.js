// ============================================================
//  VALTES ERP Demo – Core (state, master lookup, search, transactions)
//  DOM に依存しない。Node からも読み込めるので testdata 生成にも使う（tools/gen-testdata.js）
// ============================================================

const ERP = (() => {
  const LS = {
    SESSION:  "erp_session",          // ログインユーザーID
    PRODUCTS: "erp_products",         // 商品マスター（編集・新規登録を反映）
    SO:       "erp_sales_orders",     // 受注
    PO:       "erp_purchase_orders",  // 発注
    SH:       "erp_shipments",        // 配送
    MV:       "erp_movements",        // 入出庫履歴
    VERSION:  "erp_data_version",     // 保存データの版数
  };
  const DATA_VERSION = 2;             // v2: 商品をスマートフォン・タブレットに再構成
  const _store = (() => { try { return typeof localStorage !== "undefined" ? localStorage : null; } catch (e) { return null; } })();
  const _read = (k, def) => { try { const v = _store && _store.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  const _write = (k, v) => { if (_store) _store.setItem(k, JSON.stringify(v)); };
  const _clone = o => JSON.parse(JSON.stringify(o));
  const _t = (ja, en) => (typeof I18n !== "undefined" ? I18n.t(ja, en) : ja);
  const _lbl = o => (o ? _t(o.name, o.en) : "");

  const S = { products: [], salesOrders: [], purchaseOrders: [], shipments: [], movements: [], user: null };
  let _ver = 0, _cache = null;   // 在庫集計キャッシュ（取引が変わるたびに _ver を進める）

  // ── 初期化 ────────────────────────────────────────────────
  function init() {
    // マスター・サンプル取引の構成を変えたら DATA_VERSION を上げる → 保存済みの業務データを破棄して初期データに戻す（ログイン状態は維持）
    if (_store && _read(LS.VERSION, null) !== DATA_VERSION) {
      [LS.PRODUCTS, LS.SO, LS.PO, LS.SH, LS.MV].forEach(k => _store.removeItem(k));
      _write(LS.VERSION, DATA_VERSION);
    }
    const load = (key, seed) => {
      const v = _read(key, null);
      if (Array.isArray(v)) return v;
      const s = _clone(seed); _write(key, s); return s;
    };
    S.products       = load(LS.PRODUCTS, PRODUCTS);
    S.salesOrders    = load(LS.SO, SAMPLE_TX.salesOrders);
    S.purchaseOrders = load(LS.PO, SAMPLE_TX.purchaseOrders);
    S.shipments      = load(LS.SH, SAMPLE_TX.shipments);
    S.movements      = load(LS.MV, SAMPLE_TX.movements.map(m => ({ ...m, sample: true })));
    const uid = _read(LS.SESSION, null);
    S.user = uid ? USERS.find(u => u.id === uid) || null : null;
    _ver++;
  }
  function _save(key) {
    const map = { [LS.PRODUCTS]: S.products, [LS.SO]: S.salesOrders, [LS.PO]: S.purchaseOrders, [LS.SH]: S.shipments, [LS.MV]: S.movements };
    _write(key, map[key]);
    _ver++;
  }
  function resetAll() {
    if (_store) Object.keys(_store).filter(k => k.startsWith("erp_")).forEach(k => _store.removeItem(k));
  }

  // ── 認証・権限 ────────────────────────────────────────────
  function login(id, password) {
    const u = USERS.find(x => x.id === id && x.password === password);
    if (!u) return { ok: false, msg: _t("ユーザーIDまたはパスワードが正しくありません。", "Incorrect user ID or password.") };
    S.user = u; _write(LS.SESSION, u.id);
    return { ok: true, user: u };
  }
  function logout() { S.user = null; if (_store) _store.removeItem(LS.SESSION); }
  function currentUser() { return S.user; }
  function can(perm) { return !!S.user && (PERMISSIONS[perm] || []).includes(S.user.role); }
  function userName(id) { const u = USERS.find(x => x.id === id); return u ? _t(u.name, u.nameEn) : id || ""; }
  function roleName(role) { return _lbl(ROLES[role]); }

  // ── マスタ参照・表示名 ────────────────────────────────────
  const product   = code => S.products.find(p => p.code === code);
  const partner   = code => PARTNERS.find(p => p.code === code);
  const warehouse = code => WAREHOUSES.find(w => w.code === code);
  const category  = code => CATEGORIES.find(c => c.code === code);
  const subCategory = code => { for (const c of CATEGORIES) { const s = c.subs.find(x => x.code === code); if (s) return s; } return null; };
  const maker     = code => MAKERS.find(m => m.code === code);
  const origin    = code => ORIGINS.find(o => o.code === code);
  const storage   = code => STORAGES.find(x => x.code === String(code));
  const color     = code => COLORS.find(x => x.code === code);

  const productName = p => (p ? _t(p.name, p.nameEn) : "");
  const partnerName = code => { const p = partner(code); return p ? _t(p.name, p.nameEn) : code || ""; };
  const label = {
    category:    code => _lbl(category(code)),
    subCategory: code => _lbl(subCategory(code)),
    maker:       code => _lbl(maker(code)),
    unit:        code => _lbl(UNITS[code]),
    storage:     code => _lbl(storage(code)),
    color:       code => _lbl(color(code)),
    tax:         code => _lbl(TAX_TYPES[code]),
    status:      code => _lbl(PRODUCT_STATUS[code]),
    stockStatus: code => _lbl(STOCK_STATUS[code]),
    warehouse:   code => _lbl(warehouse(code)),
    origin:      code => _lbl(origin(code)),
    carrier:     code => _lbl(CARRIERS.find(c => c.code === code)),
    payTerm:     code => _lbl(PAY_TERMS[code]),
    adjustReason: code => _lbl(ADJUST_REASONS[code]),
    soStatus: code => _lbl({
      ordered:    { name: "受注済",     en: "Ordered" },
      instructed: { name: "出荷指示済", en: "Instructed" },
      shipped:    { name: "出荷済",     en: "Shipped" },
      delivered:  { name: "配達完了",   en: "Delivered" },
      cancelled:  { name: "キャンセル", en: "Cancelled" },
    }[code]),
    poStatus: code => _lbl({
      ordered:   { name: "発注済",     en: "Ordered" },
      received:  { name: "入荷済",     en: "Received" },
      cancelled: { name: "キャンセル", en: "Cancelled" },
    }[code]),
    shStatus: code => _lbl({
      pending:    { name: "出荷待ち", en: "Pending" },
      in_transit: { name: "配送中",   en: "In transit" },
      delivered:  { name: "配達完了", en: "Delivered" },
    }[code]),
    moveType: code => _lbl({
      receive: { name: "入荷", en: "Receipt" },
      ship:    { name: "出荷", en: "Shipment" },
      adjust:  { name: "在庫調整", en: "Adjustment" },
    }[code]),
    partnerKind: code => _lbl({ customer: { name: "得意先", en: "Customer" }, supplier: { name: "仕入先", en: "Supplier" } }[code]),
    partnerStatus: code => _lbl({ active: { name: "取引中", en: "Active" }, suspended: { name: "取引停止", en: "Suspended" } }[code]),
  };

  // ── 在庫集計（現在庫・引当・発注残） ───────────────────────
  function _maps() {
    if (_cache && _cache.ver === _ver) return _cache;
    const delta = {}, alloc = {}, onOrder = {};
    const add = (m, k, v) => { m[k] = (m[k] || 0) + v; };
    S.movements.forEach(m => { if (!m.sample) add(delta, m.productCode + "@" + m.warehouse, m.qty); });
    S.salesOrders.forEach(o => { if (["ordered", "instructed"].includes(o.status)) o.lines.forEach(l => add(alloc, l.productCode + "@" + o.warehouse, l.qty)); });
    S.purchaseOrders.forEach(o => { if (o.status === "ordered") o.lines.forEach(l => add(onOrder, l.productCode + "@" + o.warehouse, l.qty)); });
    _cache = { ver: _ver, delta, alloc, onOrder };
    return _cache;
  }

  function _status(available, safety) { return available <= 0 ? "out" : available < safety ? "low" : "in"; }

  // 倉庫別の在庫（安全在庫は品目の安全在庫を3倉庫で按分＝切り上げ）
  function inventory(code, wh) {
    const p = product(code); if (!p) return null;
    const m = _maps(), k = code + "@" + wh;
    const qty = (p.stock[wh] || 0) + (m.delta[k] || 0);
    const allocated = m.alloc[k] || 0, onOrder = m.onOrder[k] || 0;
    const safety = Math.ceil(p.safetyStock / WAREHOUSES.length);
    const available = qty - allocated;
    return { productCode: code, warehouse: wh, qty, allocated, available, onOrder, safety, status: _status(available, safety) };
  }

  // 品目合計の在庫
  function totals(code) {
    const p = product(code); if (!p) return null;
    const t = { qty: 0, allocated: 0, available: 0, onOrder: 0 };
    WAREHOUSES.forEach(w => { const i = inventory(code, w.code); t.qty += i.qty; t.allocated += i.allocated; t.available += i.available; t.onOrder += i.onOrder; });
    t.status = _status(t.available, p.safetyStock);
    return t;
  }

  // 一覧・CSV・検索用のフラットなレコード
  function productRow(p) {
    const t = totals(p.code);
    const row = {
      code: p.code, name: p.name, nameEn: p.nameEn, category: p.category, subCategory: p.subCategory,
      maker: p.maker, storage: p.storage, color: p.color, supplier: p.supplier, unit: p.unit, unitPrice: p.unitPrice, cost: p.cost,
      marginRate: p.unitPrice > 0 ? Math.round((p.unitPrice - p.cost) / p.unitPrice * 1000) / 10 : 0,
      taxType: p.taxType, status: p.status, lotControl: p.lotControl, origin: p.origin,
      leadTimeDays: p.leadTimeDays, safetyStock: p.safetyStock, weight: p.weight, jan: p.jan,
      totalStock: t.qty, allocated: t.allocated, available: t.available, onOrder: t.onOrder, stockStatus: t.status,
      registeredAt: p.registeredAt, updatedAt: p.updatedAt,
    };
    WAREHOUSES.forEach(w => { row["stock_" + w.code] = inventory(p.code, w.code).qty; });
    return row;
  }

  // ── 商品検索 ──────────────────────────────────────────────
  // c: code / keyword / category / subCategory(シリーズ) / maker(ブランド) / storages(配列) / colors(配列) /
  //    priceMin / priceMax / statuses(配列) / stockStatus / warehouse / regFrom / regTo / sort
  // 項目間は AND、複数選択（storages / colors / statuses）の中は OR。
  // keyword はスペース区切りの AND（品名・英名・シリーズ名・ブランド名・容量・カラー名が対象、全角半角・大文字小文字を区別しない）
  const PRODUCT_SORTS = {
    code_asc:   (a, b) => a.code.localeCompare(b.code),
    code_desc:  (a, b) => b.code.localeCompare(a.code),
    name_asc:   (a, b) => a.name.localeCompare(b.name, "ja") || a.code.localeCompare(b.code),
    price_asc:  (a, b) => a.unitPrice - b.unitPrice || a.code.localeCompare(b.code),
    price_desc: (a, b) => b.unitPrice - a.unitPrice || a.code.localeCompare(b.code),
    stock_asc:  (a, b) => a.available - b.available || a.code.localeCompare(b.code),
    stock_desc: (a, b) => b.available - a.available || a.code.localeCompare(b.code),
    reg_desc:   (a, b) => b.registeredAt.localeCompare(a.registeredAt) || a.code.localeCompare(b.code),
  };
  const _norm = v => String(v ?? "").normalize("NFKC").toLowerCase();
  function _keywordText(r) {
    const ss = subCategory(r.subCategory), mk = maker(r.maker), st = storage(r.storage), co = color(r.color);
    return _norm([r.name, r.nameEn, ss && ss.name, ss && ss.en, mk && mk.name, mk && mk.en, st && st.name, co && co.name, co && co.en].filter(Boolean).join(" "));
  }
  function searchProducts(c = {}) {
    const has = v => v !== undefined && v !== null && v !== "";
    const list = v => (Array.isArray(v) ? v : has(v) ? String(v).split(",") : []).filter(has);
    const code = (c.code || "").trim().toUpperCase();
    const words = _norm(c.keyword).split(/\s+/).filter(Boolean);
    const num = v => (has(v) ? Number(v) : null);
    const pMin = num(c.priceMin), pMax = num(c.priceMax);
    const storages = list(c.storages), colors = list(c.colors), statuses = list(c.statuses);
    let rows = S.products.map(productRow).filter(r =>
      (!code || r.code.toUpperCase().includes(code)) &&
      (!words.length || (t => words.every(w => t.includes(w)))(_keywordText(r))) &&
      (!has(c.category) || r.category === c.category) &&
      (!has(c.subCategory) || r.subCategory === c.subCategory) &&
      (!has(c.maker) || r.maker === c.maker) &&
      (!storages.length || storages.includes(String(r.storage))) &&
      (!colors.length || colors.includes(r.color)) &&
      (pMin === null || r.unitPrice >= pMin) &&
      (pMax === null || r.unitPrice <= pMax) &&
      (!statuses.length || statuses.includes(r.status)) &&
      (!has(c.stockStatus) || r.stockStatus === c.stockStatus) &&
      (!has(c.warehouse) || r["stock_" + c.warehouse] > 0) &&
      (!has(c.regFrom) || r.registeredAt >= c.regFrom) &&
      (!has(c.regTo) || r.registeredAt <= c.regTo));
    rows.sort(PRODUCT_SORTS[c.sort] || PRODUCT_SORTS.code_asc);
    return rows;
  }

  // ── 商品マスター登録・更新 ────────────────────────────────
  function validateProduct(d, isNew) {
    const e = {};
    const int = v => /^\d+$/.test(String(v));
    if (isNew) {
      if (!/^P-\d{5}$/.test(d.code || "")) e.code = _t("品目コードは P-00000 形式（P- と数字5桁）で入力してください", "Product code must be P- followed by 5 digits");
      else if (product(d.code)) e.code = _t("この品目コードは既に登録されています", "This product code already exists");
    }
    if (!d.name || !d.name.trim()) e.name = _t("品名は必須です", "Name is required");
    else if (d.name.length > 100) e.name = _t("品名は100文字以内で入力してください", "Name must be 100 characters or less");
    if (!d.category) e.category = _t("カテゴリを選択してください", "Select a category");
    if (!subCategory(d.subCategory) || !d.subCategory.startsWith(d.category + "-")) e.subCategory = _t("シリーズを選択してください", "Select a series");
    else if (d.maker && subCategory(d.subCategory).maker !== d.maker) e.subCategory = _t("選択したブランドのシリーズではありません", "This series does not belong to the selected brand");
    if (!storage(d.storage)) e.storage = _t("ストレージ容量を選択してください", "Select a storage capacity");
    if (!color(d.color)) e.color = _t("カラーを選択してください", "Select a color");
    if (!PRODUCT_STATUS[d.status]) e.status = _t("ステータスを選択してください", "Select a status");
    if (!int(d.unitPrice) || Number(d.unitPrice) > 99999999) e.unitPrice = _t("販売単価は0〜99,999,999の整数で入力してください", "Unit price must be an integer 0-99,999,999");
    if (!int(d.cost) || Number(d.cost) > 99999999) e.cost = _t("標準原価は0〜99,999,999の整数で入力してください", "Cost must be an integer 0-99,999,999");
    else if (int(d.unitPrice) && Number(d.cost) > Number(d.unitPrice) && Number(d.unitPrice) > 0) e.cost = _t("標準原価が販売単価を上回っています", "Cost exceeds unit price");
    if (!int(d.safetyStock) || Number(d.safetyStock) > 99999) e.safetyStock = _t("安全在庫は0〜99,999の整数で入力してください", "Safety stock must be an integer 0-99,999");
    return e;
  }

  // 登録フォームで入力する項目（11項目）。それ以外（英名・仕入先・単位・課税区分・原産国・JAN・リードタイム・重量・ロット管理・備考）は
  // 新規登録時にシリーズ等から自動設定し、編集時は保存済みの値を維持する
  const PRODUCT_FORM_FIELDS = ["code", "status", "name", "category", "maker", "subCategory", "storage", "color", "unitPrice", "cost", "safetyStock"];

  function saveProduct(d, isNew) {
    if (!can("product_edit")) return { ok: false, errors: { _: _t("権限がありません", "Permission denied") } };
    const errors = validateProduct(d, isNew);
    if (Object.keys(errors).length) return { ok: false, errors };
    const sub = subCategory(d.subCategory), st = storage(d.storage), co = color(d.color);
    let p = isNew ? null : product(d.code);
    if (!isNew && !p) return { ok: false, errors: { _: _t("品目が見つかりません", "Product not found") } };
    if (isNew) {
      p = {
        code: d.code, stock: Object.fromEntries(WAREHOUSES.map(w => [w.code, 0])), registeredAt: today(),
        supplier: "S-001", unit: "unit", taxType: "standard", origin: sub.origin, jan: _jan(Number(d.code.slice(2))),
        leadTimeDays: 7, weight: sub.weight, lotControl: d.category === "SPH", remarks: "", remarksEn: "",
      };
      S.products.push(p);
    }
    const nameChanged = isNew || p.name !== String(d.name).trim();
    ["status", "name", "category", "maker", "subCategory", "storage", "color"].forEach(f => { p[f] = String(d[f] ?? "").trim(); });
    ["unitPrice", "cost", "safetyStock"].forEach(f => { p[f] = Number(d[f]); });
    p.maker = sub.maker;   // ブランドはシリーズで決まる（フォームで未選択でもよい）
    if (nameChanged) p.nameEn = `${sub.en} ${st.en} ${co.en}`;   // 英名はシリーズ・容量・カラーから自動生成（品名を変えたときのみ）
    p.updatedAt = today();
    _save(LS.PRODUCTS);
    return { ok: true, product: p };
  }

  // ── 金額計算 ──────────────────────────────────────────────
  // 税額は行ごとに 金額×税率 を切り捨て
  function orderAmounts(o) {
    let subtotal = 0, tax = 0;
    const lines = o.lines.map(l => {
      const p = product(l.productCode);
      const amount = l.qty * l.unitPrice;
      const rate = p ? TAX_TYPES[p.taxType].rate : 0.1;
      const lineTax = Math.floor(amount * rate);
      subtotal += amount; tax += lineTax;
      return { ...l, amount, tax: lineTax };
    });
    return { lines, subtotal, tax, total: subtotal + tax, qty: o.lines.reduce((s, l) => s + l.qty, 0) };
  }

  // ── 採番 ──────────────────────────────────────────────────
  function _nextNo(prefix, list) {
    const y = today().slice(0, 4), head = `${prefix}-${y}-`;
    const max = list.filter(x => x.no.startsWith(head)).reduce((m, x) => Math.max(m, Number(x.no.slice(head.length))), 0);
    return head + String(max + 1).padStart(5, "0");
  }

  function _addMovement(m) { S.movements.push({ date: today(), user: S.user ? S.user.id : "", ...m }); _save(LS.MV); }

  // ── 受注 ──────────────────────────────────────────────────
  // c: no / customer / status / warehouse / dateFrom / dateTo / productCode
  function searchSalesOrders(c = {}) {
    return S.salesOrders.filter(o =>
      (!c.no || o.no.includes(c.no.trim().toUpperCase())) &&
      (!c.customer || o.customer === c.customer) &&
      (!c.status || o.status === c.status) &&
      (!c.warehouse || o.warehouse === c.warehouse) &&
      (!c.dateFrom || o.orderDate >= c.dateFrom) &&
      (!c.dateTo || o.orderDate <= c.dateTo) &&
      (!c.productCode || o.lines.some(l => l.productCode.includes(c.productCode.trim().toUpperCase()))))
      .sort((a, b) => b.no.localeCompare(a.no));
  }
  const salesOrder = no => S.salesOrders.find(o => o.no === no);

  // 得意先の与信残高（与信限度額 − 未完了受注の合計）
  function creditBalance(customerCode, excludeNo) {
    const c = partner(customerCode); if (!c) return 0;
    const used = S.salesOrders.filter(o => o.customer === customerCode && o.no !== excludeNo && ["ordered", "instructed", "shipped"].includes(o.status))
      .reduce((s, o) => s + orderAmounts(o).total, 0);
    return c.creditLimit - used;
  }

  function validateSalesOrder(d) {
    const e = {};
    const c = partner(d.customer);
    if (!c || c.kind !== "customer") e.customer = _t("得意先を選択してください", "Select a customer");
    else if (c.status !== "active") e.customer = _t("取引停止中の得意先には受注できません", "This customer is suspended");
    if (!warehouse(d.warehouse)) e.warehouse = _t("出荷倉庫を選択してください", "Select a warehouse");
    if (!d.requestedDate) e.requestedDate = _t("希望納期を入力してください", "Enter the requested date");
    else if (d.requestedDate < today()) e.requestedDate = _t("希望納期は本日以降の日付を入力してください", "Requested date must be today or later");
    const lines = (d.lines || []).filter(l => l.productCode);
    if (!lines.length) e.lines = _t("明細を1行以上入力してください", "Enter at least one line");
    const need = {};
    lines.forEach((l, i) => {
      const p = product(l.productCode);
      if (!p) { e["line" + i] = _t(`${i + 1}行目：品目コードが存在しません`, `Line ${i + 1}: product not found`); return; }
      if (p.status !== "active") { e["line" + i] = _t(`${i + 1}行目：${p.code} は${label.status(p.status)}のため受注できません`, `Line ${i + 1}: ${p.code} is ${label.status(p.status)}`); return; }
      if (!/^\d+$/.test(String(l.qty)) || Number(l.qty) < 1 || Number(l.qty) > 9999) { e["line" + i] = _t(`${i + 1}行目：数量は1〜9,999の整数で入力してください`, `Line ${i + 1}: quantity must be 1-9,999`); return; }
      need[p.code] = (need[p.code] || 0) + Number(l.qty);
    });
    if (!Object.keys(e).some(k => k.startsWith("line")) && warehouse(d.warehouse)) {
      Object.entries(need).forEach(([code, qty]) => {
        const inv = inventory(code, d.warehouse);
        if (inv.available < qty) e["stock-" + code] = _t(`${code}：有効在庫が不足しています（有効在庫 ${inv.available} / 必要数 ${qty}）`, `${code}: insufficient stock (available ${inv.available} / required ${qty})`);
      });
    }
    if (!Object.keys(e).length && c) {
      const total = orderAmounts({ lines: lines.map(l => ({ ...l, qty: Number(l.qty), unitPrice: product(l.productCode).unitPrice })) }).total;
      const bal = creditBalance(c.code);
      if (total > bal) e.credit = _t(`与信限度額を超えています（与信残 ${fmtMoney(bal)} / 受注金額 ${fmtMoney(total)}）`, `Credit limit exceeded (remaining ${fmtMoney(bal)} / order ${fmtMoney(total)})`);
    }
    return e;
  }

  function createSalesOrder(d) {
    if (!can("so_edit")) return { ok: false, errors: { _: _t("権限がありません", "Permission denied") } };
    const errors = validateSalesOrder(d);
    if (Object.keys(errors).length) return { ok: false, errors };
    const o = {
      no: _nextNo("SO", S.salesOrders), orderDate: today(), customer: d.customer, warehouse: d.warehouse,
      requestedDate: d.requestedDate, status: "ordered", createdBy: S.user.id, customerRef: (d.customerRef || "").trim(), note: (d.note || "").trim(),
      lines: d.lines.filter(l => l.productCode).map(l => ({ productCode: l.productCode, qty: Number(l.qty), unitPrice: product(l.productCode).unitPrice })),
    };
    S.salesOrders.push(o); _save(LS.SO);
    return { ok: true, order: o };
  }

  function instructShipment(no) {
    const o = salesOrder(no);
    if (!can("so_edit")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    if (!o || o.status !== "ordered") return { ok: false, msg: _t("受注済の受注のみ出荷指示できます", "Only ordered sales orders can be instructed") };
    o.status = "instructed"; _save(LS.SO);
    const sh = { no: _nextNo("SH", S.shipments), salesOrderNo: no, warehouse: o.warehouse, carrier: "", trackingNo: "",
      plannedDate: today() > o.requestedDate ? today() : o.requestedDate, shipDate: null, deliveredDate: null, status: "pending" };
    S.shipments.push(sh); _save(LS.SH);
    return { ok: true, shipment: sh };
  }

  function cancelSalesOrder(no) {
    const o = salesOrder(no);
    if (!can("so_edit")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    if (!o || !["ordered", "instructed"].includes(o.status)) return { ok: false, msg: _t("出荷前の受注のみキャンセルできます", "Only unshipped orders can be cancelled") };
    if (o.status === "instructed") { S.shipments = S.shipments.filter(s => !(s.salesOrderNo === no && s.status === "pending")); _save(LS.SH); }
    o.status = "cancelled"; o.cancelledAt = today(); _save(LS.SO);
    return { ok: true };
  }

  // ── 配送 ──────────────────────────────────────────────────
  // c: no / salesOrderNo / status / warehouse / carrier / dateFrom / dateTo（出荷予定日）
  function searchShipments(c = {}) {
    return S.shipments.filter(s =>
      (!c.no || s.no.includes(c.no.trim().toUpperCase())) &&
      (!c.salesOrderNo || s.salesOrderNo.includes(c.salesOrderNo.trim().toUpperCase())) &&
      (!c.status || s.status === c.status) &&
      (!c.warehouse || s.warehouse === c.warehouse) &&
      (!c.carrier || s.carrier === c.carrier) &&
      (!c.dateFrom || s.plannedDate >= c.dateFrom) &&
      (!c.dateTo || s.plannedDate <= c.dateTo))
      .sort((a, b) => b.no.localeCompare(a.no));
  }
  const shipment = no => S.shipments.find(s => s.no === no);

  function confirmShipment(no, carrier, trackingNo) {
    const s = shipment(no);
    if (!can("ship")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    if (!s || s.status !== "pending") return { ok: false, msg: _t("出荷待ちの配送のみ出荷確定できます", "Only pending shipments can be confirmed") };
    if (!CARRIERS.some(c => c.code === carrier)) return { ok: false, msg: _t("配送業者を選択してください", "Select a carrier") };
    if (!/^\d{12}$/.test(trackingNo || "")) return { ok: false, msg: _t("送り状番号は12桁の数字で入力してください", "Tracking number must be 12 digits") };
    const o = salesOrder(s.salesOrderNo);
    for (const l of o.lines) {
      const inv = inventory(l.productCode, s.warehouse);
      if (inv.qty < l.qty) return { ok: false, msg: _t(`${l.productCode}：現在庫が不足しています`, `${l.productCode}: insufficient stock`) };
    }
    s.carrier = carrier; s.trackingNo = trackingNo; s.shipDate = today(); s.status = "in_transit";
    o.status = "shipped"; _save(LS.SO); _save(LS.SH);
    o.lines.forEach(l => _addMovement({ type: "ship", productCode: l.productCode, warehouse: s.warehouse, qty: -l.qty, ref: s.no }));
    return { ok: true };
  }

  function confirmDelivery(no) {
    const s = shipment(no);
    if (!can("ship")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    if (!s || s.status !== "in_transit") return { ok: false, msg: _t("配送中のもののみ配達完了にできます", "Only in-transit shipments can be delivered") };
    s.status = "delivered"; s.deliveredDate = today();
    const o = salesOrder(s.salesOrderNo); if (o) o.status = "delivered";
    _save(LS.SH); _save(LS.SO);
    return { ok: true };
  }

  // ── 発注 ──────────────────────────────────────────────────
  // c: no / supplier / status / warehouse / dateFrom / dateTo / productCode
  function searchPurchaseOrders(c = {}) {
    return S.purchaseOrders.filter(o =>
      (!c.no || o.no.includes(c.no.trim().toUpperCase())) &&
      (!c.supplier || o.supplier === c.supplier) &&
      (!c.status || o.status === c.status) &&
      (!c.warehouse || o.warehouse === c.warehouse) &&
      (!c.dateFrom || o.orderDate >= c.dateFrom) &&
      (!c.dateTo || o.orderDate <= c.dateTo) &&
      (!c.productCode || o.lines.some(l => l.productCode.includes(c.productCode.trim().toUpperCase()))))
      .sort((a, b) => b.no.localeCompare(a.no));
  }
  const purchaseOrder = no => S.purchaseOrders.find(o => o.no === no);

  function validatePurchaseOrder(d) {
    const e = {};
    const s = partner(d.supplier);
    if (!s || s.kind !== "supplier") e.supplier = _t("仕入先を選択してください", "Select a supplier");
    else if (s.status !== "active") e.supplier = _t("取引停止中の仕入先には発注できません", "This supplier is suspended");
    if (!warehouse(d.warehouse)) e.warehouse = _t("入荷倉庫を選択してください", "Select a warehouse");
    if (!d.expectedDate) e.expectedDate = _t("入荷予定日を入力してください", "Enter the expected date");
    else if (d.expectedDate < today()) e.expectedDate = _t("入荷予定日は本日以降の日付を入力してください", "Expected date must be today or later");
    const lines = (d.lines || []).filter(l => l.productCode);
    if (!lines.length) e.lines = _t("明細を1行以上入力してください", "Enter at least one line");
    lines.forEach((l, i) => {
      const p = product(l.productCode);
      if (!p) e["line" + i] = _t(`${i + 1}行目：品目コードが存在しません`, `Line ${i + 1}: product not found`);
      else if (p.status === "discontinued") e["line" + i] = _t(`${i + 1}行目：${p.code} は廃番のため発注できません`, `Line ${i + 1}: ${p.code} is discontinued`);
      else if (!/^\d+$/.test(String(l.qty)) || Number(l.qty) < 1 || Number(l.qty) > 99999) e["line" + i] = _t(`${i + 1}行目：数量は1〜99,999の整数で入力してください`, `Line ${i + 1}: quantity must be 1-99,999`);
      else if (!/^\d+$/.test(String(l.unitPrice))) e["line" + i] = _t(`${i + 1}行目：仕入単価は0以上の整数で入力してください`, `Line ${i + 1}: unit cost must be an integer`);
    });
    return e;
  }

  function createPurchaseOrder(d) {
    if (!can("po_edit")) return { ok: false, errors: { _: _t("権限がありません", "Permission denied") } };
    const errors = validatePurchaseOrder(d);
    if (Object.keys(errors).length) return { ok: false, errors };
    const o = {
      no: _nextNo("PO", S.purchaseOrders), orderDate: today(), supplier: d.supplier, warehouse: d.warehouse, expectedDate: d.expectedDate,
      status: "ordered", createdBy: S.user.id, note: (d.note || "").trim(), receivedDate: null,
      lines: d.lines.filter(l => l.productCode).map(l => ({ productCode: l.productCode, qty: Number(l.qty), unitPrice: Number(l.unitPrice) })),
    };
    S.purchaseOrders.push(o); _save(LS.PO);
    return { ok: true, order: o };
  }

  function receivePurchaseOrder(no) {
    const o = purchaseOrder(no);
    if (!can("po_receive")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    if (!o || o.status !== "ordered") return { ok: false, msg: _t("発注済の発注のみ入荷処理できます", "Only ordered purchase orders can be received") };
    o.status = "received"; o.receivedDate = today(); _save(LS.PO);
    o.lines.forEach(l => _addMovement({ type: "receive", productCode: l.productCode, warehouse: o.warehouse, qty: l.qty, ref: o.no }));
    return { ok: true };
  }

  function cancelPurchaseOrder(no) {
    const o = purchaseOrder(no);
    if (!can("po_edit")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    if (!o || o.status !== "ordered") return { ok: false, msg: _t("発注済の発注のみキャンセルできます", "Only ordered purchase orders can be cancelled") };
    o.status = "cancelled"; o.cancelledAt = today(); _save(LS.PO);
    return { ok: true };
  }

  // ── 在庫 ──────────────────────────────────────────────────
  // c: code / name / category / warehouse / stockStatus / onlyStocked
  function searchInventory(c = {}) {
    const code = (c.code || "").trim().toUpperCase(), name = (c.name || "").trim().toLowerCase();
    const rows = [];
    S.products.forEach(p => {
      if (code && !p.code.includes(code)) return;
      if (name && !p.name.toLowerCase().includes(name) && !p.nameEn.toLowerCase().includes(name)) return;
      if (c.category && p.category !== c.category) return;
      WAREHOUSES.forEach(w => {
        if (c.warehouse && w.code !== c.warehouse) return;
        const i = inventory(p.code, w.code);
        if (c.stockStatus && i.status !== c.stockStatus) return;
        if (c.onlyStocked && i.qty <= 0) return;
        rows.push(i);
      });
    });
    return rows;
  }

  function adjustInventory(code, wh, qty, reason, note) {
    if (!can("inv_adjust")) return { ok: false, msg: _t("権限がありません", "Permission denied") };
    const inv = inventory(code, wh);
    if (!inv) return { ok: false, msg: _t("品目が見つかりません", "Product not found") };
    if (!/^-?\d+$/.test(String(qty)) || Number(qty) === 0) return { ok: false, msg: _t("調整数は0以外の整数で入力してください（減らす場合はマイナス）", "Enter a non-zero integer (negative to decrease)") };
    if (!ADJUST_REASONS[reason]) return { ok: false, msg: _t("調整理由を選択してください", "Select a reason") };
    if (inv.qty + Number(qty) < 0) return { ok: false, msg: _t(`調整後の在庫（${inv.qty + Number(qty)}）がマイナスになります`, `Stock after adjustment (${inv.qty + Number(qty)}) would be negative`) };
    if (inv.qty + Number(qty) < inv.allocated) return { ok: false, msg: _t(`調整後の在庫（${inv.qty + Number(qty)}）が引当数（${inv.allocated}）を下回ります`, `Stock after adjustment (${inv.qty + Number(qty)}) would be below allocated (${inv.allocated})`) };
    _addMovement({ type: "adjust", productCode: code, warehouse: wh, qty: Number(qty), ref: "ADJ-" + today().replace(/-/g, ""), reason, note: (note || "").trim() });
    return { ok: true, inventory: inventory(code, wh) };
  }

  // c: code / warehouse / type / dateFrom / dateTo / ref
  function searchMovements(c = {}) {
    return S.movements.map((m, i) => ({ ...m, seq: i + 1 })).filter(m =>
      (!c.code || m.productCode.includes(c.code.trim().toUpperCase())) &&
      (!c.warehouse || m.warehouse === c.warehouse) &&
      (!c.type || m.type === c.type) &&
      (!c.dateFrom || m.date >= c.dateFrom) &&
      (!c.dateTo || m.date <= c.dateTo) &&
      (!c.ref || (m.ref || "").includes(c.ref.trim().toUpperCase())))
      .sort((a, b) => b.date.localeCompare(a.date) || b.seq - a.seq);
  }

  // ── 取引先 ────────────────────────────────────────────────
  function searchPartners(c = {}) {
    const kw = (c.keyword || "").trim().toLowerCase();
    return PARTNERS.filter(p =>
      (!c.kind || p.kind === c.kind) && (!c.status || p.status === c.status) && (!c.pref || p.pref === c.pref) &&
      (!kw || p.code.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw) || p.nameEn.toLowerCase().includes(kw)));
  }

  // ── ダッシュボード ────────────────────────────────────────
  function dashboard() {
    const rows = S.products.map(productRow);
    return {
      openSales: S.salesOrders.filter(o => ["ordered", "instructed"].includes(o.status)).length,
      pendingShipments: S.shipments.filter(s => s.status === "pending").length,
      inTransit: S.shipments.filter(s => s.status === "in_transit").length,
      openPurchases: S.purchaseOrders.filter(o => o.status === "ordered").length,
      lowStock: rows.filter(r => r.status === "active" && r.stockStatus === "low").length,
      outOfStock: rows.filter(r => r.status === "active" && r.stockStatus === "out").length,
      activeProducts: rows.filter(r => r.status === "active").length,
      alerts: rows.filter(r => r.status === "active" && r.stockStatus !== "in").sort((a, b) => a.available - b.available || a.code.localeCompare(b.code)),
    };
  }

  // ── ユーティリティ ────────────────────────────────────────
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  function fmtMoney(n) { return "¥" + Number(n).toLocaleString("ja-JP"); }
  function fmtNum(n) { return Number(n).toLocaleString("ja-JP"); }
  function fmtDate(s) { return s ? s.replace(/-/g, "/") : ""; }

  return {
    LS, init, resetAll,
    login, logout, currentUser, can, userName, roleName,
    product, partner, warehouse, category, subCategory, maker, origin, storage, color, productName, partnerName, label,
    inventory, totals, productRow, searchProducts, PRODUCT_SORTS, PRODUCT_FORM_FIELDS, validateProduct, saveProduct,
    orderAmounts, searchSalesOrders, salesOrder, creditBalance, createSalesOrder, instructShipment, cancelSalesOrder,
    searchShipments, shipment, confirmShipment, confirmDelivery,
    searchPurchaseOrders, purchaseOrder, createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
    searchInventory, adjustInventory, searchMovements, searchPartners, dashboard,
    today, fmtMoney, fmtNum, fmtDate,
    products: () => S.products, salesOrders: () => S.salesOrders, purchaseOrders: () => S.purchaseOrders, shipments: () => S.shipments,
  };
})();

if (typeof module !== "undefined") module.exports = ERP;
