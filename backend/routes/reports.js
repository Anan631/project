const express = require('express');
const CostReport = require('../models/CostReport');
const router = express.Router();

// Create cost report
router.post('/', async (req, res) => {
  try {
    const data = req.body || {};

    // Log incoming data for debugging
    console.log('📝 Creating cost report with data:', {
      projectId: data.projectId,
      reportName: data.reportName,
      engineerId: data.engineerId,
      ownerId: data.ownerId,
      itemsCount: data.items?.length || 0
    });

    // Convert numeric projectId to string for legacy compatibility
    if (data.projectId && !data.projectIdLegacy) {
      data.projectIdLegacy = String(data.projectId);
      console.log('✓ Set projectIdLegacy to:', data.projectIdLegacy);
    }

    // Remove the numeric projectId since the schema expects ObjectId
    // We'll use projectIdLegacy for queries instead
    // Remove the numeric/invalid projectId since the schema expects ObjectId
    // We'll use projectIdLegacy for queries instead
    if (data.projectId) {
      // Check if it's NOT a valid ObjectId (24 hex chars)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(data.projectId));
      if (!isValidObjectId) {
        delete data.projectId;
        console.log('✓ Removed invalid/numeric projectId from data');
      }
    }

    // Validate required fields
    if (!data.projectIdLegacy) {
      console.error('❌ Missing projectIdLegacy');
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
        error: 'projectIdLegacy is missing'
      });
    }

    if (!data.reportName || !data.reportName.trim()) {
      console.error('❌ Missing reportName');
      return res.status(400).json({
        success: false,
        message: 'Report name is required',
        error: 'reportName is missing or empty'
      });
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      console.error('❌ Missing or empty items array');
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
        error: 'items array is missing or empty'
      });
    }

    console.log('✓ All validations passed, creating report...');
    const report = await CostReport.create(data);
    console.log('✅ Cost report created successfully:', report._id);

    return res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('❌ Error creating cost report:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      errors: err.errors // Mongoose validation errors
    });

    return res.status(400).json({
      success: false,
      message: 'Failed to create cost report',
      error: err.message,
      details: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : undefined
    });
  }
});

// Get reports for project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log('📊 Fetching reports for project:', projectId);

    const reports = await CostReport.find({ $or: [{ projectIdLegacy: projectId }, { projectId }] }).sort({ createdAt: -1 });

    console.log(`✅ Found ${reports.length} reports for project ${projectId}`);
    if (reports.length > 0) {
      console.log('Report IDs:', reports.map(r => r._id));
      console.log('Report Names:', reports.map(r => r.reportName));
    }

    return res.json({ success: true, reports });
  } catch (err) {
    console.error('❌ Error fetching project reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Get reports for owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const reports = await CostReport.find({ ownerId }).sort({ createdAt: -1 });
    return res.json({ success: true, reports });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch owner reports' });
  }
});

// Delete cost report
router.delete('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const result = await CostReport.findByIdAndDelete(reportId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    console.log(`🗑️ Deleted cost report: ${reportId}`);
    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting cost report:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
});

module.exports = router;



