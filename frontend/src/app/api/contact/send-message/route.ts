import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // إرسال البيانات إلى الواجهة الخلفية
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/contact/send-message`, {
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
    console.error('خطأ في إرسال الرسالة:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'حدث خطأ أثناء إرسال الرسالة' },
      { status: 500 }
    );
  }
}
