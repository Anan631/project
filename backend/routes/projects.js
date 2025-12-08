const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const router = express.Router();

// List projects (optionally by role/email/name)
router.get('/', async (req, res) => {
  try {
    const { role, email, name, userId, userEmail, userRole } = req.query;
    let filter = {};

    // SECURITY: Admins see ALL projects (including deleted ones for management)
    if (userRole === 'ADMIN') {
      // Return all projects for admins (including deleted ones)
      let projects = await Project.find({}).sort({ createdAt: -1 });
      if (userId) {
        const uid = String(userId);
        projects = projects.filter(p => !(p.hiddenForUserIds || []).includes(uid));
      }
      return res.json({ success: true, projects });
    }

    // If userRole is OWNER and userEmail is provided, show projects linked to that owner
    if (userRole === 'OWNER' && userEmail) {
      filter.linkedOwnerEmail = String(userEmail).toLowerCase();
    }
    // If userId is provided and user is not OWNER, filter by createdByUserId
    else if (userId && userRole !== 'OWNER') {
      const uid = String(userId);
      filter.createdByUserId = uid;
    }
    // Legacy filtering for backward compatibility
    else {
      if (role === 'OWNER' && email) filter.linkedOwnerEmail = String(email).toLowerCase();
      if (role === 'ENGINEER' && name) filter.engineer = name;
      if (userId) {
        const uid = String(userId);
        filter.createdByUserId = uid;
      }
    }

    // Filter out deleted projects (projectStatus = 'DELETED')
    filter.projectStatus = { $ne: 'DELETED' };

    let projects = await Project.find(filter).sort({ createdAt: -1 });

    // Also filter out projects hidden for this user
    if (userId) {
      const uid = String(userId);
      projects = projects.filter(p => !(p.hiddenForUserIds || []).includes(uid));
    }

    return res.json({ success: true, projects });
  } catch (err) {
    console.error('[GET /projects] error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
});

// Get one
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch project' });
  }
});

// Create
router.post('/', async (req, res) => {
  try {
    const projectData = req.body || {};

    // Ensure createdByUserId is set if provided
    if (!projectData.createdByUserId && projectData.userId) {
      projectData.createdByUserId = projectData.userId;
    }

    const project = await Project.create(projectData);
    return res.status(201).json({ success: true, project });
  } catch (err) {
    console.error('[POST /projects] error:', err);
    return res.status(400).json({ success: false, message: 'Failed to create project' });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project });
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Failed to update project' });
  }
});

// Append Chat Message
router.post('/:id/messages', async (req, res) => {
  try {
    const { id, sender, text, type, audioUrl, timestamp } = req.body;
    if (!id || !sender) {
      return res.status(400).json({ success: false, message: 'Missing required message fields' });
    }

    // Validate message size (basic check to prefer server limits)
    if (audioUrl && audioUrl.length > 15 * 1024 * 1024) { // 15MB limit check manually
      return res.status(400).json({ success: false, message: 'Message too large' });
    }

    const newMessage = { id, sender, text, type: type || 'text', audioUrl, timestamp: timestamp || new Date() };

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $push: { chatMessages: newMessage } },
      { new: true }
    );

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project });
  } catch (err) {
    console.error('[POST /projects/:id/messages] error:', err);
    return res.status(400).json({ success: false, message: 'Failed to send message: ' + err.message });
  }
});

// Restore deleted project (Admin only)
router.post('/:id/restore', async (req, res) => {
  try {
    const { adminUserId } = req.body || {};

    // Check if this is an admin
    if (!adminUserId) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'ADMIN' || adminUser.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { projectStatus: 'ACTIVE', updatedAt: new Date() },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    return res.json({ success: true, message: 'تم استعادة المشروع بنجاح.', project });
  } catch (err) {
    console.error('[POST /projects/:id/restore] error:', err);
    return res.status(400).json({ success: false, message: 'Failed to restore project' });
  }
});

// Delete (Soft delete - sets projectStatus to DELETED)
router.delete('/:id', async (req, res) => {
  try {
    const { userId, adminUserId } = req.body || {};

    // Check if this is an admin deletion
    let isAdmin = false;
    if (adminUserId) {
      const adminUser = await User.findById(adminUserId);
      if (adminUser && adminUser.role === 'ADMIN' && adminUser.status === 'ACTIVE') {
        isAdmin = true;
      }
    }

    if (isAdmin) {
      // Admin deletion: Soft delete - mark as DELETED but keep in database
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { projectStatus: 'DELETED', updatedAt: new Date() },
        { new: true }
      );
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      return res.json({ success: true, message: 'تم حذف المشروع من النظام (سيتم الاحتفاظ به في قاعدة البيانات).' });
    } else {
      // Regular user deletion: Soft delete - mark as DELETED but keep in database
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId is required for deletion' });
      }
      const project = await Project.findByIdAndUpdate(
        req.params.id,
        { projectStatus: 'DELETED', updatedAt: new Date() },
        { new: true }
      );
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      return res.json({ success: true, message: 'تم حذف المشروع من لوحة التحكم (سيتم الاحتفاظ به في قاعدة البيانات).' });
    }
  } catch (err) {
    console.error('[DELETE /projects/:id] error:', err);
    return res.status(400).json({ success: false, message: 'Failed to delete project' });
  }
});

module.exports = router;


