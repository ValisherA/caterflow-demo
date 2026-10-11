/* CaterFlow mijoz sayti — oltin chiziqli illyustratsiyalar (rasm o‘rniga; vendor rasm yuklasa, o‘sha ko‘rsatiladi) */
"use strict";
const ILL = {
  plov: '<ellipse cx="32" cy="45" rx="26" ry="8"/><path d="M10 43c2-12 11-20 22-20s20 8 22 20"/><path d="M21 31l3 3M29 27l2 4M38 28l-2 4M44 34l-3 2M17 38l3 1"/><circle cx="32" cy="34" r="3.2"/>',
  salad: '<path d="M8 34h48c0 12-11 20-24 20S8 46 8 34z"/><path d="M17 34c0-8 6-14 11-14 0 6-4 10-11 14M30 34c2-10 10-16 16-15-1 7-7 12-16 15M23 26c2-4 6-6 9-6"/><circle cx="41" cy="29" r="2.5"/><circle cx="22" cy="31" r="1.5"/>',
  kebab: '<line x1="9" y1="55" x2="55" y2="9"/><rect x="17" y="35" width="11" height="11" rx="2.5" transform="rotate(-45 22.5 40.5)"/><rect x="28" y="24" width="11" height="11" rx="2.5" transform="rotate(-45 33.5 29.5)"/><rect x="39" y="13" width="11" height="11" rx="2.5" transform="rotate(-45 44.5 18.5)"/><path d="M8 48c3 1 5 3 6 6"/>',
  manti: '<path d="M9 46c0-10 8-16 14-16s14 6 14 16z"/><path d="M27 46c0-10 8-16 14-16s14 6 14 16z"/><path d="M16 34c3 2 7 2 10 0M34 34c3 2 7 2 10 0M23 30v-4M41 30v-4"/><path d="M5 50h54"/>',
  soup: '<path d="M8 32h48c0 12-11 20-24 20S8 44 8 32z"/><path d="M22 24c-2-3 2-5 0-8M32 24c-2-3 2-5 0-8M42 24c-2-3 2-5 0-8"/><path d="M14 33c4 3 10 4 18 4s14-1 18-4"/>',
  qazi: '<circle cx="22" cy="34" r="10"/><circle cx="22" cy="34" r="4"/><circle cx="42" cy="29" r="10"/><circle cx="42" cy="29" r="4"/><path d="M8 51h48"/>',
  bread: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="11"/><path d="M32 25v14M25 32h14M27 27l10 10M37 27l-10 10"/><path d="M16 18l2 2M46 18l-2 2M16 46l2-2M46 46l-2-2"/>',
  tea: '<path d="M10 30h26v8a12 12 0 0 1-12 12h-2A12 12 0 0 1 10 38z"/><path d="M36 33c6 0 8 3 8 5s-3 5-8 5"/><path d="M16 30c0-5 4-8 7-8s7 3 7 8"/><path d="M23 22v-3"/><path d="M44 54h14M46 47h10c0 5-2 7-5 7s-5-2-5-7z"/>',
  fruit: '<circle cx="23" cy="39" r="12"/><path d="M23 27v-4M19 24l4 3 4-3"/><circle cx="44" cy="28" r="4"/><circle cx="51" cy="35" r="4"/><circle cx="42" cy="36" r="4"/><circle cx="47" cy="43" r="4"/><path d="M45 24c0-4 3-7 7-7"/>',
  cake: '<path d="M12 52h40V35H12z"/><path d="M12 43c4 3 8 3 10 0s8-3 10 0 8 3 10 0 8-3 10 0"/><path d="M18 35v-7h28v7"/><path d="M32 28v-7M32 21c-2-2 0-5 0-5s2 3 0 5"/>',
  meat: '<path d="M41 13c8 0 12 8 8 16L39 43c-4 6-14 8-20 2s-4-14 2-18l12-10c2-2 5-4 8-4z"/><path d="M19 45l-7 7M12 52a3 3 0 1 1-2.5-2.5"/><path d="M30 26c3 1 6 4 7 7"/>',
  dish: '<path d="M8 46h48"/><path d="M12 46a20 20 0 0 1 40 0"/><circle cx="32" cy="22" r="3"/><path d="M5 52h54"/><path d="M20 38c2-5 6-8 10-9"/>',
  chair: '<path d="M20 7h24v25H20z"/><path d="M17 32h30v6H17z"/><path d="M20 38v18M44 38v18M25 13h14M25 19h14"/>',
  table: '<ellipse cx="32" cy="24" rx="24" ry="7"/><path d="M8 24v8c0 4 11 7 24 7s24-3 24-7v-8"/><path d="M32 39v15M22 56h20"/>',
  tent: '<path d="M6 50L32 13l26 37z"/><path d="M32 13v37M24 50l8-14 8 14"/><path d="M3 50h58M32 13V7"/><path d="M32 7l7 3-7 3"/>',
  plates: '<ellipse cx="32" cy="40" rx="24" ry="10"/><ellipse cx="32" cy="38" rx="14" ry="5"/><path d="M10 14v12M8 14v5c0 2.5 4 2.5 4 0v-5M54 14v14M54 14c-3.5 2-3.5 7 0 9"/>',
  cloth: '<path d="M8 20h48l-6 32H14z"/><path d="M14 20l4 32M26 20l2 32M38 20l-2 32M50 20l-4 32"/><path d="M8 20c8-6 40-6 48 0"/>',
  cauldron: '<path d="M10 28h44c0 14-10 24-22 24S10 42 10 28z"/><path d="M5 28h54"/><path d="M17 51l-5 7M47 51l5 7"/><path d="M24 20c-2-3 2-5 0-8M32 20c-2-3 2-5 0-8M40 20c-2-3 2-5 0-8"/>',
  hall: '<path d="M5 24L32 9l27 15"/><path d="M10 24h44v28H10z"/><path d="M18 52V32M27 52V32M37 52V32M46 52V32"/><path d="M3 56h58"/><circle cx="32" cy="18" r="2"/>',
  garden: '<path d="M18 54V35"/><circle cx="18" cy="25" r="11"/><path d="M34 19q11 7 25 2"/><circle cx="39" cy="23" r="1.6"/><circle cx="46" cy="25" r="1.6"/><circle cx="53" cy="24" r="1.6"/><path d="M3 54h58"/><path d="M38 54V41h18v13"/><path d="M38 41l9-6 9 6"/>',
  dacha: '<path d="M7 30L32 11l25 19"/><path d="M13 26v26h38V26"/><path d="M28 52V38h8v14"/><path d="M45 18v-7h5v11"/><path d="M17 33h7v6h-7z"/>',
  teahouse: '<path d="M10 54V27a22 22 0 0 1 44 0v27"/><path d="M18 54V30a14 14 0 0 1 28 0v24"/><path d="M25 43h14c0 5-3 7-7 7s-7-2-7-7z"/><path d="M5 54h54"/>',
  chef: '<path d="M20 34c-6 0-10-4-10-10s5-10 10-9c1-5 6-9 12-9s11 4 12 9c5-1 10 3 10 9s-4 10-10 10"/><path d="M20 34v14h24V34"/><path d="M20 42h24"/><path d="M26 22v6M32 20v8M38 22v6"/>',
  waiter: '<circle cx="28" cy="15" r="7"/><path d="M14 56V39a14 14 0 0 1 28 0v17"/><path d="M38 33h20"/><path d="M40 33a8 8 0 0 1 16 0"/><path d="M48 23v2"/><path d="M28 30v8"/>',
  mic: '<rect x="24" y="6" width="16" height="28" rx="8"/><path d="M16 26v2a16 16 0 0 0 32 0v-2"/><path d="M32 44v12M22 56h20"/><path d="M24 16h16M24 22h16"/>',
  broom: '<path d="M45 6L29 34"/><path d="M22 32l12 6-4 18c-8-2-14-8-16-16z"/><path d="M19 44l7 3M17 50l7 3"/>',
  flowers: '<circle cx="32" cy="18" r="6"/><circle cx="21" cy="24" r="6"/><circle cx="43" cy="24" r="6"/><circle cx="26" cy="12" r="5"/><circle cx="38" cy="12" r="5"/><path d="M32 24v20M21 30l9 12M43 30l-9 12"/><path d="M19 44h26l-4 12H23z"/>',
  lights: '<path d="M4 13q28 22 56 0"/><path d="M14 19v6M24 24v6M34 25v6M44 22v6M54 17v6"/><circle cx="14" cy="28" r="3"/><circle cx="24" cy="33" r="3"/><circle cx="34" cy="34" r="3"/><circle cx="44" cy="31" r="3"/><circle cx="54" cy="26" r="3"/><path d="M10 50h44M16 56h32"/>',
  speaker: '<rect x="16" y="6" width="32" height="52" rx="4"/><circle cx="32" cy="40" r="10"/><circle cx="32" cy="40" r="3"/><circle cx="32" cy="18" r="5"/>',
  stage: '<path d="M4 44h56v10H4z"/><path d="M8 44V11h48v33"/><path d="M8 11c6 8 10 16 10 33M56 11c-6 8-10 16-10 33"/><path d="M27 31l5-7 5 7"/><circle cx="32" cy="35" r="2"/>',
  camera: '<path d="M6 20h12l4-6h20l4 6h12v32H6z"/><circle cx="32" cy="35" r="10"/><circle cx="32" cy="35" r="4"/><path d="M50 26h2"/>',
  drone: '<rect x="24" y="28" width="16" height="10" rx="3"/><path d="M24 31H12M40 31h12"/><path d="M4 26h16M44 26h16"/><path d="M12 26v5M52 26v5"/><path d="M28 38l-4 8M36 38l4 8"/><circle cx="32" cy="33" r="2"/>',
  rings: '<circle cx="24" cy="39" r="14"/><circle cx="40" cy="39" r="14"/><path d="M27 19l5-9 5 9z"/><path d="M27 19h10"/>',
  building: '<path d="M13 56V9h25v47"/><path d="M38 24h13v32"/><path d="M19 17h4M28 17h4M19 25h4M28 25h4M19 33h4M28 33h4M19 41h4M28 41h4M43 32h4M43 40h4M43 48h4"/><path d="M7 56h50"/>',
  lunch: '<rect x="8" y="24" width="48" height="26" rx="5"/><path d="M8 34h48"/><path d="M24 24v-6h16v6"/><path d="M30 34v16"/><path d="M14 42h10M38 42h12"/>',
  balloon: '<path d="M25 7c-8 0-14 7-14 15 0 9 8 16 14 18 6-2 14-9 14-18 0-8-6-15-14-15z"/><path d="M25 40l-2 4h4z"/><path d="M25 44c0 6 4 6 4 13"/><path d="M45 17c-5 0-9 5-9 10 0 6 5 10 9 12 4-2 9-6 9-12 0-5-4-10-9-10z"/><path d="M45 39c0 6-3 8-3 17"/>',
  spark: '<path d="M32 6l5 15 15 5-15 5-5 15-5-15-15-5 15-5z"/><path d="M50 42l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M14 40l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/>',
  build: '<rect x="8" y="10" width="20" height="20" rx="4"/><rect x="36" y="10" width="20" height="20" rx="4"/><rect x="8" y="38" width="20" height="16" rx="4"/><path d="M46 38v16M38 46h16"/>'
};
const SUB_ICON = { "Stol-stul": "chair", "Shatyor": "tent", "Idish-tovoq": "plates", "Dasturxon va matolar": "cloth", "Qozon va isitgich": "cauldron", "To‘yxona va zal": "hall", "Hovli va bog‘": "garden", "Dacha": "dacha", "Choyxona": "teahouse", "Oshpaz": "chef", "Ofitsiant": "waiter", "Boshlovchi": "mic", "Xizmatchi": "broom", "Gul bezagi": "flowers", "Chiroq": "lights", "Ovoz uskunasi": "speaker", "Sahna": "stage", "Foto va video": "camera" };
const CAT_ICON = { jihoz: "chair", joy: "hall", odam: "chef", bezak: "flowers" };
const SEG_ICON = { toy: "rings", korp: "building", ofis: "lunch", kichik: "balloon" };
const ill = (k, size) => `<svg class="ill" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${size ? ` style="width:${size}px;height:${size}px"` : ""}>${ILL[k] || ILL.dish}</svg>`;
const icoBox = (k, size = 30) => `<span class="ico">${ill(k, size)}</span>`;
function artKey(label) { const n = String(label || "").toLowerCase(); if (/zal|restoran|to‘yxona/.test(n)) return "hall"; if (/tog‘|tabiat|bog‘/.test(n)) return "garden"; if (/servis|ofitsiant/.test(n)) return "waiter"; if (/dasturxon|stol|fursat/.test(n)) return "dish"; return ICON_OF(n); }
const rentIcon = r => /dron/i.test(r.name) ? "drone" : /stol\b|stoli/i.test(r.name) && !/stul/i.test(r.name) ? "table" : SUB_ICON[r.sub] || CAT_ICON[r.cat] || "dish";
function art(key, tone = 0, cap = "", cls = "", video = false, src = null) {
  const inner = src ? `<img src="${src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ill(key);
  return `<div class="art t${tone % 6} ${cls}">${inner}${video ? `<span class="vid">${ic("play", 12)}</span>` : ""}${cap ? `<span class="cap">${esc(cap)}</span>` : ""}</div>`;
}
const mediaArt = (m, cls = "") => art(artKey(m.label), m.tone || 0, m.label, cls, m.t === "video", m.src && m.t !== "video" ? m.src : null);
function setArt(s, cls = "") { const m = (s.media || [])[0]; return m ? mediaArt(m, cls) : art(artKey(s.name), (s.id.length + (s.price / 1000 | 0)) % 6, "", cls); }
const dishArt = (d, cls = "") => art(ICON_OF(d.name), ({ Asosiy: 0, Salat: 2, Gazak: 3, Shirinlik: 4, Ichimlik: 1 })[d.cat] ?? 5, "", cls);
const optArt = (o, cls = "") => art(ICON_OF(o.name), (o.name.length * 7) % 6, "", cls);
// fon naqshi: sakkiz qirrali yulduzli o‘zbekona girih
function ornament() {
  let s = ""; const C = 260;
  for (let k = 0; k < 3; k++) { const r = 70 + k * 70; let p = ""; for (let i = 0; i < 16; i++) { const a = Math.PI / 8 * i, rr = i % 2 ? r * 0.72 : r; p += `${i ? "L" : "M"}${(C + rr * Math.cos(a)).toFixed(1)},${(C + rr * Math.sin(a)).toFixed(1)}`; } s += `<path d="${p}Z"/>`; s += `<circle cx="${C}" cy="${C}" r="${r * 0.55}"/>`; }
  for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i; s += `<line x1="${C}" y1="${C}" x2="${(C + 250 * Math.cos(a)).toFixed(1)}" y2="${(C + 250 * Math.sin(a)).toFixed(1)}"/>`; }
  return `<svg class="orn" viewBox="0 0 520 520" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${s}</svg>`;
}
