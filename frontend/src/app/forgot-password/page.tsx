"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, MessageSquareText, Mail, Phone, ArrowRight, Shield } from 'lucide-react';
import { forgotPasswordAction } from './actions';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  phone: z.string().min(10, { message: "رقم الهاتف يجب أن يكون 10 أرقام على الأقل." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
    setIsLoading(true);
    const result = await forgotPasswordAction(data);
    setIsLoading(false);

    // Always show a generic success message for security reasons
    toast({
      title: "تم إرسال التعليمات",
      description: result.message,
      variant: "default",
    });
    
    if (result.success) {
      reset();
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        {/* عناصر زخرفية في الخلفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-app-red/10 dark:bg-app-red/5 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-app-gold/10 dark:bg-app-gold/5 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* شارة الأمان */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-app-red to-red-600 rounded-full shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            {/* شريط علوي ملون */}
            <div className="h-2 bg-gradient-to-r from-app-red via-red-500 to-amber-500"></div>
            
            <CardHeader className="text-center space-y-3 pt-8">
              <CardTitle className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                استعادة كلمة المرور
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-base">
                أدخل بريدك الإلكتروني ورقم هاتفك المرتبط بحسابك
                <br />
                وسنرسل لك رمز إعادة التعيين عبر رسالة نصية (SMS)
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* حقل البريد الإلكتروني */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                      البريد الإلكتروني المسجل
                    </Label>
                    {errors.email && (
                      <span className="text-sm text-red-500 font-medium">
                        {errors.email.message}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-app-gold transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className={`pl-4 pr-10 py-6 h-12 text-right rounded-xl border-2 transition-all duration-200
                        ${errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:border-app-gold focus:ring-4 focus:ring-amber-500/20'
                        }
                        bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                        placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      placeholder="example@domain.com"
                    />
                  </div>
                </div>

                {/* حقل رقم الهاتف */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">
                      رقم الهاتف (مع المقدمة الدولية)
                    </Label>
                    {errors.phone && (
                      <span className="text-sm text-red-500 font-medium">
                        {errors.phone.message}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-app-gold transition-colors" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      className={`pl-4 pr-10 py-6 h-12 text-right rounded-xl border-2 transition-all duration-200
                        ${errors.phone 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 dark:border-slate-700 focus:border-app-gold focus:ring-4 focus:ring-amber-500/20'
                        }
                        bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                        placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                      placeholder="+97059XXXXXXX"
                    />
                  </div>
                </div>

                {/* زر الإرسال */}
                <Button
                  type="submit"
                  className="w-full group relative bg-gradient-to-r from-app-red to-red-600 hover:from-red-700 hover:to-red-700 
                    text-white font-bold py-6 rounded-xl text-base transition-all duration-300 
                    shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-3 h-5 w-5 animate-spin" />
                      جاري إرسال التعليمات...
                    </>
                  ) : (
                    <>
                      <MessageSquareText className="ml-3 h-5 w-5" />
                      إرسال رمز إعادة التعيين
                      <ArrowRight className="mr-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>

                {/* معلومات إضافية */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <KeyRound className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      ستتلقى رسالة نصية (SMS) تحتوي على رمز آمن لإعادة تعيين كلمة المرور في غضون دقائق قليلة.
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <Link 
                href="/login" 
                className="group flex items-center justify-center text-app-gold hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-medium text-sm transition-colors"
              >
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                العودة إلى تسجيل الدخول
              </Link>
            </CardFooter>
          </Card>

          {/* حقوق النشر */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} نظام إدارة المهندسين. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}