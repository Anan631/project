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
    console.log('📄 Generating concrete PDF for report:', reportId);
    
    const report = await QuantityReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=concrete-report-${reportId}.pdf`);
    
    doc.pipe(res);
    
    // Header with border
    doc.rect(50, 50, 495, 80).stroke();
    doc.fontSize(24).text('تقرير كميات الخرسانة', 70, 80, { align: 'center' });
    doc.fontSize(12).text('Concrete Quantity Report', 70, 110, { align: 'center' });
    doc.moveDown(2);
    
    // Date
    const currentDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.fontSize(12).text(`تاريخ الطباعة: ${currentDate}`, 50, 150);
    doc.moveDown();
    
    // Owner and Engineer info in a box
    doc.rect(50, 170, 495, 60).stroke();
    doc.fontSize(14).text(`اسم المالك: ${report.ownerName || 'غير محدد'}`, 60, 185);
    doc.text(`اسم المهندس: ${report.engineerName}`, 60, 205);
    doc.moveDown(2);
    
    // Project info
    doc.fontSize(14).text(`اسم المشروع: ${report.projectName}`, 50, 250);
    doc.moveDown(2);
    
    // Concrete quantities section
    doc.rect(50, 280, 495, 140).stroke();
    doc.fontSize(16).text('كميات الخرسانة', 60, 295);
    doc.moveDown();
    
    const concreteData = report.concreteData || {};
    
    doc.fontSize(12).text(`كمية خرسانة النظاف: ${concreteData.cleaningVolume?.toFixed(2) || 0} متر مكعب`, 60, 325);
    doc.text(`كمية خرسانة القواعد: ${concreteData.foundationsVolume?.toFixed(2) || 0} متر مكعب`, 60, 345);
    doc.text(`كمية خرسانة أرضية المبنى: ${concreteData.groundSlabVolume?.toFixed(2) || 0} متر مكعب`, 60, 365);
    doc.moveDown();
    const totalConcrete = (concreteData.cleaningVolume || 0) + (concreteData.foundationsVolume || 0) + (concreteData.groundSlabVolume || 0);
    doc.fontSize(14).text(`إجمالي الكمية: ${totalConcrete.toFixed(2)} متر مكعب`, 60, 405);
    
    // Footer
    doc.fontSize(10).text('تم إنشاء هذا التقرير بواسطة نظام إدارة المشاريع الهندسية', 50, 750, { align: 'center' });
    
    doc.end();
    console.log('✅ Concrete PDF generated successfully');
    
  } catch (err) {
    console.error('❌ Error generating concrete PDF:', err);
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

// Send report to owner
router.post('/:reportId/send-to-owner', async (req, res) => {
  try {
    const reportId = req.params.reportId;
    console.log('📧 Sending report to owner:', reportId);
    
    const report = await QuantityReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    // Verify that the project is linked to an owner
    const project = await Project.findById(report.projectId);
    if (!project || !project.linkedOwnerEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'المشروع غير مرتبط بمالك. يرجى ربط المشروع بمالك أولاً' 
      });
    }
    
    // Verify owner email matches
    if (report.ownerEmail && report.ownerEmail.toLowerCase() !== project.linkedOwnerEmail.toLowerCase()) {
      return res.status(403).json({ 
        success: false, 
        message: 'البريد الإلكتروني للمالك في التقرير لا يطابق المالك المرتبط بالمشروع' 
      });
    }
    
    // Update report to mark as sent to owner
    report.sentToOwner = true;
    report.sentToOwnerAt = new Date();
    if (!report.ownerEmail) {
      report.ownerEmail = project.linkedOwnerEmail;
    }
    if (!report.ownerName && project.clientName) {
      report.ownerName = project.clientName;
    }
    
    await report.save();
    
    console.log('✅ Report sent to owner successfully:', report.ownerEmail);
    return res.json({ 
      success: true, 
      message: 'تم إرسال التقرير للمالك بنجاح',
      report 
    });
  } catch (err) {
    console.error('❌ Error sending report to owner:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send report to owner',
      error: err.message 
    });
  }
});

// Get reports sent to owner
router.get('/owner/:ownerEmail', async (req, res) => {
  try {
    const ownerEmail = req.params.ownerEmail.toLowerCase();
    console.log('📊 Fetching quantity reports for owner:', ownerEmail);
    
    // Find reports sent to this owner
    const reports = await QuantityReport.find({ 
      ownerEmail: ownerEmail,
      sentToOwner: true 
    }).sort({ sentToOwnerAt: -1 });
    
    console.log(`✅ Found ${reports.length} reports for owner ${ownerEmail}`);
    return res.json({ success: true, reports });
  } catch (err) {
    console.error('❌ Error fetching owner reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Get reports for a specific project sent to owner
router.get('/owner/:ownerEmail/project/:projectId', async (req, res) => {
  try {
    const ownerEmail = req.params.ownerEmail.toLowerCase();
    const projectId = req.params.projectId;
    console.log('📊 Fetching quantity reports for owner and project:', ownerEmail, projectId);
    
    // Verify project is linked to this owner
    const project = await Project.findById(projectId);
    if (!project || !project.linkedOwnerEmail || project.linkedOwnerEmail.toLowerCase() !== ownerEmail) {
      return res.status(403).json({ 
        success: false, 
        message: 'المشروع غير مرتبط بهذا المالك' 
      });
    }
    
    // Find reports for this project sent to this owner
    const reports = await QuantityReport.find({ 
      projectId,
      ownerEmail: ownerEmail,
      sentToOwner: true 
    }).sort({ sentToOwnerAt: -1 });
    
    console.log(`✅ Found ${reports.length} reports for owner ${ownerEmail} and project ${projectId}`);
    return res.json({ success: true, reports, project });
  } catch (err) {
    console.error('❌ Error fetching owner project reports:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reports' });
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
