import { z } from 'zod';

export const updateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().min(3, { message: "اسم المشروع مطلوب (3 أحرف على الأقل)." }),
  location: z.string().min(3, { message: "موقع المشروع مطلوب." }),
  // وصف المشروع اختياري في التعديل؛ إذا أُدخل نص غير فارغ يُشترط الطول الأدنى
  description: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().min(10, { message: "وصف المشروع مطلوب (10 أحرف على الأقل)." }).optional()
  ),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "تاريخ البدء غير صالح." }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "تاريخ الانتهاء غير صالح." }),
  status: z.enum(['مخطط له', 'قيد التنفيذ', 'مكتمل', 'مؤرشف']),
  clientName: z.string().min(3, { message: "اسم العميل/المالك مطلوب." }),
  budget: z.preprocess(
    (val) => {
      if (val === '' || val === null || typeof val === 'undefined') return undefined;
      if (typeof val === 'string' && val.trim() === '') return undefined;
      const num = typeof val === 'string' ? Number(val) : val;
      return Number.isFinite(num as number) ? (num as number) : undefined;
    },
    z.number().positive({ message: "الميزانية يجب أن تكون رقمًا موجبًا." }).optional()
  ),
  // بريد المالك اختياري في التعديل؛ إذا كانت القيمة فارغة يتم تحويلها إلى undefined
  linkedOwnerEmail: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().email({ message: "بريد المالك الإلكتروني غير صالح." }).optional()
  ),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "تاريخ الانتهاء يجب أن يكون بعد أو نفس تاريخ البدء.",
  path: ["endDate"],
});

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;