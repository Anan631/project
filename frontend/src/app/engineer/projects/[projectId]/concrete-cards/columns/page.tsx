"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  Box,
  Calculator,
  Grid,
  LayoutDashboard,
  Columns,
  Plus,
  Trash2,
  Ruler,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
  Circle,
  Square,
  RectangleHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

export default function ColumnsConcretePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  const [saving, setSaving] = useState(false);
  const [columns, setColumns] = useState<Array<{
    id: number;
    shape: 'square' | 'rectangle' | 'circular';
    length?: string;
    width?: string;
    diameter?: string;
    height?: string;
    volume: number;
  }>>([]);
  const [nextId, setNextId] = useState(1);
  const [selectedShape, setSelectedShape] = useState<'square' | 'rectangle' | 'circular'>('square');
  const [totalVolume, setTotalVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [existingReportDialog, setExistingReportDialog] = useState<{
    open: boolean;
    reportId: string | null;
  }>({
    open: false,
    reportId: null,
  });

  // دالة حساب حجم العمود الواحد
  const calculateColumnVolume = (shape: string, length?: number, width?: number, diameter?: number, height?: number): number => {
    if (!height || height <= 0) return 0;

    switch (shape) {
      case 'square':
        // المربع: نفس معادلة المستطيل (الطول × العرض × الارتفاع)
        // في المربع، يمكن أن يكون العرض = الطول أو مختلف
        if (!length || !width || length <= 0 || width <= 0) return 0;
        return length * width * height;
      case 'rectangle':
        // المستطيل: الطول × العرض × الارتفاع (نفس معادلة المربع)
        if (!length || !width || length <= 0 || width <= 0) return 0;
        return length * width * height;
      case 'circular':
        // الدائري: (π × القطر² ÷ 4) × الارتفاع
        if (!diameter || diameter <= 0) return 0;
        return (Math.PI * Math.pow(diameter, 2) / 4) * height;
      default:
        return 0;
    }
  };

  // إضافة عمود جديد
  const addColumn = () => {
    const newColumn: {
      id: number;
      shape: 'square' | 'rectangle' | 'circular';
      length?: string;
      width?: string;
      diameter?: string;
      height?: string;
      volume: number;
    } = {
      id: nextId,
      shape: selectedShape,
      length: undefined,
      width: undefined,
      diameter: undefined,
      height: undefined,
      volume: 0
    };

    // حساب الحجم الابتدائي (سيكون 0 لأن الحقول فارغة)
    const volume = calculateColumnVolume(
      selectedShape,
      parseFloat(newColumn.length || '0'),
      parseFloat(newColumn.width || '0'),
      parseFloat(newColumn.diameter || '0'),
      parseFloat(newColumn.height || '0')
    );

    newColumn.volume = volume;
    setColumns(prev => [...prev, newColumn]);
    setNextId(prev => prev + 1);
    setError(null);
  };

  // تحديث بيانات عمود
  const updateColumn = (id: number, field: string, value: string) => {
    setColumns(prev => prev.map(column => {
      if (column.id === id) {
        const updatedColumn = { ...column, [field]: value };

        // حساب الحجم المحدث
        const volume = calculateColumnVolume(
          updatedColumn.shape,
          parseFloat(updatedColumn.length || '0'),
          parseFloat(updatedColumn.width || '0'),
          parseFloat(updatedColumn.diameter || '0'),
          parseFloat(updatedColumn.height || '0')
        );

        return { ...updatedColumn, volume };
      }
      return column;
    }));
  };

  // حذف عمود
  const removeColumn = (id: number) => {
    setColumns(prev => prev.filter(column => column.id !== id));
  };

  // حذف جميع الأعمدة
  const removeAllColumns = () => {
    if (columns.length === 0) {
      toast({
        title: 'لا توجد أعمدة',
        description: 'لا توجد أعمدة للحذف',
        variant: 'destructive'
      });
      return;
    }

    setColumns([]);
    setTotalVolume(0);
    toast({
      title: 'تم الحذف',
      description: `تم حذف جميع الأعمدة (${columns.length} عمود)`,
    });
  };

  // استيراد أبعاد من صفحة شروش الأعمدة من Local Storage
  const importColumnDimensions = () => {
    try {
      // قراءة البيانات من Local Storage
      const storedData = localStorage.getItem('columnDimensionsFromFootings');

      if (!storedData) {
        toast({
          title: 'لا توجد بيانات',
          description: 'لم يتم العثور على أبعاد محفوظة من صفحة شروش الأعمدة. يرجى إجراء الحساب في صفحة شروش الأعمدة أولاً.',
          variant: 'destructive'
        });
        return;
      }

      const columnData = JSON.parse(storedData);

      // تحويل الشكل من العربية إلى الإنجليزية
      let shape: 'square' | 'rectangle' | 'circular' = 'square';
      if (columnData.shape === 'مربع') {
        shape = 'square';
      } else if (columnData.shape === 'مستطيل') {
        shape = 'rectangle';
      } else if (columnData.shape === 'دائري') {
        shape = 'circular';
      }

      // لا نغير selectedShape هنا لأن زر "إضافة عمود" يجب أن يعمل بشكل مستقل
      // زر الاستيراد يضيف عمود جديد بالأبعاد المستوردة فقط

      // تحويل الأبعاد من سم إلى متر (القسمة على 100)
      let length: string | undefined;
      let width: string | undefined;
      let diameter: string | undefined;

      // ملء الأبعاد حسب الشكل
      if (shape === 'square') {
        // للمربع: نستخدم length و width (نفس المستطيل)
        if (columnData.length) {
          length = (columnData.length / 100).toFixed(2); // تحويل من سم إلى متر
        }
        if (columnData.width) {
          width = (columnData.width / 100).toFixed(2); // تحويل من سم إلى متر
        } else if (columnData.length) {
          // إذا لم يكن width موجوداً، نستخدم length كقيمة للعرض أيضاً
          width = (columnData.length / 100).toFixed(2);
        }
      } else if (shape === 'rectangle') {
        // للمستطيل: نستخدم length و width
        if (columnData.length) {
          length = (columnData.length / 100).toFixed(2); // تحويل من سم إلى متر
        }
        if (columnData.width) {
          width = (columnData.width / 100).toFixed(2); // تحويل من سم إلى متر
        }
      } else if (shape === 'circular') {
        // للدائري: نستخدم diameter فقط
        if (columnData.diameter) {
          diameter = (columnData.diameter / 100).toFixed(2); // تحويل من سم إلى متر
        }
      }

      // التحقق من وجود الأبعاد المطلوبة
      if (shape === 'square' && (!length || !width)) {
        toast({
          title: 'خطأ في البيانات',
          description: 'لم يتم العثور على أبعاد صحيحة للعمود المربع',
          variant: 'destructive'
        });
        return;
      }
      if (shape === 'rectangle' && (!length || !width)) {
        toast({
          title: 'خطأ في البيانات',
          description: 'لم يتم العثور على أبعاد صحيحة للعمود المستطيل',
          variant: 'destructive'
        });
        return;
      }
      if (shape === 'circular' && !diameter) {
        toast({
          title: 'خطأ في البيانات',
          description: 'لم يتم العثور على قطر صحيح للعمود الدائري',
          variant: 'destructive'
        });
        return;
      }

      // إنشاء عمود جديد بالأبعاد المستوردة
      const newColumn = {
        id: nextId,
        shape: shape,
        length: length,
        width: width,
        diameter: diameter,
        height: '3.0', // القيمة الافتراضية للارتفاع
        volume: calculateColumnVolume(
          shape,
          length ? parseFloat(length) : undefined,
          width ? parseFloat(width) : undefined,
          diameter ? parseFloat(diameter) : undefined,
          3.0
        )
      };

      setColumns(prev => [...prev, newColumn]);
      setNextId(prev => prev + 1);

      toast({
        title: 'تم الاستيراد بنجاح',
        description: `تم استيراد أبعاد العمود ${getShapeName(shape)} (${columnData.displayText || columnData.shape}) من صفحة شروش الأعمدة`,
      });
    } catch (error) {
      console.error('Error importing column dimensions:', error);
      toast({
        title: 'خطأ في الاستيراد',
        description: 'حدث خطأ أثناء استيراد الأبعاد. تأكد من وجود بيانات صحيحة في Local Storage.',
        variant: 'destructive'
      });
    }
  };

  // حساب المجموع الكلي
  useEffect(() => {
    const total = columns.reduce((sum, column) => sum + column.volume, 0);
    setTotalVolume(total);
  }, [columns]);

  // التحقق من وجود تقرير سابق
  const checkExistingReport = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/project/${projectId}`);
      const data = await response.json();

      if (data.success && data.reports) {
        const existingReport = data.reports.find((r: any) =>
          r.calculationType === 'columns' && !r.deleted
        );

        if (existingReport) {
          return existingReport._id;
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking existing report:', error);
      return null;
    }
  };

  // حذف التقرير السابق (soft delete)
  const deleteExistingReport = async (reportId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/${reportId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting existing report:', error);
      return false;
    }
  };

  // حفظ التقرير
  const saveToReports = async (shouldDeleteExisting: boolean = false) => {
    if (columns.length === 0) {
      toast({
        title: 'لا توجد أعمدة',
        description: 'يرجى إضافة أعمدة أولاً',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // حذف التقرير السابق إذا طُلب ذلك
      if (shouldDeleteExisting && existingReportDialog.reportId) {
        await deleteExistingReport(existingReportDialog.reportId);
      }

      const engineerId = localStorage.getItem('userId') || '';
      const engineerName = localStorage.getItem('userName') || 'المهندس';

      const projectRes = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'columns',
        concreteData: {
          totalConcrete: totalVolume,
          columnsVolume: totalVolume,
          cleaningVolume: 0,
          foundationsVolume: 0,
          columnsData: columns.map(col => ({
            id: col.id,
            shape: col.shape,
            length: col.length ? parseFloat(col.length) : null,
            width: col.width ? parseFloat(col.width) : null,
            diameter: col.diameter ? parseFloat(col.diameter) : null,
            height: col.height ? parseFloat(col.height) : null,
            volume: col.volume
          }))
        },
        // إزالة بيانات الحديد بالكامل
        steelData: {
          totalSteelWeight: 0,
          foundationSteel: 0,
          columnSteel: 0,
        },
      };

      const response = await fetch('http://localhost:5000/api/quantity-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم ترحيل النتائج إلى صفحة تقارير الكميات'
        });
        router.push(`/engineer/quantity-reports/${projectId}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ التقرير',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
      setExistingReportDialog({ open: false, reportId: null });
    }
  };

  // حساب الخرسانة لجميع الأعمدة
  const calculateConcrete = async () => {
    if (columns.length === 0) {
      toast({
        title: 'لا توجد أعمدة',
        description: 'يرجى إضافة أعمدة أولاً',
        variant: 'destructive'
      });
      return;
    }

    // التحقق من صحة بيانات جميع الأعمدة
    const invalidColumns: number[] = [];

    columns.forEach((column) => {
      let isValid = false;

      if (column.shape === 'square' || column.shape === 'rectangle') {
        const length = parseFloat(column.length || '0');
        const width = parseFloat(column.width || '0');
        const height = parseFloat(column.height || '0');

        if (!length || length <= 0 || !width || width <= 0 || !height || height <= 0) {
          invalidColumns.push(column.id);
        }
      } else if (column.shape === 'circular') {
        const diameter = parseFloat(column.diameter || '0');
        const height = parseFloat(column.height || '0');

        if (!diameter || diameter <= 0 || !height || height <= 0) {
          invalidColumns.push(column.id);
        }
      }
    });

    if (invalidColumns.length > 0) {
      toast({
        title: 'بيانات غير مكتملة',
        description: `يرجى إكمال بيانات الأعمدة: ${invalidColumns.join(', ')}`,
        variant: 'destructive'
      });
      setError(`يرجى إكمال بيانات الأعمدة: ${invalidColumns.join(', ')}`);
      return;
    }

    // التحقق من وجود تقرير سابق
    const existingReportId = await checkExistingReport();
    if (existingReportId) {
      setExistingReportDialog({
        open: true,
        reportId: existingReportId,
      });
      return;
    }

    // إعادة حساب جميع الأعمدة
    setColumns(prev => prev.map(column => {
      const volume = calculateColumnVolume(
        column.shape,
        parseFloat(column.length || '0'),
        parseFloat(column.width || '0'),
        parseFloat(column.diameter || '0'),
        parseFloat(column.height || '0')
      );
      return { ...column, volume };
    }));

    setError(null);
    toast({
      title: 'تم الحساب بنجاح',
      description: `تم حساب كمية الخرسانة لجميع الأعمدة (${columns.length} عمود)`,
    });
  };

  // إعادة تعيين
  const reset = () => {
    setColumns([]);
    setNextId(1);
    setSelectedShape('square');
    setTotalVolume(0);
    setError(null);
  };

  // عرض أيقونة الشكل
  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'square': return Square;
      case 'rectangle': return RectangleHorizontal;
      case 'circular': return Circle;
      default: return Square;
    }
  };

  // اسم الشكل بالعربية
  const getShapeName = (shape: string) => {
    switch (shape) {
      case 'square': return 'مربع';
      case 'rectangle': return 'مستطيل';
      case 'circular': return 'دائري';
      default: return 'مربع';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50" dir="rtl">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                <Button variant="ghost" size="sm" className="border-2 border-pink-200/50 bg-white/80 backdrop-blur-sm hover:border-pink-400 hover:bg-pink-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-pink-800 font-extrabold hover:text-pink-900 hover:drop-shadow-[0_0_10px_rgba(219,39,119,0.8)] group">
                  <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                  العودة إلى حاسبة الباطون
                </Button>
              </Link>

            </div>

          </div>

          <div className="relative group">
            <div className="flex items-start lg:items-center gap-6 p-2">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                  <Columns className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                  <Box className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-800 bg-clip-text text-transparent leading-tight mb-4">
                  حساب كمية الخرسانة في الأعمدة
                </h1>

              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Input Section */}
          <div className="xl:col-span-8 space-y-6 lg:space-y-8">
            {/* Error Display */}
            {error && (
              <div className="p-4 lg:p-6 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-red-200 rounded-2xl shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-900 mb-2">{error}</p>
                    <p className="text-red-600">تحقق من جميع الحقول وأعد المحاولة</p>
                  </div>
                </div>
              </div>
            )}

            {/* كرت الأعمدة */}
            <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                    <Columns className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">كرت الأعمدة</CardTitle>
                    <CardDescription className="text-emerald-100 text-base">
                      إضافة وحساب الأعمدة بأشكال مختلفة (مربع، مستطيل، دائري)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <div className="space-y-6">
                  {/* اختيار شكل العمود وإضافة عمود */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-slate-900">اختيار شكل العمود</Label>
                      <Select
                        value={selectedShape}
                        onValueChange={(value: 'square' | 'rectangle' | 'circular') => setSelectedShape(value)}
                      >
                        <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                          <SelectValue placeholder="اختر شكل العمود" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                          <SelectItem value="square" className="text-lg py-3">
                            <div className="flex items-center gap-3">
                              <Square className="w-5 h-5" />
                              <span>عمود مربع</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="rectangle" className="text-lg py-3">
                            <div className="flex items-center gap-3">
                              <RectangleHorizontal className="w-5 h-5" />
                              <span>عمود مستطيل</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="circular" className="text-lg py-3">
                            <div className="flex items-center gap-3">
                              <Circle className="w-5 h-5" />
                              <span>عمود دائري</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-slate-900">إجراءات سريعة</Label>
                      <div className="flex gap-4">
                        <Button
                          onClick={addColumn}
                          className="flex-1 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
                        >
                          <Plus className="w-5 h-5 ml-2" />
                          إضافة عمود
                        </Button>
                        <Button
                          onClick={importColumnDimensions}
                          variant="outline"
                          className="h-14 border-2 border-blue-300 hover:border-blue-900 hover:bg-blue-900 hover:text-white font-bold transition-all duration-300"
                        >
                          <Download className="w-5 h-5 ml-2" />
                          استيراد أبعاد
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* عرض الأعمدة المضافة */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-bold text-slate-900">
                        الأعمدة المضافة ({columns.length})
                      </Label>
                      <div className="flex items-center gap-3">
                        {columns.length > 0 && (
                          <>
                            <Badge variant="outline" className="font-bold">
                              المجموع: {totalVolume.toFixed(3)} م³
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={removeAllColumns}
                              className="h-10 px-4 font-bold gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف الكل
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {columns.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl">
                        <Columns className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <p className="text-lg text-slate-600">لم تتم إضافة أي أعمدة بعد</p>
                        <p className="text-slate-500">استخدم زر "إضافة عمود" للبدء</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {columns.map((column) => {
                          const ShapeIcon = getShapeIcon(column.shape);
                          return (
                            <Card key={column.id} className="border-2 border-slate-200 hover:border-emerald-300 transition-colors">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl">
                                      <ShapeIcon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-slate-900">
                                        عمود #{column.id} - {getShapeName(column.shape)}
                                      </h4>
                                      <p className="text-sm text-slate-500">
                                        الحجم: {column.volume.toFixed(3)} م³
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeColumn(column.id)}
                                    className="shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {column.shape === 'square' && (
                                    <>
                                      <InputField
                                        id={`length-${column.id}`}
                                        label="الطول"
                                        value={column.length || ''}
                                        onChange={(value) => updateColumn(column.id, 'length', value)}

                                        unit="متر"
                                        icon={Ruler}
                                      />
                                      <InputField
                                        id={`width-${column.id}`}
                                        label="العرض"
                                        value={column.width || ''}
                                        onChange={(value) => updateColumn(column.id, 'width', value)}

                                        unit="متر"
                                        icon={Ruler}
                                      />
                                    </>
                                  )}

                                  {column.shape === 'rectangle' && (
                                    <>
                                      <InputField
                                        id={`length-${column.id}`}
                                        label="الطول"
                                        value={column.length || ''}
                                        onChange={(value) => updateColumn(column.id, 'length', value)}

                                        unit="متر"
                                        icon={Ruler}
                                      />
                                      <InputField
                                        id={`width-${column.id}`}
                                        label="العرض"
                                        value={column.width || ''}
                                        onChange={(value) => updateColumn(column.id, 'width', value)}

                                        unit="متر"
                                        icon={Ruler}
                                      />
                                    </>
                                  )}

                                  {column.shape === 'circular' && (
                                    <InputField
                                      id={`diameter-${column.id}`}
                                      label="القطر"
                                      value={column.diameter || ''}
                                      onChange={(value) => updateColumn(column.id, 'diameter', value)}

                                      unit="متر"
                                      icon={Ruler}
                                    />
                                  )}

                                  <InputField
                                    id={`height-${column.id}`}
                                    label="الارتفاع"
                                    value={column.height || ''}
                                    onChange={(value) => updateColumn(column.id, 'height', value)}

                                    unit="متر"
                                    icon={Ruler}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 pt-4">
              <Button
                onClick={calculateConcrete}
                disabled={columns.length === 0}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  حساب الخرسانة
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>

              <Button
                onClick={() => saveToReports(false)}
                disabled={columns.length === 0 || saving}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  {saving ? 'جاري الحفظ...' : 'حفظ وتحميل إلى التقارير'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>

              <Button
                onClick={reset}
                variant="outline"
                className="h-14 px-6 text-base font-black border-2 border-slate-300 hover:border-red-400 hover:bg-red-50 hover:text-red-800 shadow-xl hover:shadow-red-200 transition-all duration-500 rounded-2xl flex items-center gap-4"
              >
                <Trash2 className="w-5 h-5" />
                إعادة تعيين الكل
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="xl:col-span-4">
            <Card className="border-0 shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/60 sticky top-8 h-fit backdrop-blur-sm bg-white/90 transition-all duration-500 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white py-8 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">النتائج الهندسية</CardTitle>

                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {columns.length > 0 ? (
                  <div className="space-y-6">
                    {/* Total Volume Result */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center group-hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-700">
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                          <Calculator className="w-10 h-10 text-white drop-shadow-2xl" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-indigo-100 font-bold text-lg tracking-wide">
                            إجمالي خرسانة الأعمدة
                          </Label>
                          <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl leading-none">
                            {totalVolume.toLocaleString('en-US', {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3
                            })}
                          </div>
                          <div className="text-lg font-bold text-indigo-100 tracking-wider">متر مكعب</div>
                          <div className="text-indigo-200 text-base font-medium">{columns.length} عمود</div>
                        </div>
                      </div>
                    </div>

                    {/* Results Summary */}
                    <Card className="border-0 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-0 pt-4 pb-4">
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            {
                              label: 'عدد الأعمدة',
                              value: `${columns.length} عمود`,
                              color: 'from-emerald-400 to-teal-400',
                              highlight: true
                            },
                            {
                              label: 'المجموع الكلي للخرسانة',
                              value: `${totalVolume.toFixed(3)} م³`,
                              color: 'from-indigo-500 to-purple-500',
                              highlight: true
                            },
                            {
                              label: 'متوسط الحجم للعمود',
                              value: `${(totalVolume / columns.length).toFixed(3)} م³`,
                              color: 'from-blue-500 to-cyan-500'
                            },
                          ].map(({ label, value, color, highlight }, index) => (
                            <div
                              key={index}
                              className={`group p-6 bg-gradient-to-r ${highlight
                                ? 'from-indigo-50 to-purple-50 border-2 border-indigo-200'
                                : 'from-white/60 hover:from-white'
                                } rounded-2xl ${highlight
                                  ? 'border-indigo-200'
                                  : 'border-slate-200 hover:border-indigo-300'
                                } hover:shadow-lg transition-all duration-300 flex items-center justify-between`}
                            >
                              <span className={`font-bold ${highlight
                                ? 'text-indigo-900 text-lg'
                                : 'text-slate-800 text-base'
                                }`}>
                                {label}:
                              </span>
                              <span className={`font-black ${highlight ? 'text-xl' : 'text-lg'
                                } bg-gradient-to-r ${color} bg-clip-text text-transparent px-4 py-1 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-slate-200">
                      <Columns className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">إضافة الأعمدة</h3>
                    <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                      اختر شكل العمود وأضفه لبدء الحسابات
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog للتحذير من إعادة الحساب */}
      <AlertDialog open={existingReportDialog.open} onOpenChange={(open) =>
        setExistingReportDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent className="max-w-lg" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-right text-xl font-bold">
                تحذير: الحسابات تمت مسبقًا
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-right text-base leading-relaxed">
                <p>تم إجراء حسابات الأعمدة مسبقًا والتقرير جاهز.</p>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 font-medium">
                    في حال اختيار إعادة الحسابات:
                  </p>
                  <ul className="list-disc list-inside text-amber-700 text-sm mt-2 space-y-1">
                    <li>سيتم تغيير حالة التقرير السابق إلى محذوف</li>
                    <li>سيتم تنفيذ الحسابات من جديد</li>
                    <li>سيتم حفظ التقرير الجديد وربطه بنفس المشروع والمالك</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 mt-6">
            <AlertDialogCancel className="flex-1 h-12 text-base font-medium">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // إعادة الحساب ثم الحفظ مع حذف التقرير السابق
                setColumns(prev => prev.map(column => {
                  const volume = calculateColumnVolume(
                    column.shape,
                    parseFloat(column.length || '0'),
                    parseFloat(column.width || '0'),
                    parseFloat(column.diameter || '0'),
                    parseFloat(column.height || '0')
                  );
                  return { ...column, volume };
                }));
                setError(null);
                saveToReports(true);
              }}
              className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-medium"
            >
              إعادة الحسابات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  placeholder = "",
  step = "any",
  unit,
  icon: Icon,
  type = "number",
  containerClassName = ""
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
  unit?: string;
  icon?: any;
  type?: string;
  containerClassName?: string;
}) {
  return (
    <div className={`group ${containerClassName}`}>
      <Label htmlFor={id} className="text-base font-bold text-slate-900 mb-2 block">
        {label}
      </Label>
      <div className="relative">
        {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
        <Input
          id={id}
          type={type}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 text-lg font-bold text-right pr-12 bg-white/80 hover:bg-white border-2 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 shadow-lg rounded-2xl"
        />
        {unit && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm bg-slate-100 px-3 py-1 rounded-xl">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}