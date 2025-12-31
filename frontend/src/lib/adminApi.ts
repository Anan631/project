// lib/adminApi.ts
export async function getAdminData(adminId: string) {
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    throw new Error('API_URL environment variable is not set');
  }
  const url = `${API_URL}/users/${adminId}`;

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

    if (!response.ok) {
      throw new Error(`❌ فشل جلب البيانات: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

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
      message = `🌐 فشل الاتصال بالسيرفر.`;
    } else {
      message = `⚠️ ${error.message}`;
    }

    return { success: false, message };
  }
}
