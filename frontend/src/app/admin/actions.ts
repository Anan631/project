"use server";

import { z } from 'zod';
import { updateUser as dbUpdateUser, type UserDocument, logAction } from '@/lib/db';

const adminUpdateUserSchema = z.object({
  userId: z.string().min(1, { message: "معرف المستخدم مطلوب." }),
  name: z.string().min(3, { message: "الاسم مطلوب (3 أحرف على الأقل)." }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }).optional(),
});

export type AdminUpdateUserFormValues = z.infer<typeof adminUpdateUserSchema>;

export async function adminUpdateUserAction(
  data: AdminUpdateUserFormValues,
  adminUserId?: string
): Promise<{ success: boolean; message?: string; fieldErrors?: Record<string, string[]> }> {
  console.log(`[AdminUpdateUserAction] Admin ${adminUserId} attempting to update user ${data.userId}.`);

  try {
    const updates: Partial<Omit<UserDocument, 'id' | 'password_hash' | 'createdAt'>> = {
      name: data.name,
    };

    if (data.email) {
      updates.email = data.email;
    }

    const result = await dbUpdateUser(data.userId, updates);

    if (result.success) {
      await logAction('USER_UPDATE_SUCCESS_BY_ADMIN', 'INFO', `Admin ${adminUserId} updated user ${data.userId}.`);
      return { success: true, message: 'تم تحديث المستخدم بنجاح.' };
    } else {
      await logAction('USER_UPDATE_FAILURE_BY_ADMIN', 'ERROR', `Admin ${adminUserId} failed to update user ${data.userId}.`);
      return { success: false, message: result.message || 'فشل تحديث المستخدم.' };
    }
  } catch (error: any) {
    await logAction('USER_UPDATE_FAILURE_BY_ADMIN', 'ERROR', `Error updating user: ${error.message}`);
    return { success: false, message: 'حدث خطأ أثناء تحديث المستخدم.' };
  }
}

export type AdminUpdateUserResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

// دالة لتغيير اسم المشرف
export async function adminUpdateNameAction(
  userId: string,
  newName: string,
  currentPassword: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[AdminUpdateNameAction] Admin ${userId} attempting to update name to ${newName}.`);

  try {
    // التحقق من كلمة المرور الحالية
    const { loginUser, updateUser } = await import('@/lib/db');

    // الحصول على معلومات المستخدم الحالية للتحقق من كلمة المرور
    const { findUserById } = await import('@/lib/db');
    const user = await findUserById(userId);

    if (!user) {
      return { success: false, message: 'المستخدم غير موجود.' };
    }

    // تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور للتحقق
    const loginResult = await loginUser(user.email, currentPassword);

    if (!loginResult.success) {
      return { success: false, message: 'كلمة المرور غير صحيحة.' };
    }

    // تحديث اسم المستخدم
    const updateResult = await updateUser(userId, { name: newName });

    if (updateResult.success) {
      await logAction('ADMIN_NAME_UPDATE_SUCCESS', 'INFO', `Admin ${userId} updated their name to ${newName}.`);
      return { success: true, message: 'تم تحديث الاسم بنجاح.' };
    } else {
      await logAction('ADMIN_NAME_UPDATE_FAILURE', 'ERROR', `Admin ${userId} failed to update name: ${updateResult.message}`);
      return { success: false, message: updateResult.message || 'فشل تحديث الاسم.' };
    }
  } catch (error: any) {
    await logAction('ADMIN_NAME_UPDATE_FAILURE', 'ERROR', `Error updating admin name: ${error.message}`);
    return { success: false, message: 'حدث خطأ أثناء تحديث الاسم.' };
  }
}

// دالة لتغيير كلمة مرور المشرف
export async function adminChangePasswordAction(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[AdminChangePasswordAction] Admin ${userId} attempting to change password.`);

  try {
    const { changeUserPassword } = await import('@/lib/db');
    const result = await changeUserPassword(userId, currentPassword, newPassword);

    if (result.success) {
      await logAction('ADMIN_PASSWORD_CHANGE_SUCCESS', 'INFO', `Admin ${userId} changed their password.`);
      return { success: true, message: 'تم تغيير كلمة المرور بنجاح.' };
    } else {
      await logAction('ADMIN_PASSWORD_CHANGE_FAILURE', 'ERROR', `Admin ${userId} failed to change password: ${result.message}`);
      return { success: false, message: result.message || 'فشل تغيير كلمة المرور.' };
    }
  } catch (error: any) {
    await logAction('ADMIN_PASSWORD_CHANGE_FAILURE', 'ERROR', `Error changing admin password: ${error.message}`);
    return { success: false, message: 'حدث خطأ أثناء تغيير كلمة المرور.' };
  }
}

// دالة لتغيير البريد الإلكتروني للمشرف
export async function adminUpdateEmailAction(
  userId: string,
  newEmail: string,
  currentPassword: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[AdminUpdateEmailAction] Admin ${userId} attempting to update email to ${newEmail}.`);

  try {
    // الحصول على بيانات الأدمن الحالية للتحقق من كلمة المرور
    const { findUserById } = await import('@/lib/db');
    const adminUser = await findUserById(userId);
    
    if (!adminUser) {
      return { success: false, message: 'لم يتم العثور على حساب الأدمن.' };
    }
    
    // التحقق من كلمة المرور الحالية باستخدام البريد الإلكتروني الحالي
    const { loginUser } = await import('@/lib/db');
    const loginResult = await loginUser(adminUser.email, currentPassword);

    // إذا كانت كلمة المرور صحيحة، تحقق من عدم وجود البريد الإلكتروني الجديد
    if (loginResult.success && loginResult.user?.id === userId) {
      const { findUserByEmail } = await import('@/lib/db');
      
      // التحقق من وجود المستخدمين الآخرين الذين يستخدمون نفس البريد الإلكتروني
      const existingUser = await findUserByEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        return { success: false, message: 'البريد الإلكتروني مستخدم بالفعل من قبل مستخدم آخر.' };
      }
      
      // تحديث البريد الإلكتروني
      const { updateUser } = await import('@/lib/db');
      const updateResult = await updateUser(userId, { email: newEmail });

      if (updateResult.success) {
        await logAction('ADMIN_EMAIL_UPDATE_SUCCESS', 'INFO', `Admin ${userId} updated their email to ${newEmail}.`);
        return { success: true, message: 'تم تحديث البريد الإلكتروني بنجاح.' };
      } else {
        await logAction('ADMIN_EMAIL_UPDATE_FAILURE', 'ERROR', `Admin ${userId} failed to update email: ${updateResult.message}`);
        return { success: false, message: updateResult.message || 'فشل تحديث البريد الإلكتروني.' };
      }
    } else {
      await logAction('ADMIN_EMAIL_UPDATE_FAILURE', 'ERROR', `Admin ${userId} failed to update email due to invalid credentials.`);
      return { success: false, message: 'كلمة المرور غير صحيحة. يرجى التأكد من إدخال كلمة المرور الحالية بشكل صحيح.' };
    }
  } catch (error: any) {
    await logAction('ADMIN_EMAIL_UPDATE_FAILURE', 'ERROR', `Error updating admin email: ${error.message}`);
    return { success: false, message: 'حدث خطأ أثناء تحديث البريد الإلكتروني.' };
  }
}

// دالة لجلب بيانات المشرف (Server Action)
export async function getAdminDataAction(adminId: string): Promise<{ success: boolean; user?: any; message?: string }> {
  try {
    const { findUserById } = await import('@/lib/db');
    const user = await findUserById(adminId);

    if (!user) {
      return { success: false, message: 'المستخدم غير موجود.' };
    }

    // تحويل البيانات إلى كائن بسيط لتجنب مشاكل التسلسل
    return {
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        id: user.id
      }
    };
  } catch (error: any) {
    console.error('Error in getAdminDataAction:', error);
    return { success: false, message: 'حدث خطأ أثناء جلب البيانات.' };
  }
}
