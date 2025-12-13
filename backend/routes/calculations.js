const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const SoilType = require('../models/SoilType');
const LiveLoad = require('../models/LiveLoad');
const DeadLoad = require('../models/DeadLoad');

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
    const deadLoadData = await DeadLoad.findOne({ 
      buildingType, 
      elementType: 'إجمالي الحمل الميت' 
    });

    if (!liveLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الحية غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    if (!deadLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الميتة غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    // Use common value if available, otherwise use minimum value
    const liveLoad = liveLoadData.commonValue !== undefined && liveLoadData.commonValue !== null
      ? liveLoadData.commonValue
      : liveLoadData.minValue;
    
    // DeadLoad doesn't have commonValue, so always use minValue
    const deadLoad = deadLoadData.minValue;

    // Calculate base area
    const totalLoad = deadLoad + liveLoad;
    const baseArea = (slabArea * numberOfFloors * totalLoad) / (bearingCapacity * 1000);

    res.json({
      success: true,
      data: { baseArea: parseFloat(baseArea.toFixed(2)) }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الحساب', 
      error: error.message 
    });
  }
});

// Calculate foundation and base concrete quantities
router.post('/foundation-base', async (req, res) => {
  try {
    const {
      projectId,
      foundationLength,
      foundationWidth,
      foundationHeight,
      numberOfFloors,
      slabArea,
      soilType,
      buildingType,
      baseHeight,
      baseShape,
      allBasesSimilar,
      totalNumberOfBases,
      individualBases,
    } = req.body;

    // Validation
    if (!projectId || !foundationLength || !foundationWidth || !foundationHeight || 
        !numberOfFloors || !slabArea || !soilType || !buildingType || !baseHeight) {
      return res.status(400).json({ 
        success: false, 
        message: 'جميع الحقول مطلوبة' 
      });
    }

    if (baseHeight < 40 || baseHeight > 80) {
      return res.status(400).json({ 
        success: false, 
        message: 'ارتفاع القاعدة يجب أن يكون بين 40-80 سم' 
      });
    }

    // Get soil type bearing capacity
    const soil = await SoilType.findOne({ name: soilType });
    if (!soil) {
      return res.status(400).json({ 
        success: false, 
        message: 'نوع التربة غير موجود' 
      });
    }
    const bearingCapacity = (soil.bearingCapacityMin + soil.bearingCapacityMax) / 2; // Use average

    // Get dead load and live load
    const liveLoadData = await LiveLoad.findOne({ buildingType });
    const deadLoadData = await DeadLoad.findOne({ 
      buildingType, 
      elementType: 'إجمالي الحمل الميت' 
    });

    if (!liveLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الحية غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    if (!deadLoadData) {
      return res.status(400).json({ 
        success: false, 
        message: `بيانات الحمولة الميتة غير موجودة لنوع المبنى: ${buildingType}. يرجى التأكد من تشغيل seeding script (npm run seed:engineering)` 
      });
    }

    // Use common value if available, otherwise use minimum value
    const liveLoad = liveLoadData.commonValue !== undefined && liveLoadData.commonValue !== null
      ? liveLoadData.commonValue
      : liveLoadData.minValue;
    
    // DeadLoad doesn't have commonValue, so always use minValue
    const deadLoad = deadLoadData.minValue;

    // Calculate foundation volume (صبة النظاف)
    const foundationVolume = foundationLength * foundationWidth * foundationHeight;

    // Calculate base area (مساحة القاعدة)
    // bearingCapacity is in MPa, convert to kN/m²: 1 MPa = 1000 kN/m²
    const bearingCapacityInKPa = bearingCapacity * 1000; // Convert MPa to kN/m²
    const totalLoad = deadLoad + liveLoad;
    const baseArea = (slabArea * numberOfFloors * totalLoad) / bearingCapacityInKPa;

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
    // Use base dimensions (baseLength, baseWidth) minus 0.20m from each side
    let foundationsVolume = 0;
    const singleBaseArea = (baseLength - 0.20) * (baseWidth - 0.20);
    const singleBaseVolume = singleBaseArea * (baseHeight / 100); // Convert cm to m

    if (allBasesSimilar) {
      if (!totalNumberOfBases || totalNumberOfBases <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'عدد القواعد مطلوب عندما تكون جميع القواعد متشابهة' 
        });
      }
      foundationsVolume = singleBaseVolume * totalNumberOfBases;
    } else {
      if (!individualBases || individualBases.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'بيانات القواعد الفردية مطلوبة عندما تكون القواعد غير متشابهة' 
        });
      }
      // Sum all individual base volumes
      // For individual bases, use the provided dimensions (should be base dimensions, not foundation)
      foundationsVolume = individualBases.reduce((sum, base) => {
        const area = (base.length - 0.20) * (base.width - 0.20);
        const volume = area * (baseHeight / 100);
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
          baseHeight,
          foundationVolume: parseFloat(foundationVolume.toFixed(2)),
          baseArea: parseFloat(baseArea.toFixed(2)),
          baseShape,
          baseLength: parseFloat(baseLength.toFixed(2)),
          baseWidth: parseFloat(baseWidth.toFixed(2)),
          allBasesSimilar,
          totalNumberOfBases: allBasesSimilar ? totalNumberOfBases : individualBases?.length || 0,
          individualBases: allBasesSimilar ? [] : (individualBases || []),
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
        baseLength: parseFloat(baseLength.toFixed(2)),
        baseWidth: parseFloat(baseWidth.toFixed(2)),
        foundationsVolume: parseFloat(foundationsVolume.toFixed(2)),
        totalVolume: parseFloat((foundationVolume + foundationsVolume).toFixed(2)),
      },
      message: 'تم الحساب والحفظ بنجاح'
    });

  } catch (error) {
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

module.exports = router;
