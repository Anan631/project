"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import {
  Building2,
  FileText,
  ArrowRight,
  Loader2,
  User,
  Calendar,
  Blocks,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface QuantityReport {
  _id: string;
  projectId: string;
  projectName: string;
  engineerName: string;
  ownerName: string;
  ownerEmail: string;
  calculationType: string;
  concreteData: {
    cleaningVolume?: number;
    foundationsVolume?: number;
    groundSlabVolume?: number;
    totalConcrete: number;
    totalFootingsVolume?: number;
    numberOfColumns?: number;
    finalColumnDimensions?: {
      displayText: string;
      [key: string]: any;
    };
    totalVolume?: number;
    bridgesCount?: number;
    bridges?: Array<{
      id: string;
      length: number;
      width: number;
      height: number;
      volume: number;
    }>;
    [key: string]: any;
  };
  steelData?: {
    totalSteelWeight: number;
    details: {
      kind: string;
      inputs: any;
      results: any;
    };
  };
  sentToOwner: boolean;
  sentToOwnerAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function OwnerQuantityReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  const [reports, setReports] = useState<QuantityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<{
    name: string;
    engineerName: string;
  } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        toast({
          title: 'خطأ',
          description: 'يرجى تسجيل الدخول أولاً',
          variant: 'destructive'
        });
        router.push('/owner/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/quantity-reports/owner/${encodeURIComponent(userEmail)}/project/${projectId}`);
      const data = await response.json();

      if (data.success) {
        setReports(data.reports);
        if (data.reports.length > 0) {
          setProjectInfo({
            name: data.reports[0].projectName,
            engineerName: data.reports[0].engineerName,
          });
        } else if (data.project) {
          setProjectInfo({
            name: data.project.name,
            engineerName: data.project.engineer || '',
          });
        }
      } else {
        throw new Error(data.message || 'فشل جلب التقارير');
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في جلب التقارير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (reportId: string) => {
    const report = reports.find(r => r._id === reportId);
    if (!report) return;

    if (report.calculationType.includes('steel')) {
      return downloadSteelPDF(reportId);
    }

    setDownloading(reportId);
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
            .container { max-width: 100%; background: white; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3); }
            .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; letter-spacing: 1px; }
            .header p { font-size: 20px; opacity: 0.95; font-weight: 500; }
            .project-name { background: linear-gradient(to right, #f8f9ff, #e8ecff); border-right: 6px solid #2563eb; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); }
            .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
            .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
            .info-box { background: linear-gradient(135deg, #ffffff, #f7fafc); border: 2px solid #e2e8f0; padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }
            .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
            .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
            thead { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; }
            th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
            td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
            tbody tr:nth-child(even) { background: #f8f9ff; }
            tbody tr:last-child { font-weight: 900; color: #2563eb; background: linear-gradient(to right, #f0f4ff, #e8ecff); font-size: 20px; }
            .total-box { background: linear-gradient(135deg, #d4f4dd, #bbf7d0); border: 3px solid #22c55e; border-radius: 12px; padding: 30px; margin-bottom: 40px; text-align: center; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); }
            .total-box label { display: block; font-size: 20px; color: #2d3748; margin-bottom: 12px; font-weight: 600; }
            .total-box .value { font-size: 32px; font-weight: 900; color: #16a34a; }
            .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>تقرير كميات الخرسانة</h1>
              <p>${report.calculationType === 'column-footings' ? 'شروش الأعمدة' : report.calculationType === 'columns' ? 'الأعمدة' : report.calculationType === 'roof' ? 'السقف' : report.calculationType === 'foundation' ? 'صبة النظافة والقواعد' : report.calculationType === 'ground-bridges' ? 'الجسور الأرضية' : report.calculationType === 'ground-slab' ? 'أرضية المبنى (المِدّة)' : report.calculationType === 'column-ties-steel' ? 'حديد الأعمدة والكانات' : 'تفصيل شامل'}</p>
            </div>
            <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
            <div class="info-boxes">
              <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
              <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
            </div>
            <table>
              <thead><tr><th>الإجمالي</th><th>الكمية</th><th>البند</th></tr></thead>
              <tbody>
                ${report.calculationType === 'column-footings' ? `
                  <tr><td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>كمية خرسانة شروش الأعمدة</td></tr>
                  <tr><td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>إجمالي الخرسانة</td></tr>
                ` : report.calculationType === 'columns' ? `
                  <tr><td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>كمية خرسانة الأعمدة</td></tr>
                  <tr><td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>إجمالي الخرسانة</td></tr>
                ` : report.calculationType === 'roof' ? `
                  <tr><td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>كمية خرسانة السقف</td></tr>
                  <tr><td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>إجمالي الخرسانة</td></tr>
                ` : report.calculationType === 'ground-bridges' ? `
                  <tr><td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>كمية خرسانة الجسور الأرضية</td></tr>
                  <tr><td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>إجمالي الخرسانة</td></tr>
                ` : report.calculationType === 'ground-slab' ? `
                  <tr><td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>كمية خرسانة أرضية المبنى (المِدّة)</td></tr>
                  <tr><td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td><td>إجمالي الخرسانة</td></tr>
                ` : `
                  <tr><td>${report.concreteData.cleaningVolume?.toFixed(2) || 0} م³</td><td>${report.concreteData.cleaningVolume?.toFixed(2) || 0} م³</td><td>كمية خرسانة النظافة</td></tr>
                  <tr><td>${report.concreteData.foundationsVolume?.toFixed(2) || 0} م³</td><td>${report.concreteData.foundationsVolume?.toFixed(2) || 0} م³</td><td>كمية خرسانة القواعد</td></tr>
                  ${(report.concreteData.groundSlabVolume && report.concreteData.groundSlabVolume > 0) ? `<tr><td>${report.concreteData.groundSlabVolume.toFixed(2)} م³</td><td>${report.concreteData.groundSlabVolume.toFixed(2)} م³</td><td>كمية خرسانة أرضية المبنى</td></tr>` : ''}
                  <tr><td>${((report.concreteData.cleaningVolume || 0) + (report.concreteData.foundationsVolume || 0) + (report.concreteData.groundSlabVolume || 0)).toFixed(2)} م³</td><td>${((report.concreteData.cleaningVolume || 0) + (report.concreteData.foundationsVolume || 0) + (report.concreteData.groundSlabVolume || 0)).toFixed(2)} م³</td><td>إجمالي الخرسانة</td></tr>
                `}
              </tbody>
            </table>
            <div class="total-box">
              <label>المجموع الكلي:</label>
              <div class="value">
                ${report.calculationType === 'column-footings' ? `${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
          : report.calculationType === 'columns' ? `${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
            : report.calculationType === 'roof' ? `${(report.concreteData.totalConcrete || 0).toFixed(2)} م³`
              : report.calculationType === 'ground-bridges' ? `${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
                : report.calculationType === 'ground-slab' ? `${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
                  : `${((report.concreteData.cleaningVolume || 0) + (report.concreteData.foundationsVolume || 0) + (report.concreteData.groundSlabVolume || 0)).toFixed(2)} م³`}
              </div>
            </div>
            <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      if (!printWindow) throw new Error('Could not open print window');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => { setTimeout(() => { if (printWindow) printWindow.print(); }, 500); };
      toast({ title: 'تم فتح التقرير', description: 'تم فتح التقرير للطباعة' });
      setDownloading(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'خطأ في الطباعة', description: 'حدث خطأ أثناء فتح التقرير للطباعة', variant: 'destructive' });
      setDownloading(null);
    }
  };

  const downloadSteelPDF = async (reportId: string) => {
    setDownloading(reportId);
    try {
      const report = reports.find(r => r._id === reportId);
      if (!report) throw new Error('Report not found');

      const type = report.calculationType;
      const results = report.steelData?.details?.results;
      const inputs = report.steelData?.details?.inputs;

      const getTitle = () => {
        switch (type) {
          case 'column-ties-steel': return 'حديد الأعمدة والكانات';
          case 'foundation-steel': return 'حديد القواعد الجزئية';
          case 'ground-beams-steel': return 'حديد الجسور الأرضية';
          case 'ground-slab-steel': return 'حديد المِدّة (الأرضية)';
          case 'roof-ribs-steel': return 'حديد أعصاب السقف';
          case 'roof-slab-steel': return 'حديد السقف';
          default: return 'تقرير حديد التسليح';
        }
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
            .container { max-width: 100%; background: white; }
            .header { background: linear-gradient(135deg, #db2777 0%, #be123c 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
            .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
            .header p { font-size: 20px; opacity: 0.95; font-weight: 500; }
            .project-name { background: #fff1f2; border-right: 6px solid #be123c; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
            .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
            .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
            .info-box { background: white; border: 2px solid #fecdd3; padding: 25px; border-radius: 10px; text-align: center; }
            .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
            .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
            thead { background: linear-gradient(135deg, #db2777, #be123c); color: white; }
            th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
            td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
            tbody tr:nth-child(even) { background: #fff1f2; }
            .total-box { background: linear-gradient(135deg, #fff1f2, #ffe4e6); border: 3px solid #be123c; border-radius: 12px; padding: 30px; margin-bottom: 40px; text-align: center; }
            .total-box label { display: block; font-size: 20px; color: #2d3748; margin-bottom: 12px; font-weight: 600; }
            .total-box .value { font-size: 32px; font-weight: 900; color: #be123c; }
            .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>تقرير حديد التسليح</h1>
              <p>${getTitle()}</p>
            </div>
            <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
            <div class="info-boxes">
              <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
              <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
            </div>
            <table>
              <thead><tr><th>البيان</th><th>القيمة</th></tr></thead>
              <tbody>
                ${type === 'column-ties-steel' ? `
                  <tr><td>عدد القضبان العمودية</td><td>${results?.verticalBarsCount || 0} قضيب</td></tr>
                  <tr><td>قطر قضبان التسليح</td><td>${(inputs?.rodDiameterMm ?? inputs?.reinforcementDiameter ?? inputs?.barDiameter ?? 0)} مم</td></tr>
                  <tr><td>عدد الكانات الإجمالي</td><td>${results?.totalStirrups ? Math.ceil(results.totalStirrups) : 0} كانة</td></tr>
                  <tr><td>أبعاد العمود</td><td>${results?.columnDimensions?.displayText || 'N/A'}</td></tr>
                ` : type === 'foundation-steel' ? `
                  <tr><td>نمط القواعد</td><td>محسوب يدوياً</td></tr>
                  <tr><td>نوع الحديد</td><td>حديد تسليح عالي المقاومة</td></tr>
                ` : (type === 'ground-slab-steel' || type === 'roof-slab-steel') ? `
                  <tr><td>نوع التسليح</td><td>${results?.type === 'mesh' ? 'شبك جاهز' : 'حديد مفرق'}</td></tr>
                  <tr><td>${results?.type === 'mesh' ? 'عدد الشبك' : 'عدد السيخ'}</td><td>${results?.type === 'mesh' ? (results?.meshBars || 0) : (results?.totalBars || 0)}</td></tr>
                ` : type === 'roof-ribs-steel' ? `
                  <tr><td>المساحة المطلوبة للحديد</td><td>${results?.requiredBarArea || 0} سم²</td></tr>
                  <tr><td>عدد القضبان المختارة</td><td>${results?.numberOfBars || 0} قضبان</td></tr>
                  <tr><td>القطر المختار</td><td>${inputs?.selectedDiameter || 0} مم</td></tr>
                ` : `
                  <tr><td>نوع العنصر</td><td>إنشائي</td></tr>
                  <tr><td>تصنيف الحديد</td><td>حديد تسليح</td></tr>
                `}
                <tr><td>تاريخ التقرير</td><td>${formatDate(report.updatedAt)}</td></tr>
              </tbody>
            </table>
            <div class="total-box">
              <label>الوزن الإجمالي للحديد:</label>
              <div class="value">${report.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم</div>
            </div>
            <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
          </div>
        </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Could not open print window');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => { setTimeout(() => { if (printWindow) printWindow.print(); setDownloading(null); }, 500); };
    } catch (e) {
      console.error(e);
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-lg text-slate-600">جاري تحميل التقارير...</p>
        </div>
      </div>
    );
  }

  const foundationReport = reports.find(r => r.calculationType === 'foundation');
  const columnFootingsReport = reports.find(r => r.calculationType === 'column-footings');
  const columnsReport = reports.find(r => r.calculationType === 'columns');
  const roofReport = reports.find(r => r.calculationType === 'roof');
  const groundBridgesReport = reports.find(r => r.calculationType === 'ground-bridges');
  const groundSlabReport = reports.find(r => r.calculationType === 'ground-slab');
  const foundationSteelReport = reports.find(r => r.calculationType === 'foundation-steel');
  const groundBeamsSteelReport = reports.find(r => r.calculationType === 'ground-beams-steel');
  const groundSlabSteelReport = reports.find(r => r.calculationType === 'ground-slab-steel');
  const roofRibsSteelReport = reports.find(r => r.calculationType === 'roof-ribs-steel');
  const roofSlabSteelReport = reports.find(r => r.calculationType === 'roof-slab-steel');
  const columnTiesSteelReport = reports.find(r => r.calculationType === 'column-ties-steel');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl" style={{ fontSize: '16px' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href={`/owner/projects/${projectId}`}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowRight className="w-4 h-4" />
              العودة إلى صفحة المشروع
            </Button>
          </Link>
        </div>

        <Card className="border-0 shadow-xl mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"><Building2 className="w-10 h-10 text-white" /></div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold mb-2">{projectInfo?.name || `مشروع #${projectId.slice(-6)}`}</CardTitle>
                <div className="flex flex-wrap gap-4 text-blue-100">
                  <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>المهندس: {projectInfo?.engineerName}</span></div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {reports.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد تقارير مرسلة لك</h3>
              <p className="text-slate-500 mb-6">لم يتم إرسال أي تقارير كميات لك من المهندس بعد</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {foundationReport && (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div><CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle><CardDescription className="text-emerald-100">صبة النظافة والقواعد</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم صبة النظافة</span><span className="font-bold text-emerald-600">{foundationReport.concreteData.cleaningVolume?.toFixed(3) || 0} م³</span></div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم القواعد</span><span className="font-bold text-emerald-600">{foundationReport.concreteData.foundationsVolume?.toFixed(3) || 0} م³</span></div>
                      {foundationReport.concreteData.groundSlabVolume && foundationReport.concreteData.groundSlabVolume > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم أرضية المبنى</span><span className="font-bold text-emerald-600">{foundationReport.concreteData.groundSlabVolume.toFixed(3)} م³</span></div>
                      )}
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">{((foundationReport.concreteData.cleaningVolume || 0) + (foundationReport.concreteData.foundationsVolume || 0) + (foundationReport.concreteData.groundSlabVolume || 0)).toFixed(3)} م³</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => downloadPDF(foundationReport._id)} disabled={downloading === foundationReport._id} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                        {downloading === foundationReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير
                      </Button>
                      {foundationReport.sentToOwnerAt && <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span>تم الإرسال: {formatDate(foundationReport.sentToOwnerAt)}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              {columnFootingsReport && (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div><CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle><CardDescription className="text-emerald-100">شروش الأعمدة</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم شروش الأعمدة</span><span className="font-bold text-emerald-600">{(columnFootingsReport.concreteData.totalFootingsVolume || columnFootingsReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span></div>
                      {columnFootingsReport.concreteData.numberOfColumns && <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">عدد الأعمدة</span><span className="font-bold text-emerald-600">{columnFootingsReport.concreteData.numberOfColumns}</span></div>}
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">{(columnFootingsReport.concreteData.totalFootingsVolume || columnFootingsReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => downloadPDF(columnFootingsReport._id)} disabled={downloading === columnFootingsReport._id} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                        {downloading === columnFootingsReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير
                      </Button>
                      {columnFootingsReport.sentToOwnerAt && <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span>تم الإرسال: {formatDate(columnFootingsReport.sentToOwnerAt)}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              {columnsReport && (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div><CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle><CardDescription className="text-emerald-100">الأعمدة</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم الأعمدة</span><span className="font-bold text-emerald-600">{(columnsReport.concreteData.columnsVolume || columnsReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span></div>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">{(columnsReport.concreteData.columnsVolume || columnsReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => downloadPDF(columnsReport._id)} disabled={downloading === columnsReport._id} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                        {downloading === columnsReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير
                      </Button>
                      {columnsReport.sentToOwnerAt && <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span>تم الإرسال: {formatDate(columnsReport.sentToOwnerAt)}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              {roofReport && (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div><CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle><CardDescription className="text-emerald-100">السقف</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم السقف</span><span className="font-bold text-emerald-600">{roofReport.concreteData.totalConcrete?.toFixed(3) || 0} م³</span></div>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">{roofReport.concreteData.totalConcrete?.toFixed(3) || 0} م³</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => downloadPDF(roofReport._id)} disabled={downloading === roofReport._id} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                        {downloading === roofReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير
                      </Button>
                      {roofReport.sentToOwnerAt && <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span>تم الإرسال: {formatDate(roofReport.sentToOwnerAt)}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              {groundBridgesReport && (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div><CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle><CardDescription className="text-emerald-100">الجسور الأرضية</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم الجسور الأرضية</span><span className="font-bold text-emerald-600">{(groundBridgesReport.concreteData.totalVolume || groundBridgesReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span></div>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">{(groundBridgesReport.concreteData.totalVolume || groundBridgesReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => downloadPDF(groundBridgesReport._id)} disabled={downloading === groundBridgesReport._id} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                        {downloading === groundBridgesReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير
                      </Button>
                      {groundBridgesReport.sentToOwnerAt && <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span>تم الإرسال: {formatDate(groundBridgesReport.sentToOwnerAt)}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              {groundSlabReport && (
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div><CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle><CardDescription className="text-emerald-100">أرضية المبنى (المِدّة)</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"><span className="text-slate-600">حجم أرضية المبنى</span><span className="font-bold text-emerald-600">{(groundSlabReport.concreteData.groundSlabVolume || groundSlabReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span></div>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">{(groundSlabReport.concreteData.groundSlabVolume || groundSlabReport.concreteData.totalConcrete || 0).toFixed(3)} م³</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={() => downloadPDF(groundSlabReport._id)} disabled={downloading === groundSlabReport._id} className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all">
                        {downloading === groundSlabReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير
                      </Button>
                      {groundSlabReport.sentToOwnerAt && <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /><span>تم الإرسال: {formatDate(groundSlabReport.sentToOwnerAt)}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              )}
              {foundationSteelReport && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Blocks className="w-6 h-6" />
                        تقرير حديد القواعد
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                          <p className="text-sm text-slate-600 mb-1">الوزن الإجمالي</p>
                          <p className="text-xl font-black text-blue-700">
                            {foundationSteelReport.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
                          <p className="text-sm text-slate-600 mb-1">نوع الأساس</p>
                          <p className="text-xl font-black text-indigo-700">
                            قواعد
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => downloadPDF(foundationSteelReport._id)} disabled={downloading === foundationSteelReport._id} className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {downloading === foundationSteelReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير PDF
                    </Button>
                    {foundationSteelReport.sentToOwnerAt && <div className="text-center mt-3 text-sm text-slate-500">تم الإرسال: {formatDate(foundationSteelReport.sentToOwnerAt)}</div>}
                  </CardContent>
                </Card>
              )}

              {groundBeamsSteelReport && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 text-white border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Blocks className="w-6 h-6" />
                        تقرير حديد الجسور الأرضية
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border-2 border-orange-200">
                          <p className="text-sm text-slate-600 mb-1">الوزن الإجمالي</p>
                          <p className="text-xl font-black text-orange-700">
                            {groundBeamsSteelReport.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border-2 border-red-200">
                          <p className="text-sm text-slate-600 mb-1">نوع العنصر</p>
                          <p className="text-xl font-black text-red-700">
                            جسور أرضية
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => downloadPDF(groundBeamsSteelReport._id)} disabled={downloading === groundBeamsSteelReport._id} className="w-full h-14 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 hover:from-orange-700 hover:via-red-700 hover:to-rose-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {downloading === groundBeamsSteelReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير PDF
                    </Button>
                    {groundBeamsSteelReport.sentToOwnerAt && <div className="text-center mt-3 text-sm text-slate-500">تم الإرسال: {formatDate(groundBeamsSteelReport.sentToOwnerAt)}</div>}
                  </CardContent>
                </Card>
              )}

              {groundSlabSteelReport && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Blocks className="w-6 h-6" />
                        تقرير حديد المِدّة (الأرضية)
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      {groundSlabSteelReport.steelData?.details?.results && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200">
                            <p className="text-sm text-slate-600 mb-1">نوع الحساب</p>
                            <p className="text-xl font-black text-orange-700">
                              {groundSlabSteelReport.steelData.details.results.type === 'mesh' ? 'شبك حديد' : 'حديد مفرق'}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                            <p className="text-sm text-slate-600 mb-1">الوزن الإجمالي</p>
                            <p className="text-xl font-black text-blue-700">
                              {groundSlabSteelReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => downloadPDF(groundSlabSteelReport._id)} disabled={downloading === groundSlabSteelReport._id} className="w-full h-14 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {downloading === groundSlabSteelReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير PDF
                    </Button>
                    {groundSlabSteelReport.sentToOwnerAt && <div className="text-center mt-3 text-sm text-slate-500">تم الإرسال: {formatDate(groundSlabSteelReport.sentToOwnerAt)}</div>}
                  </CardContent>
                </Card>
              )}

              {roofRibsSteelReport && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Blocks className="w-6 h-6" />
                        تقرير حديد أعصاب السقف
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-purple-200">
                          <p className="text-sm text-slate-600 mb-1">الوزن الإجمالي</p>
                          <p className="text-xl font-black text-purple-700">
                            {roofRibsSteelReport.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-pink-50 p-4 rounded-xl border-2 border-indigo-200">
                          <p className="text-sm text-slate-600 mb-1">عدد القضبان</p>
                          <p className="text-xl font-black text-indigo-700">
                            {roofRibsSteelReport.steelData?.details?.results?.numberOfBars || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => downloadPDF(roofRibsSteelReport._id)} disabled={downloading === roofRibsSteelReport._id} className="w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {downloading === roofRibsSteelReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير PDF
                    </Button>
                    {roofRibsSteelReport.sentToOwnerAt && <div className="text-center mt-3 text-sm text-slate-500">تم الإرسال: {formatDate(roofRibsSteelReport.sentToOwnerAt)}</div>}
                  </CardContent>
                </Card>
              )}

              {roofSlabSteelReport && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white border-b border-white/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <Blocks className="w-6 h-6" />
                        تقرير حديد السقف
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      {roofSlabSteelReport.steelData?.details?.results && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl border-2 border-red-200">
                            <p className="text-sm text-slate-600 mb-1">نوع التسليح</p>
                            <p className="text-xl font-black text-red-700">
                              {roofSlabSteelReport.steelData.details.results.type === 'mesh' ? 'شبك حديد' : 'حديد مفرق'}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-200">
                            <p className="text-sm text-slate-600 mb-1">الوزن الإجمالي</p>
                            <p className="text-xl font-black text-amber-700">
                              {roofSlabSteelReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => downloadPDF(roofSlabSteelReport._id)} disabled={downloading === roofSlabSteelReport._id} className="w-full h-14 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:via-orange-700 hover:to-amber-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {downloading === roofSlabSteelReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير PDF
                    </Button>
                    {roofSlabSteelReport.sentToOwnerAt && <div className="text-center mt-3 text-sm text-slate-500">تم الإرسال: {formatDate(roofSlabSteelReport.sentToOwnerAt)}</div>}
                  </CardContent>
                </Card>
              )}

              {columnTiesSteelReport && (
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white border-b border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Blocks className="w-7 h-7 text-white" /></div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          تقرير حديد الأعمدة والكانات
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {columnTiesSteelReport.steelData?.details?.results && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-200">
                          <p className="text-sm text-slate-600 mb-1">عدد القضبان</p>
                          <p className="text-xl font-black text-pink-700">
                            {columnTiesSteelReport.steelData.details.results.verticalBarsCount || 0}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                          <p className="text-sm text-slate-600 mb-1">الوزن</p>
                          <p className="text-xl font-black text-blue-700">
                            {columnTiesSteelReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                          </p>
                        </div>
                      </div>
                    )}
                    <Button onClick={() => downloadPDF(columnTiesSteelReport._id)} disabled={downloading === columnTiesSteelReport._id} className="w-full h-14 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 hover:from-pink-700 hover:via-rose-700 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all">
                      {downloading === columnTiesSteelReport._id ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <Printer className="w-5 h-5 ml-2" />}طباعة التقرير PDF
                    </Button>
                    {columnTiesSteelReport.sentToOwnerAt && <div className="text-center mt-3 text-sm text-slate-500">تم الإرسال: {formatDate(columnTiesSteelReport.sentToOwnerAt)}</div>}
                  </CardContent>
                </Card>
              )}
            </div>

            {reports.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="flex items-center gap-3"><FileText className="w-5 h-5 text-slate-600" />سجل التقارير</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <div>
                            <p className="font-medium text-slate-800">
                              تقرير {report.calculationType === 'foundation' ? 'القواعد وصبة النظافة' :
                                report.calculationType === 'column-footings' ? 'شروش الأعمدة' :
                                  report.calculationType === 'columns' ? 'الأعمدة' :
                                    report.calculationType === 'roof' ? 'السقف' :
                                      report.calculationType === 'ground-bridges' ? 'الجسور الأرضية' :
                                        report.calculationType === 'ground-slab' ? 'أرضية المبنى (المِدّة)' :
                                          report.calculationType === 'column-ties-steel' ? 'حديد الأعمدة والكانات' :
                                            report.calculationType === 'foundation-steel' ? 'حديد القواعد' :
                                              report.calculationType === 'ground-beams-steel' ? 'حديد الجسور الأرضية' :
                                                report.calculationType === 'ground-slab-steel' ? 'حديد المِدّة (الأرضية)' :
                                                  report.calculationType === 'roof-ribs-steel' ? 'حديد أعصاب السقف' :
                                                    report.calculationType === 'roof-slab-steel' ? 'حديد السقف' :
                                                      report.calculationType}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-3 h-3" />{formatDate(report.sentToOwnerAt || report.updatedAt)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {(() => {
                            if (report.calculationType === 'column-footings') return (report.concreteData?.totalFootingsVolume || report.concreteData?.totalConcrete || 0).toFixed(2);
                            if (report.calculationType === 'columns') return (report.concreteData?.columnsVolume || report.concreteData?.totalConcrete || 0).toFixed(2);
                            if (report.calculationType === 'roof') return (report.concreteData?.totalConcrete || 0).toFixed(2);
                            if (report.calculationType === 'ground-bridges') return (report.concreteData?.totalVolume || report.concreteData?.totalConcrete || 0).toFixed(2);
                            if (report.calculationType === 'ground-slab') return (report.concreteData?.groundSlabVolume || report.concreteData?.totalConcrete || 0).toFixed(2);
                            if (report.calculationType.includes('steel')) return (report.steelData?.totalSteelWeight || 0).toFixed(2);
                            return (((report.concreteData?.cleaningVolume || 0) + (report.concreteData?.foundationsVolume || 0) + (report.concreteData?.groundSlabVolume || 0)).toFixed(2));
                          })()} {report.calculationType.includes('steel') ? 'كجم' : 'م³'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
