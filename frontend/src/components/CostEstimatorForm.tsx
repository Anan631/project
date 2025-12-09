"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Printer, PlusCircle, Trash2, Calculator, HardHat, User, Save, Loader2, Blocks, Ruler, FileText, ShoppingBasket, FileSignature, Briefcase, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import type { UserDocument, Project } from '@/lib/db';
import { getUsers, getProjects } from '@/lib/db';

interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit_ILS: number;
  totalCost_ILS: number;
}

const baseUnits: Record<string, string> = {
  brick: "قطعة",
  iron: "كغم",
  concrete: "م³",
  mesh: "لفة",
  nails: "حبة",
  cuttingDiscs: "قرص",
  cement: "كيس",
  sand: "م³",
  hasma: "حصمة",
  naama: "ناعمة",
  stone: "م",
  labor: "يومية",
};

const getMaterialDisplayName = (key: string): string => {
  const names: Record<string, string> = {
    brick: "الطوب",
    iron: "الحديد",
    concrete: "الخرسانة",
    mesh: "السلك",
    nails: "مسامير",
    cuttingDiscs: "أقراص قطع",
    cement: "إسمنت",
    sand: "رمل",
    hasma: "حصمة",
    naama: "ناعمة",
    stone: "الحجر",
    labor: "أيدي عاملة",
  };
  return names[key] || key;
};

const materialSubTypes: Record<string, string[]> = {
  brick: ["طوب 10", "طوب 20", "طوب 15", "ربس 14", "ربس 17", "ربس 24"],
  iron: ["6 مم", "8 ملم", "10 ملم", "12 ملم", "14 ملم", "16 ملم", "18 ملم", "20 ملم", "شبك حديد"],
  concrete: ["خرسانة جاهزة (رملية)", "خرسانة جاهزة (ناعمة)"],
  mesh: ["سلك مجدول", "سلك ناعم"],
  nails: ["مسمار 6", "مسمار 10", "مسمار فولاذ"],
  cuttingDiscs: ["أقراص قطع حديد", "أقراص قطع خرسانة"],
  cement: ["اسمنت ابيض", "اسمنت اسود"],
  sand: ["رمل"],
  hasma: ["حصمة حبة كبيرة", "حصمة حبة صغيرة"],
  naama: ["ناعمة"],
  stone: ["حجر طبيعي", "حجر صناعي"],
  labor: ["عامل عادي", "معلم بناء", "معلم قصارة", "معلم بلاط", "كهربائي", "سباك", "دهان", "نجار طوبار", "حداد مسلح", "مقاول عام", "عامل نظافة"],
};

export default function CostEstimatorForm() {
  const { toast } = useToast();
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>('');
  const [selectedSubType, setSelectedSubType] = useState<string>('');
  const [pricePerUnitILS, setPricePerUnitILS] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [currentUnitDisplay, setCurrentUnitDisplay] = useState<string>('--');
  const [engineerName, setEngineerName] = useState<string>('');
  const [engineerId, setEngineerId] = useState<string>('');
  const [reportName, setReportName] = useState<string>('');
  const [owners, setOwners] = useState<UserDocument[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'SAVE_PRINT_SEND' | 'PRINT_ONLY' | 'SEND_ONLY' | null>(null);

  useEffect(() => {
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');
    if (name) setEngineerName(name);
    if (id) setEngineerId(id);

    async function fetchData() {
      if (!id) return;
      const [usersResult, projectsResult] = await Promise.all([
        getUsers(),
        getProjects(id)
      ]);

      if (usersResult.success && usersResult.users) {
        const ownersList: UserDocument[] = usersResult.users
          .filter(u => u.role === 'OWNER' && u.status === 'ACTIVE')
          .map(u => ({ ...(u as any), password_hash: (u as any).password_hash ?? '' } as UserDocument));
        setOwners(ownersList);
      } else {
        toast({ title: "خطأ", description: "فشل تحميل قائمة المالكين.", variant: "destructive" });
      }

      if (projectsResult.success && projectsResult.projects) {
        setProjects(projectsResult.projects.filter(p => p.status !== 'مؤرشف'));
      } else {
        toast({ title: "خطأ", description: "فشل تحميل قائمة المشاريع.", variant: "destructive" });
      }
    }
    fetchData();
  }, [toast]);

  useEffect(() => {
    if (selectedMaterialKey) {
      setCurrentUnitDisplay(baseUnits[selectedMaterialKey] || '--');
      setSelectedSubType('');
    } else {
      setCurrentUnitDisplay('--');
      setSelectedSubType('');
    }
  }, [selectedMaterialKey]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id.toString() === projectId);
    if (project) {
      setReportName(project.name);
      const owner = owners.find(o => o.email === project.linkedOwnerEmail);
      if (owner) {
        setSelectedOwnerId(owner.id);
      } else {
        setSelectedOwnerId('');
      }
    }
  };

  const handleAddItem = () => {
    if (!selectedMaterialKey || !selectedSubType || !pricePerUnitILS || !quantity) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال جميع البيانات المطلوبة.",
        variant: "destructive",
      });
      return;
    }
    const priceNum = parseFloat(pricePerUnitILS);
    const quantityNum = parseFloat(quantity);
    if (isNaN(priceNum) || priceNum <= 0 || isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "بيانات غير صالحة",
        description: "يرجى التأكد من أن السعر والكمية أرقام موجبة.",
        variant: "destructive",
      });
      return;
    }
    const materialDisplayName = getMaterialDisplayName(selectedMaterialKey);
    const fullItemName = `${materialDisplayName} (${selectedSubType})`;
    const unit = baseUnits[selectedMaterialKey];
    const newItem: MaterialItem = {
      id: Date.now().toString(),
      name: fullItemName,
      quantity: quantityNum,
      unit: unit,
      pricePerUnit_ILS: priceNum,
      totalCost_ILS: priceNum * quantityNum,
    };
    setItems(prevItems => [...prevItems, newItem]);
    setSelectedSubType('');
    setPricePerUnitILS('');
    setQuantity('');
    toast({
      title: "تمت الإضافة بنجاح",
      description: `تمت إضافة "${fullItemName}" إلى القائمة.`,
      variant: "default",
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({
      title: "تم الحذف",
      description: "تم حذف المادة من القائمة.",
    });
  };

  const handleClearAllItems = () => {
    setItems([]);
    setSelectedMaterialKey('');
    setSelectedSubType('');
    setPricePerUnitILS('');
    setQuantity('');
    setCurrentUnitDisplay('--');
    setReportName('');
    setSelectedOwnerId('');
    setSelectedProjectId('');
    toast({
      title: "تم مسح الكل",
      description: "تم مسح جميع المواد من القائمة.",
    });
  };

  const calculateOverallTotal_ILS = () => {
    return items.reduce((sum, item) => sum + item.totalCost_ILS, 0);
  };

  const handleSaveClick = () => {
    if (!selectedProjectId) {
      toast({ title: "بيانات ناقصة", description: "يرجى اختيار مشروع لربط التقرير به.", variant: "destructive" });
      return;
    }
    if (!reportName.trim()) {
      toast({ title: "بيانات ناقصة", description: "يرجى إدخال اسم للتقرير.", variant: "destructive" });
      return;
    }
    if (!selectedOwnerId) {
      toast({ title: "بيانات ناقصة", description: "يرجى اختيار مالك لربط التقرير به.", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "بيانات ناقصة", description: "يرجى إضافة مواد للتقرير.", variant: "destructive" });
      return;
    }
    setIsSaveDialogOpen(true);
  };

  const handleActionClick = (action: 'SAVE_PRINT_SEND' | 'PRINT_ONLY' | 'SEND_ONLY') => {
    setSelectedAction(action);
    setIsSaveDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    setIsConfirmDialogOpen(false);
    const selectedOwner = owners.find(o => o.id === selectedOwnerId);
    if (!selectedOwner && selectedAction !== 'PRINT_ONLY') {
      toast({ title: "خطأ", description: "المالك المختار غير موجود.", variant: "destructive" });
      return;
    }

    let effectiveEngineerName = engineerName;
    const proj = projects.find(p => p.id.toString() === selectedProjectId);
    if (!effectiveEngineerName && proj && proj.engineer) {
      effectiveEngineerName = proj.engineer;
    }

    const ownerName = selectedOwner ? selectedOwner.name : 'غير محدد';

    if (selectedAction === 'PRINT_ONLY') {
      printReport(reportName, effectiveEngineerName, ownerName);
      toast({ title: "الطباعة", description: "جاري تجهيز التقرير للطباعة." });
      return;
    }

    setIsSaving(true);
    const status = (selectedAction === 'SAVE_PRINT_SEND') ? 'SENT' : 'SENT';

    const reportData = {
      projectId: selectedProjectId,
      reportName,
      engineerId,
      engineerName: effectiveEngineerName,
      ownerId: selectedOwnerId,
      ownerName: ownerName,
      items: items,
      totalCost_ILS: calculateOverallTotal_ILS(),
      status: status
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const json = await response.json();
      setIsSaving(false);

      if (response.ok && json.success) {
        let toastDescription = "";
        switch (selectedAction) {
          case 'SAVE_PRINT_SEND':
            toastDescription = "تم حفظ وإرسال التقرير، وسيتم طباعته.";
            printReport(reportName, effectiveEngineerName, ownerName);
            break;
          case 'SEND_ONLY':
            toastDescription = "تم حفظ وإرسال التقرير للمالك.";
            break;
        }
        toast({
          title: "تم بنجاح",
          description: toastDescription,
        });

      } else {
        toast({ title: "فشل الحفظ", description: json.message || "حدث خطأ أثناء حفظ التقرير.", variant: "destructive" });
      }
    } catch (error) {
      setIsSaving(false);
      console.error('Save error:', error);
      toast({ title: "فشل الحفظ", description: "حدث خطأ في الاتصال بالخادم.", variant: "destructive" });
    }
  };

  const printReport = (reportTitle: string, engName: string, ownerName: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const tableRows = items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${item.pricePerUnit_ILS.toFixed(2)} ₪</td>
          <td style="font-weight: 700;">${item.totalCost_ILS.toFixed(2)} ₪</td>
        </tr>
      `).join('');

      const overallTotal = calculateOverallTotal_ILS().toFixed(2);
      const fullReportTitle = `تقرير تكلفة البناء: ${reportTitle}`;
      const currentDate = new Date().toLocaleDateString('ar-EG-u-nu-latn');
      const itemsCount = items.length;

      const reportHtml = `
        <html>
          <head>
            <title>${fullReportTitle}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
            <style>
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  color-adjust: exact;
                }
              }
              body {
                font-family: 'Tajawal', sans-serif;
                direction: rtl;
                background-color: #f3f4f6;
                margin: 0;
                padding: 20px;
                color: #1f2937;
              }
              .container {
                max-width: 1200px;
                margin: auto;
                background: linear-gradient(to bottom, #ffffff, #f9fafb);
                padding: 40px 50px;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
                border: 1px solid #e5e7eb;
              }
              .report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 25px;
                border-bottom: 4px solid #4f46e5;
                margin-bottom: 30px;
              }
              .report-header .titles {
                text-align: right;
              }
              .report-header h1 {
                margin: 0;
                color: #312e81;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: -1px;
              }
              .report-header p {
                margin: 8px 0 0;
                font-size: 18px;
                color: #4b5563;
              }
              .report-meta {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 40px;
              }
              .meta-item {
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 12px;
                border: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
                gap: 5px;
              }
              .meta-item .label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 400;
              }
              .meta-item .value {
                font-size: 18px;
                color: #312e81;
                font-weight: 700;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 15px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                margin-bottom: 30px;
              }
              th, td {
                padding: 16px 20px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
              }
              thead th {
                background: linear-gradient(to bottom, #4f46e5, #4338ca);
                font-weight: 700;
                color: #ffffff;
                font-size: 16px;
              }
              tbody tr {
                transition: background-color 0.2s ease;
              }
              tbody tr:last-child {
                border-bottom: 0;
              }
              tbody tr:nth-of-type(even) {
                background-color: #f9fafb;
              }
              tbody tr:hover {
                background-color: #f0f0ff;
              }
              .total-section {
                background-color: #f9fafb;
                padding: 25px;
                border-radius: 12px;
                border: 2px solid #4f46e5;
                margin: 30px 0;
              }
              .total-section .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .total-section .total-label {
                font-size: 24px;
                color: #4f46e5;
                font-weight: 700;
              }
              .total-section .total-value {
                font-size: 32px;
                color: #312e81;
                font-weight: 700;
              }
              .report-footer {
                margin-top: 50px;
                text-align: center;
                font-size: 14px;
                color: #9ca3af;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <header class="report-header">
                <div class="titles">
                  <h1>${fullReportTitle}</h1>
                  <p>تفصيل شامل لتكاليف المواد والعمالة</p>
                </div>
              </header>
              
              <section class="report-meta">
                <div class="meta-item">
                  <span class="label">المهندس المسؤول</span>
                  <span class="value">${engName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">المالك/العميل</span>
                  <span class="value">${ownerName}</span>
                </div>
                <div class="meta-item">
                  <span class="label">تاريخ التقرير</span>
                  <span class="value">${currentDate}</span>
                </div>
                <div className="meta-item">
                  <span class="label">عدد المواد</span>
                  <span class="value">${itemsCount}</span>
                </div>
              </section>

              <table>
                <thead>
                  <tr>
                    <th>المادة</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              <div class="total-section">
                <div class="total-row">
                  <span class="total-label">المجموع الكلي:</span>
                  <span class="total-value">${overallTotal} ₪</span>
                </div>
              </div>

              <footer class="report-footer">
                <p>هذا التقرير تم إنشاؤه بواسطة نظام إدارة المشاريع.</p>
                <p>&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة.</p>
              </footer>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast({
        title: "خطأ في الطباعة",
        description: "لم يتمكن المتصفح من فتح نافذة الطباعة.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 cost-estimator-body">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          <span className="text-blue-600">حاسبة</span> أسعار المواد
        </h1>
        <p className="text-gray-600">أداة لحساب تكاليف مواد البناء بالشيكل</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Input Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="bg-gradient-to-br from-gray-800 to-gray-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Calculator className="h-6 w-6" />
                <CardTitle>إضافة مادة جديدة</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <Label htmlFor="project" className="flex items-center gap-2 mb-2 font-medium text-gray-700"><Briefcase size={16} /> اختر المشروع</Label>
                <Select onValueChange={handleProjectChange} value={selectedProjectId} dir="rtl">
                  <SelectTrigger id="project" className="w-full text-right bg-gray-50"><SelectValue placeholder="اختر مشروعًا لربط التقرير به..." /></SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (<SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="material" className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                  <Blocks size={16} /> اختر مادة البناء
                </Label>
                <Select value={selectedMaterialKey} onValueChange={setSelectedMaterialKey} dir="rtl">
                  <SelectTrigger id="material" className="w-full bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-right">
                    <SelectValue placeholder="حدد المادة من القائمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(baseUnits).map((matKey) => (
                      <SelectItem key={matKey} value={matKey}>
                        {getMaterialDisplayName(matKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMaterialKey && materialSubTypes[selectedMaterialKey] && (
                <div>
                  <Label htmlFor="subtype" className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                    <Blocks size={16} /> اختر النوع الفرعي
                  </Label>
                  <Select value={selectedSubType} onValueChange={setSelectedSubType} dir="rtl">
                    <SelectTrigger id="subtype" className="w-full bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-right">
                      <SelectValue placeholder="اختر النوع الفرعي" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialSubTypes[selectedMaterialKey]?.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="quantity" className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                  <Ruler size={16} /> الكمية
                </Label>
                <div className="relative">
                  <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="أدخل الكمية" className="bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-20 text-right" min="0.01" step="0.01" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-gray-200 px-3 py-1 rounded text-sm text-gray-700 pointer-events-none">
                    {currentUnitDisplay}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="pricePerUnitILS" className="flex items-center gap-2 mb-2 font-medium text-gray-700">
                  <span className="font-bold text-lg">₪</span> السعر لكل وحدة (شيكل)
                </Label>
                <Input id="pricePerUnitILS" type="number" value={pricePerUnitILS} onChange={(e) => setPricePerUnitILS(e.target.value)} placeholder="أدخل السعر" className="bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500" min="0.01" step="0.01" />
              </div>

              <Button onClick={handleAddItem} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 text-lg transform hover:scale-105 transition-transform" disabled={!selectedMaterialKey || !selectedSubType || !pricePerUnitILS || !quantity}>
                <PlusCircle className="ml-2 h-5 w-5" />
                إضافة المادة للقائمة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Column */}
        <div className="lg:col-span-3 space-y-6">
          {items.length === 0 ? (
            <Card className="shadow-lg border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
              <CardContent className="text-center text-gray-500 p-8">
                <ShoppingBasket size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">قائمة التكاليف فارغة</h3>
                <p className="mt-2">ابدأ بإضافة المواد من النموذج على اليمين لعرض تقرير التكاليف هنا.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6" />
                      <CardTitle>تقرير التكاليف</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">المجموع الكلي</div>
                      <div className="text-2xl font-bold">{calculateOverallTotal_ILS().toFixed(2)} ₪</div>
                      <div className="text-xs opacity-75 mt-1">
                        متوسط التكلفة: {items.length > 0 ? (calculateOverallTotal_ILS() / items.length).toFixed(2) : '0.00'} ₪ / مادة
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right font-medium text-gray-600">المادة</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">الكمية</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600">سعر الوحدة</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">المجموع</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-600"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-right text-gray-700 font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{item.quantity} {item.unit}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{item.pricePerUnit_ILS.toFixed(2)}</td>
                            <td className="px-4 py-3 text-left text-gray-700 font-semibold">{item.totalCost_ILS.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100/50 p-1 h-8 w-8">
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5 text-indigo-500" />
                    <CardTitle className="text-gray-800">حفظ التقرير</CardTitle>
                  </div>
                  <CardDescription>
                    اختر خيارات الحفظ المناسبة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleSaveClick} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
                    حفظ التقرير
                  </Button>
                </CardContent>
              </Card>

              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="sm:max-w-md lg:max-w-lg rounded-2xl overflow-hidden border-0 shadow-2xl p-0" dir="rtl">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
                    <DialogHeader className="text-white">
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                          <Save className="h-6 w-6" />
                        </div>
                        خيارات حفظ التقرير
                      </DialogTitle>
                      <DialogDescription className="text-indigo-100 mt-2">
                        اختر طريقة حفظ التقرير التي تناسبك من الخيارات أدناه
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  {/* Action Buttons Section */}
                  <div className="p-6 space-y-4">
                    {/* Option 1: Save, Print & Send */}
                    <div className="group transition-all duration-300 hover:scale-[1.02]">
                      <Button
                        onClick={() => handleActionClick('SAVE_PRINT_SEND')}
                        className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-full">
                            <Printer className="h-6 w-6" />
                          </div>
                          <div className="text-right">
                            <div className="font-bold">حفظ وطباعة وإرسال</div>
                            <div className="text-sm font-normal opacity-90">يتم حفظ التقرير وإرساله للمالك وفتح نافذة الطباعة</div>
                          </div>
                        </div>
                      </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-sm text-gray-500">أو اختر أحد الخيارات التالية</span>
                      </div>
                    </div>

                    {/* Two-column grid for other options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 2: Print Only */}
                      <div className="group transition-all duration-300 hover:scale-[1.02]">
                        <Button
                          onClick={() => handleActionClick('PRINT_ONLY')}
                          variant="outline"
                          className="w-full h-28 border-2 border-amber-200 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-black hover:text-black font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative">
                            <div className="bg-amber-100 p-3 rounded-full">
                              <Printer className="h-8 w-8 text-amber-600" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-base">طباعة فقط</div>
                            <div className="text-xs text-gray-600 mt-1">طباعة التقرير دون حفظ أو إرسال</div>
                          </div>
                        </Button>
                      </div>

                      {/* Option 3: Send Only */}
                      <div className="group transition-all duration-300 hover:scale-[1.02]">
                        <Button
                          onClick={() => handleActionClick('SEND_ONLY')}
                          className="w-full h-28 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-300 text-black rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4 relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <Send className="h-8 w-8 text-blue-600" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-base">إرسال فقط</div>
                            <div className="text-xs text-gray-600 mt-1">إرسال التقرير للمالك دون طباعة</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-indigo-600">{items.length}</div>
                          <div className="text-xs text-gray-600">عدد المواد</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-emerald-600">{calculateOverallTotal_ILS().toFixed(0)} ₪</div>
                          <div className="text-xs text-gray-600">التكلفة الإجمالية</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-purple-600">
                            {items.length > 0 ? (calculateOverallTotal_ILS() / items.length).toFixed(0) : 0} ₪
                          </div>
                          <div className="text-xs text-gray-600">متوسط التكلفة</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <DialogFooter className="px-6 pb-6 pt-0 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>جاهز للحفظ</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsSaveDialogOpen(false)}
                          className="hover:bg-gray-200 text-gray-700 border border-gray-300"
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Confirmation Dialog */}
              <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <DialogContent className="sm:max-w-md lg:max-w-lg rounded-2xl overflow-hidden border-0 shadow-2xl p-0" dir="rtl">
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                    <DialogHeader className="text-white">
                      <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                          <Save className="h-6 w-6" />
                        </div>
                        تأكيد العملية
                      </DialogTitle>
                      <DialogDescription className="text-orange-100 mt-2">
                        هل أنت متأكد من رغبتك في تنفيذ هذه العملية؟
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  {/* Confirmation Content */}
                  <div className="p-6 space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-100 p-2 rounded-full mt-1">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-orange-900 mb-2">العملية المطلوب تأكيدها</h3>
                          <p className="text-sm text-orange-700">
                            {selectedAction === 'SAVE_PRINT_SEND' && 'حفظ التقرير وإرساله للمالك وطباعته'}
                            {selectedAction === 'PRINT_ONLY' && 'طباعة التقرير دون حفظ أو إرسال'}
                            {selectedAction === 'SEND_ONLY' && 'إرسال التقرير للمالك دون طباعة'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{items.length}</div>
                        <div className="text-sm text-gray-600">عدد المواد</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{calculateOverallTotal_ILS().toFixed(0)} ₪</div>
                        <div className="text-sm text-gray-600">التكلفة الإجمالية</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <DialogFooter className="px-6 pb-6 pt-0 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span>تأكيد العملية</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsConfirmDialogOpen(false)}
                          className="hover:bg-red-500 hover:text-white text-gray-700 border border-gray-300"
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={handleConfirmAction}
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold"
                        >
                          تأكيد العملية
                        </Button>
                      </div>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}