// lib/adminApi.ts
export async function getAdminData(adminId: string) {
  // استخدام متغير البيئة إذا كان موجوداً، وإلا استخدام القيمة الافتراضية
  // Use environment variable if available, otherwise use default value
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const url = `${API_URL}/users/${adminId}`;

  console.log("🔍 Attempting to fetch admin data from:", url);
  console.log("💡 Tip: Set NEXT_PUBLIC_API_URL in .env.local to change the API port");

  try {
    // اختبار بسيط للاتصال قبل fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // مهلة 5 ثواني

    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("📩 Response status:", response.status);

    if (!response.ok) {
      throw new Error(`❌ فشل جلب البيانات: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Response data:", data);

    if (!data.success) {
      throw new Error(data.message || 'فشل جلب بيانات المشرف');
    }

    return { success: true, user: data.user };

  } catch (error: any) {
    // تفصيل أسباب فشل الاتصال
    let message = 'حدث خطأ أثناء جلب بيانات المشرف';

    if (error.name === 'AbortError') {
      message = '⏱️ المهلة انتهت: لم يتم الرد من السيرفر خلال 5 ثواني';
    } else if (error.message.includes('Failed to fetch')) {
      message = `🌐 فشل الاتصال بالسيرفر. تأكد من تشغيل السيرفر على المنفذ 5000 باستخدام الأمر: cd backend && node server.js`;
    } else {
      message = `⚠️ ${error.message}`;
    }

    console.error('Error fetching admin data:', error);
    return { success: false, message };
  }
}
