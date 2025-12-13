'use server';

import { z } from 'zod';
import { resetPasswordWithToken } from '@/lib/db';

export const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." }),
  confirmPassword: z.string(),
  token: z.string().min(1, { message: "الرمز غير موجود." }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordActionResponse {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function resetPasswordAction(
  data: ResetPasswordFormValues,
): Promise<ResetPasswordActionResponse> {
  const validation = resetPasswordSchema.safeParse(data);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: "البيانات المدخلة غير صالحة.",
      fieldErrors: {
          password: fieldErrors.password,
          confirmPassword: fieldErrors.confirmPassword,
      }
    };
  }

  // Explicit check for password matching
  if (data.password !== data.confirmPassword) {
    return {
      success: false,
      message: "كلمتا المرور غير متطابقتين.",
      fieldErrors: {
        confirmPassword: ["كلمتا المرور غير متطابقتين."],
      },
    };
  }


  const { token, password } = validation.data;

  const result = await resetPasswordWithToken(token, password);

  return result;
}

// Schema for forgot password form
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  phone: z.string().min(10, { message: "رقم الهاتف يجب أن يكون 10 أرقام على الأقل." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export async function forgotPasswordAction(
  data: ForgotPasswordFormValues,
): Promise<ResetPasswordActionResponse> {
  const validation = forgotPasswordSchema.safeParse(data);

  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      success: false,
      message: "البيانات المدخلة غير صالحة.",
      fieldErrors: {
          email: fieldErrors.email,
          phone: fieldErrors.phone,
      }
    };
  }

  // TODO: Implement actual forgot password logic
  // This should send a reset token to the user via email or SMS
  
  return {
    success: true,
    message: "تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني ورقم هاتفك."
  };
}