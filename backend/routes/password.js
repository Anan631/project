const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

/* ===============================
   Email Transporter (PRODUCTION)
================================ */

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER or EMAIL_PASS is missing in environment variables');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password
    },
  });
};

/* ===============================
   Change Password (Logged User)
================================ */

router.post('/change', async (req, res) => {
  try {
    const { userId, email, currentPassword_input, newPassword_input } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم أو البريد الإلكتروني مطلوب',
      });
    }

    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    const valid = await bcrypt.compare(currentPassword_input, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    user.passwordHash = await bcrypt.hash(newPassword_input, 10);
    await user.save();

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'فشل تغيير كلمة المرور' });
  }
});

/* ===============================
   Create Reset Token (No Email)
================================ */

router.post('/reset-token', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    return res.json({ success: true, token, userId: user.id });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

/* ===============================
   Reset Token + Send Email
================================ */

router.post('/reset-token-with-email', async (req, res) => {
  try {
    const { email, role = 'ENGINEER' } = req.body;

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== role) {
      return res.status(403).json({ success: false, message: 'دور المستخدم غير متطابق' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    let resetLink = `${baseUrl}/reset-password?token=${token}`;
    if (role === 'ENGINEER') resetLink = `${baseUrl}/engineer/reset-password?token=${token}`;
    if (role === 'OWNER') resetLink = `${baseUrl}/owner/reset-password?token=${token}`;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"المحترف لحساب الكميات" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'إعادة تعيين كلمة المرور',
      html: `
        <div dir="rtl" style="font-family: Arial; line-height:1.8">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>تم طلب إعادة تعيين كلمة المرور الخاصة بك.</p>
          <p>
            <a href="${resetLink}"
               style="display:inline-block;padding:12px 24px;
               background:#667eea;color:#fff;text-decoration:none;border-radius:6px">
               إعادة تعيين كلمة المرور
            </a>
          </p>
          <p>الرابط صالح لمدة ساعة واحدة فقط.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
    });
  } catch (err) {
    console.error('EMAIL ERROR:', err.message);
    return res.status(500).json({
      success: false,
      message: 'فشل إرسال البريد الإلكتروني',
    });
  }
});

/* ===============================
   Reset Password With Token
================================ */

router.post('/reset-with-token', async (req, res) => {
  try {
    const { token, newPassword_input } = req.body;

    const user = await User.findOne({ resetToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'الرابط غير صالح' });
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      return res.status(400).json({ success: false, message: 'الرابط منتهي الصلاحية' });
    }

    user.passwordHash = await bcrypt.hash(newPassword_input, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
