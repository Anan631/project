import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectId, 
      buildingArea, 
      slabHeight, 
      concreteVolume, 
      totalWithWastage, 
      wastagePercentage 
    } = body;

    // التحقق من المدخلات المطلوبة
    if (!projectId || !buildingArea || !slabHeight || !concreteVolume) {
      return NextResponse.json({
        success: false,
        message: 'جميع البيانات مطلوبة'
      }, { status: 400 });
    }

    // إرسال البيانات إلى الباك إند
    const API_URL = process.env.API_URL;
    if (!API_URL) {
      return NextResponse.json({ success: false, message: 'API_URL environment variable is not set' }, { status: 500 });
    }
    const backendResponse = await fetch(`${API_URL}/calculations/ground-slab`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        buildingArea: Number(buildingArea),
        slabHeight: Number(slabHeight),
        concreteVolume: Number(concreteVolume),
        totalWithWastage: Number(totalWithWastage),
        wastagePercentage: Number(wastagePercentage)
      }),
    });

    const result = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json({
        success: false,
        message: result.message || 'فشل في حفظ البيانات'
      }, { status: backendResponse.status });
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ حساب أرضية المبنى بنجاح',
      data: result.data
    });

  } catch (error) {
    console.error('Error in ground-slab API:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ في الخادم'
    }, { status: 500 });
  }
}