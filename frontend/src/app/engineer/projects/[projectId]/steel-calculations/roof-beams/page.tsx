"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calculator, Layers, Ruler, TrendingUp, AlertCircle, Box, ArrowUpCircle, Grid3x3, LayoutDashboard, Send, CheckCircle2 } from "lucide-react";
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

// Helper Input Field component (same styling approach as columns page)
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
            <Label htmlFor={id} className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors flex items-center gap-2">
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
                    className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 hover:border-cyan-300 focus:border-cyan-500 transition-all duration-300 rounded-2xl pl-24"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg text-sm font-bold text-cyan-800 border border-cyan-200">
                    {unit}
                </div>
            </div>
        </div>
    );
}

export default function RoofBeamsSteelPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const router = useRouter();
    const { toast } = useToast();

    const [numBeams, setNumBeams] = useState<"1" | "2" | "3">("1");
    const [rodDiameterMm, setRodDiameterMm] = useState<string>("");
    const [beamHeightCm, setBeamHeightCm] = useState<string>("");
    const [ironCoverCm, setIronCoverCm] = useState<string>("3");

    const [beams, setBeams] = useState<{ length: string; weight: string }[]>([
        { length: "", weight: "" },
        { length: "", weight: "" },
        { length: "", weight: "" }
    ]);

    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [ironBarsData, setIronBarsData] = useState<IronBarData[]>([]);

    // Results
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Recalculation State
    const [existingReportId, setExistingReportId] = useState<string | null>(null);
    const [showRecalculationWarning, setShowRecalculationWarning] = useState(false);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchIronBars().then((data) => {
            if (mounted) setIronBarsData(data);
        }).finally(() => setLoading(false));

        // Check for existing report
        const checkExistingReport = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/quantity-reports/project/${projectId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.reports) {
                        const existingReport = data.reports.find(
                            (r: any) => r.calculationType === 'roof-beams-steel' && !r.deleted
                        );
                        if (existingReport) {
                            setExistingReportId(existingReport._id);
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking existing reports:', error);
            }
        };

        checkExistingReport();
        return () => { mounted = false; };
    }, [projectId]);

    const handleBeamChange = (index: number, field: "length" | "weight", value: string) => {
        const newBeams = [...beams];
        newBeams[index][field] = value;
        setBeams(newBeams);
    };

    function parseNum(v: string) {
        const n = Number(String(v).replace(",", "."));
        return Number.isFinite(n) ? n : NaN;
    }

    function computeResults() {
        if (!rodDiameterMm || !beamHeightCm || !ironCoverCm) {
            toast({ title: "تحذير", description: "يرجى ملء جميع الحقول الأساسية", variant: "destructive" });
            return null;
        }

        const nB = parseInt(numBeams);
        for (let i = 0; i < nB; i++) {
            if (!beams[i].length || !beams[i].weight) {
                toast({ title: "تحذير", description: `يرجى إكمال بيانات الجسر ${i + 1}`, variant: "destructive" });
                return null;
            }
        }

        const rodData = ironBarsData.find(item => String(item.diameter) === rodDiameterMm);
        if (!rodData) return null;

        const h = parseNum(beamHeightCm) / 100; // m
        const cover = parseNum(ironCoverCm) / 100; // m
        const d = h - cover;
        const dMm = d * 1000;
        const fy = 420;
        const steelFactor = 0.87;

        let momentUpper = 0;
        let momentLower = 0;

        if (numBeams === "1") {
            const L1 = parseNum(beams[0].length);
            const W1 = parseNum(beams[0].weight);
            const moment = (W1 * L1 * L1) / 8;
            momentUpper = moment; momentLower = moment;
        } else {
            const sumWL2 = beams.slice(0, nB).reduce((acc, b) => acc + (parseNum(b.weight) * Math.pow(parseNum(b.length), 2)), 0);
            momentUpper = sumWL2 / 10;
            momentLower = sumWL2 / 12;
        }

        const asUpper = (momentUpper * 1e6) / (steelFactor * fy * dMm * 0.9);
        const asLower = (momentLower * 1e6) / (steelFactor * fy * dMm * 0.9);
        const crossSectionAreaMm2 = rodData.crossSectionalAreaMm2;

        return {
            countUpper: Math.ceil(asUpper / crossSectionAreaMm2),
            countLower: Math.ceil(asLower / crossSectionAreaMm2),
            momentUpper,
            momentLower,
            asUpper,
            asLower,
            crossSectionAreaMm2,
            maxMoment: Math.max(momentUpper, momentLower)
        };
    }

    function onCalculate() {
        setError(null);
        const r = computeResults();
        if (r) {
            // Check for existing report before calculating
            if (existingReportId && !showRecalculationWarning) {
                setShowRecalculationWarning(true);
                return;
            }

            setResults({
                ...r,
                inputs: {
                    numBeams,
                    rodDiameterMm,
                    beamHeightCm,
                    ironCoverCm,
                    beams: beams.slice(0, parseInt(numBeams))
                }
            });
            toast({ title: "تم الحساب", description: "تم تحديث النتائج بنجاح" });
        }
    }

    const handleRecalculate = async () => {
        if (!existingReportId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/quantity-reports/${existingReportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                toast({
                    title: "تم الحذف",
                    description: "تم حذف التقرير السابق بنجاح. جاري إجراء الحسابات الجديدة...",
                });
                setExistingReportId(null);
                setShowRecalculationWarning(false);
                // Proceed with calculation
                onCalculate();
            } else {
                throw new Error('فشل في حذف التقرير السابق');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            toast({
                title: "خطأ",
                description: "حدث خطأ أثناء حذف التقرير السابق",
                variant: "destructive"
            });
        }
    };

    const saveToReports = async () => {
        if (!results) {
            toast({
                title: 'لا توجد نتائج',
                description: 'يرجى إجراء الحسابات أولاً',
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);
        try {
            const engineerId = localStorage.getItem('userId') || '';
            const engineerName = localStorage.getItem('userName') || 'المهندس';

            const projectRes = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);

            if (!projectRes.ok) {
                throw new Error(`HTTP error! status: ${projectRes.status}`);
            }

            const projectData = await projectRes.json();
            const project = projectData.project || projectData;

            const totalSteelWeight = results.countUpper + results.countLower;

            const reportData = {
                projectId,
                projectName: project?.name || `مشروع #${projectId}`,
                engineerId,
                engineerName,
                ownerName: project?.clientName || '',
                ownerEmail: project?.linkedOwnerEmail || '',
                calculationType: 'roof-beams-steel',
                steelData: {
                    totalSteelWeight,
                    foundationSteel: 0,
                    columnSteel: 0,
                    beamSteel: totalSteelWeight,
                    slabSteel: 0,
                    details: {
                        inputs: results.inputs,
                        results: {
                            countUpper: results.countUpper,
                            countLower: results.countLower,
                            momentUpper: results.momentUpper,
                            momentLower: results.momentLower,
                            asUpper: results.asUpper,
                            asLower: results.asLower,
                            crossSectionAreaMm2: results.crossSectionAreaMm2,
                            maxMoment: results.maxMoment
                        },
                        timestamp: new Date().toISOString()
                    }
                },
                calculationData: {
                    inputs: results.inputs,
                    results: {
                        countUpper: results.countUpper,
                        countLower: results.countLower,
                        momentUpper: results.momentUpper,
                        momentLower: results.momentLower,
                        asUpper: results.asUpper,
                        asLower: results.asLower,
                        crossSectionAreaMm2: results.crossSectionAreaMm2,
                        maxMoment: results.maxMoment
                    },
                    timestamp: new Date().toISOString()
                },
                status: 'saved',
                sentToOwner: false
            };

            const response = await fetch(`${API_BASE_URL}/api/quantity-reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
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
                throw new Error(data.message || 'فشل في حفظ التقرير');
            }
        } catch (error) {
            console.error('Error saving report:', error);
            const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ التقرير';
            toast({
                title: 'خطأ في الحفظ',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    function reset() {
        setNumBeams("1");
        setRodDiameterMm("");
        setBeamHeightCm("");
        setIronCoverCm("3");
        setBeams([{ length: "", weight: "" }, { length: "", weight: "" }, { length: "", weight: "" }]);
        setResults(null);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50" dir="rtl">
            <div className="fixed inset-0 opacity-20">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
                            <Button variant="ghost" size="sm" className="border-2 border-cyan-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-cyan-800 font-extrabold hover:text-blue-900 hover:drop-shadow-[0_0_10px_rgba(30,58,138,0.8)] group">
                                <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                                العودة إلى حاسبة الحديد
                            </Button>
                        </Link>
                    </div>

                    <div className="relative group">
                        <div className="flex items-start lg:items-center gap-6 p-2">
                            <div className="relative">
                                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                                    <LayoutDashboard className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-cyan-800 bg-clip-text text-transparent leading-tight mb-2">
                                    حساب حديد جسور السقف
                                </h1>
                                <p className="text-lg text-slate-600 font-semibold">
                                    حساب دقيق لحديد التسليح العلوي والسفلي لجسور السقف بناءً على عدد البحور
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Input Section */}
                    <div className="xl:col-span-7 space-y-6">
                        <Card className="border-0 shadow-2xl shadow-cyan-200/50 overflow-hidden bg-white/90 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white py-6">
                                <CardTitle className="flex items-center gap-3">
                                    <Calculator className="w-6 h-6" />
                                    مدخلات التصميم
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">

                                {/* بيانات الجسر العامة */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b-2 border-cyan-200">
                                        <Box className="w-5 h-5 text-cyan-600" />
                                        <h3 className="text-lg font-black text-cyan-900">البيانات الأساسية</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 group">
                                            <Label className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors flex items-center gap-2">
                                                <Layers className="w-5 h-5" />
                                                عدد جسور السقف
                                            </Label>
                                            <Select value={numBeams} onValueChange={(v: any) => setNumBeams(v)}>
                                                <SelectTrigger className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 rounded-2xl transition-all duration-300">
                                                    <SelectValue placeholder="اختر عدد الجسور" />
                                                </SelectTrigger>
                                                <SelectContent className="font-bold">
                                                    <SelectItem value="1">جسر واحد</SelectItem>
                                                    <SelectItem value="2">جسرين متصلين</SelectItem>
                                                    <SelectItem value="3">ثلاث جسور متصلة</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 group">
                                            <Label className="text-base font-bold text-slate-900 group-hover:text-cyan-600 transition-colors flex items-center gap-2">
                                                <Ruler className="w-5 h-5" />
                                                قطر القضيب
                                            </Label>
                                            <Select value={rodDiameterMm} onValueChange={(v) => setRodDiameterMm(v)}>
                                                <SelectTrigger className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 rounded-2xl transition-all duration-300">
                                                    <SelectValue placeholder={loading ? "جاري التحميل..." : "اختر القطر"} />
                                                </SelectTrigger>
                                                <SelectContent className="font-bold">
                                                    {ironBarsData.map((item) => (
                                                        <SelectItem key={item.diameter} value={String(item.diameter)}>{item.diameter} ملم</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField id="beamHeight" label="ارتفاع الجسر الكامل" value={beamHeightCm} onChange={setBeamHeightCm} unit="سم" icon={Ruler} />
                                        <InputField id="ironCover" label="تغطية الحديد (Cover)" value={ironCoverCm} onChange={setIronCoverCm} unit="سم" icon={AlertCircle} />
                                    </div>
                                </div>

                                {/* بيانات البحور */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-black text-blue-900">أبعاد وأوزان الجسور</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        {beams.slice(0, parseInt(numBeams)).map((beam, i) => (
                                            <div key={i} className="p-6 bg-slate-50/50 rounded-2xl border-2 border-slate-100 space-y-4 relative">
                                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                    {i + 1}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <InputField id={`l-${i}`} label="الطول الصافي" value={beam.length} onChange={(v) => handleBeamChange(i, "length", v)} unit="متر" icon={Ruler} />
                                                    <InputField id={`w-${i}`} label="الوزن الموزع" value={beam.weight} onChange={(v) => handleBeamChange(i, "weight", v)} unit="kN/m" icon={TrendingUp} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button onClick={onCalculate} className="flex-1 h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-lg rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02]">
                                        احسب الآن
                                    </Button>
                                    <Button onClick={reset} variant="outline" className="h-14 border-2 border-slate-300 hover:border-cyan-400 font-bold text-lg rounded-2xl px-8 transition-all">
                                        إعادة تعيين
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Results Section */}
                    <div className="xl:col-span-5 space-y-6">
                        <Card className="border-0 shadow-2xl shadow-cyan-200/50 overflow-hidden bg-white/90 backdrop-blur-sm sticky top-8">
                            <CardHeader className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white py-6">
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
                                                <p className="text-emerald-100 font-bold mb-1">تسليح القضبان العلوي</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-black">{results.countUpper}</span>
                                                    <span className="text-xl font-bold opacity-80">قطعة</span>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl border-2 border-blue-400 shadow-lg text-white">
                                                <p className="text-blue-100 font-bold mb-1">تسليح القضبان السفلي</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-black">{results.countLower}</span>
                                                    <span className="text-xl font-bold opacity-80">قطعة</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-5 bg-cyan-50 rounded-2xl border border-cyan-100">
                                                <p className="text-cyan-600 font-bold text-sm mb-1">العزم الأقصى المحسوب</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-cyan-900">{results.maxMoment.toFixed(2)}</span>
                                                    <span className="text-sm font-bold text-cyan-700">kNm</span>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                                <p className="text-blue-600 font-bold text-sm mb-1">مساحة مقطع القضيب</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-blue-900">{results.crossSectionAreaMm2.toFixed(2)}</span>
                                                    <span className="text-sm font-bold text-blue-700">mm²</span>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                                                <p className="text-indigo-600 font-bold text-sm mb-1">مساحة الحديد العلوي</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-indigo-900">{results.asUpper.toFixed(1)}</span>
                                                    <span className="text-sm font-bold text-indigo-700">mm²</span>
                                                </div>
                                            </div>

                                            <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100">
                                                <p className="text-teal-600 font-bold text-sm mb-1">مساحة الحديد السفلي</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-black text-teal-900">{results.asLower.toFixed(1)}</span>
                                                    <span className="text-sm font-bold text-teal-700">mm²</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                onClick={saveToReports}
                                                disabled={saving || !results}
                                                className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3">
                                                {saving ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        جاري الحفظ...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        حفظ وتصدير التقرير
                                                    </>
                                                )}
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