const mongoose = require('mongoose');
const { Schema } = mongoose;

const concreteCalculationSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },

    // Inputs
    blindingSlabLength: { type: Number, required: true },
    blindingSlabWidth: { type: Number, required: true },
    blindingSlabHeight: { type: Number, required: true },
    numberOfFloors: { type: Number, required: true },
    slabArea: { type: Number, required: true },
    soilType: { type: String, required: true }, // Changed from ObjectId to String to simplify for now, or match enum
    buildingType: { type: String, required: true }, 
    footingHeight: { type: Number, required: true }, // 0.40 - 0.80
    numberOfFootings: { type: Number, required: true },
    
    // Phase 6 & 7
    footingShape: { type: String, enum: ['square', 'rectangular'], required: true },
    areFootingsSimilar: { type: Boolean, default: true },
    
    // Outputs
    blindingSlabConcreteVolume: { type: Number }, // Phase 2
    
    // Phase 3 & 4
    deadLoad: { type: Number },
    liveLoad: { type: Number },
    totalLoads: { type: Number },
    soilBearingCapacity: { type: Number },
    
    // Phase 5
    totalLoadOnFooting: { type: Number },
    footingArea: { type: Number },
    
    // Phase 6
    calculatedFootingLength: { type: Number },
    calculatedFootingWidth: { type: Number },
    
    // Phase 8
    actualFootingLength: { type: Number }, // blinding length - 0.20
    actualFootingWidth: { type: Number }, // blinding width - 0.20
    singleFootingVolume: { type: Number }, // if similar
    
    // Different Footings Data
    individualFootings: [{
        footingId: Number, // 1 to N
        height: Number, // specific height if different? Or just standard height. 
        // Algorithm says: "height of base for this specific base". 
        // Logic check: "Input footing height" was global in Phase 1? 
        // Ah, Phase 8 says "height of base for THIS base" implying potentially variable heights if not similar?
        // Or "different" refers to dimensions? The prompt says "If bases are different -> calculate volume = L_actual * W_actual * H_specific".
        // But L_actual and W_actual depend on blinding slab, which was 1 input? 
        // Wait, "Different Footings" usually implies different dimensions. 
        // But the prompt algorithm for "Different":
        //   L_actual = Blinding_L - 0.20 (Constant!)
        //   W_actual = Blinding_W - 0.20 (Constant!)
        //   Vol = L * W * H_specific.
        // So ONLY Height varies? That's unusual but I will follow the algorithm strictly.
        volume: Number
    }],

    totalConcreteVolume: { type: Number }, // Final Result
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConcreteCalculation', concreteCalculationSchema);
