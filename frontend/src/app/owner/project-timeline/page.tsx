"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProjects, type Project } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GanttChartSquare, Info, Clock, Calendar, User, FileText, BarChart3, TrendingUp, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';


export default function OwnerProjectTimelinePage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError("غير مصرح به. يرجى تسجيل الدخول لعرض هذه الصفحة.");
        setIsLoading(false);
        return;
      }

      try {
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        const result = await getProjects(userId, userRole || undefined, userEmail || undefined);
        if (result.success && result.projects) {
          setProjects(result.projects);
        } else {
          setError(result.message || "فشل تحميل قائمة المشاريع.");
          toast({
            title: "خطأ",
            description: result.message || "فشل تحميل قائمة المشاريع.",
            variant: "destructive",
          });
        }
      } catch (e) {
         setError("حدث خطأ غير متوقع أثناء جلب البيانات.");
         console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد التنفيذ':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200';
      case 'مكتمل':
        return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200';
      case 'مخطط له':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      case 'مؤرشف':
        return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'قيد التنفيذ':
        return <PlayCircle className="h-4 w-4" />;
      case 'مكتمل':
        return <CheckCircle className="h-4 w-4" />;
      case 'مخطط له':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
       return (
         <Alert variant="destructive">
            <Info className="h-5 w-5" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
       )
    }

    if (projects.length > 0) {
      return (
        <div className="space-y-6">
          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">إجمالي المشاريع</p>
                    <p className="text-2xl font-bold text-blue-900">{projects.length}</p>
                  </div>
                  <div className="p-2 bg-blue-200 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">قيد التنفيذ</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {projects.filter(p => p.status === 'قيد التنفيذ').length}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-200 rounded-lg">
                    <PlayCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">مكتملة</p>
                    <p className="text-2xl font-bold text-green-900">
                      {projects.filter(p => p.status === 'مكتمل').length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">متوسط الإنجاز</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {projects.length > 0 
                        ? Math.round(projects.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / projects.length) 
                        : 0
                      }%
                    </p>
                  </div>
                  <div className="p-2 bg-purple-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* قائمة المشاريع المحسنة */}
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-r from-white to-gray-50/50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* معلومات المشروع */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(project.status)} font-medium flex items-center gap-1`}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </Badge>
                      </div>

                      {/* تفاصيل إضافية */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>المهندس: {project.engineer || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>تاريخ الإنشاء: {new Date(project.createdAt || Date.now()).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>المهام: {project.timelineTasks?.length || 0}</span>
                        </div>
                      </div>

                      {/* شريط التقدم */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">نسبة الإنجاز</span>
                          <span className="text-sm font-bold text-gray-900">{project.overallProgress || 0}%</span>
                        </div>
                        <Progress 
                          value={project.overallProgress || 0} 
                          className="h-2 bg-gray-200"
                        />
                      </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:w-48">
                      <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                        <Link href={`/owner/projects/${project.id}/timeline`}>
                          <GanttChartSquare className="ml-2 h-4 w-4" />
                          عرض الجدول الزمني
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="border-gray-300 hover:bg-green-600 hover:text-white hover:border-green-600 transition-all duration-200">
                        <Link href={`/owner/projects/${project.id}`}>
                          <FileText className="ml-2 h-4 w-4" />
                          تفاصيل المشروع
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    
    return (
       <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg" data-ai-hint="no projects timeline">
            <Info size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="font-semibold">لا توجد مشاريع لعرضها</p>
            <p className="text-sm">لم يتم ربط أي مشاريع بحسابك بعد.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 text-right">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
            <GanttChartSquare className="h-8 w-8 text-white" />
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
          الجداول الزمنية للمشاريع
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          تابع تقدم مشاريعك وجداولها الزمنية بشكل تفصيلي ومرئي. اختر مشروعًا لعرض الجدول الزمني الخاص به.
        </p>
      </div>

      {/* Main Content */}
      <Card className="bg-white/95 shadow-xl border-0">
        <CardContent className="p-8">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
