"use client";

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { resetPasswordAction } from './actions';
import { resetPasswordSchema } from './schema';

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    const level = Math.min(Math.floor(strength / 2), 3);
    
    const strengthMap: Record<number, { text: string; color: string }> = {
      0: { text: 'ضعيفة جداً', color: 'bg-red-500' },
      1: { text: 'ضعيفة', color: 'bg-red-400' },
      2: { text: 'متوسطة', color: 'bg-yellow-500' },
      3: { text: 'قوية', color: 'bg-green-500' }
    };
    
    return { level, ...strengthMap[level] };
  };
  
  const { level, text, color } = getStrength(password);
  
  return (
    <div className="mt-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">قوة كلمة المرور</span>
        <span className={`text-xs ${color.replace('bg-', 'text-')}`}>{text}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${color}`} 
          style={{ width: `${(level + 1) * 25}%` }}
        ></div>
      </div>
    </div>
  );
}

function EngineerResetPasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm<Omit<ResetPasswordFormValues, 'token'>>({
    resolver: zodResolver(resetPasswordSchema.omit({ token: true })),
  });
  
  const password = watch('password', '');

  const onSubmit: SubmitHandler<Omit<ResetPasswordFormValues, 'token'>> = async (data) => {
    if (!token) {
      setErrorState("رابط إعادة التعيين غير صالح أو مفقود.");
      return;
    }

    setIsLoading(true);
    setErrorState(null);

    try {
      const result = await resetPasswordAction({ ...data, token });
      
      setIsLoading(false);

      if (result.success) {
        setSuccess(true);
        toast({
          title: "تم تغيير كلمة المرور",
          description: result.message,
          variant: "default",
        });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        toast({
          title: "خطأ",
          description: result.message,
          variant: "destructive",
        });
        if (result.fieldErrors) {
          for (const [fieldName, fieldErrorMessages] of Object.entries(result.fieldErrors)) {
            if (fieldErrorMessages && fieldErrorMessages.length > 0) {
              setError(fieldName as keyof Omit<ResetPasswordFormValues, 'token'>, {
                type: "server",
                message: fieldErrorMessages.join(", "),
              });
            }
          }
        } else {
          setErrorState(result.message);
        }
      }
    } catch (err) {
      setIsLoading(false);
      setErrorState("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 py-8 animate-fade-in">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">تم بنجاح!</h2>
          <p className="text-gray-600 max-w-xs mx-auto">تم إعادة تعيين كلمة مرورك بنجاح. سيتم توجيهك إلى صفحة تسجيل الدخول.</p>
        </div>
        <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
          <Link href="/login">تسجيل الدخول الآن</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-6 py-8 animate-fade-in">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">حدث خطأ</h2>
          <p className="text-gray-600 max-w-xs mx-auto">{error}</p>
        </div>
        <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
          <Link href="/engineer/forgot-password">طلب رابط جديد</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-right">
      <div>
        <Label htmlFor="password" className="block mb-2 font-semibold text-gray-700">كلمة المرور الجديدة</Label>
        <div className="relative">
          <Input 
            id="password" 
            type={showPassword ? "text" : "password"} 
            {...register("password")} 
            className="bg-white focus:border-blue-500 focus:ring-blue-500 pr-10 py-2.5 rounded-lg border-2"
            placeholder="أدخل كلمة المرور الجديدة" 
          />
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        <PasswordStrengthIndicator password={password} />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="block mb-2 font-semibold text-gray-700">تأكيد كلمة المرور الجديدة</Label>
        <div className="relative">
          <Input 
            id="confirmPassword" 
            type={showConfirmPassword ? "text" : "password"} 
            {...register("confirmPassword")} 
            className="bg-white focus:border-blue-500 focus:ring-blue-500 pr-10 py-2.5 rounded-lg border-2"
            placeholder="أكد كلمة المرور الجديدة" 
          />
          <button
            type="button"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2 space-x-reverse">
          <div className="text-sm text-blue-700">
            <p className="font-semibold">نصائح لكلمة المرور القوية:</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>✓ استخدم 8 أحرف على الأقل</li>
              <li>✓ ادمج بين الأحرف الكبيرة والصغيرة</li>
              <li>✓ استخدم أرقام ورموز مثل @#$%^&*</li>
            </ul>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-base mt-6" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="ms-2 h-5 w-5 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          <>
            <KeyRound className="ms-2 h-5 w-5" />
            حفظ كلمة المرور الجديدة
          </>
        )}
      </Button>
    </form>
  );
}

export default function EngineerResetPasswordPage() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white/95 shadow-xl border-0 rounded-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <KeyRound className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800">إعادة تعيين كلمة المرور</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                أدخل كلمة المرور الجديدة لحسابك
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <EngineerResetPasswordForm />
              </Suspense>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-gray-200">
              <Link href="/engineer/forgot-password" className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors">
                العودة إلى نسيان كلمة المرور
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}