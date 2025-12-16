"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Building2,
  ArrowRight,
  Calculator,
  Ruler,
  Box,
  CheckCircle2,
  AlertCircle,
  Grid,
  LayoutDashboard,
  Component,
  Plus,
  Trash2
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper component for input fields
function InputField({ id, label, value, onChange, placeholder, type = "number", step = "0.1", unit, icon: Icon }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  unit: string;
  icon: any;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          step={step}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-12 pl-3 h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">{unit}</span>
      </div>
    </div>
  );
}

// Bridge interface
interface Bridge {
  id: string;
  length: string;
  width: string;
  height: string;
}

export default function GroundBridgesCalculationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;
  const [saving, setSaving] = useState(false);

  // State for bridges
  const [bridges, setBridges] = useState<Bridge[]>([
    { id: '1', length: '', width: '', height: '' }
  ]);

  // State for server availability
  const [serverAvailable, setServerAvailable] = useState(true);

  // State for results and errors
  const [results, setResults] = useState<{
    bridges: Array<{
      id: string;
      length: number;
      width: number;
      height: number;
      volume: number;
    }>;
    totalVolume: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add new bridge
  const addBridge = () => {
    const newId = (bridges.length + 1).toString();
    setBridges([...bridges, { id: newId, length: '', width: '', height: '' }]);
  };

  // Remove bridge
  const removeBridge = (id: string) => {
    if (bridges.length > 1) {
      setBridges(bridges.filter(bridge => bridge.id !== id));
    }
  };

  // Update bridge data
  const updateBridge = (id: string, field: keyof Omit<Bridge, 'id'>, value: string) => {
    setBridges(bridges.map(bridge => 
      bridge.id === id ? { ...bridge, [field]: value } : bridge
    ));
    if (error) setError(null);
  };

  // Check server availability
  const checkServerAvailability = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setServerAvailable(response.ok);
      return response.ok;
    } catch (error) {
      setServerAvailable(false);
      return false;
    }
  };

  // Check server on component mount
  useEffect(() => {
    checkServerAvailability();
  }, []);

  const calculateResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      for (const bridge of bridges) {
        if (!bridge.length || !bridge.width || !bridge.height) {
          setError('يرجى ملء جميع أبعاد الجسور');
          setIsLoading(false);
          return;
        }
      }

      // Convert to numbers and validate
      const calculatedBridges = bridges.map(bridge => {
        const length = parseFloat(bridge.length);
        const width = parseFloat(bridge.width);
        const height = parseFloat(bridge.height);

        if (isNaN(length) || isNaN(width) || isNaN(height) || 
            length <= 0 || width <= 0 || height <= 0) {
          throw new Error(`أبعاد الجسر ${bridge.id} غير صالحة`);
        }

        // حساب حجم الخرسانة للجسر الواحد
        const volume = length * width * height;

        return {
          id: bridge.id,
          length,
          width,
          height,
          volume
        };
      });

      // حساب إجمالي حجم الخرسانة
      const totalVolume = calculatedBridges.reduce((sum, bridge) => sum + bridge.volume, 0);

      const computedResults = {
        bridges: calculatedBridges,
        totalVolume
      };

      setResults(computedResults);
      toast({
        title: 'تم الحساب بنجاح',
        description: 'تم حساب كميات خرسانة الجسور الأرضية',
      });
    } catch (error) {
      console.error('Calculation error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('حدث خطأ غير متوقع أثناء الحساب');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetCalculation = () => {
    setBridges([{ id: '1', length: '', width: '', height: '' }]);
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
        throw new Error(`HTTP error! status: ${projectRes.status}`);
      }
      
      const projectContentType = projectRes.headers.get('content-type');
      if (!projectContentType || !projectContentType.includes('application/json')) {
        throw new Error('الخادم لا يستجيب بتنسيق JSON صحيح. تأكد من تشغيل الخادم الخلفي.');
      }
      
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;
      
      // تحضير البيانات للحفظ في قاعدة البيانات
      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'ground-bridges',
        concreteData: {
          ...results,
          totalConcrete: results.totalVolume,
          bridgesCount: results.bridges.length
        },
        steelData: {
          totalSteelWeight: results.totalVolume * 120, // 120 kg/m³ for bridges
        }
      };

      // حفظ النتائج في قاعدة البيانات
      const response = await fetch('http://localhost:5000/api/quantity-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseContentType = response.headers.get('content-type');
      if (!responseContentType || !responseContentType.includes('application/json')) {
        throw new Error('الخادم لا يستجيب بتنسيق JSON صحيح');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم حفظ كميات خرسانة الجسور الأرضية في قاعدة البيانات',
        });
        
        // Navigate to reports page
        router.push(`/engineer/quantity-reports/${projectId}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      
      let errorMessage = 'حدث خطأ أثناء حفظ التقرير';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي على المنفذ 5000';
        } else if (error.message.includes('JSON')) {
          errorMessage = error.message;
        } else if (error.message.includes('HTTP error')) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة مرة أخرى';
        }
      }
      
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
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
                  <Button variant="ghost" size="sm" className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-blue-800 hover:text-blue-900">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    العودة للمشاريع
                  </Button>
                </Link>
                
              </div>
              
            </div>
            
            <div className="relative group">
              <div className="flex items-start lg:items-center gap-6 p-2">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                    <Component className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                    <Box className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight mb-4">
                    حساب الجسور الأرضية
                  </h1>
                  <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                    حساب دقيق لكميات الخرسانة في الجسور الأرضية وفق المعايير الهندسية
                  </p>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-indigo-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Enhanced Input Sections */}
            <div className="xl:col-span-8 space-y-6 lg:space-y-8">
              
              {/* Server Status Warning */}
              {!serverAvailable && (
                <div className="p-4 lg:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-900 mb-2">تحذير: الخادم الخلفي غير متاح</p>
                      <p className="text-amber-700">
                        لا يمكن حفظ النتائج. يمكنك إجراء الحسابات لكن لن يتم حفظها.
                      </p>
                      <p className="text-amber-600 text-sm mt-2">
                        تأكد من تشغيل الخادم الخلفي على المنفذ 5000
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* بيانات الجسور الأرضية */}
              <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                        <Component className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">بيانات الجسور الأرضية</CardTitle>
                        <CardDescription className="text-blue-100 text-base">
                          أبعاد الجسور الأرضية لحساب كمية الخرسانة
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={addBridge}
                      className="bg-white/20 hover:bg-white/30 text-white border border-white/40 h-10 px-4 rounded-xl transition-all duration-300"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة جسر
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 space-y-6">
                  {/* معلومات المعادلة */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-blue-900">معادلة الحساب</h4>
                    </div>
                    <p className="text-blue-800 font-medium">
                      حجم خرسانة الجسر الأرضي = <span className="font-bold">الطول × السمك × الارتفاع</span>
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      إجمالي الحجم = مجموع أحجام جميع الجسور
                    </p>
                  </div>

                  {/* قائمة الجسور */}
                  <div className="space-y-4">
                    {bridges.map((bridge, index) => (
                      <div key={bridge.id} className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <Component className="w-4 h-4 text-blue-600" />
                            الجسر الأرضي #{bridge.id}
                          </h4>
                          {bridges.length > 1 && (
                            <Button
                              onClick={() => removeBridge(bridge.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <InputField
                            id={`length-${bridge.id}`}
                            label="طول الجسر"
                            value={bridge.length}
                            onChange={(value) => updateBridge(bridge.id, 'length', value)}
                            placeholder="5.0"
                            step="0.1"
                            unit="متر"
                            icon={Ruler}
                          />
                          <InputField
                            id={`width-${bridge.id}`}
                            label="سمك الجسر"
                            value={bridge.width}
                            onChange={(value) => updateBridge(bridge.id, 'width', value)}
                            placeholder="0.3"
                            step="0.1"
                            unit="متر"
                            icon={Ruler}
                          />
                          <InputField
                            id={`height-${bridge.id}`}
                            label="ارتفاع الجسر"
                            value={bridge.height}
                            onChange={(value) => updateBridge(bridge.id, 'height', value)}
                            placeholder="0.5"
                            step="0.1"
                            unit="متر"
                            icon={Ruler}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      onClick={calculateResults} 
                      disabled={isLoading}
                      className="flex-1 h-14 text-lg font-bold shadow-2xl hover:shadow-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          جاري الحساب...
                        </div>
                      ) : (
                        <>
                          <Calculator className="w-5 h-5 ml-2" />
                          حساب كميات الخرسانة
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={resetCalculation} 
                      variant="outline" 
                      className="h-14 px-6 text-lg font-bold border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-900 transition-all duration-300 rounded-2xl flex items-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      إعادة تعيين
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
                        النتائج
                      </CardTitle>
                      <CardDescription className="text-emerald-100 opacity-90">
                        كميات الخرسانة المحسوبة
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {results ? (
                    <div className="space-y-6">
                      {/* Main Result */}
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-sm text-center group-hover:shadow-3xl group-hover:-translate-y-2 transition-all duration-500 transform">
                          <div className="w-16 h-16 mx-auto mb-3 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                            <Calculator className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-emerald-100 font-bold text-sm tracking-wide">إجمالي حجم الخرسانة</Label>
                            <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                              {results.totalVolume.toFixed(3)}
                            </div>
                            <div className="text-lg font-bold text-emerald-100 tracking-wide">متر مكعب</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Results */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Component className="w-4 h-4" />
                            ملخص الجسور
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">عدد الجسور:</span>
                              <span className="font-bold text-blue-900">{results.bridges.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">إجمالي الحجم:</span>
                              <span className="font-bold text-blue-900">{results.totalVolume.toFixed(3)} م³</span>
                            </div>
                          </div>
                        </div>

                        {/* Individual Bridge Results */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {results.bridges.map((bridge) => (
                            <div key={bridge.id} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
                              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <Grid className="w-4 h-4" />
                                الجسر #{bridge.id}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-purple-700">الطول:</span>
                                  <span className="font-bold text-purple-900">{bridge.length.toFixed(2)} م</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-purple-700">السمك:</span>
                                  <span className="font-bold text-purple-900">{bridge.width.toFixed(2)} م</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-purple-700">الارتفاع:</span>
                                  <span className="font-bold text-purple-900">{bridge.height.toFixed(2)} م</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between">
                                  <span className="text-purple-700 font-bold">الحجم:</span>
                                  <span className="font-bold text-purple-900">{bridge.volume.toFixed(3)} م³</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save Button */}
                      <Button 
                        onClick={async () => {
                          if (!serverAvailable) {
                            // Save locally if server is not available
                            const localData = {
                              projectId,
                              results,
                              timestamp: new Date().toISOString()
                            };
                            localStorage.setItem(`ground-bridges-${projectId}`, JSON.stringify(localData));
                            toast({
                              title: 'تم الحفظ محلياً',
                              description: 'تم حفظ النتائج في المتصفح. ستحتاج لإعادة الحفظ عند توفر الخادم',
                            });
                            return;
                          }
                          await saveToReports();
                        }} 
                        disabled={saving}
                        className="w-full h-12 font-bold shadow-lg hover:shadow-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl border-0"
                      >
                        {saving ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            جاري الحفظ...
                          </div>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            {serverAvailable ? 'حفظ في التقارير' : 'حفظ محلي'}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                        <Calculator className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد نتائج بعد</h3>
                      <p className="text-gray-600 mb-6">
                        أدخل أبعاد الجسور الأرضية واضغط على "حساب كميات الخرسانة" لعرض النتائج
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