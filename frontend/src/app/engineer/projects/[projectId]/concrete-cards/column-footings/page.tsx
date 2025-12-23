"use client";

import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import {
  Building2,
  ArrowRight,
  Calculator,
  Layers,
  Ruler,
  Box,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Grid,
  LayoutDashboard,
  Columns,
  AlertTriangle,
  X
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

// Helper component for input fields
function InputField({ id, label, value, onChange, placeholder, type = "number", step = "0.1", unit, icon: Icon, inputMode = "text", lang, dir }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  unit: string;
  icon: any;
  inputMode?: React.ComponentProps<'input'>['inputMode'];
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
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
          inputMode={inputMode}
          lang={lang}
          dir={dir as any}
          className="pr-12 pl-3 h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">{unit}</span>
      </div>
    </div>
  );
}

// Helper component for select fields
function SelectField({ id, label, value, onChange, options, placeholder = "اختر" }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-bold text-gray-900">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Helper: normalize Arabic-Indic digits to English ASCII digits
function toEnglishDigits(val: any): string {
  const str = String(val ?? '').trim();
  const map: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return str
    .replace(/[٠-٩۰-۹]/g, d => map[d] || d)
    .replace(/[٬،]/g, '') // remove Arabic thousands separator if present
    .replace('٫', '.'); // Arabic decimal separator
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ESTIMATED_STEEL_WEIGHT_PER_M3 = 80; // kg/m³ for footings

export default function ColumnFootingsCalculationPage() {
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

  // State for all inputs
  const [inputs, setInputs] = useState({
    numberOfColumns: '',
    footingHeight: '',
    baseLength: '',
    baseWidth: '',
    slabArea: '',
    numberOfFloors: '',
    buildingType: '',
    columnShape: ''
  });

  // State for foundation data source
  const [useFoundationData, setUseFoundationData] = useState(false);
  const [foundationData, setFoundationData] = useState(null);
  const [serverAvailable, setServerAvailable] = useState(true);

  // State for results and errors
  const [results, setResults] = useState<{
    numberOfColumns: number;
    footingHeight: number;
    baseLength: number;
    baseWidth: number;
    slabArea: number;
    numberOfFloors: number;
    buildingType: string;
    columnShape: string;
    valueA: number;
    columnDimensions: {
      length?: number;
      width?: number;
      diameter?: number;
      displayText: string;
    };
    totalFootingsVolume: number;
    deadLoad: number;
    liveLoad: number;
    totalLoad: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Building types (same as foundation page)
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

  // Column shapes
  const columnShapes = [
    { value: 'مربع', label: 'مربع' },
    { value: 'دائري', label: 'دائري' },
    { value: 'مستطيل', label: 'مستطيل' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  // Check server availability
  const checkServerAvailability = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/health`, {
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

  // Function to fetch foundation data
  const fetchFoundationData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/foundation-calculations/${projectId}`);

      // Check if response is ok and content-type is JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('الخادم لا يستجيب بتنسيق JSON صحيح. تأكد من تشغيل الخادم الخلفي.');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setFoundationData(data.data);
        // Auto-fill foundation dimensions if available
        if (data.data.foundationLength && data.data.foundationWidth) {
          setInputs(prev => ({
            ...prev,
            baseLength: data.data.foundationLength.toString(),
            baseWidth: data.data.foundationWidth.toString()
          }));
        }
        toast({
          title: 'تم جلب البيانات',
          description: 'تم جلب أبعاد القواعد من صفحة صبة النظافة والقواعد',
        });
      } else {
        toast({
          title: 'لا توجد بيانات',
          description: 'لم يتم العثور على بيانات القواعد. يرجى إدخال الأبعاد يدوياً',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching foundation data:', error);
      let errorMessage = 'حدث خطأ أثناء جلب بيانات القواعد';

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي على المنفذ 5000';
        } else if (error.message.includes('JSON')) {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'خطأ في الاتصال',
        description: errorMessage,
        variant: 'destructive'
      });

      // Reset to manual input mode
      setUseFoundationData(false);
    }
  };

  const calculateResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      const requiredFields = ['numberOfColumns', 'footingHeight', 'baseLength', 'baseWidth', 'slabArea', 'numberOfFloors', 'buildingType', 'columnShape'];
      for (const field of requiredFields) {
        if (!inputs[field as keyof typeof inputs]) {
          setError('يرجى ملء جميع الحقول المطلوبة');
          setIsLoading(false);
          return;
        }
      }

      // Convert to numbers and validate
      const numericInputs = {
        numberOfColumns: parseFloat(inputs.numberOfColumns),
        footingHeight: parseFloat(inputs.footingHeight),
        baseLength: parseFloat(inputs.baseLength),
        baseWidth: parseFloat(inputs.baseWidth),
        slabArea: parseFloat(inputs.slabArea),
        numberOfFloors: parseFloat(inputs.numberOfFloors)
      };

      for (const [key, value] of Object.entries(numericInputs)) {
        if (isNaN(value) || value <= 0) {
          setError(`قيمة ${key} غير صالحة`);
          setIsLoading(false);
          return;
        }
      }

      // Validate footing height range (15-20 cm)
      if (numericInputs.footingHeight < 0.15 || numericInputs.footingHeight > 0.20) {
        setError('ارتفاع الشرش يجب أن يكون بين 15 و 20 سم (0.15 - 0.20 متر)');
        setIsLoading(false);
        return;
      }

      // Check if report already exists for this project and calculation type
      try {
        const reportsResponse = await fetch(`${API_BASE_URL}/api/quantity-reports/project/${projectId}`);
        const reportsData = await reportsResponse.json();

        if (reportsData.success && reportsData.reports && reportsData.reports.length > 0) {
          const existingReport = reportsData.reports.find((r: any) => r.calculationType === 'column-footings');

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

      // 1) حساب حجم خرسانة شرش العمود الواحد وإجمالي الكمية
      const singleFootingVolume = numericInputs.baseLength * numericInputs.baseWidth * numericInputs.footingHeight; // م³
      const totalFootingsVolume = singleFootingVolume * numericInputs.numberOfColumns; // م³

      // 2) جلب الأحمال (الميتة + الحية) تلقائياً من نوع المبنى
      const bt = buildingTypes.find((t) => t.value === inputs.buildingType);
      if (!bt) {
        setError('نوع المبنى غير معروف');
        setIsLoading(false);
        return;
      }
      const deadLoad = bt.dead; // كن/م²
      const liveLoad = bt.live; // كن/م²
      const totalLoad = deadLoad + liveLoad; // كن/م²

      // 3) حساب القيمة A
      const valueA = (numericInputs.slabArea * numericInputs.numberOfFloors * totalLoad) / 0.195;

      // 4) تحديد أبعاد العمود حسب الشكل المختار
      const shape = inputs.columnShape;
      let columnDimensions: { length?: number; width?: number; diameter?: number; displayText: string } = {
        displayText: ''
      };

      if (shape === 'مستطيل') {
        // حساب العرض: B = √(A ÷ 2)
        const B = Math.sqrt(valueA / 2);
        const width = B >= 25 ? B : 25; // إذا كانت قيمة B < 25 سم → العرض = 25 سم

        // حساب الطول: C = B × 2
        const C = width * 2;
        const length = C >= 50 ? C : 50; // إذا كانت قيمة C < 50 سم → الطول = 50 سم

        columnDimensions.length = parseFloat(length.toFixed(1));
        columnDimensions.width = parseFloat(width.toFixed(1));
        columnDimensions.displayText = `${columnDimensions.length} × ${columnDimensions.width} سم`;
      } else if (shape === 'دائري') {
        // حساب القطر: D = √(A ÷ π) × 2
        const D = Math.sqrt(valueA / Math.PI) * 2;
        const diameter = D >= 30 ? D : 30; // إذا كانت قيمة D < 30 سم → القطر = 30 سم

        columnDimensions.diameter = parseFloat(diameter.toFixed(1));
        columnDimensions.displayText = `${columnDimensions.diameter} سم (قطر)`;
      } else if (shape === 'مربع') {
        // حساب البعد: F = √(A ÷ 2)
        const F = Math.sqrt(valueA / 2);
        const width = F >= 35 ? F : 35; // إذا كانت قيمة F < 35 سم → العرض = 35 سم

        // تحديد الأبعاد: الطول = العرض
        const length = width;

        columnDimensions.length = parseFloat(length.toFixed(1));
        columnDimensions.width = parseFloat(width.toFixed(1));
        columnDimensions.displayText = `${columnDimensions.length} × ${columnDimensions.width} سم`;
      } else {
        setError('شكل العمود غير معروف');
        setIsLoading(false);
        return;
      }

      // إعداد النتائج النهائية وإظهارها في اللوحة
      const computedResults = {
        numberOfColumns: numericInputs.numberOfColumns,
        footingHeight: numericInputs.footingHeight,
        baseLength: numericInputs.baseLength,
        baseWidth: numericInputs.baseWidth,
        slabArea: numericInputs.slabArea,
        numberOfFloors: numericInputs.numberOfFloors,
        buildingType: inputs.buildingType,
        columnShape: inputs.columnShape,
        valueA,
        columnDimensions,
        totalFootingsVolume,
        deadLoad,
        liveLoad,
        totalLoad,
      } as typeof results extends infer T ? T extends object ? any : any : any;

      setResults(computedResults);

      // حفظ أبعاد العمود في Local Storage للاستيراد في صفحة الأعمدة
      // نحفظ فقط الأبعاد المناسبة للشكل المختار
      const columnDimensionsData: {
        shape: string;
        length?: number;
        width?: number;
        diameter?: number;
        displayText: string;
      } = {
        shape: inputs.columnShape,
        displayText: columnDimensions.displayText
      };

      // حفظ الأبعاد حسب الشكل
      if (inputs.columnShape === 'مربع' || inputs.columnShape === 'مستطيل') {
        if (columnDimensions.length !== undefined) {
          columnDimensionsData.length = columnDimensions.length; // بالسم
        }
        if (inputs.columnShape === 'مستطيل' && columnDimensions.width !== undefined) {
          columnDimensionsData.width = columnDimensions.width; // بالسم
        } else if (inputs.columnShape === 'مربع' && columnDimensions.width !== undefined) {
          // للمربع، نحفظ width أيضاً (لكن في صفحة الأعمدة سنستخدم length فقط)
          columnDimensionsData.width = columnDimensions.width; // بالسم
        }
      } else if (inputs.columnShape === 'دائري') {
        if (columnDimensions.diameter !== undefined) {
          columnDimensionsData.diameter = columnDimensions.diameter; // بالسم
        }
      }

      localStorage.setItem('columnDimensionsFromFootings', JSON.stringify(columnDimensionsData));

      toast({
        title: 'تم الحساب بنجاح',
        description: 'تم حساب كميات شروش الأعمدة وتحديد أبعاد الأعمدة',
      });
    } catch (error) {
      console.error('Calculation error:', error);
      setError('حدث خطأ غير متوقع أثناء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!existingReportDialog.reportId) {
      setExistingReportDialog({ open: false, reportId: null });
      // Continue with calculation by calling calculateResults again
      calculateResults();
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

      // Continue with calculation by calling calculateResults again
      // This time it won't find the report, so it will proceed
      calculateResults();
    } catch (error) {
      console.error('Error deleting existing report:', error);
      toast({
        title: 'تحذير',
        description: 'لم يتم حذف التقرير السابق، سيتم تحديث التقرير الحالي',
        variant: 'destructive'
      });
      setExistingReportDialog({ open: false, reportId: null });
      // Continue with calculation anyway
      calculateResults();
    }
  };

  const resetCalculation = () => {
    setInputs({
      numberOfColumns: '',
      footingHeight: '',
      baseLength: '',
      baseWidth: '',
      slabArea: '',
      numberOfFloors: '',
      buildingType: '',
      columnShape: ''
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

      // تحضير البيانات للحفظ في قاعدة البيانات
      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'column-footings',
        concreteData: {
          ...results,
          totalConcrete: results.totalFootingsVolume,
          // حفظ أبعاد العمود النهائية
          finalColumnDimensions: results.columnDimensions,
          // حفظ القيمة A المحسوبة
          calculatedValueA: results.valueA
        },
        // إزالة بيانات الحديد - لم تبدأ حسابات الحديد بعد
        steelData: {
          totalSteelWeight: 0,
          foundationSteel: 0,
          columnSteel: 0,
          beamSteel: 0,
          slabSteel: 0
        }
      };

      // حفظ النتائج في قاعدة البيانات
      const response = await fetch(`${API_BASE_URL}/api/quantity-reports`, {
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
        // حفظ إضافي لبيانات الأعمدة المحددة
        const columnData = {
          projectId,
          columnShape: results.columnShape,
          columnDimensions: results.columnDimensions,
          valueA: results.valueA,
          totalFootingsVolume: results.totalFootingsVolume,
          numberOfColumns: results.numberOfColumns,
          calculationDate: new Date().toISOString()
        };

        // حفظ بيانات الأعمدة في جدول منفصل
        await fetch(`${API_BASE_URL}/api/column-calculations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columnData)
        });

        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم حفظ كميات الخرسانة وأبعاد الأعمدة في قاعدة البيانات',
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
                  <Button variant="ghost" size="sm" className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500 gap-2 text-blue-800 font-extrabold hover:text-blue-900 hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.8)] group">
                    <ArrowRight className="w-4 h-4 rotate-180 transition-transform group-hover:scale-125" />
                    العودة إلى حاسبة الباطون
                  </Button>
                </Link>

              </div>

            </div>

            <div className="relative group">
              <div className="flex items-start lg:items-center gap-6 p-2">
                <div className="relative">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                    <Columns className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                    <Box className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight mb-4">
                    حساب شروش الأعمدة
                  </h1>

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
                        لا يمكن حفظ النتائج أو جلب البيانات من القواعد. يمكنك إجراء الحسابات لكن لن يتم حفظها.
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

              {/* بيانات الأعمدة */}
              <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                      <Columns className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">بيانات الأعمدة</CardTitle>
                      <CardDescription className="text-blue-100 text-base">
                        المعلومات الأساسية للأعمدة وشروشها
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InputField
                    id="numberOfColumns"
                    label="عدد الأعمدة"
                    value={inputs.numberOfColumns}
                    onChange={(value) => handleInputChange('numberOfColumns', value)}

                    type="number"
                    unit="عمود"
                    icon={Grid}
                  />
                  <SelectField
                    id="columnShape"
                    label="شكل العمود"
                    value={inputs.columnShape}
                    onChange={(value) => handleInputChange('columnShape', value)}
                    options={columnShapes}
                  />
                  <InputField
                    id="footingHeight"
                    label="ارتفاع الشرش"
                    value={inputs.footingHeight}
                    onChange={(value) => handleInputChange('footingHeight', value)}


                    unit="متر"
                    icon={Ruler}
                  />
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-blue-900">مدى ارتفاع الشرش</h4>
                    </div>
                    <p className="text-blue-800 font-medium">
                      يجب أن يكون بين <span className="font-bold">15-20 سم</span> (0.15 - 0.20 متر)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* أبعاد القاعدة */}
              <Card className="border-0 shadow-xl shadow-purple-200/50 hover:shadow-purple-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                      <Ruler className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">أبعاد القاعدة</CardTitle>
                      <CardDescription className="text-purple-100 text-base">
                        أبعاد قواعد الأعمدة الخرسانية
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8 pt-0 space-y-6">
                  {/* خيار مصدر البيانات */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <h4 className="font-bold text-purple-900">مصدر بيانات القاعدة</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant={!useFoundationData ? "default" : "outline"}
                        onClick={() => setUseFoundationData(false)}
                        className="flex-1 h-12 font-bold"
                      >
                        إدخال يدوي
                      </Button>
                      <Button
                        variant={useFoundationData ? "default" : "outline"}
                        onClick={() => {
                          try {
                            const raw = localStorage.getItem(`foundationDimensions-${projectId}`);
                            if (!raw) {
                              toast({
                                title: 'لا توجد بيانات',
                                description: 'لم يتم العثور على أبعاد القواعد. يرجى إجراء الحساب في صفحة القواعد أولاً',
                                variant: 'destructive'
                              });
                              setUseFoundationData(false);
                              return;
                            }
                            const parsed = JSON.parse(raw);
                            const lenStr = toEnglishDigits(parsed.baseLength);
                            const widStr = toEnglishDigits(parsed.baseWidth);
                            const len = Number(lenStr);
                            const wid = Number(widStr);
                            if (!Number.isFinite(len) || !Number.isFinite(wid) || len <= 0 || wid <= 0) {
                              toast({
                                title: 'بيانات غير صالحة',
                                description: 'الأبعاد المخزنة غير صالحة. أعد الحساب في صفحة القواعد',
                                variant: 'destructive'
                              });
                              setUseFoundationData(false);
                              return;
                            }
                            // Force English ASCII digits in inputs with en-US locale formatting
                            const lenEn = len.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 10 });
                            const widEn = wid.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 10 });
                            setInputs(prev => ({ ...prev, baseLength: lenEn, baseWidth: widEn }));
                            setUseFoundationData(true);
                            toast({
                              title: 'تم جلب البيانات',
                              description: 'تم جلب أبعاد القاعدة (صفحة القواعد)'
                            });
                          } catch (e) {
                            console.error('Local fetch error', e);
                            toast({
                              title: 'خطأ في الجلب',
                              description: 'تعذر قراءة البيانات المحلية. أعد الحساب في صفحة القواعد',
                              variant: 'destructive'
                            });
                            setUseFoundationData(false);
                          }
                        }}
                        className="flex-1 h-12 font-bold"
                      >
                        جلب من صفحة القواعد
                      </Button>
                    </div>
                  </div>

                  {/* حقول الإدخال */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InputField
                      id="baseLength"
                      label="طول القاعدة"
                      value={inputs.baseLength}
                      onChange={(value) => handleInputChange('baseLength', value)}
                      type="text"
                      inputMode="decimal"
                      lang="en"
                      dir="ltr"
                      unit="متر"
                      icon={Ruler}
                    />
                    <InputField
                      id="baseWidth"
                      label="عرض القاعدة"
                      value={inputs.baseWidth}
                      onChange={(value) => handleInputChange('baseWidth', value)}
                      type="text"
                      inputMode="decimal"
                      lang="en"
                      dir="ltr"
                      unit="متر"
                      icon={Ruler}
                    />
                  </div>

                  {/* عرض بيانات القواعد المجلوبة */}
                  {useFoundationData && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <h4 className="font-bold text-green-900">بيانات مجلوبة من صفحة القواعد</h4>
                      </div>
                      <p className="text-green-800 font-medium text-sm">
                        تم جلب أبعاد القواعد بنجاح من حسابات صبة النظافة والقواعد
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* معلومات المبنى */}
              <Card className="border-0 shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">معلومات المبنى</CardTitle>
                      <CardDescription className="text-emerald-100 text-base">
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
                    type="number"
                    unit="طابق"
                    icon={Layers}
                  />
                  <InputField
                    id="slabArea"
                    label="مساحة البلاطة"
                    value={inputs.slabArea}
                    onChange={(value) => handleInputChange('slabArea', value)}
                    unit="م²"
                    icon={Grid}
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
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-emerald-900">بيانات الأحمال</h4>
                    </div>
                    <p className="emerald-800 font-medium text-sm">
                      سيتم جلب الأحمال الميتة والحية تلقائياً من قاعدة البيانات بناءً على نوع المبنى
                    </p>
                  </div>
                </CardContent>
              </Card>

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
                      حساب كميات الشروش
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
                              {results.totalFootingsVolume.toFixed(3)}
                            </div>
                            <div className="text-lg font-bold text-emerald-100 tracking-wide">متر مكعب</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Results */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Columns className="w-4 h-4" />
                            بيانات الأعمدة
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">عدد الأعمدة:</span>
                              <span className="font-bold text-blue-900">{results.numberOfColumns}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">شكل العمود:</span>
                              <span className="font-bold text-blue-900">{results.columnShape}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">ارتفاع الشرش:</span>
                              <span className="font-bold text-blue-900">{results.footingHeight} م</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
                          <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <Ruler className="w-4 h-4" />
                            أبعاد العمود المحسوبة
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-purple-700">القيمة A:</span>
                              <span className="font-bold text-purple-900">{results.valueA.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-purple-700">شكل العمود:</span>
                              <span className="font-bold text-purple-900">{results.columnShape}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700">الأبعاد النهائية:</span>
                              <span className="font-bold text-purple-900">{results.columnDimensions.displayText}</span>
                            </div>



                            {results.columnDimensions.diameter && (
                              <div className="flex justify-between">
                                <span className="text-purple-700">القطر:</span>
                                <span className="font-bold text-purple-900">{results.columnDimensions.diameter} سم</span>
                              </div>
                            )}
                            {results.columnDimensions.length && results.columnDimensions.width && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-purple-700">الطول:</span>
                                  <span className="font-bold text-purple-900">{results.columnDimensions.length} سم</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-purple-700">العرض:</span>
                                  <span className="font-bold text-purple-900">{results.columnDimensions.width} سم</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4">
                          <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                            <Box className="w-4 h-4" />
                            تفاصيل حساب الخرسانة
                          </h4>
                          <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                              <span className="text-orange-700">حجم الشرش الواحد:</span>
                              <span className="font-bold text-orange-900">
                                {(results.totalFootingsVolume / results.numberOfColumns).toFixed(3)} م³
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-700">عدد الأعمدة:</span>
                              <span className="font-bold text-orange-900">{results.numberOfColumns}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-700">إجمالي الحجم:</span>
                              <span className="font-bold text-orange-900">{results.totalFootingsVolume.toFixed(3)} م³</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                          <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            الأحمال المستخدمة
                          </h4>
                          <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                              <span className="text-emerald-700">الحمل الميت:</span>
                              <span className="font-bold text-emerald-900">{results.deadLoad.toFixed(2)} كن/م²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-700">الحمل الحي:</span>
                              <span className="font-bold text-emerald-900">{results.liveLoad.toFixed(2)} كن/م²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-700">إجمالي الحمل:</span>
                              <span className="font-bold text-emerald-900">{results.totalLoad.toFixed(2)} كن/م²</span>
                            </div>
                          </div>
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
                            localStorage.setItem(`column-footings-${projectId}`, JSON.stringify(localData));
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
                    <div className="text-center py-12 px-4">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-gray-200">
                        <Calculator className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">جاهز للحساب</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        أدخل بيانات الأعمدة والمبنى واضغط "حساب كميات الشروش" للحصول على النتائج
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Report Warning Dialog */}
      <AlertDialog open={existingReportDialog.open} onOpenChange={(open) =>
        setExistingReportDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent className="max-w-lg" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-right text-xl font-bold">
                تحذير: تقرير موجود مسبقاً
              </AlertDialogTitle>
            </div>
            <div className="text-right text-base leading-relaxed space-y-3">
              <p className="text-slate-700">
                تم إجراء الحسابات وحفظ التقرير مسبقاً لهذا المشروع.
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 font-medium">
                  إذا قمت بإعادة الحسابات، سيتم:
                </p>
                <ul className="list-disc list-inside text-amber-700 text-sm mt-2 space-y-1">
                  <li>حذف التقرير السابق من عند المهندس</li>
                  <li>حذف التقرير السابق من عند المالك (إذا كان قد تم إرساله)</li>
                  <li>حفظ التقرير الجديد</li>
                </ul>
              </div>
              <p className="text-slate-600">
                هل تريد المتابعة وإعادة الحسابات؟
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 mt-6">
            <AlertDialogCancel className="flex-1 h-12 text-base font-medium">
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRecalculate}
              className="flex-1 h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-medium"
            >
              <Calculator className="w-4 h-4 ml-2" />
              إعادة الحسابات
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}