const mongoose = require('mongoose');

const liveLoadSchema = new mongoose.Schema(
  {
    buildingType: { type: String, required: true }, // نوع المبنى بالعربية
    buildingTypeEn: { type: String }, // نوع المبنى بالإنجليزية (اختياري)
    commonValue: { type: Number }, // القيمة الشائعة (kN/m²)
    minValue: { type: Number, required: true }, // القيمة الدنيا (kN/m²)
    maxValue: { type: Number, required: true }, // القيمة العليا (kN/m²)
    notes: { type: String }, // ملاحظات
  },
  { timestamps: true }
);

module.exports = mongoose.model('LiveLoad', liveLoadSchema);


