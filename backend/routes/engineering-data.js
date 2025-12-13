const express = require('express');
const router = express.Router();

const SoilType = require('../models/SoilType');
const LiveLoad = require('../models/LiveLoad');
const DeadLoad = require('../models/DeadLoad');
const IronBar = require('../models/IronBar');
const RoofType = require('../models/RoofType');

// Get all soil types
router.get('/soil-types', async (req, res) => {
  try {
    const soilTypes = await SoilType.find({}).sort({ name: 1 });
    res.json({ success: true, data: soilTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب أنواع التربة', error: error.message });
  }
});

// Get all live loads
router.get('/live-loads', async (req, res) => {
  try {
    const liveLoads = await LiveLoad.find({}).sort({ buildingType: 1 });
    res.json({ success: true, data: liveLoads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الحمولات الحية', error: error.message });
  }
});

// Get all dead loads
router.get('/dead-loads', async (req, res) => {
  try {
    const deadLoads = await DeadLoad.find({}).sort({ buildingType: 1, elementType: 1 });
    res.json({ success: true, data: deadLoads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الحمولات الميتة', error: error.message });
  }
});

// Get dead loads by building type
router.get('/dead-loads/:buildingType', async (req, res) => {
  try {
    const { buildingType } = req.params;
    const deadLoads = await DeadLoad.find({ buildingType }).sort({ elementType: 1 });
    res.json({ success: true, data: deadLoads });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الحمولات الميتة', error: error.message });
  }
});

// Get all iron bars
router.get('/iron-bars', async (req, res) => {
  try {
    const ironBars = await IronBar.find({}).sort({ diameter: 1 });
    res.json({ success: true, data: ironBars });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب قضبان الحديد', error: error.message });
  }
});

// Get iron bar by diameter
router.get('/iron-bars/:diameter', async (req, res) => {
  try {
    const { diameter } = req.params;
    const ironBar = await IronBar.findOne({ diameter: parseInt(diameter) });
    if (!ironBar) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على قضيب بهذا القطر' });
    }
    res.json({ success: true, data: ironBar });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب قضيب الحديد', error: error.message });
  }
});

// Get all roof types
router.get('/roof-types', async (req, res) => {
  try {
    const roofTypes = await RoofType.find({}).sort({ name: 1 });
    res.json({ success: true, data: roofTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب أنواع الأسقف', error: error.message });
  }
});

// Get all engineering data (combined)
router.get('/all', async (req, res) => {
  try {
    const [soilTypes, liveLoads, deadLoads, ironBars, roofTypes] = await Promise.all([
      SoilType.find({}).sort({ name: 1 }),
      LiveLoad.find({}).sort({ buildingType: 1 }),
      DeadLoad.find({}).sort({ buildingType: 1, elementType: 1 }),
      IronBar.find({}).sort({ diameter: 1 }),
      RoofType.find({}).sort({ name: 1 }),
    ]);

    res.json({
      success: true,
      data: {
        soilTypes,
        liveLoads,
        deadLoads,
        ironBars,
        roofTypes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات الهندسية', error: error.message });
  }
});

module.exports = router;


