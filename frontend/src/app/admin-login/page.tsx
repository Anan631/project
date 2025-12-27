"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, ArrowLeft, Eye, EyeOff, Activity, AlertTriangle, Skull, Lock, Radiation } from 'lucide-react';
import { adminLoginAction } from './actions';
import { type LoginActionResponse } from '@/types/auth';

interface ExtendedLoginActionResponse extends LoginActionResponse {
  loginTime?: string;
}
import { useRouter } from 'next/navigation';

const adminLoginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  password_input: z.string().min(1, { message: "كلمة المرور مطلوبة." }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// مكون خلفية الشاشة مع تأثير كتابة برمجي باستخدام Canvas
const CodeBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const codeLines = [
    "SECURITY LEVEL: MAXIMUM",
    "ACCESS RESTRICTED TO AUTHORIZED PERSONNEL ONLY",
    "WARNING: UNAUTHORIZED ACCESS WILL BE PROSECUTED",
    "SYSTEM MONITORING ACTIVE - ALL ACTIVITIES LOGGED",
    "SECURITY BREACH DETECTED: ACTIVATING COUNTERMEASURES",
    "CRITICAL INFRASTRUCTURE ACCESS - AUTHORIZATION REQUIRED",
    "CLASSIFIED INFORMATION - HANDLE WITH EXTREME CAUTION",
    "TRESPASSERS WILL BE TRACKED AND PROSECUTED",
    "MULTI-FACTOR AUTHENTICATION REQUIRED FOR ACCESS",
    "SECURITY CLEARANCE LEVEL: OMEGA REQUIRED",
    "SYSTEM DEFENSE MECHANISMS: ARMED AND ACTIVE",
    "ALL ACCESS ATTEMPTS ARE BEING RECORDED AND MONITORED"
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    
    const fontSize = 16;
    const lineHeight = fontSize * 1.5;
    const maxLines = Math.floor(canvas.height / lineHeight);
    const linePositions: {y: number, line: string, alpha: number, color: string}[] = [];
    
    const addNewLine = () => {
      if (linePositions.length < maxLines) {
        const randomLine = codeLines[Math.floor(Math.random() * codeLines.length)];
        linePositions.push({
          y: -lineHeight,
          line: randomLine,
          alpha: 0.1,
          color: Math.random() > 0.7 ? 'rgba(239, 68, 68, ' : 'rgba(212, 175, 55, '
        });
      }
    };
    
    const drawLines = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `bold ${fontSize}px monospace`;
      
      for (let i = 0; i < linePositions.length; i++) {
        const pos = linePositions[i];
        ctx.fillStyle = `${pos.color}${pos.alpha})`;
        ctx.fillText(pos.line, 50, pos.y);
        
        pos.y += 0.8;
        if (pos.alpha < 0.6) pos.alpha += 0.003;
        
        if (pos.y > canvas.height + lineHeight) {
          linePositions.splice(i, 1);
          i--;
        }
      }
      
      if (Math.random() < 0.08) {
        addNewLine();
      }
      
      animationRef.current = requestAnimationFrame(drawLines);
    };
    
    drawLines();
    
    const handleResize = () => {
      resizeCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
};

// عناصر زخرفية متحركة مع طابع خطير
const DecorativeElements = () => {
  return (
    <>
      {/* خطوط رأسية متوهجة حمراء */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 w-1 h-64 bg-gradient-to-b from-transparent via-red-500/70 to-transparent rounded-full animate-pulse" />
      <div className="absolute right-10 top-1/2 -translate-y-1/2 w-1 h-64 bg-gradient-to-b from-transparent via-red-500/70 to-transparent rounded-full animate-pulse" />
      
      {/* نقاط متوهجة حمراء وصفراء */}
      <div className="absolute top-20 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      <div className="absolute bottom-20 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-red-400 rounded-full animate-ping" />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
      
      {/* رموز تحذيرية متحركة */}
      <div className="absolute top-10 left-10 animate-bounce">
        <AlertTriangle className="text-red-500 w-8 h-8" />
      </div>
      <div className="absolute bottom-10 right-10 animate-pulse">
        <Skull className="text-red-600 w-10 h-10" />
      </div>
      <div className="absolute top-10 right-1/4 animate-ping">
        <Radiation className="text-yellow-500 w-6 h-6" />
      </div>
      <div className="absolute bottom-10 left-1/4 animate-bounce delay-1000">
        <Lock className="text-red-500 w-8 h-8" />
      </div>
    </>
  );
};

// مكون تحذيري يظهر بشكل عشوائي
const RandomWarning = () => {
  const warnings = [
    "تحذير: منطقة محظورة - الدخول للمصرح لهم فقط",
    "تنبيه: جميع الأنشطة مراقبة وتسجل",
    "تحذير أمني: أي محاولة دخول غير مصرح بها ستتعقب",
    "تنبيه: هذا النظام محمي بأقصى درجات الأمان",
    "تحذير: المعلومات في هذا النظام سرية للغاية"
  ];
  
  const [visible, setVisible] = useState(false);
  const [warning, setWarning] = useState("");
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setWarning(warnings[Math.floor(Math.random() * warnings.length)]);
        setVisible(true);
        setTimeout(() => setVisible(false), 3000);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [warnings]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/90 border border-red-700 text-red-200 px-6 py-3 rounded-lg shadow-lg animate-pulse max-w-md text-center">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-bold">{warning}</span>
      </div>
    </div>
  );
};

export default function AdminLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password_input: "" }
  });

  const onSubmit: SubmitHandler<AdminLoginFormValues> = async (data) => {
    setIsLoading(true);
    
    try {
      const result: ExtendedLoginActionResponse = await adminLoginAction(data);
      setIsLoading(false);

      if (result.success) {
        toast({ 
          title: "تم التحقق بنجاح", 
          description: "تم التحقق من هويتك بنجاح. جاري التوجيه إلى لوحة التحكم.", 
          variant: "default", 
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

        if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          router.push('/admin'); 
        }
      } else {
        setFailedAttempts(prev => prev + 1);
        toast({ 
          title: "فشل التحقق من الهوية", 
          description: result.message || "بيانات الاعتماد غير صحيحة أو غير كافية للوصول.", 
          variant: "destructive", 
        });
        if (result.fieldErrors) {
          for (const [fieldName, fieldErrorMessages] of Object.entries(result.fieldErrors)) {
            if (fieldErrorMessages && fieldErrorMessages.length > 0) {
              setError(fieldName as keyof AdminLoginFormValues, { 
                type: "server", 
                message: fieldErrorMessages.join(", "), 
              });
            }
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      setFailedAttempts(prev => prev + 1);
      console.error("Admin login submission error:", error);
      toast({ 
        title: "خطأ في النظام", 
        description: "حدث خطأ غير متوقع أثناء محاولة الوصول. يرجى إبلاغ المسؤولين.", 
        variant: "destructive", 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 relative overflow-hidden flex items-center justify-center">
      {/* CSS المضمن */}
      <style jsx global>{`
        .input-field:focus + .input-label,
        .input-field:not(:placeholder-shown) + .input-label {
          transform: translateY(-1.8rem) scale(0.85);
          color: #dc2626;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.8));
          padding: 0 0.5rem;
          border-radius: 0.25rem;
          border-left: 2px solid #dc2626;
        }
        .login-card {
          background: rgba(0, 0, 0, 0.85);
          border: 1px solid rgba(220, 38, 38, 0.5);
          box-shadow: 0 0 40px rgba(220, 38, 38, 0.3), 0 10px 40px rgba(0, 0, 0, 0.5);
          position: relative;
          transition: all 0.5s ease-in-out;
          backdrop-filter: blur(10px);
        }
        .login-card:hover {
          box-shadow: 0 0 60px rgba(220, 38, 38, 0.5), 0 10px 40px rgba(0, 0, 0, 0.6);
        }
        .login-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          z-index: -1;
          border-radius: 1.25rem;
          background: #dc2626;
          opacity: 0.7;
          filter: blur(15px);
          clip-path: polygon(0 10px, 0 100%, calc(100% - 10px) 100%, 100% calc(100% - 10px), 100% 0, 10px 0);
        }
        .login-card-inner {
          position: relative;
          z-index: 1;
          clip-path: polygon(0 10px, 0 100%, calc(100% - 10px) 100%, 100% calc(100% - 10px), 100% 0, 10px 0);
          padding: 2px;
          background: linear-gradient(45deg, #dc2626, #7f1d1d);
        }
        .login-terminal-content {
          background: #0a0a0a;
          clip-path: polygon(0 10px, 0 100%, calc(100% - 10px) 100%, 100% calc(100% - 10px), 100% 0, 10px 0);
        }
        .danger-gradient-text {
          background: linear-gradient(90deg, #dc2626 30%, #fbbf24 70%, #dc2626 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .eye-btn {
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s;
        }
        .eye-btn:hover {
          background: rgba(220, 38, 38, 0.2);
          transform: scale(1.1);
        }
        .login-err {
          background: rgba(239, 68, 68, 0.2);
          border-right: 3px solid #ef4444;
          color: #fca5a5;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
        .submit-btn {
          background: linear-gradient(135deg, #dc2626, #f59e0b);
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        .submit-btn:hover::before {
          left: 100%;
        }
        .warning-border {
          animation: warning-pulse 2s infinite;
        }
        @keyframes warning-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(220, 38, 38, 0.5); }
          50% { box-shadow: 0 0 20px rgba(220, 38, 38, 0.8); }
        }
        .scanner-line {
          position: absolute;
          height: 3px;
          width: 100%;
          background: linear-gradient(90deg, transparent, #dc2626, transparent);
          top: 0;
          left: 0;
          animation: scan 3s linear infinite;
        }
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
      
      {/* مكونات الخلفية */}
      <CodeBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-0" />
      <DecorativeElements />
      <RandomWarning />
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-2rem)] py-8 w-full">
        <div className="w-full max-w-3xl px-2 sm:px-4">
          <div className="login-card rounded-2xl overflow-hidden p-0 transition-all duration-500 shadow-2xl warning-border relative">
            <div className="scanner-line"></div>
            <div className="login-card-inner">
              <div className="login-terminal-content p-6 sm:p-8">
                {/* الرأس */}
                <div className="text-center mb-8 flex flex-col items-center gap-2">
                  <div className="mx-auto w-fit p-4 rounded-full text-red-500 shadow-lg border border-red-500/50 relative">
                    <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping" />
                    <Shield className="w-14 h-14 relative z-10" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold danger-gradient-text mt-4 tracking-tight">
                    منطقة محظورة
                  </h1>
                  <p className="text-red-300 mt-2 text-base font-medium">
                    الوصول مقصور على الأشخاص المصرح لهم فقط
                  </p>
                  
                  <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-3 w-full">
                    <div className="flex items-center justify-center gap-2 text-red-300">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm">جميع محاولات الدخول يتم تسجيلها ومراقبتها</span>
                    </div>
                  </div>
                </div>
                
                {/* عداد المحاولات الفاشلة */}
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-red-700">
                    <Lock className="w-4 h-4 text-red-500" />
                    <span className="text-red-300 text-sm">المحاولات الفاشلة: {failedAttempts}</span>
                  </div>
                </div>
                
                {/* النموذج */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* حقل البريد الإلكتروني */}
                    <div className="relative">
                      <input
                        {...register("email")}
                        type="email"
                        id="email"
                        className={`w-full px-4 py-3 sm:py-4 bg-black/50 border ${errors.email ? 'border-red-500' : 'border-red-700'} rounded-lg text-white input-field focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-300 placeholder:text-gray-500`}
                        placeholder=" "
                      />
                      <label htmlFor="email" className="absolute right-4 top-3 sm:top-4 text-gray-500 transition-all duration-300 pointer-events-none input-label origin-right">
                        البريد الإلكتروني للمصرح له
                      </label>
                      {errors.email && (
                        <div className="login-err text-sm mt-2 text-right">
                          {errors.email.message}
                        </div>
                      )}
                    </div>
                    
                    {/* حقل كلمة المرور */}
                    <div className="relative">
                      <input
                        {...register("password_input")}
                        id="password_input"
                        type={showPassword ? "text" : "password"}
                        className={`w-full px-4 py-3 sm:py-4 bg-black/50 border ${errors.password_input ? 'border-red-500' : 'border-red-700'} rounded-lg text-white input-field focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-300 placeholder:text-gray-500 pr-14`}
                        placeholder=" "
                        autoComplete="current-password"
                      />
                      <label htmlFor="password_input" className="absolute right-4 top-3 sm:top-4 text-gray-500 transition-all duration-300 pointer-events-none input-label origin-right">
                        كلمة المرور السرية
                      </label>
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        className="eye-btn absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {errors.password_input && (
                        <div className="login-err text-sm mt-2 text-right">
                          {errors.password_input.message}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* رابط فقدان البيانات */}
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-red-400 hover:text-red-300 transition-colors font-bold"
                    >
                      فقدت بيانات الدخول؟ إبلاغ المسؤول
                    </Link>
                  </div>
                  
                  {/* زر الدخول */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="submit-btn w-full text-white font-extrabold py-3 sm:py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/40 disabled:opacity-70 transform hover:-translate-y-0.5 text-base sm:text-lg tracking-wide border-2 border-red-500/40"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        جاري التحقق من الهوية...
                      </>
                    ) : (
                      <>
                        <Activity className="w-5 h-5" />
                        تأكيد الهوية والدخول
                      </>
                    )}
                  </button>
                  
                  {/* رابط الخروج */}
                  <div className="text-center pt-4 border-t border-red-800/50">
                    <Link
                      href="/"
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1 font-bold"
                    >
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      الخروج من المنطقة المحظورة
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          {/* نص تحذيري في الأسفل */}
          
        </div>
      </div>
    </div>
  );
}