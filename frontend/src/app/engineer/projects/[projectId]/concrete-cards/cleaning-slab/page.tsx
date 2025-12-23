"use client";

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ArrowRight,
  Calculator,
  Layers,
  Ruler,
  Box,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Plus
} from "lucide-react";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function CleaningSlabCalculationPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  // State for inputs
  const [inputs, setInputs] = useState({
    length: '',
    width: '',
    height: '' // قيمة افتراضية لسمك صبة النظافة
  });

  // State for results
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calculate');

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateVolume = () => {
    setIsLoading(true);

    // محاكاة تأخير للحساب
    setTimeout(() => {
      try {
        const length = parseFloat(inputs.length);
        const width = parseFloat(inputs.width);
        const height = parseFloat(inputs.height);

        // التحقق من المدخلات
        if (isNaN(length) || isNaN(width) || isNaN(height)) {
          setError('يرجى إدخال قيم صحيحة لجميع الأبعاد');
          setIsLoading(false);
          return;
        }

        if (length <= 0 || width <= 0 || height <= 0) {
          setError('يجب أن تكون جميع الأبعاد أكبر من صفر');
          setIsLoading(false);
          return;
        }



        if (height < 0.05 || height > 0.20) {
          setError('سمك صبة النظافة عادة بين 5-20 سم');
          setIsLoading(false);
          return;
        }

        // حساب الحجم
        const volume = length * width * height;
        setResult(volume);
        setError(null);

      } catch (error) {
        setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const resetCalculation = () => {
    setInputs({
      length: '',
      width: '',
      height: ''
    });
    setResult(null);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      calculateVolume();
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50" dir="rtl">
      <TooltipProvider>
        <div className="container mx-auto px-4 py-8 lg:py-16 lg:px-8 max-w-7xl">

          {/* Header */}
          <div className="mb-8 lg:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                  <Button variant="ghost" size="sm" className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-blue-800 font-extrabold hover:text-blue-900 hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.8)] group">
                    <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                    العودة إلى حاسبة الباطون
                  </Button>
                </Link>

              </div>

            </div>

            <div className="relative group">
              <div className="flex items-start lg:items-center gap-6 lg:gap-8 mb-2 p-1">
                <div className="relative">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-2xl border-4 border-white/30 group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
                    <Layers className="w-8 h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 border-3 border-white rounded-xl flex items-center justify-center shadow-lg">
                    <Box className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 bg-clip-text text-transparent leading-tight mb-2">
                    حساب صبة النظافة
                  </h1>
                  <p className="text-lg lg:text-xl text-gray-600 font-medium leading-relaxed">
                    احسب كمية الخرسانة المطلوبة بدقة لصبة النظافة تحت الأساسات
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-2 gap-2 bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200 shadow-lg">
              <TabsTrigger value="calculate" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all">
                <Calculator className="w-4 h-4 ml-2" />
                الحساب
              </TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all">
                <Info className="w-4 h-4 ml-2" />
                معلومات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculate" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

                {/* Input Form */}
                <div className="xl:col-span-8">
                  <Card className="border-0 shadow-2xl shadow-blue-200/50 hover:shadow-blue-300/75 transition-all duration-500 overflow-hidden backdrop-blur-sm bg-white/80">
                    <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                          <Ruler className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl lg:text-2xl font-bold flex items-center gap-3">
                            أبعاد صبة النظافة
                          </CardTitle>
                          <CardDescription className="text-blue-100 opacity-90">
                            أدخل القياسات بدقة للحصول على حساب فوري
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8 pt-0">

                      {error && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-red-50 border border-red-200 rounded-2xl shadow-lg animate-in slide-in-from-top">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-red-900 mb-1">{error}</p>
                              <p className="text-sm text-red-700">يرجى تصحيح المدخلات والمحاولة مرة أخرى</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" onKeyDown={handleKeyPress}>
                        {[
                          { id: 'length', label: 'الطول', unit: 'متر', icon: Ruler },
                          { id: 'width', label: 'العرض', unit: 'متر', icon: Ruler },
                          { id: 'height', label: 'الارتفاع (السمك)', unit: 'متر', icon: Ruler }
                        ].map(({ id, label, unit, icon: Icon }) => (
                          <div key={id} className="group">
                            <Label htmlFor={id} className="text-base font-bold text-gray-900 mb-2 block flex items-center gap-2">
                              {label}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors text-xs">
                                    ?
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-gray-900 text-white px-3 py-2 rounded-xl text-sm shadow-2xl border-0">
                                  {label === 'الارتفاع (السمك)' ? 'سمك الصبة عادة 10 سم (0.10 م)' : 'قياس بالمتر'}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <div className="relative">
                              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 group-focus-within:text-blue-600" />
                              <Input
                                id={id}
                                type="number"
                                step={id === 'height' ? "0.01" : "0.1"}


                                value={inputs[id as keyof typeof inputs] as string}
                                onChange={(e) => handleInputChange(id, e.target.value)}
                                className="pr-10 pl-3 h-14 text-lg font-bold text-right bg-gradient-to-r from-white/70 to-blue-50/70 hover:from-white hover:to-blue-50 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 shadow-inner focus:shadow-xl transition-all duration-300 rounded-2xl backdrop-blur-sm"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>



                      <Separator className="my-6 bg-gradient-to-r from-blue-200 to-transparent" />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={calculateVolume}
                          disabled={isLoading}
                          className="flex-1 h-14 text-lg font-bold shadow-2xl hover:shadow-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0 group relative overflow-hidden"
                          size="lg"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              جاري الحساب...
                            </div>
                          ) : (
                            <>
                              <span className="relative z-10 flex items-center gap-3 text-slate-50 font-extrabold">
                                <Calculator className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                                حساب كمية الخرسانة
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={resetCalculation}
                          variant="outline"
                          className="h-14 px-6 text-lg font-bold border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 hover:text-green-900 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl flex items-center gap-3"
                          size="lg"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          إعادة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Panel */}
                <div className="xl:col-span-4">
                  <Card className="border-0 shadow-2xl shadow-emerald-200/50 hover:shadow-emerald-300/75 sticky top-8 h-fit backdrop-blur-sm bg-white/80 transition-all duration-500 overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                          <Box className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            النتيجة النهائية
                          </CardTitle>
                          <CardDescription className="text-emerald-100 opacity-90">
                            حجم الخرسانة المطلوب لصبة النظافة
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      {result !== null ? (
                        <div className="space-y-6">
                          <div className="group relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-sm text-center group-hover:shadow-3xl group-hover:-translate-y-2 transition-all duration-500 transform">
                              <div className="w-20 h-20 mx-auto mb-4 bg-white/30 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                                <Calculator className="w-10 h-10 text-white drop-shadow-lg" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-emerald-100 font-bold text-lg tracking-wide">إجمالي حجم الخرسانة</Label>
                                <div className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                                  {result.toFixed(3)}
                                </div>
                                <div className="text-xl font-bold text-emerald-100 tracking-wide">متر مكعب</div>
                              </div>
                            </div>
                          </div>

                          {/* Wastage Calculation */}
                          <Card className="border-0 bg-gradient-to-r from-amber-50/80 to-orange-50/80 backdrop-blur-sm">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-amber-900">الحجم الصافي:</span>
                                <span className="font-bold text-xl text-amber-700">{result.toFixed(3)} م³</span>
                              </div>

                              <Separator className="bg-amber-200" />

                            </CardContent>
                          </Card>

                        </div>
                      ) : (
                        <div className="text-center py-16 px-4">
                          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-gray-200">
                            <Calculator className="w-14 h-14 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-700 mb-3">جاهز للحساب</h3>
                          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                            أدخل أبعاد صبة النظافة في النموذج المجاور واضغط "حساب كمية الخرسانة" للحصول على النتيجة فوراً
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info">
              <Card className="border-0 shadow-2xl shadow-amber-200/50 backdrop-blur-sm bg-white/80">
                <CardHeader className="bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 text-white">
                  <div className="flex items-center gap-3">
                    <Info className="w-6 h-6" />
                    <div>
                      <CardTitle className="text-xl font-bold">معلومات عن صبة النظافة</CardTitle>
                      <CardDescription className="text-amber-100">
                        نصائح ومعايير تنفيذ صبة النظافة
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        معايير التنفيذ
                      </h4>
                      <ul className="space-y-3">
                        {[
                          'السمك القياسي: 10 سم (5-20 سم حسب التربة)',
                          'قوة الخرسانة: C20-C25',
                          'الركام: 3/4" بحد أقصى',
                          'التسليح: شبكة حديد 6 مم كل 20 سم',
                          'الخلطة: 1 أسمنت : 2 رمل : 4 حصى'
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-2 h-2 mt-2 bg-emerald-400 rounded-full flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        نصائح هامة
                      </h4>
                      <ul className="space-y-3">
                        {[
                          'تسوية وتدك التربة جيداً قبل الصب',
                          'تثبيت الفورم جيداً لمنع التسرب',
                          'البدء من النقاط المنخفضة إلى المرتفعة',
                          'المعالجة بالماء لمدة 7 أيام على الأقل',
                          'فحص التسوية باستخدام الميزان المائي'
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-2 h-2 mt-2 bg-amber-400 rounded-full flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </div>
  );
}