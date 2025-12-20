"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Grid3x3,
  Grid,
  Layers,
  Ruler,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Send
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

export default function GroundSlabCalculationPage() {
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

  const [reinforcementType, setReinforcementType] = useState<'mesh' | 'separate' | null>(null);
  const [meshData, setMeshData] = useState({
    slabArea: '',
    meshLength: '',
    meshWidth: '',
  });
  const [separateData, setSeparateData] = useState({
    floorWidth: '',
    floorLength: '',
    spacing: '',
    barLength: '',
  });

  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const validateMeshInputs = (): boolean => {
    const slabArea = parseFloat(meshData.slabArea);
    const meshLength = parseFloat(meshData.meshLength);
    const meshWidth = parseFloat(meshData.meshWidth);

    if (isNaN(slabArea) || slabArea <= 0) {
      setError('مساحة أرضية المبنى يجب أن تكون أكبر من صفر');
      return false;
    }
    if (isNaN(meshLength) || meshLength <= 0) {
      setError('طول شبك الحديد يجب أن يكون أكبر من صفر');
      return false;
    }
    if (isNaN(meshWidth) || meshWidth <= 0) {
      setError('عرض شبك الحديد يجب أن يكون أكبر من صفر');
      return false;
    }
    return true;
  };

  const validateSeparateInputs = (): boolean => {
    const floorWidth = parseFloat(separateData.floorWidth);
    const floorLength = parseFloat(separateData.floorLength);
    const spacing = parseFloat(separateData.spacing);
    const barLength = parseFloat(separateData.barLength);

    if (isNaN(floorWidth) || floorWidth <= 0) {
      setError('عرض الأرضية يجب أن يكون أكبر من صفر');
      return false;
    }
    if (isNaN(floorLength) || floorLength <= 0) {
      setError('طول الأرضية يجب أن يكون أكبر من صفر');
      return false;
    }
    if (isNaN(spacing) || spacing <= 0) {
      setError('المسافة بين القضبان يجب أن تكون أكبر من صفر');
      return false;
    }
    if (isNaN(barLength) || barLength <= 0) {
      setError('طول القضيب يجب أن يكون أكبر من صفر');
      return false;
    }
    return true;
  };

  const calculate = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Check if report already exists
      try {
        const reportsResponse = await fetch(`${API_BASE_URL}/api/steel-reports/project/${projectId}`);
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          if (reportsData.success && reportsData.reports?.length > 0) {
            const existingReport = reportsData.reports.find((r: any) => 
              r.calculationType === 'ground-slab-steel'
            );
            if (existingReport) {
              setExistingReportDialog({
                open: true,
                reportId: existingReport._id,
              });
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Could not check for existing reports:', err);
      }

      if (reinforcementType === 'mesh') {
        if (!validateMeshInputs()) {
          setIsLoading(false);
          return;
        }

        const slabArea = parseFloat(meshData.slabArea);
        const meshLength = parseFloat(meshData.meshLength);
        const meshWidth = parseFloat(meshData.meshWidth);

        const adjustedLength = meshLength - 0.2;
        const adjustedWidth = meshWidth - 0.2;
        const meshArea = adjustedLength * adjustedWidth;
        const meshBars = Math.ceil(slabArea / meshArea);

        setResults({
          type: 'mesh',
          meshBars,
          details: {
            adjustedLength,
            adjustedWidth,
            meshArea,
            slabArea
          }
        });

        toast({
          title: 'تم الحساب بنجاح',
          description: 'تم حساب كميات شبك الحديد',
        });
      } else if (reinforcementType === 'separate') {
        if (!validateSeparateInputs()) {
          setIsLoading(false);
          return;
        }

        const floorWidth = parseFloat(separateData.floorWidth);
        const floorLength = parseFloat(separateData.floorLength);
        const spacing = parseFloat(separateData.spacing);
        const barLength = parseFloat(separateData.barLength);

        const longitudinalCount = (floorWidth / spacing) * floorLength + 1;
        const longitudinalBars = Math.ceil(longitudinalCount / barLength);

        const transverseCount = (floorLength / spacing) * floorWidth + 1;
        const transverseBars = Math.ceil(transverseCount / barLength);

        const totalBars = longitudinalBars + transverseBars;

        setResults({
          type: 'separate',
          longitudinalBars,
          transverseBars,
          totalBars,
          details: {
            longitudinalCount,
            transverseCount,
            floorArea: floorWidth * floorLength
          }
        });

        toast({
          title: 'تم الحساب بنجاح',
          description: 'تم حساب كميات الحديد المفرق',
        });
      }
    } catch (e) {
      setError('حدث خطأ في الحساب. يرجى التحقق من المدخلات.');
      console.error('Calculation error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!existingReportDialog.reportId) {
      setExistingReportDialog({ open: false, reportId: null });
      calculate();
      return;
    }

    try {
      const deleteResponse = await fetch(`${API_BASE_URL}/api/steel-reports/${existingReportDialog.reportId}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        toast({
          title: 'تم حذف التقرير السابق',
          description: 'تم حذف التقرير السابق بنجاح',
        });
      }

      setExistingReportDialog({ open: false, reportId: null });
      calculate();
    } catch (error) {
      console.error('Error deleting existing report:', error);
      toast({
        title: 'تحذير',
        description: 'لم يتم حذف التقرير السابق، سيتم تحديث التقرير الحالي',
        variant: 'destructive'
      });
      setExistingReportDialog({ open: false, reportId: null });
      calculate();
    }
  };

  const reset = () => {
    setReinforcementType(null);
    setMeshData({ slabArea: '', meshLength: '', meshWidth: '' });
    setSeparateData({ floorWidth: '', floorLength: '', spacing: '', barLength: '' });
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
        calculationType: 'ground-slab',
        steelData: {
          totalSteelWeight: results.type === 'mesh' ? results.meshBars : results.totalBars,
          foundationSteel: 0,
          columnSteel: 0,
          beamSteel: 0,
          slabSteel: results.type === 'mesh' ? results.meshBars : results.totalBars,
          details: {
            reinforcementType: reinforcementType,
            inputs: reinforcementType === 'mesh' ? meshData : separateData,
            results: results,
            timestamp: new Date().toISOString()
          }
        },
        calculationData: {
          reinforcementType: reinforcementType,
          inputs: reinforcementType === 'mesh' ? meshData : separateData,
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50" dir="rtl">
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link href={`/engineer/projects/${projectId}/steel-calculations`}>
                <Button variant="ghost" size="sm" className="border-2 border-emerald-200/50 bg-white/80 backdrop-blur-sm hover:border-emerald-300 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-emerald-800 hover:text-emerald-900">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  العودة إلى حاسبة الحديد
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative group">
            <div className="flex items-start lg:items-center gap-6 p-2">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                  <Grid3x3 className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                  <Layers className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-orange-800 bg-clip-text text-transparent leading-tight mb-4">
                  حساب حديد أرضية المبنى
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                  احسب كميات الحديد المطلوبة لأرضية المبنى بدقة عالية
                </p>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-400/20 via-amber-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
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

            {/* Reinforcement Type Selection */}
            <Card className="border-0 shadow-xl shadow-orange-200/50 hover:shadow-orange-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white py-6 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                    <Layers className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">اختر نوع التسليح</CardTitle>
                    <CardDescription className="text-orange-100 text-base">
                      اختر طريقة حساب حديد أرضية المبنى
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => {
                      setReinforcementType('mesh');
                      setResults(null);
                      setError(null);
                    }}
                    className={`p-8 rounded-2xl border-2 transition-all duration-300 text-center group hover:shadow-lg ${
                      reinforcementType === 'mesh'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="text-2xl text-white">🔗</div>
                    </div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2">شبك حديد</h3>
                    <p className="text-gray-600 text-sm">استخدام شبك حديد موحد</p>
                    {reinforcementType === 'mesh' && (
                      <Badge className="mt-3 bg-orange-500">محدد</Badge>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setReinforcementType('separate');
                      setResults(null);
                      setError(null);
                    }}
                    className={`p-8 rounded-2xl border-2 transition-all duration-300 text-center group hover:shadow-lg ${
                      reinforcementType === 'separate'
                        ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="text-2xl text-white">📊</div>
                    </div>
                    <h3 className="font-bold text-xl text-gray-800 mb-2">حديد مفرق</h3>
                    <p className="text-gray-600 text-sm">قضبان حديد منفصلة</p>
                    {reinforcementType === 'separate' && (
                      <Badge className="mt-3 bg-orange-500">محدد</Badge>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Calculation Forms */}
            {reinforcementType && (
              <Card className="border-0 shadow-xl shadow-orange-200/50 hover:shadow-orange-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">بيانات الحساب</CardTitle>
                      <CardDescription className="text-orange-100 text-base">
                        {reinforcementType === 'mesh' ? 'بيانات شبك الحديد' : 'بيانات الحديد المفرق'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {reinforcementType === 'mesh' ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField
                          id="slabArea"
                          label="مساحة الأرضية"
                          value={meshData.slabArea}
                          onChange={(v) => setMeshData({ ...meshData, slabArea: v })}
                          unit="م²"
                          icon={Grid}
                        />
                        <InputField
                          id="meshLength"
                          label="طول الشبك"
                          value={meshData.meshLength}
                          onChange={(v) => setMeshData({ ...meshData, meshLength: v })}
                          unit="متر"
                          icon={Ruler}
                        />
                        <InputField
                          id="meshWidth"
                          label="عرض الشبك"
                          value={meshData.meshWidth}
                          onChange={(v) => setMeshData({ ...meshData, meshWidth: v })}
                          unit="متر"
                          icon={Ruler}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        id="floorWidth"
                        label="عرض الأرضية"
                        value={separateData.floorWidth}
                        onChange={(v) => setSeparateData({ ...separateData, floorWidth: v })}
                        unit="متر"
                        icon={Ruler}
                      />
                      <InputField
                        id="floorLength"
                        label="طول الأرضية"
                        value={separateData.floorLength}
                        onChange={(v) => setSeparateData({ ...separateData, floorLength: v })}
                        unit="متر"
                        icon={Ruler}
                      />
                      <InputField
                        id="spacing"
                        label="المسافة بين القضبان"
                        value={separateData.spacing}
                        onChange={(v) => setSeparateData({ ...separateData, spacing: v })}
                        unit="متر"
                        icon={Ruler}
                      />
                      <InputField
                        id="barLength"
                        label="طول القضيب"
                        value={separateData.barLength}
                        onChange={(v) => setSeparateData({ ...separateData, barLength: v })}
                        unit="متر"
                        icon={Ruler}
                      />
                    </div>
                  )}

                  <div className="flex gap-4 mt-8">
                    <Button
                      onClick={calculate}
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
                          إجراء الحسابات
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results & Reports */}
          <div className="xl:col-span-4 space-y-6">
            {/* Results Panel */}
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
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-md text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                          <Calculator className="w-8 h-8 text-white drop-shadow-2xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-indigo-100 font-bold text-lg">
                            {results.type === 'mesh' ? 'عدد قطع الشبك' : 'إجمالي القضبان'}
                          </Label>
                          <div className="text-4xl font-black bg-gradient-to-r from-white via-indigo-50 to-white bg-clip-text text-transparent drop-shadow-3xl">
                            {(results.type === 'mesh' ? results.meshBars : results.totalBars)?.toLocaleString('ar')}
                          </div>
                          <div className="text-lg font-bold text-indigo-100">
                            {results.type === 'mesh' ? 'شبكة' : 'قضيب'}
                          </div>
                        </div>
                      </div>
                    </div>

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
                      املأ البيانات واضغط "إجراء الحسابات" للحصول على النتائج
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
        if (!open) setExistingReportDialog({ open: false, reportId: null });
      }}>
        <AlertDialogContent className="max-w-2xl border-0 shadow-2xl shadow-orange-200/50 backdrop-blur-sm bg-white/95">
          <AlertDialogHeader className="space-y-4 pb-6">
            <div className="flex items-center gap-4 p-2">
              <div className="relative">
                <div className="w-16 h-16 p-4 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl shadow-2xl border-4 border-white/40 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white drop-shadow-2xl" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-400 to-orange-400 border-2 border-white rounded-full shadow-xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <AlertDialogTitle className="text-2xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-orange-800 bg-clip-text text-transparent leading-tight">
                  تحذير: تقرير موجود مسبقاً
                </AlertDialogTitle>
                <p className="text-lg text-slate-600 font-semibold leading-relaxed mt-2">
                  تم حساب حديد أرضية المبنى مسبقاً والتقرير جاهز
                </p>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200 rounded-2xl shadow-xl backdrop-blur-sm">
              <AlertDialogDescription className="text-base text-slate-700 font-medium leading-relaxed text-center">
                هل تريد حذف التقرير السابق وحساب حديد أرضية المبنى من جديد؟
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-4 pt-4">
            <AlertDialogCancel className="h-14 px-8 text-lg font-bold border-2 border-slate-300 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800 shadow-xl transition-all duration-300">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRecalculate}
              className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
            >
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