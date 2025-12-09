const mongoose = require('mongoose');

const costReportItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: false },
    name: String,
    quantity: Number,
    unit: String,
    pricePerUnit_ILS: Number,
    totalCost_ILS: Number,
  },
  { _id: false }
);

const costReportSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
    projectIdLegacy: { type: String },
    reportName: String,
    engineerId: String,
    engineerName: String,
    ownerId: String,
    ownerName: String,
    items: { type: [costReportItemSchema], default: [] },
    totalCost_ILS: Number,
    pdfData: String, // Base64 encoded PDF for owner download
    status: { type: String, enum: ['SAVED', 'SENT'], default: 'SENT' },
  },
  { timestamps: true }
);


module.exports = mongoose.model('CostReport', costReportSchema);


