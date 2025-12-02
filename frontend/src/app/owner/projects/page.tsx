"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Briefcase as ProjectsIcon, Loader2, Info, LayoutDashboard, Filter, Plus } from 'lucide-react';
import { getProjects as dbGetProjects, type Project, type ProjectStatusType } from "@/lib/db";
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function OwnerProjectsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      setUserId(id);
      if (!id) {
        toast({
          title: "مستخدم غير معروف",
          description: "لم يتم العثور على معلومات المستخدم. يرجى تسجيل الدخول مرة أخرى.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }
  }, [toast]);

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
        const result = await dbGetProjects(userId, userRole || undefined, userEmail || undefined);
        if (result.success && result.projects) {
          setProjects(result.projects);
        } else {
          toast({ title: "خطأ", description: result.message || "فشل تحميل المشاريع.", variant: "destructive" });
          setProjects([]);
        }
      } catch (error) {
        console.error("Error fetching projects for owner:", error);
        toast({ title: "خطأ فادح", description: "حدث خطأ أثناء تحميل بيانات المشاريع.", variant: "destructive" });
        setProjects([]);
      }
      setIsLoading(false);
    }

    if (userId) {
      fetchOwnerProjects();
    }
  }, [userId, toast]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === 'all' || project.status === statusFilter)
    );
  }, [projects, searchTerm, statusFilter]);

  const projectStatusOptions: { value: ProjectStatusType | 'all'; label: string }[] = [
    { value: 'all', label: 'جميع الحالات' },
    { value: 'مخطط له', label: 'مخطط له' },
    { value: 'قيد التنفيذ', label: 'قيد التنفيذ' },
    { value: 'مكتمل', label: 'مكتمل' },
    { value: 'مؤرشف', label: 'مؤرشف' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مكتمل': return 'bg-green-100 text-green-800 border-green-200';
      case 'قيد التنفيذ': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'مخطط له': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'مؤرشف': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">مشاريعي</h1>
          <p className="text-gray-600">
            عرض وإدارة جميع مشاريع البناء المرتبطة بحسابك
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/owner/dashboard">
            <LayoutDashboard className="ml-2 h-4 w-4" />
            العودة إلى لوحة التحكم
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">إجمالي المشاريع</p>
                <p className="text-2xl font-bold text-blue-900">{projects.length}</p>
              </div>
              <div className="p-2 bg-blue-200 rounded-lg">
                <ProjectsIcon className="h-5 w-5 text-blue-600" />
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
                <Loader2 className="h-5 w-5 text-yellow-600" />
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
                <Eye className="h-5 w-5 text-green-600" />
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
                <LayoutDashboard className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-gray-900">قائمة المشاريع</CardTitle>
              <CardDescription className="text-gray-600">
                يمكنك تصفية المشاريع والبحث عنها ومشاهدة تفاصيلها
              </CardDescription>
            </div>
            
            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث باسم المشروع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-gray-50 border-gray-300 focus:bg-white"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-gray-50 border-gray-300 focus:bg-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="حالة المشروع" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {projectStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-600">جاري تحميل المشاريع...</p>
            </div>
          ) : !userId ? (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <Info className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800">مستخدم غير مسجل</AlertTitle>
              <AlertDescription className="text-red-700">
                يرجى تسجيل الدخول أولاً لعرض مشاريعك.
                <Link href="/owner-login" className="font-semibold text-red-800 hover:underline mr-1">
                  تسجيل الدخول كمالك
                </Link>
              </AlertDescription>
            </Alert>
          ) : filteredProjects.length > 0 ? (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 text-right">المشروع</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">الحالة</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">التقدم</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <Link 
                            href={`/owner/projects/${project.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block"
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`border ${getStatusColor(project.status)} font-medium`}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Progress 
                              value={project.overallProgress || 0} 
                              className="flex-1 h-2 bg-gray-200"
                            />
                            <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                              {project.overallProgress || 0}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            آخر تحديث: {new Date(project.updatedAt || project.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                        >
                          <Link href={`/owner/projects/${project.id}`}>
                            <Eye className="h-4 w-4 ml-1" />
                            عرض التفاصيل
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <ProjectsIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  {projects.length === 0 && !searchTerm && statusFilter === 'all' 
                    ? 'لا توجد مشاريع حالياً' 
                    : 'لم يتم العثور على مشاريع'
                  }
                </h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto">
                  {projects.length === 0 && !searchTerm && statusFilter === 'all' 
                    ? 'عندما يقوم المهندس بربط مشروع ببريدك الإلكتروني، سيظهر هنا.' 
                    : 'جرب تعديل كلمات البحث أو إعادة ضبط الفلتر'
                  }
                </p>
              </div>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  إعادة ضبط البحث
                </Button>
              )}
            </div>
          )}

          {/* Results Count */}
          {filteredProjects.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                عرض <span className="font-semibold">{filteredProjects.length}</span> من أصل{' '}
                <span className="font-semibold">{projects.length}</span> مشروع
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="font-normal">
                    {projectStatusOptions.find(opt => opt.value === statusFilter)?.label}
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="font-normal">
                    بحث: {searchTerm}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}