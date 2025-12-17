"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Home as HomeIcon, ArrowLeft, Eye, EyeOff, LogIn, Building2, Clock, TrendingUp, Shield } from 'lucide-react';
import { ownerLoginAction } from './actions';
import { type LoginActionResponse } from '@/types/auth';
import { MaintenanceDialog } from '@/components/auth/MaintenanceDialog';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ownerLoginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  password_input: z.string().min(1, { message: "كلمة المرور مطلوبة." }),
});

type OwnerLoginFormValues = z.infer<typeof ownerLoginSchema>;

export default function OwnerLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('userRole');
      const userName = localStorage.getItem('userName');
      if (userRole === 'OWNER') {
        toast({
          title: "تم تسجيل الدخول بالفعل",
          description: `مرحباً ${userName || 'بعودتك'} أيها المالك!`,
        });
        router.push('/owner/dashboard');
      }
    }
  }, [router, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError
  } = useForm<OwnerLoginFormValues>({
    resolver: zodResolver(ownerLoginSchema),
    defaultValues: {
      email: "",
      password_input: "",
    }
  });

  const onSubmit: SubmitHandler<OwnerLoginFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const result: LoginActionResponse = await ownerLoginAction(data);
      setIsLoading(false);

      if (result.success) {
        toast({
          title: "تسجيل دخول المالك",
          description: result.message || "مرحباً بعودتك!",
        });

        reset();

        if (result.user && typeof window !== 'undefined') {
          // Dynamic import to avoid SSR issues
          const authUtils = await import('@/lib/auth-utils');
          authUtils.setAuthData({
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
          });
        }

        router.push(result.redirectTo || '/owner/dashboard');
      } else {
        if (result.errorType === 'maintenance_mode') {
          setShowMaintenanceDialog(true);
        } else {
          toast({
            title: "خطأ في تسجيل الدخول",
            description: result.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
            variant: "destructive",
          });
        }

        if (result.fieldErrors) {
          for (const [fieldName, fieldErrorMessages] of Object.entries(result.fieldErrors)) {
            if (fieldErrorMessages?.length) {
              setError(fieldName as keyof OwnerLoginFormValues, {
                type: "server",
                message: fieldErrorMessages.join(", "),
              });
            }
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Owner login submission error:", error);
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-250px)] flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="w-full max-w-6xl mx-auto rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white border border-slate-200">

          {/* Right side - Form */}
          <div className="bg-slate-50 p-8 md:p-12 text-right flex flex-col justify-center">

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-app-red/10 rounded-full mb-4">
                <HomeIcon className="h-8 w-8 text-app-red" />
              </div>
              <h1 className="text-4xl font-bold text-slate-800">تسجيل دخول المالك</h1>
              <p className="text-slate-600 mt-3 text-lg">أدخل بياناتك للوصول إلى لوحة متابعة مشاريعك.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Email */}
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" {...register("email")} placeholder="owner@example.com" className="text-lg py-3" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between mb-2">
                  <Label htmlFor="password_input">كلمة المرور</Label>
                  <Link href="/owner/forgot-password" className="text-xs text-blue-600">هل نسيت كلمة المرور؟</Link>
                </div>

                <div className="relative">
                  <Input
                    id="password_input"
                    type={showPassword ? "text" : "password"}
                    {...register("password_input")}
                    placeholder="********"
                    className="text-lg py-3 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 px-3"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {errors.password_input && <p className="text-red-500 text-xs mt-1">{errors.password_input.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-app-red text-white py-3 text-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
              </Button>
            </form>

            {/* Links */}
            <div className="text-center text-sm text-slate-600 mt-8 space-y-2">
              <p>
                ليس لديك حساب؟{" "}
                <Link href="/owner-signup" className="text-green-700 font-semibold">
                  إنشاء حساب مالك
                </Link>
              </p>

              <p>
                هل أنت مهندس؟{" "}
                <Link href="/login" className="text-blue-600 font-semibold">
                  تسجيل الدخول كمهندس
                </Link>
              </p>
            </div>

          </div>

          {/* Left side */}
          <div className="hidden lg:flex relative items-center justify-center p-12 bg-gradient-to-br from-app-red via-slate-900 to-slate-800 text-white">
            <div className="absolute inset-0">
              <Image
                src="/owner-login-bg.jpg"
                alt="خلفية معمارية"
                fill
                className="object-cover opacity-20"
              />
            </div>

            <div className="relative z-10 text-right">
              <h2 className="text-5xl font-bold mb-6">تابع مشروعك لحظة بلحظة</h2>

              <ul className="space-y-5 mb-8">
                <li className="flex items-start gap-3">
                  <Building2 className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">متابعة جميع المشاريع من مكان واحد</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">تحديثات فورية عن التقدم في العمل</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">تقارير مفصلة عن التكاليف</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">حماية بياناتك</span>
                </li>
              </ul>

              <Button variant="outline" asChild className="mt-12 bg-transparent border-2 border-app-gold text-app-gold hover:bg-app-gold hover:text-slate-900 shadow-md transition-all duration-300">
                <Link href="/">
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة إلى الرئيسية
                </Link>
              </Button>
            </div>

          </div>

        </div>
      </div>
      <MaintenanceDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog} />
    </AppLayout >
  );
}
