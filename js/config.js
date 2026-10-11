/* CaterFlow prototip — tashqi ilovalar bilan ulanish.
   Haqiqiy mijoz ilovasi bilan birlashtirilganda `customerApp` to‘ldiriladi: admin va vendor panelidagi
   barcha mijoz havolalari (taklif sahifasi, vendorning ochiq sahifasi, ochiq sayt, mijoz kirishi) shu ilovada ochiladi,
   prototipning ichki mijoz sahifalari esa yashiriladi. Bo‘sh (null) qolsa — prototipning o‘z mijoz tomoni ishlaydi.
   Misol:
   window.CF_CONFIG = { customerApp: { base: "http://customer.localhost:5173", home: "/", login: "/login", vendor: "/vendors/{id}", offer: "/offers/{token}" } };
   {id} — vendor id, {token} — buyurtma havola tokeni, {order} — buyurtma raqami. */
"use strict";
window.CF_CONFIG = Object.assign({ customerApp: null }, window.CF_CONFIG || {});
const CUST_EXT = () => { const c = window.CF_CONFIG.customerApp; return c && c.base ? c : null; };
function custURL(kind, p = {}) { const c = CUST_EXT(); if (!c) return null; const path = String(c[kind] || "/").replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(p[k] ?? "")); return c.base.replace(/\/$/, "") + path; }
function openCust(kind, p) { const u = custURL(kind, p); if (!u) return false; window.open(u, "_blank", "noopener"); return true; }
