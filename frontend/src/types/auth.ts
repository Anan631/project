// src/types/auth.ts

/**
 * يمثل استجابة دالة الـ Server Action لتسجيل الدخول.
 * يوفر معلومات حول نجاح العملية، الرسالة، إعادة التوجيه، وأخطاء الحقول.
 */
export type LoginActionResponse = {
  success: boolean;
  message?: string;
  redirectTo?: string;
  errorType?: string; // Added this property
  fieldErrors?: {
    email?: string[];
    password?: string[];
    [key: string]: string[] | undefined; // للسماح بأخطاء حقول إضافية
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role: string; // UserRole as a string
  };
};

