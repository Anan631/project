"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Briefcase, FileText, Camera, Clock, MessageSquare,
  BarChart2, CheckCircle, PlayCircle, Loader2, Eye, Calculator,
  ArrowLeft, BarChartHorizontal, SlidersHorizontal, BookOpen, Hand
} from 'lucide-react';
import { getProjects, type Project } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function OwnerDashboardPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      const name = localStorage.getItem('userName');
      setUserId(id);
      setOwnerName(name);
    }
  }, []);

  useEffect(() => {
    async function fetchOwnerProjects() {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        const result = await getProjects(userId, userRole || undefined, userEmail || undefined);
        if (result.success && result.projects) {
          setProjects(result.projects);
        } else {
          toast({
            title: "خطأ في التحميل",
            description: result.message || "فشل تحميل المشاريع.",
            variant: "destructive"
          });
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects for owner:", error);
        toast({
          title: "خطأ فادح",
          description: "حدث خطأ أثناء تحميل بيانات المشاريع.",
          variant: "destructive"
        });
        setProjects([]);
      }
      setIsLoading(false);
    }

    if (userId) {
      fetchOwnerProjects();
    }
  }, [userId, toast]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'قيد التنفيذ').length;
  const completedProjects = projects.filter(p => p.status === 'مكتمل').length;
  const averageProgress = totalProjects > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / totalProjects) : 0;

  const recentProjects = projects.sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 3);

  const overviewStats = [
    {
      label: 'إجمالي المشاريع',
      value: totalProjects,
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'المشاريع قيد التنفيذ',
      value: activeProjects,
      icon: PlayCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100'
    },
    {
      label: 'المشاريع المكتملة',
      value: completedProjects,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'متوسط الإنجاز الكلي',
      value: `${averageProgress}%`,
      icon: BarChartHorizontal,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ];

  const quickAccessLinks = [
    {
      title: "تقارير الكميات",
      description: "عرض ملخصات وتقارير كميات المواد والأعمال المنجزة.",
      href: "/owner/quantity-reports",
      icon: FileText,
      iconColorClass: "text-indigo-500",
      buttonClass: "border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white",
    },
    {
      title: "التقدم البصري",
      description: "مشاهدة أحدث الصور والفيديوهات المرفوعة من موقع المشروع.",
      href: "/owner/projects",
      icon: Camera,
      iconColorClass: "text-purple-500",
      buttonClass: "border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white",
    },
    {
      title: "الجداول الزمنية",
      description: "متابعة الجدول الزمني للمشروع والمراحل الهامة.",
      href: "/owner/project-timeline",
      icon: Clock,
      iconColorClass: "text-cyan-500",
      buttonClass: "border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white",
    },
    {
      title: "التعليقات والاستفسارات",
      description: "التواصل مع المهندس وترك ملاحظاتك واستفساراتك.",
      href: "/owner/projects",
      icon: MessageSquare,
      iconColorClass: "text-orange-500",
      buttonClass: "border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white",
    },
    {
      title: "حاسبة التكاليف",
      description: "استخدام حاسبة تقديرية بسيطة لتكاليف المواد.",
      href: "/owner/cost-estimator",
      icon: Calculator,
      iconColorClass: "text-red-500",
      buttonClass: "border-red-500 text-red-600 hover:bg-red-500 hover:text-white",
    },
    {
      title: "إرشادات لصاحب البناء",
      description: "نصائح وإرشادات مهمة قبل الإقدام على إنشاء مبنى.",
      href: "/owner/building-guidelines",
      icon: BookOpen,
      iconColorClass: "text-green-500",
      buttonClass: "border-green-500 text-green-600 hover:bg-green-500 hover:text-white",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد التنفيذ':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'مكتمل':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'معلق':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-5">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  مرحباً بك، {ownerName || 'أيها المالك'}!
                </h1>
                <div className="relative animate-bounce">
                  <div className="absolute inset-0 bg-sky-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                  <Hand className="relative h-12 w-12 stroke-sky-600 fill-none transform rotate-12 drop-shadow-lg" />
                </div>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
                هذه هي لوحة التحكم الخاصة بك حيث يمكنك متابعة مشاريعك، عرض التقارير التفصيلية،
                وإدارة جميع جوانب مشاريع البناء الخاصة بك.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="text-right">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-8 w-[50px] mt-1" />
                  </div>
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                </CardContent>
              </Card>
            ))
          ) : (
            overviewStats.map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                      <Icon className={`h-7 w-7 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Recent Projects */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
          <CardHeader className="pb-4 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-sky-600" />
                <CardTitle className="text-2xl font-bold text-slate-800">أحدث المشاريع</CardTitle>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Link href="/owner/projects" className="flex items-center gap-2">
                  <span>عرض جميع المشاريع</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="text-right font-semibold text-slate-700 text-lg py-4">
                      اسم المشروع
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 text-lg py-4">
                      الحالة
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 text-lg py-4">
                      تاريخ البدء
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 text-lg py-4">
                      نسبة الإنجاز
                    </TableHead>
                    <TableHead className="text-center font-semibold text-slate-700 text-lg py-4">
                      الإجراءات
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-[100px] mx-auto rounded-xl" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentProjects.length > 0 ? (
                    recentProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium py-4">
                          <Link
                            href={`/owner/projects/${project.id}`}
                            className="hover:text-sky-600 transition-colors font-semibold"
                          >
                            {project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-slate-600">
                          {project.startDate ? new Date(project.startDate).toLocaleDateString('en-CA') : 'غير محدد'}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Progress
                              value={project.overallProgress || 0}
                              className="w-full h-2.5 rounded-full"
                              indicatorColor={
                                (project.overallProgress || 0) >= 80 ? 'bg-emerald-500' :
                                  (project.overallProgress || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }
                            />
                            <span className="text-sm font-medium w-10 text-slate-700">
                              {project.overallProgress || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <Button
                            asChild
                            size="sm"
                            className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors duration-200"
                          >
                            <Link href={`/owner/projects/${project.id}`} className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              تفاصيل
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-12">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Briefcase className="h-12 w-12 text-slate-300" />
                          <p className="text-lg">لا توجد مشاريع لعرضها حالياً.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Tools */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
          <CardHeader className="pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-6 w-6 text-sky-600" />
              <CardTitle className="text-2xl font-bold text-slate-800">الأدوات والتقارير</CardTitle>
            </div>
            <CardDescription className="text-right text-slate-600">
              وصول سريع إلى جميع الأدوات والتقارير التي تحتاجها لإدارة مشاريعك
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickAccessLinks.map((category) => {
                const Icon = category.icon;
                return (
                  <Card
                    key={category.title}
                    className="bg-white border border-slate-200/80 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-start gap-3 mb-4">
                        <Icon className={cn("h-8 w-8", category.iconColorClass)} />
                        <h3 className="text-xl font-bold text-slate-800">{category.title}</h3>
                      </div>
                      <p className="text-slate-600 text-sm mb-5 leading-relaxed">{category.description}</p>
                      <Button
                        asChild
                        variant="outline"
                        className={cn("w-full flex justify-between items-center font-semibold rounded-xl", category.buttonClass)}
                      >
                        <Link href={category.href}>
                          <span>الانتقال إلى القسم</span>
                          <ArrowLeft className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}