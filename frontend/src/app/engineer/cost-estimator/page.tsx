"use client";

import { useState, useEffect } from 'react';
import CostEstimatorForm from '@/components/CostEstimatorForm';
import { motion } from 'framer-motion';

interface CostEstimate {
  id: number;
  projectName: string;
  totalCost: number;
  date: string;
  [key: string]: any;
}

export default function EngineerCostEstimatorPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [savedEstimates, setSavedEstimates] = useState<CostEstimate[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // التحقق من تفضيلات المستخدم للوضع الليلي
    const darkModePreference = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkModePreference);

    // جلب التقديرات المحفوظة
    const estimates = JSON.parse(localStorage.getItem('costEstimates') || '[]');
    setSavedEstimates(estimates);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const saveEstimate = (estimate: any) => {
    const newEstimates = [...savedEstimates, { ...estimate, id: Date.now(), date: new Date().toISOString() }];
    setSavedEstimates(newEstimates);
    localStorage.setItem('costEstimates', JSON.stringify(newEstimates));
  };

  const deleteEstimate = (id: number) => {
    const newEstimates = savedEstimates.filter(e => e.id !== id);
    setSavedEstimates(newEstimates);
    localStorage.setItem('costEstimates', JSON.stringify(newEstimates));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="h-8 w-8 bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">ح</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">حاسبة تكاليف المشاريع الهندسية</h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">تقدير تكلفة المشروع</h2>
                  <p className="text-gray-600 dark:text-gray-400">أدخل تفاصيل المشروع للحصول على تقدير دقيق للتكلفة</p>
                </div>
                <CostEstimatorForm />
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div className="h-5 w-5 bg-green-600 dark:bg-green-400 rounded-full flex items-center justify-center ml-2">
                    <span className="text-white text-xs">₹</span>
                  </div>
                  نصائح لتوفير التكاليف
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="text-green-500 ml-2">•</span>
                    <span>اختر المواد عالية الجودة لتقليل تكاليف الصيانة المستقبلية</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 ml-2">•</span>
                    <span>خطط جيداً لتجنب التغييرات المكلفة أثناء التنفيذ</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 ml-2">•</span>
                    <span>احصل على عروض أسعار من عدة مقاولين</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 ml-2">•</span>
                    <span>فكر في الحلول المستدامة التي توفر الطاقة على المدى الطويل</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">إحصائيات سريعة</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">عدد التقديرات</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{savedEstimates.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">متوسط التكلفة</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {savedEstimates.length > 0
                        ? `${(savedEstimates.reduce((acc, e) => acc + (e.totalCost || 0), 0) / savedEstimates.length).toLocaleString()} ريال`
                        : 'غير متوفر'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* History Modal */}
          {showHistory && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">سجل التقديرات</h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {savedEstimates.length > 0 ? (
                    <div className="space-y-4">
                      {savedEstimates.map((estimate) => (
                        <div key={estimate.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{estimate.projectName || 'مشروع بدون اسم'}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {new Date(estimate.date).toLocaleDateString('ar-SA')}
                              </p>
                              <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mt-2">
                                {(estimate.totalCost || 0).toLocaleString()} ريال
                              </p>
                            </div>
                            <button
                              onClick={() => deleteEstimate(estimate.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">لا توجد تقديرات محفوظة بعد</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}