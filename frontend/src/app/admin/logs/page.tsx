"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { 
  ScrollText, 
  Search, 
  Download, 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  Filter,
  Database,
  ShieldAlert,
  Info,
  CheckCircle,
  AlertCircle,
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getLogs, type LogEntry, type LogLevel, deleteAllLogs } from '@/lib/db';
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

// تعريف النوع لخيارات التصدير
type ExportType = 'excel' | 'pdf';

export default function AdminLogsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [logs, setLogsState] = useState<LogEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'loading' | 'success'>('confirm');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    setAdminUserId(id);
  }, []);

  const fetchLogsFromDb = async () => {
    setIsFetching(true);
    try {
      const fetchedLogs = await getLogs();
      setLogsState(fetchedLogs);
      setTotalLogsCount(fetchedLogs.length);
    } catch (error) {
      toast({ 
        title: "❌ خطأ في التحميل", 
        description: "فشل تحميل سجلات النظام.", 
        variant: "destructive" 
      });
      console.error("Error fetching logs:", error);
      setLogsState([]);
      setTotalLogsCount(0);
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchLogsFromDb();
  }, [toast]);

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = searchTerm === '' ||
                              log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchTerm, logLevelFilter]);

  const getLogLevelStyles = (level: LogLevel) => {
    const styles = {
      'ERROR': { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        icon: AlertCircle,
        color: 'text-red-600'
      },
      'WARNING': { 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        icon: AlertTriangle,
        color: 'text-amber-600'
      },
      'SUCCESS': { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        icon: CheckCircle,
        color: 'text-emerald-600'
      },
      'INFO': { 
        bg: 'bg-sky-50', 
        text: 'text-sky-700', 
        border: 'border-sky-200',
        icon: Info,
        color: 'text-sky-600'
      }
    };

    return styles[level] || styles.INFO;
  };

  const getLevelIcon = (level: LogLevel) => {
    const { icon: IconComponent, color } = getLogLevelStyles(level);
    return <IconComponent className={`h-3 w-3 ${color}`} />;
  };

  // دالة التصدير إلى Excel (CSV)
  const exportToExcel = () => {
    if (filteredLogs.length === 0) {
      toast({ 
        title: "⚠️ لا توجد سجلات", 
        description: "يرجى تعديل الفلاتر إذا كنت تتوقع وجود سجلات.", 
        variant: "default" 
      });
      return;
    }
    
    try {
      // إنشاء محتوى CSV
      const headers = ['التاريخ والوقت', 'مستوى السجل', 'المستخدم', 'الرسالة'];
      const csvData = filteredLogs.map(log => [
        `"${format(new Date(log.timestamp), "yyyy/MM/dd HH:mm:ss", { locale: arSA })}"`,
        `"${log.level}"`,
        `"${log.user || 'النظام'}"`,
        `"${log.message.replace(/"/g, '""')}"` // الهروب من علامات الاقتباس
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      // إنشاء وتنزيل الملف
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `system_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast({ 
        title: "✅ تم التصدير", 
        description: "تم بدء تنزيل ملف CSV بنجاح." 
      });
    } catch (error) {
      toast({ 
        title: "❌ خطأ في التصدير", 
        description: "فشل تصدير السجلات إلى CSV.", 
        variant: "destructive" 
      });
    }
  };

  // دالة التصدير إلى PDF باستخدام الطباعة
  const exportToPDF = () => {
    if (filteredLogs.length === 0) {
      toast({ 
        title: "⚠️ لا توجد سجلات", 
        description: "يرجى تعديل الفلاتر إذا كنت تتوقع وجود سجلات.", 
        variant: "default" 
      });
      return;
    }
    
    try {
      // إنشاء محتوى HTML للطباعة
      const printContent = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تقرير سجلات النظام</title>
          <style>
            body { 
              font-family: 'Tahoma', Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333;
              margin-bottom: 10px;
            }
            .date { 
              font-size: 14px; 
              color: #666; 
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: right;
            }
            th {
              background-color: #2980b9;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            .badge {
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .badge-info { background-color: #d4edf7; color: #0c5460; }
            .badge-success { background-color: #d4f7e0; color: #155724; }
            .badge-warning { background-color: #fff3cd; color: #856404; }
            .badge-error { background-color: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">تقرير سجلات النظام</div>
            <div class="date">تاريخ التصدير: ${format(new Date(), "yyyy/MM/dd HH:mm:ss", { locale: arSA })}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>التاريخ والوقت</th>
                <th>مستوى السجل</th>
                <th>المستخدم</th>
                <th>الرسالة</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(log => {
                const levelClass = 
                  log.level === 'INFO' ? 'badge-info' :
                  log.level === 'SUCCESS' ? 'badge-success' :
                  log.level === 'WARNING' ? 'badge-warning' : 'badge-error';
                
                const levelText = 
                  log.level === 'INFO' ? 'معلومات' :
                  log.level === 'SUCCESS' ? 'نجاح' :
                  log.level === 'WARNING' ? 'تحذير' : 'خطأ';
                
                return `
                  <tr>
                    <td>${format(new Date(log.timestamp), "yyyy/MM/dd HH:mm:ss", { locale: arSA })}</td>
                    <td><span class="badge ${levelClass}">${levelText}</span></td>
                    <td>${log.user || 'النظام'}</td>
                    <td>${log.message}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            إجمالي السجلات: ${filteredLogs.length} | تم إنشاء التقرير تلقائياً
          </div>
        </body>
        </html>
      `;

      // فتح نافذة جديدة للطباعة
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // الانتظار قليلاً ثم فتح نافذة الطباعة
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
      
      toast({ 
        title: "✅ تم التجهيز للطباعة", 
        description: "تم فتح نافذة جديدة، استخدم Ctrl+P لحفظ كملف PDF." 
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({ 
        title: "❌ خطأ في التصدير", 
        description: "فشل تحضير السجلات للطباعة.", 
        variant: "destructive" 
      });
    }
  };

  // دالة معالجة التصدير بناءً على النوع المختار
  const handleExport = (type: ExportType) => {
    setExportDialogOpen(false);
    
    if (type === 'excel') {
      exportToExcel();
    } else if (type === 'pdf') {
      exportToPDF();
    }
  };

  const handleDeleteAllLogs = async () => {
    if (!adminUserId) {
      toast({ 
        title: "❌ خطأ في المصادقة", 
        description: "لم يتم التعرف على هوية المسؤول.", 
        variant: "destructive"
      });
      return;
    }
    
    setDeleteStep('loading');
    
    try {
      const result = await deleteAllLogs(adminUserId);

      if (result.success) {
        setDeleteStep('success');
        setTimeout(() => {
          setIsDialogOpen(false);
          fetchLogsFromDb();
        }, 1500);
        toast({ 
          title: "✅ تم الحذف", 
          description: result.message || "تم حذف جميع السجلات بنجاح."
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setDeleteStep('confirm');
      setIsDialogOpen(false);
      toast({ 
        title: "❌ خطأ في الحذف", 
        description: "فشل حذف السجلات.", 
        variant: "destructive" 
      });
    }
  };

  const handleOpenDialog = () => {
    setDeleteStep('confirm');
    setIsDialogOpen(true);
  };

  const getLogStats = () => {
    const stats = {
      total: logs.length,
      error: logs.filter(log => log.level === 'ERROR').length,
      warning: logs.filter(log => log.level === 'WARNING').length,
      success: logs.filter(log => log.level === 'SUCCESS').length,
      info: logs.filter(log => log.level === 'INFO').length,
    };
    return stats;
  };

  const stats = getLogStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                <ScrollText className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  سجلات النظام
                </h1>
                <p className="text-slate-600 text-lg mt-1">مراقبة وتتبع جميع أنشطة النظام والأحداث الهامة</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-sky-600">{totalLogsCount}</p>
                  <p className="text-sm text-slate-500">إجمالي السجلات</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Info className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">معلومات</span>
              </div>
              <p className="text-2xl font-bold text-sky-600">{stats.info}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">نجاح</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.success}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">تحذيرات</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.warning}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-slate-700">أخطاء</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.error}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Database className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">المجموع</span>
              </div>
              <p className="text-2xl font-bold text-slate-600">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Logs Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-emerald-400 rounded-full"></div>
                  لوحة مراقبة السجلات
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  عرض وتصفية وإدارة سجلات النظام بالكامل
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={fetchLogsFromDb}
                  variant="outline" 
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-all duration-300 rounded-xl"
                  disabled={isFetching}
                >
                  <RefreshCw className={`h-4 w-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                
                <Button
                  onClick={() => setExportDialogOpen(true)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
                  disabled={filteredLogs.length === 0 || isFetching}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير السجلات
                </Button>

                <Button
                  onClick={handleOpenDialog}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105"
                  disabled={logs.length === 0 || isFetching}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف الكل
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Search and Filter Section */}
            <div className="flex flex-col lg:flex-row gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="ابحث في رسائل السجل أو المستخدمين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                />
              </div>
              
              <Select value={logLevelFilter} onValueChange={setLogLevelFilter} dir="rtl">
                <SelectTrigger className="w-full lg:w-64 bg-white border-slate-300 focus:border-sky-400 text-right h-12 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Filter className="h-5 w-5 text-slate-400" />
                    <SelectValue placeholder="جميع المستويات" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-lg">📊 جميع المستويات</SelectItem>
                  <SelectItem value="INFO" className="text-lg">ℹ️ معلومات</SelectItem>
                  <SelectItem value="SUCCESS" className="text-lg">✅ نجاح</SelectItem>
                  <SelectItem value="WARNING" className="text-lg">⚠️ تحذير</SelectItem>
                  <SelectItem value="ERROR" className="text-lg">❌ خطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                  <Database className="absolute inset-0 m-auto h-8 w-8 text-sky-600 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-slate-700">جاري تحميل السجلات</p>
                  <p className="text-slate-500">يرجى الانتظار...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/50 hover:bg-transparent border-b-2 border-slate-100">
                        <TableHead className="w-[180px] text-right font-bold text-slate-700 text-lg py-4">
                          الوقت والتاريخ
                        </TableHead>
                        <TableHead className="w-[120px] text-right font-bold text-slate-700 text-lg py-4">
                          مستوى السجل
                        </TableHead>
                        <TableHead className="w-[150px] text-right font-bold text-slate-700 text-lg py-4">
                          المستخدم
                        </TableHead>
                        <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                          الرسالة
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                        const levelStyles = getLogLevelStyles(log.level);
                        return (
                          <TableRow 
                            key={log.id || `log-${log.timestamp}-${Math.random()}`}
                            className="group hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-emerald-50/30 transition-all duration-300 border-b border-slate-100/50"
                          >
                            <TableCell className="py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-800">
                                {format(new Date(log.timestamp), "yyyy/MM/dd", { locale: arSA })}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(new Date(log.timestamp), "HH:mm:ss", { locale: arSA })}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge 
                                className={`${levelStyles.bg} ${levelStyles.text} ${levelStyles.border} border flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium`}
                              >
                                {getLevelIcon(log.level)}
                                {log.level === 'INFO' ? 'معلومات' : 
                                 log.level === 'SUCCESS' ? 'نجاح' : 
                                 log.level === 'WARNING' ? 'تحذير' : 'خطأ'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <ShieldAlert className="h-4 w-4 text-slate-500" />
                                </div>
                                <span className="text-sm font-medium">{log.user || 'النظام'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="text-sm text-slate-800 leading-relaxed pr-2">
                                {log.message}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-16 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4 text-slate-500">
                              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                                <Database className="h-10 w-10 text-slate-300" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-xl font-semibold">لا توجد سجلات</p>
                                <p className="text-slate-400">
                                  {logs.length === 0 
                                    ? "لا توجد سجلات في النظام حالياً." 
                                    : "لم يتم العثور على سجلات تطابق معايير البحث أو التصفية."
                                  }
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                
                {/* Table Footer */}
                {!isFetching && filteredLogs.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50/50 border-t border-slate-200">
                    <p className="text-slate-600 text-sm">
                      عرض <span className="font-semibold text-sky-600">{filteredLogs.length}</span> من أصل{' '}
                      <span className="font-semibold text-sky-600">{totalLogsCount}</span> سجل
                    </p>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      تم تحميل جميع البيانات
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm">
            {deleteStep === 'confirm' && (
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
                            <p className="text-lg">هل أنت متأكد من رغبتك في حذف جميع سجلات النظام؟</p>
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-3">
                                <p className="font-semibold text-rose-700">سيتم حذف:</p>
                                <p className="text-2xl font-bold text-rose-600">{totalLogsCount} سجل</p>
                            </div>
                            <div className="flex items-center gap-3 justify-center text-rose-600 bg-rose-50 p-4 rounded-2xl">
                              <AlertTriangle className="h-6 w-6" />
                              <p className="font-medium">هذا الإجراء لا يمكن التراجع عنه</p>
                            </div>
                        </div>
                    </AlertDialogDescription>

                    <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-3 pt-6">
                        <Button 
                          onClick={handleDeleteAllLogs}
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
                        <p className="text-slate-500 text-lg">يتم الآن حذف جميع السجلات من النظام</p>
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
                        <p className="text-slate-500 text-lg">تم حذف جميع السجلات بنجاح من النظام</p>
                    </div>
                </div>
            )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Options Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm">
          <AlertDialogHeader className="text-center items-center space-y-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 border-8 border-sky-50/50">
              <Download className="h-12 w-12 text-sky-500" />
            </div>
            <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
              تصدير السجلات
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogDescription asChild>
            <div className="text-center text-base text-slate-600 space-y-6">
              <p className="text-lg">اختر صيغة التصدير المطلوبة</p>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleExport('excel')}
                  className="h-24 flex-col bg-white hover:bg-sky-50 border-2 border-sky-200 text-sky-700 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <TableIcon className="h-8 w-8 mb-2" />
                  <span className="font-bold">Excel (CSV)</span>
                  <span className="text-xs text-slate-500">(.csv)</span>
                </Button>
                
                <Button
                  onClick={() => handleExport('pdf')}
                  className="h-24 flex-col bg-white hover:bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl transition-all duration-300 hover:scale-105"
                >
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="font-bold">PDF (طباعة)</span>
                  <span className="text-xs text-slate-500">.pdf عبر الطباعة</span>
                </Button>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-sm text-slate-600">
                  سيتم تصدير <span className="font-bold text-sky-600">{filteredLogs.length}</span> سجل
                </p>
              </div>
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-3 pt-6">
            <AlertDialogCancel className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}