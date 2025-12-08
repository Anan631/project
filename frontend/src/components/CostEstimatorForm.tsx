
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Printer, PlusCircle, Trash2, Calculator, HardHat, User, Save, Loader2, Blocks, Ruler, FileText, ShoppingBasket, FileSignature, Briefcase, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserDocument, Project } from '@/lib/db';
import { getUsers, addCostReport, getProjects } from '@/lib/db';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        // The API may return user objects that omit sensitive fields (e.g. password_hash).
        // Ensure the shape matches UserDocument by providing a safe default for password_hash
        // so TypeScript accepts the assignment to UserDocument[].
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

  // Generate PDF report that can be saved and sent to owner
  const generateReportPDF = (reportTitle: string, engName: string, ownerName: string): string => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add Arabic font support - using built-in font with RTL support workaround
    doc.setFont('helvetica');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Indigo color
    const headerText = `تقرير تكلفة البناء: ${reportTitle}`;
    doc.text(headerText, pageWidth - margin, yPos, { align: 'right' });

    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // Gray color

    doc.text(`المهندس المسؤول: ${engName}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`المالك/العميل: ${ownerName}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`العملة: شيكل (₪)`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 15;

    // Draw line
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    // Table data
    const tableData = items.map((item, index) => [
      `${item.totalCost_ILS.toFixed(2)} ₪`,
      `${item.pricePerUnit_ILS.toFixed(2)} ₪`,
      `${item.quantity} ${item.unit}`,
      item.name,
      (index + 1).toString()
    ]);

    // Add table using autoTable
    autoTable(doc, {
      startY: yPos,
      head: [['المجموع', 'سعر الوحدة', 'الكمية', 'المادة', '#']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 5,
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [30, 41, 59],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'center', cellWidth: 15 }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      didDrawPage: () => {
        // Footer on each page
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;


    // Total row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, finalY, pageWidth - (margin * 2), 15, 'F');

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.text('المجموع الكلي:', pageWidth - margin - 5, finalY + 10, { align: 'right' });

    doc.setTextColor(30, 41, 59);
    doc.text(`${calculateOverallTotal_ILS().toFixed(2)} ₪`, margin + 40, finalY + 10, { align: 'left' });

    // Return as base64
    return doc.output('datauristring');
  };

  const handleSaveAndPrintReport = async () => {
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

    setIsSaving(true);
    const selectedOwner = owners.find(o => o.id === selectedOwnerId);
    if (!selectedOwner) {
      toast({ title: "خطأ", description: "المالك المختار غير موجود.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    // Save report data (without PDF to avoid size issues)

    // Determine effective Engineer Name (fallback to project engineer if missing)
    let effectiveEngineerName = engineerName;
    if (!effectiveEngineerName) {
      const proj = projects.find(p => p.id.toString() === selectedProjectId);
      if (proj && proj.engineer) {
        effectiveEngineerName = proj.engineer;
      }
    }

    const reportData = {
      projectId: selectedProjectId, // Send as string (ObjectId), do not parse to int
      reportName,
      engineerId,
      engineerName: effectiveEngineerName,
      ownerId: selectedOwnerId,
      ownerName: selectedOwner.name,
      items: items,
      totalCost_ILS: calculateOverallTotal_ILS(),
    };

    console.log('Saving report data:', reportData);

    try {
      // Direct client-side fetch to bypass server action issues
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      const json = await response.json();
      console.log('API response:', response.status, json);

      setIsSaving(false);

      if (response.ok && json.success) {
        toast({
          title: "تم الحفظ بنجاح",
          description: "تم حفظ التقرير وإرساله للمالك. يمكن للمالك تنزيله من حسابه.",
          variant: "default"
        });
        // Show print preview for engineer
        printReport(reportName, effectiveEngineerName, selectedOwner.name);
      } else {
        console.error('Save failed:', json.message || json.error);
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
                <div class="meta-item">
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
                    <CardTitle className="text-gray-800">حفظ وربط التقرير</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reportName" className="flex items-center gap-2 mb-2 font-medium text-gray-700"><FileSignature size={16} /> اسم التقرير</Label>
                    <Input id="reportName" value={reportName} onChange={(e) => setReportName(e.target.value)} placeholder="مثال: تقدير تكلفة فيلا السيد أحمد" className="bg-gray-50" disabled={!!selectedProjectId} />
                  </div>
                  <div>
                    <Label htmlFor="owner" className="flex items-center gap-2 mb-2 font-medium text-gray-700"><User size={16} /> ربط بمالك</Label>
                    <Select onValueChange={setSelectedOwnerId} value={selectedOwnerId} dir="rtl" disabled={!!selectedProjectId}>
                      <SelectTrigger id="owner" className="w-full text-right bg-gray-50"><SelectValue placeholder="اختر مالكًا..." /></SelectTrigger>
                      <SelectContent>{owners.map(owner => (<SelectItem key={owner.id} value={owner.id}>{owner.name} ({owner.email})</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={handleClearAllItems} variant="destructive" className="w-full sm:w-auto"><Trash2 className="ml-2 h-5 w-5" /> مسح كل المواد</Button>
                  <Button onClick={handleSaveAndPrintReport} disabled={isSaving} className="w-full sm:w-auto flex-grow bg-gradient-to-r from-indigo-500 to-purple-500 text-white"><Printer className="ml-2 h-5 w-5" /> {isSaving ? "جاري الحفظ..." : "حفظ وطباعة التقرير"}</Button>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
