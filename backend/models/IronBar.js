const mongoose = require('mongoose');

const ironBarSchema = new mongoose.Schema(
  {
    diameter: { type: Number, required: true }, // قطر القضيب (mm)
    crossSectionalAreaCm2: { type: Number, required: true }, // مساحة المقطع (cm²)
    crossSectionalAreaMm2: { type: Number, required: true }, // مساحة المقطع (mm²)
  },
  { timestamps: true }
);

module.exports = mongoose.model('IronBar', ironBarSchema);


