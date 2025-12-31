"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Calculator,
  Columns as ColumnsIcon,
  Ruler,
  Box,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Shapes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Types
 type ColumnShape = "square" | "rectangular" | "circular";
 type ColumnInput = {
  id: string;
  shape: ColumnShape;
  length?: number; // m for square/rectangular
  width?: number; // m for square/rectangular
  height?: number; // m
  diameter?: number; // m for circular
 };

// Helpers
 function isPositiveNumber(value: any): boolean {
  if (value === undefined || value === null || value === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
 }

 function computeColumnVolume(c: ColumnInput): number {
  if (c.shape === "circular") {
    if (!isPositiveNumber(c.diameter) || !isPositiveNumber(c.height)) return 0;
    const r = Number(c.diameter) / 2; // meters
    return Math.PI * r * r * Number(c.height);
  }
  if (!isPositiveNumber(c.length) || !isPositiveNumber(c.width) || !isPositiveNumber(c.height)) return 0;
  return Number(c.length) * Number(c.width) * Number(c.height);
 }

 function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
 }

export default function ColumnsConcretePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const projectId = searchParams.get("projectId") || "";

  const [columns, setColumns] = useState<ColumnInput[]>([]);
  const [selectedShape, setSelectedShape] = useState<ColumnShape>("rectangular");
  const [saving, setSaving] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);

  useEffect(() => {
    // Quick health check similar to footings page
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        setServerAvailable(res.ok);
      } catch {
        setServerAvailable(false);
      }
    };
    check();
  }, []);

  const perColumnVolumes = useMemo(() => columns.map((c) => computeColumnVolume(c)), [columns]);
  const totalVolume = useMemo(() => perColumnVolumes.reduce((s, v) => s + v, 0), [perColumnVolumes]);

  function addColumn() {
    const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    setColumns((prev) => [
      ...prev,
      {
        id,
        shape: selectedShape,
      },
    ]);
  }

  function removeColumn(id: string) {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  }

  function updateColumn(id: string, patch: Partial<ColumnInput>) {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function validateColumn(c: ColumnInput): string[] {
    const errors: string[] = [];
    if (c.shape === "circular") {
      if (!isPositiveNumber(c.diameter)) errors.push("القطر يجب أن يكون رقمًا موجبًا");
      if (!isPositiveNumber(c.height)) errors.push("الارتفاع يجب أن يكون رقمًا موجبًا");
    } else {
      if (!isPositiveNumber(c.length)) errors.push("الطول يجب أن يكون رقمًا موجبًا");
      if (!isPositiveNumber(c.width)) errors.push("العرض يجب أن يكون رقمًا موجبًا");
      if (!isPositiveNumber(c.height)) errors.push("الارتفاع يجب أن يكون رقمًا موجبًا");
    }
    return errors;
  }

  async function handleSave() {
    const invalid = columns.some((c) => validateColumn(c).length > 0);
    if (invalid || columns.length === 0) {
      toast({ title: 'مدخلات غير صالحة', description: 'يرجى إدخال بيانات صحيحة لجميع الأعمدة قبل الحفظ', variant: 'destructive' });
      return;
    }

    const items = columns.map((c) => ({
      id: c.id,
      shape: c.shape,
      length: c.length ?? null,
      width: c.width ?? null,
      height: c.height ?? null,
      diameter: c.diameter ?? null,
      volume: computeColumnVolume(c),
      unit: 'm3',
    }));

    // If backend unavailable, store locally
    if (!serverAvailable || !projectId) {
      localStorage.setItem(`columns-${projectId || 'no-project'}`, JSON.stringify({ projectId, items, totalVolume, savedAt: new Date().toISOString() }));
      toast({ title: 'تم الحفظ محلياً', description: 'الخادم غير متاح أو لا يوجد معرف مشروع. تم حفظ النتائج مؤقتا�� في المتصفح.' });
      return;
    }

    try {
      setSaving(true);

      // Fetch project for owner info
      const projectRes = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (!projectRes.ok) throw new Error('PROJECT_FETCH_FAILED');
      const projectData = await projectRes.json();
      const project = projectData.project || projectData;

      // Prepare report payload compatible with quantityReports API
      const engineerId = localStorage.getItem('userId') || '';
      const engineerName = localStorage.getItem('userName') || 'المهندس';

      const reportData = {
        projectId,
        projectName: project?.name || `مشروع #${projectId}`,
        engineerId,
        engineerName,
        ownerName: project?.clientName || '',
        ownerEmail: project?.linkedOwnerEmail || '',
        calculationType: 'columns',
        concreteData: {
          totalConcrete: totalVolume,
          columns: items,
          columnsCount: items.length,
        },
      } as any;

      const resp = await fetch(`${API_BASE_URL}/quantity-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!resp.ok) throw new Error('REPORT_SAVE_FAILED');
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'SAVE_FAILED');

      toast({ title: 'تم الحفظ بنجاح', description: 'تم حفظ كميات خرسانة الأعمدة في قاعدة البيانات وجاهزة للتقارير.' });
      router.push(`/engineer/quantity-reports/${projectId}`);
    } catch (err: any) {
      console.error('Error saving columns report', err);
      toast({ title: 'خطأ في الحفظ', description: 'تعذر حفظ البيانات. تأكد من تشغيل الخادم الخلفي.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,transparent_30%,black_50%)] bg-center bg-repeat" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Link href="/engineer/projects">
                <Button variant="ghost" size="sm" className="border-2 border-blue-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 gap-2 text-blue-800 hover:text-blue-900">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  العودة للمشاريع
                </Button>
              </Link>
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg border-0 px-6 py-2.5 font-bold text-lg">
                حساب الخرسانة المتقدم
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
              <ColumnsIcon className="w-4 h-4" />
              <span>حساب خرسانة الأعمدة</span>
            </div>
          </div>

          <div className="relative group">
            <div className="flex items-start lg:items-center gap-6 p-2">
              <div className="relative">
                <div className="w-20 h-20 lg:w-24 lg:h-24 p-5 lg:p-6 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl border-4 border-white/40 group-hover:scale-105 transition-all duration-700 flex items-center justify-center">
                  <ColumnsIcon className="w-10 h-10 lg:w-12 lg:h-12 text-white drop-shadow-2xl" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-white rounded-xl shadow-xl flex items-center justify-center">
                  <Shapes className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 via-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight mb-4">
                  حساب كمية الخرسانة في الأعمدة
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 font-semibold leading-relaxed max-w-2xl">
                  أضف الأعمدة وحدد أبعادها حسب الشكل، وسيتم حساب حجم الخرسانة لكل عمود وإجمالي الكمية تلقائياً
                </p>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-indigo-400/10 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-all duration-700" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: Inputs */}
          <div className="xl:col-span-8 space-y-6 lg:space-y-8">
            {/* Global shape selector and add button */}
            <Card className="border-0 shadow-xl shadow-blue-200/50 hover:shadow-blue-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-6 px-6 border-b border-white/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40">
                    <Shapes className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">اختيار شكل العمود وإضافة أعمدة</CardTitle>
                    <CardDescription className="text-blue-100 text-base">اختر الشكل الافتراضي للأعمدة الجديدة ثم أضفها</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-0">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    {([
                      { key: "square", label: "مربع" },
                      { key: "rectangular", label: "مستطيل" },
                      { key: "circular", label: "دائري" },
                    ] as { key: ColumnShape; label: string }[]).map((opt) => (
                      <Button
                        key={opt.key}
                        variant={selectedShape === opt.key ? "default" : "outline"}
                        onClick={() => setSelectedShape(opt.key)}
                        className={selectedShape === opt.key ? "h-12 font-bold" : "h-12 font-bold border-2"}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <Button onClick={addColumn} className="h-12 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة عمود
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Columns list */}
            {columns.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-200 bg-white/70 backdrop-blur-sm p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border-2 border-gray-200">
                  <ColumnsIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد أعمدة بعد</h3>
                <p className="text-gray-500 text-sm">اختر الشكل الافتراضي واضغط "إضافة عمود" لبدء إدخال الأعمدة</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {columns.map((c, idx) => {
                  const errors = validateColumn(c);
                  const vol = computeColumnVolume(c);
                  return (
                    <Card key={c.id} className="border-0 shadow-xl shadow-purple-200/40 hover:shadow-purple-300/60 transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-700 text-white py-5 px-6 border-b border-white/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/40">
                              <ColumnsIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold">العمود #{idx + 1}</CardTitle>
                              <CardDescription className="text-purple-100">{c.shape === "square" ? "مربع" : c.shape === "rectangular" ? "مستطيل" : "دائري"}</CardDescription>
                            </div>
                          </div>
                          <Button variant="outline" onClick={() => removeColumn(c.id)} className="h-10 border-2 border-white/40 text-white hover:bg-white/10">
                            <Trash2 className="w-4 h-4 ml-2" /> حذف
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 lg:p-8 pt-0 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          {/* Shape */}
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">شكل العمود</Label>
                            <select
                              className="w-full h-12 rounded-xl border-2 border-gray-200 px-3 text-right hover:border-blue-300 focus:border-blue-500 transition-colors"
                              value={c.shape}
                              onChange={(e) =>
                                updateColumn(c.id, {
                                  shape: e.target.value as ColumnShape,
                                  length: undefined,
                                  width: undefined,
                                  diameter: undefined,
                                })
                              }
                            >
                              <option value="square">مربع</option>
                              <option value="rectangular">مستطيل</option>
                              <option value="circular">دائري</option>
                            </select>
                          </div>

                          {/* Length/Width or Diameter */}
                          {c.shape !== "circular" ? (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-900">الطول (م)</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  min={0}
                                  placeholder="مثال: 0.30"
                                  value={c.length ?? ""}
                                  onChange={(e) => updateColumn(c.id, { length: e.target.value === "" ? undefined : Number(e.target.value) })}
                                  className="h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-900">العرض (م)</Label>
                                <Input
                                  type="number"
                                  step="any"
                                  min={0}
                                  placeholder="مثال: 0.30"
                                  value={c.width ?? ""}
                                  onChange={(e) => updateColumn(c.id, { width: e.target.value === "" ? undefined : Number(e.target.value) })}
                                  className="h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <Label className="text-sm font-bold text-gray-900">القطر (م)</Label>
                              <Input
                                type="number"
                                step="any"
                                min={0}
                                placeholder="مثال: 0.30"
                                value={c.diameter ?? ""}
                                onChange={(e) => updateColumn(c.id, { diameter: e.target.value === "" ? undefined : Number(e.target.value) })}
                                className="h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl"
                              />
                            </div>
                          )}

                          {/* Height */}
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-900">الارتفاع (م)</Label>
                            <Input
                              type="number"
                              step="any"
                              min={0}
                              placeholder="مثال: 3.00"
                              value={c.height ?? ""}
                              onChange={(e) => updateColumn(c.id, { height: e.target.value === "" ? undefined : Number(e.target.value) })}
                              className="h-12 text-right border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Per-column result */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                          <div className="flex items-center gap-3 text-blue-900 font-bold">
                            <Box className="w-5 h-5" />
                            حجم العمود
                          </div>
                          <div className="text-lg font-extrabold text-blue-900">{formatNumber(vol)} م³</div>
                        </div>

                        {/* Errors */}
                        {errors.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 border-2 border-red-200 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2 text-red-800 font-bold">
                              <AlertCircle className="w-5 h-5" />
                              يرجى تصحيح الأخطاء التالية:
                            </div>
                            <ul className="list-disc pr-6 text-sm text-red-700 space-y-1">
                              {errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={addColumn} className="flex-1 h-14 text-lg font-bold shadow-2xl hover:shadow-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0">
                <Plus className="w-5 h-5 ml-2" />
                إضافة عمود جديد
              </Button>
              <Button onClick={() => setColumns([])} variant="outline" className="h-14 px-6 text-lg font-bold border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-900 transition-all duration-300 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                إعادة تعيين
              </Button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="xl:col-span-4">
            <Card className="border-0 shadow-2xl shadow-emerald-200/50 hover:shadow-emerald-300/75 sticky top-8 h-fit backdrop-blur-sm bg-white/80 transition-all duration-500 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white py-6 px-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">النتائج</CardTitle>
                    <CardDescription className="text-emerald-100 opacity-90">كميات الخرسانة المحسوبة</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                {/* Total result */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl -z-10 opacity-75 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-sm text-center group-hover:shadow-3xl group-hover:-translate-y-2 transition-all duration-500 transform">
                    <div className="w-16 h-16 mx-auto mb-3 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500">
                      <Box className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-emerald-100 font-bold text-sm tracking-wide">إجمالي حجم الخرسانة</Label>
                      <div className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent drop-shadow-2xl leading-none">
                        {formatNumber(totalVolume)}
                      </div>
                      <div className="text-lg font-bold text-emerald-100 tracking-wide">متر مكعب</div>
                    </div>
                  </div>
                </div>

                {/* List of volumes */}
                {columns.length > 0 && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
                      <h4 className="font-bold text-blue-900 mb-3">حجم كل عمود (م³)</h4>
                      <div className="space-y-2 text-sm">
                        {columns.map((c, i) => (
                          <div key={c.id} className="flex justify-between">
                            <span className="text-blue-700">عمود #{i + 1}</span>
                            <span className="font-bold text-blue-900">{formatNumber(perColumnVolumes[i])}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <Button onClick={handleSave} disabled={saving} className="w-full h-12 font-bold shadow-lg hover:shadow-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl border-0">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      حفظ الكميات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
