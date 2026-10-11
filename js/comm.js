/* CaterFlow prototip — chat, mijoz to‘lovlari, mijoz bildirishnomalari (Telegram nusxasi), fikrlar moderatsiyasi */
"use strict";
const CLI = id => (db.clients || []).find(c => c.id === id);
const PAY_KIND = { avans: ["Avans", "advance"], qoldiq: ["Qoldiq to‘lovi", "balance"], qaytarish: ["Qaytarildi", "refund"] };
const PAY_M = ["Naqd", "Karta (terminal)", "Bank o‘tkazmasi", "Click", "Payme"];
const FB_ST = { published: ["Chiqarilgan", "good"], pending: ["Moderatsiyada", "saffron"], hidden: ["Yashirilgan", "neutral"] };

/* ---------- mijoz bildirishnomalari + Telegram (demo) ---------- */
function cnotify(cid, text, link) {
  if (!cid) return; db.cnotifs.unshift({ id: uid("cn"), clientId: cid, at: Date.now(), text, link: link || null, read: false });
  const c = CLI(cid); if (c && c.tg) db.tglog.unshift({ id: uid("tg"), clientId: cid, at: Date.now(), text });
}
const cUnread = cid => db.cnotifs.filter(n => n.clientId === cid && !n.read).length;

/* ---------- to‘lovlar ---------- */
function orderTotal(o) { const q = o.own ? o.quote : (o.vendorId ? orderQuote(o) : null); return q ? q.pp * o.guests : 0; }
function payOf(o) { const ps = db.custPays.filter(p => p.orderId === o.id).sort((a, b) => a.date.localeCompare(b.date)), paid = ps.reduce((a, p) => a + (p.kind === "qaytarish" ? -p.amount : p.amount), 0), total = orderTotal(o); return { ps, paid, total, left: Math.max(0, total - paid), pct: total ? Math.min(1, paid / total) : 0 }; }
function payCard(o, who) {
  const p = payOf(o), canAdd = who === "vendor" && !["bekor"].includes(o.status);
  const kindL = k => who === "client" ? t({ avans: "advance", qoldiq: "balance", qaytarish: "refund" }[k]) : PAY_KIND[k][0];
  const L = who === "client" ? { title: t("pay_title"), paid: t("paid"), left: t("remaining"), total: t("total"), none: t("no_pays") } : { title: "Mijoz to‘lovlari", paid: "To‘langan", left: "Qoldiq", total: "Jami", none: "Hali to‘lov qayd etilmagan" };
  const money2 = who === "client" ? tSom : som;
  return `<section class="card"><div class="card-h"><h2>${L.title}</h2>${canAdd ? `<button type="button" class="btn btn-sm btn-primary" data-act="cpay-new" data-id="${o.id}">${ic("plus", 16)} To‘lov qayd etish</button>` : ""}</div>
    <div class="live">${money(L.total, money2(p.total))}${money(L.paid, money2(p.paid), p.paid ? "good" : "")}${money(L.left, money2(p.left), p.left ? "warn" : "good")}</div>
    <div class="prog" style="margin-top:10px"><span style="width:${p.pct * 100}%"></span></div>
    ${p.ps.length ? `<ul class="feed" style="margin-top:8px">${p.ps.map(x => `<li><span><strong>${esc(kindL(x.kind))}</strong> · ${esc(x.method)}${x.note ? `<span class="block tiny faint">${esc(x.note)}</span>` : ""}</span><time class="num">${x.kind === "qaytarish" ? "−" : ""}${money2(x.amount)}<span class="block">${who === "client" ? tDate(x.date) : fDate(x.date)}</span></time></li>`).join("")}</ul>` : `<p class="small faint" style="margin-top:8px">${L.none}</p>`}
    ${who === "client" && p.left > 0 && o.vendorId ? `<button type="button" class="btn btn-block" disabled style="margin-top:12px">${ic("wallet", 16)} ${t("pay_online")} · ${t("soon")}</button><p class="tiny muted" style="margin-top:6px">${t("pay_note")}</p>` : ""}
    ${who !== "client" ? `<p class="tiny muted" style="margin-top:8px">Online to‘lov (Click / Payme) ulanganda to‘lovlar shu yerga avtomatik tushadi va komissiya ushlab qolinadi.</p>` : ""}</section>`;
}
MODALS.cpay = m => {
  const o = ORD(m.id), p = payOf(o), first = !p.ps.length;
  return mHead(`${o.id}: mijoz to‘lovi`, `Jami ${som(p.total)} · to‘langan ${som(p.paid)} · qoldiq ${som(p.left)}`) + `<form data-form="cpay" data-id="${o.id}"><div class="m-body"><div class="f-grid">
    <div class="field"><label for="cp-k">Turi</label><select id="cp-k" name="kind">${Object.keys(PAY_KIND).map(k => opt(k, PAY_KIND[k][0], first ? "avans" : "qoldiq")).join("")}</select></div>
    <div class="field"><label for="cp-a">Summa, so‘m</label><input id="cp-a" name="amount" type="number" min="1000" step="1000" value="${first ? Math.round(p.total * 0.3 / 1000) * 1000 : p.left}" required></div>
    <div class="field"><label for="cp-m">Usul</label><select id="cp-m" name="method">${PAY_M.map(x => opt(x, x)).join("")}</select></div><div class="field"><label for="cp-d">Sana</label><input id="cp-d" name="date" type="date" value="${today()}" required></div></div>
    <div class="field"><label for="cp-n">Izoh</label><input id="cp-n" name="note" placeholder="Masalan: 30% avans, kvitansiya №124"></div>
    <p class="small muted">Mijoz to‘lovni o‘z kabinetida ko‘radi va unga bildirishnoma boradi.</p></div>
    <footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`;
};

/* ---------- chat ---------- */
function chatOf(oid) { let c = db.chats.find(x => x.orderId === oid); if (!c) { c = { orderId: oid, msgs: [] }; db.chats.push(c); } return c; }
function chatName(m, o, viewer) {
  if (m.from === viewer) return viewer === "client" ? t("you") : "Siz";
  if (m.from === "client") return o.customer;
  if (m.from === "admin") return viewer === "client" ? t("cf_manager") : "CaterFlow menejeri";
  return V(o.vendorId) ? V(o.vendorId).name : "Vendor";
}
function chatSend(o, from, text) {
  chatOf(o.id).msgs.push({ id: uid("cm"), at: Date.now(), from, text });
  const who = from === "client" ? o.customer : from === "admin" ? "CaterFlow" : (V(o.vendorId) || {}).name;
  if (from !== "client" && o.clientId) cnotify(o.clientId, `${who}: ${text.slice(0, 80)}`, { view: "c-order", param: o.id });
  if (from !== "vendor" && o.vendorId && !o.own) notify(o.vendorId, `${o.id} chat · ${who}: ${text.slice(0, 60)}`, { view: "vorder", param: o.id });
  if (from !== "admin") log(from === "client" ? "mijoz" : o.vendorId, `${o.id} chatida yangi xabar`);
}
function chatBox(o, viewer) {
  const c = chatOf(o.id), cl = viewer === "client", withV = !!o.vendorId;
  const title = cl ? (withV ? t("chat_with_v") : t("chat_with_cf")) : viewer === "vendor" ? "Mijoz va CaterFlow bilan chat" : `Chat: mijoz${withV ? `, ${esc(vName(o.vendorId))}` : ""} va CaterFlow`;
  return `<section class="card"><div class="card-h"><h2>${cl ? t("chat") : "Chat"}</h2><span class="small muted">${title}</span></div>
    <div class="chat" id="chat-${o.id}">${c.msgs.length ? c.msgs.map(m => `<div class="bub ${m.from === viewer ? "me" : m.from === "admin" ? "cf" : ""}"><span class="who tiny">${esc(chatName(m, o, viewer))} · ${fDT(m.at)}</span><span>${esc(m.text)}</span></div>`).join("") : `<p class="small faint">${cl ? t("no_msgs") : "Hali xabar yo‘q"}</p>`}</div>
    <form data-form="chat" data-id="${o.id}" data-from="${viewer}" class="row" style="margin-top:10px"><label class="vh" for="ch-${o.id}">${cl ? t("write") : "Xabar"}</label><input id="ch-${o.id}" name="text" class="grow" placeholder="${cl ? t("write") : "Xabar yozing…"}" autocomplete="off" required><button class="btn btn-primary" type="submit">${ic("send", 16)}</button></form>
    ${viewer === "vendor" && !withV ? "" : ""}${!cl && !withV ? `<p class="tiny muted" style="margin-top:6px">Vendor tanlanguncha mijoz faqat CaterFlow bilan yozishadi.</p>` : ""}</section>`;
}

/* ---------- fikrlar moderatsiyasi (admin) ---------- */
const fbPublic = f => !f.status || f.status === "published";
function vFeedbackAdmin() {
  const sf = ui.fbF || "all", vf = ui.fbV || "", all = db.feedback.filter(f => !vf || f.vendorId === vf).sort((a, b) => b.at - a.at);
  const list = all.filter(f => sf === "all" || (f.status || "published") === sf);
  const cnt = k => all.filter(f => (f.status || "published") === k).length;
  return page(head("Fikrlar", "Mijozlar fikrini moderatsiya qilish. Yashirilgan va moderatsiyadagi fikrlar saytda ko‘rinmaydi va reytingga kirmaydi."),
    `<section class="card"><div class="row between"><div><h2>Moderatsiya rejimi</h2><p class="small muted">${db.settings.fbMode === "pre" ? "Har bir fikr admin tasdiqlagandan keyin chiqadi." : "Fikr darhol chiqadi, admin keyin yashira oladi."}</p></div><div class="seg">${[["post", "Darhol chiqadi"], ["pre", "Avval tasdiqlash"]].map(([k, l]) => `<button type="button" class="${(db.settings.fbMode || "post") === k ? "on" : ""}" data-act="fb-mode" data-k="${k}" aria-pressed="${(db.settings.fbMode || "post") === k}">${l}</button>`).join("")}</div></div></section>
    <div class="row between">${chips([["all", "Hammasi", all.length], ["pending", "Moderatsiyada", cnt("pending")], ["published", "Chiqarilgan", cnt("published")], ["hidden", "Yashirilgan", cnt("hidden")]], sf, "fb-f")}<div class="field"><label class="vh" for="fb-v">Vendor</label><select id="fb-v" data-change="fb-v" style="width:auto">${opt("", "Barcha vendorlar", vf)}${db.vendors.map(v => opt(v.id, v.name, vf)).join("")}</select></div></div>
    ${list.length ? `<div class="stack">${list.map(f => { const st = f.status || "published", s = SET(f.setId); return `<article class="card fbcard"><div class="row between"><span class="row">${stars(f.rating)}<strong>${esc(f.author)}</strong>${f.orderId ? `<span class="pill t-good">${ic("check", 12)} Tasdiqlangan mijoz · ${f.orderId}</span>` : `<span class="pill t-neutral">tasdiqlanmagan</span>`}</span><span class="row">${pill(FB_ST, st)}<span class="tiny faint">${ago(f.at)} · ${({ link: "taklif havolasi", profil: "ochiq sahifa", kabinet: "kabinet" })[f.via] || f.via}</span></span></div>
      <p class="small muted">${esc(vName(f.vendorId))} · ${esc(s ? s.name : "")}</p><p>${esc(f.text)}</p>${f.reply ? `<div class="reply"><span class="tiny faint">Vendor javobi · ${ago(f.reply.at)}</span><p class="small">${esc(f.reply.text)}</p></div>` : ""}
      <div class="row">${st !== "published" ? `<button type="button" class="btn btn-sm btn-primary" data-act="fb-set" data-id="${f.id}" data-k="published">${st === "pending" ? "Tasdiqlash" : "Qayta ko‘rsatish"}</button>` : ""}${st !== "hidden" ? `<button type="button" class="btn btn-sm" data-act="fb-set" data-id="${f.id}" data-k="hidden">Yashirish</button>` : ""}</div></article>`; }).join("")}</div>` : empty("Fikr yo‘q")}`);
}
MODALS.fbReply = m => { const f = db.feedback.find(x => x.id === m.id); return mHead("Fikrga javob", `${esc(f.author)} · ${stars(f.rating)}`) + `<form data-form="fb-reply" data-id="${f.id}"><div class="m-body"><blockquote class="quote">${esc(f.text)}</blockquote><div class="field"><label for="fr-t">Javobingiz (ochiq sahifada ko‘rinadi)</label><textarea id="fr-t" name="text" required>${esc(f.reply ? f.reply.text : "")}</textarea></div></div><footer class="m-foot"><button type="button" class="btn" data-act="close">Bekor qilish</button><button class="btn btn-primary" type="submit">Saqlash</button></footer></form>`; };
