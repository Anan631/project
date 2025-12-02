"use server";

import { z } from 'zod';
import { updateUserProfile, changeUserPassword, deleteUserSelf, getUserById } from '@/lib/db';
import type { UserDocument } from '@/lib/db';

// Schema for updating profile
const updateProfileSchema = z.object({
  userId: z.string().min(1, { message: "معرف المستخدم مطلوب." }), // تم التصحيح
  name: z.string().min(3, { message: "الاسم مطلوب (3 أحرف على الأقل)." }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  phone: z.string().optional(),
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export async function getUserProfile(userId: string): Promise<Omit<UserDocument, 'password_hash'> | null> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return null;
    }

    // Remove password hash from returned object
    const { password_hash, ...userProfile } = user;
    return userProfile;
  } catch (error) {
    console.error(`[GetUserProfile] Error fetching user ${userId}:`, error);
    return null;
  }
}

export interface UpdateProfileResult {
  success: boolean;
  message: string;
  user?: Omit<UserDocument, 'password_hash'>;
  fieldErrors?: Record<string, string[]>;
}

export async function updateProfileAction(
  data: UpdateProfileFormValues
): Promise<UpdateProfileResult> {
  console.log(`[UpdateProfileAction] User ${data.userId} attempting to update profile.`);

  const validation = updateProfileSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "بيانات غير صالحة.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const result = await updateUserProfile(validation.data);

  if (!result.success) {
    return {
      success: false,
      message: result.message || "فشل تحديث الملف الشخصي.",
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    success: true,
    message: result.message || "تم تحديث الملف الشخصي بنجاح.",
    user: result.user,
  };
}

// Schema for changing password
const changePasswordSchema = z.object({
  userId: z.string().min(1, { message: "معرف المستخدم مطلوب." }), // تم التصحيح
  currentPassword: z.string().min(6, { message: "كلمة المرور الحالية مطلوبة." }),
  newPassword: z.string().min(6, { message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." }),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export interface ChangePasswordResult {
  success: boolean;
  message: string;
  errorType?: 'invalid_current_password' | 'server_error';
}

export async function changePasswordAction(
  data: ChangePasswordFormValues
): Promise<ChangePasswordResult> {
  console.log(`[ChangePasswordAction] User ${data.userId} attempting to change password.`);

  const validation = changePasswordSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "بيانات غير صالحة.",
    };
  }

  const result = await changeUserPassword(validation.data);

  if (!result.success) {
    return {
      success: false,
      message: result.message || "فشل تغيير كلمة المرور.",
      errorType: result.errorType,
    };
  }

  return {
    success: true,
    message: result.message || "تم تغيير كلمة المرور بنجاح.",
  };
}

// Schema for deleting account - تم تعديله ليكون متسقاً
const deleteAccountSchema = z.object({
  userId: z.string().min(1, { message: "معرف المستخدم مطلوب." }), // تم التصحيح
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

// تم تعديل توقيع الدالة ليستقبل كائن data
export async function deleteUserAccountAction(
  data: DeleteAccountFormValues
): Promise<{ success: boolean, message?: string }> {
  console.log(`[DeleteUserAccountAction] User ${data.userId} attempting to delete own account.`);

  const validation = deleteAccountSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: "معرف المستخدم مطلوب." };
  }

  try {
    // استخدام deleteUserSelf بدلاً من deleteUser
    const result = await deleteUserSelf(validation.data.userId);

    if (!result.success) {
      return {
        success: false,
        message: result.message || "فشل حذف الحساب.",
      };
    }

    return {
      success: true,
      message: result.message || "تم تعطيل حسابك بنجاح.",
    };
  } catch (error) {
    console.error("[DeleteUserAccountAction] Unexpected error:", error);
    return {
      success: false,
      message: "حدث خطأ غير متوقع أثناء حذف الحساب.",
    };
  }
}