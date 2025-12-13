# حل مشكلة القوائم الفارغة - Empty Lists Troubleshooting

## المشكلة
عند فتح صفحة حساب كميات الباطون، تظهر قوائم نوع التربة ونوع المبنى فارغة.

## الحل

### 1. التأكد من تشغيل Backend Server
```bash
cd backend
npm start
# أو
npm run dev
```

يجب أن ترى رسالة: `🚀 Server running on port 5000`

### 2. تشغيل Seeding Script لإدخال البيانات
```bash
cd backend
npm run seed:engineering
```

يجب أن ترى رسائل:
```
✅ Inserted 7 soil types
✅ Inserted 9 live loads
✅ Inserted 17 dead loads
✅ Inserted 10 iron bars
✅ Inserted 3 roof types
🎉 All data seeded successfully!
```

### 3. التحقق من API Endpoint
افتح المتصفح واذهب إلى:
```
http://localhost:5000/api/engineering-data/all
```

يجب أن ترى JSON response يحتوي على البيانات.

### 4. التحقق من متغير البيئة
في مجلد `frontend`، تأكد من وجود ملف `.env.local` مع:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. إعادة تشغيل Frontend
```bash
cd frontend
# أوقف السيرفر (Ctrl+C)
yarn dev
```

### 6. فتح Console في المتصفح
افتح Developer Tools (F12) وتحقق من Console. يجب أن ترى:
- `Fetching from: http://localhost:5000/api/engineering-data/all`
- `Engineering data response: {...}`
- `Soil types: [...]`
- `Building types: [...]`

إذا رأيت أخطاء، راجعها وأخبرني بها.

## المشاكل الشائعة

### المشكلة: "Cannot connect to backend"
**الحل**: تأكد من أن Backend Server يعمل على المنفذ الصحيح.

### المشكلة: "No data in database"
**الحل**: قم بتشغيل `npm run seed:engineering` في مجلد backend.

### المشكلة: "CORS error"
**الحل**: تأكد من أن Backend Server يحتوي على إعدادات CORS الصحيحة في `server.js`.

