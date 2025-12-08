"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardHat, Building2, CheckCircle2, Lock, ArrowRight, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from 'next/link';

interface TabData {
  length: string;
  width: string;
  height: string;
  density?: string;
  percentage?: string;
  quantity?: number;
  completed: boolean;
}

const tabs = [
  { id: 'foundation', label: 'القواعد', icon: Building2 },
  { id: 'column-base', label: 'شروش الاعمدة', icon: Building2 },
  { id: 'ground-beams', label: 'جسور الارضية', icon: Building2 },
  { id: 'ground-slab', label: 'ارضية المبنى', icon: Building2 },
  { id: 'columns', label: 'الاعمدة', icon: Building2 },
  { id: 'roof', label: 'السقف', icon: Building2 },
];

export default function SteelCalculationsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('foundation');
  const [tabData, setTabData] = useState<Record<string, TabData>>({
    foundation: { length: '', width: '', height: '', density: '7850', percentage: '2', completed: false },
    'column-base': { length: '', width: '', height: '', density: '7850', percentage: '2', completed: false },
    'ground-beams': { length: '', width: '', height: '', density: '7850', percentage: '2', completed: false },
    'ground-slab': { length: '', width: '', height: '', density: '7850', percentage: '2', completed: false },
    columns: { length: '', width: '', height: '', density: '7850', percentage: '2', completed: false },
    roof: { length: '', width: '', height: '', density: '7850', percentage: '2', completed: false },
  });

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
    const density = parseFloat(data.density || '7850');
    const percentage = parseFloat(data.percentage || '2') / 100;

    if (isNaN(L) || isNaN(W) || isNaN(H) || isNaN(density) || isNaN(percentage) || 
        L <= 0 || W <= 0 || H <= 0 || density <= 0 || percentage <= 0) {
      toast({
        title: "خطأ في الإدخال",
        description: "الرجاء إدخال قيم صالحة لجميع الحقول",
        variant: "destructive",
      });
      return;
    }

    const volume = L * W * H;
    const steelWeight = volume * density * percentage;
    
    setTabData(prev => ({
      ...prev,
      [tabId]: {
        ...prev[tabId],
        quantity: parseFloat(steelWeight.toFixed(2)),
        completed: true
      }
    }));

    toast({
      title: "تم الحساب بنجاح",
      description: `الكمية: ${steelWeight.toFixed(2)} كغم`,
    });
  };

  const isTabLocked = (tabId: string): boolean => {
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    if (currentIndex === 0) return false;
    
    const previousTab = tabs[currentIndex - 1].id;
    return !tabData[previousTab].completed;
  };

  const getTotalWeight = (): number => {
    return Object.values(tabData).reduce((sum, data) => sum + (data.quantity || 0), 0);
  };

  const getTotalTons = (): number => {
    return getTotalWeight() / 1000;
  };

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-6">
        <Link href={`/engineer/projects/${projectId}`}>
          <Button variant="ghost" className="mb-4">
            ← العودة إلى المشروع
          </Button>
        </Link>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-3xl font-bold text-green-700">حساب كميات الحديد</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  أدخل الأبعاد ونسبة الحديد لكل عنصر إنشائي بالترتيب
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-white shadow-lg p-1 rounded-xl h-auto">
          {tabs.map((tab, index) => {
            const isLocked = isTabLocked(tab.id);
            const isCompleted = tabData[tab.id].completed;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={isLocked}
                className={`
                  relative data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isCompleted ? 'bg-green-100 text-green-700' : ''}
                `}
              >
                {isLocked && <Lock className="h-4 w-4 absolute top-1 right-1" />}
                {isCompleted && <CheckCircle2 className="h-4 w-4 absolute top-1 left-1 text-green-600" />}
                <span className="text-xs sm:text-sm px-2 py-2">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => {
          const data = tabData[tab.id];
          const isLocked = isTabLocked(tab.id);
          
          return (
            <TabsContent key={tab.id} value={tab.id}>
              <Card className="bg-white shadow-xl border-t-4 border-t-green-500">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <tab.icon size={24} className="text-green-600" />
                    {tab.label}
                  </CardTitle>
                  <CardDescription>
                    {isLocked ? 'يجب إكمال الحساب السابق أولاً' : 'أدخل الأبعاد ونسبة الحديد لحساب الوزن المطلوب'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLocked ? (
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        يجب إكمال حساب {tabs[tabs.findIndex(t => t.id === tab.id) - 1].label} أولاً
                      </AlertDescription>
                    </Alert>
                  ) : (
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`${tab.id}-density`} className="text-base font-semibold">كثافة الحديد (كغم/م³)</Label>
                          <Input
                            id={`${tab.id}-density`}
                            type="number"
                            value={data.density}
                            onChange={(e) => handleInputChange(tab.id, 'density', e.target.value)}
                            placeholder="7850"
                            className="text-right mt-2"
                            disabled={data.completed}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${tab.id}-percentage`} className="text-base font-semibold">نسبة الحديد (%)</Label>
                          <Input
                            id={`${tab.id}-percentage`}
                            type="number"
                            step="0.1"
                            value={data.percentage}
                            onChange={(e) => handleInputChange(tab.id, 'percentage', e.target.value)}
                            placeholder="2"
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
                          <p className="text-2xl font-bold text-green-700">{data.quantity} كغم</p>
                          <p className="text-sm text-gray-600 mt-1">≈ {(data.quantity / 1000).toFixed(2)} طن</p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        {!data.completed && (
                          <Button
                            onClick={() => calculateTab(tab.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                          >
                            حساب الوزن
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Summary Card */}
      {Object.values(tabData).some(t => t.completed) && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-700">ملخص النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">إجمالي الوزن</p>
                <p className="text-3xl font-bold text-green-700">{getTotalWeight().toFixed(2)} كغم</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 mb-2">إجمالي الأطنان</p>
                <p className="text-3xl font-bold text-blue-700">{getTotalTons().toFixed(2)} طن</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


