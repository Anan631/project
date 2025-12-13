import { z } from 'zod';

export const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." }),
  confirmPassword: z.string(),
  token: z.string().min(1, { message: "الرمز غير موجود." }),
});
