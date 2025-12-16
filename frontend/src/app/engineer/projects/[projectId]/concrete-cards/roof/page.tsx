"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
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
} from 'lucide-react';

export default function RoofConcretePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  // حالة الربس
  const [hasRibs, setHasRibs] = useState<'yes' | 'no'>('no');

  // مدخلات ��امة
  const [A, setA] = useState<string>(''); // مساحة السقف م2
  const [T, setT] = useState<string>(''); // سمك السقف م
  const [Vslab, setVslab] = useState<string>(''); // حجم السقف إن وجد م3

  // مدخلات الربس
  const [Lr, setLr] = useState<string>(''); // طول الربس م
  const [Wr, setWr] = useState<string>(''); // عرض الربس م
  const [Hr, setHr] = useState<string>(''); // ارتفاع الربس م

  // الطوابق
  const [floorMode, setFloorMode] = useState<'single' | 'multi'>('single');
  const [floorsCount, setFloorsCount] = useState<string>('2');
  const [liveLoadPerM2, setLiveLoadPerM2] = useState<string>('2'); // طن/م2 افتراضي (يمكن تعديله)

  const [saving, setSaving] = useState(false);

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
  const ql = numeric(liveLoadPerM2);

  // عدد الربس = A * 5
  const ribsCount = useMemo(() => (hasRibs === 'yes' ? a * 5 : 0), [hasRibs, a]);

  // حجم الربس الكلي = Lr * Wr * Hr * ribsCount
  const ribsVolume = useMemo(() => (hasRibs === 'yes' ? lr * wr * hr * ribsCount : 0), [hasRibs, lr, wr, hr, ribsCount]);

  // كمية الخرسانة (مع الربس) = V_slab - حجم الربس الكلي
  // ملاحظة: عند وجود رِبس يصبح V_slab إلزامياً
  const baseSlabVolume = useMemo(() => {
    if (hasRibs === 'yes') return vslab; // إلزامي
    const direct = vslab > 0 ? vslab : a * t;
    return direct;
  }, [hasRibs, vslab, a, t]);

  const concreteWithRibs = useMemo(() => {
    if (hasRibs === 'yes') {
      return Math.max(0, baseSlabVolume - ribsVolume);
    }
    return 0;
  }, [hasRibs, baseSlabVolume, ribsVolume]);

  // بدون رِبس: كمية الخرسانة = A * T (لطابق واحد)
  const concreteNoRibsSingle = useMemo(() => a * t, [a, t]);

  // حسابات متعددة الطوابق (تُستخدم فقط إذا floorMode === 'multi')
  // الحمل الميت = A * T * 25
  const deadLoad = useMemo(() => (floorMode === 'multi' ? a * t * 25 : 0), [floorMode, a, t]);
  // الحمل الحي = A * الحمولة الحية للمتر المربع
  const liveLoad = useMemo(() => (floorMode === 'multi' ? a * ql : 0), [floorMode, a, ql]);
  // الحمل الكلي = الحمل الميت + الحمل الحي
  const totalLoad = useMemo(() => (floorMode === 'multi' ? deadLoad + liveLoad : 0), [floorMode, deadLoad, liveLoad]);
  // كمية الخرسانة النهائية = (A*T) + (عدد الطوابق * الحمل الكلي)
  const finalConcreteMulti = useMemo(() => (floorMode === 'multi' ? (a * t) + (nFloors * totalLoad) : 0), [floorMode, a, t, nFloors, totalLoad]);

  // الإجمالي المعروض حسب الحالة
  const computedTotalConcrete = useMemo(() => {
    if (hasRibs === 'yes') {
      // مع ربس
      if (floorMode === 'multi') return finalConcreteMulti;
      return concreteWithRibs;
    } else {
      // بدون ربس
      if (floorMode === 'multi') return finalConcreteMulti;
      return concreteNoRibsSingle; // لطابق واحد: A*T
    }
  }, [hasRibs, floorMode, finalConcreteMulti, concreteWithRibs, concreteNoRibsSingle]);

  // نتيجة الزر
  const [finalTotal, setFinalTotal] = useState<number>(0);

  const handleCalculate = () => {
    // تحقق مبسط قبل الحساب
    if (a <= 0 || t <= 0) {
      toast({ title: 'مدخلات غير صالحة', description: 'يرجى إدخال مساحة وسمك صالحين', variant: 'destructive' });
      return;
    }
    if (hasRibs === 'yes') {
      if (vslab <= 0) {
        toast({ title: 'حجم السقف مطلوب', description: 'عند وجود رِبس يجب إدخال حجم السقف', variant: 'destructive' });
        return;
      }
      if (lr <= 0 || wr <= 0 || hr <= 0) {
        toast({ title: 'أبعاد الربس مطلوبة', description: 'يرجى إدخال L_r و W_r و H_r بشكل صحيح', variant: 'destructive' });
        return;
      }
    }
    if (floorMode === 'multi') {
      if (nFloors <= 0) {
        toast({ title: 'عدد الطوابق غير صالح', description: 'يرجى إدخال عدد طوابق صحيح', variant: 'destructive' });
        return;
      }
    }
    setFinalTotal(Math.max(0, computedTotalConcrete));
  };

  const canSave = useMemo(() => {
    if (a <= 0 || t <= 0) return false;
    if (hasRibs === 'yes') {
      if (vslab <= 0) return false; // حجم السقف مطلوب عند وجود رِبس
      if (lr <= 0 || wr <= 0 || hr <= 0) return false;
    }
    if (floorMode === 'multi') {
      if (nFloors <= 0 || ql < 0) return false;
    }
    return computedTotalConcrete > 0;
  }, [a, t, hasRibs, vslab, lr, wr, hr, floorMode, nFloors, ql, computedTotalConcrete]);

  const saveToReports = async () => {
    if (!canSave) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى التحقق من المدخلات', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const engineerId = localStorage.getItem('userId') || '';
      const engineerName = localStorage.getItem('userName') || 'المهندس';

      const projectRes = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      const payload = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'roof',
        concreteData: {
          totalConcrete: computedTotalConcrete,
          roofData: {
            hasRibs: hasRibs === 'yes',
            area: a,
            thickness: t,
            inputSlabVolume: vslab > 0 ? vslab : null,
            ribs: hasRibs === 'yes' ? {
              length: lr,
              width: wr,
              height: hr,
              count: ribsCount,
              totalRibsVolume: ribsVolume,
              concreteWithRibs: concreteWithRibs,
            } : null,
            concreteNoRibs: hasRibs === 'no' ? concreteNoRibs : null,
            floors: {
              mode: floorMode,
              count: floorMode === 'multi' ? nFloors : 1,
              liveLoadPerM2: floorMode === 'multi' ? ql : null,
              deadLoad,
              liveLoad,
              totalLoad,
              finalConcrete: floorMode === 'multi' ? finalConcreteMulti : null,
            }
          }
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
    setHasRibs('no');
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
                  العودة للمشاريع
                </Button>
              </Link>
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0 px-6 py-2.5 font-bold text-lg">
                حساب خرسانة السقف
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
              <LayoutDashboard className="w-4 h-4" />
              <span>حساب خرسانة السقف - مشروع #{projectId}</span>
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
                  حساب كمية الخرسانة في السقف (بلاطة)
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                  يدعم حالتي وجود رِبس أو عدم وجوده، مع خيار مبنى متعدد الطوابق
                </p>
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
                  {/* اختيار حالة الربس */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold text-slate-900 flex items-center gap-2"><Box className="w-5 h-5" /> هل السقف يحتوي على رِبس؟</Label>
                      <Select value={hasRibs} onValueChange={(v: 'yes' | 'no') => setHasRibs(v)}>
                        <SelectTrigger className="h-16 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl">
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl">
                          <SelectItem value="yes" className="text-lg py-3">نعم</SelectItem>
                          <SelectItem value="no" className="text-lg py-3">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* مدخلات عامة */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField id="area" label="مساحة السقف (A)" value={A} onChange={setA} placeholder="مثال: 120" unit="م²" icon={Ruler} step="0.01" />
                    <InputField id="thickness" label="سمك السقف (T)" value={T} onChange={setT} placeholder="مثال: 0.20" unit="م" icon={Ruler} step="0.01" />
                    {hasRibs === 'yes' && (
                      <InputField id="vslab" label="حجم السقف (إلزامي مع الربس)" value={Vslab} onChange={setVslab} placeholder="مثال: 24" unit="م³" icon={Ruler} step="0.01" />
                    )}
                  </div>

                  {hasRibs === 'yes' && (
                    <>
                      <Separator className="my-2" />
                      {/* مدخلات الربس */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField id="lr" label="طول الربس (L_r)" value={Lr} onChange={setLr} placeholder="مثال: 3.0" unit="م" icon={Ruler} step="0.01" />
                        <InputField id="wr" label="عرض الربس (W_r)" value={Wr} onChange={setWr} placeholder="مثال: 0.1" unit="م" icon={Ruler} step="0.01" />
                        <InputField id="hr" label="ارتفاع الربس (H_r)" value={Hr} onChange={setHr} placeholder="مثال: 0.12" unit="م" icon={Ruler} step="0.01" />
                      </div>

                      {/* نتائج الربس */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultBox label="عدد الربس" value={ribsCount.toFixed(0)} suffix="" color="from-emerald-500 to-teal-500" />
                        <ResultBox label="حجم الربس الكلي" value={ribsVolume.toFixed(3)} suffix="م³" color="from-cyan-500 to-blue-500" />
                        <ResultBox label="كمية الخرسانة (مع الربس)" value={concreteWithRibs.toFixed(3)} suffix="م³" color="from-indigo-500 to-purple-500" />
                      </div>
                    </>
                  )}

                  <Separator className="my-2" />

                  {/* الطوابق */}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField id="floors" label="عدد الطوابق" value={floorsCount} onChange={setFloorsCount} placeholder="مثال: 3" unit="طابق" icon={Ruler} step="1" />
                        <InputField id="ql" label="الحمولة الحية (لكل م²)" value={liveLoadPerM2} onChange={setLiveLoadPerM2} placeholder="مثال: 2" unit="طن/م²" icon={Ruler} step="0.1" />
                      </div>
                    )}
                  </div>

                  {floorMode === 'multi' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <ResultBox label="الحمل الميت" value={deadLoad.toFixed(3)} suffix="طن" color="from-orange-500 to-amber-500" />
                      <ResultBox label="الحمل الحي" value={liveLoad.toFixed(3)} suffix="طن" color="from-green-500 to-emerald-500" />
                      <ResultBox label="الحمل الكلي" value={totalLoad.toFixed(3)} suffix="طن" color="from-cyan-500 to-blue-500" />
                      <ResultBox label="الكمية النهائية" value={finalConcreteMulti.toFixed(3)} suffix="م³" color="from-indigo-500 to-purple-500" />
                    </div>
                  )}

                  {hasRibs === 'no' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <ResultBox label="كمية الخرسانة بدون رِبس" value={concreteNoRibsSingle.toFixed(3)} suffix="م³" color="from-rose-500 to-pink-600" />
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
                disabled={!canSave || saving}
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
                    <CardTitle className="text-xl font-bold">النتائج الهندسية</CardTitle>
                    <CardDescription className="text-indigo-100 text-base">
                      حسابات دقيقة وفق المعايير الفنية
                    </CardDescription>
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

                {/* قوانين الحساب */}
                <Card className="border-0 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      قوانين الحساب
                    </h4>
                    <div className="space-y-2 text-sm text-emerald-800">
                      <div className="p-3 bg-white/50 rounded-xl">
                        <p className="font-bold">مع وجود رِبس:</p>
                        <p>عدد الربس = مساحة السقف × 5</p>
                        <p>حجم الربس الكلي = طول الربس × عرض الربس × ارتفاع الربس × عدد الربس</p>
                        <p>كمية الخرسانة = حجم السقف − حجم الربس الكلي</p>
                      </div>
                      <div className="p-3 bg-white/50 rounded-xl">
                        <p className="font-bold">بدون رِبس:</p>
                        <p>كمية الخرسانة = مساحة السقف × سمك السقف</p>
                      </div>
                      <div className="p-3 bg-white/50 rounded-xl">
                        <p className="font-bold">متعدد الطوابق:</p>
                        <p>الحمل الميت = مساحة السقف × سمك السقف × 25</p>
                        <p>الحمل الحي = مساحة السقف × الحمولة الحية للمتر المربع</p>
                        <p>الحمل الكلي = الحمل الميت + الحمل الحي</p>
                        <p>كمية الخرسانة النهائية = (مساحة السقف × سمك السقف) + (عدد الطوابق × الحمل الكلي)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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