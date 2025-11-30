const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

/**
 * POST /api/admin/create-admin
 * Create a new admin account (only by existing admins)
 * 
 * SECURITY:
 * - Requires existing admin authentication
 * - Validates password strength
 * - Prevents duplicate admin emails
 */
router.post('/create-admin', requireAdmin, async (req, res) => {
  try {
    const { name, email, password_input, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password_input) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Validate password strength
    if (password_input.length < 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 12 characters long' 
      });
    }
    if (!/[a-z]/.test(password_input) || !/[A-Z]/.test(password_input) || 
        !/[0-9]/.test(password_input) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password_input)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must contain uppercase, lowercase, numbers, and special characters' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already exists',
        errorType: 'email_exists' 
      });
    }

    // Hash password with higher salt rounds for admin accounts
    const passwordHash = await bcrypt.hash(password_input, 12);

    // Create admin user
    const admin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: phone || undefined,
      profileImage: `https://placehold.co/100x100.png?text=${name.substring(0, 2).toUpperCase()}`,
    });

    // Return safe user object (without password hash)
    const { passwordHash: _, ...safeAdmin } = admin.toObject();
    
    return res.status(201).json({ 
      success: true, 
      message: 'Admin account created successfully',
      user: safeAdmin 
    });
  } catch (err) {
    console.error('[create-admin] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creating admin account',
      error: err.message 
    });
  }
});

/**
 * GET /api/admin/admins
 * List all admin accounts (only by existing admins)
 */
router.get('/admins', requireAdmin, async (req, res) => {
  try {
    const admins = await User.find(
      { role: 'ADMIN' }, 
      { passwordHash: 0 } // Exclude password hash
    ).sort({ createdAt: -1 });

    return res.json({ 
      success: true, 
      admins,
      count: admins.length 
    });
  } catch (err) {
    console.error('[list-admins] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching admin accounts',
      error: err.message 
    });
  }
});

/**
 * DELETE /api/admin/:id
 * Delete an admin account (only by existing admins)
 * Prevents self-deletion
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const adminId = req.params.id;
    const currentAdminId = req.adminUser._id.toString();

    // Prevent self-deletion
    if (adminId === currentAdminId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own admin account' 
      });
    }

    // Check if this is the last admin
    const adminCount = await User.countDocuments({ role: 'ADMIN', status: 'ACTIVE' });
    if (adminCount <= 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the last admin account' 
      });
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin account not found' 
      });
    }

    if (admin.role !== 'ADMIN') {
      return res.status(400).json({ 
        success: false, 
        message: 'User is not an admin' 
      });
    }

    // Soft delete: set status to DELETED
    const deletionExpiryDate = new Date();
    deletionExpiryDate.setFullYear(deletionExpiryDate.getFullYear() + 1);
    
    admin.status = 'DELETED';
    admin.deletionExpiryDate = deletionExpiryDate;
    await admin.save();

    return res.json({ 
      success: true, 
      message: 'Admin account deleted successfully' 
    });
  } catch (err) {
    console.error('[delete-admin] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error deleting admin account',
      error: err.message 
    });
  }
});

module.exports = router;



