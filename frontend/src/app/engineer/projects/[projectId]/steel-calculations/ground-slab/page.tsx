"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ArrowRight,
  Grid3x3,
  Calculator,
  AlertCircle
} from "lucide-react";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ReinforcementType = 'mesh' | 'separate' | null;

interface MeshCalculation {
  slabArea: number;
  meshLength: number;
  meshWidth: number;
}

interface SeparateCalculation {
  floorWidth: number;
  floorLength: number;
  spacing: number;
  barLength: number;
}

interface Results {
  longitudinalBars?: number;
  transverseBars?: number;
  totalBars?: number;
  meshBars?: number;
}

export default function GroundSlabCalculationPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [reinforcementType, setReinforcementType] = useState<ReinforcementType>(null);
  const [meshData, setMeshData] = useState<MeshCalculation>({
    slabArea: 0,
    meshLength: 0,
    meshWidth: 0,
  });
  const [separateData, setSeparateData] = useState<SeparateCalculation>({
    floorWidth: 0,
    floorLength: 0,
    spacing: 0,
    barLength: 0,
  });
  const [results, setResults] = useState<Results | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const validateMeshInputs = (): boolean => {
    const newErrors: string[] = [];
    if (meshData.slabArea <= 0) newErrors.push('مساحة أرضية المبنى يجب أن تكون أكبر من صفر');
    if (meshData.meshLength <= 0) newErrors.push('طول شبك الحديد يجب أن يكون أكبر من صفر');
    if (meshData.meshWidth <= 0) newErrors.push('عرض شبك الحديد يجب أن يكون أكبر من صفر');
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateSeparateInputs = (): boolean => {
    const newErrors: string[] = [];
    if (separateData.floorWidth <= 0) newErrors.push('عرض الأرضي�� يجب أن يكون أكبر من صفر');
    if (separateData.floorLength <= 0) newErrors.push('طول الأرضية يجب أن يكون أكبر من صفر');
    if (separateData.spacing <= 0) newErrors.push('المسافة بين القضبان يجب أن تكون أكبر من صفر');
    if (separateData.barLength <= 0) newErrors.push('طول القضيب يجب أن يكون أكبر من صفر');
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const calculateMesh = () => {
    if (!validateMeshInputs()) return;

    // طريقة الحساب:
    // 1. يتم أخذ مساحة أرضية المبنى
    // 2. يتم طرح 0.2 متر من طول الشبك
    // 3. يتم طرح 0.2 متر من عرض الشبك
    // 4. يتم ضرب ناتج الطول بعد الطرح في ناتج العرض بعد الطرح
    // 5. يتم قسمة مساحة الأرضية على ناتج الضرب السابق
    // الناتج هو عدد قضبان الحديد باستخدام الشبك

    const adjustedLength = meshData.meshLength - 0.2;
    const adjustedWidth = meshData.meshWidth - 0.2;
    const meshArea = adjustedLength * adjustedWidth;
    const meshBars = Math.ceil(meshData.slabArea / meshArea);

    setResults({
      meshBars,
    });
  };

  const calculateSeparate = () => {
    if (!validateSeparateInputs()) return;

    // أولًا: حساب عدد قضبان الحديد الطولية
    // 1. يتم قسمة عرض الأرضية على المسافة بين القضبان
    // 2. يتم ضرب ناتج القسمة في طول الأرضية
    // 3. يتم إضافة واحد إلى الناتج
    // 4. يتم قسمة الناتج النهائي على طول القضيب

    const longitudinalCount = (separateData.floorWidth / separateData.spacing) * separateData.floorLength + 1;
    const longitudinalBars = Math.ceil(longitudinalCount / separateData.barLength);

    // ثانيًا: حساب عدد قضبان الحديد العرضية
    // 1. يتم قسمة طول الأرضية على المسافة بين القضبان
    // 2. يتم ضرب ناتج القسمة في عرض الأرضية
    // 3. يتم إضافة واحد إلى الناتج
    // 4. يتم قسمة الناتج النهائي على طول القضيب

    const transverseCount = (separateData.floorLength / separateData.spacing) * separateData.floorWidth + 1;
    const transverseBars = Math.ceil(transverseCount / separateData.barLength);

    // ثالثًا: حساب كمية الحديد الكلية في الأرضية
    // يتم جمع عدد القضبان الطولية مع عدد القض��ان العرضية

    const totalBars = longitudinalBars + transverseBars;

    setResults({
      longitudinalBars,
      transverseBars,
      totalBars,
    });
  };

  const handleCalculate = () => {
    if (reinforcementType === 'mesh') {
      calculateMesh();
    } else if (reinforcementType === 'separate') {
      calculateSeparate();
    }
  };

  const resetForm = () => {
    setReinforcementType(null);
    setMeshData({ slabArea: 0, meshLength: 0, meshWidth: 0 });
    setSeparateData({ floorWidth: 0, floorLength: 0, spacing: 0, barLength: 0 });
    setResults(null);
    setErrors([]);
  };

  return (
    <div className="container mx-auto py-12 px-4 min-h-screen bg-gray-50/50" dir="rtl">
      {/* Header Section */}
      <div className="mb-12 text-center space-y-4">
        <div className="inline-block p-3 rounded-2xl bg-white shadow-sm mb-4">
          <Grid3x3 className="w-12 h-12 text-orange-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          حساب حديد أرضية المبنى
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          احسب كمية الحديد المطلوبة لأرضية المبنى باختيار نوع التسليح المناسب.
        </p>

        <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
          <Button variant="outline" className="mt-6 gap-2 hover:bg-gray-100 transition-colors">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة لحاسبة الحديد
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Reinforcement Type Selection */}
        <Card className="bg-white shadow-xl border-t-4 border-t-orange-500 rounded-lg overflow-hidden mb-8">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Grid3x3 size={28} /> اختر نوع التسليح
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              اختر بين شبك الحديد أو الحديد المفرق
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setReinforcementType('mesh');
                  setResults(null);
                  setErrors([]);
                }}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all duration-300 text-center",
                  reinforcementType === 'mesh'
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                )}
              >
                <div className="text-3xl mb-2">🔗</div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">شبك حديد</h3>
                <p className="text-sm text-gray-600">استخدام شبك حديد موحد</p>
              </button>

              <button
                onClick={() => {
                  setReinforcementType('separate');
                  setResults(null);
                  setErrors([]);
                }}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all duration-300 text-center",
                  reinforcementType === 'separate'
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                )}
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">حديد مفرق</h3>
                <p className="text-sm text-gray-600">قضبان حديد منفصلة</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Mesh Calculation Form */}
        {reinforcementType === 'mesh' && (
          <Card className="bg-white shadow-xl border-t-4 border-t-orange-500 rounded-lg overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calculator size={28} /> حساب شبك الحديد
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                أدخل البيانات المطلوبة لحساب كمية شبك الحديد
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="slabArea" className="font-semibold text-gray-700">
                    مساحة أرضية المبنى (متر مربع)
                  </Label>
                  <Input
                    id="slabArea"
                    type="number"
                    placeholder="مثال: 100"
                    value={meshData.slabArea || ''}
                    onChange={(e) =>
                      setMeshData({ ...meshData, slabArea: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meshLength" className="font-semibold text-gray-700">
                    طول شبك الحديد (متر)
                  </Label>
                  <Input
                    id="meshLength"
                    type="number"
                    placeholder="مثال: 2"
                    value={meshData.meshLength || ''}
                    onChange={(e) =>
                      setMeshData({ ...meshData, meshLength: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meshWidth" className="font-semibold text-gray-700">
                    عرض شبك الحديد (متر)
                  </Label>
                  <Input
                    id="meshWidth"
                    type="number"
                    placeholder="مثال: 2"
                    value={meshData.meshWidth || ''}
                    onChange={(e) =>
                      setMeshData({ ...meshData, meshWidth: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCalculate}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 text-lg"
                >
                  <Calculator className="w-5 h-5 ml-2" />
                  حساب الكميات
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold py-6 text-lg"
                >
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Separate Calculation Form */}
        {reinforcementType === 'separate' && (
          <Card className="bg-white shadow-xl border-t-4 border-t-orange-500 rounded-lg overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Calculator size={28} /> حساب الحديد المفرق
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                أدخل البيانات المطلوبة لحساب كمية الحديد المفرق
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="floorWidth" className="font-semibold text-gray-700">
                    عرض الأرضية (متر)
                  </Label>
                  <Input
                    id="floorWidth"
                    type="number"
                    placeholder="مثال: 10"
                    value={separateData.floorWidth || ''}
                    onChange={(e) =>
                      setSeparateData({ ...separateData, floorWidth: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floorLength" className="font-semibold text-gray-700">
                    طول الأرضية (متر)
                  </Label>
                  <Input
                    id="floorLength"
                    type="number"
                    placeholder="مثال: 15"
                    value={separateData.floorLength || ''}
                    onChange={(e) =>
                      setSeparateData({ ...separateData, floorLength: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spacing" className="font-semibold text-gray-700">
                    المسافة بين القضبان (متر)
                  </Label>
                  <Input
                    id="spacing"
                    type="number"
                    placeholder="مثال: 0.2"
                    value={separateData.spacing || ''}
                    onChange={(e) =>
                      setSeparateData({ ...separateData, spacing: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barLength" className="font-semibold text-gray-700">
                    طول القضيب (متر)
                  </Label>
                  <Input
                    id="barLength"
                    type="number"
                    placeholder="مثال: 12"
                    value={separateData.barLength || ''}
                    onChange={(e) =>
                      setSeparateData({ ...separateData, barLength: parseFloat(e.target.value) || 0 })
                    }
                    className="focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCalculate}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 text-lg"
                >
                  <Calculator className="w-5 h-5 ml-2" />
                  حساب الكميات
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold py-6 text-lg"
                >
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {results && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl border-t-4 border-t-green-500 rounded-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100">
              <CardTitle className="text-2xl font-bold text-green-800 flex items-center gap-2">
                ✓ نتائج الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {reinforcementType === 'mesh' && results.meshBars !== undefined && (
                <div className="space-y-4">
                  <div className="p-6 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                    <p className="text-gray-600 text-sm mb-2">عدد قطع شبك الحديد المطلوبة</p>
                    <p className="text-4xl font-bold text-green-700">
                      {results.meshBars.toLocaleString('ar')}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">شبكة</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>ملاحظة:</strong> هذا الحساب يعتمد على طرح 0.2 متر من طول وعرض الشبك لحساب المساحة الفعلية.
                    </p>
                  </div>
                </div>
              )}

              {reinforcementType === 'separate' && results.totalBars !== undefined && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                      <p className="text-gray-600 text-sm mb-2">القضبان الطولية</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {results.longitudinalBars?.toLocaleString('ar')}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">قضيب</p>
                    </div>

                    <div className="p-6 bg-white rounded-xl border-2 border-purple-200 shadow-sm">
                      <p className="text-gray-600 text-sm mb-2">القضبان العرضية</p>
                      <p className="text-3xl font-bold text-purple-700">
                        {results.transverseBars?.toLocaleString('ar')}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">قضيب</p>
                    </div>

                    <div className="p-6 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                      <p className="text-gray-600 text-sm mb-2">إجمالي القضبان</p>
                      <p className="text-3xl font-bold text-green-700">
                        {results.totalBars?.toLocaleString('ar')}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">قضيب</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>ملاحظة:</strong> يتم إضافة قضيب واحد إضافي في كل اتجاه، وتقسيم النتيجة على طول القضيب الواحد.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={resetForm}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6"
                >
                  حساب جديد
                </Button>
                <Link href={`/engineer/projects/${projectId}/steel-calculations`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold py-6"
                  >
                    العودة للقائمة
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
