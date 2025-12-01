"use client";

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Eye, Loader2, Info, PlusCircle, Edit, Archive, MapPin,
  FolderKanban, Trash2, Printer, Check, Filter, Calendar,
  MoreHorizontal, Grid, List, RefreshCw, User, Clock,
  BarChart3, TrendingUp, ChevronDown, X, CheckCircle, AlertCircle,
  PauseCircle, HardHat, Building2, Users, Target, Sparkles, Zap, ArchiveRestore
} from 'lucide-react';
import { getProjects as dbGetProjects, updateProject, deleteProject as dbDeleteProject, type Project, type ProjectStatusType } from "@/lib/db";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

// Server Actions
import { updateProjectAction } from './actions';

// Project Edit Dialog Manager
import ProjectEditDialogManager from '@/components/engineer/ProjectEditDialogManager';

export default function EngineerProjectsPage() {
  // استخدام سياق الشريط الجانبي
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    // التأكد من أن الشريط الجانبي يعمل بشكل صحيح عند تحميل الصفحة
    const sidebarState = localStorage.getItem('engineerSidebarState');
    if (sidebarState === null) {
      localStorage.setItem('engineerSidebarState', 'open');
    }

    // إضافة مستمع للنقر على زر تبديل الشريط الجانبي
    const handleSidebarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isToggleButton = target.closest('[aria-label*="الشريط الجانبي"]');

      if (isToggleButton) {
        console.log('تم النقر على زر تبديل الشريط الجانبي في صفحة المشاريع');
        // استخدام السياق لتبديل الشريط الجانبي
        toggleSidebar();
      }
    };

    // إضافة مستمع للنقرات في الصفحة
    document.addEventListener('click', handleSidebarClick);

    // تنظيف المستمع عند تفكيك المكون
    return () => {
      document.removeEventListener('click', handleSidebarClick);
    };
  }, [toggleSidebar]);

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatusType | 'all'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [showArchivedWarning, setShowArchivedWarning] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'loading' | 'success'>('confirm');

  // Optimized data fetching with useCallback
  const fetchEngineerProjects = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await dbGetProjects(userId);
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
  }, [userId, toast]);

  // Optimized refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchEngineerProjects();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث قائمة المشاريع بنجاح",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200"
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل تحديث قائمة المشاريع",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchEngineerProjects, toast]);

  useEffect(() => {
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
  }, [toast]);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      fetchEngineerProjects();
    }
  }, [userId, fetchEngineerProjects]);

  // Listen for project update event
  useEffect(() => {
    const handleProjectUpdated = () => {
      fetchEngineerProjects();
    };

    window.addEventListener('project-updated', handleProjectUpdated);

    return () => {
      window.removeEventListener('project-updated', handleProjectUpdated);
    };
  }, [fetchEngineerProjects]);

  // Memoized filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project =>
      (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (project.clientName && project.clientName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (statusFilter === 'all' || project.status === statusFilter)
    );

    // Sort projects
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'date':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projects, searchTerm, statusFilter, sortBy, sortOrder]);

  // Handle archive project
  const handleArchive = async (id: number, name: string) => {
    try {
      const result = await updateProject(id, { status: 'مؤرشف' });
      if (result.success) {
        toast({
          title: "تم أرشفة المشروع",
          description: `تم أرشفة المشروع "${name}" بنجاح.`,
          className: "bg-amber-50 text-amber-700 border-amber-200"
        });
        fetchEngineerProjects();
      } else {
        toast({
          title: "فشل أرشفة المشروع",
          description: result.message || "حدث خطأ أثناء أرشفة المشروع.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error archiving project:", error);
      toast({
        title: "خطأ في الأرشفة",
        description: "حدث خطأ غير متوقع أثناء أرشفة المشروع.",
        variant: "destructive"
      });
    }
  };

  // Handle unarchive project
  const handleUnarchive = async (id: number, name: string) => {
    try {
      const result = await updateProject(id, { status: 'قيد التنفيذ' });
      if (result.success) {
        toast({
          title: "تم إلغاء أرشفة المشروع",
          description: `تم إلغاء أرشفة المشروع "${name}" بنجاح.`,
          className: "bg-emerald-50 text-emerald-700 border-emerald-200"
        });
        fetchEngineerProjects();
      } else {
        toast({
          title: "فشل إلغاء أرشفة المشروع",
          description: result.message || "حدث خطأ أثناء إلغاء أرشفة المشروع.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error unarchiving project:", error);
      toast({
        title: "خطأ في إلغاء الأرشفة",
        description: "حدث خطأ غير متوقع أثناء إلغاء أرشفة المشروع.",
        variant: "destructive"
      });
    }
  };

  // Handle delete project
  const handleDelete = async (project: Project) => {
    setItemToDelete(project);
    setIsDeleteDialogOpen(true);
    setDeleteStep('confirm');
  };

  // Confirm delete project
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleteStep('loading');
    try {
      const result = await dbDeleteProject(itemToDelete.id);
      if (result.success) {
        setDeleteStep('success');
        toast({
          title: "تم حذف المشروع",
          description: `تم حذف المشروع "${itemToDelete.name}" بنجاح.`,
          className: "bg-red-50 text-red-700 border-red-200"
        });
        fetchEngineerProjects();

        // Close dialog after a short delay
        setTimeout(() => {
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
          setDeleteStep('confirm');
        }, 1500);
      } else {
        setDeleteStep('confirm');
        toast({
          title: "فشل حذف المشروع",
          description: result.message || "حدث خطأ أثناء حذف المشروع.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setDeleteStep('confirm');
      console.error("Error deleting project:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ غير متوقع أثناء حذف المشروع.",
        variant: "destructive"
      });
    }
  };

  // Handle print report
  const handlePrintReport = () => {
    const projectsToPrint = filteredProjects.filter(p => p.status !== 'مؤرشف');

    if (projectsToPrint.length === 0) {
      toast({
        title: "لا توجد مشاريع للطباعة",
        description: "القائمة الحالية فارغة. قم بتغيير الفلاتر أو أضف مشاريع.",
        variant: "default"
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const engineerName = filteredProjects[0]?.engineer || 'غير معروف';
      const totalBudget = filteredProjects.reduce((acc, p) => acc + (p.budget || 0), 0);

      const tableRows = filteredProjects.map(project => `
        <tr>
          <td>${project.name}</td>
          <td>${project.clientName || 'غير محدد'}</td>
          <td><span class="status status-${project.status.replace(/\s/g, '-')}">${project.status}</span></td>
          <td>${project.location || 'غير محدد'}</td>
          <td>${project.budget ? `${project.budget.toLocaleString()} ₪` : 'غير محدد'}</td>
          <td>${project.createdAt ? new Date(project.createdAt).toLocaleDateString('ar-EG-u-nu-latn') : 'غير محدد'}</td>
        </tr>
      `).join('');

      const reportHtml = `
        <html>
          <head>
            <title>تقرير المشاريع</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
            <style>
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
              }
              body {
                font-family: 'Tajawal', sans-serif;
                direction: rtl;
                background-color: #f3f4f6;
                margin: 0;
                padding: 20px;
                color: #1f2937;
              }
              .container {
                max-width: 1200px;
                margin: auto;
                background: linear-gradient(to bottom, #ffffff, #f9fafb);
                padding: 40px 50px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
                border: 1px solid #e5e7eb;
              }
              .report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 25px;
                border-bottom: 4px solid #4f46e5;
                margin-bottom: 30px;
              }
              .report-header img {
                max-height: 70px;
                border-radius: 8px;
              }
              .report-header .titles {
                text-align: right;
              }
              .report-header h1 {
                margin: 0;
                color: #312e81;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: -1px;
              }
              .report-header p {
                margin: 8px 0 0;
                font-size: 18px;
                color: #4b5563;
              }
              .report-meta {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
              }
              .meta-item {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
                gap: 5px;
              }
              .meta-item .label {
                font-size: 14px;
                color: #6b7280;
              }
              .meta-item .value {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              th, td {
                padding: 12px 15px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
              }
              th {
                background-color: #f3f4f6;
                font-weight: 600;
                color: #374151;
              }
              tr:hover {
                background-color: #f9fafb;
              }
              .status {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                display: inline-block;
              }
              .status-قيد-التنفيذ {
                background-color: #dbeafe;
                color: #1e40af;
              }
              .status-مكتمل {
                background-color: #d1fae5;
                color: #065f46;
              }
              .status-مؤرشف {
                background-color: #f3f4f6;
                color: #4b5563;
              }
              .status-مخطط-له {
                background-color: #fef3c7;
                color: #92400e;
              }
              .report-footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="report-header">
                <div class="titles">
                  <h1>تقرير المشاريع</h1>
                  <p>تقرير شامل بجميع المشاريع الإنشائية</p>
                </div>
              </div>

              <div class="report-meta">
                <div class="meta-item">
                  <div class="label">المهندس المسؤول</div>
                  <div class="value">${engineerName}</div>
                </div>
                <div class="meta-item">
                  <div class="label">عدد المشاريع</div>
                  <div class="value">${projectsToPrint.length}</div>
                </div>
                <div class="meta-item">
                  <div class="label">إجمالي الميزانية</div>
                  <div class="value">${totalBudget.toLocaleString()} ₪</div>
                </div>
                <div class="meta-item">
                  <div class="label">تاريخ التقرير</div>
                  <div class="value">${new Date().toLocaleDateString('ar-EG-u-nu-latn')}</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>اسم المشروع</th>
                    <th>المالك</th>
                    <th>الحالة</th>
                    <th>الموقع</th>
                    <th>الميزانية</th>
                    <th>تاريخ الإضافة</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              <footer class="report-footer">
                <p>هذا التقرير تم إنشاؤه بواسطة نظام إدارة المشاريع.</p>
                <p>&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة.</p>
              </footer>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast({
        title: "خطأ في الطباعة",
        description: "لم يتمكن المتصفح من فتح نافذة الطباعة. يرجى التحقق من إعدادات المتصفح.",
        variant: "destructive"
      });
    }
  };

  // Sort Handler
  const handleSort = (field: 'name' | 'date' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'date' | 'status') => {
    if (sortBy !== field) return <ChevronDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc' ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600 rotate-180" />;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl border-0 overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
            <CardHeader className="relative z-10 pb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <FolderKanban className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold">إدارة المشاريع الإنشائية</CardTitle>
                    <CardDescription className="text-blue-100 text-lg mt-1">
                      عرض، بحث، وإدارة جميع المشاريع المسندة إليك بدقة واحترافية
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm flex items-center gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    <span>تحديث</span>
                  </Button>
                  <Button
                    onClick={handlePrintReport}
                    variant="outline"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>طباعة</span>
                  </Button>
                  <Button asChild className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg flex items-center gap-2">
                    <Link href="/engineer/create-project">
                      <PlusCircle className="h-4 w-4" />
                      <span>مشروع جديد</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث عن مشروع حسب الاسم، الموقع أو العميل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as ProjectStatusType | 'all')}
                  >
                    <SelectTrigger className="w-48 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-100">
                      <SelectValue placeholder="حالة المشروع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                      <SelectItem value="مخطط له">مخطط له</SelectItem>
                      <SelectItem value="مؤرشف">مؤرشف</SelectItem>
                      <SelectItem value="مكتمل">مكتمل</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className={cn(
                        "transition-all duration-200 flex items-center gap-2",
                        viewMode === 'table'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'text-gray-600 hover:text-blue-600 border-gray-300'
                      )}
                    >
                      <List className="h-4 w-4" />
                      <span>جدول</span>
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "transition-all duration-200 flex items-center gap-2",
                        viewMode === 'grid'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'text-gray-600 hover:text-blue-600 border-gray-300'
                      )}
                    >
                      <Grid className="h-4 w-4" />
                      <span>بطاقات</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span>خيارات متقدمة</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isFilterMenuOpen && "rotate-180")} />
                  </Button>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">الترتيب حسب:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('name')}
                        className={cn(
                          "text-sm transition-colors flex items-center gap-1",
                          sortBy === 'name' ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
                        )}
                      >
                        <span>الاسم</span>
                        {getSortIcon('name')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('date')}
                        className={cn(
                          "text-sm transition-colors flex items-center gap-1",
                          sortBy === 'date' ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
                        )}
                      >
                        <span>التاريخ</span>
                        {getSortIcon('date')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('status')}
                        className={cn(
                          "text-sm transition-colors flex items-center gap-1",
                          sortBy === 'status' ? "text-blue-600 font-medium" : "text-gray-600 hover:text-blue-600"
                        )}
                      >
                        <span>الحالة</span>
                        {getSortIcon('status')}
                      </Button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isFilterMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <DatePickerWithRange />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">نوع المشروع</h4>
                          <Select defaultValue="all">
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر نوع المشروع" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع الأنواع</SelectItem>
                              <SelectItem value="residential">سكني</SelectItem>
                              <SelectItem value="commercial">تجاري</SelectItem>
                              <SelectItem value="industrial">صناعي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">الميزانية</h4>
                          <div className="flex items-center gap-2">
                            <Input placeholder="الحد الأدنى" className="flex-1" />
                            <span className="text-gray-500">-</span>
                            <Input placeholder="الحد الأعلى" className="flex-1" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div>
                          <Skeleton className="h-5 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <>
              {viewMode === 'table' ? (
                <Card className="shadow-sm border-0 bg-white overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b">
                        <TableHead className="font-semibold text-gray-700">المشروع</TableHead>
                        <TableHead className="font-semibold text-gray-700">العميل</TableHead>
                        <TableHead className="font-semibold text-gray-700">الموقع</TableHead>
                        <TableHead className="font-semibold text-gray-700">الحالة</TableHead>
                        <TableHead className="font-semibold text-gray-700">الميزانية</TableHead>
                        <TableHead className="font-semibold text-gray-700">التاريخ</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <TableRow key={project.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{project.name}</p>
                                <p className="text-sm text-gray-500">#{project.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{project.clientName || 'غير محدد'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{project.location || 'غير محدد'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-medium",
                                project.status === 'قيد التنفيذ' && "bg-blue-50 text-blue-700 border-blue-200",
                                project.status === 'مكتمل' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                project.status === 'مؤرشف' && "bg-slate-50 text-slate-700 border-slate-200",
                                project.status === 'مخطط له' && "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {project.budget ? `${project.budget.toLocaleString()} ₪` : 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            {project.createdAt ? new Date(project.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-start">
                              {project.status === 'مؤرشف' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-3 text-sky-600 hover:text-sky-800 hover:bg-sky-50"
                                  onClick={() => setShowArchivedWarning(true)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                  <Link href={`/engineer/projects/${project.id}`} className="flex items-center justify-center gap-2">
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                onClick={() => {
                                  const projectData = {
                                    id: project.id,
                                    name: project.name,
                                    location: project.location,
                                    description: project.description,
                                    startDate: project.startDate,
                                    endDate: project.endDate,
                                    status: project.status,
                                    clientName: project.clientName,
                                    budget: project.budget,
                                    linkedOwnerEmail: project.linkedOwnerEmail
                                  };
                                  // Create and dispatch a custom event to open the edit dialog
                                  window.dispatchEvent(new CustomEvent('open-edit-project', { detail: projectData }));
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {project.status === 'مؤرشف' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-3 text-sky-600 hover:text-sky-800 hover:bg-sky-50"
                                  onClick={() => handleUnarchive(project.id, project.name)}
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-3 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                  onClick={() => handleArchive(project.id, project.name)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-red-600 hover:text-red-800 hover:bg-red-50"
                                onClick={() => handleDelete(project)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card className="shadow-sm border-0 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <FolderKanban className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مشاريع</h3>
                    <p className="text-gray-500 mb-6 text-center max-w-md">
                      {searchTerm || statusFilter !== 'all'
                        ? "لم يتم العثور على مشاريع تطابق معايير البحث. حاول تغيير الفلاتر."
                        : "لم تقم بإنشاء أي مشاريع بعد. ابدأ بإنشاء مشروع جديد للبدء."}
                    </p>
                    {(!searchTerm && statusFilter === 'all') && (
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href="/engineer/create-project" className="flex items-center gap-2">
                          <PlusCircle className="h-4 w-4" />
                          <span>إنشاء مشروع جديد</span>
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                {deleteStep === 'success' ? 'تم حذف المشروع' : 'تأكيد حذف المشروع'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteStep === 'success'
                  ? `تم حذف المشروع "${itemToDelete?.name}" بنجاح.`
                  : `هل أنت متأكد من حذف المشروع "${itemToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {deleteStep === 'confirm' && (
                <>
                  <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    حذف
                  </AlertDialogAction>
                </>
              )}
              {deleteStep === 'loading' && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                </div>
              )}
              {deleteStep === 'success' && (
                <AlertDialogAction
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600"
                >
                  حسناً
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Archived Warning Dialog */}
        <AlertDialog open={showArchivedWarning} onOpenChange={setShowArchivedWarning}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                مشروع مؤرشف
              </AlertDialogTitle>
              <AlertDialogDescription>
                هذا المشروع مؤرشف حاليًا. لعرض التفاصيل الكاملة، يجب عليك إلغاء أرشفة المشروع أولاً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => setShowArchivedWarning(false)}
                className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-600"
              >
                فهمت
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Project Edit Dialog Manager */}
        <ProjectEditDialogManager />
      </div>
    </>
  );
}
