const mongoose = require('mongoose');
require('dotenv').config();

const SoilType = require('../models/SoilType');
const LiveLoad = require('../models/LiveLoad');
const DeadLoad = require('../models/DeadLoad');
const IronBar = require('../models/IronBar');
const RoofType = require('../models/RoofType');

// البيانات
const soilTypesData = [
  { name: 'تربة رملية', nameEn: 'Sandy Soil', bearingCapacityMin: 0.10, bearingCapacityMax: 0.30 },
  { name: 'تربة طينية', nameEn: 'Clayey Soil', bearingCapacityMin: 0.05, bearingCapacityMax: 0.15 },
  { name: 'تربة طينية رخوة', nameEn: 'Soft Clayey Soil', bearingCapacityMin: 0.025, bearingCapacityMax: 0.05 },
  { name: 'تربة طميية أو طينية رخوة', nameEn: 'Loose Silty or Clayey Soil', bearingCapacityMin: 0.025, bearingCapacityMax: 0.10 },
  { name: 'تربة طينية مخلوطة بالرمل', nameEn: 'Clayey Soil Mixed with Sand', bearingCapacityMin: 0.075, bearingCapacityMax: 0.20 },
  { name: 'تربة حصوية', nameEn: 'Gravelly Soil', bearingCapacityMin: 0.20, bearingCapacityMax: 0.40 },
  { name: 'تربة صخرية', nameEn: 'Rocky Soil', bearingCapacityMin: 35.00, bearingCapacityMax: 35.00 },
];

const liveLoadsData = [
  { buildingType: 'المباني السكنية', buildingTypeEn: 'Residential Buildings', commonValue: 2.4, minValue: 1.9, maxValue: 4.8, notes: '2.4 kN/m² للمناطق السكنية' },
  { buildingType: 'المكاتب', buildingTypeEn: 'Offices', commonValue: 4.8, minValue: 2.4, maxValue: 4.8, notes: '4.8 kN/m² لمكاتب تجارية' },
  { buildingType: 'المباني التجارية', buildingTypeEn: 'Commercial Buildings', minValue: 4.8, maxValue: 7.2 },
  { buildingType: 'المباني الصناعية', buildingTypeEn: 'Industrial Buildings', minValue: 4.8, maxValue: 7.2 },
  { buildingType: 'المستودعات والتخزين', buildingTypeEn: 'Warehouses', minValue: 4.8, maxValue: 7.2, notes: 'يختلف حسب كثافة التخزين' },
  { buildingType: 'المسارح والأماكن العامة وقاعات الاجتماعات', buildingTypeEn: 'Theaters, Public Places, Meeting Halls', minValue: 4.8, maxValue: 4.8 },
  { buildingType: 'المدارس', buildingTypeEn: 'Schools', commonValue: 4.8, minValue: 2.4, maxValue: 4.8, notes: '4.8 kN/m² للمناطق ذات وجود عالي للطلاب' },
  { buildingType: 'المباني الرياضية (مثل الملاعب)', buildingTypeEn: 'Sports Buildings', minValue: 4.8, maxValue: 7.2 },
  { buildingType: 'المستشفيات', buildingTypeEn: 'Hospitals', minValue: 4.8, maxValue: 6.0 },
  { buildingType: 'مواقف السيارات', buildingTypeEn: 'Car Parks', minValue: 4.8, maxValue: 6.0 },
];

const deadLoadsData = [
  // المباني السكنية
  { buildingType: 'المباني السكنية', buildingTypeEn: 'Residential Buildings', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'المباني السكنية', buildingTypeEn: 'Residential Buildings', elementType: 'أسقف خرسانية (بلاطات)', minValue: 1.8, maxValue: 2.4 },
  { buildingType: 'المباني السكنية', buildingTypeEn: 'Residential Buildings', elementType: 'أسقف جبسية', minValue: 1.2, maxValue: 1.8 },
  { buildingType: 'المباني السكنية', buildingTypeEn: 'Residential Buildings', elementType: 'جدران حاملة من الطوب', minValue: 8, maxValue: 8 },
  { buildingType: 'المباني السكنية', buildingTypeEn: 'Residential Buildings', elementType: 'جدران حاملة خرسانية', minValue: 7.2, maxValue: 8.4 },
  
  // المباني التجارية
  { buildingType: 'المباني التجارية', buildingTypeEn: 'Commercial Buildings', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'المباني التجارية', buildingTypeEn: 'Commercial Buildings', elementType: 'أسقف خرسانية', minValue: 1.8, maxValue: 2.4 },
  { buildingType: 'المباني التجارية', buildingTypeEn: 'Commercial Buildings', elementType: 'جدران خرسانية مسلحة', minValue: 7.2, maxValue: 8.4 },
  { buildingType: 'المباني التجارية', buildingTypeEn: 'Commercial Buildings', elementType: 'جدران جبسية', minValue: 1.2, maxValue: 1.8 },
  
  // المباني الصناعية
  { buildingType: 'المباني الصناعية', buildingTypeEn: 'Industrial Buildings', elementType: 'إجمالي الحمل الميت', minValue: 5, maxValue: 7 },
  { buildingType: 'المباني الصناعية', buildingTypeEn: 'Industrial Buildings', elementType: 'أسقف خرسانية', minValue: 2, maxValue: 2.5 },
  { buildingType: 'المباني الصناعية', buildingTypeEn: 'Industrial Buildings', elementType: 'جدران طوبية أو خرسانية', minValue: 10, maxValue: 10 },
  
  // المباني الرياضية
  { buildingType: 'المباني الرياضية (مثل الملاعب)', buildingTypeEn: 'Sports Buildings', elementType: 'إجمالي الحمل الميت', minValue: 4, maxValue: 7 },
  { buildingType: 'المباني الرياضية (مثل الملاعب)', buildingTypeEn: 'Sports Buildings', elementType: 'أسقف خرسانية', minValue: 2.4, maxValue: 3.6 },
  { buildingType: 'المباني الرياضية (مثل الملاعب)', buildingTypeEn: 'Sports Buildings', elementType: 'أسقف معدنية', minValue: 3.6, maxValue: 4.5 },
  
  // المستودعات والتخزين
  { buildingType: 'المستودعات والتخزين', buildingTypeEn: 'Warehouses and Storage', elementType: 'إجمالي الحمل الميت', minValue: 7, maxValue: 9 },
  { buildingType: 'المستودعات والتخزين', buildingTypeEn: 'Warehouses and Storage', elementType: 'جدران خرسانية أو زجاجية', minValue: 4.8, maxValue: 7.2 },
  { buildingType: 'المستودعات والتخزين', buildingTypeEn: 'Warehouses and Storage', elementType: 'أسقف خفيفة (خشبية/معزولة)', minValue: 2, maxValue: 3 },
  { buildingType: 'المستودعات والتخزين', buildingTypeEn: 'Warehouses and Storage', elementType: 'أسقف خشبية', minValue: 3.6, maxValue: 4.2 },
  { buildingType: 'المستودعات والتخزين', buildingTypeEn: 'Warehouses and Storage', elementType: 'أسقف عزل خفيفة', minValue: 2, maxValue: 3 },
  
  // المكاتب
  { buildingType: 'المكاتب', buildingTypeEn: 'Offices', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'المكاتب', buildingTypeEn: 'Offices', elementType: 'أسقف خرسانية', minValue: 1.8, maxValue: 2.4 },
  { buildingType: 'المكاتب', buildingTypeEn: 'Offices', elementType: 'جدران خرسانية مسلحة', minValue: 7.2, maxValue: 8.4 },
  
  // المدارس
  { buildingType: 'المدارس', buildingTypeEn: 'Schools', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'المدارس', buildingTypeEn: 'Schools', elementType: 'أسقف خرسانية', minValue: 1.8, maxValue: 2.4 },
  { buildingType: 'المدارس', buildingTypeEn: 'Schools', elementType: 'جدران خرسانية مسلحة', minValue: 7.2, maxValue: 8.4 },
  
  // المستشفيات
  { buildingType: 'المستشفيات', buildingTypeEn: 'Hospitals', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'المستشفيات', buildingTypeEn: 'Hospitals', elementType: 'أسقف خرسانية', minValue: 1.8, maxValue: 2.4 },
  { buildingType: 'المستشفيات', buildingTypeEn: 'Hospitals', elementType: 'جدران خرسانية مسلحة', minValue: 7.2, maxValue: 8.4 },
  
  // مواقف السيارات
  { buildingType: 'مواقف السيارات', buildingTypeEn: 'Car Parks', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'مواقف السيارات', buildingTypeEn: 'Car Parks', elementType: 'أسقف خرسانية', minValue: 2, maxValue: 2.5 },
  { buildingType: 'مواقف السيارات', buildingTypeEn: 'Car Parks', elementType: 'جدران خرسانية مسلحة', minValue: 7.2, maxValue: 8.4 },
  
  // المسارح والأماكن العامة
  { buildingType: 'المسارح والأماكن العامة وقاعات الاجتماعات', buildingTypeEn: 'Theaters, Public Places, Meeting Halls', elementType: 'إجمالي الحمل الميت', minValue: 6, maxValue: 8 },
  { buildingType: 'المسارح والأماكن العامة وقاعات الاجتماعات', buildingTypeEn: 'Theaters, Public Places, Meeting Halls', elementType: 'أسقف خرسانية', minValue: 1.8, maxValue: 2.4 },
  { buildingType: 'المسارح والأماكن العامة وقاعات الاجتماعات', buildingTypeEn: 'Theaters, Public Places, Meeting Halls', elementType: 'جدران خرسانية مسلحة', minValue: 7.2, maxValue: 8.4 },
];

const ironBarsData = [
  { diameter: 6, crossSectionalAreaCm2: 0.2827, crossSectionalAreaMm2: 28.27 },
  { diameter: 8, crossSectionalAreaCm2: 0.5027, crossSectionalAreaMm2: 50.27 },
  { diameter: 10, crossSectionalAreaCm2: 0.7854, crossSectionalAreaMm2: 78.54 },
  { diameter: 12, crossSectionalAreaCm2: 1.1310, crossSectionalAreaMm2: 113.10 },
  { diameter: 14, crossSectionalAreaCm2: 1.5394, crossSectionalAreaMm2: 153.94 },
  { diameter: 16, crossSectionalAreaCm2: 2.0106, crossSectionalAreaMm2: 201.06 },
  { diameter: 18, crossSectionalAreaCm2: 2.5447, crossSectionalAreaMm2: 254.47 },
  { diameter: 20, crossSectionalAreaCm2: 3.1416, crossSectionalAreaMm2: 314.16 },
  { diameter: 22, crossSectionalAreaCm2: 3.8013, crossSectionalAreaMm2: 380.13 },
  { diameter: 25, crossSectionalAreaCm2: 4.9087, crossSectionalAreaMm2: 490.87 },
];

const roofTypesData = [
  {
    name: 'سقف بلاطة صلبة',
    nameEn: 'Solid slab roof',
    typeOfReinforcement: 'تسليح شبكة رئيسية',
    typeOfReinforcementEn: 'Main mesh reinforcement',
    typicalThicknessMin: 12,
    typicalThicknessMax: 20,
    permissibleLoadMin: 6,
    permissibleLoadMax: 10,
    notes: 'النوع الأكثر شيوعاً في المباني السكنية',
  },
  {
    name: 'سقف بلاطة مضلعة باتجاه واحد',
    nameEn: 'One-way ribbed slab roof',
    typeOfReinforcement: 'تسليح باتجاه واحد',
    typeOfReinforcementEn: 'One-way reinforcement',
    typicalThicknessMin: 15,
    typicalThicknessMax: 25,
    permissibleLoadMin: 6,
    permissibleLoadMax: 9,
    notes: 'يستخدم في الاتجاه الطويل',
  },
  {
    name: 'سقف هوردي',
    nameEn: 'Hordi slab roof',
    typeOfReinforcement: 'كمرات + بلوكات',
    typeOfReinforcementEn: 'Beams + Blocks',
    typicalThicknessMin: 25,
    typicalThicknessMax: 35,
    permissibleLoadMin: 5,
    permissibleLoadMax: 8,
    notes: 'يقلل من أحمال وزن المبنى',
  },
];

async function seedData() {
  try {
    // الاتصال بقاعدة البيانات
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // حذف البيانات القديمة (اختياري - يمكن حذف هذا الجزء إذا كنت تريد إضافة بدون حذف)
    await SoilType.deleteMany({});
    await LiveLoad.deleteMany({});
    await DeadLoad.deleteMany({});
    await IronBar.deleteMany({});
    await RoofType.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // إدخال أنواع التربة
    const soilTypes = await SoilType.insertMany(soilTypesData);
    console.log(`✅ Inserted ${soilTypes.length} soil types`);

    // إدخال الحمولات الحية
    const liveLoads = await LiveLoad.insertMany(liveLoadsData);
    console.log(`✅ Inserted ${liveLoads.length} live loads`);

    // إدخال الحمولات الميتة
    const deadLoads = await DeadLoad.insertMany(deadLoadsData);
    console.log(`✅ Inserted ${deadLoads.length} dead loads`);

    // إدخال قضبان الحديد
    const ironBars = await IronBar.insertMany(ironBarsData);
    console.log(`✅ Inserted ${ironBars.length} iron bars`);

    // إدخال أنواع الأسقف
    const roofTypes = await RoofType.insertMany(roofTypesData);
    console.log(`✅ Inserted ${roofTypes.length} roof types`);

    console.log('\n🎉 All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// تشغيل الـ seeding
seedData();


