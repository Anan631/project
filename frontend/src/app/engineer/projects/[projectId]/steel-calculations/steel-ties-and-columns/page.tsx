"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calculator, Layers, Ruler, TrendingUp, AlertCircle, Box, ArrowUpCircle, Grid3x3 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Iron bar data interface
interface IronBarData {
  diameter: number;
  crossSectionalAreaCm2: number;
  crossSectionalAreaMm2: number;
}

// Fetch iron bars data from backend
async function fetchIronBars(): Promise<IronBarData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/engineering-data/iron-bars`);
    const data = await res.json();
    const items = data?.data ?? [];
    return items.map((x: any) => ({
      diameter: Number(x?.diameter),
      crossSectionalAreaCm2: Number(x?.crossSectionalAreaCm2),
      crossSectionalAreaMm2: Number(x?.crossSectionalAreaMm2),
    })).filter((item: IronBarData) => Number.isFinite(item.diameter));
  } catch (e) {
    return [];
  }
}

// Helper Input Field component (same styling approach as column-base)
function InputField({ id, label, value, onChange, placeholder, type = "number", unit, icon: Icon }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  unit: string;
  icon: any;
}) {
  return (
    <div className="space-y-2 group">
      <Label htmlFor={id} className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-300 rounded-2xl pl-24"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg text-sm font-bold text-blue-800 border border-blue-200">
          {unit}
        </div>
      </div>
    </div>
  );
}

export default function SteelTiesAndColumnsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const router = useRouter();

  const [heightM, setHeightM] = useState<string>(""); // ارتفاع العمود (م)
  const [slabAreaM2, setSlabAreaM2] = useState<string>(""); // مساحة البلاطة (م²)
  const [floors, setFloors] = useState<string>(""); // عدد الطوابق
  const [rodDiameterMm, setRodDiameterMm] = useState<string>(""); // قطر القضيب (مم)
  const [slabThicknessCm, setSlabThicknessCm] = useState<string>(""); // سمك السقف (سم)
  const [columnShape, setColumnShape] = useState<"rectangle" | "square" | "circle">("rectangle"); // شكل العمود

  const [loading, setLoading] = useState<boolean>(false);
  const [ironBarsData, setIronBarsData] = useState<IronBarData[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchIronBars().then((data) => {
      if (mounted) setIronBarsData(data);
    }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  function parseNum(v: string) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }

  function validate(): string[] {
    const errs: string[] = [];
    const h = parseNum(heightM);
    const area = parseNum(slabAreaM2);
    const fl = parseNum(floors);
    const d = parseNum(rodDiameterMm);
    const t = parseNum(slabThicknessCm);

    if (!Number.isFinite(h) || h < 0) errs.push("يرجى إدخال ارتفاع عمود صالح (≥ 0 م)");
    if (!Number.isFinite(area) || area < 0) errs.push("يرجى إدخال مساحة بلاطة صالحة (≥ 0 م²)");
    if (!Number.isFinite(fl) || fl < 1) errs.push("يرجى إدخال عدد طوابق صالح (≥ 1)");
    if (!Number.isFinite(d)) errs.push("يرجى اختيار قطر قضيب من القائمة");
    if (!Number.isFinite(t) || t < 0) errs.push("يرجى إدخال سمك سقف صالح (≥ 0 سم)");

    return errs;
  }

  function computeResults() {
    const errs = validate();
    if (errs.length) {
      toast({ title: "تحذير", description: errs.join("\n"), variant: "destructive" as any });
      return null;
    }

    const h = parseNum(heightM); // m (متر)
    const area = parseNum(slabAreaM2); // m2
    const fl = parseNum(floors); // count
    const dmm = parseNum(rodDiameterMm); // mm
    const tcm = parseNum(slabThicknessCm); // cm

    // جلب مساحة المقطع من قاعدة البيانات
    const rodData = ironBarsData.find(item => item.diameter === dmm);
    if (!rodData) {
      toast({ title: "خطأ", description: "لم يتم العثور على بيانات القضيب في قاعدة البيانات", variant: "destructive" as any });
      return null;
    }
    const crossSectionAreaMm2 = rodData.crossSectionalAreaMm2; // mm²

    // 1) طول القضيب الخام = 6% من قطر القضيب + ارتفاع العمود + سمك السقف / 100
    const rawLen = (0.06 * dmm) + h + (tcm / 100);
    const intPart = Math.floor(rawLen);
    const frac = rawLen - intPart;
    let finalRodLenM = intPart;

    // تطبيق منطق الجزء الكسري
    if (frac < 0.2) {
      finalRodLenM = intPart;
    } else if (frac >= 0.2 && frac <= 0.7) {
      finalRodLenM = intPart + 0.5;
    } else {
      finalRodLenM = intPart + 1;
    }

    // 2) القيمة A = مساحة البلاطة × عدد الطوابق × 1.6 / 0.195
    const A = (area * fl * 1.6) / 0.195;

    // 5) حساب أبعاد العمود حسب شكله
    let columnDimensions: { length?: number; width?: number; diameter?: number; displayText: string };

    if (columnShape === "square") {
      const rawDim = Math.sqrt(A / 2);
      const dimension = rawDim <= 35 ? 35 : rawDim;
      columnDimensions = {
        length: dimension,
        width: dimension,
        displayText: `${dimension.toFixed(1)} × ${dimension.toFixed(1)} سم`
      };
    } else if (columnShape === "rectangle") {
      const rawWidth = Math.sqrt(A / 2);
      const width = rawWidth <= 25 ? 25 : rawWidth;
      const rawLength = rawWidth * 2;
      const length = rawLength <= 50 ? 50 : rawLength;
      columnDimensions = {
        length,
        width,
        displayText: `${length.toFixed(1)} × ${width.toFixed(1)} سم`
      };
    } else {
      const rawDia = Math.sqrt(A / 3.14);
      const columnDiameter = rawDia <= 30 ? 30 : rawDia;
      const stirrupDiameter = columnDiameter - 5;
      columnDimensions = {
        diameter: columnDiameter,
        displayText: `قطر العمود: ${columnDiameter.toFixed(1)} سم | قطر الكانة: ${stirrupDiameter.toFixed(1)} سم`
      };
    }

    // 3) تقدير وزن الحديد الإجمالي المطلوب بناءً على أبعاد العمود (قاعدة الـ 0.012)
    // القانون: 0.012 × (البعد الأول بالسم × البعد الثاني بالسم × الارتفاع بالمتر)
    let estimatedWeight: number;
    if (columnShape === "circle") {
      const d = columnDimensions.diameter || 0;
      estimatedWeight = 0.012 * d * d * h;
    } else {
      const l = columnDimensions.length || 0;
      const w = columnDimensions.width || 0;
      estimatedWeight = 0.012 * l * w * h;
    }

    const steelDensity = 7850; // kg/m³
    const rodAreaM2 = crossSectionAreaMm2 / 1000000; // تحويل mm² إلى m²

    // 4) حساب عدد القضبان بناءً على الوزن التقديري
    // مساحة الحديد المطلوبة (م²) = الوزن التقديري ÷ (كثافة الحديد × طول القضيب)
    const requiredSteelAreaM2 = estimatedWeight / (steelDensity * finalRodLenM);

    // عدد القضبان = مساحة الحديد المطلوبة ÷ مساحة مقطع القضيب الواحد
    let rawBarCount = requiredSteelAreaM2 / rodAreaM2;

    // تطبيق الحد الأدنى لعدد القضبان والتقريب للأعلى
    let finalBarsCount = Math.ceil(rawBarCount);

    if (columnShape === "square") {
      finalBarsCount = Math.max(finalBarsCount, 4);
    } else if (columnShape === "rectangle") {
      finalBarsCount = Math.max(finalBarsCount, 6);
    } else if (columnShape === "circle") {
      finalBarsCount = Math.max(finalBarsCount, 6);
    }

    const verticalBarsCount = finalBarsCount;

    // 5) حساب وزن الحديد الفعلي للعمود (بناءً على عدد القضبان النهائي)
    // الوزن = عدد القضبان × مساحة مقطع القضيب × طول القضيب × الكثافة
    const rodWeight = verticalBarsCount * rodAreaM2 * finalRodLenM * steelDensity; // kg


    // 5) حساب عدد الكانات
    // الكانات العليا: 60% من ارتفاع العمود ÷ مسافة بين الكانات (20 سم = 0.2 م)
    const upperStirrups = (h * 0.6) / 0.2;
    // الكانات السفلى: 40% من ارتفاع العمود ÷ مسافة بين الكانات (10 سم = 0.1 م) + 2
    const lowerStirrups = (h * 0.4) / 0.1 + 2;
    const totalStirrups = upperStirrups + lowerStirrups;

    return {
      finalRodLenM,
      rodWeight,
      crossSectionAreaMm2,
      verticalBarsCount,
      columnDimensions,
      upperStirrups,
      lowerStirrups,
      totalStirrups,
      A,
    };
  }

  const [results, setResults] = useState<ReturnType<typeof computeResults> | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  async function saveToReports() {
    if (!results) {
      toast({ title: "لا توجد نتائج", description: "يرجى إجراء الحسابات أولاً", variant: "destructive" as any });
      return;
    }

    try {
      setSaving(true);
      const engineerId = localStorage.getItem('userId') || '';
      const engineerName = localStorage.getItem('userName') || 'المهندس';

      const projectRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
      if (!projectRes.ok) throw new Error(`HTTP ${projectRes.status}`);
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      const reportPayload = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        // NOTE: using an existing allowed enum value for steel-type reports
        calculationType: 'column-ties-steel',
        steelData: {
          totalSteelWeight: Number(results.rodWeight) || 0,
          foundationSteel: 0,
          columnSteel: Number(results.rodWeight) || 0,
          beamSteel: 0,
          slabSteel: 0,
          details: {
            kind: 'columns-and-stirrups',
            inputs: {
              heightM,
              slabAreaM2,
              floors,
              rodDiameterMm,
              slabThicknessCm,
              columnShape,
            },
            results,
            timestamp: new Date().toISOString()
          }
        },
        sentToOwner: false,
        status: 'saved'
      } as any;

      const resp = await fetch(`${API_BASE_URL}/api/quantity-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(reportPayload)
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) throw new Error(data?.message || 'Failed to save report');

      toast({ title: 'تم الحفظ بنجاح', description: 'تم حفظ التقرير وتم تحويلك إلى صفحة التقارير.' });
      router.push(`/engineer/quantity-reports/${projectId}`);
    } catch (err: any) {
      console.error('Error saving report:', err);
      toast({ title: 'خطأ في الحفظ', description: err?.message || 'تعذر حفظ التقرير', variant: 'destructive' as any });
    } finally {
      setSaving(false);
    }
  }

  function onCalculate() {
    setShowErrors(true);
    const r = computeResults();
    if (r) setResults(r);
  }

  const errors = showErrors ? validate() : [];
  const errorsUI = errors.length ? (
    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-800">
      <AlertCircle className="w-6 h-6" />
      <p className="font-bold">{errors.join(" | ")}</p>
    </div>
  ) : null;

  function reset() {
    setHeightM("");
    setSlabAreaM2("");
    setFloors("");
    setRodDiameterMm("");
    setSlabThicknessCm("");
    setColumnShape("rectangle");
    setResults(null);
    setShowErrors(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50" dir="rtl">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
              <Button variant="ghost" size="sm" className="border-2 border-rose-200/50 bg-white/80 backdrop-blur-sm hover:border-rose-400 hover:bg-rose-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-rose-800 font-extrabold hover:text-rose-900 hover:drop-shadow-[0_0_10px_rgba(225,29,72,0.8)] group">
                <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                العودة إلى حاسبة الحديد
              </Button>
            </Link>
          </div>

          <div className="relative group">
            <div className="flex items-start lg:items-center gap-6 p-2">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                  <Grid3x3 className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-rose-800 bg-clip-text text-transparent leading-tight mb-2">
                  حساب حديد الأعمدة والكانات
                </h1>
                <p className="text-lg text-slate-600 font-semibold">
                  حساب دقيق لطول ووزن القضبان، مساحة المقطع، وعدد الكانات وأبعادها
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Input Section */}
          <div className="xl:col-span-7 space-y-6">
            {errorsUI}

            <Card className="border-0 shadow-2xl shadow-rose-200/50 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-rose-600 to-pink-600 text-white py-6">
                <CardTitle className="flex items-center gap-3">
                  <Calculator className="w-6 h-6" />
                  مدخلات المستخدم
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* بيانات العمود */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-rose-200">
                    <Box className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-black text-rose-900">بيانات العمود</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="heightM" label="ارتفاع العمود" value={heightM} onChange={setHeightM} unit="م" icon={ArrowUpCircle} />
                    <InputField id="slabThickness" label="سمك السقف" value={slabThicknessCm} onChange={setSlabThicknessCm} unit="سم" icon={Ruler} />
                  </div>
                </div>

                {/* بيانات البلاطة */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-pink-200">
                    <Layers className="w-5 h-5 text-pink-600" />
                    <h3 className="text-lg font-black text-pink-900">بيانات البلاطة</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="slabArea" label="مساحة البلاطة" value={slabAreaM2} onChange={setSlabAreaM2} unit="م²" icon={Box} />
                    <InputField id="floors" label="عدد الطوابق" value={floors} onChange={setFloors} unit="طابق" icon={Layers} />
                  </div>
                </div>

                {/* بيانات القضيب وشكل العمود */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b-2 border-indigo-200">
                    <Ruler className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-black text-indigo-900">بيانات القضيب وشكل العمود</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        <Ruler className="w-5 h-5" />
                        قطر القضيب
                      </Label>
                      <Select value={rodDiameterMm} onValueChange={(v) => setRodDiameterMm(v)}>
                        <SelectTrigger className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 rounded-2xl transition-all duration-300">
                          <SelectValue placeholder={loading ? "جاري التحميل..." : "اختر القطر"} />
                        </SelectTrigger>
                        <SelectContent>
                          {ironBarsData.map((item) => (
                            <SelectItem key={item.diameter} value={String(item.diameter)}>{item.diameter} ملم</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 group">
                      <Label className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        <Grid3x3 className="w-5 h-5" />
                        شكل العمود
                      </Label>
                      <Select value={columnShape} onValueChange={(v) => setColumnShape(v as any)}>
                        <SelectTrigger className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 rounded-2xl transition-all duration-300">
                          <SelectValue placeholder="اختر الشكل" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">مربع</SelectItem>
                          <SelectItem value="rectangle">مستطيل</SelectItem>
                          <SelectItem value="circle">دائري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={onCalculate} className="flex-1 h-14 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    احسب الآن
                  </Button>
                  <Button onClick={reset} variant="outline" className="h-14 border-2 border-slate-300 hover:border-rose-400 font-bold text-lg rounded-2xl px-8">
                    إعادة تعيين
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-5 space-y-6">
            <Card className="border-0 shadow-2xl shadow-pink-200/50 overflow-hidden bg-white/90 backdrop-blur-sm sticky top-8">
              <CardHeader className="bg-gradient-to-br from-pink-600 to-rose-600 text-white py-6">
                <CardTitle className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6" />
                  النتائج والمخرجات
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {results ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Main Highlights Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border-2 border-emerald-400 shadow-lg text-white">
                        <p className="text-emerald-100 font-bold mb-1">عدد القضبان العمودية</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black">{results.verticalBarsCount}</span>
                          <span className="text-xl font-bold opacity-80">قضيب</span>
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl border-2 border-blue-400 shadow-lg text-white">
                        <p className="text-blue-100 font-bold mb-1">عدد الكانات الإجمالي</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black">{Math.ceil(results.totalStirrups)}</span>
                          <span className="text-xl font-bold opacity-80">كانة</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                        <p className="text-rose-600 font-bold text-sm mb-1">طول القضيب العمودي النهائي</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-rose-900">{results.finalRodLenM.toFixed(2)}</span>
                          <span className="text-sm font-bold text-rose-700">متر</span>
                        </div>
                      </div>

                      <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100">
                        <p className="text-pink-600 font-bold text-sm mb-1">وزن الحديد للعمود</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-pink-900">{results.rodWeight.toFixed(3)}</span>
                          <span className="text-sm font-bold text-pink-700">kg</span>
                        </div>
                      </div>

                      <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <p className="text-indigo-600 font-bold text-sm mb-1">مساحة مقطع القضيب</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-indigo-900">{results.crossSectionAreaMm2.toFixed(2)}</span>
                          <span className="text-sm font-bold text-indigo-700">mm²</span>
                        </div>
                      </div>

                      <div className="p-5 bg-cyan-50 rounded-2xl border border-cyan-100">
                        <p className="text-cyan-600 font-bold text-sm mb-1">أبعاد العمود</p>
                        <p className="text-xl font-black text-cyan-900">{results.columnDimensions.displayText}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <Button onClick={saveToReports} disabled={saving} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-2xl shadow-xl transition-all">
                        {saving ? 'جاري الحفظ...' : 'حفظ وتحميل إلى التقارير'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center animate-pulse">
                      <Calculator className="w-10 h-10" />
                    </div>
                    <p className="font-bold text-lg">أدخل البيانات واضغط على "احسب الآن"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div >
  );
}
