"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
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
  Plus,
  Trash2,
  AlertTriangle,
  RulerIcon,
  BarChart3,
  Package,
  Warehouse,
  Equal,
  Hash
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- Components moved outside to fix focus issue ---

// InputField Component
const InputField = ({ id, label, value, onChange, unit, icon: Icon, type = "number", placeholder = "" }: any) => (
  <div className="group">
    <Label htmlFor={id} className="text-base font-bold text-slate-900 mb-4 block text-right">
      {label}
    </Label>
    <div className="relative">
      {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500 group-focus-within:text-emerald-600 transition-colors" />}
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-16 text-lg font-bold text-right pr-14 bg-gradient-to-r from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-emerald-300 focus:border-emerald-500 shadow-xl focus:shadow-emerald-200/50 transition-all duration-400 rounded-3xl backdrop-blur-sm"
        dir="rtl"
      />
      {unit && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base bg-slate-100 px-3 py-1 rounded-2xl shadow-md">
          {unit}
        </span>
      )}
    </div>
  </div>
);

// SelectField Component
const SelectField = ({ id, label, value, onChange, options, placeholder = "اختر..." }: any) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-base font-bold text-slate-900 block text-right">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-16 text-lg font-bold text-right bg-gradient-to-r from-white/80 to-slate-50/80 border-2 border-slate-200 focus:border-emerald-500 shadow-xl focus:shadow-emerald-200/50 transition-all duration-400 rounded-3xl backdrop-blur-sm hover:border-emerald-300" dir="rtl">
        <SelectValue placeholder={placeholder} className="text-slate-900 data-[placeholder]:text-slate-900 text-right" />
      </SelectTrigger>
      <SelectContent className="bg-white/95 backdrop-blur-md border-emerald-200 shadow-2xl rounded-3xl p-2" dir="rtl">
        {options.map((option: any) => (
          <SelectItem key={option.value} value={option.value} className="text-lg py-3 hover:bg-emerald-50 rounded-2xl transition-colors text-right">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// ---------------------------------------------------

export default function FoundationCalculationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;
  const [saving, setSaving] = useState(false);
  const [existingReportDialog, setExistingReportDialog] = useState<{
    open: boolean;
    reportId: string | null;
  }>({
    open: false,
    reportId: null,
  });

  // State for foundation dimensions calculation inputs
  const [dimensionInputs, setDimensionInputs] = useState({
    numberOfFloors: '',
    floorArea: '',
    soilType: '',
    buildingType: '',
    foundationShape: 'مربع',
  });

  // نتائج الأبعاد (منفصلة)
  const [dimensionResults, setDimensionResults] = useState<{
    foundationDimensions?: string | null;
    totalFoundationArea?: number | null;
  }>({});

  // State for concrete calculation type
  const [foundationsSimilar, setFoundationsSimilar] = useState<'نعم' | 'لا'>('نعم');

  // State for similar foundations inputs
  const [similarFoundations, setSimilarFoundations] = useState({
    cleaningLength: '',
    cleaningWidth: '',
    cleaningHeight: '',
    foundationHeight: '',
    numberOfFoundations: '',
    foundationCleaningLength: '',
    foundationCleaningWidth: '',
  });

  // State for different foundations inputs
  const [differentFoundations, setDifferentFoundations] = useState<Array<{
    id: number,
    cleaningLength: string,
    cleaningWidth: string,
    height: string,
    concreteVolume?: number
  }>>([]);
  const [nextFoundationId, setNextFoundationId] = useState(1);

  // State for general cleaning inputs
  const [generalCleaning, setGeneralCleaning] = useState({
    cleaningLength: '',
    cleaningWidth: '',
    cleaningHeight: '',
  });

  // --- النتائج المنفصلة (نفس طريقة الأعمدة) ---

  // نتائج القواعد المتشابهة
  const [similarResults, setSimilarResults] = useState({
    generalCleaningVolume: 0,
    similarFoundationsVolume: 0,
    totalSimilarVolume: 0,
    count: 0
  });

  // نتائج القواعد المختلفة
  const [differentResults, setDifferentResults] = useState({
    differentFoundationsVolume: 0,
    count: 0
  });

  // الإجمالي الكلي (يجمع المتشابهة والمختلفة)
  const [totalAllFoundations, setTotalAllFoundations] = useState({
    totalConcrete: 0,
    totalFoundationVolume: 0,
    totalCount: 0
  });

  const [error, setError] = useState<string | null>(null);

  // Constants
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

  // Handlers
  const handleDimensionInputChange = (field: string, value: string) => {
    setDimensionInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneralCleaningChange = (field: string, value: string) => {
    setGeneralCleaning(prev => ({ ...prev, [field]: value }));
  };

  const handleSimilarFoundationsChange = (field: string, value: string) => {
    setSimilarFoundations(prev => ({ ...prev, [field]: value }));
  };

  const addDifferentFoundation = () => {
    setDifferentFoundations(prev => [...prev, {
      id: nextFoundationId,
      cleaningLength: '',
      cleaningWidth: '',
      height: '',
      concreteVolume: 0
    }]);
    setNextFoundationId(prev => prev + 1);
  };

  // تحديث القاعدة المختلفة مع حساب الحجم الفوري (مثل الأعمدة)
  const updateDifferentFoundation = (id: number, field: 'cleaningLength' | 'cleaningWidth' | 'height', value: string) => {
    setDifferentFoundations((prev: Array<{ id: number; cleaningLength: string; cleaningWidth: string; height: string; concreteVolume?: number }>) =>
      prev.map(f => {
        if (f.id === id) {
          const updated = { ...f, [field]: value };

          // حساب الحجم الفوري لهذه القاعدة
          const length = parseFloat(updated.cleaningLength || '0');
          const width = parseFloat(updated.cleaningWidth || '0');
          const height = parseFloat(updated.height || '0');

          let vol = 0;
          if (length > 0 && width > 0 && height > 0) {
            const actualLength = Math.max(0.3, length - CONCRETE_MARGIN);
            const actualWidth = Math.max(0.3, width - CONCRETE_MARGIN);
            vol = actualLength * actualWidth * height;
          }

          return { ...updated, concreteVolume: vol };
        }
        return f;
      })
    );

    // تحديث النتائج المختلفة
    setTimeout(calculateDifferentFoundations, 100);
  };

  const removeDifferentFoundation = (id: number) => {
    setDifferentFoundations((prev: Array<{ id: number; cleaningLength: string; cleaningWidth: string; height: string; concreteVolume?: number }>) => prev.filter(f => f.id !== id));
    setTimeout(calculateDifferentFoundations, 100);
  };

  // Calculate foundation dimensions (for the first tab)
  const calculateFoundationDimensions = () => {
    try {
      const numberOfFloors = parseFloat(dimensionInputs.numberOfFloors);
      const floorArea = parseFloat(dimensionInputs.floorArea);

      if (isNaN(numberOfFloors) || isNaN(floorArea) ||
        !dimensionInputs.soilType || !dimensionInputs.buildingType || !dimensionInputs.foundationShape) {
        setError('يرجى ملء جميع الحقول لحساب أبعاد القواعد');
        return;
      }

      if (numberOfFloors <= 0 || floorArea <= 0) {
        setError('يجب أن تكون جميع القيم الرقمية موجبة');
        return;
      }

      const buildingType = buildingTypes.find(t => t.value === dimensionInputs.buildingType);
      if (!buildingType) {
        setError('نوع المبنى غير معروف');
        return;
      }

      const soilType = soilTypes.find(s => s.value === dimensionInputs.soilType);
      if (!soilType) {
        setError('نوع التربة غير معروف');
        return;
      }

      const deadLoad = buildingType.dead;
      const liveLoad = buildingType.live;
      const combinedLoad = deadLoad + liveLoad;
      const totalLoad = floorArea * numberOfFloors * combinedLoad;
      const totalFoundationArea = totalLoad / soilType.capacity;

      let foundationLength: number, foundationWidth: number;

      if (dimensionInputs.foundationShape === 'مربع') {
        foundationLength = foundationWidth = Math.sqrt(totalFoundationArea);
      } else {
        foundationWidth = Math.sqrt(totalFoundationArea / 1.2);
        foundationLength = foundationWidth * 1.2;
      }

      const foundationDimensions = `${foundationLength.toFixed(2)} × ${foundationWidth.toFixed(2)} متر`;

      setDimensionResults({
        foundationDimensions,
        totalFoundationArea
      });

      setError(null);

      toast({
        title: 'تم حساب أبعاد القواعد',
        description: `الأبعاد: ${foundationDimensions} (مساحة كلية: ${totalFoundationArea.toFixed(2)} م²)`,
      });

    } catch (error) {
      setError('حدث خطأ في حساب أبعاد القواعد. يرجى التحقق من المدخلات.');
    }
  };

  // حساب القواعد المتشابهة
  const calculateSimilarFoundations = () => {
    let generalCleaningVolume = 0;
    let similarFoundationsVolume = 0;

    const cleaningLength = parseFloat(generalCleaning.cleaningLength);
    const cleaningWidth = parseFloat(generalCleaning.cleaningWidth);
    const cleaningHeight = parseFloat(generalCleaning.cleaningHeight);

    // حساب صبة النظافة
    if (!isNaN(cleaningLength) && !isNaN(cleaningWidth) && !isNaN(cleaningHeight) &&
      cleaningLength > 0 && cleaningWidth > 0 && cleaningHeight > 0) {
      generalCleaningVolume = cleaningLength * cleaningWidth * cleaningHeight;
    }

    const foundationHeight = parseFloat(similarFoundations.foundationHeight);
    const numberOfFoundations = parseFloat(similarFoundations.numberOfFoundations);
    const foundationCleaningLength = parseFloat(similarFoundations.foundationCleaningLength);
    const foundationCleaningWidth = parseFloat(similarFoundations.foundationCleaningWidth);

    // التحقق
    if (isNaN(foundationHeight) || foundationHeight <= 0) {
      setError('يرجى إدخال ارتفاع القواعد بشكل صحيح');
      return;
    }

    if (foundationHeight < 0.4 || foundationHeight > 0.8) {
      setError('ارتفاع القاعدة يجب أن يكون بين 0.4 و 0.8 متر (40-80 سم)');
      return;
    }

    if (isNaN(numberOfFoundations) || numberOfFoundations <= 0) {
      setError('يرجى إدخال عدد القواعد لحساب الخرسانة');
      return;
    }

    if (isNaN(foundationCleaningLength) || foundationCleaningLength <= 0 ||
      isNaN(foundationCleaningWidth) || foundationCleaningWidth <= 0) {
      setError('يرجى إدخال أبعاد صبة نظافة القاعدة (الطول والعرض)');
      return;
    }

    const actualLength = Math.max(0.3, foundationCleaningLength - CONCRETE_MARGIN);
    const actualWidth = Math.max(0.3, foundationCleaningWidth - CONCRETE_MARGIN);
    const singleFoundationVolume = actualLength * actualWidth * foundationHeight;
    similarFoundationsVolume = singleFoundationVolume * numberOfFoundations;

    setSimilarResults({
      generalCleaningVolume,
      similarFoundationsVolume,
      totalSimilarVolume: generalCleaningVolume + similarFoundationsVolume,
      count: numberOfFoundations
    });

    setError(null);
    toast({
      title: 'تم حساب القواعد المتشابهة',
      description: `إجمالي: ${(generalCleaningVolume + similarFoundationsVolume).toFixed(2)} م³`,
    });
  };

  // حساب القواعد المختلفة
  const calculateDifferentFoundations = () => {
    let totalVolume = 0;
    const totalCount = differentFoundations.length;

    differentFoundations.forEach(foundation => {
      if (foundation.concreteVolume) {
        totalVolume += foundation.concreteVolume;
      }
    });

    setDifferentResults({
      differentFoundationsVolume: totalVolume,
      count: totalCount
    });
  };

  // تحديث الإجمالي الكلي (الذي يجمع المتشابهة والمختلفة)
  const updateTotalAllFoundations = () => {
    const totalVolume = similarResults.totalSimilarVolume + differentResults.differentFoundationsVolume;
    const totalCount = similarResults.count + differentResults.count;

    setTotalAllFoundations({
      totalConcrete: totalVolume,
      totalFoundationVolume: totalVolume,
      totalCount
    });
  };

  // استخدام Effect لتحديث المجموع تلقائياً عند تغيير أي من النتائج
  useEffect(() => {
    updateTotalAllFoundations();
  }, [similarResults, differentResults]);

  // دالة الحساب الرئيسية (عند الضغط على زر الحساب)
  const calculateConcreteQuantity = async () => {
    // التحقق من وجود تقرير سابق
    try {
      const reportsResponse = await fetch(`${API_BASE_URL}/quantity-reports/project/${projectId}`);
      const reportsData = await reportsResponse.json();

      if (reportsData.success && reportsData.reports && reportsData.reports.length > 0) {
        const existingReport = reportsData.reports.find((r: any) => r.calculationType === 'foundation');

        if (existingReport) {
          // Show warning dialog
          setExistingReportDialog({
            open: true,
            reportId: existingReport._id,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Could not check for existing reports:', err);
      // Continue with calculation if check fails
    }

    if (foundationsSimilar === 'نعم') {
      calculateSimilarFoundations();
    } else {
      calculateDifferentFoundations();
    }
  };

  // دالة لحذف التقرير السابق والمتابعة
  const handleDeleteExistingReport = async () => {
    try {
      const deleteResponse = await fetch(`${API_BASE_URL}/quantity-reports/${existingReportDialog.reportId}`, {
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

      // Continue with calculation
      if (foundationsSimilar === 'نعم') {
        calculateSimilarFoundations();
      } else {
        calculateDifferentFoundations();
      }
    } catch (error) {
      console.error('Error deleting existing report:', error);
      toast({
        title: 'تحذير',
        description: 'لم يتم حذف التقرير السابق، سيتم تحديث التقرير الحالي',
        variant: 'destructive'
      });
      setExistingReportDialog({ open: false, reportId: null });
      // Continue with calculation anyway
      if (foundationsSimilar === 'نعم') {
        calculateSimilarFoundations();
      } else {
        calculateDifferentFoundations();
      }
    }
  };

  const calculateResults = () => {
    calculateFoundationDimensions();
    setTimeout(calculateConcreteQuantity, 100);
  };

  const resetCalculation = () => {
    setDimensionInputs({
      numberOfFloors: '',
      floorArea: '',
      soilType: '',
      buildingType: '',
      foundationShape: 'مربع',
    });
    setDimensionResults({});
    setFoundationsSimilar('نعم');
    setGeneralCleaning({
      cleaningLength: '',
      cleaningWidth: '',
      cleaningHeight: '',
    });
    setSimilarFoundations({
      cleaningLength: '',
      cleaningWidth: '',
      cleaningHeight: '',
      foundationHeight: '',
      numberOfFoundations: '',
      foundationCleaningLength: '',
      foundationCleaningWidth: '',
    });
    setDifferentFoundations([]);
    setNextFoundationId(1);

    // تصفير النتائج
    setSimilarResults({ generalCleaningVolume: 0, similarFoundationsVolume: 0, totalSimilarVolume: 0, count: 0 });
    setDifferentResults({ differentFoundationsVolume: 0, count: 0 });
    setTotalAllFoundations({ totalConcrete: 0, totalFoundationVolume: 0, totalCount: 0 });

    setError(null);
  };

  const saveToReports = async () => {
    const totalVolume = totalAllFoundations.totalConcrete;

    if (totalVolume === 0 && Object.keys(dimensionResults).length === 0) {
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
      const projectRes = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'foundation',
        concreteData: {
          totalConcrete: totalVolume,
          cleaningVolume: similarResults.generalCleaningVolume,
          foundationsVolume: similarResults.similarFoundationsVolume + differentResults.differentFoundationsVolume,
          generalCleaningVolume: similarResults.generalCleaningVolume,
          similarFoundationsVolume: similarResults.similarFoundationsVolume,
          differentFoundationsVolume: differentResults.differentFoundationsVolume,
          totalFoundationVolume: totalVolume,
          foundationsSimilar: foundationsSimilar === 'نعم',
          // عدد القواعد المتشابهة والمختلفة
          similarFoundationsCount: similarResults.count,
          differentFoundationsCount: differentResults.count,
          numberOfFoundations: similarResults.count + differentResults.count,
          foundationArea: dimensionResults.totalFoundationArea,
          numberOfFloors: parseFloat(dimensionInputs.numberOfFloors),
          floorArea: parseFloat(dimensionInputs.floorArea),
          soilType: dimensionInputs.soilType,
          buildingType: dimensionInputs.buildingType,
          foundationShape: dimensionInputs.foundationShape,
          differentFoundationsDetails: differentFoundations.map(f => ({
            id: f.id,
            cleaningLength: parseFloat(f.cleaningLength),
            cleaningWidth: parseFloat(f.cleaningWidth),
            height: parseFloat(f.height)
          }))
        },
        steelData: {
          totalSteelWeight: 0,
          foundationSteel: 0,
          columnSteel: 0,
          beamSteel: 0,
          slabSteel: 0
        },
        sentToOwner: false
      };

      const response = await fetch(`${API_BASE_URL}/quantity-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم ترحيل النتائج إلى صفحة تقارير الكميات',
        });

        router.push(`/engineer/quantity-reports/${projectId}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error saving report:', error);
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
    <TooltipProvider>
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
                  <Button variant="ghost" size="sm" className="border-2 border-purple-200/50 bg-white/80 backdrop-blur-sm hover:border-purple-400 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-purple-800 font-extrabold hover:text-purple-900 hover:drop-shadow-[0_0_10px_rgba(147,51,234,0.8)] group">
                    <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                    العودة إلى حاسبة الباطون
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
                  <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-emerald-800 bg-clip-text text-transparent leading-tight mb-4 text-right">
                    حساب القواعد وصبة النظافة
                  </h1>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 via-blue-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </div>

          {/* تحذير التقرير السابق */}
          {existingReportDialog.open && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <CardTitle className="text-right">تحذير: يوجد تقرير سابق</CardTitle>
                  <CardDescription className="text-white/90 text-right">
                    يوجد تقرير سابق لحساب القواعد لهذا المشروع
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-right mb-6">
                    <p className="text-slate-700 mb-4">هل تريد حذف التقرير السابق والمتابعة، أم تحديث التقرير الحالي؟</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleDeleteExistingReport}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                    >
                      حذف التقرير السابق والمتابعة
                    </Button>
                    <Button
                      onClick={() => {
                        setExistingReportDialog({ open: false, reportId: null });
                        if (foundationsSimilar === 'نعم') {
                          calculateSimilarFoundations();
                        } else {
                          calculateDifferentFoundations();
                        }
                      }}
                      variant="outline"
                    >
                      تحديث التقرير الحالي (إضافة النتائج الجديدة)
                    </Button>
                    <Button
                      onClick={() => setExistingReportDialog({ open: false, reportId: null })}
                      variant="ghost"
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="xl:col-span-8 space-y-6 lg:space-y-8">
              {/* Error Display */}
              {error && (
                <div className="p-4 lg:p-6 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-red-200 rounded-2xl shadow-xl">
                  <div className="flex items-start gap-4 flex-row-reverse">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-900 mb-2 text-right">{error}</p>
                      <p className="text-red-600 text-right">تحقق من جميع الحقول وأعد المحاولة</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs Section */}
              <Tabs defaultValue="dimensions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-slate-100 to-slate-200/80 p-1 rounded-2xl">
                  <TabsTrigger value="dimensions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-xl py-3 text-base font-bold transition-all duration-300">
                    <RulerIcon className="w-5 h-5 ml-2" />
                    حساب أبعاد القواعد
                  </TabsTrigger>
                  <TabsTrigger value="concrete" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-xl py-3 text-base font-bold transition-all duration-300">
                    <BarChart3 className="w-5 h-5 ml-2" />
                    كمية الخرسانة
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Foundation Dimensions Calculation */}
                <TabsContent value="dimensions" className="space-y-6 mt-6">
                  <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-right">حساب أبعاد القواعد</CardTitle>
                          <CardDescription className="text-emerald-100 text-base text-right">
                            أدخل البيانات الأساسية لحساب أبعاد القاعدة
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8 pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <InputField
                          id="numberOfFloors"
                          label="عدد الطوابق"
                          value={dimensionInputs.numberOfFloors}
                          onChange={(value: string) => handleDimensionInputChange('numberOfFloors', value)}
                          type="number"
                          unit="طابق"
                          icon={Layers}
                        />
                        <InputField
                          id="floorArea"
                          label="مساحة البلاطة"
                          value={dimensionInputs.floorArea}
                          onChange={(value: string) => handleDimensionInputChange('floorArea', value)}
                          unit="م²"
                          icon={Grid}
                        />
                        <SelectField
                          id="soilType"
                          label="نوع التربة"
                          value={dimensionInputs.soilType}
                          onChange={(value: string) => handleDimensionInputChange('soilType', value)}
                          options={soilTypes.map((soil) => ({
                            value: soil.value,
                            label: `${soil.label} (${soil.capacity} كن/م²)`
                          }))}
                        />
                        <SelectField
                          id="buildingType"
                          label="نوع المبنى"
                          value={dimensionInputs.buildingType}
                          onChange={(value: string) => handleDimensionInputChange('buildingType', value)}
                          options={buildingTypes.map((type) => ({
                            value: type.value,
                            label: `${type.label} (ميتة ${type.dead} كن/م² | حية ${type.live} كن/م²)`
                          }))}
                          placeholder="اختر"
                        />
                        <SelectField
                          id="foundationShape"
                          label="شكل القاعدة"
                          value={dimensionInputs.foundationShape}
                          onChange={(value: string) => handleDimensionInputChange('foundationShape', value)}
                          options={[
                            { value: 'مربع', label: 'مربع' },
                            { value: 'مستطيل', label: 'مستطيل (نسبة 1.2:1)' }
                          ]}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="pt-4">
                    <Button
                      onClick={calculateFoundationDimensions}
                      className="w-full h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-4">
                        <RulerIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        حساب أبعاد القاعدة
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Button>
                  </div>

                  {dimensionResults.foundationDimensions && (
                    <Card className="border-0 shadow-xl shadow-green-200/50 bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-emerald-900 mb-4 text-right">أبعاد القاعدة المحسوبة</h3>
                          <div className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                            {dimensionResults.foundationDimensions}
                          </div>
                          <div className="space-y-2 text-right">
                            <p className="text-emerald-700">
                              مساحة القاعدة الكلية: <span className="font-bold">{dimensionResults.totalFoundationArea?.toFixed(2)} م²</span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tab 2: Concrete Quantity Calculation */}
                <TabsContent value="concrete" className="space-y-6 mt-6">
                  {/* Foundations Similarity Selection */}
                  <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                      <div className="flex items-center gap-4 flex-row-reverse">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                          <Grid className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-right">نوع القواعد</CardTitle>
                          <CardDescription className="text-emerald-100 text-base text-right">
                            اختر نوع القواعد للإدخال (سيتم جمع النتائج في النهاية)
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 lg:p-8 pt-0">
                      <SelectField
                        id="foundationsSimilar"
                        label="هل تريد إدخال قواعد متشابهة أم مختلفة؟"
                        value={foundationsSimilar}
                        onChange={(value: 'نعم' | 'لا') => {
                          setFoundationsSimilar(value);
                          setError(null);
                        }}
                        options={[
                          { value: 'نعم', label: 'قواعد متشابهة' },
                          { value: 'لا', label: 'قواعد مختلفة' }
                        ]}
                      />
                    </CardContent>
                  </Card>

                  {/* Similar Foundations Section */}
                  {foundationsSimilar === 'نعم' && (
                    <>
                      <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/30">
                          <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                              <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-right">بيانات القواعد المتشابهة</CardTitle>
                              <CardDescription className="text-blue-100 text-base text-right">
                                أدخل أبعاد القواعد المتشابهة
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 lg:p-8 pt-0 space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <InputField
                              id="foundationHeight"
                              label="ارتفاع القاعدة"
                              value={similarFoundations.foundationHeight}
                              onChange={(value: string) => handleSimilarFoundationsChange('foundationHeight', value)}
                              unit="متر"
                              icon={Ruler}
                              placeholder="0.4 - 0.8"
                            />
                            <InputField
                              id="numberOfFoundations"
                              label="عدد القواعد"
                              value={similarFoundations.numberOfFoundations}
                              onChange={(value: string) => handleSimilarFoundationsChange('numberOfFoundations', value)}
                              type="number"
                              unit="قاعدة"
                              icon={Hash}
                            />
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 text-right">
                            <h4 className="font-bold text-blue-900 mb-3">أبعاد صبة نظافة القاعدة</h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <InputField
                                id="foundationCleaningLength"
                                label="طول صبة النظافة"
                                value={similarFoundations.foundationCleaningLength}
                                onChange={(value: string) => handleSimilarFoundationsChange('foundationCleaningLength', value)}
                                unit="متر"
                                icon={Ruler}
                              />
                              <InputField
                                id="foundationCleaningWidth"
                                label="عرض صبة النظافة"
                                value={similarFoundations.foundationCleaningWidth}
                                onChange={(value: string) => handleSimilarFoundationsChange('foundationCleaningWidth', value)}
                                unit="متر"
                                icon={Ruler}
                              />
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 text-right">
                            <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                              <AlertCircle className="w-5 h-5 text-amber-600" />
                              <h4 className="font-bold text-amber-900">ملاحظات هامة</h4>
                            </div>
                            <p className="text-amber-800 font-medium mb-2">
                              1. حاشية الصب ثابتة بقيمة <span className="font-bold text-lg">0.20 متر</span> من كل جهة
                            </p>
                            <p className="text-amber-800 font-medium">
                              2. ارتفاع القاعدة يكون من <span className="font-bold text-lg">0.4 إلى 0.8 متر</span> فقط (40-80 سم)
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* General Cleaning Section */}
                      <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                          <div className="flex items-center gap-4 flex-row-reverse">
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40">
                              <Layers className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-right">صبة النظافة العامة</CardTitle>
                              <CardDescription className="text-emerald-100 text-base text-right">
                                أبعاد الصبة الأساسية تحت المبنى
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 lg:p-8 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { id: 'cleaningLength', label: 'الطول' },
                              { id: 'cleaningWidth', label: 'العرض' },
                              { id: 'cleaningHeight', label: 'الارتفاع' }
                            ].map(({ id, label }) => (
                              <InputField
                                key={id}
                                id={id}
                                label={label}
                                value={generalCleaning[id as keyof typeof generalCleaning]}
                                onChange={(value: string) => handleGeneralCleaningChange(id, value)}
                                unit="متر"
                                icon={Ruler}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Different Foundations Section */}
                  {foundationsSimilar === 'لا' && (
                    <Card className="border-0 shadow-xl shadow-orange-200/50 hover:shadow-orange-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 text-white py-6 px-6 border-b border-white/30">
                        <div className="flex items-center gap-4 flex-row-reverse">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                            <Warehouse className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-right">حساب كمية الخرسانة للقواعد المختلفة</CardTitle>
                            <CardDescription className="text-orange-100 text-base text-right">
                              أدخل أبعاد كل قاعدة على حدة
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 lg:p-8 pt-0 space-y-6">
                        <div className="flex items-center justify-between flex-row-reverse">
                          <Label className="text-lg font-bold text-slate-900 text-right">قائمة القواعد المختلفة</Label>
                          <Button onClick={addDifferentFoundation} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة قاعدة
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                          {differentFoundations.map((f) => (
                            <Card key={f.id} className="border border-slate-200">
                              <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between flex-row-reverse">
                                  <Badge variant="outline" className="font-bold">قاعدة #{f.id}</Badge>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeDifferentFoundation(f.id)}
                                    className="shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <InputField
                                    id={`cleaningLength-${f.id}`}
                                    label="طول صبة النظافة"
                                    value={f.cleaningLength}
                                    onChange={(value: string) => updateDifferentFoundation(f.id, 'cleaningLength', value)}
                                    unit="متر"
                                    icon={Ruler}
                                  />
                                  <InputField
                                    id={`cleaningWidth-${f.id}`}
                                    label="عرض صبة النظافة"
                                    value={f.cleaningWidth}
                                    onChange={(value: string) => updateDifferentFoundation(f.id, 'cleaningWidth', value)}
                                    unit="متر"
                                    icon={Ruler}
                                  />
                                  <InputField
                                    id={`height-${f.id}`}
                                    label="ارتفاع القاعدة"
                                    value={f.height}
                                    onChange={(value: string) => updateDifferentFoundation(f.id, 'height', value)}
                                    unit="متر"
                                    icon={Ruler}
                                    placeholder="0.4 - 0.8"
                                  />
                                </div>
                                {f.concreteVolume && f.concreteVolume > 0 && (
                                  <div className="text-right text-sm text-orange-700 font-medium pl-4">
                                    حجم هذه القاعدة: {f.concreteVolume.toFixed(3)} م³
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          {differentFoundations.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-right">
                              لم يتم إضافة أي قواعد بعد. اضغط على "إضافة قاعدة" للبدء.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Calculate Button */}
                  <div className="pt-4">
                    <Button
                      onClick={calculateConcreteQuantity}
                      className="w-full h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-4">
                        <Calculator className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        حساب الخرسانة الحالية
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex flex-col lg:flex-row gap-4 pt-4">
                <Button
                  onClick={calculateResults}
                  className="flex-1 h-14 text-base font-black shadow-xl hover:shadow-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 transform hover:-translate-y-1 transition-all duration-500 rounded-2xl border-0 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-4">
                    <Calculator className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    إجراء جميع الحسابات
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
                <Button
                  onClick={resetCalculation}
                  variant="outline"
                  className="h-14 px-6 text-base font-black border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 shadow-xl hover:shadow-emerald-200 transition-all duration-500 rounded-2xl flex items-center gap-4"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  إعادة تعيين الكل
                </Button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="xl:col-span-4">
              <Card className="border-0 shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/60 sticky top-8 h-fit backdrop-blur-sm bg-white/90 transition-all duration-500 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white py-8 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-right">النتائج الشاملة</CardTitle>
                      <CardDescription className="text-white opacity-90">
                        إجمالي جميع القواعد المتشابهة والمختلفة
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {totalAllFoundations.totalConcrete > 0 || dimensionResults.foundationDimensions ? (
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
                              {totalAllFoundations.totalConcrete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                            </div>
                            <div className="text-lg font-bold text-indigo-100 tracking-wider">متر مكعب</div>
                            <div className="text-indigo-200 text-base font-medium">
                              {totalAllFoundations.totalCount} قاعدة
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Results Summary Table */}
                      <Card className="border-0 bg-gradient-to-r from-slate-50/80 to-indigo-50/80 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0 pt-4 pb-4">
                          <div className="grid grid-cols-1 gap-3">
                            {/* معادلة الجمع */}
                            {(similarResults.totalSimilarVolume > 0 && differentResults.differentFoundationsVolume > 0) && (
                              <div className="group p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl hover:shadow-lg transition-all duration-300">
                                <div className="text-center">
                                  <div className="text-sm text-slate-600 mb-2">عملية الجمع:</div>
                                  <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <div className="text-center">
                                      <div className="font-bold text-emerald-700">المتشابهة</div>
                                      <div className="font-semibold text-emerald-900">{similarResults.totalSimilarVolume.toFixed(2)} م³</div>
                                    </div>
                                    <Plus className="w-4 h-4 text-slate-500" />
                                    <div className="text-center">
                                      <div className="font-bold text-blue-700">المختلفة</div>
                                      <div className="font-semibold text-blue-900">{differentResults.differentFoundationsVolume.toFixed(2)} م³</div>
                                    </div>
                                    <Equal className="w-4 h-4 text-slate-500" />
                                    <div className="text-center">
                                      <div className="font-bold text-indigo-700">المجموع</div>
                                      <div className="font-semibold text-indigo-900">{totalAllFoundations.totalConcrete.toFixed(2)} م³</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {similarResults.totalSimilarVolume > 0 && (
                              <>
                                <div className={`group p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-between flex-row-reverse`}>
                                  <span className={`font-bold text-emerald-900 text-lg text-right`}>إجمالي القواعد المتشابهة:</span>
                                  <span className={`font-black text-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent px-4 py-1 rounded-xl shadow-lg`}>
                                    {similarResults.totalSimilarVolume.toFixed(2)} م³
                                  </span>
                                </div>

                                {similarResults.generalCleaningVolume > 0 && (
                                  <div className={`group p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-between flex-row-reverse`}>
                                    <span className={`font-bold text-amber-800 text-base text-right`}>صبة النظافة العامة:</span>
                                    <span className={`font-black text-lg text-amber-900 px-3 py-1 rounded-lg bg-amber-100/50`}>
                                      {similarResults.generalCleaningVolume.toFixed(2)} م³
                                    </span>
                                  </div>
                                )}

                                {similarResults.similarFoundationsVolume > 0 && (
                                  <div className={`group p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-between flex-row-reverse`}>
                                    <span className={`font-bold text-blue-800 text-base text-right`}>القواعد الخرسانية:</span>
                                    <span className={`font-black text-lg text-blue-900 px-3 py-1 rounded-lg bg-blue-100/50`}>
                                      {similarResults.similarFoundationsVolume.toFixed(2)} م³
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            {differentResults.differentFoundationsVolume > 0 && (
                              <div className={`group p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-between flex-row-reverse`}>
                                <span className={`font-bold text-blue-900 text-lg text-right`}>إجمالي القواعد المختلفة:</span>
                                <span className={`font-black text-xl bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent px-4 py-1 rounded-xl shadow-lg`}>
                                  {differentResults.differentFoundationsVolume.toFixed(2)} م³
                                </span>
                              </div>
                            )}

                            {dimensionResults.foundationDimensions && (
                              <div className={`group p-6 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 flex items-center justify-between flex-row-reverse`}>
                                <span className={`font-bold text-slate-900 text-base text-right`}>أبعاد القاعدة:</span>
                                <span className={`font-black text-lg text-slate-900`}>
                                  {dimensionResults.foundationDimensions}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Save to Reports Button */}
                      <Button
                        onClick={saveToReports}
                        disabled={saving}
                        className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl"
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -mr-3 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-5 h-5 mr-2" />
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
                      <h3 className="text-2xl font-bold text-slate-800 mb-4 text-right">جاهز للحسابات</h3>
                      <p className="text-lg text-slate-600 max-w-md mx-auto leading-relaxed text-right">
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