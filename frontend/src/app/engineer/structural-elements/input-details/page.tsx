"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  HardHat, 
  Settings, 
  Shield, 
  Zap, 
  Target, 
  Building2, 
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle2,
  Eye,
  User,
  Calendar,
  MapPin,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ElementType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  href: string;
  status: 'available' | 'coming-soon';
}

interface ProjectInfo {
  _id: string;
  projectName: string;
  ownerName: string;
  ownerEmail: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'completed' | 'archived';
}

interface ProjectCard {
  _id: string;
  projectName: string;
  ownerName: string;
  ownerEmail: string;
  clientName?: string;
  linkedOwnerEmail?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  description: string;
  elementsCount?: number;
  reportsCount?: number;
}

export default function InputDetailsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeatureMessage, setShowFeatureMessage] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectInfo();
    } else {
      fetchProjects();
    }
  }, [projectId]);

  const fetchProjectInfo = async () => {
    try {
      console.log(`Fetching project info for projectId: ${projectId}`);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Project info response:', data);
      
      if (data.success) {
        setProjectInfo(data.project);
      } else {
        console.error('API returned error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching project info:', error);
      // Add user-friendly error handling here if needed
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      if (!userId) {
        console.log('No userId found in localStorage');
        setLoading(false);
        return;
      }

      console.log('Fetching projects for userId:', userId, 'role:', userRole);
      
      // استخدام query parameters بدلاً من route parameters
      const url = `${API_BASE_URL}/projects?userId=${userId}&userRole=${userRole || 'ENGINEER'}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, message: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Projects API response:', data);
      
      if (data.success && data.projects) {
        // تحويل المشاريع إلى تنسيق ProjectCard مع جلب أسماء المالكين
        const projectCards: ProjectCard[] = await Promise.all(
          data.projects.map(async (project: any) => {
            console.log('Processing project:', {
              name: project.name,
              clientName: project.clientName,
              ownerName: project.ownerName,
              linkedOwnerEmail: project.linkedOwnerEmail
            });
            
            // استخدام أفضل مصدر متاح لاسم المالك
            let ownerName = project.clientName || project.ownerName || '';
            
            // إذا لم يكن هناك اسم مالك وكان هناك بريد إلكتروني مربوط، جلب اسم المالك من قاعدة البيانات
            if (!ownerName && project.linkedOwnerEmail) {
              try {
                const userResponse = await fetch(`${API_BASE_URL}/users/by/email?email=${encodeURIComponent(project.linkedOwnerEmail)}`);
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.success && userData.user) {
                    ownerName = userData.user.name || userData.user.email;
                    console.log('Fetched owner name from users table:', ownerName);
                  }
                }
              } catch (error) {
                console.error('Error fetching owner from users table:', error);
              }
            }
            
            // إذا لم يتم العثور على اسم، استخدم البريد الإلكتروني كاسم عرض
            if (!ownerName && project.linkedOwnerEmail) {
              ownerName = project.linkedOwnerEmail;
            }
            
            console.log('Final owner name for project:', project.name, ':', ownerName);
            
            return {
              ...project,
              projectName: project.name, // تأكد من وجود projectName
              ownerName: ownerName || 'غير محدد',
              clientName: project.clientName, // احتفظ بـ clientName للعرض
              linkedOwnerEmail: project.linkedOwnerEmail, // احتفظ بـ linkedOwnerEmail للعرض
              status: project.projectStatus === 'ACTIVE' ? 'active' : project.projectStatus === 'COMPLETED' ? 'completed' : 'archived',
              description: 'حسابات دقيقة وتقارير فورية. يدعم جميع أنواع العناصر الخرسانية مع إمكانية التصدير والطباعة.',
              elementsCount: 6, // عدد العناصر الإنشائية المتاحة
              reportsCount: project.reportsCount || 0
            };
          })
        );
        
        console.log('Processed project cards:', projectCards.length, 'projects');
        console.log('Sample project with owner:', projectCards[0]);
        setProjects(projectCards);
      } else {
        console.log('No projects found or API call failed:', data);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      'available': { label: 'متاح', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      'coming-soon': { label: 'قريبًا', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      'active': { label: 'نشط', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      'completed': { label: 'مكتمل', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      'archived': { label: 'مؤرشف', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    };
    return statuses[status as keyof typeof statuses] || statuses.available;
  };

  const handleViewElements = () => {
    setShowFeatureMessage(true);
    setTimeout(() => {
      setShowFeatureMessage(false);
    }, 3000);
  };

  const elements: ElementType[] = [
    {
      id: 'columns',
      name: 'الأعمدة',
      description: 'إدخال تفاصيل وأبعاد الأعمدة الخرسانية',
      icon: Building2,
      color: 'from-blue-500 to-indigo-600',
      href: projectId ? `/engineer/projects/${projectId}/structural-elements/columns` : '/engineer/structural-elements/columns',
      status: 'available'
    },
    {
      id: 'foundations',
      name: 'القواعد',
      description: 'تحديد أبعاد وأنواع القواعد الخرسانية',
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      href: projectId ? `/engineer/projects/${projectId}/structural-elements/foundations` : '/engineer/structural-elements/foundations',
      status: 'coming-soon'
    },
    {
      id: 'beams',
      name: 'الكمرات',
      description: 'إدخال تفاصيل الكمرات والأبعاد المطلوبة',
      icon: Zap,
      color: 'from-orange-500 to-red-600',
      href: projectId ? `/engineer/projects/${projectId}/structural-elements/beams` : '/engineer/structural-elements/beams',
      status: 'coming-soon'
    },
    {
      id: 'slabs',
      name: 'البلاطات',
      description: 'تحديد تفاصيل البلاطات والسقوف',
      icon: Target,
      color: 'from-purple-500 to-pink-600',
      href: projectId ? `/engineer/projects/${projectId}/structural-elements/slabs` : '/engineer/structural-elements/slabs',
      status: 'coming-soon'
    },
    {
      id: 'stairs',
      name: 'السلالم',
      description: 'إدخال تفاصيل السلالم والتصميمات',
      icon: ChevronRight,
      color: 'from-cyan-500 to-blue-600',
      href: projectId ? `/engineer/projects/${projectId}/structural-elements/stairs` : '/engineer/structural-elements/stairs',
      status: 'coming-soon'
    },
    {
      id: 'walls',
      name: 'الجدران',
      description: 'تحديد تفاصيل الجدران الحاملة',
      icon: Settings,
      color: 'from-amber-500 to-orange-600',
      href: projectId ? `/engineer/projects/${projectId}/structural-elements/walls` : '/engineer/structural-elements/walls',
      status: 'coming-soon'
    }
  ];

  const filteredProjects = projects
    .filter(project => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (project.projectName || '').toLowerCase().includes(searchLower) ||
                           (project.ownerName || '').toLowerCase().includes(searchLower) ||
                           (project.description || '').toLowerCase().includes(searchLower);
      const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.projectName || '').localeCompare(b.projectName || '');
      } else if (sortBy === 'status') {
        return a.status === 'active' ? -1 : 1;
      } else if (sortBy === 'date') {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });

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
            <div className="absolute inset-0 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto relative" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">جاري تحميل المشروع</h2>
            <p className="text-slate-600">يتم جلب بيانات المشروع والعناصر الإنشائية...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Feature Message Modal */}
      <AnimatePresence>
        {showFeatureMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowFeatureMessage(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">ميزة قيد التطوير</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  هذه الميزة قيد التطوير وستكون متاحة قريباً
                </p>
                <Button
                  onClick={() => setShowFeatureMessage(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2"
                >
                  حسناً
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  العناصر الإنشائية
                </h1>
                <p className="text-slate-600 text-lg">عرض وإدارة العناصر الإنشائية للمشاريع</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (projectId) {
                    fetchProjectInfo();
                  } else {
                    fetchProjects();
                  }
                }}
                disabled={loading}
                variant="outline"
                className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-slate-900 transition-all duration-200"
              >
                <RefreshCw className={cn(
                  "w-4 h-4 transition-transform duration-500", 
                  loading && "animate-spin"
                )} />
                <span className={cn(
                  "transition-all duration-200",
                  loading && "text-emerald-600"
                )}>
                  {loading ? "جاري التحديث..." : "تحديث"}
                </span>
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
                  <SelectItem value="name">اسم المشروع</SelectItem>
                  <SelectItem value="status">الحالة</SelectItem>
                  <SelectItem value="date">آخر تحديث</SelectItem>
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
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">جدول</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Project Info Card */}
        {projectInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                        {projectInfo.projectName}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">المالك:</span>
                          <span className="font-bold text-slate-900">{projectInfo.ownerName}</span>
                        </div>
                        {projectInfo.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{projectInfo.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>تم الإنشاء: {formatDate(projectInfo.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(getStatusBadge(projectInfo.status || 'active').color, "text-sm px-3 py-1")}>
                      {getStatusBadge(projectInfo.status || 'active').label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">العناصر المتاحة</p>
                      <p className="text-xs text-slate-600">{elements.filter(e => e.status === 'available').length} من {elements.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">معدل الإكمال</p>
                      <p className="text-xs text-slate-600">{Math.round((elements.filter(e => e.status === 'available').length / elements.length) * 100)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">قيد التطوير</p>
                      <p className="text-xs text-slate-600">{elements.filter(e => e.status === 'coming-soon').length} عنصر</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    آخر تحديث: {formatDate(projectInfo.updatedAt)}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/engineer/projects/${projectId}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        عرض المشروع
                      </Button>
                    </Link>
                    <Link href={`/engineer/quantity-reports/${projectId}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <BarChart3 className="w-4 h-4" />
                        التقارير
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        {!projectId && filteredProjects.length > 0 && (
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
                      <p className="text-emerald-600 text-sm font-medium">العناصر المتاحة</p>
                      <p className="text-3xl font-bold text-emerald-900">
                        {filteredProjects.reduce((acc, p) => acc + (p.elementsCount || 6), 0)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
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
                      <p className="text-purple-600 text-sm font-medium">مشاريع مكتملة</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {filteredProjects.filter(p => p.status === 'completed').length}
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
        )}

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
                  <Building2 className="w-20 h-20 text-slate-400 mx-auto relative" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">لا توجد مشاريع</h3>
                <p className="text-slate-500 mb-8 text-lg">
                  {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إنشاء أي مشاريع بعد. قم بإنشاء مشروع جديد للبدء في العمل على العناصر الإنشائية.'}
                </p>
                <Link href="/engineer/projects">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg gap-3">
                    <Building2 className="w-5 h-5" />
                    إنشاء مشروع جديد
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredProjects.map((project) => {
                    const statusBadge = getStatusBadge(project.status);
                    
                    return (
                      <motion.div
                        key={project._id}
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
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                      <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <Badge className={cn(statusBadge.color, "text-xs")}>
                                      {statusBadge.label}
                                    </Badge>
                                  </div>
                                  <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">
                                    {project.projectName}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>{project.elementsCount || 6} عنصر</span>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="space-y-4">
                                {/* Owner Info */}
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <span className="text-xs font-medium text-slate-500">المالك:</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-900 mt-1">
                                    {project.ownerName || project.clientName || project.linkedOwnerEmail || 'غير محدد'}
                                  </p>
                                </div>
                                
                                {/* Elements Types */}
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-slate-500">العناصر الإنشائية:</p>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge className="bg-blue-500 text-white text-xs flex items-center gap-1">
                                      <Building2 className="w-3 h-3 text-white" />
                                      الأعمدة
                                    </Badge>
                                    <Badge className="bg-emerald-500 text-white text-xs flex items-center gap-1">
                                      <Shield className="w-3 h-3 text-white" />
                                      القواعد
                                    </Badge>
                                    <Badge className="bg-orange-500 text-white text-xs flex items-center gap-1">
                                      <Zap className="w-3 h-3 text-white" />
                                      الكمرات
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      +3
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Last Updated */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDate(project.updatedAt)}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleViewElements}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-3"
                                    >
                                      <Eye className="w-4 h-4" />
                                      عرض العناصر
                                    </Button>
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
                      <Building2 className="w-6 h-6" />
                      المشاريع ({filteredProjects.length})
                    </CardTitle>
                    <CardDescription className="text-emerald-100">
                      اختر مشروعًا لعرض العناصر الإنشائية والبدء في الحسابات
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-right font-bold">المشروع</TableHead>
                          <TableHead className="text-right font-bold">المالك</TableHead>
                          <TableHead className="text-right font-bold">العناصر الإنشائية</TableHead>
                          <TableHead className="text-right font-bold">الحالة</TableHead>
                          <TableHead className="text-right font-bold">آخر تحديث</TableHead>
                          <TableHead className="text-right font-bold">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjects.map((project) => {
                          const statusBadge = getStatusBadge(project.status);
                          
                          return (
                            <TableRow 
                              key={project._id}
                              className="hover:bg-emerald-50/50 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{project.projectName}</p>
                                    {project.location && (
                                      <p className="text-xs text-slate-500">{project.location}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      {project.ownerName || project.clientName || project.linkedOwnerEmail || 'غير محدد'}
                                    </p>
                                    <p className="text-xs text-slate-500">مالك المشروع</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  <Badge className="bg-blue-500 text-white text-xs">الأعمدة</Badge>
                                  <Badge className="bg-emerald-500 text-white text-xs">القواعد</Badge>
                                  <Badge className="bg-orange-500 text-white text-xs">الكمرات</Badge>
                                  <Badge variant="outline" className="text-xs">+3</Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(statusBadge.color, "text-xs")}>
                                  {statusBadge.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">{formatDate(project.updatedAt)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleViewElements}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    عرض العناصر
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}


      </div>
    </div>
  );
}
