"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Calculator,
    Layers,
    Ruler,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Send,
    Building2
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

interface BuildingType {
    buildingType: string;
    liveLoad: number;
    deadLoad: number;
}

export default function RoofRibsCalculationPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const projectId = params.projectId as string;

    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Iron bars data
    const [ironBars, setIronBars] = useState<IronBar[]>([]);
    const [selectedBarDiameter, setSelectedBarDiameter] = useState<string>('');
    const [barCrossSectionalArea, setBarCrossSectionalArea] = useState<number>(0);

    // Building types data
    const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
    const [selectedBuildingType, setSelectedBuildingType] = useState<string>('');
    const [liveLoad, setLiveLoad] = useState<number>(0);
    const [deadLoad, setDeadLoad] = useState<number>(0);

    // Input fields
    const [reinforcementRatio, setReinforcementRatio] = useState<string>('');
    const [roofBeamLength, setRoofBeamLength] = useState<string>('');
    const [effectiveDepth, setEffectiveDepth] = useState<string>('');
    const [ribSpacing, setRibSpacing] = useState<string>('');
    const [numberOfRibs, setNumberOfRibs] = useState<string>('');

    // Results
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Recalculation State
    const [existingReportId, setExistingReportId] = useState<string | null>(null);
    const [showRecalculationWarning, setShowRecalculationWarning] = useState(false);

    // Check for existing reports
    useEffect(() => {
        const checkExistingReport = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/quantity-reports/project/${projectId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.reports) {
                        const existingReport = data.reports.find(
                            (r: any) => r.calculationType === 'roof-ribs-steel' && !r.deleted
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
    }, [projectId]);

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
                calculate();
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

    // Fetch iron bars data
    useEffect(() => {
        const fetchIronBars = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/engineering-data/iron-bars`);
                const data = await response.json();
                if (data.success) {
                    setIronBars(data.data);
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
    }, []);

    // Fetch building types with loads
    useEffect(() => {
        const fetchBuildingTypes = async () => {
            try {
                const [liveLoadsRes, deadLoadsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/engineering-data/live-loads`),
                    fetch(`${API_BASE_URL}/api/engineering-data/dead-loads`)
                ]);

                const liveLoadsData = await liveLoadsRes.json();
                const deadLoadsData = await deadLoadsRes.json();

                if (liveLoadsData.success && deadLoadsData.success) {
                    // Create a map of building types with their loads
                    const buildingTypesMap = new Map<string, BuildingType>();

                    liveLoadsData.data.forEach((item: any) => {
                        // Always use average of min and max values
                        const liveLoadValue = (item.minValue + item.maxValue) / 2;
                        buildingTypesMap.set(item.buildingType, {
                            buildingType: item.buildingType,
                            liveLoad: liveLoadValue,
                            deadLoad: 0
                        });
                    });

                    // Add dead loads (using "إجمالي الحمل الميت" element type)
                    deadLoadsData.data.forEach((item: any) => {
                        if (item.elementType === 'إجمالي الحمل الميت') {
                            const existing = buildingTypesMap.get(item.buildingType);
                            if (existing) {
                                // Always use average of min and max values
                                const deadLoadValue = (item.minValue + item.maxValue) / 2;
                                existing.deadLoad = deadLoadValue;
                            }
                        }
                    });

                    setBuildingTypes(Array.from(buildingTypesMap.values()));
                }
            } catch (error) {
                console.error('Error fetching building types:', error);
                toast({
                    title: 'خطأ',
                    description: 'فشل في تحميل بيانات أنواع المباني',
                    variant: 'destructive'
                });
            }
        };

        fetchBuildingTypes();
    }, []);

    // Handle bar diameter selection
    const handleBarDiameterChange = (diameter: string) => {
        setSelectedBarDiameter(diameter);
        const selectedBar = ironBars.find(bar => bar.diameter.toString() === diameter);
        if (selectedBar) {
            setBarCrossSectionalArea(selectedBar.crossSectionalAreaCm2);
        }
    };

    // Handle building type selection
    const handleBuildingTypeChange = (buildingType: string) => {
        setSelectedBuildingType(buildingType);
        const selected = buildingTypes.find(bt => bt.buildingType === buildingType);
        if (selected) {
            setLiveLoad(selected.liveLoad);
            setDeadLoad(selected.deadLoad);
        }
    };

    const validateInputs = (): boolean => {
        if (!selectedBarDiameter) {
            setError('يرجى اختيار قطر القضيب');
            return false;
        }
        if (!reinforcementRatio || parseFloat(reinforcementRatio) <= 0) {
            setError('نسبة التسليح يجب أن تكون أكبر من صفر');
            return false;
        }
        if (!roofBeamLength || parseFloat(roofBeamLength) <= 0) {
            setError('طول جسر السقف يجب أن يكون أكبر من صفر');
            return false;
        }
        if (!selectedBuildingType) {
            setError('يرجى اختيار نوع المبنى');
            return false;
        }
        if (!effectiveDepth || parseFloat(effectiveDepth) <= 0) {
            setError('العمق الفعال يجب أن يكون أكبر من صفر');
            return false;
        }
        if (!ribSpacing || parseFloat(ribSpacing) <= 0) {
            setError('المسافة بين الأعصاب يجب أن تكون أكبر من صفر');
            return false;
        }
        if (!numberOfRibs || parseInt(numberOfRibs) <= 0) {
            setError('عدد الأعصاب يجب أن يكون أكبر من صفر');
            return false;
        }
        return true;
    };

    const calculate = () => {
        setError(null);
        if (!validateInputs()) return;

        // Check for existing report before calculating
        if (existingReportId && !showRecalculationWarning) {
            setShowRecalculationWarning(true);
            return;
        }

        setIsLoading(true);

        try {
            // Convert inputs to numbers
            const ratioDecimal = parseFloat(reinforcementRatio); // Already entered as decimal (0.01 for 1%)
            const beamLength = parseFloat(roofBeamLength);
            const depth = parseFloat(effectiveDepth);
            const spacing = parseFloat(ribSpacing);
            const ribs = parseInt(numberOfRibs);

            // Step 1: Calculate total distributed load for all ribs (kN/m)
            // Total Load = (Live Load + Dead Load) [kN/m²] × Spacing [m] × Number of Ribs
            const totalLoad = (liveLoad + deadLoad) * spacing * ribs;

            // Step 2: Calculate moment (kNm)
            // Moment = (Beam Length² × Total Load) / 8
            const moment = ((beamLength ** 2) * totalLoad) / 8;

            // Step 3: Calculate required bar area (cm²)
            // Required Area (cm²) = (Moment [kNm] × 10^6 [N·mm]) ÷ (0.87 × (0.9 × Effective Depth [m] × 1000 [mm]) × 500)
            const momentNmm = moment * 1e6; // Convert kNm to N·mm
            const depthMm = depth * 1000; // Convert m to mm
            const requiredBarArea = momentNmm / (0.87 * (0.9 * depthMm) * 500);

            // Step 4: Calculate number of bars for all ribs
            // Number of Bars = (Reinforcement Ratio × Required Bar Area [cm²]) ÷ Cross Sectional Area [cm²]
            const numberOfBars = Math.ceil((ratioDecimal * requiredBarArea) / barCrossSectionalArea);

            setResults({
                totalLoad,
                moment,
                requiredBarArea,
                numberOfBars,
                inputs: {
                    barDiameter: selectedBarDiameter,
                    reinforcementRatio: reinforcementRatio,
                    roofBeamLength: beamLength,
                    buildingType: selectedBuildingType,
                    effectiveDepth: depth,
                    ribSpacing: spacing,
                    numberOfRibs: ribs,
                    liveLoad,
                    deadLoad
                }
            });

            toast({
                title: 'تم الحساب بنجاح',
                description: 'تم حساب كميات حديد أعصاب السقف',
            });
        } catch (e) {
            setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
            console.error('Calculation error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setSelectedBarDiameter('');
        setBarCrossSectionalArea(0);
        setReinforcementRatio('');
        setRoofBeamLength('');
        setSelectedBuildingType('');
        setLiveLoad(0);
        setDeadLoad(0);
        setEffectiveDepth('');
        setRibSpacing('');
        setNumberOfRibs('');
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

            const projectContentType = projectRes.headers.get('content-type');
            if (!projectContentType || !projectContentType.includes('application/json')) {
                throw new Error('الخادم لا يستجيب بتنسيق JSON صحيح.');
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
                calculationType: 'roof-ribs-steel',
                steelData: {
                    totalSteelWeight: results.numberOfBars,
                    foundationSteel: 0,
                    columnSteel: 0,
                    beamSteel: results.numberOfBars,
                    slabSteel: 0,
                    details: {
                        inputs: {
                            ...results.inputs,
                            roofBeamLength: results.inputs.roofBeamLength || 0
                        },
                        results: {
                            totalLoad: results.totalLoad,
                            moment: results.moment,
                            requiredBarArea: results.requiredBarArea,
                            numberOfBars: results.numberOfBars
                        },
                        timestamp: new Date().toISOString()
                    }
                },
                calculationData: {
                    inputs: results.inputs,
                    results: {
                        totalLoad: results.totalLoad,
                        moment: results.moment,
                        requiredBarArea: results.requiredBarArea,
                        numberOfBars: results.numberOfBars
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50" dir="rtl">
            <div className="fixed inset-0 opacity-20">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
                {/* Header */}
                <div className="mb-12 lg:mb-16">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
                                <Button variant="ghost" size="sm" className="border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm hover:border-purple-400 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-purple-800 font-extrabold hover:text-purple-900 hover:drop-shadow-[0_0_10px_rgba(107,33,168,0.8)] group">
                                    <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                                    العودة إلى حاسبة الحديد
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="flex items-start lg:items-center gap-6 p-2">
                            <div className="relative">
                                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                                    <Layers className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                                    <Layers className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-purple-800 bg-clip-text text-transparent leading-tight mb-4">
                                    حساب حديد أعصاب السقف
                                </h1>
                                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                                    احسب كميات الحديد المطلوبة لأعصاب السقف والبلاطات المفرغة بدقة عالية
                                </p>
                            </div>
                        </div>
                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 via-indigo-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Left Column - Inputs & Forms */}
                    <div className="xl:col-span-8 space-y-6 lg:space-y-8">
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
                        <Card className="border-0 shadow-xl shadow-purple-200/50 hover:shadow-purple-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white py-6 px-6 border-b border-white/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                                        <Calculator className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">بيانات الحساب</CardTitle>
                                        <CardDescription className="text-purple-100 text-base">
                                            أدخل البيانات المطلوبة لحساب كميات حديد أعصاب السقف
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Bar Diameter */}
                                        <div className="group">
                                            <Label htmlFor="barDiameter" className="text-base font-bold text-slate-900 mb-4 block flex items-center gap-2">
                                                <Ruler className="w-5 h-5 text-purple-500" />
                                                قطر القضيب (ملم)
                                            </Label>
                                            <Select value={selectedBarDiameter} onValueChange={handleBarDiameterChange}>
                                                <SelectTrigger className="h-14 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-purple-300 focus:border-purple-500 shadow-xl focus:shadow-purple-200/50 transition-all duration-400 rounded-2xl backdrop-blur-sm">
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
                                            {barCrossSectionalArea > 0 && (
                                                <p className="text-sm text-slate-600 mt-2">
                                                    مساحة المقطع: {barCrossSectionalArea} سم²
                                                </p>
                                            )}
                                        </div>

                                        {/* Reinforcement Ratio */}
                                        <InputField
                                            id="reinforcementRatio"
                                            label="نسبة التسليح (عشري: 0.01 = 1%)"
                                            value={reinforcementRatio}
                                            onChange={setReinforcementRatio}
                                            unit=""
                                            icon={TrendingUp}
                                        />

                                        {/* Roof Beam Length */}
                                        <InputField
                                            id="roofBeamLength"
                                            label="طول جسر السقف (متر)"
                                            value={roofBeamLength}
                                            onChange={setRoofBeamLength}
                                            unit="متر"
                                            icon={Ruler}
                                        />

                                        {/* Building Type */}
                                        <div className="group">
                                            <Label htmlFor="buildingType" className="text-base font-bold text-slate-900 mb-4 block flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-purple-500" />
                                                نوع المبنى
                                            </Label>
                                            <Select value={selectedBuildingType} onValueChange={handleBuildingTypeChange}>
                                                <SelectTrigger className="h-14 text-lg font-bold bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-purple-300 focus:border-purple-500 shadow-xl focus:shadow-purple-200/50 transition-all duration-400 rounded-2xl backdrop-blur-sm">
                                                    <SelectValue placeholder="اختر نوع المبنى" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {buildingTypes.map((bt, idx) => (
                                                        <SelectItem key={idx} value={bt.buildingType}>
                                                            {bt.buildingType}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {liveLoad > 0 && deadLoad > 0 && (
                                                <p className="text-sm text-slate-600 mt-2">
                                                    الحمل الحي: {liveLoad} kN/m² | الحمل الميت: {deadLoad} kN/m²
                                                </p>
                                            )}
                                        </div>

                                        {/* Effective Depth */}
                                        <InputField
                                            id="effectiveDepth"
                                            label="العمق الفعال (متر)"
                                            value={effectiveDepth}
                                            onChange={setEffectiveDepth}
                                            unit="متر"
                                            icon={Ruler}
                                        />

                                        {/* Rib Spacing */}
                                        <InputField
                                            id="ribSpacing"
                                            label="المسافة بين الأعصاب (متر)"
                                            value={ribSpacing}
                                            onChange={setRibSpacing}
                                            unit="متر"
                                            icon={Ruler}
                                        />

                                        {/* Number of Ribs */}
                                        <InputField
                                            id="numberOfRibs"
                                            label="عدد الأعصاب"
                                            value={numberOfRibs}
                                            onChange={setNumberOfRibs}
                                            unit="عدد"
                                            icon={Layers}
                                            type="number"
                                        />
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <Button
                                            onClick={calculate}
                                            disabled={isLoading}
                                            className="flex-1 h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl"
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
                                            className="h-14 border-2 border-slate-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-800 shadow-xl"
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
                    <div className="xl:col-span-4 space-y-6">
                        <Card className="border-0 shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/60 backdrop-blur-sm bg-white/90 transition-all duration-500 overflow-hidden">
                            <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white py-6 border-b border-white/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">النتائج</CardTitle>
                                        <CardDescription className="text-indigo-100">
                                            نتائج حساب الحديد
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {results ? (
                                    <div className="space-y-6">
                                        {/* Number of Bars - Main Result */}
                                        <div className="group relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                                            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                                                    <Calculator className="w-8 h-8 text-white drop-shadow-2xl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-indigo-100 font-bold text-lg">
                                                        عدد القضبان لجميع الأعصاب
                                                    </Label>
                                                    <div className="text-4xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl">
                                                        {results.numberOfBars.toLocaleString('ar')}
                                                    </div>
                                                    <div className="text-lg font-bold text-indigo-100">
                                                        قضيب
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total Load */}
                                        <ResultCard
                                            label="الحمل الكلي الموزع"
                                            value={parseFloat(results.totalLoad).toLocaleString('ar')}
                                            unit="kN/m"
                                        />

                                        {/* Moment */}
                                        <ResultCard
                                            label="العزم"
                                            value={parseFloat(results.moment).toLocaleString('ar')}
                                            unit="kNm"
                                        />

                                        {/* Required Bar Area */}
                                        <ResultCard
                                            label="مساحة قطر السيخ المطلوبة"
                                            value={parseFloat(results.requiredBarArea).toLocaleString('ar')}
                                            unit="cm²"
                                        />

                                        {/* Report Actions */}
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

            {/* Alert Dialog for Existing Report */}
            <AlertDialog open={showRecalculationWarning} onOpenChange={setShowRecalculationWarning}>
                <AlertDialogContent className="max-w-2xl border-0 shadow-2xl shadow-purple-200/50 backdrop-blur-sm bg-white/95">
                    <AlertDialogHeader className="space-y-4 pb-6">
                        <div className="flex items-center gap-4 p-2">
                            <div className="relative">
                                <div className="w-16 h-16 p-4 bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 rounded-2xl shadow-2xl border-4 border-white/40 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-white drop-shadow-2xl" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-400 to-orange-400 border-2 border-white rounded-full shadow-xl flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <AlertDialogTitle className="text-2xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-purple-800 bg-clip-text text-transparent leading-tight">
                                    تحذير: تقرير موجود مسبقاً
                                </AlertDialogTitle>
                                <div className="mt-4 space-y-4">
                                    <p className="text-lg text-slate-600 font-semibold leading-relaxed">
                                        تم إجراء الحسابات وحفظ التقرير مسبقاً لهذا المشروع.
                                    </p>
                                    <div className="text-right space-y-2 text-slate-600">
                                        <p className="font-bold">إذا قمت بإعادة الحسابات، سيتم:</p>
                                        <ul className="list-disc list-inside space-y-1 mr-4">
                                            <li>حذف التقرير السابق من عند المهندس</li>
                                            <li>حذف التقرير السابق من عند المالك (إذا كان قد تم إرساله)</li>
                                            <li>حفظ التقرير الجديد</li>
                                        </ul>
                                        <p className="font-bold mt-4">هل تريد المتابعة وإعادة الحسابات؟</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-4 pt-4">
                        <AlertDialogCancel className="h-14 px-8 text-lg font-bold border-2 border-slate-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-800 shadow-xl transition-all duration-300">
                            إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRecalculate}
                            className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
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
                {Icon && <Icon className="w-5 h-5 text-purple-500" />}
                {label}
            </Label>
            <div className="relative">
                <Input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 text-lg font-bold text-right pr-4 bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-purple-300 focus:border-purple-500 shadow-xl focus:shadow-purple-200/50 transition-all duration-400 rounded-2xl backdrop-blur-sm"
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

function ResultCard({ label, value, unit }: { label: string; value: string; unit: string }) {
    return (
        <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600 font-semibold mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-indigo-700">
                    {value}
                </p>
                <p className="text-sm text-slate-500 font-bold">{unit}</p>
            </div>
        </div>
    );
}
