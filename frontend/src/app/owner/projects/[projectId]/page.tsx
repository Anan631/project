"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CalendarDays, Image as ImageIcon, FileText, MessageSquare, Mail, Edit, Trash2, Send, X,
  HardHat, Percent, BarChart3, GanttChartSquare, Loader2 as LoaderIcon, MapPin, AlertTriangle, Check, Wallet,
  ArrowRight, Building, Clock, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { findProjectById, updateProject as dbUpdateProject, getCostReportsForProject, type Project, type ProjectComment, type CostReport } from '@/lib/db';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function OwnerProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [costReports, setCostReports] = useState<CostReport[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isContactEngineerModalOpen, setIsContactEngineerModalOpen] = useState(false);
  const [engineerMessage, setEngineerMessage] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<ProjectComment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'loading' | 'success'>('confirm');

  useEffect(() => {
    setIsClient(true);
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  const refreshProjectData = async () => { 
    if (!userEmail && !isClient) return;
    
    const [currentProject, reports] = await Promise.all([
      findProjectById(projectId),
      getCostReportsForProject(projectId)
    ]);
    
    if (currentProject && currentProject.linkedOwnerEmail !== userEmail) {
      setProject(null);
      toast({ title: "غير مصرح به", description: "ليس لديك صلاحية لعرض هذا المشروع.", variant: "destructive" });
      router.push('/owner/projects');
      return;
    }
    setProject(currentProject ? {...currentProject} : null); 
    setCostReports(reports);
  };
  
  useEffect(() => {
    if(isClient && userEmail) {
      refreshProjectData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userEmail, isClient]); 

  const handleCommentSubmit = async (e: FormEvent) => { 
    e.preventDefault();
    if (!newComment.trim() || !project) return;
    setIsSubmittingComment(true);
    
    const commentToAdd: ProjectComment = {
      id: crypto.randomUUID(), 
      user: "المالك", 
      text: newComment, 
      date: new Date().toISOString(), 
      avatar: "https://placehold.co/40x40.png?text=OW",
      dataAiHintAvatar: "owner avatar"
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
  
  const handleSendEngineerMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!engineerMessage.trim() || !project || !project.engineer) {
      toast({ title: "خطأ", description: "يرجى كتابة رسالة.", variant: "destructive" });
      return;
    }
    console.log("Sending message to engineer:", project.engineer, "Message:", engineerMessage);
    toast({ title: "تم إرسال الرسالة", description: `تم إرسال رسالتك إلى المهندس ${project.engineer} (محاكاة).` });
    setEngineerMessage('');
    setIsContactEngineerModalOpen(false);
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !project) return;
    const updatedComments = project.comments.map(c =>
      c.id === editingComment.id ? { ...c, text: editingComment.text, date: new Date().toISOString() } : c
    );
    const result = await dbUpdateProject(project.id.toString(), { comments: updatedComments });
    if (result.success) {
      toast({ title: "تم تحديث التعليق" });
      setEditingComment(null);
      await refreshProjectData();
    } else {
      toast({ title: "فشل تحديث التعليق", variant: "destructive" });
    }
  };

  const handleOpenDeleteDialog = (comment: ProjectComment) => {
    setCommentToDelete(comment);
    setDeleteStep('confirm');
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!project || !commentToDelete) return;
    setDeleteStep('loading');

    const updatedComments = project.comments.filter(c => c.id !== commentToDelete.id);
    const result = await dbUpdateProject(project.id.toString(), { comments: updatedComments });
    
    if (result.success) {
        setDeleteStep('success');
        setTimeout(() => {
            setIsDeleteDialogOpen(false);
            refreshProjectData();
        }, 2000);
    } else {
      toast({ title: "فشل حذف التعليق", variant: "destructive" });
      setIsDeleteDialogOpen(false);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <Alert className="bg-white border-red-200 shadow-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <AlertTitle className="text-red-800 text-lg font-semibold">المشروع غير موجود</AlertTitle>
            <AlertDescription className="text-red-700 mt-2">
              لم يتم العثور على تفاصيل المشروع المطلوب أو لا تملك الصلاحية اللازمة.
            </AlertDescription>
          </Alert>
          <div className="flex gap-4 justify-center">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              <Link href="/owner/projects">العودة إلى المشاريع</Link>
            </Button>
            <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Link href="/owner/dashboard">لوحة التحكم</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{project.name}</h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl">{project.description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setIsContactEngineerModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Mail className="ml-2 h-4 w-4" />
              مراسلة المهندس
            </Button>
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link href="/owner/projects">
                <ArrowRight className="ml-2 h-4 w-4" />
                جميع المشاريع
              </Link>
            </Button>
          </div>
        </div>

        {/* Project Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-600">التقدم العام</p>
                  <p className="text-3xl font-bold text-blue-900">{project.overallProgress}%</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Percent className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <Progress value={project.overallProgress} className="mt-3 h-2 bg-blue-200" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-600">الحالة</p>
                  <p className="text-xl font-bold text-green-900">{project.status}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Clock className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <Badge className={`mt-3 ${getStatusColor(project.status)} font-medium`}>
                {project.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-600">المهندس المسؤول</p>
                  <p className="text-xl font-bold text-purple-900 line-clamp-1">{project.engineer || 'غير محدد'}</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <User className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-600">الميزانية</p>
                  <p className="text-xl font-bold text-amber-900">
                    {project.budget ? `${project.budget.toLocaleString()} ₪` : 'غير محدد'}
                  </p>
                </div>
                <div className="p-3 bg-amber-200 rounded-full">
                  <Wallet className="h-6 w-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  معرض المشروع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.photos && project.photos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.photos.map((photo) => (
                      <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <Image 
                          src={photo.src} 
                          alt={photo.alt} 
                          width={600} 
                          height={400} 
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {photo.caption && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-sm font-medium">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50/50">
                    <ImageIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد صور متاحة</h3>
                    <p className="text-gray-500">سيتم إضافة صور المشروع قريباً</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  الاستفسارات والتعليقات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="newComment" className="text-sm font-medium text-gray-700">
                      أضف تعليقاً أو استفساراً
                    </Label>
                    <Textarea
                      id="newComment" 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقك أو استفسارك هنا..." 
                      rows={4} 
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? (
                      <>
                        <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="ml-2 h-4 w-4" />
                        إرسال التعليق
                      </>
                    )}
                  </Button>
                </form>

                <Separator className="my-6" />

                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {project.comments && project.comments.length > 0 ? (
                    project.comments.slice().reverse().map((comment) => (
                      <div key={comment.id} className={cn(
                        "p-4 rounded-xl border transition-all duration-200",
                        comment.user === "المالك" 
                          ? "bg-blue-50/50 border-blue-200 shadow-sm" 
                          : "bg-gray-50/50 border-gray-200"
                      )}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {comment.avatar ? (
                              <Image 
                                src={comment.avatar} 
                                alt={comment.user} 
                                width={48} 
                                height={48} 
                                className="rounded-full border-2 border-white shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {comment.user.substring(0,1)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {comment.user}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.date).toLocaleString('ar-EG', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                              </div>
                              {comment.user === 'المالك' && (
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                                    onClick={() => setEditingComment({ id: comment.id, text: comment.text })}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-600 hover:bg-red-100"
                                    onClick={() => handleOpenDeleteDialog(comment)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {editingComment?.id === comment.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={editingComment.text}
                                  onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                  className="bg-white border-gray-300"
                                  rows={3}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingComment(null)}
                                    className="border-gray-300 text-gray-700"
                                  >
                                    إلغاء
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={handleUpdateComment}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    حفظ التغييرات
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 leading-relaxed break-words">
                                {comment.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500">لا توجد تعليقات حتى الآن</p>
                      <p className="text-sm text-gray-400 mt-1">كن أول من يعلق على هذا المشروع</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Project Details Card */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  تفاصيل المشروع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">الموقع</span>
                    <span className="text-sm font-medium text-gray-900">{project.location || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">تاريخ البدء</span>
                    <span className="text-sm font-medium text-gray-900">{project.startDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">تاريخ الانتهاء</span>
                    <span className="text-sm font-medium text-gray-900">{project.endDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">المهندس</span>
                    <span className="text-sm font-medium text-gray-900">{project.engineer || 'غير محدد'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Reports Card */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-3 text-gray-900">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="h-4 w-4 text-green-600" />
                  </div>
                  تقارير التكاليف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {costReports.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {costReports.map(report => (
                        <div key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-900">{report.reportName}</p>
                            <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <p className="font-semibold text-green-700">{report.totalCost_ILS.toLocaleString()} ₪</p>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                      <p className="font-bold text-gray-900">الإجمالي الكلي:</p>
                      <p className="font-bold text-lg text-green-700">
                        {costReports.reduce((acc, r) => acc + r.totalCost_ILS, 0).toLocaleString()} ₪
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Wallet className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">لا توجد تقارير تكاليف محفوظة</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Link href={`/owner/projects/${projectId}/timeline`}>
                    <GanttChartSquare className="ml-2 h-4 w-4" />
                    الجدول الزمني
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link href={`/owner/projects/${projectId}/reports`}>
                    <BarChart3 className="ml-2 h-4 w-4" />
                    تقارير الكميات
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Engineer Modal */}
      <Dialog open={isContactEngineerModalOpen} onOpenChange={setIsContactEngineerModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border-0 shadow-2xl">
          <DialogHeader className="text-right space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">مراسلة المهندس</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600">
              أرسل رسالة مباشرة إلى المهندس المسؤول عن المشروع
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSendEngineerMessage} className="mt-4 space-y-5">
            <div className="space-y-3">
              <Label htmlFor="engineerMessage" className="text-sm font-medium text-gray-700">
                نص الرسالة
              </Label>
              <Textarea
                id="engineerMessage"
                value={engineerMessage}
                onChange={(e) => setEngineerMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                rows={6}
                className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsContactEngineerModalOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                disabled={!engineerMessage.trim()}
              >
                <Send className="ml-2 h-4 w-4" />
                إرسال الرسالة
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-xl">
          {deleteStep === 'confirm' && commentToDelete && (
            <>
              <AlertDialogHeader className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl font-bold text-gray-900">
                  تأكيد حذف التعليق
                </AlertDialogTitle>
              </AlertDialogHeader>
              <div className="text-center text-gray-600 space-y-4">
                <p>هل أنت متأكد من رغبتك في حذف هذا التعليق؟</p>
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                  "{commentToDelete.text.substring(0, 50)}..."
                </div>
                <p className="text-xs text-gray-500">لا يمكن التراجع عن هذا الإجراء بعد التنفيذ</p>
              </div>
              <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4">
                <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 font-medium">
                  إلغاء
                </AlertDialogCancel>
                <Button 
                  onClick={handleDeleteComment}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  حذف التعليق
                </Button>
              </AlertDialogFooter>
            </>
          )}
          {deleteStep === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <LoaderIcon className="h-12 w-12 animate-spin text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">جاري حذف التعليق...</h3>
              <p className="text-gray-600">يتم الآن حذف التعليق من النظام</p>
            </div>
          )}
          {deleteStep === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-700">تم الحذف بنجاح</h3>
              <p className="text-gray-600">تم حذف التعليق بنجاح من النظام</p>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}