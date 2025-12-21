'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { APP_LOGO_SRC } from '@/lib/branding';

interface InitialLoaderProps {
  children: ReactNode;
}

const InitialLoader = ({ children }: InitialLoaderProps) => {
  const [showLoader, setShowLoader] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  const loadingSteps = [
    { text: "تحميل النواة", detail: "Loading system core...", icon: "⚙️", color: "from-blue-500 to-cyan-400" },
    { text: "تهيئة الأدوات", detail: "Initializing tools...", icon: "🛠️", color: "from-purple-500 to-violet-400" },
    { text: "الاتصال بالخوادم", detail: "Connecting to servers...", icon: "🌐", color: "from-green-500 to-emerald-400" },
    { text: "تحميل الواجهة", detail: "Rendering interface...", icon: "🎨", color: "from-pink-500 to-rose-400" },
    { text: "اللمسات الأخيرة", detail: "Finalizing...", icon: "✨", color: "from-yellow-500 to-amber-400" },
    { text: "جاهز للانطلاق", detail: "Ready to go!", icon: "🚀", color: "from-orange-500 to-red-400" },
  ];

  const loadingMessages = [
    "تحميل قاعدة البيانات...",
    "تهيئة الحاسبة الذكية...",
    "معالجة البيانات...",
    "تحميل الخوارزميات...",
    "تجهيز التقارير...",
    "تحديث الأسعار...",
    "تهيئة الطباعة...",
    "تحميل الشعارات...",
    "فحص الاتصال...",
    "تحسين الأداء...",
    "تحميل الإعدادات...",
    "تجهيز الواجهة...",
    "تحديث التطبيق...",
    "إعداد الأمان...",
    "تحميل الخطوط...",
    "معايرة النظام...",
    "تحديث القوائم...",
    "تحضير البيانات...",
    "تحميل الأيقونات...",
    "تهيئة الذاكرة...",
    "فحص التحديثات...",
    "تحميل الموارد...",
    "إعداد الحسابات...",
    "تحضير التقارير...",
    "تحديث الواجهة...",
    "تحميل النسخ الاحتياطية...",
    "تهيئة المطبوعات...",
    "فحص الملفات...",
    "تحديث الإعدادات...",
    "تجهيز النهائي..."
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    // تسريع التحميل: زيادة increment وتقليل عدد الجسيمات وتقليل الأنيميشن
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // زيادة السرعة
        const increment = prev < 60 ? 8 : prev < 90 ? 4 : 2.5;
        return Math.min(prev + increment + Math.random() * 0.5, 100);
      });
    }, 30); // أسرع

    // تحديث الوقت كل 200ms فقط
    const timerInterval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
      }
    }, 200);

    // تحديث الرسائل كل 1.5 ثانية فقط
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timerInterval);
      clearInterval(messageInterval);
    };
  }, []);

  useEffect(() => {
    const stepProgress = (progress / 100) * loadingSteps.length;
    const stepIndex = Math.floor(stepProgress);
    setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));
  }, [progress, loadingSteps.length]);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setFadeOut(true), 200);
      setTimeout(() => setShowLoader(false), 600);
    }
  }, [progress]);

  const stepProgressFraction = (progress / 100) * loadingSteps.length;
  const stepInnerProgress = (stepProgressFraction % 1) * 100;

  if (!showLoader) return <>{children}</>;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-700 ease-out ${fadeOut ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}>
      {/* الخلفية المتحركة */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900">
        {/* الشبكة المتحركة */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
            animation: 'gridMove 20s linear infinite'
          }}
        />

        {/* الجسيمات المتحركة */}
        {/* تقليل الجسيمات المتحركة لأقصى حد لتسريع الأداء */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full opacity-10"
              style={{
                left: `${(i * 17) % 100}%`,
                top: `${(i * 31) % 100}%`,
                animation: `float ${4 + i % 3}s ease-in-out infinite`,
                animationDelay: `${i * 0.7}s`
              }}
            />
          ))}
        </div>

        {/* الهالات المتوهجة */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-red-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* المحتوى */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* الشعار مع إضافة صورة الشعار فقط */}
        <div className="relative mb-10">
          <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400/20 via-red-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/10 via-red-400/10 to-yellow-400/10 rounded-full blur-2xl animate-spin" style={{ animationDuration: '8s' }} />
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border-2 border-gray-700/50 shadow-2xl backdrop-blur-sm p-2 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sweep" />
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-400">
                <Image
                  src={APP_LOGO_SRC}
                  alt="شعار الموقع"
                  width={96}
                  height={96}
                  priority
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>

        {/* العنوان المحسن */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-5xl font-bold text-white tracking-wide">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-red-400 bg-clip-text text-transparent animate-pulse">
              المحترف
            </span>
            <span className="text-white mx-3">لحساب</span>
            <span className="bg-gradient-to-r from-red-400 via-rose-400 to-yellow-400 bg-clip-text text-transparent animate-pulse" style={{ animationDelay: '0.5s' }}>
              الكميات
            </span>
          </h1>
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-glow" />
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
            Professional Quantity Calculation System
          </p>
        </div>

        {/* عداد التقدم المحسن */}
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold mb-3 relative">
              <span className="bg-gradient-to-r from-yellow-400 to-red-400 bg-clip-text text-transparent animate-pulse">
                {String(Math.round(progress)).padStart(2, '0')}
              </span>
              <span className="text-gray-500 text-3xl">%</span>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-red-400/20 rounded-lg blur-xl animate-pulse" />
            </div>
          </div>

          {/* شريط التقدم المطور */}
          <div className="relative">
            <div className="h-4 bg-gray-800/80 rounded-full border border-gray-700/50 overflow-hidden backdrop-blur-sm shadow-inner relative">
              <div
                className={`h-full bg-gradient-to-r ${loadingSteps[currentStep]?.color} transition-all duration-500 ease-out relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent to-black/30" />
              </div>
            </div>
            {/* مؤشر التقدم */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full shadow-lg animate-pulse"
              style={{ left: `${progress}%`, marginLeft: '-12px' }}
            />
          </div>
        </div>

        {/* المرحلة الحالية المحسنة */}
        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/40 rounded-2xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent animate-sweep" />
          <div className="flex items-center space-x-4 rtl:space-x-reverse relative z-10">
            <div className="relative">
              <div className="text-3xl animate-bounce">{loadingSteps[currentStep]?.icon}</div>
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/20 to-red-400/20 rounded-full blur-lg animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-lg text-right animate-pulse">
                {loadingSteps[currentStep]?.text}
              </p>
              <p className="text-gray-400 text-sm text-right">
                {loadingSteps[currentStep]?.detail}
              </p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-800/60 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${loadingSteps[currentStep]?.color} transition-all duration-500 relative`}
              style={{ width: `${stepInnerProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* معلومات الأداء المحسنة */}
        <div className="grid grid-cols-3 gap-6 text-center text-sm mt-8">
          {[
            { value: `${Math.round(progress * 0.8)}MB`, label: "الذاكرة", color: "text-blue-400" },
            { value: `${Math.round(progress * 0.6)}%`, label: "المعالج", color: "text-green-400" },
            { value: elapsedTime ? `${elapsedTime}s` : '--', label: "الزمن", color: "text-yellow-400" }
          ].map((item, index) => (
            <div key={index} className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
              <div className={`${item.color} font-mono text-lg font-bold animate-pulse`}>
                {item.value}
              </div>
              <div className="text-gray-400 text-xs mt-1">{item.label}
              </div>
            </div>
          ))}
        </div>

        {/* النص السفلي المحسن */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-3 text-gray-400 text-lg font-bold">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full animate-pulse shadow-lg" />
            <span className="animate-pulse text-yellow-400 drop-shadow-lg">جاري التحميل...</span>
            <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-yellow-400 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '0.5s' }} />
            <span className="animate-pulse text-red-400 drop-shadow-lg" style={{ animationDelay: '1s' }}>المرجو الانتظار</span>
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(80px, 80px); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-sweep {
          animation: sweep 3s infinite;
        }
        .animate-glow {
          animation: glow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default InitialLoader;