/* CaterFlow prototip — oshpaz: kunlik reja va texkartalar; omborchi: ombor holati */
"use strict";
const dowOf = date => ((new Date(date + "T12:00").getDay() + 6) % 7) + 1;

/* ---------- kunlik ishlab chiqarish ---------- */
function kitchenDay(vid, date, buffer = 5) {
  const off = (ui.kOff || {})[date] || {};
  const sources = vItems(vid).filter(x => ["confirmed", "prep", "done"].includes(x.stage) && x.o.date === date).map(x => { const q = oQuote(x.o, vid), s = q ? SET(q.setId) : null; return { key: x.o.id, label: `${x.o.id} · ${x.o.eventType}`, sub: `${s ? s.name : ""}${x.o.venue ? " · " + x.o.venue : ""}`, people: x.o.guests, items: s ? s.items : [], free: isSimple(s) ? s.lines.filter(l => !l.d) : [], kind: "event", stage: x.stage }; });
  const wm = (db.weekMenus[vid] || {})[dowOf(date)];
  if (wm && wm.people && wm.dishes.length) sources.push({ key: "menu", label: `Kunlik menyu · ${DOW[dowOf(date) - 1]}`, sub: "haftalik menyudan", people: wm.people, items: wm.dishes.map(d => ({ d, n: 1 })), kind: "menu" });
  const active = sources.filter(s => !off[s.key]), buf = 1 + buffer / 100, dishes = {}, need = {};
  active.forEach(s => s.items.forEach(it => { const d = D(it.d); if (!d) return; const por = s.people * it.n; (dishes[d.id] = dishes[d.id] || { d, por: 0, from: [] }); dishes[d.id].por += por; dishes[d.id].from.push({ label: s.key === "menu" ? "Kunlik" : s.key, por }); d.ing.forEach(g => { need[g.p] = (need[g.p] || 0) + g.q * por * buf; }); }));
  const free = {}; active.forEach(s => (s.free || []).forEach(l => { const k = normName(l.name); (free[k] = free[k] || { name: l.name, qty: l.qty, por: 0, from: [] }); free[k].por += s.people; free[k].from.push(s.key); }));
  const rows = Object.keys(need).map(pid => { const p = P(pid), qty = p.unit === "dona" ? need[pid] : need[pid] / 1000, l = pList(pid); return { p, qty, short: Math.max(0, qty - p.stock), cost: qty * costP(pid), supplier: l.length ? l[l.length - 1].supplier : "—" }; }).sort((a, b) => a.p.name.localeCompare(b.p.name));
  return { date, sources, active, people: active.reduce((a, s) => a + s.people, 0), dishes: Object.values(dishes).sort((a, b) => b.por - a.por), free: Object.values(free), rows, buf, total: rows.reduce((a, r) => a + r.cost, 0) };
}
function vKitchen(vid) {
  const date = ui.kDate || today(), k = kitchenDay(vid, date, ui.kBuf ?? 5), done = db.kdone || {}, key = d => `${vid}|${date}|${d}`;
  const nDone = k.dishes.filter(x => done[key(x.d.id)]).length, short = k.rows.filter(r => r.short > 0.0005);
  const dayBtns = [0, 1, 2].map(i => { const d = dAdd(i); return `<button type="button" class="${date === d ? "on" : ""}" data-act="k-date" data-k="${d}" aria-pressed="${date === d}">${["Bugun", "Ertaga", "Indinga"][i]} · ${fDate(d)}</button>`; }).join("");
  const srcList = k.sources.map(s => `<label class="ksrc ${(ui.kOff || {})[date] && ui.kOff[date][s.key] ? "off" : ""}"><input type="checkbox" ${(ui.kOff || {})[date] && ui.kOff[date][s.key] ? "" : "checked"} data-change="k-src" data-k="${s.key}"><span class="grow"><strong>${esc(s.label)}</strong><span class="block small muted">${esc(s.sub)}</span></span><span class="kp num">${s.people}<span class="tiny faint"> kishi</span></span></label>`).join("");
  const dishCards = k.dishes.map(x => { const isD = !!done[key(x.d.id)]; return `<article class="kdish ${isD ? "done" : ""}"><div class="row between"><label class="check"><input type="checkbox" ${isD ? "checked" : ""} data-change="k-done" data-k="${x.d.id}"> <strong>${esc(x.d.name)}</strong></label><span class="kp num">${num(x.por)}<span class="tiny faint"> porsiya</span></span></div>
    <p class="tiny muted">${x.from.map(f => `${esc(f.label)}: ${num(f.por)}`).join(" · ")} · 1 porsiya ${esc(x.d.portion)}</p>
    <ul class="ing">${x.d.ing.map(g => { const p = P(g.p), q = (p.unit === "dona" ? g.q : g.q / 1000) * x.por * k.buf; return `<li><span>${esc(p.name)}</span><strong class="num">${fmtQty(p, q)}</strong></li>`; }).join("")}</ul></article>`; }).join("");
  return page(head("Oshxona", "Kunlik ish rejasi: necha kishiga, qaysi taom va qancha masalliq. Texkartalar bo‘yicha avtomatik hisoblanadi.", `<button class="btn" data-act="waste-new">${ic("trash", 16)} Chiqindi</button><button class="btn" data-act="k-print-ask">${ic("send", 16)} Omborchiga so‘rov</button>`),
    `<div class="row between"><div class="seg">${dayBtns}</div><div class="row"><label class="small muted" for="k-d">Boshqa kun</label><input id="k-d" type="date" value="${date}" data-change="k-date-in" style="width:auto"><label class="small muted" for="k-b">Zaxira %</label><input id="k-b" type="number" min="0" max="30" value="${ui.kBuf ?? 5}" data-change="k-buf" class="sm" style="width:70px"></div></div>
    <div class="g g-kpi4">${kpi("Jami kishi", num(k.people), `${k.active.length} ta manba`)}${kpi("Taomlar", k.dishes.length, `${nDone} tasi tayyor`)}${kpi("Masalliq turlari", k.rows.length, short.length ? `${short.length} tasi omborda yetmaydi` : "hammasi omborda bor")}${seesMoney() ? kpi("Tannarx", mln(k.total), k.people ? `1 kishiga ${num(k.total / k.people)} so‘m` : "") : kpi("Tayyorlik", k.dishes.length ? pct(nDone / k.dishes.length) : "—", "belgilangan taomlar")}</div>
    ${k.sources.length ? "" : `<div class="note">${ic("alert", 16)}<span>${fDateY(date)} uchun tadbir ham, haftalik menyu ham yo‘q.</span></div>`}
    <div class="g g-21"><section class="stack"><div class="card-h" style="margin:0"><h2>Nima pishiriladi</h2>${k.dishes.length ? `<div class="prog grow" style="max-width:220px"><span style="width:${nDone / k.dishes.length * 100}%"></span></div>` : ""}</div>${dishCards ? `<div class="kdishes">${dishCards}</div>` : k.free.length ? "" : empty("Taom yo‘q")}${k.free.length ? `<section class="card"><div class="card-h"><h2>Texkartasiz taomlar</h2><span class="small muted">masalliq hisobga kirmagan</span></div><ul class="ing">${k.free.map(f => `<li><span>${esc(f.name)}${f.qty ? ` <span class="faint">${esc(f.qty)}</span>` : ""}<span class="block tiny faint">${f.from.map(esc).join(", ")}</span></span><strong class="num">${num(f.por)} porsiya</strong></li>`).join("")}</ul><p class="tiny muted" style="margin-top:8px">Oddiy menyudan keldi. Menejer bu taomlarni texkartaga bog‘lasa, masalliqlar avtomatik hisoblanadi.</p></section>` : ""}</section>
      <div class="stack"><section class="card"><div class="card-h"><h2>Kim uchun</h2><span class="small muted">belgini olib tashlasangiz hisobdan chiqadi</span></div><div class="stack-s">${srcList || `<p class="small faint">Manba yo‘q</p>`}</div></section>
      <section class="card"><div class="card-h"><h2>Jami masalliq</h2><span class="small muted">zaxira ${ui.kBuf ?? 5}%</span></div>${k.rows.length ? `<ul class="ing big">${k.rows.map(r => `<li><span>${esc(r.p.name)}</span><span class="num"><strong>${fmtQty(r.p, r.qty)}</strong>${r.short > 0.0005 ? ` <span class="pill t-bad">${fmtQty(r.p, r.short)} yetmaydi</span>` : ` <span class="pill t-good">bor</span>`}</span></li>`).join("")}</ul>` : `<p class="small faint">—</p>`}</section></div></div>`);
}

/* ---------- texkartalar: yaratish, versiyalar, oylik tekshiruv ---------- */
const RECIPE_REVIEW_DAYS = 30;
const lastVer = d => (d.versions || [])[(d.versions || []).length - 1] || null;
const reviewAge = d => d.reviewedAt ? daysBetween(d.reviewedAt, today()) : 999;
const needsReview = d => reviewAge(d) > RECIPE_REVIEW_DAYS;
function costDrift(d) { const v = lastVer(d); return v && v.cost ? (dishCost(d) - v.cost) / v.cost : 0; }
const drifted = d => Math.abs(costDrift(d)) > 0.03;
function ensureMonthlyReview(vid) {
  const mk = monthKeys()[2], key = `review-${mk}`; if (db.tasks.some(t => t.vendorId === vid && t.key === key)) return;
  const owner = staffOf(vid).find(s => s.role === "owner"); if (!owner) return;
  const due = db.dishes.filter(d => d.vendorId === vid && needsReview(d)).length;
  const t = { id: uid("t"), key, vendorId: vid, title: `${mLabel(mk)}: texkartalarni oylik tekshirish`, note: `Har oy texkartalarni ko‘rib chiqing: gramm, porsiya va masalliq narxlari o‘zgargan bo‘lishi mumkin.${due ? ` Hozir ${due} ta texkarta ${RECIPE_REVIEW_DAYS} kundan beri yangilanmagan.` : ""}`, to: owner.id, by: "system", due: dAdd(5), prio: "muhim", status: "yangi", link: { view: "recipes" }, at: Date.now(), comments: [] };
  db.tasks.unshift(t); notify(vid, `Oylik vazifa: ${t.title}`, { view: "recipes" }, { to: owner.id });
}
function vRecipes(vid) {
  const all = db.dishes.filter(d => d.vendorId === vid), n = ui.rPor || 100, edit = ["owner", "manager"].includes(myRole()), money = myRole() !== "cook";
  const f = ui.rF || "all", mk = monthKeys()[2];
  const list = all.filter(d => f === "all" || (f === "due" ? needsReview(d) : drifted(d)));
  const done = all.filter(d => d.reviewedAt && d.reviewedAt.startsWith(mk)).length, dueN = all.filter(needsReview).length;
  const card = d => { const v = lastVer(d), dr = costDrift(d), age = reviewAge(d);
    return `<article class="kdish ${needsReview(d) ? "due" : ""}"><div class="row between"><strong>${esc(d.name)}</strong><span class="pill t-neutral">${esc(d.cat)}</span></div>
      <p class="tiny muted">1 porsiya: ${esc(d.portion)} · ${(d.versions || []).length} ta versiya</p>
      <div class="row">${needsReview(d) ? `<span class="pill t-saffron">Yangilash kerak · ${age >= 999 ? "hech tekshirilmagan" : age + " kun"}</span>` : `<span class="pill t-good">Tekshirilgan · ${fDate(d.reviewedAt)}</span>`}${money && v && drifted(d) ? `<span class="pill t-${dr > 0 ? "bad" : "good"}">Tannarx ${dr > 0 ? "+" : "−"}${pct(Math.abs(dr))}</span>` : ""}</div>
      <table class="mini"><thead><tr><th>Masalliq</th><th class="r">1 porsiya</th><th class="r">${num(n)} porsiya</th></tr></thead><tbody>${d.ing.map(g => { const p = P(g.p); return `<tr><td>${esc(p.name)}</td><td class="num r">${String(g.q).replace(".", ",")} ${small(p.unit)}</td><td class="num r"><strong>${fmtQty(p, (p.unit === "dona" ? g.q : g.q / 1000) * n)}</strong></td></tr>`; }).join("")}</tbody></table>
      ${money ? `<p class="small muted">1 porsiya tannarxi: <strong class="num">${som(dishCost(d))}</strong>${v && v.cost ? ` · oxirgi tekshiruvda ${som(v.cost)}` : ""}</p>` : ""}
      <div class="row">${edit ? `<button type="button" class="btn btn-sm" data-act="edit-dish" data-id="${d.id}">Tahrirlash</button>${needsReview(d) || drifted(d) ? `<button type="button" class="btn btn-sm btn-primary" data-act="recipe-ok" data-id="${d.id}">${ic("check", 14)} O‘zgarishsiz tasdiqlash</button>` : ""}` : `<button type="button" class="btn btn-sm" data-act="recipe-suggest" data-id="${d.id}">O‘zgartirish taklifi</button>`}<button type="button" class="btn btn-sm btn-ghost" data-act="recipe-hist" data-id="${d.id}">Tarix</button></div></article>`; };
  return page(head("Texkartalar", edit ? "Taomning 1 porsiyasi uchun masalliqlar. Yangi texkarta yarating va har oy tekshirib turing — tannarx va ombor hisobi shundan olinadi." : "Har bir taomning 1 porsiyasi va kerakli porsiyaga hisoblangan masalliqlar.", edit ? `<button class="btn btn-primary" data-act="new-dish">${ic("plus", 16)} Yangi texkarta</button>` : ""),
    `<section class="card"><div class="card-h"><div><h2>${mLabel(mk)}: oylik tekshiruv</h2><p class="small muted">Har ${RECIPE_REVIEW_DAYS} kunda texkartani ko‘rib chiqing: gramm, porsiya va masalliq o‘zgargan bo‘lsa tahrirlang, o‘zgarmagan bo‘lsa “O‘zgarishsiz tasdiqlash”ni bosing. Har saqlash yangi versiya bo‘lib yoziladi.</p></div><span class="small muted num">${done} / ${all.length}</span></div><div class="prog"><span style="width:${all.length ? done / all.length * 100 : 0}%"></span></div>${dueN ? `<p class="small" style="margin-top:8px"><span class="warn-t">${dueN} ta texkarta ${RECIPE_REVIEW_DAYS} kundan beri yangilanmagan.</span> ${f !== "due" ? `<button type="button" class="link" data-act="r-f" data-k="due">Ko‘rsatish</button>` : ""}</p>` : `<p class="small good-t" style="margin-top:8px">${ic("check", 14)} Hamma texkarta yangilangan.</p>`}</section>
    <div class="row between">${chips([["all", "Hammasi", all.length], ["due", "Yangilash kerak", dueN], ...(money ? [["drift", "Tannarxi o‘zgargan", all.filter(drifted).length]] : [])], f, "r-f")}<div class="row"><label class="small muted" for="r-por">Necha porsiyaga hisoblash</label><input id="r-por" type="number" min="1" value="${n}" data-change="r-por" class="sm" style="width:100px"></div></div>
    ${list.length ? `<div class="kdishes">${list.map(card).join("")}</div>` : empty("Bu filtr bo‘yicha texkarta yo‘q")}`);
}
function ingDiff(prev, cur) {
  const a = {}, b = {}, out = []; (prev || []).forEach(i => { a[i.p] = i.q; }); (cur || []).forEach(i => { b[i.p] = i.q; });
  Object.keys(b).forEach(pid => { const p = P(pid); if (!p) return; if (a[pid] == null) out.push(`+ ${p.name} ${String(b[pid]).replace(".", ",")} ${small(p.unit)}`); else if (a[pid] !== b[pid]) out.push(`${p.name}: ${String(a[pid]).replace(".", ",")} → ${String(b[pid]).replace(".", ",")} ${small(p.unit)}`); });
  Object.keys(a).forEach(pid => { const p = P(pid); if (p && b[pid] == null) out.push(`− ${p.name}`); });
  return out;
}
MODALS.recipeHist = m => {
  const d = D(m.id), vs = d.versions || [], money = myRole() !== "cook";
  return mHead(`${esc(d.name)}: versiyalar`, `${vs.length} ta versiya · oxirgi tekshiruv ${d.reviewedAt ? fDateY(d.reviewedAt) : "—"}`) + `<div class="m-body">${vs.length ? `<ol class="tl">${[...vs].map((v, i) => ({ v, i })).reverse().map(({ v, i }) => { const diff = i ? ingDiff(vs[i - 1].ing, v.ing) : []; return `<li><span class="tl-t tiny faint">${fDT(v.at)}</span><span><strong>v${i + 1} · ${esc(v.note)}</strong> <span class="tiny muted">${esc(byName(v.by))}</span>${money && v.cost ? `<span class="block small muted">1 porsiya tannarxi ${som(v.cost)}${i && vs[i - 1].cost ? ` (${v.cost >= vs[i - 1].cost ? "+" : "−"}${pct(Math.abs(v.cost - vs[i - 1].cost) / vs[i - 1].cost)})` : ""}</span>` : ""}${diff.length ? `<span class="block small">${diff.map(esc).join("<br>")}</span>` : ""}</span></li>`; }).join("")}</ol>` : empty("Tarix yo‘q")}</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};

/* ---------- omborchi: ombor holati ---------- */
function vStoreDash(vid) {
  const m = me(), t = today(), low = db.products.filter(p => p.vendorId === vid && p.stock < p.min), sh = shortAgg(vid, 3);
  const kt = kitchenDay(vid, t), issued = db.moves.some(x => x.vendorId === vid && x.date === t && x.type === "kitchen");
  const my = db.tasks.filter(x => x.to === m.id && x.status !== "bajarildi").sort((a, b) => (a.due || "9").localeCompare(b.due || "9"));
  const groups = {}; sh.rows.forEach(x => { (groups[x.supplier] = groups[x.supplier] || []).push(x); });
  const value = db.products.filter(p => p.vendorId === vid).reduce((a, p) => a + p.stock * avgP(p.id), 0);
  return page(head(`Salom, ${esc(firstName(m.name))}`, `${esc(V(vid).name)} · omborchi · ${fDateY(t)}`),
    `<div class="g g-kpi4">${kpi("Ochiq vazifalar", my.length, my[0] ? `eng yaqini: ${my[0].due ? fDate(my[0].due) : "—"}` : "hammasi bajarilgan")}${kpi("3 kunda yetishmaydi", sh.rows.length, `${sh.orders} ta tadbir uchun`)}${kpi("Kam qolgan", low.length, "minimal qoldiqdan past")}${kpi("Ombor qiymati", mln(value), "o‘rtacha narxda")}</div>
    <div class="g g-2"><section class="card"><div class="card-h"><h2>Mening vazifalarim</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="tasks">Hammasi</button></div>${my.length ? `<div class="stack-s">${my.slice(0, 4).map(taskCard).join("")}</div>` : `<p class="small faint">Ochiq vazifa yo‘q</p>`}</section>
      <section class="card"><div class="card-h"><div><h2>Bugun oshxonaga beriladi</h2><p class="small muted">${kt.people} kishi · ${kt.dishes.length} ta taom</p></div>${kt.rows.length ? (issued ? `<span class="pill t-good">Berildi</span>` : `<button class="btn btn-sm btn-primary" data-act="k-issue">Chiqim qilish</button>`) : ""}</div>${kt.rows.length ? `<ul class="ing">${kt.rows.map(r => `<li><span>${esc(r.p.name)}</span><span class="num"><strong>${fmtQty(r.p, r.qty)}</strong>${r.short > 0.0005 ? ` <span class="pill t-bad">${fmtQty(r.p, r.short)} yetmaydi</span>` : ""}</span></li>`).join("")}</ul>` : `<p class="small faint">Bugun oshxonada ish yo‘q</p>`}</section></div>
    <section class="card"><div class="card-h"><div><h2>Xarid ro‘yxati</h2><p class="small muted">Yaqin 3 kundagi tadbirlar uchun, omborda borini ayirib</p></div>${sh.rows.length ? `<button class="btn btn-sm btn-primary" data-act="buy-all">${ic("plus", 16)} Hammasini kirim qilish</button>` : ""}</div>${sh.rows.length ? `<div class="g g-2">${Object.entries(groups).map(([s, xs]) => `<div class="stack-s"><strong class="small">${esc(s)}</strong><ul class="ing">${xs.map(x => `<li><span>${esc(x.p.name)}</span><span class="num"><strong>${fmtQty(x.p, x.short)}</strong> <span class="faint small">≈ ${som(x.short * lastP(x.p.id))}</span></span></li>`).join("")}</ul></div>`).join("")}</div>` : empty("Hamma masalliq yetarli")}</section>
    <section class="card"><div class="card-h"><h2>Kam qolgan mahsulotlar</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="stock">Omborga</button></div>${low.length ? `<ul class="ing">${low.map(p => `<li><span>${esc(p.name)}</span><span class="num warn-t">${fmtQty(p, p.stock)} <span class="faint">/ min ${p.min} ${p.unit}</span></span></li>`).join("")}</ul>` : `<p class="small faint">Hamma mahsulot yetarli</p>`}</section>`);
}
