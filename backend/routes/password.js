const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();

// إعدادات النقل للبريد الإلكتروني مع التحقق من البيئة
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'mediaplus64@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'ychb qzxt cfws uumf';
  
  console.log(`[Email Config] User: ${emailUser}, Pass exists: ${!!emailPass}`);
  
  // استخدم إعدادات Gmail الصحيحة
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // أو 465 للـ SSL
    secure: false, // استخدم TLS بدلاً من SSL
    auth: {
      user: emailUser,
      pass: emailPass
    },
    logger: true, // لتسجيل السجلات
    debug: true   // لعرض رسائل debug
  });
};

let transporter = createTransporter();

// اختبر الاتصال عند بدء الخادم
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Transporter Error:', error);
    console.error('❌ تأكد من:');
    console.error('   1. تفعيل "السماح للتطبيقات الأقل أماناً" في حساب Gmail');
    console.error('   2. استخدام كلمة مرور التطبيق (App Password) بدلاً من كلمة المرور العادية');
    console.error('   3. التحقق من صحة بيانات البريد في ملف .env');
  } else {
    console.log('✅ Email Transporter Ready');
  }
});

// اختبر إرسال بريد بسيط
router.post('/test-email', async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a testEmail in the request body.' 
      });
    }

    console.log(`[Test Email] Sending test email to: ${testEmail}`);

    const testMailOptions = {
      from: process.env.EMAIL_USER || 'mediaplus64@gmail.com',
      to: testEmail,
      subject: 'اختبار البريد الإلكتروني - المحترف لحساب الكميات',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>✅ رسالة اختبار البريد</h1>
          <p>تم إرسال هذا البريد بنجاح من نظام المحترف لحساب الكميات.</p>
          <p>إذا وصلك هذا البريد، فإن إعدادات البريد الإلكتروني تعمل بشكل صحيح.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(testMailOptions);
    console.log(`✅ [Test Email] Sent: ${info.messageId}`);

    return res.json({ 
      success: true, 
      message: `تم إرسال بريد اختبار إلى ${testEmail} بنجاح.`,
      info: info
    });
  } catch (err) {
    console.error('❌ [Test Email] Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'فشل إرسال البريد الاختباري.',
      error: err.message
    });
  }
});

// Change own password
router.post('/change', async (req, res) => {
  try {
    const { userId, email, currentPassword_input, newPassword_input } = req.body || {};
    if (!userId && !email) {
      return res.status(400).json({ success: false, message: 'معرف المستخدم أو البريد الإلكتروني مطلوب.', errorType: 'user_not_found' });
    }
    const user = userId ? await User.findById(userId) : await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود.', errorType: 'user_not_found' });
    const ok = await bcrypt.compare(currentPassword_input, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة.', errorType: 'invalid_current_password' });
    user.passwordHash = await bcrypt.hash(newPassword_input, 10);
    await user.save();
    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: 'فشل تغيير كلمة المرور.', errorType: 'db_error' });
  }
});

// Create reset token
router.post('/reset-token', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();
    return res.json({ success: true, token, userId: user.id });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error.' });
  }
});

// Create reset token and send email (for Engineers)
router.post('/reset-token-with-email', async (req, res) => {
  try {
    const { email, role = 'ENGINEER' } = req.body;
    
    console.log(`[Password Reset] Request for email: ${email}, role: ${role}`);
    
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      console.log(`[Password Reset] User not found: ${email}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.role !== role) {
      console.log(`[Password Reset] Role mismatch. Expected: ${role}, Got: ${user.role}`);
      return res.status(403).json({ success: false, message: 'دور المستخدم غير متطابق.' });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();
    
    console.log(`[Password Reset] Token created for: ${email}`);

    // Determine reset link based on role
    let resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    if (role === 'ENGINEER') {
      resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/engineer/reset-password?token=${token}`;
    } else if (role === 'OWNER') {
      resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/owner/reset-password?token=${token}`;
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mediaplus64@gmail.com',
      to: email,
      subject: '🔐 إعادة تعيين كلمة المرور - المحترف لحساب الكميات',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; font-weight: 700; }
            .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; font-weight: 600; color: #333; margin: 0 0 20px 0; }
            .message { color: #555; line-height: 1.8; margin: 15px 0; font-size: 16px; }
            .button-container { text-align: center; margin: 40px 0; }
            .reset-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold; 
              font-size: 16px;
              transition: transform 0.3s;
              box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
            }
            .reset-button:hover { transform: translateY(-2px); }
            .link-container { 
              background-color: #f8f9fa; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 25px 0;
              border-left: 4px solid #667eea;
            }
            .link-text { 
              color: #555; 
              font-size: 13px; 
              margin: 8px 0 0 0;
              word-break: break-all;
              font-family: monospace;
              color: #667eea;
            }
            .link-label { 
              color: #888; 
              font-size: 12px; 
              font-weight: 600; 
              text-transform: uppercase;
              margin: 0;
            }
            .security-box { 
              background-color: #fff3cd; 
              border-left: 4px solid #ffc107; 
              padding: 20px; 
              margin: 25px 0; 
              border-radius: 8px;
            }
            .security-box h3 { 
              color: #856404; 
              margin: 0 0 10px 0; 
              font-size: 14px;
            }
            .security-box p { 
              color: #856404; 
              margin: 0; 
              font-size: 14px;
              line-height: 1.6;
            }
            .info-box {
              background-color: #e7f3ff;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .info-box p {
              color: #1565c0;
              margin: 0;
              font-size: 14px;
              line-height: 1.6;
            }
            .divider { border: none; border-top: 2px solid #e0e0e0; margin: 30px 0; }
            .footer { 
              background-color: #f8f9fa; 
              padding: 20px 30px; 
              text-align: center; 
              font-size: 12px; 
              color: #888;
              border-top: 1px solid #e0e0e0;
            }
            .footer p { margin: 5px 0; }
            .quick-tips {
              background-color: #f0f7ff;
              border: 1px dashed #667eea;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .quick-tips p {
              margin: 5px 0;
              font-size: 13px;
              color: #667eea;
            }
            @media (max-width: 600px) {
              .container { margin: 0; border-radius: 0; }
              .content { padding: 20px; }
              .reset-button { padding: 12px 30px; font-size: 14px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>🔐 المحترف لحساب الكميات</h1>
              <p>نظام إدارة المشاريع الهندسية</p>
            </div>

            <!-- Main Content -->
            <div class="content">
              <p class="greeting">مرحباً بك،</p>
              
              <p class="message">
                لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة وآمنة.
              </p>

              <!-- CTA Button -->
              <div class="button-container">
                <a href="${resetLink}" class="reset-button">
                  🔑 إعادة تعيين كلمة المرور
                </a>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <p>
                  <strong>💡 نصيحة:</strong> إذا لم تتمكن من النقر على الزر أعلاه، انسخ الرابط والصقه في متصفح الإنترنت الخاص بك.
                </p>
              </div>

              <!-- Link Display -->
              <div class="link-container">
                <p class="link-label">رابط إعادة التعيين:</p>
                <p class="link-text">${resetLink}</p>
              </div>

              <!-- Quick Tips -->
              <div class="quick-tips">
                <p>✓ اختر كلمة مرور قوية (أحروف، أرقام، رموز)</p>
                <p>✓ تأكد من عدم مشاركة كلمة المرور مع أحد</p>
                <p>✓ استخدم كلمة مرور فريدة لكل حساب</p>
              </div>

              <!-- Security Warning -->
              <div class="security-box">
                <h3>⚠️ معلومات أمان مهمة</h3>
                <p>
                  <strong>صلاحية هذا الرابط:</strong> ينتهي في غضون ساعة واحدة (60 دقيقة) من الآن. إذا انقضت المدة، سيتعين عليك طلب رابط جديد.<br><br>
                  <strong>لم تطلب هذا؟</strong> إذا لم تقم بطلب إعادة تعيين كلمة المرور، فلا داعي لاتخاذ أي إجراء. قد يكون شخص آخر قد أدخل بريدك الإلكتروني بالخطأ.
                </p>
              </div>

              <!-- Support Info -->
              <p class="message" style="font-size: 13px; color: #888; margin-top: 30px;">
                إذا واجهت أي مشاكل أو لم تقم بطلب إعادة تعيين كلمة المرور، يرجى التواصل مع فريق الدعم الخاص بنا على الفور.
              </p>
            </div>

            <hr class="divider">

            <!-- Footer -->
            <div class="footer">
              <p><strong>المحترف لحساب الكميات</strong></p>
              <p>نظام متقدم لإدارة مشاريع البناء والكميات الهندسية</p>
              <p style="margin-top: 15px; color: #999;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
              <p style="color: #999; font-size: 11px;">هذا البريد الإلكتروني مرسل من نظام آلي. يرجى عدم الرد على هذا البريد.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      console.log(`[Email] Attempting to send email to: ${email}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ [Email] Email sent successfully: ${info.messageId}`);
      
      return res.json({ 
        success: true, 
        token, 
        userId: user.id,
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.' 
      });
    } catch (emailError) {
      console.error('❌ [Email] Failed to send email:', emailError.message);
      console.error('❌ [Email] Error code:', emailError.code);
      console.error('❌ [Email] Email response:', emailError.response);
      
      // Log the reset link to console as fallback (for development/debugging)
      console.log('\n🔗 [FALLBACK] Password Reset Link:');
      console.log(`To: ${email}`);
      console.log(`Token: ${token}`);
      console.log(`Link: ${resetLink}`);
      console.log('----------------------------------------\n');
      
      // Still mark as success but inform about fallback
      return res.json({ 
        success: true, 
        token, 
        userId: user.id,
        message: 'تم إنشاء رابط إعادة التعيين، لكن حدث خطأ في إرسال البريد. تحقق من إعدادات البريد.',
        fallbackToken: token,
        fallbackLink: resetLink,
        debug: {
          emailError: emailError.message,
          emailCode: emailError.code
        }
      });
    }
  } catch (err) {
    console.error('❌ [Password Reset] Server error:', err);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم.' });
  }
});

// Reset with token
router.post('/reset-with-token', async (req, res) => {
  try {
    const { token, newPassword_input } = req.body;
    const user = await User.findOne({ resetToken: token });
    if (!user) return res.status(400).json({ success: false, message: 'رابط إعادة التعيين غير صالح.' });
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'رابط إعادة التعيين منتهي الصلاحية. يرجى طلب رابط جديد.' });
    }
    user.passwordHash = await bcrypt.hash(newPassword_input, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    return res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم.' });
  }
});

module.exports = router;


