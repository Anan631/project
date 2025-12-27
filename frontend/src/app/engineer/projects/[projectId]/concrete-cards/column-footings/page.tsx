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
  X,
  Plus,
  Trash2,
  Save,
  Download
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
          className="pr-12 pl-3 h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl text-base font-bold"
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
        <SelectTrigger className="h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl text-base font-bold">
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

// Interface for footing
interface Footing {
  id: number;
  length: string;
  width: string;
  height: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

  // State for building info (for column dimensions calculation)
  const [buildingInfo, setBuildingInfo] = useState({
    slabArea: '',
    numberOfFloors: '',
    buildingType: '',
    columnShape: ''
  });

  // State for column dimensions results
  const [columnResults, setColumnResults] = useState<{
    slabArea: number;
    numberOfFloors: number;
    buildingType: string;
    columnShape: string;
    columnDimensions: {
      length?: number;
      width?: number;
      diameter?: number;
      displayText: string;
    };
    deadLoad: number;
    liveLoad: number;
    totalLoad: number;
    valueA: number;
  } | null>(null);

  // State for concrete calculation
  const [areSimilar, setAreSimilar] = useState<boolean>(true);
  const [similarFooting, setSimilarFooting] = useState({
    length: '',
    width: '',
    height: '',
    numberOfFootings: ''
  });
  const [footings, setFootings] = useState<Footing[]>([
    { id: 1, length: '', width: '', height: '' }
  ]);
  const [concreteResults, setConcreteResults] = useState<{
    totalConcreteVolume: number;
    footingDetails: Array<{
      id: number;
      length: number;
      width: number;
      height: number;
      volume: number;
    }>;
    numberOfFootings: number;
  } | null>(null);

  // State for errors and loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'dimensions' | 'concrete'>('dimensions');

  // Building types
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

  const handleBuildingInfoChange = (field: string, value: string) => {
    setBuildingInfo(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSimilarFootingChange = (field: string, value: string) => {
    setSimilarFooting(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const addFooting = () => {
    const newId = footings.length + 1;
    setFootings([...footings, { id: newId, length: '', width: '', height: '' }]);
  };

  const removeFooting = (id: number) => {
    if (footings.length > 1) {
      setFootings(footings.filter(f => f.id !== id));
    }
  };

  const updateFooting = (id: number, field: 'length' | 'width' | 'height', value: string) => {
    setFootings(footings.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  // Calculate column dimensions
  const calculateColumnDimensions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate building info inputs
      const requiredFields = ['slabArea', 'numberOfFloors', 'buildingType', 'columnShape'];
      for (const field of requiredFields) {
        if (!buildingInfo[field as keyof typeof buildingInfo]) {
          setError('يرجى ملء جميع الحقول في قسم معلومات المبنى');
          setIsLoading(false);
          return;
        }
      }

      // Validate numeric values
      const numericValues = {
        slabArea: parseFloat(buildingInfo.slabArea),
        numberOfFloors: parseFloat(buildingInfo.numberOfFloors)
      };

      for (const [key, value] of Object.entries(numericValues)) {
        if (isNaN(value) || value <= 0) {
          setError(`قيمة ${key} غير صالحة`);
          setIsLoading(false);
          return;
        }
      }

      // Get loads from building type
      const bt = buildingTypes.find((t) => t.value === buildingInfo.buildingType);
      if (!bt) {
        setError('نوع المبنى غير معروف');
        setIsLoading(false);
        return;
      }
      const deadLoad = bt.dead;
      const liveLoad = bt.live;
      const totalLoad = deadLoad + liveLoad;

      // Calculate value A
      const valueA = (numericValues.slabArea * numericValues.numberOfFloors * totalLoad) / 0.195;

      // Determine column dimensions based on shape
      const shape = buildingInfo.columnShape;
      let columnDimensions: { length?: number; width?: number; diameter?: number; displayText: string } = {
        displayText: ''
      };

      if (shape === 'مستطيل') {
        const B = Math.sqrt(valueA / 2);
        const width = B >= 25 ? B : 25;
        const C = width * 2;
        const length = C >= 50 ? C : 50;

        columnDimensions.length = parseFloat(length.toFixed(1));
        columnDimensions.width = parseFloat(width.toFixed(1));
        columnDimensions.displayText = `${columnDimensions.length} × ${columnDimensions.width} سم`;
      } else if (shape === 'دائري') {
        // Calculate diameter directly in cm
        // Using the formula: D = 2 * sqrt(A/π)
        // Where A is the area in cm²
        const D = 2 * Math.sqrt(valueA / Math.PI);
        
        // Round to nearest 1 cm for precision
        const roundedD = Math.round(D);
        // Ensure minimum diameter of 30 cm as per standard
        const diameter = Math.max(roundedD, 30);

        columnDimensions.diameter = diameter;
        columnDimensions.displayText = `${diameter} سم (قطر)`;
      } else if (shape === 'مربع') {
        const F = Math.sqrt(valueA / 2);
        const width = F >= 35 ? F : 35;
        const length = width;

        columnDimensions.length = parseFloat(length.toFixed(1));
        columnDimensions.width = parseFloat(width.toFixed(1));
        columnDimensions.displayText = `${columnDimensions.length} × ${columnDimensions.width} سم`;
      } else {
        setError('شكل العمود غير معروف');
        setIsLoading(false);
        return;
      }

      // Save column dimensions to Local Storage
      const columnDimensionsData: {
        shape: string;
        length?: number;
        width?: number;
        diameter?: number;
        displayText: string;
      } = {
        shape: buildingInfo.columnShape,
        displayText: columnDimensions.displayText
      };

      if (buildingInfo.columnShape === 'مربع' || buildingInfo.columnShape === 'مستطيل') {
        if (columnDimensions.length !== undefined) {
          columnDimensionsData.length = columnDimensions.length;
        }
        if (columnDimensions.width !== undefined) {
          columnDimensionsData.width = columnDimensions.width;
        }
      } else if (buildingInfo.columnShape === 'دائري') {
        if (columnDimensions.diameter !== undefined) {
          columnDimensionsData.diameter = columnDimensions.diameter;
        }
      }

      localStorage.setItem('columnDimensionsFromFootings', JSON.stringify(columnDimensionsData));

      // Set column results
      const computedColumnResults = {
        slabArea: numericValues.slabArea,
        numberOfFloors: numericValues.numberOfFloors,
        buildingType: buildingInfo.buildingType,
        columnShape: buildingInfo.columnShape,
        columnDimensions,
        deadLoad,
        liveLoad,
        totalLoad,
        valueA,
      };

      setColumnResults(computedColumnResults);
      
      toast({
        title: 'تم حساب أبعاد العمود بنجاح',
        description: 'يمكنك الآن الانتقال إلى حساب كمية الخرسانة',
      });
    } catch (error) {
      console.error('Calculation error:', error);
      setError('حدث خطأ غير متوقع أثناء حساب أبعاد العمود');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate concrete volume
  const calculateConcreteVolume = () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate footing inputs based on type
      if (areSimilar) {
        const requiredSimilarFields = ['length', 'width', 'height', 'numberOfFootings'];
        for (const field of requiredSimilarFields) {
          if (!similarFooting[field as keyof typeof similarFooting]) {
            setError('يرجى ملء جميع الحقول في قسم حساب الخرسانة');
            setIsLoading(false);
            return;
          }
        }

        // Validate numeric values for similar footings
        const similarNumericValues = {
          length: parseFloat(similarFooting.length),
          width: parseFloat(similarFooting.width),
          height: parseFloat(similarFooting.height),
          numberOfFootings: parseFloat(similarFooting.numberOfFootings)
        };

        for (const [key, value] of Object.entries(similarNumericValues)) {
          if (isNaN(value) || value <= 0) {
            setError(`قيمة ${key} في شروش الأعمدة غير صالحة`);
            setIsLoading(false);
            return;
          }
        }
      } else {
        // Validate different footings
        for (const footing of footings) {
          if (!footing.length || !footing.width || !footing.height) {
            setError(`يرجى ملء جميع أبعاد شرش العمود ${footing.id}`);
            setIsLoading(false);
            return;
          }

          const length = parseFloat(footing.length);
          const width = parseFloat(footing.width);
          const height = parseFloat(footing.height);

          if (isNaN(length) || length <= 0 || 
              isNaN(width) || width <= 0 || 
              isNaN(height) || height <= 0) {
            setError(`أبعاد شرش العمود ${footing.id} غير صالحة`);
            setIsLoading(false);
            return;
          }
        }
      }

      // Calculate concrete volume
      let totalConcreteVolume = 0;
      let footingDetails: Array<{ id: number; length: number; width: number; height: number; volume: number }> = [];
      let numberOfFootings = 0;

      if (areSimilar) {
        const length = parseFloat(similarFooting.length);
        const width = parseFloat(similarFooting.width);
        const height = parseFloat(similarFooting.height);
        const numFootings = parseInt(similarFooting.numberOfFootings);
        
        const singleVolume = length * width * height;
        totalConcreteVolume = singleVolume * numFootings;
        numberOfFootings = numFootings;
        
        footingDetails = [{
          id: 1,
          length,
          width,
          height,
          volume: singleVolume
        }];
      } else {
        for (const footing of footings) {
          const length = parseFloat(footing.length);
          const width = parseFloat(footing.width);
          const height = parseFloat(footing.height);
          
          const volume = length * width * height;
          totalConcreteVolume += volume;
          footingDetails.push({
            id: footing.id,
            length,
            width,
            height,
            volume
          });
        }
        numberOfFootings = footings.length;
      }

      // Set concrete results
      const computedConcreteResults = {
        totalConcreteVolume,
        footingDetails,
        numberOfFootings,
      };

      setConcreteResults(computedConcreteResults);

      toast({
        title: 'تم حساب كمية الخرسانة بنجاح',
        description: `إجمالي كمية الخرسانة: ${totalConcreteVolume.toFixed(3)} م³`,
      });
    } catch (error) {
      console.error('Concrete calculation error:', error);
      setError('حدث خطأ غير متوقع أثناء حساب كمية الخرسانة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!existingReportDialog.reportId) {
      setExistingReportDialog({ open: false, reportId: null });
      return;
    }

    try {
      const deleteResponse = await fetch(`${API_BASE_URL}/api/quantity-reports/${existingReportDialog.reportId}`, {
        method: 'DELETE'
      });

      if (deleteResponse.ok) {
        toast({
          title: 'تم حذف التقرير السابق',
          description: 'تم حذف التقرير السابق بنجاح',
        });
      }

      setExistingReportDialog({ open: false, reportId: null });
    } catch (error) {
      console.error('Error deleting existing report:', error);
      toast({
        title: 'تحذير',
        description: 'لم يتم حذف التقرير السابق، سيتم تحديث التقرير الحالي',
        variant: 'destructive'
      });
      setExistingReportDialog({ open: false, reportId: null });
    }
  };

  const resetDimensionsCalculation = () => {
    setBuildingInfo({
      slabArea: '',
      numberOfFloors: '',
      buildingType: '',
      columnShape: ''
    });
    setColumnResults(null);
    setError(null);
  };

  const resetConcreteCalculation = () => {
    setAreSimilar(true);
    setSimilarFooting({
      length: '',
      width: '',
      height: '',
      numberOfFootings: ''
    });
    setFootings([{ id: 1, length: '', width: '', height: '' }]);
    setConcreteResults(null);
    setError(null);
  };

  const resetAll = () => {
    resetDimensionsCalculation();
    resetConcreteCalculation();
    setActiveSection('dimensions');
  };

  const saveToReports = async () => {
    if (!columnResults || !concreteResults) {
      toast({
        title: 'لا توجد نتائج كاملة',
        description: 'يرجى إجراء جميع الحسابات أولاً',
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

      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'column-footings',
        concreteData: {
          columnDimensions: columnResults,
          concreteVolume: concreteResults,
          areSimilar,
          similarFooting: areSimilar ? similarFooting : null,
          differentFootings: !areSimilar ? footings : null,
          totalConcrete: concreteResults.totalConcreteVolume
        },
        steelData: {
          totalSteelWeight: 0,
          foundationSteel: 0,
          columnSteel: 0,
          beamSteel: 0,
          slabSteel: 0
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/quantity-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const columnData = {
          projectId,
          columnShape: columnResults.columnShape,
          columnDimensions: columnResults.columnDimensions,
          valueA: columnResults.valueA,
          totalConcreteVolume: concreteResults.totalConcreteVolume,
          numberOfFootings: concreteResults.numberOfFootings,
          calculationDate: new Date().toISOString()
        };

        await fetch(`${API_BASE_URL}/api/column-calculations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columnData)
        });

        toast({
          title: 'تم الحفظ بنجاح',
          description: 'تم حفظ أبعاد الأعمدة وكميات الخرسانة في قاعدة البيانات',
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

  const saveColumnDimensions = () => {
    if (!columnResults) {
      toast({
        title: 'لا توجد نتائج',
        description: 'يرجى حساب أبعاد العمود أولاً',
        variant: 'destructive'
      });
      return;
    }

    // Save to localStorage for use in columns page
    const columnDimensionsData = {
      shape: columnResults.columnShape,
      ...columnResults.columnDimensions
    };

    localStorage.setItem('columnDimensionsFromFootings', JSON.stringify(columnDimensionsData));

    toast({
      title: 'تم حفظ أبعاد العمود',
      description: 'يمكنك استيراد هذه الأبعاد في صفحة حساب أعمدة الحديد',
      duration: 3000,
    });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
        <div className="fixed inset-0 opacity-20">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">

          {/* Header */}
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
                  <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                    قسمين منفصلين: 1) حساب أبعاد العمود 2) حساب خرسانة الشروش
                  </p>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-indigo-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="mb-8">
            <div className="flex space-x-4 border-b">
              <button
                onClick={() => setActiveSection('dimensions')}
                className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-all ${activeSection === 'dimensions'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border-b-2 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  حساب أبعاد العمود
                </div>
              </button>
              <button
                onClick={() => setActiveSection('concrete')}
                className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-all ${activeSection === 'concrete'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-green-600 hover:bg-green-50 border-b-2 border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  حساب كمية الخرسانة
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">

            {/* Input Sections */}
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

              {/* Column Dimensions Section */}
              {activeSection === 'dimensions' && (
                <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                        <Ruler className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">حساب أبعاد العمود</CardTitle>
                        <CardDescription className="text-blue-100 text-base">
                          (لتحديد أبعاد العمود الواحد بالاعتماد على المساحة الواقعة على العمود)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 lg:p-8 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InputField
                      id="numberOfFloors"
                      label="عدد الطوابق"
                      value={buildingInfo.numberOfFloors}
                      onChange={(value) => handleBuildingInfoChange('numberOfFloors', value)}
                      type="number"
                      unit="طابق"
                      icon={Layers}
                    />
                    <InputField
                      id="slabArea"
                      label="مساحة البلاطة"
                      value={buildingInfo.slabArea}
                      onChange={(value) => handleBuildingInfoChange('slabArea', value)}
                      unit="م²"
                      icon={Grid}
                    />
                    <SelectField
                      id="buildingType"
                      label="نوع المبنى"
                      value={buildingInfo.buildingType}
                      onChange={(value) => handleBuildingInfoChange('buildingType', value)}
                      options={buildingTypes.map((type) => ({
                        value: type.value,
                        label: `${type.label} (ميتة ${type.dead} كن/م² | حية ${type.live} كن/م²)`
                      }))}
                      placeholder="اختر"
                    />
                    <SelectField
                      id="columnShape"
                      label="شكل العمود"
                      value={buildingInfo.columnShape}
                      onChange={(value) => handleBuildingInfoChange('columnShape', value)}
                      options={columnShapes}
                    />
                  </CardContent>
                  <div className="p-6 pt-0">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={calculateColumnDimensions}
                        disabled={isLoading}
                        className="flex-1 h-14 text-lg font-bold shadow-2xl hover:shadow-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            جاري حساب أبعاد العمود...
                          </div>
                        ) : (
                          <>
                            <Calculator className="w-5 h-5 ml-2" />
                            حساب أبعاد العمود
                          </>
                        )}
                      </Button>
                      {columnResults && (
                        <Button
                          onClick={saveColumnDimensions}
                          variant="outline"
                          className="h-14 px-6 text-lg font-bold border-2 border-green-400 hover:border-green-600 hover:bg-green-50 hover:text-green-900 transition-all duration-300 rounded-2xl flex items-center gap-3"
                        >
                          <Save className="w-5 h-5" />
                          حفظ الأبعاد
                        </Button>
                      )}
                      <Button
                        onClick={resetDimensionsCalculation}
                        variant="outline"
                        className="h-14 px-6 text-lg font-bold border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-900 transition-all duration-300 rounded-2xl flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        إعادة تعيين
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Concrete Calculation Section */}
              {activeSection === 'concrete' && (
                <Card className="border-0 shadow-xl shadow-green-200/50 hover:shadow-green-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                        <Box className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">حساب كمية الخرسانة لشروش الأعمدة</CardTitle>
                        <CardDescription className="text-green-100 text-base">
                          أدخل أبعاد شروش الأعمدة لحساب كمية الخرسانة المطلوبة
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 lg:p-8 pt-0 space-y-6">
                    {/* Similar/Different Toggle */}
                    <div className="space-y-4">
                      <Label className="text-base font-bold text-slate-900">هل شروش الأعمدة متشابهة؟</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setAreSimilar(true)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${areSimilar
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-green-300'
                            }`}
                        >
                          <div className="text-2xl mb-2">✓</div>
                          <h3 className="font-bold text-lg text-gray-800">متشابهة</h3>
                          <p className="text-sm text-gray-600">جميع الشروش بنفس الأبعاد</p>
                        </button>
                        <button
                          onClick={() => setAreSimilar(false)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${!areSimilar
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-green-300'
                            }`}
                        >
                          <div className="text-2xl mb-2">≠</div>
                          <h3 className="font-bold text-lg text-gray-800">مختلفة</h3>
                          <p className="text-sm text-gray-600">أبعاد مختلفة لكل شرش</p>
                        </button>
                      </div>
                    </div>

                    {/* Footing Inputs */}
                    {areSimilar ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField
                            id="similarLength"
                            label="طول شرش العمود (متر)"
                            value={similarFooting.length}
                            onChange={(value) => handleSimilarFootingChange('length', value)}
                            unit="متر"
                            icon={Ruler}
                          />
                          <InputField
                            id="similarWidth"
                            label="عرض شرش العمود (متر)"
                            value={similarFooting.width}
                            onChange={(value) => handleSimilarFootingChange('width', value)}
                            unit="متر"
                            icon={Ruler}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField
                            id="similarHeight"
                            label="ارتفاع شرش العمود (متر)"
                            value={similarFooting.height}
                            onChange={(value) => handleSimilarFootingChange('height', value)}
                            unit="متر"
                            icon={Ruler}
                          />
                          <InputField
                            id="numberOfFootings"
                            label="عدد شروش الأعمدة"
                            value={similarFooting.numberOfFootings}
                            onChange={(value) => handleSimilarFootingChange('numberOfFootings', value)}
                            unit="شرش"
                            icon={Grid}
                            type="number"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {footings.map((footing) => (
                          <div key={footing.id} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-900">شرش عمود {footing.id}</h4>
                              {footings.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFooting(footing.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <InputField
                                id={`length-${footing.id}`}
                                label="الطول (متر)"
                                value={footing.length}
                                onChange={(v) => updateFooting(footing.id, 'length', v)}
                                unit="متر"
                                icon={Ruler}
                              />
                              <InputField
                                id={`width-${footing.id}`}
                                label="العرض (متر)"
                                value={footing.width}
                                onChange={(v) => updateFooting(footing.id, 'width', v)}
                                unit="متر"
                                icon={Ruler}
                              />
                              <InputField
                                id={`height-${footing.id}`}
                                label="الارتفاع (متر)"
                                value={footing.height}
                                onChange={(v) => updateFooting(footing.id, 'height', v)}
                                unit="متر"
                                icon={Ruler}
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          onClick={addFooting}
                          variant="outline"
                          className="w-full h-12 border-2 border-green-300 hover:border-green-600 hover:bg-green-600 hover:text-white text-green-700 transition-all duration-300"
                        >
                          <Plus className="w-5 h-5 ml-2" />
                          إضافة شرش عمود
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-6 pt-0">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={calculateConcreteVolume}
                        disabled={isLoading}
                        className="flex-1 h-14 text-lg font-bold shadow-2xl hover:shadow-3xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            جاري حساب كمية الخرسانة...
                          </div>
                        ) : (
                          <>
                            <Calculator className="w-5 h-5 ml-2" />
                            حساب كمية الخرسانة
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={resetConcreteCalculation}
                        variant="outline"
                        className="h-14 px-6 text-lg font-bold border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-900 transition-all duration-300 rounded-2xl flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        إعادة تعيين
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Results Panel */}
            <div className="xl:col-span-4">
              <Card className="border-0 shadow-2xl shadow-emerald-200/50 hover:shadow-emerald-300/75 sticky top-8 h-fit backdrop-blur-sm bg-white/80 transition-all duration-500 overflow-hidden">
                <CardHeader className={`${activeSection === 'dimensions' ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700' : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700'} text-white py-6 px-6 border-b border-white/20`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                      {activeSection === 'dimensions' ? <Ruler className="w-6 h-6 text-white" /> : <Box className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        النتائج
                      </CardTitle>
                      <CardDescription className="text-white opacity-90">
                        {activeSection === 'dimensions' ? 'أبعاد العمود المحسوبة' : 'كمية الخرسانة المحسوبة'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {/* Column Dimensions Results */}
                  {activeSection === 'dimensions' && columnResults ? (
                    <div className="space-y-6">
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-sm text-center group-hover:shadow-3xl group-hover:-translate-y-2 transition-all duration-500 transform">
                          <div className="w-16 h-16 mx-auto mb-3 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                            <Columns className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-blue-100 font-bold text-sm tracking-wide">أبعاد العمود النهائية</Label>
                            <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                              {columnResults.columnDimensions.displayText}
                            </div>
                            <div className="text-lg font-bold text-blue-100 tracking-wide">{columnResults.columnShape}</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Results */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            معلومات المبنى
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">مساحة البلاطة:</span>
                              <span className="font-bold text-blue-900">{columnResults.slabArea} م²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">عدد الطوابق:</span>
                              <span className="font-bold text-blue-900">{columnResults.numberOfFloors}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700">نوع المبنى:</span>
                              <span className="font-bold text-blue-900">{columnResults.buildingType}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
                          <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            الأحمال المستخدمة
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-purple-700">الحمل الميت:</span>
                              <span className="font-bold text-purple-900">{columnResults.deadLoad.toFixed(2)} كن/م²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700">الحمل الحي:</span>
                              <span className="font-bold text-purple-900">{columnResults.liveLoad.toFixed(2)} كن/م²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-purple-700">إجمالي الحمل:</span>
                              <span className="font-bold text-purple-900">{columnResults.totalLoad.toFixed(2)} كن/م²</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
                          <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            بيانات الحساب
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-emerald-700">القيمة A:</span>
                              <span className="font-bold text-emerald-900">{columnResults.valueA.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-700">شكل العمود:</span>
                              <span className="font-bold text-emerald-900">{columnResults.columnShape}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setActiveSection('concrete')}
                        className="w-full h-12 font-bold shadow-lg hover:shadow-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl border-0"
                      >
                        <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                        الانتقال إلى حساب الخرسانة
                      </Button>
                    </div>
                  ) : activeSection === 'concrete' && concreteResults ? (
                    <div className="space-y-6">
                      {/* Concrete Results */}
                      <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-sm text-center group-hover:shadow-3xl group-hover:-translate-y-2 transition-all duration-500 transform">
                          <div className="w-16 h-16 mx-auto mb-3 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                            <Calculator className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-emerald-100 font-bold text-sm tracking-wide">إجمالي حجم الخرسانة</Label>
                            <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                              {concreteResults.totalConcreteVolume.toFixed(3)}
                            </div>
                            <div className="text-lg font-bold text-emerald-100 tracking-wide">متر مكعب</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Concrete Results */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                          <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Columns className="w-4 h-4" />
                            بيانات شروش الأعمدة
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-blue-700">عدد شروش الأعمدة:</span>
                              <span className="font-bold text-blue-900">{concreteResults.numberOfFootings}</span>
                            </div>
                            {areSimilar && concreteResults.footingDetails[0] && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-blue-700">حجم الشرش الواحد:</span>
                                  <span className="font-bold text-blue-900">
                                    {concreteResults.footingDetails[0].volume.toFixed(3)} م³
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-blue-700">الطول × العرض × الارتفاع:</span>
                                  <span className="font-bold text-blue-900">
                                    {concreteResults.footingDetails[0].length} × {concreteResults.footingDetails[0].width} × {concreteResults.footingDetails[0].height} م
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {!areSimilar && concreteResults.footingDetails.length > 0 && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
                            <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                              <Grid className="w-4 h-4" />
                              تفاصيل الشروش المختلفة
                            </h4>
                            <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                              {concreteResults.footingDetails.map((footing) => (
                                <div key={footing.id} className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                  <span className="text-purple-700">شرش {footing.id}:</span>
                                  <span className="font-bold text-purple-900">{footing.volume.toFixed(3)} م³</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {columnResults && (
                          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4">
                            <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                              <Columns className="w-4 h-4" />
                              أبعاد العمود المحفوظة
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-orange-700">شكل العمود:</span>
                                <span className="font-bold text-orange-900">{columnResults.columnShape}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-orange-700">الأبعاد النهائية:</span>
                                <span className="font-bold text-orange-900">{columnResults.columnDimensions.displayText}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={saveToReports}
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
                            <Save className="w-4 h-4 ml-2" />
                            حفظ جميع النتائج في التقارير
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-gray-200">
                        <Calculator className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-700 mb-2">
                        {activeSection === 'dimensions' ? 'جاهز لحساب أبعاد العمود' : 'جاهز لحساب كمية الخرسانة'}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {activeSection === 'dimensions' 
                          ? 'أدخل معلومات المبنى واضغط "حساب أبعاد العمود" للحصول على النتائج' 
                          : 'أدخل أبعاد شروش الأعمدة واضغط "حساب كمية الخرسانة" للحصول على النتائج'}
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