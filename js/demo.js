/* =========================================================
   הכל להכל – Demo mode (preview link only, e.g. GitHub Pages)
   Emulates api/visitor.php + api/admin.php inside the browser with localStorage,
   so the chat, "הפניות שלי" and the admin dashboard can be tried without PHP.
   Active only when SITE.demo is true (see js/config.js). On the real server it does nothing.
   ========================================================= */
(function () {
  "use strict";
  var S = window.SITE;
  if (!S || !S.demo) return;

  var KEY = "hl_demo_db", PASS = "demo1234";
  var now = function () { return Math.floor(Date.now() / 1000); };

  function hex(n) {
    var a = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function autoReply(db, name) {
    return (db.settings.auto_reply)
      .split("{name}").join(name).split("{site}").join(S.name)
      .split("{whatsapp}").join("https://wa.me/" + S.whatsapp);
  }
  var DEFAULT_AR = "שלום {name}, ותודה על הפנייה! 👋\nכאן צוות {site} – קיבלנו את ההודעה שלך ונחזור אליך בהקדם האפשרי.\nאם נוח לך, אפשר גם לדבר איתנו ישירות בוואטסאפ:\n{whatsapp}";

  function seed() {
    var t = now(), db = { seq: { c: 0, m: 0 }, convs: [], msgs: [], settings: { auto_reply: DEFAULT_AR }, session: false };
    function conv(name, phone, business, category, ago, lines, status) {
      var c = { id: ++db.seq.c, token: hex(16), name: name, phone: phone, business: business, category: category,
        status: status || "open", last_msg: "", unread_admin: 0, unread_visitor: 0, created_at: t - ago, updated_at: t - ago };
      db.convs.push(c);
      lines.forEach(function (l, i) {
        var m = { id: ++db.seq.m, conv_id: c.id, sender: l[0], body: l[0] === "auto" ? autoReply(db, name) : l[1], created_at: t - ago + i * 60 };
        db.msgs.push(m);
        if (m.sender !== "auto") { c.last_msg = m.body; c.updated_at = m.created_at; }
        if (m.sender === "visitor") c.unread_admin++;
        if (m.sender === "admin") c.unread_admin = 0;
      });
    }
    conv("אחמד כבהא", "052-3456789", "מסעדת הגליל", "למסעדות", 3600 * 2,
      [["visitor", "שלום, אני פותח מסעדה חדשה וצריך שולחנות נירוסטה וציוד מטבח. אפשר הצעת מחיר?"], ["auto"]]);
    conv("יוסי לוי", "054-9876543", "מינימרקט השכונה", "מדפים לעסק", 86400 + 3600 * 5,
      [["visitor", "כמה עולה מדף מתכת לסופר באורך 2 מטר?"], ["auto"], ["admin", "שלום יוסי! מדף 2 מטר מתחיל מ-450 ₪. מתי נוח לך להגיע לראות?"], ["visitor", "מעולה, אגיע ביום חמישי"]]);
    conv("סמיר מחאמיד", "050-1112233", "", "חד פעמי קרטון ונייר", 86400 * 3,
      [["visitor", "יש לכם קופסאות פיצה בגודל 33?"], ["auto"], ["admin", "כן, יש במלאי. אפשר לאסוף מהחנות 🙂"]], "closed");
    db.convs.forEach(function (c) { if (c.status === "closed") c.unread_admin = 0; });
    return db;
  }
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.convs) return d; } catch (e) {}
    var d2 = seed(); save(d2); return d2;
  }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  function find(db, pred) { for (var i = 0; i < db.convs.length; i++) if (pred(db.convs[i])) return db.convs[i]; return null; }
  function msgsOf(db, id, since) {
    return db.msgs.filter(function (m) { return m.conv_id === id && m.id > (since || 0); })
      .map(function (m) { return { id: m.id, sender: m.sender, body: m.body, created_at: m.created_at }; });
  }
  function add(db, c, sender, body) {
    var m = { id: ++db.seq.m, conv_id: c.id, sender: sender, body: body, created_at: now() };
    db.msgs.push(m);
    if (sender !== "auto") {
      c.last_msg = body.replace(/\s+/g, " ").slice(0, 120); c.updated_at = m.created_at;
      if (sender === "visitor") { c.unread_admin++; if (c.status === "closed") c.status = "open"; } else c.unread_visitor++;
    }
    return { id: m.id, sender: m.sender, body: m.body, created_at: m.created_at };
  }
  function pub(c) {
    return { id: c.id, name: c.name, category: c.category, status: c.status, last_msg: c.last_msg,
      unread: c.unread_visitor, created_at: c.created_at, updated_at: c.updated_at };
  }
  function adm(c) { var o = {}; for (var k in c) if (k !== "token") o[k] = c[k]; return o; }
  function E(code, status) { var e = { ok: false, error: code }; e.__status = status || 400; return e; }
  function req(d, k) { var v = (d[k] == null ? "" : String(d[k])).trim(); if (!v) throw E("missing_" + k); return v; }

  function visitor(d) {
    var db = load(), c;
    switch (d.action) {
      case "start":
        var name = req(d, "name"), phone = req(d, "phone"), message = req(d, "message");
        if (!/^[0-9+\-\s]{9,20}$/.test(phone)) throw E("bad_phone");
        c = { id: ++db.seq.c, token: hex(16), name: name, phone: phone, business: d.business || "", category: d.category || "",
          status: "open", last_msg: "", unread_admin: 0, unread_visitor: 0, created_at: now(), updated_at: now() };
        db.convs.push(c);
        var m1 = add(db, c, "visitor", message), m2 = add(db, c, "auto", autoReply(db, name));
        save(db);
        return { ok: true, conv: { id: c.id, token: c.token }, messages: [m1, m2] };
      case "send":
        c = find(db, function (x) { return x.token === d.token; }); if (!c) throw E("not_found", 404);
        var m = add(db, c, "visitor", req(d, "message")); save(db);
        return { ok: true, message: m };
      case "thread":
        c = find(db, function (x) { return x.token === d.token; }); if (!c) throw E("not_found", 404);
        var out = { ok: true, conv: pub(c), messages: msgsOf(db, c.id, +d.since || 0) };
        c.unread_visitor = 0; save(db);
        return out;
      case "list":
        var toks = Array.isArray(d.tokens) ? d.tokens : [];
        return { ok: true, conversations: db.convs.filter(function (x) { return toks.indexOf(x.token) >= 0; })
          .sort(function (a, b) { return b.updated_at - a.updated_at; })
          .map(function (x) { var p = pub(x); p.token = x.token; return p; }) };
    }
    throw E("unknown_action");
  }

  function admin(d) {
    var db = load(), c;
    var authed = function () { if (!db.session) throw E("unauthorized", 401); };
    var byId = function () { c = find(db, function (x) { return x.id === +d.id; }); if (!c) throw E("not_found", 404); return c; };
    switch (d.action) {
      case "state": return { ok: true, needs_setup: false, logged_in: !!db.session, csrf: db.session ? "demo" : null, demo: true };
      case "login":
        if (d.password !== PASS) throw E("bad_password", 401);
        db.session = true; save(db); return { ok: true, csrf: "demo" };
      case "logout": db.session = false; save(db); return { ok: true };
      case "stats":
        authed();
        var today = new Date(); today.setHours(0, 0, 0, 0); var t0 = today.getTime() / 1000;
        var cats = {}; db.convs.forEach(function (x) { var k = x.category || "ללא"; cats[k] = (cats[k] || 0) + 1; });
        var days = [];
        for (var i = 6; i >= 0; i--) {
          var s = t0 - i * 86400, e = s + 86400, dt = new Date(s * 1000);
          var iso = dt.getFullYear() + "-" + ("0" + (dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2);
          days.push({ day: iso, n: db.convs.filter(function (x) { return x.created_at >= s && x.created_at < e; }).length });
        }
        return { ok: true, total: db.convs.length,
          open: db.convs.filter(function (x) { return x.status === "open"; }).length,
          unread: db.convs.filter(function (x) { return x.unread_admin > 0; }).length,
          today: db.convs.filter(function (x) { return x.created_at >= t0; }).length,
          by_category: Object.keys(cats).map(function (k) { return { category: k, n: cats[k] }; }).sort(function (a, b) { return b.n - a.n; }),
          days: days };
      case "conversations":
        authed();
        var q = (d.q || "").toLowerCase();
        return { ok: true, conversations: db.convs.filter(function (x) {
          if (d.status === "open" || d.status === "closed") { if (x.status !== d.status) return false; }
          if (d.status === "unread" && !x.unread_admin) return false;
          return !q || [x.name, x.phone, x.business, x.last_msg].join(" ").toLowerCase().indexOf(q) >= 0;
        }).sort(function (a, b) { return b.updated_at - a.updated_at; }).map(adm) };
      case "thread":
        authed(); byId();
        var r = { ok: true, conv: null, messages: msgsOf(db, c.id, +d.since || 0) };
        c.unread_admin = 0; save(db); r.conv = adm(c); return r;
      case "reply": authed(); byId(); var mm = add(db, c, "admin", req(d, "message")); save(db); return { ok: true, message: mm };
      case "status": authed(); byId(); c.status = d.status === "closed" ? "closed" : "open"; save(db); return { ok: true };
      case "delete":
        authed(); byId();
        db.convs = db.convs.filter(function (x) { return x !== c; });
        db.msgs = db.msgs.filter(function (m) { return m.conv_id !== c.id; }); save(db); return { ok: true };
      case "settings": authed(); return { ok: true, auto_reply: db.settings.auto_reply, whatsapp: S.whatsapp };
      case "save_settings": authed(); db.settings.auto_reply = req(d, "auto_reply"); save(db); return { ok: true };
      case "password": authed(); throw E("demo_readonly", 400);
    }
    throw E("unknown_action");
  }

  var realFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    var u = String(url);
    var which = /api\/visitor\.php/.test(u) ? visitor : /api\/admin\.php/.test(u) ? admin : null;
    if (!which) return realFetch(url, opts);
    var body = {};
    try { body = JSON.parse((opts && opts.body) || "{}"); } catch (e) {}
    var res, status = 200;
    try { res = which(body); } catch (e) { res = e.ok === false ? e : { ok: false, error: "server" }; status = res.__status || 500; delete res.__status; }
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(new Response(JSON.stringify(res), { status: status, headers: { "Content-Type": "application/json" } }));
      }, 150);
    });
  };

  /* small "preview" ribbon */
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("div");
    b.className = "demo-ribbon";
    b.innerHTML = "תצוגה מקדימה · <a href=\"" + (location.pathname.indexOf("/admin/") >= 0 ? "../index.html" : "admin/") + "\">" +
      (location.pathname.indexOf("/admin/") >= 0 ? "לאתר" : "ללוח הניהול (סיסמה: " + PASS + ")") + "</a>";
    document.body.appendChild(b);
  });
})();
