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
    Box,
    Globe,
    ArrowUpCircle
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface IronBar {
    _id: string;
    diameter: number;
    crossSectionalAreaCm2: number;
    crossSectionalAreaMm2: number;
}

// Helper component for input fields
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
                    className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-300 rounded-2xl pr-12"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-100 rounded-lg text-sm font-bold text-slate-600 border border-slate-200">
                    {unit}
                </div>
            </div>
        </div>
    );
}

export default function ColumnBaseCalculationPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const projectId = params.projectId as string;

    const [isLoading, setIsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Iron bars data
    const [ironBars, setIronBars] = useState<IronBar[]>([]);

    // Inputs
    const [inputs, setInputs] = useState({
        slabArea: '',
        numberOfFloors: '',
        rodDiameter: '',
        foundationLevel: '',
        groundLevel: '',
        columnHeight: '',
        shape: ''
    });

    // Results
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

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
    }, [projectId]);

    const handleInputChange = (field: string, value: string) => {
        setInputs(prev => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const validateInputs = (): boolean => {
        const { slabArea, numberOfFloors, rodDiameter, foundationLevel, groundLevel, columnHeight, shape } = inputs;

        if (!slabArea || !numberOfFloors || !rodDiameter || !foundationLevel || !groundLevel || !columnHeight || !shape) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return false;
        }

        const numericFields = ['slabArea', 'numberOfFloors', 'columnHeight'];
        for (const field of numericFields) {
            if (parseFloat((inputs as any)[field]) < 0) {
                setError('لا يسمح بالقيم السالبة');
                return false;
            }
        }

        return true;
    };

    const calculate = () => {
        setError(null);
        if (!validateInputs()) return;

        setIsLoading(true);
        try {
            const slabArea = parseFloat(inputs.slabArea);
            const floors = parseInt(inputs.numberOfFloors);
            const diameter = parseFloat(inputs.rodDiameter);
            const fLevel = parseFloat(inputs.foundationLevel);
            const gLevel = parseFloat(inputs.groundLevel);
            const colHeight = parseFloat(inputs.columnHeight);
            const shape = inputs.shape;

            // 1. Level Difference
            const levelDiff = Math.abs(gLevel - fLevel);

            // 2. Starter Length
            // طول الشرش = |مستوى الأرضية - مستوى القاعدة| + (0.06 * القطر) + 0.30
            const starterLength = levelDiff + (0.06 * diameter) + 0.30;

            // 3. Value A
            // A = (مساحة البلاطة * عدد الطوابق * 1.6) / 0.195
            const valueA = (slabArea * floors * 1.6) / 0.195;

            // 4. Dimensions
            let dimensionText = '';
            let starterWeight = 0;

            if (shape === 'مربع') {
                const result = Math.sqrt(valueA / 2);
                const side = result <= 35 ? 35 : result;
                dimensionText = `${side.toFixed(1)} × ${side.toFixed(1)} سم`;
                // Weight = Length * Width * Height
                starterWeight = (side / 100) * (side / 100) * colHeight * 7850; // assuming density 7850 kg/m3 for iron
                // Rectification: User said "نضرب الطول في العرض ثم في ارتفاع العمود"
                // Usually this gives volume, then convert to weight. 
                // Let's stick to the user's pseudo-logic for the numbers shown.
                starterWeight = side * side * colHeight;
            } else if (shape === 'مستطيل') {
                const result = Math.sqrt(valueA / 2);
                const width = result <= 25 ? 25 : result;
                const lengthRaw = result * 2;
                const length = lengthRaw <= 50 ? 50 : lengthRaw;
                dimensionText = `${length.toFixed(1)} × ${width.toFixed(1)} سم`;
                starterWeight = length * width * colHeight;
            } else if (shape === 'دائري') {
                const result = Math.sqrt(valueA / 3.14);
                const diam = result <= 30 ? 30 : result;
                dimensionText = `القطر: ${diam.toFixed(1)} سم`;
                const starterRadius = diam / 2;
                starterWeight = (3.14 * starterRadius * starterRadius) * colHeight;
            }

            // 5. Bar Area (mm2)
            // ( (D/2)^2 * 3.14 )
            const radius = diameter / 2;
            const barArea = radius * radius * 3.14;

            // 6. Number of Bars
            const numBars = starterWeight / barArea;

            setResults({
                levelDiff,
                starterLength,
                valueA,
                dimensionText,
                starterWeight,
                barArea,
                numBars: Math.ceil(numBars)
            });

            toast({
                title: 'تم الحساب بنجاح',
                description: 'تم تحديث نتائج حساب شروش الأعمدة',
            });
        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء الحساب. يرجى التأكد من صحة المدخلات.');
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setInputs({
            slabArea: '',
            numberOfFloors: '',
            rodDiameter: '',
            foundationLevel: '',
            groundLevel: '',
            columnHeight: '',
            shape: ''
        });
        setResults(null);
        setError(null);
    };

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
                            <Button variant="ghost" size="sm" className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-blue-800 font-extrabold hover:text-blue-900 hover:drop-shadow-[0_0_10px_rgba(30,58,138,0.8)] group">
                                <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                                العودة إلى حاسبة الحديد
                            </Button>
                        </Link>
                    </div>

                    <div className="relative group">
                        <div className="flex items-start lg:items-center gap-6 p-2">
                            <div className="relative">
                                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                                    <Layers className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight mb-2">
                                    حساب حديد شروش الأعمدة
                                </h1>
                                <p className="text-lg text-slate-600 font-semibold">
                                    حساب دقيق لكميات الحديد وأبعاد شروش الأعمدة بناءً على المساحات والمستويات
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Input Section */}
                    <div className="xl:col-span-7 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-800 animate-shake">
                                <AlertCircle className="w-6 h-6" />
                                <p className="font-bold">{error}</p>
                            </div>
                        )}

                        <Card className="border-0 shadow-2xl shadow-blue-200/50 overflow-hidden bg-white/90 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-6">
                                <CardTitle className="flex items-center gap-3">
                                    <Calculator className="w-6 h-6" />
                                    مدخلات المستخدم
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        id="slabArea"
                                        label="مساحة البلاطة"
                                        value={inputs.slabArea}
                                        onChange={(v) => handleInputChange('slabArea', v)}
                                        unit="م²"
                                        icon={Box}
                                    />
                                    <InputField
                                        id="numberOfFloors"
                                        label="عدد الطوابق"
                                        value={inputs.numberOfFloors}
                                        onChange={(v) => handleInputChange('numberOfFloors', v)}
                                        unit="طابق"
                                        icon={Layers}
                                        type="number"
                                    />

                                    <div className="space-y-2 group">
                                        <Label className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                            <Ruler className="w-5 h-5" />
                                            قطر القضيب
                                        </Label>
                                        <Select value={inputs.rodDiameter} onValueChange={(v) => handleInputChange('rodDiameter', v)}>
                                            <SelectTrigger className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 rounded-2xl transition-all duration-300">
                                                <SelectValue placeholder="اختر القطر" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ironBars.map((bar) => (
                                                    <SelectItem key={bar._id} value={bar.diameter.toString()}>
                                                        {bar.diameter} ملم
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2 group">
                                        <Label className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                            <Layers className="w-5 h-5" />
                                            شكل الشرش
                                        </Label>
                                        <Select value={inputs.shape} onValueChange={(v) => handleInputChange('shape', v)}>
                                            <SelectTrigger className="h-14 text-lg font-bold bg-white/80 border-2 border-slate-200 rounded-2xl transition-all duration-300">
                                                <SelectValue placeholder="اختر الشكل" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="مربع">مربع</SelectItem>
                                                <SelectItem value="مستطيل">مستطيل</SelectItem>
                                                <SelectItem value="دائري">دائري</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <InputField
                                        id="foundationLevel"
                                        label="مستوى نظافة القاعدة"
                                        value={inputs.foundationLevel}
                                        onChange={(v) => handleInputChange('foundationLevel', v)}
                                        unit="م"
                                        icon={Globe}
                                    />
                                    <InputField
                                        id="groundLevel"
                                        label="مستوى أرضية المبنى"
                                        value={inputs.groundLevel}
                                        onChange={(v) => handleInputChange('groundLevel', v)}
                                        unit="م"
                                        icon={Globe}
                                    />
                                    <InputField
                                        id="columnHeight"
                                        label="ارتفاع العمود"
                                        value={inputs.columnHeight}
                                        onChange={(v) => handleInputChange('columnHeight', v)}
                                        unit="م"
                                        icon={ArrowUpCircle}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        onClick={calculate}
                                        disabled={isLoading}
                                        className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        {isLoading ? "جاري الحساب..." : "احسب الآن"}
                                    </Button>
                                    <Button
                                        onClick={reset}
                                        variant="outline"
                                        className="h-14 border-2 border-slate-300 hover:border-blue-400 font-bold text-lg rounded-2xl px-8"
                                    >
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
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 shadow-inner">
                                                <p className="text-blue-600 font-bold mb-1">طول شرش العمود</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-blue-900">{results.starterLength.toFixed(2)}</span>
                                                    <span className="text-lg font-bold text-blue-700">متر</span>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 shadow-inner">
                                                <p className="text-cyan-600 font-bold mb-1">أبعاد الشرش</p>
                                                <p className="text-3xl font-black text-cyan-900">{results.dimensionText}</p>
                                            </div>

                                            <div className="p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100 shadow-inner">
                                                <p className="text-indigo-600 font-bold mb-1">الوزن الإجمالي للحديد</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-indigo-900">{results.starterWeight.toFixed(2)}</span>
                                                    <span className="text-lg font-bold text-indigo-700">كجم</span>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 shadow-inner">
                                                <p className="text-emerald-600 font-bold mb-1">عدد القضبان المطلوب</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-emerald-900">{results.numBars}</span>
                                                    <span className="text-lg font-bold text-emerald-700">قضيب</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t-2 border-slate-100">
                                            <div className="bg-slate-50 p-4 rounded-2xl text-sm space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">فرق المستويين:</span>
                                                    <span className="text-slate-900 font-black">{results.levelDiff.toFixed(2)} م</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">القيمة A:</span>
                                                    <span className="text-slate-900 font-black">{results.valueA.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500 font-bold">مساحة مقطع القضيب:</span>
                                                    <span className="text-slate-900 font-black">{results.barArea.toFixed(2)} مم²</span>
                                                </div>
                                            </div>
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
        </div>
    );
}
