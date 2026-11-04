# رفع الموقع على استضافة + دومين مجاني (مؤقت للمعاينة)

الهدف: رابط حقيقي يشتغل فيه كل شي (الشات، الرد التلقائي، لوحة المدير) وتنحفظ الرسائل على السيرفر.
بعد ما الزبون يوافق، بنشتري دومين واستضافة رسمية وبنغيّر 4 قيم بس (آخر الملف).

## 1) فتح حساب مجاني على InfinityFree
1. ادخل https://www.infinityfree.com وسجّل حساب (إيميل + كلمة سر).
2. **Create Account** ← اختر **Subdomain** واكتب اسم، مثلاً: `hakol-lehakol` واختر النطاق `infinityfreeapp.com`
   (أو أي نطاق مجاني بيعرضه). الرابط رح يكون مثلاً: `http://hakol-lehakol.infinityfreeapp.com`
3. بعد ما ينعمل الحساب، افتح **Control Panel / Account Details** وانسخ:
   - **FTP Hostname** (عادة `ftpupload.net`)
   - **FTP Username** (شكله `if0_12345678`)
   - **FTP Password** (زر Show)

> الدومين المجاني أحياناً بياخد من دقائق لعدة ساعات ليشتغل أول مرة.

## 2) إضافة البيانات لـ GitHub (مرة وحدة)
افتح: https://github.com/mahmoud20820055-crypto/jamal/settings/secrets/actions ← **New repository secret** وأضف:

| Name | Value |
|---|---|
| `FTP_SERVER` | الـ FTP Hostname |
| `FTP_USERNAME` | الـ FTP Username |
| `FTP_PASSWORD` | الـ FTP Password |
| `SETUP_KEY` | نص سري طويل من اختيارك (12 حرف على الأقل) – بتحتاجه مرة وحدة لإنشاء كلمة سر المدير |

> هاي القيم مخفية ومش بتنكتب بالريبو (الريبو عام).

## 3) الرفع
- افتح https://github.com/mahmoud20820055-crypto/jamal/actions ← **Deploy (FTP)** ← **Run workflow**.
- بعدها أي تعديل بينرفع على `main` بينرفع للسيرفر تلقائياً.

## 4) التأكد والتشغيل
1. افتح `http://<الدومين>/api/health.php` ← لازم يطلع `"ok": true`.
   - `pdo_sqlite: false` ← الاستضافة ما بتدعم SQLite (خبّر Claude).
   - `setup_key_changed: false` ← الـ Secret `SETUP_KEY` مش مضاف.
2. افتح `http://<الدومين>/admin/` ← أدخل الـ `SETUP_KEY` ← اختر كلمة سر المدير.
3. جرّب من الموبايل: ابعت رسالة من الشات، وشوفها بلوحة المدير ورد عليها.
4. تأكد إن `http://<الدومين>/data/hakol.sqlite` بيعطي **403** (ممنوع).
5. (اختياري) من لوحة InfinityFree فعّل **Free SSL** عشان يصير الرابط `https`.

## خطة بديلة (بدون GitHub Actions)
من لوحة InfinityFree ← **File Manager** ← مجلد `htdocs` ← ارفع: `index.html`, `my.html`, `admin/`, `api/`, `css/`, `js/`, `data/`.
بعدها عدّل `api/config.php` من الـ File Manager وغيّر `setup_key`.

## لما نشتري الرسمي (مثلاً Hostinger + دومين)
غيّر قيم الـ Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`، وأضف `FTP_DIR` = `/public_html/` ← Run workflow.
الرسائل اللي على السيرفر المجاني ما بتنتقل لحالها (ملف `data/hakol.sqlite` – بينقل يدوياً إذا لزم).

## ملاحظات عن الاستضافة المجانية
- مناسبة للمعاينة فقط: أبطأ، وممكن تعطّل الحساب إذا ما في زيارات لفترة طويلة.
- ما بتدعم إرسال إيميل (`notify_email`) بشكل موثوق.
