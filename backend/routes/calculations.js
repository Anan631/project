const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const SoilType = require('../models/SoilType');
const LiveLoad = require('../models/LiveLoad');
const DeadLoad = require('../models/DeadLoad');
const ConcreteCalculation = require('../models/ConcreteCalculation');
const ConcreteCalculationService = require('../services/concreteCalculationService');

// Calculate base area only (for preview)
router.post('/foundation-base/preview', async (req, res) => {
  try {
    const {
      foundationLength,
      foundationWidth,
      foundationHeight,
      numberOfFloors,
      slabArea,
      soilType,
      buildingType,
      totalNumberOfBases,
      individualBases,
    } = req.body;

    // Get soil type bearing capacity
    const soil = await SoilType.findOne({ name: soilType });
    if (!soil) {
      return res.status(400).json({ 
        success: false, 
        message: 'نوع التربة غير موجود' 
      });
    }
    const bearingCapacity = (soil.bearingCapacityMin + soil.bearingCapacityMax) / 2;

    // Get dead load and live load
    const liveLoadData = await LiveLoad.findOne({ buildingType });
    const deadLoads = await DeadLoad.find({ buildingType });

    if (!liveLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الحية غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    if (!deadLoads || deadLoads.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الميتة غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    // Use common value if available, otherwise use minimum value
    const liveLoad = liveLoadData.commonValue !== undefined && liveLoadData.commonValue !== null
      ? liveLoadData.commonValue
      : liveLoadData.minValue;

    const deadLoadTotalRow = deadLoads.find((d) => d.elementType === 'إجمالي الحمل الميت');
    const deadLoad = deadLoadTotalRow
      ? (deadLoadTotalRow.commonValue !== undefined && deadLoadTotalRow.commonValue !== null
          ? deadLoadTotalRow.commonValue
          : deadLoadTotalRow.minValue)
      : deadLoads.reduce((sum, d) => {
          const v = d.commonValue !== undefined && d.commonValue !== null ? d.commonValue : d.minValue;
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);

    // Calculate base area
    const totalLoad = deadLoad + liveLoad;
    const baseAreaTotal = (slabArea * numberOfFloors * totalLoad) / (bearingCapacity * 1000);

    const basesCount = Number.isFinite(Number(totalNumberOfBases)) && Number(totalNumberOfBases) > 0
      ? Number(totalNumberOfBases)
      : (Array.isArray(individualBases) && individualBases.length > 0 ? individualBases.length : 1);

    const baseArea = baseAreaTotal / basesCount;

    res.json({
      success: true,
      data: {
        baseArea: parseFloat(baseArea.toFixed(2)),
        baseAreaTotal: parseFloat(baseAreaTotal.toFixed(2)),
        basesCount,
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الحساب', 
      error: error.message 
    });
  }
});

// Calculate foundation and base concrete quantities - Algorithm Implementation
router.post('/foundation-base', async (req, res) => {
  try {
    const {
      projectId,
      foundationLength,  // طول صبة النظاف
      foundationWidth,   // عرض صبة النظاف
      foundationHeight,  // ارتفاع صبة النظاف
      numberOfFloors,    // عدد الطوابق
      slabArea,          // مساحة البلاطة
      soilType,          // نوع التربة
      buildingType,      // نوع المبنى
      baseHeight,        // ارتفاع القاعدة
      baseShape,         // شكل القاعدة
      allBasesSimilar,   // هل القواعد متشابهة
      totalNumberOfBases, // عدد القواعد
      individualBases,   // بيانات القواعد المختلفة
    } = req.body;

    // المرحلة الأولى: إدخال البيانات والتحقق
    if (!projectId || !foundationLength || !foundationWidth || !foundationHeight || 
        !numberOfFloors || !slabArea || !soilType || !buildingType || !baseHeight) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      });
    }

    // تحقق أن ارتفاع القاعدة أكبر أو يساوي 0.40 متر وأصغر أو يساوي 0.80 متر
    let baseHeightMeters = Number(baseHeight);
    if (!Number.isFinite(baseHeightMeters) || baseHeightMeters <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ارتفاع القاعدة غير صالح'
      });
    }
    if (baseHeightMeters > 5) {
      baseHeightMeters = baseHeightMeters / 100;
    }
    if (baseHeightMeters < 0.4 || baseHeightMeters > 0.8) {
      return res.status(400).json({ 
        success: false, 
        message: 'ارتفاع القاعدة يجب أن يكون بين 0.40 و 0.80 متر' 
      });
    }

    if (!baseShape || !['square', 'rectangular'].includes(baseShape)) {
      return res.status(400).json({
        success: false,
        message: 'شكل القاعدة غير صالح'
      });
    }

    if (allBasesSimilar !== true && allBasesSimilar !== false) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد ما إذا كانت القواعد متشابهة أو مختلفة'
      });
    }

    const parsedTotalNumberOfBases = Number(totalNumberOfBases);
    if (!Number.isFinite(parsedTotalNumberOfBases) || parsedTotalNumberOfBases <= 0) {
      return res.status(400).json({
        success: false,
        message: 'عدد القواعد غير صالح'
      });
    }

    // المرحلة الثالثة: تحديد الأحمال
    // Get soil type bearing capacity
    const soil = await SoilType.findOne({ name: soilType });
    if (!soil) {
      return res.status(400).json({ 
        success: false, 
        message: 'نوع التربة غير موجود' 
      });
    }
    const bearingCapacity = (soil.bearingCapacityMin + soil.bearingCapacityMax) / 2;

    // Get dead load and live load based on building type
    const liveLoadData = await LiveLoad.findOne({ buildingType });
    const deadLoads = await DeadLoad.find({ buildingType });

    if (!liveLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الحية غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    if (!deadLoads || deadLoads.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الميتة غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    // إذا وُجدت قيمة شائعة للأحمال: اختر القيمة الشائعة
    // إذا لم توجد قيمة شائعة: اختر القيمة الدنيا
    const liveLoad = liveLoadData.commonValue !== undefined && liveLoadData.commonValue !== null
      ? liveLoadData.commonValue
      : liveLoadData.minValue;

    const deadLoadTotalRow = deadLoads.find((d) => d.elementType === 'إجمالي الحمل الميت');
    const deadLoad = deadLoadTotalRow
      ? (deadLoadTotalRow.commonValue !== undefined && deadLoadTotalRow.commonValue !== null
          ? deadLoadTotalRow.commonValue
          : deadLoadTotalRow.minValue)
      : deadLoads.reduce((sum, d) => {
          const v = d.commonValue !== undefined && d.commonValue !== null ? d.commonValue : d.minValue;
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);

    // المرحلة الثانية: حساب صبة النظاف
    // كمية خرسانة صبة النظاف = طول صبة النظاف × عرض صبة النظاف × ارتفاع صبة النظاف
    const foundationVolume = foundationLength * foundationWidth * foundationHeight;

    // المرحلة الرابعة: تحديد قدرة تحمل التربة
    // تم تحديد قدرة تحمل التربة في المرحلة الثالثة (bearingCapacity)

    // المرحلة الخامسة: حساب مساحة القاعدة
    // احسب مجموع الأحمال
    const totalLoad = deadLoad + liveLoad;
    
    // احسب الحمل الكلي على القاعدة
    // bearingCapacity is in MPa, convert to kN/m²: 1 MPa = 1000 kN/m²
    const bearingCapacityInKPa = bearingCapacity * 1000;
    const baseAreaTotal = (slabArea * numberOfFloors * totalLoad) / bearingCapacityInKPa;

    // احسب مساحة القاعدة
    const basesCount = parsedTotalNumberOfBases;
    const baseArea = baseAreaTotal / basesCount;

    // Calculate base dimensions
    let baseLength, baseWidth;
    if (baseShape === 'rectangular') {
      baseWidth = Math.sqrt(baseArea / 1.2);
      baseLength = baseWidth * 1.2;
    } else {
      baseLength = Math.sqrt(baseArea);
      baseWidth = baseLength;
    }

    // Calculate foundations volume (كمية الخرسانة في القواعد)
    // As per spec: use foundation dimensions minus 0.20m from each side
    let foundationsVolume = 0;

    if (foundationLength <= 0.20 || foundationWidth <= 0.20) {
      return res.status(400).json({
        success: false,
        message: 'أبعاد صبة النظاف غير صالحة'
      });
    }

    const defaultBasePlanArea = (foundationLength - 0.20) * (foundationWidth - 0.20);
    if (!Number.isFinite(defaultBasePlanArea) || defaultBasePlanArea <= 0) {
      return res.status(400).json({
        success: false,
        message: 'مساحة القاعدة غير صالحة'
      });
    }

    const singleBaseVolume = defaultBasePlanArea * baseHeightMeters;

    if (allBasesSimilar) {
      foundationsVolume = singleBaseVolume * basesCount;
    } else {
      if (!individualBases || individualBases.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'بيانات القواعد الفردية مطلوبة عندما تكون القواعد غير متشابهة' 
        });
      }

      if (individualBases.length !== basesCount) {
        return res.status(400).json({
          success: false,
          message: 'عدد القواعد لا يطابق عدد بيانات القواعد الفردية'
        });
      }

      // Sum all individual base volumes
      foundationsVolume = individualBases.reduce((sum, base) => {
        let heightMeters = base && base.height !== undefined && base.height !== null && base.height !== ''
          ? Number(base.height)
          : baseHeightMeters;
        if (Number.isFinite(heightMeters) && heightMeters > 5) {
          heightMeters = heightMeters / 100;
        }

        if (!Number.isFinite(heightMeters) || heightMeters <= 0 || heightMeters < 0.4 || heightMeters > 0.8) {
          throw new Error('ارتفاع إحدى القواعد غير صالح');
        }

        const volume = defaultBasePlanArea * heightMeters;
        return sum + volume;
      }, 0);
    }

    // Save to project
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        'concreteCalculations.foundation': {
          foundationLength,
          foundationWidth,
          foundationHeight,
          numberOfFloors,
          slabArea,
          soilType,
          buildingType,
          baseHeight: baseHeightMeters,
          foundationVolume: parseFloat(foundationVolume.toFixed(2)),
          baseArea: parseFloat(baseArea.toFixed(2)),
          baseAreaTotal: parseFloat(baseAreaTotal.toFixed(2)),
          baseShape,
          baseLength: parseFloat(baseLength.toFixed(2)),
          baseWidth: parseFloat(baseWidth.toFixed(2)),
          allBasesSimilar,
          totalNumberOfBases: allBasesSimilar ? totalNumberOfBases : individualBases?.length || 0,
          individualBases: allBasesSimilar ? [] : (individualBases || []).map((b) => ({
            height: b.height,
          })),
          foundationsVolume: parseFloat(foundationsVolume.toFixed(2)),
          calculatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'المشروع غير موجود' 
      });
    }

    res.json({
      success: true,
      data: {
        foundationVolume: parseFloat(foundationVolume.toFixed(2)),
        baseArea: parseFloat(baseArea.toFixed(2)),
        baseAreaTotal: parseFloat(baseAreaTotal.toFixed(2)),
        baseLength: parseFloat(baseLength.toFixed(2)),
        baseWidth: parseFloat(baseWidth.toFixed(2)),
        foundationsVolume: parseFloat(foundationsVolume.toFixed(2)),
        totalVolume: parseFloat((foundationVolume + foundationsVolume).toFixed(2)),
      },
      message: 'تم الحساب والحفظ بنجاح'
    });

  } catch (error) {
    if (error && typeof error.message === 'string' && error.message.includes('غير صالح')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Calculation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الحساب', 
      error: error.message 
    });
  }
});

// Get project calculations
router.get('/project/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'المشروع غير موجود' 
      });
    }

    res.json({
      success: true,
      data: project.concreteCalculations || {}
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب البيانات', 
      error: error.message 
    });
  }
});

router.post('/concrete', async (req, res) => {
  try {
    const {
      project,
      blindingSlabLength,
      blindingSlabWidth,
      blindingSlabHeight,
      numberOfFloors,
      slabArea,
      soilTypeId,
      buildingType,
      footingHeight,
      numberOfFootings,
      footingShape,
      areFootingsSimilar,
    } = req.body;

    // --- Validation ---
    if (!project || !blindingSlabLength || !blindingSlabWidth || !blindingSlabHeight || !numberOfFloors || !slabArea || !soilTypeId || !buildingType || !footingHeight || !numberOfFootings || !footingShape) {
      return res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
    }

    if (footingHeight < 0.4 || footingHeight > 0.8) {
      return res.status(400).json({ success: false, message: 'ارتفاع القاعدة يجب أن يكون بين 0.40 و 0.80 متر' });
    }

    // --- Data Fetching ---
    const soil = await SoilType.findById(soilTypeId);
    if (!soil) {
      return res.status(404).json({ success: false, message: 'نوع التربة غير موجود' });
    }
    const soilBearingCapacity = (soil.bearingCapacityMin + soil.bearingCapacityMax) / 2;

    const liveLoadData = await LiveLoad.findOne({ buildingType });
    if (!liveLoadData) {
      return res.status(400).json({ success: false, message: `بيانات الحمولة الحية غير موجودة لنوع المبنى: ${buildingType}` });
    }
    const liveLoad = liveLoadData.commonValue ?? liveLoadData.minValue;

    const deadLoadData = await DeadLoad.findOne({ buildingType, elementType: 'إجمالي الحمل الميت' });
    let deadLoad;
    if (deadLoadData) {
        deadLoad = deadLoadData.commonValue ?? deadLoadData.minValue;
    } else {
        const allDeadLoadsForType = await DeadLoad.find({ buildingType });
        if (!allDeadLoadsForType || allDeadLoadsForType.length === 0) {
            return res.status(400).json({ success: false, message: `بيانات الحمولة الميتة غير موجودة لنوع المبنى: ${buildingType}` });
        }
        deadLoad = allDeadLoadsForType.reduce((sum, d) => sum + (d.commonValue ?? d.minValue), 0);
    }


    // --- Calculations ---

    // 1. Blinding slab concrete volume
    const blindingSlabConcreteVolume = blindingSlabLength * blindingSlabWidth * blindingSlabHeight;

    // 2. Footing area
    const totalLoad = deadLoad + liveLoad; // in kN/m^2
    const bearingCapacityInKPa = soilBearingCapacity * 1000; // Convert MPa to kN/m^2
    const totalFootingArea = (slabArea * numberOfFloors * totalLoad) / bearingCapacityInKPa;
    const footingArea = totalFootingArea / numberOfFootings;


    // 3. Footing dimensions
    let footingLength, footingWidth;
    if (footingShape === 'rectangular') {
      footingWidth = Math.sqrt(footingArea / 1.2);
      footingLength = footingWidth * 1.2;
    } else { // square
      footingLength = Math.sqrt(footingArea);
      footingWidth = footingLength;
    }

    // 4. Footings concrete volume
    let footingsConcreteVolume;
    // The instruction is a bit ambiguous if footings are different. It says "for each footing... subtract 0.20m from blinding slab length/width".
    // This doesn't make sense if each footing is different. It should be based on each footing's dimensions.
    // The existing logic for different bases in `/foundation-base` is also flawed.
    // The instruction says "طرح 0.20 متر من طول صبة النظاف" which means subtract from blinding slab length.
    // I will follow the instruction as it is written.
    if (areFootingsSimilar) {
      const footingVolume = (blindingSlabLength - 0.2) * (blindingSlabWidth - 0.2) * footingHeight;
      footingsConcreteVolume = footingVolume * numberOfFootings;
    } else {
      // The instruction for different footings is not clear on how to get individual dimensions.
      // It says "for each footing...", but doesn't provide input for each.
      // Assuming it meant that the calculation is the same per footing, just summed up.
      // This part of the requirement might need clarification.
      // For now, let's assume if they are not similar, the calculation is the same as similar for the total number of footings.
      // This is a placeholder for a more detailed implementation if more requirements are provided.
      const footingVolume = (blindingSlabLength - 0.2) * (blindingSlabWidth - 0.2) * footingHeight;
      footingsConcreteVolume = footingVolume * numberOfFootings;
    }


    // --- Save to DB ---
    const newCalculation = new ConcreteCalculation({
      project,
      blindingSlabLength,
      blindingSlabWidth,
      blindingSlabHeight,
      numberOfFloors,
      slabArea,
      soilType: soilTypeId,
      buildingType,
      footingHeight,
      numberOfFootings,
      footingShape,
      areFootingsSimilar,
      blindingSlabConcreteVolume: parseFloat(blindingSlabConcreteVolume.toFixed(3)),
      footingArea: parseFloat(footingArea.toFixed(3)),
      footingLength: parseFloat(footingLength.toFixed(3)),
      footingWidth: parseFloat(footingWidth.toFixed(3)),
      footingsConcreteVolume: parseFloat(footingsConcreteVolume.toFixed(3)),
      deadLoad,
      liveLoad,
      soilBearingCapacity,
    });

    await newCalculation.save();

    res.status(201).json({
      success: true,
      message: 'تم حساب وتخزين كميات الخرسانة بنجاح',
      data: newCalculation,
    });

  } catch (error) {
    console.error('Concrete calculation error:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم أثناء حساب الخرسانة', error: error.message });
  }
});


// New comprehensive algorithm endpoint
// خوارزمية حساب كميات الخرسانة لصبة النظاف والقواعد
router.post('/concrete-algorithm', async (req, res) => {
  try {
    const {
      projectId,
      cleaningPourLength,
      cleaningPourWidth,
      cleaningPourHeight,
      numberOfFloors,
      slabArea,
      soilType,
      buildingType,
      foundationHeight,
      numberOfFoundations,
      foundationShape,
      areFoundationsSimilar,
      foundationDetails,
    } = req.body;

    // استدعاء الخوارزمية
    const result = await ConcreteCalculationService.executeAlgorithm({
      cleaningPourLength: Number(cleaningPourLength),
      cleaningPourWidth: Number(cleaningPourWidth),
      cleaningPourHeight: Number(cleaningPourHeight),
      numberOfFloors: Number(numberOfFloors),
      slabArea: Number(slabArea),
      soilType,
      buildingType,
      foundationHeight: Number(foundationHeight),
      numberOfFoundations: Number(numberOfFoundations),
      foundationShape,
      areFoundationsSimilar: areFoundationsSimilar === true || areFoundationsSimilar === 'true',
      foundationDetails: foundationDetails || [],
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // حفظ النتائج في قاعدة البيانات إذا كان المشروع موجوداً
    if (projectId) {
      try {
        const project = await Project.findByIdAndUpdate(
          projectId,
          {
            'concreteCalculations.algorithm': {
              inputs: result.inputs,
              calculations: result.calculations,
              summary: result.summary,
              calculatedAt: new Date(),
            }
          },
          { new: true }
        );

        if (!project) {
          return res.status(404).json({ 
            success: false, 
            message: 'المشروع غير موجود' 
          });
        }
      } catch (dbError) {
        console.warn('تحذير: تم حساب النتائج لكن فشل حفظها في المشروع:', dbError.message);
        // لا نرجع خطأ هنا - النتائج محسوبة بنجاح حتى لو فشل الحفظ
      }
    }

    res.json(result);

  } catch (error) {
    console.error('Algorithm execution error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تنفيذ الخوارزمية', 
      error: error.message 
    });
  }
});

// Get foundation data for column footings page
router.get('/foundation-calculations/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'معرف المشروع مطلوب' 
      });
    }

    // Fetch project with foundation calculations
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'المشروع غير موجود' 
      });
    }

    // Get foundation calculations from project
    const foundationData = project.concreteCalculations?.foundation;
    
    if (!foundationData) {
      return res.status(404).json({ 
        success: false, 
        message: 'لم يتم العثور على بيانات حسابات القواعد لهذا المشروع' 
      });
    }

    // Extract relevant foundation dimensions
    const foundationDimensions = {
      foundationLength: foundationData.baseLength || foundationData.foundationLength,
      foundationWidth: foundationData.baseWidth || foundationData.foundationWidth,
      numberOfFoundations: foundationData.numberOfFoundations,
      foundationHeight: foundationData.foundationHeight,
      foundationShape: foundationData.foundationShape,
      calculatedAt: foundationData.calculatedAt
    };

    res.json({
      success: true,
      data: foundationDimensions,
      message: 'تم جلب بيانات القواعد بنجاح'
    });

  } catch (error) {
    console.error('Error fetching foundation calculations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في جلب بيانات القواعد', 
      error: error.message 
    });
  }
});

// Calculate column footings (شروش الأعمدة) concrete quantities
router.post('/column-footings', async (req, res) => {
  try {
    const {
      projectId,
      numberOfColumns,      // عدد الأعمدة
      footingHeight,        // ارتفاع الشرش (15-20 سم)
      baseLength,           // طول القاعدة
      baseWidth,            // عرض القاعدة
      slabArea,             // مساحة البلاطة
      numberOfFloors,       // عدد الطوابق
      buildingType,         // نوع المبنى
      columnShape,          // شكل العمود (مربع، دائري، مستطيل)
    } = req.body;

    // Validation
    if (!projectId || !numberOfColumns || !footingHeight || !baseLength || !baseWidth || 
        !slabArea || !numberOfFloors || !buildingType || !columnShape) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      });
    }

    // Validate footing height (15-20 cm = 0.15-0.20 m)
    const footingHeightMeters = Number(footingHeight);
    if (!Number.isFinite(footingHeightMeters) || footingHeightMeters < 0.15 || footingHeightMeters > 0.20) {
      return res.status(400).json({ 
        success: false, 
        message: 'ارتفاع الشرش يجب أن يكون بين 15 و 20 سم (0.15 - 0.20 متر)' 
      });
    }

    // Validate column shape
    const validShapes = ['مربع', 'دائري', 'مستطيل'];
    if (!validShapes.includes(columnShape)) {
      return res.status(400).json({ 
        success: false, 
        message: 'شكل العمود غير صالح. يجب أن يكون مربع، دائري، أو مستطيل' 
      });
    }

    // Validate numeric values
    const numericFields = {
      numberOfColumns: Number(numberOfColumns),
      baseLength: Number(baseLength),
      baseWidth: Number(baseWidth),
      slabArea: Number(slabArea),
      numberOfFloors: Number(numberOfFloors)
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: `قيمة ${field} غير صالحة` 
        });
      }
    }

    // Get dead load and live load based on building type (same logic as foundation)
    const liveLoadData = await LiveLoad.findOne({ buildingType });
    const deadLoads = await DeadLoad.find({ buildingType });

    if (!liveLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الحية غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    if (!deadLoads || deadLoads.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الميتة غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    // Use common value if available, otherwise use minimum value
    const liveLoad = liveLoadData.commonValue !== undefined && liveLoadData.commonValue !== null
      ? liveLoadData.commonValue
      : liveLoadData.minValue;

    const deadLoadTotalRow = deadLoads.find((d) => d.elementType === 'إجمالي الحمل الميت');
    const deadLoad = deadLoadTotalRow
      ? (deadLoadTotalRow.commonValue !== undefined && deadLoadTotalRow.commonValue !== null
          ? deadLoadTotalRow.commonValue
          : deadLoadTotalRow.minValue)
      : deadLoads.reduce((sum, d) => {
          const v = d.commonValue !== undefined && d.commonValue !== null ? d.commonValue : d.minValue;
          return sum + (Number.isFinite(v) ? v : 0);
        }, 0);

    // Calculate loads
    const totalLoad = deadLoad + liveLoad;

    // Calculate concrete volume for column footings
    // 1. Calculate volume for single column footing
    const singleFootingVolume = baseLength * baseWidth * footingHeightMeters;
    
    // 2. Calculate total volume for all column footings
    const totalFootingsVolume = singleFootingVolume * numericFields.numberOfColumns;

    // Calculate Value A for column dimensions
    const valueA = (slabArea * numberOfFloors * totalLoad) / 0.195;

    // Calculate column dimensions based on shape
    let columnDimensions = {};
    
    if (columnShape === 'مستطيل') {
      // Calculate width (B)
      const B = Math.sqrt(valueA / 2);
      const width = B >= 25 ? B : 25;
      
      // Calculate length (C)
      const C = width * 2;
      const length = C >= 50 ? C : 50;
      
      columnDimensions = {
        length: parseFloat(length.toFixed(1)),
        width: parseFloat(width.toFixed(1)),
        displayText: `${length.toFixed(1)} × ${width.toFixed(1)} سم`
      };
    } else if (columnShape === 'دائري') {
      // Calculate diameter (D)
      const D = Math.sqrt(valueA / Math.PI) * 2;
      const diameter = D >= 30 ? D : 30;
      
      columnDimensions = {
        diameter: parseFloat(diameter.toFixed(1)),
        displayText: `${diameter.toFixed(1)} سم`
      };
    } else if (columnShape === 'مربع') {
      // Calculate dimension (F)
      const F = Math.sqrt(valueA / 2);
      const dimension = F >= 35 ? F : 35;
      
      columnDimensions = {
        length: parseFloat(dimension.toFixed(1)),
        width: parseFloat(dimension.toFixed(1)),
        displayText: `${dimension.toFixed(1)} × ${dimension.toFixed(1)} سم`
      };
    }

    // Save to project
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        'concreteCalculations.columnFootings': {
          numberOfColumns: numericFields.numberOfColumns,
          footingHeight: footingHeightMeters,
          baseLength: numericFields.baseLength,
          baseWidth: numericFields.baseWidth,
          slabArea: numericFields.slabArea,
          numberOfFloors: numericFields.numberOfFloors,
          buildingType,
          columnShape,
          valueA: parseFloat(valueA.toFixed(2)),
          columnDimensions,
          totalFootingsVolume: parseFloat(totalFootingsVolume.toFixed(2)),
          deadLoad: parseFloat(deadLoad.toFixed(2)),
          liveLoad: parseFloat(liveLoad.toFixed(2)),
          totalLoad: parseFloat(totalLoad.toFixed(2)),
          calculatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'المشروع غير موجود' 
      });
    }

    res.json({
      success: true,
      data: {
        numberOfColumns: numericFields.numberOfColumns,
        footingHeight: footingHeightMeters,
        baseLength: numericFields.baseLength,
        baseWidth: numericFields.baseWidth,
        slabArea: numericFields.slabArea,
        numberOfFloors: numericFields.numberOfFloors,
        buildingType,
        columnShape,
        valueA: parseFloat(valueA.toFixed(2)),
        columnDimensions,
        totalFootingsVolume: parseFloat(totalFootingsVolume.toFixed(2)),
        deadLoad: parseFloat(deadLoad.toFixed(2)),
        liveLoad: parseFloat(liveLoad.toFixed(2)),
        totalLoad: parseFloat(totalLoad.toFixed(2)),
      },
      message: 'تم حساب كميات شروش الأعمدة بنجاح'
    });

  } catch (error) {
    console.error('Column footings calculation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الحساب', 
      error: error.message 
    });
  }
});

// Save column calculations data
router.post('/column-calculations', async (req, res) => {
  try {
    const {
      projectId,
      columnShape,
      columnDimensions,
      valueA,
      totalFootingsVolume,
      numberOfColumns,
      calculationDate
    } = req.body;

    // Validation
    if (!projectId || !columnShape || !columnDimensions || !valueA || !totalFootingsVolume || !numberOfColumns) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول المطلوبة يجب ملؤها' 
      });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'المشروع غير موجود' 
      });
    }

    // Save column calculations to project (could also be saved to a separate collection)
    const columnCalculationData = {
      projectId,
      columnShape,
      columnDimensions,
      valueA,
      totalFootingsVolume,
      numberOfColumns,
      calculationDate: calculationDate || new Date(),
      savedAt: new Date()
    };

    // Update project with column calculations data
    await Project.findByIdAndUpdate(
      projectId,
      {
        'concreteCalculations.columnFootingsDetails': columnCalculationData
      },
      { new: true }
    );

    res.json({
      success: true,
      data: columnCalculationData,
      message: 'تم حفظ بيانات حسابات الأعمدة بنجاح'
    });

  } catch (error) {
    console.error('Error saving column calculations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في حفظ بيانات حسابات الأعمدة', 
      error: error.message 
    });
  }
});

// Calculate and save ground slab (أرضية المبنى - المِدّة) concrete quantities
router.post('/ground-slab', async (req, res) => {
  try {
    const {
      projectId,
      buildingArea,        // مساحة المبنى الكلية (م²)
      slabHeight,          // ارتفاع الصبة الأرضية (بالمتر)
      concreteVolume,      // كمية الخرسانة المحسوبة
      totalWithWastage,    // الكمية الكلية مع الهدر
      wastagePercentage    // نسبة الهدر
    } = req.body;

    // Validation
    if (!projectId || !buildingArea || !slabHeight || !concreteVolume) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة (معرف المشروع، مساحة المبنى، ارتفاع الصبة، كمية الخرسانة)' 
      });
    }

    // Validate numeric values
    const numericFields = {
      buildingArea: Number(buildingArea),
      slabHeight: Number(slabHeight),
      concreteVolume: Number(concreteVolume),
      totalWithWastage: Number(totalWithWastage),
      wastagePercentage: Number(wastagePercentage)
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: `قيمة ${field} غير صالحة` 
        });
      }
    }

    // Validate slab height (typically 10-30 cm = 0.10-0.30 m)
    if (numericFields.slabHeight < 0.10 || numericFields.slabHeight > 0.30) {
      return res.status(400).json({ 
        success: false, 
        message: 'ارتفاع الصبة الأرضية يجب أن يكون بين 10 و 30 سم (0.10 - 0.30 متر)' 
      });
    }

    // Validate building area (reasonable limits)
    if (numericFields.buildingArea > 10000) {
      return res.status(400).json({ 
        success: false, 
        message: 'مساحة المبنى كبيرة جداً، يرجى التحقق من القيمة' 
      });
    }

    // Verify calculation: كمية خرسانة أرضية المبنى = مساحة المبنى × ارتفاع الصبة الأرضية
    const expectedVolume = numericFields.buildingArea * numericFields.slabHeight;
    const volumeDifference = Math.abs(expectedVolume - numericFields.concreteVolume);
    
    if (volumeDifference > 0.001) { // Allow small floating point differences
      return res.status(400).json({ 
        success: false, 
        message: 'خطأ في حساب كمية الخرسانة. يرجى إعادة الحساب' 
      });
    }

    // Save to project
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        'concreteCalculations.groundSlab': {
          buildingArea: numericFields.buildingArea,
          slabHeight: numericFields.slabHeight,
          concreteVolume: numericFields.concreteVolume,
          totalWithWastage: numericFields.totalWithWastage,
          wastagePercentage: numericFields.wastagePercentage,
          calculatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'المشروع غير موجود' 
      });
    }

    res.json({
      success: true,
      data: {
        buildingArea: numericFields.buildingArea,
        slabHeight: numericFields.slabHeight,
        concreteVolume: numericFields.concreteVolume,
        totalWithWastage: numericFields.totalWithWastage,
        wastagePercentage: numericFields.wastagePercentage,
        calculationFormula: 'كمية خرسانة أرضية المبنى = مساحة المبنى × ارتفاع الصبة الأرضية',
        calculatedAt: new Date(),
      },
      message: 'تم حفظ حساب أرضية المبنى (المِدّة) بنجاح'
    });

  } catch (error) {
    console.error('Ground slab calculation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في حفظ حساب أرضية المبنى', 
      error: error.message 
    });
  }
});

module.exports = router;
