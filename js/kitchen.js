/* CaterFlow prototip — ombor: tayyorlash rejasi, haftalik menyu, kirim-chiqim */
"use strict";
const STOCK_TABS = [["products", "Mahsulotlar"], ["plan", "Tayyorlash rejasi"], ["week", "Haftalik menyu"], ["moves", "Kirim-chiqim"]];
function vStock(vid, ro) {
  const t = STOCK_TABS.some(x => x[0] === ui.stockTab) ? ui.stockTab : "products";
  const sub = {
    products: "Har bir kirimdan 1 kg / 1 litr / 1 dona va 1 gramm narxi hisoblanadi. Menyu tannarxi shu narxlardan olinadi.",
    plan: "Taomlarni tanlang va necha kishiga tayyorlashni kiriting: qancha go‘sht, guruch va boshqa masalliq ketishi, omborda yetadimi va tayyorlash qanchaga tushishi chiqadi.",
    week: "Har kunning taomlari va taxminiy kishi soni. “Tayyorlash” tugmasi shu kun uchun hisob-kitobni ochadi.",
    moves: "Omborga kirgan va ombordan chiqqan mahsulotlar tarixi."
  }[t];
  const actions = ro ? "" : t === "products" ? `<button class="btn" data-act="waste-new">${ic("trash", 16)} Chiqindi</button><button class="btn" data-act="new-product">${ic("plus", 16)} Mahsulot</button><button class="btn btn-primary" data-act="new-purchase">${ic("plus", 16)} Kirim qo‘shish</button>` : t === "moves" ? `<button class="btn btn-primary" data-act="new-purchase">${ic("plus", 16)} Kirim qo‘shish</button>` : "";
  const body = t === "plan" ? vPlan(vid, ro) : t === "week" ? vWeek(vid, ro) : t === "moves" ? vMoves(vid) : vStockProducts(vid, ro);
  return page(ro ? "" : head("Ombor", sub, actions), tabs(STOCK_TABS, t, "stock-tab") + body);
}

/* ---------- tayyorlash rejasi ---------- */
function planFor(vid, day) {
  const wm = day ? (db.weekMenus[vid] || {})[day] : null;
  const prev = ui.plan && ui.plan.vid === vid ? ui.plan : null;
  return { vid, day, people: wm ? wm.people : (prev ? prev.people : 100), buffer: prev ? prev.buffer : 5,
    items: db.dishes.filter(x => x.vendorId === vid).map(x => ({ d: x.id, n: 1, on: wm ? wm.dishes.includes(x.id) : (prev ? !!(prev.items.find(i => i.d === x.id) || {}).on : false) })) };
}
function planCalc(pl) {
  const people = Math.max(0, pl.people || 0), buf = 1 + Math.max(0, pl.buffer || 0) / 100;
  const sel = pl.items.filter(i => i.on && i.n > 0).map(i => ({ d: D(i.d), n: i.n })).filter(x => x.d);
  const need = {};
  sel.forEach(({ d, n }) => d.ing.forEach(g => { need[g.p] = (need[g.p] || 0) + g.q * n * people * buf; }));
  const rows = Object.keys(need).map(pid => {
    const p = P(pid); if (!p) return null;
    const qty = p.unit === "dona" ? need[pid] : need[pid] / 1000, price = costP(pid), l = pList(pid);
    const short = Math.max(0, qty - p.stock);
    return { p, qty, price, cost: qty * price, short, shortCost: short * lastP(pid), supplier: l.length ? l[l.length - 1].supplier : "Yetkazib beruvchi yo‘q" };
  }).filter(Boolean).sort((a, b) => b.cost - a.cost);
  const total = rows.reduce((a, r) => a + r.cost, 0);
  return { people, buf, rows, total, pp: people ? total / people : 0, sale: sel.reduce((a, x) => a + x.d.price * x.n * people, 0),
    dishes: sel.map(x => ({ d: x.d, n: x.n, pp: dishCost(x.d) * x.n, tot: dishCost(x.d) * x.n * people * buf })), short: rows.filter(r => r.short > 0.0005) };
}
function vPlan(vid, ro) {
  if (!ui.plan || ui.plan.vid !== vid) ui.plan = planFor(vid, todayDow());
  const pl = ui.plan;
  const days = `<div class="seg">${DOW.map((n, i) => `<button type="button" class="${pl.day === i + 1 ? "on" : ""}" data-act="plan-day" data-k="${i + 1}" aria-pressed="${pl.day === i + 1}" title="${n}">${DOW_S[i]}${i + 1 === todayDow() ? " · bugun" : ""}</button>`).join("")}<button type="button" class="${!pl.day ? "on" : ""}" data-act="plan-day" data-k="0" aria-pressed="${!pl.day}">Qo‘lda tanlash</button></div>`;
  const list = pl.items.map((it, k) => { const d = D(it.d); return `<div class="plan-dish"><input type="checkbox" id="pd-${k}" name="on-${k}" ${it.on ? "checked" : ""}><label for="pd-${k}" class="grow">${esc(d.name)} <span class="tiny faint">${esc(d.portion)}</span></label><input type="number" name="n-${k}" min="0" step="0.5" value="${it.n}" class="sm" aria-label="${esc(d.name)}: 1 kishiga porsiya"><span class="num small r" data-pp="${k}">${num(dishCost(d) * it.n)}</span></div>`; }).join("");
  const ord = pl.orderId ? ORD(pl.orderId) : null;
  return `${ord ? `<div class="note info">${ic("clipboard", 16)}<span class="grow"><strong>${ord.id}</strong> buyurtmasi uchun: ${ord.guests} kishi, ${esc((SET((oQuote(ord, pl.vid) || {}).setId) || {}).name || "")} · ${fDateY(ord.date)}</span><button type="button" class="btn btn-sm" data-act="open-vorder" data-id="${ord.id}">Buyurtmaga qaytish</button></div>` : ""}<div class="row between">${days}<span class="small muted">${pl.day ? `${DOW[pl.day - 1]} menyusi yuklandi` : ord ? "Buyurtma seti yuklandi" : "Taomlarni o‘zingiz belgilang"}</span></div>
  <form data-live="plan" data-form="noop" class="g g-plan">
    <section class="card stack">
      <div class="f-grid"><div class="field"><label for="pl-people">Necha kishiga</label><input id="pl-people" name="people" type="number" min="1" step="1" value="${pl.people}"></div><div class="field"><label for="pl-buf">Zaxira / chiqindi, %</label><input id="pl-buf" name="buffer" type="number" min="0" max="50" step="1" value="${pl.buffer}"></div></div>
      <p class="tiny muted">Zaxira: go‘sht tozalash, qaynatishda kamayish va ortiqcha mehmon uchun masalliq shuncha foiz ko‘p olinadi.</p>
      <div><div class="plan-dish head"><span></span><span class="grow tiny faint">TAOM</span><span class="tiny faint">PORSIYA / KISHI</span><span class="tiny faint r">1 KISHIGA</span></div>${list}</div>
    </section>
    <section class="stack" id="plan-out">${planOut(pl, ro)}</section>
  </form>`;
}
function planOut(pl, ro) {
  const r = planCalc(pl);
  if (!r.dishes.length || !r.people) return `<div class="card">${empty("Chapdan kamida bitta taomni belgilang va kishi sonini kiriting")}</div>`;
  const shortSum = r.short.reduce((a, x) => a + x.shortCost, 0);
  const groups = {};
  (r.short.length ? r.short : r.rows).forEach(x => { (groups[x.supplier] = groups[x.supplier] || []).push(x); });
  return `<div class="live">${money("Tayyorlash tannarxi", som(r.total))}${money("1 kishiga", som(r.pp))}${money("Sotuv narxida qiymati", som(r.sale))}${money("Yetishmaydi", r.short.length ? `${r.short.length} ta · ${mln(shortSum)}` : "hammasi bor", r.short.length ? "warn" : "good")}</div>
  <section class="card"><div class="card-h"><h2>Har bir taom: 1 kishiga va jami</h2><span class="small muted num">${r.people} kishi · zaxira ${pct(r.buf - 1)}</span></div>
    <div class="tbl"><table><thead><tr><th>Taom</th><th class="r">Porsiya / kishi</th><th class="r">1 kishiga tannarx</th><th class="r">Jami tannarx</th><th class="r">Ulush</th></tr></thead><tbody>${r.dishes.map(x => `<tr><td>${esc(x.d.name)}</td><td class="num r">${String(x.n).replace(".", ",")}</td><td class="num r">${som(x.pp)}</td><td class="num r">${som(x.tot)}</td><td class="num r faint">${r.total ? pct(x.tot / r.total) : "—"}</td></tr>`).join("")}<tr class="total"><td>Jami</td><td></td><td class="num r">${som(r.pp)}</td><td class="num r">${som(r.total)}</td><td></td></tr></tbody></table></div></section>
  <section class="card"><div class="card-h"><div><h2>Kerakli masalliqlar</h2><p class="small muted">Omborda borini hisobga olib, nima yetishmasligi ko‘rsatiladi</p></div>
    <div class="row"><button type="button" class="btn btn-sm" data-act="copy-shop">${ic("copy", 16)} Xarid ro‘yxatini nusxalash</button>${!ro && r.short.length && can("stock") ? `<button type="button" class="btn btn-sm" data-act="buy-plan">${ic("plus", 16)} Yetishmaganini kirim qilish</button>` : ""}${ro ? "" : `<button type="button" class="btn btn-sm btn-primary" data-act="plan-out">Ombordan chiqim qilish</button>`}</div></div>
    <div class="tbl"><table><thead><tr><th>Mahsulot</th><th class="r">Kerak</th><th class="r">Omborda</th><th class="r">Yetishmaydi</th><th class="r">Narx</th><th class="r">Summa</th></tr></thead><tbody>${r.rows.map(x => `<tr><td>${esc(x.p.name)}</td><td class="num r"><strong>${fmtQty(x.p, x.qty)}</strong></td><td class="num r">${fmtQty(x.p, x.p.stock)}</td><td class="num r ${x.short > 0.0005 ? "warn-t" : "faint"}">${x.short > 0.0005 ? fmtQty(x.p, x.short) : "—"}</td><td class="num r">${num(x.price)}<small>1 ${x.p.unit}</small></td><td class="num r">${som(x.cost)}</td></tr>`).join("")}</tbody></table></div></section>
  <section class="card"><div class="card-h"><h2>${r.short.length ? "Xarid ro‘yxati" : "Barcha masalliqlar omborda bor"}</h2><span class="small muted">yetkazib beruvchi bo‘yicha</span></div>
    <div class="g g-2">${Object.entries(groups).map(([sup, xs]) => `<div class="stack-s"><strong class="small">${esc(sup)}</strong><ul class="dots">${xs.map(x => `<li>${esc(x.p.name)}: ${fmtQty(x.p, r.short.length ? x.short : x.qty)} <span class="faint">≈ ${som((r.short.length ? x.short : x.qty) * lastP(x.p.id))}</span></li>`).join("")}</ul></div>`).join("")}</div></section>`;
}
function shopText(pl) {
  const r = planCalc(pl), me = V(pl.vid), list = r.short.length ? r.short : r.rows, groups = {};
  list.forEach(x => { (groups[x.supplier] = groups[x.supplier] || []).push(x); });
  return `${me.name} — xarid ro‘yxati (${pl.day ? DOW[pl.day - 1] + ", " : ""}${r.people} kishi)\n` + Object.entries(groups).map(([s, xs]) => `\n${s}:\n` + xs.map(x => `- ${x.p.name}: ${fmtQty(x.p, r.short.length ? x.short : x.qty)}`).join("\n")).join("\n");
}

/* ---------- haftalik menyu ---------- */
function vWeek(vid, ro) {
  const wm = db.weekMenus[vid] || {}, all = db.dishes.filter(d => d.vendorId === vid);
  const cards = DOW.map((n, i) => {
    const day = i + 1, w = wm[day] || { dishes: [], people: 100 }, ds = w.dishes.map(D).filter(Boolean), pp = ds.reduce((a, d) => a + dishCost(d), 0);
    return `<section class="card day ${day === todayDow() ? "today" : ""}"><div class="row between"><h3>${n}</h3>${day === todayDow() ? `<span class="pill t-accent">bugun</span>` : ""}</div>
      <ul class="wk">${ds.map(d => `<li><span class="grow">${esc(d.name)}</span><span class="num faint tiny">${num(dishCost(d))}</span>${ro ? "" : `<button type="button" class="icon-btn" data-act="week-rm" data-day="${day}" data-id="${d.id}" aria-label="${esc(d.name)}ni olib tashlash">${ic("x", 14)}</button>`}</li>`).join("") || `<li class="faint small">Taom yo‘q</li>`}</ul>
      ${ro ? "" : `<select data-change="week-add" data-day="${day}" aria-label="${n}: taom qo‘shish">${opt("", "+ Taom qo‘shish")}${all.filter(d => !w.dishes.includes(d.id)).map(d => opt(d.id, d.name)).join("")}</select>`}
      <div class="row between small"><label for="wp-${day}" class="muted">Kishi soni</label><input id="wp-${day}" type="number" min="0" value="${w.people}" class="sm" ${ro ? "disabled" : ""} data-change="week-people" data-day="${day}"></div>
      <div class="minis"><span>1 kishiga: <b>${num(pp)}</b></span><span>Jami: <b>${mln(pp * w.people)}</b></span></div>
      <button type="button" class="btn btn-sm" data-act="plan-day" data-k="${day}" data-go="1">Tayyorlash hisobi</button></section>`;
  }).join("");
  const weekCost = DOW.reduce((a, _, i) => { const w = wm[i + 1]; return a + (w ? w.dishes.map(D).filter(Boolean).reduce((s, d) => s + dishCost(d), 0) * w.people : 0); }, 0);
  return `<p class="small muted">Haftalik tannarx: <strong class="num">${som(weekCost)}</strong> · ${ui.costBasis === "last" ? "oxirgi" : "o‘rtacha"} narxlarda</p><div class="week">${cards}</div>`;
}

function receiptPreview(rc) { return rc ? `<div class="row small"><img src="${rc.src}" alt="Chek" class="thumb"><span class="grow">${esc(rc.name)}</span><button type="button" class="btn btn-sm btn-ghost" data-act="receipt-rm">${ic("x", 14)} Olib tashlash</button></div>` : ""; }

/* ---------- mahsulotlar: qidiruv, filtr, kategoriya ---------- */
function needAgg(vid, days) {
  const t = today(), need = {};
  vItems(vid).filter(x => ["confirmed", "prep"].includes(x.stage) && x.o.date >= t && daysBetween(t, x.o.date) <= days).forEach(x => planCalc(orderPlan(x.o, vid)).rows.forEach(r => { need[r.p.id] = (need[r.p.id] || 0) + r.qty; }));
  return need;
}
function vStockProducts(vid, ro) {
  const ps = db.products.filter(p => p.vendorId === vid), f = ui.pf || "all", need7 = needAgg(vid, 7);
  const used = p => db.dishes.some(d => d.vendorId === vid && d.ing.some(i => i.p === p.id));
  const up = p => prevP(p.id) && lastP(p.id) > prevP(p.id) * 1.001;
  const short7 = p => (need7[p.id] || 0) > p.stock + 0.0005;
  const F = { all: () => true, low: p => p.stock < p.min, short: short7, up, unused: p => !used(p) };
  const list = ps.filter(F[f] || F.all);
  const value = ps.reduce((a, p) => a + p.stock * avgP(p.id), 0);
  const kl = (label, v, sub, k) => `<button type="button" class="card kpi kpi-link ${f === k ? "sel" : ""}" data-act="pf" data-k="${k}"><span class="eyebrow">${label}</span><span class="v">${v}</span><span class="s">${sub}</span></button>`;
  const row = p => {
    const lp = lastP(p.id), pp = prevP(p.id), ch = pp ? (lp - pp) / pp : 0, low = p.stock < p.min, n7 = need7[p.id] || 0;
    return `<tr class="click" data-act="open-product" data-id="${p.id}" data-name="${esc(p.name.toLowerCase())}"><td><strong>${esc(p.name)}</strong>${used(p) ? "" : `<small>taomlarda ishlatilmagan</small>`}${p.mid ? "" : `<small class="bad-t">master katalogga bog‘lanmagan</small>`}</td>
      <td class="num r ${low || p.stock < 0 ? "warn-t" : ""}">${fmtQty(p, p.stock)}<small>min ${p.min} ${p.unit}${reservedQty(p) ? ` · rezerv ${fmtQty(p, reservedQty(p))}` : ""}</small>${(() => { const e = expInfo(p); return e ? `<small class="${e.st === "expired" ? "bad-t" : "warn-t"}">${e.st === "expired" ? "muddati o‘tgan" : `muddati: ${e.d} kun`}</small>` : ""; })()}</td>
      <td class="num r">${n7 ? fmtQty(p, n7) : "—"}${n7 ? (short7(p) ? `<small class="bad-t">${fmtQty(p, n7 - p.stock)} yetmaydi</small>` : `<small class="good-t">yetadi</small>`) : ""}</td>
      <td class="num r">${num(lp)}<small>1 ${p.unit}${p.unit === "dona" ? "" : ` · 1 ${small(p.unit)} ${smallPrice(p, lp).toFixed(1).replace(".", ",")}`}</small></td>
      <td class="num r">${num(avgP(p.id))}</td><td class="num r ${ch > 0.001 ? "bad-t" : ch < -0.001 ? "good-t" : ""}">${pp ? (ch > 0 ? "▲ " : ch < 0 ? "▼ " : "") + pct(Math.abs(ch)) : "—"}</td>
      <td class="num r">${mln(p.stock * avgP(p.id))}</td></tr>`;
  };
  const cs = [...pcats(), ...new Set(list.map(p => p.cat).filter(c => !pcats().includes(c)))], groups = cs.map(c => [c, list.filter(p => (p.cat || "Boshqa") === c)]).filter(g => g[1].length);
  return `<div class="g g-kpi4">${kl("Ombor qiymati", mln(value), "qoldiq × o‘rtacha narx", "all")}${kl("Kam qolgan", ps.filter(F.low).length, "minimal qoldiqdan past", "low")}${kl("7 kunda yetmaydi", ps.filter(short7).length, "tasdiqlangan tadbirlar uchun", "short")}${kl("Narxi oshgan", ps.filter(up).length, "oxirgi kirimda", "up")}</div>
    <div class="row between"><div class="row"><label class="vh" for="pq">Qidirish</label><input id="pq" type="search" placeholder="Mahsulot nomi bo‘yicha qidirish" data-search="ptable" style="width:min(320px,100%)" autocomplete="off">${chips([["all", "Hammasi", ps.length], ["low", "Kam qolgan"], ["short", "7 kunda yetmaydi"], ["up", "Narxi oshgan"], ["unused", "Ishlatilmaydi"]], f, "pf")}</div>${ro ? "" : `<button type="button" class="btn btn-sm" data-act="adjust">${ic("refresh", 16)} Inventarizatsiya</button>`}</div>
    ${list.length ? `<div class="tbl"><table id="ptable"><thead><tr><th>Mahsulot</th><th class="r">Qoldiq</th><th class="r">7 kunlik ehtiyoj</th><th class="r">Oxirgi narx</th><th class="r">O‘rtacha</th><th class="r">O‘zgarish</th><th class="r">Qiymati</th></tr></thead><tbody>${groups.map(([c, ls]) => `<tr class="grp"><td colspan="7">${esc(c)} <span class="faint">· ${ls.length}</span></td></tr>${ls.map(row).join("")}`).join("")}</tbody></table></div>` : empty("Bu filtr bo‘yicha mahsulot yo‘q")}`;
}

/* ---------- kirim: bitta nakladnoyda bir nechta mahsulot ---------- */
function syncPurchase() {
  const f = $('#modal-root form[data-form="purchase"]'); if (!f || !ui.modal) return; const m = ui.modal, fd = new FormData(f);
  m.supplier = fd.get("supplier"); m.date = fd.get("date");
  m.lines = m.lines.map((l, k) => ({ p: fd.get("lp-" + k) || l.p, qty: +fd.get("lq-" + k) || 0, total: +fd.get("lt-" + k) || 0 }));
}
function purchaseLine(vid, p, qty) { qty = p.unit === "dona" ? Math.ceil(qty) : Math.ceil(qty * 2) / 2; return { p: p.id, qty, total: Math.round(lastP(p.id) * qty / 1000) * 1000 }; }
MODALS.purchase = m => {
  const vid = ui.session.vendorId, ps = db.products.filter(p => p.vendorId === vid);
  if (!ps.length) return mHead("Avval mahsulot qo‘shing", "") + `<div class="m-body"><p>Omborda hali mahsulot yo‘q. Mahsulot qo‘shing, keyin kirim va inventarizatsiya qilasiz.</p></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button><button type="button" class="btn btn-primary" data-act="new-product">Mahsulot qo‘shish</button></footer>`;
  if (!m.lines) m.lines = [purchaseLine(vid, P(m.pid || ps[0].id), m.qty || 10)];
  return mHead("Kirim qo‘shish", "Bitta nakladnoydagi barcha mahsulotlar. 1 kg / 1 l / 1 dona narxi avtomatik hisoblanadi") + `<form data-form="purchase" data-live="purchase"><div class="m-body">
    <div class="f-grid"><div class="field"><label for="pu-s">Yetkazib beruvchi</label><input id="pu-s" name="supplier" list="pu-sl" value="${esc(m.supplier || SUPPLIERS[0])}" required><datalist id="pu-sl">${SUPPLIERS.map(s => `<option value="${esc(s)}">`).join("")}</datalist></div><div class="field"><label for="pu-d">Sana</label><input id="pu-d" name="date" type="date" value="${m.date || today()}" required></div></div>
    <div class="plines"><div class="pline head"><span>Mahsulot</span><span>Miqdor</span><span>Summa, so‘m</span><span class="r">1 birlik narxi</span><span></span></div>
      ${m.lines.map((l, k) => `<div class="pline"><select name="lp-${k}" aria-label="Mahsulot ${k + 1}">${ps.map(p => opt(p.id, `${p.name} (${p.unit})`, l.p)).join("")}</select><input name="lq-${k}" type="number" min="0" step="0.1" value="${l.qty}" aria-label="Miqdor"><input name="lt-${k}" type="number" min="0" step="1000" value="${l.total}" aria-label="Summa"><span class="small r num" data-up="${k}"></span><button type="button" class="icon-btn" data-act="pl-rm" data-i="${k}" aria-label="Qatorni olib tashlash" ${m.lines.length < 2 ? "disabled" : ""}>${ic("x", 16)}</button></div>`).join("")}
      <button type="button" class="btn btn-sm" data-act="pl-add" style="align-self:flex-start">${ic("plus", 16)} Mahsulot qo‘shish</button></div>
    <div class="live" id="pu-live"></div>
    <div class="drop" data-drop="receipt"><input type="file" id="pu-file" accept="image/*" class="vh" data-change="receipt-file"><label for="pu-file" class="drop-in">${ic("upload", 22)}<span><strong>Chek yoki nakladnoy rasmini shu yerga tashlang</strong><span class="block small muted">yoki bosib fayl tanlang</span></span></label><div id="pu-rc">${receiptPreview(m.receipt)}</div></div>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Kirimni saqlash</button></footer></form>`;
};
MODALS.adjust = m => {
  const vid = ui.session.vendorId, ps = db.products.filter(p => p.vendorId === vid);
  if (!ps.length) return mHead("Avval mahsulot qo‘shing", "") + `<div class="m-body"><p>Omborda hali mahsulot yo‘q.</p></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button></footer>`;
  const p = P(m.id || ps[0].id);
  return mHead("Inventarizatsiya", "Ombordagi haqiqiy qoldiqni kiriting — farq tarixga yoziladi") + `<form data-form="adjust" data-live="adjust"><div class="m-body">
    <div class="f-grid"><div class="field"><label for="ad-p">Mahsulot</label><select id="ad-p" name="pid">${ps.map(x => opt(x.id, `${x.name} (${x.unit})`, p.id)).join("")}</select></div><div class="field"><label for="ad-q">Haqiqiy qoldiq</label><input id="ad-q" name="qty" type="number" min="0" step="0.1" value="${p.stock}" required></div><div class="field"><label for="ad-r">Sabab</label><select id="ad-r" name="reason">${["Sanoq farqi", "Buzildi / chiqindi", "Yo‘qoldi", "Boshqa"].map(x => opt(x, x)).join("")}</select></div></div>
    <div class="field"><label for="ad-n">Izoh</label><input id="ad-n" name="note" placeholder="Ixtiyoriy"></div><div class="live" id="ad-live"></div>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`;
};
MODALS.productEdit = m => { const p = P(m.id); return mHead(`${esc(p.name)}: tahrirlash`, p.mid ? `Master: ${esc((MST(p.mid) || {}).name || "")}` : "Master katalogga bog‘lanmagan") + `<form data-form="product-edit" data-id="${p.id}"><div class="m-body"><div class="f-grid"><div class="field"><label for="pe-n">Nomi (sizdagi ko‘rinishi)</label><input id="pe-n" name="name" value="${esc(p.name)}" required></div><div class="field"><label for="pe-c">Kategoriya</label><select id="pe-c" name="cat">${pcats().map(c => opt(c, c, p.cat)).join("")}</select></div><div class="field"><label for="pe-m">Minimal qoldiq, ${p.unit}</label><input id="pe-m" name="min" type="number" min="0" step="0.5" value="${p.min}"></div></div></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`; };
function supplierCompare(p) {
  const g = {}; pList(p.id).forEach(x => { (g[x.supplier] = g[x.supplier] || []).push(x); });
  const rows = Object.entries(g).map(([s, l]) => ({ s, n: l.length, avg: l.reduce((a, x) => a + x.total, 0) / l.reduce((a, x) => a + x.qty, 0), last: l[l.length - 1].date })).sort((a, b) => a.avg - b.avg);
  if (rows.length < 1) return "";
  return `<div><span class="lbl">Yetkazib beruvchilar bo‘yicha narx</span><div class="tbl"><table><thead><tr><th>Yetkazib beruvchi</th><th class="r">Kirimlar</th><th class="r">O‘rtacha 1 ${p.unit}</th><th>Oxirgi</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${esc(r.s)}${i === 0 && rows.length > 1 ? ` <span class="pill t-good">eng arzon</span>` : ""}</td><td class="num r">${r.n}</td><td class="num r">${num(r.avg)}${i > 0 ? `<small class="bad-t">+${pct((r.avg - rows[0].avg) / rows[0].avg)}</small>` : ""}</td><td class="num">${fDate(r.last)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
function vMoves(vid) {
  const typeL = { kirim: ["Kirim", "good"], chiqim: ["Tayyorlash", "saffron"], kitchen: ["Oshxonaga", "saffron"], order: ["Tadbir", "saffron"], adjust: ["Tuzatish", "info"] };
  const rows = [
    ...db.purchases.filter(x => x.vendorId === vid).map(x => ({ date: x.date, t: "kirim", p: P(x.productId), qty: x.qty, sum: x.total, note: x.supplier, receipt: !!x.receipt })),
    ...db.moves.filter(m => m.vendorId === vid).map(m => ({ date: m.date, t: m.type || (/^(CF|OZ)-/.test(m.note || "") ? "order" : "chiqim"), p: P(m.productId), qty: m.type === "adjust" ? m.qty : -m.qty, sum: Math.abs(m.qty) * avgP(m.productId), note: m.note }))
  ].filter(x => x.p).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
  const f = ui.mvF || "all", list = rows.filter(x => f === "all" || (f === "in" ? x.qty > 0 : x.qty < 0));
  return chips([["all", "Hammasi", rows.length], ["in", "Kirim", rows.filter(x => x.qty > 0).length], ["out", "Chiqim", rows.filter(x => x.qty < 0).length]], f, "mv-f") + `<div class="tbl"><table><thead><tr><th>Sana</th><th>Turi</th><th>Mahsulot</th><th class="r">Miqdor</th><th class="r">Summa</th><th>Izoh</th></tr></thead><tbody>${list.map(x => `<tr><td class="num">${fDate(x.date)}</td><td>${pill(typeL, x.t)}</td><td>${esc(x.p.name)}</td><td class="num r ${x.qty > 0 ? "good-t" : ""}">${x.qty > 0 ? "+" : "−"}${fmtQty(x.p, Math.abs(x.qty))}</td><td class="num r">${num(x.sum)}</td><td class="small">${esc(x.note || "")}${x.receipt ? ` <span class="pill t-accent">chek</span>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
}
