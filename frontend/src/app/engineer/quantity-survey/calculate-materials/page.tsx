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
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProjects, type Project } from '@/lib/db';

// مكون للعرض المتقدم للمشروع
const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'قيد التنفيذ': return 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200';
      case 'مخطط له': return 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-800 border border-blue-200';
      case 'مكتمل': return 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 border border-purple-200';
      default: return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-800 border border-gray-200';
    }
  };

  const getProgressColor = (status?: string) => {
    switch(status) {
      case 'قيد التنفيذ': return 'from-green-500 to-emerald-600';
      case 'مخطط له': return 'from-blue-500 to-sky-600';
      case 'مكتمل': return 'from-purple-500 to-violet-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden bg-white border border-gray-200/80 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 rounded-2xl"
      style={{ 
        animationDelay: `${index * 0.05}s`,
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* خط التقدم العلوي */}
      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getProgressColor(project.status)}`}></div>
      
      {/* تأثير خلفي متحرك */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(project.status)} font-semibold px-3 py-1 rounded-full`}>
                {project.status}
              </Badge>
              {project.location && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5" /> 
                  {project.location}
                </span>
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors duration-300">
              {project.name}
            </CardTitle>
            
            {project.description && (
              <CardDescription className="mt-2 text-gray-600 leading-relaxed text-sm line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </div>
          
          <div className="ml-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10 flex items-center justify-center border border-blue-200/50 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10">
        {/* أزرار الحسابات */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group/btn overflow-hidden relative"
          >
            <Link href={`/engineer/projects/${project.id}/concrete-cards`}>
              <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
              <HardHat className="h-5 w-5 ml-2 relative z-10" />
              <span className="relative z-10">حساب الباطون</span>
            </Link>
          </Button>
          
          <Button
            asChild
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group/btn overflow-hidden relative"
          >
            <Link href={`/engineer/projects/${project.id}/steel-calculations`}>
              <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
              <BarChart3 className="h-5 w-5 ml-2 relative z-10" />
              <span className="relative z-10">حساب الحديد</span>
            </Link>
          </Button>
        </div>
        
        <Separator className="my-4 opacity-50" />
        
        {/* أزرار إضافية */}
        <div className="flex items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="w-full border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-300 rounded-xl"
          >
            <Link href={`/engineer/projects/${project.id}`}>
              <FileText className="h-4 w-4 ml-2" />
              تفاصيل المشروع
            </Link>
          </Button>
        </div>
      </CardContent>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 text-right" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border border-gray-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="text-center border-b border-gray-200/50 pb-8 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl animate-pulse">
                <Calculator className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-black text-slate-900 mb-2">حساب كميات المواد</CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                يُرجى الانتظار ريثما يتم تحميل مشاريعك النشطة
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border border-gray-200/50 rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-6" />
                      <Skeleton className="h-12 w-full rounded-xl mb-3" />
                      <Skeleton className="h-12 w-full rounded-xl" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border border-gray-200/50 rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-gray-200/50 pb-6">
            <div className="space-y-6">
              {/* العنوان والتحكم */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl lg:text-4xl font-black text-slate-900 mb-1">
                      حساب كميات المواد
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      اختر مشروعاً للبدء بحساب كميات الباطون أو الحديد
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshProjects}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    تحديث
                  </Button>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-xl border border-blue-200">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">{projectStats.total} مشروع</span>
                  </div>
                </div>
              </div>

              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600 font-semibold">قيد التنفيذ</p>
                    <p className="text-xl font-bold text-green-800">{projectStats.inProgress}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-semibold">مخطط له</p>
                    <p className="text-xl font-bold text-blue-800">{projectStats.planned}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-semibold">مكتمل</p>
                    <p className="text-xl font-bold text-purple-800">{projectStats.completed || 0}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">إجمالي المشاريع</p>
                    <p className="text-xl font-bold text-slate-800">{projectStats.total}</p>
                  </div>
                </div>
              </div>

              {/* أدوات البحث والتصفية */}
              <div className="bg-gradient-to-r from-gray-50/50 to-blue-50/50 border border-gray-200/50 rounded-2xl p-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ابحث بالاسم أو الموقع أو الوصف..."
                      className="pl-11 h-12 rounded-xl border-gray-300 focus:border-blue-400"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Filter className="h-5 w-5 text-blue-600" />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-300 focus:border-blue-400">
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
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <ArrowUpDown className="h-5 w-5 text-blue-600" />
                    </div>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-300 focus:border-blue-400">
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
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
                  <Tabs defaultValue="all" className="w-full sm:w-auto">
                    <TabsList className="grid grid-cols-4 w-full sm:w-auto bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger 
                        value="all" 
                        onClick={() => setStatusFilter('all')}
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        الكل
                      </TabsTrigger>
                      <TabsTrigger 
                        value="قيد التنفيذ" 
                        onClick={() => setStatusFilter('قيد التنفيذ')}
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        قيد التنفيذ
                      </TabsTrigger>
                      <TabsTrigger 
                        value="مخطط له" 
                        onClick={() => setStatusFilter('مخطط له')}
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        مخطط له
                      </TabsTrigger>
                      <TabsTrigger 
                        value="مكتمل" 
                        onClick={() => setStatusFilter('مكتمل')}
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        مكتمل
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-lg"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-lg"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            {filteredAndSorted.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">لا توجد مشاريع مطابقة</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  لا توجد مشاريع مطابقة لمرشّحات البحث الحالية. قم بتعديل البحث أو تصفية الحالة لإظهار مشاريع أخرى.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                    className="rounded-xl border-gray-300 hover:border-blue-400"
                  >
                    مسح التصفية
                  </Button>
                  <Button 
                    asChild 
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Link href="/engineer/dashboard">
                      العودة إلى لوحة التحكم
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1'
                }`}
              >
                {filteredAndSorted.map((project, index) => (
                  <div 
                    key={project.id} 
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProjectCard project={project} index={index} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* زر العودة فقط - محسّن */}
        <div className="max-w-7xl mx-auto mt-8">
          <Button 
            asChild 
            variant="outline" 
            className="w-full sm:w-auto rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white font-medium transition-all duration-300 group"
          >
            <Link href="/engineer/dashboard" className="flex items-center justify-center gap-2">
              <span>العودة إلى لوحة التحكم</span>
              <ArrowRight className="h-4 w-4 mr-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}