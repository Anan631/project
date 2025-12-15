"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Building2,
  ArrowRight,
  Calculator,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BuildingType {
  value: string;
  label: string;
  deadLoad: number;
  liveLoad: number;
}

export default function ColumnBaseCalculationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for all inputs
  const [inputs, setInputs] = useState({
    numberOfColumns: '',
    pedestalHeight: '', // 15-20 cm
    baseLength: '',
    baseWidth: '',
    slabArea: '',
    numberOfFloors: '',
    buildingType: '',
    columnShape: '', // square, circular, rectangular
  });

  // State for results and errors
  const [results, setResults] = useState<{
    pedestalVolume: number;
    totalLoad: number;
    loadPerColumn: number;
    deadLoadPerSqm: number;
    liveLoadPerSqm: number;
    combinedLoadPerSqm: number;
    totalConcrete: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);

  // Fetch building types with loads on component mount
  useEffect(() => {
    const fetchBuildingTypes = async () => {
      try {
        setLoading(true);
        // Fetch all building types with their loads
        const deadLoadRes = await fetch('http://localhost:5000/api/engineering-data/dead-loads');
        if (!deadLoadRes.ok) {
          throw new Error(`Dead loads API error: ${deadLoadRes.status}`);
        }
        const deadLoadData = await deadLoadRes.json();
        
        const liveLoadRes = await fetch('http://localhost:5000/api/engineering-data/live-loads');
        if (!liveLoadRes.ok) {
          throw new Error(`Live loads API error: ${liveLoadRes.status}`);
        }
        const liveLoadData = await liveLoadRes.json();

        if (deadLoadData.data && liveLoadData.data) {
          // Group by building type
          const buildingTypeMap = new Map<string, BuildingType>();
          
          // Process dead loads
          deadLoadData.data.forEach((dl: any) => {
            if (!buildingTypeMap.has(dl.buildingType)) {
              buildingTypeMap.set(dl.buildingType, {
                value: dl.buildingType,
                label: dl.buildingType,
                deadLoad: 0,
                liveLoad: 0
              });
            }
            const bt = buildingTypeMap.get(dl.buildingType)!;
            if (dl.elementType === 'إجمالي الحمل الميت') {
              bt.deadLoad = dl.commonValue || dl.minValue || 0;
            }
          });

          // Process live loads
          liveLoadData.data.forEach((ll: any) => {
            const bt = buildingTypeMap.get(ll.buildingType);
            if (bt) {
              bt.liveLoad = ll.commonValue || ll.minValue || 0;
            }
          });

          setBuildingTypes(Array.from(buildingTypeMap.values()));
        } else {
          setDefaultBuildingTypes();
        }
      } catch (error) {
        console.error('Error fetching building types:', error);
        // Fallback to static list
        setDefaultBuildingTypes();
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingTypes();
  }, []);

  const setDefaultBuildingTypes = () => {
    const defaultTypes: BuildingType[] = [
      { value: 'المباني السكنية (شقق ومنازل)', label: 'المباني السكنية (شقق ومنازل)', deadLoad: 7.0, liveLoad: 3.35 },
      { value: 'المكاتب', label: 'المكاتب', deadLoad: 7.0, liveLoad: 3.6 },
      { value: 'المباني التجارية (محلات وأسواق)', label: 'المباني التجارية (محلات وأسواق)', deadLoad: 7.0, liveLoad: 6.0 },
      { value: 'المدارس والجامعات', label: 'المدارس والجامعات', deadLoad: 7.0, liveLoad: 3.0 },
      { value: 'المستشفيات والعيادات', label: 'المستشفيات والعيادات', deadLoad: 7.0, liveLoad: 4.0 },
      { value: 'المصانع والمستودعات', label: 'المصانع والمستودعات', deadLoad: 7.0, liveLoad: 5.0 },
      { value: 'مواقف السيارات', label: 'مواقف السيارات', deadLoad: 7.0, liveLoad: 2.5 },
    ];
    setBuildingTypes(defaultTypes);
  };

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const validateInputs = (): boolean => {
    const {
      numberOfColumns,
      pedestalHeight,
      baseLength,
      baseWidth,
      slabArea,
      numberOfFloors,
      buildingType,
      columnShape
    } = inputs;

    if (!numberOfColumns || parseFloat(numberOfColumns) <= 0) {
      setError('عدد الأعمدة مطلوب وأكبر من صفر');
      return false;
    }

    if (!pedestalHeight || parseFloat(pedestalHeight) < 0.15 || parseFloat(pedestalHeight) > 0.20) {
      setError('ارتفاع الشرش يجب أن يكون بين 15-20 سم (0.15-0.20 متر)');
      return false;
    }

    if (!baseLength || parseFloat(baseLength) <= 0) {
      setError('طول القاعدة مطلوب وأكبر من صفر');
      return false;
    }

    if (!baseWidth || parseFloat(baseWidth) <= 0) {
      setError('عرض القاعدة مطلوب وأكبر من صفر');
      return false;
    }

    if (!slabArea || parseFloat(slabArea) <= 0) {
      setError('مساحة البلاطة مطلوبة وأكبر من صفر');
      return false;
    }

    if (!numberOfFloors || parseFloat(numberOfFloors) <= 0) {
      setError('عدد الطوابق مطلوب وأكبر من صفر');
      return false;
    }

    if (!buildingType) {
      setError('نوع المبنى مطلوب');
      return false;
    }

    if (!columnShape) {
      setError('شكل العمود مطلوب');
      return false;
    }

    return true;
  };

  const handleCalculate = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      setError(null);

      // Get building type data
      const buildingTypeData = buildingTypes.find(bt => bt.value === inputs.buildingType);
      if (!buildingTypeData) {
        setError('لم يتم العثور على بيانات نوع المبنى');
        return;
      }

      const numberOfColumns = parseFloat(inputs.numberOfColumns);
      const pedestalHeight = parseFloat(inputs.pedestalHeight);
      const baseLength = parseFloat(inputs.baseLength);
      const baseWidth = parseFloat(inputs.baseWidth);
      const slabArea = parseFloat(inputs.slabArea);
      const numberOfFloors = parseFloat(inputs.numberOfFloors);

      const deadLoadPerSqm = buildingTypeData.deadLoad;
      const liveLoadPerSqm = buildingTypeData.liveLoad;
      const combinedLoadPerSqm = deadLoadPerSqm + liveLoadPerSqm;

      // Calculate total load on building
      // Total Load = Slab Area × Number of Floors × Combined Load (kN)
      const totalLoad = slabArea * numberOfFloors * combinedLoadPerSqm;

      // Load per column
      const loadPerColumn = totalLoad / numberOfColumns;

      // Calculate pedestal volume
      // Volume = Base Length × Base Width × Pedestal Height × Number of Columns
      const pedestalVolume = baseLength * baseWidth * pedestalHeight * numberOfColumns;

      setResults({
        pedestalVolume,
        totalLoad,
        loadPerColumn,
        deadLoadPerSqm,
        liveLoadPerSqm,
        combinedLoadPerSqm,
        totalConcrete: pedestalVolume
      });

    } catch (error) {
      setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
      console.error('Calculation error:', error);
    }
  };

  const resetCalculation = () => {
    setInputs({
      numberOfColumns: '',
      pedestalHeight: '',
      baseLength: '',
      baseWidth: '',
      slabArea: '',
      numberOfFloors: '',
      buildingType: '',
      columnShape: '',
    });
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
      
      // Fetch project details to get owner info
      const projectRes = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      if (!projectRes.ok) {
        throw new Error(`Project API error: ${projectRes.status}`);
      }
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;
      
      const reportData = {
        projectId,
        calculationType: 'column-base-pedestal',
        engineerId,
        engineerName,
        ownerId: project.owner?._id || project.owner,
        ownerName: project.owner?.fullName || project.owner?.name || 'صاحب المشروع',
        concreteData: {
          type: 'شروش الأعمدة',
          inputs: {
            numberOfColumns: inputs.numberOfColumns,
            pedestalHeight: inputs.pedestalHeight,
            baseLength: inputs.baseLength,
            baseWidth: inputs.baseWidth,
            slabArea: inputs.slabArea,
            numberOfFloors: inputs.numberOfFloors,
            buildingType: inputs.buildingType,
            columnShape: inputs.columnShape,
          },
          outputs: results
        }
      };

      const res = await fetch('http://localhost:5000/api/quantity-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!res.ok) {
        throw new Error('فشل حفظ التقرير');
      }

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ تقرير شروش الأعمدة',
        variant: 'default'
      });

      // Navigate to reports page
      setTimeout(() => {
        router.push(`/engineer/quantity-reports/${projectId}`);
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ التقرير',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              عودة
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900">حساب كميات خرسانة شروش الأعمدة</h1>
            <p className="text-gray-600 mt-2">قم بإدخال بيانات المشروع لحساب كمية الخرسانة المطلوبة</p>
          </div>
          <div className="w-16" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  نموذج الحساب
                </CardTitle>
                <CardDescription className="text-indigo-100 mt-2">
                  أدخل جميع البيانات المطلوبة ثم اضغط على "حساب كمية الخرسانة"
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Row 1: Number of Columns & Pedestal Height */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold text-gray-700 mb-2 block">عدد الأعمدة *</Label>
                    <Input
                      type="number"
                      placeholder="مثال: 12"
                      value={inputs.numberOfColumns}
                      onChange={(e) => handleInputChange('numberOfColumns', e.target.value)}
                      className="border-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label className="font-bold text-gray-700 mb-2 block">
                      ارتفاع الشرش (متر) *
                      <span className="text-xs text-gray-500 block mt-1">القيمة المسموحة: 15-20 سم</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="مثال: 0.18"
                      step="0.01"
                      min="0.15"
                      max="0.20"
                      value={inputs.pedestalHeight}
                      onChange={(e) => handleInputChange('pedestalHeight', e.target.value)}
                      className="border-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 2: Base Length & Width */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold text-gray-700 mb-2 block">طول القاعدة (متر) *</Label>
                    <Input
                      type="number"
                      placeholder="مثال: 0.60"
                      step="0.01"
                      value={inputs.baseLength}
                      onChange={(e) => handleInputChange('baseLength', e.target.value)}
                      className="border-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label className="font-bold text-gray-700 mb-2 block">عرض القاعدة (متر) *</Label>
                    <Input
                      type="number"
                      placeholder="مثال: 0.60"
                      step="0.01"
                      value={inputs.baseWidth}
                      onChange={(e) => handleInputChange('baseWidth', e.target.value)}
                      className="border-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* Row 3: Slab Area & Number of Floors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-bold text-gray-700 mb-2 block">مساحة البلاطة (م²) *</Label>
                    <Input
                      type="number"
                      placeholder="مثال: 150"
                      step="0.1"
                      value={inputs.slabArea}
                      onChange={(e) => handleInputChange('slabArea', e.target.value)}
                      className="border-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label className="font-bold text-gray-700 mb-2 block">عدد الطوابق *</Label>
                    <Input
                      type="number"
                      placeholder="مثال: 4"
                      min="1"
                      value={inputs.numberOfFloors}
                      onChange={(e) => handleInputChange('numberOfFloors', e.target.value)}
                      className="border-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* Row 4: Building Type */}
                <div>
                  <Label className="font-bold text-gray-700 mb-2 block">نوع المبنى *</Label>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <Select value={inputs.buildingType} onValueChange={(value) => handleInputChange('buildingType', value)}>
                      <SelectTrigger className="border-2 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue placeholder="اختر نوع المبنى" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Row 5: Column Shape */}
                <div>
                  <Label className="font-bold text-gray-700 mb-2 block">شكل العمود *</Label>
                  <Select value={inputs.columnShape} onValueChange={(value) => handleInputChange('columnShape', value)}>
                    <SelectTrigger className="border-2 focus:border-indigo-500 focus:ring-indigo-500">
                      <SelectValue placeholder="اختر شكل العمود" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">مربع</SelectItem>
                      <SelectItem value="circular">دائري</SelectItem>
                      <SelectItem value="rectangular">مستطيل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <Separator />
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCalculate}
                    className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg"
                  >
                    <Calculator className="w-4 h-4 ml-2" />
                    حساب كمية الخرسانة
                  </Button>
                  <Button
                    onClick={resetCalculation}
                    variant="outline"
                    className="px-8 h-12 border-gray-300"
                  >
                    إعادة تعيين
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {results ? (
              <Card className="shadow-lg h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    النتائج
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                  {/* Load Information */}
                  <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">الحمل الميت</p>
                      <p className="text-lg font-bold text-blue-900">{results.deadLoadPerSqm.toFixed(2)} kN/m²</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-xs text-red-600 font-semibold mb-1">الحمل الحي</p>
                      <p className="text-lg font-bold text-red-900">{results.liveLoadPerSqm.toFixed(2)} kN/m²</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-1">الحمل المدمج</p>
                      <p className="text-lg font-bold text-purple-900">{results.combinedLoadPerSqm.toFixed(2)} kN/m²</p>
                    </div>

                    <Separator />

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">الحمل الكلي على المبنى</p>
                      <p className="text-lg font-bold text-gray-900">{results.totalLoad.toFixed(2)} kN</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 font-semibold mb-1">الحمل على العمود الواحد</p>
                      <p className="text-lg font-bold text-gray-900">{results.loadPerColumn.toFixed(2)} kN</p>
                    </div>
                  </div>

                  {/* Final Result */}
                  <div className="space-y-3">
                    <Separator />
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                      <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                      <span className="text-3xl font-black text-emerald-600">
                        {results.totalConcrete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                      </span>
                    </div>
                    <p className="text-center text-sm text-gray-500">متر مكعب (م³)</p>

                    {/* Save Button */}
                    <Button
                      onClick={saveToReports}
                      disabled={saving}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg mt-4"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        'حفظ النتائج'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg h-full flex items-center justify-center min-h-[500px]">
                <CardContent className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-gray-200">
                    <Calculator className="w-14 h-14 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-3">جاهز للحساب</h3>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    أدخل أبعاد شروش الأعمدة في النموذج المجاور واضغط "حساب كمية الخرسانة" للحصول على النتيجة فوراً
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
