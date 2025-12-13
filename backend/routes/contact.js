const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// إعدادات النقل للبريد الإلكتروني
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'mediaplus64@gmail.com',
    pass: process.env.EMAIL_PASS || 'ychb qzxt cfws uumf'
  },
  logger: true,
  debug: true
});

// نقطة نهاية لإرسال رسالة التواصل
router.post('/send-message', async (req, res) => {
  try {
    const { name, email, subject, message, messageType, priority } = req.body;

    // تحضير محتوى البريد الإلكتروني
    const mailOptions = {
      from: process.env.EMAIL_USER || 'mediaplus64@gmail.com',
      to: 'mediaplus64@gmail.com',
      subject: `رسالة جديدة من ${name}: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>رسالة جديدة من نموذج التواصل</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f7fa;
              padding: 20px;
            }
            .container {
              max-width: 700px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #3b82f6, #1e40af);
              color: white;
              padding: 30px 25px;
              text-align: center;
              position: relative;
            }
            .header::after {
              content: "";
              position: absolute;
              bottom: -15px;
              left: 50%;
              transform: translateX(-50%);
              width: 30px;
              height: 30px;
              background-color: #ffffff;
              border-radius: 50%;
              box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 5px;
              font-weight: 600;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 30px 25px;
            }
            .info-box {
              background-color: #f8fafc;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 25px;
              border-right: 4px solid #3b82f6;
            }
            .info-item {
              display: flex;
              margin-bottom: 15px;
              align-items: flex-start;
            }
            .info-item:last-child {
              margin-bottom: 0;
            }
            .info-label {
              font-weight: 600;
              color: #4b5563;
              min-width: 120px;
            }
            .info-value {
              flex: 1;
            }
            .message-box {
              background-color: #f1f5f9;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 25px;
              position: relative;
            }
            .message-box::before {
              content: "";
              position: absolute;
              top: -10px;
              right: 20px;
              border-width: 0 10px 10px 10px;
              border-style: solid;
              border-color: #f1f5f9 transparent;
            }
            .message-title {
              color: #1e40af;
              margin-bottom: 15px;
              font-size: 18px;
              font-weight: 600;
            }
            .message-content {
              white-space: pre-wrap;
              font-size: 16px;
              line-height: 1.7;
            }
            .priority-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
            }
            .priority-high {
              background-color: #fee2e2;
              color: #b91c1c;
            }
            .priority-medium {
              background-color: #fef3c7;
              color: #b45309;
            }
            .priority-low {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .footer {
              background-color: #e0e7ff;
              padding: 20px;
              text-align: center;
              color: #4338ca;
              font-size: 14px;
            }
            .logo {
              width: 60px;
              height: 60px;
              background-color: #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 15px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .logo-icon {
              font-size: 30px;
            }
            @media only screen and (max-width: 600px) {
              body {
                padding: 10px;
              }
              .header h1 {
                font-size: 24px;
              }
              .info-item {
                flex-direction: column;
              }
              .info-label {
                margin-bottom: 5px;
                min-width: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="logo-icon">📧</span>
              </div>
              <h1>رسالة جديدة من نموذج التواصل</h1>
              <p>تم استلام رسالة جديدة عبر تطبيق "المحترف لحساب الكميات"</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <div class="info-item">
                  <div class="info-label">الاسم:</div>
                  <div class="info-value">${name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">البريد الإلكتروني:</div>
                  <div class="info-value">${email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">نوع الرسالة:</div>
                  <div class="info-value">${messageType}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">الأولوية:</div>
                  <div class="info-value">
                    <span class="priority-badge priority-${priority}">
                      ${priority === 'high' ? 'عالية' : priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">الموضوع:</div>
                  <div class="info-value">${subject}</div>
                </div>
              </div>
              
              <div class="message-box">
                <h3 class="message-title">الرسالة:</h3>
                <div class="message-content">${message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>تم إرسال هذه الرسالة في ${new Date().toLocaleDateString('ar-SA')} الساعة ${new Date().toLocaleTimeString('ar-SA')}</p>
              <p>© تطبيق "المحترف لحساب الكميات" - جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: email
    };

    // إرسال البريد الإلكتروني
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت ممكن.' 
    });
  } catch (error) {
    console.error('خطأ في إرسال البريد الإلكتروني:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى لاحقًا.' 
    });
  }
});

module.exports = router;
