const mongoose = require('mongoose');

const timelineTaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: String,
    startDate: String,
    endDate: String,
    color: String,
    status: String,
    progress: Number,
  },
  { _id: false }
);

const projectPhotoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    src: String,
    alt: String,
    caption: String,
    dataAiHint: String,
  },
  { _id: false }
);

const projectCommentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    user: String,
    text: String,
    date: String,
    avatar: String,
    dataAiHintAvatar: String,
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, required: true }, // 'ENGINEER', 'OWNER'
    text: String,
    type: { type: String, enum: ['text', 'audio'], default: 'text' },
    audioUrl: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    engineer: String,
    clientName: String,
    status: { type: String, default: 'مخطط له' }, // Project status: مخطط له, قيد التنفيذ, مكتمل, مؤرشف
    projectStatus: { type: String, enum: ['ACTIVE', 'DELETED'], default: 'ACTIVE' }, // System status: ACTIVE or DELETED
    startDate: String,
    endDate: String,
    description: String,
    location: String,
    budget: Number,
    overallProgress: { type: Number, default: 0 },
    quantitySummary: { type: String, default: '' },
    photos: { type: [projectPhotoSchema], default: [] },
    timelineTasks: { type: [timelineTaskSchema], default: [] },
    comments: { type: [projectCommentSchema], default: [] },
    chatMessages: { type: [chatMessageSchema], default: [] },
    linkedOwnerEmail: String,
    hiddenForUserIds: { type: [String], default: [] },
    createdByUserId: String, // User ID of the creator
    
    // Concrete calculations data
    concreteCalculations: {
      foundation: {
        // Inputs
        foundationLength: Number,
        foundationWidth: Number,
        foundationHeight: Number,
        numberOfFloors: Number,
        slabArea: Number,
        soilType: String,
        buildingType: String,
        baseHeight: Number, // 40-80 cm
        
        // Calculations
        foundationVolume: Number, // m³
        baseArea: Number, // m²
        baseShape: String, // 'square' or 'rectangular'
        baseLength: Number,
        baseWidth: Number,
        allBasesSimilar: Boolean,
        totalNumberOfBases: Number,
        individualBases: [{
          length: Number,
          width: Number,
        }],
        foundationsVolume: Number, // m³
        
        // Calculated at
        calculatedAt: Date,
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);


