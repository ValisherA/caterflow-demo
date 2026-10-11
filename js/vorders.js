/* CaterFlow prototip — vendor: yagona buyurtmalar oqimi, buyurtma sahifasi, bugungi vazifalar, bildirishnomalar */
"use strict";
const VSTAGES = [["new", "Javob kutmoqda"], ["quoted", "Taklif berildi"], ["confirmed", "Tasdiqlangan"], ["prep", "Tayyorlanmoqda"], ["done", "Yakunlangan"], ["closed", "Rad / yopilgan"]];
const CHECK_ITEMS = ["Menyu mijoz bilan tasdiqlandi", "Avans to‘lovi olindi", "Masalliqlar xarid qilindi", "Oshpaz va ofitsiantlar belgilandi", "Transport va idish-tovoq tayyor"];

/* ---------- holat va yordamchilar ---------- */
function stageOf(o, r, vid) {
  if (o.own) return o.status === "yakunlandi" ? "done" : o.status === "bajarilmoqda" ? "prep" : o.status === "bekor" ? "closed" : "confirmed";
  if (!r || r.status === "avto" || r.status === "rad") return "closed";
  if (o.status === "bekor") return "closed";
  if (r.status === "kutilmoqda") return "new";
  if (o.vendorId === vid) return o.status === "yakunlandi" ? "done" : o.status === "bajarilmoqda" ? "prep" : "confirmed";
  return o.vendorId ? "closed" : "quoted";
}
function vItems(vid) {
  const out = [];
  db.orders.forEach(o => { const r = o.requests.find(x => x.vendorId === vid); if (r) out.push({ o, r, own: false, stage: stageOf(o, r, vid) }); });
  db.ownOrders.filter(o => o.vendorId === vid).forEach(o => out.push({ o, r: null, own: true, stage: stageOf(o, null, vid) }));
  return out;
}
function oQuote(o, vid) { if (o.own) return o.quote; const r = o.requests.find(x => x.vendorId === vid); return r ? r.quote : null; }
function dueInfo(date) {
  const d = daysBetween(today(), date);
  if (d === 0) return { d, label: "Bugun", tone: "bad" };
  if (d === 1) return { d, label: "Ertaga", tone: "saffron" };
  if (d < 0) return { d, label: `${-d} kun o‘tdi`, tone: "neutral" };
  return { d, label: `${d} kun qoldi`, tone: d <= 7 ? "saffron" : "neutral" };
}
const duePill = date => { const x = dueInfo(date); return `<span class="pill t-${x.tone}">${x.label}</span>`; };
const srcBadge = o => o.own ? `<span class="pill t-neutral">O‘z mijozi</span>` : `<span class="pill t-accent">CaterFlow</span>`;
const isLate = r => r && r.status === "kutilmoqda" && Date.now() - r.sentAt > 24 * 36e5;
const checkDone = o => CHECK_ITEMS.filter((_, i) => (o.vcheck || {})[i]).length;
function closedText(o, r, vid) {
  if (o.own) return "Bekor qilingan";
  if (r.status === "avto") return `Avtomatik rad: ${r.reason}`;
  if (r.status === "rad") return `Siz rad etdingiz: ${r.reason}`;
  if (o.status === "bekor") return "Buyurtma bekor qilindi";
  return "Mijoz boshqa taklifni tanladi";
}
function orderPlan(o, vid) {
  const q = oQuote(o, vid), s = q ? SET(q.setId) : null;
  return { vid, day: 0, orderId: o.id, people: o.guests, buffer: 5, items: db.dishes.filter(d => d.vendorId === vid).map(d => { const it = s ? s.items.find(i => i.d === d.id) : null; return { d: d.id, n: it ? it.n : 1, on: !!it }; }) };
}
function notify(vid, text, link, o = {}) { db.notifs.unshift({ id: uid("n"), vendorId: vid, at: Date.now(), text, link: link || null, read: false, to: o.to || null, roles: o.roles || (o.to ? null : ["owner", "manager"]) }); if (db.notifs.length > 300) db.notifs.length = 300; }
function visibleN(n) { const m = me(); if (!m || n.vendorId !== m.vendorId) return false; return n.to ? n.to === m.id : (n.roles || ["owner", "manager"]).includes(m.role); }
const unread = () => db.notifs.filter(n => visibleN(n) && !n.read).length;

/* ---------- Buyurtmalar ro‘yxati ---------- */
function vOrdersV(vid) {
  const all = vItems(vid), cnt = k => all.filter(x => x.stage === k).length;
  const st = VSTAGES.some(x => x[0] === ui.vstage) ? ui.vstage : (cnt("new") ? "new" : "confirmed");
  const sorters = { new: (a, b) => a.r.sentAt - b.r.sentAt, quoted: (a, b) => b.r.quote.at - a.r.quote.at, confirmed: (a, b) => a.o.date.localeCompare(b.o.date), prep: (a, b) => a.o.date.localeCompare(b.o.date), done: (a, b) => b.o.date.localeCompare(a.o.date), closed: (a, b) => b.o.date.localeCompare(a.o.date) };
  const list = all.filter(x => x.stage === st).sort(sorters[st]);
  const hint = { new: "CaterFlow yuborgan so‘rovlar. 24 soat ichida javob bering — kechiksangiz mijoz boshqa vendorni tanlashi mumkin.", quoted: "Taklifingiz admin yoki mijozda. Admin mijozga yubormaguncha taklifni tahrirlash mumkin.", confirmed: "Mijoz sizni tanlagan tadbirlar. Tadbirga yaqin “Tayyorlashni boshlash” tugmasini bosing.", prep: "Tayyorlanayotgan tadbirlar. Tadbir kunidan keyin yakunlang — sotuv moliyaga yoziladi.", done: "Yakunlangan tadbirlar va ularning foydasi.", closed: "Rad etilgan, tanlanmagan yoki bekor qilingan buyurtmalar." }[st];
  return page(head("Buyurtmalar", "Har bir buyurtma bitta joyda: so‘rov → taklif → tasdiq → tayyorlash → yakun.", `<button class="btn btn-primary" data-act="new-own-order">${ic("plus", 16)} O‘z buyurtmamni qo‘shish</button>`),
    `<div class="stages" role="tablist">${VSTAGES.map(([k, l]) => `<button type="button" role="tab" class="stage ${st === k ? "on" : ""} ${k === "new" && cnt(k) ? "hot" : ""}" aria-selected="${st === k}" data-act="vstage" data-k="${k}"><span class="n num">${cnt(k)}</span><span>${l}</span></button>`).join("")}</div>
    <p class="small muted">${hint}</p>
    ${list.length ? `<div class="ocards">${list.map(x => oCard(x, vid)).join("")}</div>` : empty(st === "new" ? "Yangi so‘rov yo‘q. Admin yuborishi bilan shu yerda paydo bo‘ladi va sizga bildirishnoma keladi." : "Bu bosqichda buyurtma yo‘q")}`);
}
function oCard(x, vid) {
  const { o, r, stage } = x, q = oQuote(o, vid);
  let line = "", btn = "";
  if (stage === "new") { line = `So‘rov ${ago(r.sentAt)} keldi${isLate(r) ? ` · <span class="bad-t">javob kechikmoqda</span>` : ""}`; btn = `<button type="button" class="btn btn-sm btn-primary" data-act="quote" data-id="${o.id}">Taklif berish</button>`; }
  else if (stage === "quoted") { line = `${som(q.pp)} / kishi · ${r.toCustomer ? "mijoz tanlovini kutyapmiz" : "admin ko‘rib chiqmoqda"}`; btn = r.toCustomer ? "" : `<button type="button" class="btn btn-sm" data-act="quote" data-id="${o.id}">Tahrirlash</button>`; }
  else if (stage === "confirmed") { line = `Tayyorgarlik ${checkDone(o)} / ${CHECK_ITEMS.length} · ${som(q.pp)} / kishi`; btn = `<button type="button" class="btn btn-sm btn-primary" data-act="vo-start" data-id="${o.id}">Tayyorlashni boshlash</button>`; }
  else if (stage === "prep") { line = `Tayyorlanmoqda · tayyorgarlik ${checkDone(o)} / ${CHECK_ITEMS.length}`; btn = o.date <= today() ? `<button type="button" class="btn btn-sm btn-primary" data-act="vo-complete" data-id="${o.id}">Yakunlash</button>` : `<button type="button" class="btn btn-sm" data-act="vo-plan" data-id="${o.id}">Masalliqlar</button>`; }
  else if (stage === "done") { const s = SET(q.setId), rev = q.pp * o.guests, c = setCost(s) * o.guests; line = `Daromad ${mln(rev)} · yalpi foyda ${mln(rev - c)}`; }
  else line = esc(closedText(o, r, vid));
  return `<article class="ocard ${stage === "new" && isLate(r) ? "late" : ""}" data-act="open-vorder" data-id="${o.id}" tabindex="0" role="link" aria-label="${o.id} buyurtmasini ochish">
    <div class="row between"><span class="row"><span class="mono">${o.id}</span>${srcBadge(o)}</span>${["done", "closed"].includes(stage) ? `<span class="tiny faint">${fDate(o.date)}</span>` : duePill(o.date)}</div>
    <h3>${esc(o.eventType)} · ${o.guests} kishi</h3>
    <p class="small muted">${fDateY(o.date)} · ${esc(o.venue || o.area)}${stage === "new" ? ` · byudjet ${num(o.budget)} so‘m/kishi` : ""}</p>
    <div class="row between ofoot"><span class="small">${line}</span>${btn}</div></article>`;
}

/* ---------- Buyurtma sahifasi ---------- */
function vVOrder(id) {
  const vid = ui.session.vendorId, o = ORD(id), r = o && !o.own ? o.requests.find(x => x.vendorId === vid) : null;
  if (!o || (!o.own && !r) || (o.own && o.vendorId !== vid)) return page(head("Buyurtma topilmadi", "Bu buyurtma sizga tegishli emas yoki o‘chirilgan.", "", backBtn("vorders", "Buyurtmalar")), "");
  const stage = stageOf(o, r, vid), q = oQuote(o, vid), set = q ? SET(q.setId) : null, mine = o.own || o.vendorId === vid;
  const steps = o.own ? ["Tasdiqlandi", "Tayyorlanmoqda", "Yakunlandi"] : ["So‘rov", "Taklif", "Tasdiqlandi", "Tayyorlanmoqda", "Yakunlandi"];
  const idx = (o.own ? { confirmed: 0, prep: 1, done: 2 } : { new: 0, quoted: 1, confirmed: 2, prep: 3, done: 4 })[stage];
  const stepper = stage === "closed" ? `<div class="note">${esc(closedText(o, r, vid))}</div>` : `<ol class="stepper">${steps.map((s, i) => `<li class="${i < idx ? "done" : i === idx ? "cur" : ""}"><span class="dot">${i < idx ? ic("check", 12) : i + 1}</span><span>${s}</span></li>`).join("")}</ol>`;
  // keyingi qadam
  let nx = "";
  const rev = q ? q.pp * o.guests : 0, cost = set ? setCost(set) * o.guests : 0, comG = o.own ? 0 : commOf(rev), sale = db.sales.find(x => x.orderId === o.id), bon = o.own ? 0 : (sale ? saleBonus(sale) : predBonus(vid, comG)), com = comG - bon;
  if (stage === "new") nx = nextBox(`Mijoz javob kutyapti${isLate(r) ? " — javob kechikmoqda" : ""}`, `So‘rov ${ago(r.sentAt)} keldi. Menyu setini tanlab narx bering yoki sababini yozib rad eting.`, `<button class="btn btn-primary" data-act="quote" data-id="${o.id}">Taklif berish</button><button class="btn" data-act="reject" data-id="${o.id}">Rad etish</button>`);
  else if (stage === "quoted") nx = nextBox(r.toCustomer ? "Taklifingiz mijozda" : "Admin taklifingizni ko‘rib chiqmoqda", r.toCustomer ? "Mijoz tanlasa, sizga bildirishnoma keladi va buyurtma “Tasdiqlangan” bo‘limiga o‘tadi." : "Admin mijozga yubormaguncha taklifni o‘zgartirishingiz mumkin.", r.toCustomer ? "" : `<button class="btn" data-act="quote" data-id="${o.id}">Taklifni tahrirlash</button>`);
  else if (stage === "confirmed") nx = nextBox("Tadbirga tayyorgarlik", `${dueInfo(o.date).label}. Masalliqlarni tekshiring, tayyorgarlik ro‘yxatini belgilang va tayyorlashni boshlang.`, `<button class="btn btn-primary" data-act="vo-start" data-id="${o.id}">Tayyorlashni boshlash</button><button class="btn" data-act="vo-plan" data-id="${o.id}">Masalliqlar va xarid ro‘yxati</button>`);
  else if (stage === "prep") nx = nextBox(o.date <= today() ? "Tadbir bo‘ldimi? Yakunlang" : "Tayyorlanmoqda", o.date <= today() ? "Yakunlaganingizda daromad va tannarx moliyaga, mijoz bazaga yoziladi." : `Tadbir ${fDate(o.date)} da. Yakunlash tugmasi tadbir kuni ochiladi.`, `<button class="btn btn-primary" data-act="vo-complete" data-id="${o.id}" ${o.date <= today() ? "" : "disabled"}>Yakunlash</button><button class="btn" data-act="vo-plan" data-id="${o.id}">Masalliqlar</button>`);
  else if (stage === "done") nx = nextBox("Tadbir yakunlangan", `Daromad ${som(rev)} · tannarx ${costKnown(set) ? som(cost) : "noma’lum"}${comG ? ` · komissiya ${som(comG)}${bon ? ` (${som(bon)} bonusdan)` : ""}` : ""} · yalpi foyda ${som(rev - cost - com)}.`, `<button class="btn" data-act="st-open" data-k="rev">Statistikada ko‘rish</button>`);
  // tayyorlash rejasi qisqacha
  let planCard = "";
  if (set && ["confirmed", "prep", "new", "quoted"].includes(stage)) {
    const pc = planCalc(orderPlan(o, vid));
    planCard = `<section class="card"><div class="card-h"><div><h2>Masalliqlar</h2><p class="small muted">${o.guests} kishi · ${esc(set.name)} · zaxira 5%</p></div><button class="btn btn-sm" data-act="vo-plan" data-id="${o.id}">To‘liq hisob</button></div>
      <div class="live">${money("Tayyorlash tannarxi", som(pc.total))}${money("1 kishiga", som(pc.pp))}${money("Yetishmaydi", pc.short.length ? pc.short.length + " ta mahsulot" : "hammasi bor", pc.short.length ? "warn" : "good")}</div>
      <ul class="dots" style="margin-top:12px">${pc.rows.slice(0, 6).map(x => `<li>${esc(x.p.name)}: <strong>${fmtQty(x.p, x.qty)}</strong>${x.short > 0.0005 ? ` <span class="warn-t">(${fmtQty(x.p, x.short)} yetishmaydi)</span>` : ""}</li>`).join("")}</ul>${isSimple(set) && !linkedAll(set) ? `<div class="note warn" style="margin-top:12px">${ic("alert", 16)}<span>Oddiy menyu: ${set.lines.filter(l => !l.d).length} ta taom texkartaga bog‘lanmagan — ular masalliq hisobiga kirmaydi. <button type="button" class="link" data-act="sm-edit" data-id="${set.id}">Texkartaga bog‘lash</button></span></div>` : ""}</section>`;
  }
  const vlog = o.own ? o.history : [{ at: r.sentAt, text: "So‘rov keldi" }, ...(r.quote ? [{ at: r.quote.at, text: `Taklif berildi: ${num(r.quote.pp)} so‘m/kishi` }] : []), ...(o.vlog || []).filter(e => e.vid === vid)].sort((a, b) => a.at - b.at);
  return page(head(`${esc(o.eventType)} · ${o.guests} kishi`, `<span class="mono">${o.id}</span> · ${fDateY(o.date)} · ${esc(o.venue || o.area)}`, `${srcBadge(o)}${duePill(o.date)}${["confirmed", "prep"].includes(stage) ? `<button class="btn btn-sm" data-act="task-new" data-order="${o.id}" data-title="${esc(o.id + ": ")}">${ic("send", 16)} Vazifa berish</button>` : ""}`, backBtn("vorders", "Buyurtmalar")),
    stepper + nx + `<div class="g g-21"><div class="stack">
      <section class="card"><div class="card-h"><h2>Tadbir</h2></div><dl class="dl"><dt>Sana</dt><dd>${fDateY(o.date)} (${dueInfo(o.date).label.toLowerCase()})</dd><dt>Mehmonlar</dt><dd class="num">${o.guests} kishi</dd><dt>Joy</dt><dd>${esc(o.venue || "—")}</dd><dt>Hudud</dt><dd>${esc(o.area)}</dd>${o.own ? "" : `<dt>Byudjet</dt><dd class="num">${som(o.budget)} / kishi</dd>`}<dt>Mijoz izohi</dt><dd>${esc(o.notes || "—")}</dd></dl></section>
      ${q ? `<section class="card"><div class="card-h"><h2>Taklif va menyu</h2>${stage === "quoted" && !r.toCustomer ? `<button class="btn btn-sm" data-act="quote" data-id="${o.id}">Tahrirlash</button>` : ""}</div><div class="live">${money("Narx / kishi", som(q.pp))}${money("Jami", som(rev))}${money("Tannarx", som(cost))}${money("Yalpi foyda" + (comG ? " (komissiyadan keyin)" : ""), som(rev - cost - com), marginTone(margin(rev, cost + com)))}</div>${bon ? `<p class="small good-t" style="margin-top:8px">${ic("wallet", 14)} Komissiyaning ${som(bon)} qismi bonusdan yechiladi${sale ? "" : " (taxminan)"}, sizdan ${som(com)}.</p>` : ""}
        <div class="g g-2" style="margin-top:12px"><div><span class="lbl">${esc(set.name)} (1 kishiga)</span><ul class="dots">${set.items.map(it => `<li>${esc(D(it.d).name)}${it.n !== 1 ? " ×" + String(it.n).replace(".", ",") : ""}</li>`).join("")}</ul></div><div><span class="lbl">Narxga kiradi</span><ul class="dots">${q.includes.map(x => `<li>${esc(x)}</li>`).join("") || "<li>—</li>"}</ul>${q.note ? `<p class="small muted" style="margin-top:8px">${esc(q.note)}</p>` : ""}</div></div></section>` : ""}
      ${planCard}
    </div><div class="stack">
      <section class="card"><div class="card-h"><h2>Mijoz</h2></div>${mine ? `<dl class="dl"><dt>Ism</dt><dd>${esc(o.customer)}</dd><dt>Telefon</dt><dd class="row">${esc(o.phone || "—")}${o.phone ? `<button type="button" class="icon-btn" data-act="copy" data-text="${esc(o.phone)}" aria-label="Telefonni nusxalash">${ic("copy", 14)}</button>` : ""}</dd></dl>` : `<p class="small muted">${ic("lock", 14)} Mijoz ismi va telefoni u sizni tanlagandan keyin ochiladi.</p>`}</section>
      ${["confirmed", "prep", "done"].includes(stage) ? `<section class="card"><div class="card-h"><h2>Tayyorgarlik</h2><span class="small muted num">${checkDone(o)} / ${CHECK_ITEMS.length}</span></div><div class="prog"><span style="width:${checkDone(o) / CHECK_ITEMS.length * 100}%"></span></div><div class="stack-s" style="margin-top:12px">${CHECK_ITEMS.map((t, i) => `<label class="check"><input type="checkbox" ${(o.vcheck || {})[i] ? "checked" : ""} ${stage === "done" ? "disabled" : ""} data-change="vo-check" data-id="${o.id}" data-i="${i}" id="ck-${o.id}-${i}"> ${esc(t)}</label>`).join("")}</div></section>` : ""}
      ${["confirmed", "prep", "done"].includes(stage) ? payCard(o, "vendor") : ""}${!o.own && mine ? chatBox(o, "vendor") : ""}
      <section class="card"><div class="card-h"><h2>Ichki izohlar</h2><span class="tiny faint">faqat sizga ko‘rinadi</span></div>${(o.vnotes || []).filter(n => n.vid === vid).map(n => `<div class="fb"><span class="tiny faint">${fDT(n.at)}</span><p class="small">${esc(n.text)}</p></div>`).join("") || `<p class="small faint">Izoh yo‘q</p>`}<form data-form="vo-note" data-id="${o.id}" class="row" style="margin-top:10px"><input name="text" class="grow" placeholder="Masalan: 2 ta qo‘shimcha ofitsiant" aria-label="Ichki izoh" required><button class="btn" type="submit">Qo‘shish</button></form></section>
      <section class="card"><div class="card-h"><h2>Tarix</h2></div>${timeline(vlog)}</section>
    </div></div>`);
}
function nextBox(title, text, btns) { return `<section class="card next"><div class="grow"><span class="eyebrow">Keyingi qadam</span><h2>${title}</h2><p class="small muted">${text}</p></div>${btns ? `<div class="row">${btns}</div>` : ""}</section>`; }

MODALS.complete = m => {
  const vid = ui.session.vendorId, o = ORD(m.id), q = oQuote(o, vid), s = SET(q.setId);
  const rev = q.pp * o.guests, cost = setCost(s) * o.guests, comG = o.own ? 0 : commOf(rev), bon = o.own ? 0 : predBonus(vid, comG), com = comG - bon, done = (o.vcheck || {});
  return mHead(`${o.id}: tadbirni yakunlash`, `${esc(o.eventType)} · ${fDateY(o.date)} · ${o.guests} kishi`) + `<form data-form="complete" data-id="${o.id}"><div class="m-body">
    <div class="live">${money("Daromad", som(rev))}${money("Oziq-ovqat tannarxi", costKnown(s) ? som(cost) : "noma’lum", costKnown(s) ? "" : "warn")}${o.own ? "" : money(`Komissiya ${String(db.settings.commission).replace(".", ",")}%`, bon ? `${som(comG)} · bonusdan ${som(bon)}` : som(comG))}${money("Yalpi foyda", som(rev - cost - com), marginTone(margin(rev, cost + com)))}</div>
    <div class="f-grid"><div class="field"><label for="cp-g">Haqiqiy mehmonlar soni</label><input id="cp-g" name="guests" type="number" min="1" value="${o.guests}"></div></div>
    ${(() => { const already = db.moves.some(x => x.orderId === o.id && ["order", "chiqim"].includes(x.type)); return `<label class="check"><input type="checkbox" name="deduct" ${already ? "" : "checked"}> Set masalliqlarini ombordan chiqim qilish (rezerv yopiladi)</label>${already ? `<p class="tiny muted">Bu buyurtma uchun masalliq allaqachon tayyorlash rejasidan chiqim qilingan.</p>` : ""}`; })()}
    ${checkDone(o) < CHECK_ITEMS.length ? `<div class="note warn">${ic("alert", 16)}<span>Tayyorgarlik ro‘yxatida ${CHECK_ITEMS.length - checkDone(o)} ta band belgilanmagan.</span></div>` : ""}
    <p class="small muted">Sotuv ${fDate(o.date)} sanasi bilan moliyaga, mijoz bazangizga yoziladi.</p>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Yakunlash</button></footer></form>`;
};
MODALS.ownOrder = m => {
  const vid = ui.session.vendorId, l = m.leadId ? VLEAD(m.leadId) : null, sets = db.sets.filter(s => s.vendorId === vid), custs = db.customers.filter(c => c.vendorId === vid);
  if (!sets.length) return mHead("Avval menyu seti kerak", "") + `<div class="m-body"><p>Buyurtma qo‘shish uchun kamida bitta menyu seti yarating.</p></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button><button type="button" class="btn btn-primary" data-act="go" data-view="menu">Menyuga o‘tish</button></footer>`;
  return mHead("O‘z buyurtmamni qo‘shish", l ? `${esc(l.name)} leadi bilan kelishildi — buyurtmani rasmiylashtiring` : "CaterFlow’dan tashqari mijoz buyurtmasi. Moliya va mijozlar bazasiga ham yoziladi.") + `<form data-form="own-order" data-live="ownorder"${l ? ` data-lead="${l.id}"` : ""}><div class="m-body">
    <div class="f-grid"><div class="field"><label for="oo-c">Mijoz</label><select id="oo-c" name="cust">${opt("new", "+ Yangi mijoz")}${custs.map(c => opt(c.id, `${c.name} · ${c.phone}`)).join("")}</select></div><div class="field"><label for="oo-n">Ism</label><input id="oo-n" name="name" value="${esc(l ? l.name : "")}"></div><div class="field"><label for="oo-p">Telefon</label><input id="oo-p" name="phone" type="tel" value="${esc(l ? l.phone : "")}"></div></div>
    <div class="f-grid"><div class="field"><label for="oo-e">Tadbir</label><select id="oo-e" name="eventType">${EVENTS.map(e => opt(e, e, l && l.ev)).join("")}</select></div><div class="field"><label for="oo-d">Sana</label><input id="oo-d" name="date" type="date" value="${l ? l.date : dAdd(14)}" required></div><div class="field"><label for="oo-g">Mehmonlar</label><input id="oo-g" name="guests" type="number" min="1" value="${l ? l.guests : 100}" required></div></div>
    <div class="f-grid"><div class="field"><label for="oo-s">Menyu seti</label><select id="oo-s" name="setId">${sets.map(s => opt(s.id, `${s.name} — ${num(s.price)}`)).join("")}</select></div><div class="field"><label for="oo-pp">Narx, so‘m / kishi</label><input id="oo-pp" name="pp" type="number" min="0" step="1000" value="${sets[0] ? sets[0].price : 0}" required></div><div class="field"><label for="oo-v">Joy</label><input id="oo-v" name="venue" placeholder="To‘yxona yoki manzil"></div></div>
    <div class="f-grid"><div class="field"><label for="oo-ch">Mijoz qayerdan keldi</label><select id="oo-ch" name="channel">${OWN_CH.map(c => opt(c, c, l ? l.source : "Telefon")).join("")}</select></div><div class="field"><label for="oo-no">Izoh</label><input id="oo-no" name="notes"></div></div>
    <div class="live" id="oo-live"></div>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Buyurtmani saqlash</button></footer></form>`;
};
MODALS.quote = m => {
  const o = ORD(m.id), vid = ui.session.vendorId, r = o.requests.find(x => x.vendorId === vid), sets = db.sets.filter(s => s.vendorId === vid && (setShown(s) || (r && r.quote && r.quote.setId === s.id))), prev = r && r.quote;
  if (!sets.length) return mHead("Avval menyu kerak", "") + `<div class="m-body"><p>Taklif berish uchun mijozlarga ko‘rinadigan kamida bitta menyu kerak: taomlar va narx (oddiy menyu yoki texkartali set). Qoralamadagi menyular taklifda chiqmaydi.</p></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button><button type="button" class="btn btn-primary" data-act="go" data-view="menu">Menyuga o‘tish</button></footer>`;
  const best = prev ? SET(prev.setId) : (sets.filter(s => s.price <= o.budget).sort((a, b) => b.price - a.price)[0] || sets[0]);
  return mHead(`${o.id}: ${prev ? "taklifni tahrirlash" : "taklif berish"}`, `${esc(o.eventType)} · ${fDate(o.date)} · ${o.guests} kishi · byudjet ${num(o.budget)} so‘m/kishi`) + `<form data-form="quote" data-live="quote" data-id="${o.id}"><div class="m-body">
    ${o.notes ? `<div class="note info">${ic("alert", 16)}<span>Mijoz izohi: ${esc(o.notes)}</span></div>` : ""}
    <div class="f-grid"><div class="field"><label for="q-set">Menyu seti</label><select id="q-set" name="setId">${sets.map(s => opt(s.id, `${s.name} — ${num(s.price)}`, best.id)).join("")}</select></div><div class="field"><label for="q-pp">Narx, so‘m / kishi</label><input id="q-pp" name="pp" type="number" min="0" step="1000" value="${prev ? prev.pp : best.price}" required></div></div>
    <p class="small muted" id="q-comp"></p>
    <div class="live" id="q-live"></div>
    <div><span class="lbl">Narxga kiradi</span><div class="row">${INCLUDES.map((x, i) => `<label class="check"><input type="checkbox" name="inc" value="${esc(x)}" ${prev ? (prev.includes.includes(x) ? "checked" : "") : (i < 2 ? "checked" : "")} id="q-inc${i}"> ${esc(x)}</label>`).join("")}</div></div>
    <div class="field"><label for="q-note">Mijoz uchun izoh</label><textarea id="q-note" name="note" autocomplete="off" placeholder="Masalan: ikkinchi issiq taom sovg‘a">${esc(prev ? prev.note : "")}</textarea></div>
  </div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">${prev ? "O‘zgarishni saqlash" : "Taklifni yuborish"}</button></footer></form>`;
};

/* ---------- Holat paneli ---------- */
function vTasks(vid) {
  const items = vItems(vid), t = today(), tasks = [];
  const pend = items.filter(x => x.stage === "new").sort((a, b) => a.r.sentAt - b.r.sentAt);
  if (pend.length) tasks.push({ tone: pend.some(x => isLate(x.r)) ? "bad" : "saffron", title: `${pend.length} ta so‘rovga javob bering`, sub: `Eng eskisi ${ago(pend[0].r.sentAt)} keldi. 24 soat ichida javob bering.`, act: "vstage-go", k: "new", btn: "Javob berish" });
  items.filter(x => ["confirmed", "prep"].includes(x.stage) && x.o.date < t).forEach(x => tasks.push({ tone: "bad", title: `${x.o.id}: tadbir kuni o‘tdi`, sub: "Buyurtmani yakunlang — sotuv moliyaga yoziladi.", act: "open-vorder", id: x.o.id, btn: "Ochish" }));
  items.filter(x => ["confirmed", "prep"].includes(x.stage) && x.o.date >= t && daysBetween(t, x.o.date) <= 2).sort((a, b) => a.o.date.localeCompare(b.o.date)).forEach(x => tasks.push({ tone: x.o.date === t ? "bad" : "saffron", title: `${dueInfo(x.o.date).label}: ${x.o.eventType}, ${x.o.guests} kishi`, sub: x.stage === "confirmed" ? "Tayyorlashni boshlang va masalliqlarni tekshiring." : `Tayyorlanmoqda · tayyorgarlik ${checkDone(x.o)} / ${CHECK_ITEMS.length}`, act: "open-vorder", id: x.o.id, btn: "Ochish" }));
  const sh = shortAgg(vid, 3);
  if (sh.rows.length) tasks.push({ tone: "saffron", title: `Xarid qilish kerak: ${sh.rows.length} ta mahsulot`, sub: `Yaqin 3 kundagi ${sh.orders} ta tadbir uchun omborda yetmaydi.`, act: "shop-agg", btn: "Xarid ro‘yxati" });
  const rdue = db.dishes.filter(d => d.vendorId === vid && needsReview(d)).length;
  if (rdue && ["owner", "manager"].includes(myRole())) tasks.push({ tone: "neutral", title: `${rdue} ta texkarta ${RECIPE_REVIEW_DAYS} kundan beri yangilanmagan`, sub: "Masalliq narxi yoki grammlar o‘zgargan bo‘lishi mumkin — oylik tekshiruvdan o‘tkazing.", act: "recipes-due", btn: "Ko‘rib chiqish" });
  const low = db.products.filter(p => p.vendorId === vid && p.stock < p.min).length;
  if (low) tasks.push({ tone: "neutral", title: `${low} ta mahsulot kam qolgan`, sub: "Minimal qoldiqdan past.", act: "go", view: "stock", btn: "Ombor" });
  const stale = db.ownLeads.filter(l => l.vendorId === vid && VL_OPEN(l.status) && Date.now() - l.updatedAt > 3 * 864e5).length;
  if (stale) tasks.push({ tone: "neutral", title: `${stale} ta lead 3 kundan beri harakatsiz`, sub: "Qo‘ng‘iroq qiling yoki holatini yangilang — admin ham ko‘radi.", act: "go", view: "myleads", btn: "Leadlar" });
  return tasks;
}
function shortAgg(vid, days) {
  const t = today(), os = vItems(vid).filter(x => ["confirmed", "prep"].includes(x.stage) && x.o.date >= t && daysBetween(t, x.o.date) <= days).map(x => x.o);
  const need = {};
  os.forEach(o => planCalc(orderPlan(o, vid)).rows.forEach(r => { need[r.p.id] = (need[r.p.id] || 0) + r.qty; }));
  const rows = Object.keys(need).map(pid => { const p = P(pid), l = pList(pid); return { p, qty: need[pid], short: Math.max(0, need[pid] - p.stock), supplier: l.length ? l[l.length - 1].supplier : "Yetkazib beruvchi yo‘q" }; }).filter(x => x.short > 0.0005);
  return { orders: os.length, rows };
}
MODALS.shop = () => {
  const vid = ui.session.vendorId, sh = shortAgg(vid, 3), groups = {};
  sh.rows.forEach(x => { (groups[x.supplier] = groups[x.supplier] || []).push(x); });
  return mHead("Xarid ro‘yxati", `Yaqin 3 kundagi ${sh.orders} ta tadbir uchun, omborda borini ayirib`) + `<div class="m-body">${Object.entries(groups).map(([s, xs]) => `<div class="stack-s"><strong class="small">${esc(s)}</strong><ul class="dots">${xs.map(x => `<li>${esc(x.p.name)}: <strong>${fmtQty(x.p, x.short)}</strong> <span class="faint">≈ ${som(x.short * lastP(x.p.id))}</span></li>`).join("")}</ul></div>`).join("") || empty("Hamma masalliq yetarli")}</div><footer class="m-foot"><button type="button" class="btn" data-act="copy" data-text="${esc(Object.entries(groups).map(([s, xs]) => s + ":\n" + xs.map(x => `- ${x.p.name}: ${fmtQty(x.p, x.short)}`).join("\n")).join("\n\n"))}">${ic("copy", 16)} Nusxalash</button><button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};
function onboarding(vid) {
  const v = V(vid); if (daysBetween(v.since, today()) > 45) return "";
  const steps = [
    ["Ombor narxlari kiritilgan", db.purchases.some(x => x.vendorId === vid), "stock"],
    ["Taomlar texkartasi tuzilgan", db.dishes.some(d => d.vendorId === vid), "menu"],
    ["Setlarga rasm yoki video qo‘shilgan", db.sets.some(s => s.vendorId === vid && s.media.length >= 2), "menu"],
    ["Birinchi taklif berilgan", vendorReqs(vid).some(x => x.r.quote), "vorders"],
    ["Birinchi tadbir yakunlangan", db.sales.some(s => s.vendorId === vid), "vorders"]
  ], n = steps.filter(s => s[1]).length;
  if (n === steps.length) return "";
  return `<section class="card"><div class="card-h"><div><h2>Boshlash uchun</h2><p class="small muted">Profilingiz to‘liq bo‘lsa, admin sizga ko‘proq buyurtma yuboradi</p></div><span class="small muted num">${n} / ${steps.length}</span></div><div class="prog"><span style="width:${n / steps.length * 100}%"></span></div><div class="stack-s" style="margin-top:12px">${steps.map(([t, ok, view]) => `<div class="row between small"><span class="row">${ok ? `<span class="good-t">${ic("check", 16)}</span>` : `<span class="faint">○</span>`} ${t}</span>${ok ? "" : `<button type="button" class="btn btn-sm btn-ghost" data-act="go" data-view="${view}">Bajarish</button>`}</div>`).join("")}</div></section>`;
}
function vVendorDash(vid) {
  const me = V(vid), t = today(), items = vItems(vid), p = pnl(vid, t.slice(0, 7));
  const pend = items.filter(x => x.stage === "new").length;
  const week = items.filter(x => ["confirmed", "prep"].includes(x.stage) && x.o.date >= t && daysBetween(t, x.o.date) <= 7);
  const upcoming = items.filter(x => ["confirmed", "prep"].includes(x.stage)).sort((a, b) => a.o.date.localeCompare(b.o.date)).slice(0, 6);
  const tasks = vTasks(vid);
  const closed = me.closed ? `<div class="note bad">${ic("lock", 16)}<span>Admin sizni vaqtincha yopgan${me.closedUntil ? ` (${fDate(me.closedUntil)} gacha)` : ""}: ${esc(me.closedReason)}. Bu vaqtda yangi so‘rovlar avtomatik rad etiladi.</span></div>` : "";
  const leads = db.ownLeads.filter(l => l.vendorId === vid), u = window.me();
  return page(head(`Salom, ${esc(firstName(u ? u.name : me.contact))}`, `${esc(me.name)} · bugun ${fDateY(t)}`, `<button class="btn btn-sm" data-act="cust-vendor" data-id="${vid}">${ic("globe", 16)} Ochiq sahifam</button>`),
    closed + (seesMoney() ? onboarding(vid) + (bonusLedger(vid).left > 0 ? bonusCard(vid, false) : "") : "") + `<div class="g g-kpi4">
      <button type="button" class="card kpi kpi-link" data-act="vstage-go" data-k="new"><span class="eyebrow">Javob kutmoqda</span><span class="v">${pend}</span><span class="s">so‘rov</span></button>
      <button type="button" class="card kpi kpi-link" data-act="vstage-go" data-k="confirmed"><span class="eyebrow">Shu hafta tadbirlar</span><span class="v">${week.length}</span><span class="s">${week.reduce((a, x) => a + x.o.guests, 0)} mehmon</span></button>
      ${seesMoney() ? `<button type="button" class="card kpi kpi-link" data-act="st-open" data-k="rev" data-p="month"><span class="eyebrow">Bu oy daromad</span><span class="v">${mln(p.rev)}</span><span class="s">${p.sales.length} ta tadbir · batafsil</span></button>
      <button type="button" class="card kpi kpi-link" data-act="st-open" data-k="rev" data-p="month"><span class="eyebrow">Bu oy sof foyda</span><span class="v">${mln(p.net)}</span><span class="s">marja ${pct(p.margin)} · batafsil</span></button>` : `<button type="button" class="card kpi kpi-link" data-act="go" data-view="tasks"><span class="eyebrow">Ochiq vazifalar</span><span class="v">${db.tasks.filter(t => t.vendorId === vid && t.status !== "bajarildi").length}</span><span class="s">jamoa bo‘yicha</span></button>
      <button type="button" class="card kpi kpi-link" data-act="go" data-view="myleads"><span class="eyebrow">Jarayondagi leadlar</span><span class="v">${leads.filter(l => VL_OPEN(l.status)).length}</span><span class="s">o‘z mijozlaringiz</span></button>`}</div>
    <div class="g g-21"><section class="card"><div class="card-h"><h2>Bugun nima qilish kerak</h2><span class="small muted">${tasks.length} ta vazifa</span></div>${tasks.length ? `<ul class="tasks">${tasks.map(x => `<li class="t-${x.tone}"><span class="grow"><strong>${esc(x.title)}</strong><span class="block small muted">${esc(x.sub)}</span></span><button type="button" class="btn btn-sm" data-act="${x.act}"${x.id ? ` data-id="${x.id}"` : ""}${x.k ? ` data-k="${x.k}"` : ""}${x.view ? ` data-view="${x.view}"` : ""}>${x.btn}</button></li>`).join("")}</ul>` : empty("Hammasi joyida — hozircha shoshilinch ish yo‘q")}</section>
      <section class="card"><div class="card-h"><h2>Yaqin tadbirlar</h2><button class="btn btn-sm btn-ghost" data-act="vstage-go" data-k="confirmed">Hammasi</button></div>${upcoming.length ? `<ul class="feed">${upcoming.map(x => `<li><button type="button" class="olink" data-act="open-vorder" data-id="${x.o.id}"><span><strong>${fDate(x.o.date)}</strong> · ${esc(x.o.eventType)}, ${x.o.guests} kishi</span>${duePill(x.o.date)}</button></li>`).join("")}</ul>` : `<p class="small faint">Tasdiqlangan tadbir yo‘q</p>`}</section></div>
    <div class="g g-2"><section class="card"><div class="card-h"><h2>Leadlarim</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="myleads">Ochish</button></div><div class="chips">${VL_ORDER.map(s => `<span class="pill t-${VL_ST[s][1]}">${VL_ST[s][0]} · ${leads.filter(l => l.status === s).length}</span>`).join("")}</div></section>
      <section class="card"><div class="card-h"><h2>So‘nggi fikrlar</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="menu" data-k="feedback">Hammasi</button></div>${fbList(fbFor(vid).slice(0, 2))}</section></div>`);
}

/* ---------- Bildirishnomalar ---------- */
MODALS.notifs = () => {
  const list = db.notifs.filter(visibleN).slice(0, 30);
  return mHead("Bildirishnomalar", `${unread()} ta o‘qilmagan`) + `<div class="m-body">${list.length ? `<ul class="nlist">${list.map(n => `<li class="${n.read ? "" : "unread"}"><button type="button" data-act="notif-open" data-id="${n.id}"><span class="grow">${esc(n.text)}</span><time class="tiny faint">${ago(n.at)}</time></button></li>`).join("")}</ul>` : empty("Bildirishnoma yo‘q")}</div><footer class="m-foot"><button type="button" class="btn" data-act="notifs-read">Hammasini o‘qilgan deb belgilash</button><button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};
