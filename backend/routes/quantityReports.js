const express = require('express');
const router = express.Router();
const QuantityReport = require('../models/QuantityReport');
const Project = require('../models/Project');

let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (err) {
  console.log('⚠️ pdfkit not installed, PDF generation will not work');
}

// Save quantity report
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    console.log('📊 Creating quantity report for project:', data.projectId);
    
    // Check if report already exists for this project and calculation type
    const existingReport = await QuantityReport.findOne({
      projectId: data.projectId,
      calculationType: data.calculationType
    });
    
    if (existingReport) {
      // Update existing report
      Object.assign(existingReport, data);
      await existingReport.save();
      console.log('✅ Updated existing quantity report:', existingReport._id);
      return res.json({ success: true, report: existingReport, updated: true });
    }
    
    const report = await QuantityReport.create(data);
    console.log('✅ Created new quantity report:', report._id);
    
    return res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('❌ Error creating quantity report:', err);
    return res.status(400).json({
      success: false,
      message: 'Failed to create quantity report',
      error: err.message
    });
  }
});

// Get all projects with quantity reports for an engineer
router.get('/engineer/:engineerId', async (req, res) => {
  try {
    const engineerId = req.params.engineerId;
    console.log('📊 Fetching quantity reports for engineer:', engineerId);
    
    const reports = await QuantityReport.find({ engineerId }).sort({ updatedAt: -1 });
    
    // Group by project
    const projectsMap = new Map();
    reports.forEach(report => {
      if (!projectsMap.has(report.projectId)) {
        projectsMap.set(report.projectId, {
          projectId: report.projectId,
          projectName: report.projectName,
          engineerName: report.engineerName,
          ownerName: report.ownerName,
          ownerEmail: report.ownerEmail,
          reports: [],
          lastUpdated: report.updatedAt
        });
      }
      projectsMap.get(report.projectId).reports.push(report);
    });
    
    const projects = Array.from(projectsMap.values());
    
    console.log(`✅ Found ${projects.length} projects with reports`);
    return res.json({ success: true, projects });
  } catch (err) {
    console.error('❌ Error fetching quantity reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Get reports for a specific project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = req.params.projectId;
    console.log('📊 Fetching quantity reports for project:', projectId);
    
    const reports = await QuantityReport.find({ projectId }).sort({ updatedAt: -1 });
    
    // Also get project details
    let project = null;
    try {
      project = await Project.findById(projectId);
    } catch (e) {
      // projectId might not be a valid ObjectId
    }
    
    console.log(`✅ Found ${reports.length} reports for project ${projectId}`);
    return res.json({ success: true, reports, project });
  } catch (err) {
    console.error('❌ Error fetching project reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Generate PDF for concrete report
router.get('/pdf/concrete/:reportId', async (req, res) => {
  try {
    if (!PDFDocument) {
      return res.status(500).json({ success: false, message: 'PDF generation not available' });
    }

    const reportId = req.params.reportId;
    console.log('📄 Generating TEST concrete PDF for report:', reportId);
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=test-report.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(25).text('Hello World', 100, 100);
    
    doc.end();
    console.log('✅ Test PDF generated successfully');
    
  } catch (err) {
    console.error('❌ Error generating test PDF:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF', error: err.message });
  }
});

// Generate PDF for steel report
router.get('/pdf/steel/:reportId', async (req, res) => {
  try {
    if (!PDFDocument) {
      return res.status(500).json({ success: false, message: 'PDF generation not available' });
    }

    const reportId = req.params.reportId;
    console.log('📄 Generating TEST steel PDF for report:', reportId);
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=test-report.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(25).text('Hello World', 100, 100);
    
    doc.end();
    console.log('✅ Test PDF generated successfully');
    
  } catch (err) {
    console.error('❌ Error generating test PDF:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF', error: err.message });
  }
});

// Delete report
router.delete('/:id', async (req, res) => {
  try {
    const reportId = req.params.id;
    const result = await QuantityReport.findByIdAndDelete(reportId);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    console.log(`🗑️ Deleted quantity report: ${reportId}`);
    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting report:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete report' });
  }
});

module.exports = router;
