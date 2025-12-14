# خوارزمية حساب كميات الخرسانة لصبة النظاف والقواعد
## Algorithm for Calculating Concrete Quantities for Cleaning Pour and Foundations

### نظرة عامة (Overview)

هذا المشروع يتضمن تطبيق خوارزمية شاملة لحساب كميات الخرسانة المطلوبة لصبة النظاف والقواعد في المباني. تم تطوير الخوارزمية بناءً على معايير الهندسة المدنية القياسية.

---

## المراحل التسع للخوارزمية

### المرحلة الأولى: إدخال البيانات
**الملف**: `frontend/src/components/forms/ConcreteAlgorithmForm.tsx` (الخطوة 1)

**البيانات المدخلة**:
- طول صبة النظاف (م)
- عرض صبة النظاف (م)
- ارتفاع صبة النظاف (م)
- عدد الطوابق
- مساحة البلاطة (م²)

**الطلب من المستخدم**:
```
اطلب من المستخدم إدخال:
✓ طول صبة النظاف بالمتر
✓ عرض صبة النظاف بالمتر
✓ ارتفاع صبة النظاف بالمتر
✓ عدد الطوابق
✓ مساحة البلاطة بالمتر المربع
✓ نوع التربة
✓ نوع المبنى
✓ ارتفاع القاعدة بالمتر (0.40 - 0.80 م)
✓ عدد القواعد
```

---

### المرحلة الثانية: حساب صبة النظاف
**الملف**: `backend/services/concreteCalculationService.js`
**الدالة**: `calculateCleaningPourVolume()`

**الحساب**:
```
كمية خرسانة صبة النظاف = طول × عرض × ارتفاع
Volume = length × width × height (m³)
```

**مثال**:
```
طول = 20.5 م
عرض = 15.3 م
ارتفاع = 0.10 م
النتيجة = 20.5 × 15.3 × 0.10 = 31.365 م³
```

---

### المرحلة الثالثة: تحديد الأحمال
**الملف**: `backend/services/concreteCalculationService.js`
**الدالة**: `determineLioads()`

**مصادر البيانات**:
- `LiveLoad` - نموذج الحمل الحي في قاعدة البيانات
- `DeadLoad` - نموذج الحمل الميت في قاعدة البيانات

**المنطق**:
```javascript
// الحصول على الحمل الحي
const liveLoad = liveLoadData.commonValue || liveLoadData.minValue;

// الحصول على الحمل الميت
const deadLoad = sum(commonValue || minValue for each element);

// إجمالي الأحمال
const totalLoad = deadLoad + liveLoad (kN/m²)
```

**قيم نموذجية**:
- الحمل الحي (سكني): 1.5-2.0 kN/m²
- الحمل الحي (تجاري): 2.5-4.0 kN/m²
- الحمل الميت: 3.0-6.0 kN/m²

---

### المرحلة الرابعة: تحديد قدرة تحمل التربة
**الملف**: `backend/services/concreteCalculationService.js`
**الدالة**: `determineSoilBearingCapacity()`

**مصدر البيانات**: نموذج `SoilType`

**الحساب**:
```javascript
bearingCapacity = (bearingCapacityMin + bearingCapacityMax) / 2 (MPa)
```

**أنواع التربة النموذجية**:
| النوع | الحد الأدنى (MPa) | الحد الأقصى (MPa) | المتوسط (MPa) |
|------|-----------------|-----------------|-------------|
| رمل | 0.2 | 0.4 | 0.3 |
| طين | 0.1 | 0.3 | 0.2 |
| حصى | 0.3 | 0.6 | 0.45 |

---

### المرحلة الخامسة: حساب مساحة القاعدة
**الملف**: `backend/services/concreteCalculationService.js`
**الدالة**: `calculateFoundationArea()`

**الحسابات**:
```javascript
// 1. حساب الحمل الكلي على المبنى
totalBuildingLoad = slabArea × numberOfFloors × totalLoad (kN)

// 2. تحويل قدرة تحمل التربة
bearingCapacityInKPa = bearingCapacity × 1000 (kN/m²)
// ملاحظة: 1 MPa = 1000 kN/m²

// 3. حساب مساحة القاعدة
foundationArea = totalBuildingLoad ÷ bearingCapacityInKPa (m²)
```

**مثال**:
```
مساحة البلاطة = 300 م²
عدد الطوابق = 5
إجمالي الأحمال = 5.5 kN/m²
قدرة التربة = 0.25 MPa = 250 kN/m²

الحمل الكلي = 300 × 5 × 5.5 = 8,250 kN
مساحة القاعدة = 8,250 ÷ 250 = 33 م²
```

---

### المرحلة السادسة: تحديد أبعاد القاعدة
**الملف**: `backend/services/concreteCalculationService.js`
**الدالة**: `calculateFoundationDimensions()`

#### للقاعدة المستطيلة:
```javascript
width = √(foundationArea ÷ 1.2)
length = width × 1.2

// النسبة: length/width = 1.2
```

#### للقاعدة المربعة:
```javascript
length = √foundationArea
width = length
```

**مثال**:
```
مساحة القاعدة = 33 م²

المستطيلة:
width = √(33 ÷ 1.2) = √27.5 = 5.24 م
length = 5.24 × 1.2 = 6.29 م

المربعة:
length = width = √33 = 5.74 م
```

---

### المرحلة السابعة: تحديد نوع القواعد
**الملف**: `frontend/src/components/forms/ConcreteAlgorithmForm.tsx` (الخطوة 3)

**الخيارات**:
- ✓ متشابهة: جميع القواعد لها نفس الأبعاد والارتفاع
- ✗ مختلفة: القواعد لها ارتفاعات مختلفة

---

### المرحلة الثامنة: حساب كمية الخرسانة في القواعس
**الملف**: `backend/services/concreteCalculationService.js`
**الدالة**: `calculateFoundationsVolume()`

#### حالة 1: القواعس المتشابهة
```javascript
effectiveLength = cleaningPourLength - 0.20
effectiveWidth = cleaningPourWidth - 0.20

singleFoundationVolume = effectiveLength × effectiveWidth × foundationHeight

totalVolume = singleFoundationVolume × numberOfFoundations
```

#### حالة 2: القواعس المختلفة
```javascript
totalVolume = 0
forEach foundation in foundationDetails:
    volume = effectiveLength × effectiveWidth × foundationHeight
    totalVolume += volume
```

**مثال** (متشابهة):
```
طول صبة النظاف = 20.5 م
عرض صبة النظاف = 15.3 م
ارتفاع القاعدة = 0.50 م
عدد القواعس = 4

الطول الفعلي = 20.5 - 0.2 = 20.3 م
العرض الفعلي = 15.3 - 0.2 = 15.1 م
حجم القاعدة الواحدة = 20.3 × 15.1 × 0.50 = 153.23 م³
الحجم الكلي = 153.23 × 4 = 613.1 م³
```

---

### المرحلة التاسعة: تخزين النتائج
**الملف**: `backend/routes/calculations.js` - النقطة `/api/calculations/concrete-algorithm`

**البيانات المخزنة**:
```javascript
{
  inputs: {
    cleaningPourLength,
    cleaningPourWidth,
    cleaningPourHeight,
    numberOfFloors,
    slabArea,
    buildingType,
    foundationHeight,
    numberOfFoundations,
    foundationShape,
    areFoundationsSimilar
  },
  calculations: {
    cleaningPourVolume,
    loads: { deadLoad, liveLoad, totalLoad },
    soil: { name, bearingCapacity, bearingCapacityMin, bearingCapacityMax },
    building: { totalLoad, foundationArea, foundationDimensions },
    foundations: { totalVolume, breakdown }
  },
  summary: {
    cleaningPourVolume,
    foundationArea,
    foundationDimensions,
    foundationsVolume
  },
  calculatedAt: new Date()
}
```

---

## البنية التكنولوجية

### الخادم (Backend)

#### 1. نموذج الخدمة
**الملف**: `backend/services/concreteCalculationService.js`

الدوال الرئيسية:
```javascript
class ConcreteCalculationService {
  static validateInputData(data)              // التحقق من البيانات
  static calculateCleaningPourVolume(...)    // المرحلة 2
  static async determineLioads(...)          // المرحلة 3
  static async determineSoilBearingCapacity(...)  // المرحلة 4
  static calculateFoundationArea(...)        // المرحلة 5
  static calculateFoundationDimensions(...)  // المرحلة 6
  static calculateFoundationsVolume(...)     // المرحلة 8
  static async executeAlgorithm(...)         // تنفيذ كامل الخوارزمية
}
```

#### 2. نقطة النهاية (API Endpoint)
**الملف**: `backend/routes/calculations.js`

```http
POST /api/calculations/concrete-algorithm

Request Body:
{
  projectId: string (optional),
  cleaningPourLength: number,
  cleaningPourWidth: number,
  cleaningPourHeight: number,
  numberOfFloors: number,
  slabArea: number,
  soilType: string (ObjectId),
  buildingType: string,
  foundationHeight: number,
  numberOfFoundations: number,
  foundationShape: 'square' | 'rectangle',
  areFoundationsSimilar: boolean,
  foundationDetails: Array<{height: number}>
}

Response:
{
  success: boolean,
  inputs: {...},
  calculations: {...},
  summary: {...},
  error?: string,
  errors?: string[]
}
```

### الواجهة الأمامية (Frontend)

**المكون**: `frontend/src/components/forms/ConcreteAlgorithmForm.tsx`

الميزات:
- نموذج متعدد المراحل (3 مراحل)
- التحقق من صحة البيانات
- عرض تفاعلي للنتائج
- دعم اللغة العربية كاملاً
- تصميم متجاوب (Responsive)

---

## معايير التحقق من الصحة

### ارتفاع القاعدة
```
القيم المقبولة: 0.40 متر ≤ height ≤ 0.80 متر
رسالة الخطأ: "ارتفاع القاعدة يجب أن يكون بين 0.40 و 0.80 متر"
```

### الأبعاد
```
يجب أن تكون جميع الأبعاد > 0
- طول > 0
- عرض > 0
- ارتفاع > 0
- عدد الطوابق > 0
- مساحة البلاطة > 0
- عدد القواعس > 0
```

### البيانات المفقودة
```
جميع الحقول المطلوبة يجب ملأها
إذا كانت القواعس مختلفة:
  - عدد بيانات القواعس = عدد القواعس
```

---

## معادلات الحساب الرئيسية

### معادلة مساحة القاعدة (Bearing Area Formula)
```
B = (P × n × q) / σ_soil

حيث:
B = مساحة القاعدة (م²)
P = مساحة البلاطة (م²)
n = عدد الطوابق
q = إجمالي الأحمال (kN/m²)
σ_soil = قدرة تحمل التربة (kN/m²)
```

### معادلة الأبعاد للقاعدة المستطيلة
```
w = √(B ÷ 1.2)
l = w × 1.2

حيث:
l = الطول
w = العرض
النسبة الطول/العرض = 1.2
```

### معادلة حجم القاعدة
```
V = (L - 0.2) × (W - 0.2) × H

حيث:
L = طول صبة النظاف
W = عرض صبة النظاف
H = ارتفاع القاعدة
0.2 = هامش الأمان (مترين)
```

---

## خطوات الاستخدام

### للمهندسين والمستخدمين

1. **الدخول إلى الأداة**
   ```
   تحت الصفحة: /concrete-calculator أو في قسم الأدوات الهندسية
   ```

2. **ملء البيانات**
   - أدخل بيانات صبة النظاف (الطول والعرض والارتفاع)
   - أدخل عدد الطوابق ومساحة البلاطة
   - اختر نوع التربة ونوع المبنى

3. **تحديد القواعس**
   - حدد ارتفاع القاعدة (بين 0.40 و 0.80 متر)
   - حدد عدد القواعس وشكلها
   - إذا كانت مختلفة، أدخل ارتفاع كل قاعدة

4. **الحصول على النتائج**
   - سيتم عرض:
     * كمية الخرسانة لصبة النظاف
     * كمية الخرسانة للقواعس
     * مساحة وأبعاد القاعدة
     * الأحمال وقدرة التربة

5. **حفظ النتائج** (اختياري)
   - انقر على "حفظ النتائج" لحفظها في المشروع

---

## ملفات المشروع ذات الصلة

### الخادم
- `backend/services/concreteCalculationService.js` - الخدمة الرئيسية
- `backend/routes/calculations.js` - نقاط النهاية
- `backend/models/ConcreteCalculation.js` - نموذج قاعدة البيانات
- `backend/models/SoilType.js` - أنواع التربة
- `backend/models/LiveLoad.js` - الأحمال الحية
- `backend/models/DeadLoad.js` - الأحمال الميتة
- `backend/models/Project.js` - المشاريع

### الواجهة الأمامية
- `frontend/src/components/forms/ConcreteAlgorithmForm.tsx` - المكون الرئيسي

---

## أمثلة الاستخدام

### مثال 1: مبنى سكني بسيط
```json
{
  "cleaningPourLength": 20.5,
  "cleaningPourWidth": 15.3,
  "cleaningPourHeight": 0.10,
  "numberOfFloors": 5,
  "slabArea": 300,
  "soilType": "رمل",
  "buildingType": "سكني",
  "foundationHeight": 0.50,
  "numberOfFoundations": 4,
  "foundationShape": "square",
  "areFoundationsSimilar": true
}
```

**النتائج المتوقعة**:
- صبة النظاف: ~31.4 م³
- القواعس: ~613 م³
- مساحة القاعدة: ~33 م²

### مثال 2: مبنى تجاري بقواعس مختلفة
```json
{
  "cleaningPourLength": 30.0,
  "cleaningPourWidth": 25.0,
  "cleaningPourHeight": 0.15,
  "numberOfFloors": 8,
  "slabArea": 750,
  "soilType": "حصى",
  "buildingType": "تجاري",
  "foundationHeight": 0.60,
  "numberOfFoundations": 6,
  "foundationShape": "rectangle",
  "areFoundationsSimilar": false,
  "foundationDetails": [
    {"height": 0.60},
    {"height": 0.65},
    {"height": 0.60},
    {"height": 0.70},
    {"height": 0.60},
    {"height": 0.65}
  ]
}
```

---

## الترجمة والدعم

المشروع يدعم:
- **اللغة العربية**: جميع الواجهات والرسائل باللغة العربية
- **التسميات المحلية**: استخدام المصطلحات الهندسية العربية الصحيحة
- **الوحدات المترية**: جميع القياسات بالمتر والمتر المكعب

---

## التوسعات المستقبلية

1. إضافة تصدير PDF للنتائج
2. مقارنة النتائج لعدة حسابات
3. إضافة حاسبات إضافية (الحديد، الخشب، الدهانات)
4. دعم معايير دول إضافية
5. نموذج 3D للقواعس والمبنى
6. تخزين السجلات الكاملة للمشاريع

---

## الدعم والمساعدة

للمزيد من المساعدة، يرجى التواصل مع فريق الدعم أو مراجعة التوثيق الإضافية.

---

**آخر تحديث**: 14 ديسمبر 2025
**الإصدار**: 1.0
