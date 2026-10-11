/* CaterFlow prototip — vendor statistikasi: filtrlar, hisobotlar va har bir raqamning manbasi (drill-down) */
"use strict";
const ST_TABS = [["rev", "Daromad"], ["cost", "Tannarx"], ["exp", "Xarajatlar"], ["cust", "Mijozlar"], ["buy", "Xaridlar"]];
const ST_PERIODS = [["month", "Bu oy"], ["prev", "O‘tgan oy"], ["3m", "3 oy"], ["all", "Hammasi"], ["custom", "Boshqa davr"]];
const ST_GROUPS = { rev: [["month", "Oy"], ["week", "Hafta"], ["set", "Set"], ["src", "Manba"], ["cust", "Mijoz"]], cost: [["set", "Set"], ["dish", "Taom"], ["product", "Mahsulot"]], buy: [["product", "Mahsulot"], ["supplier", "Yetkazib beruvchi"]] };
function stState() { if (!ui.st) ui.st = { period: "3m", from: dAdd(-30), to: today(), src: "all", set: "all", tab: "rev", group: { rev: "month", cost: "set", buy: "product" } }; return ui.st; }
function stRange() {
  const s = stState(), t = today(), mks = monthKeys();
  switch (s.period) { case "month": return [mks[2] + "-01", t]; case "prev": return [mks[1] + "-01", mks[1] + "-31"]; case "3m": return [mks[0] + "-01", t]; case "all": return ["2000-01-01", "2999-12-31"]; default: return [s.from || "2000-01-01", s.to || t]; }
}
function stRangeLabel() { const s = stState(), [a, b] = stRange(); return s.period === "all" ? "butun davr" : s.period === "custom" ? `${fDateY(a)} — ${fDateY(b)}` : ST_PERIODS.find(x => x[0] === s.period)[1].toLowerCase() + ` (${fDate(a)} — ${fDate(b > today() ? today() : b)})`; }
function stSales(vid) {
  const [a, b] = stRange(), s = stState();
  return db.sales.filter(x => x.vendorId === vid && x.date >= a && x.date <= b && (s.src === "all" || (s.src === "cf" ? x.source === "CaterFlow" : x.source !== "CaterFlow")) && (s.set === "all" || x.setId === s.set)).sort((p, q) => p.date.localeCompare(q.date));
}
function saleCalc(x) { const set = SET(x.setId), rev = x.guests * x.pp, cost = setCost(set) * x.guests, comG = x.source === "CaterFlow" ? commOf(rev) : 0, bonus = saleBonus(x); return { set, rev, cost, comG, bonus, com: comG - bonus, gross: rev - cost }; }
function stExpenses(vid) { const [a, b] = stRange(); return db.expenses.filter(e => e.vendorId === vid && e.month >= a.slice(0, 7) && e.month <= b.slice(0, 7)); }
function weekStart(d) { const x = new Date(d + "T12:00"); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return localISO(x); }
const custName = id => (db.customers.find(c => c.id === id) || {}).name || "—";
function sum(list, f) { return list.reduce((a, x) => a + f(x), 0); }
function totals(list) { const c = list.map(saleCalc); return { n: list.length, guests: sum(list, x => x.guests), rev: sum(c, x => x.rev), cost: sum(c, x => x.cost), com: sum(c, x => x.com), gross: sum(c, x => x.gross) }; }
const dk = (k, key) => `data-act="drill" data-k="${k}" data-key="${esc(key || "")}"`;

/* ---------- sahifa ---------- */
function vStats(vid) {
  const s = stState(), sales = stSales(vid), T = totals(sales), exps = stExpenses(vid), expSum = sum(exps, e => e.amount), net = T.gross - T.com - expSum;
  const sets = db.sets.filter(x => x.vendorId === vid);
  const filters = `<section class="card filters"><div class="row">
      <div class="seg">${ST_PERIODS.map(([k, l]) => `<button type="button" class="${s.period === k ? "on" : ""}" data-act="st-period" data-k="${k}" aria-pressed="${s.period === k}">${l}</button>`).join("")}</div>
      ${s.period === "custom" ? `<div class="row"><label class="vh" for="st-from">Boshlanish</label><input id="st-from" type="date" value="${s.from}" data-change="st-from" style="width:auto"><span class="faint">—</span><label class="vh" for="st-to">Tugash</label><input id="st-to" type="date" value="${s.to}" data-change="st-to" style="width:auto"></div>` : ""}
      <div class="field"><label class="vh" for="st-src">Manba</label><select id="st-src" data-change="st-src" style="width:auto">${opt("all", "Barcha manbalar", s.src)}${opt("cf", "Faqat CaterFlow", s.src)}${opt("own", "Faqat o‘z mijozlarim", s.src)}</select></div>
      <div class="field"><label class="vh" for="st-set">Set</label><select id="st-set" data-change="st-set" style="width:auto">${opt("all", "Barcha setlar", s.set)}${sets.map(x => opt(x.id, x.name, s.set)).join("")}</select></div>
    </div><p class="tiny muted">Davr: ${stRangeLabel()} · ${T.n} ta tadbir. Har bir raqam ustiga bosing — u qaysi yozuvlardan yig‘ilganini ko‘rasiz.</p></section>`;
  const kp = (label, val, sub, k, key) => `<button type="button" class="card kpi kpi-link" ${dk(k, key)}><span class="eyebrow">${label}</span><span class="v">${val}</span><span class="s">${sub}</span></button>`;
  const kpis = `<div class="g g-kpi4">${kp("Daromad", mln(T.rev), `${T.n} ta tadbir · manbasi`, "sales", "all")}${kp("Oziq-ovqat tannarxi", mln(T.cost), T.rev ? `daromadning ${pct(T.cost / T.rev)}` : "—", "costs", "")}${kp("Xarajatlar + komissiya", mln(expSum + T.com), `xarajat ${mln(expSum)} · komissiya ${mln(T.com)}`, "expenses", "")}${kp("Sof foyda", mln(net), T.rev ? `marja ${pct(net / T.rev)} · qanday hisoblandi` : "qanday hisoblandi", "net", "")}
    ${kp("Yalpi foyda", mln(T.gross), T.rev ? `marja ${pct(T.gross / T.rev)}` : "—", "sales", "all")}${kp("O‘rtacha chek", T.n ? mln(T.rev / T.n) : "—", "bir tadbir uchun", "sales", "all")}${kp("Mehmonlar", num(T.guests), T.guests ? `1 kishiga ${num(T.rev / T.guests)} so‘m` : "—", "sales", "all")}${kp("CaterFlow ulushi", T.rev ? pct(sum(sales.filter(x => x.source === "CaterFlow"), x => saleRev(x)) / T.rev) : "—", "daromad manbasi", "sales", "src:CaterFlow")}</div>`;
  let body = "";
  const g = s.group[s.tab];
  const groupSeg = ST_GROUPS[s.tab] ? `<div class="row"><span class="small muted">Guruhlash:</span><div class="seg">${ST_GROUPS[s.tab].map(([k, l]) => `<button type="button" class="${g === k ? "on" : ""}" data-act="st-group" data-k="${k}" aria-pressed="${g === k}">${l}</button>`).join("")}</div></div>` : "";
  if (s.tab === "rev") body = revReport(sales, g);
  else if (s.tab === "cost") body = costReport(vid, sales, g);
  else if (s.tab === "exp") body = expReport(exps, T.com);
  else if (s.tab === "cust") body = custReport(vid, sales);
  else body = buyReport(vid, g);
  return page(head("Statistika", "Daromad, tannarx, xarajat, mijoz va xaridlar bo‘yicha hisobotlar. Har bir son manbasigacha ochiladi."), filters + kpis +
    `<section class="card"><div class="card-h"><div class="row">${tabs(ST_TABS, s.tab, "st-tab")}</div><div class="row">${groupSeg}<button type="button" class="btn btn-sm" data-act="copy-table">${ic("copy", 16)} Jadvalni nusxalash</button></div></div>${body}</section>`);
}
function revReport(sales, g) {
  const keyOf = { month: x => x.date.slice(0, 7), week: x => weekStart(x.date), set: x => x.setId, src: x => x.source, cust: x => x.customerId }[g];
  const labelOf = { month: k => mLabel(k), week: k => `${fDate(k)} haftasi`, set: k => (SET(k) || {}).name || k, src: k => k === "CaterFlow" ? "CaterFlow" : "O‘z mijozlari", cust: k => custName(k) }[g];
  const groups = {}; sales.forEach(x => { (groups[keyOf(x)] = groups[keyOf(x)] || []).push(x); });
  let rows = Object.entries(groups).map(([k, l]) => ({ k, l: labelOf(k), ...totals(l) }));
  rows.sort((a, b) => ["month", "week"].includes(g) ? a.k.localeCompare(b.k) : b.rev - a.rev);
  if (!rows.length) return empty("Tanlangan davr va filtr bo‘yicha tadbir yo‘q");
  const T = totals(sales), maxR = Math.max(...rows.map(r => r.rev));
  const chart = ["month", "week"].includes(g) && rows.length > 1 ? barChart(rows.map(r => ({ label: g === "month" ? mShort(r.k) : fDate(r.k), values: [r.rev, r.gross - r.com] })), [{ name: "Daromad", c: "--series-1" }, { name: "Yalpi foyda (komissiyadan keyin)", c: "--series-2" }], "Daromad dinamikasi") : "";
  return `${chart ? `<div class="stack" style="margin-bottom:16px">${chart}</div>` : ""}<div class="tbl"><table><thead><tr><th>${{ month: "Oy", week: "Hafta", set: "Set", src: "Manba", cust: "Mijoz" }[g]}</th><th class="r">Tadbir</th><th class="r">Mehmon</th><th class="r">Daromad</th><th>Ulush</th><th class="r">Tannarx</th><th class="r">Komissiya</th><th class="r">Yalpi foyda</th><th class="r">Marja</th></tr></thead><tbody>
    ${rows.map(r => `<tr class="click" ${dk("sales", g + ":" + r.k)}><td><strong>${esc(r.l)}</strong></td><td class="num r">${r.n}</td><td class="num r">${num(r.guests)}</td><td class="num r">${num(r.rev)}</td><td><span class="mbar"><span style="width:${r.rev / maxR * 100}%"></span></span></td><td class="num r">${num(r.cost)}</td><td class="num r">${num(r.com)}</td><td class="num r">${num(r.gross - r.com)}</td><td class="num r ${marginTone(margin(r.rev, r.cost + r.com))}-t">${pct(margin(r.rev, r.cost + r.com))}</td></tr>`).join("")}
    <tr class="total"><td>Jami</td><td class="num r">${T.n}</td><td class="num r">${num(T.guests)}</td><td class="num r">${num(T.rev)}</td><td></td><td class="num r">${num(T.cost)}</td><td class="num r">${num(T.com)}</td><td class="num r">${num(T.gross - T.com)}</td><td class="num r">${pct(margin(T.rev, T.cost + T.com))}</td></tr></tbody></table></div>`;
}
function costLines(vid, sales) {
  // har bir sotuv × taom × masalliq
  const lines = [];
  sales.forEach(x => { const s = SET(x.setId); if (!s) return; s.items.forEach(it => { const d = D(it.d); if (!d) return; d.ing.forEach(g => { const p = P(g.p); if (!p) return; const qty = (p.unit === "dona" ? g.q : g.q / 1000) * it.n * x.guests; lines.push({ sale: x, set: s, dish: d, p, qty, cost: qty * costP(p.id) }); }); }); });
  return lines;
}
function costReport(vid, sales, g) {
  const lines = costLines(vid, sales); if (!lines.length) return empty("Tanlangan davrda tadbir yo‘q");
  const keyOf = { set: l => l.set.id, dish: l => l.dish.id, product: l => l.p.id }[g];
  const groups = {}; lines.forEach(l => { (groups[keyOf(l)] = groups[keyOf(l)] || []).push(l); });
  const total = sum(lines, l => l.cost);
  const rows = Object.entries(groups).map(([k, ls]) => ({ k, ls, cost: sum(ls, l => l.cost), qty: sum(ls, l => l.qty) })).sort((a, b) => b.cost - a.cost);
  const name = r => g === "set" ? r.ls[0].set.name : g === "dish" ? r.ls[0].dish.name : r.ls[0].p.name;
  const drill = r => g === "product" ? dk("product", r.k) : dk("sales", g + ":" + r.k);
  return `<div class="tbl"><table><thead><tr><th>${{ set: "Set", dish: "Taom", product: "Mahsulot" }[g]}</th>${g === "product" ? `<th class="r">Sarf</th><th class="r">Narx (${ui.costBasis === "last" ? "oxirgi" : "o‘rtacha"})</th>` : `<th class="r">Tadbirlar</th>`}<th class="r">Tannarx</th><th>Ulush</th></tr></thead><tbody>
    ${rows.map(r => `<tr class="click" ${drill(r)}><td><strong>${esc(name(r))}</strong></td>${g === "product" ? `<td class="num r">${fmtQty(r.ls[0].p, r.qty)}</td><td class="num r">${num(costP(r.k))}<small>1 ${r.ls[0].p.unit}</small></td>` : `<td class="num r">${new Set(r.ls.map(l => l.sale.id)).size}</td>`}<td class="num r">${num(r.cost)}</td><td class="row"><span class="mbar"><span style="width:${r.cost / rows[0].cost * 100}%"></span></span><span class="tiny faint num">${pct(r.cost / total)}</span></td></tr>`).join("")}
    <tr class="total"><td>Jami</td><td></td>${g === "product" ? "<td></td>" : ""}<td class="num r">${num(total)}</td><td></td></tr></tbody></table></div><p class="tiny muted" style="margin-top:8px">Tannarx joriy ombor narxlarida (${ui.costBasis === "last" ? "oxirgi" : "o‘rtacha"} narx) hisoblangan. Narx asosini Menyu sahifasida almashtirasiz.</p>`;
}
function expReport(exps, com) {
  const rows = EXP_CATS.map(c => ({ c, ls: exps.filter(e => e.cat === c) })).filter(r => r.ls.length).map(r => ({ ...r, a: sum(r.ls, e => e.amount) }));
  rows.push({ c: "CaterFlow komissiyasi", a: com, comm: true });
  const total = sum(rows, r => r.a);
  if (!total) return empty("Bu davrda xarajat yo‘q");
  rows.sort((a, b) => b.a - a.a);
  return `<div class="tbl"><table><thead><tr><th>Turi</th><th class="r">Yozuvlar</th><th class="r">Summa</th><th>Ulush</th></tr></thead><tbody>${rows.map(r => `<tr class="click" ${r.comm ? dk("comm", "") : dk("expenses", r.c)}><td><strong>${esc(r.c)}</strong>${r.comm ? `<small>CaterFlow tadbirlaridan avtomatik</small>` : ""}</td><td class="num r">${r.comm ? "—" : r.ls.length}</td><td class="num r">${num(r.a)}</td><td class="row"><span class="mbar"><span style="width:${r.a / rows[0].a * 100}%"></span></span><span class="tiny faint num">${pct(r.a / total)}</span></td></tr>`).join("")}<tr class="total"><td>Jami</td><td></td><td class="num r">${num(total)}</td><td></td></tr></tbody></table></div><p class="tiny muted" style="margin-top:8px">Xarajatlar oy bo‘yicha kiritiladi, shuning uchun davrga tushgan oylarning xarajatlari to‘liq olinadi. Set yoki manba filtri xarajatlarga ta’sir qilmaydi.</p>`;
}
function custReport(vid, sales) {
  const groups = {}; sales.forEach(x => { (groups[x.customerId] = groups[x.customerId] || []).push(x); });
  const [a] = stRange();
  const rows = Object.entries(groups).map(([k, ls]) => { const first = db.sales.filter(x => x.customerId === k).reduce((m, x) => !m || x.date < m ? x.date : m, ""); const c = db.customers.find(x => x.id === k) || {}; return { k, name: c.name || "—", src: c.source || ls[0].source, n: ls.length, rev: totals(ls).rev, first, isNew: first >= a && !(c.oldOrders > 0) }; }).sort((x, y) => y.rev - x.rev);
  if (!rows.length) return empty("Bu davrda mijoz yo‘q");
  const nNew = rows.filter(r => r.isNew).length;
  return `<div class="chips" style="margin-bottom:12px"><span class="pill t-good">Yangi mijozlar · ${nNew}</span><span class="pill t-accent">Qaytgan mijozlar · ${rows.length - nNew}</span></div><div class="tbl"><table><thead><tr><th>Mijoz</th><th>Manba</th><th class="r">Tadbirlar</th><th class="r">Daromad</th><th>Birinchi buyurtma</th><th></th></tr></thead><tbody>${rows.map(r => `<tr class="click" ${dk("sales", "cust:" + r.k)}><td><strong>${esc(r.name)}</strong></td><td>${r.src === "CaterFlow" ? `<span class="pill t-accent">CaterFlow</span>` : `<span class="pill t-neutral">O‘zi</span>`}</td><td class="num r">${r.n}</td><td class="num r">${num(r.rev)}</td><td class="num">${fDate(r.first)}</td><td>${r.isNew ? `<span class="pill t-good">yangi</span>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
}
function buyReport(vid, g) {
  const [a, b] = stRange(), ps = db.purchases.filter(x => x.vendorId === vid && x.date >= a && x.date <= b);
  if (!ps.length) return empty("Bu davrda kirim yo‘q");
  const keyOf = g === "supplier" ? x => x.supplier : x => x.productId;
  const groups = {}; ps.forEach(x => { (groups[keyOf(x)] = groups[keyOf(x)] || []).push(x); });
  const total = sum(ps, x => x.total);
  const rows = Object.entries(groups).map(([k, ls]) => ({ k, ls, t: sum(ls, x => x.total) })).sort((x, y) => y.t - x.t);
  return `<div class="tbl"><table><thead><tr><th>${g === "supplier" ? "Yetkazib beruvchi" : "Mahsulot"}</th><th class="r">Kirimlar</th>${g === "supplier" ? `<th class="r">Mahsulotlar</th>` : `<th class="r">Miqdor</th><th class="r">O‘rtacha narx</th>`}<th class="r">Summa</th><th>Ulush</th></tr></thead><tbody>${rows.map(r => { const p = g === "supplier" ? null : P(r.k), q = sum(r.ls, x => x.qty); return `<tr class="click" ${dk("purchases", g + ":" + r.k)}><td><strong>${esc(p ? p.name : r.k)}</strong></td><td class="num r">${r.ls.length}</td>${g === "supplier" ? `<td class="num r">${new Set(r.ls.map(x => x.productId)).size}</td>` : `<td class="num r">${num(q)} ${p.unit}</td><td class="num r">${num(r.t / q)}</td>`}<td class="num r">${num(r.t)}</td><td class="row"><span class="mbar"><span style="width:${r.t / rows[0].t * 100}%"></span></span><span class="tiny faint num">${pct(r.t / total)}</span></td></tr>`; }).join("")}<tr class="total"><td>Jami</td><td class="num r">${ps.length}</td><td></td>${g === "supplier" ? "" : "<td></td>"}<td class="num r">${num(total)}</td><td></td></tr></tbody></table></div>`;
}

/* ---------- manbaga tushish (drill-down) ---------- */
function specSales(vid, key) {
  const all = stSales(vid); if (!key || key === "all") return all;
  const [g, ...rest] = key.split(":"), k = rest.join(":");
  if (g === "month") return all.filter(x => x.date.slice(0, 7) === k);
  if (g === "week") return all.filter(x => weekStart(x.date) === k);
  if (g === "set") return all.filter(x => x.setId === k);
  if (g === "src") return all.filter(x => x.source === k);
  if (g === "cust") return all.filter(x => x.customerId === k);
  if (g === "dish") return all.filter(x => (SET(x.setId) || { items: [] }).items.some(i => i.d === k));
  return all;
}
function specTitle(sp) {
  if (sp.k === "sales") { if (!sp.key || sp.key === "all") return "Barcha tadbirlar"; const [g, ...r] = sp.key.split(":"), k = r.join(":"); const f = { month: () => mLabel(k), week: () => `${fDate(k)} haftasi`, set: () => (SET(k) || {}).name, src: () => k === "CaterFlow" ? "CaterFlow tadbirlari" : "O‘z mijozlari", cust: () => custName(k), dish: () => (D(k) || {}).name }[g]; return (f && f()) || k; }
  if (sp.k === "sale") { const x = db.sales.find(s => s.id === sp.key); return x ? `${fDate(x.date)} · ${x.customer}` : "Tadbir"; }
  if (sp.k === "product") return (P(sp.key) || {}).name || "Mahsulot";
  if (sp.k === "expenses") return sp.key;
  if (sp.k === "comm") return "CaterFlow komissiyasi";
  if (sp.k === "costs") return "Oziq-ovqat tannarxi";
  if (sp.k === "purchases") { const [g, ...r] = sp.key.split(":"), k = r.join(":"); return g === "supplier" ? k : (P(k) || {}).name; }
  return "Sof foyda";
}
function salesTable(list, withCom) {
  if (!list.length) return empty("Yozuv yo‘q");
  const T = totals(list);
  return `<div class="tbl"><table><thead><tr><th>Sana</th><th>Mijoz</th><th>Manba</th><th>Set</th><th class="r">Mehmon</th><th class="r">Narx / kishi</th><th class="r">Daromad</th><th class="r">Tannarx</th>${withCom ? `<th class="r">Komissiya</th>` : ""}<th class="r">Foyda</th></tr></thead><tbody>${list.map(x => { const c = saleCalc(x); return `<tr class="click" data-act="drill-push" data-k="sale" data-key="${x.id}"><td class="num">${fDate(x.date)}</td><td>${esc(x.customer)}${x.orderId ? `<small class="mono">${x.orderId}</small>` : ""}</td><td>${x.source === "CaterFlow" ? `<span class="pill t-accent">CaterFlow</span>` : `<span class="pill t-neutral">O‘zi</span>`}</td><td>${esc(c.set ? c.set.name : "—")}</td><td class="num r">${x.guests}</td><td class="num r">${num(x.pp)}</td><td class="num r">${num(c.rev)}</td><td class="num r">${num(c.cost)}</td>${withCom ? `<td class="num r">${num(c.com)}</td>` : ""}<td class="num r">${num(c.gross - c.com)}</td></tr>`; }).join("")}<tr class="total"><td colspan="4">Jami · ${T.n} ta tadbir</td><td class="num r">${num(T.guests)}</td><td></td><td class="num r">${num(T.rev)}</td><td class="num r">${num(T.cost)}</td>${withCom ? `<td class="num r">${num(T.com)}</td>` : ""}<td class="num r">${num(T.gross - T.com)}</td></tr></tbody></table></div>`;
}
function drillBody(vid, sp) {
  const fx = (a, op, b, eq) => `<div class="fx"><span>${a}</span><span class="op">${op}</span><span>${b}</span><span class="op">=</span><strong>${eq}</strong></div>`;
  if (sp.k === "sales") { const l = specSales(vid, sp.key); return `<p class="small muted">Qatorni bosing — tadbirning daromadi va tannarxi qanday hisoblanganini ko‘rasiz.</p>${salesTable(l, true)}`; }
  if (sp.k === "costs") { const l = stSales(vid); return `<p class="small muted">Tannarx = har bir tadbirda set tannarxi (1 kishiga) × mehmonlar. Taom va mahsulot bo‘yicha taqsimot “Tannarx” hisobotida.</p>${salesTable(l, false)}`; }
  if (sp.k === "comm") { const l = stSales(vid).filter(x => x.source === "CaterFlow"); return `<p class="small muted">Komissiya = CaterFlow orqali kelgan tadbir daromadi × ${String(db.settings.commission).replace(".", ",")}%. Bonus bo‘lsa, komissiya avval bonusdan yechiladi — jadvalda bonusdan keyingi summa. O‘z mijozlaringizdan komissiya olinmaydi.</p>${salesTable(l, true)}`; }
  if (sp.k === "expenses") {
    const l = sp.key ? stExpenses(vid).filter(e => e.cat === sp.key) : stExpenses(vid);
    return `${!sp.key ? `<p class="small muted">Qo‘lda kiritilgan xarajatlar. CaterFlow komissiyasi alohida: <button type="button" class="link" data-act="drill-push" data-k="comm" data-key="">ochish</button>.</p>` : ""}${l.length ? `<div class="tbl"><table><thead><tr><th>Oy</th><th>Turi</th><th>Izoh</th><th class="r">Summa</th></tr></thead><tbody>${l.map(e => `<tr><td>${mLabel(e.month)}</td><td>${esc(e.cat)}</td><td class="small">${esc(e.note || "—")}</td><td class="num r">${num(e.amount)}</td></tr>`).join("")}<tr class="total"><td colspan="3">Jami</td><td class="num r">${num(sum(l, e => e.amount))}</td></tr></tbody></table></div>` : empty("Xarajat yo‘q")}`;
  }
  if (sp.k === "net") {
    const T = totals(stSales(vid)), ex = sum(stExpenses(vid), e => e.amount), net = T.rev - T.cost - T.com - ex;
    const L = (label, v, k, key, sign) => `<tr class="click" ${k ? `data-act="drill-push" data-k="${k}" data-key="${esc(key)}"` : ""}><td>${label}</td><td class="num r">${sign}${num(v)}</td></tr>`;
    return `<p class="small muted">Sof foyda = daromad − oziq-ovqat tannarxi − komissiya − xarajatlar. Har bir qatorni bosib manbasini oching.</p><div class="tbl"><table><tbody>${L("Daromad", T.rev, "sales", "all", "")}${L("Oziq-ovqat tannarxi", T.cost, "costs", "", "−")}${L("CaterFlow komissiyasi", T.com, "comm", "", "−")}${L("Xarajatlar", ex, "expenses", "", "−")}<tr class="total"><td>Sof foyda</td><td class="num r">${num(net)}</td></tr></tbody></table></div>`;
  }
  if (sp.k === "sale") {
    const x = db.sales.find(s => s.id === sp.key); if (!x) return empty("Topilmadi");
    const c = saleCalc(x), s = c.set;
    return `<div class="facts">${fact("Sana", fDateY(x.date))}${fact("Mijoz", esc(x.customer))}${fact("Manba", x.source === "CaterFlow" ? "CaterFlow" : "O‘z mijozi")}${fact("Set", esc(s ? s.name : "—"))}</div>
      ${fx(`${x.guests} mehmon`, "×", `${som(x.pp)}`, `${som(c.rev)} daromad`)}${fx(`${x.guests} mehmon`, "×", `${som(setCost(s))} tannarx / kishi`, `${som(c.cost)} tannarx`)}${c.comG ? fx(som(c.rev), "×", `${String(db.settings.commission).replace(".", ",")}% komissiya`, som(c.comG)) : ""}${c.bonus ? fx(som(c.comG), "−", `${som(c.bonus)} bonusdan qoplandi`, `${som(c.com)} sizdan`) : ""}
      <div class="fx total"><span>Yalpi foyda</span><span class="op">=</span><strong>${som(c.rev - c.cost - c.com)}</strong><span class="faint small">marja ${pct(margin(c.rev, c.cost + c.com))}</span></div>
      <div><span class="lbl">1 kishilik tannarx qayerdan keldi</span>${s ? s.items.map(it => { const d = D(it.d); return `<details class="dbox"><summary><span class="grow">${esc(d.name)}${it.n !== 1 ? " ×" + String(it.n).replace(".", ",") : ""}</span><span class="num">${som(dishCost(d) * it.n)}</span></summary><div class="tbl"><table><thead><tr><th>Masalliq</th><th class="r">1 porsiyaga</th><th class="r">Narx</th><th class="r">Summa</th><th>Narx manbasi</th></tr></thead><tbody>${d.ing.map(g => { const p = P(g.p), l = pList(g.p), last = l[l.length - 1]; return `<tr class="click" data-act="drill-push" data-k="product" data-key="${p.id}"><td>${esc(p.name)}</td><td class="num r">${String(g.q).replace(".", ",")} ${small(p.unit)}</td><td class="num r">${num(costP(p.id))}<small>1 ${p.unit}</small></td><td class="num r">${num(ingCost(g))}</td><td class="small">${ui.costBasis === "last" ? "oxirgi" : "o‘rtacha"} · ${l.length} ta kirim${last ? `, oxirgisi ${fDate(last.date)}, ${esc(last.supplier)}` : ""}</td></tr>`; }).join("")}</tbody></table></div></details>`; }).join("") : ""}</div>
      ${x.orderId ? `<p class="small">Buyurtma: <button type="button" class="link" data-act="drill-order" data-id="${x.orderId}">${x.orderId}</button></p>` : ""}`;
  }
  if (sp.k === "product") {
    const p = P(sp.key), l = pList(p.id), use = costLines(vid, stSales(vid)).filter(z => z.p.id === p.id);
    const pts = l.map(z => ({ v: unitP(z), label: fDate(z.date), short: fDate(z.date) }));
    return `<div class="live">${money(`1 ${p.unit} (o‘rtacha)`, som(avgP(p.id)))}${money(`1 ${p.unit} (oxirgi)`, som(lastP(p.id)))}${money("Davrdagi sarf", fmtQty(p, sum(use, z => z.qty)))}${money("Sarf qiymati", som(sum(use, z => z.cost)))}</div>${sparkline(pts)}
      <div><span class="lbl">Narx shu kirimlardan olinadi</span><div class="tbl"><table><thead><tr><th>Sana</th><th>Yetkazib beruvchi</th><th class="r">Miqdor</th><th class="r">Summa</th><th class="r">1 ${p.unit}</th></tr></thead><tbody>${[...l].reverse().map(z => `<tr><td class="num">${fDate(z.date)}</td><td>${esc(z.supplier)}${z.receipt ? ` <span class="pill t-accent">chek</span>` : ""}</td><td class="num r">${num(z.qty)} ${p.unit}</td><td class="num r">${num(z.total)}</td><td class="num r">${num(unitP(z))}</td></tr>`).join("")}<tr class="total"><td colspan="2">Vaznli o‘rtacha</td><td class="num r">${num(sum(l, z => z.qty))} ${p.unit}</td><td class="num r">${num(sum(l, z => z.total))}</td><td class="num r">${num(avgP(p.id))}</td></tr></tbody></table></div></div>
      <div><span class="lbl">Davrdagi tadbirlarda sarfi</span>${use.length ? `<div class="tbl"><table><thead><tr><th>Sana</th><th>Mijoz</th><th>Taom</th><th class="r">Sarf</th><th class="r">Qiymat</th></tr></thead><tbody>${use.map(z => `<tr class="click" data-act="drill-push" data-k="sale" data-key="${z.sale.id}"><td class="num">${fDate(z.sale.date)}</td><td>${esc(z.sale.customer)}</td><td>${esc(z.dish.name)}</td><td class="num r">${fmtQty(p, z.qty)}</td><td class="num r">${num(z.cost)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="small faint">Bu davrda ishlatilmagan</p>`}</div>`;
  }
  if (sp.k === "purchases") {
    const [g, ...r] = sp.key.split(":"), k = r.join(":"), [a, b] = stRange();
    const l = db.purchases.filter(x => x.vendorId === vid && x.date >= a && x.date <= b && (g === "supplier" ? x.supplier === k : x.productId === k)).sort((x, y) => y.date.localeCompare(x.date));
    return `<div class="tbl"><table><thead><tr><th>Sana</th><th>Mahsulot</th><th>Yetkazib beruvchi</th><th class="r">Miqdor</th><th class="r">Summa</th><th class="r">Birlik narxi</th></tr></thead><tbody>${l.map(x => { const p = P(x.productId); return `<tr class="click" data-act="drill-push" data-k="product" data-key="${p.id}"><td class="num">${fDate(x.date)}</td><td>${esc(p.name)}</td><td>${esc(x.supplier)}${x.receipt ? ` <span class="pill t-accent">chek</span>` : ""}</td><td class="num r">${num(x.qty)} ${p.unit}</td><td class="num r">${num(x.total)}</td><td class="num r">${num(unitP(x))}</td></tr>`; }).join("")}<tr class="total"><td colspan="4">Jami</td><td class="num r">${num(sum(l, x => x.total))}</td><td></td></tr></tbody></table></div>`;
  }
  return "";
}
MODALS.drill = m => {
  const vid = ui.session.role === "vendor" ? ui.session.vendorId : ui.param, sp = m.stack[m.stack.length - 1];
  const crumbs = m.stack.map((s, i) => i === m.stack.length - 1 ? `<strong>${esc(specTitle(s))}</strong>` : `<button type="button" class="link" data-act="drill-back" data-i="${i}">${esc(specTitle(s))}</button>`).join(` <span class="faint">›</span> `);
  return mHead(esc(specTitle(sp)), `Davr: ${stRangeLabel()}`) + `<div class="m-body">${m.stack.length > 1 ? `<nav class="crumbs small" aria-label="Yo‘l">${crumbs}</nav>` : ""}${drillBody(vid, sp)}</div><footer class="m-foot"><button type="button" class="btn" data-act="copy-table">${ic("copy", 16)} Jadvalni nusxalash</button><button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};
function tableTSV(t) { return [...t.querySelectorAll("tr")].map(tr => [...tr.children].map(td => td.innerText.replace(/\s+/g, " ").trim()).join("\t")).join("\n"); }
