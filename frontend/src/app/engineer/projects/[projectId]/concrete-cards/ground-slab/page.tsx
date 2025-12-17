"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Blocks,
  Box,
  Calculator,
  Grid,
  LayoutDashboard,
  Layers,
  Ruler,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

export default function GroundSlabPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingReportDialog, setExistingReportDialog] = useState<{
    open: boolean;
    reportId: string | null;
  }>({
    open: false,
    reportId: null,
  });
  const [inputs, setInputs] = useState({
    slabArea: '', // m^2
    slabThickness: '', // m
  });

  const [results, setResults] = useState<null | {
    groundSlabVolume: number;
    totalConcrete: number;
  }>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const calculate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const slabArea = parseFloat(inputs.slabArea);
      const slabThickness = parseFloat(inputs.slabThickness);

      if (isNaN(slabArea) || isNaN(slabThickness) || slabArea <= 0 || slabThickness <= 0) {
        setError('يرجى ملء جميع الحقول المطلوبة بقيم صحيحة');
        setIsLoading(false);
        return;
      }

      // Check if report already exists for this project and calculation type
      try {
        const reportsResponse = await fetch(`${API_BASE_URL}/api/quantity-reports/project/${projectId}`);
        const reportsData = await reportsResponse.json();
        
        if (reportsData.success && reportsData.reports && reportsData.reports.length > 0) {
          const existingReport = reportsData.reports.find((r: any) => r.calculationType === 'ground-slab');
          
          if (existingReport) {
            // Show warning dialog
            setExistingReportDialog({
              open: true,
              reportId: existingReport._id,
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not check for existing reports:', err);
        // Continue with calculation if check fails
      }

      // قانون حساب حجم الخرسانة: المساحة * السماكة
      const groundSlabVolume = slabArea * slabThickness; // m3

      setResults({ 
        groundSlabVolume, 
        totalConcrete: groundSlabVolume
      });
      setError(null);
      toast({
        title: 'تم الحساب بنجاح',
        description: 'تم حساب كميات خرسانة أرضية المبنى',
      });
    } catch (e) {
      setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!existingReportDialog.reportId) {
      setExistingReportDialog({ open: false, reportId: null });
      // Continue with calculation by calling calculate again
      calculate();
      return;
    }

    try {
      // Delete existing report (soft delete)
      const deleteResponse = await fetch(`${API_BASE_URL}/api/quantity-reports/${existingReportDialog.reportId}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        toast({
          title: 'تم حذف التقرير السابق',
          description: 'تم حذف التقرير السابق بنجاح',
        });
      }

      // Close dialog and continue with calculation
      setExistingReportDialog({ open: false, reportId: null });
      
      // Continue with calculation by calling calculate again
      calculate();
    } catch (error) {
      console.error('Error deleting existing report:', error);
      toast({
        title: 'تحذير',
        description: 'لم يتم حذف التقرير السابق، سيتم تحديث التقرير الحالي',
        variant: 'destructive'
      });
      setExistingReportDialog({ open: false, reportId: null });
      // Continue with calculation anyway
      calculate();
    }
  };

  const reset = () => {
    setInputs({
      slabArea: '',
      slabThickness: '',
    });
    setResults(null);
    setError(null);
  };

  const saveToReports = async () => {
    if (!results) {
      toast({ title: 'لا توجد نتائج', description: 'يرجى إجراء الحسابات أولاً', variant: 'destructive' });
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
        throw new Error('الخادم لا يستجيب بتنسيق JSON صحيح. تأكد من تشغيل الخادم الخلفي.');
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
        calculationType: 'ground-slab',
        concreteData: {
          cleaningVolume: 0,
          foundationsVolume: 0,
          groundSlabVolume: results.groundSlabVolume,
          totalConcrete: results.groundSlabVolume,
          groundSlabInputs: {
            slabArea: parseFloat(inputs.slabArea),
            slabThickness: parseFloat(inputs.slabThickness),
          },
        },
        // إزالة بيانات الحديد - لم تبدأ حسابات الحديد بعد
        steelData: {
          totalSteelWeight: 0,
          foundationSteel: 0,
          columnSteel: 0,
          beamSteel: 0,
          slabSteel: 0,
        },
        sentToOwner: false
      };

      const response = await fetch(`${API_BASE_URL}/api/quantity-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'تم الحفظ بنجاح', description: 'تم ترحيل النتائج إلى صفحة تقارير الكميات' });
        router.push(`/engineer/quantity-reports/${projectId}`);
      } else {
        throw new Error(data.message || 'فشل في حفظ التقرير');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ التقرير';
      toast({ title: 'خطأ في الحفظ', description: errorMessage, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50" dir="rtl">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                <Button variant="ghost" size="sm" className="border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm hover:border-emerald-300 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-emerald-800 hover:text-emerald-900">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  العودة إلى صفحة كروت الباطون
                </Button>
              </Link>
              
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
                  حساب أرضية المبنى (المده)
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                  حساب حجم الخرسانة لأرضية المبنى    
                </p>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Inputs */}
          <div className="xl:col-span-8 space-y-6 lg:space-y-8">
            {/* Error */}
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

            {/* Ground slab inputs - مبسطة */}
            <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">بيانات أرضية المبنى</CardTitle>
                    <CardDescription className="text-emerald-100 text-base">
                      المساحة وسماكة الخرسانة
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    id="slabArea"
                    label="مساحة الأرضية"
                    value={inputs.slabArea}
                    onChange={(v) => handleInputChange('slabArea', v)}
                    
                    unit="م²"
                    icon={Grid}
                  />
                  <InputField
                    id="slabThickness"
                    label="سماكة الخرسانة (الارتفاع)"
                    value={inputs.slabThickness}
                    onChange={(v) => handleInputChange('slabThickness', v)}
                    
                    unit="متر"
                    icon={Ruler}
                  />
                </div>
                
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 pt-4">
              <Button 
                onClick={calculate}
                disabled={isLoading}
                className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <span className="relative z-10 flex items-center gap-4">
                    <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    إجراء الحسابات
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
              <Button 
                onClick={reset}
                variant="outline" 
                className="h-14 px-6 text-base font-black border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 shadow-xl hover:shadow-emerald-200 transition-all duration-500 rounded-2xl flex items-center gap-4"
              >
                <CheckCircle2 className="w-5 h-5" />
                إعادة تعيين
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="xl:col-span-4">
            <Card className="border-0 shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/60 sticky top-8 h-fit backdrop-blur-sm bg-white/90 transition-all duration-500 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white py-8 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">النتائج</CardTitle>
                    
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {results ? (
                  <div className="space-y-6">
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center group-hover:shadow-3xl group-hover:-translate-y-1 transition-all duration-700">
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-500">
                          <Calculator className="w-10 h-10 text-white drop-shadow-2xl" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-indigo-100 font-bold text-lg tracking-wide">حجم خرسانة أرضية المبنى</Label>
                          <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl leading-none">
                            {results.groundSlabVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                          </div>
                          <div className="text-lg font-bold text-indigo-100 tracking-wider">متر مكعب</div>
                        </div>
                      </div>
                    </div>

                    <Card className="border-0 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-0 pt-4 pb-4">
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { label: 'المساحة المدخلة', value: `${parseFloat(inputs.slabArea).toFixed(2)} م²`, color: 'from-emerald-400 to-teal-400' },
                            { label: 'السماكة المدخلة', value: `${parseFloat(inputs.slabThickness).toFixed(2)} م`, color: 'from-blue-400 to-indigo-400' },
                            { label: 'حجم الخرسانة', value: `${results.groundSlabVolume.toFixed(2)} م³`, color: 'from-indigo-500 to-purple-500', highlight: true },
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

                    <Button
                      onClick={saveToReports}
                      disabled={saving}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl"
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
                          <TrendingUp className="w-5 h-5 ml-2" />
                          ترحيل إلى تقارير الكميات
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-slate-200">
                      <Calculator className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">جاهز للحسابات</h3>
                    <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                      املأ البيانات في النموذج واضغط "إجراء الحسابات" للحصول على النتائج
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Alert Dialog for Existing Report */}
      <AlertDialog open={existingReportDialog.open} onOpenChange={(open) => {
        if (!open) {
          setExistingReportDialog({ open: false, reportId: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تحذير: تقرير موجود مسبقاً</AlertDialogTitle>
            <AlertDialogDescription>
              تم حساب أرضية المبنى مسبقاً والتقرير جاهز. هل تريد حذف التقرير السابق وحساب أرضية المبنى من جديد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecalculate}>
              نعم، احذف التقرير السابق وأعد الحساب
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
        {label}
      </Label>
      <div className="relative">
        {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />}
        <Input
          id={id}
          type={type}
          
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