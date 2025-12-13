const mongoose = require('mongoose');

const deadLoadSchema = new mongoose.Schema(
  {
    buildingType: { type: String, required: true }, // نوع المبنى بالعربية
    buildingTypeEn: { type: String }, // نوع المبنى بالإنجليزية (اختياري)
    elementType: { type: String, required: true }, // نوع العنصر (مثل: أسقف خرسانية، جدران حاملة...)
    elementTypeEn: { type: String }, // نوع العنصر بالإنجليزية (اختياري)
    minValue: { type: Number, required: true }, // القيمة الدنيا (kN/m²)
    maxValue: { type: Number, required: true }, // القيمة العليا (kN/m²)
    notes: { type: String }, // ملاحظات
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeadLoad', deadLoadSchema);


