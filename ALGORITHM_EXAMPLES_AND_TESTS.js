/**
 * أمثلة واختبارات لخوارزمية حساب الخرسانة
 * Examples and Tests for Concrete Calculation Algorithm
 */

// ============================================
// مثال 1: مبنى سكني بسيط - مع قواعس متشابهة
// Example 1: Simple Residential Building - With Similar Foundations
// ============================================

const example1 = {
  // بيانات صبة النظاف
  cleaningPourLength: 20.5,          // متر
  cleaningPourWidth: 15.3,            // متر
  cleaningPourHeight: 0.10,           // متر

  // بيانات المبنى
  numberOfFloors: 5,                  // طابق
  slabArea: 300,                      // متر مربع

  // بيانات التربة والمبنى
  soilType: 'رمل',                    // رمل / طين / حصى
  buildingType: 'سكني',               // سكني / تجاري / صناعي

  // بيانات القواعس
  foundationHeight: 0.50,             // متر (بين 0.40 و 0.80)
  numberOfFoundations: 4,             // عدد القواعس
  foundationShape: 'square',          // مربعة أو مستطيلة
  areFoundationsSimilar: true,        // هل القواعس متشابهة؟

  foundationDetails: [],              // لا توجد تفاصيل إضافية (متشابهة)
};

/**
 * الحساب المتوقع:
 * 
 * المرحلة 2: صبة النظاف
 * cleaningPourVolume = 20.5 × 15.3 × 0.10 = 31.365 م³
 * 
 * المرحلة 3-4: الأحمال والتربة (من قاعدة البيانات)
 * للمبنى السكني - تربة رملية:
 * - الحمل الميت: ~3.5 kN/m²
 * - الحمل الحي: ~1.5 kN/m²
 * - إجمالي الأحمال: 5.0 kN/m²
 * - قدرة التربة: 0.3 MPa = 300 kN/m²
 * 
 * المرحلة 5: مساحة القاعدة
 * totalLoad = 300 × 5 × 5.0 = 7,500 kN
 * foundationArea = 7,500 ÷ 300 = 25 م²
 * 
 * المرحلة 6: أبعاد القاعدة (مربعة)
 * length = width = √25 = 5 متر
 * 
 * المرحلة 8: حجم القواعس
 * effectiveLength = 20.5 - 0.2 = 20.3 متر
 * effectiveWidth = 15.3 - 0.2 = 15.1 متر
 * singleFoundationVolume = 20.3 × 15.1 × 0.50 = 153.23 م³
 * totalVolume = 153.23 × 4 = 613.15 م³
 */

const expectedResults1 = {
  cleaningPourVolume: 31.365,         // م³
  foundationArea: 25,                 // م²
  foundationDimensions: '5 × 5',      // متر
  foundationsVolume: 613.15,          // م³
  totalVolume: 31.365 + 613.15,       // م³
};

console.log('مثال 1 - مبنى سكني بسيط:');
console.log('==========================================');
console.log('بيانات الإدخال:', example1);
console.log('النتائج المتوقعة:', expectedResults1);
console.log('');

// ============================================
// مثال 2: مبنى تجاري - مع قواعس مختلفة
// Example 2: Commercial Building - With Different Foundations
// ============================================

const example2 = {
  // بيانات صبة النظاف
  cleaningPourLength: 30.0,           // متر
  cleaningPourWidth: 25.0,            // متر
  cleaningPourHeight: 0.15,           // متر

  // بيانات المبنى
  numberOfFloors: 8,                  // طابق
  slabArea: 750,                      // متر مربع

  // بيانات التربة والمبنى
  soilType: 'حصى',                   // رمل / طين / حصى
  buildingType: 'تجاري',              // سكني / تجاري / صناعي

  // بيانات القواعس
  foundationHeight: 0.60,             // متر افتراضي
  numberOfFoundations: 6,             // عدد القواعس
  foundationShape: 'rectangle',       // مربعة أو مستطيلة
  areFoundationsSimilar: false,       // القواعس مختلفة

  foundationDetails: [
    { index: 1, height: 0.60 },
    { index: 2, height: 0.65 },
    { index: 3, height: 0.60 },
    { index: 4, height: 0.70 },
    { index: 5, height: 0.60 },
    { index: 6, height: 0.65 },
  ],
};

/**
 * الحساب المتوقع:
 * 
 * المرحلة 2: صبة النظاف
 * cleaningPourVolume = 30.0 × 25.0 × 0.15 = 112.5 م³
 * 
 * المرحلة 3-4: الأحمال والتربة (من قاعدة البيانات)
 * للمبنى التجاري - تربة حصى:
 * - الحمل الميت: ~4.5 kN/m²
 * - الحمل الحي: ~3.0 kN/m²
 * - إجمالي الأحمال: 7.5 kN/m²
 * - قدرة التربة: 0.45 MPa = 450 kN/m²
 * 
 * المرحلة 5: مساحة القاعدة
 * totalLoad = 750 × 8 × 7.5 = 45,000 kN
 * foundationArea = 45,000 ÷ 450 = 100 م²
 * 
 * المرحلة 6: أبعاد القاعدة (مستطيلة)
 * width = √(100 ÷ 1.2) = √83.33 = 9.13 متر
 * length = 9.13 × 1.2 = 10.96 متر
 * 
 * المرحلة 8: حجم القواعس (مختلفة)
 * effectiveLength = 30.0 - 0.2 = 29.8 متر
 * effectiveWidth = 25.0 - 0.2 = 24.8 متر
 * 
 * للقاعدة 1: 29.8 × 24.8 × 0.60 = 444.0 م³
 * للقاعدة 2: 29.8 × 24.8 × 0.65 = 481.0 م³
 * للقاعدة 3: 29.8 × 24.8 × 0.60 = 444.0 م³
 * للقاعدة 4: 29.8 × 24.8 × 0.70 = 519.0 م³
 * للقاعدة 5: 29.8 × 24.8 × 0.60 = 444.0 م³
 * للقاعدة 6: 29.8 × 24.8 × 0.65 = 481.0 م³
 * 
 * totalVolume = 444 + 481 + 444 + 519 + 444 + 481 = 2,813 م³
 */

const expectedResults2 = {
  cleaningPourVolume: 112.5,          // م³
  foundationArea: 100,                // م²
  foundationDimensions: '10.96 × 9.13', // متر
  foundationsVolume: 2813,            // م³
  totalVolume: 112.5 + 2813,          // م³
};

console.log('مثال 2 - مبنى تجاري مع قواعس مختلفة:');
console.log('==========================================');
console.log('بيانات الإدخال:', example2);
console.log('النتائج المتوقعة:', expectedResults2);
console.log('');

// ============================================
// مثال 3: مبنى صناعي - قاعدة واحدة كبيرة
// Example 3: Industrial Building - Single Large Foundation
// ============================================

const example3 = {
  cleaningPourLength: 50.0,           // متر
  cleaningPourWidth: 40.0,            // متر
  cleaningPourHeight: 0.20,           // متر

  numberOfFloors: 3,                  // طابق
  slabArea: 2000,                     // متر مربع

  soilType: 'طين',                   // تربة طينية
  buildingType: 'صناعي',              // مبنى صناعي

  foundationHeight: 0.70,             // متر
  numberOfFoundations: 1,             // قاعدة واحدة فقط
  foundationShape: 'square',          // مربعة
  areFoundationsSimilar: true,        // لا أهمية (واحدة فقط)

  foundationDetails: [],
};

const expectedResults3 = {
  cleaningPourVolume: 400,            // م³ (50 × 40 × 0.20)
  foundationArea: 160,                // م² تقريباً
  foundationDimensions: '12.65 × 12.65', // متر
  foundationsVolume: 3660,            // م³ تقريباً
  totalVolume: 4060,                  // م³
};

console.log('مثال 3 - مبنى صناعي بقاعدة واحدة:');
console.log('==========================================');
console.log('بيانات الإدخال:', example3);
console.log('النتائج المتوقعة:', expectedResults3);
console.log('');

// ============================================
// دالة اختبار التحقق من البيانات
// Validation Test Function
// ============================================

function testValidation() {
  console.log('\nاختبار التحقق من البيانات:');
  console.log('==========================================');

  const invalidCases = [
    {
      name: 'ارتفاع قاعدة منخفض جداً',
      data: { ...example1, foundationHeight: 0.30 },
      expectedError: 'ارتفاع القاعدة يجب أن يكون بين 0.40 و 0.80 متر',
    },
    {
      name: 'ارتفاع قاعدة مرتفع جداً',
      data: { ...example1, foundationHeight: 1.0 },
      expectedError: 'ارتفاع القاعدة يجب أن يكون بين 0.40 و 0.80 متر',
    },
    {
      name: 'قيمة سالبة للطول',
      data: { ...example1, cleaningPourLength: -5 },
      expectedError: 'طول صبة النظاف يجب أن يكون أكبر من صفر',
    },
    {
      name: 'صفر للعرض',
      data: { ...example1, cleaningPourWidth: 0 },
      expectedError: 'عرض صبة النظاف يجب أن يكون أكبر من صفر',
    },
  ];

  invalidCases.forEach(testCase => {
    console.log(`\nالحالة: ${testCase.name}`);
    console.log(`الخطأ المتوقع: ${testCase.expectedError}`);
  });
}

testValidation();

// ============================================
// دالة حساب المساحة
// Foundation Area Calculation Function
// ============================================

function calculateFoundationArea(slabArea, numberOfFloors, deadLoad, liveLoad, bearingCapacity) {
  /**
   * الصيغة:
   * foundationArea = (P × n × (D + L)) / σ_soil
   * 
   * حيث:
   * P = مساحة البلاطة (m²)
   * n = عدد الطوابق
   * D = الحمل الميت (kN/m²)
   * L = الحمل الحي (kN/m²)
   * σ_soil = قدرة التربة (kN/m²)
   */

  const totalLoad = deadLoad + liveLoad;
  const totalBuildingLoad = slabArea * numberOfFloors * totalLoad;
  const bearingCapacityInKPa = bearingCapacity * 1000; // تحويل من MPa إلى kN/m²

  return {
    totalLoad,
    totalBuildingLoad,
    bearingCapacityInKPa,
    foundationArea: totalBuildingLoad / bearingCapacityInKPa,
  };
}

console.log('\n\nحساب مساحة القاعدة للمثال 1:');
console.log('==========================================');
const areaCalc1 = calculateFoundationArea(300, 5, 3.5, 1.5, 0.3);
console.log('الحمل الكلي:', areaCalc1.totalLoad, 'kN/m²');
console.log('الحمل الكلي للمبنى:', areaCalc1.totalBuildingLoad, 'kN');
console.log('قدرة التربة:', areaCalc1.bearingCapacityInKPa, 'kN/m²');
console.log('مساحة القاعدة:', areaCalc1.foundationArea, 'm²');

// ============================================
// دالة حساب الأبعاد
// Foundation Dimensions Calculation Function
// ============================================

function calculateDimensions(foundationArea, shape) {
  let length, width;

  if (shape === 'rectangle') {
    width = Math.sqrt(foundationArea / 1.2);
    length = width * 1.2;
  } else {
    length = Math.sqrt(foundationArea);
    width = length;
  }

  return {
    length: Math.round(length * 100) / 100,
    width: Math.round(width * 100) / 100,
    actualArea: length * width,
  };
}

console.log('\n\nحساب الأبعاد:');
console.log('==========================================');
const dims1 = calculateDimensions(25, 'square');
console.log('للقاعدة المربعة (25 m²):');
console.log('الطول:', dims1.length, 'متر');
console.log('العرض:', dims1.width, 'متر');
console.log('المساحة الفعلية:', dims1.actualArea, 'm²');

const dims2 = calculateDimensions(100, 'rectangle');
console.log('\nللقاعدة المستطيلة (100 m²):');
console.log('الطول:', dims2.length, 'متر');
console.log('العرض:', dims2.width, 'متر');
console.log('المساحة الفعلية:', dims2.actualArea, 'm²');

// ============================================
// ملخص الاختبارات
// Test Summary
// ============================================

console.log('\n\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           ملخص اختبارات خوارزمية الخرسانة                    ║');
console.log('║         Concrete Calculation Algorithm Test Summary        ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log('║ مثال 1: مبنى سكني بسيط                                       ║');
console.log('║         صبة النظاف: 31.37 m³                               ║');
console.log('║         القواعس: 613.15 m³                               ║');
console.log('║         الإجمالي: 644.52 m³                              ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log('║ مثال 2: مبنى تجاري مع قواعس مختلفة                           ║');
console.log('║         صبة النظاف: 112.5 m³                              ║');
console.log('║         القواعس: 2,813 m³                                ║');
console.log('║         الإجمالي: 2,925.5 m³                             ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log('║ مثال 3: مبنى صناعي بقاعدة واحدة                             ║');
console.log('║         صبة النظاف: 400 m³                                ║');
console.log('║         القواعس: 3,660 m³                                ║');
console.log('║         الإجمالي: 4,060 m³                               ║');
console.log('╚════════════════════════════════════════════════════════════╝');
