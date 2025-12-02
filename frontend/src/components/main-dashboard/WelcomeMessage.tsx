"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  Construction, 
  Calculator, 
  TrendingUp, 
  X,
  Target,
  Clock,
  ShieldCheck,
  Zap,
  Rocket,
  Award,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WelcomeMessage() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showDetails, setShowDetails] = useState(false);
  const [step, setStep] = useState(0);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // عند تحميل المكون، ننتظر قليلاً قبل تطبيق الحركات
    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
      setStep(1);
    }, 300);

    // تغيير الخطوات بعد فترة
    const stepTimer = setInterval(() => {
      setStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 1500);

    // تحميل الشريط التقدمي
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return prev - (100 / 70); // 7 ثواني = 70 * 100ms
      });
    }, 100);

    // إخفاء تلقائي بعد 7 ثوانٍ
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 7000);

    // تنظيف المؤقتات عند إلغاء تحميل المكون
    return () => {
      clearTimeout(loadTimer);
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const features = [
    {
      icon: <Calculator className="h-5 w-5" />,
      title: "حسابات دقيقة",
      description: "دقة حسابية تصل إلى 99.9%"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "توفير الوقت",
      description: "وفر 80% من وقت الحسابات"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "نتائج موثوقة",
      description: "نتائج معتمدة هندسياً"
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "أمان كامل",
      description: "حماية كاملة للبيانات"
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.98) 100%)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* تأثيرات الخلفية */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          {/* البطاقة الرئيسية */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ 
              scale: isLoaded ? 1 : 0.9, 
              y: isLoaded ? 0 : 20, 
              opacity: isLoaded ? 1 : 0 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 md:p-12 max-w-4xl w-full mx-auto border border-slate-700/50 overflow-hidden"
          >
            {/* زر الإغلاق */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 backdrop-blur-sm transition-colors"
            >
              <X className="h-5 w-5 text-slate-300" />
            </motion.button>

            {/* شارة التميز */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 rounded-full border border-amber-500/30 backdrop-blur-sm">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">منصة موصى بها</span>
            </div>

            {/* المحتوى */}
            <div className="relative z-10">
              {/* الرأس */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/30">
                    <Construction className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="p-3 bg-gradient-to-br from-rose-500/20 to-pink-500/20 rounded-2xl border border-rose-500/30">
                    <Calculator className="h-8 w-8 text-rose-400" />
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl border border-emerald-500/30">
                    <TrendingUp className="h-8 w-8 text-emerald-400" />
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-4xl md:text-5xl font-bold mb-4"
                >
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    مرحباً بكم في مستقبل
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    الحلول الهندسية
                  </span>
                </motion.h1>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
                  <p className="text-lg text-slate-300">منصة متكاملة لحساب الكميات الإنشائية بدقة عالية</p>
                </motion.div>
              </div>

              {/* الميزات */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-slate-200">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* التفاصيل الإضافية */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/30 p-6 rounded-2xl border border-slate-700/50">
                      <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-400" />
                        لماذا نختلف عن الآخرين؟
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-slate-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          واجهة مستخدم ذكية وسهلة الاستخدام
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          تحديثات مستمرة ومزايا جديدة
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          دعم فني متخصص على مدار الساعة
                        </li>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* شريط التقدم */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">جاري التحميل...</span>
                  <span className="text-sm font-semibold text-slate-300">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 7, ease: "linear" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </motion.div>
                </div>
              </div>

              {/* التوقيع */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-700/50"
              >
                <div className="text-center md:text-right mb-4 md:mb-0">
                  <p className="text-sm text-slate-400 mb-1">بكل فخر نقدم لكم</p>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Rocket className="h-4 w-4 text-rose-400" />
                    <p className="text-lg font-semibold text-slate-200">
                      عميد سماره & عنان كايد
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">فريق التصميم والبرمجة المتكامل</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  <span>ابدأ الرحلة الآن</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>

          {/* إضافة أنماط CSS للرسوم المتحركة */}
          <style jsx>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .animate-shimmer {
              animation: shimmer 2s infinite;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}