const mongoose = require('mongoose');

const roofTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // نوع السقف بالعربية
    nameEn: { type: String }, // نوع السقف بالإنجليزية (اختياري)
    typeOfReinforcement: { type: String, required: true }, // نوع التسليح
    typeOfReinforcementEn: { type: String }, // نوع التسليح بالإنجليزية (اختياري)
    typicalThicknessMin: { type: Number, required: true }, // السماكة النموذجية الدنيا (cm)
    typicalThicknessMax: { type: Number, required: true }, // السماكة النموذجية العليا (cm)
    permissibleLoadMin: { type: Number, required: true }, // الحمل المسموح الدنيا (kN/m²)
    permissibleLoadMax: { type: Number, required: true }, // الحمل المسموح العليا (kN/m²)
    notes: { type: String }, // ملاحظات
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoofType', roofTypeSchema);


