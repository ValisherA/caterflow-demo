/* CaterFlow — mijoz sayti uchun qo‘shimcha ma’lumotlar: ijara, tanlovli setlar, tadbirlar, hamyon, obunalar.
   Panel ham, sayt ham yuklaydi. Mavjud ma’lumotga tegmaydi — faqat yo‘q bo‘lsa qo‘shadi (db.siteV). */
"use strict";
const SITE_V = 2;
const RENT_CATS = [["jihoz", "Jihozlar"], ["joy", "Joy (lokatsiya)"], ["odam", "Odamlar"], ["bezak", "Bezak va texnika"]];
const RENT_CAT = Object.fromEntries(RENT_CATS);
const RENT_SUBS = { jihoz: ["Stol-stul", "Shatyor", "Idish-tovoq", "Dasturxon va matolar", "Qozon va isitgich"], joy: ["To‘yxona va zal", "Hovli va bog‘", "Dacha", "Choyxona"], odam: ["Oshpaz", "Ofitsiant", "Boshlovchi", "Xizmatchi"], bezak: ["Gul bezagi", "Chiroq", "Ovoz uskunasi", "Sahna", "Foto va video"] };
const RENT_UNITS = { dona: "dona", komplekt: "komplekt", kun: "kun", soat: "soat", kishi: "kishi", xodim: "xodim", tadbir: "tadbir" };
const RB_ST = { kutilmoqda: ["Tasdiq kutilmoqda", "saffron"], tasdiqlandi: ["Tasdiqlandi", "good"], rad: ["Rad etildi", "bad"], bajarildi: ["Bajarildi", "neutral"], bekor: ["Bekor qilindi", "bad"] };
const LIVE_ST = { yolda: ["Yo‘lda", "info"], keldi: ["Yetib keldi", "accent"], tayyor: ["Tayyor", "good"], tugadi: ["Tugadi", "neutral"], muammo: ["Muammo", "bad"] };
const CL_TYPES = { person: "Shaxsiy", manager: "Event menejer", company: "Kompaniya" };
const AMB_ST = { none: ["—", "neutral"], applied: ["Ariza berdi", "saffron"], active: ["Ambassador", "good"], rejected: ["Rad etildi", "bad"] };
const W_KIND = { cashback: "Cashback", points: "Ball", ref: "Do‘st taklifi", spend: "Buyurtmaga ishlatildi", withdraw: "Pul yechish" };
const SITE_DEF = { catComm: { jihoz: 10, joy: 10, odam: 10, bezak: 10 }, confirmHours: 2, pointsPct: 1, refBonus: 50000, ambPct: 5, ambMinEvents: 3, maxSpendPct: 30, managers: ["Dilshod Karimov", "Sevara Aliyeva", "Jahongir Nazarov"] };
const siteS = () => db.settings.site || (db.settings.site = JSON.parse(JSON.stringify(SITE_DEF)));

/* ---------- topuvchilar va hisoblar ---------- */
const RI = id => (db.rentals || []).find(r => r.id === id);
const RB = id => (db.rentBookings || []).find(b => b.id === id);
const EV = id => (db.events || []).find(e => e.id === id);
const isPartner = v => !!v && v.kind === "partner";
const clType = c => (c && c.type) || "person";
const ambOn = c => !!c && !!c.amb && c.amb.status === "active";
const rbTotal = b => b.items.reduce((a, x) => a + x.qty * x.price * (x.days || 1), 0);
const rbComm = b => Math.round(b.items.reduce((a, x) => a + x.qty * x.price * (x.days || 1) * (x.comm || 0) / 100, 0));
const rbPaid = b => (b.pays || []).reduce((a, p) => a + p.amount, 0);
function walletOf(cid) { return (db.wallet || []).filter(w => w.clientId === cid).sort((a, b) => b.at - a.at); }
// band (kutilayotgan yechish ham ayriladi), rad etilgan yechish hisobga olinmaydi
function walletBal(cid) { return walletOf(cid).filter(w => w.status !== "rejected").reduce((a, w) => a + w.amount, 0); }
function doneEvents(cid) { const c = (db.clients || []).find(x => x.id === cid); return (c && c.pastEvents || 0) + db.orders.filter(o => o.clientId === cid && o.status === "yakunlandi").length; }
function nextOrderId() { const n = Math.max(1040, ...db.orders.map(o => +(/^CF-(\d+)$/.exec(o.id) || [0, 0])[1])); return "CF-" + (n + 1); }
function setGroups(s) { return (s && s.groups) || []; }
// mijozga ko‘rinadigan guruhlar: varianti yo‘q guruh chiqmaydi, “nechtasi” variantlar sonidan oshmaydi
const liveGroups = s => setGroups(s).filter(g => g.opts.length).map(g => g.pick > g.opts.length ? Object.assign({}, g, { pick: g.opts.length }) : g);
const ICON_OF = n => { n = String(n).toLowerCase(); return /osh|palov|plov/.test(n) ? "plov" : /salat|chuchuk|olivye|vinegret|sezar|mimoza|karam|bodring/.test(n) ? "salad" : /shashlik|kabob|kabab|jiz/.test(n) ? "kebab" : /manti|chuchvara|somsa|lag/.test(n) ? "manti" : /mastava|sho‘rva|shorva|sho'rva/.test(n) ? "soup" : /qazi|gazak|tuzlang/.test(n) ? "qazi" : /non\b|non |patir|non$/.test(n) ? "bread" : /choy|kompot|ichimlik|qahva/.test(n) ? "tea" : /meva/.test(n) ? "fruit" : /medovik|napoleon|paxlava|shirin|tort/.test(n) ? "cake" : /go‘sht|tandir|norin|qozon/.test(n) ? "meat" : "dish"; };

/* tanlov asosida buyurtma uchun alohida set (osets): panel SET() orqali topadi, menyu ro‘yxatlarida ko‘rinmaydi */
function makeOrderSet(id, base, picks, extra = {}) {
  const fixed = fixedLines(base).map(l => ({ ...l, id: id + "-f" + Math.random().toString(36).slice(2, 6) })), grouped = groupedDishes(base);
  const chosen = [];
  liveGroups(base).forEach(g => (picks[g.id] || []).slice(0, g.pick).forEach(oid => { const o = g.opts.find(x => x.id === oid); if (o) chosen.push({ id: id + "-" + o.id, sec: g.sec || g.name, name: o.name, qty: o.qty || "", d: o.d || null }); }));
  const lines = [...fixed, ...chosen];
  const items = [...base.items.filter(i => !grouped.has(i.d)).map(i => ({ ...i })), ...chosen.filter(l => l.d).map(l => ({ d: l.d, n: 1 }))];
  const s = Object.assign({ id, vendorId: base.vendorId, kind: "simple", custom: true, baseId: base.id, by: "client", name: base.name, desc: base.desc || "", price: base.price, minGuests: base.minGuests || 0, includes: [...(base.includes || [])], visible: false, estCost: base.estCost || 0, lines, items, media: (base.media || []).map(m => ({ ...m })), createdAt: Date.now(), updatedAt: Date.now(), updatedBy: "client" }, extra);
  (db.osets = db.osets || []).push(s); return s;
}
function makeCustomSet(id, vid, dishIds) {
  const ds = dishIds.map(D).filter(Boolean), lines = ds.map(d => ({ id: id + "-" + d.id, sec: DISH_SEC[d.cat] || d.cat, name: d.name, qty: d.portion, d: d.id }));
  const s = { id, vendorId: vid, kind: "simple", custom: true, built: true, baseId: null, by: "client", name: "O‘z setim", desc: "Mijoz taomlardan o‘zi yig‘gan set", price: ds.reduce((a, d) => a + d.price, 0), minGuests: 0, includes: [], visible: false, estCost: 0, lines, items: ds.map(d => ({ d: d.id, n: 1 })), media: [], createdAt: Date.now(), updatedAt: Date.now(), updatedBy: "client" };
  (db.osets = db.osets || []).push(s); return s;
}

/* ---------- har yuklanishda: hamyon, obunalar ---------- */
function walletSync() {
  const S = siteS(); db.wallet = db.wallet || [];
  db.orders.filter(o => o.clientId && o.status === "yakunlandi" && o.vendorId).forEach(o => {
    if (db.wallet.some(w => w.ref === o.id && (w.kind === "cashback" || w.kind === "points"))) return;
    const c = (db.clients || []).find(x => x.id === o.clientId); if (!c) return;
    const q = orderQuote(o), val = q ? q.pp * o.guests : 0; if (!val) return;
    const amb = ambOn(c), amount = Math.round(val * (amb ? S.ambPct : S.pointsPct) / 100 / 100) * 100;
    db.wallet.push({ id: uid("w"), clientId: c.id, kind: amb ? "cashback" : "points", amount, ref: o.id, at: Date.now(), status: "ok", note: `${o.id} · ${o.eventType} — ${amb ? S.ambPct + "% cashback" : S.pointsPct + "% ball"}` });
  });
  (db.rentBookings || []).filter(b => b.status === "bajarildi").forEach(b => {
    if (db.wallet.some(w => w.ref === b.id && (w.kind === "cashback" || w.kind === "points"))) return;
    const c = (db.clients || []).find(x => x.id === b.clientId); if (!c) return;
    const amb = ambOn(c), amount = Math.round(rbTotal(b) * (amb ? S.ambPct : S.pointsPct) / 100 / 100) * 100;
    if (amount) db.wallet.push({ id: uid("w"), clientId: c.id, kind: amb ? "cashback" : "points", amount, ref: b.id, at: Date.now(), status: "ok", note: `${b.id} · ijara — ${amb ? S.ambPct + "% cashback" : S.pointsPct + "% ball"}` });
  });
}
// buyurtma bekor qilinsa, rad etilsa yoki boshqa vendorga o‘tkazilsa — ishlatilgan balans mijozga qaytadi
function walletReturns() {
  (db.wallet || []).filter(w => w.kind === "spend" && w.status !== "rejected" && w.ref).forEach(w => {
    const o = db.orders.find(x => x.id === w.ref), b = (db.rentBookings || []).find(x => x.id === w.ref);
    const dead = o ? (o.status === "bekor" || (o.cart && o.cart.closed)) : b ? ["rad", "bekor"].includes(b.status) : false;
    if (!dead) return; w.status = "rejected"; w.returnedAt = Date.now(); if (o && o.cart) o.cart.discount = 0; if (b) b.discount = 0;
  });
}
function subsSync() {
  (db.subs || []).filter(s => s.status === "active" && s.accepted).forEach(s => {
    const base = SET(s.osetId); if (!base) return;
    for (let i = 0; i <= 3; i++) { // yaqin 4 kun: oshxona tayyorlanadi, panel ro‘yxatlari to‘lib ketmaydi
      const date = dAdd(i), dow = ((new Date(date + "T12:00").getDay() + 6) % 7) + 1;
      if (!s.days.includes(dow) || date < s.since || db.orders.some(o => o.subId === s.id && o.date === date && o.status !== "bekor")) continue;
      const c = (db.clients || []).find(x => x.id === s.clientId) || {};
      db.orders.push({ id: nextOrderId(), leadId: null, customer: c.name || "", phone: c.phone || "", eventType: "Korporativ", date, guests: s.guests, budget: base.price, area: s.area, venue: s.address, notes: `Doimiy buyurtma: ofis tushligi, ${s.time}`, status: "tasdiqlandi", vendorId: s.vendorId, createdAt: Date.now(), clientId: s.clientId, channel: "sub", subId: s.id, token: null, pendingReserve: true,
        requests: [{ vendorId: s.vendorId, status: "javob", reason: "", sentAt: Date.now(), quote: { setId: base.id, pp: base.price, includes: [...(base.includes || [])], note: "Doimiy buyurtma (obuna)", at: Date.now() }, toCustomer: true }],
        history: [{ at: Date.now(), text: "Obuna bo‘yicha avtomatik yaratildi" }], cart: { setId: base.id, baseSetId: s.setId, pp: base.price, delivery: 0, choices: s.choices || [], time: s.time, address: s.address, discount: 0 } });
    }
  });
}
// obuna to‘xtatilsa: kelgusi tushliklar bekor, ombor rezervi panelda bo‘shatiladi
function subPause(s) { db.orders.filter(o => o.subId === s.id && o.date >= today() && ["tasdiqlandi", "vendorlarda"].includes(o.status)).forEach(o => { o.status = "bekor"; o.pendingRelease = true; (o.history = o.history || []).push({ at: Date.now(), text: "Obuna to‘xtatildi — buyurtma bekor" }); }); }
function siteSyncShared() { if (!db.siteV) return; walletSync(); walletReturns(); subsSync(); (db.events || []).forEach(e => { if (!e.rsvpToken) e.rsvpToken = "rsvp-" + e.id.toLowerCase(); }); }

/* ---------- birinchi marta: namunaviy ma’lumot ---------- */
/* tanlovli setlar: vendorning o‘z texkartali setiga tanlov guruhi qo‘shiladi (masalan “5 ta salatdan 2 tasi”).
   Guruhdagi texkartali taom setning doimiy qismidan chiqadi — mijoz shu o‘rinda o‘zi tanlaydi. Paneldagi menyu va texkartalar o‘zgarmaydi.
   Variant: [nom, texkarta raqami, porsiya, izoh] — nom yoki porsiya bo‘sh bo‘lsa texkartadan olinadi. */
const SALADS5 = [[null, 2], [null, 3], ["Vinegret", null, "150 g", "Lavlagi, sabzi, bodring"], ["Sezar salati", null, "150 g", "Tovuq, kruton, parmezan"], ["Grek salati", null, "150 g", "Pishloq, zaytun, sabzavotlar"]];
const CHOICE_GROUPS = {
  "v1-s0": [["g1", "Salatlar", "Salatlar", 2, SALADS5]],
  "v1-s1": [["g1", "Salatlar", "Salatlar", 2, SALADS5], ["g2", "Issiq taom", "Issiq taomlar", 2, [[null, 4], [null, 5], ["Tandir go‘sht", null, "150 g", "Tandirda 4 soat dimlangan"], ["Jiz", null, "150 g", "Qo‘y go‘shti, piyoz bilan qovurilgan"]]]],
  "v2-s0": [["g1", "Salatlar", "Salatlar", 2, [[null, 2], [null, 3], ["Vinegret", null, "150 g"], ["Mimoza", null, "150 g", "Baliqli, qatlamli"], ["Sezar salati", null, "150 g"], ["Bodring-pomidor", null, "150 g", "Yangi uzilgan sabzavotlar"]]]],
  "v2-s2": [["g1", "Salatlar", "Salatlar", 2, [[null, 2], [null, 3], ["Vinegret", null, "150 g"], ["Karam salati", null, "150 g"]]], ["g2", "Issiq taom", "Issiq taomlar", 1, [[null, 4], [null, 5], ["Tovuq kabob", null, "200 g", "Garnir bilan"]]]],
  "v4-s0": [["g1", "Salatlar", "Salatlar", 2, [[null, 2], [null, 3], ["Vinegret", null, "150 g"], ["Tuzlangan sabzavotlar", null, "100 g"]]]],
  "v7-s2": [["g1", "Salatlar", "Salatlar", 2, [[null, 2], [null, 3], ["Bodring-pomidor", null, "150 g"], ["Grek salati", null, "150 g"]]], ["g2", "Shashlik", "Issiq taomlar", 1, [[null, 4], ["Qo‘y go‘shtidan shashlik", null, "2 six"], ["Tovuq shashlik", null, "2 six"]]]]
};
// ofis tushligi — vendorning yangi texkartali seti (sayt obunasi uchun)
const OFFICE_SETS = [
  ["v2-s21", "v2", "Ofis tushligi", "Har kuni ofisga issiq tushlik: birinchi taom, asosiy taom, salat, non va choy. 10 kishidan.", 52000,
    [["g1", "Birinchi taom", "Birinchi taom", 1, [["Mastava", 9, "300 ml"], ["Sho‘rva", null, "300 ml", "Mol go‘shti va sabzavotlar"], ["Chuchvara sho‘rva", null, "300 ml"]]], ["g2", "Asosiy taom", "Issiq taomlar", 1, [["Osh", 0, "300 g"], [null, 5], ["Lag‘mon", null, "350 g", "Qo‘lda cho‘zilgan"], ["Tovuq kabob", null, "200 g", "Garnir bilan"]]], ["g3", "Salat", "Salatlar", 1, [[null, 2], ["Vinegret", null, "150 g"], ["Karam salati", null, "150 g"]]]],
    [["photo", "Ofis tushligi"], ["photo", "Lag‘mon"]]],
  ["v9-s20", "v9", "Siyob ofis tushligi", "Samarqand uslubidagi tushlik: birinchi va asosiy taom, salat, non, choy.", 45000,
    [["g1", "Birinchi taom", "Birinchi taom", 1, [["Mastava", 9, "300 ml"], ["Sho‘rva", null, "300 ml"]]], ["g2", "Asosiy taom", "Issiq taomlar", 1, [["Samarqand oshi", 0, "300 g"], [null, 5], ["Lag‘mon", null, "350 g"]]], ["g3", "Salat", "Salatlar", 1, [[null, 2], ["Vinegret", null, "150 g"]]]],
    [["photo", "Samarqand tushligi"]]]
];
function seedChoiceSets() {
  const has = id => db.vendors.some(v => v.id === id);
  const grp = (vid, [id, name, sec, pick, opts]) => ({ id, name, sec, pick, opts: opts.map(([n, d, q, desc], i) => { const x = d != null ? D(`${vid}-d${d}`) : null; return { id: `${id}o${i}`, name: n || (x ? x.name : ""), d: x ? x.id : null, qty: q || (x ? x.portion : ""), desc: desc || "" }; }).filter(o => o.name) });
  OFFICE_SETS.forEach(([id, vid, name, desc, price, groups, media], k) => {
    if (!has(vid) || db.sets.some(s => s.id === id)) return;
    const gs = groups.map(g => grp(vid, g)), items = [...new Set([...gs.flatMap(g => g.opts.slice(0, 1).map(o => o.d)), `${vid}-d6`, `${vid}-d7`])].filter(d => d && D(d)).map(d => ({ d, n: 1 }));
    db.sets.push({ id, vendorId: vid, name, desc, items, price, media: media.map(([t, label], j) => ({ id: `${id}-m${j}`, t, label, tone: (k + j) % 6 })), includes: ["Yetkazib berish", "Bir martalik idish"], minGuests: 10, groups: gs });
  });
  Object.entries(CHOICE_GROUPS).forEach(([sid, gs]) => { const s = db.sets.find(x => x.id === sid); if (s && !s.groups) s.groups = gs.map(g => grp(s.vendorId, g)); });
}
// guruhga kirgan texkartali taom setning doimiy qismida ko‘rinmaydi (mijoz uning o‘rniga tanlaydi)
const groupedDishes = s => new Set(setGroups(s).flatMap(g => g.opts.map(o => o.d)).filter(Boolean));
function fixedLines(s) { const g = groupedDishes(s); return setLines(s).filter(l => !l.d || !g.has(l.d)); }
/* 1-versiyada tanlovli setlar alohida “oddiy menyu” bo‘lib qo‘shilgan edi: ular olib tashlanadi, havolalar asl setlarga o‘tadi */
const OLD_SETS = { "v1-s20": "v1-s0", "v2-s20": "v2-s0", "v4-s20": "v4-s0", "v7-s20": "v7-s2" };
function migrateSiteV2() {
  db.sets = db.sets.filter(s => !Object.prototype.hasOwnProperty.call(OLD_SETS, s.id) && !((s.id === "v2-s21" || s.id === "v9-s20") && s.kind === "simple"));
  seedChoiceSets();
  const fix = v => typeof v === "string" && Object.prototype.hasOwnProperty.call(OLD_SETS, v) ? OLD_SETS[v] : (v && typeof v === "object" && walk(v), v);
  const walk = x => { if (Array.isArray(x)) x.forEach((v, i) => { x[i] = fix(v); }); else Object.keys(x).forEach(k => { x[k] = fix(x[k]); }); };
  Object.keys(db).forEach(k => { if (k !== "sets") db[k] = fix(db[k]); });
  db.siteV = 2;
}

function ensureSiteData() {
  if (!db) return;
  if (db.siteV === 1) migrateSiteV2();
  if (db.siteV >= SITE_V) return;
  const has = id => db.vendors.some(v => v.id === id);
  db.settings.site = db.settings.site || JSON.parse(JSON.stringify(SITE_DEF));
  ["rentals", "rentBookings", "events", "wallet", "subs", "osets", "templates", "aiChats", "pmChats", "invoices"].forEach(k => { db[k] = db[k] || []; });

  // vendorlarning sayt sozlamalari: minimal buyurtma, hudud bo‘yicha yetkazish, necha kun oldin, avto-tasdiq
  const VS = { v1: [5e6, { "Toshkent shahri": 150000, "Toshkent viloyati": 300000 }, 3, false, 0, 98], v2: [2e6, { "Toshkent shahri": 100000 }, 2, true, 150, 96], v3: [1.5e6, { "Toshkent shahri": 100000, "Toshkent viloyati": 200000 }, 2, false, 0, 95], v4: [3e6, { "Samarqand": 0, "Jizzax": 200000, "Navoiy": 250000 }, 3, false, 0, 94], v5: [2.5e6, { "Buxoro": 0, "Navoiy": 200000 }, 3, true, 120, 93], v6: [3e6, { "Farg‘ona": 0, "Andijon": 150000, "Namangan": 150000 }, 4, false, 0, 91], v7: [2e6, { "Toshkent viloyati": 0, "Toshkent shahri": 200000 }, 2, true, 100, 97], v8: [3e6, { "Andijon": 0, "Farg‘ona": 150000, "Namangan": 150000 }, 4, false, 0, 90], v9: [4e5, { "Samarqand": 50000 }, 1, true, 60, 95] };
  db.vendors.forEach(v => { if (v.site) return; const x = VS[v.id] || [2e6, {}, 2, false, 0, 95]; v.site = { minOrder: x[0], fees: x[1], leadDays: x[2], autoAccept: x[3], autoMax: x[4], onTime: x[5] }; });

  // ijara va xizmat hamkorlari (vendor paneliga kiradi, faqat o‘z katalogini ko‘radi)
  [["p1", "Toshkent Prokat", "Anvar Yusupov", "+998 90 318 40 22", "Sergeli", "Toshkent shahri", -180, "prokat", ["jihoz"], ["Toshkent shahri", "Toshkent viloyati"], 99],
   ["p2", "Bog‘i Eram", "Laziz Hamidov", "+998 93 701 12 90", "Qibray", "Toshkent viloyati", -130, "eram", ["joy"], ["Toshkent shahri", "Toshkent viloyati"], 97],
   ["p3", "Usta Oshpazlar", "Rustam Qodirov", "+998 97 455 63 10", "Chilonzor", "Toshkent shahri", -90, "usta", ["odam"], ["Toshkent shahri", "Toshkent viloyati", "Samarqand"], 96],
   ["p4", "Zarhal Dekor", "Nigora Salimova", "+998 99 812 07 45", "Mirobod", "Toshkent shahri", -60, "dekor", ["bezak"], ["Toshkent shahri", "Toshkent viloyati"], 95]].forEach(([id, name, contact, phone, district, region, since, login, services, areas, onTime]) => {
    if (has(id)) return;
    db.vendors.push(V_(id, name, contact, phone, district, region, since, login, 1, { minGuests: 0, maxGuests: 5000, minPP: 0, areas, blocked: [] }, { kind: "partner", services, site: { minOrder: 0, fees: {}, leadDays: 1, autoAccept: false, autoMax: 0, onTime } }));
    db.staff.push({ id: `${id}-u0`, vendorId: id, name: contact, phone, role: "owner", login, pass: login + "2026" });
    db.notifs.unshift({ id: `${id}-nw`, vendorId: id, at: tAgo(72), text: "CaterFlow’ga xush kelibsiz! Ijara katalogingizni to‘ldiring — mijozlar saytda ko‘radi.", link: { view: "vsite", param: "rent" }, read: true, to: null, roles: ["owner", "manager"] });
  });

  // ijara katalogi: [id, vendor, kategoriya, bo‘lim, nomi, birlik, narx, minimal, zaxira, tavsif, qo‘shimcha]
  const R = (id, vid, cat, sub, name, unit, price, min, stock, desc, x = {}) => { if (!db.rentals.some(r => r.id === id)) db.rentals.push(Object.assign({ id, vendorId: vid, cat, sub, name, unit, price, min, stock, desc, cap: 0, busy: [], visible: true, at: tAgo(24 * 30) }, x)); };
  R("p1-r0", "p1", "jihoz", "Stol-stul", "Banket stoli (10 kishilik)", "dona", 45000, 5, 120, "Yumaloq stol, 180 sm, oq yopinchiq bilan.");
  R("p1-r1", "p1", "jihoz", "Stol-stul", "Chiavari stul (oltin)", "dona", 12000, 20, 1500, "To‘y va banketlar uchun oltin rangli stul, yumshoq o‘rindiq.");
  R("p1-r2", "p1", "jihoz", "Stol-stul", "Oddiy stul + chexol", "dona", 6000, 20, 2000, "Oq chexol va bant bilan.");
  R("p1-r3", "p1", "jihoz", "Stol-stul", "Kelin-kuyov stoli komplekti", "komplekt", 450000, 1, 6, "Stol, 2 ta taxt-stul, bezak matosi.");
  R("p1-r4", "p1", "jihoz", "Shatyor", "Shatyor 10×20 m (200 kishi)", "dona", 3500000, 1, 3, "Hovli to‘ylari uchun, yoritish bilan. O‘rnatish narxga kiradi.");
  R("p1-r5", "p1", "jihoz", "Shatyor", "Shatyor 6×12 m (80 kishi)", "dona", 1800000, 1, 5, "Kichik tadbirlar uchun, yon pardalari bilan.");
  R("p1-r6", "p1", "jihoz", "Idish-tovoq", "Idish-tovoq komplekti (1 kishi)", "kishi", 7000, 20, 1500, "Chinni tarelkalar, qoshiq-sanchqi, stakan.");
  R("p1-r7", "p1", "jihoz", "Idish-tovoq", "Choynak-piyola (10 kishi)", "komplekt", 25000, 2, 200, "Choynak, 10 ta piyola va patnis.");
  R("p1-r8", "p1", "jihoz", "Dasturxon va matolar", "Atlas dasturxon", "dona", 30000, 5, 400, "Oltin naqshli, yuviladi.");
  R("p1-r9", "p1", "jihoz", "Qozon va isitgich", "Osh qozoni (200 kishi) + o‘choq", "dona", 250000, 1, 8, "Qozon, o‘choq va o‘tin.");
  R("p1-r10", "p1", "jihoz", "Qozon va isitgich", "Chafing isitgich", "dona", 40000, 2, 60, "Issiq taomni tadbir davomida issiq saqlaydi.");
  R("p2-r0", "p2", "joy", "To‘yxona va zal", "Katta zal (400 kishi)", "tadbir", 15000000, 1, 1, "Konditsioner, sahna, ovoz tizimi va to‘xtash joyi bor.", { cap: 400, busy: [dAdd(3), dAdd(10)] });
  R("p2-r1", "p2", "joy", "To‘yxona va zal", "Kichik zal (150 kishi)", "tadbir", 6000000, 1, 1, "Yubiley va korporativlar uchun shinam zal.", { cap: 150, busy: [dAdd(5)] });
  R("p2-r2", "p2", "joy", "Hovli va bog‘", "Bog‘ hovlisi (250 kishi)", "tadbir", 9000000, 1, 1, "Ochiq havoda, favvora va chiroqlar bilan.", { cap: 250 });
  R("p2-r3", "p2", "joy", "Dacha", "Dacha — Chorvoq yo‘lida (60 kishi)", "kun", 3500000, 1, 1, "Hovuz, mangal joyi, 4 ta yotoqxona.", { cap: 60 });
  R("p2-r4", "p2", "joy", "Choyxona", "Choyxona zali (80 kishi)", "tadbir", 2500000, 1, 1, "Nahorgi osh va ma’rakalar uchun.", { cap: 80 });
  R("p3-r0", "p3", "odam", "Oshpaz", "Oshpaz: to‘y oshi", "kishi", 38000, 50, 0, "Tajribali oshpaz qozon bilan keladi. Ikki xil: mahsulot bilan (kishi boshiga) yoki faqat xizmat — mahsulotni o‘zingiz olasiz.", { cook: { food: 38000, service: 1200000, recipe: 0 } });
  R("p3-r1", "p3", "odam", "Oshpaz", "Shashlik ustasi", "kishi", 45000, 30, 0, "Mangal, ko‘mir va usta. Mahsulot bilan yoki faqat xizmat.", { cook: { food: 45000, service: 900000, recipe: 4 } });
  R("p3-r2", "p3", "odam", "Ofitsiant", "Ofitsiant", "xodim", 200000, 2, 40, "Forma kiygan, tajribali. 1 ofitsiant ~ 25 mehmonga.");
  R("p3-r3", "p3", "odam", "Boshlovchi", "Boshlovchi (o‘zbek + rus)", "tadbir", 3000000, 1, 3, "Dastur, o‘yinlar va tabriklar ssenariysi bilan.");
  R("p3-r4", "p3", "odam", "Xizmatchi", "Xizmatchi (yig‘ishtirish)", "xodim", 150000, 2, 30, "Tadbirdan oldin va keyin tozalash.");
  R("p4-r0", "p4", "bezak", "Gul bezagi", "Gul arkasi (kirish)", "dona", 1800000, 1, 4, "Tirik gullar, 2,5 m balandlik.");
  R("p4-r1", "p4", "bezak", "Gul bezagi", "Stol gul kompozitsiyasi", "dona", 120000, 5, 300, "Har bir stol uchun past kompozitsiya, sham bilan.");
  R("p4-r2", "p4", "bezak", "Chiroq", "LED bezak (zal)", "komplekt", 1500000, 1, 3, "Zal shiftiga yulduzli chiroqlar va rangli yoritish.");
  R("p4-r3", "p4", "bezak", "Ovoz uskunasi", "Ovoz uskunasi + DJ", "tadbir", 2500000, 1, 3, "2 kVt ovoz, 2 ta mikrofon, DJ 6 soat.");
  R("p4-r4", "p4", "bezak", "Sahna", "Sahna (6×4 m)", "dona", 2000000, 1, 2, "Gilam, orqa fon va yoritish bilan.");
  R("p4-r5", "p4", "bezak", "Foto va video", "Foto + video (8 soat)", "tadbir", 4500000, 1, 3, "2 operator, montaj qilingan klip 2 haftada.");
  R("p4-r6", "p4", "bezak", "Foto va video", "Dron surat", "soat", 600000, 1, 2, "Havodan surat va video.");
  if (has("v1")) { R("v1-r0", "v1", "odam", "Ofitsiant", "Ofitsiant (Lagan)", "xodim", 220000, 2, 30, "Lagan Catering ofitsiantlari, oq forma."); R("v1-r1", "v1", "jihoz", "Idish-tovoq", "Chinni idish-tovoq", "kishi", 9000, 50, 800, "Lagan Catering’ning oltin hoshiyali chinni idishlari."); R("v1-r2", "v1", "jihoz", "Qozon va isitgich", "Osh qozoni + o‘choq", "dona", 200000, 1, 4, "Joyida osh damlash uchun."); }
  if (has("v2")) { R("v2-r0", "v2", "bezak", "Gul bezagi", "Stol bezagi (gul + mato)", "dona", 70000, 5, 120, "Dasturxon Events dizaynerlari bezaydi."); R("v2-r1", "v2", "odam", "Ofitsiant", "Ofitsiant (Dasturxon)", "xodim", 200000, 2, 20, ""); }
  if (has("v4")) { R("v4-r0", "v4", "odam", "Ofitsiant", "Ofitsiant (Ziyofat)", "xodim", 160000, 2, 25, ""); R("v4-r1", "v4", "bezak", "Ovoz uskunasi", "Karnay-surnay", "tadbir", 1500000, 1, 2, "Kelin-kuyov kirishi uchun an’anaviy karnay-surnay."); }
  if (has("v7")) R("v7-r0", "v7", "jihoz", "Qozon va isitgich", "Dala oshxonasi (tabiatda)", "tadbir", 1200000, 1, 2, "Tog‘da yoki dachada qozon, mangal va stollar bilan.");

  seedChoiceSets();

  // mijozlar: turi, ambassador, referal kod
  const refCode = n => String(n).split(/\s+/)[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) + "26";
  db.clients.forEach(c => { c.type = c.type || "person"; c.amb = c.amb || { status: "none" }; c.ref = c.ref || refCode(c.name); c.pastEvents = c.pastEvents || 0; });
  const CL = (id, name, phone, lang, f) => { if (!db.clients.some(c => c.id === id)) db.clients.push(Object.assign({ id, name, phone, lang, tg: true, createdAt: tAgo(24 * 120), type: "person", amb: { status: "none" }, ref: refCode(name), pastEvents: 0 }, f)); };
  CL("cl6", "Kamola Rashidova", "+998 90 123 45 67", "uz", { type: "manager", agency: "Kamola Events", amb: { status: "active", since: dAdd(-40), at: tAgo(24 * 45), by: "admin" }, pastEvents: 6, pm: "Dilshod Karimov", team: [{ id: "tm1", name: "Sevinch Olimova", phone: "+998 93 220 14 55", role: "Yordamchi" }, { id: "tm2", name: "Bobur Hakimov", phone: "+998 97 640 12 09", role: "Logist" }] });
  CL("cl7", "Madina Yusupova", "+998 91 777 30 12", "ru", { type: "manager", agency: "Madina Wedding", amb: { status: "applied", at: tAgo(20) }, pastEvents: 3, refBy: "cl6", team: [] });
  CL("cl8", "Dilnoza Ahmedova", "+998 99 300 11 22", "uz", { type: "company", company: { name: "Artel Group", inn: "301 234 567", budget: 30000000, address: "Artel bosh ofisi, Yakkasaroy", members: [{ id: "cm1", name: "Dilnoza Ahmedova", phone: "+998 99 300 11 22", role: "Administrator" }, { id: "cm2", name: "Javlon Saidov", phone: "+998 90 455 67 81", role: "Buyurtmachi" }, { id: "cm3", name: "Malika Ergasheva", phone: "+998 93 118 22 40", role: "Buyurtmachi" }] } });

  // savat orqali kelgan buyurtmalar
  const findSet = id => db.sets.find(s => s.id === id);
  const O2 = (id, f) => { if (db.orders.some(o => o.id === id)) return null; const o = Object.assign({ id, leadId: null, customer: "", phone: "", eventType: "", date: "", guests: 0, budget: 0, area: "Toshkent shahri", venue: "", notes: "", status: "vendorlarda", vendorId: null, createdAt: Date.now(), requests: [], token: null, history: [], channel: "cart" }, f); db.orders.push(o); return o; };
  const pickBy = (s, names) => { const p = {}; setGroups(s).forEach(g => { p[g.id] = g.opts.filter(o => names.includes(o.name)).slice(0, g.pick).map(o => o.id); }); return p; };
  const choiceList = (s, p) => setGroups(s).map(g => [g.name, (p[g.id] || []).map(id => g.opts.find(o => o.id === id).name)]);
  const s120 = findSet("v1-s0"), s220 = findSet("v2-s0"), s221 = findSet("v2-s21"), s222 = findSet("v2-s2");
  if (s120 && db.clients.some(c => c.id === "cl6")) {
    const p = pickBy(s120, ["Achchiq-chuchuk", "Sezar salati"]), pp = s120.price; makeOrderSet("os-1049", s120, p); db.osets[db.osets.length - 1].createdAt = tAgo(240);
    O2("CF-1049", { customer: "Kamola Rashidova", phone: "+998 90 123 45 67", eventType: "Nikoh to‘yi", date: dAdd(3), guests: 250, budget: pp, venue: "Bog‘i Eram — Katta zal", notes: "Kelin tomoni. Event menejer: Kamola Events. Shirinlik — medovik.", status: "tasdiqlandi", vendorId: "v1", createdAt: tAgo(240), token: "e1k9am", clientId: "cl6", eventId: "E1", pendingReserve: true, vcheck: { 0: true, 1: true },
      requests: [{ vendorId: "v1", status: "javob", reason: "", sentAt: tAgo(240), quote: { setId: "os-1049", pp, includes: ["Ofitsiantlar", "Idish-tovoq", "Yetkazib berish"], note: "Savat orqali buyurtma", at: tAgo(238) }, toCustomer: true }],
      history: [{ at: tAgo(240), text: "Saytda savat orqali buyurtma berildi (event menejer)" }, { at: tAgo(238), text: "Lagan Catering buyurtmani qabul qildi" }],
      cart: { setId: "os-1049", baseSetId: "v1-s0", pp, delivery: 150000, choices: choiceList(s120, p), time: "17:00", address: "Qibray, Bog‘i Eram", discount: 0 } });
    db.custPays.push({ id: "cp-CF-1049-avans", orderId: "CF-1049", vendorId: "v1", amount: Math.round((pp * 250 + 150000) * 0.3 / 100000) * 100000, kind: "avans", method: "Bank o‘tkazmasi", date: dAdd(-8), note: "30% avans", by: "v1-u0" });
    db.chats.push({ orderId: "CF-1049", msgs: [{ id: "cm-1049-0", at: tAgo(30), from: "client", text: "Assalomu alaykum! Ertaga 15:00 da degustatsiyaga kelsak bo‘ladimi?" }, { id: "cm-1049-1", at: tAgo(29), from: "vendor", text: "Va alaykum assalom, Kamola opa. Albatta, kutamiz!" }] });
  }
  if (s220 && db.clients.some(c => c.id === "cl1")) {
    const p = pickBy(s220, ["Olivye", "Mimoza"]), pp = s220.price; makeOrderSet("os-1050", s220, p);
    O2("CF-1050", { customer: "Aziza Rahimova", phone: "+998 93 410 22 18", eventType: "Tug‘ilgan kun", date: dAdd(9), guests: 40, budget: pp, venue: "Uy, Yunusobod 4-mavze", notes: "Onamning 55 yoshi. Tort o‘zimizdan.", createdAt: tAgo(0.6), clientId: "cl1", eventId: "E4",
      requests: [{ vendorId: "v2", status: "kutilmoqda", reason: "", sentAt: tAgo(0.6), quote: null, toCustomer: false }],
      history: [{ at: tAgo(0.6), text: "Saytda savat orqali buyurtma berildi" }],
      cart: { setId: "os-1050", baseSetId: "v2-s0", pp, delivery: 100000, choices: choiceList(s220, p), time: "18:00", address: "Yunusobod 4-mavze, 12-uy", discount: 0 } });
    db.notifs.unshift({ id: "v2-ncart", vendorId: "v2", at: tAgo(0.6), text: "Saytdan yangi savat buyurtmasi: CF-1050 — Tug‘ilgan kun, 40 kishi. 2 soat ichida tasdiqlang", link: { view: "vorder", param: "CF-1050" }, read: false, to: null, roles: ["owner", "manager"] });
  }
  if (s120 && db.clients.some(c => c.id === "cl3")) {
    const p = pickBy(s120, ["Olivye", "Vinegret"]), pp = s120.price; makeOrderSet("os-1051", s120, p);
    O2("CF-1051", { customer: "Shahnoza Islomova", phone: "+998 93 271 64 09", eventType: "Yubiley", date: dAdd(18), guests: 90, budget: pp, venue: "“Navro‘z” restorani, Chilonzor", notes: "Dadamning 70 yoshi.", createdAt: tAgo(3.2), clientId: "cl3",
      requests: [{ vendorId: "v1", status: "kutilmoqda", reason: "", sentAt: tAgo(3.2), quote: null, toCustomer: false }],
      history: [{ at: tAgo(3.2), text: "Saytda savat orqali buyurtma berildi" }],
      cart: { setId: "os-1051", baseSetId: "v1-s0", pp, delivery: 150000, choices: choiceList(s120, p), time: "19:00", address: "Chilonzor, Navro‘z restorani", discount: 0 } });
    db.notifs.unshift({ id: "v1-ncart", vendorId: "v1", at: tAgo(3.2), text: "Saytdan yangi savat buyurtmasi: CF-1051 — Yubiley, 90 kishi. 2 soat ichida tasdiqlang", link: { view: "vorder", param: "CF-1051" }, read: false, to: null, roles: ["owner", "manager"] });
  }
  // ofis tushligi obunasi (Artel): har ish kuni avtomatik buyurtma
  if (s221 && db.clients.some(c => c.id === "cl8") && !db.subs.some(s => s.id === "S1")) {
    const p = pickBy(s221, ["Mastava", "Osh", "Achchiq-chuchuk"]); makeOrderSet("os-S1", s221, p);
    db.subs.push({ id: "S1", clientId: "cl8", vendorId: "v2", setId: "v2-s21", osetId: "os-S1", choices: choiceList(s221, p), days: [1, 2, 3, 4, 5], guests: 25, time: "13:00", address: "Artel bosh ofisi, Yakkasaroy", area: "Toshkent shahri", since: dAdd(-14), status: "active", accepted: true, at: tAgo(24 * 15) });
    db.invoices.push({ id: "INV-" + monthKeys()[1], clientId: "cl8", month: monthKeys()[1], amount: 18 * 25 * s221.price, orders: 18, status: "paid", paidAt: dAdd(-6) });
  }

  // ijara buyurtmalari
  const RB2 = (id, f) => { if (!db.rentBookings.some(b => b.id === id)) db.rentBookings.push(Object.assign({ id, pays: [], history: [], live: [] }, f)); };
  const it = (rid, qty, extra = {}) => { const r = RI(rid); return r ? Object.assign({ rid, name: r.name, unit: r.unit, cat: r.cat, qty, price: r.price, days: 1, comm: siteS().catComm[r.cat] }, extra) : null; };
  const items = (...l) => l.filter(Boolean);
  if (db.clients.some(c => c.id === "cl6")) {
    RB2("RB-1", { eventId: "E1", clientId: "cl6", vendorId: "p1", date: dAdd(3), status: "tasdiqlandi", at: tAgo(230), items: items(it("p1-r0", 25), it("p1-r1", 250), it("p1-r3", 1), it("p1-r8", 25)), pays: [{ id: "rp1", amount: 1500000, kind: "avans", method: "Naqd", date: dAdd(-6) }], history: [{ at: tAgo(230), text: "Saytdan buyurtma" }, { at: tAgo(226), text: "Toshkent Prokat tasdiqladi" }] });
    RB2("RB-2", { eventId: "E1", clientId: "cl6", vendorId: "p2", date: dAdd(3), status: "tasdiqlandi", at: tAgo(500), items: items(it("p2-r0", 1)), pays: [{ id: "rp2", amount: 5000000, kind: "avans", method: "Bank o‘tkazmasi", date: dAdd(-20) }], history: [{ at: tAgo(500), text: "Saytdan buyurtma" }, { at: tAgo(498), text: "Bog‘i Eram tasdiqladi" }] });
    RB2("RB-3", { eventId: "E1", clientId: "cl6", vendorId: "p4", date: dAdd(3), status: "kutilmoqda", at: tAgo(5), items: items(it("p4-r0", 1), it("p4-r1", 25), it("p4-r3", 1)), history: [{ at: tAgo(5), text: "Saytdan buyurtma" }] });
    RB2("RB-4", { eventId: "E1", clientId: "cl6", vendorId: "p3", date: dAdd(3), status: "tasdiqlandi", at: tAgo(200), items: items(it("p3-r3", 1), it("p3-r2", 10)), history: [{ at: tAgo(200), text: "Saytdan buyurtma" }, { at: tAgo(190), text: "Usta Oshpazlar tasdiqladi" }] });
  }
  if (db.clients.some(c => c.id === "cl1")) RB2("RB-5", { eventId: "E4", clientId: "cl1", vendorId: "p1", date: dAdd(9), status: "kutilmoqda", at: tAgo(0.6), items: items(it("p1-r1", 40), it("p1-r0", 4), it("p1-r6", 40)), history: [{ at: tAgo(0.6), text: "Saytdan buyurtma" }] });
  if (db.orders.some(o => o.id === "CF-1044")) RB2("RB-6", { eventId: "E2", clientId: "cl4", vendorId: "p3", date: dAdd(0), status: "tasdiqlandi", at: tAgo(100), items: items(it("p3-r2", 4)), pays: [{ id: "rp6", amount: 800000, kind: "avans", method: "Naqd", date: dAdd(-1) }], history: [{ at: tAgo(100), text: "Saytdan buyurtma" }, { at: tAgo(98), text: "Usta Oshpazlar tasdiqladi" }], live: [] });
  db.rentBookings.forEach(b => { if (b.status === "kutilmoqda" && !db.notifs.some(n => n.id === b.id + "-n")) db.notifs.unshift({ id: b.id + "-n", vendorId: b.vendorId, at: b.at, text: `Yangi ijara buyurtmasi: ${b.id} — ${fDate(b.date)}, ${b.items.length} ta pozitsiya`, link: { view: "vsite", param: "rbook" }, read: false, to: null, roles: ["owner", "manager"] }); });

  // tadbirlar (mijoz kabineti: reja, mehmonlar, pul, tadbir kuni)
  const rnd = mulberry32(7), GN = ["Nazarovlar oilasi", "Karimovlar", "Toshpo‘latovlar", "Saidovlar", "Rahimovlar", "Qodirovlar", "Ergashevlar", "Aminovlar", "Hasanovlar", "Sobirovlar", "Yusupovlar", "Normatovlar", "Olimovlar", "Jo‘rayevlar", "Rahmonovlar", "Ismoilovlar", "Mahmudovlar", "Aliqulovlar", "Sultonovlar", "Bakirovlar", "Hamroyevlar", "Orifovlar", "Ne’matovlar", "Qurbonovlar", "Valiyevlar", "Ashurovlar", "Ahmedovlar", "To‘xtayevlar", "Musayevlar", "Tursunovlar"];
  const EVt = (id, f) => { if (!db.events.some(e => e.id === id)) db.events.push(Object.assign({ id, status: "faol", timeline: [], checklist: [], guestList: [], tables: [], budgetLines: [], live: [], orders: [], bookings: [], share: null, rsvpToken: null, createdAt: Date.now() }, f)); };
  if (db.clients.some(c => c.id === "cl6")) {
    const guests = []; let tableNo = 1, seat = 0;
    for (let i = 0; i < 72; i++) { const n = GN[i % GN.length] + (i >= GN.length ? ` (${i >= 60 ? "do‘stlar" : "qarindoshlar"})` : ""), cnt = 2 + Math.floor(rnd() * 3), r = rnd(), st = r < 0.78 ? "yes" : r < 0.88 ? "no" : "pending";
      if (st === "yes") { if (seat + cnt > 10) { tableNo++; seat = 0; } seat += cnt; }
      guests.push({ id: `g${i}`, name: n, phone: "", count: cnt, rsvp: st, side: i % 2 ? "kuyov" : "kelin", table: st === "yes" ? tableNo : null, at: tAgo(24 * (1 + rnd() * 10)) }); }
    EVt("E1", { clientId: "cl6", title: "Saida va Jasurbek to‘yi", type: "Nikoh to‘yi", date: dAdd(3), time: "18:00", guests: 250, venue: "Bog‘i Eram — Katta zal", area: "Toshkent shahri", budget: 80000000, endClient: { name: "Saida Nazarova", phone: "+998 91 555 21 40" }, orders: ["CF-1049"], bookings: ["RB-1", "RB-2", "RB-3", "RB-4"], createdAt: tAgo(24 * 21),
      timeline: [["16:30", "Mehmonlarni kutib olish, choy-non"], ["17:30", "Kelin-kuyov kirishi"], ["18:00", "Osh tortiladi"], ["19:00", "Boshlovchi dasturi, raqslar"], ["20:30", "Issiq taom va shirinlik"], ["22:00", "Yakun, mehmonlarni kuzatish"]].map(([t, x], i) => ({ id: `tl${i}`, t, text: x })),
      checklist: [["Menyuni kelin tomoni bilan tasdiqlash", -5, true, "Kamola Rashidova"], ["Zal avansini to‘lash", -20, true, "Kamola Rashidova"], ["Gul bezagini tasdiqlatish (Zarhal Dekor)", 1, false, "Sevinch Olimova"], ["Mehmonlar ro‘yxatini yakunlash (RSVP)", 1, false, "Kamola Rashidova"], ["Stol joylashuvini chiqarish", 2, false, "Sevinch Olimova"], ["Kelin mashinasi va transport", 2, false, "Bobur Hakimov"], ["Qoldiq to‘lovlarni tayyorlash", 3, false, "Kamola Rashidova"]].map(([text, d, done, who], i) => ({ id: `ck${i}`, text, due: dAdd(d), done, who })),
      guestList: guests, tables: Array.from({ length: Math.max(tableNo, 25) }, (_, i) => ({ no: i + 1, name: i === 0 ? "Kelin-kuyov va yaqinlar" : i < 12 ? (i % 2 ? "Kelin tomoni" : "Kuyov tomoni") : "Mehmonlar", seats: 10 })),
      budgetLines: [["food", "Ovqat (catering)", 45000000], ["joy", "Joy (to‘yxona)", 15000000], ["jihoz", "Jihozlar", 3500000], ["bezak", "Bezak va texnika", 8000000], ["odam", "Odamlar (boshlovchi, ofitsiant)", 5000000], ["other", "Boshqa (transport, sovg‘alar)", 3500000]].map(([k, name, plan]) => ({ k, name, plan })),
      share: { token: "saida-jasur", status: "pending", showBudget: false, comments: [{ at: tAgo(26), from: "client", text: "Achchiq-chuchuk o‘rniga vinegret bo‘lsa yaxshi bo‘lardi" }] }, rsvpToken: "rsvp-saida" });
    EVt("E3", { clientId: "cl6", title: "Artel — yil yakuni kechasi", type: "Korporativ", date: dAdd(-20), time: "19:00", guests: 120, venue: "Bog‘i Eram — Kichik zal", area: "Toshkent shahri", budget: 26000000, status: "yakunlandi", createdAt: tAgo(24 * 60), past: { food: 15600000, rent: 4100000, cashback: 1240000 },
      timeline: [["18:30", "Kutib olish, fursat stoli"], ["19:00", "Rahbariyat nutqi"], ["19:30", "Kechki ovqat"], ["21:00", "Mukofotlash va DJ"]].map(([t, x], i) => ({ id: `tl${i}`, t, text: x })) });
    if (!db.templates.some(t => t.id === "T1")) db.templates.push(
      { id: "T1", clientId: "cl6", name: "Korporativ kecha — 120 kishi", from: "E3", type: "Korporativ", guests: 120, setId: "v2-s2", picks: s222 ? pickBy(s222, ["Achchiq-chuchuk", "Vinegret", "Mol go‘shtidan shashlik"]) : {}, rentals: [["p1-r1", 120], ["p1-r0", 12], ["p4-r3", 1], ["p2-r1", 1]], timeline: [["18:30", "Kutib olish, fursat stoli"], ["19:00", "Rahbariyat nutqi"], ["19:30", "Kechki ovqat"], ["21:00", "Mukofotlash va DJ"]], checklist: ["Mehmonlar ro‘yxati", "Sovg‘alar", "Taqdimot ekrani"], at: tAgo(24 * 18) },
      { id: "T2", clientId: "cl6", name: "Klassik to‘y — 250 kishi", from: null, type: "Nikoh to‘yi", guests: 250, setId: "v1-s0", picks: s120 ? pickBy(s120, ["Achchiq-chuchuk", "Olivye"]) : {}, rentals: [["p1-r0", 25], ["p1-r1", 250], ["p1-r3", 1], ["p4-r0", 1], ["p4-r1", 25], ["p4-r3", 1], ["p3-r3", 1]], timeline: [["16:30", "Mehmonlarni kutib olish"], ["17:30", "Kelin-kuyov kirishi"], ["18:00", "Osh tortiladi"], ["19:00", "Boshlovchi dasturi"], ["22:00", "Yakun"]], checklist: ["Menyuni tasdiqlash", "Zal avansi", "Gul bezagi", "RSVP", "Stol joylashuvi", "Transport"], at: tAgo(24 * 80) });
  }
  if (db.orders.some(o => o.id === "CF-1044") && db.clients.some(c => c.id === "cl4")) {
    const o44 = db.orders.find(o => o.id === "CF-1044"); o44.eventId = o44.eventId || "E2";
    EVt("E2", { clientId: "cl4", title: "Otamning 60 yillik yubileyi", type: "Yubiley", date: dAdd(0), time: "19:00", guests: 90, venue: "“Zarafshon” zali", area: "Toshkent shahri", budget: 18000000, orders: ["CF-1044"], bookings: ["RB-6"], createdAt: tAgo(24 * 14),
      timeline: [["18:30", "Mehmonlarni kutib olish"], ["19:00", "Tabriklar"], ["19:30", "Osh"], ["21:00", "Tort va choy"]].map(([t, x], i) => ({ id: `tl${i}`, t, text: x })),
      checklist: [["Tortga buyurtma berish", -2, true, ""], ["Mehmonlarga qo‘ng‘iroq", -1, true, ""], ["Sovg‘a tayyorlash", 0, false, ""]].map(([text, d, done, who], i) => ({ id: `ck${i}`, text, due: dAdd(d), done, who })),
      budgetLines: [["food", "Ovqat (catering)", 15500000], ["odam", "Ofitsiantlar", 800000], ["other", "Tort va sovg‘alar", 1700000]].map(([k, name, plan]) => ({ k, name, plan })),
      live: [{ id: "lv1", at: tAgo(3), by: "v1", st: "yolda", text: "Oshxonadan chiqdik, 40 daqiqada yetamiz" }, { id: "lv2", at: tAgo(2.3), by: "v1", st: "keldi", text: "Zalga yetib keldik, dasturxon tuzalmoqda", photo: 2 }, { id: "lv3", at: tAgo(1), by: "p3", st: "keldi", text: "4 ta ofitsiant joyida, forma kiyildi" }] });
  }
  if (db.clients.some(c => c.id === "cl1")) EVt("E4", { clientId: "cl1", title: "Onamning tug‘ilgan kuni", type: "Tug‘ilgan kun", date: dAdd(9), time: "18:00", guests: 40, venue: "Uy, Yunusobod 4-mavze", area: "Toshkent shahri", budget: 7000000, orders: ["CF-1050"], bookings: ["RB-5"], createdAt: tAgo(1),
    checklist: [["Tort buyurtma qilish", 6, false, ""], ["Mehmonlarni taklif qilish", 3, false, ""]].map(([text, d, done, who], i) => ({ id: `ck${i}`, text, due: dAdd(d), done, who })),
    budgetLines: [["food", "Ovqat (catering)", 5000000], ["jihoz", "Stol-stul va idish", 1000000], ["other", "Tort va bezak", 1000000]].map(([k, name, plan]) => ({ k, name, plan })) });

  // hamyon: cashback, ball, do‘st taklifi, yechish so‘rovi
  const W = (id, cid, kind, amount, at, note, f = {}) => { if (!db.wallet.some(w => w.id === id)) db.wallet.push(Object.assign({ id, clientId: cid, kind, amount, ref: null, at, status: "ok", note }, f)); };
  if (db.clients.some(c => c.id === "cl6")) {
    W("w1", "cl6", "cashback", 1850000, tAgo(24 * 35), "Nodira va Aziz to‘yi — 5% cashback", { ref: "CF-0987" });
    W("w2", "cl6", "cashback", 1240000, tAgo(24 * 19), "Artel — yil yakuni kechasi — 5% cashback", { ref: "CF-0993" });
    W("w3", "cl6", "ref", 50000, tAgo(24 * 12), "Do‘st taklifi: Madina Yusupova ro‘yxatdan o‘tdi");
    W("w4", "cl6", "withdraw", -1000000, tAgo(30), "Kartaga yechish: 8600 •••• 4417", { status: "pending" });
    W("w5", "cl7", "ref", 50000, tAgo(24 * 12), "Kamola Rashidova taklifi bilan ro‘yxatdan o‘tish bonusi");
  }

  // shaxsiy menejer chati, Mezbon AI suhbatlari
  if (!db.pmChats.length && db.clients.some(c => c.id === "cl6")) db.pmChats.push({ clientId: "cl6", msgs: [{ id: "pm0", at: tAgo(28), from: "pm", text: "Kamola opa, Zarhal Dekor bugun kechqurun gul arkasini tasdiqlaydi. Qolgan hamma narsa joyida." }, { id: "pm1", at: tAgo(27), from: "client", text: "Rahmat, Dilshod aka! Kelin tomoni vinegret so‘radi, Lagan bilan gaplashsangiz." }, { id: "pm2", at: tAgo(26), from: "pm", text: "Gaplashdim — tadbirdan 2 kun oldingacha almashtirish mumkin ekan." }] });
  if (!db.aiChats.length) db.aiChats.push(
    { id: "ai1", clientId: "cl1", at: tAgo(1), lang: "uz", outcome: "cart", msgs: [["user", "40 kishilik tug‘ilgan kunga nima tavsiya qilasiz? Byudjet 130 ming atrofida"], ["bot", "40 kishiga, 130 000 so‘mgacha — 3 ta mos variant topdim. Eng ko‘p tanlangani: Dasturxon Events — “Klassik to‘y”, 132 000 so‘m."], ["user", "Shu bo‘lsin, salatlarni o‘zim tanlayman"], ["bot", "Zo‘r! Set oynasini ochdim — 6 ta salatdan 3 tasini belgilang."]].map(([from, text], i) => ({ from, text, at: tAgo(1) + i * 6e4 })) },
    { id: "ai2", clientId: null, at: tAgo(6), lang: "ru", outcome: "handoff", msgs: [["user", "Нужен кейтеринг на суннат той, 300 человек, Фергана"], ["bot", "В Фергане подходят 2 кейтеринга. Хотите сравнить предложения? Я передам заявку менеджеру CaterFlow."], ["user", "Да, пусть менеджер позвонит"], ["bot", "Готово: заявка передана, менеджер свяжется в течение часа."]].map(([from, text], i) => ({ from, text, at: tAgo(6) + i * 6e4 })) },
    { id: "ai3", clientId: null, at: tAgo(30), lang: "uz", outcome: null, msgs: [["user", "Oshpaz chaqirsam mahsulotni kim oladi?"], ["bot", "Ikki xil yo‘l bor: oshpaz mahsulot bilan keladi (kishi boshiga narx) yoki faqat xizmat — unda men sizga mehmon soniga qarab xarid ro‘yxatini chiqarib beraman."]].map(([from, text], i) => ({ from, text, at: tAgo(30) + i * 6e4 })) });
  if (!db.leads.some(l => l.id === "l10")) db.leads.unshift({ id: "l10", src: "sayt", name: "Mezbon AI: Farg‘ona mijozi", handle: "", phone: "+998 91 640 55 12", msg: "Mezbon AI orqali: sunnat to‘yi, 300 kishi, Farg‘ona. Menejer qo‘ng‘iroq qilishini so‘radi.", ev: "Sunnat to‘yi", guests: 300, date: dAdd(28), status: "yangi", at: tAgo(6), orderId: null, history: [{ at: tAgo(6), text: "Saytdagi Mezbon AI yordamchisidan menejerga uzatildi" }] });
  db.activity.unshift({ at: tAgo(0.6), who: "mijoz", text: "Saytdan savat buyurtmasi: CF-1050 (Dasturxon Events)" }, { at: tAgo(3.2), who: "mijoz", text: "Saytdan savat buyurtmasi: CF-1051 (Lagan Catering)" });
  db.siteV = SITE_V;
}

/* panelda: yuklanganda sayt ma’lumotini qo‘shish, hamkorlarga texkarta vazifasi bermaslik */
if (typeof postLoad === "function") {
  const _postLoad = postLoad;
  postLoad = function () { ensureSiteData(); _postLoad(); siteSyncShared(); if (typeof sitePanelSync === "function") sitePanelSync(); };
}
if (typeof ensureMonthlyReview === "function") {
  const _emr = ensureMonthlyReview;
  ensureMonthlyReview = function (vid) { if (isPartner(V(vid))) return; return _emr(vid); };
}
