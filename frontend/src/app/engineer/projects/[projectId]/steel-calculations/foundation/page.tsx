"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Calculator,
    Blocks,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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

interface IronBar {
    _id: string;
    diameter: number;
    crossSectionalAreaCm2: number;
    crossSectionalAreaMm2: number;
}

interface Foundation {
    id: number;
    length: string;
    width: string;
}

interface ReinforcementRow {
    type: string;
    numberOfBars: number;
    barLength: number;
}

export default function FoundationCalculationPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const projectId = params.projectId as string;

    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Input fields
    const [selectedBarDiameter, setSelectedBarDiameter] = useState<string>('16'); // Default to 16mm
    const [areSimilar, setAreSimilar] = useState<boolean>(true);
    const [barSpacing, setBarSpacing] = useState<string>('0.20'); // Default to 20cm spacing

    // For similar foundations
    const [foundationLength, setFoundationLength] = useState<string>('');
    const [foundationWidth, setFoundationWidth] = useState<string>('');
    const [numberOfFoundations, setNumberOfFoundations] = useState<string>('');

    // For different foundations
    const [foundations, setFoundations] = useState<Foundation[]>([
        { id: 1, length: '', width: '' }
    ]);

    // Results
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Existing report detection
    const [existingReportId, setExistingReportId] = useState<string | null>(null);
    const [showRecalculationWarning, setShowRecalculationWarning] = useState(false);

    // Check for existing reports
    useEffect(() => {
        const checkExistingReport = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/quantity-reports/project/${projectId}`);
                const data = await response.json();
                if (data.success && data.reports) {
                    const foundationSteelReport = data.reports.find(
                        (report: any) => report.calculationType === 'foundation-steel' && !report.deleted
                    );
                    if (foundationSteelReport) {
                        setExistingReportId(foundationSteelReport._id);
                    }
                }
            } catch (error) {
                console.error('Error checking existing report:', error);
            }
        };

        checkExistingReport();
    }, [projectId]);

    const addFoundation = () => {
        const newId = foundations.length + 1;
        setFoundations([...foundations, { id: newId, length: '', width: '' }]);
    };

    const removeFoundation = (id: number) => {
        if (foundations.length > 1) {
            setFoundations(foundations.filter(f => f.id !== id));
        }
    };

    const updateFoundation = (id: number, field: 'length' | 'width', value: string) => {
        setFoundations(foundations.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const validateInputs = (): boolean => {

        if (areSimilar) {
            if (!foundationLength || parseFloat(foundationLength) <= 0) {
                setError('طول القاعدة يجب أن يكون أكبر من صفر');
                return false;
            }
            if (!foundationWidth || parseFloat(foundationWidth) <= 0) {
                setError('عرض القاعدة يجب أن يكون أكبر من صفر');
                return false;
            }
            if (!numberOfFoundations || parseInt(numberOfFoundations) <= 0) {
                setError('عدد القواعد يجب أن يكون أكبر من صفر');
                return false;
            }
        } else {
            for (const f of foundations) {
                if (!f.length || parseFloat(f.length) <= 0) {
                    setError(`طول القاعدة ${f.id} يجب أن يكون أكبر من صفر`);
                    return false;
                }
                if (!f.width || parseFloat(f.width) <= 0) {
                    setError(`عرض القاعدة ${f.id} يجب أن يكون أكبر من صفر`);
                    return false;
                }
            }
        }

        return true;
    };

    const calculateFoundation = (length: number, width: number) => {
        const spacing = parseFloat(barSpacing) || 0.20; // المسافة بين القضبان بالمتر

        // جميع القيم بالأمتار
        const lengthM = length; // طول القاعدة بالأمتار
        const widthM = width; // عرض القاعدة بالأمتار
        const spacingM = spacing; // المسافة بين القضبان بالأمتار

        // Upper and lower reinforcement
        const reinforcement: ReinforcementRow[] = [
            {
                type: 'التسليح القصير السفلي',
                numberOfBars: Math.ceil((lengthM - 0.10) / spacingM), // (طول القاعدة - 0.1 متر) / المسافة بين القضبان
                barLength: widthM - 0.10 // عرض القاعدة - 0.1 متر
            },
            {
                type: 'التسليح الطويل السفلي',
                numberOfBars: Math.ceil((widthM - 0.10) / spacingM), // (عرض القاعدة - 0.1 متر) / المسافة بين القضبان
                barLength: lengthM - 0.10 // طول القاعدة - 0.1 متر
            },
            {
                type: 'التسليح الطويل العلوي',
                numberOfBars: 4, // Fixed
                barLength: lengthM - 0.10 // طول القاعدة - 0.1 متر
            },
            {
                type: 'التسليح القصير العلوي',
                numberOfBars: 4, // Fixed
                barLength: lengthM // طول القاعدة بالأمتار
            }
        ];

        return {
            reinforcement
        };
    };

    const calculate = () => {
        setError(null);
        if (!validateInputs()) return;

        // Check if there's an existing report
        if (existingReportId && !showRecalculationWarning) {
            setShowRecalculationWarning(true);
            return;
        }

        setIsLoading(true);

        try {
            if (areSimilar) {
                const length = parseFloat(foundationLength);
                const width = parseFloat(foundationWidth);
                const numFoundations = parseInt(numberOfFoundations);
                const result = calculateFoundation(length, width);

                setResults({
                    type: 'similar',
                    ...result,
                    foundationLength: length,
                    foundationWidth: width,
                    numberOfFoundations: numFoundations
                });
            } else {
                const allResults = foundations.map(f => {
                    const length = parseFloat(f.length);
                    const width = parseFloat(f.width);
                    return {
                        id: f.id,
                        ...calculateFoundation(length, width),
                        foundationLength: length,
                        foundationWidth: width
                    };
                });

                setResults({
                    type: 'different',
                    foundations: allResults
                });
            }

            toast({
                title: 'تم الحساب بنجاح',
                description: 'تم حساب كميات حديد القواعد',
            });
        } catch (e) {
            setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
            console.error('Calculation error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecalculate = async () => {
        // Soft delete the existing report first
        if (existingReportId) {
            try {
                await fetch(`${API_BASE_URL}/api/quantity-reports/${existingReportId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setExistingReportId(null);
            } catch (error) {
                console.error('Error deleting old report:', error);
            }
        }

        setShowRecalculationWarning(false);
        // Now proceed with calculation
        calculate();
    };

    const reset = () => {
        setAreSimilar(true);
        setFoundationLength('');
        setFoundationWidth('');
        setNumberOfFoundations('');
        setFoundations([{ id: 1, length: '', width: '' }]);
        setResults(null);
        setError(null);
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

            const reportData = {
                projectId,
                projectName: project?.name || `مشروع #${projectId}`,
                engineerId,
                engineerName,
                ownerName: project?.clientName || '',
                ownerEmail: project?.linkedOwnerEmail || '',
                calculationType: 'foundation-steel',
                steelData: {
                    totalSteelWeight: 0,
                    foundationSteel: 0,
                    columnSteel: 0,
                    beamSteel: 0,
                    slabSteel: 0,
                    details: {
                        inputs: {
                            barDiameter: selectedBarDiameter,
                            areSimilar,
                            foundationLength: results.type === 'similar' ? results.foundationLength : null,
                            foundationWidth: results.type === 'similar' ? results.foundationWidth : null,
                            foundations: results.type === 'different' ? results.foundations : null
                        },
                        results: results,
                        timestamp: new Date().toISOString()
                    }
                },
                calculationData: {
                    inputs: {
                        areSimilar,
                    },
                    results: results,
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
            <div className="fixed inset-0 opacity-20">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
                {/* Header */}
                <div className="mb-12 lg:mb-16">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
                                <Button variant="ghost" size="sm" className="border-2 border-green-200/50 bg-white/80 backdrop-blur-sm hover:border-green-400 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-green-800 font-extrabold hover:text-green-900 hover:drop-shadow-[0_0_10px_rgba(21,128,61,0.8)] group">
                                    <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                                    العودة إلى حاسبة الحديد
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="flex items-start lg:items-center gap-6 p-2">
                            <div className="relative">
                                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                                    <Blocks className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                                    <Blocks className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-green-800 bg-clip-text text-transparent leading-tight mb-4">
                                    حساب حديد القواعد
                                </h1>
                                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                                    احسب كميات حديد U والتسليح العلوي والسفلي للقواعد بدقة عالية
                                </p>
                            </div>
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 via-emerald-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
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
                        <Card className="border-0 shadow-xl shadow-green-200/50 hover:shadow-green-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-6 px-6 border-b border-white/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                                        <Calculator className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">بيانات الحساب</CardTitle>
                                        <CardDescription className="text-green-100 text-base">
                                            أدخل البيانات المطلوبة لحساب كميات حديد القواعد
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        {/* Bar Spacing */}
                                        <InputField
                                            id="barSpacing"
                                            label="المسافة بين قضبان الحديد (متر)"
                                            value={barSpacing}
                                            onChange={setBarSpacing}
                                            unit="متر"
                                            icon={Ruler}
                                        />

                                        {/* Bar Diameter */}
                                        <div className="group">
                                        </div>
                                    </div>

                                    {/* Similar/Different Toggle */}
                                    <div className="space-y-4">
                                        <Label className="text-base font-bold text-slate-900">هل القواعد متشابهة؟</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setAreSimilar(true)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${areSimilar
                                                    ? 'border-green-500 bg-green-50 shadow-lg'
                                                    : 'border-gray-200 bg-white hover:border-green-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">✓</div>
                                                <h3 className="font-bold text-lg text-gray-800">متشابهة</h3>
                                                <p className="text-sm text-gray-600">جميع القواعد بنفس الأبعاد</p>
                                            </button>
                                            <button
                                                onClick={() => setAreSimilar(false)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${!areSimilar
                                                    ? 'border-green-500 bg-green-50 shadow-lg'
                                                    : 'border-gray-200 bg-white hover:border-green-300'
                                                    }`}
                                            >
                                                <div className="text-2xl mb-2">≠</div>
                                                <h3 className="font-bold text-lg text-gray-800">مختلفة</h3>
                                                <p className="text-sm text-gray-600">أبعاد مختلفة لكل قاعدة</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Foundation Inputs */}
                                    {areSimilar ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <InputField
                                                    id="foundationLength"
                                                    label="طول القاعدة (متر)"
                                                    value={foundationLength}
                                                    onChange={setFoundationLength}
                                                    unit="متر"
                                                    icon={Ruler}
                                                />
                                                <InputField
                                                    id="foundationWidth"
                                                    label="عرض القاعدة (متر)"
                                                    value={foundationWidth}
                                                    onChange={setFoundationWidth}
                                                    unit="متر"
                                                    icon={Ruler}
                                                />
                                            </div>
                                            <InputField
                                                id="numberOfFoundations"
                                                label="عدد القواعد"
                                                value={numberOfFoundations}
                                                onChange={setNumberOfFoundations}
                                                unit="قاعدة"
                                                icon={Blocks}
                                                type="number"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {foundations.map((foundation, index) => (
                                                <div key={foundation.id} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-slate-900">قاعدة {foundation.id}</h4>
                                                        {foundations.length > 1 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeFoundation(foundation.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <InputField
                                                            id={`length-${foundation.id}`}
                                                            label="الطول (متر)"
                                                            value={foundation.length}
                                                            onChange={(v) => updateFoundation(foundation.id, 'length', v)}
                                                            unit="متر"
                                                            icon={Ruler}
                                                        />
                                                        <InputField
                                                            id={`width-${foundation.id}`}
                                                            label="العرض (متر)"
                                                            value={foundation.width}
                                                            onChange={(v) => updateFoundation(foundation.id, 'width', v)}
                                                            unit="متر"
                                                            icon={Ruler}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                onClick={addFoundation}
                                                variant="outline"
                                                className="w-full h-12 border-2 border-green-300 hover:border-blue-600 hover:bg-blue-600 hover:text-white text-green-700 transition-all duration-300"
                                            >
                                                <Plus className="w-5 h-5 ml-2" />
                                                إضافة قاعدة
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-8">
                                        <Button
                                            onClick={calculate}
                                            disabled={isLoading}
                                            className="flex-1 h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl"
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
                                            className="h-14 border-2 border-slate-300 hover:border-green-400 hover:bg-green-50 hover:text-green-800 shadow-xl"
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
                        <Card className="border-0 shadow-xl shadow-green-200/50 hover:shadow-green-300/60 backdrop-blur-sm bg-white/90 transition-all duration-500 overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-700 to-teal-600 text-white py-6 border-b border-white/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">النتائج</CardTitle>
                                        <CardDescription className="text-green-100">
                                            نتائج حساب حديد القواعد
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {results ? (
                                    <div className="space-y-6">
                                        {results.type === 'similar' ? (
                                            <>
                                                {/* Number of Foundations Display */}
                                                <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl border-2 border-green-300 text-white text-center">
                                                    <h3 className="font-bold text-lg mb-2">عدد القواعد</h3>
                                                    <div className="text-4xl font-black">{results.numberOfFoundations}</div>
                                                    <p className="text-sm text-green-100 mt-1">قاعدة</p>
                                                </div>

                                                {/* Clarification Message */}
                                                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <span className="text-white text-xs font-bold">ℹ</span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-blue-900">
                                                            النتائج التالية هي <span className="underline">لكل قاعدة واحدة</span>
                                                        </p>
                                                    </div>
                                                </div>


                                                {/* Reinforcement Table */}
                                                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                                                    <h3 className="font-bold text-slate-900 mb-4 text-lg">التسليح العلوي والسفلي</h3>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="text-right font-bold">نوع التسليح</TableHead>
                                                                <TableHead className="text-right font-bold">عدد القضبان</TableHead>
                                                                <TableHead className="text-right font-bold">طول القضيب (م)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {results.reinforcement.map((row: ReinforcementRow, index: number) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-semibold">{row.type}</TableCell>
                                                                    <TableCell>{row.numberOfBars}</TableCell>
                                                                    <TableCell>{row.barLength.toFixed(2)}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Number of Foundations Display for Different Foundations */}
                                                <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl border-2 border-green-300 text-white text-center">
                                                    <h3 className="font-bold text-lg mb-2">عدد القواعد</h3>
                                                    <div className="text-4xl font-black">{results.foundations.length}</div>
                                                    <p className="text-sm text-green-100 mt-1">قاعدة</p>
                                                </div>

                                                {results.foundations.map((foundation: any, idx: number) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-4">
                                                        <h3 className="font-bold text-slate-900 text-lg">قاعدة {foundation.id}</h3>


                                                        {/* Reinforcement Table */}
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="text-right text-xs font-bold">نوع التسليح</TableHead>
                                                                    <TableHead className="text-right text-xs font-bold">عدد</TableHead>
                                                                    <TableHead className="text-right text-xs font-bold">طول (م)</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {foundation.reinforcement.map((row: ReinforcementRow, index: number) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell className="text-xs font-semibold">{row.type}</TableCell>
                                                                        <TableCell className="text-xs">{row.numberOfBars}</TableCell>
                                                                        <TableCell className="text-xs">{row.barLength.toFixed(2)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                ))}
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

            {/* Recalculation Warning Dialog */}
            <AlertDialog open={showRecalculationWarning} onOpenChange={setShowRecalculationWarning}>
                <AlertDialogContent dir="rtl" className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6" />
                            تحذير: تقرير موجود مسبقاً
                        </AlertDialogTitle>
                        <div className="text-lg text-slate-700 leading-relaxed space-y-3 mt-4">
                            <p className="font-semibold">
                                يوجد تقرير سابق لحديد القواعد لهذا المشروع.
                            </p>
                            <p>
                                في حال اختيار إعادة الحساب، سيتم حذف التقرير السابق واستبداله بالتقرير الجديد.
                            </p>
                            <div className="bg-orange-50 border-r-4 border-orange-400 p-4 rounded-lg">
                                <p className="text-orange-800 font-semibold">
                                    ⚠️ ملاحظة: لن يكون بالإمكان استرجاع التقرير القديم بعد الحذف.
                                </p>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50">
                            إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRecalculate}
                            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold"
                        >
                            إعادة الحساب واستبدال التقرير
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
    unit,
    icon: Icon,
    type = "number",
    containerClassName = ""
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    unit?: string;
    icon?: any;
    type?: string;
    containerClassName?: string;
}) {
    return (
        <div className={`group ${containerClassName}`}>
            <Label htmlFor={id} className="text-base font-bold text-slate-900 mb-4 block flex items-center gap-2">
                {Icon && <Icon className="w-5 h-5 text-green-500" />}
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 text-lg font-bold text-right pr-4 bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-green-300 focus:border-green-500 shadow-xl focus:shadow-green-200/50 transition-all duration-400 rounded-2xl backdrop-blur-sm"
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

function ResultRow({ label, value, unit, highlight = false }: { label: string; value: any; unit: string; highlight?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-2 rounded-lg ${highlight ? 'bg-green-100 border border-green-300' : ''}`}>
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className={`text-lg font-black ${highlight ? 'text-green-700' : 'text-slate-900'}`}>{value}</span>
                <span className="text-xs text-slate-500 font-bold">{unit}</span>
            </div>
        </div>
    );
}