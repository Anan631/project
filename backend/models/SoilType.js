const mongoose = require('mongoose');

const soilTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // الاسم بالعربية
    nameEn: { type: String }, // الاسم بالإنجليزية (اختياري)
    bearingCapacityMin: { type: Number, required: true }, // قدرة التحمل الدنيا (MPa)
    bearingCapacityMax: { type: Number, required: true }, // قدرة التحمل العليا (MPa)
    description: { type: String }, // وصف إضافي
  },
  { timestamps: true }
);

module.exports = mongoose.model('SoilType', soilTypeSchema);


