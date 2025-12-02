// This is a client component for the main dashboard
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, BarChart3, Calculator, Sparkles, Zap, TrendingUp } from 'lucide-react';
import AuthRequiredModal from '@/components/modals/AuthRequiredModal';

const MainDashboardClient = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleFeatureClick = () => {
    setIsAuthModalOpen(true);
  };

  const dashboardCards = [
    {
      title: "حساب كميات الباطون",
      description: "حساب الكميات الدقيقة للخرسانة لمختلف العناصر الإنشائية.",
      icon: <Box className="h-12 w-12"/>,
      onClick: handleFeatureClick,
      color: "from-red-500 to-rose-600",
      bgColor: "from-red-500/10 to-rose-600/10",
      accentColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "حساب كميات الحديد",
      description: "تقدير كميات حديد التسليح المطلوبة لمشروعك.",
      icon: <BarChart3 className="h-12 w-12"/>,
      onClick: handleFeatureClick,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-500/10 to-cyan-600/10",
      accentColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "حساب الأسعار",
      description: "تقدير التكلفة الإجمالية لمواد البناء المختلفة لمشروعك.",
      icon: <Calculator className="h-12 w-12"/>,
      onClick: handleFeatureClick,
      color: "from-emerald-500 to-green-600",
      bgColor: "from-emerald-500/10 to-green-600/10",
      accentColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <>
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full mb-6 border border-blue-100 dark:border-blue-800/30">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">أدوات هندسية</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              أدواتك الأساسية للحسابات
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              حسابات دقيقة وسريعة لكميات المواد وتكاليفها، مصممة لتسهيل عمل المهندسين والمقاولين.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {dashboardCards.map((item, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative cursor-pointer"
                onClick={item.onClick}
              >
                <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700"></div>

                  <div className="relative mb-8 flex justify-center">
                    <div className="relative inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                      <div className={`relative z-10 ${item.accentColor}`}>
                        {item.icon}
                      </div>
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500`}></div>
                    </div>
                    
                    <div className="absolute -top-2 -right-2">
                      <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}>
                        <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900"></div>
                        <Zap className="absolute inset-0 w-full h-full p-1 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <h3 className={`text-2xl font-bold mb-4 ${item.accentColor}`}>
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <TrendingUp className="h-4 w-4" />
                        <span>ابدأ الحساب</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                        <div className="w-2 h-2 bg-current rounded-full opacity-80"></div>
                        <div className="w-2 h-2 bg-current rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-gray-300 dark:border-gray-700 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-gray-300 dark:border-gray-700 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
                  <div className="absolute bottom-4 right-4 w-3 h-3 border-b border-r border-gray-300 dark:border-gray-700 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200"></div>
                  <div className="absolute bottom-4 left-4 w-3 h-3 border-b border-l border-gray-300 dark:border-gray-700 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300"></div>
                </div>
                
                <div className="absolute -bottom-4 left-4 right-4 h-4 bg-gray-200 dark:bg-gray-800 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default MainDashboardClient;