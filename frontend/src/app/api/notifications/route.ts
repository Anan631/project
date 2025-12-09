
import { NextRequest, NextResponse } from 'next/server';

// واجهة الإشعار
export interface Notification {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  read: boolean;
  type: 'admin' | 'owner' | 'engineer';
  action: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectTitle?: string;
  data?: any; // بيانات إضافية متعلقة بالإشعار
}

// دالة للحصول على الإشعارات حسب دور المستخدم
async function getUserNotifications(userId: string, userRole: string): Promise<Notification[]> {
  try {
    // في تطبيق حقيقي، سيتم استبدال هذا بطلب API إلى قاعدة البيانات
    const response = await fetch(`${process.env.API_URL}/notifications/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل في جلب الإشعارات');
    }

    return await response.json();
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);

    // في حالة فشل الاتصال بالخادم، إرجاع بيانات وهمية مؤقتة
    return generateDummyNotifications(userRole);
  }
}

// دالة لإنشاء إشعارات وهمية مؤقتة (للاختبار فقط)
function generateDummyNotifications(userRole: string): Notification[] {
  const now = new Date();
  const notifications: Notification[] = [];

  // إذا كان المستخدم مالكاً
  if (userRole === 'OWNER') {
    notifications.push(
      {
        id: '1',
        title: 'تم قبول طلب التسجيل',
        subtitle: 'تم قبول طلبك بنجاح يمكنك الآن تسجيل الدخول',
        time: 'منذ دقيقة واحدة',
        read: false,
        type: 'owner',
        action: 'accept_registration',
        userId: 'owner1',
        userName: 'محمد أحمد'
      },
      {
        id: '2',
        title: 'تم إضافة مشروع جديد',
        subtitle: 'تم إضافة مشروع "مبنى تجاري" إلى حسابك',
        time: 'منذ ساعة',
        read: false,
        type: 'owner',
        action: 'new_project',
        userId: 'owner1',
        userName: 'محمد أحمد'
      },
      {
        id: '3',
        title: 'تم رفع مخططات جديدة',
        subtitle: 'قام المهندس برفع مخططات طابق أرضي للمشروع',
        time: 'منذ ساعتين',
        read: true,
        type: 'owner',
        action: 'new_plans',
        userId: 'owner1',
        userName: 'محمد أحمد',
        projectId: 'proj1',
        projectTitle: 'مبنى تجاري'
      },
      {
        id: '4',
        title: 'رسالة جديدة من المهندس',
        subtitle: 'هناك استفسار يتعلق بمواد البناء للمشروع',
        time: 'منذ 3 ساعات',
        read: false,
        type: 'owner',
        action: 'new_message',
        userId: 'owner1',
        userName: 'محمد أحمد',
        projectId: 'proj1',
        projectTitle: 'مبنى تجاري'
      },
      {
        id: '5',
        title: 'تم رفع فاتورة جديدة',
        subtitle: 'تم رفع فاتورة المرحلة الأولى للمشروع',
        time: 'منذ يومين',
        read: true,
        type: 'owner',
        action: 'new_invoice',
        userId: 'owner1',
        userName: 'محمد أحمد',
        projectId: 'proj1',
        projectTitle: 'مبنى تجاري'
      }
    );
  }

  // إذا كان المستخدم مهندساً
  if (userRole === 'ENGINEER') {
    notifications.push(
      {
        id: '1',
        title: 'تم قبول حسابك',
        subtitle: 'تم تفعيل حسابك بنجاح يمكنك الآن البدء في العمل',
        time: 'منذ دقيقة واحدة',
        read: false,
        type: 'engineer',
        action: 'accept_account',
        userId: 'eng1',
        userName: 'أحمد محمد'
      },
      {
        id: '2',
        title: 'تم إسنادك لمشروع جديد',
        subtitle: 'تم إسنادك لمشروع "مدرسة حكومية" كمهندس رئيسي',
        time: 'منذ ساعتين',
        read: false,
        type: 'engineer',
        action: 'assigned_project',
        userId: 'eng1',
        userName: 'أحمد محمد',
        projectId: 'proj2',
        projectTitle: 'مدرسة حكومية'
      },
      {
        id: '3',
        title: 'رسالة من المالك',
        subtitle: 'هناك استفسار يتعلق بموعد تسليم المشروع',
        time: 'منذ 3 ساعات',
        read: true,
        type: 'engineer',
        action: 'new_message',
        userId: 'eng1',
        userName: 'أحمد محمد',
        projectId: 'proj2',
        projectTitle: 'مدرسة حكومية'
      },
      {
        id: '4',
        title: 'تم رفض المخططات',
        subtitle: 'تم رفض مخططات الطابق الأول بسبب عدم مطابقة المواصفات',
        time: 'منذ يومين',
        read: true,
        type: 'engineer',
        action: 'reject_plans',
        userId: 'eng1',
        userName: 'أحمد محمد',
        projectId: 'proj2',
        projectTitle: 'مدرسة حكومية'
      }
    );
  }

  // إذا كان المستخدم مدير نظام
  if (userRole === 'ADMIN') {
    notifications.push(
      {
        id: '1',
        title: 'طلب تسجيل جديد',
        subtitle: 'قام "أحمد محمد" بتقديم طلب تسجيل كمالك',
        time: 'منذ دقيقة واحدة',
        read: false,
        type: 'admin',
        action: 'new_registration',
        userId: 'admin1',
        userName: 'الإدارة'
      },
      {
        id: '2',
        title: 'طلب تعديل بيانات',
        subtitle: 'قام "محمد علي" بطلب تعديل بيانات حسابه',
        time: 'منذ ساعتين',
        read: false,
        type: 'admin',
        action: 'update_data',
        userId: 'admin1',
        userName: 'الإدارة'
      },
      {
        id: '3',
        title: 'مخططات تحتاج موافقة',
        subtitle: 'قام المهندس "سامي خالد" برفع مخططات لمشروع سكني',
        time: 'منذ 3 ساعات',
        read: true,
        type: 'admin',
        action: 'pending_plans',
        userId: 'admin1',
        userName: 'الإدارة',
        projectId: 'proj3',
        projectTitle: 'مشروع سكني'
      },
      {
        id: '4',
        title: 'شكوى جديدة',
        subtitle: 'تم رفع شكوى من قبل مالك مشروع تجاري',
        time: 'منذ يومين',
        read: true,
        type: 'admin',
        action: 'complaint',
        userId: 'admin1',
        userName: 'الإدارة'
      }
    );
  }

  return notifications;
}

// دالة لتحديث حالة قراءة الإشعار
async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.API_URL}/notifications/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId,
        userId
      })
    });

    if (!response.ok) {
      throw new Error('فشل في تحديث حالة الإشعار');
    }
  } catch (error) {
    console.error('خطأ في تحديث حالة الإشعار:', error);
  }
}

// دالة لحذف الإشعار
async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.API_URL}/notifications/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId,
        userId
      })
    });

    if (!response.ok) {
      throw new Error('فشل في حذف الإشعار');
    }
  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
  }
}

// دالة لتحديث جميع الإشعارات كمقروءة
async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId
      })
    });

    if (!response.ok) {
      throw new Error('فشل في تحديث حالة الإشعارات');
    }
  } catch (error) {
    console.error('خطأ في تحديث حالة الإشعارات:', error);
  }
}

// دالة لحذف جميع الإشعارات
async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.API_URL}/notifications/delete-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId
      })
    });

    if (!response.ok) {
      throw new Error('فشل في حذف الإشعارات');
    }
  } catch (error) {
    console.error('خطأ في حذف الإشعارات:', error);
  }
}

// معالج GET لجلب الإشعارات
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'معرف المستخدم أو دوره غير محدد' }, { status: 400 });
    }

    const notifications = await getUserNotifications(userId, userRole);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('خطأ في معالجة طلب الإشعارات:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// معالج POST لتحديث حالة الإشعارات
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, notificationId } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'بيانات غير كاملة' }, { status: 400 });
    }

    switch (action) {
      case 'read':
        if (!notificationId) {
          return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 });
        }
        await markNotificationAsRead(notificationId, userId);
        return NextResponse.json({ message: 'تم تحديث حالة الإشعار' });

      case 'readAll':
        await markAllNotificationsAsRead(userId);
        return NextResponse.json({ message: 'تم تحديث جميع الإشعارات' });

      case 'delete':
        if (!notificationId) {
          return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 });
        }
        await deleteNotification(notificationId, userId);
        return NextResponse.json({ message: 'تم حذف الإشعار' });

      case 'deleteAll':
        await deleteAllNotifications(userId);
        return NextResponse.json({ message: 'تم حذف جميع الإشعارات' });

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('خطأ في معالجة طلب الإشعارات:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
