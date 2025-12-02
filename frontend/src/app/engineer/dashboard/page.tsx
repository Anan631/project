"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FolderKanban,
  Calculator,
  Blocks,
  TrendingUp,
  BarChart3,
  Users,
  ArrowLeft,
  Gauge,
  Briefcase,
  PlayCircle,
  CheckCircle,
  BookOpen,
  HardHat,
  Ruler,
  Building,
  ShieldCheck,
  Lightbulb,
  Target,
  Search,
  Clock,
  Zap
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getProjects, type Project } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

// البيانات الثابتة خارج المكون (بدون useMemo)
const dashboardCategories = [
  {
    id: 'projects',
    title: "إدارة المشاريع",
    description: "عرض، تعديل، وأرشفة جميع مشاريعك الإنشائية.",
    icon: FolderKanban,
    href: "/engineer/projects",
    iconColorClass: "text-blue-600",
    bgColorClass: "bg-blue-50 border-blue-200",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
    badge: "أساسي",
    keywords: ["مشاريع", "إدارة", "عرض", "تعديل"]
  },
  {
    id: 'calculator',
    title: "حاسبة أسعار المواد",
    description: "أداة متقدمة لحساب تكاليف مواد البناء بدقة.",
    icon: Calculator,
    href: "/engineer/cost-estimator",
    iconColorClass: "text-emerald-600",
    bgColorClass: "bg-emerald-50 border-emerald-200",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600",
    badge: "مالي",
    keywords: ["حاسبة", "أسعار", "مواد", "تكاليف"]
  },
  {
    id: 'structural',
    title: "العناصر الإنشائية",
    description: "تحليل وتفصيل العناصر الإنشائية (أعمدة، كمرات، أسقف).",
    icon: Blocks,
    href: "/engineer/structural-elements/input-details",
    iconColorClass: "text-purple-600",
    bgColorClass: "bg-purple-50 border-purple-200",
    buttonClass: "bg-purple-600 hover:bg-purple-700 text-white border-purple-600",
    badge: "إنشائي",
    keywords: ["عناصر", "إنشائية", "أعمدة", "كمرات"]
  },
  {
    id: 'progress',
    title: "تقدم البناء",
    description: "مراقبة ومتابعة التقدم المحرز في مراحل المشروع.",
    icon: TrendingUp,
    href: "/engineer/update-progress",
    iconColorClass: "text-orange-600",
    bgColorClass: "bg-orange-50 border-orange-200",
    buttonClass: "bg-orange-600 hover:bg-orange-700 text-white border-orange-600",
    badge: "متابعة",
    keywords: ["تقدم", "بناء", "مراحل", "متابعة"]
  },
  {
    id: 'reports',
    title: "التقارير الفنية",
    description: "توليد تقارير فنية ومالية مفصلة للمشاريع.",
    icon: BarChart3,
    href: "/engineer/quantity-survey/view-reports",
    iconColorClass: "text-cyan-600",
    bgColorClass: "bg-cyan-50 border-cyan-200",
    buttonClass: "bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600",
    badge: "تقارير",
    keywords: ["تقارير", "فنية", "مالية", "تحليل"]
  },
  {
    id: 'owners',
    title: "ربط المالكين",
    description: "إدارة وتوثيق ارتباط المالكين بمشاريعهم.",
    icon: Users,
    href: "/engineer/link-owner",
    iconColorClass: "text-rose-600",
    bgColorClass: "bg-rose-50 border-rose-200",
    buttonClass: "bg-rose-600 hover:bg-rose-700 text-white border-rose-600",
    badge: "تواصل",
    keywords: ["ربط", "مالكين", "تواصل", "عملاء"]
  },
  {
    id: 'guidelines',
    title: "الإرشادات الفنية",
    description: "مرجع شامل للإرشادات والمعايير الهندسية.",
    icon: BookOpen,
    href: "/engineer/engineering-guidelines",
    iconColorClass: "text-indigo-600",
    bgColorClass: "bg-indigo-50 border-indigo-200",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600",
    badge: "معرفة",
    keywords: ["إرشادات", "فنية", "معايير", "هندسية"]
  },
];

// مكون هيكل التحميل المحسن
const EnhancedSkeleton = () => (
  <div className="space-y-8 text-right bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen p-4">
    {/* Skeleton للهيدر */}
    <div className="relative overflow-hidden rounded-2xl bg-gray-300 shadow-2xl h-40 animate-pulse"></div>
    
    {/* Skeleton للإحصائيات */}
    <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200/80">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Skeleton للأدوات */}
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-xl rounded-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-full p-6 shadow-lg rounded-xl border-2 border-gray-200 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
              <Skeleton className="h-6 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-4 flex-grow" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function EngineerDashboardPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>([]);

  // تحسين جلب البيانات باستخدام useCallback
  const fetchUserData = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('userName');
      const id = localStorage.getItem('userId');
      const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
      
      setUserName(name);
      setUserId(id);
      setRecentlyVisited(visited);

      if (!id) {
        setIsLoading(false);
        toast({
          title: "مستخدم غير معروف",
          description: "لم يتم العثور على معلومات المهندس. يرجى تسجيل الدخول مرة أخرى.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    }
    return false;
  }, [toast]);

  const fetchEngineerProjects = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const result = await getProjects(id);
      if (result.success && result.projects) {
        setProjects(result.projects);
      } else {
        toast({ 
          title: "خطأ", 
          description: result.message || "فشل تحميل المشاريع.", 
          variant: "destructive" 
        });
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects for engineer:", error);
      toast({ 
        title: "خطأ فادح", 
        description: "حدث خطأ أثناء تحميل بيانات المشاريع.", 
        variant: "destructive" 
      });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // تحسين useEffect باستخدام useCallback
  useEffect(() => {
    const initializeData = async () => {
      const hasUser = await fetchUserData();
      if (hasUser && userId) {
        fetchEngineerProjects(userId);
      }
    };
    
    initializeData();
  }, [fetchUserData, fetchEngineerProjects, userId]);

  // استخدام useMemo للإحصائيات (داخل المكون)
  const { totalProjects, activeProjects, completedProjects } = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'قيد التنفيذ').length;
    const completed = projects.filter(p => p.status === 'مكتمل').length;
    
    return { totalProjects: total, activeProjects: active, completedProjects: completed };
  }, [projects]);

  const overviewStats = useMemo(() => [
    { 
      label: 'إجمالي المشاريع', 
      value: totalProjects, 
      icon: Building, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'مجموع المشاريع المسؤولة عنها'
    },
    { 
      label: 'المشاريع النشطة', 
      value: activeProjects, 
      icon: Target, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'قيد التنفيذ حالياً'
    },
    { 
      label: 'المشاريع المكتملة', 
      value: completedProjects, 
      icon: ShieldCheck, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'تم تسليمها بنجاح'
    },
  ], [totalProjects, activeProjects, completedProjects]);

  // فلترة الأدوات بناءً على البحث
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return dashboardCategories;
    
    const query = searchQuery.toLowerCase();
    return dashboardCategories.filter(category => 
      category.title.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query) ||
      category.keywords.some(keyword => keyword.includes(query))
    );
  }, [searchQuery]);

  // تسجيل الزيارة الأخيرة
  const handleToolClick = useCallback((toolId: string) => {
    const updatedVisited = [toolId, ...recentlyVisited.filter(id => id !== toolId)].slice(0, 3);
    setRecentlyVisited(updatedVisited);
    localStorage.setItem('recentlyVisited', JSON.stringify(updatedVisited));
  }, [recentlyVisited]);

  // الحصول على الأدوات التي تم زيارتها مؤخراً
  const recentTools = useMemo(() => {
    return recentlyVisited
      .map(id => dashboardCategories.find(cat => cat.id === id))
      .filter(Boolean)
      .slice(0, 3);
  }, [recentlyVisited]);

  // إظهار هيكل التحميل أثناء جلب البيانات
  if (isLoading && projects.length === 0) {
    return <EnhancedSkeleton />;
  }

  return (
    <>
      {/* Engineering Header Banner - مبسط */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl"
      >
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <HardHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-none backdrop-blur-sm">
                  <Ruler className="h-3 w-3 ml-1" />
                  لوحة تحكم المهندس
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  مرحباً بك، {userName ? `م. ${userName}` : 'أيها المهندس'}!
                </h1>
                <p className="text-blue-100 text-sm sm:text-base mt-1">
                  هنا تبدأ رحلتك في إدارة المشاريع الهندسية بدقة واحترافية
                </p>
              </div>
            </div>
            <motion.div
              className="hidden lg:flex"
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <Lightbulb className="h-12 w-12 text-yellow-300" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* شريط البحث السريع */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="ابحث في الأدوات والميزات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border-gray-300 focus:bg-white transition-all duration-200"
          />
        </div>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-full left-0 right-0 bg-white mt-1 rounded-lg shadow-lg border border-gray-200 z-10 p-2"
          >
            <p className="text-sm text-gray-600 text-center py-2">
              {filteredCategories.length} أداة مطابقة للبحث
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* الأدوات المستخدمة مؤخراً */}
      {recentTools.length > 0 && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-lg font-semibold text-gray-800">مستخدمة مؤخراً</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentTools.map((tool, index) => {
                  if (!tool) return null;
                  const Icon = tool.icon;
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <Button
                        asChild
                        variant="ghost"
                        className={cn(
                          "w-full h-auto p-3 justify-start gap-3 hover:bg-blue-50 transition-colors",
                          tool.bgColorClass
                        )}
                        onClick={() => handleToolClick(tool.id)}
                      >
                        <Link href={tool.href}>
                          <Icon className={cn("h-5 w-5 flex-shrink-0", tool.iconColorClass)} />
                          <div className="text-right flex-1">
                            <div className="font-medium text-gray-800 text-sm">{tool.title}</div>
                            <div className="text-gray-600 text-xs truncate">{tool.description}</div>
                          </div>
                        </Link>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Engineering Stats Overview - مبسط */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-xl font-bold text-gray-800">نظرة سريعة</CardTitle>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                <Zap className="h-3 w-3 ml-1" />
                مباشر
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overviewStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 * index }}
                    className="group p-4 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-105 transition-transform duration-200`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Engineering Tools Grid - محسن للأداء */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  الأدوات الهندسية
                </CardTitle>
                <CardDescription className="text-gray-600">
                  مجموعة متكاملة من الأدوات المحاسبية والفنية
                </CardDescription>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardHat className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredCategories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
                      whileHover={{ y: -2 }}
                      className="group"
                    >
                      <Card className={cn(
                        "h-full text-right p-4 shadow-md rounded-lg border transition-all duration-200 hover:shadow-lg flex flex-col",
                        category.bgColorClass
                      )}>
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="text-xs bg-white/90">
                            {category.badge}
                          </Badge>
                          <div className="p-2 rounded-lg bg-white/80 group-hover:scale-105 transition-transform duration-200">
                            <Icon className={cn("h-5 w-5", category.iconColorClass)} />
                          </div>
                        </div>
                        
                        <div className="flex-1 mb-3">
                          <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                            {category.title}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {category.description}
                          </p>
                        </div>

                        <Button 
                          asChild 
                          className={cn(
                            "w-full flex justify-between items-center font-medium transition-all duration-200 text-sm",
                            category.buttonClass
                          )}
                          size="sm"
                          onClick={() => handleToolClick(category.id)}
                        >
                          <Link href={category.href}>
                            <span>فتح الأداة</span>
                            <ArrowLeft className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </Button>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {filteredCategories.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">لم يتم العثور على أدوات</p>
                  <p className="text-sm">جرب استخدام كلمات بحث مختلفة</p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Engineering Performance Footer - مبسط */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="text-center"
      >
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="text-base font-semibold text-gray-700">
              مساحة عمل مهنية للمهندسين
            </p>
          </div>
          <p className="text-gray-600 text-xs max-w-2xl mx-auto">
            منصة متكاملة مصممة خصيصاً لإدارة المشاريع الإنشائية بدقة وكفاءة عالية
          </p>
        </div>
      </motion.div>
    </>
  );
}