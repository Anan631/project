# بيانات هندسية - Engineering Data

تم إنشاء نماذج قاعدة البيانات وتخزين البيانات الهندسية التالية باللغة العربية:

## النماذج المُنشأة

1. **SoilType** - أنواع التربة
2. **LiveLoad** - الحمولات الحية
3. **DeadLoad** - الحمولات الميتة
4. **IronBar** - قضبان الحديد
5. **RoofType** - أنواع الأسقف

## إدخال البيانات

لتشغيل seeding script وإدخال البيانات في قاعدة البيانات:

```bash
cd backend
npm run seed:engineering
```

أو مباشرة:

```bash
cd backend
node scripts/seed-engineering-data.js
```

## API Endpoints

جميع البيانات متاحة عبر API endpoints التالية:

### جميع البيانات
- `GET /api/engineering-data/all` - جلب جميع البيانات في مرة واحدة

### أنواع التربة
- `GET /api/engineering-data/soil-types` - جلب جميع أنواع التربة

### الحمولات الحية
- `GET /api/engineering-data/live-loads` - جلب جميع الحمولات الحية

### الحمولات الميتة
- `GET /api/engineering-data/dead-loads` - جلب جميع الحمولات الميتة
- `GET /api/engineering-data/dead-loads/:buildingType` - جلب الحمولات الميتة حسب نوع المبنى

### قضبان الحديد
- `GET /api/engineering-data/iron-bars` - جلب جميع قضبان الحديد
- `GET /api/engineering-data/iron-bars/:diameter` - جلب قضيب حديد بقطر محدد (بالـ mm)

### أنواع الأسقف
- `GET /api/engineering-data/roof-types` - جلب جميع أنواع الأسقف

## أمثلة الاستخدام

```javascript
// جلب جميع البيانات
const response = await fetch('http://localhost:5000/api/engineering-data/all');
const data = await response.json();

// جلب أنواع التربة فقط
const soilTypes = await fetch('http://localhost:5000/api/engineering-data/soil-types');
const soilData = await soilTypes.json();

// جلب قضيب حديد بقطر 12mm
const ironBar = await fetch('http://localhost:5000/api/engineering-data/iron-bars/12');
const barData = await ironBar.json();

// جلب الحمولات الميتة للمباني السكنية
const deadLoads = await fetch('http://localhost:5000/api/engineering-data/dead-loads/المباني السكنية');
const loadsData = await deadLoads.json();
```

## البيانات المُخزنة

### أنواع التربة (7 أنواع)
- تربة رملية: 0.10 - 0.30 MPa
- تربة طينية: 0.05 - 0.15 MPa
- تربة طينية رخوة: 0.025 - 0.05 MPa
- تربة طميية أو طينية رخوة: 0.025 - 0.10 MPa
- تربة طينية مخلوطة بالرمل: 0.075 - 0.20 MPa
- تربة حصوية: 0.20 - 0.40 MPa
- تربة صخرية: 35.00 MPa

### الحمولات الحية (9 أنواع)
- المباني السكنية: 1.9 - 4.8 kN/m²
- المكاتب: 2.4 - 4.8 kN/m²
- المباني التجارية: 4.8 - 7.2 kN/m²
- المستودعات: 4.8 - 7.2 kN/m²
- المسارح والأماكن العامة: 4.8 kN/m²
- المدارس: 2.4 - 4.8 kN/m²
- الملاعب الرياضية: 4.8 - 7.2 kN/m²
- المستشفيات: 4.8 - 6.0 kN/m²
- مواقف السيارات: 4.8 - 6.0 kN/m²

### الحمولات الميتة (17 سجل)
للمباني السكنية، التجارية، الصناعية، الرياضية، والمستودعات

### قضبان الحديد (10 أحجام)
من 6mm إلى 25mm مع مساحة المقطع

### أنواع الأسقف (3 أنواع)
- سقف بلاطة صلبة
- سقف بلاطة مضلعة باتجاه واحد
- سقف هوردي


