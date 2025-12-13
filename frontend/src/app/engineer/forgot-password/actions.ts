'use server';

import { z } from 'zod';
import { logAction, findUserByEmail, createPasswordResetTokenWithEmail } from '@/lib/db';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  phone: z.string().optional(),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordActionResponse {
  success: boolean;
  message: string;
}

export async function forgotPasswordAction(
  data: ForgotPasswordFormValues
): Promise<ForgotPasswordActionResponse> {
  const validation = forgotPasswordSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      message: "البيانات المدخلة غير صالحة.",
    };
  }

  const { email, phone } = validation.data;
  
  const user = await findUserByEmail(email);

  if (user && user.role === 'ENGINEER') {
    // User exists and is an ENGINEER.
    // Phone number is optional - only check if provided
    if (phone && user.phone !== phone) {
      // Phone was provided but doesn't match
      await logAction(
        'PASSWORD_RESET_REQUEST_INVALID', 
        'INFO', 
        `Password reset requested for email: ${email}, but phone number did not match.`
      );
    } else {
      // Email matches and user is engineer (phone optional or correct)
      const tokenResult = await createPasswordResetTokenWithEmail(email, 'ENGINEER');

      if (tokenResult.success && tokenResult.token && tokenResult.userId) {
        await logAction('PASSWORD_RESET_EMAIL_REQUESTED', 'INFO', `Password reset email requested for engineer: ${email}`, tokenResult.userId);
      }
    }
  } else {
    // User does not exist or is not an ENGINEER.
    // We log this for admin, but don't tell the user.
    await logAction(
      'PASSWORD_RESET_REQUEST_INVALID', 
      'INFO', 
      `Password reset requested for email: ${email}, but engineer not found.`
    );
  }

  // IMPORTANT: Always return a generic success message to prevent user enumeration.
  // This is a crucial security practice.
  return {
    success: true,
    message: `إذا كانت معلوماتك صحيحة، فستتلقى رسالة بريد إلكترونية تحتوي على رابط لإعادة تعيين كلمة المرور قريبًا.`,
  };
}
