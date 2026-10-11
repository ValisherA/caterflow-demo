/* CaterFlow mijoz sayti — holat, til, marshrut, umumiy yordamchilar va komponentlar.
   Ma’lumot (db) admin/vendor paneli bilan umumiy: ../js/core.js dagi KEY ostida saqlanadi. */
"use strict";
const SKEY = "caterflow-site-ui";
let S = { lang: "uz", session: null, cart: null, search: {}, ai: null, aiOpen: false, mnav: false, flash: null };
const RT = { path: [], q: {} };
const SACT = {}, SFORM = {}, SCHANGE = {}, SINPUT = {}, SMOD = {};
let sModal = null;

/* ---------- til ---------- */
const L = (uz, ru, en) => S.lang === "ru" ? (ru ?? uz) : S.lang === "en" ? (en ?? uz) : uz;
const MON = { uz: MONTHS, ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
const DOWL = { uz: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"], ru: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
const DOW_SL = () => ({ uz: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"], ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] })[S.lang];
function dL(s, year) { if (!s) return "—"; const [y, m, d] = s.split("-").map(Number), M = MON[S.lang][m - 1]; return (S.lang === "en" ? `${M} ${d}` : S.lang === "ru" ? `${d} ${M}` : `${d}-${M}`) + (year ? (S.lang === "uz" ? `, ${y}` : ` ${y}`) : ""); }
const dowL = s => DOWL[S.lang][new Date(s + "T12:00").getDay()];
function agoL(ts) { const m = Math.round((Date.now() - ts) / 6e4); if (m < 1) return L("hozirgina", "только что", "just now"); if (m < 60) return L(`${m} daqiqa oldin`, `${m} мин назад`, `${m} min ago`); const h = Math.round(m / 60); if (h < 24) return L(`${h} soat oldin`, `${h} ч назад`, `${h} h ago`); const d = Math.round(h / 24); return L(`${d} kun oldin`, `${d} дн назад`, `${d} d ago`); }
function inDays(date) { const d = daysBetween(today(), date); return d === 0 ? L("bugun", "сегодня", "today") : d === 1 ? L("ertaga", "завтра", "tomorrow") : d > 0 ? L(`${d} kun qoldi`, `через ${d} дн`, `in ${d} days`) : L(`${-d} kun oldin`, `${-d} дн назад`, `${-d} days ago`); }
const NB = t => String(t).replace(/ /g, "\u00a0");
const sm = n => NB(num(n) + L(" so‘m", " сум", " UZS"));
const smM = n => NB(mln(n).replace("mln", L("mln", "млн", "M")).replace("mlrd", L("mlrd", "млрд", "B")) + L(" so‘m", " сум", " UZS"));
const SITE_EVENTS = ["Nikoh to‘yi", "Nahorgi osh", "Sunnat to‘yi", "Beshik to‘yi", "Tug‘ilgan kun", "Yubiley", "Korporativ", "Ofis tushligi", "Ma’raka", "Boshqa"];
const EV_TR = { "Nikoh to‘yi": ["Свадьба", "Wedding"], "Nahorgi osh": ["Утренний плов", "Morning plov"], "Sunnat to‘yi": ["Суннат-той", "Circumcision feast"], "Beshik to‘yi": ["Бешик-той", "Cradle feast"], "Tug‘ilgan kun": ["День рождения", "Birthday"], "Yubiley": ["Юбилей", "Anniversary"], "Korporativ": ["Корпоратив", "Corporate event"], "Ofis tushligi": ["Офисный обед", "Office lunch"], "Ma’raka": ["Маърака", "Memorial gathering"], "Boshqa": ["Другое", "Other"] };
const evL = e => { const x = EV_TR[e]; return x ? L(e, x[0], x[1]) : e; };
const SEC_TR = { "Salatlar": ["Салаты", "Salads"], "Sovuq gazaklar": ["Холодные закуски", "Cold starters"], "Birinchi taom": ["Первое блюдо", "Soup"], "Issiq taomlar": ["Горячие блюда", "Hot dishes"], "Shirinliklar": ["Десерты", "Desserts"], "Mevalar": ["Фрукты", "Fruit"], "Ichimliklar": ["Напитки", "Drinks"], "Non va boshqalar": ["Хлеб и другое", "Bread and more"], "Boshqa": ["Другое", "Other"], "Asosiy": ["Основные", "Mains"], "Salat": ["Салаты", "Salads"], "Gazak": ["Закуски", "Starters"], "Shirinlik": ["Десерты", "Desserts"], "Ichimlik": ["Напитки", "Drinks"] };
const secL = s => { const x = SEC_TR[s]; return x ? L(s, x[0], x[1]) : s; };
const CAT_TR = { jihoz: ["Jihozlar", "Оборудование", "Equipment"], joy: ["Joy (lokatsiya)", "Площадки", "Venues"], odam: ["Odamlar", "Персонал", "People"], bezak: ["Bezak va texnika", "Декор и техника", "Decor and tech"] };
const catL = k => L(...CAT_TR[k]);
const SUB_TR = { "Stol-stul": ["Столы и стулья", "Tables and chairs"], "Shatyor": ["Шатры", "Tents"], "Idish-tovoq": ["Посуда", "Tableware"], "Dasturxon va matolar": ["Скатерти и текстиль", "Linens"], "Qozon va isitgich": ["Казаны и подогрев", "Cauldrons and warmers"], "To‘yxona va zal": ["Залы", "Halls"], "Hovli va bog‘": ["Дворы и сады", "Gardens"], "Dacha": ["Дачи", "Country houses"], "Choyxona": ["Чайханы", "Teahouses"], "Oshpaz": ["Повара", "Chefs"], "Ofitsiant": ["Официанты", "Waiters"], "Boshlovchi": ["Ведущие", "Hosts"], "Xizmatchi": ["Помощники", "Helpers"], "Gul bezagi": ["Цветы", "Flowers"], "Chiroq": ["Свет", "Lighting"], "Ovoz uskunasi": ["Звук", "Sound"], "Sahna": ["Сцена", "Stage"], "Foto va video": ["Фото и видео", "Photo and video"] };
const subL = s => { const x = SUB_TR[s]; return x ? L(s, x[0], x[1]) : s; };
const UNIT_TR = { dona: ["dona", "шт", "pc"], komplekt: ["komplekt", "комплект", "set"], kun: ["kun", "день", "day"], soat: ["soat", "час", "hour"], kishi: ["kishi", "чел", "person"], xodim: ["xodim", "сотрудник", "staff"], tadbir: ["tadbir", "мероприятие", "event"] };
const unitL = u => UNIT_TR[u] ? L(...UNIT_TR[u]) : u;
const LIVE_TR = { yolda: ["Yo‘lda", "В пути", "On the way"], keldi: ["Yetib keldi", "На месте", "Arrived"], tayyor: ["Tayyor", "Готово", "Ready"], tugadi: ["Tugadi", "Завершено", "Finished"], muammo: ["Muammo", "Проблема", "Issue"] };
const liveL = k => LIVE_TR[k] ? L(...LIVE_TR[k]) : k;
const INC_TR = { "Ofitsiantlar": ["Официанты", "Waiters"], "Idish-tovoq": ["Посуда", "Tableware"], "Yetkazib berish": ["Доставка", "Delivery"], "Stol bezagi": ["Оформление стола", "Table decor"], "Choy-qahva xizmati": ["Чай и кофе", "Tea and coffee"], "Bir martalik idish": ["Одноразовая посуда", "Disposable tableware"] };
const incL = s => { const x = INC_TR[s]; return x ? L(s, x[0], x[1]) : s; };
const REG_TR = { "Toshkent shahri": ["Ташкент", "Tashkent city"], "Toshkent viloyati": ["Ташкентская обл.", "Tashkent region"], "Samarqand": ["Самарканд", "Samarkand"], "Buxoro": ["Бухара", "Bukhara"], "Farg‘ona": ["Фергана", "Fergana"], "Andijon": ["Андижан", "Andijan"], "Namangan": ["Наманган", "Namangan"], "Navoiy": ["Навои", "Navoi"], "Jizzax": ["Джизак", "Jizzakh"] };
const PAYM_TR = { "Naqd": ["Наличные", "Cash"], "Karta (terminal)": ["Карта (терминал)", "Card (terminal)"], "Bank o‘tkazmasi": ["Банковский перевод", "Bank transfer"] };
const payL = s => { const x = PAYM_TR[s]; return x ? L(s, x[0], x[1]) : s; };
const regL = s => { const x = REG_TR[s]; return x ? L(s, x[0], x[1]) : s; };

/* ---------- ikonlar (core.js dagi to‘plamga qo‘shimcha) ---------- */
Object.assign(ICONS, {
  expand: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
  shrink: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',
  cart: '<circle cx="9" cy="21" r="1.4"/><circle cx="19" cy="21" r="1.4"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
  print: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  brief: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  spark: '<path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1z"/>',
  crown: '<path d="M2 18l2-11 5 5 3-7 3 7 5-5 2 11z"/><line x1="2" y1="21" x2="22" y2="21"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  right: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  ai: '<path d="M12 3c4.97 0 9 3.36 9 7.5S16.97 18 12 18c-.9 0-1.77-.1-2.6-.3L5 20l1-3.6C4.2 15.1 3 12.9 3 10.5 3 6.36 7.03 3 12 3z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>'
});

/* ---------- saqlash ---------- */
// eski (1-versiya) tanlovli set id’lari asl setlarga o‘tgan: savatdagi tanlov qaytadan qilinadi
const upOldSets = raw => { let s = raw || "null"; Object.keys(OLD_SETS).forEach(k => { s = s.split(`"${k}"`).join(`"${OLD_SETS[k]}"`); }); const x = JSON.parse(s); if (s !== (raw || "null") && x && x.cart && x.cart.food) x.cart.food.picks = {}; return x; };
function sLoadUI() { try { const x = upOldSets(localStorage.getItem(SKEY)); if (x)Object.assign(S, { lang: x.lang || "uz", session: x.session || null, cart: x.cart || null, search: x.search || {}, ai: x.ai || null }); } catch (e) { /* xotira bloklangan */ } }
function sSaveUI() { try { localStorage.setItem(SKEY, JSON.stringify({ lang: S.lang, session: S.session, cart: S.cart, search: S.search, ai: S.ai ? { ...S.ai, msgs: (S.ai.msgs || []).slice(-40) } : null })); } catch (e) { /* xotira yo‘q */ } }
function sSaveDb() {
  try {
    let o = null; try { o = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { o = null; }
    const clean = JSON.parse(JSON.stringify(db)); clean.sets.forEach(s => { s.media = (s.media || []).filter(m => !m.src); }); clean.purchases.forEach(x => { delete x.receipt; });
    localStorage.setItem(KEY, JSON.stringify({ v: DBV, db: clean, ui: (o && o.ui) || {} }));
  } catch (e) { /* xotira yo‘q */ }
}
function commitS() { siteSyncShared(); sSaveDb(); sSaveUI(); render(); if (sModal) renderM(); }
window.addEventListener("storage", e => {
  if (e.key !== KEY || !e.newValue) return;
  try { const d = JSON.parse(e.newValue); if (!d || d.v !== DBV || !d.db) return; db = d.db; resetCache(); if (!sModal && !document.activeElement.matches("input,textarea,select")) render(); } catch (x) { /* buzilgan yozuv */ }
});

/* ---------- marshrut ---------- */
function parseHash() { const h = (location.hash || "#/").slice(1), [p, qs] = h.split("?"); RT.path = p.split("/").filter(Boolean).map(decodeURIComponent); RT.q = {}; (qs || "").split("&").filter(Boolean).forEach(kv => { const [k, v] = kv.split("="); RT.q[decodeURIComponent(k)] = decodeURIComponent(v || ""); }); }
function href(path, q) { const qs = q ? Object.entries(q).filter(([, v]) => v !== "" && v != null && v !== false).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&") : ""; return "#/" + path.replace(/^\//, "") + (qs ? "?" + qs : ""); }
function go(path, q) { const h = href(path, q); S.mnav = false; if (location.hash === h) { render(); window.scrollTo(0, 0); } else location.hash = h; }
window.addEventListener("hashchange", () => { const sn = document.getElementById("snack"); if (sn) sn.hidden = true; parseHash(); closeM(true); S.mnav = false; render(); window.scrollTo(0, 0); });

/* ---------- sessiya va mijoz ---------- */
const cli = () => S.session ? (db.clients || []).find(c => c.id === S.session.clientId) || null : null;
const CLs = id => (db.clients || []).find(c => c.id === id);
const isMgr = c => !!c && clType(c) === "manager";
const isCorp = c => !!c && clType(c) === "company";
const cUnreadS = cid => db.cnotifs.filter(n => n.clientId === cid && !n.read).length;
function cnotifyS(cid, text, link) { if (!cid) return; db.cnotifs.unshift({ id: uid("cn"), clientId: cid, at: Date.now(), text, link: link || null, read: false }); const c = CLs(cid); if (c && c.tg) db.tglog.unshift({ id: uid("tg"), clientId: cid, at: Date.now(), text }); }
// boshqa mijozga (taklif egasi, tadbir egasi) xabar — uning tilida: [uz, ru, en]
function cnotifyC(cid, t3, link) { const c = CLs(cid), i = { ru: 1, en: 2 }[(c && c.lang) || "uz"] || 0; cnotifyS(cid, t3[i] || t3[0], link); }
const clTypeL = c => L(...({ person: ["Shaxsiy", "Частный клиент", "Personal"], manager: ["Event menejer", "Ивент-менеджер", "Event planner"], company: ["Kompaniya", "Компания", "Company"] })[clType(c)]);
function notifyV(vid, text, link) { db.notifs.unshift({ id: uid("n"), vendorId: vid, at: Date.now(), text, link: link || null, read: false, to: null, roles: ["owner", "manager"] }); }
function logS(text) { db.activity.unshift({ at: Date.now(), who: "mijoz", text }); if (db.activity.length > 80) db.activity.length = 80; }
const histS = (o, text) => (o.history = o.history || []).push({ at: Date.now(), text });

/* ---------- vendor va menyu yordamchilari ---------- */
const VV = id => db.vendors.find(v => v.id === id);
const vSets = vid => db.sets.filter(s => s.vendorId === vid && setShown(s)).sort((a, b) => (liveGroups(b).length ? 1 : 0) - (liveGroups(a).length ? 1 : 0));
const caterers = () => db.vendors.filter(v => !isPartner(v) && vSets(v.id).length);
const fromPP = v => { const ps = vSets(v.id).map(s => s.price); return ps.length ? Math.min(...ps) : 0; };
const vRate = vid => { const l = fbFor(vid); return { n: l.length, r: avgRating(l) }; };
const vFee = (v, area) => v.site && v.site.fees && area in v.site.fees ? v.site.fees[area] : null;
// setda o‘z minimal soni bo‘lsa (masalan ofis tushligi 10 kishidan) — o‘sha, aks holda vendorning umumiy qoidasi
const setMin = (s, v) => s && s.minGuests > 0 ? s.minGuests : v ? v.rules.minGuests || 0 : 0;
const reliable = v => v.site && v.site.onTime >= 96;
const fast = v => v.site && v.site.autoAccept;
const hasChoice = vid => vSets(vid).some(s => liveGroups(s).length);
const segOf = s => /tushli[kg]|lanch|lunch/i.test(s.name) ? "ofis" : (s.minGuests || 0) >= 50 || /to‘y|to'y/i.test(s.name) ? "toy" : (s.minGuests || 0) <= 30 ? "kichik" : "korp";
function vSegs(v) { const out = new Set(), ss = vSets(v.id); ss.forEach(s => out.add(segOf(s))); if (v.rules.maxGuests >= 150) out.add("toy"); if (v.rules.minGuests <= 60) out.add("korp"); if (v.rules.minGuests <= 30) out.add("kichik"); return out; }
function rateHTML(vid) { const x = vRate(vid); return x.n ? `${stars(x.r)} <b>${x.r.toFixed(1).replace(".", ",")}</b> <span class="faint">(${x.n})</span>` : `<span class="faint">${L("Yangi", "Новый", "New")}</span>`; }
// mijoz shartlariga moslik: sabablar ro‘yxati (bo‘sh — mos)
function fitIssues(v, q, s) {
  const out = [], R = v.rules, g = +q.guests || 0;
  if (v.closed) out.push(L("hozircha buyurtma qabul qilmaydi", "временно не принимает заказы", "not taking orders right now"));
  if (q.area && !R.areas.includes(q.area)) out.push(L(`${regL(q.area)} hududiga xizmat qilmaydi`, `не обслуживает ${regL(q.area)}`, `doesn’t serve ${regL(q.area)}`));
  const mn = s ? setMin(s, v) : R.minGuests;
  if (g && g < mn) out.push(L(`kamida ${mn} kishi`, `минимум ${mn} гостей`, `minimum ${mn} guests`));
  if (g && g > R.maxGuests) out.push(L(`ko‘pi bilan ${R.maxGuests} kishi`, `максимум ${R.maxGuests} гостей`, `maximum ${R.maxGuests} guests`));
  if (q.date) { if (R.blocked.includes(q.date)) out.push(L(`${dL(q.date)} band`, `${dL(q.date)} занято`, `${dL(q.date)} is booked`)); const ld = (v.site && v.site.leadDays) || 0; if (daysBetween(today(), q.date) < ld) out.push(L(`kamida ${ld} kun oldin buyurtma qilinadi`, `заказ минимум за ${ld} дн`, `order at least ${ld} days ahead`)); if (q.date < today()) out.push(L("sana o‘tib ketgan", "дата в прошлом", "date is in the past")); }
  return out;
}

/* ---------- komponentlar ---------- */
const btn = (label, act, data = {}, cls = "") => `<button type="button" class="btn ${cls}" data-a="${act}"${Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join("")}>${label}</button>`;
const pillS = (text, tone = "") => `<span class="pill ${tone}">${text}</span>`;
const optS = (v, l, cur) => `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`;
const emptyS = (t, action = "") => `<div class="empty"><p>${t}</p>${action ? `<div class="row" style="justify-content:center;margin-top:12px">${action}</div>` : ""}</div>`;
function mHeadS(title, sub) { return `<header class="m-head"><div class="grow"><h2 id="m-t">${title}</h2>${sub ? `<p class="small muted" style="margin-top:4px">${sub}</p>` : ""}</div><button type="button" class="icon-btn" data-a="m-close" aria-label="${L("Yopish", "Закрыть", "Close")}">${ic("x")}</button></header>`; }
function qtyIn(name, val, min = 1, max = 99999, attrs = "") { return `<span class="qty"><button type="button" data-a="qty" data-d="-1" data-for="${name}" aria-label="−">−</button><input type="number" id="q-${name}" name="${name}" value="${val}" min="${min}" max="${max}" inputmode="numeric" ${attrs} aria-label="${L("Miqdor", "Количество", "Quantity")}"><button type="button" data-a="qty" data-d="1" data-for="${name}" aria-label="+">+</button></span>`; }
function menuList(lines, picked = new Set()) { if (!lines.length) return ""; return `<div class="mlist">${groupLines(lines).map(g => `<div class="msec"><h4>${esc(secL(g.sec))}</h4><ul>${g.lines.map(l => `<li class="${picked.has(l.name) ? "pick" : ""}"><span>${esc(l.name)}</span>${l.qty ? `<span class="q">${esc(l.qty)}</span>` : ""}</li>`).join("")}</ul></div>`).join("")}</div>`; }
function stepperS(steps, cur) { return `<ol class="stepper">${steps.map((s, i) => `<li class="${i < cur ? "done" : i === cur ? "cur" : ""}"><span class="d">${i < cur ? ic("check", 12) : i + 1}</span><span>${s}</span></li>`).join("")}</ol>`; }
function toastS(msg) { const t = document.getElementById("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastS.t); toastS.t = setTimeout(() => t.classList.remove("show"), 2800); }
function snackS(msg, label, fn) { let el = document.getElementById("snack"); if (!el) { el = document.createElement("div"); el.id = "snack"; el.className = "snack"; el.setAttribute("role", "status"); document.body.appendChild(el); } el.innerHTML = `<span>${msg}</span>${label ? `<button type="button" data-a="snack-act">${label}</button>` : ""}`; el.hidden = false; S._snackFn = fn || null; clearTimeout(snackS.t); snackS.t = setTimeout(() => { el.hidden = true; S._snackFn = null; }, 6000); }
SACT["snack-act"] = () => { const f = S._snackFn; const el = document.getElementById("snack"); if (el) el.hidden = true; S._snackFn = null; if (f) f(); };
function copyS(text) { try { navigator.clipboard.writeText(text); } catch (e) { /* ruxsat yo‘q */ } toastS(L("Nusxalandi", "Скопировано", "Copied")); }
const absURL = h => location.href.split("#")[0] + h;

/* ---------- oyna ---------- */
let mOpener = null;
function openM(type, data = {}) { if (!sModal) mOpener = document.activeElement; sModal = Object.assign({ type }, data); renderM(); const f = document.querySelector("#modal input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([readonly]), #modal textarea"); if (f && !data.noFocus) f.focus({ preventScroll: true }); }
function closeM(silent) { sModal = null; if (!silent || document.getElementById("modal").innerHTML) renderM(); const o = mOpener; mOpener = null; if (o && document.contains(o) && o.focus) o.focus({ preventScroll: true }); }
function renderM() {
  const root = document.getElementById("modal");
  if (!sModal) { root.innerHTML = ""; document.body.classList.remove("modal-open"); return; }
  const fn = SMOD[sModal.type]; if (!fn) { sModal = null; root.innerHTML = ""; return; }
  const st = root.querySelector(".modal") ? root.querySelector(".modal").scrollTop : 0;
  root.innerHTML = `<div class="overlay" data-a="m-overlay"><div class="modal ${sModal.wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="m-t">${fn(sModal)}</div></div>`;
  document.body.classList.add("modal-open"); const md = root.querySelector(".modal"); if (md && sModal.keepScroll) md.scrollTop = st;
}

/* ---------- ramka: sarlavha va pastki qism ---------- */
function header() {
  const c = cli(), p = RT.path[0] || "", n = cartCount(), un = c ? cUnreadS(c.id) : 0;
  const nav = [["catering", L("Catering", "Кейтеринг", "Catering")], ["yigish", L("O‘z setingiz", "Свой сет", "Build your set")], ["ijara", L("Ijara va xizmatlar", "Аренда и услуги", "Rentals and services")], ["menejer", L("Event menejerlar", "Ивент-менеджерам", "Event planners")], ["korporativ", L("Korporativ", "Корпоративным", "Corporate")]];
  return `<header class="hd"><div class="wrap hd-in">
    <button type="button" class="icon-btn burger" data-a="mnav" aria-label="${L("Menyu", "Меню", "Menu")}" aria-expanded="${S.mnav}">${ic("menu", 22)}</button>
    <button type="button" class="brand" data-a="go" data-to=""><span class="mk">${logo(30)}</span><span>CaterFlow<small>${L("Catering · ijara · tadbir", "Кейтеринг · аренда · события", "Catering · rentals · events")}</small></span></button>
    <nav class="hd-nav" aria-label="${L("Asosiy menyu", "Главное меню", "Main menu")}">${nav.map(([k, l]) => `<button type="button" class="${p === k || (k === "catering" && p === "v") ? "on" : ""}" data-a="go" data-to="${k}">${l}${k === "yigish" ? ` <span style="color:var(--gold)">✦</span>` : ""}</button>`).join("")}</nav>
    <div class="hd-r"><div class="lang" role="group" aria-label="Til">${["uz", "ru", "en"].map(l => `<button type="button" class="${S.lang === l ? "on" : ""}" data-a="lang" data-l="${l}">${l.toUpperCase()}</button>`).join("")}</div>
      ${c ? `<button type="button" class="icon-btn cart-btn" data-a="notifs" aria-label="${L("Bildirishnomalar", "Уведомления", "Notifications")}">${ic("bell", 20)}${un ? `<span class="badge">${un}</span>` : ""}</button><button type="button" class="btn btn-sm btn-line" data-a="go" data-to="kabinet" aria-label="${L("Kabinet", "Кабинет", "Account")}">${ic("user", 16)} <span class="nm">${esc(firstName(c.name))}</span></button>` : `<button type="button" class="btn btn-sm btn-line" data-a="login" aria-label="${L("Kirish", "Войти", "Sign in")}">${ic("user", 16)} <span class="nm">${L("Kirish", "Войти", "Sign in")}</span></button>`}
      <button type="button" class="ai-btn" data-a="ai-open" aria-label="Mezbon AI">${ic("ai", 17)}<span class="t">Mezbon</span></button>
      <button type="button" class="icon-btn cart-btn" data-a="go" data-to="savat" aria-label="${L("Savat", "Корзина", "Cart")}">${ic("cart", 21)}${n ? `<span class="badge">${n}</span>` : ""}</button></div></div>
    <nav class="mnav" ${S.mnav ? "" : "hidden"}>${nav.map(([k, l]) => `<button type="button" data-a="go" data-to="${k}">${l}</button>`).join("")}<div class="row" style="padding-top:10px">${["uz", "ru", "en"].map(l => `<button type="button" class="chip ${S.lang === l ? "on" : ""}" style="color:${S.lang === l ? "#fff" : "var(--ink)"}" data-a="lang" data-l="${l}">${l.toUpperCase()}</button>`).join("")}</div></nav></header>`;
}
function footer() {
  return `<footer class="ft"><div class="wrap"><div class="ft-g">
    <div class="stack-s"><div class="brand" style="color:#fff"><span class="mk">${logo(28)}</span><span>CaterFlow</span></div><p>${L("O‘zbekistondagi catering, ijara va tadbir xizmatlari bitta joyda. Menyuni o‘zingiz tanlaysiz, narx oldindan ko‘rinadi.", "Кейтеринг, аренда и услуги для мероприятий в Узбекистане — в одном месте. Вы сами выбираете меню, цена видна сразу.", "Catering, rentals and event services in Uzbekistan in one place. Pick your menu and see the price upfront.")}</p></div>
    <div><h4>${L("Mijozlarga", "Клиентам", "Customers")}</h4><button data-a="go" data-to="catering">${L("Catering", "Кейтеринг", "Catering")}</button><button data-a="go" data-to="yigish">${L("O‘z setingizni yig‘ing", "Соберите свой сет", "Build your own set")}</button><button data-a="go" data-to="ijara">${L("Ijara va xizmatlar", "Аренда и услуги", "Rentals and services")}</button><button data-a="go" data-to="sorov">${L("Taklif so‘rash", "Запросить предложения", "Request quotes")}</button></div>
    <div><h4>${L("Biznesga", "Бизнесу", "Business")}</h4><button data-a="go" data-to="menejer">${L("Event menejerlar va ambassadorlik", "Ивент-менеджерам и амбассадорам", "Event planners and ambassadors")}</button><button data-a="go" data-to="korporativ">${L("Korporativ va ofis tushligi", "Корпоративным и офисные обеды", "Corporate and office lunch")}</button><button data-a="panel">${L("Vendor va admin paneli", "Панель вендора и админа", "Vendor and admin panel")}</button></div>
    <div><h4>${L("Aloqa", "Контакты", "Contact")}</h4><p>+998 71 200 00 26</p><p>@caterflow_uz</p><p class="tiny" style="margin-top:8px">${L("To‘lov vendorga naqd yoki o‘tkazma orqali. Online to‘lov tez orada.", "Оплата вендору наличными или переводом. Онлайн-оплата скоро.", "Pay the vendor in cash or by transfer. Online payment is coming soon.")}</p></div>
  </div><div class="ft-b"><span>© 2026 CaterFlow</span><span>${L("Demo: ma’lumotlar shu brauzerda saqlanadi", "Демо: данные хранятся в этом браузере", "Demo: data is stored in this browser")}</span></div></div></footer>`;
}
const cartCount = () => { const c = S.cart; if (!c) return 0; return (c.food ? 1 : 0) + (c.rentals || []).length; };

/* ---------- hodisalar ---------- */
document.addEventListener("click", e => { const el = e.target.closest("[data-a]"); if (!el) return; const fn = SACT[el.dataset.a]; if (fn) { if (el.tagName === "A") e.preventDefault(); fn(el, e); } });
document.addEventListener("submit", e => { const f = e.target.closest("form[data-f]"); if (!f) return; e.preventDefault(); const fn = SFORM[f.dataset.f]; if (fn) fn(f, new FormData(f)); });
document.addEventListener("change", e => { const el = e.target.closest("[data-c]"); if (el && SCHANGE[el.dataset.c]) SCHANGE[el.dataset.c](el, e); });
document.addEventListener("input", e => { const el = e.target.closest("[data-i]"); if (el && SINPUT[el.dataset.i]) SINPUT[el.dataset.i](el, e); });
document.addEventListener("keydown", e => { if (e.key === "Tab" && sModal) { const f = [...document.querySelectorAll("#modal button:not([disabled]), #modal input, #modal select, #modal textarea, #modal a[href]")].filter(x => x.offsetParent); if (f.length) { const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } } if (e.key === "Escape") { if (sModal) closeM(); else if (S.aiOpen) { S.aiOpen = false; renderAI(); } } if (e.key === "Enter" && e.target.matches("[role=link]")) e.target.click(); });
Object.assign(SACT, {
  go: el => go(el.dataset.to || "", el.dataset.q ? JSON.parse(el.dataset.q) : null),
  lang: el => { S.lang = el.dataset.l; document.documentElement.lang = S.lang; const c = cli(); if (c) { c.lang = S.lang; sSaveDb(); } sSaveUI(); render(); renderAI(); if (sModal) renderM(); },
  mnav: () => { S.mnav = !S.mnav; render(); },
  "m-close": () => closeM(),
  "m-overlay": (el, e) => { if (e.target === el) closeM(); },
  copy: el => copyS(el.dataset.text),
  panel: () => { location.href = "../index.html"; },
  print: () => window.print(),
  qty: el => { const inp = document.getElementById("q-" + el.dataset.for); if (!inp) return; const v = Math.max(+inp.min || 0, Math.min(+inp.max || 1e9, (+inp.value || 0) + (+el.dataset.d) * (+el.dataset.step || +inp.step || 1))); inp.value = v; inp.dispatchEvent(new Event("input", { bubbles: true })); inp.dispatchEvent(new Event("change", { bubbles: true })); }
});

// tadbir qatori: katakning istalgan joyini bossa maydon ochiladi (sana — kalendar)
document.addEventListener("click", e => { const f = e.target.closest(".hb-f"); if (!f || e.target.closest("input,select")) return; const i = f.querySelector("input,select"); if (!i) return; i.focus(); if (i.type === "date" && i.showPicker) try { i.showPicker(); } catch (x) { /* brauzer ruxsat bermadi */ } });
