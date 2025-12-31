"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Calculator,
    Building2,
    Ruler,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Send,
    Plus,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { API_BASE_URL } from '@/lib/api';

interface Beam {
    id: number;
    height: string;
    width: string;
}

interface IronBar {
    _id: string;
    diameter: number;
    crossSectionalAreaCm2: number;
    crossSectionalAreaMm2: number;
}

export default function GroundBeamsCalculationPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const projectId = params.projectId as string;

    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Iron bars data
    const [ironBars, setIronBars] = useState<IronBar[]>([]);

    // Input fields
    const [beamHeight, setBeamHeight] = useState<string>('');
    const [beamWidth, setBeamWidth] = useState<string>('');
    const [numberOfBeams, setNumberOfBeams] = useState<string>('');
    const [selectedBarDiameter, setSelectedBarDiameter] = useState<string>('');
    const [areSimilar, setAreSimilar] = useState<boolean>(true);

    // For different beams
    const [beams, setBeams] = useState<Beam[]>([
        { id: 1, height: '', width: '' }
    ]);

    // Calculated cross-sectional area
    const [crossSectionalArea, setCrossSectionalArea] = useState<number>(0);

    // Results
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);


    const handleBarDiameterChange = (diameter: string) => {
        setSelectedBarDiameter(diameter);
        const selectedBar = ironBars.find(bar => bar.diameter.toString() === diameter);
        if (selectedBar) {
            setCrossSectionalArea(selectedBar.crossSectionalAreaCm2);
        }
    };

    const addBeam = () => {
        const newId = beams.length + 1;
        setBeams([...beams, { id: newId, height: '', width: '' }]);
    };

    const removeBeam = (id: number) => {
        if (beams.length > 1) {
            setBeams(beams.filter(b => b.id !== id));
        }
    };

    // Fetch iron bars data
    useEffect(() => {
        const fetchIronBars = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/engineering-data/iron-bars`);
                const data = await response.json();
                if (data.success) {
                    // Filter bars to only show diameters 12-20
                    const filteredBars = data.data.filter((bar: IronBar) =>
                        bar.diameter >= 12 && bar.diameter <= 20
                    );
                    setIronBars(filteredBars);
                }
            } catch (error) {
                console.error('Error fetching iron bars:', error);
                toast({
                    title: 'خطأ',
                    description: 'فشل في تحميل بيانات قضبان الحديد',
                    variant: 'destructive'
                });
            }
        };

        fetchIronBars();
    }, [toast]);

    const updateBeam = (id: number, field: 'height' | 'width', value: string) => {
        setBeams(beams.map(b =>
            b.id === id ? { ...b, [field]: value } : b
        ));
    };

    const validateInputs = (): boolean => {
        if (!selectedBarDiameter) {
            setError('يرجى اختيار قطر القضيب');
            return false;
        }

        if (areSimilar) {
            if (!beamHeight || parseFloat(beamHeight) <= 0) {
                setError('ارتفاع الجسر يجب أن يكون أكبر من صفر');
                return false;
            }
            if (!beamWidth || parseFloat(beamWidth) <= 0) {
                setError('عرض الجسر يجب أن يكون أكبر من صفر');
                return false;
            }
            if (!numberOfBeams || parseInt(numberOfBeams) <= 0) {
                setError('عدد الجسور يجب أن يكون أكبر من صفر');
                return false;
            }
        } else {
            for (const b of beams) {
                if (!b.height || parseFloat(b.height) <= 0) {
                    setError(`ارتفاع الجسر ${b.id} يجب أن يكون أكبر من صفر`);
                    return false;
                }
                if (!b.width || parseFloat(b.width) <= 0) {
                    setError(`عرض الجسر ${b.id} يجب أن يكون أكبر من صفر`);
                    return false;
                }
            }
        }

        return true;
    };

    const calculateBarsPerBeam = (height: number, width: number): number => {
        // Bars = ((height - 5) × width × 0.004) / cross-sectional area
        const bars = ((height - 5) * width * 0.004) / crossSectionalArea;
        return Math.ceil(bars); // Round up
    };

    const calculate = () => {
        setError(null);
        if (!validateInputs()) return;

        setIsLoading(true);

        try {
            if (areSimilar) {
                const height = parseFloat(beamHeight);
                const width = parseFloat(beamWidth);
                const numBeams = parseInt(numberOfBeams);
                const barsPerBeam = calculateBarsPerBeam(height, width);
                const totalBars = barsPerBeam * numBeams;

                setResults({
                    type: 'similar',
                    beamHeight: height,
                    beamWidth: width,
                    numberOfBeams: numBeams,
                    barsPerBeam,
                    totalBars,
                    barDiameter: selectedBarDiameter,
                    crossSectionalArea
                });
            } else {
                const allResults = beams.map(b => {
                    const height = parseFloat(b.height);
                    const width = parseFloat(b.width);
                    const barsPerBeam = calculateBarsPerBeam(height, width);
                    return {
                        id: b.id,
                        height,
                        width,
                        barsPerBeam
                    };
                });

                const totalBars = allResults.reduce((sum, r) => sum + r.barsPerBeam, 0);

                setResults({
                    type: 'different',
                    beams: allResults,
                    totalBars,
                    barDiameter: selectedBarDiameter,
                    crossSectionalArea
                });
            }

            toast({
                title: 'تم الحساب بنجاح',
                description: 'تم حساب كميات حديد الجسور الأرضية',
            });
        } catch (e) {
            setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
            console.error('Calculation error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setBeamHeight('');
        setBeamWidth('');
        setNumberOfBeams('');
        setSelectedBarDiameter('');
        setCrossSectionalArea(0);
        setAreSimilar(true);
        setBeams([{ id: 1, height: '', width: '' }]);
        setResults(null);
        setError(null);
    };

    // Check for existing report
    const [existingReport, setExistingReport] = useState<any>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const checkExistingReport = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/quantity-reports/project/${projectId}`);
                const data = await response.json();
                if (data.success) {
                    const report = data.reports.find((r: any) => r.calculationType === 'ground-beams-steel' && !r.deleted);
                    if (report) {
                        setExistingReport(report);
                    }
                }
            } catch (error) {
                console.error('Error checking existing report:', error);
            }
        };

        checkExistingReport();
    }, [projectId]);

    const handleCalculateClick = () => {
        if (existingReport) {
            setShowConfirmDialog(true);
        } else {
            calculate();
        }
    };

    const confirmRecalculate = () => {
        setShowConfirmDialog(false);
        calculate();
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

            const projectRes = await fetch(`${API_BASE_URL}/projects/${projectId}`);
            if (!projectRes.ok) {
                throw new Error(`HTTP error! status: ${projectRes.status}`);
            }

            const projectData = await projectRes.json();
            const project = projectData.project || projectData;

            const reportData = {
                projectId,
                projectName: project?.name || `مشروع #${projectId}`,
                engineerId,
                engineerName,
                ownerName: project?.clientName || '',
                ownerEmail: project?.linkedOwnerEmail || '',
                calculationType: 'ground-beams-steel',
                steelData: {
                    totalSteelWeight: results.totalBars, // Using total bars count as weight proxy for now based on request context, usually needs weight calc
                    foundationSteel: 0,
                    columnSteel: 0,
                    beamSteel: results.totalBars,
                    slabSteel: 0,
                    details: {
                        results: results,
                        timestamp: new Date().toISOString()
                    }
                },
                calculationData: {
                    results: results,
                    timestamp: new Date().toISOString()
                },
                status: 'saved',
                sentToOwner: existingReport ? existingReport.sentToOwner : false
            };

            const response = await fetch(`${API_BASE_URL}/quantity-reports`, {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" dir="rtl">
            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border-2 border-orange-100">
                        <div className="flex items-center gap-4 mb-4 text-orange-600">
                            <AlertCircle className="w-8 h-8" />
                            <h3 className="text-xl font-bold">تنبيه إعادة الحساب</h3>
                        </div>
                        <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                            يوجد تقرير سابق محفوظ لهذا المشروع. إجراء عملية الحساب مرة أخرى سيؤدي إلى <span className="font-bold text-red-600">استبدال التقرير الحالي</span> بالنتائج الجديدة.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmDialog(false)}
                                className="border-slate-300 hover:bg-slate-50"
                            >
                                إلغاء
                            </Button>
                            <Button
                                onClick={confirmRecalculate}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                متابعة واستبدال
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed inset-0 opacity-20">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
                {/* Header */}
                <div className="mb-12 lg:mb-16">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
                                <Button variant="ghost" size="sm" className="border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm hover:border-emerald-400 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-emerald-800 font-extrabold hover:text-emerald-900 hover:drop-shadow-[0_0_10px_rgba(6,95,70,0.8)] group">
                                    <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                                    العودة إلى حاسبة الحديد
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="flex items-start lg:items-center gap-6 p-2">
                            <div className="relative">
                                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                                    <Building2 className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-400 to-amber-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                                    <Building2 className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-orange-800 bg-clip-text text-transparent leading-tight mb-4">
                                    حساب حديد الجسور الأرضية
                                </h1>
                                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                                    احسب كميات حديد التسليح للجسور الأرضية بدقة عالية
                                </p>
                            </div>
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-orange-400/20 via-amber-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Left Column - Inputs */}
                    <div className="xl:col-span-7 space-y-6 lg:space-y-8">
                        {/* Error Alert */}
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

                        {/* Input Form */}
                        <Card className="border-0 shadow-xl shadow-orange-200/50 hover:shadow-orange-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white py-6 px-6 border-b border-white/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                                        <Calculator className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">بيانات الحساب</CardTitle>
                                        <CardDescription className="text-orange-100 text-base">
                                            أدخل البيانات المطلوبة لحساب كميات حديد الجسور الأرضية
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    {/* Bar Diameter */}
                                    <div className="group">
                                        <Label htmlFor="barDiameter" className="text-base font-bold text-slate-900 mb-4 block flex items-center gap-2">
                                            <Ruler className="w-5 h-5 text-orange-500" />
                                            قطر القضيب (ملم)
                                        </Label>
                                        <Select value={selectedBarDiameter} onValueChange={handleBarDiameterChange}>
                                            <SelectTrigger className="h-14 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-orange-300 focus:border-orange-500 shadow-xl focus:shadow-orange-200/50 transition-all duration-400 rounded-2xl backdrop-blur-sm">
                                                <SelectValue placeholder="اختر قطر القضيب" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ironBars.map((bar) => (
                                                    <SelectItem key={bar._id} value={bar.diameter.toString()}>
                                                        {bar.diameter} ملم
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {crossSectionalArea > 0 && (
                                            <p className="text-sm text-slate-600 mt-2">
                                                مساحة المقطع: {crossSectionalArea.toFixed(2)} سم²
                                            </p>
                                        )}
                                    </div>

                                    {/* Similar/Different Toggle */}
                                    <div className="space-y-4">
                                        <Label className="text-base font-bold text-slate-900">هل الجسور متساوية في العرض والارتفاع؟</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setAreSimilar(true)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${areSimilar
                                                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                                                    : 'border-gray-200 bg-white hover:border-orange-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">✓</div>
                                                <h3 className="font-bold text-lg text-gray-800">متساوية</h3>
                                                <p className="text-sm text-gray-600">جميع الجسور بنفس الأبعاد</p>
                                            </button>
                                            <button
                                                onClick={() => setAreSimilar(false)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${!areSimilar
                                                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                                                    : 'border-gray-200 bg-white hover:border-orange-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">≠</div>
                                                <h3 className="font-bold text-lg text-gray-800">مختلفة</h3>
                                                <p className="text-sm text-gray-600">أبعاد مختلفة لكل جسر</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Beam Inputs */}
                                    {areSimilar ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <InputField
                                                    id="beamHeight"
                                                    label="ارتفاع الجسر الأرضي (سم)"
                                                    value={beamHeight}
                                                    onChange={setBeamHeight}
                                                    unit="سم"
                                                    icon={Ruler}
                                                />
                                                <InputField
                                                    id="beamWidth"
                                                    label="عرض الجسر الأرضي (سم)"
                                                    value={beamWidth}
                                                    onChange={setBeamWidth}
                                                    unit="سم"
                                                    icon={Ruler}
                                                />
                                            </div>
                                            <InputField
                                                id="numberOfBeams"
                                                label="عدد الجسور الأرضية"
                                                value={numberOfBeams}
                                                onChange={setNumberOfBeams}
                                                unit="جسر"
                                                icon={Building2}
                                                type="number"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {beams.map((beam) => (
                                                <div key={beam.id} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-slate-900">جسر {beam.id}</h4>
                                                        {beams.length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeBeam(beam.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <InputField
                                                            id={`height-${beam.id}`}
                                                            label="الارتفاع (سم)"
                                                            value={beam.height}
                                                            onChange={(v) => updateBeam(beam.id, 'height', v)}
                                                            unit="سم"
                                                            icon={Ruler}
                                                        />
                                                        <InputField
                                                            id={`width-${beam.id}`}
                                                            label="العرض (سم)"
                                                            value={beam.width}
                                                            onChange={(v) => updateBeam(beam.id, 'width', v)}
                                                            unit="سم"
                                                            icon={Ruler}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                onClick={addBeam}
                                                variant="outline"
                                                className="w-full h-12 border-2 border-orange-300 hover:border-blue-500 hover:bg-blue-500 text-orange-700 hover:text-white font-bold transition-all duration-300"
                                            >
                                                <Plus className="w-5 h-5 ml-2" />
                                                إضافة جسر
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-8">
                                        <Button
                                            onClick={handleCalculateClick}
                                            disabled={isLoading}
                                            className="flex-1 h-14 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    جاري الحساب...
                                                </>
                                            ) : (
                                                <>
                                                    <Calculator className="w-5 h-5 ml-2" />
                                                    حساب الكميات
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={reset}
                                            variant="outline"
                                            className="h-14 border-2 border-slate-300 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800 shadow-xl"
                                        >
                                            <CheckCircle2 className="w-5 h-5 ml-2" />
                                            إعادة تعيين
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Results */}
                    <div className="xl:col-span-5 space-y-6">
                        <Card className="border-0 shadow-xl shadow-orange-200/50 hover:shadow-orange-300/60 backdrop-blur-sm bg-white/90 transition-all duration-500 overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-orange-600 via-amber-700 to-yellow-600 text-white py-6 border-b border-white/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">النتائج</CardTitle>
                                        <CardDescription className="text-orange-100">
                                            نتائج حساب حديد الجسور الأرضية
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {results ? (
                                    <div className="space-y-6">
                                        {results.type === 'similar' ? (
                                            <>
                                                {/* Number of Beams */}
                                                <div className="p-4 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl border-2 border-orange-300 text-white text-center">
                                                    <h3 className="font-bold text-lg mb-2">عدد الجسور</h3>
                                                    <div className="text-4xl font-black">{results.numberOfBeams}</div>
                                                    <p className="text-sm text-orange-100 mt-1">جسر</p>
                                                </div>

                                                {/* Info Message */}
                                                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-white text-xs font-bold">ℹ</span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-blue-900">
                                                            النتائج التالية هي <span className="underline">لكل جسر واحد</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Results */}
                                                <div className="space-y-4">
                                                    <ResultCard label="عدد القضبان في الجسر الواحد" value={results.barsPerBeam} unit="قضيب" />
                                                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                                                        <ResultCard label="المجموع الكلي لجميع الجسور" value={results.totalBars} unit="قضيب" highlight />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Number of Beams for Different */}
                                                <div className="p-4 bg-gradient-to-br from-orange-600 to-amber-600 rounded-xl border-2 border-orange-300 text-white text-center">
                                                    <h3 className="font-bold text-lg mb-2">عدد الجسور</h3>
                                                    <div className="text-4xl font-black">{results.beams.length}</div>
                                                    <p className="text-sm text-orange-100 mt-1">جسر</p>
                                                </div>

                                                {/* Individual Beam Results */}
                                                {results.beams.map((beam: any) => (
                                                    <div key={beam.id} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                                                        <h4 className="font-bold text-slate-900 mb-3">جسر {beam.id}</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-600">الارتفاع:</span>
                                                                <span className="font-bold">{beam.height} سم</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-600">العرض:</span>
                                                                <span className="font-bold">{beam.width} سم</span>
                                                            </div>
                                                            <div className="flex justify-between pt-2 border-t">
                                                                <span className="text-slate-700 font-semibold">عدد القضبان:</span>
                                                                <span className="font-black text-orange-700">{beam.barsPerBeam} قضيب</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Total */}
                                                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                                                    <ResultCard label="المجموع الكلي لجميع الجسور" value={results.totalBars} unit="قضيب" highlight />
                                                </div>
                                            </>
                                        )}

                                        {/* Save Button */}
                                        <div className="space-y-4">
                                            <Button
                                                onClick={saveToReports}
                                                disabled={saving}
                                                className="w-full h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl"
                                            >
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
                                                        <Send className="w-5 h-5 ml-2" />
                                                        ترحيل إلى التقارير
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-slate-200">
                                            <Calculator className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-4">جاهز للحسابات</h3>
                                        <p className="text-slate-600 max-w-md mx-auto">
                                            املأ البيانات واضغط "حساب الكميات" للحصول على النتائج
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
    unit,
    icon: Icon,
    type = "number"
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    unit?: string;
    icon?: any;
    type?: string;
}) {
    return (
        <div className="group">
            <Label htmlFor={id} className="text-base font-bold text-slate-900 mb-4 block flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-orange-500" />}
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 text-lg font-bold text-right pr-4 bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-orange-300 focus:border-orange-500 shadow-xl focus:shadow-orange-200/50 transition-all duration-400 rounded-2xl backdrop-blur-sm"
                />
                {unit && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-xl shadow-md">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

function ResultCard({ label, value, unit, highlight = false }: { label: string; value: any; unit: string; highlight?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg ${highlight ? 'bg-orange-100 border-2 border-orange-300' : 'bg-slate-50'}`}>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black ${highlight ? 'text-orange-700' : 'text-slate-900'}`}>{value}</span>
                <span className="text-xs text-slate-500 font-bold">{unit}</span>
            </div>
        </div>
    );
}
