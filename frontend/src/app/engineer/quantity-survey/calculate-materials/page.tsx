"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calculator, 
  HardHat, 
  BarChart3, 
  Building2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  MapPin, 
  Clock,
  TrendingUp,
  Package,
  FileText,
  RefreshCw,
  Grid3x3,
  List,
  Star,
  ArrowRight,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProjects, type Project } from '@/lib/db';

// مكون للعرض المتقدم للمشروع
const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'قيد التنفيذ': return 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 border border-emerald-200/60 shadow-emerald-100/50';
      case 'مخطط له': return 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 border border-blue-200/60 shadow-blue-100/50';
      case 'مكتمل': return 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-700 border border-purple-200/60 shadow-purple-100/50';
      default: return 'bg-gradient-to-r from-gray-500/10 to-slate-500/10 text-gray-700 border border-gray-200/60 shadow-gray-100/50';
    }
  };

  const getProgressColor = (status?: string) => {
    switch(status) {
      case 'قيد التنفيذ': return 'from-emerald-400 via-green-500 to-teal-600';
      case 'مخطط له': return 'from-blue-400 via-cyan-500 to-sky-600';
      case 'مكتمل': return 'from-purple-400 via-violet-500 to-indigo-600';
      default: return 'from-gray-400 via-slate-500 to-zinc-600';
    }
  };

  const getIconBgColor = (status?: string) => {
    switch(status) {
      case 'قيد التنفيذ': return 'from-emerald-500/20 to-green-600/20 border-emerald-300/40';
      case 'مخطط له': return 'from-blue-500/20 to-cyan-600/20 border-blue-300/40';
      case 'مكتمل': return 'from-purple-500/20 to-violet-600/20 border-purple-300/40';
      default: return 'from-gray-500/20 to-slate-600/20 border-gray-300/40';
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden bg-white/95 backdrop-blur-sm border border-gray-200/60 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-700 rounded-3xl transform hover:-translate-y-2"
      style={{ 
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* خط التقدم العلوي المتحرك */}
      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getProgressColor(project.status)} shadow-lg`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 animate-pulse"></div>
      </div>
      
      {/* تأثيرات خلفية متعددة */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${getStatusColor(project.status)} font-bold px-4 py-2 rounded-full text-sm shadow-lg`}>
                <Sparkles className="h-3.5 w-3.5 ml-1" />
                {project.status}
              </Badge>
              {project.location && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-2 rounded-full border border-gray-200/60 shadow-sm">
                  <MapPin className="h-4 w-4 text-blue-500" /> 
                  {project.location}
                </span>
              )}
            </div>
            
            <CardTitle className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-800 transition-colors duration-500 leading-tight">
              {project.name}
            </CardTitle>
            
            {project.description && (
              <CardDescription className="text-gray-600 leading-relaxed text-sm line-clamp-2 font-medium">
                {project.description}
              </CardDescription>
            )}
          </div>
          
          <div className="mr-4">
            <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${getIconBgColor(project.status)} flex items-center justify-center border shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <Building2 className="h-9 w-9 text-blue-600 drop-shadow-sm" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-6">
        {/* أزرار الحسابات المحسنة */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 hover:from-red-600 hover:via-rose-600 hover:to-pink-700 text-white font-bold h-14 shadow-xl hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-500 rounded-2xl group/btn overflow-hidden relative transform hover:scale-105"
          >
            <Link href={`/engineer/projects/${project.id}/concrete-cards`}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
              <HardHat className="h-6 w-6 ml-2 relative z-10 drop-shadow-lg" />
              <span className="relative z-10 text-lg">حساب الباطون</span>
              <Zap className="h-4 w-4 mr-2 relative z-10 opacity-70" />
            </Link>
          </Button>
          
          <Button
            asChild
            className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 text-white font-bold h-14 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 rounded-2xl group/btn overflow-hidden relative transform hover:scale-105"
          >
            <Link href={`/engineer/projects/${project.id}/steel-calculations`}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
              <BarChart3 className="h-6 w-6 ml-2 relative z-10 drop-shadow-lg" />
              <span className="relative z-10 text-lg">حساب الحديد</span>
              <Target className="h-4 w-4 mr-2 relative z-10 opacity-70" />
            </Link>
          </Button>
        </div>
        
        <Separator className="my-6 opacity-30" />
        
        {/* زر تفاصيل المشروع المحسن */}
        <Button
          asChild
          variant="outline"
          className="w-full border-2 border-gray-300/60 hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 text-gray-700 hover:text-blue-700 transition-all duration-500 rounded-2xl h-12 font-semibold shadow-sm hover:shadow-lg group/details"
        >
          <Link href={`/engineer/projects/${project.id}`}>
            <FileText className="h-5 w-5 ml-2 group-hover/details:scale-110 transition-transform duration-300" />
            <span>تفاصيل المشروع</span>
            <ArrowRight className="h-4 w-4 mr-2 group-hover/details:translate-x-1 transition-transform duration-300" />
          </Link>
        </Button>
      </CardContent>
      
      {/* تأثير الإضاءة السفلي */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </Card>
  );
};

export default function CalculateMaterialsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'قيد التنفيذ' | 'مخطط له' | 'مكتمل'>("all");
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'status' | 'date'>("name-asc");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchEngineerProjects = useCallback(async (engineerId: string) => {
    setIsLoading(true);
    try {
      const result = await getProjects(engineerId);
      if (result.success && result.projects) {
        // إبقاء المشاريع النشطة فقط
        const activeProjects = result.projects.filter(
          p => p.status === 'قيد التنفيذ' || p.status === 'مخطط له'
        );
        setProjects(activeProjects);
      } else {
        toast({
          title: "⚠️ خطأ في التحميل",
          description: result.message || "فشل تحميل المشاريع.",
          variant: "destructive"
        });
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "🚨 خطأ فادح",
        description: "حدث خطأ أثناء تحميل بيانات المشاريع.",
        variant: "destructive"
      });
      setProjects([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  const refreshProjects = useCallback(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (id) {
      setIsRefreshing(true);
      fetchEngineerProjects(id);
    }
  }, [fetchEngineerProjects]);

  useEffect(() => {
    const id = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (id) {
      fetchEngineerProjects(id);
    } else {
      setIsLoading(false);
      toast({ 
        title: '🔐 تنبيه', 
        description: 'لم يتم العثور على معرف المستخدم، يرجى تسجيل الدخول.', 
        variant: 'destructive' 
      });
    }
  }, [fetchEngineerProjects, toast]);

  const filteredAndSorted = useMemo(() => {
    let list = [...projects];

    // بحث
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.location?.toLowerCase().includes(term) ?? false) ||
        (p.description?.toLowerCase().includes(term) ?? false)
      );
    }

    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }

    // فرز
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
          return 0;
        default:
          return 0;
      }
    });

    return list;
  }, [projects, searchTerm, statusFilter, sortBy]);

  // إحصائيات المشاريع
  const projectStats = useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(p => p.status === 'قيد التنفيذ').length;
    const planned = projects.filter(p => p.status === 'مخطط له').length;
    const completed = projects.filter(p => p.status === 'مكتمل').length;
    
    return { total, inProgress, planned, completed };
  }, [projects]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 py-8 px-4 text-right relative overflow-hidden" dir="rtl">
        {/* خلفية متحركة */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.15),transparent_50%)] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.15),transparent_50%)] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Card className="bg-white/95 backdrop-blur-xl shadow-2xl border border-white/30 rounded-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
            
            <CardHeader className="text-center border-b border-gray-200/50 pb-10 bg-gradient-to-r from-white/90 to-blue-50/40">
              <div className="relative mx-auto mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/25 animate-pulse">
                  <Calculator className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping"></div>
              </div>
              <CardTitle className="text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3">
                حساب كميات المواد
              </CardTitle>
              <CardDescription className="text-gray-600 text-xl font-medium">
                يُرجى الانتظار ريثما يتم تحميل مشاريعك النشطة
              </CardDescription>
              
              {/* شريط التحميل المتحرك */}
              <div className="mt-8 max-w-md mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-500 mt-3 animate-pulse">جاري تحميل البيانات...</p>
              </div>
            </CardHeader>
            
            <CardContent className="pt-10 px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border-2 border-gray-200/60 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-3 flex-1">
                          <Skeleton className="h-8 w-3/4 rounded-xl" />
                          <Skeleton className="h-5 w-1/2 rounded-lg" />
                          <Skeleton className="h-5 w-2/3 rounded-lg" />
                        </div>
                        <Skeleton className="h-16 w-16 rounded-2xl" />
                      </div>
                      <div className="space-y-4">
                        <Skeleton className="h-14 w-full rounded-2xl" />
                        <Skeleton className="h-14 w-full rounded-2xl" />
                        <div className="pt-4 border-t border-gray-200/50">
                          <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 py-8 px-4 text-right relative overflow-hidden" dir="rtl">
      {/* خلفية متحركة */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <Card className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/20 rounded-3xl overflow-hidden relative">
          {/* تأثير الإضاءة العلوي */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <CardHeader className="border-b border-gray-200/50 pb-8 bg-gradient-to-r from-white/80 to-blue-50/30">
            <div className="space-y-8">
              {/* العنوان والتحكم المحسن */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                      <Calculator className="h-10 w-10 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce shadow-lg"></div>
                  </div>
                  <div>
                    <CardTitle className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2 leading-tight">
                      حساب كميات المواد
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-lg font-medium">
                      اختر مشروعاً للبدء بحساب كميات الباطون أو الحديد بدقة عالية
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshProjects}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-500 hover:text-white rounded-2xl transition-all duration-300 px-6 py-3 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    تحديث
                  </Button>
                  <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-2xl border-2 border-blue-200/60 shadow-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                    <span className="text-lg font-black text-blue-800">{projectStats.total} مشروع</span>
                  </div>
                </div>
              </div>

              {/* إحصائيات سريعة محسنة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200/60 rounded-3xl p-6 flex items-center gap-4 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 transform hover:-translate-y-1 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-7 w-7 text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-bold mb-1">قيد التنفيذ</p>
                    <p className="text-2xl font-black text-emerald-800">{projectStats.inProgress}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200/60 rounded-3xl p-6 flex items-center gap-4 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 transform hover:-translate-y-1 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-7 w-7 text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-bold mb-1">مخطط له</p>
                    <p className="text-2xl font-black text-blue-800">{projectStats.planned}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200/60 rounded-3xl p-6 flex items-center gap-4 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:-translate-y-1 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-7 w-7 text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-bold mb-1">مكتمل</p>
                    <p className="text-2xl font-black text-purple-800">{projectStats.completed || 0}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200/60 rounded-3xl p-6 flex items-center gap-4 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-500 transform hover:-translate-y-1 group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Package className="h-7 w-7 text-white drop-shadow-sm" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 font-bold mb-1">إجمالي المشاريع</p>
                    <p className="text-2xl font-black text-slate-800">{projectStats.total}</p>
                  </div>
                </div>
              </div>

              {/* أدوات البحث والتصفية المحسنة */}
              <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-2 border-gray-200/60 rounded-3xl p-6 backdrop-blur-sm">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث بالاسم أو الموقع أو الوصف..."
                      className="pl-14 h-14 rounded-2xl border-2 border-gray-300 focus:border-blue-500 text-lg font-medium shadow-lg focus:shadow-xl transition-all duration-300"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <Filter className="h-6 w-6 text-white" />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-300 focus:border-blue-500 text-lg font-medium shadow-lg">
                        <SelectValue placeholder="حالة المشروع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الحالات</SelectItem>
                        <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                        <SelectItem value="مخطط له">مخطط له</SelectItem>
                        <SelectItem value="مكتمل">مكتمل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <ArrowUpDown className="h-6 w-6 text-white" />
                    </div>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-gray-300 focus:border-blue-500 text-lg font-medium shadow-lg">
                        <SelectValue placeholder="ترتيب حسب" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">الاسم تصاعدي</SelectItem>
                        <SelectItem value="name-desc">الاسم تنازلي</SelectItem>
                        <SelectItem value="status">حسب الحالة</SelectItem>
                        <SelectItem value="date">حسب التاريخ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mt-8">
                  <div className="w-full">
                    {/* شريط التبويب المحسّن مع خط صغير */}
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="w-full flex bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-1 shadow-inner overflow-hidden">
                        {/* تأثير خلفي متحرك */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/10 via-purple-100/10 to-pink-100/10 animate-pulse"></div>
                        
                        <TabsTrigger 
                          value="all" 
                          onClick={() => setStatusFilter('all')}
                          className="relative flex-1 h-10 px-3 rounded-xl text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-100 hover:bg-gray-100/80 hover:scale-98"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-black tracking-tight">الكل</span>
                          </div>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                          value="قيد التنفيذ" 
                          onClick={() => setStatusFilter('قيد التنفيذ')}
                          className="relative flex-1 h-10 px-3 rounded-xl text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-100 hover:bg-emerald-50/80 hover:scale-98"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-black tracking-tight">قيد التنفيذ</span>
                          </div>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                          value="مخطط له" 
                          onClick={() => setStatusFilter('مخطط له')}
                          className="relative flex-1 h-10 px-3 rounded-xl text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-100 hover:bg-blue-50/80 hover:scale-98"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-black tracking-tight">مخطط له</span>
                          </div>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                          value="مكتمل" 
                          onClick={() => setStatusFilter('مكتمل')}
                          className="relative flex-1 h-10 px-3 rounded-xl text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-100 hover:bg-purple-50/80 hover:scale-98"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-black tracking-tight">مكتمل</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-gradient-to-r from-white/95 to-gray-50/95 p-3 rounded-2xl shadow-xl border border-gray-200/40 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Target className="h-3.5 w-3.5 text-blue-500" />
                      <span>عرض:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`rounded-xl h-10 px-3 text-xs font-bold transition-all duration-300 ${
                          viewMode === 'grid' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/20 scale-100' 
                            : 'hover:bg-blue-50 hover:text-blue-700 hover:scale-98'
                        }`}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`rounded-xl h-10 px-3 text-xs font-bold transition-all duration-300 ${
                          viewMode === 'list' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/20 scale-100' 
                            : 'hover:bg-blue-50 hover:text-blue-700 hover:scale-98'
                        }`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-10 px-8">
            {filteredAndSorted.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative mx-auto mb-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-slate-200 flex items-center justify-center shadow-2xl">
                    <Building2 className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse shadow-lg"></div>
                </div>
                <h3 className="text-3xl font-black text-gray-800 mb-4">لا توجد مشاريع مطابقة</h3>
                <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                  لا توجد مشاريع مطابقة لمرشّحات البحث الحالية. قم بتعديل البحث أو تصفية الحالة لإظهار مشاريع أخرى.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    className="rounded-2xl border-2 border-gray-300 hover:border-blue-500 px-8 py-3 font-semibold text-lg"
                  >
                    مسح التصفية
                  </Button>
                  <Button 
                    asChild 
                    className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 font-semibold text-lg shadow-xl hover:shadow-2xl"
                  >
                    <Link href="/engineer/dashboard">
                      العودة إلى لوحة التحكم
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`grid gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}
              >
                {filteredAndSorted.map((project, index) => (
                  <div 
                    key={project.id} 
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ProjectCard project={project} index={index} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* زر العودة المحسن */}
        <div className="max-w-7xl mx-auto mt-10">
          <Button 
            asChild 
            variant="outline" 
            className="w-full sm:w-auto rounded-2xl border-3 border-blue-500 text-blue-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white font-bold text-lg transition-all duration-500 group shadow-xl hover:shadow-2xl px-8 py-4"
          >
            <Link href="/engineer/dashboard" className="flex items-center justify-center gap-3">
              <span>العودة إلى لوحة التحكم</span>
              <ArrowRight className="h-5 w-5 mr-1 group-hover:translate-x-2 transition-transform duration-500" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}