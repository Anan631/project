"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Search, Trash2, AlertTriangle, Loader2, Check, ArchiveRestore, Folder, User, Building, Filter, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  type Project,
  type ProjectStatusType,
  getProjects,
  deleteProject,
  updateProject,
  restoreProject
} from '@/lib/db';

export default function AdminProjectsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'loading' | 'success'>('confirm');
  
  const [projectToRestore, setProjectToRestore] = useState<Project | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    setCurrentUserId(id);
    setCurrentUserRole(role);
    setAdminUserId(id);
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(project =>
      (project.name.toLowerCase().includes(searchTerm) ||
      (project.engineer?.toLowerCase().includes(searchTerm)) ||
      (project.clientName?.toLowerCase().includes(searchTerm))
 ) &&
      (statusFilter === 'all' || project.status === statusFilter));
  }, [projects, searchTerm, statusFilter]);
  
  async function loadProjects() {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await getProjects(currentUserId, currentUserRole || 'ADMIN');
    if (result.success && result.projects) {
      setProjects(result.projects);
    } else {
      toast({ 
        title: "⚠️ خطأ في التحميل", 
        description: result.message || "فشل تحميل المشاريع.", 
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, [currentUserId, currentUserRole]);

  const handleOpenDeleteDialog = (project: Project) => {
    setProjectToDelete(project);
    setDeleteStep('confirm');
    setIsDeleteDialogOpen(true);
  };
  
  const handleOpenRestoreDialog = (project: Project) => {
    setProjectToRestore(project);
    setIsRestoreDialogOpen(true);
  };

  async function handleDeleteProject() {
    if (!projectToDelete || !adminUserId) return;
    setDeleteStep('loading');

    const result = await deleteProject(projectToDelete.id.toString(), currentUserId || undefined, adminUserId);
    if (result.success) {
      setDeleteStep('success');
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        loadProjects();
      }, 1500);
    } else {
      toast({ 
        title: "❌ خطأ في الحذف", 
        description: result.message, 
        variant: "destructive" 
      });
      setIsDeleteDialogOpen(false);
    }
  }
  
  async function handleRestoreProject() {
    if (!projectToRestore || !adminUserId) return;
    
    const result = await restoreProject(projectToRestore.id.toString(), adminUserId);
    if (result.success) {
      toast({ 
        title: "✅ تم الاستعادة بنجاح", 
        description: result.message || "تم استعادة المشروع بنجاح.", 
        variant: "default" 
      });
      loadProjects();
    } else {
      toast({ 
        title: "❌ خطأ في الاستعادة", 
        description: result.message || "فشل استعادة المشروع.", 
        variant: "destructive" 
      });
    }
    setIsRestoreDialogOpen(false);
  }

  const getStatusBadge = (status: string, isDeleted: boolean = false) => {
    if (isDeleted) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium">
          <Trash2 className="h-3.5 w-3.5" />
          محذوف
        </Badge>
      );
    }

    const statusConfig = {
      'مكتمل': { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        icon: Check,
        gradient: 'from-emerald-400 to-emerald-500'
      },
      'قيد التنفيذ': { 
        color: 'bg-sky-50 text-sky-700 border-sky-200', 
        icon: Loader2,
        gradient: 'from-sky-400 to-sky-500'
      },
      'مخطط له': { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: AlertTriangle,
        gradient: 'from-amber-400 to-amber-500'
      },
      'مؤرشف': { 
        color: 'bg-slate-50 text-slate-700 border-slate-200', 
        icon: ArchiveRestore,
        gradient: 'from-slate-400 to-slate-500'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['مؤرشف'];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium transition-all hover:scale-105`}>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient}`}></div>
        <IconComponent className="h-3.5 w-3.5" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                <Folder className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  إدارة المشاريع
                </h1>
                <p className="text-slate-600 text-lg mt-1">إدارة ومتابعة جميع المشاريع الإنشائية في النظام</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-sky-600">{projects.length}</p>
                  <p className="text-sm text-slate-500">إجمالي المشاريع</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center">
                  <Folder className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Stats Cards */}
          <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 text-sm">المكتملة</span>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">
                    {projects.filter(p => p.status === 'مكتمل').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 text-sm">قيد التنفيذ</span>
                  <Badge className="bg-sky-100 text-sky-700 border-0">
                    {projects.filter(p => p.status === 'قيد التنفيذ').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 text-sm">مخطط لها</span>
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    {projects.filter(p => p.status === 'مخطط له').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 text-sm">المؤرشفة</span>
                  <Badge className="bg-slate-100 text-slate-700 border-0">
                    {projects.filter(p => p.status === 'مؤرشف').length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="lg:col-span-3 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-emerald-400 rounded-full"></div>
                    قائمة المشاريع
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    إدارة جميع المشاريع في النظام
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={loadProjects}
                    variant="outline" 
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-all duration-300 rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تحديث
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="ابحث باسم المشروع، المهندس، أو المالك..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pr-12 bg-white border-slate-200 focus:border-sky-300 shadow-sm h-12 rounded-xl text-lg"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
                  <SelectTrigger className="w-full lg:w-64 bg-white border-slate-200 focus:border-sky-300 text-right h-12 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Filter className="h-5 w-5 text-slate-400" />
                      <SelectValue placeholder="جميع الحالات" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-lg">جميع الحالات</SelectItem>
                    <SelectItem value="مكتمل" className="text-lg">مكتمل</SelectItem>
                    <SelectItem value="قيد التنفيذ" className="text-lg">قيد التنفيذ</SelectItem>
                    <SelectItem value="مخطط له" className="text-lg">مخطط له</SelectItem>
                    <SelectItem value="مؤرشف" className="text-lg">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Projects Table */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Folder className="h-8 w-8 text-sky-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold text-slate-700">جاري تحميل المشاريع</p>
                    <p className="text-slate-500">يرجى الانتظار...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/50 hover:bg-transparent border-b-2 border-slate-100">
                        <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                          <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-sky-600" />
                            اسم المشروع
                          </div>
                        </TableHead>
                        <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-5 w-5 text-sky-600" />
                            المهندس المسؤول
                          </div>
                        </TableHead>
                        <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-sky-600" />
                            المالك
                          </div>
                        </TableHead>
                        <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                          الحالة
                        </TableHead>
                        <TableHead className="text-center font-bold text-slate-700 text-lg py-4">
                          الإجراءات
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.length > 0 ? filteredProjects.map((project) => {
                        const isDeleted = (project as any).projectStatus === 'DELETED';
                        return (
                          <TableRow key={project.id} className="group hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-emerald-50/30 transition-all duration-300 border-b border-slate-100/50">
                            <TableCell className="py-4">
                              {/* رابط العرض مع تعطيل مؤقت - يمكن تفعيله لاحقًا */}
                              <div className="font-semibold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center">
                                  <Folder className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-lg">{project.name}</span>
                              </div>
                              {/* الرابط الأصلي معطل حالياً:
                              <Link 
                                href={`/engineer/projects/${project.id}`}
                                className="font-semibold text-slate-800 hover:text-sky-600 flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-300"
                              >
                                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center">
                                  <Folder className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-lg">{project.name}</span>
                              </Link>
                              */}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3 text-slate-700">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <User className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="text-lg">{project.engineer || 'غير محدد'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3 text-slate-700">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <Building className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="text-lg">{project.clientName || 'غير محدد'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-col gap-2">
                                {getStatusBadge(project.status)}
                                {isDeleted && getStatusBadge('', true)}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex justify-center gap-2">
                                {isDeleted ? (
                                  <Button 
                                    variant="ghost"
                                    onClick={() => handleOpenRestoreDialog(project)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105"
                                  >
                                    <ArchiveRestore className="h-5 w-5 ml-2" />
                                    استعادة
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost"
                                    onClick={() => handleOpenDeleteDialog(project)}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl px-4 py-2 transition-all duration-300 hover:scale-105"
                                  >
                                    <Trash2 className="h-5 w-5 ml-2" />
                                    حذف
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4 text-slate-500">
                              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                                <Folder className="h-10 w-10 text-slate-300" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-xl font-semibold">لا توجد مشاريع</p>
                                <p className="text-slate-400">لم يتم العثور على مشاريع تطابق معايير البحث</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Table Footer */}
              {!isLoading && filteredProjects.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-slate-600 text-sm">
                    عرض <span className="font-semibold text-sky-600">{filteredProjects.length}</span> من أصل{' '}
                    <span className="font-semibold text-sky-600">{projects.length}</span> مشروع
                  </p>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    تم تحميل جميع البيانات
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm">
            {deleteStep === 'confirm' && projectToDelete && (
                <>
                    <AlertDialogHeader className="text-center items-center space-y-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100 border-8 border-rose-50/50">
                            <Trash2 className="h-12 w-12 text-rose-500" />
                        </div>
                        <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                          تأكيد الحذف
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription asChild>
                        <div className="text-center text-base text-slate-600 space-y-6">
                            <p className="text-lg">هل أنت متأكد من رغبتك في حذف المشروع بشكل نهائي؟</p>
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-3">
                                <p className="font-semibold text-rose-700">المشروع المراد حذفه:</p>
                                <p className="text-2xl font-bold text-rose-600">{projectToDelete.name}</p>
                            </div>
                            <div className="flex items-center gap-3 justify-center text-rose-600 bg-rose-50 p-4 rounded-2xl">
                              <AlertTriangle className="h-6 w-6" />
                              <p className="font-medium">هذا الإجراء لا يمكن التراجع عنه</p>
                            </div>
                        </div>
                    </AlertDialogDescription>
                    <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-3 pt-6">
                        <Button 
                          onClick={handleDeleteProject}
                          className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          <Trash2 className="h-5 w-5 ml-2" />
                          تأكيد الحذف
                        </Button>
                        <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
                          إلغاء الأمر
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </>
            )}
            {deleteStep === 'loading' && (
                <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                        <Trash2 className="absolute inset-0 m-auto h-8 w-8 text-sky-600 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-sky-600">جاري الحذف...</h2>
                        <p className="text-slate-500 text-lg">يتم الآن حذف المشروع من النظام</p>
                    </div>
                </div>
            )}
            {deleteStep === 'success' && (
                <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
                    <div className="h-28 w-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center ring-8 ring-emerald-50">
                        <Check className="h-14 w-14 text-emerald-500" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-emerald-600">تم الحذف بنجاح</h2>
                        <p className="text-slate-500 text-lg">تم حذف المشروع بنجاح من النظام</p>
                    </div>
                </div>
            )}
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm">
           {projectToRestore && (
             <>
              <AlertDialogHeader className="text-center items-center space-y-6">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border-8 border-emerald-50/50">
                  <ArchiveRestore className="h-12 w-12 text-emerald-500" />
                </div>
                <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  تأكيد الاستعادة
                </AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription className="text-center text-base text-slate-600 space-y-6">
                <p className="text-lg">هل أنت متأكد من رغبتك في استعادة هذا المشروع؟</p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
                  <p className="font-semibold text-emerald-700">المشروع المراد استعادته:</p>
                  <p className="text-2xl font-bold text-emerald-600">{projectToRestore.name}</p>
                </div>
                <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-2xl">
                  سيتم تغيير حالة المشروع إلى "قيد التنفيذ" وسيظهر مجدداً في القائمة الرئيسية
                </p>
              </AlertDialogDescription>
              <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-3 pt-6">
                <AlertDialogAction 
                  onClick={handleRestoreProject}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <ArchiveRestore className="h-5 w-5 ml-2" />
                  تأكيد الاستعادة
                </AlertDialogAction>
                <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
                  إلغاء الأمر
                </AlertDialogCancel>
              </AlertDialogFooter>
             </>
           )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}