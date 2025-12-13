"use client";

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardHat, Building2, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface FoundationData {
  foundationLength: string;
  foundationWidth: string;
  foundationHeight: string;
  numberOfFloors: string;
  slabArea: string;
  soilType: string;
  buildingType: string;
  baseHeight: string;
  baseShape: 'square' | 'rectangular' | '';
  allBasesSimilar: boolean | null;
  totalNumberOfBases: string;
  individualBases: Array<{ length: string; width: string }>;
  calculated: boolean;
  results?: {
    foundationVolume: number;
    baseArea: number;
    baseLength: number;
    baseWidth: number;
    foundationsVolume: number;
    totalVolume: number;
  };
}

interface TabData {
  length: string;
  width: string;
  height: string;
  quantity?: number;
  completed: boolean;
}

const tabs = [
  { id: 'foundation', label: 'صبة النظاف والقواعد', icon: Building2 },
  { id: 'column-base', label: 'شروش الاعمدة', icon: Building2 },
  { id: 'ground-beams', label: 'جسور الارضية', icon: Building2 },
  { id: 'ground-slab', label: 'ارضية المبنى', icon: Building2 },
  { id: 'columns', label: 'الاعمدة', icon: Building2 },
  { id: 'roof', label: 'السقف', icon: Building2 },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ConcreteCalculationsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('foundation');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Engineering data
  const [soilTypes, setSoilTypes] = useState<any[]>([]);
  const [buildingTypes, setBuildingTypes] = useState<any[]>([]);
  
  // Foundation data
  const [foundationData, setFoundationData] = useState<FoundationData>({
    foundationLength: '',
    foundationWidth: '',
    foundationHeight: '',
    numberOfFloors: '',
    slabArea: '',
    soilType: '',
    buildingType: '',
    baseHeight: '',
    baseShape: '',
    allBasesSimilar: null,
    totalNumberOfBases: '',
    individualBases: [{ length: '', width: '' }],
    calculated: false,
  });

  // Other tabs data
  const [tabData, setTabData] = useState<Record<string, TabData>>({
    'column-base': { length: '', width: '', height: '', completed: false },
    'ground-beams': { length: '', width: '', height: '', completed: false },
    'ground-slab': { length: '', width: '', height: '', completed: false },
    columns: { length: '', width: '', height: '', completed: false },
    roof: { length: '', width: '', height: '', completed: false },
  });

  // Load engineering data
  useEffect(() => {
    const loadEngineeringData = async () => {
      try {
        const [soilRes, liveLoadRes] = await Promise.all([
          fetch(`${API_BASE_URL}/engineering-data/soil-types`),
          fetch(`${API_BASE_URL}/engineering-data/live-loads`),
        ]);

        if (soilRes.ok) {
          const soilData = await soilRes.json();
          setSoilTypes(soilData.data || []);
        }

        if (liveLoadRes.ok) {
          const liveLoadData = await liveLoadRes.json();
          setBuildingTypes(liveLoadData.data || []);
        }
      } catch (error) {
        console.error('Error loading engineering data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadEngineeringData();
  }, []);

  // Load saved calculations
  useEffect(() => {
    const loadSavedCalculations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/calculations/project/${projectId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.foundation) {
            const f = data.data.foundation;
            // Only load if there's actual calculated data with results
            if (f.calculatedAt && f.foundationVolume !== undefined && f.foundationVolume !== null && f.foundationVolume > 0) {
              setFoundationData({
                foundationLength: f.foundationLength?.toString() || '',
                foundationWidth: f.foundationWidth?.toString() || '',
                foundationHeight: f.foundationHeight?.toString() || '',
                numberOfFloors: f.numberOfFloors?.toString() || '',
                slabArea: f.slabArea?.toString() || '',
                soilType: f.soilType || '',
                buildingType: f.buildingType || '',
                baseHeight: f.baseHeight?.toString() || '',
                baseShape: f.baseShape || '',
                allBasesSimilar: f.allBasesSimilar ?? null,
                totalNumberOfBases: f.totalNumberOfBases?.toString() || '',
                individualBases: f.individualBases && Array.isArray(f.individualBases) && f.individualBases.length > 0 
                  ? f.individualBases.map((b: any) => ({ 
                      length: b.length?.toString() || '', 
                      width: b.width?.toString() || '' 
                    }))
                  : [{ length: '', width: '' }],
                calculated: true,
                results: {
                  foundationVolume: f.foundationVolume || 0,
                  baseArea: f.baseArea || 0,
                  baseLength: f.baseLength || 0,
                  baseWidth: f.baseWidth || 0,
                  foundationsVolume: f.foundationsVolume || 0,
                  totalVolume: (f.foundationVolume || 0) + (f.foundationsVolume || 0),
                },
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved calculations:', error);
      }
    };

    if (projectId) {
      loadSavedCalculations();
    }
  }, [projectId]);

  const handleFoundationInputChange = (field: keyof FoundationData, value: any) => {
    setFoundationData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };
      // If editing, reset calculated status
      if (prev.calculated && field !== 'calculated') {
        updated.calculated = false;
        updated.results = undefined;
      }
      return updated;
    });
  };

  const addIndividualBase = () => {
    setFoundationData(prev => ({
      ...prev,
      individualBases: [...prev.individualBases, { length: '', width: '' }],
    }));
  };

  const removeIndividualBase = (index: number) => {
    setFoundationData(prev => ({
      ...prev,
      individualBases: prev.individualBases.filter((_, i) => i !== index),
    }));
  };

  const updateIndividualBase = (index: number, field: 'length' | 'width', value: string) => {
    setFoundationData(prev => ({
      ...prev,
      individualBases: prev.individualBases.map((base, i) =>
        i === index ? { ...base, [field]: value } : base
      ),
    }));
  };

  const calculateFoundation = async () => {
    // Validation
    if (!foundationData.foundationLength || !foundationData.foundationWidth || 
        !foundationData.foundationHeight || !foundationData.numberOfFloors ||
        !foundationData.slabArea || !foundationData.soilType || 
        !foundationData.buildingType || !foundationData.baseHeight) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const baseHeightNum = parseFloat(foundationData.baseHeight);
    if (isNaN(baseHeightNum) || baseHeightNum < 40 || baseHeightNum > 80) {
      toast({
        title: "خطأ في الإدخال",
        description: "ارتفاع القاعدة يجب أن يكون بين 40 و 80 سم",
        variant: "destructive",
      });
      return;
    }

    if (!foundationData.baseShape) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء اختيار شكل القاعدة",
        variant: "destructive",
      });
      return;
    }

    if (foundationData.allBasesSimilar === null) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء تحديد إذا كانت جميع القواعد متشابهة أم مختلفة",
        variant: "destructive",
      });
      return;
    }

    if (foundationData.allBasesSimilar && !foundationData.totalNumberOfBases) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال عدد القواعد",
        variant: "destructive",
      });
      return;
    }

    if (!foundationData.allBasesSimilar && foundationData.individualBases.length === 0) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال بيانات القواعد الفردية",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        projectId,
        foundationLength: parseFloat(foundationData.foundationLength),
        foundationWidth: parseFloat(foundationData.foundationWidth),
        foundationHeight: parseFloat(foundationData.foundationHeight),
        numberOfFloors: parseInt(foundationData.numberOfFloors),
        slabArea: parseFloat(foundationData.slabArea),
        soilType: foundationData.soilType,
        buildingType: foundationData.buildingType,
        baseHeight: baseHeightNum,
        baseShape: foundationData.baseShape,
        allBasesSimilar: foundationData.allBasesSimilar,
      };

      if (foundationData.allBasesSimilar) {
        payload.totalNumberOfBases = parseInt(foundationData.totalNumberOfBases);
      } else {
        payload.individualBases = foundationData.individualBases.map(base => ({
          length: parseFloat(base.length),
          width: parseFloat(base.width),
        }));
      }

      const res = await fetch(`${API_BASE_URL}/calculations/foundation-base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setFoundationData(prev => ({
          ...prev,
          calculated: true,
          results: data.data,
        }));
        toast({
          title: "تم الحساب بنجاح",
          description: "تم حفظ النتائج في قاعدة البيانات",
        });
      } else {
        toast({
          title: "خطأ في الحساب",
          description: data.message || "فشل الحساب",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "فشل الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (tabId: string, field: keyof TabData, value: string) => {
    setTabData(prev => ({
      ...prev,
      [tabId]: {
        ...prev[tabId],
        [field]: value
      }
    }));
  };

  const calculateTab = (tabId: string) => {
    const data = tabData[tabId];
    const L = parseFloat(data.length);
    const W = parseFloat(data.width);
    const H = parseFloat(data.height);

    if (isNaN(L) || isNaN(W) || isNaN(H) || L <= 0 || W <= 0 || H <= 0) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال قيم صالحة لجميع الأبعاد",
        variant: "destructive",
      });
      return;
    }

    const volume = L * W * H;
    
    setTabData(prev => ({
      ...prev,
      [tabId]: {
        ...prev[tabId],
        quantity: parseFloat(volume.toFixed(2)),
        completed: true
      }
    }));

    toast({
      title: "تم الحساب بنجاح",
      description: `الكمية: ${volume.toFixed(2)} م³`,
    });
  };

  const isTabLocked = (tabId: string): boolean => {
    return false;
  };

  const getTotalVolume = (): number => {
    const foundationVol = foundationData.results?.totalVolume || 0;
    const otherTabsVol = Object.values(tabData).reduce((sum, data) => sum + (data.quantity || 0), 0);
    return foundationVol + otherTabsVol;
  };

  const getTrucksNeeded = (): number => {
    return Math.ceil(getTotalVolume() / 0.5);
  };

  if (loadingData) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-6">
        <Link href={`/engineer/projects/${projectId}`}>
          <Button variant="ghost" className="mb-4">
            ← العودة إلى المشروع
          </Button>
        </Link>
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <HardHat className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-3xl font-bold text-red-700">حساب كميات الباطون</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  أدخل الأبعاد لكل عنصر إنشائي بالترتيب
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-white shadow-lg p-1 rounded-xl h-auto">
          {tabs.map((tab) => {
            const isCompleted = tab.id === 'foundation' 
              ? foundationData.calculated 
              : tabData[tab.id]?.completed;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  relative data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md
                  ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                `}
              >
                {isCompleted && <CheckCircle2 className="h-4 w-4 absolute top-1 left-1 text-green-600" />}
                <span className="text-xs sm:text-sm px-2 py-2">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Foundation Tab */}
        <TabsContent value="foundation">
          <Card className="bg-white shadow-xl border-t-4 border-t-red-500">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Building2 size={24} className="text-red-600" />
                صبة النظاف والقواعد
              </CardTitle>
              <CardDescription>
                أدخل جميع البيانات المطلوبة لحساب كميات الخرسانة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Basic Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="foundation-length" className="text-base font-semibold">طول صبة النظاف (متر)</Label>
                    <Input
                      id="foundation-length"
                      type="number"
                      step="0.01"
                      value={foundationData.foundationLength}
                      onChange={(e) => handleFoundationInputChange('foundationLength', e.target.value)}
                      placeholder="مثال: 10"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                  </div>
                  <div>
                    <Label htmlFor="foundation-width" className="text-base font-semibold">عرض صبة النظاف (متر)</Label>
                    <Input
                      id="foundation-width"
                      type="number"
                      step="0.01"
                      value={foundationData.foundationWidth}
                      onChange={(e) => handleFoundationInputChange('foundationWidth', e.target.value)}
                      placeholder="مثال: 8"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                  </div>
                  <div>
                    <Label htmlFor="foundation-height" className="text-base font-semibold">ارتفاع صبة النظاف (متر)</Label>
                    <Input
                      id="foundation-height"
                      type="number"
                      step="0.01"
                      value={foundationData.foundationHeight}
                      onChange={(e) => handleFoundationInputChange('foundationHeight', e.target.value)}
                      placeholder="مثال: 0.3"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="number-of-floors" className="text-base font-semibold">عدد الطوابق</Label>
                    <Input
                      id="number-of-floors"
                      type="number"
                      value={foundationData.numberOfFloors}
                      onChange={(e) => handleFoundationInputChange('numberOfFloors', e.target.value)}
                      placeholder="مثال: 3"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slab-area" className="text-base font-semibold">مساحة البلاطة (م²)</Label>
                    <Input
                      id="slab-area"
                      type="number"
                      step="0.01"
                      value={foundationData.slabArea}
                      onChange={(e) => handleFoundationInputChange('slabArea', e.target.value)}
                      placeholder="مثال: 200"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                  </div>
                  <div>
                    <Label htmlFor="base-height" className="text-base font-semibold">ارتفاع القاعدة (سم)</Label>
                    <Input
                      id="base-height"
                      type="number"
                      step="0.1"
                      value={foundationData.baseHeight}
                      onChange={(e) => handleFoundationInputChange('baseHeight', e.target.value)}
                      placeholder="40-80"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                    <p className="text-xs text-gray-500 mt-1">يجب أن يكون بين 40 و 80 سم</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="soil-type" className="text-base font-semibold">نوع التربة</Label>
                    <Select
                      value={foundationData.soilType}
                      onValueChange={(value) => handleFoundationInputChange('soilType', value)}
                      disabled={foundationData.calculated}
                    >
                      <SelectTrigger className="text-right mt-2">
                        <SelectValue placeholder="اختر نوع التربة" />
                      </SelectTrigger>
                      <SelectContent>
                        {soilTypes.map((soil) => (
                          <SelectItem key={soil._id} value={soil.name}>
                            {soil.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="building-type" className="text-base font-semibold">نوع المبنى</Label>
                    <Select
                      value={foundationData.buildingType}
                      onValueChange={(value) => handleFoundationInputChange('buildingType', value)}
                      disabled={foundationData.calculated}
                    >
                      <SelectTrigger className="text-right mt-2">
                        <SelectValue placeholder="اختر نوع المبنى" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map((building) => (
                          <SelectItem key={building._id} value={building.buildingType}>
                            {building.buildingType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Base Shape */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">شكل القاعدة</Label>
                  <RadioGroup
                    value={foundationData.baseShape}
                    onValueChange={(value) => handleFoundationInputChange('baseShape', value)}
                    disabled={foundationData.calculated}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="square" id="square" />
                      <Label htmlFor="square">مربعة</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="rectangular" id="rectangular" />
                      <Label htmlFor="rectangular">مستطيلة</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* All Bases Similar */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">هل جميع القواعد متشابهة؟</Label>
                  <RadioGroup
                    value={foundationData.allBasesSimilar === null ? '' : foundationData.allBasesSimilar ? 'yes' : 'no'}
                    onValueChange={(value) => handleFoundationInputChange('allBasesSimilar', value === 'yes')}
                    disabled={foundationData.calculated}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="yes" id="similar-yes" />
                      <Label htmlFor="similar-yes">نعم، جميعها متشابهة</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="no" id="similar-no" />
                      <Label htmlFor="similar-no">لا، القواعد مختلفة</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Number of Bases or Individual Bases */}
                {foundationData.allBasesSimilar === true && (
                  <div>
                    <Label htmlFor="total-number-of-bases" className="text-base font-semibold">عدد القواعد</Label>
                    <Input
                      id="total-number-of-bases"
                      type="number"
                      value={foundationData.totalNumberOfBases}
                      onChange={(e) => handleFoundationInputChange('totalNumberOfBases', e.target.value)}
                      placeholder="مثال: 12"
                      className="text-right mt-2"
                      disabled={foundationData.calculated}
                    />
                  </div>
                )}

                {foundationData.allBasesSimilar === false && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <Label className="text-base font-semibold">أبعاد القواعد الفردية (متر)</Label>
                        <p className="text-xs text-gray-500 mt-1">أدخل أبعاد كل قاعدة (طول × عرض)</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIndividualBase}
                        disabled={foundationData.calculated}
                      >
                        إضافة قاعدة
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {foundationData.individualBases.map((base, index) => (
                        <div key={index} className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Label className="text-sm">طول القاعدة {index + 1} (متر)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={base.length}
                              onChange={(e) => updateIndividualBase(index, 'length', e.target.value)}
                              placeholder="مثال: 2"
                              className="text-right mt-1"
                              disabled={foundationData.calculated}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm">عرض القاعدة {index + 1} (متر)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={base.width}
                              onChange={(e) => updateIndividualBase(index, 'width', e.target.value)}
                              placeholder="مثال: 2"
                              className="text-right mt-1"
                              disabled={foundationData.calculated}
                            />
                          </div>
                          {!foundationData.calculated && foundationData.individualBases.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeIndividualBase(index)}
                            >
                              حذف
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {foundationData.calculated && foundationData.results && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-lg font-semibold text-green-800">تم الحساب بنجاح</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFoundationData(prev => ({ ...prev, calculated: false }))}
                      >
                        تعديل البيانات
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">كمية الخرسانة في صبة النظاف</p>
                        <p className="text-xl font-bold text-green-700">{foundationData.results.foundationVolume} م³</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">مساحة القاعدة</p>
                        <p className="text-xl font-bold text-blue-700">{foundationData.results.baseArea} م²</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">أبعاد القاعدة</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {foundationData.results.baseLength} × {foundationData.results.baseWidth} م
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">كمية الخرسانة في القواعد</p>
                        <p className="text-xl font-bold text-orange-700">{foundationData.results.foundationsVolume} م³</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">إجمالي كمية الخرسانة</p>
                        <p className="text-2xl font-bold text-red-700">{foundationData.results.totalVolume} م³</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calculate Button */}
                {!foundationData.calculated && (
                  <Button
                    onClick={calculateFoundation}
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري الحساب...
                      </>
                    ) : (
                      'حساب كميات الخرسانة'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Tabs */}
        {tabs.slice(1).map((tab) => {
          const data = tabData[tab.id];
          return (
            <TabsContent key={tab.id} value={tab.id}>
              <Card className="bg-white shadow-xl border-t-4 border-t-red-500">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <tab.icon size={24} className="text-red-600" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>أدخل الأبعاد لحساب الحجم المطلوب</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`${tab.id}-length`} className="text-base font-semibold">الطول (متر)</Label>
                        <Input
                          id={`${tab.id}-length`}
                          type="number"
                          step="0.01"
                          value={data.length}
                          onChange={(e) => handleInputChange(tab.id, 'length', e.target.value)}
                          placeholder="مثال: 5.5"
                          className="text-right mt-2"
                          disabled={data.completed}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${tab.id}-width`} className="text-base font-semibold">العرض (متر)</Label>
                        <Input
                          id={`${tab.id}-width`}
                          type="number"
                          step="0.01"
                          value={data.width}
                          onChange={(e) => handleInputChange(tab.id, 'width', e.target.value)}
                          placeholder="مثال: 4.0"
                          className="text-right mt-2"
                          disabled={data.completed}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${tab.id}-height`} className="text-base font-semibold">الارتفاع/السماكة (متر)</Label>
                        <Input
                          id={`${tab.id}-height`}
                          type="number"
                          step="0.01"
                          value={data.height}
                          onChange={(e) => handleInputChange(tab.id, 'height', e.target.value)}
                          placeholder="مثال: 0.3"
                          className="text-right mt-2"
                          disabled={data.completed}
                        />
                      </div>
                    </div>

                    {data.completed && data.quantity !== undefined && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-semibold text-green-800">تم الحساب</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{data.quantity} م³</p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      {!data.completed && (
                        <Button
                          onClick={() => calculateTab(tab.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          حساب الحجم
                        </Button>
                      )}
                      {data.completed && tabs.findIndex(t => t.id === tab.id) < tabs.length - 1 && (
                        <Button
                          onClick={() => {
                            const nextIndex = tabs.findIndex(t => t.id === tab.id) + 1;
                            setActiveTab(tabs[nextIndex].id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                          التالي
                          <ArrowRight className="h-4 w-4 mr-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Summary Card */}
      {getTotalVolume() > 0 && (
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-700">ملخص النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">إجمالي الحجم</p>
                <p className="text-3xl font-bold text-blue-700">{getTotalVolume().toFixed(2)} م³</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">عدد الشاحنات</p>
                <p className="text-3xl font-bold text-green-700">{getTrucksNeeded()} شاحنة</p>
                <p className="text-xs text-gray-500 mt-1">(كل شاحنة 0.5 م³)</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">عدد الأكياس (تقريبي)</p>
                <p className="text-3xl font-bold text-orange-700">{Math.ceil(getTotalVolume() * 7.5)} كيس</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
