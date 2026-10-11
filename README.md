# CaterFlow: mijoz sayti, admin va vendor paneli (prototip)

CaterFlow — O'zbekiston uchun catering, ijara va tadbir platformasi. Oddiy HTML va JavaScript bilan yozilgan, build kerak emas.
Ma'lumotlar namuna (demo) bo'lib, brauzerning `localStorage` ida saqlanadi. Mijoz sayti va panel bitta ma'lumotdan foydalanadi: saytda berilgan buyurtma shu zahoti vendor va admin panelida ko'rinadi. Ikkalasi ikki xil oynada ochiq tursa ham avtomatik yangilanadi.

## Ishga tushirish

Papkada lokal server ishga tushiring:

```bash
python3 -m http.server 8000
```

- Mijoz sayti: http://localhost:8000/site/
- Admin va vendor paneli: http://localhost:8000

Har doim bitta manzildan foydalaning: `localhost` yoki `127.0.0.1`. Brauzer uchun bular ikki xil sayt, ma'lumotlari alohida.

## Demo hisoblar

**Mijoz sayti** — telefon raqam bilan kiriladi. Kirish oynasida demo tugmalar bor, SMS kodi ekranda ko'rsatiladi.

| Kim | Telefon | Nimani ko'rish mumkin |
|---|---|---|
| Aziza (shaxsiy mijoz) | +998 93 410 22 18 | tug'ilgan kun: savat buyurtmasi tasdiq kutmoqda, taklif so'rovi |
| Kamola (event menejer, ambassador) | +998 90 123 45 67 | 250 kishilik to'y: reja, mehmonlar/RSVP, pul, ulashish sahifasi, shablonlar, shaxsiy menejer, cashback |
| Madina (event menejer, ruscha) | +998 91 777 30 12 | ambassadorlik arizasi |
| Dilnoza / Artel (kompaniya) | +998 99 300 11 22 | ofis tushligi obunasi, xodimlar, oylik hisob-faktura |
| Ravshan (inglizcha) | +998 99 812 40 56 | bugungi yubiley: tadbir kuni jonli kuzatuv |

**Panel**

| Kim | Login | Parol |
|---|---|---|
| Admin | `admin` | `admin2026` |
| Lagan Catering — rahbar | `lagan` | `lagan2026` |
| Lagan — menejer / omborchi / oshpaz | `lagan.menejer` / `lagan.ombor` / `lagan.oshpaz` | `menejer2026` / `ombor2026` / `oshpaz2026` |
| Dasturxon Events — rahbar | `dasturxon` | `dasturxon2026` |
| Toshkent Prokat (jihozlar ijarasi) | `prokat` | `prokat2026` |
| Bog'i Eram (joy) | `eram` | `eram2026` |
| Usta Oshpazlar (oshpaz, ofitsiant, boshlovchi) | `usta` | `usta2026` |
| Zarhal Dekor (bezak va texnika) | `dekor` | `dekor2026` |

## Mijoz sayti (`site/`)

- **Catering katalogi.** Mijoz tadbir turi, sanasi, mehmon soni, hudud va byudjetni kiritadi — faqat mos cateringlar chiqadi. Filtrlar: tez tasdiq, ishonchli, tanlovli setlar, reyting.
- **Tanlovli setlar.** Vendor o'zining texkartali setiga tanlov guruhi qo'shadi, masalan "Klassik to'y: 5 ta salatdan 2 tasi". Mijoz rasmga qarab faqat limit ichida tanlaydi. Guruhdagi texkartali taom setning doimiy qismidan chiqadi, mijoz shu o'rinda o'zi tanlaydi. Shuning uchun paneldagi menyular va texkartalar o'zgarmaydi.
- **O'z setingizni yig'ing.** Mijoz oshxona taomlaridan setni noldan yig'adi, narx kishi boshiga darhol hisoblanadi.
- **Ijara va xizmatlar.** Bitta bo'lim to'rt kategoriyaga bo'lingan: jihozlar, joy, odamlar, bezak va texnika.
  - Oshpazni ikki xil chaqirish mumkin: mahsulot bilan yoki faqat xizmat uchun.
  - Faqat xizmat tanlansa, mehmon soniga qarab xarid ro'yxati avtomatik chiqadi.
- **Savat.**
  - Bitta savatda bitta catering va istalgancha ijara bo'ladi.
  - Vendor qoidalari tekshiriladi: minimal buyurtma, yetkazish narxi, necha kun oldin buyurtma qilish, sig'im, band sanalar.
  - Hamyondagi balansdan chegirma olsa bo'ladi.
- **Tasdiqlash.**
  - Vendorda avto-tasdiq yoqilgan bo'lsa, buyurtma darhol tasdiqlanadi.
  - Aks holda vendor 2 soat ichida tasdiqlaydi; javob bo'lmasa admin aralashadi.
  - To'lov vendorga naqd yoki o'tkazma orqali qilinadi.
- **Taklif so'rash (RFQ).** Bir nechta vendordan narx olinadi, mijoz kabinetida solishtirib tanlaydi.
- **Tadbir kabineti.** Tadbirning umumiy holati, dastur va checklist, mehmonlar (RSVP havolasi, stol joylashuvi), pul (reja va haqiqat, to'lov jadvali) hamda tadbir kuni jonli kuzatuv bir joyda.
- **Event menejer (Pro).**
  - Mijozga ulashish sahifasi, jamoa, shablonlar va shaxsiy menejer.
  - Ambassadorlik: admin tasdiqlaydi, har tadbirdan 5% cashback beriladi.
- **Kompaniya.** Xodimlar, oylik limit, hisob-faktura va ofis tushligi obunasi (buyurtmalar har ish kuni o'zi tushadi).
- **Hamyon.**
  - Har buyurtmadan 1% ball, do'st taklifi uchun bonus.
  - Ambassadorlar cashbackni pul qilib yechadi, yechishni admin tasdiqlaydi.
- **Mezbon AI** yordamchi o'zbek, rus va ingliz tillarida ishlaydi. Hozir demo rejimda, kalitsiz:
  - savolga javob beradi va set tavsiya qiladi;
  - buyurtmani to'ldiradi;
  - kerak bo'lsa, so'rovni menejerga uzatadi.

  Haqiqiy AI keyin `js/config.js` dagi `CF_CONFIG.ai.endpoint` orqali ulanadi.
- **Buyurtmadan keyin:**
  - menyu tanlovini tadbirdan 2 kun oldingacha o'zgartirish mumkin;
  - "Qayta buyurtma berish" tugmasi bor;
  - bekor qilish qoidasi: 7+ kun oldin 100%, 3–6 kun 70%, 1–2 kun 40% qaytariladi; admin tasdiqlaydi.
- **Qo'shimchalar:** degustatsiyaga yozilish, tadbirni Google kalendarga qo'shish, oshxona yoki taom bo'yicha qidirish.
- **UX qoidalari:**
  - Har ekranda bitta asosiy (oltin) tugma bor.
  - Tadbir paneli (sana, mehmonlar, hudud) har doim ko'rinib turadi va tahrirlanadi. Sana va mehmon soni o'zi to'ldirilmaydi, mijoz kiritadi.
  - Savatda biror narsa bo'lsa, pastda savat paneli turadi. Telefonda savat va "O'z setingiz" sahifalarining pastida yopishqoq jami paneli bor.
  - Set tanlash oynasida:
    - tanlov guruhlari birinchi turadi;
    - tugma qaysi guruh qolganini aytadi va o'sha joyga olib boradi;
    - guruh to'lganda yangi tanlov eng eskisining o'rnini oladi;
    - "Ko'p tanlanadi" belgisi bor.
  - Savatda muammo yonida "tuzatish" tugmasi chiqadi, o'chirilgan narsani "Qaytarish" bilan tiklash mumkin.
  - Telefon bitta oynada tasdiqlanadi: +998 prefiks, kod 4 raqam terilganda o'zi yuboriladi, kodni qayta yuborish mumkin. Keyin "Buyurtmangiz yuborildi" sahifasi ochiladi.
  - Buyurtma va tadbir sahifalarida "Keyingi qadam" bloki bor.
  - Fikrni faqat buyurtmasi yakunlangan mijoz qoldiradi.
  - Mezbon pastki o'ng burchakdagi tugmadan qalqib chiquvchi oynada ochiladi. Birinchi tashrifda 6 soniyadan keyin sahifaga mos salomlashuv chiqadi. Oynani kattalashtirsa bo'ladi; telefonda to'liq ekran.
  - "Tadbiringiz haqida" — ezCater kabi bitta gorizontal qator: tadbir turi, sana, mehmonlar, hudud, byudjet. Katalog, vendor va ijara sahifalari tepasida uning ixcham varianti bor, telefonda esa qisqa yozuv bo'lib ko'rinadi.
  - Ranglar: zumrad + oltin. Bosh banner to'q yashil, sahifalar oq, oltin asosiy urg'u. Ranglar `site/index.html` dagi `:root` tokenlarida. Kontrast WCAG AA'ga mos, tugmalar kamida 40–44 px.
- Sayt uch tilda: o'zbek, rus va ingliz.

## Panelga qo'shilganlar

Mavjud sahifalar, menyu tartibi va panelning o'z mijoz sahifalari (kirish oynasidagi "Mijozlar uchun", "Demo: rolni almashtirish" ichidagi "Mijoz tomoni") asl holicha qolgan. Faqat yangi bo'limlar qo'shilgan:

- **Kirish oynasi.** Alohida "Yangi mijoz sayti" bloki va "CaterFlow saytini ochish" tugmasi bor.
- **Chap menyu.** "Mijoz sayti" (admin) va "CaterFlow sayti" (vendor) menyuning eng oxirida, ingichka chiziq bilan ajratilgan. Ijara hamkorida bu bo'lim birinchi turadi.
- **Ma'lumot.** Saytdan kelgan buyurtmalar odatdagi "Buyurtmalar" va "Holat paneli"ga tushadi. "Menyular"ga faqat ikkita yangi texkartali set qo'shilgan: Dasturxon Events va Siyob Oshxonasining "Ofis tushligi" seti, sayt obunasi uchun.

- **Admin → "Mijoz sayti".**
  - Umumiy: kechikkan savat buyurtmalari va hamkorlar, arizalar.
  - Ijara: kategoriya bo'yicha komissiya, katalog moderatsiyasi.
  - Ambassadorlar: arizalarni tasdiqlash, pul yechish.
  - Bonuslar.
  - Bekor qilish so'rovlari: tasdiqlash, pul qaytarishni qayd etish.
  - Tadbir kuni muammolari.
  - Tadbirlar: shaxsiy menejer biriktirish va u bilan chat.
  - Korporativ: hisob-fakturalar.
  - Mezbon AI suhbatlari.
- **Admin → Vendor → "CaterFlow sayti" tabi.**
- **Vendor → "CaterFlow sayti".**
  - Savat qoidalari: avto-tasdiq va hudud bo'yicha yetkazish narxi.
  - Set tanlov guruhlari.
  - Ijara katalogi va ijara buyurtmalari.
  - Tadbir kuni holati: "yo'lda", "yetib keldi", "tayyor", "muammo".
  - Doimiy buyurtmalar.
- **Vendor → "Buyurtmalar".** Savat buyurtmasini qabul qilish yoki rad etish. Mijoz tanlovi shu buyurtma ichida ko'rinadi.
- **Ijara hamkorlari.**
  - Vendor paneliga kiradi va faqat o'z katalogi bilan buyurtmalarini ko'radi.
  - Admin panelidagi catering ro'yxatlarida (vendorlar, moliya, ombor, buyurtmani yuborish) ko'rinmaydi.
  - "Mijoz sayti → Ijara" orqali boshqariladi.

## Fayllar

- `index.html` — panel sahifasi va dizayni.
- `js/` — panel modullari: `core.js`, `seed.js`, `admin*.js`, `vendor.js`, `vorders.js`, `kitchen.js`, `inv.js`, `app.js` va boshqalar.
  - `seed2.js` — sayt ma'lumotlari: ijara, tanlovli setlar, tadbirlar, hamyon, obunalar. Panel ham, sayt ham ishlatadi.
  - `site-panel.js` — panelga qo'shilgan sayt bo'limlari.
  - `sync.js` — panel va sayt orasida jonli yangilanish.
  - `config.js` — asl holicha: tashqi mijoz ilovasi manzili (bo'sh) va AI sozlamasi. Yangi sayt havolalari `site-panel.js` ichida (`SITE_BASE`).
- `site/index.html` — mijoz sayti va dizayni.
  - `site/js/` — `s-core.js` (holat, til, marshrut), `s-art.js` (illyustratsiyalar), `s-pages.js` (bosh sahifa, katalog, vendor, set, yig'ish), `s-shop.js` (ijara, savat, kirish, taklif so'rash), `s-account.js` (kabinet, hamyon, Pro, kompaniya), `s-event.js` (tadbir kabineti, RSVP, ulashish), `s-ai.js` (Mezbon), `s-boot.js`.

## Ishlab chiquvchi uchun

- `index.html` va `site/index.html` dagi script havolalarida `?v=...` versiyasi bor. JS o'zgarganda versiyani yangilang, aks holda brauzer eski faylni keshdan oladi.
- Panel va sayt bitta `localStorage` kalitidan foydalanadi (`caterflow-demo-v1`).
  - Sayt ma'lumotlari `ensureSiteData()` orqali qo'shiladi (`db.siteV`), mavjud demo ma'lumot o'chmaydi.
  - `siteV` 1 dan 2 ga avtomatik ko'chiriladi (`migrateSiteV2`). Avvalgi alohida "oddiy menyu" tanlovli setlar olib tashlanadi, buyurtma va shablonlardagi havolalar vendorning asl setlariga o'tadi.
  - Hamma demo ma'lumotni boshlang'ich holatga qaytarish uchun brauzer konsolida `localStorage.clear()` qiling.
