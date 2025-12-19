
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GanttChartSquare, Loader2, ArrowLeft, Info, Calendar, User, FileText as NotesIcon, Clock, CheckCircle, PlayCircle, AlertCircle, Download, BarChart3, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findProjectById, type Project, type TimelineTask } from '@/lib/db';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ProjectSpecificTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      setIsLoading(true);
      const userEmail = localStorage.getItem('userEmail');
      const fetchedProject = await findProjectById(projectId);

      if (!fetchedProject || fetchedProject.linkedOwnerEmail !== userEmail) {
        toast({
          title: "غير مصرح به",
          description: "ليس لديك صلاحية لعرض هذا المشروع.",
          variant: "destructive",
        });
        router.push('/owner/dashboard');
        return;
      }
      
      setProject(fetchedProject);
      setIsLoading(false);
    };

    fetchProject();
  }, [projectId, router, toast]);

  const calculateDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "غير محدد";
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} يومًا`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "غير محدد";
    return date.toLocaleDateString('ar-EG-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
  };

  const getTaskStatusColor = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    if (now < start) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (now > end) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTaskStatusIcon = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return <AlertCircle className="h-4 w-4" />;
    }
    
    if (now < start) {
      return <Clock className="h-4 w-4" />;
    } else if (now > end) {
      return <CheckCircle className="h-4 w-4" />;
    } else {
      return <PlayCircle className="h-4 w-4" />;
    }
  };

  const getTaskStatusText = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'غير محدد';
    }
    
    if (now < start) {
      return 'لم تبدأ';
    } else if (now > end) {
      return 'مكتملة';
    } else {
      return 'قيد التنفيذ';
    }
  };

  const handleDownloadTimelineReport = async () => {
    if (!project || !project.timelineTasks || project.timelineTasks.length === 0) {
      toast({
        title: "لا توجد مهام للتقرير",
        description: "لا توجد مهام في الجدول الزمني لإنشاء التقرير.",
        variant: "default"
      });
      return;
    }

    // الحصول على اسم المالك
    let ownerName = project.clientName || 'غير محدد';
    
    // إذا كان هناك بريد إلكتروني مربوط، جلب اسم المالك من قاعدة البيانات
    if (!ownerName || ownerName === 'غير محدد') {
      if (project.linkedOwnerEmail) {
        try {
          const userResponse = await fetch(`http://localhost:5000/api/users/by/email?email=${encodeURIComponent(project.linkedOwnerEmail)}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success && userData.user && userData.user.name) {
              ownerName = userData.user.name;
            }
          }
        } catch (error) {
          console.error('خطأ في جلب اسم المالك:', error);
        }
      }
    }

    // إذا لم يتم العثور على اسم، استخدم البريد الإلكتروني كاسم عرض
    if ((!ownerName || ownerName === 'غير محدد') && project.linkedOwnerEmail) {
      ownerName = project.linkedOwnerEmail;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const engineerName = project.engineer || 'غير معروف';
      const totalTasks = project.timelineTasks.length;
      
      // حساب المهام حسب الحالة بناءً على التواريخ
      const now = new Date();
      const completedTasks = project.timelineTasks.filter(task => {
        const end = new Date(task.endDate);
        return now > end;
      }).length;
      
      const inProgressTasks = project.timelineTasks.filter(task => {
        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        return now >= start && now <= end;
      }).length;
      
      const plannedTasks = project.timelineTasks.filter(task => {
        const start = new Date(task.startDate);
        return now < start;
      }).length;

      // حساب مدة المشروع الإجمالية
      const projectStart = new Date(Math.min(...project.timelineTasks.map(t => new Date(t.startDate).getTime())));
      const projectEnd = new Date(Math.max(...project.timelineTasks.map(t => new Date(t.endDate).getTime())));
      const totalProjectDurationDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const tableRows = project.timelineTasks.map(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // تحديد حالة المهمة بناءً على التواريخ
        let taskStatus = 'مخطط له';
        let statusColor = '#6b7280';
        
        if (now > taskEnd) {
          taskStatus = 'مكتمل';
          statusColor = '#10b981';
        } else if (now >= taskStart && now <= taskEnd) {
          taskStatus = 'قيد التنفيذ';
          statusColor = '#f59e0b';
        }
        
        return `
          <tr>
            <td>${task.name}</td>
            <td>${formatDate(task.startDate)}</td>
            <td>${formatDate(task.endDate)}</td>
            <td style="font-weight: 600; color: #3b82f6;">${duration} يوم</td>
            <td>
              <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid ${statusColor}40;">
                ${taskStatus}
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
        title: "تم تحميل التقرير",
        description: "تم إنشاء تقرير الجدول الزمني بنجاح وفتحه في نافذة جديدة للطباعة.",
      });
    } else {
      toast({
        title: "خطأ في الطباعة",
        description: "لم يتمكن المتصفح من فتح نافذة الطباعة.",
        variant: "destructive",
      });
    }
  };


  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-64">
         <Loader2 className="h-12 w-12 animate-spin text-app-gold" />
         <p className="ms-3 text-lg">جاري تحميل الجدول الزمني...</p>
       </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Alert variant="destructive">
          <GanttChartSquare className="h-5 w-5" />
          <AlertTitle>المشروع غير موجود</AlertTitle>
          <AlertDescription>لم يتم العثور على تفاصيل المشروع المطلوب.</AlertDescription>
        </Alert>
        <Button asChild className="mt-6 bg-app-gold hover:bg-yellow-600 text-primary-foreground">
          <Link href="/owner/projects">العودة إلى قائمة المشاريع</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 text-right space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            الجدول الزمني لمشروع: {project.name}
          </h1>
          <p className="text-gray-600">تتبع مراحل وأنشطة المشروع بشكل تفصيلي ومرئي</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleDownloadTimelineReport} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
            <Download className="ml-2 h-4 w-4" />
            تحميل تقرير PDF
          </Button>
          <Button asChild variant="outline" className="border-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200">
            <Link href={`/owner/projects/${projectId}`}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة لتفاصيل المشروع
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">إجمالي المهام</p>
                <p className="text-2xl font-bold text-blue-900">{project.timelineTasks?.length || 0}</p>
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
                  {project.timelineTasks?.filter(task => {
                    const now = new Date();
                    const start = new Date(task.startDate);
                    const end = new Date(task.endDate);
                    return now >= start && now <= end;
                  }).length || 0}
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
                  {project.timelineTasks?.filter(task => {
                    const now = new Date();
                    const end = new Date(task.endDate);
                    return now > end;
                  }).length || 0}
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
                <p className="text-sm font-medium text-purple-600">نسبة الإنجاز</p>
                <p className="text-2xl font-bold text-purple-900">{project.overallProgress || 0}%</p>
              </div>
              <div className="p-2 bg-purple-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Table */}
      <Card className="bg-white shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <GanttChartSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">جدول مراحل المشروع</CardTitle>
                <CardDescription className="text-gray-600">تفاصيل المراحل والأنشطة الرئيسية للمشروع</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {project.timelineTasks && project.timelineTasks.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <TableHead className="text-right font-bold text-gray-800">المرحلة</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">اسم المهمة</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">تاريخ البداية</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">تاريخ النهاية</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">المدة</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">الحالة</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">المسؤول</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.timelineTasks.map((task, index) => (
                    <TableRow key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-bold text-blue-600">{index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{task.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          {formatDate(task.startDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-red-500" />
                          {formatDate(task.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="h-4 w-4 text-purple-500" />
                          {calculateDuration(task.startDate, task.endDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getTaskStatusColor(task.startDate, task.endDate)} font-medium flex items-center gap-1 w-fit`}>
                          {getTaskStatusIcon(task.startDate, task.endDate)}
                          {getTaskStatusText(task.startDate, task.endDate)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="h-4 w-4 text-green-500" />
                          {project.engineer || 'غير محدد'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 space-y-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="p-3 bg-gray-200 rounded-full">
                  <Info className="h-8 w-8 text-gray-400" />
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <GanttChartSquare className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-700">لا يوجد جدول زمني محدد</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                لم يقم المهندس بإضافة مهام للجدول الزمني لهذا المشروع بعد. سيتم عرض المهام هنا عند إضافتها.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
