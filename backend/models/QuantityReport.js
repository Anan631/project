const mongoose = require('mongoose');
const { Schema } = mongoose;

const quantityReportSchema = new Schema(
  {
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    engineerId: { type: String, required: true },
    engineerName: { type: String, required: true },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    
    // Concrete calculations
    concreteData: {
      cleaningVolume: { type: Number, default: 0 },
      foundationsVolume: { type: Number, default: 0 },
      groundSlabVolume: { type: Number, default: 0 }, // أرضية المبنى (المِدّة)
      totalConcrete: { type: Number, default: 0 },
      cleaningLength: { type: Number },
      cleaningWidth: { type: Number },
      cleaningHeight: { type: Number },
      numberOfFloors: { type: Number },
      floorArea: { type: Number },
      soilType: { type: String },
      buildingType: { type: String },
      foundationsSimilar: { type: Boolean },
      numberOfFoundations: { type: Number },
      foundationHeight: { type: Number },
      foundationShape: { type: String },
      foundationDimensions: { type: String },
      foundationArea: { type: Number },
      totalLoad: { type: Number },
      loadPerFoundation: { type: Number },
      deadLoadPerSqm: { type: Number },
      liveLoadPerSqm: { type: Number },
      combinedLoadPerSqm: { type: Number },
      individualFoundations: [{
        id: Number,
        cleaningLength: Number,
        cleaningWidth: Number,
        height: Number,
        volume: Number
      }],
      
      // Ground slab data (أرضية المبنى - المِدّة)
      groundSlabData: {
        buildingArea: { type: Number }, // مساحة المبنى الكلية (م²)
        slabHeight: { type: Number },   // ارتفاع الصبة الأرضية (بالمتر)
        wastagePercentage: { type: Number }, // نسبة الهدر (%)
        totalWithWastage: { type: Number }   // الكمية الكلية مع الهدر (م³)
      }
    },
    
    // Steel calculations
    steelData: {
      totalSteelWeight: { type: Number, default: 0 },
      foundationSteel: { type: Number, default: 0 },
      columnSteel: { type: Number, default: 0 },
      beamSteel: { type: Number, default: 0 },
      slabSteel: { type: Number, default: 0 },
      details: { type: Schema.Types.Mixed }
    },
    
    calculationType: { 
      type: String, 
      enum: ['foundation', 'cleaning-slab', 'ground-slab', 'columns', 'beams', 'slabs', 'full', 'column-footings', 'ground-bridges'],
      default: 'foundation'
    },
    
    sentToOwner: { type: Boolean, default: false },
    sentToOwnerAt: { type: Date },
    
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

quantityReportSchema.index({ projectId: 1 });
quantityReportSchema.index({ engineerId: 1 });

module.exports = mongoose.model('QuantityReport', quantityReportSchema);
