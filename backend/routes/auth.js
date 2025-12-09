const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const Setting = require('../models/Setting');

// دالة للتحقق من نطاق البريد الإلكتروني المسموح به لأصحاب الممتلكات
function isEmailDomainAllowedForOwner(email) {
  if (!email) return false;
  
  const lowerEmail = email.toLowerCase();
  const allowedDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'outlook.sa'
  ];
  
  // استخراج النطاق من البريد الإلكتروني
  const emailParts = lowerEmail.split('@');
  if (emailParts.length !== 2) return false;
  
  const domain = emailParts[1];
  return allowedDomains.includes(domain);
}

// Register
router.post('/register', async (req, res) => {
  console.log('[register] Received request:', req.body);
  try {
    const { name, email, password_input, role, phone, status } = req.body;

    if (!name || !email || !password_input || !role) {
      console.log('[register] Error: Missing required fields.');
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // SECURITY: Prevent ADMIN role registration through public endpoint
    const normalizedRole = String(role).toUpperCase();
    if (normalizedRole === 'ADMIN') {
      console.log('[register] Security: Attempted ADMIN registration blocked.');
      return res.status(403).json({ 
        success: false, 
        message: 'Admin accounts cannot be created through public registration',
        errorType: 'admin_registration_blocked' 
      });
    }
    
    // التحقق من نطاق البريد الإلكتروني لأصحاب الممتلكات
    if (role.toUpperCase() === 'OWNER' && !isEmailDomainAllowedForOwner(email)) {
      console.log('[register] Error: Email domain not allowed for owner role.');
      return res.status(400).json({ 
        success: false, 
        message: 'يجب أن يكون البريد الإلكتروني لأصحاب الممتلكات من أحد النطاقات التالية: Gmail، Yahoo، Hotmail، Outlook مع امتدادات .com أو .sa',
        errorType: 'invalid_email_domain' 
      });
    }
    
    // التحقق من نطاق البريد الإلكتروني للمهندسين
    if (role.toUpperCase() === 'ENGINEER' && !isEmailDomainAllowedForOwner(email)) {
      console.log('[register] Error: Email domain not allowed for engineer role.');
      return res.status(400).json({ 
        success: false, 
        message: 'يجب أن يكون البريد الإلكتروني للمهندسين من أحد النطاقات التالية: Gmail، Yahoo، Hotmail، Outlook مع امتدادات .com أو .sa',
        errorType: 'invalid_email_domain' 
      });
    }

    console.log('[register] Checking for existing user with email:', email);
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('[register] Error: Email already exists.');
      return res.status(409).json({ success: false, message: 'Email already exists', errorType: 'email_exists' });
    }
    console.log('[register] User does not exist. Proceeding.');

    console.log('[register] Hashing password...');
    const passwordHash = await bcrypt.hash(password_input, 10);
    console.log('[register] Password hashed successfully.');

    const initialStatus = status || 'ACTIVE';

    const userData = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: normalizedRole,
      status: initialStatus,
      phone,
      profileImage: `https://placehold.co/100x100.png?text=${name.substring(0, 2).toUpperCase()}`,
    };

    console.log('[register] Creating user with data:', userData);
    const user = await User.create(userData);
    console.log('[register] User created successfully:', user._id);

    const { passwordHash: _, ...safeUser } = user.toObject();
    return res.status(201).json({ success: true, message: 'User registered successfully', user: safeUser });
  } catch (err) {
    console.error('[register] error:', err);
    return res.status(500).json({ success: false, message: 'Error registering user', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password_input } = req.body;
    if (!email || !password_input) {
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    // --- Maintenance Mode Check ---
    try {
      // Find the LATEST updated settings document (or just the first one if only one exists)
      const settings = await Setting.findOne().sort({ updatedAt: -1 });
      if (settings && settings.maintenanceMode) {
        // We need to know the user's role before hashing/checking password, or check it after.
        // Let's check user existence first (which we do next anyway).
        const userForCheck = await User.findOne({ email: email.toLowerCase() });
        if (userForCheck) {
          // If maintenance is ON, allow ONLY 'ADMIN' (and 'SUPERADMIN' if you have it)
          const role = userForCheck.role ? userForCheck.role.toUpperCase() : '';
          const allowedRoles = ['ADMIN', 'SUPERADMIN'];
          if (!allowedRoles.includes(role)) {
             return res.status(503).json({ // 503 Service Unavailable is appropriate
               success: false,
               message: 'الموقع تحت الصيانة حالياً. يرجى المحاولة لاحقاً.', // "The site is currently under maintenance"
               errorType: 'maintenance_mode'
             });
          }
        }
      }
    } catch (settingErr) {
      console.error('[login] Error checking settings for maintenance mode:', settingErr);
      // Fallback: Proceed cautiously or block? 
      // Usually better to fail open or log error, but for maintenance critical, maybe fail open (allow login) 
      // or just ignore. We'll proceed.
    }
    // ------------------------------

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email not found', errorType: 'email_not_found' });
    }

    const ok = await bcrypt.compare(password_input, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid password', errorType: 'invalid_password' });
    }

    if (user.status !== 'ACTIVE') {
      const statusMap = {
        PENDING_APPROVAL: { message: 'Account pending approval', errorType: 'pending_approval' },
        SUSPENDED: { message: 'Account suspended', errorType: 'account_suspended' },
        DELETED: { message: 'Account deleted', errorType: 'account_deleted' },
      };
      const info = statusMap[user.status] || { message: 'Account inactive', errorType: 'other' };
      return res.status(403).json({ success: false, ...info });
    }

    const { passwordHash: _, ...safeUser } = user.toObject();
    return res.status(200).json({ success: true, message: 'Login successful', user: safeUser });
  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ success: false, message: 'Error logging in', error: err.message });
  }
});

module.exports = router;
