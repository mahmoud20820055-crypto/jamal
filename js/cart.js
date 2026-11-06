/* =========================================================
   הכל להכל – סל קניות + קבלה/סיכום הזמנה בוואטסאפ
   - "לסל" בכל גודל/סוג של מוצר (js/products.js)
   - הסל נשמר בדפדפן (localStorage)
   - טופס פרטים: שם, טלפון, עסק, יישוב, כתובת, משלוח/איסוף, מיקום, הערות
   - שליחה: פותח וואטסאפ למספר ההזמנות (SITE.orderWhatsapp || SITE.whatsapp)
     עם קבלה מלאה, ושומר עותק בלוח המנהל (כפנייה) אם השרת זמין.
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE, P = window.PRODUCTS || [], H = window.HL, C = window.HLChat;
  if (!H || !P.length) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = H.esc, price = H.price;
  var KEY = "hl_cart", CUST = "hl_cust";
  var ORDER_WA = String(S.orderWhatsapp || S.whatsapp || "").replace(/\D/g, "");

  /* ---------- storage ---------- */
  function read(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var cart = read(KEY, []);
  if (!Array.isArray(cart)) cart = [];

  function find(pid) { for (var i = 0; i < P.length; i++) if (P[i].id === pid) return P[i]; return null; }
  // keep only items that still exist in products.js (prices always come from products.js)
  function lines() {
    return cart.map(function (it) {
      var p = find(it.pid), v = p && p.variants[it.vi];
      if (!p || !v) return null;
      var unit = v.price == null ? null : Number(v.price);
      return { key: it.pid + ":" + it.vi, pid: it.pid, vi: it.vi, qty: it.qty, p: p, v: v, unit: unit, total: unit == null ? null : unit * it.qty };
    }).filter(Boolean);
  }
  function save() { write(KEY, cart); render(); }
  function step(p) { return Math.max(1, parseInt(p.step || p.minQty || 1, 10)); }
  function minQty(p) { return Math.max(1, parseInt(p.minQty || 1, 10)); }

  function add(pid, vi) {
    var p = find(pid); if (!p || !p.variants[vi]) return;
    var it = cart.filter(function (x) { return x.pid === pid && x.vi === vi; })[0];
    if (it) it.qty += step(p); else cart.push({ pid: pid, vi: vi, qty: minQty(p) });
    save(); bump();
    toast("נוסף לסל ✓ " + p.name + (p.variants[vi].name ? " – " + p.variants[vi].name : ""));
  }
  function setQty(key, q) {
    cart = cart.map(function (x) {
      if (x.pid + ":" + x.vi !== key) return x;
      var p = find(x.pid); q = Math.max(0, Math.floor(q || 0));
      if (q && p && q < minQty(p)) q = minQty(p);
      x.qty = q; return x;
    }).filter(function (x) { return x.qty > 0; });
    save();
  }
  function sum(ls) {
    var known = ls.filter(function (l) { return l.total != null; });
    return { total: known.reduce(function (a, l) { return a + l.total; }, 0), partial: known.length !== ls.length };
  }
  function money(n) { return "₪" + Number(n).toFixed(2); }

  /* ---------- UI refs ---------- */
  var drawer = $("#cart"), list = $("#cartList"), foot = $("#cartFoot"), badge = $("#cartBadge");
  var form = $("#cartForm"), done = $("#cartDone"), views = { list: $("#cartView"), form: form, done: done };
  var lastFocus = null;

  function show(view) {
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== view; });
    $("#cartTitle").textContent = view === "form" ? "פרטים להזמנה" : view === "done" ? "ההזמנה מוכנה" : "הסל שלי";
    $("#cartBack").hidden = view !== "form";
  }
  function open(view) {
    lastFocus = document.activeElement;
    drawer.hidden = false; document.body.classList.add("no-scroll");
    $("#cartBtn").setAttribute("aria-expanded", "true");
    show(view || "list"); render();
    setTimeout(function () { $(".cart__x").focus(); }, 30);
  }
  function close() {
    drawer.hidden = true; document.body.classList.remove("no-scroll");
    $("#cartBtn").setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function bump() {
    var b = $("#cartBtn"); b.classList.remove("is-bump"); void b.offsetWidth; b.classList.add("is-bump");
  }

  function render() {
    var ls = lines(), n = ls.length;
    badge.hidden = !n; badge.textContent = n;
    $("#cartBtn").setAttribute("aria-label", "סל הקניות" + (n ? " – " + n + " פריטים" : ""));
    if (!n) {
      list.innerHTML = '<div class="cart__empty">' + H.icon("box") + "<b>הסל ריק</b><p>הוסיפו מוצרים מהקטלוג בלחיצה על \"לסל\".</p>" +
        '<a href="#products" class="btn btn--primary btn--sm" data-cart-close>לקטלוג המוצרים</a></div>';
      foot.hidden = true;
      return;
    }
    list.innerHTML = ls.map(function (l) {
      var img = l.p.img ? '<img src="' + esc(l.p.img) + '" alt="" width="64" height="64">' : '<span class="ci__ph">' + H.icon((H.catById(l.p.category) || {}).icon) + "</span>";
      return '<div class="ci" data-key="' + esc(l.key) + '">' +
        '<div class="ci__img">' + img + "</div>" +
        '<div class="ci__info"><b>' + esc(l.p.name) + "</b>" +
          "<small>" + esc([l.v.name, l.v.size].filter(Boolean).join(" · ")) + "</small>" +
          '<span class="ci__unit">' + (l.unit == null ? "מחיר לפי הצעה" : money(l.unit) + " ליח׳") + "</span></div>" +
        '<div class="ci__qty">' +
          '<button type="button" data-q="-" aria-label="הפחתה">−</button>' +
          '<input type="number" inputmode="numeric" min="0" value="' + l.qty + '" aria-label="כמות">' +
          '<button type="button" data-q="+" aria-label="הוספה">+</button></div>' +
        '<div class="ci__total">' + (l.total == null ? "—" : money(l.total)) + "</div>" +
        '<button type="button" class="ci__rm" data-rm aria-label="הסרה">×</button>' +
        "</div>";
    }).join("");
    var s = sum(ls);
    foot.hidden = false;
    $("#cartSum").textContent = money(s.total) + (s.partial ? " +" : "");
    $("#cartItems").textContent = n + " פריטים";
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]");
    if (a) { e.preventDefault(); add(a.dataset.add, +a.dataset.vi); return; }
    if (e.target.closest("#cartBtn")) { drawer.hidden ? open("list") : close(); return; }
    if (e.target.closest("[data-cart-close]")) { close(); return; }
    var row = e.target.closest(".ci");
    if (row) {
      var key = row.dataset.key, it = cart.filter(function (x) { return x.pid + ":" + x.vi === key; })[0]; if (!it) return;
      var p = find(it.pid), st = step(p);
      if (e.target.closest("[data-q='+']")) setQty(key, it.qty + st);
      else if (e.target.closest("[data-q='-']")) setQty(key, it.qty - st < minQty(p) ? 0 : it.qty - st);
      else if (e.target.closest("[data-rm]")) setQty(key, 0);
    }
  });
  list.addEventListener("change", function (e) {
    var inp = e.target.closest(".ci input"); if (!inp) return;
    setQty(inp.closest(".ci").dataset.key, parseInt(inp.value, 10));
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !drawer.hidden) close(); });
  $("#cartNext").addEventListener("click", function () { show("form"); fillCustomer(); setTimeout(function () { form.name.focus(); }, 30); });
  $("#cartBack").addEventListener("click", function () { show("list"); });
  $("#cartClear").addEventListener("click", function () { if (confirm("לרוקן את הסל?")) { cart = []; save(); } });

  /* ---------- customer form ---------- */
  function fillCustomer() {
    var c = read(CUST, {});
    ["name", "phone", "business", "city", "address"].forEach(function (k) { if (c[k] && !form[k].value) form[k].value = c[k]; });
  }
  function toggleAddress() {
    var delivery = form.delivery.value === "delivery";
    form.address.required = delivery;
    $("#addrReq").hidden = !delivery;
  }
  Array.prototype.forEach.call(form.delivery, function (r) { r.addEventListener("change", toggleAddress); });
  toggleAddress();

  var geo = $("#cartGeo"), geoTxt = $("#cartGeoTxt");
  if (!("geolocation" in navigator) || !window.isSecureContext) geo.hidden = true;
  geo.addEventListener("click", function () {
    geoTxt.textContent = "מאתר מיקום…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6);
      form.location.value = "https://maps.google.com/?q=" + lat + "," + lng;
      geoTxt.textContent = "✓ המיקום צורף להזמנה";
    }, function () { geoTxt.textContent = "לא הצלחנו לאתר מיקום. אפשר לכתוב כתובת."; }, { enableHighAccuracy: true, timeout: 12000 });
  });

  function orderId() {
    var d = new Date(), p = function (n) { return ("0" + n).slice(-2); };
    return "HL-" + String(d.getFullYear()).slice(-2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.floor(1000 + Math.random() * 9000);
  }
  var dtf = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  function receiptText(o) {
    var L = [];
    L.push("🧾 *הזמנה חדשה – " + S.name + "*");
    L.push("מספר הזמנה: " + o.id);
    L.push("תאריך: " + o.date);
    L.push("");
    L.push("👤 *פרטי הלקוח*");
    L.push("שם: " + o.c.name);
    L.push("טלפון: " + o.c.phone);
    if (o.c.business) L.push("עסק: " + o.c.business);
    L.push("יישוב: " + o.c.city);
    if (o.c.address) L.push("כתובת: " + o.c.address);
    if (o.c.location) L.push("מיקום: " + o.c.location);
    L.push("קבלת ההזמנה: " + (o.c.delivery === "delivery" ? "משלוח" : "איסוף עצמי"));
    L.push("");
    L.push("📦 *פירוט ההזמנה*");
    o.lines.forEach(function (l, i) {
      L.push((i + 1) + ". " + l.p.name + (l.v.name ? " – " + l.v.name : ""));
      if (l.v.size) L.push("   " + l.v.size);
      L.push("   כמות: " + l.qty + (l.unit == null ? " · מחיר לפי הצעה" : " × " + money(l.unit) + " = " + money(l.total)));
    });
    L.push("");
    L.push("💰 *סה״כ משוער: " + money(o.sum.total) + "*" + (o.sum.partial ? " (+ פריטים במחיר לפי הצעה)" : ""));
    if (o.c.notes) { L.push(""); L.push("📝 הערות: " + o.c.notes); }
    L.push("");
    L.push("המחיר הסופי, זמינות המלאי ומועד האספקה יאושרו בוואטסאפ.");
    return L.join("\n");
  }

  function receiptHTML(o) {
    return '<div class="rc__head"><div><b>' + esc(S.name) + "</b><small>" + esc(S.address || "") + " · " + esc(S.phoneDisplay || "") + "</small></div>" +
      '<div class="rc__no"><small>מספר הזמנה</small><b dir="ltr">' + esc(o.id) + "</b><small>" + esc(o.date) + "</small></div></div>" +
      '<dl class="rc__cust">' +
        "<div><dt>שם</dt><dd>" + esc(o.c.name) + "</dd></div>" +
        '<div><dt>טלפון</dt><dd dir="ltr">' + esc(o.c.phone) + "</dd></div>" +
        (o.c.business ? "<div><dt>עסק</dt><dd>" + esc(o.c.business) + "</dd></div>" : "") +
        "<div><dt>יישוב</dt><dd>" + esc(o.c.city) + "</dd></div>" +
        (o.c.address ? "<div><dt>כתובת</dt><dd>" + esc(o.c.address) + "</dd></div>" : "") +
        "<div><dt>קבלה</dt><dd>" + (o.c.delivery === "delivery" ? "משלוח" : "איסוף עצמי") + "</dd></div>" +
      "</dl>" +
      '<table class="rc__table"><thead><tr><th>מוצר</th><th>כמות</th><th>מחיר</th><th>סה״כ</th></tr></thead><tbody>' +
      o.lines.map(function (l) {
        return "<tr><td><b>" + esc(l.p.name + (l.v.name ? " – " + l.v.name : "")) + "</b><small>" + esc(l.v.size || "") + "</small></td>" +
          "<td>" + l.qty + "</td><td>" + (l.unit == null ? "—" : money(l.unit)) + "</td><td>" + (l.total == null ? "—" : money(l.total)) + "</td></tr>";
      }).join("") + "</tbody>" +
      '<tfoot><tr><td colspan="3">סה״כ משוער' + (o.sum.partial ? " (+ פריטים לפי הצעה)" : "") + "</td><td>" + money(o.sum.total) + "</td></tr></tfoot></table>" +
      (o.c.notes ? '<p class="rc__notes"><b>הערות:</b> ' + esc(o.c.notes) + "</p>" : "") +
      '<p class="rc__fine">המחיר הסופי, זמינות המלאי ומועד האספקה יאושרו בוואטסאפ.</p>';
  }

  var lastOrder = null;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#cartErr"); err.textContent = "";
    if (!form.checkValidity()) {
      err.textContent = "נא למלא שם, טלפון תקין ויישוב" + (form.delivery.value === "delivery" ? " וכתובת למשלוח" : "") + ".";
      var bad = form.querySelector(":invalid"); if (bad) bad.focus();
      return;
    }
    var ls = lines(); if (!ls.length) { show("list"); return; }
    var c = {
      name: form.name.value.trim(), phone: form.phone.value.trim(), business: form.business.value.trim(),
      city: form.city.value.trim(), address: form.address.value.trim(), location: form.location.value.trim(),
      delivery: form.delivery.value, notes: form.notes.value.trim()
    };
    write(CUST, { name: c.name, phone: c.phone, business: c.business, city: c.city, address: c.address });
    var o = { id: orderId(), date: dtf.format(new Date()), c: c, lines: ls, sum: sum(ls) };
    o.text = receiptText(o);
    lastOrder = o;

    // 1) WhatsApp (must open synchronously inside the click to avoid popup blockers)
    var url = "https://wa.me/" + ORDER_WA + "?text=" + encodeURIComponent(o.text);
    var w = window.open(url, "_blank", "noopener");
    $("#cartWa").href = url;

    // 2) keep a copy in the admin dashboard (best effort)
    if (C && C.start) {
      C.start({ name: c.name, phone: c.phone, business: c.business, category: "הזמנה מהסל", message: o.text }).catch(function () {});
    }

    // 3) receipt on screen + clear cart
    $("#receipt").innerHTML = receiptHTML(o);
    $("#cartDoneMsg").textContent = w ? "וואטסאפ נפתח עם ההזמנה המלאה – רק ללחוץ \"שליחה\"." : "לחצו על הכפתור כדי לשלוח את ההזמנה בוואטסאפ.";
    cart = []; save();
    show("done");
  });

  $("#cartPrint").addEventListener("click", function () { window.print(); });
  $("#cartCopy").addEventListener("click", function () {
    if (!lastOrder) return;
    var t = lastOrder.text, b = this;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
      b.textContent = "הועתק ✓";
    }).catch(function () { window.prompt("העתיקו את ההזמנה:", t); });
  });
  $("#cartNew").addEventListener("click", function () { show("list"); close(); });

  /* ---------- tiny toast ---------- */
  var tt;
  function toast(msg) {
    var el = $("#cartToast"); el.textContent = msg; el.hidden = false;
    clearTimeout(tt); tt = setTimeout(function () { el.hidden = true; }, 2200);
  }

  render();
})();
