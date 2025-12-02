"use server";

import { z } from 'zod';
import { deleteUser } from '@/lib/db'; // تأكد من وجود دالة deleteUser في ملف db.ts

// لا يوجد schema مطلوب هنا لأننا نستقبل userId مباشرة
// ولكن يمكن إضافته للتحقق إذا لزم الأمر

export async function deleteUserAccountAction(userId: string): Promise<{ success: boolean, message?: string }> {
  console.log(`[DeleteUserAccountAction] User ${userId} attempting to delete own account.`);

  if (!userId) {
    return { success: false, message: "معرف المستخدم مطلوب." };
  }

  try {
    // استدعاء دالة الحذف من قاعدة البيانات
    const result = await deleteUser(userId);

    if (!result.success) {
      return {
        success: false,
        message: result.message || "فشل حذف الحساب.",
      };
    }

    return {
      success: true,
      message: result.message || "تم تعطيل حسابك بنجاح. سيتم تسجيل خروجك الآن.",
    };
  } catch (error) {
    console.error("[DeleteUserAccountAction] Unexpected error:", error);
    return {
      success: false,
      message: "حدث خطأ غير متوقع أثناء حذف الحساب.",
    };
  }
}