'use server';

import { z } from 'zod';
import { logAction, findUserByEmail, createPasswordResetToken } from '@/lib/db';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  phone: z.string().min(10, { message: "رقم الهاتف غير صالح." }),
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

  if (user && user.phone === phone) {
    // User exists and phone number matches.
    const tokenResult = await createPasswordResetToken(email);

    if (tokenResult.success && tokenResult.token && tokenResult.userId) {
      // Generate role-specific reset link
      const baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        throw new Error('BASE_URL environment variable is required');
      }
      
      let resetLink = `${baseUrl}/reset-password?token=${tokenResult.token}`;
      
      if (user.role === 'ENGINEER') {
        resetLink = `${baseUrl}/engineer/reset-password?token=${tokenResult.token}`;
      } else if (user.role === 'OWNER') {
        resetLink = `${baseUrl}/owner/reset-password?token=${tokenResult.token}`;
      }
      
      // --- SIMULATE SENDING SMS ---
      // In a real application, you would integrate with an SMS gateway like Twilio here.
      // For development, we will log the reset link to the server console.
      if (process.env.NODE_ENV === 'development') {
        console.log('--- SMS SIMULATION ---');
        console.log(`To: ${phone}`);
        console.log(`Message: Your password reset link is: ${resetLink}`);
        console.log('--- END SMS SIMULATION ---');
      }

      await logAction('PASSWORD_RESET_SMS_SENT_SIMULATED', 'INFO', `Password reset link (simulated SMS) generated for: ${email}`, tokenResult.userId);
    }
  } else {
    // User does not exist, or phone number doesn't match.
    // We log this for admin, but don't tell the user.
    await logAction(
      'PASSWORD_RESET_REQUEST_INVALID', 
      'INFO', 
      `Password reset requested for email: ${email}, but user not found or phone number did not match.`
    );
  }

  // IMPORTANT: Always return a generic success message to prevent user enumeration.
  // This is a crucial security practice.
  return {
    success: true,
    message: `إذا كانت معلوماتك صحيحة، فستتلقى رسالة نصية تحتوي على رابط لإعادة تعيين كلمة المرور قريبًا.`,
  };
}
