"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { Loader2, HardHat, Eye, EyeOff, ArrowLeft, LogIn, Building2, FileText, TrendingUp, Shield } from 'lucide-react';
import { loginUserAction } from './actions';
import { type LoginActionResponse } from '@/types/auth';
import { MaintenanceDialog } from '@/components/auth/MaintenanceDialog';

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  password_input: z.string().min(1, { message: "كلمة المرور مطلوبة." }),
});

type EngineerLoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userRole = localStorage.getItem("userRole");
    const userName = localStorage.getItem("userName");

    if (userRole === "ENGINEER") {
      toast({
        title: "تم تسجيل الدخول بالفعل",
        description: `مرحباً ${userName || "بعودتك"} أيها المهندس!`,
      });

      router.push("/engineer/dashboard");
    }
  }, [router, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<EngineerLoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password_input: "",
    },
  });

  const onSubmit: SubmitHandler<EngineerLoginFormValues> = async (data) => {
    setIsLoading(true);

    try {
      const result: LoginActionResponse = await loginUserAction(data);
      setIsLoading(false);

      if (result.success) {
        toast({
          title: "تسجيل دخول المهندس",
          description: result.message || "مرحباً بعودتك!",
        });

        reset();

        if (result.user) {
          // Dynamic import to avoid SSR issues
          const authUtils = await import('@/lib/auth-utils');
          authUtils.setAuthData({
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
          });
        }

        router.push(result.redirectTo || "/engineer/dashboard");
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
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            if (messages?.length) {
              const fixedField = field === "password" ? "password_input" : field;
              setError(fixedField as keyof EngineerLoginFormValues, {
                type: "server",
                message: messages.join(", "),
              });
            }
          });
        }
      }
    } catch (err) {
      setIsLoading(false);
      console.error(err);

      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء تسجيل الدخول. حاول مجدداً.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-250px)] flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">

        <div className="w-full max-w-6xl mx-auto rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white border border-slate-200">

          {/* RIGHT SIDE - FORM */}
          <div className="bg-slate-50 p-8 md:p-12 text-right flex flex-col justify-center">

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-app-red/10 rounded-full mb-4">
                <HardHat className="h-8 w-8 text-app-red" />
              </div>
              <h1 className="text-4xl font-bold text-slate-800">تسجيل دخول المهندس</h1>
              <p className="text-slate-600 mt-3 text-lg">أدخل بياناتك للوصول إلى أدواتك الهندسية.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Email */}
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="engineer@example.com"
                  className="text-lg py-3"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="password_input">كلمة المرور</Label>
                  <Link href="/engineer/forgot-password" className="text-xs text-blue-600 hover:underline">
                    هل نسيت كلمة المرور؟
                  </Link>
                </div>

                <div className="relative mt-2">
                  <Input
                    id="password_input"
                    type={showPassword ? "text" : "password"}
                    {...register("password_input")}
                    className="pr-10 text-lg py-3"
                    placeholder="********"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 px-3"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {errors.password_input && (
                  <p className="text-red-500 text-xs mt-1">{errors.password_input.message}</p>
                )}
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
                <Link href="/signup" className="text-green-700 font-semibold">
                  إنشاء حساب مهندس
                </Link>
              </p>

              <p>
                هل أنت مالك مشروع؟{" "}
                <Link href="/owner-login" className="text-blue-600 font-semibold">
                  تسجيل الدخول كمالك
                </Link>
              </p>
            </div>

          </div>

          {/* LEFT SIDE - IMAGE & BRANDING */}
          <div className="hidden lg:flex relative items-center justify-center p-12 bg-gradient-to-br from-app-red via-slate-900 to-slate-800 text-white">
            <Image
              src="/signup-bg.jpg"
              alt="خلفية هندسية"
              fill
              className="object-cover opacity-20"
            />

            <div className="relative z-10 text-right">
              <h2 className="text-5xl font-bold mb-6">أدواتك الهندسية في مكان واحد</h2>
              <p className="text-gray-300 mb-10 max-w-md text-lg">
                قم بإدارة مشاريعك، وحساب الكميات والتكاليف، والتواصل مع المالكين بسهولة.
              </p>

              <ul className="space-y-5 mb-8">
                <li className="flex items-start gap-3">
                  <Building2 className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">إدارة مشاريع متعددة بكفاءة</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">حساب دقيق للكميات والتكاليف</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">تقارير وإحصائيات متقدمة</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-7 w-7 text-app-gold" />
                  <span className="text-xl">تواصل مباشر مع المالكين</span>
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
