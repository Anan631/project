"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  Eye,
  HardHat,
  Shield,
  Target,
  LayoutDashboard,
  Grid3X3,
  List,
  Package,
  Weight,
  Construction,
  MapPin,
  Star,
  ChevronRight,

  AlertCircle,
  PieChart,
  Calculator,
} from "lucide-react";
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

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getProjects, type Project } from '@/lib/db';

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
  status?: 'active' | 'completed' | 'archived' | 'on-hold';
  priority?: 'high' | 'medium' | 'low';
  progress?: number;
}

export default function OwnerQuantityReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      setUserId(id);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
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
        // تحويل المشاريع إلى تقارير مشاريع مع بيانات إضافية
        const reports: ProjectReport[] = result.projects.map(project => {
          const statusMap = {
            'مكتمل': 'completed',
            'قيد التنفيذ': 'active',
            'مخطط له': 'on-hold',
            'مؤرشف': 'archived'
          } as const;

          const getRandomProgress = () => Math.floor(Math.random() * 100);
          const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
          
          return {
            projectId: project.id.toString(),
            projectName: project.name,
            engineerName: project.engineer || 'غير محدد',
            ownerName: project.clientName || 'غير محدد',
            ownerEmail: project.linkedOwnerEmail || '',
            reports: [], // سيتم جلبها لاحقاً
            lastUpdated: project.createdAt || new Date().toISOString(),
            status: statusMap[project.status as keyof typeof statusMap] || 'active',
            priority: priorities[Math.floor(Math.random() * 3)],
            progress: project.overallProgress || getRandomProgress(),
          };
        });
        
        // جلب التقارير لكل مشروع
        const reportsWithData = await Promise.all(
          reports.map(async (report) => {
            try {
              const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
              if (!userEmail) return report;
              
              const response = await fetch(`http://localhost:5000/api/quantity-reports/owner/${encodeURIComponent(userEmail)}/project/${report.projectId}`);
              const data = await response.json();
              
              if (data.success && data.reports) {
                return {
                  ...report,
                  reports: data.reports
                };
              }
              return report;
            } catch (error) {
              console.error(`Error fetching reports for project ${report.projectId}:`, error);
              return report;
            }
          })
        );
        
        setProjectReports(reportsWithData);
      } else {
        toast({
          title: "خطأ في التحميل",
          description: result.message || "فشل تحميل المشاريع.",
          variant: "destructive"
        });
        setProjectReports([]);
      }
    } catch (error) {
      console.error("Error fetching projects for owner:", error);
      toast({
        title: "خطأ فادح",
        description: "حدث خطأ أثناء تحميل بيانات المشاريع.",
        variant: "destructive"
      });
      setProjectReports([]);
    }
    setIsLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    let result = [...projectReports];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(project =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.engineerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [projectReports, searchTerm]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200';
      case 'on-hold': return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'archived': return <FolderOpen className="h-4 w-4" />;
      case 'on-hold': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };







  const handleRefresh = () => {
    fetchProjects();
    toast({
      title: "تم التحديث",
      description: "تم تحديث قائمة المشاريع بنجاح",
    });
  };



  const stats = useMemo(() => {
    const total = projectReports.length;
    const completed = projectReports.filter(p => p.status === 'completed').length;
    const active = projectReports.filter(p => p.status === 'active').length;
    const onHold = projectReports.filter(p => p.status === 'on-hold').length;
    const totalReports = projectReports.reduce((acc, p) => acc + p.reports.length, 0);
    const avgProgress = total > 0 ? Math.round(projectReports.reduce((acc, p) => acc + (p.progress || 0), 0) / total) : 0;

    return { total, completed, active, onHold, totalReports, avgProgress };
  }, [projectReports]);

  const renderProjectCard = (project: ProjectReport) => (
    <motion.div
      key={project.projectId}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group"
    >
      <Card className="hover:shadow-2xl transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 overflow-hidden backdrop-blur-sm">
        {/* Animated Progress Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />
        
        {/* Floating Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge 
            variant="outline" 
            className={cn(
              getStatusColor(project.status),
              "font-medium flex items-center gap-1 shadow-lg backdrop-blur-sm border-white/50"
            )}
          >
            {getStatusIcon(project.status)}
            {project.status === 'active' ? 'نشط' : 
             project.status === 'completed' ? 'مكتمل' : 
             project.status === 'archived' ? 'مؤرشف' : 
             project.status === 'on-hold' ? 'معلق' : 'غير محدد'}
          </Badge>
        </div>
        
        <CardHeader className="pb-4 pt-16">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className={cn(
                "p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                project.status === 'active' ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25" :
                project.status === 'completed' ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25" :
                project.status === 'on-hold' ? "bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-500/25" :
                "bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/25"
              )}>
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                  {project.projectName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          star <= 4 ? "text-yellow-400 fill-current" : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">4.0</span>
                  <span className="text-xs text-gray-400">({project.reports.length} تقرير)</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Project Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-blue-100/40 rounded-xl border border-blue-200/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">المهندس المسؤول</p>
                <p className="font-bold text-gray-900 truncate text-lg">{project.engineerName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/80 via-purple-50/60 to-purple-100/40 rounded-xl border border-purple-200/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">المالك</p>
                <p className="font-bold text-gray-900 truncate text-lg">{project.ownerName}</p>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50/50 to-white rounded-xl border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-bold text-gray-700">معدل التقدم</span>
              </div>
              <Badge variant="outline" className={cn(
                "font-bold text-sm px-3 py-1",
                (project.progress || 0) >= 80 ? "border-green-300 text-green-700 bg-green-50" :
                (project.progress || 0) >= 50 ? "border-blue-300 text-blue-700 bg-blue-50" :
                "border-yellow-300 text-yellow-700 bg-yellow-50"
              )}>
                {project.progress || 0}%
              </Badge>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className={cn(
                  "h-full transition-all duration-1000 ease-out relative",
                  (project.progress || 0) >= 80 ? "bg-gradient-to-r from-green-400 to-green-600" :
                  (project.progress || 0) >= 50 ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                  "bg-gradient-to-r from-yellow-400 to-yellow-600"
                )}
                style={{ width: `${project.progress || 0}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50 hover:shadow-lg transition-all duration-300 group">
              <div className="p-2 bg-blue-500 rounded-lg mx-auto mb-2 w-fit group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">التقارير</p>
              <p className="text-xl font-black text-blue-900">{project.reports.length}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50 hover:shadow-lg transition-all duration-300 group">
              <div className="p-2 bg-green-500 rounded-lg mx-auto mb-2 w-fit group-hover:scale-110 transition-transform">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs text-green-600 font-bold uppercase tracking-wide">الكميات</p>
              <p className="text-xl font-black text-green-900">{project.reports.length > 0 ? project.reports.length : '0'}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50 hover:shadow-lg transition-all duration-300 group">
              <div className="p-2 bg-purple-500 rounded-lg mx-auto mb-2 w-fit group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">آخر تحديث</p>
              <p className="text-sm font-black text-purple-900">
                {new Date(project.lastUpdated).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Enhanced Action Button */}
          <div className="pt-2">
            <Button 
              asChild 
              className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 group/btn relative overflow-hidden"
            >
              <Link href={`/owner/quantity-reports/${project.projectId}`} className="flex items-center justify-center gap-3 relative z-10">
                <Eye className="h-5 w-5" />
                <span className="text-lg">عرض التقارير</span>
                <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  تقارير الكميات
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  عرض وإدارة تقارير كميات الخرسانة والحديد لجميع مشاريعك
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleRefresh} variant="outline" className="border-gray-300 hover:bg-gray-50">
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث البيانات
            </Button>

            <Button asChild variant="outline" className="border-gray-300 hover:bg-gray-50">
              <Link href="/owner/dashboard">
                <LayoutDashboard className="ml-2 h-4 w-4" />
                لوحة التحكم
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-blue-300/50 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">إجمالي المشاريع</p>
                    <p className="text-4xl font-black text-blue-900">{stats.total}</p>
                  </div>
                  <div className="p-4 bg-blue-500 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 via-green-100 to-green-200 border-green-300/50 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-green-600 uppercase tracking-wider">مشاريع مكتملة</p>
                    <p className="text-4xl font-black text-green-900">{stats.completed}</p>
                  </div>
                  <div className="p-4 bg-green-500 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 border-yellow-300/50 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-yellow-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-yellow-600 uppercase tracking-wider">مشاريع نشطة</p>
                    <p className="text-4xl font-black text-yellow-900">{stats.active}</p>
                  </div>
                  <div className="p-4 bg-yellow-500 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 border-purple-300/50 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">متوسط التقدم</p>
                    <p className="text-4xl font-black text-purple-900">{stats.avgProgress}%</p>
                  </div>
                  <div className="p-4 bg-purple-500 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Card className="bg-white/95 shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-gray-900">قائمة المشاريع</CardTitle>
                <CardDescription className="text-gray-600">
                  اختر مشروعاً لعرض تقارير الكميات الخاصة به
                </CardDescription>
              </div>
              
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث عن مشروع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 bg-gray-50 border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                


                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-all",
                      viewMode === 'cards' 
                        ? "bg-white shadow-sm text-blue-600" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span className="hidden sm:inline">بطاقات</span>
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-all",
                      viewMode === 'table' 
                        ? "bg-white shadow-sm text-blue-600" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">جدول</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="text-gray-600">جاري تحميل المشاريع...</p>
              </div>
            ) : filteredProjects.length > 0 ? (
              <>
                {/* Cards View */}
                {viewMode === 'cards' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(renderProjectCard)}
                  </div>
                )}

                {/* Enhanced Table View */}
                {viewMode === 'table' && (
                  <div className="rounded-2xl border border-gray-200/50 overflow-hidden shadow-xl bg-white/80 backdrop-blur-sm">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-gray-200/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-black text-gray-800 text-right py-6 text-lg">المشروع</TableHead>
                          <TableHead className="font-black text-gray-800 text-right py-6 text-lg">المهندس</TableHead>
                          <TableHead className="font-black text-gray-800 text-right py-6 text-lg">الحالة</TableHead>
                          <TableHead className="font-black text-gray-800 text-right py-6 text-lg">التقدم</TableHead>
                          <TableHead className="font-black text-gray-800 text-right py-6 text-lg">التقارير</TableHead>
                          <TableHead className="font-black text-gray-800 text-center py-6 text-lg">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.map((project, index) => (
                          <motion.tr
                            key={project.projectId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-gradient-to-r hover:from-blue-50/80 hover:via-purple-50/60 hover:to-pink-50/40 transition-all duration-300 border-b border-gray-100/50 group"
                          >
                            <TableCell className="py-6">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "p-3 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-110",
                                  project.status === 'active' ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25" :
                                  project.status === 'completed' ? "bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25" :
                                  "bg-gradient-to-br from-gray-500 to-gray-600 shadow-gray-500/25"
                                )}>
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{project.projectName}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">{project.ownerName}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl shadow-sm">
                                  <HardHat className="h-5 w-5 text-green-600" />
                                </div>
                                <span className="font-bold text-gray-700 text-lg">{project.engineerName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  getStatusColor(project.status),
                                  "font-bold flex items-center gap-2 w-fit px-4 py-2 text-sm shadow-sm"
                                )}
                              >
                                {getStatusIcon(project.status)}
                                {project.status === 'active' ? 'نشط' : 
                                 project.status === 'completed' ? 'مكتمل' : 
                                 project.status === 'archived' ? 'مؤرشف' : 
                                 project.status === 'on-hold' ? 'معلق' : 'غير محدد'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className={cn(
                                      "h-full transition-all duration-500 relative",
                                      (project.progress || 0) >= 80 ? "bg-gradient-to-r from-green-400 to-green-600" :
                                      (project.progress || 0) >= 50 ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                                      "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                    )}
                                    style={{ width: `${project.progress || 0}%` }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                  </div>
                                </div>
                                <span className="font-black text-gray-700 text-lg min-w-[3rem]">{project.progress || 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-xl shadow-sm">
                                  <FileText className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-purple-700 text-xl">{project.reports.length}</span>
                                  <span className="text-sm text-gray-500 font-medium">تقرير</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-6">
                              <Button 
                                asChild 
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3 group/btn relative overflow-hidden"
                              >
                                <Link href={`/owner/quantity-reports/${project.projectId}`} className="flex items-center gap-2 relative z-10">
                                  <Eye className="h-5 w-5" />
                                  <span>عرض التقارير</span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                </Link>
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 space-y-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-gray-900">
                    {projectReports.length === 0 && !searchTerm
                      ? 'لا توجد مشاريع حالياً' 
                      : 'لم يتم العثور على مشاريع'
                    }
                  </h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    {projectReports.length === 0 && !searchTerm
                      ? 'عندما يقوم المهندس بربط مشروع ببريدك الإلكتروني، سيظهر هنا.' 
                      : 'جرب تعديل كلمات البحث'
                    }
                  </p>
                </div>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                    }}
                  >
                    إعادة ضبط البحث
                  </Button>
                )}
              </div>
            )}

            {/* Results Count */}
            {filteredProjects.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200 gap-3">
                <p className="text-sm text-gray-600">
                  عرض <span className="font-semibold text-blue-600">{filteredProjects.length}</span> من أصل{' '}
                  <span className="font-semibold">{projectReports.length}</span> مشروع
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {searchTerm && (
                    <Badge variant="secondary" className="font-normal flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      {searchTerm}
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-normal">
                    {viewMode === 'cards' ? 'عرض بطاقات' : 'عرض جدول'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}