# كيفية تغيير منفذ الاتصال بالسيرفر
# How to Change the Backend API Port

## المشكلة / Problem
النظام يحتاج للاتصال بالسيرفر الخلفي (Backend)، ولكن المنفذ (Port) قد يختلف حسب الإعدادات.

The system needs to connect to the backend server, but the port may vary depending on your configuration.

---

## الحل السريع / Quick Solution

### الخطوة 1: إنشاء ملف `.env.local`
في مجلد `frontend`، قم بإنشاء ملف جديد باسم `.env.local`

In the `frontend` folder, create a new file named `.env.local`

### الخطوة 2: إضافة عنوان API
أضف السطر التالي في الملف:

Add the following line to the file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT/api
```

### أمثلة / Examples:

**إذا كان السيرفر يعمل على المنفذ 3001:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**إذا كان السيرفر يعمل على المنفذ 5000:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**إذا كان السيرفر يعمل على المنفذ 8080:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

**للاستخدام في الإنتاج (Production):**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

---

## الخطوة 3: إعادة تشغيل التطبيق

**مهم جداً:** بعد إنشاء أو تعديل ملف `.env.local`، يجب إعادة تشغيل تطبيق Next.js:

**Very Important:** After creating or modifying `.env.local`, you must restart the Next.js application:

```bash
# أوقف السيرفر (Ctrl+C) ثم شغله مرة أخرى
# Stop the server (Ctrl+C) then start it again
cd frontend
yarn dev
```

---

## كيف تعرف المنفذ الصحيح؟
## How to Know the Correct Port?

عند تشغيل السيرفر الخلفي، سيظهر لك المنفذ في الرسالة:

When you start the backend server, it will show you the port in the message:

```
🚀 Server running on port 5000
🟢 http://localhost:5000/api
```

في هذا المثال، المنفذ هو **5000**

In this example, the port is **5000**

---

## التحقق من الإعدادات
## Verify Configuration

1. **تحقق من تشغيل السيرفر الخلفي:**
   ```bash
   cd backend
   node server.js
   ```

2. **تحقق من المنفذ في رسالة السيرفر**

3. **أنشئ/عدّل `.env.local` في مجلد frontend**

4. **أعد تشغيل frontend:**
   ```bash
   cd frontend
   yarn dev
   ```

5. **افتح المتصفح وتحقق من Console (F12)**
   - يجب أن ترى رسالة: `🔍 Attempting to fetch admin data from: http://localhost:YOUR_PORT/api/...`

---

## ملاحظات مهمة / Important Notes

✅ **ملف `.env.local` لن يتم رفعه إلى Git** (محمي تلقائياً)  
✅ **يمكنك استخدام أي منفذ تريده** (3000, 3001, 5000, 8080, إلخ)  
✅ **القيمة الافتراضية هي `http://localhost:5000/api`** إذا لم تحدد شيئاً  
✅ **يجب إعادة تشغيل Next.js** بعد تغيير `.env.local`  

---

## استكشاف الأخطاء / Troubleshooting

### المشكلة: "Failed to fetch"
**الحل:**
1. تأكد من تشغيل السيرفر الخلفي
2. تأكد من المنفذ الصحيح في `.env.local`
3. أعد تشغيل frontend

### المشكلة: التغييرات لا تعمل
**الحل:**
- أعد تشغيل Next.js (Ctrl+C ثم `yarn dev`)
- امسح الكاش: `yarn dev --clean`

### المشكلة: لا أعرف أي منفذ يستخدم السيرفر
**الحل:**
- انظر إلى رسالة السيرفر عند التشغيل
- أو افتح `backend/.env` وابحث عن `PORT=`
