"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Briefcase, Settings, ScrollText, ArrowLeft, Shield, AlertTriangle, Lock, Eye, Activity, TrendingUp, Database, Zap, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.15,
      when: "beforeChildren"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1] as const
    } 
  },
  hover: { 
    scale: 1.04, 
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1] as const
    }
  }
};

interface DashboardData {
  users: { count: number; active: number };
  projects: { count: number; active: number };
  system: { load: number; uptime: number; memory: number };
  logs: { today: number; total: number };
  lastUpdated: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    users: { count: 0, active: 0 },
    projects: { count: 0, active: 0 },
    system: { load: 0, uptime: 0, memory: 0 },
    logs: { today: 0, total: 0 },
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async (): Promise<DashboardData> => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const apiData = await response.json();
        return {
          users: apiData.users || { count: 0, active: 0 },
          projects: apiData.projects || { count: 0, active: 0 },
          system: apiData.system || { load: 0, uptime: 0, memory: 0 },
          logs: apiData.logs || { today: 0, total: 0 },
          lastUpdated: new Date().toISOString()
        };
      }

      console.warn('API غير متوفر، استخدام بيانات توضيحية');
      return {
        users: { count: 0, active: 0 },
        projects: { count: 0, active: 0 },
        system: { load: 0, uptime: 0, memory: 0 },
        logs: { today: 0, total: 0 },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
      return {
        users: { count: 0, active: 0 },
        projects: { count: 0, active: 0 },
        system: { load: 0, uptime: 0, memory: 0 },
        logs: { today: 0, total: 0 },
        lastUpdated: new Date().toISOString()
      };
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const newData = await fetchDashboardData();
      setData(newData);
      setLastRefresh(new Date());
    } catch (err) {
      setError('فشل تحديث البيانات. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [fetchDashboardData]);

  useEffect(() => {
    refreshData();
    
    const dataTimer = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => {
      clearInterval(dataTimer);
    };
  }, [refreshData]);

  const overviewCards = [
    { 
      title: "إدارة المستخدمين", 
      href: "/admin/users", 
      icon: Users, 
      description: "عرض وتعديل وحذف المستخدمين.",
      iconBgClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400",
      bottomBarClass: "bg-gradient-to-r from-blue-500 to-blue-700",
      buttonClassName: "bg-blue-50 text-blue-700 border-2 border-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-700/40 dark:text-blue-300 dark:border-blue-600 dark:hover:bg-blue-700 dark:hover:text-white",
      buttonText: "إدارة المستخدمين",
      dataAiHint: "manage-users",
      warning: "صلاحيات عالية",
      stat: isLoading ? "..." : data.users.count.toLocaleString('en-US'),
      statLabel: isLoading ? "جاري التحميل..." : `مستخدم (${data.users.active} نشط)`
    },
    { 
      title: "إدارة المشاريع", 
      href: "/admin/projects", 
      icon: Briefcase, 
      description: "متابعة وحذف المشاريع القائمة.",
      iconBgClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400",
      bottomBarClass: "bg-gradient-to-r from-amber-500 to-amber-700",
      buttonClassName: "bg-amber-50 text-amber-700 border-2 border-amber-600 hover:bg-amber-600 hover:text-white dark:bg-amber-700/40 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-amber-700 dark:hover:text-white",
      buttonText: "إدارة المشاريع",
      dataAiHint: "manage-projects",
      warning: "صلاحيات متوسطة",
      stat: isLoading ? "..." : data.projects.count.toLocaleString('en-US'),
      statLabel: isLoading ? "جاري التحميل..." : `مشروع (${data.projects.active} نشط)`
    },
    { 
      title: "إعدادات النظام", 
      href: "/admin/settings", 
      icon: Settings, 
      description: "تكوين الإعدادات العامة للنظام.",
      iconBgClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-400",
      bottomBarClass: "bg-gradient-to-r from-purple-500 to-purple-700",
      buttonClassName: "bg-purple-50 text-purple-700 border-2 border-purple-600 hover:bg-purple-600 hover:text-white dark:bg-purple-700/40 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-purple-700 dark:hover:text-white",
      buttonText: "تعديل الإعدادات",
      dataAiHint: "system-settings",
      warning: "صلاحيات حرجة",
      stat: isLoading ? "..." : `${data.system.uptime}%`,
      statLabel: "وقت التشغيل"
    },
    { 
      title: "سجلات النظام", 
      href: "/admin/logs", 
      icon: ScrollText, 
      description: "مراجعة أنشطة النظام والأحداث.",
      iconBgClass: "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-400",
      bottomBarClass: "bg-gradient-to-r from-green-500 to-green-700",
      buttonClassName: "bg-green-50 text-green-700 border-2 border-green-600 hover:bg-green-600 hover:text-white dark:bg-green-700/40 dark:text-green-300 dark:border-green-600 dark:hover:bg-green-700 dark:hover:text-white",
      buttonText: "عرض السجلات",
      dataAiHint: "system-logs",
      warning: "صلاحيات حساسة",
      stat: isLoading ? "..." : (data.logs.today > 1000 ? `${(data.logs.today / 1000).toFixed(1)}K` : data.logs.today.toLocaleString('en-US')),
      statLabel: "سجل اليوم"
    },
  ];

  return (
    <div className="space-y-16 text-right px-6 md:px-12 lg:px-24 py-12 bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950 dark:via-gray-900 dark:to-red-950 min-h-screen">
      {/* Security Warning Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-xl shadow-2xl"
      >
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8" />
            <span className="font-black text-2xl">منطقة إدارية خاصة - صلاحيات عالية</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7" />
              <span className="text-lg font-bold">تم التحقق من الهوية</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
              <Activity className="w-6 h-6" />
              <span className="text-xl font-bold font-mono">{data.system.load}% LOAD</span>
            </div>
            {lastRefresh && (
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                <RefreshCw className="w-6 h-6" />
                <span className="text-lg font-bold">آخر تحديث: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
              </div>
            )}
            <motion.button
              onClick={refreshData}
              className="bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-6 h-6 text-white", isRefreshing && "animate-spin")} />
              <span className="text-white text-lg font-bold">تحديث</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 dark:text-red-300 font-bold">خطأ في تحديث البيانات</h3>
            <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Users, label: "مستخدمين نشطين", value: isLoading ? "..." : data.users.active.toLocaleString('en-US'), color: "from-blue-500 to-cyan-500" },
          { icon: Briefcase, label: "المشاريع النشطة", value: isLoading ? "..." : data.projects.active.toLocaleString('en-US'), color: "from-amber-500 to-red-500" },
          { icon: Database, label: "حمل النظام", value: isLoading ? "..." : `${data.system.load}%`, color: "from-purple-500 to-pink-500" },
          { icon: Zap, label: "الطلبات اليوم", value: isLoading ? "..." : (data.logs.today > 1000 ? `${(data.logs.today / 1000).toFixed(1)}K` : data.logs.today.toLocaleString('en-US')), color: "from-green-500 to-teal-500" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group"
          >
            <Card className="bg-white/95 dark:bg-card shadow-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", stat.color)}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  {!isLoading && <TrendingUp className="w-4 h-4 text-green-400" />}
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">
                  {isLoading ? (
                    <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-20 rounded" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Welcome Section */}
      <Card className="bg-white/95 dark:bg-card shadow-2xl border-2 border-red-300 dark:border-red-700 rounded-3xl relative overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-600 to-red-800 w-full"></div>
        
        <CardHeader className="relative">
          <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 dark:bg-red-900/10 z-0"></div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
              مرحباً بك، أيها المسؤول!
              <motion.span
                className="inline-block text-green-600 dark:text-green-400"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden="true"
              >
                👋
              </motion.span>
            </CardTitle>
            <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
              <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">وصول محدود</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-4 rounded-r-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-red-800 dark:text-red-300 font-medium">
                تحذير: هذه المنطقة تحتوي على صلاحيات إدارية حساسة. يرجى التعامل بحذر شديد.
              </p>
            </div>
          </div>
          <p className="text-xl leading-relaxed text-gray-700 dark:text-gray-300 max-w-4xl mx-auto select-text">
            هذه هي لوحة التحكم الخاصة بك. يمكنك من هنا إدارة المستخدمين، المشاريع، إعدادات النظام، ومراجعة سجلات الأنشطة بسهولة وسرعة.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>جميع الإجراءات يتم تسجيلها</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>حماية متقدمة مفعلة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Cards */}
      <Card className="bg-white/95 dark:bg-card shadow-2xl border-2 border-red-300 dark:border-red-700 rounded-3xl relative overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-600 to-red-800 w-full"></div>
        
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-4xl font-extrabold text-red-600 dark:text-red-400 tracking-wide">
              لوحة تحكم المسؤول الرئيسية
            </CardTitle>
            <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
              <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">محمي</span>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-3 rounded-r-lg mt-4">
            <p className="text-red-800 dark:text-red-300 text-sm">
              ⚠️ التعديلات في هذه الصفحة قد تؤثر على عمل النظام بالكامل. يرجى التوخي الحذر.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {overviewCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={card.title}
                  variants={cardVariants}
                  whileHover="hover"
                  className="flex flex-col"
                >
                  <Link
                    href={card.href}
                    className={cn(
                      "flex flex-col rounded-2xl border-2 border-red-200 dark:border-red-800 bg-white dark:bg-card shadow-lg cursor-pointer select-none transition-shadow focus:outline-none focus:ring-4 focus:ring-red-400 dark:focus:ring-red-600",
                      "overflow-hidden h-full relative"
                    )}
                    data-ai-hint={card.dataAiHint}
                    tabIndex={0}
                    role="link"
                  >
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{card.warning}</span>
                    </div>
                    
                    <div className="p-7 flex justify-between items-center">
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{card.title}</h3>
                      <div className={cn("p-5 rounded-full", card.iconBgClass)}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                    </div>
                    <p className="px-7 text-gray-600 dark:text-gray-400 text-base mb-4 leading-relaxed">{card.description}</p>
                    
                    <div className="px-7 pb-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
                        {isLoading ? (
                          <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-8 w-full rounded mb-2" />
                        ) : (
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{card.stat}</div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{card.statLabel}</div>
                      </div>
                    </div>
                    
                    <div className="mt-auto px-7 pb-7">
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-center font-semibold tracking-wide",
                          card.buttonClassName,
                          "group-hover:bg-opacity-95 transition-colors duration-300"
                        )}
                        aria-label={card.buttonText}
                      >
                        <span>{card.buttonText}</span>
                        <ArrowLeft className="w-6 h-6 mr-3 rtl:mr-0 rtl:ml-3" />
                      </Button>
                    </div>
                    <div className={cn("h-2 rounded-b-2xl", card.bottomBarClass)} />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
          
          <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                  تم تسجيل دخولك كمسؤول نظام. جميع الإجراءات يتم مراقبتها.
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                آخر نشاط: الآن • النظام يعمل بكفاءة {data.system.uptime}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}