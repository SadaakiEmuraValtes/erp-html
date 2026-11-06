# 🏭 VALTES ERP Demo

> **⚠️ デモサイト**：テスト自動化の学習・デモ用に作成した架空の ERP システムです。会社名・品名・メーカー・取引先・人物・金額・在庫数はすべてフィクションであり、実在の企業・製品・人物とは一切関係ありません。実際の受発注・決済・配送は行われません。

🌐 **デモサイト**: https://sadaakiemuravaltes.github.io/erp-html/

SAP のような基幹業務システムを簡略化したデモです。**左にメニュー、右に機能**の画面構成で、受注・発注・配送・在庫・商品マスター・取引先を扱います。
**データドリブンテスト**を作りやすいよう、検索条件をURLで指定でき、一覧・詳細のすべての値に XPath で特定しやすい属性（`data-key` / `data-col` / `data-value`）を付けています。

[TicketMarket](https://github.com/SadaakiEmuraValtes/ticket-market) と同じ実装方針（Vanilla JS・ビルド不要・`buildPage()`・`?lang=en` 英語対応・テスト用ID設計）です。

---

## 🚀 起動方法

```bash
python -m http.server 8080   # または npx serve .
```

ブラウザで `http://localhost:8080` を開くとログイン画面になります（全画面ログイン必須）。`file://` では localStorage が制限される場合があります。

---

## 🧪 テストアカウント

| ユーザーID | パスワード | 氏名 | ロール | できること |
|-----------|-----------|------|--------|-----------|
| `admin` | `Erp#Admin2026` | 山田 太郎 | システム管理者 | すべて |
| `sales01` | `Sales!Order77` | 鈴木 花子 | 営業 | 受注登録・キャンセル・出荷指示 |
| `buyer01` | `Buy$Supply88` | 田中 健一 | 購買 | 商品マスター編集・発注登録・入荷 |
| `wh01` | `Wh@Stock2026` | 佐藤 美咲 | 倉庫 | 入荷・出荷確定・配達完了・在庫調整 |
| `viewer01` | `View%Only55` | 中村 龍也 | 閲覧のみ | 閲覧のみ（操作ボタンは `disabled`） |

ログイン画面の「入力」ボタンで自動入力できます。権限のないボタンは `disabled` になり、`data-perm` 属性で必要な権限を判別できます。

### 権限マトリクス

| 権限キー | 内容 | admin | sales | purchase | warehouse | viewer |
|---------|------|:-:|:-:|:-:|:-:|:-:|
| `product_edit` | 商品マスター登録・編集 | ✓ | | ✓ | | |
| `so_edit` | 受注登録・キャンセル・出荷指示 | ✓ | ✓ | | | |
| `po_edit` | 発注登録・キャンセル | ✓ | | ✓ | | |
| `po_receive` | 入荷処理 | ✓ | | ✓ | ✓ | |
| `ship` | 出荷確定・配達完了 | ✓ | | | ✓ | |
| `inv_adjust` | 在庫調整 | ✓ | | | ✓ | |

---

## 🖥 画面構成

| メニュー | 画面 | 主な機能 |
|---------|------|---------|
| ダッシュボード | `index.html` | KPI（未出荷受注・出荷待ち・配送中・発注残・安全在庫割れ・在庫なし・有効品目数）、最近の受注、在庫アラート、自分の権限 |
| 受注一覧 / 受注登録 | `sales-orders.html` / `sales-order.html` | 受注検索（番号・得意先・状態・倉庫・受注日・品目）、受注登録（明細入力・在庫/与信チェック・税計算）、出荷指示、キャンセル |
| 発注一覧 / 発注登録 | `purchase-orders.html` / `purchase-order.html` | 発注検索、発注登録、入荷処理（在庫加算）、キャンセル |
| 配送管理 | `shipments.html` | 配送検索、出荷確定（配送業者・送り状番号12桁、在庫減算）、配達完了 |
| 在庫照会 | `inventory.html` | 品目×倉庫の現在庫・引当数・有効在庫・発注残・安全在庫・状態、在庫調整 |
| 入出庫履歴 | `movements.html` | 入荷・出荷・在庫調整の履歴検索 |
| 商品マスター / 商品登録 | `products.html` / `product.html` | **14項目の組み合わせ検索**・並び替え・20/50/100件ページャー・CSV出力、詳細（倉庫別在庫・入出庫履歴）、登録・編集 |
| 取引先マスター | `partners.html` | 得意先25社・仕入先12社、与信限度額・与信残 |
| ヘルプ・テストデータ | `help.html` | テストアカウント・権限表・テスト用品目・XPath規約・テストデータCSV・データ初期化 |

業務フロー：**受注登録（在庫引当）→ 出荷指示 → 出荷確定（在庫減）→ 配達完了**／**発注登録 → 入荷処理（在庫増）**

---

## 📊 マスターデータ

- **商品 312件**：テスト用 `P-00001`〜`P-00012` ＋ 自動生成 `P-10001`〜`P-10300`（6カテゴリ×20サブカテゴリ×15品目）
- **倉庫 3**：`WH01` 東京中央倉庫 / `WH02` 大阪物流センター / `WH03` 福岡配送センター
- **取引先 37**：得意先 `C-0001`〜`C-0025`、仕入先 `S-001`〜`S-012`
- **サンプル取引**：受注39件・発注24件・配送24件・入出庫履歴66件（2026/08〜10）

データは**日付固定・固定シードの LCG**で生成しているため、いつ開いても同じ値になります（期待値が変わらない）。

### テスト用品目

| コード | 品名 | テスト観点 |
|--------|------|-----------|
| P-00001 | バルテス 標準テスト品 | 標準的な値 |
| P-00002 | 在庫ゼロ品 | 全倉庫在庫0（在庫なし・受注時に在庫不足エラー） |
| P-00003 | 安全在庫割れ品 | 有効在庫 < 安全在庫 |
| P-00004 | 販売停止品 | 受注不可 |
| P-00005 | 廃番品 | 受注・発注不可 |
| P-00006 | 高額品 精密測定ユニット | 単価 ¥9,800,000（与信超過の確認にも） |
| P-00007 | サンプル品（単価0円） | 単価0円 |
| P-00008 | 【長い品名テスト】… | 表示崩れ確認 |
| P-00009 | 記号テスト品 A&B <特殊> "記号" 'テスト' | HTMLエスケープ確認 |
| P-00010 / P-00011 | 軽減税率テスト品 / 非課税テスト品 | 消費税 8% / 0% |
| P-00012 | ロット管理品 東京在庫のみ | ロット管理・東京倉庫のみ在庫 |

テスト用取引先：`C-0001`（標準・与信限度額 ¥5,000,000）／ `C-0002`（取引停止・受注不可）／ `S-001`（標準仕入先）

---

## 🧮 データドリブンテスト

### 検索条件は URL で指定できる

商品マスターの検索条件はすべて URL パラメータに反映されます（パラメータ名＝検索フォームの要素ID `#s-{名前}`）。

```
products.html?category=ELC&priceMin=1000&statuses=active,suspended&sort=price_desc&pageSize=50&page=2
```

| パラメータ | 内容 | 値の例 |
|-----------|------|-------|
| `code` / `name` | 品目コード / 品名（部分一致・英名も対象・大文字小文字区別なし） | `P-100` / `bearing` |
| `category` / `subCategory` | カテゴリ / サブカテゴリ | `ELC` / `ELC-RES` |
| `maker` / `supplier` / `unit` | メーカー / 仕入先 / 単位 | `MK03` / `S-001` / `roll` |
| `priceMin` / `priceMax` | 販売単価の範囲（両端を含む） | `1000` / `2000` |
| `statuses` | ステータス（カンマ区切り） | `active,suspended,discontinued` |
| `stockStatus` | 在庫状態 | `in` / `low` / `out` |
| `warehouse` | 在庫のある倉庫 | `WH01` |
| `taxType` / `lotControl` / `origin` | 課税区分 / ロット管理 / 原産国 | `reduced` / `yes` / `DE` |
| `regFrom` / `regTo` | 登録日の範囲 | `2026-01-01` |
| `sort` | 並び順 | `code_asc`（既定）`code_desc` `name_asc` `price_asc` `price_desc` `stock_asc` `stock_desc` `reg_desc` |
| `pageSize` / `page` | 表示件数（20/50/100）/ ページ | `50` / `2` |

受注・発注・配送・在庫・入出庫履歴・取引先の一覧も同様に検索条件が URL に反映されます。

### 期待値 CSV（`testdata/`）

| ファイル | 内容 |
|---------|------|
| `product_search_cases.csv` | 商品検索 35ケース：条件・URL・期待件数・ページ数・先頭/末尾の品目コード・先頭の単価/有効在庫/在庫状態・単価合計 |
| `products_expected.csv` | 全312品目の一覧表示値（一覧セルの `data-value` と一致） |
| `inventory_expected.csv` | 品目×倉庫 936行の在庫（在庫照会の `data-value` と一致） |
| `sales_orders_expected.csv` | 受注39件の金額・数量・状態 |

期待値は**初期データ**（ヘルプ画面の「データを初期化する」直後）の値です。データを変えた場合は以下で再生成できます。

```bash
node tools/gen-testdata.js
```

> 在庫状態・有効在庫は受注・入荷・在庫調整で変わります。データドリブンテストの前に `help.html` の「データを初期化する」（または localStorage の `erp_*` 削除）を行ってください。

---

## 🤖 テスト自動化向けセレクタ規約

| 対象 | 規則 | 例 |
|------|------|----|
| 表 | `table[@id]` | `//table[@id='product-table']` |
| 行 | `tr[@data-key]`（品目コード・伝票番号など） | `//table[@id='product-table']//tr[@data-key='P-00001']` |
| n行目 | `tr[@data-row]`（表示中ページ内で1始まり） | `//table[@id='product-table']//tr[@data-row='1']` |
| セル | `td[@data-col]`、生の値は `@data-value` | `//tr[@data-key='P-00001']/td[@data-col='unitPrice']/@data-value` → `1000` |
| セル（ID） | `#{行接頭辞}-{キー}-{列}` | `#product-P-00001-unitPrice` / `#inv-P-00001-WH01-available` / `#so-SO-2026-00001-total` |
| 列見出し | `th[@data-col]` | `//table[@id='so-table']//th[@data-col='total']` |
| 詳細画面の項目 | `#d-{項目}` ＋ `@data-value` | `//td[@id='d-unitPrice']/@data-value` / `#d-total` |
| 検索条件 | `#s-{項目}`、ステータスのチェックは `#s-status-{値}` | `#s-category` / `#s-priceMin` / `#s-status-active` / `#btn-search` / `#btn-clear` |
| 件数・ページャー | `#result-count/@data-count`、`#pager[@data-current][@data-total]` | 下部 `#page-3` `#next` `#prev` `#first` `#last`、上部 `#top-page-3` `#top-next` |
| 登録フォーム | `#f-{項目}`、エラー `#err-{項目}` ・ `#g-{項目}.has-error`、まとめ `#form-errors .form-error-item` | `#f-unitPrice` / `#btn-save` / `#btn-register` |
| 明細入力 | `#line-code-{n}` `#line-qty-{n}` `#line-price-{n}` `#line-amount-{n}` `#line-stock-{n}` | 合計 `#sum-subtotal` `#sum-tax` `#sum-total`（`@data-value`） |
| 左メニュー | `#menu-{id}`、選択中は `a.menu-item.active` | `#menu-products` `#menu-sales-orders` `#menu-inventory` |
| ステータス | `span.badge[@data-status]` | `//tr[@data-key='SO-2026-00001']//span[@data-status]` |
| 操作ボタン | 受注 `#btn-instruct` `#btn-cancel-so`、発注 `#btn-receive` `#btn-cancel-po`、配送 `#btn-ship-{配送番号}` `#btn-deliver-{配送番号}`、在庫 `#btn-adjust-{品目}-{倉庫}` | モーダル `#m-carrier` `#m-tracking` `#btn-confirm-ship` / `#m-qty` `#m-reason` `#btn-confirm-adjust` |
| 権限で無効なボタン | `button[@data-perm][@disabled]` | 閲覧ユーザーで `#btn-edit[disabled]` |
| メッセージ | 遷移後 `#flash`、トースト `.toast` | `受注 SO-2026-00040 を登録しました。` |

一覧の主な表 ID：`#product-table` `#so-table` `#po-table` `#shipment-table` `#inventory-table` `#movement-table` `#partner-table` / 明細 `#so-lines-table` `#po-lines-table`

---

## ⚙️ 業務ルール

1. 受注できるのは「有効」の品目のみ（販売停止・廃番は不可）。廃番は発注も不可
2. 受注時は出荷倉庫の**有効在庫（現在庫−引当数）**が必要数以上。登録すると引当される
3. 受注金額（税込）は得意先の**与信残（与信限度額−未完了受注の合計）**以内。取引停止の得意先・仕入先は選択肢に出ない
4. 希望納期・入荷予定日は本日以降。数量は受注 1〜9,999、発注 1〜99,999
5. 消費税は明細ごとに `floor(金額 × 税率)`（標準10%／軽減8%／非課税0%）
6. 受注 → 出荷指示（配送データ作成）→ 出荷確定（在庫減・送り状番号12桁）→ 配達完了。キャンセルは出荷前のみ（引当は解放）
7. 発注 → 入荷処理で入荷倉庫の在庫が増える。キャンセルは発注済のみ
8. 在庫調整は0以外の整数。調整後在庫がマイナス／引当数未満になる調整は不可
9. 在庫状態：有効在庫0以下＝在庫なし（`out`）／安全在庫未満＝安全在庫割れ（`low`）／それ以外＝在庫あり（`in`）。倉庫別は安全在庫÷3（切り上げ）で判定
10. 商品登録：品目コード `P-00000` 形式・重複不可、標準原価 ≦ 販売単価、JAN 13桁

---

## 📁 ファイル構成

```
erp-html/
├── index.html / login.html / help.html
├── products.html / product.html               # 商品マスター（検索・詳細・登録・編集）
├── sales-orders.html / sales-order.html       # 受注
├── purchase-orders.html / purchase-order.html # 発注
├── shipments.html                             # 配送
├── inventory.html / movements.html            # 在庫照会・入出庫履歴
├── partners.html                              # 取引先
├── css/style.css
├── js/core.js        # 状態管理・検索・受発注/配送/在庫ロジック（DOM非依存・Nodeからも利用）
├── js/layout.js      # ヘッダー・左メニュー・フッター・表/ページャー/モーダル等の共通部品
├── js/order-form.js  # 受注・発注の登録フォーム／詳細表示（共通）
├── js/i18n.js        # 多言語（?lang=en）
├── data/master.js    # マスター・サンプル取引（固定シード）
├── tools/gen-testdata.js
└── testdata/*.csv    # データドリブンテスト用の期待値
```

## 💾 データ保存（localStorage）

`erp_session`（ログイン）/ `erp_products` / `erp_sales_orders` / `erp_purchase_orders` / `erp_shipments` / `erp_movements`
引当数・発注残・現在庫は受注・発注・入出庫履歴から都度計算します。ヘルプ画面の「データを初期化する」で初期状態に戻ります。

---

## 📝 免責事項

本デモサイトは株式会社バルテスの内部デモ・テスト目的のみに使用されます。掲載されているすべての会社名・品名・メーカー・取引先・人物・金額は架空のフィクションであり、実在の企業・製品・人物とは一切関係ありません。
