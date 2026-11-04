# CLAUDE.md – مشروع "הכל להכל"

موقع لمحل **הכל להכל** في **ברטעה** (الزبون: جمال محاميد) – من تنفيذ وكالة New Media.
اللغة الموجّهة للزوار: **عبري (RTL)**. التواصل مع صاحب المشروع (New Media): **عربي**.

راجع `docs/client-requirements.md` للمتطلبات الأصلية، و`README.md` لخطوات الرفع.

## البنية
| المسار | الوصف |
|---|---|
| `index.html` + `js/main.js` | الموقع: الأصناف (نافذة فيها الأصناف الفرعية)، نموذج تواصل، شات، زر واتساب عائم |
| `my.html` + `js/my.js` + `css/my.css` | داشبورد الزائر "הפניות שלי" |
| `admin/` | داشبورد المدير: إحصائيات، صندوق الطلبات، الرد، טופלה/حذف، ردود سريعة، إعدادات الرد التلقائي وكلمة السر |
| `js/config.js` | **إعدادات الواجهة**: واتساب، هاتف، إيميل، ساعات العمل، الأصناف والأصناف الفرعية |
| `js/chat.js` | مكتبة المراسلة المشتركة (API، تخزين tokens في localStorage، عرض الرسائل) |
| `api/config.php` | **إعدادات السيرفر**: رقم الواتساب للرد التلقائي، `setup_key`، نص الرد التلقائي الافتراضي، إيميل الإشعارات |
| `api/lib.php` | قاعدة البيانات (SQLite، تُنشأ تلقائياً)، rate-limit، جلسة المدير + CSRF |
| `api/visitor.php` | `start` / `send` / `thread` / `list` |
| `api/admin.php` | `state` / `setup` / `login` / `logout` / `stats` / `conversations` / `thread` / `reply` / `status` / `delete` / `settings` / `save_settings` / `password` |
| `data/` | ملف `hakol.sqlite` (محمي بـ `.htaccess`، مستثنى من git) |
| `tests/check.sh` | فحص صياغة PHP/JS |
| `tests/run-e2e.sh` | اختبار شامل بـ Playwright + سيرفر PHP محلي |

## قرارات تقنية
- موقع ثابت + PHP 8 + SQLite → يشتغل على Hostinger بدون MySQL وبدون build.
- الزائر يتعرّف بـ token عشوائي (32 hex) مخزّن في localStorage؛ في القاعدة مخزّن كـ sha256.
  ⇐ "הפניות שלי" مربوطة بالجهاز/المتصفح (مذكور للزبون).
- الرسائل: `sender` = `visitor` | `admin` | `auto`. الرسالة الآلية لا تغيّر `last_msg` ولا عدّاد غير المقروء.
- الرد التلقائي يدعم `{name}` `{site}` `{whatsapp}`؛ قابل للتعديل من لوحة المدير (يُخزّن في جدول `settings`).
- أول دخول للمدير يتطلب `setup_key` من `api/config.php` (ويُرفض إذا بقي على القيمة الافتراضية).
- إذا فشل الـ API، نموذج التواصل يعرض رابط واتساب بديل.
- RTL: الرسائل "الخاصة بي" على اليمين (`align-self: flex-start`).
- **وضع العرض (Demo):** `js/demo.js` يحاكي `api/visitor.php` و`api/admin.php` داخل المتصفح (localStorage + 3 طلبات تجريبية).
  يتفعّل تلقائياً على `*.github.io` أو مع `?demo=1` (`SITE.demo` في `js/config.js`). سيرفر حقيقي = لا يتفعّل.
  كلمة سر لوحة المدير بالعرض: `demo1234`. أي action جديد بالـ API لازم ينضاف كمان بـ `demo.js`.
- رابط المعاينة للزبون: https://mahmoud20820055-crypto.github.io/jamal/ (GitHub Pages من `main` / root).
- **النشر على سيرفر حقيقي:** `.github/workflows/deploy.yml` يرفع عبر FTP عند كل push على `main` (يتخطى بهدوء إذا الـ Secrets مش موجودة).
  Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `SETUP_KEY` (+ `FTP_DIR` اختياري، افتراضي `/htdocs/`).
  الـ workflow يحقن `SETUP_KEY` بـ `api/config.php` وقت البناء فقط – **الريبو عام، لا تكتب المفتاح الحقيقي فيه.**
  دليل خطوة بخطوة: `docs/deploy-free.md`. فحص السيرفر: `/api/health.php`.
- **السيرفر الحالي (معاينة مجانية):** InfinityFree، حساب `if0_43354886`، الدومين **http://hakol-lehakol.kesug.com** (المجلد `/htdocs/`).
  الـ Secrets مضافة؛ أي push على `main` بينرفع تلقائياً.

## تشغيل محلي
```bash
php -S 127.0.0.1:8099        # من جذر الريبو، ثم افتح http://127.0.0.1:8099/  و /admin/
tests/run-e2e.sh /tmp/shots  # اختبار كامل + صور
```

## دليل التعديل السريع (لـ Claude)
**بعد أي تعديل:** شغّل `tests/check.sh`. ولو التعديل يمس الشات أو اللوحة أو الـ API شغّل `tests/run-e2e.sh /tmp/shots` وافحص الصور.
(يحتاج php مع pdo_sqlite + node + playwright. إذا playwright ناقص: `npm i -g playwright && npx playwright install chromium`.)

| المطلوب | وين |
|---|---|
| تغيير رقم الواتساب | `js/config.js` (`whatsapp`, `phoneDisplay`, `phoneTel`) **و** `api/config.php` (`whatsapp`) – لازم يتطابقوا |
| الإيميل / العنوان / ساعات العمل / الشعار النصي | `js/config.js` (`email`, `address`, `hours`, `tagline`) |
| إضافة/تعديل صنف أو أصناف فرعية | `js/config.js` ← `categories` (`id` فريد، `title`, `icon`, `desc`, `sub[]`). بينعرض تلقائياً بالشبكة والفوتر وقائمة النموذج والهيرو (أول 9) |
| أيقونة جديدة لصنف | `js/main.js` ← كائن `ICONS` (مسارات SVG بـ stroke، viewBox 24) |
| نص الرد التلقائي الافتراضي | `api/config.php` ← `auto_reply` (بعد التشغيل يُعدّل من لوحة المدير ← הגדרות، والقيمة المحفوظة بالقاعدة بتتغلب) |
| الردود السريعة للمدير | `admin/admin.js` ← مصفوفة `QUICK` |
| نصوص الأقسام (הירו، למה אנחנו، אודות) | `index.html` مباشرة |
| الألوان والخطوط | `css/style.css` ← متغيرات `:root` (`--navy`, `--accent`…). الخط Heebo |
| إشعار إيميل للمدير | `api/config.php` ← `notify_email` |
| حقل جديد بالنموذج | `index.html` + `js/main.js` (كائن `d`) + `api/visitor.php` (`start`) + `api/lib.php` (عمود جديد؛ لقاعدة قائمة أضف `ALTER TABLE` آمن) |

**قواعد:**
- كل نص للزوار بالعبري الصحيح، `dir="rtl"`. استعمل خصائص منطقية (`inset-inline`, `margin-inline-start`).
- أي نص من المستخدم يُعرض عبر `esc()` أو `textContent` فقط – ممنوع `innerHTML` مع بيانات خام.
- كل طلب API هو POST JSON مع `action`؛ عمليات المدير المغيّرة تتطلب هيدر `X-CSRF` (موجود في `api()` بـ admin.js).
- لا تغيّر بنية الجداول بشكل يكسر قاعدة موجودة على السيرفر (إضافات فقط).
- لا ترفع `data/*.sqlite` ولا كلمات سر.
- لازم يضل يشتغل على الموبايل (390px) بدون سكرول أفقي.
- الفحص السريع: `tests/check.sh`.

## الحالة (2026-11-04)
✅ تم: الموقع، الأصناف، الشات، "הפניות שלי"، الرد التلقائي، لوحة المدير، اختبار e2e ناجح (ديسكتوب + موبايل، بدون أخطاء).

⏳ ناقص من الزبون:
- رقم الواتساب/الهاتف/الإيميل الحقيقي (حالياً `972500000000` / `050-000-0000` / `info@example.com`) – في `js/config.js` **و** `api/config.php`.
- تأكيد الأصناف الفرعية (الحالية **مقترحة** من عندنا).
- معنى/كتابة صنف "לפכפכינה" (الوصف والأصناف الفرعية له تخمين).
- ساعات العمل الحقيقية، شعار، صور منتجات.

⏳ قبل الرفع: تغيير `setup_key`، رفع كل المجلد لـ `public_html`، فتح `/admin/` لإنشاء كلمة السر، التأكد إن `/data/hakol.sqlite` يرجع 403.

💡 أفكار مستقبلية مطروحة: دخول للزوار برمز SMS/واتساب ليشوفوا طلباتهم من أي جهاز؛ صفحات منتجات مع صور.

## ملاحظات
- لا تضع كلمات سر أو أرقام حساسة أو ملفات `.sqlite` في الريبو.
- النسخة الأصلية من المشروع موجودة أيضاً في ريبو `mahmoud20820055-crypto/newmediaa` تحت `clients/hakol-lehakol/`.
