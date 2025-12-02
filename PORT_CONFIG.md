# 🔧 تكوين المنفذ السريع

النظام الآن **يعمل على أي منفذ**!

## الخطوات:

1. **أنشئ ملف** `frontend/.env.local`
2. **أضف:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT/api
   ```
3. **أعد تشغيل:** `yarn dev`

## أمثلة:
```env
# للمنفذ 3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# للمنفذ 5000 (الافتراضي)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# للمنفذ 8080
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## 📚 للمزيد:
- [دليل سريع](frontend/PORT_SETUP_AR.md)
- [دليل شامل](frontend/PORT_CONFIGURATION.md)
- [ملف نموذجي](frontend/.env.example)

**ملاحظة:** القيمة الافتراضية هي `http://localhost:5000/api`
