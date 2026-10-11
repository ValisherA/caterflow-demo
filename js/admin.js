/* CaterFlow prototip — admin sahifalari */
"use strict";
const MODALS = {};

/* ---------- Holat paneli ---------- */
function vAdminDash() {
  const t = today(), mk = t.slice(0, 7);
  const newToday = db.leads.filter(l => localISO(new Date(l.at)) === t).length;
  const newAll = db.leads.filter(l => l.status === "yangi").length;
  const active = db.orders.filter(o => ["tasdiqlandi", "bajarilmoqda"].includes(o.status));
  const pend = db.orders.flatMap(o => o.requests).filter(r => r.status === "kutilmoqda").length;
  const waitCust = db.orders.filter(o => o.status === "mijozda").length;
  const gmv = db.sales.filter(s => s.source === "CaterFlow" && s.date.startsWith(mk)).reduce((a, s) => a + s.guests * s.pp, 0);
  const pipe = active.reduce((a, o) => a + orderValue(o), 0);
  const maxL = Math.max(1, ...LEAD_ORDER.map(s => db.leads.filter(l => l.status === s).length));
  const funnel = LEAD_ORDER.map(s => { const n = db.leads.filter(l => l.status === s).length; return `<div class="hbar"><span>${LEAD_ST[s][0]}</span><span class="track"><span class="fill" style="width:${n / maxL * 100}%;display:block" data-tip="${LEAD_ST[s][0]}: ${n} ta lead"></span></span><span class="n">${n}</span></div>`; }).join("");
  const ordCounts = Object.keys(ORD_ST).map(k => [k, db.orders.filter(o => o.status === k).length]).filter(x => x[1]);
  const busy = v => db.orders.filter(o => o.vendorId === v.id && ["tasdiqlandi", "bajarilmoqda"].includes(o.status)).length * 10 + vendorReqs(v.id).filter(x => x.r.status === "kutilmoqda").length * 5 + db.ownLeads.filter(l => l.vendorId === v.id && VL_OPEN(l.status)).length;
  const board = [...db.vendors].sort((x, y) => busy(y) - busy(x)).slice(0, 6).map(v => {
    const act = db.orders.filter(o => o.vendorId === v.id && ["tasdiqlandi", "bajarilmoqda"].includes(o.status));
    const pr = vendorReqs(v.id).filter(x => x.r.status === "kutilmoqda");
    const ol = db.ownLeads.filter(l => l.vendorId === v.id && VL_OPEN(l.status));
    return `<div class="vcard"><div class="row between"><button type="button" class="link" data-act="open-vendor" data-id="${v.id}">${esc(v.name)}</button>${v.closed ? `<span class="pill t-bad">Yopiq</span>` : `<span class="pill t-good">Faol</span>`}</div>
      ${act.length ? `<ul>${act.map(o => `<li><button type="button" class="olink" data-act="open-order" data-id="${o.id}"><span><span class="mono">${o.id}</span> · ${esc(o.eventType)} · ${fDate(o.date)}</span>${pill(ORD_ST, o.status)}</button></li>`).join("")}</ul>` : `<p class="small faint">Hozir faol buyurtma yo‘q</p>`}
      <div class="minis"><span>Javob kutilmoqda: <b>${pr.length}</b></span><span>O‘z leadlari jarayonda: <b>${ol.length}</b></span><span>Javob berish: <b>${pct(respRate(v.id))}</b></span></div></div>`;
  }).join("");
  const upcoming = db.orders.filter(o => ["tasdiqlandi", "bajarilmoqda"].includes(o.status) && o.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  const feed = db.activity.slice(0, 10).map(a => `<li><span><span class="who">${esc(whoName(a.who))}</span> ${esc(a.text)}</span><time>${ago(a.at)}</time></li>`).join("");
  return page(head("Holat paneli", "Leadlar, buyurtmalar va vendorlar bandligi bir joyda."),
    `<div class="g g-kpi">${kpi("Yangi leadlar", newAll, `bugun kelgan: ${newToday}`)}${kpi("Faol buyurtmalar", active.length, `jami ${mln(pipe)} so‘m`)}${kpi("Vendor javobi kutilmoqda", pend, `mijoz tanlovi kutilmoqda: ${waitCust}`)}${kpi(cap(MONTHS[new Date().getMonth()]) + " aylanmasi", mln(gmv), `komissiya: ${mln(gmv * db.settings.commission / 100)} so‘m`)}</div>
    <section class="card"><div class="card-h"><h2>Kim nima bilan band</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="vendors">Barcha vendorlar (${db.vendors.length})</button></div><div class="vboard">${board}</div></section>
    <div class="g g-2">
      <section class="card"><div class="card-h"><h2>Lead voronkasi</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="leads">Leadlarni ochish</button></div><div class="hbars">${funnel}</div></section>
      <section class="card"><div class="card-h"><h2>Buyurtmalar holati</h2><button class="btn btn-sm btn-ghost" data-act="go" data-view="orders">Buyurtmalar</button></div><div class="chips">${ordCounts.map(([k, n]) => `<span class="pill t-${ORD_ST[k][1]}">${ORD_ST[k][0]} · ${n}</span>`).join("")}</div>
        <div class="lbl" style="margin-top:16px">Yaqin tadbirlar</div>${upcoming.length ? `<ul class="feed">${upcoming.map(o => `<li><button type="button" class="link" data-act="open-order" data-id="${o.id}">${o.id}</button><span>${esc(o.eventType)}, ${o.guests} kishi · ${esc(V(o.vendorId).name)}</span><time>${fDate(o.date)}</time></li>`).join("")}</ul>` : `<p class="small faint">Yaqin tadbir yo‘q</p>`}</section>
    </div>
    ${(() => { const pr = invProblems().filter(x => x[1]); return `<section class="card"><div class="card-h"><div><h2>Ombor nazorati</h2><p class="small muted">Vendorlar omborida tizim to‘g‘ri ishlayaptimi</p></div><button class="btn btn-sm btn-ghost" data-act="go" data-view="inventory">Ochish</button></div>${pr.length ? `<ul class="tasks">${pr.slice(0, 5).map(([l, n, sev, tab]) => `<li class="t-${sev === "critical" ? "bad" : sev === "warning" ? "saffron" : "neutral"}"><span class="grow"><strong class="num">${n}</strong> ${esc(l)}</span><button type="button" class="btn btn-sm" data-act="inv-go" data-v="" data-k="${tab === "stock" ? "alerts" : tab}">Ko‘rish</button></li>`).join("")}</ul>` : `<p class="small good-t">${ic("check", 14)} Muammo yo‘q</p>`}</section>`; })()}
    <section class="card"><div class="card-h"><h2>So‘nggi faollik</h2></div><ul class="feed">${feed}</ul></section>`);
}

/* ---------- Leadlar (Instagram) ---------- */
function vLeads() {
  const f = ui.leadSrc, s = db.settings;
  const list = db.leads.filter(l => f === "all" || (f === "ig" ? l.src.startsWith("ig") : l.src === f));
  const ig = `<section class="card"><div class="row between"><div class="row grow"><span class="p-logo" style="width:44px;height:44px">${ic("camera", 20)}</span><div class="grow"><h2>Instagram</h2><p class="small muted">${s.igConnected ? `${esc(s.igAccount)} ulangan (demo rejim). Direct xabarlar va reklama formalaridan leadlar shu yerga tushadi.` : "Ulanmagan. Ulansa Direct xabarlar va reklama formalaridan leadlar avtomatik tushadi."}</p></div></div>
    <div class="row">${s.igConnected ? `<span class="pill t-good">Ulangan · demo</span><button class="btn btn-sm" data-act="sim-lead">${ic("plus", 16)} Demo: yangi lead</button>` : `<button class="btn btn-primary btn-sm" data-act="ig-connect">Instagram’ni ulash</button>`}<button class="btn btn-sm btn-ghost" data-act="go" data-view="settings">Sozlamalar</button></div></div></section>`;
  const cnt = k => k === "all" ? db.leads.length : db.leads.filter(l => k === "ig" ? l.src.startsWith("ig") : l.src === k).length;
  const cols = LEAD_ORDER.map(st => { const items = list.filter(l => l.status === st).sort((a, b) => b.at - a.at); return `<div class="kcol"><div class="kcol-h">${pill(LEAD_ST, st)}<span class="faint num small">${items.length}</span></div>${items.map(leadCard).join("") || `<p class="tiny faint">Bo‘sh</p>`}</div>`; }).join("");
  return page(head("Leadlar", "Instagram, sayt va telefondan kelgan so‘rovlar. Kartani bosib holatini yangilang yoki buyurtmaga aylantiring.", `<button class="btn btn-primary" data-act="new-lead">${ic("plus", 16)} Lead qo‘shish</button>`),
    ig + `<div class="row between">${chips([["all", "Hammasi", cnt("all")], ["ig", "Instagram", cnt("ig")], ["sayt", "Sayt", cnt("sayt")], ["tel", "Telefon", cnt("tel")]], f, "lead-src")}</div><div class="kanban">${cols}</div>`);
}
function leadCard(l) {
  return `<button type="button" class="lcard" data-act="open-lead" data-id="${l.id}"><span class="top"><strong>${esc(l.name)}</strong><span class="tiny faint">${ago(l.at)}</span></span><span class="row">${srcPill(l.src)}${l.handle ? `<span class="tiny muted">${esc(l.handle)}</span>` : ""}</span><span class="msg">${esc(l.msg)}</span><span class="meta">${esc(l.ev || "")}${l.guests ? ` · ${l.guests} kishi` : ""}${l.date ? ` · ${fDate(l.date)}` : ""}</span></button>`;
}
MODALS.lead = m => {
  const l = LEAD(m.id);
  return mHead(esc(l.name), [SRC[l.src][0], l.handle, l.phone].filter(Boolean).map(esc).join(" · ")) + `<div class="m-body">
    <blockquote class="quote">${esc(l.msg)}</blockquote>
    <div class="facts">${fact("Tadbir", esc(l.ev || "—"))}${fact("Mehmonlar", l.guests ? l.guests + " kishi" : "—")}${fact("Sana", fDate(l.date))}${fact("Kelgan", ago(l.at))}</div>
    <div><span class="lbl">Holat</span><div class="seg">${LEAD_ORDER.map(s => `<button type="button" class="${l.status === s ? "on" : ""}" data-act="lead-status" data-id="${l.id}" data-st="${s}" aria-pressed="${l.status === s}">${LEAD_ST[s][0]}</button>`).join("")}</div></div>
    ${l.orderId ? `<div class="note good">${ic("check", 16)}<span>Buyurtma yaratilgan: <button type="button" class="link" data-act="open-order" data-id="${l.orderId}">${l.orderId}</button></span></div>` : ""}
    <div><span class="lbl">Tarix</span>${timeline(l.history)}</div>
    <form data-form="lead-note" data-id="${l.id}" class="row"><input name="text" class="grow" placeholder="Izoh: masalan, menyu yuborildi" aria-label="Izoh" required><button class="btn" type="submit">Qo‘shish</button></form>
  </div><footer class="m-foot">${l.orderId ? "" : `<button type="button" class="btn btn-primary" data-act="lead-to-order" data-id="${l.id}">Buyurtma yaratish</button>`}<button type="button" class="btn" data-act="close">Yopish</button></footer>`;
};
MODALS.newLead = () => mHead("Lead qo‘shish", "Qo‘lda kiritilgan so‘rov (telefon, sayt yoki Instagram)") + `<form data-form="new-lead"><div class="m-body">
  <div class="f-grid"><div class="field"><label for="nl-name">Ism</label><input id="nl-name" name="name" required></div><div class="field"><label for="nl-src">Manba</label><select id="nl-src" name="src">${Object.keys(SRC).map(k => opt(k, SRC[k][0], "tel")).join("")}</select></div><div class="field"><label for="nl-ph">Telefon yoki @akkaunt</label><input id="nl-ph" name="contact"></div></div>
  <div class="f-grid"><div class="field"><label for="nl-ev">Tadbir</label><select id="nl-ev" name="ev">${EVENTS.map(e => opt(e, e)).join("")}</select></div><div class="field"><label for="nl-g">Mehmonlar</label><input id="nl-g" name="guests" type="number" min="1" value="100"></div><div class="field"><label for="nl-d">Sana</label><input id="nl-d" name="date" type="date" value="${dAdd(21)}"></div></div>
  <div class="field"><label for="nl-msg">Xabar</label><textarea id="nl-msg" name="msg" placeholder="Mijoz nima so‘radi"></textarea></div>
</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`;
MODALS.newOrder = m => {
  const l = m.leadId ? LEAD(m.leadId) : null;
  return mHead("Yangi buyurtma", l ? `${esc(l.name)} leadidan` : "Mijozdan olingan buyurtma") + `<form data-form="new-order"${l ? ` data-lead="${l.id}"` : ""}><div class="m-body">
  <div class="f-grid"><div class="field"><label for="no-c">Mijoz</label><input id="no-c" name="customer" value="${esc(l ? l.name : "")}" required></div><div class="field"><label for="no-p">Telefon</label><input id="no-p" name="phone" type="tel" value="${esc(l ? l.phone : "")}" placeholder="+998 __ ___ __ __"></div></div>
  <div class="f-grid"><div class="field"><label for="no-e">Tadbir</label><select id="no-e" name="eventType">${EVENTS.map(e => opt(e, e, l && l.ev)).join("")}</select></div><div class="field"><label for="no-d">Sana</label><input id="no-d" name="date" type="date" value="${l && l.date ? l.date : dAdd(21)}" required></div><div class="field"><label for="no-g">Mehmonlar</label><input id="no-g" name="guests" type="number" min="1" value="${l && l.guests ? l.guests : 100}" required></div></div>
  <div class="f-grid"><div class="field"><label for="no-b">Byudjet, so‘m / kishi</label><input id="no-b" name="budget" type="number" min="0" step="1000" value="150000" required></div><div class="field"><label for="no-a">Hudud</label><select id="no-a" name="area">${AREAS.map(a => opt(a, a)).join("")}</select></div><div class="field"><label for="no-v">Joy</label><input id="no-v" name="venue" placeholder="To‘yxona yoki manzil"></div></div>
  <div class="field"><label for="no-n">Izoh</label><textarea id="no-n" name="notes" placeholder="Maxsus talablar">${esc(l ? l.msg : "")}</textarea></div>
</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Buyurtma yaratish</button></footer></form>`;
};

/* ---------- Buyurtmalar ---------- */
const ORD_GROUPS = { all: null, yangi: ["yangi"], jarayon: ["vendorlarda", "takliflar", "mijozda"], faol: ["tasdiqlandi", "bajarilmoqda"], yakun: ["yakunlandi", "bekor"] };
function vOrders() {
  const f = ui.ordFilter, g = ORD_GROUPS[f];
  const cnt = k => ORD_GROUPS[k] ? db.orders.filter(o => ORD_GROUPS[k].includes(o.status)).length : db.orders.length;
  const list = db.orders.filter(o => !g || g.includes(o.status)).sort((a, b) => b.createdAt - a.createdAt);
  const rows = list.map(o => {
    const sent = o.requests.length, ans = o.requests.filter(r => r.status === "javob").length;
    return `<tr class="click" data-act="open-order" data-id="${o.id}"><td><span class="mono">${o.id}</span></td><td>${esc(o.customer)}<small>${esc(o.eventType)}</small></td><td class="num">${fDate(o.date)}</td><td class="num r">${o.guests}</td><td class="num r">${num(o.budget)}</td><td>${pill(ORD_ST, o.status)}</td><td class="num">${sent ? `${ans} / ${sent} taklif` : "—"}</td><td>${o.vendorId ? esc(V(o.vendorId).name) : `<span class="faint">—</span>`}</td></tr>`;
  }).join("");
  return page(head("Buyurtmalar", "Mijoz buyurtmasi → vendorlarga yuborish → takliflar → mijozga yuborish → tasdiqlash.", `<button class="btn btn-primary" data-act="new-order">${ic("plus", 16)} Yangi buyurtma</button>`),
    chips([["all", "Hammasi", cnt("all")], ["yangi", "Yangi", cnt("yangi")], ["jarayon", "Jarayonda", cnt("jarayon")], ["faol", "Faol", cnt("faol")], ["yakun", "Yopilgan", cnt("yakun")]], f, "ord-filter") +
    (list.length ? `<div class="tbl"><table><thead><tr><th>ID</th><th>Mijoz</th><th>Sana</th><th class="r">Mehmon</th><th class="r">Byudjet / kishi</th><th>Holat</th><th>Takliflar</th><th>Ijrochi vendor</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty("Bu bo‘limda buyurtma yo‘q")));
}
function vOrder(id) {
  const o = ORD(id); if (!o) return page(head("Buyurtma topilmadi", ""), "");
  if (o.own) { const q = o.quote || {}, st = SET(q.setId); return page(head(`Vendorning o‘z buyurtmasi <span class="mono">${o.id}</span>`, `${esc(vName(o.vendorId))} · ${esc(o.eventType)} · ${fDateY(o.date)}`, `${pill(ORD_ST, o.status)}<button class="btn btn-sm" data-act="inv-v" data-k="${o.vendorId}">Vendor ombori</button>`, backBtn("vendors", "Vendorlar")),
    `<div class="note info">${ic("lock", 16)}<span>Bu buyurtma CaterFlow orqali kelmagan — vendor o‘z mijozidan olgan. Admin faqat ko‘radi, komissiya olinmaydi.</span></div>
    <section class="card"><dl class="dl"><dt>Vendor</dt><dd>${esc(vName(o.vendorId))}</dd><dt>Mijoz</dt><dd>${esc(o.customer)}</dd><dt>Mehmonlar</dt><dd class="num">${o.guests} kishi</dd><dt>Set</dt><dd>${esc(st ? st.name : "—")} · ${som(q.pp || 0)} / kishi</dd><dt>Joy</dt><dd>${esc(o.venue || "—")}</dd></dl></section>${orderInvCard(o)}<section class="card"><div class="card-h"><h2>Tarix</h2></div>${timeline(o.history)}</section>`); }
  const quotes = o.requests.filter(r => r.status === "javob");
  const minPP = quotes.length ? Math.min(...quotes.map(r => r.quote.pp)) : 0;
  const canSend = !["tasdiqlandi", "bajarilmoqda", "yakunlandi", "bekor"].includes(o.status);
  const reqRows = o.requests.map(r => {
    const v = V(r.vendorId), q = r.quote, s = q ? SET(q.setId) : null;
    const diff = q ? (q.pp - o.budget) / o.budget : 0;
    return `<tr><td><button type="button" class="link" data-act="open-vendor" data-id="${v.id}">${esc(v.name)}</button><small>yuborildi ${ago(r.sentAt)}</small></td><td>${pill(REQ_ST, r.status)}${r.reason ? `<small>${esc(r.reason)}</small>` : ""}</td>
      <td>${s ? esc(s.name) : "—"}${q && q.note ? `<small>${esc(q.note)}</small>` : ""}</td>
      <td class="num r">${q ? `${som(q.pp)}${q.pp === minPP && quotes.length > 1 ? `<small class="good-t">eng arzon</small>` : `<small>${diff > 0 ? "+" : ""}${pct(diff)} byudjetdan</small>`}` : "—"}</td>
      <td class="num r">${q ? mln(q.pp * o.guests) : "—"}</td><td class="small">${q ? q.includes.map(esc).join(", ") || "—" : "—"}</td>
      <td>${q ? (canSend ? `<label class="check"><input type="checkbox" name="tocust" value="${v.id}" ${r.toCustomer || !o.token ? "checked" : ""}> Mijozga</label>` : (r.toCustomer ? `<span class="tiny muted">Mijozga yuborilgan</span>` : "")) : ""}</td></tr>`;
  }).join("");
  const link = o.token ? `<div class="stack-s"><span class="lbl">Mijoz havolasi</span><div class="linkbox"><span>${esc(custURL("offer", { token: o.token, order: o.id }) || `caterflow.uz/t/${o.token}`)}</span><button type="button" class="icon-btn" data-act="copy" data-text="${esc(custURL("offer", { token: o.token, order: o.id }) || `https://caterflow.uz/t/${o.token}`)}" aria-label="Havolani nusxalash">${ic("copy", 16)}</button></div><button type="button" class="btn btn-sm" data-act="cust-view" data-id="${o.id}">${ic("globe", 16)} Mijoz ko‘radigan sahifani ochish</button></div>` : "";
  const assign = canSend || o.status === "tasdiqlandi" ? `<div class="stack-s"><label class="lbl" for="assign-${o.id}">Vendorni qo‘lda biriktirish</label><div class="row"><select id="assign-${o.id}" class="grow">${opt("", "Tanlang")}${db.vendors.map(v => opt(v.id, v.name, o.vendorId)).join("")}</select><button type="button" class="btn btn-sm" data-act="assign" data-id="${o.id}">Biriktirish</button></div></div>` : "";
  return page(head(`Buyurtma <span class="mono">${o.id}</span>`, `${esc(o.customer)} · ${esc(o.eventType)} · ${fDateY(o.date)}`, `${pill(ORD_ST, o.status)}${canSend ? `<button class="btn btn-primary" data-act="dispatch" data-id="${o.id}">${ic("send", 16)} Vendorlarga yuborish</button>` : ""}${!["yakunlandi", "bekor"].includes(o.status) ? `<button class="btn btn-danger btn-ghost" data-act="cancel-order" data-id="${o.id}">Bekor qilish</button>` : ""}`, backBtn("orders", "Buyurtmalar")),
    `<div class="g g-21">
      <section class="card"><div class="card-h"><h2>Buyurtma ma’lumotlari</h2></div><dl class="dl"><dt>Mijoz</dt><dd>${esc(o.customer)}</dd><dt>Telefon</dt><dd>${esc(o.phone || "—")}</dd><dt>Tadbir</dt><dd>${esc(o.eventType)}</dd><dt>Sana</dt><dd>${fDateY(o.date)}</dd><dt>Mehmonlar</dt><dd class="num">${o.guests} kishi</dd><dt>Byudjet</dt><dd class="num">${som(o.budget)} / kishi · jami ≈ ${mln(o.budget * o.guests)} so‘m</dd><dt>Hudud</dt><dd>${esc(o.area)}</dd><dt>Joy</dt><dd>${esc(o.venue || "—")}</dd><dt>Izoh</dt><dd>${esc(o.notes || "—")}</dd>${o.leadId ? `<dt>Lead</dt><dd><button type="button" class="link" data-act="open-lead" data-id="${o.leadId}">${esc(LEAD(o.leadId)?.name || o.leadId)}</button></dd>` : ""}</dl></section>
      <section class="card stack"><div><span class="lbl">Ijrochi vendor</span>${o.vendorId ? `<p><strong>${esc(V(o.vendorId).name)}</strong></p><p class="small muted">${orderQuote(o) ? som(orderQuote(o).pp) + " / kishi · jami " + mln(orderValue(o)) + " so‘m" : ""}</p>` : `<p class="muted">Hali tanlanmagan</p>`}</div>${assign}${link}</section>
    </div>
    <section class="card"><div class="card-h"><div><h2>Vendor so‘rovlari va takliflar</h2><p class="small muted">Yaxshi takliflarni belgilab, mijozga bitta havola bilan yuboring.</p></div>${quotes.length && canSend ? `<button class="btn btn-primary" data-act="send-customer" data-id="${o.id}">${ic("send", 16)} Belgilanganlarni mijozga yuborish</button>` : ""}</div>
      ${o.requests.length ? `<div class="tbl"><table><thead><tr><th>Vendor</th><th>Holat</th><th>Set</th><th class="r">Narx / kishi</th><th class="r">Jami</th><th>Narxga kiradi</th><th></th></tr></thead><tbody>${reqRows}</tbody></table></div>` : empty("Buyurtma hali vendorlarga yuborilmagan. Yuqoridagi “Vendorlarga yuborish” tugmasini bosing.")}</section>
    <div class="g g-2">${o.vendorId ? payCard(o, "admin") : `<section class="card"><div class="card-h"><h2>Mijoz to‘lovlari</h2></div><p class="small faint">Vendor tanlangandan keyin vendor avans va qoldiqni qayd etadi.</p></section>`}${chatBox(o, "admin")}</div>
    ${orderInvCard(o)}
    <section class="card"><div class="card-h"><h2>Tarix</h2></div>${timeline(o.history)}</section>`);
}
MODALS.dispatch = m => {
  const o = ORD(m.id), sent = new Set(o.requests.map(r => r.vendorId));
  const rows = db.vendors.map(v => {
    const reasons = ruleCheck(v, o), was = sent.has(v.id);
    const st = was ? `<span class="small faint">Avval yuborilgan</span>` : reasons.length ? `<span class="small bad-t">Avtomatik rad bo‘ladi: ${esc(reasons.join("; "))}</span>` : `<span class="small good-t">Shartlarga mos</span>`;
    return `<label class="vrow ${was ? "dis" : ""}"><input type="checkbox" name="v" value="${v.id}" ${was ? "disabled" : ""} ${!was && !reasons.length ? "checked" : ""}><span class="grow stack-s" style="gap:2px"><span><strong>${esc(v.name)}</strong> <span class="tiny muted">· ${esc(v.district)} · javob berish ${pct(respRate(v.id))}</span></span>${st}</span></label>`;
  }).join("");
  return mHead(`${o.id}: vendorlarga yuborish`, `${esc(o.eventType)} · ${fDate(o.date)} · ${o.guests} kishi · ${num(o.budget)} so‘m/kishi · ${esc(o.area)}`) + `<form data-form="dispatch" data-id="${o.id}"><div class="m-body">
    <div class="note ${db.settings.autoReject ? "info" : "warn"}">${ic("sliders", 16)}<span>${db.settings.autoReject ? "Avto rad etish yoqilgan: shartlarga mos kelmagan vendorga so‘rov borgan zahoti avtomatik rad etiladi va sababi yoziladi." : "Avto rad etish o‘chirilgan, faqat yopilgan vendorlar rad etiladi."} <button type="button" class="link" data-act="go" data-view="settings">Sozlamalar</button></span></div>
    <div class="stack-s">${rows}</div></div>
    <footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">${ic("send", 16)} Yuborish</button></footer></form>`;
};

/* ---------- Vendor sahifasi (vVendors — afinance.js da) ---------- */
const VTABS = [["umumiy", "Umumiy"], ["buyurtmalar", "Buyurtmalar"], ["mijozlar", "Mijozlar bazasi"], ["ombor", "Ombor"], ["leadlar", "O‘z leadlari"], ["menyu", "Menyu va setlar"], ["moliya", "Moliya"], ["jamoa", "Jamoa va vazifalar"]];
function vVendorDetail(id) {
  const v = V(id); if (!v) return page(head("Vendor topilmadi", ""), "");
  let body = "";
  switch (ui.vTab) {
    case "buyurtmalar": {
      const rs = vendorReqs(id).sort((a, b) => b.r.sentAt - a.r.sentAt);
      body = rs.length ? `<div class="tbl"><table><thead><tr><th>Buyurtma</th><th>Sana</th><th class="r">Mehmon</th><th>So‘rov</th><th class="r">Taklif / kishi</th><th>Buyurtma holati</th></tr></thead><tbody>${rs.map(({ o, r }) => `<tr class="click" data-act="open-order" data-id="${o.id}"><td><span class="mono">${o.id}</span><small>${esc(o.eventType)} · ${esc(o.customer)}</small></td><td class="num">${fDate(o.date)}</td><td class="num r">${o.guests}</td><td>${pill(REQ_ST, r.status)}${o.vendorId === id ? `<small class="good-t">ijrochi</small>` : ""}</td><td class="num r">${r.quote ? num(r.quote.pp) : "—"}</td><td>${pill(ORD_ST, o.status)}</td></tr>`).join("")}</tbody></table></div>` : empty("Bu vendorga hali so‘rov yuborilmagan");
      break;
    }
    case "mijozlar": body = vCustomers(id, true); break;
    case "ombor": body = `<div class="row"><button type="button" class="btn btn-sm btn-primary" data-act="inv-v" data-k="${id}">${ic("box", 16)} Ombor nazoratida ochish: rezerv, chiqindi, audit</button></div>` + vStock(id, true); break;
    case "leadlar": body = vMyLeads(id, true); break;
    case "menyu": body = vMenu(id, "admin"); break;
    case "moliya": body = vFinance(id, true); break;
    case "jamoa": { const st = staffOf(id), ts = db.tasks.filter(t => t.vendorId === id).sort((a, b) => b.at - a.at); body = `<div class="g g-2"><section class="card"><div class="card-h"><h2>Jamoa</h2><span class="small muted">${st.length} kishi</span></div><ul class="feed">${st.map(x => `<li><span class="row">${avatar(x)} ${esc(x.name)}</span>${rolePill(x.role)}</li>`).join("")}</ul></section><section class="card"><div class="card-h"><h2>Vazifalar</h2><button class="btn btn-sm btn-primary" data-act="task-new" data-vid="${id}">${ic("send", 16)} Vazifa berish</button></div><div class="stack-s">${ts.slice(0, 8).map(taskCard).join("") || empty("Vazifa yo‘q")}</div></section></div>`; break; }
    default: {
      const R = v.rules, cs = db.customers.filter(c => c.vendorId === id);
      const act = db.orders.filter(o => o.vendorId === id && ["tasdiqlandi", "bajarilmoqda"].includes(o.status)).length;
      body = `<div class="g g-kpi">${kpi("Faol buyurtmalar", act)}${kpi("Javob berish", pct(respRate(id)), `${vendorReqs(id).length} ta so‘rovdan`)}${kpi("Faol mijozlar", `${cs.filter(c => custStats(c).active).length} / ${cs.length}`, "oxirgi 90 kunda buyurtma bergan")}${kpi("Reyting", avgRating(fbFor(id)).toFixed(1).replace(".", ","), `${fbFor(id).length} ta fikr`)}</div>
      <div class="g g-2"><section class="card"><div class="card-h"><h2>Aloqa</h2></div><dl class="dl"><dt>Mas’ul</dt><dd>${esc(v.contact)}</dd><dt>Telefon</dt><dd>${esc(v.phone)}</dd><dt>Viloyat</dt><dd>${esc(v.region)}, ${esc(v.district)}</dd><dt>Hamkor</dt><dd>${fDateY(v.since)} dan</dd><dt>Login</dt><dd class="mono">${esc(v.login)}</dd></dl></section>
      ${bonusCard(id, true)}<section class="card"><div class="card-h"><h2>Avto rad etish qoidalari</h2><button class="btn btn-sm" data-act="go" data-view="settings">Tahrirlash</button></div><dl class="dl"><dt>Mehmonlar</dt><dd class="num">${R.minGuests} – ${R.maxGuests}</dd><dt>Minimal narx</dt><dd class="num">${som(R.minPP)} / kishi</dd><dt>Hududlar</dt><dd>${R.areas.map(esc).join(", ")}</dd><dt>Band sanalar</dt><dd>${R.blocked.length ? R.blocked.map(fDate).join(", ") : "—"}</dd><dt>Holat</dt><dd>${v.closed ? `<span class="pill t-bad">Yopiq</span> ${esc(v.closedReason)}` : `<span class="pill t-good">So‘rov qabul qiladi</span>`}</dd></dl></section></div>`;
    }
  }
  return page(head(esc(v.name), `${esc(v.contact)} · ${esc(v.phone)} · ${esc(v.district)}`, `${v.closed ? `<span class="pill t-bad">Yopiq</span>` : `<span class="pill t-good">Faol</span>`}<button class="btn btn-sm" data-act="task-new" data-vid="${v.id}">${ic("send", 16)} Vazifa berish</button><button class="btn btn-sm" data-act="cust-vendor" data-id="${v.id}">${ic("globe", 16)} Ochiq sahifasi</button>`, backBtn("vendors", "Vendorlar")),
    tabs(VTABS, ui.vTab, "vtab") + body);
}

/* ---------- Vendor leadlari (nazorat) ---------- */
function vVLeads() {
  const stale = l => VL_OPEN(l.status) && (Date.now() - l.updatedAt) > 3 * 864e5;
  const cards = db.vendors.map(v => {
    const ls = db.ownLeads.filter(l => l.vendorId === v.id), open = ls.filter(l => VL_OPEN(l.status));
    const won = ls.filter(l => l.status === "kelishildi").length, lost = ls.filter(l => l.status === "yoqotildi").length;
    const last = ls.reduce((m, l) => Math.max(m, l.updatedAt), 0), st = ls.filter(stale).length;
    return `<div class="vcard"><div class="row between"><strong>${esc(v.name)}</strong><span class="tiny faint">oxirgi harakat ${last ? ago(last) : "—"}</span></div><div class="minis"><span>Jami: <b>${ls.length}</b></span><span>Jarayonda: <b>${open.length}</b></span><span>Kelishildi: <b>${won}</b></span><span>Konversiya: <b>${won + lost ? pct(won / (won + lost)) : "—"}</b></span></div>${st ? `<span class="pill t-saffron">${st} ta lead 3 kundan beri harakatsiz</span>` : `<span class="pill t-good">Harakatsiz lead yo‘q</span>`}<div class="minis">${open.map(l => `<span>${pill(VL_ST, l.status)}</span>`).join("")}</div></div>`;
  }).join("");
  let list = db.ownLeads.filter(l => ui.vlVendor === "all" || l.vendorId === ui.vlVendor);
  if (ui.vlStatus === "open") list = list.filter(l => VL_OPEN(l.status)); else if (ui.vlStatus !== "all") list = list.filter(l => l.status === ui.vlStatus);
  list.sort((a, b) => a.updatedAt - b.updatedAt);
  const rows = list.map(l => `<tr class="click" data-act="open-vlead" data-id="${l.id}"><td>${esc(V(l.vendorId).name)}</td><td>${esc(l.name)}<small>${esc(l.source)}</small></td><td>${esc(l.ev)}<small>${l.guests} kishi · ${fDate(l.date)}</small></td><td class="num r">${mln(l.value)}</td><td>${pill(VL_ST, l.status)}</td><td class="num">${ago(l.updatedAt)}${stale(l) ? `<small class="warn-t">harakatsiz</small>` : ""}</td><td class="small">${esc(l.log[l.log.length - 1]?.text || "")}</td></tr>`).join("");
  return page(head("Vendor leadlari", "Vendorlar CaterFlow’dan tashqari topgan mijozlari bilan nima qilyapti. Faqat ko‘rish uchun, eng uzoq harakatsiz turganlari tepada."),
    `<div class="vboard">${cards}</div>
    <div class="row"><div class="field"><label for="vl-v">Vendor</label><select id="vl-v" data-change="vl-vendor">${opt("all", "Barcha vendorlar", ui.vlVendor)}${db.vendors.map(v => opt(v.id, v.name, ui.vlVendor)).join("")}</select></div><div class="field"><label for="vl-s">Holat</label><select id="vl-s" data-change="vl-status">${opt("open", "Jarayondagilar", ui.vlStatus)}${opt("all", "Hammasi", ui.vlStatus)}${VL_ORDER.map(s => opt(s, VL_ST[s][0], ui.vlStatus)).join("")}</select></div></div>
    ${list.length ? `<div class="tbl"><table><thead><tr><th>Vendor</th><th>Mijoz</th><th>Tadbir</th><th class="r">Kutilgan summa</th><th>Holat</th><th>Oxirgi harakat</th><th>Oxirgi izoh</th></tr></thead><tbody>${rows}</tbody></table></div>` : empty("Tanlangan filtr bo‘yicha lead yo‘q")}`);
}

/* ---------- Sozlamalar ---------- */
function vSettings() {
  const s = db.settings;
  const vcards = db.vendors.map(v => {
    const R = v.rules;
    return `<section class="card"><div class="card-h"><h3>${esc(v.name)}</h3>${v.closed ? `<span class="pill t-bad">Yopiq</span>` : `<span class="pill t-good">So‘rov qabul qiladi</span>`}</div><div class="rules">
      <div class="f-grid"><div class="field"><label for="r-${v.id}-min">Min. mehmon</label><input id="r-${v.id}-min" type="number" min="0" value="${R.minGuests}" data-change="rule" data-id="${v.id}" data-key="minGuests"></div><div class="field"><label for="r-${v.id}-max">Maks. mehmon</label><input id="r-${v.id}-max" type="number" min="0" value="${R.maxGuests}" data-change="rule" data-id="${v.id}" data-key="maxGuests"></div><div class="field"><label for="r-${v.id}-pp">Min. narx, so‘m / kishi</label><input id="r-${v.id}-pp" type="number" min="0" step="1000" value="${R.minPP}" data-change="rule" data-id="${v.id}" data-key="minPP"></div></div>
      <div><span class="lbl">Xizmat hududlari</span><div class="row">${AREAS.map((a, i) => `<label class="check"><input type="checkbox" ${R.areas.includes(a) ? "checked" : ""} data-change="rule-area" data-id="${v.id}" data-area="${esc(a)}" id="r-${v.id}-a${i}"> ${esc(a)}</label>`).join("")}</div></div>
      <div><span class="lbl">Band sanalar</span><div class="row">${R.blocked.map(d => `<span class="chipx">${fDateY(d)}<button type="button" data-act="rm-blocked" data-id="${v.id}" data-date="${d}" aria-label="${fDate(d)} sanani o‘chirish">${ic("x", 14)}</button></span>`).join("")}<input type="date" id="bd-${v.id}" style="width:auto" aria-label="Band sana"><button type="button" class="btn btn-sm" data-act="add-blocked" data-id="${v.id}">Qo‘shish</button></div></div>
      <div class="stack-s"><label class="switch"><input type="checkbox" ${v.closed ? "checked" : ""} data-change="rule-closed" data-id="${v.id}" id="r-${v.id}-cl"> Vendorni yopish: barcha yangi so‘rovlar avtomatik rad etiladi</label>
      ${v.closed ? `<div class="f-grid"><div class="field"><label for="r-${v.id}-cr">Sabab</label><input id="r-${v.id}-cr" value="${esc(v.closedReason)}" data-change="rule" data-id="${v.id}" data-key="closedReason"></div><div class="field"><label for="r-${v.id}-cu">Qachongacha</label><input id="r-${v.id}-cu" type="date" value="${v.closedUntil}" data-change="rule" data-id="${v.id}" data-key="closedUntil"></div></div>` : ""}</div>
    </div></section>`;
  }).join("");
  return page(head("Sozlamalar", "O‘zgarishlar darhol saqlanadi."),
    `<section class="card"><div class="card-h"><div><h2>Instagram integratsiyasi</h2><p class="small muted">${s.igConnected ? `${esc(s.igAccount)} · demo rejim. Haqiqiy ulanish Meta API tayyor bo‘lgach yoqiladi.` : "Ulanmagan"}</p></div>${s.igConnected ? `<button class="btn btn-sm btn-danger" data-act="ig-off">Uzish</button>` : `<button class="btn btn-sm btn-primary" data-act="ig-connect">Ulash</button>`}</div>
      <div class="stack-s"><label class="switch"><input type="checkbox" ${s.igDM ? "checked" : ""} data-change="setting" data-key="igDM" id="s-igdm"> Direct xabarlardan lead yaratish</label><label class="switch"><input type="checkbox" ${s.igAds ? "checked" : ""} data-change="setting" data-key="igAds" id="s-igads"> Lead Ads formalaridan lead yaratish</label><button type="button" class="link" data-act="ig-connect" style="align-self:flex-start">Haqiqiy ulanish uchun nima kerak?</button></div></section>
    <section class="card"><div class="card-h"><div><h2>Yangi vendor bonusi</h2><p class="small muted">Yangi qo‘shilgan vendorga beriladi. CaterFlow buyurtmalari komissiyasi avval bonusdan yechiladi, tugagach vendor ${String(s.commission).replace(".", ",")}% ni o‘zi to‘laydi.</p></div></div><div class="f-grid"><div class="field"><label for="s-bn">Bonus summasi, so‘m</label><input id="s-bn" type="number" min="0" step="50000" value="${s.bonusAmount || 0}" data-change="setting-num" data-key="bonusAmount"></div></div><label class="switch" style="margin-top:10px"><input type="checkbox" ${s.bonusAuto ? "checked" : ""} data-change="setting" data-key="bonusAuto" id="s-bna"> Yangi vendor qo‘shilganda avtomatik berish</label><p class="small muted" style="margin-top:8px">Mavjud vendorlarga qo‘shimcha bonusni Vendorlar yoki Moliya sahifasidagi “Bonus” tugmasi bilan berasiz.</p></section>
    <section class="card"><div class="card-h"><h2>Komissiya</h2></div><div class="f-grid"><div class="field"><label for="s-com">CaterFlow komissiyasi, %</label><input id="s-com" type="number" min="0" max="50" step="0.5" value="${s.commission}" data-change="setting-num" data-key="commission"></div></div><p class="small muted" style="margin-top:8px">Vendor P&amp;L’ida CaterFlow orqali kelgan daromaddan avtomatik xarajat sifatida hisoblanadi.</p></section>
    <section class="stack"><div class="row between"><div><h2>Avto rad etish</h2><p class="small muted">So‘rov vendor shartlariga mos kelmasa yoki vendor yopilgan bo‘lsa, so‘rov avtomatik rad etiladi va sababi yoziladi.</p></div><label class="switch"><input type="checkbox" ${s.autoReject ? "checked" : ""} data-change="setting" data-key="autoReject" id="s-auto"> Shartlar bo‘yicha rad etish</label></div><div class="g g-2">${vcards}</div></section>
    <section class="card"><div class="card-h"><div><h2>Demo ma’lumotlar</h2><p class="small muted">Prototipdagi barcha o‘zgarishlar shu brauzerda saqlanadi. Boshlang‘ich holatga qaytarish mumkin.</p></div><button class="btn btn-sm" data-act="reset-ask">${ic("refresh", 16)} Qaytarish</button></div></section>`);
}
MODALS.ig = () => mHead("Instagram’ni ulash", "Prototipda demo rejim ishlaydi. Haqiqiy ulanish keyingi bosqichda.") + `<div class="m-body">
  <div><span class="lbl">Haqiqiy ulanish uchun kerak bo‘ladi</span><ul class="dots"><li>Instagram Business (yoki Creator) akkaunt</li><li>Shu akkauntga ulangan Facebook sahifa</li><li>Meta for Developers’da ilova (app) va Instagram API + Webhooks</li><li>Direct xabarlar va Lead Ads uchun ruxsatlar, Meta App Review’dan o‘tish</li><li>Serverda webhook manzili: yangi xabar yoki forma kelganda lead yaratiladi</li></ul></div>
  <div class="note info">${ic("alert", 16)}<span>Demo rejimda “Demo: yangi lead” tugmasi Instagram’dan xabar kelgandek lead yaratadi.</span></div>
</div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yopish</button>${db.settings.igConnected ? "" : `<button type="button" class="btn btn-primary" data-act="ig-on">Demo rejimda ulash</button>`}</footer>`;
MODALS.confirm = m => mHead(m.title, "") + `<div class="m-body"><p>${m.text}</p></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Yo‘q</button><button type="button" class="btn ${m.danger ? "btn-danger" : "btn-primary"}" data-act="confirm-yes">${m.yes}</button></footer>`;
