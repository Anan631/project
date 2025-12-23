"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Search,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  FolderOpen,
  BarChart3,
  Download,
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Eye,
  HardHat,
  Zap,
  Shield,
  Target,
  Trash2,
  Trash,
  MoreVertical,
  Share2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProjectReport {
  projectId: string;
  projectName: string;
  engineerName: string;
  ownerName: string;
  ownerEmail: string;
  reports: Array<{
    _id: string;
    calculationType: string;
    createdAt: string;
    updatedAt: string;
    concreteData?: {
      totalConcrete: number;
      foundationsVolume: number;
      cleaningVolume: number;
      groundSlabVolume: number;
    };
    steelData?: {
      totalSteelWeight: number;
      foundationSteel: number;
    };
  }>;
  lastUpdated: string;
  status?: 'active' | 'completed' | 'archived';
  priority?: 'high' | 'medium' | 'low';
}

export default function QuantityReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('lastUpdated');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    projectId: string | null;
    projectName: string | null;
  }>({
    open: false,
    projectId: null,
    projectName: null,
  });
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  // Single report delete dialog/state
  const [singleDelete, setSingleDelete] = useState<{
    open: boolean;
    projectId: string | null;
    reportId: string | null;
    calculationType: string | null;
  }>({ open: false, projectId: null, reportId: null, calculationType: null });
  const [isDeletingReport, setIsDeletingReport] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setEngineerId(userId);

    if (userId) {
      fetchProjects(userId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProjects = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/engineer/${userId}`);
      const data = await response.json();

      if (data.success) {
        // Add mock status and priority for demo
        const enhancedProjects = data.projects.map((project: ProjectReport) => ({
          ...project,
          status: 'active',
          priority: project.reports.length > 2 ? 'high' : project.reports.length > 0 ? 'medium' : 'low'
        }));
        setProjects(enhancedProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (engineerId) {
        await fetchProjects(engineerId);
        toast({
          title: "تم التحديث",
          description: "تم تحديث قائمة التقارير بنجاح"
        });
      }
    } catch (error) {
      console.error('Error refreshing projects:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث التقارير',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    console.log('Delete button clicked for project:', projectId, projectName);
    setDeleteDialog({
      open: true,
      projectId,
      projectName,
    });
  };

  const confirmDeleteProject = async () => {
    if (!deleteDialog.projectId) return;

    setIsDeleting(deleteDialog.projectId);
    try {
      // احذف جميع تقارير المشروع الواحد عبر حذف كل تقرير بالمعرف
      const project = projects.find(p => p.projectId === deleteDialog.projectId);
      const reportIds = project?.reports.map(r => r._id) || [];

      await Promise.allSettled(
        reportIds.map(id => fetch(`http://localhost:5000/api/quantity-reports/${id}`, { method: 'DELETE' }))
      );

      setProjects(prev => prev.filter(p => p.projectId !== deleteDialog.projectId));
      toast({
        title: "تم الحذف",
        description: `تم حذف جميع تقارير مشروع "${deleteDialog.projectName}" بنجاح`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting project reports:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف تقارير المشروع',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(null);
      setDeleteDialog({ open: false, projectId: null, projectName: null });
    }
  };

  const handleDeleteAllReports = async () => {
    setDeleteAllDialog(true);
  };

  const confirmDeleteAllReports = async () => {
    if (!engineerId) return;

    setIsDeletingAll(true);
    try {
      // احذف كل التقارير لكل المشاريع عبر endpoint حذف تقرير واحد
      const allReportIds = projects.flatMap(p => p.reports.map(r => r._id));
      await Promise.allSettled(
        allReportIds.map(id => fetch(`http://localhost:5000/api/quantity-reports/${id}`, { method: 'DELETE' }))
      );

      setProjects([]);
      toast({
        title: "تم الحذف الشامل",
        description: "تم حذف جميع التقارير بنجاح",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting all reports:', error);
      toast({
        title: 'خطأ في الحذف الشامل',
        description: 'حدث خطأ أثناء حذف جميع التقارير',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingAll(false);
      setDeleteAllDialog(false);
    }
  };

  // فتح نافذة حذف تقرير محدد
  const handleDeleteReport = (projectId: string, reportId: string, calculationType: string) => {
    setSingleDelete({ open: true, projectId, reportId, calculationType });
  };

  // تأكيد حذف تقرير محدد
  const confirmDeleteReport = async () => {
    if (!singleDelete.reportId || !singleDelete.projectId) return;
    setIsDeletingReport(singleDelete.reportId);
    try {
      const res = await fetch(`http://localhost:5000/api/quantity-reports/${singleDelete.reportId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');

      // حدّث الحالة محلياً
      setProjects(prev => {
        return prev
          .map(p => {
            if (p.projectId !== singleDelete.projectId) return p;
            const newReports = p.reports.filter(r => r._id !== singleDelete.reportId);
            return { ...p, reports: newReports } as ProjectReport;
          })
          .filter(p => p.reports.length > 0);
      });

      toast({
        title: 'تم الحذف',
        description: 'تم حذف التقرير بنجاح',
      });
    } catch (e) {
      toast({
        title: 'خطأ',
        description: 'فشل حذف التقرير',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingReport(null);
      setSingleDelete({ open: false, projectId: null, reportId: null, calculationType: null });
    }
  };

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'lastUpdated') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      } else if (sortBy === 'projectName') {
        return a.projectName.localeCompare(b.projectName);
      } else if (sortBy === 'reportsCount') {
        return b.reports.length - a.reports.length;
      }
      return 0;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };



  const getPriorityBadge = (priority: string) => {
    const priorities = {
      'high': { label: 'عالية', color: 'bg-red-100 text-red-700 border-red-200' },
      'medium': { label: 'متوسطة', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      'low': { label: 'منخفضة', color: 'bg-green-100 text-green-700 border-green-200' }
    };
    return priorities[priority as keyof typeof priorities] || priorities.medium;
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      'active': { label: 'نشط', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      'completed': { label: 'مكتمل', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'archived': { label: 'مؤرشف', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    };
    return statuses[status as keyof typeof statuses] || statuses.active;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
            <Loader2 className="w-16 h-16 animate-spin text-emerald-600 mx-auto relative" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">جاري تحميل التقارير</h2>
            <p className="text-slate-600">يتم جلب بيانات المشاريع والتقارير...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  تقارير الكميات
                </h1>
                <p className="text-slate-600 text-lg">عرض وتحميل تقارير كميات الخرسانة والحديد للمشاريع</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-slate-900 transition-all duration-200"
              >
                <RefreshCw className={cn(
                  "w-4 h-4 transition-transform duration-500",
                  isRefreshing && "animate-spin"
                )} />
                <span className={cn(
                  "transition-all duration-200",
                  isRefreshing && "text-emerald-600"
                )}>
                  {isRefreshing ? "جاري التحديث..." : "تحديث"}
                </span>
              </Button>
              <Button
                onClick={handleDeleteAllReports}
                disabled={isDeletingAll || projects.length === 0}
                variant="outline"
                className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
              >
                {isDeletingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash className="w-4 h-4" />
                )}
                حذف الكل
              </Button>
              <Link href="/engineer/projects">
                <Button className="bg-slate-800 hover:bg-emerald-700 text-white gap-2 transition-colors duration-200">
                  <HardHat className="w-4 h-4" />
                  المشاريع
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="البحث في المشاريع أو المالكين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 bg-white/80 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
              />
            </div>

            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-12 bg-white/80 border-slate-200">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-12 bg-white/80 border-slate-200">
                  <TrendingUp className="w-4 h-4 ml-2" />
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastUpdated">آخر تحديث</SelectItem>
                  <SelectItem value="projectName">اسم المشروع</SelectItem>
                  <SelectItem value="reportsCount">عدد التقارير</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex bg-white/80 border border-slate-200 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "px-4 py-2 gap-2 transition-all duration-200",
                    viewMode === 'cards'
                      ? "bg-emerald-600 text-white shadow-md hover:bg-green-100 hover:text-slate-900"
                      : "text-slate-800 hover:bg-blue-100 hover:text-slate-900"
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">بطاقات</span>
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-4 py-2 gap-2 transition-all duration-200",
                    viewMode === 'table'
                      ? "bg-emerald-600 text-white shadow-md hover:bg-green-100 hover:text-slate-900"
                      : "text-slate-800 hover:bg-blue-100 hover:text-slate-900"
                  )}
                >
                  <Table className="w-4 h-4" />
                  <span className="text-sm font-medium">جدول</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Display */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="py-16 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-slate-200/30 rounded-full blur-3xl animate-pulse"></div>
                  <FolderOpen className="w-20 h-20 text-slate-400 mx-auto relative" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">لا توجد تقارير</h3>
                <p className="text-slate-500 mb-8 text-lg">
                  {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إنشاء أي تقارير كميات بعد'}
                </p>
                <Link href="/engineer/projects">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg gap-3">
                    <HardHat className="w-5 h-5" />
                    الذهاب للمشاريع
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">إجمالي المشاريع</p>
                        <p className="text-3xl font-bold text-blue-900">{filteredProjects.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 text-sm font-medium">إجمالي التقارير</p>
                        <p className="text-3xl font-bold text-emerald-900">
                          {filteredProjects.reduce((acc, p) => acc + p.reports.length, 0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-medium">مشاريع نشطة</p>
                        <p className="text-3xl font-bold text-orange-900">
                          {filteredProjects.filter(p => p.status === 'active').length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-medium">أولوية عالية</p>
                        <p className="text-3xl font-bold text-purple-900">
                          {filteredProjects.filter(p => p.priority === 'high').length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredProjects.map((project, index) => {
                    const latestReport = project.reports[0];
                    return (
                      <motion.div
                        key={project.projectId}
                        variants={itemVariants}
                        layout
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            <CardHeader className="pb-4 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/engineer/quantity-reports/${project.projectId}`); }}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                      <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <Badge className={cn(getStatusBadge(project.status || 'active'), "text-xs")}>
                                      {getStatusBadge(project.status || 'active').label}
                                    </Badge>
                                  </div>
                                  <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">
                                    {project.projectName}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>{project.reports.length} تقرير</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2" onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/engineer/quantity-reports/${project.projectId}`);
                                }}>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                {/* Owner Info */}
                                {/* Owner Info & Reports Count Enhanced */}
                                <div className="bg-slate-50/80 rounded-xl p-3 mb-4 border border-slate-100">
                                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <div className="bg-white p-2 rounded-full shadow-sm ring-1 ring-slate-100">
                                        <User className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">المالك</p>
                                        <p className="text-sm font-bold text-slate-800">{project.ownerName || 'غير محدد'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-xs text-slate-500 font-medium">التقارير المنجزة</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-white shadow-sm text-emerald-700 hover:bg-emerald-50 border border-emerald-100 px-2.5 py-0.5">
                                      <span className="font-bold text-lg ml-1">{project.reports.length}</span>
                                      <span className="text-[10px] font-normal">تقرير</span>
                                    </Badge>
                                  </div>
                                </div>



                                {/* Last Updated */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(project.lastUpdated)}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button asChild
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-3"
                                    >
                                      <Link href={`/engineer/quantity-reports/${project.projectId}`} onClick={(e) => e.stopPropagation()}>
                                        <span className="inline-flex items-center gap-2">
                                          <Eye className="w-4 h-4" />
                                          عرض التقرير
                                        </span>
                                      </Link>
                                    </Button>
                                    <div style={{ position: 'relative', zIndex: 10 }}>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                        onClick={(e) => {
                                          console.log('Delete button onClick triggered');
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleDeleteProject(project.projectId, project.projectName);
                                        }}
                                        disabled={isDeleting === project.projectId && deleteDialog.open}
                                        style={{ pointerEvents: 'auto' }}
                                      >
                                        {isDeleting === project.projectId ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
            {/* Table View */}
            {viewMode === 'table' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-0 shadow-xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="w-6 h-6" />
                      المشاريع ({filteredProjects.length})
                    </CardTitle>
                    <CardDescription className="text-emerald-100">
                      اختر مشروعًا لعرض وتحميل التقارير
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-right font-bold">المشروع</TableHead>
                          <TableHead className="text-right font-bold">المالك</TableHead>
                          <TableHead className="text-right font-bold">التقارير</TableHead>
                          <TableHead className="text-right font-bold">الحالة</TableHead>
                          <TableHead className="text-right font-bold">آخر تحديث</TableHead>
                          <TableHead className="text-right font-bold">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.map((project) => (
                          <TableRow
                            key={project.projectId}
                            className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/engineer/quantity-reports/${project.projectId}`)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{project.projectName}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-full">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-slate-700">{project.ownerName || 'غير محدد'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {project.reports.length > 0 && (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                    {project.reports.length} {project.reports.length === 1 ? 'تقرير' : 'تقارير'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(getStatusBadge(project.status || 'active'), "text-xs")}>
                                {getStatusBadge(project.status || 'active').label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(project.lastUpdated)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/engineer/quantity-reports/${project.projectId}`);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                  عرض التقرير
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProject(project.projectId, project.projectName);
                                  }}
                                  disabled={isDeleting === project.projectId && deleteDialog.open}
                                >
                                  {isDeleting === project.projectId ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Delete Single Report Dialog */}
      <AlertDialog open={singleDelete.open} onOpenChange={(open) => setSingleDelete(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-right text-lg">تأكيد حذف التقرير</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-right text-base">
              هل أنت متأكد من حذف هذا التقرير؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReport}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف التقرير
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) =>
        setDeleteDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-right text-lg">تأكيد حذف التقارير</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-right text-base">
              هل أنت متأكد من حذف جميع تقارير المشروع:
              <span className="font-bold text-slate-900"> {deleteDialog.projectName} </span>
              ؟
              <br /><br />
              <span className="text-amber-600 font-medium">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه وسيمحو جميع البيانات بشكل دائم
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProject}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف التقرير
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={deleteAllDialog} onOpenChange={setDeleteAllDialog}>
        <AlertDialogContent className="max-w-md" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-right text-lg">تأكيد الحذف الشامل</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-right text-base">
              هل أنت متأكد من حذف <span className="font-bold text-red-600">جميع التقارير</span>؟
              <br /><br />
              سيتم حذف <span className="font-bold">{projects.length}</span> مشروع وكل تقاريرهم
              <br /><br />
              <span className="text-amber-600 font-medium">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه وسيمحو جميع البيانات بشكل دائم
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <AlertDialogCancel className="flex-1">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAllReports}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحذف الشامل...
                </>
              ) : (
                <>
                  <Trash className="w-4 h-4 ml-2" />
                  حذف الكل
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
