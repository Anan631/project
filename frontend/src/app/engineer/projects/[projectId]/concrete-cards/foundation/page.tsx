"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ArrowRight,
  Calculator,
  Blocks,
  Layers,
  Ruler,
  Box,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Grid,
  LayoutDashboard
} from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function FoundationCalculationPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // State for all inputs
  const [inputs, setInputs] = useState({
    // صبة النظافة
    cleaningLength: '',
    cleaningWidth: '',
    cleaningHeight: '',
    
    // المبنى
    numberOfFloors: '',
    floorArea: '',
    soilType: '',
    buildingType: '',
    
    // القواعد
    foundationHeight: '',
    numberOfFoundations: '',
    foundationShape: '',
    foundationsSimilar: ''
  });

  // State for results and errors
  const [results, setResults] = useState<{
    cleaningVolume: number;
    totalLoad: number;
    loadPerFoundation: number;
    foundationArea: number;
    foundationDimensions: string;
    foundationsVolume: number;
    totalConcrete: number;
    deadLoadPerSqm: number;
    liveLoadPerSqm: number;
    combinedLoadPerSqm: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // حاشية الصب الثابتة بقيمة 0.20 متر من كل جهة
  const CONCRETE_MARGIN = 0.20;

  const soilTypes = [
    { value: 'تربة طينية ناعمة جدًا', label: 'تربة طينية ناعمة جدًا', capacity: 25 },
    { value: 'تربة طميية أو طينية مفككة', label: 'تربة طميية أو طينية مفككة', capacity: 25 },
    { value: 'تربة طينية', label: 'تربة طينية', capacity: 50 },
    { value: 'تربة طينية ممزوجة بالرمل', label: 'تربة طينية ممزوجة بالرمل', capacity: 75 },
    { value: 'تربة رملية', label: 'تربة رملية', capacity: 100 },
    { value: 'تربة حصوية (زلطية)', label: 'تربة حصوية (زلطية)', capacity: 200 },
    { value: 'تربة صخرية', label: 'تربة صخرية', capacity: 350 }
  ];

  const soilCapacities = soilTypes.reduce<Record<string, number>>((acc, soil) => {
    acc[soil.value] = soil.capacity;
    return acc;
  }, {});

  const buildingTypes = [
    { value: 'المباني السكنية (شقق ومنازل)', label: 'المباني السكنية (شقق ومنازل)', dead: 7.0, live: 3.35 },
    { value: 'المكاتب', label: 'المكاتب', dead: 7.0, live: 3.6 },
    { value: 'المباني التجارية (محلات وأسواق)', label: 'المباني التجارية (محلات وأسواق)', dead: 7.0, live: 6.0 },
    { value: 'المستودعات (Warehouses)', label: 'المستودعات (Warehouses)', dead: 8.0, live: 6.0 },
    { value: 'المسارح وقاعات الاجتماعات والأماكن العامة', label: 'المسارح وقاعات الاجتماعات والأماكن العامة', dead: 6.5, live: 4.8 },
    { value: 'المدارس', label: 'المدارس', dead: 6.5, live: 3.6 },
    { value: 'المناطق ذات كثافة طلاب عالية', label: 'المناطق ذات كثافة طلاب عالية', dead: 6.8, live: 4.8 },
    { value: 'الملاعب الرياضية', label: 'الملاعب الرياضية', dead: 5.5, live: 6.0 },
    { value: 'المستشفيات', label: 'المستشفيات', dead: 7.5, live: 5.4 },
    { value: 'مواقف السيارات', label: 'مواقف السيارات', dead: 7.5, live: 5.4 }
  ];

  const buildingLoads = buildingTypes.reduce<Record<string, { dead: number; live: number }>>((acc, type) => {
    acc[type.value] = { dead: type.dead, live: type.live };
    return acc;
  }, {});

  const formatLoad = (value: number) => parseFloat(value.toFixed(2)).toString();

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const calculateResults = () => {
    try {
      // Get numeric values
      const cleaningLength = parseFloat(inputs.cleaningLength);
      const cleaningWidth = parseFloat(inputs.cleaningWidth);
      const cleaningHeight = parseFloat(inputs.cleaningHeight);
      const numberOfFloors = parseFloat(inputs.numberOfFloors);
      const floorArea = parseFloat(inputs.floorArea);
      const foundationHeight = parseFloat(inputs.foundationHeight);
      const numberOfFoundations = parseFloat(inputs.numberOfFoundations);

      // Validate inputs
      if (isNaN(cleaningLength) || isNaN(cleaningWidth) || isNaN(cleaningHeight) ||
          isNaN(numberOfFloors) || isNaN(floorArea) || isNaN(foundationHeight) ||
          isNaN(numberOfFoundations) ||
          !inputs.soilType || !inputs.buildingType || !inputs.foundationShape || !inputs.foundationsSimilar) {
        setError('يرجى ملء جميع الحقول المطلوبة بقيم صحيحة');
        return;
      }

      if (cleaningLength <= 0 || cleaningWidth <= 0 || cleaningHeight <= 0 ||
          numberOfFloors <= 0 || floorArea <= 0 || foundationHeight <= 0 ||
          numberOfFoundations <= 0) {
        setError('يجب أن تكون جميع القيم الرقمية موجبة');
        return;
      }

      // أ. حجم صبة النظاف
      const cleaningVolume = cleaningLength * cleaningWidth * cleaningHeight;

      // ب. الحمل الكلي على المبنى
      const loads = buildingLoads[inputs.buildingType];
      if (!loads) {
        setError('نوع المبنى غير معروف');
        return;
      }

      const deadLoadPerSqm = loads.dead;
      const liveLoadPerSqm = loads.live;
      const combinedLoadPerSqm = deadLoadPerSqm + liveLoadPerSqm;
      const totalLoad = floorArea * numberOfFloors * combinedLoadPerSqm;

      // ج. الحمل على القاعدة الواحدة
      const loadPerFoundation = totalLoad / numberOfFoundations;

      // د. مساحة القاعدة
      const soilCapacity = soilCapacities[inputs.soilType];
      const foundationArea = loadPerFoundation / soilCapacity;

      // هـ. أبعاد القاعدة
      let foundationLength: number, foundationWidth: number;
      
      if (inputs.foundationShape === 'مربع') {
        foundationLength = foundationWidth = Math.sqrt(foundationArea);
      } else {
        foundationWidth = Math.sqrt(foundationArea / 1.2);
        foundationLength = foundationWidth * 1.2;
      }

      const dimensionsText = `${foundationLength.toFixed(2)} × ${foundationWidth.toFixed(2)} متر`;

      // و. حساب حجم الخرسانة الفعلي في القواعد مع تطبيق حاشية الصب الثابتة
      // حساب الأبعاد الفعلية للقاعدة بعد تطبيق الحاشية
      const actualLength = Math.max(0.3, foundationLength - (2 * CONCRETE_MARGIN));
      const actualWidth = Math.max(0.3, foundationWidth - (2 * CONCRETE_MARGIN));
      
      // حجم قاعدة واحدة = الطول الفعلي × العرض الفعلي × ارتفاع القاعدة
      const foundationVolume = actualLength * actualWidth * foundationHeight;
      
      // حجم جميع القواعد = حجم قاعدة واحدة × عدد القواعد
      const foundationsVolume = foundationVolume * numberOfFoundations;

      // ز. إجمالي الخرسانة للمشروع
      const totalConcrete = cleaningVolume + foundationsVolume;

      setResults({
        cleaningVolume,
        totalLoad,
        loadPerFoundation,
        foundationArea,
        foundationDimensions: dimensionsText,
        foundationsVolume,
        totalConcrete,
        deadLoadPerSqm,
        liveLoadPerSqm,
        combinedLoadPerSqm
      });
      setError(null);

    } catch (error) {
      setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
    }
  };

  const resetCalculation = () => {
    setInputs({
      cleaningLength: '',
      cleaningWidth: '',
      cleaningHeight: '',
      numberOfFloors: '',
      floorArea: '',
      soilType: '',
      buildingType: '',
      foundationHeight: '',
      numberOfFoundations: '',
      foundationShape: '',
      foundationsSimilar: ''
    });
    setResults(null);
    setError(null);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50" dir="rtl">
        {/* Animated Background Pattern */}
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
          
          {/* Enhanced Header */}
          <div className="mb-12 lg:mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                  <Button variant="ghost" size="sm" className="border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm hover:border-emerald-300 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-emerald-800 hover:text-emerald-900">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    العودة للمشاريع
                  </Button>
                </Link>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-0 px-6 py-2.5 font-bold text-lg">
                  حساب الخرسانة المتقدم
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <LayoutDashboard className="w-4 h-4" />
                <span>حساب صبة النظافة + القواعد - مشروع #{projectId}</span>
              </div>
            </div>
            
            <div className="relative group">
              <div className="flex items-start lg:items-center gap-6 p-2">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                    <Blocks className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                    <Box className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-800 bg-clip-text text-transparent leading-tight mb-4">
                    حساب القواعد وصبة النظافة
                  </h1>
                  <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                    حساب دقيق لكميات الخرسانة وفق المعايير الهندسية الدولية
                  </p>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Enhanced Input Sections */}
            <div className="xl:col-span-8 space-y-6 lg:space-y-8">
              
              {/* Error Display */}
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

              {/* صبة النظافة */}
              <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">صبة النظافة</CardTitle>
                      <CardDescription className="text-emerald-100 text-base">
                        أبعاد الصبة الأساسية تحت المبنى
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'cleaningLength', label: 'الطول', placeholder: '20.0', step: '0.1' },
                      { id: 'cleaningWidth', label: 'العرض', placeholder: '15.0', step: '0.1' },
                      { id: 'cleaningHeight', label: 'الارتفاع', placeholder: '0.10', step: '0.01' }
                    ].map(({ id, label, placeholder, step }) => (
                      <InputField
                        key={id}
                        id={id}
                        label={label}
                        value={inputs[id as keyof typeof inputs] as string}
                        onChange={(value) => handleInputChange(id, value)}
                        placeholder={placeholder}
                        step={step}
                        unit="متر"
                        icon={Ruler}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* معلومات المبنى */}
              <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">معلومات المبنى</CardTitle>
                      <CardDescription className="text-blue-100 text-base">
                        البيانات الأساسية لتحديد الأحمال الهندسية
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InputField
                    id="numberOfFloors"
                    label="عدد الطوابق"
                    value={inputs.numberOfFloors}
                    onChange={(value) => handleInputChange('numberOfFloors', value)}
                    placeholder="4"
                    type="number"
                    unit="طابق"
                    icon={Layers}
                  />
                  <InputField
                    id="floorArea"
                    label="مساحة كل طابق"
                    value={inputs.floorArea}
                    onChange={(value) => handleInputChange('floorArea', value)}
                    placeholder="150"
                    step="0.1"
                    unit="م²"
                    icon={Grid}
                  />
                  <SelectField
                    id="soilType"
                    label="نوع التربة"
                    value={inputs.soilType}
                    onChange={(value) => handleInputChange('soilType', value)}
                    options={soilTypes.map((soil) => ({
                      value: soil.value,
                      label: `${soil.label} (${soil.capacity} كن/م²)`
                    }))}
                  />
                  <SelectField
                    id="buildingType"
                    label="نوع المبنى"
                    value={inputs.buildingType}
                    onChange={(value) => handleInputChange('buildingType', value)}
                    options={buildingTypes.map((type) => ({
                      value: type.value,
                      label: `${type.label} (ميتة ${type.dead} كن/م² | حية ${type.live} كن/م²)`
                    }))}
                    placeholder="اختر"
                  />
                </CardContent>
              </Card>

              {/* القواعد */}
              <Card className="border-0 shadow-xl shadow-orange-200/50 hover:shadow-orange-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                      <Grid className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">القواعد الخرسانية</CardTitle>
                      <CardDescription className="text-orange-100 text-base">
                        مواصفات فنية لتصميم القواعد
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InputField
                    id="foundationHeight"
                    label="ارتفاع القاعدة"
                    value={inputs.foundationHeight}
                    onChange={(value) => handleInputChange('foundationHeight', value)}
                    placeholder="0.60"
                    step="0.05"
                    unit="متر"
                    icon={Ruler}
                  />
                  <InputField
                    id="numberOfFoundations"
                    label="عدد القواعد"
                    value={inputs.numberOfFoundations}
                    onChange={(value) => handleInputChange('numberOfFoundations', value)}
                    placeholder="12"
                    type="number"
                    unit="قاعدة"
                    icon={Grid}
                  />
                  <SelectField
                    id="foundationShape"
                    label="شكل القاعدة"
                    value={inputs.foundationShape}
                    onChange={(value) => handleInputChange('foundationShape', value)}
                    options={[
                      { value: 'مربع', label: 'مربع' },
                      { value: 'مستطيل', label: 'مستطيل (نسبة 1.2:1)' }
                    ]}
                  />
                  <SelectField
                    id="foundationsSimilar"
                    label="القواعد متشابهة؟"
                    value={inputs.foundationsSimilar}
                    onChange={(value) => handleInputChange('foundationsSimilar', value)}
                    options={[
                      { value: 'نعم', label: 'نعم' },
                      { value: 'لا', label: 'لا' }
                    ]}
                  />
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <h4 className="font-bold text-amber-900">حاشية الصب</h4>
                      </div>
                      <p className="text-amber-800 font-medium">
                        حاشية الصب ثابتة بقيمة <span className="font-bold text-lg">{CONCRETE_MARGIN} متر</span> من كل جهة
                      </p>
                      <p className="text-amber-700 text-sm mt-2">
                        سيتم خصم هذه القيمة تلقائياً من جميع جوانب القاعدة عند حساب حجم الخرسانة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col lg:flex-row gap-4 pt-4">
                <Button 
                  onClick={calculateResults} 
                  className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-4">
                    <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    إجراء الحسابات الهندسية
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
                <Button 
                  onClick={resetCalculation} 
                  variant="outline" 
                  className="h-14 px-6 text-base font-black border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 shadow-xl hover:shadow-emerald-200 transition-all duration-500 rounded-2xl flex items-center gap-4"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  إعادة تعيين الكل
                </Button>
              </div>
            </div>

            {/* Enhanced Results Panel */}
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
                <CardContent className="p-6 pt-0">
                  {results ? (
                    <div className="space-y-6">
                      {/* Total Concrete Result */}
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center group-hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-700">
                          <div className="w-20 h-20 mx-auto mb-6 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                            <Calculator className="w-10 h-10 text-white drop-shadow-2xl" />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-indigo-100 font-bold text-lg tracking-wide">إجمالي الخرسانة المطلوبة</Label>
                            <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl leading-none">
                              {results.totalConcrete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                            </div>
                            <div className="text-lg font-bold text-indigo-100 tracking-wider">متر مكعب</div>
                            <div className="text-indigo-200 text-base font-medium">صبة نظافة + قواعد</div>
                          </div>
                        </div>
                      </div>

                      {/* Results Summary Table */}
                      <Card className="border-0 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0 pt-4 pb-4">
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { label: 'حجم صبة النظافة', value: `${results.cleaningVolume.toFixed(2)} م³`, color: 'from-emerald-400 to-teal-400', highlight: true },
                              { label: 'حجم القواعد', value: `${results.foundationsVolume.toFixed(2)} م³`, color: 'from-indigo-500 to-purple-500', highlight: true },
                              { label: 'أبعاد القواعد', value: results.foundationDimensions, color: 'from-slate-900 to-slate-700', highlight: true },
                              { label: 'الحمل الميت لكل متر مربع', value: `${results.deadLoadPerSqm.toFixed(2)} كن/م²`, color: 'from-slate-600 to-slate-800' },
                              { label: 'الحمل الحي لكل متر مربع', value: `${results.liveLoadPerSqm.toFixed(2)} كن/م²`, color: 'from-emerald-500 to-teal-500' },
                              { label: 'الإجمالي لكل متر مربع', value: `${results.combinedLoadPerSqm.toFixed(2)} كن/م²`, color: 'from-blue-500 to-indigo-500' },
                              { label: 'الحمل الكلي', value: `${results.totalLoad.toLocaleString('ar-EG')} كن`, color: 'from-purple-500 to-pink-500' },
                              { label: 'الحمل لكل قاعدة', value: `${results.loadPerFoundation.toLocaleString('ar-EG')} كن`, color: 'from-orange-500 to-amber-500' },
                              { label: 'مساحة القاعدة', value: `${results.foundationArea.toFixed(2)} م²`, color: 'from-cyan-500 to-blue-500' }
                            ].map(({ label, value, color, highlight }, index) => (
                              <div key={index} className={`group p-6 bg-gradient-to-r ${highlight ? 'from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'from-white/60 hover:from-white'} rounded-2xl ${highlight ? 'border-indigo-200' : 'border-slate-200 hover:border-indigo-300'} hover:shadow-lg transition-all duration-300 flex items-center justify-between`}>
                                <span className={`font-bold ${highlight ? 'text-indigo-900 text-lg' : 'text-slate-800 text-base'}`}>{label}:</span>
                                <span className={`font-black ${highlight ? 'text-xl' : 'text-lg'} bg-gradient-to-r ${color} bg-clip-text text-transparent px-4 py-1 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                  {value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-16 px-4">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-slate-200">
                        <Calculator className="w-12 h-12 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">جاهز للحسابات</h3>
                      <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                        املأ البيانات في النموذج المجاور واضغط "إجراء الحسابات الهندسية" للحصول على النتائج الدقيقة
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Reusable Input Component
function InputField({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder, 
  step = "any", 
  unit, 
  icon: Icon, 
  type = "number" 
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
}) {
  return (
    <div className="group">
      <Label htmlFor={id} className="text-base font-bold text-slate-900 mb-4 block flex items-center gap-2">
        {label}
      </Label>
      <div className="relative">
        {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />}
        <Input
          id={id}
          type={type}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-16 text-lg font-bold text-right pr-14 bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 shadow-xl focus:shadow-emerald-200/50 transition-all duration-400 rounded-3xl backdrop-blur-sm"
        />
        {unit && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base bg-slate-100 px-3 py-1 rounded-2xl shadow-md">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// Reusable Select Component
function SelectField({ 
  id, 
  label, 
  value, 
  onChange, 
  options,
  placeholder = "اختر..."
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-bold text-slate-900 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-16 text-lg font-bold text-right bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl focus:shadow-emerald-200/50 transition-all duration-400 rounded-3xl backdrop-blur-sm hover:border-emerald-300">
          <SelectValue placeholder={placeholder} className="text-slate-900 data-[placeholder]:text-slate-900" />
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl p-2">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-lg py-3 hover:bg-emerald-50 rounded-2xl transition-colors">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}