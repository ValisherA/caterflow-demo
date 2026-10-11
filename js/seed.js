/* CaterFlow prototip — namuna ma’lumotlar (hammasi o‘ylab topilgan) */
"use strict";
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const CATALOG = [
  ["Guruch (devzira)", "kg", 30000], ["Qo‘y go‘shti", "kg", 125000], ["Mol go‘shti", "kg", 108000], ["Sabzi (sariq)", "kg", 4500],
  ["Piyoz", "kg", 3800], ["Paxta yog‘i", "l", 23000], ["No‘xat", "kg", 19000], ["Pomidor", "kg", 13000], ["Bodring", "kg", 11000],
  ["Kartoshka", "kg", 5200], ["Un", "kg", 7500], ["Tuxum", "dona", 1500], ["Mayonez", "kg", 36000], ["Qazi", "kg", 185000],
  ["Ko‘k choy", "kg", 95000], ["Non (patir)", "dona", 5000], ["Mevalar (assorti)", "kg", 28000], ["Ziravorlar", "kg", 140000],
  ["Shakar", "kg", 13500], ["Qatiq", "l", 14000]
];
const SUPPLIERS = ["Oloy bozori", "Chorsu bozori", "Agro Ulgurji", "Go‘sht Markazi", "Toza Mahsulot MChJ"];
// [nomi, kategoriya, porsiya, [[mahsulot, miqdor g/ml/dona]], sotuv narxi]
const RECIPES = [
  ["To‘y oshi", "Asosiy", "350 g", [[0, 120], [1, 90], [3, 90], [4, 25], [5, 30], [6, 15], [17, 3]], 45000],
  ["Qazi (kesma)", "Gazak", "60 g", [[13, 60]], 18000],
  ["Achchiq-chuchuk", "Salat", "150 g", [[7, 100], [4, 30], [17, 1]], 9000],
  ["Olivye", "Salat", "150 g", [[9, 50], [2, 30], [11, 1], [12, 25], [8, 20]], 12000],
  ["Mol go‘shtidan shashlik", "Asosiy", "2 six", [[2, 180], [4, 40], [17, 3]], 42000],
  ["Manti", "Asosiy", "4 dona", [[10, 90], [1, 80], [4, 60], [5, 10]], 26000],
  ["Non (patir)", "Gazak", "½ dona", [[15, 0.5]], 4000],
  ["Ko‘k choy", "Ichimlik", "1 piyola", [[14, 3], [18, 5]], 3000],
  ["Meva assorti", "Shirinlik", "200 g", [[16, 200]], 12000],
  ["Mastava", "Asosiy", "300 ml", [[0, 40], [2, 50], [3, 30], [9, 60], [4, 20], [5, 10], [19, 30]], 16000]
];
const SETS_T = [
  { name: "Klassik to‘y", desc: "To‘y oshi, qazi, ikki xil salat, non, choy va meva.", items: [[0, 1], [1, 1], [2, 1], [3, 1], [6, 1], [7, 1], [8, 1]], price: 140000, media: [["photo", "Osh lagani"], ["video", "Dasturxon tayyorlanishi"], ["photo", "Qazi va salatlar"], ["photo", "Meva assorti"]] },
  { name: "Premium to‘y", desc: "Klassik to‘y menyusi, ustiga shashlik va manti.", items: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1]], price: 210000, media: [["video", "Zal va servis"], ["photo", "Shashlik"], ["photo", "Manti"], ["photo", "Premium dasturxon"]] },
  { name: "Korporativ fursat", desc: "Shashlik, salatlar, non, choy va meva — ofis tadbirlari uchun.", items: [[4, 1], [2, 1], [3, 1], [6, 1], [7, 1], [8, 1]], price: 115000, media: [["photo", "Fursat stoli"], ["video", "Ofis tadbiri"]] },
  { name: "Ma’raka dasturxoni", desc: "Osh, mastava, non, choy va achchiq-chuchuk.", items: [[0, 1], [9, 1], [6, 1], [7, 1], [2, 1]], price: 70000, media: [["photo", "Osh va non"]] }
];
const CUST_NAMES = ["Shahnoza Islomova", "Ravshan Yo‘ldoshev", "Nilufar Saidova", "Otabek Xolmatov", "Madina Ergasheva", "Sherzod Aminov", "Zarina Qosimova", "Ulug‘bek Rasulov", "Feruza Tojiyeva", "Akmal Nurmatov", "Lola Hasanova", "Doniyor Sobirov", "Mohira Yusupova", "Jamshid Normatov", "Sevara Olimova", "Behruz Jo‘rayev", "Komila Rahmonova", "Sanjar Ismoilov"];
const VL_NAMES = ["Iroda Mahmudova", "Botir Aliqulov", "Nargiza Sultonova", "Sobir Karimov", "Yulduz Bakirova", "Diyor Hamroyev", "Muxlisa Orifova", "Temur Saidov", "Gavhar Ne’matova", "Anvar Qurbonov", "Shoira Valiyeva", "Kamron Ashurov", "Dildora Ahmedova", "Islom To‘xtayev", "Rayhona Musayeva"];
const VL_T = [
  { src: "Instagram", ev: "Nikoh to‘yi", guests: 180, d: 30, value: 32000000, st: "degustatsiya", upd: 26, log: ["Instagram’dan yozdi, 180 kishilik to‘y", "Qo‘ng‘iroq qilindi, menyu yuborildi", "Shanba kuni degustatsiyaga keladi"] },
  { src: "Tavsiya", ev: "Yubiley", guests: 70, d: 12, value: 9800000, st: "taklif", upd: 120, log: ["Eski mijoz tavsiya qildi", "Narx taklifi yuborildi, javob kutilmoqda"] },
  { src: "Telegram", ev: "Beshik to‘yi", guests: 100, d: 20, value: 14000000, st: "yangi", upd: 3, log: ["Telegram orqali narx so‘radi"] },
  { src: "Telefon", ev: "Korporativ", guests: 60, d: -2, value: 7200000, st: "kelishildi", upd: 50, log: ["Qo‘ng‘iroq qildi", "Shartnoma imzolandi, 30% oldindan to‘lov olindi"] },
  { src: "Instagram", ev: "Tug‘ilgan kun", guests: 35, d: 9, value: 3500000, st: "yoqotildi", upd: 90, log: ["Narx so‘radi", "Javob bermay qo‘ydi — narx qimmat tuyuldi"] }
];
const FB_T = [
  ["Dilnoza R.", 5, "Osh juda mazali bo‘ldi, mehmonlar maqtashdi. Ofitsiantlar o‘z vaqtida xizmat qildi."],
  ["Sardor M.", 4, "Ta’mi a’lo, faqat yetkazib berish 20 daqiqa kechikdi."],
  ["Gulnora T.", 5, "Videoda ko‘rganimizdek chiroyli dasturxon bo‘ldi. Rahmat!"],
  ["Bahodir K.", 4, "Shashlik yumshoq, salatlar yangi. Narxiga arziydi."],
  ["Malika A.", 3, "Ovqat yaxshi, lekin mevalar kam bo‘ldi."]
];

function V_(id, name, contact, phone, district, region, sinceDays, login, size, rules, extra = {}) {
  return Object.assign({ id, name, contact, phone, district, region, since: dAdd(sinceDays), login, pass: login + "2026", size, closed: false, closedReason: "", closedUntil: "", rules }, extra);
}
const WEEK_T = { 1: [0, 2, 6, 7], 2: [9, 3, 6, 7], 3: [5, 2, 6, 7], 4: [4, 3, 6, 7], 5: [0, 2, 6, 7, 8], 6: [0, 1, 3, 2, 6, 7, 8], 7: [4, 5, 3, 6, 7] };
function fmtQ(p, q) { return (Math.round(q * 10) / 10).toString().replace(".", ",") + " " + p.unit; }
function seed() {
  const rnd = mulberry32(42);
  const ri = (a, b) => Math.round(a + rnd() * (b - a));
  const phone = () => `+998 ${[90, 91, 93, 94, 97, 99][ri(0, 5)]} ${ri(100, 999)} ${pad(ri(10, 99))} ${pad(ri(10, 99))}`;
  const db = {
    settings: { igConnected: true, igAccount: "@caterflow.uz", igDM: true, igAds: true, commission: 15, autoReject: true, fbMode: "post", bonusAmount: 500000, bonusAuto: true, inv: { buffer: 5, lowNotify: true, expiryDays: 3, allowNegative: false, overrideReason: true, autoReserve: true, autoRelease: true, suspiciousN: 10 }, perm: null },
    vendors: [
      V_("v1", "Lagan Catering", "Jasur Karimov", "+998 90 214 55 10", "Yunusobod", "Toshkent shahri", -211, "lagan", 4, { minGuests: 80, maxGuests: 600, minPP: 160000, areas: ["Toshkent shahri", "Toshkent viloyati"], blocked: [dAdd(12)] }),
      V_("v2", "Dasturxon Events", "Nodira Aliyeva", "+998 93 507 21 44", "Chilonzor", "Toshkent shahri", -160, "dasturxon", 4, { minGuests: 30, maxGuests: 300, minPP: 120000, areas: ["Toshkent shahri"], blocked: [] }),
      V_("v3", "Navro‘z Oshxonasi", "Bekzod Toshpo‘latov", "+998 97 760 08 31", "Mirzo Ulug‘bek", "Toshkent shahri", -111, "navroz", 3, { minGuests: 20, maxGuests: 200, minPP: 100000, areas: ["Toshkent shahri", "Toshkent viloyati"], blocked: [] }, { closed: true, closedReason: "Oshxonada ta’mirlash", closedUntil: dAdd(6) }),
      V_("v4", "Ziyofat Samarqand", "Sherali Nurmatov", "+998 91 530 44 21", "Samarqand sh.", "Samarqand", -48, "ziyofat", 3, { minGuests: 50, maxGuests: 500, minPP: 110000, areas: ["Samarqand", "Jizzax", "Navoiy"], blocked: [] }),
      V_("v5", "Buxoro Dasturxoni", "Zuhra Sodiqova", "+998 93 640 12 77", "Buxoro sh.", "Buxoro", -95, "buxoro", 3, { minGuests: 40, maxGuests: 400, minPP: 100000, areas: ["Buxoro", "Navoiy"], blocked: [] }),
      V_("v6", "Farg‘ona Bazmi", "Akbar Yo‘ldoshev", "+998 90 711 08 63", "Farg‘ona sh.", "Farg‘ona", -12, "bazm", 2, { minGuests: 60, maxGuests: 500, minPP: 90000, areas: ["Farg‘ona", "Andijon", "Namangan"], blocked: [] }),
      V_("v7", "Chorvoq Catering", "Rustam Qobilov", "+998 99 420 63 18", "Bo‘stonliq", "Toshkent viloyati", -150, "chorvoq", 2, { minGuests: 30, maxGuests: 250, minPP: 130000, areas: ["Toshkent viloyati", "Toshkent shahri"], blocked: [] }),
      V_("v8", "Andijon To‘y Servis", "Mavluda Ergasheva", "+998 94 302 55 90", "Andijon sh.", "Andijon", -40, "andijon", 2, { minGuests: 80, maxGuests: 700, minPP: 85000, areas: ["Andijon", "Farg‘ona", "Namangan"], blocked: [] }),
      V_("v9", "Siyob Oshxonasi", "Farhod Rahimov", "+998 97 115 27 34", "Samarqand sh.", "Samarqand", -5, "siyob", 2, { minGuests: 20, maxGuests: 150, minPP: 80000, areas: ["Samarqand"], blocked: [] })
    ],
    admin: { login: "admin", pass: "admin2026" },
    leads: [], orders: [], customers: [], ownLeads: [], products: [], purchases: [], dishes: [], sets: [], feedback: [], expenses: [], sales: [], activity: [], payments: [], moves: [], weekMenus: {}, ownOrders: [], notifs: [], staff: [], tasks: [], kdone: {}, bonuses: [], cfExpenses: [], clients: [], custPays: [], chats: [], cnotifs: [], tglog: [], ingredients: [], icats: [], units: [], reservations: [], audit: [], suppliers: []
  };
  const namePhone = {}; // bir odam bir nechta vendordan buyurtma qilishi mumkin
  const priceMul = { v1: 1.0, v2: 0.96, v3: 1.04, v4: 0.9, v5: 0.88, v6: 0.86, v7: 1.02, v8: 0.85, v9: 0.84 }, setMul = { v1: 1.08, v2: 0.94, v3: 1.0, v4: 0.86, v5: 0.82, v6: 0.8, v7: 1.02, v8: 0.78, v9: 0.76 };
  const mks = monthKeys(), dayNow = new Date().getDate();

  db.vendors.forEach((v, vi) => {
    CATALOG.forEach((c, i) => {
      const id = `${v.id}-p${i}`, base = c[2] * priceMul[v.id];
      let stock = c[1] === "dona" ? ri(60, 380) : Math.round((6 + rnd() * 60) * 10) / 10;
      if ((i + vi) % 7 === 1) stock = c[1] === "dona" ? 40 : 4.5;
      const perish = [1, 2, 3, 4, 7, 8, 9, 11, 13, 15, 16, 19].includes(i);
      db.products.push({ id, vendorId: v.id, mid: `m${i}`, exp: perish ? dAdd((i * 7 + vi * 3) % 23 === 0 ? -1 : ri(2, 14)) : dAdd(ri(90, 300)), name: c[0], unit: c[1], cat: ["Bakaleya", "Go‘sht", "Go‘sht", "Sabzavot va meva", "Sabzavot va meva", "Bakaleya", "Bakaleya", "Sabzavot va meva", "Sabzavot va meva", "Sabzavot va meva", "Bakaleya", "Sut va tuxum", "Bakaleya", "Go‘sht", "Ichimlik", "Non", "Sabzavot va meva", "Ziravor", "Bakaleya", "Sut va tuxum"][i], stock, min: c[1] === "dona" ? 100 : 10 });
      [[-68, 0.94], [-37, 0.98], [-9, 1 + (rnd() - 0.4) * 0.14]].forEach(([d, m], k) => {
        const qty = c[1] === "dona" ? ri(100, 400) : ri(10, 90);
        const up = Math.round(base * m / 100) * 100;
        db.purchases.push({ id: `${id}-b${k}`, vendorId: v.id, productId: id, date: dAdd(d), supplier: SUPPLIERS[(i + k) % SUPPLIERS.length], qty, total: up * qty });
      });
    });
    RECIPES.forEach((r, i) => { const ing = r[3].map(([p, q]) => ({ p: `${v.id}-p${p}`, q })), age = [12, 45, 8, 61, 20, 38, 5, 33, 70, 15][i] + vi, price = Math.round(r[4] * setMul[v.id] / 500) * 500;
      const vers = [{ at: tAgo(24 * (age + 60)), by: `${v.id}-u0`, note: "Yaratildi", cost: null, f: 0.9, price, ing: ing.map(x => ({ p: x.p, q: i === 0 && x.p.endsWith("-p1") ? 80 : x.q })) }];
      if (age < 40) vers.push({ at: tAgo(24 * age), by: `${v.id}-u0`, note: i === 0 ? "Oylik tekshiruv: qo‘y go‘shti 80 g dan 90 g ga oshirildi" : "Oylik tekshiruv: o‘zgarishsiz", cost: null, f: 0.97, price, ing: ing.map(x => ({ ...x })) });
      db.dishes.push({ id: `${v.id}-d${i}`, vendorId: v.id, name: r[0], cat: r[1], portion: r[2], ing, price, reviewedAt: dAdd(-age), versions: vers }); });
    SETS_T.forEach((s, i) => db.sets.push({ id: `${v.id}-s${i}`, vendorId: v.id, name: s.name, desc: s.desc, items: s.items.map(([d, n]) => ({ d: `${v.id}-d${d}`, n })), price: Math.round(s.price * setMul[v.id] / 1000) * 1000, media: s.media.map((m, k) => ({ id: `${v.id}-m${i}${k}`, t: m[0], label: m[1], tone: (i * 2 + k + vi) % 6 })) }));

    // mijozlar va sotuvlar
    const custs = [0, 1, 2, 3, 4, 5].map(k => CUST_NAMES[(vi * 6 + k) % CUST_NAMES.length]).map((n, k) => ({ id: `${v.id}-c${k}`, vendorId: v.id, name: n, phone: k < 2 && namePhone[n] ? namePhone[n] : (namePhone[n] = phone()), source: k % 2 ? "O‘zi" : "CaterFlow", channel: k % 2 ? ["Instagram", "Tavsiya", "Telegram", "Takroriy mijoz", "Telefon"][(k + vi) % 5] : ["ig_dm", "ig_ad", "sayt", "tel"][(k + vi) % 4], since: dAdd(-200 + k * 20), oldOrders: k % 3, oldTotal: (k % 3) * ri(15, 40) * 1e6, oldLast: dAdd(-120 - k * 15) }));
    db.customers.push(...custs);
    let sk = 0;
    mks.forEach((mk, mi) => {
      const isNow = mi === 2, n = isNow ? Math.min(v.size > 2 ? 2 : 1, dayNow - 1) : v.size;
      if (mk < v.since.slice(0, 7)) return;
      for (let k = 0; k < n; k++) {
        const c = custs[(k + mi * 2) % custs.length], set = db.sets.find(s => s.id === `${v.id}-s${(k + mi) % 3}`);
        const lo = Math.max(v.rules.minGuests, 40), hi = Math.min(v.rules.maxGuests, 320);
        const day = isNow ? 1 + Math.floor(rnd() * (dayNow - 1)) : ri(2, 27);
        if (`${mk}-${pad(day)}` < v.since || `${mk}-${pad(day)}` > today()) continue;
        db.sales.push({ id: `${v.id}-x${sk++}`, vendorId: v.id, date: `${mk}-${pad(day)}`, customerId: c.id, customer: c.name, source: c.source, channel: c.channel, setId: set.id, guests: Math.round(ri(lo, hi) / 10) * 10, pp: set.price });
      }
      const f = isNow ? dayNow / 30 : 1;
      [["Ish haqi", ri(14, 22) * 1e6], ["Transport", ri(25, 45) * 1e5], ["Ijara", ri(6, 9) * 1e6], ["Kommunal", ri(12, 22) * 1e5], ["Marketing", ri(8, 25) * 1e5]].forEach(([cat, a], k) => db.expenses.push({ id: `${v.id}-e${mi}${k}`, vendorId: v.id, month: mk, cat, amount: Math.round(a * f / 1e4) * 1e4, note: "" }));
    });

    // vendorning o‘z leadlari
    VL_T.forEach((t, k) => {
      const created = tAgo(t.upd + 24 * (k + 2));
      const steps = t.log.map((text, j) => ({ at: created + (tAgo(t.upd) - created) * (t.log.length > 1 ? j / (t.log.length - 1) : 1), text }));
      db.ownLeads.push({ id: `${v.id}-l${k}`, vendorId: v.id, name: VL_NAMES[(vi * 5 + k) % VL_NAMES.length], phone: phone(), source: t.src, ev: t.ev, guests: t.guests, date: dAdd(t.d + vi), value: t.value, status: t.st, at: created, updatedAt: tAgo(t.upd * (1 + vi * 0.3)), log: steps });
    });

    // haftalik menyu
    db.weekMenus[v.id] = {}; Object.keys(WEEK_T).forEach(d => { db.weekMenus[v.id][d] = { dishes: WEEK_T[d].map(i => `${v.id}-d${i}`), people: [120, 100, 110, 100, 180, 220, 90][d - 1] }; });
    // fikrlar
    [0, 1, 2].forEach(si => FB_T.slice((si + vi) % 3, (si + vi) % 3 + 2).forEach((f, k) => db.feedback.push({ id: `${v.id}-f${si}${k}`, vendorId: v.id, setId: `${v.id}-s${si}`, author: f[0], rating: f[1], text: f[2], at: tAgo(24 * (3 + si * 6 + k * 4 + vi)), via: k ? "profil" : "link" })));
  });

  // Instagram va boshqa manbalardan kelgan leadlar
  const L = (id, src, name, f) => Object.assign({ id, src, name, handle: "", phone: "", msg: "", ev: "", guests: 0, date: "", status: "yangi", at: Date.now(), orderId: null, history: [] }, f);
  db.leads = [
    L("l1", "ig_dm", "Malika Yusupova", { handle: "@malika.yusupova", msg: "Assalomu alaykum! Noyabr o‘rtasida 200 kishilik nikoh to‘yi uchun osh va salatlar kerak. Narxi qancha bo‘ladi?", ev: "Nikoh to‘yi", guests: 200, date: dAdd(37), at: tAgo(0.4) }),
    L("l2", "ig_ad", "Sardor Mirzayev", { handle: "@sardor_mrz", phone: "+998 91 233 40 12", msg: "Lead forma: Korporativ tadbir, 70 kishi, Chilonzor tumani.", ev: "Korporativ", guests: 70, date: dAdd(20), at: tAgo(2) }),
    L("l3", "ig_dm", "Gulnoza Karimova", { handle: "@gulnoza.k", msg: "Beshik to‘yiga 120 kishi, dekabr boshida. Menyu yuborasizmi?", ev: "Beshik to‘yi", guests: 120, date: dAdd(55), status: "aloqa", at: tAgo(20) }),
    L("l4", "sayt", "Aziza Rahimova", { phone: "+998 93 410 22 18", msg: "Saytdagi forma: 250 kishilik nikoh to‘yi, Yunusobod.", ev: "Nikoh to‘yi", guests: 250, date: dAdd(15), status: "buyurtma", orderId: "CF-1048", at: tAgo(31) }),
    L("l5", "ig_dm", "Javohir Qodirov", { handle: "@javohir.q", msg: "Tug‘ilgan kunga 40 kishi, uyga yetkazib berasizlarmi?", ev: "Tug‘ilgan kun", guests: 40, date: dAdd(10), status: "buyurtma", orderId: "CF-1046", at: tAgo(7) }),
    L("l6", "tel", "Farrux Tursunov", { phone: "+998 99 300 45 67", msg: "Qo‘ng‘iroq: otasining 60 yillik yubileyi, 60 kishi.", ev: "Yubiley", guests: 60, date: dAdd(26), status: "muzokara", at: tAgo(52) }),
    L("l7", "ig_ad", "Dilfuza Abdullayeva", { handle: "@dilfuza_a", phone: "+998 94 120 77 05", msg: "Lead forma: Sunnat to‘yi, 300 kishi.", ev: "Sunnat to‘yi", guests: 300, date: dAdd(24), status: "buyurtma", orderId: "CF-1041", at: tAgo(96) }),
    L("l8", "ig_dm", "Rustam Ergashev", { handle: "@rustam.erg", msg: "Narx qimmat ekan, o‘ylab ko‘ramiz.", ev: "Nikoh to‘yi", guests: 150, date: dAdd(40), status: "yoqotildi", at: tAgo(120) }),
    L("l9", "ig_dm", "Kamola Nazarova", { handle: "@kamola.nz", msg: "Kelasi hafta 25 kishi uchun fursat qilsa bo‘ladimi?", ev: "Korporativ", guests: 25, date: dAdd(8), status: "aloqa", at: tAgo(5) })
  ];
  db.leads.forEach(l => {
    l.history.push({ at: l.at, text: `${SRC[l.src][0]} orqali keldi` });
    if (l.status !== "yangi") l.history.push({ at: l.at + 36e5, text: "Admin qo‘ng‘iroq qildi, ehtiyoji aniqlandi" });
    if (l.orderId) l.history.push({ at: l.at + 72e5, text: `${l.orderId} buyurtmasi yaratildi` });
    if (l.status === "yoqotildi") l.history.push({ at: l.at + 72e5, text: "Narx qimmat deb rad etdi" });
  });

  const O = (id, f) => Object.assign({ id, leadId: null, customer: "", phone: "", eventType: "", date: "", guests: 0, budget: 0, area: "Toshkent shahri", venue: "", notes: "", status: "yangi", vendorId: null, createdAt: Date.now(), requests: [], token: null, history: [] }, f);
  const R = (vendorId, status, sentAt, f = {}) => Object.assign({ vendorId, status, reason: "", sentAt, quote: null, toCustomer: false }, f);
  const Q = (setId, pp, includes, note, at) => ({ setId, pp, includes, note, at });
  db.orders = [
    O("CF-1048", { leadId: "l4", customer: "Aziza Rahimova", phone: "+998 93 410 22 18", eventType: "Nikoh to‘yi", date: dAdd(15), guests: 250, budget: 190000, venue: "“Gulshan” to‘yxonasi, Yunusobod", notes: "Kelin tomoni. Ikki xil salat va meva bo‘lishi shart.", status: "takliflar", createdAt: tAgo(30),
      requests: [R("v1", "javob", tAgo(28), { quote: Q("v1-s0", 178000, ["Ofitsiantlar", "Idish-tovoq", "Yetkazib berish"], "Ikkinchi issiq taom sifatida manti qo‘shamiz.", tAgo(22)) }), R("v2", "javob", tAgo(28), { quote: Q("v2-s1", 189000, ["Ofitsiantlar", "Idish-tovoq", "Stol bezagi"], "Premium set: shashlik va manti bilan.", tAgo(9)) }), R("v3", "avto", tAgo(28), { reason: "Vendor yopilgan: Oshxonada ta’mirlash" })],
      history: [{ at: tAgo(30), text: "Saytdagi formadan buyurtma yaratildi" }, { at: tAgo(28), text: "3 ta vendorga yuborildi, 1 tasi avtomatik rad etildi" }, { at: tAgo(22), text: "Lagan Catering taklif berdi" }, { at: tAgo(9), text: "Dasturxon Events taklif berdi" }] }),
    O("CF-1047", { customer: "Bekzod Hamidov", phone: "+998 90 555 18 30", eventType: "Korporativ", date: dAdd(20), guests: 80, budget: 130000, venue: "Ofis, Mirobod", notes: "Yil yakuni tadbiri, alkogolsiz.", status: "vendorlarda", createdAt: tAgo(4),
      requests: [R("v1", "avto", tAgo(3), { reason: "byudjet 130 000 — minimal 160 000 so‘m/kishi" }), R("v2", "kutilmoqda", tAgo(3))],
      history: [{ at: tAgo(4), text: "Telefon orqali buyurtma yaratildi" }, { at: tAgo(3), text: "2 ta vendorga yuborildi, 1 tasi avtomatik rad etildi" }] }),
    O("CF-1046", { leadId: "l5", customer: "Javohir Qodirov", phone: "+998 97 640 31 22", eventType: "Tug‘ilgan kun", date: dAdd(10), guests: 40, budget: 120000, venue: "Uy, Sergeli", notes: "Uyga yetkazib berish kerak.", createdAt: tAgo(6), history: [{ at: tAgo(6), text: "Instagram leadidan buyurtma yaratildi" }] }),
    O("CF-1045", { customer: "Shahnoza Islomova", phone: "+998 93 271 64 09", eventType: "Beshik to‘yi", date: dAdd(4), guests: 120, budget: 150000, venue: "“Bahor” restorani", status: "tasdiqlandi", vendorId: "v2", createdAt: tAgo(140), token: "b4x9qe",
      requests: [R("v2", "javob", tAgo(138), { toCustomer: true, quote: Q("v2-s0", 142000, ["Ofitsiantlar", "Idish-tovoq"], "", tAgo(130)) }), R("v1", "rad", tAgo(138), { reason: "Sana band" })],
      history: [{ at: tAgo(140), text: "Buyurtma yaratildi" }, { at: tAgo(118), text: "Taklif mijozga yuborildi" }, { at: tAgo(100), text: "Mijoz Dasturxon Events taklifini tanladi" }] }),
    O("CF-1044", { customer: "Ravshan Yo‘ldoshev", phone: "+998 99 812 40 56", eventType: "Yubiley", date: dAdd(0), guests: 90, budget: 175000, venue: "“Zarafshon” zali", status: "bajarilmoqda", vendorId: "v1", createdAt: tAgo(300), token: "q2w8re",
      requests: [R("v1", "javob", tAgo(296), { toCustomer: true, quote: Q("v1-s0", 168000, ["Ofitsiantlar", "Idish-tovoq", "Yetkazib berish"], "", tAgo(290)) })],
      history: [{ at: tAgo(300), text: "Buyurtma yaratildi" }, { at: tAgo(270), text: "Mijoz Lagan Catering taklifini tanladi" }, { at: tAgo(5), text: "Lagan Catering: tayyorlash boshlandi" }] }),
    O("CF-1043", { customer: "Nilufar Saidova", phone: "+998 91 404 12 87", eventType: "Nikoh to‘yi", date: dAdd(-6), guests: 180, budget: 160000, venue: "“Navbahor” to‘yxonasi", status: "yakunlandi", vendorId: "v3", createdAt: tAgo(600), token: "z1n5ty",
      requests: [R("v3", "javob", tAgo(590), { toCustomer: true, quote: Q("v3-s0", 150000, ["Ofitsiantlar", "Idish-tovoq"], "", tAgo(580)) }), R("v2", "javob", tAgo(590), { toCustomer: true, quote: Q("v2-s0", 155000, ["Ofitsiantlar"], "", tAgo(585)) })],
      history: [{ at: tAgo(600), text: "Buyurtma yaratildi" }, { at: tAgo(560), text: "Mijoz Navro‘z Oshxonasi taklifini tanladi" }, { at: tAgo(140), text: "Tadbir yakunlandi" }] }),
    O("CF-1042", { customer: "Sitora Komilova", phone: "+998 90 377 25 61", eventType: "Korporativ", date: dAdd(2), guests: 50, budget: 90000, status: "bekor", createdAt: tAgo(200),
      requests: [R("v2", "rad", tAgo(198), { reason: "Byudjet past" })],
      history: [{ at: tAgo(200), text: "Buyurtma yaratildi" }, { at: tAgo(150), text: "Mijoz bekor qildi" }] }),
    O("CF-1041", { leadId: "l7", customer: "Dilfuza Abdullayeva", phone: "+998 94 120 77 05", eventType: "Sunnat to‘yi", date: dAdd(24), guests: 300, budget: 170000, venue: "“Oltin vodiy” to‘yxonasi", notes: "Ikki kunlik: nahorgi osh + kechki to‘y.", status: "mijozda", createdAt: tAgo(90), token: "k7m2qa",
      requests: [R("v1", "javob", tAgo(88), { toCustomer: true, quote: Q("v1-s0", 172000, ["Ofitsiantlar", "Idish-tovoq", "Yetkazib berish", "Choy-qahva xizmati"], "Nahorgi osh narxga kiritilgan.", tAgo(70)) }), R("v2", "javob", tAgo(88), { toCustomer: true, quote: Q("v2-s1", 186000, ["Ofitsiantlar", "Idish-tovoq", "Stol bezagi"], "", tAgo(60)) }), R("v3", "avto", tAgo(88), { reason: "Vendor yopilgan: Oshxonada ta’mirlash" })],
      history: [{ at: tAgo(90), text: "Instagram leadidan buyurtma yaratildi" }, { at: tAgo(88), text: "3 ta vendorga yuborildi, 1 tasi avtomatik rad etildi" }, { at: tAgo(30), text: "2 ta taklif mijozga yuborildi" }] })
  ];
  // CF-1043 Navro‘z sotuvlariga yoziladi
  db.customers.push({ id: "v3-c9", vendorId: "v3", name: "Nilufar Saidova", phone: "+998 91 404 12 87", source: "CaterFlow", channel: "ig_dm", since: dAdd(-25) });
  db.sales.push({ id: "v3-xo", vendorId: "v3", date: dAdd(-6), customerId: "v3-c9", customer: "Nilufar Saidova", source: "CaterFlow", channel: "ig_dm", setId: "v3-s0", guests: 180, pp: 150000, orderId: "CF-1043" });

  // komissiya to‘lovlari: avvalgi oylar asosan to‘langan, o‘tgan oy qisman — qarz paydo bo‘ladi
  const paidLast = { v1: 1, v2: 1, v3: 0.5, v4: 0, v5: 1, v7: 0.6, v8: 0 };
  // xush kelibsiz bonusi: so‘nggi 60 kunda qo‘shilgan vendorlarga
  db.vendors.filter(v => daysBetween(v.since, today()) <= 60).forEach(v => db.bonuses.push({ id: `${v.id}-bn0`, vendorId: v.id, amount: 500000, date: v.since, note: "Xush kelibsiz bonusi", by: "admin" }));
  db.vendors.forEach(v => {
    let bLeft = db.bonuses.filter(b => b.vendorId === v.id).reduce((a, b) => a + b.amount, 0);
    [mks[0], mks[1]].forEach((mk, i) => {
      const gross = Math.round(db.sales.filter(s => s.vendorId === v.id && s.source === "CaterFlow" && s.date.slice(0, 7) === mk).reduce((a, s) => a + s.guests * s.pp, 0) * db.settings.commission / 100);
      const cov = Math.min(bLeft, gross); bLeft -= cov; const acc = gross - cov;
      const share = i === 0 ? 1 : (paidLast[v.id] ?? 0);
      if (acc && share) { const [y, m] = (i === 0 ? mks[1] : mks[2]).split("-"); db.payments.push({ id: `${v.id}-pay${i}`, vendorId: v.id, date: `${y}-${m}-0${3 + i}` > today() ? today() : `${y}-${m}-0${3 + i}`, amount: Math.round(acc * share / 1000) * 1000, method: PAY_METHODS[(i + v.id.length) % 3], note: `${mLabel(mk)} komissiyasi` }); }
    });
  });

  // vendorlarning o‘z buyurtmalari, tayyorgarlik va bildirishnomalar
  const OO = (id, vid, cust, ev, d, guests, setId, pp, venue, st) => { const c = db.customers.find(x => x.vendorId === vid && x.name === cust) || db.customers.find(x => x.vendorId === vid); return { id, own: true, vendorId: vid, customerId: c.id, customer: c.name, phone: c.phone, eventType: ev, date: dAdd(d), guests, budget: pp, area: VV(vid) ? VV(vid).region : "Toshkent shahri", venue, notes: "", status: st, quote: { setId, pp, includes: ["Ofitsiantlar", "Idish-tovoq"], note: "", at: tAgo(200) }, createdAt: tAgo(240), history: [{ at: tAgo(240), text: "Buyurtma qo‘shildi" }], vcheck: { 0: true, 1: true }, vnotes: [] }; };
  const VV = id => db.vendors.find(v => v.id === id);
  db.ownOrders.push(Object.assign(OO("OZ-099", "v3", "", "Tug‘ilgan kun", 2, 60, "v3-s2", 110000, "Uy, Olmazor", "bekor"), { history: [{ at: tAgo(240), text: "Buyurtma qo‘shildi" }, { at: tAgo(20), text: "Mijoz bekor qildi" }] }));
  db.ownOrders.push(OO("OZ-101", "v1", "", "Yubiley", 6, 70, "v1-s2", 125000, "Uy, Yakkasaroy", "tasdiqlandi"), OO("OZ-102", "v2", "", "Tug‘ilgan kun", 3, 45, "v2-s2", 108000, "“Bodom” kafesi", "tasdiqlandi"));
  db.orders.find(o => o.id === "CF-1044").vcheck = { 0: true, 1: true, 2: true, 3: true };
  db.orders.find(o => o.id === "CF-1045").vcheck = { 0: true };
  const N = (vid, h, text, link) => db.notifs.push({ id: `${vid}-n${db.notifs.length}`, vendorId: vid, at: tAgo(h), text, link, read: h > 30 });
  N("v2", 3, "Yangi so‘rov: CF-1047 — Korporativ, 80 kishi", { view: "vorder", param: "CF-1047" });
  N("v2", 100, "Mijoz sizni tanladi: CF-1045 — Beshik to‘yi, 120 kishi", { view: "vorder", param: "CF-1045" });
  N("v1", 3, "CF-1047 so‘rovi avtomatik rad etildi: byudjet minimal narxdan past", { view: "vorder", param: "CF-1047" });
  N("v1", 30, "CF-1041: taklifingiz mijozga yuborildi", { view: "vorder", param: "CF-1041" });
  N("v1", 52, "Yangi fikr: 5★ — Klassik to‘y", { view: "menu", tab: "feedback" });
  db.vendors.forEach(v => { if (!db.notifs.some(n => n.vendorId === v.id)) N(v.id, 72, "CaterFlow’ga xush kelibsiz! Profilingizni to‘ldiring.", { view: "vdash" }); });

  // jamoa va vazifalar
  db.vendors.forEach(v => db.staff.push({ id: `${v.id}-u0`, vendorId: v.id, name: v.contact, phone: v.phone, role: "owner", login: v.login, pass: v.pass }));
  db.staff.push(
    { id: "v1-u1", vendorId: "v1", name: "Kamola Tursunova", phone: "+998 90 441 20 13", role: "manager", login: "lagan.menejer", pass: "menejer2026" },
    { id: "v1-u2", vendorId: "v1", name: "Aziz Rahimov", phone: "+998 93 118 74 52", role: "store", login: "lagan.ombor", pass: "ombor2026" },
    { id: "v1-u3", vendorId: "v1", name: "Botir Qodirov", phone: "+998 97 305 66 81", role: "cook", login: "lagan.oshpaz", pass: "oshpaz2026" },
    { id: "v2-u1", vendorId: "v2", name: "Sherzod Aliyev", phone: "+998 99 610 35 27", role: "store", login: "dasturxon.ombor", pass: "ombor2026" },
    { id: "v2-u2", vendorId: "v2", name: "Nilufar Karimova", phone: "+998 94 287 13 40", role: "cook", login: "dasturxon.oshpaz", pass: "oshpaz2026" });
  const T = (id, vid, to, by, title, note, due, prio, status, h, extra = {}) => Object.assign({ id, vendorId: vid, title, note, to, by, due: dAdd(due), prio, status, link: null, at: tAgo(h), comments: [] }, extra);
  db.tasks.push(
    T("t1", "v1", "v1-u2", "v1-u0", "Ertangi tadbirlar uchun guruch va go‘sht xarid qilish", "Xarid ro‘yxatini “Ombor holati” sahifasidan oling. Chekni kirimga biriktiring.", 1, "muhim", "jarayonda", 5, { link: { view: "sdash" }, comments: [{ at: tAgo(4), by: "v1-u2", text: "Oloy bozoriga ketyapman" }] }),
    T("t2", "v1", "v1-u3", "v1-u0", "CF-1044 yubiley: 90 kishilik osh va salatlar", "Tadbir bugun kechqurun, “Zarafshon” zalida.", 0, "shosh", "yangi", 3, { link: { view: "kitchen" } }),
    T("t3", "v1", "v1-u1", "v1-u0", "Botir Aliqulov bilan bog‘lanish", "Taklifga 5 kundan beri javob yo‘q — qo‘ng‘iroq qiling.", 0, "oddiy", "yangi", 6, { link: { view: "myleads" } }),
    T("t4", "v1", "v1-u2", "v1-u3", "Oshxonaga 20 dona tuxum", "", -1, "oddiy", "bajarildi", 30, { doneAt: tAgo(28) }),
    T("t5", "v1", "v1-u0", "admin", "Setlarga yangi rasm va video yuklang", "Mijozlar Premium to‘y setining videosini so‘rayapti.", 3, "muhim", "yangi", 20, { link: { view: "menu" } }),
    T("t6", "v2", "v2-u1", "v2-u0", "Inventarizatsiya: go‘sht va yog‘", "Haqiqiy qoldiqni tizimga kiriting.", 2, "oddiy", "yangi", 8, { link: { view: "stock" } }));
  db.tasks.filter(t => t.status === "yangi").forEach(t => db.notifs.push({ id: `${t.id}-n`, vendorId: t.vendorId, at: t.at, text: `Yangi vazifa${t.by === "admin" ? " (CaterFlow)" : ""}: ${t.title}`, link: { view: "tasks" }, read: false, to: t.to, roles: null }));
  db.notifs.sort((a, b) => b.at - a.at);

  // ---------- ombor nazorati: master katalog, birliklar, yetkazib beruvchilar, chiqindi, tuzatishlar ----------
  const CAT_OF = ["Bakaleya", "Go‘sht", "Go‘sht", "Sabzavot va meva", "Sabzavot va meva", "Bakaleya", "Bakaleya", "Sabzavot va meva", "Sabzavot va meva", "Sabzavot va meva", "Bakaleya", "Sut va tuxum", "Bakaleya", "Go‘sht", "Ichimlik", "Non", "Sabzavot va meva", "Ziravor", "Bakaleya", "Sut va tuxum"];
  db.ingredients = CATALOG.map((c, i) => ({ id: `m${i}`, name: c[0], cat: CAT_OF[i], unit: c[1], active: true }));
  db.ingredients.push({ id: "m20", name: "Tovuq filesi", cat: "Go‘sht", unit: "kg", active: true }, { id: "m21", name: "Baliq (zog‘ora)", cat: "Baliq", unit: "kg", active: true }, { id: "m22", name: "Bir martalik idish", cat: "Qadoqlash", unit: "dona", active: true }, { id: "m23", name: "Qizil sabzi", cat: "Sabzavot va meva", unit: "kg", active: false });
  db.icats = ["Go‘sht", "Sabzavot va meva", "Bakaleya", "Sut va tuxum", "Non", "Ichimlik", "Ziravor", "Muzlatilgan", "Baliq", "Qadoqlash", "Boshqa"].map((n, i) => ({ id: `ic${i}`, name: n, active: true }));
  db.units = [["kg", "kilogramm", "g", 1000], ["g", "gramm", "g", 1], ["l", "litr", "ml", 1000], ["ml", "millilitr", "ml", 1], ["dona", "dona", "dona", 1], ["quti", "quti", "dona", 12], ["pachka", "pachka", "dona", 10], ["lagan", "lagan (tray)", "dona", 1], ["shisha", "shisha", "ml", 1500]].map(([id, name, base, f]) => ({ id, name, base, factor: f, active: true, core: ["kg", "g", "l", "ml", "dona"].includes(id) }));
  db.suppliers = [["Oloy bozori", "Bozor", "Toshkent", 4.3], ["Chorsu bozori", "Bozor", "Toshkent", 4.1], ["Agro Ulgurji", "Ulgurji ombor", "Toshkent viloyati", 4.6], ["Go‘sht Markazi", "Go‘sht", "Toshkent", 4.4], ["Toza Mahsulot MChJ", "Bakaleya", "Toshkent", 4.7]].map(([name, cat, city, rating], i) => ({ id: `sp${i}`, name, cat, city, rating, global: true }));
  // moslashtirilmagan (master katalogga bog‘lanmagan) mahsulotlar
  [["v5", "Tovuq go‘shti filé", "kg", 46000, "Go‘sht"], ["v7", "Chkn", "kg", 52000, "Go‘sht"], ["v4", "Qizil sabzi (Samarqand)", "kg", 5200, "Sabzavot va meva"]].forEach(([vid, name, unit, price, cat], k) => {
    const id = `${vid}-px${k}`; db.products.push({ id, vendorId: vid, mid: null, exp: dAdd(4 + k), name, unit, cat, stock: 12 + k * 4, min: 5 });
    [[-30, 0.97], [-6, 1.02]].forEach(([d, m], j) => db.purchases.push({ id: `${id}-b${j}`, vendorId: vid, productId: id, date: dAdd(d), supplier: SUPPLIERS[(k + j) % SUPPLIERS.length], qty: 20, total: Math.round(price * m / 100) * 100 * 20 }));
  });
  // chiqindi va tuzatishlar
  const WR = ["Muddati o‘tdi", "Ortiqcha tayyorlandi", "Bekor qilindi", "Oshxona xatosi", "Shikastlandi"];
  db.vendors.forEach((v, vi) => {
    const ps = db.products.filter(p => p.vendorId === v.id), store = db.staff.find(x => x.vendorId === v.id && x.role === "store") || db.staff.find(x => x.vendorId === v.id && x.role === "owner");
    const nW = v.id === "v7" ? 9 : 3 + (vi % 4);
    for (let k = 0; k < nW; k++) { const p = ps[(k * 5 + vi) % ps.length], h = 24 * ri(1, 55), q = p.unit === "dona" ? ri(10, 40) : Math.round((0.5 + rnd() * (v.id === "v7" ? 9 : 4)) * 10) / 10; db.moves.push({ id: `${v.id}-w${k}`, vendorId: v.id, productId: p.id, date: localISO(new Date(tAgo(h))), at: tAgo(h), qty: q, type: "waste", reason: WR[(k + vi) % WR.length], note: WR[(k + vi) % WR.length], by: store ? store.id : null }); }
    const nA = v.id === "v7" ? 11 : 2;
    for (let k = 0; k < nA; k++) { const p = ps[(k * 3 + 2) % ps.length], h = v.id === "v7" ? 1 + k * 1.7 : 24 * ri(2, 40), before = Math.round((p.stock + (k % 2 ? 2 : -1.5)) * 10) / 10, diff = Math.round((p.stock - before) * 10) / 10; if (!diff) continue; db.moves.push({ id: `${v.id}-a${k}`, vendorId: v.id, productId: p.id, date: localISO(new Date(tAgo(h))), at: tAgo(h), qty: diff, type: "adjust", before, after: p.stock, note: "Sanoq farqi", by: (db.staff.find(x => x.vendorId === v.id && x.role === "owner") || {}).id }); db.audit.push({ id: `${v.id}-au${k}`, at: tAgo(h), actor: (db.staff.find(x => x.vendorId === v.id && x.role === "owner") || {}).id, actorName: `${v.contact} (Rahbar)`, vendorId: v.id, action: "Qoldiq tuzatildi", target: p.name, before: fmtQ(p, before), after: fmtQ(p, p.stock), reason: "Sanoq farqi" }); }
  });
  const neg = db.products.find(p => p.id === "v8-p4"); if (neg) neg.stock = -2.5;
  // v6: masalliqsiz texkarta, v3: bekor qilingan, lekin rezervi qolgan buyurtma (anomaliya)
  db.dishes.push({ id: "v6-dx", vendorId: "v6", name: "Norin", cat: "Asosiy", portion: "200 g", ing: [], price: 28000, reviewedAt: dAdd(-3), versions: [{ at: tAgo(72), by: "v6-u0", note: "Yaratildi", cost: 0, price: 28000, ing: [] }] });
  db.audit.push({ id: "au-adm0", at: tAgo(30), actor: "admin", actorName: "CaterFlow admin", vendorId: "v2", action: "Admin override: rezerv bo‘shatildi", target: "CF-1042", before: "3 ta faol rezerv", after: "bo‘shatildi", reason: "Buyurtma bekor qilinganda rezerv avtomatik bo‘shamagan" });

  // CaterFlow’ning o‘z xarajatlari (P&L uchun)
  mks.forEach((mk, mi) => { const f = mi === 2 ? dayNow / 30 : 1; [["Jamoa ish haqi", 18e6], ["Instagram va reklama", [6.5e6, 7.8e6, 8.4e6][mi]], ["Server va IT", 1.2e6], ["Ofis va kommunal", 2.6e6], ["Boshqa", 0.9e6]].forEach(([cat, a], k) => db.cfExpenses.push({ id: `cfe${mi}${k}`, month: mk, cat, amount: Math.round(a * f / 1e4) * 1e4, note: "" })); });

  // ---------- mijoz tomoni: kabinetlar, to‘lovlar, chat, bildirishnomalar, fikrlar ----------
  db.clients = [["cl1", "Aziza Rahimova", "+998 93 410 22 18", "uz", true], ["cl2", "Dilfuza Abdullayeva", "+998 94 120 77 05", "ru", false], ["cl3", "Shahnoza Islomova", "+998 93 271 64 09", "uz", false], ["cl4", "Ravshan Yo‘ldoshev", "+998 99 812 40 56", "en", false], ["cl5", "Nilufar Saidova", "+998 91 404 12 87", "uz", false]].map(([id, name, phone, lang, tg], i) => ({ id, name, phone, lang, tg, createdAt: tAgo(24 * (40 - i * 6)) }));
  [["CF-1048", "cl1"], ["CF-1041", "cl2"], ["CF-1045", "cl3"], ["CF-1044", "cl4"], ["CF-1043", "cl5"]].forEach(([oid, cid]) => { const o = db.orders.find(x => x.id === oid); if (o) o.clientId = cid; });
  [["l4", "cl1"], ["l7", "cl2"]].forEach(([lid, cid]) => { const l = db.leads.find(x => x.id === lid); if (l) l.clientId = cid; });
  const CP = (oid, vid, amount, kind, method, d, note) => db.custPays.push({ id: `cp-${oid}-${kind}`, orderId: oid, vendorId: vid, amount, kind, method, date: dAdd(d), note, by: `${vid}-u0` });
  CP("CF-1045", "v2", 5100000, "avans", "Bank o‘tkazmasi", -3, "30% avans"); CP("CF-1044", "v1", 7560000, "avans", "Naqd", -10, "50% avans"); CP("CF-1043", "v3", 8100000, "avans", "Karta (terminal)", -20, "30% avans"); CP("CF-1043", "v3", 18900000, "qoldiq", "Naqd", -6, "Tadbir kuni");
  const CM = (oid, list) => db.chats.push({ orderId: oid, msgs: list.map(([from, text, h], i) => ({ id: `cm-${oid}-${i}`, at: tAgo(h), from, text })) });
  CM("CF-1048", [["client", "Assalomu alaykum! Takliflar qachon tayyor bo‘ladi?", 20], ["admin", "Va alaykum assalom, Aziza opa. Ikki vendordan taklif keldi, bugun sizga yuboramiz.", 19]]);
  CM("CF-1041", [["client", "Здравствуйте! Утренний плов входит в цену?", 26], ["admin", "Здравствуйте! В предложении Lagan Catering утренний плов включён. Во втором — можно уточнить отдельно.", 25]]);
  CM("CF-1045", [["client", "Menyuga meva assorti qo‘shsa bo‘ladimi?", 60], ["vendor", "Albatta! Meva assorti setda bor, xohlasangiz qatiqli salat ham qo‘shamiz.", 58], ["client", "Rahmat, avansni o‘tkazdim.", 70 - 69]]);
  const CN = (cid, text, h, link, read) => db.cnotifs.push({ id: `cn-${cid}-${h}`, clientId: cid, at: tAgo(h), text, link, read });
  CN("cl1", "CaterFlow: ikki vendordan taklif keldi, tez orada yuboramiz", 19, { view: "c-order", param: "CF-1048" }, false); CN("cl1", "So‘rovingiz qabul qilindi", 30, { view: "c-orders" }, true);
  CN("cl2", "Предложения готовы: 2 — сравните и выберите", 30, { view: "c-order", param: "CF-1041" }, false);
  CN("cl3", "To‘lov qayd etildi: 5 100 000 so‘m (Bank o‘tkazmasi)", 72, { view: "c-order", param: "CF-1045" }, false);
  db.tglog.push({ id: "tg-1", clientId: "cl1", at: tAgo(19), text: "CaterFlow: ikki vendordan taklif keldi, tez orada yuboramiz" });
  db.feedback.forEach(f => { f.status = "published"; });
  db.feedback.push({ id: "fb-v1", vendorId: "v3", setId: "v3-s0", orderId: "CF-1043", author: "Nilufar S.", rating: 5, text: "To‘yimizda osh va xizmat a’lo darajada bo‘ldi. Mehmonlar hali ham maqtashyapti!", at: tAgo(100), via: "kabinet", status: "published", reply: { text: "Rahmat, Nilufar opa! Baxtli bo‘ling.", at: tAgo(90) } });
  db.feedback.push({ id: "fb-p1", vendorId: "v1", setId: "v1-s1", orderId: null, author: "Jahongir T.", rating: 2, text: "Narxi qimmat, porsiya kichik bo‘ldi.", at: tAgo(5), via: "profil", status: "pending" });
  db.feedback.push({ id: "fb-h1", vendorId: "v2", setId: "v2-s0", orderId: null, author: "Promo", rating: 5, text: "Arzon kredit va tez pul! Telegramga yozing.", at: tAgo(30), via: "profil", status: "hidden" });

  // oddiy menyular: yangi vendorlar texkarta yozmagan — CaterFlow vendor yuborgan menyuni taomlar va narx sifatida kiritgan
  const SM = (id, vid, name, desc, price, minGuests, inc, secs, o = {}) => { const lines = []; secs.forEach(([sec, items]) => items.forEach(([n, q, d]) => lines.push({ id: `${id}-l${lines.length}`, sec, name: n, qty: q, d: d != null ? `${vid}-d${d}` : null })));
    db.sets.push(Object.assign({ id, vendorId: vid, kind: "simple", by: "admin", name, desc, price, minGuests, includes: inc, visible: true, estCost: 0, lines, items: lines.filter(l => l.d).map(l => ({ d: l.d, n: 1 })), media: [], createdAt: tAgo(o.h || 48), updatedAt: tAgo(o.h || 48), updatedBy: "admin" }, o.x || {})); };
  SM("v9-s9", "v9", "Samarqand to‘y menyusi", "Samarqand oshi, tandir go‘sht, uch xil salat, qazi, choy va meva.", 95000, 50, ["Ofitsiantlar", "Idish-tovoq", "Choy-qahva xizmati"],
    [["Salatlar", [["Achchiq-chuchuk", "150 g", 2], ["Olivye", "150 g", 3], ["Vinegret", "150 g"]]], ["Sovuq gazaklar", [["Qazi (kesma)", "60 g", 1], ["Tuzlangan sabzavotlar", "100 g"]]], ["Issiq taomlar", [["Samarqand oshi", "350 g"], ["Tandir go‘sht", "150 g"]]], ["Non va boshqalar", [["Samarqand noni", "½ dona"]]], ["Ichimliklar", [["Ko‘k choy", "1 piyola", 7], ["Kompot", "1 stakan"]]], ["Mevalar", [["Meva assorti", "200 g", 8]]]],
    { h: 70, x: { media: [{ id: "v9-m90", t: "photo", label: "Samarqand oshi", tone: 2 }, { id: "v9-m91", t: "photo", label: "Tandir go‘sht", tone: 4 }] } });
  SM("v9-s8", "v9", "Ma’raka menyusi", "Osh, mastava, non, choy va salat.", 60000, 0, ["Idish-tovoq"],
    [["Birinchi taom", [["Mastava", "300 ml", 9]]], ["Issiq taomlar", [["Osh", "300 g"]]], ["Salatlar", [["Achchiq-chuchuk", "150 g", 2]]], ["Non va boshqalar", [["Non", "½ dona", 6]]], ["Ichimliklar", [["Ko‘k choy", "1 piyola", 7]]]],
    { h: 20, x: { visible: false } });
  SM("v6-s9", "v6", "Farg‘ona to‘y menyusi", "Farg‘ona oshi, shashlik, ikki xil salat, non, choy va meva.", 105000, 80, ["Ofitsiantlar", "Idish-tovoq", "Stol bezagi"],
    [["Salatlar", [["Achchiq-chuchuk", "150 g", 2], ["Olivye", "150 g", 3]]], ["Issiq taomlar", [["Farg‘ona oshi", "350 g"], ["Mol go‘shtidan shashlik", "2 six", 4]]], ["Non va boshqalar", [["Non (patir)", "½ dona", 6]]], ["Ichimliklar", [["Ko‘k choy", "1 piyola", 7]]], ["Mevalar", [["Meva assorti", "200 g", 8]]]],
    { h: 200, x: { estCost: 52000, updatedBy: "v6-u0", media: [{ id: "v6-m90", t: "video", label: "Farg‘ona to‘yi", tone: 1 }] } });
  db.audit.push({ id: "au-sm1", at: tAgo(70), actor: "admin", actorName: "CaterFlow admin", vendorId: "v9", action: "Menyu yaratildi", target: "Samarqand to‘y menyusi", before: "", after: "95 000 so‘m · 11 ta taom", reason: "" });
  db.audit.push({ id: "au-sm2", at: tAgo(20), actor: "admin", actorName: "CaterFlow admin", vendorId: "v9", action: "Menyu yaratildi", target: "Ma’raka menyusi", before: "", after: "60 000 so‘m · 5 ta taom · qoralama", reason: "" });
  db.notifs.push({ id: "v9-nsm", vendorId: "v9", at: tAgo(70), text: "CaterFlow yangi menyu qo‘shdi: «Samarqand to‘y menyusi» — 95 000 so‘m / kishi. Tekshirib chiqing va rasm qo‘shing.", link: { view: "menu" }, read: false, roles: ["owner", "manager"] });

  db.activity = [
    { at: tAgo(0.4), who: "instagram", text: "Yangi lead: Malika Yusupova (Direct)" },
    { at: tAgo(2), who: "instagram", text: "Yangi lead: Sardor Mirzayev (Lead Ads)" },
    { at: tAgo(3), who: "admin", text: "CF-1047 buyurtmasini Lagan Catering, Dasturxon Events ga yubordi" },
    { at: tAgo(3.2), who: "v2", text: "“Nargiza Sultonova” leadini qo‘shdi" },
    { at: tAgo(5), who: "v1", text: "CF-1044: tayyorlash boshlandi" },
    { at: tAgo(9), who: "v2", text: "CF-1048 uchun taklif berdi: 189 000 so‘m/kishi" },
    { at: tAgo(22), who: "v1", text: "CF-1048 uchun taklif berdi: 178 000 so‘m/kishi" },
    { at: tAgo(26), who: "v1", text: "“Iroda Mahmudova” leadini Degustatsiya holatiga o‘tkazdi" },
    { at: tAgo(30), who: "admin", text: "CF-1041: 2 ta taklif mijozga yuborildi" },
    { at: tAgo(50), who: "v1", text: "“Sobir Karimov” leadi bilan kelishildi" }
  ];
  return db;
}
