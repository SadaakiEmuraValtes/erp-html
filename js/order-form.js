// ============================================================
//  VALTES ERP Demo – 受注／発注の登録フォーム・詳細表示（共通）
//  kind: "so"（受注） / "po"（発注）
// ============================================================

const ORDER_KIND = {
  so: {
    partnerKey: "customer", partnerLabel: ["得意先", "Customer"], partnerOpts: () => OPTS.customer(true),
    dateKey: "requestedDate", dateLabel: ["希望納期", "Requested date"], dateOffset: 7,
    whLabel: ["出荷倉庫", "Ship-from warehouse"], priceEditable: false, priceLabel: ["販売単価", "Unit price"],
    stockLabel: ["有効在庫", "Available"], stockOf: (code, wh) => ERP.inventory(code, wh).available,
    price: p => p.unitPrice, create: d => ERP.createSalesOrder(d), detailPage: "sales-order.html", listPage: "sales-orders.html",
  },
  po: {
    partnerKey: "supplier", partnerLabel: ["仕入先", "Supplier"], partnerOpts: () => OPTS.supplier(true),
    dateKey: "expectedDate", dateLabel: ["入荷予定日", "Expected date"], dateOffset: 14,
    whLabel: ["入荷倉庫", "Receiving warehouse"], priceEditable: true, priceLabel: ["仕入単価", "Unit cost"],
    stockLabel: ["現在庫", "On hand"], stockOf: (code, wh) => ERP.inventory(code, wh).qty,
    price: p => p.cost, create: d => ERP.createPurchaseOrder(d), detailPage: "purchase-order.html", listPage: "purchase-orders.html",
  },
};

let _kind = "so", _lineCount = 0;

// ══════════ 登録フォーム ══════════
function renderOrderForm(kind) {
  _kind = kind;
  const K = ORDER_KIND[kind];
  const d = new Date(); d.setDate(d.getDate() + K.dateOffset);
  const defDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const sellable = ERP.products().filter(p => kind === "so" ? p.status === "active" : p.status !== "discontinued");
  document.getElementById("page").innerHTML = `
    <h1 class="page-title" id="page-title">${kind === "so" ? t("➕ 受注登録", "➕ New Sales Order") : t("➕ 発注登録", "➕ New Purchase Order")}</h1>
    <div id="form-errors" class="alert alert-danger hidden" role="alert"></div>
    <form id="order-form" onsubmit="event.preventDefault();submitOrder()">
      <div class="panel"><div class="panel-head">${t("ヘッダー情報", "Header")}</div><div class="panel-body"><div class="form-grid">
        <div class="form-group" id="g-${K.partnerKey}"><label for="f-${K.partnerKey}" class="req">${L(K.partnerLabel)}</label>
          <select id="f-${K.partnerKey}" name="${K.partnerKey}" onchange="onPartner()">${optionsHtml(K.partnerOpts(), "", t("選択してください", "Select"))}</select>
          <span class="err" id="err-${K.partnerKey}"></span>${kind === "so" ? `<span class="muted" id="credit-info"></span>` : ""}</div>
        <div class="form-group" id="g-warehouse"><label for="f-warehouse" class="req">${L(K.whLabel)}</label>
          <select id="f-warehouse" name="warehouse" onchange="recalc()">${optionsHtml(OPTS.warehouse(), "WH01")}</select><span class="err" id="err-warehouse"></span></div>
        <div class="form-group" id="g-${K.dateKey}"><label for="f-${K.dateKey}" class="req">${L(K.dateLabel)}</label>
          <input type="date" id="f-${K.dateKey}" name="${K.dateKey}" value="${defDate}"><span class="err" id="err-${K.dateKey}"></span></div>
        ${kind === "so" ? `<div class="form-group" id="g-customerRef"><label for="f-customerRef">${t("客先注文番号", "Customer PO No.")}</label><input type="text" id="f-customerRef" name="customerRef" maxlength="30"></div>` : "<div></div>"}
        <div class="form-group full" id="g-note"><label for="f-note">${t("備考", "Note")}</label><input type="text" id="f-note" name="note" maxlength="200"></div>
      </div></div></div>
      <div class="panel"><div class="panel-head">${t("明細", "Lines")}<span class="right"><button type="button" class="btn btn-secondary btn-sm" id="btn-add-line" onclick="addLine()">＋ ${t("行追加", "Add line")}</button></span></div>
        <div class="table-wrap" style="border:none"><table class="data-table lines-table" id="line-table">
          <thead><tr><th>#</th><th>${t("品目コード", "Code")}</th><th>${t("品名", "Name")}</th><th class="num">${L(K.stockLabel)}</th>
            <th class="num">${L(K.priceLabel)}</th><th class="num">${t("数量", "Qty")}</th><th class="num">${t("金額", "Amount")}</th><th></th></tr></thead>
          <tbody id="line-body"></tbody></table></div>
        <datalist id="product-list">${sellable.map(p => `<option value="${p.code}">${esc(ERP.productName(p))}</option>`).join("")}</datalist>
        <table class="totals" id="order-totals">
          <tr><td>${t("小計（税抜）", "Subtotal")}</td><td class="num" id="sum-subtotal" data-value="0">¥0</td></tr>
          <tr><td>${t("消費税", "Tax")}</td><td class="num" id="sum-tax" data-value="0">¥0</td></tr>
          <tr class="grand"><td>${t("合計（税込）", "Total")}</td><td class="num" id="sum-total" data-value="0">¥0</td></tr>
        </table>
        <div class="panel-body"><div class="form-actions" style="margin-top:0">
          <a class="btn btn-secondary" id="btn-cancel" href="${I18n.urlWith(K.listPage)}">${t("キャンセル", "Cancel")}</a>
          <button type="submit" class="btn btn-primary" id="btn-register">${t("登録する", "Register")}</button>
        </div></div>
      </div>
    </form>`;
  _lineCount = 0;
  for (let i = 0; i < 3; i++) addLine();
}

function addLine() {
  const K = ORDER_KIND[_kind], i = ++_lineCount;
  document.getElementById("line-body").insertAdjacentHTML("beforeend", `
    <tr id="line-${i}" data-line="${i}">
      <td class="center">${i}</td>
      <td class="w-code"><input type="text" id="line-code-${i}" name="line-code-${i}" list="product-list" placeholder="P-00001" oninput="onLineCode(${i})" autocomplete="off"></td>
      <td id="line-name-${i}" class="cell-name"></td>
      <td id="line-stock-${i}" class="num" data-value=""></td>
      <td class="w-qty"><input type="text" id="line-price-${i}" name="line-price-${i}" inputmode="numeric" ${K.priceEditable ? "" : "readonly tabindex=-1"} oninput="recalc()" style="text-align:right"></td>
      <td class="w-qty"><input type="text" id="line-qty-${i}" name="line-qty-${i}" inputmode="numeric" oninput="recalc()" style="text-align:right"></td>
      <td id="line-amount-${i}" class="num" data-value="0"></td>
      <td><button type="button" class="btn btn-danger btn-sm" id="btn-del-line-${i}" onclick="delLine(${i})" title="${t("行削除", "Delete line")}">✕</button></td>
    </tr>`);
}

function delLine(i) { document.getElementById("line-" + i)?.remove(); recalc(); }

function onLineCode(i) {
  const K = ORDER_KIND[_kind];
  const code = document.getElementById("line-code-" + i).value.trim().toUpperCase();
  const p = ERP.product(code);
  document.getElementById("line-name-" + i).textContent = p ? ERP.productName(p) : "";
  document.getElementById("line-price-" + i).value = p ? K.price(p) : "";
  recalc();
}

function onPartner() {
  if (_kind !== "so") return;
  const c = document.getElementById("f-customer").value, el = document.getElementById("credit-info");
  if (!c) { el.textContent = ""; return; }
  const bal = ERP.creditBalance(c);
  el.textContent = t(`与信限度額 ${yen(ERP.partner(c).creditLimit)}／与信残 ${yen(bal)}`, `Credit limit ${yen(ERP.partner(c).creditLimit)} / remaining ${yen(bal)}`);
  el.dataset.value = bal;
}

function collectLines() {
  return [...document.querySelectorAll("#line-body tr")].map(tr => {
    const i = tr.dataset.line;
    return { productCode: document.getElementById("line-code-" + i).value.trim().toUpperCase(), qty: document.getElementById("line-qty-" + i).value.trim(),
      unitPrice: document.getElementById("line-price-" + i).value.trim(), _i: i };
  });
}

function recalc() {
  const K = ORDER_KIND[_kind], wh = document.getElementById("f-warehouse").value;
  const valid = [];
  collectLines().forEach(l => {
    const p = ERP.product(l.productCode);
    const stockEl = document.getElementById("line-stock-" + l._i);
    stockEl.textContent = p ? num(K.stockOf(p.code, wh)) : ""; stockEl.dataset.value = p ? K.stockOf(p.code, wh) : "";
    const ok = p && /^\d+$/.test(l.qty) && /^\d+$/.test(l.unitPrice);
    const amount = ok ? Number(l.qty) * Number(l.unitPrice) : 0;
    const a = document.getElementById("line-amount-" + l._i);
    a.textContent = ok ? yen(amount) : ""; a.dataset.value = amount;
    if (ok) valid.push({ productCode: p.code, qty: Number(l.qty), unitPrice: Number(l.unitPrice) });
  });
  const s = ERP.orderAmounts({ lines: valid });
  [["subtotal", s.subtotal], ["tax", s.tax], ["total", s.total]].forEach(([k, v]) => { const el = document.getElementById("sum-" + k); el.textContent = yen(v); el.dataset.value = v; });
}

function submitOrder() {
  const K = ORDER_KIND[_kind];
  const lines = collectLines().filter(l => l.productCode || l.qty);
  const d = { [K.partnerKey]: document.getElementById("f-" + K.partnerKey).value, warehouse: document.getElementById("f-warehouse").value,
    [K.dateKey]: document.getElementById("f-" + K.dateKey).value, note: document.getElementById("f-note").value, lines };
  if (_kind === "so") d.customerRef = document.getElementById("f-customerRef").value;
  const res = K.create(d);
  // 明細行のエラーはその行に色を付ける
  document.querySelectorAll("#line-body tr").forEach(tr => tr.classList.remove("has-error"));
  if (!res.ok) {
    Object.keys(res.errors).filter(k => /^line\d+$/.test(k)).forEach(k => {
      const l = lines.filter(x => x.productCode)[Number(k.slice(4))]; if (l) document.getElementById("line-" + l._i)?.classList.add("has-error");
    });
    showErrors(res.errors, [K.partnerKey, "warehouse", K.dateKey]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  setFlash(_kind === "so" ? t(`受注 ${res.order.no} を登録しました。`, `Sales order ${res.order.no} has been registered.`)
                          : t(`発注 ${res.order.no} を登録しました。`, `Purchase order ${res.order.no} has been registered.`));
  I18n.go(`${K.detailPage}?no=${res.order.no}`);
}

// ══════════ 詳細表示 ══════════
// header: [[key, label, rawValue, html?], ...]
function orderDetailHtml(kind, o, header) {
  const a = ERP.orderAmounts(o);
  return `
    <div class="panel"><div class="panel-head">${t("ヘッダー情報", "Header")}</div>
      <table class="detail-table" id="detail-header">${header.map(([k, label, v, html]) =>
        `<tr data-field="${k}"><th>${label}</th><td id="d-${k}" data-value="${esc(v)}">${html ?? esc(v)}</td></tr>`).join("")}</table></div>
    <div class="panel"><div class="panel-head">${t("明細", "Lines")}</div>
      ${tableHtml({ id: `${kind}-lines-table`, rowPrefix: "line", rows: a.lines.map((l, i) => ({ ...l, lineNo: i + 1 })), rowKey: l => l.lineNo, columns: [
        { key: "lineNo", label: ["#", "#"], value: l => l.lineNo, cls: "center" },
        { key: "productCode", label: ["品目コード", "Code"], value: l => l.productCode, html: l => `<a href="${I18n.urlWith("product.html?code=" + l.productCode)}">${l.productCode}</a>`, cls: "nowrap" },
        { key: "name", label: ["品名", "Name"], value: l => ERP.product(l.productCode)?.name || "", html: l => esc(ERP.productName(ERP.product(l.productCode))) },
        { key: "qty", label: ["数量", "Qty"], value: l => l.qty, html: l => num(l.qty), cls: "num" },
        { key: "unit", label: ["単位", "Unit"], value: l => ERP.product(l.productCode)?.unit || "", html: l => esc(ERP.label.unit(ERP.product(l.productCode)?.unit)), cls: "center" },
        { key: "unitPrice", label: kind === "so" ? ["販売単価", "Unit price"] : ["仕入単価", "Unit cost"], value: l => l.unitPrice, html: l => yen(l.unitPrice), cls: "num" },
        { key: "amount", label: ["金額", "Amount"], value: l => l.amount, html: l => yen(l.amount), cls: "num" },
        { key: "taxType", label: ["課税区分", "Tax type"], value: l => ERP.product(l.productCode)?.taxType || "", html: l => esc(ERP.label.tax(ERP.product(l.productCode)?.taxType)), cls: "nowrap" },
        { key: "tax", label: ["消費税", "Tax"], value: l => l.tax, html: l => yen(l.tax), cls: "num" },
      ] })}
      <table class="totals" id="order-totals">
        <tr><td>${t("数量計", "Total qty")}</td><td class="num" id="d-qty" data-value="${a.qty}">${num(a.qty)}</td></tr>
        <tr><td>${t("小計（税抜）", "Subtotal")}</td><td class="num" id="d-subtotal" data-value="${a.subtotal}">${yen(a.subtotal)}</td></tr>
        <tr><td>${t("消費税", "Tax")}</td><td class="num" id="d-tax" data-value="${a.tax}">${yen(a.tax)}</td></tr>
        <tr class="grand"><td>${t("合計（税込）", "Total")}</td><td class="num" id="d-total" data-value="${a.total}">${yen(a.total)}</td></tr>
      </table><div style="height:12px"></div>
    </div>`;
}
