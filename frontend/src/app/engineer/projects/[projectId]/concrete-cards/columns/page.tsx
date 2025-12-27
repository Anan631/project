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
  Info,
  Hash,
  Equal,
  Layers,
  FileText
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
  const [nextId, setNextId] = useState(1);
  const [selectedShape, setSelectedShape] = useState<'square' | 'rectangle' | 'circular'>('square');
  const [error, setError] = useState<string | null>(null);
  const [existingReportDialog, setExistingReportDialog] = useState<{
    open: boolean;
    reportId: string | null;
  }>({
    open: false,
    reportId: null,
  });

  // تحديد نوع الأعمدة (متشابهة أم مختلفة)
  const [areSimilar, setAreSimilar] = useState<'similar' | 'different'>('similar');

  // بيانات الأعمدة المتشابهة
  const [similarColumns, setSimilarColumns] = useState({
    shape: 'square' as 'square' | 'rectangle' | 'circular',
    length: '',
    width: '',
    diameter: '',
    height: '',
    count: ''
  });

  // نتائج الأعمدة المتشابهة
  const [similarResults, setSimilarResults] = useState({
    volume: 0,
    count: 0
  });

  // بيانات الأعمدة المختلفة
  const [differentColumns, setDifferentColumns] = useState<Array<{
    id: number;
    shape: 'square' | 'rectangle' | 'circular';
    length?: string;
    width?: string;
    diameter?: string;
    height?: string;
    volume: number;
  }>>([]);

  // نتائج الأعمدة المختلفة
  const [differentResults, setDifferentResults] = useState({
    totalVolume: 0,
    totalCount: 0
  });

  // إجمالي جميع الأعمدة
  const [totalAllColumns, setTotalAllColumns] = useState({
    totalVolume: 0,
    totalCount: 0
  });

  // دالة حساب حجم العمود الواحد
  const calculateColumnVolume = (shape: string, length?: number, width?: number, diameter?: number, height?: number): number => {
    if (!height || height <= 0) return 0;

    switch (shape) {
      case 'square':
      case 'rectangle':
        if (!length || !width || length <= 0 || width <= 0) return 0;
        return length * width * height;
      case 'circular':
        if (!diameter || diameter <= 0) return 0;
        return (Math.PI * Math.pow(diameter, 2) / 4) * height;
      default:
        return 0;
    }
  };

  // حساب الأعمدة المتشابهة
  const calculateSimilarColumns = () => {
    const { shape, length, width, diameter, height, count } = similarColumns;

    // التحقق من الحقول المطلوبة
    if (!height || parseFloat(height) <= 0 || !count || parseInt(count) <= 0) {
      setError('يرجى إدخال ارتفاع العمود وعدد الأعمدة');
      return;
    }

    if ((shape === 'square' || shape === 'rectangle') && (!length || !width || parseFloat(length) <= 0 || parseFloat(width) <= 0)) {
      setError('يرجى إدخال الطول والعرض للعمود');
      return;
    }

    if (shape === 'circular' && (!diameter || parseFloat(diameter) <= 0)) {
      setError('يرجى إدخال قطر العمود');
      return;
    }

    // حساب حجم العمود الواحد
    const singleVolume = calculateColumnVolume(
      shape,
      parseFloat(length || '0'),
      parseFloat(width || '0'),
      parseFloat(diameter || '0'),
      parseFloat(height)
    );

    // حساب الحجم الإجمالي
    const totalSimilarVolume = singleVolume * parseInt(count);

    setSimilarResults({
      volume: totalSimilarVolume,
      count: parseInt(count)
    });

    // تحديث الإجمالي الكلي
    updateTotalAllColumns();

    toast({
      title: 'تم حساب الأعمدة المتشابهة',
      description: `تم حساب ${count} عمود ${getShapeName(shape)} - إجمالي الخرسانة: ${totalSimilarVolume.toFixed(3)} م³`,
    });
  };

  // إضافة عمود مختلف جديد
  const addDifferentColumn = () => {
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

    setDifferentColumns(prev => [...prev, newColumn]);
    setNextId(prev => prev + 1);
    setError(null);
  };

  // تحديث بيانات عمود مختلف
  const updateDifferentColumn = (id: number, field: string, value: string) => {
    setDifferentColumns(prev => prev.map(column => {
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

    // تحديث نتائج الأعمدة المختلفة بعد التحديث
    setTimeout(calculateDifferentColumns, 100);
  };

  // حذف عمود مختلف
  const removeDifferentColumn = (id: number) => {
    setDifferentColumns(prev => prev.filter(column => column.id !== id));
    setTimeout(calculateDifferentColumns, 100);
  };

  // حذف جميع الأعمدة المختلفة
  const removeAllDifferentColumns = () => {
    if (differentColumns.length === 0) {
      toast({
        title: 'لا توجد أعمدة',
        description: 'لا توجد أعمدة مختلفة للحذف',
        variant: 'destructive'
      });
      return;
    }

    setDifferentColumns([]);
    setDifferentResults({ totalVolume: 0, totalCount: 0 });
    updateTotalAllColumns();

    toast({
      title: 'تم الحذف',
      description: `تم حذف جميع الأعمدة المختلفة (${differentColumns.length} عمود)`,
    });
  };

  // حساب الأعمدة المختلفة
  const calculateDifferentColumns = () => {
    let totalVolume = 0;
    const totalCount = differentColumns.length;

    differentColumns.forEach(column => {
      totalVolume += column.volume;
    });

    setDifferentResults({
      totalVolume,
      totalCount
    });

    // تحديث الإجمالي الكلي
    updateTotalAllColumns();
  };

  // تحديث الإجمالي الكلي لجميع الأعمدة
  const updateTotalAllColumns = () => {
    const totalVolume = similarResults.volume + differentResults.totalVolume;
    const totalCount = similarResults.count + differentResults.totalCount;

    setTotalAllColumns({
      totalVolume,
      totalCount
    });
  };

  // استيراد أبعاد من صفحة شروش الأعمدة
  const importColumnDimensions = () => {
    try {
      const storedData = localStorage.getItem('columnDimensionsFromFootings');

      if (!storedData) {
        toast({
          title: 'لا توجد بيانات',
          description: 'لم يتم العثور على أبعاد محفوظة من صفحة شروش الأعمدة.',
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

      // تحويل الأبعاد من سم إلى متر
      if (shape === 'square' || shape === 'rectangle') {
        const length = columnData.length ? (columnData.length / 100).toFixed(2) : '';
        const width = columnData.width ? (columnData.width / 100).toFixed(2) : '';

        setSimilarColumns(prev => ({
          ...prev,
          shape: shape,
          length: length,
          width: width || length,
          height: '3.0'
        }));
      } else if (shape === 'circular') {
        const diameter = columnData.diameter ? (columnData.diameter / 100).toFixed(2) : '';
        setSimilarColumns(prev => ({
          ...prev,
          shape: shape,
          diameter: diameter,
          height: '3.0'
        }));
      }

      toast({
        title: 'تم الاستيراد بنجاح',
        description: `تم استيراد أبعاد العمود ${getShapeName(shape)} إلى الأعمدة المتشابهة`,
      });
    } catch (error) {
      console.error('Error importing column dimensions:', error);
      toast({
        title: 'خطأ في الاستيراد',
        description: 'حدث خطأ أثناء استيراد الأبعاد',
        variant: 'destructive'
      });
    }
  };

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

  // حذف التقرير السابق
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
    const totalVolume = totalAllColumns.totalVolume;
    const totalCount = totalAllColumns.totalCount;

    if (totalCount === 0) {
      toast({
        title: 'لا توجد أعمدة',
        description: 'يرجى إدخال بيانات الأعمدة أولاً',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (shouldDeleteExisting && existingReportDialog.reportId) {
        await deleteExistingReport(existingReportDialog.reportId);
      }

      const engineerId = localStorage.getItem('userId') || '';
      const engineerName = localStorage.getItem('userName') || 'المهندس';

      const projectRes = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      // تحضير بيانات الأعمدة
      const similarColumnsData = [];
      const differentColumnsData = [];

      // إضافة الأعمدة المتشابهة
      if (similarResults.count > 0) {
        similarColumnsData.push({
          type: 'similar',
          shape: similarColumns.shape,
          length: similarColumns.shape === 'circular' ? null : parseFloat(similarColumns.length || '0'),
          width: similarColumns.shape === 'circular' ? null : parseFloat(similarColumns.width || '0'),
          diameter: similarColumns.shape === 'circular' ? parseFloat(similarColumns.diameter || '0') : null,
          height: parseFloat(similarColumns.height || '0'),
          count: similarResults.count,
          volume: similarResults.volume
        });
      }

      // إضافة الأعمدة المختلفة
      differentColumns.forEach(col => {
        differentColumnsData.push({
          type: 'different',
          id: col.id,
          shape: col.shape,
          length: col.length ? parseFloat(col.length) : null,
          width: col.width ? parseFloat(col.width) : null,
          diameter: col.diameter ? parseFloat(col.diameter) : null,
          height: col.height ? parseFloat(col.height) : null,
          volume: col.volume
        });
      });

      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'columns',
        concreteData: {
          totalConcrete: totalVolume, // هذه القيمة التي ستخزن في التقرير
          totalColumns: totalCount,
          similarColumns: similarColumnsData,
          differentColumns: differentColumnsData,
          similarTotal: similarResults.volume,
          differentTotal: differentResults.totalVolume,
          grandTotal: totalVolume
        },
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

  // حساب الخرسانة
  const calculateConcrete = async () => {
    if (areSimilar === 'similar') {
      calculateSimilarColumns();
    } else {
      calculateDifferentColumns();
    }

    // التحقق من وجود تقرير سابق
    const existingReportId = await checkExistingReport();
    if (existingReportId) {
      setExistingReportDialog({
        open: true,
        reportId: existingReportId,
      });
    }
  };

  // إعادة تعيين
  const reset = () => {
    if (areSimilar === 'similar') {
      setSimilarColumns({
        shape: 'square',
        length: '',
        width: '',
        diameter: '',
        height: '',
        count: ''
      });
      setSimilarResults({ volume: 0, count: 0 });
    } else {
      setDifferentColumns([]);
      setDifferentResults({ totalVolume: 0, totalCount: 0 });
      setNextId(1);
      setSelectedShape('square');
    }

    setTotalAllColumns({ totalVolume: 0, totalCount: 0 });
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

  // إخفاء قانون الحساب بالكامل
  const renderCalculationFormula = () => {
    // إرجاع قيمة فارغة لإخفاء قانون الحساب
    return null;
  };

  // تحديث الإجمالي الكلي عند تغيير البيانات
  useEffect(() => {
    updateTotalAllColumns();
  }, [similarResults, differentResults]);

  // عرض الحقول المناسبة حسب شكل العمود في الأعمدة المتشابهة
  const renderSimilarColumnsFields = () => {
    const { shape } = similarColumns;

    if (shape === 'square' || shape === 'rectangle') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="similar-length"
              label="طول العمود (متر)"
              value={similarColumns.length}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, length: value }))}
              placeholder="مثال: 0.30"
              unit="متر"
              icon={Ruler}
            />
            <InputField
              id="similar-width"
              label="عرض العمود (متر)"
              value={similarColumns.width}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, width: value }))}
              placeholder="مثال: 0.30"
              unit="متر"
              icon={Ruler}
            />
            <InputField
              id="similar-height"
              label="ارتفاع العمود (متر)"
              value={similarColumns.height}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, height: value }))}
              placeholder="مثال: 3.0"
              unit="متر"
              icon={Ruler}
            />
            <InputField
              id="similar-count"
              label="عدد الأعمدة المتشابهة"
              value={similarColumns.count}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, count: value }))}
              placeholder="مثال: 4"
              unit="عمود"
              icon={Hash}
            />
          </div>
        </>
      );
    } else if (shape === 'circular') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="similar-diameter"
              label="قطر العمود (متر)"
              value={similarColumns.diameter}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, diameter: value }))}
              placeholder="مثال: 0.30"
              unit="متر"
              icon={Ruler}
            />
            <InputField
              id="similar-height"
              label="ارتفاع العمود (متر)"
              value={similarColumns.height}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, height: value }))}
              placeholder="مثال: 3.0"
              unit="متر"
              icon={Ruler}
            />
            <InputField
              id="similar-count"
              label="عدد الأعمدة المتشابهة"
              value={similarColumns.count}
              onChange={(value) => setSimilarColumns(prev => ({ ...prev, count: value }))}
              placeholder="مثال: 4"
              unit="عمود"
              icon={Hash}
            />
          </div>
        </>
      );
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
                      حساب كمية الخرسانة للأعمدة المتشابهة والمختلفة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <div className="space-y-6">
                  {/* تحديد نوع الأعمدة */}
                  <div className="space-y-4">
                    <Label className="text-lg font-bold text-slate-900">هل الأعمدة متشابهة؟</Label>
                    <Select
                      value={areSimilar}
                      onValueChange={(value: 'similar' | 'different') => {
                        setAreSimilar(value);
                        setError(null);
                        if (value === 'similar') {
                          setSimilarColumns({
                            shape: 'square',
                            length: '',
                            width: '',
                            diameter: '',
                            height: '',
                            count: ''
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                        <SelectValue placeholder="اختر نوع الأعمدة" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                        <SelectItem value="similar" className="text-lg py-3">
                          نعم - أعمدة متشابهة
                        </SelectItem>
                        <SelectItem value="different" className="text-lg py-3">
                          لا - أعمدة مختلفة
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* الأعمدة المتشابهة */}
                  {areSimilar === 'similar' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-lg font-bold text-slate-900">شكل العمود</Label>
                        <Select
                          value={similarColumns.shape}
                          onValueChange={(value: 'square' | 'rectangle' | 'circular') =>
                            setSimilarColumns(prev => ({ ...prev, shape: value, length: '', width: '', diameter: '' }))
                          }
                        >
                          <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                            <SelectValue placeholder="اختر شكل العمود" />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                            <SelectItem value="square" className="text-lg py-3">
                              <div className="flex items-center gap-3">
                                <Square className="w-5 h-5" />
                                <span>مربع</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="rectangle" className="text-lg py-3">
                              <div className="flex items-center gap-3">
                                <RectangleHorizontal className="w-5 h-5" />
                                <span>مستطيل</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="circular" className="text-lg py-3">
                              <div className="flex items-center gap-3">
                                <Circle className="w-5 h-5" />
                                <span>دائري</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {renderCalculationFormula()}

                      {/* استيراد الأبعاد */}
                      <div className="space-y-4">
                        <Label className="text-lg font-bold text-slate-900">إجراءات سريعة</Label>
                        <Button
                          onClick={importColumnDimensions}
                          variant="outline"
                          className="w-full h-14 border-2 border-blue-300 hover:border-blue-900 hover:bg-blue-900 hover:text-white font-bold transition-all duration-300"
                        >
                          <Download className="w-5 h-5 ml-2" />
                          استيراد أبعاد من شروش الأعمدة
                        </Button>
                      </div>

                      {/* حقول الإدخال حسب الشكل */}
                      <div className="space-y-4">
                        {renderSimilarColumnsFields()}
                      </div>
                    </div>
                  )}

                  {/* الأعمدة المختلفة */}
                  {areSimilar === 'different' && (
                    <>
                      <div className="space-y-4">
                        {renderCalculationFormula()}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="text-lg font-bold text-slate-900">اختيار شكل العمود للإضافة</Label>
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
                              onClick={addDifferentColumn}
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

                      {/* عرض الأعمدة المضافة للمختلفة */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-lg font-bold text-slate-900">
                            الأعمدة المضافة ({differentColumns.length})
                          </Label>
                          <div className="flex items-center gap-3">
                            {differentColumns.length > 0 && (
                              <>
                                <Badge variant="outline" className="font-bold">
                                  المجموع: {differentResults.totalVolume.toFixed(3)} م³
                                </Badge>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={removeAllDifferentColumns}
                                  className="h-10 px-4 font-bold gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  حذف الكل
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {differentColumns.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl">
                            <Columns className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <p className="text-lg text-slate-600">لم تتم إضافة أي أعمدة بعد</p>
                            <p className="text-slate-500">استخدم زر "إضافة عمود" للبدء</p>
                          </div>
                        ) : (
                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {differentColumns.map((column) => {
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
                                        onClick={() => removeDifferentColumn(column.id)}
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
                                            onChange={(value) => updateDifferentColumn(column.id, 'length', value)}
                                            unit="متر"
                                            icon={Ruler}
                                          />
                                          <InputField
                                            id={`width-${column.id}`}
                                            label="العرض"
                                            value={column.width || ''}
                                            onChange={(value) => updateDifferentColumn(column.id, 'width', value)}
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
                                            onChange={(value) => updateDifferentColumn(column.id, 'length', value)}
                                            unit="متر"
                                            icon={Ruler}
                                          />
                                          <InputField
                                            id={`width-${column.id}`}
                                            label="العرض"
                                            value={column.width || ''}
                                            onChange={(value) => updateDifferentColumn(column.id, 'width', value)}
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
                                          onChange={(value) => updateDifferentColumn(column.id, 'diameter', value)}
                                          unit="متر"
                                          icon={Ruler}
                                        />
                                      )}

                                      <InputField
                                        id={`height-${column.id}`}
                                        label="الارتفاع"
                                        value={column.height || ''}
                                        onChange={(value) => updateDifferentColumn(column.id, 'height', value)}
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 pt-4">
              <Button
                onClick={calculateConcrete}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  حساب الخرسانة
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>

              <Button
                onClick={() => saveToReports(false)}
                disabled={saving || totalAllColumns.totalCount === 0}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  {saving ? 'جاري الحفظ...' : 'حفظ جميع النتائج'}
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
                    <CardTitle className="text-xl font-bold">النتائج الشاملة</CardTitle>
                    <CardDescription className="text-white opacity-90">
                      إجمالي جميع الأعمدة المتشابهة والمختلفة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {/* خرسانة الأعمدة المتشابهة */}
                {similarResults.count > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-emerald-900 text-lg flex items-center gap-2">
                        <Layers className="w-5 h-5 text-emerald-600" />
                        خرسانة الأعمدة المتشابهة:
                      </h4>
                    </div>
                    <div className="group p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          {similarColumns.shape === 'square' && <Square className="w-5 h-5 text-emerald-600" />}
                          {similarColumns.shape === 'rectangle' && <RectangleHorizontal className="w-5 h-5 text-blue-600" />}
                          {similarColumns.shape === 'circular' && <Circle className="w-5 h-5 text-purple-600" />}
                          <span className="font-semibold text-emerald-900">
                            {getShapeName(similarColumns.shape)} ({similarResults.count} عمود)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-xl text-emerald-900">
                            {similarResults.volume.toFixed(3)} م³
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-emerald-700 mt-1">
                        حجم العمود الواحد: {(similarResults.volume / similarResults.count).toFixed(3)} م³
                      </div>
                    </div>
                  </div>
                )}

                {/* خرسانة الأعمدة المختلفة */}
                {differentResults.totalCount > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                        <Columns className="w-5 h-5 text-blue-600" />
                        خرسانة الأعمدة المختلفة:
                      </h4>
                    </div>
                    <div className="group p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-blue-900">
                          {differentResults.totalCount} عمود مختلف
                        </span>
                        <div className="text-right">
                          <div className="font-black text-xl text-blue-900">
                            {differentResults.totalVolume.toFixed(3)} م³
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        متوسط الحجم: {(differentResults.totalVolume / differentResults.totalCount).toFixed(3)} م³ لكل عمود
                      </div>
                    </div>
                  </div>
                )}

                {/* المجموع الكلي */}
                {totalAllColumns.totalCount > 0 ? (
                  <div className="space-y-6">
                    {/* Total Volume Result */}
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center group-hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-700">
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                          <Equal className="w-10 h-10 text-white drop-shadow-2xl" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-indigo-100 font-bold text-lg tracking-wide">
                            المجموع الكلي النهائي
                          </Label>
                          <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl leading-none">
                            {totalAllColumns.totalVolume.toLocaleString('en-US', {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3
                            })}
                          </div>
                          <div className="text-lg font-bold text-indigo-100 tracking-wider">متر مكعب</div>
                          <div className="text-indigo-200 text-base font-medium">
                            {totalAllColumns.totalCount} عمود
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* عملية الجمع */}
                    <Card className="border-0 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-0 pt-4 pb-4">
                        <div className="grid grid-cols-1 gap-3">
                          {/* معادلة الجمع */}
                          <div className="group p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl hover:shadow-lg transition-all duration-300">
                            <div className="text-center">
                              <div className="text-sm text-slate-600 mb-2">عملية الجمع:</div>
                              <div className="flex items-center justify-center gap-3">
                                <div className="text-center">
                                  <div className="font-bold text-emerald-700">المتشابهة</div>
                                  <div className="font-semibold text-emerald-900">{similarResults.volume.toFixed(3)} م³</div>
                                </div>
                                <Plus className="w-4 h-4 text-slate-500" />
                                <div className="text-center">
                                  <div className="font-bold text-blue-700">المختلفة</div>
                                  <div className="font-semibold text-blue-900">{differentResults.totalVolume.toFixed(3)} م³</div>
                                </div>
                                <Equal className="w-4 h-4 text-slate-500" />
                                <div className="text-center">
                                  <div className="font-bold text-indigo-700">المجموع</div>
                                  <div className="font-semibold text-indigo-900">{totalAllColumns.totalVolume.toFixed(3)} م³</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* القيمة التي ستخزن في التقرير */}
                          <div className="group p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl mt-4 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-3 mb-3">
                              <FileText className="w-5 h-5 text-indigo-600" />
                              <h4 className="font-bold text-indigo-900 text-lg">القيمة التي ستخزن في التقرير:</h4>
                            </div>
                            <div className="text-center">
                              <div className="font-black text-2xl bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                                {totalAllColumns.totalVolume.toFixed(3)} م³
                              </div>
                              <p className="text-sm text-indigo-600 mt-2">
                                هذه القيمة النهائية سيتم حفظها في تقرير الكميات
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-slate-200">
                      <Equal className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">
                      إجمالي جميع الأعمدة
                    </h3>
                    <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                      ستظهر هنا نتيجة الأعمدة المتشابهة والمختلفة ومجموعهما الكلي
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
              onClick={() => saveToReports(true)}
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