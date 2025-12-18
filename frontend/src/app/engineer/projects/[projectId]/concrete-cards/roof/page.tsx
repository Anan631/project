"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  LayoutDashboard,
  Calculator,
  Layers,
  Ruler,
  CheckCircle2,
  TrendingUp,
  Box,
  AlertCircle,
} from 'lucide-react';
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

export default function RoofConcretePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  // نوع السقف: بدون ربس أو مع ربس
  const [roofType, setRoofType] = useState<'without-ribs' | 'with-ribs'>('without-ribs');

  // مدخلات ��امة
  const [A, setA] = useState<string>(''); // مساحة السقف م2
  const [T, setT] = useState<string>(''); // سمك السقف م
  const [Vslab, setVslab] = useState<string>(''); // حجم السقف إن وجد م3

  // مدخلات الربس
  const [Lr, setLr] = useState<string>(''); // طول الربس م
  const [Wr, setWr] = useState<string>(''); // عرض الربس م
  const [Hr, setHr] = useState<string>(''); // ارتفاع الربس م

  // الطوابق - تظهر فقط عند وجود ربس
  const [floorMode, setFloorMode] = useState<'single' | 'multi'>('single');
  const [floorsCount, setFloorsCount] = useState<string>('2');
  const [buildingType, setBuildingType] = useState<string>('residential'); // نوع المبنى
  const [liveLoadPerM2, setLiveLoadPerM2] = useState<string>('0.15'); // طن/م2 - محسوب تلقائياً فقط

  const [saving, setSaving] = useState(false);
  const [existingReportDialog, setExistingReportDialog] = useState<{
    open: boolean;
    reportId: string | null;
  }>({
    open: false,
    reportId: null,
  });

  // المشتقات
  const numeric = (v: string) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };

  const a = numeric(A);
  const t = numeric(T);
  const vslab = numeric(Vslab);
  const lr = numeric(Lr);
  const wr = numeric(Wr);
  const hr = numeric(Hr);
  const nFloors = Math.max(0, Math.floor(numeric(floorsCount)));
  // جلب بيانات الحمولة الحية من قاعدة البيانات
  const [liveLoadData, setLiveLoadData] = useState<any[]>([]);
  const [loadingLiveLoad, setLoadingLiveLoad] = useState(false);
  
  // جلب بيانات الحمولة الحية عند تحميل المكون
  useEffect(() => {
    const fetchLiveLoadData = async () => {
      setLoadingLiveLoad(true);
      try {
        const response = await fetch('http://localhost:5000/api/engineering-data/live-loads');
        const data = await response.json();
        console.log('Live load data:', data); // للتحقق من شكل البيانات
        // التحقق إذا كانت البيانات مصفوفة، وإذا لم تكن كذلك، حاول استخراج المصفوفة من الكائن
        if (Array.isArray(data)) {
          setLiveLoadData(data);
        } else if (data && Array.isArray(data.liveLoads)) {
          setLiveLoadData(data.liveLoads);
        } else if (data && Array.isArray(data.data)) {
          setLiveLoadData(data.data);
        } else {
          console.error('Unexpected data format:', data);
          setLiveLoadData([]);
        }
      } catch (error) {
        console.error('Error fetching live load data:', error);
        toast({ title: 'خطأ', description: 'فشل في جلب بيانات الحمولة الحية', variant: 'destructive' });
      } finally {
        setLoadingLiveLoad(false);
      }
    };
    
    fetchLiveLoadData();
  }, []);
  
  // تحديد الحمولة الحية للمتر المربع بناءً على نوع المبنى
  const getLiveLoadPerM2 = () => {
    // البحث عن نوع المبنى في البيانات المحملة
    const buildingData = Array.isArray(liveLoadData) ? liveLoadData.find(item => {
      // استخدام القيمة الإنجليزية للمقارنة
      return item.buildingTypeEn === buildingType;
    }) : null;
    
    if (buildingData) {
      // حساب القيمة الوسطية (متوسط القيمة العليا والصغرى)
      const averageValue = (buildingData.minValue + buildingData.maxValue) / 2;
      // وتقريبها لمنزلتين عشريتين
      return parseFloat(averageValue.toFixed(2));
    }
    
    // قيم افتراضية في حالة عدم العثور على البيانات (بوحدة كيلو نيوتن/م²)
    switch(buildingType) {
      case 'residential':
        return 1.5; // كيلو نيوتن/م²
      case 'commercial':
        return 2.5; // كيلو نيوتن/م²
      case 'industrial':
        return 3.5; // كيلو نيوتن/م²
      case 'educational':
        return 2.0; // كيلو نيوتن/م²
      case 'hospital':
        return 2.0; // كيلو نيوتن/م²
      default:
        return 1.5; // كيلو نيوتن/م²
    }
  };
  
  // تحديث قيمة الحمولة الحية عند تغيير نوع المبنى
  useEffect(() => {
    setLiveLoadPerM2(getLiveLoadPerM2().toString());
  }, [buildingType]);
  
  const ql = numeric(liveLoadPerM2);

  // عدد الربس = A * 5 (فقط عند وجود ربس)
  const ribsCount = useMemo(() => {
    if (roofType === 'with-ribs' && a > 0) {
      return a * 5;
    }
    return 0;
  }, [roofType, a]);

  // حجم الربس الكلي = Lr * Wr * Hr * ribsCount (فقط عند وجود ربس)
  const ribsVolume = useMemo(() => {
    if (roofType === 'with-ribs' && lr > 0 && wr > 0 && hr > 0 && ribsCount > 0) {
      return lr * wr * hr * ribsCount;
    }
    return 0;
  }, [roofType, lr, wr, hr, ribsCount]);

  // حساب حجم السقف
  // حجم السقف = مساحة السقف × سمك السقف (محسوب تلقائياً)
  const baseSlabVolume = useMemo(() => {
    // حجم السقف = A × T (محسوب تلقائياً)
    if (a > 0 && t > 0) {
      return a * t;
    }
    return 0;
  }, [a, t]);

  // كمية الخرسانة (مع الربس) = حجم السقف - حجم الربس الكلي
  // عند طابق واحد: كمية الخرسانة = (A * T) - حجم الربسات
  const concreteWithRibs = useMemo(() => {
    if (roofType === 'with-ribs') {
      // حساب كمية الخرسانة: حجم السقف - حجم الربسات
      // حتى لو كانت أبعاد الربس غير مدخلة، نعرض حجم السقف كحد أدنى
      if (baseSlabVolume > 0) {
        const result = baseSlabVolume - ribsVolume;
        // إذا كانت النتيجة سالبة (حجم الربسات أكبر من حجم السقف)، نرجع 0
        // وإلا نرجع النتيجة
        return Math.max(0, result);
      }
      return 0;
    }
    return 0;
  }, [roofType, baseSlabVolume, ribsVolume]);

  // بدون رِبس: كمية الخرسانة = A * T (لطابق واحد)
  const concreteNoRibsSingle = useMemo(() => a * t, [a, t]);

  // حسابات متعددة الطوابق (تُستخدم فقط إذا floorMode === 'multi' وفقط مع الربس)
  // الحمل الميت = مساحة السقف × سمك السقف × كثافة الخرسانة (25 كيلو نيوتن/م³)
  const deadLoad = useMemo(() => (roofType === 'with-ribs' && floorMode === 'multi' ? a * t * 25 : 0), [roofType, floorMode, a, t]);
  // الحمل الحي = مساحة السقف × الحمولة الحية للمتر المربع (بوحدة كيلو نيوتن/م²)
  const liveLoad = useMemo(() => (roofType === 'with-ribs' && floorMode === 'multi' ? a * ql : 0), [roofType, floorMode, a, ql]);
  // الحمل الكلي = الحمل الميت + الحمل الحي
  const totalLoad = useMemo(() => (roofType === 'with-ribs' && floorMode === 'multi' ? deadLoad + liveLoad : 0), [roofType, floorMode, deadLoad, liveLoad]);
  // كمية الخرسانة النهائية عند أكثر من طابق = (مساحة السقف × سمك السقف) + (عدد الطوابق × الحمل الكلي)
  const finalConcreteMulti = useMemo(() => {
    if (roofType === 'with-ribs' && floorMode === 'multi') {
      // كمية الخرسانة = (مساحة السقف × سمك السقف) + (عدد الطوابق × الحمل الكلي)
      return (a * t) + (nFloors * totalLoad);
    }
    return 0;
  }, [roofType, floorMode, a, t, nFloors, totalLoad]);

  // الإجمالي المعروض حسب الحالة
  const computedTotalConcrete = useMemo(() => {
    if (roofType === 'with-ribs') {
      // سقف مع ربس
      if (floorMode === 'multi') return finalConcreteMulti;
      return concreteWithRibs; // طابق واحد مع ربس
    } else {
      // سقف بدون ربس (طابق واحد فقط)
      return concreteNoRibsSingle; // A*T
    }
  }, [roofType, floorMode, finalConcreteMulti, concreteWithRibs, concreteNoRibsSingle]);

  // نتيجة الزر
  const [finalTotal, setFinalTotal] = useState<number>(0);

  // التحقق من وجود تقرير سابق
  const checkExistingReport = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/project/${projectId}`);
      const data = await response.json();
      
      if (data.success && data.reports) {
        const existingReport = data.reports.find((r: any) => 
          r.calculationType === 'roof' && !r.deleted
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

  const handleCalculate = async () => {
    // تحقق مبسط قبل الحساب
    if (a <= 0 || t <= 0) {
      toast({ title: 'مدخلات غير صالحة', description: 'يرجى إدخال مساحة وسمك صالحين', variant: 'destructive' });
      return;
    }
    
    // التحقق من حالة السقف مع الربس
    if (roofType === 'with-ribs') {
      if (lr <= 0 || wr <= 0 || hr <= 0) {
        toast({ title: 'أبعاد الربس مطلوبة', description: 'يرجى إدخال L_r و W_r و H_r بشكل صحيح', variant: 'destructive' });
        return;
      }
      // التحقق من الطوابق المتعددة (فقط مع الربس)
      if (floorMode === 'multi') {
        if (nFloors <= 0) {
          toast({ title: 'عدد الطوابق غير صالح', description: 'يرجى إدخال عدد طوابق صحيح', variant: 'destructive' });
          return;
        }
      }
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
    
    // حساب النتائج وعرضها فقط (بدون حفظ)
    setFinalTotal(Math.max(0, computedTotalConcrete));
    toast({
      title: 'تم الحساب بنجاح',
      description: `تم حساب كمية الخرسانة: ${computedTotalConcrete.toFixed(3)} م³`,
    });
  };

  const canSave = useMemo(() => {
    if (a <= 0 || t <= 0) return false;
    
    if (roofType === 'with-ribs') {
      // مع الربس
      if (lr <= 0 || wr <= 0 || hr <= 0) return false;
      // إذا كان متعدد الطوابق
      if (floorMode === 'multi') {
        if (nFloors <= 0) return false;
      }
    }
    // بدون ربس: كمية الخرسانة = A * T
    
    return computedTotalConcrete > 0;
  }, [a, t, roofType, lr, wr, hr, floorMode, nFloors, computedTotalConcrete]);

  const saveToReports = async () => {
    if (!canSave) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى التحقق من المدخلات', variant: 'destructive' });
      return;
    }

    // التأكد من أن الحسابات تمت
    if (finalTotal === 0 && computedTotalConcrete === 0) {
      toast({ 
        title: 'يرجى حساب النتائج أولاً', 
        description: 'اضغط على زر "احسب الخرسانة" قبل الحفظ', 
        variant: 'destructive' 
      });
      return;
    }

    // التحقق من وجود تقرير سابق وحذفه قبل الحفظ
    const existingReportId = await checkExistingReport();
    if (existingReportId) {
      await deleteExistingReport(existingReportId);
    }

    setSaving(true);
    try {
      const engineerId = localStorage.getItem('userId') || '';
      const engineerName = localStorage.getItem('userName') || 'المهندس';

      const projectRes = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      // استخدام finalTotal إذا كان محسوباً، وإلا استخدام computedTotalConcrete
      const totalConcreteToSave = finalTotal > 0 ? finalTotal : computedTotalConcrete;

      const payload = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'roof',
        concreteData: {
          totalConcrete: totalConcreteToSave,
          roofData: {
            roofType: roofType, // نوع السقف: with-ribs أو without-ribs
            area: a,
            thickness: t,
            calculatedSlabVolume: baseSlabVolume, // حجم السقف المحسوب تلقائياً = A × T
            ribs: roofType === 'with-ribs' ? {
              length: lr,
              width: wr,
              height: hr,
              count: ribsCount,
              totalRibsVolume: ribsVolume,
              concreteWithRibs: concreteWithRibs,
            } : null,
            concreteNoRibs: roofType === 'without-ribs' ? concreteNoRibsSingle : null,
            floors: roofType === 'with-ribs' ? {
              mode: floorMode,
              count: floorMode === 'multi' ? nFloors : 1,
              liveLoadPerM2: floorMode === 'multi' ? ql : null,
              deadLoad: floorMode === 'multi' ? deadLoad : null,
              liveLoad: floorMode === 'multi' ? liveLoad : null,
              totalLoad: floorMode === 'multi' ? totalLoad : null,
              finalConcrete: floorMode === 'multi' ? finalConcreteMulti : null,
            } : null,
          }
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
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'تم الحفظ بنجاح', description: 'تم ترحيل النتائج إلى صفحة تقارير الكميات' });
        router.push(`/engineer/quantity-reports/${projectId}`);
      } else {
        throw new Error(data.message || 'فشل حفظ التقرير');
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'خطأ في الحفظ', description: 'حدث خطأ أثناء حفظ التقرير', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // إعادة تعيين
  const reset = () => {
    setRoofType('without-ribs');
    setA('');
    setT('');
    setVslab('');
    setLr('');
    setWr('');
    setHr('');
    setFloorMode('single');
    setFloorsCount('2');
    setLiveLoadPerM2('2');
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
                  العودة إلى صفحة كروت الباطون
                </Button>
              </Link>
              
            </div>

          </div>

          <div className="relative group">
            <div className="flex items-start lg:items-center gap-6 p-2">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                  <Layers className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-800 bg-clip-text text-transparent leading-tight mb-4">
                  حساب كمية الخرسانة في السقف 
                </h1>
                
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Input Section */}
          <div className="xl:col-span-8 space-y-6 lg:space-y-8">
            {/* كرت السقف */}
            <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">كرت السقف</CardTitle>
                    <CardDescription className="text-emerald-100 text-base">
                      إدخال المعطيات وحساب الخرسانة مع أو بدون رِبس
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <div className="space-y-8">
                  {/* اختيار نوع السقف */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-slate-900 flex items-center gap-2"><Box className="w-5 h-5" /> نوع السقف</Label>
                      <Select value={roofType} onValueChange={(v: 'without-ribs' | 'with-ribs') => setRoofType(v)}>
                        <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                          <SelectValue placeholder="اختر نوع السقف" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                          <SelectItem value="without-ribs" className="text-lg py-3">سقف بدون رِبس</SelectItem>
                          <SelectItem value="with-ribs" className="text-lg py-3">سقف مع رِبس</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* مدخلات عامة */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField id="area" label="مساحة السقف" value={A} onChange={setA}  unit="م²" icon={Ruler} />
                    <InputField id="thickness" label="سمك السقف" value={T} onChange={setT}  unit="م" icon={Ruler}  />
                  </div>

                  {roofType === 'with-ribs' && (
                    <>
                      <Separator className="my-2" />
                      {/* مدخلات الربس */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField id="lr" label="طول الربس" value={Lr} onChange={setLr}  unit="م" icon={Ruler} />
                        <InputField id="wr" label="عرض الربس" value={Wr} onChange={setWr}  unit="م" icon={Ruler} />
                        <InputField id="hr" label="ارتفاع الربس" value={Hr} onChange={setHr} unit="م" icon={Ruler} />
                      </div>

                      {/* نتائج الربس */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <ResultBox label="عدد الربس" value={ribsCount.toFixed(0)} suffix="" color="from-emerald-500 to-teal-500" />
                        <ResultBox label="حجم السقف (محسوب)" value={baseSlabVolume.toFixed(3)} suffix="م³" color="from-blue-500 to-indigo-500" />
                        <ResultBox label="حجم الربس الكلي" value={ribsVolume.toFixed(3)} suffix="م³" color="from-cyan-500 to-blue-500" />
                        <ResultBox label="كمية الخرسانة (مع الربس)" value={concreteWithRibs.toFixed(3)} suffix="م³" color="from-indigo-500 to-purple-500" />
                      </div>

                      <Separator className="my-2" />

                      {/* الطوابق - تظهر فقط مع الربس */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label className="text-lg font-bold text-slate-900">عدد الطوابق</Label>
                          <Select value={floorMode} onValueChange={(v: 'single' | 'multi') => setFloorMode(v)}>
                            <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                              <SelectValue placeholder="اختر" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                              <SelectItem value="single" className="text-lg py-3">طابق واحد</SelectItem>
                              <SelectItem value="multi" className="text-lg py-3">أكثر من طابق</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {floorMode === 'multi' && (
                          <div className="space-y-4">
                            <Label className="text-lg font-bold text-slate-900">نوع المبنى</Label>
                            <Select value={buildingType} onValueChange={setBuildingType}>
                              <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                                <SelectValue placeholder="اختر نوع المبنى" />
                              </SelectTrigger>
                              <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                                {loadingLiveLoad ? (
                                  <div className="p-4 text-center">جاري التحميل...</div>
                                ) : liveLoadData.length > 0 ? (
                                  liveLoadData.map((item) => (
                                    <SelectItem key={item._id} value={item.buildingTypeEn} className="text-lg py-3">
                                      {item.buildingType}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-4 text-center">لا توجد بيانات متاحة</div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {floorMode === 'multi' && (
                          <div className="space-y-4">
                            <InputField id="floors" label="عدد الطوابق" value={floorsCount} onChange={setFloorsCount}  unit="طابق" icon={Ruler}  />
                          </div>
                        )}
                      </div>

                      {floorMode === 'multi' && (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                          <ResultBox label="الكمية النهائية" value={finalConcreteMulti.toFixed(3)} suffix="م³" color="from-indigo-500 to-purple-500" />
                        </div>
                      )}
                    </>
                  )}

                  {roofType === 'without-ribs' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ResultBox label="كمية الخرسانة" value={concreteNoRibsSingle.toFixed(3)} suffix="م³" color="from-rose-500 to-pink-600" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 pt-4">
              <Button 
                onClick={handleCalculate}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-4">
                  <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  احسب الخرسانة
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>

              <Button 
                onClick={saveToReports}
                disabled={!canSave || saving || finalTotal === 0}
                className="h-14 px-6 text-base font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white shadow-xl transition-all duration-500 rounded-2xl flex items-center gap-4"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ وتحميل إلى التقارير'}
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
                    <CardTitle className="text-xl font-bold">النتائج </CardTitle>
                    
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center group-hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-700">
                    <div className="w-20 h-20 mx-auto mb-6 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                      <Calculator className="w-10 h-10 text-white drop-shadow-2xl" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-indigo-100 font-bold text-lg tracking-wide">
                        إجمالي كمية الخرسانة (النتيجة النهائية)
                      </Label>
                      <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl leading-none">
                        {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      </div>
                      <div className="text-lg font-bold text-indigo-100 tracking-wider">متر مكعب</div>
                    </div>
                  </div>
                </div>


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
                <p>تم إجراء حسابات السقف مسبقًا والتقرير جاهز.</p>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 font-medium">
                    في حال اختيار إعادة الحسابات:
                  </p>
                  <ul className="list-disc list-inside text-amber-700 text-sm mt-2 space-y-1">
                    <li>سيتم تنفيذ الحسابات من جديد وعرض النتائج</li>
                    <li>يمكنك بعد ذلك حفظ التقرير الجديد باستخدام زر "حفظ وتحميل إلى التقارير"</li>
                    <li>عند الحفظ، سيتم حذف التقرير السابق تلقائيًا</li>
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
                // إعادة الحساب فقط (بدون حفظ)
                setFinalTotal(Math.max(0, computedTotalConcrete));
                setExistingReportDialog({ open: false, reportId: null });
                toast({
                  title: 'تم الحساب بنجاح',
                  description: `تم حساب كمية الخرسانة: ${computedTotalConcrete.toFixed(3)} م³. يمكنك الآن حفظ التقرير باستخدام زر "حفظ وتحميل إلى التقارير"`,
                });
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

function ResultBox({ label, value, suffix, color = 'from-emerald-500 to-teal-500' }: { label: string; value: string; suffix?: string; color?: string; }) {
  return (
    <div className={`p-5 rounded-2xl border-2 bg-gradient-to-r from-white/70 to-white/90 backdrop-blur-sm shadow-sm` }>
      <div className="text-sm font-bold text-slate-600 mb-2">{label}</div>
      <div className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {value} {suffix || ''}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string; }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-white/70">
      <span className="font-bold text-slate-800">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}