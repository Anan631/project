"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarDays, Image as ImageIcon, FileText, MessageSquare, Edit, Send, Palette, CheckCircle2,
  UploadCloud, Download, Link2, HardHat, Users, Percent, FileEdit, BarChart3, GanttChartSquare, Settings2, Loader2 as LoaderIcon, Mail, Calculator, Wrench, ListChecks, Wallet, Plus, Trash2, Save, Clock, DollarSign, User, MapPin, Building, Flag, Target, TrendingUp, Activity, FileImage, Video, File, Folder, Star, AlertCircle, Info, X, MessageCircle, Search, Loader2,
  UserCheck, Shield, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogOverlay } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { findProjectById, updateProject as dbUpdateProject, getCostReportsForProject, addCostReport, deleteCostReport, searchOwners, type Project, type ProjectComment, type ProjectPhoto, type TimelineTask, type CostReport } from '@/lib/db';
import { apiClient, type ConcreteCalculationInput, type SteelCalculationInput } from '@/lib/api';
import Link from 'next/link';
import EditProjectDialog from '@/components/engineer/EditProjectDialog';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProjectChatDialog from "@/components/ProjectChatDialog";

export default function EngineerProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [costReports, setCostReports] = useState<CostReport[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState({ percentage: '', notes: '' });
  const [linkedOwnerEmailInput, setLinkedOwnerEmailInput] = useState('');
  const [ownerSearchQuery, setOwnerSearchQuery] = useState('');
  const [ownerSearchResults, setOwnerSearchResults] = useState<{id: string, name: string, email: string}[]>([]);
  const [isSearchingOwners, setIsSearchingOwners] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<{id: string, name: string, email: string} | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isContactEngineerModalOpen, setIsContactEngineerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [engineerMessage, setEngineerMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState('');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ name: '', startDate: '', endDate: '', color: '#3b82f6', status: 'مخطط له' });

  const [isLoading, setIsLoading] = useState(true);

  // Default colors for tasks
  const defaultColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280'  // gray
  ];
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isCostReportModalOpen, setIsCostReportModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newCostReport, setNewCostReport] = useState({ reportName: '', totalCost_ILS: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [fileType, setFileType] = useState('image');
  const [taskToEdit, setTaskToEdit] = useState<TimelineTask | null>(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);

  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedCostReports, setSelectedCostReports] = useState<string[]>([]);

  const isOwnerView = false; // This is Engineer's view

  const refreshProjectData = async () => {
    try {
      const [currentProject, reports] = await Promise.all([
        findProjectById(projectId),
        getCostReportsForProject(projectId)
      ]);

      // Self-healing: If project is 100% complete but status is not 'Completed', fix it automatically
      if (currentProject && currentProject.overallProgress === 100 && currentProject.status !== 'مكتمل') {
        await dbUpdateProject(projectId, { status: 'مكتمل' });
        currentProject.status = 'مكتمل';
      }

      setProject(currentProject ? { ...currentProject } : null);
      setCostReports(reports);

      if (currentProject?.linkedOwnerEmail) {
        setLinkedOwnerEmailInput(currentProject.linkedOwnerEmail);
      }
      if (currentProject?.overallProgress) {
        setProgressUpdate(prev => ({ ...prev, percentage: currentProject.overallProgress.toString() }));
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({ title: "خطأ", description: "فشل تحميل بيانات المشروع", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      refreshProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !project) return;
    setIsSubmittingComment(true);

    const commentToAdd: ProjectComment = {
      id: crypto.randomUUID(),
      user: isOwnerView ? "المالك" : "المهندس (أنت)",
      text: newComment,
      date: new Date().toISOString(),
      avatar: isOwnerView ? "https://placehold.co/40x40.png?text=OW" : "https://placehold.co/40x40.png?text=ME",
      dataAiHintAvatar: isOwnerView ? "owner avatar" : "my avatar"
    };

    const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
      comments: [...(project.comments || []), commentToAdd]
    });

    if (updatedProjectResult.success) {
      await refreshProjectData();
      setNewComment('');
      toast({ title: "تم إضافة التعليق", description: "تم نشر تعليقك بنجاح." });
    } else {
      toast({ title: "خطأ", description: "فشل إضافة التعليق.", variant: "destructive" });
    }
    setIsSubmittingComment(false);
  };

  const handleProgressSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!project || !progressUpdate.percentage) {
      toast({ title: "خطأ", description: "يرجى إدخال نسبة التقدم.", variant: "destructive" });
      return;
    }
    const newProgress = parseInt(progressUpdate.percentage, 10);
    if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
      toast({ title: "خطأ", description: "الرجاء إدخال نسبة تقدم صالحة (0-100).", variant: "destructive" });
      return;
    }

    const updates: Partial<Project> = {
      overallProgress: newProgress,
      quantitySummary: (project.quantitySummary || '') + (progressUpdate.notes ? `\n(ملاحظة تقدم: ${progressUpdate.notes})` : '')
    };

    // Update status based on progress - Automatically set to Completed if 100%
    if (newProgress === 100) {
      updates.status = 'مكتمل';
    } else if (newProgress > 0 && newProgress < 100 && project.status === 'مخطط له') {
      updates.status = 'قيد التنفيذ';
    } else if (newProgress > 0 && newProgress < 100 && project.status === 'مكتمل') {
      updates.status = 'قيد التنفيذ';
    }

    const updatedProjectResult = await dbUpdateProject(project.id.toString(), updates);

    if (updatedProjectResult.success) {
      await refreshProjectData();
      toast({ title: "تم تحديث التقدم", description: `تم تحديث تقدم المشروع إلى ${newProgress}%.` });
      setProgressUpdate(prev => ({ ...prev, notes: '' }));
    } else {
      toast({ title: "خطأ", description: "فشل تحديث التقدم.", variant: "destructive" });
    }
  };


  // Search for owners in database
  const searchForOwners = async (query: string) => {
    if (!query.trim()) {
      setOwnerSearchResults([]);
      return;
    }
    
    setIsSearchingOwners(true);
    try {
      // Use the searchOwners function from db.ts
      const result = await searchOwners(query);
      
      if (result.success && result.owners) {
        setOwnerSearchResults(result.owners);
      } else {
        setOwnerSearchResults([]);
        toast({ title: "خطأ", description: result.message || "فشل البحث عن المالكين.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error searching for owners:", error);
      toast({ title: "خطأ", description: "فشل البحث عن المالكين.", variant: "destructive" });
    } finally {
      setIsSearchingOwners(false);
    }
  };

  // Handle owner selection
  const handleOwnerSelect = (owner: {id: string, name: string, email: string}) => {
    setSelectedOwner(owner);
    setLinkedOwnerEmailInput(owner.email);
    setOwnerSearchQuery(owner.name);
    setOwnerSearchResults([]);
  };

  const handleLinkOwnerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!project || !linkedOwnerEmailInput.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال بريد إلكتروني للمالك.", variant: "destructive" });
      return;
    }

    const updatedProjectResult = await dbUpdateProject(project.id.toString(), { 
      linkedOwnerEmail: linkedOwnerEmailInput,
      clientName: selectedOwner?.name || project.clientName
    });
    if (updatedProjectResult.success) {
      await refreshProjectData();
      toast({ 
        title: "تم ربط المالك بنجاح", 
        description: (
          <div className="flex flex-col gap-2">
            <div>تم ربط المالك <span className="font-bold">{selectedOwner?.name || "غير محدد"}</span> بالمشروع <span className="font-bold">{project.name}</span> بنجاح.</div>
            {selectedOwner && (
              <div className="text-sm text-gray-600">سيتم إشعار المالك على بريده الإلكتروني: {selectedOwner.email}</div>
            )}
          </div>
        ) 
      });
      setSelectedOwner(null);
      setOwnerSearchQuery('');
    } else {
      toast({ title: "خطأ", description: "فشل ربط المالك.", variant: "destructive" });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !project) {
      toast({ title: "لم يتم اختيار ملف", description: "يرجى اختيار ملف لتحميله.", variant: "destructive" });
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "الملف كبير جداً",
        description: "الحد الأقصى لحجم الملف هو 10 ميجابايت. يرجى اختيار ملف أصغر.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingFile(true);

    try {
      let base64String: string;

      // For images, compress them
      if (fileType === 'image' && selectedFile.type.startsWith('image/')) {
        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // Resize if too large
              const maxDimension = 800;
              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  height = (height / width) * maxDimension;
                  width = maxDimension;
                } else {
                  width = (width / height) * maxDimension;
                  height = maxDimension;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              // Convert to base64 with compression
              const compressed = canvas.toDataURL('image/jpeg', 0.8);
              resolve(compressed);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      } else {
        // For videos, use as-is (but check size limit)
        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      const newPhoto: ProjectPhoto = {
        id: crypto.randomUUID(),
        src: base64String,
        alt: `Uploaded: ${selectedFile.name}`,
        dataAiHint: fileType === 'image' ? "uploaded image" : fileType === 'video' ? "uploaded video" : "uploaded document",
        caption: uploadCaption || `تم الرفع: ${selectedFile.name}`,
        fileType: fileType as 'image' | 'video' | 'document'
      };

      const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
        photos: [...(project.photos || []), newPhoto]
      });

      if (updatedProjectResult.success) {
        await refreshProjectData();
        setSelectedFile(null);
        setUploadCaption('');
        const fileInput = document.getElementById('projectFileUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        toast({ title: "تم رفع الملف بنجاح", description: `${selectedFile.name} جاهز الآن.` });
        setIsUploadModalOpen(false);
      } else {
        toast({ title: "خطأ", description: "فشل رفع الملف.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: "خطأ", description: "فشل قراءة الملف. يرجى المحاولة بملف أصغر حجماً.", variant: "destructive" });
    }

    setIsUploadingFile(false);
  };

  // Delete single media item
  const handleDeleteMedia = async (mediaId: string) => {
    if (!project) return;

    const updatedPhotos = project.photos.filter(photo => photo.id !== mediaId);
    const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
      photos: updatedPhotos
    });

    if (updatedProjectResult.success) {
      await refreshProjectData();
      setSelectedMediaIds(prev => prev.filter(id => id !== mediaId));
      toast({ title: "تم الحذف", description: "تم حذف الملف بنجاح." });
    } else {
      toast({ title: "خطأ", description: "فشل حذف الملف.", variant: "destructive" });
    }
  };

  // Delete multiple selected media items
  const handleDeleteSelected = async () => {
    if (!project || selectedMediaIds.length === 0) return;

    const updatedPhotos = project.photos.filter(photo => !selectedMediaIds.includes(photo.id));
    const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
      photos: updatedPhotos
    });

    if (updatedProjectResult.success) {
      await refreshProjectData();
      setSelectedMediaIds([]);
      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedMediaIds.length} ملف بنجاح.`
      });
    } else {
      toast({ title: "خطأ", description: "فشل حذف الملفات.", variant: "destructive" });
    }
  };

  // Toggle media selection
  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev =>
      prev.includes(mediaId)
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (!project) return;
    if (selectedMediaIds.length === project.photos.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(project.photos.map(photo => photo.id));
    }
  };

  // Toggle cost report selection
  const toggleCostReportSelection = (reportId: string) => {
    setSelectedCostReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  // Toggle select all cost reports
  const toggleSelectAllCostReports = () => {
    if (selectedCostReports.length === costReports.length) {
      setSelectedCostReports([]);
    } else {
      setSelectedCostReports(costReports.map(report => report.id));
    }
  };

  // Delete selected cost reports
  const handleDeleteSelectedCostReports = async () => {
    if (!project || selectedCostReports.length === 0) return;

    let successCount = 0;
    for (const reportId of selectedCostReports) {
      const result = await deleteCostReport(reportId);
      if (result.success) successCount++;
    }

    if (successCount === selectedCostReports.length) {
      const refreshed = await getCostReportsForProject(project.id.toString());
      setCostReports(refreshed);
      setSelectedCostReports([]);
      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedCostReports.length} تقرير تكاليف بنجاح.`
      });
    } else {
      toast({
        title: "خطأ",
        description: `تم حذف ${successCount} من ${selectedCostReports.length} تقارير فقط.`,
        variant: "destructive"
      });
    }
  };


  // Calculate project start and end dates based on actual project data
  const getProjectDates = () => {
    if (!project) {
      return {
        projectStartDate: new Date(),
        projectEndDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        totalProjectDurationDays: 30
      };
    }

    let projectStartDate: Date;
    let projectEndDate: Date;
    let totalProjectDurationDays: number;

    // Use project dates if available
    if (project.startDate && project.endDate) {
      projectStartDate = new Date(project.startDate);
      projectEndDate = new Date(project.endDate);
      totalProjectDurationDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    // Fall back to timeline tasks if project dates are not available
    else if (project.timelineTasks && project.timelineTasks.length > 0) {
      projectStartDate = new Date(Math.min(...project.timelineTasks.map(task => new Date(task.startDate).getTime())));
      projectEndDate = new Date(Math.max(...project.timelineTasks.map(task => new Date(task.endDate).getTime())));
      totalProjectDurationDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    // Default to current date and 30 days if no data is available
    else {
      projectStartDate = new Date();
      projectEndDate = new Date(new Date().setDate(new Date().getDate() + 30));
      totalProjectDurationDays = 30;
    }

    // Ensure minimum duration of 1 day
    if (totalProjectDurationDays <= 0) {
      totalProjectDurationDays = 1;
      projectEndDate = new Date(projectStartDate);
      projectEndDate.setDate(projectEndDate.getDate() + 1);
    }

    return { projectStartDate, projectEndDate, totalProjectDurationDays };
  };

  const { projectStartDate, projectEndDate, totalProjectDurationDays } = getProjectDates();

  const getTaskPositionAndWidth = (task: TimelineTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const offsetDays = Math.ceil((taskStart.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const durationDays = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const leftPercentage = (offsetDays / totalProjectDurationDays) * 100;
    const widthPercentage = (durationDays / totalProjectDurationDays) * 100;
    return {
      left: `${Math.max(0, Math.min(100 - widthPercentage, leftPercentage))}%`,
      width: `${Math.max(2, Math.min(100, widthPercentage))}%`,
    };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <LoaderIcon className="h-16 w-16 text-blue-600 animate-spin mb-4" />
        <p className="text-xl font-semibold text-gray-600">جاري تحميل بيانات المشروع...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Alert variant="destructive">
          <FileText className="h-5 w-5" />
          <AlertTitle>المشروع غير موجود</AlertTitle>
          <AlertDescription>لم يتم العثور على تفاصيل المشروع المطلوب.</AlertDescription>
        </Alert>
        <Button asChild className="mt-6 bg-app-gold hover:bg-yellow-600 text-primary-foreground">
          <Link href="/engineer/projects">العودة إلى قائمة المشاريع</Link>
        </Button>
      </div>
    );
  }

  // Enhanced simulation function with progress tracking
  const simulateAction = async (actionName: string, duration = 2000) => {
    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationStatus(`جاري تنفيذ ${actionName}...`);

    // Simulate progress
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, duration / 10);

    await new Promise(resolve => setTimeout(resolve, duration));

    setIsSimulating(false);
    setSimulationStatus('');
    toast({
      title: "اكتملت المحاكاة",
      description: `تم تنفيذ "${actionName}" بنجاح (محاكاة).`
    });
  };

  // Add a new timeline task (persistent)
  const handleAddTask = async () => {
    if (!newTask.name || !newTask.startDate || !newTask.endDate) {
      toast({ title: "خطأ", description: "يرجى ملء جميع حقول المهمة", variant: "destructive" });
      return;
    }

    if (project) {
      // Use default color if none specified
      const taskColor = newTask.color || defaultColors[project.timelineTasks?.length % defaultColors.length] || '#3b82f6';

      const taskToAdd: TimelineTask = {
        id: crypto.randomUUID(),
        name: newTask.name,
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        status: newTask.status as any,
        color: taskColor,
        progress: 0
      };

      const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
        timelineTasks: [...(project.timelineTasks || []), taskToAdd]
      });

      if (updatedProjectResult.success) {
        await refreshProjectData();
        setNewTask({ name: '', startDate: '', endDate: '', color: '#3b82f6', status: 'مخطط له' });
        setIsAddTaskModalOpen(false);
        toast({ title: "تمت إضافة المهمة", description: "تم حفظ المهمة الجديدة بنجاح." });
      }
    }
  };

  // Edit an existing timeline task (persistent)
  const handleEditTask = async () => {
    if (!taskToEdit || !taskToEdit.name || !taskToEdit.startDate || !taskToEdit.endDate) {
      toast({ title: "خطأ", description: "يرجى ملء جميع حقول المهمة", variant: "destructive" });
      return;
    }

    if (project) {
      const updatedTasks = project.timelineTasks?.map(task =>
        task.id === taskToEdit.id ? taskToEdit : task
      ) || [];

      const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
        timelineTasks: updatedTasks
      });

      if (updatedProjectResult.success) {
        await refreshProjectData();
        setTaskToEdit(null);
        setIsEditTaskModalOpen(false);
        toast({ title: "تم تعديل المهمة", description: "تم حفظ التعديلات بنجاح." });
      }
    }
  };

  // Delete a timeline task (persistent)
  const handleDeleteTask = async (taskId: string) => {
    if (project) {
      const updatedTasks = project.timelineTasks?.filter(task => task.id !== taskId) || [];

      const updatedProjectResult = await dbUpdateProject(project.id.toString(), {
        timelineTasks: updatedTasks
      });

      if (updatedProjectResult.success) {
        await refreshProjectData();
        toast({ title: "تم حذف المهمة", description: "تم حذف المهمة وحفظ التغيير." });
      }
    }
  };

  // Add cost report (persistent)
  const handleAddCostReport = async () => {
    if (!newCostReport.reportName || newCostReport.totalCost_ILS <= 0) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم التقرير والتكلفة", variant: "destructive" });
      return;
    }
    if (!project) return;

    const created = await addCostReport({
      projectId: project.id,
      reportName: newCostReport.reportName,
      engineerId: '',
      engineerName: project.engineer || '',
      ownerId: '',
      ownerName: project.clientName || project.linkedOwnerEmail || '',
      items: [],
      totalCost_ILS: newCostReport.totalCost_ILS,
    });

    if (created) {
      const refreshed = await getCostReportsForProject(project.id.toString());
      setCostReports(refreshed);
      setNewCostReport({ reportName: '', totalCost_ILS: 0 });
      setIsCostReportModalOpen(false);
      toast({ title: "تمت إضافة التقرير", description: "تم حفظ تقرير التكاليف بنجاح." });
    } else {
      toast({ title: "خطأ", description: "فشل حفظ تقرير التكاليف.", variant: "destructive" });
    }
  };

  const handleDownloadReport = (report: CostReport) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableRows = report.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${item.pricePerUnit_ILS.toFixed(2)} ₪</td>
          <td style="font-weight: 700;">${item.totalCost_ILS.toFixed(2)} ₪</td>
        </tr>
      `).join('');

      const fullReportTitle = `تقرير تكلفة البناء: ${report.reportName}`;
      const currentDate = new Date(report.createdAt).toLocaleDateString('ar-EG-u-nu-latn');
      const itemsCount = report.items.length;

      const reportHtml = `
        <html>
          <head>
            <title>${fullReportTitle}</title>
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
                margin-bottom: 30px;
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
              .total-section {
                background-color: #f9fafb;
                padding: 25px;
                border-radius: 12px;
                border: 2px solid #4f46e5;
                margin: 30px 0;
              }
              .total-section .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .total-section .total-label {
                font-size: 24px;
                color: #4f46e5;
                font-weight: 700;
              }
              .total-section .total-value {
                font-size: 32px;
                color: #312e81;
                font-weight: 700;
              }
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
                  <h1>${fullReportTitle}</h1>
                  <p>تفصيل شامل لتكاليف المواد والعمالة</p>
                </div>
              </header>
              
              <section class="report-meta">
                <div class="meta-item">
                  <span class="label">المهندس المسؤول</span>
                  <span class="value">${report.engineerName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">المالك/العميل</span>
                  <span class="value">${report.ownerName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">تاريخ التقرير</span>
                  <span class="value">${currentDate}</span>
                </div>
                <div class="meta-item">
                  <span class="label">عدد المواد</span>
                  <span class="value">${itemsCount}</span>
                </div>
              </section>

              <table>
                <thead>
                  <tr>
                    <th>المادة</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">المجموع الكلي:</span>
                  <span class="total-value">${report.totalCost_ILS.toFixed(2)} ₪</span>
                </div>
              </div>

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

      toast({
        title: "تم فتح التقرير",
        description: "تم فتح التقرير في نافذة جديدة. يمكنك طباعته أو حفظه كملف PDF."
      });
    } else {
      toast({
        title: "خطأ في الطباعة",
        description: "لم يتمكن المتصفح من فتح نافذة الطباعة.",
        variant: "destructive",
      });
    }
  };

  // Prepare delete intent
  const handleDeleteCostReport = (reportId: string) => {
    setReportToDelete(reportId);
  };

  // Confirm delete
  const confirmDeleteReport = async () => {
    if (!project || !reportToDelete) return;

    const result = await deleteCostReport(reportToDelete);

    if (result.success) {
      const refreshed = await getCostReportsForProject(project.id.toString());
      setCostReports(refreshed);
      toast({ title: "تم الحذف", description: "تم حذف تقرير التكاليف بنجاح." });
    } else {
      toast({ title: "خطأ", description: "فشل حذف التقرير.", variant: "destructive" });
    }
    setReportToDelete(null);
  };




  // Function to open edit task modal
  const openEditTaskModal = (task: TimelineTask) => {
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
  };

  // Get Arabic day name
  const getArabicDayName = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return dayNames[date.getDay()];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Format date for timeline display (shorter format)
  const formatTimelineDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate Timeline PDF Report
  const handleDownloadTimelineReport = () => {
    if (!project || !project.timelineTasks || project.timelineTasks.length === 0) {
      toast({
        title: "لا توجد مهام للتقرير",
        description: "لا توجد مهام في الجدول الزمني لإنشاء التقرير.",
        variant: "default"
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const engineerName = project.engineer || 'غير معروف';
      // استخدام اسم المالك المربوط بالمشروع أولاً، ثم العميل كبديل
      const ownerName = project.linkedOwnerEmail ? 
        (selectedOwner?.name || project.clientName || project.linkedOwnerEmail) : 
        (project.clientName || 'غير محدد');
      const clientName = ownerName; // للتوافق مع باقي الكود
      const totalTasks = project.timelineTasks.length;
      const completedTasks = project.timelineTasks.filter(t => t.status === 'مكتمل').length;
      const inProgressTasks = project.timelineTasks.filter(t => t.status === 'قيد التنفيذ').length;
      const plannedTasks = project.timelineTasks.filter(t => t.status === 'مخطط له').length;

      const tableRows = project.timelineTasks.map(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        const statusColor = task.status === 'مكتمل' ? '#10b981' : 
                           task.status === 'قيد التنفيذ' ? '#f59e0b' : '#6b7280';
        
        return `
          <tr>
            <td>${task.name}</td>
            <td>${formatDate(task.startDate)}</td>
            <td>${formatDate(task.endDate)}</td>
            <td style="font-weight: 600; color: #3b82f6;">${duration} يوم</td>
            <td>
              <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid ${statusColor}40;">
                ${task.status}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      const reportHtml = `
        <html>
          <head>
            <title>تقرير الجدول الزمني - ${project.name}</title>
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
                border-bottom: 4px solid #10b981;
                margin-bottom: 30px;
              }
              .report-header .titles {
                text-align: right;
              }
              .report-header h1 {
                margin: 0;
                color: #065f46;
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
                color: #065f46;
                font-weight: 700;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
              }
              .stat-card {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
              }
              .stat-card .number {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 5px;
              }
              .stat-card .label {
                font-size: 14px;
                opacity: 0.9;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 15px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                margin-bottom: 30px;
              }
              th, td {
                padding: 16px 20px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
              }
              thead th {
                background: linear-gradient(to bottom, #10b981, #059669);
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
                background-color: #f0fdf4;
              }
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
                <img src="/logo.png" alt="شعار الموقع" style="max-height: 80px; border-radius: 8px;">
                <div class="titles">
                  <h1>تقرير الجدول الزمني</h1>
                  <p>مشروع: ${project.name}</p>
                </div>
              </header>
              
              <section class="report-meta">
                <div class="meta-item">
                  <span class="label">المهندس المسؤول</span>
                  <span class="value">${engineerName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">المالك</span>
                  <span class="value">${ownerName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">تاريخ التقرير</span>
                  <span class="value">${new Date().toLocaleDateString('ar-EG-u-nu-latn')}</span>
                </div>
                <div class="meta-item">
                  <span class="label">مدة المشروع</span>
                  <span class="value">${totalProjectDurationDays} يوم</span>
                </div>
              </section>

              <section class="stats-grid">
                <div class="stat-card">
                  <div class="number">${totalTasks}</div>
                  <div class="label">إجمالي المهام</div>
                </div>
                <div class="stat-card">
                  <div class="number">${completedTasks}</div>
                  <div class="label">مهام مكتملة</div>
                </div>
                <div class="stat-card">
                  <div class="number">${inProgressTasks}</div>
                  <div class="label">قيد التنفيذ</div>
                </div>
                <div class="stat-card">
                  <div class="number">${plannedTasks}</div>
                  <div class="label">مخطط لها</div>
                </div>
              </section>

              <table>
                <thead>
                  <tr>
                    <th>اسم المهمة</th>
                    <th>تاريخ البدء</th>
                    <th>تاريخ الانتهاء</th>
                    <th>المدة</th>
                    <th>الحالة</th>
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

      toast({
        title: "تم فتح تقرير الجدول الزمني",
        description: "تم فتح التقرير في نافذة جديدة. يمكنك طباعته أو حفظه كملف PDF."
      });
    } else {
      toast({
        title: "خطأ في الطباعة",
        description: "لم يتمكن المتصفح من فتح نافذة الطباعة.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Simulation Progress Bar */}
      {isSimulating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg p-4 border-b border-gray-200">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LoaderIcon className="h-5 w-5 animate-spin text-app-red" />
                <span className="font-medium">{simulationStatus}</span>
              </div>
              <div className="w-64">
                <Progress value={simulationProgress} className="h-2 bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4">
        {/* Project Header */}
        <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl mb-8 border-0 rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
          <CardHeader className="relative z-10 pb-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-3xl font-bold">{project.name}</CardTitle>
                    <Badge variant={project.status === 'مكتمل' ? 'default' : project.status === 'قيد التنفيذ' ? 'secondary' : 'outline'} className="text-sm bg-white/20 text-white border-white/30">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                      <Building className="h-3 w-3 ms-1" />
                      {project.location || 'غير محدد'}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                      <User className="h-3 w-3 ms-1" />
                      {project.engineer || 'غير محدد'}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-blue-100 text-base">{project.description}</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {!isOwnerView && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-700 text-white border-green-700 font-semibold hover:bg-green-800 hover:text-white hover:border-green-800 active:bg-white active:text-black active:border-green-700 transition-all duration-200"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <FileEdit size={18} className="ms-1.5" /> تعديل بيانات المشروع
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-600 text-white border-blue-600 font-semibold hover:bg-blue-700 hover:text-white transition-all duration-200"
                  onClick={() => setIsChatOpen(true)}
                >
                  <MessageCircle size={18} className="ms-1.5" /> مراسلة المالك
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm text-blue-100 mt-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <strong>الموقع:</strong> {project.location || 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <strong>المهندس:</strong> {project.engineer || 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <strong>العميل:</strong> {project.clientName || 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <strong>الميزانية:</strong> {project.budget ? `${project.budget.toLocaleString('ar')} شيكل` : 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <strong>تاريخ البدء:</strong> {project.startDate ? formatDate(project.startDate) : 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <strong>التسليم المتوقع:</strong> {project.endDate ? formatDate(project.endDate) : 'غير محدد'}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <strong>مدة المشروع:</strong> {totalProjectDurationDays} يوم
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 relative z-10">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">التقدم العام للمشروع:</Label>
                <span className="font-bold text-yellow-300 text-lg">{project.overallProgress}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={project.overallProgress} className="h-4 flex-grow bg-white/20" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className={`text-sm font-semibold ${project.status === 'مكتمل' ? 'text-green-300' :
                  project.status === 'قيد التنفيذ' ? 'text-yellow-300' :
                    'text-blue-300'
                  }`}>
                  الحالة الحالية: {project.status}
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium text-base">آخر تحديث: {new Date().toLocaleDateString('en-US')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management Tools */}
        {!isOwnerView && (
          <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-2xl mb-8 border-0 rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Wrench size={28} /> أدوات إدارة المشروع
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full justify-start bg-blue-500/20 text-blue-100 border-blue-500/30 hover:bg-blue-500/30 h-14" onClick={() => simulateAction("فتح نموذج إدخال تفاصيل العناصر الإنشائية")}>
                <ListChecks size={18} className="ms-2" /> إدخال تفاصيل العناصر
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-red-500/20 text-red-100 border-red-500/30 hover:bg-red-500/30 h-14"
                asChild
              >
                <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                  <HardHat size={18} className="ms-2" /> حساب كميات الباطون
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-green-500/20 text-green-100 border-green-500/30 hover:bg-green-500/30 h-14"
                asChild
              >
                <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
                  <BarChart3 size={18} className="ms-2" /> حساب كميات الحديد
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-purple-500/20 text-purple-100 border-purple-500/30 hover:bg-purple-500/30 h-14" onClick={() => setIsUploadModalOpen(true)}>
                <UploadCloud size={18} className="ms-2" /> رفع صور/فيديو للمشروع
              </Button>
              <Button variant="outline" className="w-full justify-start bg-orange-500/20 text-orange-100 border-orange-500/30 hover:bg-orange-500/30 h-14" onClick={() => setIsAddTaskModalOpen(true)}>
                <GanttChartSquare size={18} className="ms-2" /> إضافة مهمة جديدة
              </Button>

            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white shadow-lg p-1 rounded-xl h-12">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">نظرة عامة</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">الجدول الزمني</TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">الوسائط</TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">التكاليف</TabsTrigger>
            <TabsTrigger value="owner" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">ربط المالك</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-white shadow-xl border-t-4 border-t-green-500 rounded-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Target size={28} /> ملخص المشروع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <CalendarDays className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">مدة المشروع</p>
                              <p className="font-semibold text-gray-800">{totalProjectDurationDays} يوم</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">المهام المكتملة</p>
                              <p className="font-semibold text-gray-800">
                                {(project.timelineTasks?.filter(t => t.status === 'مكتمل').length || 0).toLocaleString('en-US')} / {(project.timelineTasks?.length || 0).toLocaleString('en-US')}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <MessageSquare className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">التعليقات</p>
                              <p className="font-semibold text-gray-800">{(project.comments?.length || 0).toLocaleString('en-US')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full">
                              <DollarSign className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">التكاليف الإجمالية</p>
                              <p className="font-semibold text-gray-800">
                                {costReports.reduce((acc, r) => acc + r.totalCost_ILS, 0).toLocaleString('en-US')} ₪
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <ImageIcon className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">الوسائط</p>
                              <p className="font-semibold text-gray-800">{(project.photos?.length || 0).toLocaleString('en-US')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-full">
                              <TrendingUp className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">معدل التقدم</p>
                              <p className="font-semibold text-gray-800">{project.overallProgress.toLocaleString('en-US')}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-xl border-t-4 border-t-pink-500 rounded-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <MessageSquare size={28} /> التعليقات والاستفسارات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCommentSubmit} className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="newComment" className="font-semibold text-gray-700">أضف تعليقاً أو استفساراً:</Label>
                        <Textarea
                          id="newComment" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                          placeholder="اكتب تعليقك هنا..." rows={3} className="mt-1 focus:border-pink-500 focus:ring-pink-500"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold" disabled={isSubmittingComment || !newComment.trim()}>
                        {isSubmittingComment ? <LoaderIcon className="h-5 w-5 animate-spin" /> : <Send size={18} />}
                        إرسال التعليق
                      </Button>
                    </form>
                    <Separator className="my-6" />
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {project.comments && project.comments.length > 0 ? (
                        project.comments.slice().reverse().map((comment, index) => (
                          <div key={comment.id || `comment-${index}`} className={cn(
                            "p-4 rounded-xl border shadow-sm transition-all hover:shadow-md",
                            comment.user === "المالك" ? "bg-yellow-50 border-pink-200" : "bg-gray-50 border-gray-200"
                          )}>
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={comment.avatar} alt={comment.user} />
                                <AvatarFallback className={comment.user === "المالك" ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"}>
                                  {comment.user.substring(0, 1)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <p className="font-semibold text-gray-800">{comment.user}</p>
                                  <p className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <p className="text-gray-700 mt-2">{comment.text}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                {!isOwnerView && (
                  <>
                    <Card className="bg-white shadow-xl border-t-4 border-t-yellow-500 rounded-lg overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
                        <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <Percent size={28} /> تحديث تقدم الإنشاء
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleProgressSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="progressPercentage" className="font-semibold text-gray-700">نسبة التقدم الإجمالية (%):</Label>
                            <Input
                              id="progressPercentage" type="number" min="0" max="100"
                              value={progressUpdate.percentage}
                              onChange={(e) => setProgressUpdate({ ...progressUpdate, percentage: e.target.value })}
                              className="mt-1 focus:border-yellow-500 focus:ring-yellow-500" placeholder="مثال: 75"
                            />
                          </div>
                          <div>
                            <Label htmlFor="progressNotes" className="font-semibold text-gray-700">ملاحظات التقدم:</Label>
                            <Textarea
                              id="progressNotes" rows={3}
                              value={progressUpdate.notes}
                              onChange={(e) => setProgressUpdate({ ...progressUpdate, notes: e.target.value })}
                              className="mt-1 focus:border-yellow-500 focus:ring-yellow-500" placeholder="أضف ملاحظات حول التقدم المحرز..."
                            />
                          </div>
                          <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold">
                            <Send size={18} className="ms-2" /> إرسال تحديث التقدم
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Card className="bg-white shadow-xl border-t-4 border-t-teal-500 rounded-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 flex flex-row justify-between items-center">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Wallet size={28} /> تقارير التكاليف
                    </CardTitle>
                    <Button size="sm" onClick={() => setIsCostReportModalOpen(true)} className="bg-teal-600 hover:bg-green-200 hover:text-black transition-colors duration-300 font-semibold border-0">
                      <Plus size={16} className="ms-1" /> إضافة تقرير
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {costReports.length > 0 ? (
                      <div className="space-y-3">
                        {costReports.map((report, index) => (
                          <div key={report.id || `overview-cost-${index}`} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                            <div>
                              <p className="font-medium text-sm text-gray-700">{report.reportName}</p>
                              <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString('en-US')}</p>
                            </div>
                            <p className="font-semibold text-base text-green-700">{report.totalCost_ILS.toLocaleString('en-US')} شيكل</p>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center pt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="font-bold text-base text-gray-800">الإجمالي الكلي:</p>
                          <p className="font-bold text-xl text-green-700">
                            {costReports.reduce((acc, r) => acc + r.totalCost_ILS, 0).toLocaleString('ar')} شيكل
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm mb-3">لا توجد تقارير تكاليف محفوظة لهذا المشروع بعد.</p>
                        {!isOwnerView && (
                          <Button size="sm" onClick={() => setIsCostReportModalOpen(true)} className="bg-teal-600 hover:bg-green-200 hover:text-black transition-colors duration-300 font-semibold">
                            <Plus size={16} className="ms-1" /> إضافة أول تقرير
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-8">
            <Card className="bg-white shadow-xl border-t-4 border-t-green-500 rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 flex flex-row justify-between items-center">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <GanttChartSquare size={28} /> الجدول الزمني للمشروع
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors" 
                    onClick={handleDownloadTimelineReport}
                  >
                    <Download size={18} className="ms-1.5" /> تحميل تقرير PDF
                  </Button>
                  {!isOwnerView && (
                    <Button variant="outline" size="sm" className="border-blue-600 text-black hover:bg-blue-600 hover:text-white transition-colors" onClick={() => setIsAddTaskModalOpen(true)}>
                      <Plus size={18} className="ms-1.5" /> إضافة مهمة
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {project.timelineTasks && project.timelineTasks.length > 0 ? (
                  <>
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600 mb-1">تاريخ البدء</p>
                          <p className="font-bold text-blue-700">{formatDate(projectStartDate.toISOString())}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600 mb-1">تاريخ الانتهاء</p>
                          <p className="font-bold text-green-700">{formatDate(projectEndDate.toISOString())}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600 mb-1">المدة الإجمالية</p>
                          <p className="font-bold text-purple-700">{totalProjectDurationDays} يوم</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Chart */}
                    <div className="space-y-5 relative overflow-x-auto p-6 pb-8 min-h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-inner border">
                      {/* Timeline Tasks */}
                      {project.timelineTasks.map((task, index) => {
                        const { left, width } = getTaskPositionAndWidth(task);
                        const taskStartDate = new Date(task.startDate);
                        const taskEndDate = new Date(task.endDate);

                        return (
                          <div key={task.id || `chart-task-${index}`} className="relative h-16 flex items-center text-right pr-3 group" style={{ zIndex: index + 1 }}>
                            {/* Task Color Indicator */}
                            <div
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: task.color }}
                            />

                            {/* Task Bar */}
                            <div
                              className={cn(
                                "absolute h-10 rounded-lg shadow-md flex items-center justify-between px-3 text-white transition-all duration-300 ease-in-out hover:shadow-lg text-sm font-medium",
                                !isOwnerView && "cursor-pointer group-hover:ring-2 group-hover:ring-white group-hover:ring-opacity-50"
                              )}
                              style={{
                                left,
                                width,
                                right: 'auto',
                                backgroundColor: task.color,
                                boxShadow: `0 4px 8px ${task.color}40`
                              }}
                              title={`${task.name}\nمن: ${formatTimelineDate(task.startDate)}\nإلى: ${formatTimelineDate(task.endDate)}\nالحالة: ${task.status}${task.progress !== undefined ? `\nالتقدم: ${task.progress}%` : ''}`}
                              onClick={!isOwnerView ? () => openEditTaskModal(task) : undefined}
                            >
                              <span className="font-semibold truncate">{task.name}</span>
                              <div className="flex items-center gap-1">
                                {task.status === 'مكتمل' && <CheckCircle2 size={16} className="text-white shrink-0" />}
                                {task.status === 'قيد التنفيذ' && <div className="h-3 w-3 rounded-full bg-white animate-pulse shrink-0"></div>}
                                {task.status === 'مخطط له' && <div className="h-3 w-3 rounded-full bg-white/70 shrink-0"></div>}
                              </div>
                            </div>

                            {/* Task Info */}
                            <div className="absolute right-0 top-0 h-full flex flex-col justify-center pr-2">
                              <div className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded shadow-sm">
                                <div className="font-medium">{task.name}</div>
                                <div className="text-gray-500">
                                  {formatTimelineDate(task.startDate)} - {formatTimelineDate(task.endDate)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">قائمة المهام</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">المهمة</TableHead>
                            <TableHead className="text-right">اللون</TableHead>
                            <TableHead className="text-right">تاريخ البدء</TableHead>
                            <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                            <TableHead className="text-right">المدة</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.timelineTasks.map((task, index) => {
                            const startDate = new Date(task.startDate);
                            const endDate = new Date(task.endDate);
                            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                            return (
                              <TableRow key={task.id || `timeline-task-${index}`} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{task.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                                      style={{ backgroundColor: task.color }}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{formatDate(task.startDate)}</div>
                                    <div className="text-xs text-gray-500">
                                      {getArabicDayName(task.startDate)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{formatDate(task.endDate)}</div>
                                    <div className="text-xs text-gray-500">
                                      {getArabicDayName(task.endDate)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-blue-600">
                                    {duration} يوم
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={task.status === 'مكتمل' ? 'default' : task.status === 'قيد التنفيذ' ? 'secondary' : 'outline'}
                                    className={cn(
                                      task.status === 'مكتمل' && 'bg-green-100 text-green-800',
                                      task.status === 'قيد التنفيذ' && 'bg-yellow-100 text-yellow-800',
                                      task.status === 'مخطط له' && 'bg-blue-100 text-blue-800'
                                    )}
                                  >
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {!isOwnerView && (
                                    <div className="flex gap-2">
                                      <Button variant="outline" size="sm" onClick={() => openEditTaskModal(task)}>
                                        <FileEdit size={14} />
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleDeleteTask(task.id)} className="text-red-600 border-red-300 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all">
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <GanttChartSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-6">لا يوجد جدول زمني محدد لهذا المشروع بعد.</p>
                    {!isOwnerView && (
                      <Button onClick={() => setIsAddTaskModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus size={18} className="ms-2" /> إضافة أول مهمة
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-8">
            <Card className="bg-white shadow-xl border-t-4 border-t-purple-500 rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ImageIcon size={28} className="text-purple-600" /> وسائط المشروع
                    {project.photos && project.photos.length > 0 && (
                      <Badge variant="secondary" className="text-sm">
                        {project.photos.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {!isOwnerView && project.photos && project.photos.length > 0 && (
                      <div key="media-actions" className="flex gap-2">
                        <Button
                          onClick={toggleSelectAll}
                          variant="outline"
                          size="sm"
                          className="border-purple-300 text-black hover:bg-green-600 hover:text-white transition-colors"
                        >
                          {selectedMediaIds.length === project.photos.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                        </Button>
                        {selectedMediaIds.length > 0 && (
                          <Button
                            onClick={handleDeleteSelected}
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 size={16} className="ms-1" />
                            حذف المحدد ({selectedMediaIds.length})
                          </Button>
                        )}
                      </div>
                    )}
                    {!isOwnerView && (
                      <Button onClick={() => setIsUploadModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-md">
                        <UploadCloud size={18} className="ms-2" /> رفع وسائط جديدة
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {project.photos && project.photos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {project.photos.map((photo, index) => {
                      const mediaType = photo.fileType || 'image';

                      return (
                        <div key={photo.id || `photo-${index}`} className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border border-gray-200 flex flex-col">
                          {/* Selection Checkbox */}
                          {!isOwnerView && (
                            <div className="absolute top-2 left-2 z-20">
                              <input
                                type="checkbox"
                                checked={selectedMediaIds.includes(photo.id)}
                                onChange={() => toggleMediaSelection(photo.id)}
                                className="w-5 h-5 cursor-pointer accent-purple-600 rounded"
                              />
                            </div>
                          )}

                          {/* Delete Button */}
                          {!isOwnerView && (
                            <button
                              onClick={() => handleDeleteMedia(photo.id)}
                              className="absolute bottom-2 left-2 z-20 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          {mediaType === 'image' ? (
                            <div className="aspect-square relative bg-gray-200">
                              <Image
                                src={photo.src}
                                alt={photo.alt}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                data-ai-hint={photo.dataAiHint}
                              />
                              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                                <FileImage size={14} />
                                صورة
                              </div>
                            </div>
                          ) : mediaType === 'video' ? (
                            <div className="aspect-square relative bg-black">
                              <video
                                src={photo.src}
                                controls
                                className="w-full h-full object-contain"
                                preload="metadata"
                              >
                                متصفحك لا يدعم تشغيل الفيديو.
                              </video>
                              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                                <Video size={14} />
                                فيديو
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4">
                              <File size={48} className="text-gray-400 mb-3" />
                              <p className="text-sm text-gray-600 text-center font-medium">{photo.caption || photo.alt}</p>
                              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                                <File size={14} />
                                مستند
                              </div>
                            </div>
                          )}

                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-3 text-sm text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <p className="font-medium drop-shadow-lg">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                      <ImageIcon className="h-10 w-10 text-purple-500" />
                    </div>
                    <p className="text-gray-600 text-lg mb-6 font-medium">لا توجد وسائط مرفوعة لهذا المشروع حالياً</p>
                    {!isOwnerView && (
                      <Button onClick={() => setIsUploadModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 shadow-lg">
                        <UploadCloud size={18} className="ms-2" /> رفع أول وسائط
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-8">
            <Card className="bg-white shadow-xl border-t-4 border-t-teal-500 rounded-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Wallet size={28} /> تقارير التكاليف
                  {costReports.length > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {costReports.length}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  {!isOwnerView && costReports.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={toggleSelectAllCostReports}
                        variant="outline"
                        size="sm"
                        className="border-teal-300 text-black hover:bg-green-600 hover:text-white transition-colors"
                      >
                        {selectedCostReports.length === costReports.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                      </Button>
                      {selectedCostReports.length > 0 && (
                        <Button
                          onClick={handleDeleteSelectedCostReports}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 size={16} className="ms-1" />
                          حذف المحدد ({selectedCostReports.length})
                        </Button>
                      )}
                    </div>
                  )}
                  {!isOwnerView && (
                    <Button onClick={() => setIsCostReportModalOpen(true)} className="bg-teal-600 hover:bg-green-200 hover:text-black transition-colors duration-300 font-semibold">
                      <Plus size={18} className="ms-2" /> إضافة تقرير جديد
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {costReports.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-700 mb-1">عدد التقارير</p>
                        <p className="text-2xl font-bold text-blue-900">{costReports.length.toLocaleString('en-US')}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-sm text-green-700 mb-1">إجمالي التكاليف</p>
                        <p className="text-2xl font-bold text-green-900">
                          {costReports.reduce((acc, r) => acc + r.totalCost_ILS, 0).toLocaleString('en-US')} شيكل
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <p className="text-sm text-purple-700 mb-1">متوسط التكلفة</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {Math.round(costReports.reduce((acc, r) => acc + r.totalCost_ILS, 0) / costReports.length).toLocaleString('en-US')} شيكل
                        </p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          {!isOwnerView && <TableHead className="text-right w-12">تحديد</TableHead>}
                          <TableHead className="text-right">اسم التقرير</TableHead>
                          <TableHead className="text-right">التكلفة (شيكل)</TableHead>
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costReports.map((report, index) => (
                          <TableRow 
                            key={report.id || `cost-report-${index}`}
                            className={selectedCostReports.includes(report.id) ? "bg-blue-50" : ""}
                          >
                            {!isOwnerView && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedCostReports.includes(report.id)}
                                  onChange={() => toggleCostReportSelection(report.id)}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">{report.reportName}</TableCell>
                            <TableCell className="font-semibold text-green-700">{report.totalCost_ILS.toLocaleString('en-US')}</TableCell>
                            <TableCell>{new Date(report.createdAt).toLocaleDateString('en-US')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)}>
                                  <Download size={14} />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteCostReport(report.id)} className="text-red-600 border-red-300 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all">
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between items-center pt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-bold text-base text-gray-800">الإجمالي الكلي:</p>
                      <p className="font-bold text-xl text-green-700">
                        {costReports.reduce((acc, r) => acc + r.totalCost_ILS, 0).toLocaleString('en-US')} شيكل
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-sm mb-6">لا توجد تقارير تكاليف محفوظة لهذا المشروع بعد.</p>
                    {!isOwnerView && (
                      <Button onClick={() => setIsCostReportModalOpen(true)} className="bg-teal-600 hover:bg-green-200 hover:text-black transition-colors duration-300 font-semibold">
                        <Plus size={18} className="ms-2" /> إضافة أول تقرير
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="owner" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white shadow-xl border-t-4 border-t-indigo-500 rounded-lg overflow-hidden h-full">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                      <Users size={28} /> ربط المالك بالمشروع
                    </CardTitle>
                    <CardDescription className="text-gray-600">ابحث عن المالك من قاعدة البيانات أو أدخل بريده الإلكتروني مباشرة</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <form onSubmit={handleLinkOwnerSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ownerSearch" className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                            <Search className="h-4 w-4" />
                            البحث عن المالك:
                          </Label>
                          <div className="relative">
                            <Input
                              id="ownerSearch"
                              value={ownerSearchQuery}
                              onChange={(e) => {
                                setOwnerSearchQuery(e.target.value);
                                searchForOwners(e.target.value);
                              }}
                              className="focus:border-indigo-500 focus:ring-indigo-500 pr-12 text-lg py-3" 
                              placeholder="اكتب اسم المالك أو بريده الإلكتروني..."
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            {isSearchingOwners && (
                              <Loader2 className="absolute left-12 top-1/2 transform -translate-y-1/2 text-indigo-500 h-5 w-5 animate-spin" />
                            )}
                          </div>
                          
                          {ownerSearchResults.length > 0 && (
                            <div className="mt-3 border border-gray-200 rounded-lg shadow-md max-h-64 overflow-y-auto bg-white z-10 absolute w-full">
                              <div className="p-2 bg-gray-50 border-b border-gray-200 font-semibold text-sm text-gray-700">النتائج ({ownerSearchResults.length})</div>
                              {ownerSearchResults.map(owner => (
                                <div
                                  key={owner.id}
                                  onClick={() => handleOwnerSelect(owner)}
                                  className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between group transition-colors"
                                >
                                  <div>
                                    <div className="font-medium text-gray-800 group-hover:text-indigo-700">{owner.name}</div>
                                    <div className="text-sm text-gray-500">{owner.email}</div>
                                  </div>
                                  <div className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link2 className="h-4 w-4" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="ownerEmail" className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4" />
                            البريد الإلكتروني للمالك:
                          </Label>
                          <Input
                            id="ownerEmail" type="email"
                            value={linkedOwnerEmailInput}
                            onChange={(e) => setLinkedOwnerEmailInput(e.target.value)}
                            className="focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3" placeholder="owner@example.com"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
                      >
                        <Link2 size={20} className="ms-2" /> 
                        {project.linkedOwnerEmail ? "تحديث ربط المالك" : "ربط المالك"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                {project.linkedOwnerEmail && (
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        المالك الحالي
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                          <Avatar className="h-12 w-12 bg-blue-100 text-blue-600 border-2 border-blue-200">
                            {project.clientName ? project.clientName.charAt(0) : "U"}
                          </Avatar>
                          <div>
                            <p className="font-semibold text-blue-800">{project.clientName || "غير محدد"}</p>
                            <p className="text-sm text-blue-600">{project.linkedOwnerEmail}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100 p-2 rounded-lg">
                          <CalendarDays className="h-4 w-4" />
                          <span>تم الربط: {new Date().toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-lg overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      معلومات هامة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-sm text-amber-700">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>سيتم إرسال إشعار تلقائي للمالك عند ربطه بالمشروع</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>يمكن للمالك عرض جميع تفاصيل المشروع والتكاليف</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>يمكن تحديث معلومات المالك في أي وقت</p>
                      </div>
                      <div className="flex items-start gap-2 mt-4 p-3 bg-white/70 rounded-lg border border-amber-200">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-semibold text-amber-800">ملاحظة هامة</p>
                          <p>بعد ربط المالك، سيتمكنه من عرض جميع تفاصيل المشروع والتقارير المالية</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-lg overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      صلاحيات المالك
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-sm text-purple-700">
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg border border-purple-200">
                        <Eye className="h-4 w-4 text-purple-600" />
                        <p>عرض تفاصيل المشروع</p>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg border border-purple-200">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <p>الاطلاع على تقارير التكاليف</p>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg border border-purple-200">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <p>التواصل مع المهندس</p>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg border border-purple-200">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <p>تنزيل التقارير بصيغة PDF</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {project && (
        <ProjectChatDialog
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          project={project}
          currentUserRole="ENGINEER"
          onMessageSent={refreshProjectData}
        />
      )}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <UploadCloud size={24} /> رفع وسائط للمشروع
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsUploadModalOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                <X size={20} />
              </Button>
            </div>
            <p className="text-purple-100 mt-2 text-sm">أضف صوراً أو فيديوهات أو مستندات لتوثيق مراحل المشروع.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fileType" className="text-sm font-semibold text-gray-700">نوع الملف</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:ring-purple-500 rounded-xl">
                  <SelectValue placeholder="اختر نوع الوسائط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">📸 صورة</SelectItem>
                  <SelectItem value="video">🎥 فيديو</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectFileUpload" className="text-sm font-semibold text-gray-700">الملف</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                  id="projectFileUpload"
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <UploadCloud size={32} className="text-purple-400" />
                  <span className="font-medium text-purple-600">اضغط هنا لاختيار ملف</span>
                  <span className="text-xs">أو قم بسحب وإسقاط الملف هنا</span>
                </div>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100">
                  <File size={16} /> {selectedFile.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadCaption" className="text-sm font-semibold text-gray-700">ملاحظات / وصف (اختياري)</Label>
              <Textarea
                id="uploadCaption"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:ring-purple-500 rounded-xl resize-none"
                placeholder="أضف وصفاً أو ملاحظات حول هذا الملف..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleFileUpload}
              disabled={isUploadingFile || !selectedFile || isOwnerView}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
            >
              {isUploadingFile ? <LoaderIcon className="me-2 h-5 w-5 animate-spin" /> : <UploadCloud size={20} className="me-2" />}
              {isUploadingFile ? 'جاري الرفع...' : 'رفع الوسائط'}
            </Button>
            {isOwnerView && <p className="text-xs text-red-500 text-center bg-red-50 p-2 rounded-lg">تنبيه: المالك لا يملك صلاحية رفع الملفات.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <GanttChartSquare size={24} /> إضافة مهمة جديدة
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsAddTaskModalOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                <X size={20} />
              </Button>
            </div>
            <p className="text-orange-100 mt-2 text-sm">أضف مهمة جديدة للجدول الزمني للمشروع.</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="taskName" className="text-sm font-semibold text-gray-700">اسم المهمة</Label>
              <Input
                id="taskName"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                className="h-11 bg-gray-50 border-gray-200 focus:ring-orange-500 rounded-xl"
                placeholder="مثال: صب القواعد المسلحة"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">تاريخ البدء</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  className="h-11 bg-gray-50 border-gray-200 focus:ring-orange-500 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">تاريخ الانتهاء</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  className="h-11 bg-gray-50 border-gray-200 focus:ring-orange-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskStatus" className="text-sm font-semibold text-gray-700">حالة المهمة</Label>
              <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:ring-orange-500 rounded-xl">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                  <SelectItem value="مخطط له">📅 مخطط له</SelectItem>
                  <SelectItem value="قيد التنفيذ">🚧 قيد التنفيذ</SelectItem>
                  <SelectItem value="مكتمل">✅ مكتمل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">لون التمييز</Label>
              <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full shadow-sm transition-all hover:scale-110 ${newTask.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTask({ ...newTask, color })}
                  />
                ))}
                <input
                  type="color"
                  value={newTask.color}
                  onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
                  className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0"
                  title="اختر لون مخصص"
                />
              </div>
            </div>

            <Button onClick={handleAddTask} className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02]">
              <Plus size={20} className="me-2" /> إضافة المهمة للجدول
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileEdit size={24} /> تعديل المهمة
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsEditTaskModalOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                <X size={20} />
              </Button>
            </div>
            <p className="text-indigo-100 mt-2 text-sm">قم بتعديل تفاصيل المهمة في الجدول الزمني.</p>
          </div>

          {taskToEdit && (
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="editTaskName" className="text-sm font-semibold text-gray-700">اسم المهمة</Label>
                <Input
                  id="editTaskName"
                  value={taskToEdit.name}
                  onChange={(e) => setTaskToEdit({ ...taskToEdit, name: e.target.value })}
                  className="h-11 bg-gray-50 border-gray-200 focus:ring-indigo-500 rounded-xl"
                  placeholder="مثال: صب القواعد المسلحة"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartDate" className="text-sm font-semibold text-gray-700">تاريخ البدء</Label>
                  <Input
                    id="editStartDate"
                    type="date"
                    value={taskToEdit.startDate}
                    onChange={(e) => setTaskToEdit({ ...taskToEdit, startDate: e.target.value })}
                    className="h-11 bg-gray-50 border-gray-200 focus:ring-indigo-500 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndDate" className="text-sm font-semibold text-gray-700">تاريخ الانتهاء</Label>
                  <Input
                    id="editEndDate"
                    type="date"
                    value={taskToEdit.endDate}
                    onChange={(e) => setTaskToEdit({ ...taskToEdit, endDate: e.target.value })}
                    className="h-11 bg-gray-50 border-gray-200 focus:ring-indigo-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTaskStatus" className="text-sm font-semibold text-gray-700">حالة المهمة</Label>
                <Select value={taskToEdit.status} onValueChange={(value: "مخطط له" | "قيد التنفيذ" | "مكتمل") => setTaskToEdit({ ...taskToEdit, status: value })}>
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:ring-indigo-500 rounded-xl">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]" position="popper" sideOffset={5}>
                    <SelectItem value="مخطط له">📅 مخطط له</SelectItem>
                    <SelectItem value="قيد التنفيذ">🚧 قيد التنفيذ</SelectItem>
                    <SelectItem value="مكتمل">✅ مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">لون التمييز</Label>
                <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full shadow-sm transition-all hover:scale-110 ${taskToEdit.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setTaskToEdit({ ...taskToEdit, color })}
                    />
                  ))}
                  <input
                    type="color"
                    value={taskToEdit.color}
                    onChange={(e) => setTaskToEdit({ ...taskToEdit, color: e.target.value })}
                    className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0"
                    title="اختر لون مخصص"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleEditTask} className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">
                  <Save size={20} className="me-2" /> حفظ التغييرات
                </Button>
                <Button variant="outline" onClick={() => handleDeleteTask(taskToEdit.id)} className="h-12 px-4 text-red-600 border-red-300 hover:bg-red-600 hover:border-red-600 hover:text-white rounded-xl transition-all">
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cost Report Dialog */}
      <Dialog open={isCostReportModalOpen} onOpenChange={setIsCostReportModalOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl overflow-hidden p-0">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet size={24} /> إضافة تقرير تكاليف
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsCostReportModalOpen(false)} className="text-white hover:bg-white/20 rounded-full">
                <X size={20} />
              </Button>
            </div>
            <p className="text-teal-100 mt-2 text-sm">سجّل تقريراً مالياً جديداً للمشروع.</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reportName" className="text-sm font-semibold text-gray-700">اسم التقرير</Label>
              <Input
                id="reportName"
                value={newCostReport.reportName}
                onChange={(e) => setNewCostReport({ ...newCostReport, reportName: e.target.value })}
                className="h-11 bg-gray-50 border-gray-200 focus:ring-teal-500 rounded-xl"
                placeholder="مثال: تكاليف التشطيبات النهائية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost" className="text-sm font-semibold text-gray-700">إجمالي التكلفة (شيكل)</Label>
              <div className="relative">
                <Input
                  id="totalCost"
                  type="number"
                  min="0"
                  value={newCostReport.totalCost_ILS || ''}
                  onChange={(e) => setNewCostReport({ ...newCostReport, totalCost_ILS: Number(e.target.value) })}
                  className="h-11 bg-gray-50 border-gray-200 focus:ring-teal-500 rounded-xl ps-12 text-lg font-medium"
                  placeholder="0.00"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">₪</span>
              </div>
            </div>

            <Button onClick={handleAddCostReport} className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-teal-200 transition-all hover:scale-[1.02]">
              <Plus size={20} className="me-2" /> حفظ التقرير
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      <EditProjectDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProjectUpdated={refreshProjectData}
        project={project}
      />

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">حذف التقرير</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل أنت متأكد من أنك تريد حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذفه من سجلات المشروع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReport} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}