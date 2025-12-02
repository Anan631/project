'use client';

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

// Memoized components for performance optimization
const ProjectCard = memo(({ project, onArchive, onUnarchive, onDelete, onViewArchived }: { 
  project: Project; 
  onArchive: (id: number, name: string) => Promise<void>;
  onUnarchive: (id: number, name: string) => Promise<void>;
  onDelete: (project: Project) => void;
  onViewArchived: () => void;
}) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'قيد التنفيذ': { 
        icon: TrendingUp, 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        progressColor: 'bg-blue-500',
        progress: 65
      },
      'مكتمل': { 
        icon: CheckCircle, 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        progressColor: 'bg-emerald-500',
        progress: 100
      },
      'مؤرشف': { 
        icon: Archive, 
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        progressColor: 'bg-slate-500',
        progress: 100
      },
      'مخطط له': { 
        icon: Calendar, 
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        progressColor: 'bg-amber-500',
        progress: 10
      }
    };
    return configs[status as keyof typeof configs] || configs['مخطط له'];
  };

  const statusConfig = getStatusConfig(project.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
            </div>
            
            <Badge variant="outline" className={cn("text-xs font-medium", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 ml-1" />
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium">العميل:</span>
            <span>{project.clientName || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="font-medium">الموقع:</span>
            <span>{project.location || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="font-medium">تاريخ الإضافة:</span>
            <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">مستوى التقدم</span>
            <span className="font-bold text-blue-600">{statusConfig.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${statusConfig.progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={cn("h-2 rounded-full", statusConfig.progressColor)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          {project.status === 'مؤرشف' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700"
              onClick={onViewArchived}
            >
              <Eye className="h-4 w-4" />
              <span>عرض</span>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="flex-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700">
              <Link href={`/engineer/projects/${project.id}`} className="flex items-center justify-center gap-2">
                <Eye className="h-4 w-4" />
                <span>عرض</span>
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="flex-1 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700">
            <Link href={`/engineer/projects/${project.id}/edit`} className="flex items-center justify-center gap-2">
              <Edit className="h-4 w-4" />
              <span>تعديل</span>
            </Link>
          </Button>
          {project.status === 'مؤرشف' ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 hover:text-sky-700"
              onClick={() => onUnarchive(project.id, project.name)}
            >
              <ArchiveRestore className="h-4 w-4" />
              <span>إلغاء الأرشفة</span>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700"
              onClick={() => onArchive(project.id, project.name)}
            >
              <Archive className="h-4 w-4" />
              <span>أرشفة</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
            onClick={() => onDelete(project)}
          >
            <Trash2 className="h-4 w-4" />
            <span>حذف</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

ProjectCard.displayName = 'ProjectCard';

const ProjectTableRow = memo(({ project, onArchive, onUnarchive, onDelete, onViewArchived }: { 
  project: Project; 
  onArchive: (id: number, name: string) => Promise<void>;
  onUnarchive: (id: number, name: string) => Promise<void>;
  onDelete: (project: Project) => void;
  onViewArchived: () => void;
}) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'قيد التنفيذ': { 
        icon: TrendingUp, 
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      'مكتمل': { 
        icon: CheckCircle, 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      },
      'مؤرشف': { 
        icon: Archive, 
        color: 'bg-slate-50 text-slate-700 border-slate-200'
      },
      'مخطط له': { 
        icon: Calendar, 
        color: 'bg-amber-50 text-amber-700 border-amber-200'
      }
    };
    return configs[status as keyof typeof configs] || configs['مخطط له'];
  };

  const statusConfig = getStatusConfig(project.status);
  const StatusIcon = statusConfig.icon;

  return (
    <TableRow className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-300">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              {project.name}
            </p>
            <p className="text-sm text-gray-500">{project.engineer || 'غير محدد'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-gray-600">
          <User className="h-4 w-4 text-gray-400" />
          {project.clientName || 'غير محدد'}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400" />
          {project.location || 'غير محدد'}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-xs font-medium", statusConfig.color)}>
          <StatusIcon className="h-3 w-3 ml-1" />
          {project.status}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-600">
        {project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-4">
          {project.status === 'مؤرشف' ? (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={onViewArchived}
            >
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">عرض</span>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50">
              <Link href={`/engineer/projects/${project.id}`} className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">عرض</span>
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
            <span className="text-sm font-medium">تعديل</span>
          </Button>
          {project.status === 'مؤرشف' ? (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 text-sky-600 hover:text-sky-800 hover:bg-sky-50"
              onClick={() => onUnarchive(project.id, project.name)}
            >
              <ArchiveRestore className="h-4 w-4" />
              <span className="text-sm font-medium">إلغاء الأرشفة</span>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
              onClick={() => onArchive(project.id, project.name)}
            >
              <Archive className="h-4 w-4" />
              <span className="text-sm font-medium">أرشفة</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-9 px-3 text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={() => onDelete(project)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">حذف</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

ProjectTableRow.displayName = 'ProjectTableRow';

export default function EngineerProjectsPage() {
  const { toggleSidebar } = useSidebar();
  

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

  // Project Statistics
  const projectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'قيد التنفيذ').length;
    const completed = projects.filter(p => p.status === 'مكتمل').length;
    const planned = projects.filter(p => p.status === 'مخطط له').length;
    const archived = projects.filter(p => p.status === 'مؤرشف').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, active, completed, planned, archived, completionRate };
  }, [projects]);

  // Archive Project Handler
  const handleArchiveAction = async (projectId: number, projectName: string) => {
    try {
      const result = await updateProject(projectId.toString(), { status: 'مؤرشف' });
      if (result.success) {
        toast({
          title: "تمت الأرشفة بنجاح",
          description: `تم أرشفة مشروع "${projectName}" بنجاح.`,
          className: "bg-emerald-50 text-emerald-700 border-emerald-200"
        });
        fetchEngineerProjects();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "خطأ في الأرشفة",
        description: "فشل أرشفة المشروع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Unarchive Project Handler
  const handleUnarchiveAction = async (projectId: number, projectName: string) => {
    try {
      // Revert to a sensible default status. 'قيد التنفيذ' (In Progress) is a good choice.
      const result = await updateProject(projectId.toString(), { status: 'قيد التنفيذ' });
      if (result.success) {
        toast({
          title: "تم إلغاء الأرشفة بنجاح",
          description: `تم إعادة مشروع "${projectName}" إلى المشاريع النشطة.`,
          className: "bg-sky-50 text-sky-700 border-sky-200"
        });
        fetchEngineerProjects();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "خطأ في إلغاء الأرشفة",
        description: "فشل إلغاء أرشفة المشروع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  // Delete Project Handlers
  const handleOpenDeleteDialog = (item: Project) => {
    setItemToDelete(item);
    setDeleteStep('confirm');
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!itemToDelete) return;

    setDeleteStep('loading');
    try {
      const result = await dbDeleteProject(itemToDelete.id.toString(), userId || undefined);
      if (result.success) {
        setDeleteStep('success');
        setTimeout(() => {
          setIsDeleteDialogOpen(false);
          fetchEngineerProjects();
        }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "خطأ في الحذف",
        description: "فشل حذف المشروع. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    }
  };

  const handleViewArchived = () => {
    setShowArchivedWarning(true);
  };

  // Print Report Handler
  const handlePrintReport = () => {
    if (filteredProjects.length === 0) {
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
                font-weight: 400;
              }
              .meta-item .value {
                font-size: 18px;
                color: #312e81;
                font-weight: 700;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 15px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
              }
              th, td {
                padding: 16px 20px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
              }
              thead th {
                background: linear-gradient(to bottom, #4f46e5, #4338ca);
                font-weight: 700;
                color: #ffffff;
                font-size: 16px;
              }
              tbody tr {
                transition: background-color 0.2s ease;
              }
              tbody tr:last-child {
                border-bottom: 0;
              }
              tbody tr:nth-of-type(even) {
                background-color: #f9fafb;
              }
              tbody tr:hover {
                background-color: #f0f0ff;
              }
              .status {
                padding: 6px 12px;
                border-radius: 999px;
                font-weight: 700;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                gap: 6px;
              }
              .status::before {
                content: '';
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
              }
              .status-قيد-التنفيذ { background-color: #dbeafe; color: #1e40af; }
              .status-قيد-التنفيذ::before { background-color: #3b82f6; }
              .status-مكتمل { background-color: #d1fae5; color: #065f46; }
              .status-مكتمل::before { background-color: #10b981; }
              .status-مؤرشف { background-color: #e5e7eb; color: #374151; }
              .status-مؤرشف::before { background-color: #6b7280; }
              .status-مخطط-له { background-color: #fef3c7; color: #92400e; }
              .status-مخطط-له::before { background-color: #f59e0b; }
              .report-footer {
                margin-top: 50px;
                text-align: center;
                font-size: 14px;
                color: #9ca3af;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <header class="report-header">
                <div class="titles">
                  <h1>تقرير المشاريع الإنشائية</h1>
                  <p>نظرة شاملة على حالة المشاريع</p>
                </div>
                <img src="/logo.png" alt="شعار الشركة">
              </header>
              
              <section class="report-meta">
                <div class="meta-item">
                  <span class="label">المهندس المشرف</span>
                  <span class="value">${engineerName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">تاريخ التقرير</span>
                  <span class="value">${new Date().toLocaleDateString('ar-EG-u-nu-latn')}</span>
                </div>
                <div class="meta-item">
                  <span class="label">عدد المشاريع</span>
                  <span class="value">${filteredProjects.length}</span>
                </div>
                <div class="meta-item">
                  <span class="label">إجمالي الميزانيات</span>
                  <span class="value">${totalBudget.toLocaleString()} ₪</span>
                </div>
              </section>

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

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">إجمالي المشاريع</p>
                  <p className="text-3xl font-bold text-gray-800">{projectStats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">جميع المشاريع</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FolderKanban className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">قيد التنفيذ</p>
                  <p className="text-3xl font-bold text-orange-600">{projectStats.active}</p>
                  <p className="text-xs text-gray-500 mt-1">نشطة حالياً</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">مكتملة</p>
                  <p className="text-3xl font-bold text-emerald-600">{projectStats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">تم تسليمها</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">معدل الإنجاز</p>
                  <p className="text-3xl font-bold text-purple-600">{projectStats.completionRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">نسبة الإنجاز</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50"
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="ابحث في المشاريع بالاسم، الموقع، أو العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                aria-label="بحث في المشاريع"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-full lg:w-[200px] bg-white border-gray-300 focus:border-blue-500 flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <SelectValue placeholder="جميع الحالات" />
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

          {/* Sorting Controls */}
          <div className="flex items-center justify-end gap-4">
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
        </motion.div>

        {/* Projects Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-600 text-lg">جاري تحميل المشاريع...</p>
              <p className="text-gray-500 text-sm">يتم جلب أحدث بيانات المشاريع</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    {filteredProjects.length} مشروع
                  </Badge>
                  <span className="text-sm text-gray-600">تم العثور على {filteredProjects.length} مشروع</span>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <Table>
                    <TableHeader className="bg-gray-50/80">
                      <TableRow>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors px-6 py-4"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            اسم المشروع
                            {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 px-6 py-4">العميل</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 px-6 py-4">الموقع</TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors px-6 py-4"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            الحالة
                            {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors px-6 py-4"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            تاريخ الإضافة
                            {getSortIcon('date')}
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 px-6 py-4">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((project) => (
                        <ProjectTableRow 
                          key={project.id} 
                          project={project} 
                          onArchive={handleArchiveAction}
                          onUnarchive={handleUnarchiveAction}
                          onDelete={handleOpenDeleteDialog}
                          onViewArchived={handleViewArchived}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      onArchive={handleArchiveAction}
                      onUnarchive={handleUnarchiveAction}
                      onDelete={handleOpenDeleteDialog}
                      onViewArchived={handleViewArchived}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <FolderKanban className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">لا توجد مشاريع</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {projects.length === 0 
                  ? "لم تقم بإنشاء أي مشاريع بعد. ابدأ مشروعك الأول لتنظيم أعمالك الهندسية." 
                  : "لا توجد مشاريع تطابق معايير البحث الحالية. حاول تعديل الفلاتر أو مصطلحات البحث."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-8 flex items-center gap-2">
                  <Link href="/engineer/create-project">
                    <PlusCircle className="h-4 w-4" />
                    <span>إنشاء مشروع جديد</span>
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  <span>إعادة تعيين الفلاتر</span>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl" className="sm:max-w-md">
          {deleteStep === 'confirm' && itemToDelete && (
            <>
              <AlertDialogHeader className="text-center items-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-gray-800">تأكيد الحذف</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription asChild>
                <div className="text-center text-base text-gray-600 space-y-4">
                  <p>هل أنت متأكد أنك تريد حذف هذا المشروع؟</p>
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    <p className="font-bold text-lg">{itemToDelete.name}</p>
                    <p className="text-sm mt-1">{itemToDelete.location}</p>
                    <p className="text-xs text-red-600 mt-2">⚠️ لا يمكن التراجع عن هذا الإجراء</p>
                  </div>
                </div>
              </AlertDialogDescription>
              <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
                <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 font-medium flex items-center gap-2">
                  <X className="h-4 w-4" />
                  <span>إلغاء</span>
                </AlertDialogCancel>
                <Button 
                  onClick={handleDeleteProject}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف المشروع</span>
                </Button>
              </AlertDialogFooter>
            </>
          )}
          {deleteStep === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-800">جاري الحذف...</h3>
              <p className="text-gray-600">يتم حذف المشروع من النظام</p>
            </div>
          )}
          {deleteStep === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-700">تم الحذف بنجاح</h3>
              <p className="text-gray-600">تم حذف المشروع بنجاح من النظام</p>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Archived Project Warning Dialog */}
      <AlertDialog open={showArchivedWarning} onOpenChange={setShowArchivedWarning}>
        <AlertDialogContent dir="rtl" className="sm:max-w-md">
            <AlertDialogHeader className="text-center items-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Info className="h-8 w-8 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-gray-800">المشروع مؤرشف</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription className="text-center text-base text-gray-600">
              لا يمكنك عرض تفاصيل هذا المشروع لأنه مؤرشف. يرجى إلغاء أرشفته أولاً.
            </AlertDialogDescription>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel className="w-full" onClick={() => setShowArchivedWarning(false)}>حسنًا</AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Project Edit Dialog Manager */}
      <ProjectEditDialogManager />
    </>
  );
}