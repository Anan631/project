import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // إرسال البيانات إلى الواجهة الخلفية
    const API_URL = process.env.API_URL;
    if (!API_URL) {
      return NextResponse.json({ success: false, message: 'API_URL environment variable is not set' }, { status: 500 });
    }
    const response = await fetch(`${API_URL}/contact/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'فشل إرسال الرسالة');
    }

    return NextResponse.json({ success: true, message: data.message });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    );
  }
}
