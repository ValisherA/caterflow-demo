/* CaterFlow prototip — umumiy yordamchilar, holat va hisob-kitoblar */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const MONTHS_S = ["Yan","Fev","Mar","Apr","May","Iyun","Iyul","Avg","Sen","Okt","Noy","Dek"];

const pad = n => String(n).padStart(2, "0");
const localISO = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const today = () => localISO(new Date());
function dAdd(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return localISO(d); }
const tAgo = h => Date.now() - h * 3600e3;
function fDate(s) { if (!s) return "—"; const [, m, d] = s.split("-").map(Number); return d + "-" + MONTHS[m - 1]; }
function fDateY(s) { if (!s) return "—"; const [y, m, d] = s.split("-").map(Number); return d + "-" + MONTHS[m - 1] + ", " + y; }
function fDT(ts) { const d = new Date(ts); return d.getDate() + "-" + MONTHS[d.getMonth()] + ", " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "hozirgina";
  if (m < 60) return m + " daqiqa oldin";
  const h = Math.round(m / 60);
  if (h < 24) return h + " soat oldin";
  return Math.round(h / 24) + " kun oldin";
}
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5); }
function num(n) { n = Math.round(n || 0); const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); return (n < 0 ? "−" : "") + s; }
const som = n => num(n) + " so‘m";
function mln(n) {
  const a = Math.abs(n), s = n < 0 ? "−" : "";
  if (a >= 1e9) return s + (a / 1e9).toFixed(1).replace(".", ",") + " mlrd";
  if (a >= 1e6) return s + (a / 1e6).toFixed(1).replace(".", ",").replace(",0", "") + " mln";
  return num(n);
}
function pct(x) { return (Math.round(x * 1000) / 10).toFixed(1).replace(".", ",").replace(",0", "") + "%"; }
function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
let _uid = Date.now() % 1e6;
const uid = p => p + (++_uid).toString(36);
function shortName(n) { const p = String(n).trim().split(/\s+/); return p.length > 1 ? p[0] + " " + p[1][0] + "." : p[0]; }
const firstName = n => String(n).trim().split(/\s+/)[0];
function monthKeys() { const d = new Date(), out = []; for (let i = 2; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(x.getFullYear() + "-" + pad(x.getMonth() + 1)); } return out; }
function mLabel(mk) { const [y, m] = mk.split("-").map(Number); return cap(MONTHS[m - 1]) + " " + y; }
function mShort(mk) { return MONTHS_S[Number(mk.split("-")[1]) - 1]; }

/* ---------- lug‘atlar ---------- */
const EVENTS = ["Nikoh to‘yi","Beshik to‘yi","Sunnat to‘yi","Tug‘ilgan kun","Korporativ","Yubiley","Ma’raka","Boshqa"];
const VILOYATLAR = ["Toshkent shahri","Toshkent viloyati","Samarqand","Buxoro","Farg‘ona","Andijon","Namangan","Qashqadaryo","Surxondaryo","Xorazm","Navoiy","Jizzax","Sirdaryo","Qoraqalpog‘iston"];
const AREAS = VILOYATLAR;
const DOW = ["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba","Yakshanba"];
const DOW_S = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];
const todayDow = () => ((new Date().getDay() + 6) % 7) + 1;
const PAY_METHODS = ["Bank o‘tkazmasi","Click","Payme","Naqd"];
const INCLUDES = ["Ofitsiantlar","Idish-tovoq","Yetkazib berish","Stol bezagi","Choy-qahva xizmati"];
const REJECT_REASONS = ["Sana band","Mehmon soni mos emas","Byudjet past","Hudud uzoq","Boshqa"];
const EXP_CATS = ["Ish haqi","Transport","Ijara","Kommunal","Marketing","Boshqa"];
const DISH_CATS = ["Asosiy","Salat","Gazak","Shirinlik","Ichimlik"];
// mijozga ko‘rinadigan menyu bo‘limlari (oddiy menyu va texkartali setlar uchun bir xil)
const MENU_SECS = ["Salatlar","Sovuq gazaklar","Birinchi taom","Issiq taomlar","Shirinliklar","Mevalar","Ichimliklar","Non va boshqalar"];
const DISH_SEC = { Asosiy: "Issiq taomlar", Salat: "Salatlar", Gazak: "Sovuq gazaklar", Shirinlik: "Shirinliklar", Ichimlik: "Ichimliklar" };
const VL_SOURCES = ["Instagram","Telegram","Telefon","Tavsiya","Boshqa"];

const LEAD_ST = { yangi: ["Yangi","info"], aloqa: ["Aloqaga chiqildi","accent"], muzokara: ["Muzokarada","saffron"], buyurtma: ["Buyurtma bo‘ldi","good"], yoqotildi: ["Yo‘qotildi","bad"] };
const LEAD_ORDER = ["yangi","aloqa","muzokara","buyurtma","yoqotildi"];
const SRC = { ig_dm: ["Instagram Direct","ig"], ig_ad: ["Instagram reklama","ig"], sayt: ["Sayt","neutral"], tel: ["Telefon","neutral"] };
const ORD_ST = { yangi: ["Yangi","info"], vendorlarda: ["Vendorlarga yuborildi","saffron"], takliflar: ["Takliflar keldi","accent"], mijozda: ["Mijozga yuborildi","accent"], tasdiqlandi: ["Tasdiqlandi","good"], bajarilmoqda: ["Bajarilmoqda","good"], yakunlandi: ["Yakunlandi","neutral"], bekor: ["Bekor qilindi","bad"] };
const REQ_ST = { kutilmoqda: ["Javob kutilmoqda","saffron"], javob: ["Taklif berdi","good"], rad: ["Rad etdi","bad"], avto: ["Avtomatik rad","neutral"] };
const VL_ST = { yangi: ["Yangi","info"], aloqa: ["Aloqaga chiqildi","accent"], degustatsiya: ["Degustatsiya","saffron"], taklif: ["Taklif berildi","saffron"], kelishildi: ["Kelishildi","good"], yoqotildi: ["Yo‘qotildi","bad"] };
const VL_ORDER = ["yangi","aloqa","degustatsiya","taklif","kelishildi","yoqotildi"];
const VL_OPEN = s => s !== "kelishildi" && s !== "yoqotildi";
const TONES = [
  "linear-gradient(135deg,#b8681f,#6f3510)", "linear-gradient(135deg,#2c6b8e,#14354b)",
  "linear-gradient(135deg,#7a8c36,#3f4c18)", "linear-gradient(135deg,#a8443b,#5a1d19)",
  "linear-gradient(135deg,#c2952b,#76550f)", "linear-gradient(135deg,#5b4a8f,#2b224f)"
];

/* ---------- ikonlar ---------- */
const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  left: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  wallet: '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1.5"/>',
  pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 10h20"/><path d="M9 6c0-1 1-1.5 1-2.5M14 6c0-1 1-1.5 1-2.5"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  bar: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  up: '<polyline points="18 15 12 9 6 15"/>',
  down: '<polyline points="6 9 12 15 18 9"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'
};
function ic(name, size = 18) { return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`; }
function logo(size = 28) { return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16" cy="16" r="8.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.2 2.3"/><circle cx="16" cy="16" r="3.2" fill="currentColor"/></svg>`; }

/* ---------- holat ---------- */
const KEY = "caterflow-demo-v1", DBV = 12;
let db, ui;
const uiDefault = () => ({ session: null, view: "dash", param: null, prev: null, modal: null, ordFilter: "all", leadSrc: "all", custFilter: "all", menuTab: "sets", costBasis: "avg", finMonth: null, vTab: "umumiy", vlVendor: "all", vlStatus: "open", reqTab: "pending", stockTab: "products", plan: null, vRegion: "all", vSort: { k: "gmv", d: -1 }, afMonth: null, afRegion: "all", afSort: { k: "gmv", d: -1 }, rSort: { k: "gmv", d: -1 }, vstage: null, st: null, taskF: null, kDate: null, kBuf: 5, kOff: {}, rPor: 100, pf: "all", mvF: "all" });
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === DBV && d.db) { db = d.db; ui = Object.assign(uiDefault(), d.ui || {}, { modal: null }); return; } }
  } catch (e) { /* saqlash bloklangan bo‘lsa, demo ma’lumotlardan boshlaymiz */ }
  db = seed(); ui = uiDefault();
}
function save() {
  try {
    const clean = JSON.parse(JSON.stringify(db));
    clean.sets.forEach(s => { s.media = s.media.filter(m => !m.src); });
    clean.purchases.forEach(x => { delete x.receipt; });
    localStorage.setItem(KEY, JSON.stringify({ v: DBV, db: clean, ui: { session: ui.session, view: ui.view, param: ui.param, costBasis: ui.costBasis, lang: ui.lang } }));
  } catch (e) { /* xotira yo‘q — sahifa baribir ishlaydi */ }
}

/* ---------- topuvchilar ---------- */
const V = id => db.vendors.find(v => v.id === id);
const P = id => db.products.find(p => p.id === id);
const D = id => db.dishes.find(d => d.id === id);
const SET = id => db.sets.find(s => s.id === id) || (db.osets || []).find(s => s.id === id);
const ORD = id => db.orders.find(o => o.id === id) || db.ownOrders.find(o => o.id === id);
const LEAD = id => db.leads.find(l => l.id === id);
const VLEAD = id => db.ownLeads.find(l => l.id === id);
function log(who, text) { db.activity.unshift({ at: Date.now(), who, text }); if (db.activity.length > 80) db.activity.length = 80; }
function hist(o, text) { (o.history = o.history || []).push({ at: Date.now(), text }); }
function whoName(w) { if (w === "admin") return "Admin"; if (w === "mijoz") return "Mijoz"; if (w === "instagram") return "Instagram"; const v = V(w); return v ? v.name : w; }

/* ---------- ombor va tannarx ---------- */
const small = u => u === "kg" ? "g" : u === "l" ? "ml" : u;
const isMass = u => u === "kg" || u === "l";
let _pcache = null;
function pList(pid) {
  if (!_pcache) { _pcache = {}; db.purchases.forEach(x => { (_pcache[x.productId] = _pcache[x.productId] || []).push(x); }); Object.values(_pcache).forEach(l => l.sort((a, b) => a.date.localeCompare(b.date))); }
  return _pcache[pid] || [];
}
let _bcache = {};
const resetCache = () => { _pcache = null; _bcache = {}; };
function fmtQty(p, qty) {
  if (!isMass(p.unit)) return num(qty < 0 ? -Math.ceil(-qty) : Math.ceil(qty)) + " " + p.unit;
  const sm = small(p.unit);
  if (Math.abs(qty) < 1) return num(qty * 1000) + " " + sm;
  return (Math.round(qty * 10) / 10).toString().replace(".", ",") + " " + p.unit;
}
const unitP = x => x.qty ? x.total / x.qty : 0;
function lastP(pid) { const l = pList(pid); return l.length ? unitP(l[l.length - 1]) : 0; }
function prevP(pid) { const l = pList(pid); return l.length > 1 ? unitP(l[l.length - 2]) : 0; }
function avgP(pid) { const l = pList(pid); const q = l.reduce((a, x) => a + x.qty, 0), t = l.reduce((a, x) => a + x.total, 0); return q ? t / q : 0; }
function costP(pid) { return ui.costBasis === "last" ? lastP(pid) : avgP(pid); }
function smallPrice(p, price) { return isMass(p.unit) ? price / 1000 : price; }
function ingCost(i) { const p = P(i.p); if (!p) return 0; const c = costP(i.p); return isMass(p.unit) ? i.q / 1000 * c : i.q * c; }
const dishCost = d => d ? d.ing.reduce((a, i) => a + ingCost(i), 0) : 0;
const isSimple = s => !!s && s.kind === "simple";
const linkedAll = s => (s.lines || []).every(l => l.d);
// oddiy menyuda tannarx: hamma taom texkartaga bog‘langan bo‘lsa hisoblanadi, bo‘lmasa vendor kiritgan taxminiy summa
const setCost = s => !s ? 0 : isSimple(s) && !linkedAll(s) && s.estCost > 0 ? s.estCost : s.items.reduce((a, it) => a + dishCost(D(it.d)) * it.n, 0);
const costKnown = s => !isSimple(s) || linkedAll(s) || s.estCost > 0;
function setLines(s) {
  if (!s) return []; if (isSimple(s)) return s.lines || [];
  return s.items.map(it => { const d = D(it.d); return d ? { sec: DISH_SEC[d.cat] || d.cat, name: d.name, qty: it.n !== 1 ? `${d.portion} ×${String(it.n).replace(".", ",")}` : d.portion, d: d.id } : null; }).filter(Boolean);
}
const setShown = s => !!s && s.visible !== false && setLines(s).length > 0;
function groupLines(lines) { const g = []; lines.forEach(l => { const sec = l.sec || "Boshqa"; let x = g.find(y => y.sec === sec); if (!x) g.push(x = { sec, lines: [] }); x.lines.push(l); }); return g; }
// mijozga ko‘rinadigan menyu ro‘yxati (bo‘limlar bo‘yicha); tr — bo‘lim nomini tarjima qiluvchi funksiya
function menuHTML(lines, tr = x => x, cls = "") { return lines.length ? `<div class="mlist ${cls}">${groupLines(lines).map(g => `<div class="msec"><h4>${esc(tr(g.sec))}</h4><ul>${g.lines.map(l => `<li><span>${esc(l.name)}</span>${l.qty ? `<span class="q">${esc(l.qty)}</span>` : ""}</li>`).join("")}</ul></div>`).join("")}</div>` : ""; }
const margin = (price, cost) => price ? (price - cost) / price : 0;
const marginTone = m => m >= 0.55 ? "good" : m >= 0.35 ? "warn" : "bad";

/* ---------- moliya ---------- */
function pnl(vid, mk) {
  const sales = db.sales.filter(s => s.vendorId === vid && s.date.slice(0, 7) === mk).sort((a, b) => a.date.localeCompare(b.date));
  let revCF = 0, revOwn = 0, cogs = 0;
  sales.forEach(s => { const r = s.guests * s.pp; if (s.source === "CaterFlow") revCF += r; else revOwn += r; cogs += setCost(SET(s.setId)) * s.guests; });
  const exps = db.expenses.filter(e => e.vendorId === vid && e.month === mk);
  const commission = Math.round(revCF * db.settings.commission / 100), bonus = bonusUsed(vid, mk), commNet = commission - bonus;
  const opex = exps.reduce((a, e) => a + e.amount, 0) + commNet;
  const rev = revCF + revOwn, gross = rev - cogs, net = gross - opex;
  return { sales, revCF, revOwn, rev, cogs, gross, exps, commission, bonus, commNet, opex, net, margin: rev ? net / rev : 0 };
}
function custStats(c) {
  const s = db.sales.filter(x => x.customerId === c.id);
  const orders = s.length + (c.oldOrders || 0);
  const total = s.reduce((a, x) => a + x.guests * x.pp, 0) + (c.oldTotal || 0);
  const last = s.reduce((m, x) => x.date > m ? x.date : m, c.oldLast || "");
  return { orders, total, last, active: !!last && daysBetween(last, today()) <= 90 };
}
function fbFor(vid, setId, all) { return db.feedback.filter(f => f.vendorId === vid && (!setId || f.setId === setId) && (all || !f.status || f.status === "published")).sort((a, b) => b.at - a.at); }
const avgRating = l => l.length ? l.reduce((a, f) => a + f.rating, 0) / l.length : 0;
function vendorReqs(vid) { return db.orders.flatMap(o => o.requests.filter(r => r.vendorId === vid).map(r => ({ o, r }))); }
function respRate(vid) { const rs = vendorReqs(vid).filter(x => x.r.status !== "avto"); const a = rs.filter(x => x.r.status === "javob" || x.r.status === "rad").length; return rs.length ? a / rs.length : 0; }
/* ---------- komissiya va vendor faolligi ---------- */
const cfSales = (vid, mk) => db.sales.filter(s => s.source === "CaterFlow" && (!vid || s.vendorId === vid) && (!mk || s.date.slice(0, 7) === mk));
const saleRev = s => s.guests * s.pp;
const commOf = rev => Math.round(rev * db.settings.commission / 100);
function commAccrued(vid, mk) { return commOf(cfSales(vid, mk).reduce((a, s) => a + saleRev(s), 0)); }
function commPaid(vid) { return db.payments.filter(x => !vid || x.vendorId === vid).reduce((a, x) => a + x.amount, 0); }
/* bonus: CaterFlow komissiyasini sana tartibida qoplaydi, tugagach komissiyani vendor o‘zi to‘laydi */
function bonusLedger(vid) {
  if (_bcache[vid]) return _bcache[vid];
  const grants = (db.bonuses || []).filter(b => b.vendorId === vid).sort((a, b) => a.date.localeCompare(b.date));
  const sales = cfSales(vid).slice().sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  let pool = 0, gi = 0, used = 0; const bySale = {};
  sales.forEach(s => { while (gi < grants.length && grants[gi].date <= s.date) pool += grants[gi++].amount; const c = commOf(saleRev(s)), cov = Math.min(pool, c); pool -= cov; used += cov; bySale[s.id] = cov; });
  const granted = grants.reduce((a, g) => a + g.amount, 0);
  return (_bcache[vid] = { grants, granted, used, left: granted - used, bySale });
}
const saleBonus = s => s.source === "CaterFlow" ? (bonusLedger(s.vendorId).bySale[s.id] || 0) : 0;
const bonusUsed = (vid, mk) => cfSales(vid, mk).reduce((a, s) => a + saleBonus(s), 0);
const commDue = (vid, mk) => commAccrued(vid, mk) - bonusUsed(vid, mk);
const commDebt = vid => Math.max(0, commDue(vid) - commPaid(vid));
const predBonus = (vid, comm) => Math.max(0, Math.min(bonusLedger(vid).left, comm));
function isActiveVendor(v) { const since = dAdd(-30); return !v.closed && (db.sales.some(s => s.vendorId === v.id && s.date >= since) || vendorReqs(v.id).some(x => x.r.quote && x.r.quote.at > Date.now() - 30 * 864e5)); }
function sortBy(rows, s) { return rows.sort((a, b) => { const x = a[s.k], y = b[s.k]; return (typeof x === "string" ? x.localeCompare(y) : x - y) * s.d; }); }
function thSort(label, k, s, act, cls = "") { const on = s.k === k; return `<th class="${cls}"><button type="button" class="th-sort ${on ? "on" : ""}" data-act="${act}" data-k="${k}" aria-sort="${on ? (s.d > 0 ? "ascending" : "descending") : "none"}">${label}${on ? (s.d > 0 ? " ▲" : " ▼") : ""}</button></th>`; }
function orderQuote(o) { if (!o.vendorId) return null; const r = o.requests.find(r => r.vendorId === o.vendorId && r.quote); return r ? r.quote : null; }
function orderValue(o) { const q = orderQuote(o); return q ? q.pp * o.guests : o.budget * o.guests; }

/* ---------- avto rad etish ---------- */
function ruleCheck(v, o) {
  const r = [];
  if (v.closed) r.push(`Vendor yopilgan${v.closedUntil ? " (" + fDate(v.closedUntil) + " gacha)" : ""}: ${v.closedReason || "sabab ko‘rsatilmagan"}`);
  if (db.settings.autoReject) {
    const R = v.rules;
    if (o.guests < R.minGuests) r.push(`${o.guests} mehmon — minimal ${R.minGuests}`);
    if (o.guests > R.maxGuests) r.push(`${o.guests} mehmon — maksimal ${R.maxGuests}`);
    if (o.budget < R.minPP) r.push(`byudjet ${num(o.budget)} — minimal ${num(R.minPP)} so‘m/kishi`);
    if (!R.areas.includes(o.area)) r.push(`${o.area} xizmat hududida emas`);
    if (R.blocked.includes(o.date)) r.push(`${fDate(o.date)} band sana`);
  }
  return r;
}

/* ---------- umumiy komponentlar ---------- */
function pill(map, key) { const [l, t] = map[key] || [key, "neutral"]; return `<span class="pill t-${t}">${l}</span>`; }
function srcPill(src) { const [l, t] = SRC[src] || [src, "neutral"]; return `<span class="pill t-${t}">${l}</span>`; }
function page(h, body) { return `<div class="page">${h}${body}</div>`; }
function head(title, sub, actions = "", back = "") { return `<div class="page-head"><div class="grow">${back}<h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>${actions ? `<div class="row">${actions}</div>` : ""}</div>`; }
function backBtn(view, label, param = "") { return `<button type="button" class="back" data-act="go" data-view="${view}"${param ? ` data-param="${param}"` : ""}>${ic("left", 16)} ${label}</button>`; }
function kpi(label, value, sub = "") { return `<div class="card kpi"><div class="eyebrow">${label}</div><div class="v">${value}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>`; }
function fact(k, v) { return `<div class="fact"><div class="k">${k}</div><div class="v">${v}</div></div>`; }
function money(k, v, tone = "") { return `<div class="money ${tone}"><div class="k">${k}</div><div class="v">${v}</div></div>`; }
function chips(opts, cur, act) { return `<div class="chips" role="group">${opts.map(([k, l, n]) => `<button type="button" class="chip ${cur === k ? "on" : ""}" data-act="${act}" data-k="${k}" aria-pressed="${cur === k}">${l}${n != null ? ` <span class="cnt">${n}</span>` : ""}</button>`).join("")}</div>`; }
function tabs(opts, cur, act) { return `<div class="tabs" role="tablist">${opts.map(([k, l]) => `<button type="button" role="tab" class="tab ${cur === k ? "on" : ""}" aria-selected="${cur === k}" data-act="${act}" data-k="${k}">${l}</button>`).join("")}</div>`; }
function stars(r) { const f = Math.round(r); return `<span class="stars" aria-label="${r.toFixed(1)} / 5">${"★".repeat(f)}<span class="off">${"★".repeat(5 - f)}</span></span>`; }
function rating(vid, setId) { const l = fbFor(vid, setId); if (!l.length) return `<span class="tiny faint">${/^(c|p)-/.test(ui.view || "") || (ui.session && ui.session.role === "client") ? t("no_reviews") : "Hali fikr yo‘q"}</span>`; const a = avgRating(l); return `<span class="small">${stars(a)} <span class="muted num">${a.toFixed(1).replace(".", ",")} · ${l.length}</span></span>`; }
function timeline(h) { if (!h || !h.length) return `<p class="small faint">Hali yozuv yo‘q.</p>`; return `<ol class="tl">${[...h].reverse().map(e => `<li><span class="tl-t tiny faint">${fDT(e.at)}</span><span>${esc(e.text)}</span></li>`).join("")}</ol>`; }
function empty(text) { return `<div class="empty">${text}</div>`; }
function opt(v, l, cur) { return `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`; }
function mHead(title, sub) { return `<header class="m-head"><div class="grow"><h2 id="m-title">${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ""}</div><button type="button" class="icon-btn" data-act="close" aria-label="Yopish">${ic("x")}</button></header>`; }
function starInput(pre) { return `<div class="star-in" role="radiogroup" aria-label="Baho">${[5, 4, 3, 2, 1].map(n => `<input type="radio" id="${pre}-r${n}" name="rating" value="${n}" ${n === 5 ? "checked" : ""}><label for="${pre}-r${n}" title="${n} yulduz">★</label>`).join("")}</div>`; }
function mediaTile(m, s, cls = "") {
  const inner = m.src ? (m.t === "video" ? `<video src="${m.src}" muted playsinline preload="metadata"></video>` : `<img src="${m.src}" alt="">`) : `<span class="ph" style="--g:${TONES[m.tone % TONES.length]}"></span>`;
  return `<button type="button" class="media ${cls}" data-act="view-media" data-set="${s.id}" data-id="${m.id}" aria-label="${m.t === "video" ? "Video" : "Rasm"}: ${esc(m.label)}">${inner}${m.t === "video" ? `<span class="play">${ic("play", 14)}</span>` : ""}<span class="cap">${esc(m.label)}</span></button>`;
}
function fbList(list) { if (!list.length) return `<p class="small faint">Hali fikr qoldirilmagan.</p>`; return list.map(f => `<div class="fb"><div class="row between"><strong class="small">${esc(f.author)}</strong><span class="tiny faint">${ago(f.at)} · ${f.via === "link" ? "taklif havolasidan" : "ochiq sahifadan"}</span></div>${stars(f.rating)}<p class="small">${esc(f.text)}</p></div>`).join(""); }

/* ---------- diagrammalar ---------- */
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function barPath(x, y0, w, y1, r) { const h = y0 - y1; if (h <= 0) return ""; r = Math.min(r, h, w / 2); return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`; }
function barChart(groups, series, aria, fmt = som) {
  const W = 560, H = 230, pl = 58, pr = 10, pt = 12, pb = 28;
  const all = groups.flatMap(g => g.values);
  let max = Math.max(0, ...all), min = Math.min(0, ...all);
  const step = niceStep((max - min) / 4 || 1);
  max = Math.ceil(max / step) * step; min = Math.floor(min / step) * step; if (max === min) max = min + step;
  const y = v => pt + (max - v) / (max - min) * (H - pt - pb);
  const gw = (W - pl - pr) / groups.length, gap = 4;
  const bw = Math.min(30, (gw - 40) / series.length - gap);
  let s = "";
  for (let v = min; v <= max + 1; v += step) s += `<line class="${v === 0 ? "base" : "grid"}" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${mln(v)}</text>`;
  groups.forEach((g, gi) => {
    const x0 = pl + gi * gw + (gw - (bw * series.length + gap * (series.length - 1))) / 2;
    g.values.forEach((v, si) => {
      const x = x0 + si * (bw + gap), tip = esc(`${g.label} · ${series[si].name}: ${fmt(v)}`);
      if (v >= 0) s += `<path d="${barPath(x, y(0), bw, y(v), 4)}" style="fill:var(${series[si].c})" data-tip="${tip}"/>`;
      else s += `<rect x="${x}" y="${y(0)}" width="${bw}" height="${y(v) - y(0)}" style="fill:var(${series[si].c})" data-tip="${tip}"/>`;
    });
    s += `<text x="${pl + gi * gw + gw / 2}" y="${H - 8}" text-anchor="middle">${esc(g.label)}</text>`;
  });
  return `<div class="legend">${series.map(x => `<span><i class="sw" style="--c:var(${x.c})"></i>${x.name}</span>`).join("")}</div><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${s}</svg>`;
}
function sparkline(pts) {
  if (pts.length < 2) return "";
  const W = 420, H = 110, pl = 8, pr = 64, pt = 14, pb = 22;
  const vs = pts.map(p => p.v); let lo = Math.min(...vs), hi = Math.max(...vs); if (hi === lo) { hi += 1; lo -= 1; }
  const pad2 = (hi - lo) * 0.15; lo -= pad2; hi += pad2;
  const x = i => pl + i * (W - pl - pr) / (pts.length - 1), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  const line = pts.map((p, i) => `${x(i)},${y(p.v)}`).join(" ");
  const area = `M${x(0)},${H - pb} L${pts.map((p, i) => `${x(i)},${y(p.v)}`).join(" L")} L${x(pts.length - 1)},${H - pb}Z`;
  const last = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Narx o‘zgarishi"><line class="base" x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}"/><path d="${area}" style="fill:var(--accent);opacity:.12"/><polyline points="${line}" style="fill:none;stroke:var(--accent);stroke-width:2"/>${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === pts.length - 1 ? 5 : 3.5}" style="fill:var(--accent);stroke:var(--surface);stroke-width:2" data-tip="${esc(p.label + ": " + som(p.v))}"/><text x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(p.short)}</text>`).join("")}<text x="${x(pts.length - 1) + 10}" y="${y(last.v) + 4}" style="fill:var(--fg);font-weight:600">${num(last.v)}</text></svg>`;
}
