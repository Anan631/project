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
    height: string;
    volume: number;
  }>>([]);
  const [nextId, setNextId] = useState(1);
  const [selectedShape, setSelectedShape] = useState<'square' | 'rectangle' | 'circular'>('square');
  const [totalVolume, setTotalVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // دالة حساب حجم العمود الواحد
  const calculateColumnVolume = (shape: string, length?: number, width?: number, diameter?: number, height?: number): number => {
    if (!height || height <= 0) return 0;

    switch (shape) {
      case 'square':
        if (!length || length <= 0) return 0;
        return length * length * height;
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

  // إضافة عمود جديد
  const addColumn = () => {
    const newColumn = {
      id: nextId,
      shape: selectedShape,
      length: selectedShape === 'square' ? '0.4' : selectedShape === 'rectangle' ? '0.4' : undefined,
      width: selectedShape === 'rectangle' ? '0.3' : undefined,
      diameter: selectedShape === 'circular' ? '0.4' : undefined,
      height: '3.0',
      volume: 0
    };

    // حساب الحجم الابتدائي
    const volume = calculateColumnVolume(
      selectedShape,
      parseFloat(newColumn.length || '0'),
      parseFloat(newColumn.width || '0'),
      parseFloat(newColumn.diameter || '0'),
      parseFloat(newColumn.height)
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
          parseFloat(updatedColumn.height)
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

  // استيراد أبعاد من صفحة شروش الأعمدة (محاكاة)
  const importColumnDimensions = () => {
    // في الواقع، هنا سنجلب البيانات من API
    // الآن سنضيف أمثلة افتراضية
    const importedColumns = [
      {
        id: nextId,
        shape: 'square' as const,
        length: '0.5',
        width: undefined,
        diameter: undefined,
        height: '3.2',
        volume: calculateColumnVolume('square', 0.5, undefined, undefined, 3.2)
      },
      {
        id: nextId + 1,
        shape: 'circular' as const,
        length: undefined,
        width: undefined,
        diameter: '0.6',
        height: '3.5',
        volume: calculateColumnVolume('circular', undefined, undefined, 0.6, 3.5)
      },
      {
        id: nextId + 2,
        shape: 'rectangle' as const,
        length: '0.4',
        width: '0.3',
        diameter: undefined,
        height: '3.0',
        volume: calculateColumnVolume('rectangle', 0.4, 0.3, undefined, 3.0)
      }
    ];

    setColumns(prev => [...prev, ...importedColumns]);
    setNextId(prev => prev + 3);
    
    toast({
      title: 'تم الاستيراد',
      description: 'تم استيراد 3 أعمدة مثال من شروش الأعمدة',
    });
  };

  // حساب المجموع الكلي
  useEffect(() => {
    const total = columns.reduce((sum, column) => sum + column.volume, 0);
    setTotalVolume(total);
  }, [columns]);

  // حساب وزن الحديد (نفس معدل الكود السابق)
  const calculateSteelWeight = () => {
    return totalVolume * 80; // 80 كجم/م³
  };

  // حفظ التقرير
  const saveToReports = async () => {
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
            height: parseFloat(col.height),
            volume: col.volume
          }))
        },
        steelData: {
          totalSteelWeight: calculateSteelWeight(),
          foundationSteel: 0,
          columnSteel: calculateSteelWeight(),
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
    }
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm hover:border-emerald-300 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-emerald-800 hover:text-emerald-900"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  العودة للمشاريع
                </Button>
              </Link>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0 px-6 py-2.5 font-bold text-lg">
                حساب خرسانة الأعمدة
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
              <LayoutDashboard className="w-4 h-4" />
              <span>حساب خرسانة الأعمدة - مشروع #{projectId}</span>
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
                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                  حساب دقيق لحجم الخرسانة في الأعمدة المربعة، المستطيلة، والدائرية
                </p>
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
                      إضافة وحساب الأعمدة بأشكال مختلفة
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
                          className="h-14 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50"
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
                      {columns.length > 0 && (
                        <Badge variant="outline" className="font-bold">
                          المجموع: {totalVolume.toFixed(3)} م³
                        </Badge>
                      )}
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
                                    <InputField
                                      id={`length-${column.id}`}
                                      label="طول الضلع"
                                      value={column.length || ''}
                                      onChange={(value) => updateColumn(column.id, 'length', value)}
                                      placeholder="0.4"
                                      step="0.01"
                                      unit="متر"
                                      icon={Ruler}
                                    />
                                  )}

                                  {column.shape === 'rectangle' && (
                                    <>
                                      <InputField
                                        id={`length-${column.id}`}
                                        label="الطول"
                                        value={column.length || ''}
                                        onChange={(value) => updateColumn(column.id, 'length', value)}
                                        placeholder="0.4"
                                        step="0.01"
                                        unit="متر"
                                        icon={Ruler}
                                      />
                                      <InputField
                                        id={`width-${column.id}`}
                                        label="العرض"
                                        value={column.width || ''}
                                        onChange={(value) => updateColumn(column.id, 'width', value)}
                                        placeholder="0.3"
                                        step="0.01"
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
                                      placeholder="0.4"
                                      step="0.01"
                                      unit="متر"
                                      icon={Ruler}
                                    />
                                  )}

                                  <InputField
                                    id={`height-${column.id}`}
                                    label="الارتفاع"
                                    value={column.height}
                                    onChange={(value) => updateColumn(column.id, 'height', value)}
                                    placeholder="3.0"
                                    step="0.01"
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
                onClick={saveToReports}
                disabled={columns.length === 0 || saving}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  {saving ? 'جاري الحفظ...' : 'حفظ وتحميل إلى التقارير'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>

              <Button 
                onClick={reset}
                variant="outline" 
                className="h-14 px-6 text-base font-black border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 shadow-xl hover:shadow-emerald-200 transition-all duration-500 rounded-2xl flex items-center gap-4"
              >
                <CheckCircle2 className="w-5 h-5" />
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
                    <CardDescription className="text-indigo-100 text-base">
                      حسابات دقيقة وفق المعايير الفنية
                    </CardDescription>
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
                              label: 'وزن الحديد التقديري', 
                              value: `${calculateSteelWeight().toFixed(2)} كجم`, 
                              color: 'from-orange-500 to-amber-500' 
                            },
                            { 
                              label: 'متوسط الحجم للعمود', 
                              value: `${(totalVolume / columns.length).toFixed(3)} م³`, 
                              color: 'from-blue-500 to-cyan-500' 
                            },
                          ].map(({ label, value, color, highlight }, index) => (
                            <div 
                              key={index} 
                              className={`group p-6 bg-gradient-to-r ${
                                highlight 
                                  ? 'from-indigo-50 to-purple-50 border-2 border-indigo-200' 
                                  : 'from-white/60 hover:from-white'
                              } rounded-2xl ${
                                highlight 
                                  ? 'border-indigo-200' 
                                  : 'border-slate-200 hover:border-indigo-300'
                              } hover:shadow-lg transition-all duration-300 flex items-center justify-between`}
                            >
                              <span className={`font-bold ${
                                highlight 
                                  ? 'text-indigo-900 text-lg' 
                                  : 'text-slate-800 text-base'
                              }`}>
                                {label}:
                              </span>
                              <span className={`font-black ${
                                highlight ? 'text-xl' : 'text-lg'
                              } bg-gradient-to-r ${color} bg-clip-text text-transparent px-4 py-1 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* قوانين الحساب */}
                    <Card className="border-0 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          قوانين الحساب
                        </h4>
                        <div className="space-y-2 text-sm text-emerald-800">
                          <div className="p-3 bg-white/50 rounded-xl">
                            <p className="font-bold">عمود مربع:</p>
                            <p>الحجم = الطول × الطول × الارتفاع</p>
                          </div>
                          <div className="p-3 bg-white/50 rounded-xl">
                            <p className="font-bold">عمود مستطيل:</p>
                            <p>الحجم = الطول × العرض × الارتفاع</p>
                          </div>
                          <div className="p-3 bg-white/50 rounded-xl">
                            <p className="font-bold">عمود دائري:</p>
                            <p>الحجم = (π × القطر² ÷ 4) × الارتفاع</p>
                            <p className="text-xs text-emerald-600">حيث π = 3.1416</p>
                          </div>
                          <div className="p-3 bg-white/50 rounded-xl">
                            <p className="font-bold">المجموع الكلي:</p>
                            <p>إجمالي الحجم = مجموع أحجام جميع الأعمدة</p>
                          </div>
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
    </div>
  );
}

function InputField({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
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
  placeholder: string;
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