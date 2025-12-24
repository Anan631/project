"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Grid3X3,
  List,
  Calculator,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
    totalSteelWeight?: number;
    details?: {
      results?: any;
      inputs?: any;
      [key: string]: any;
    };
    [key: string]: any;
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
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

      const response = await fetch(`http://localhost:5000/api/quantity-reports/owner/${encodeURIComponent(userEmail)}/project/${projectId}`);
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
    setDownloading(reportId);
    try {
      const report = reports.find(r => r._id === reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Check if this is a foundation-steel report
      if (report.calculationType === 'foundation-steel') {
        const steelData = report.steelData?.details;
        const results = steelData?.results;
        const inputs = steelData?.inputs;

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #f0fdf4, #dcfce7); border-right: 6px solid #059669; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #d1fae5; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #059669, #10b981); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #f0fdf4; }
              .section-title { background: #f0fdf4; border-right: 4px solid #059669; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #065f46; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد القواعد</h1>
                <p>حساب كميات حديد القواعد وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>
              <div class="info-boxes">
                <div class="info-box"><label>نوع الحساب</label><div class="value">${results?.type === 'similar' ? 'قواعد متشابهة' : 'قواعد مختلفة'}</div></div>
                <div class="info-box"><label>قطر القضيب</label><div class="value">${inputs?.barDiameter || 'N/A'} ملم</div></div>
              </div>
              ${results?.type === 'similar' ? `
                <div class="section-title">معلومات القواعد</div>
                <table><thead><tr><th>القيمة</th><th>البيان</th></tr></thead><tbody>
                  <tr><td>${results.numberOfFoundations || 0}</td><td>عدد القواعد</td></tr>
                  <tr><td>${results.foundationLength || 0} متر</td><td>طول القاعدة</td></tr>
                  <tr><td>${results.foundationWidth || 0} متر</td><td>عرض القاعدة</td></tr>
                  <tr><td>${inputs?.uSteelSpacing || 0} متر</td><td>المسافة بين حديد U</td></tr>
                </tbody></table>
                <div class="section-title">نتائج حديد U</div>
                <table><thead><tr><th>القيمة</th><th>البيان</th></tr></thead><tbody>
                  <tr><td>${results.uSteelCount || 0} قطعة</td><td>عدد قطع حديد U</td></tr>
                  <tr><td>${results.bendLength?.toFixed(2) || 0} متر</td><td>طول الثنية</td></tr>
                  <tr><td>${results.seaLength?.toFixed(2) || 0} متر</td><td>طول البحر</td></tr>
                  <tr style="background: #d1fae5; font-weight: bold;"><td>${results.totalUSteelLength?.toFixed(2) || 0} متر</td><td>الطول الكلي لحديد U</td></tr>
                </tbody></table>
                <div class="section-title">التسليح العلوي والسفلي</div>
                <table><thead><tr><th>طول القضيب (م)</th><th>عدد القضبان</th><th>نوع التسليح</th></tr></thead><tbody>
                  ${results.reinforcement?.map((row: any) => `<tr><td>${row.barLength?.toFixed(2) || 0}</td><td>${row.numberOfBars || 0}</td><td>${row.type || ''}</td></tr>`).join('') || ''}
                </tbody></table>
              ` : `
                <div class="section-title">نتائج القواعد المختلفة</div>
                ${results?.foundations?.map((foundation: any) => `
                  <div style="margin-bottom: 30px;">
                    <h3 style="background: #f0fdf4; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;">قاعدة ${foundation.id}</h3>
                    <table><thead><tr><th>القيمة</th><th>البيان</th></tr></thead><tbody>
                      <tr><td>${foundation.foundationLength || 0} متر</td><td>الطول</td></tr>
                      <tr><td>${foundation.foundationWidth || 0} متر</td><td>العرض</td></tr>
                      <tr><td>${foundation.uSteelCount || 0} قطعة</td><td>عدد قطع حديد U</td></tr>
                      <tr><td>${foundation.totalUSteelLength?.toFixed(2) || 0} متر</td><td>الطول الكلي لحديد U</td></tr>
                    </tbody></table>
                    
                    <div class="section-title" style="margin-top: 20px; font-size: 18px;">التسليح العلوي والسفلي</div>
                    <table><thead><tr><th>طول القضيب (م)</th><th>عدد القضبان</th><th>نوع التسليح</th></tr></thead><tbody>
                      ${foundation.reinforcement?.map((row: any) => `<tr><td>${row.barLength?.toFixed(2) || 0}</td><td>${row.numberOfBars || 0}</td><td>${row.type || ''}</td></tr>`).join('') || ''}
                    </tbody></table>
                  </div>
                `).join('') || ''}
              `}
              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد القواعد للطباعة' });
        setDownloading(null);
        return;
      }

      // Check if this is a ground-beams-steel report
      if (report.calculationType === 'ground-beams-steel') {
        const steelData = report.steelData?.details;
        const results = steelData?.results;

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #fff7ed, #ffedd5); border-right: 6px solid #ea580c; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #fdba74; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #ea580c, #c2410c); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #fff7ed; }
              .section-title { background: #fff7ed; border-right: 4px solid #ea580c; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #9a3412; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد الجسور الأرضية</h1>
                <p>حساب كميات حديد الجسور الأرضية وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>
              <div class="info-boxes">
                <div class="info-box"><label>نوع الحساب</label><div class="value">${results?.type === 'similar' ? 'جسور متشابهة' : 'جسور مختلفة'}</div></div>
                <div class="info-box"><label>إجمالي الحديد</label><div class="value">${report.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم</div></div>
              </div>
              
              ${results?.type === 'similar' ? `
                <div class="section-title">معلومات الجسور</div>
                <table><thead><tr><th>القيمة</th><th>البيان</th></tr></thead><tbody>
                  <tr><td>${results.numberOfBeams || 0}</td><td>عدد الجسور</td></tr>
                  <tr><td>${results.beamLength || 0} متر</td><td>طول الجسر</td></tr>
                  <tr><td>${results.mainBottomBars || 0}</td><td>عدد القضبان السفلية الرئيسية</td></tr>
                  <tr><td>${results.mainTopBars || 0}</td><td>عدد القضبان العلوية الرئيسية</td></tr>
                </tbody></table>
                <div class="section-title">تفاصيل التسليح</div>
                 <table><thead><tr><th>القطر (ملم)</th><th>العدد</th><th>الطول (متر)</th><th>الوزن (كجم)</th><th>النوع</th></tr></thead><tbody>
                  ${results?.mainBars?.map((bar: any) => `
                    <tr>
                      <td>${bar.diameter}</td>
                      <td>${bar.count}</td>
                      <td>${bar.length}</td>
                      <td>${bar.weight?.toFixed(2)}</td>
                      <td>${bar.name}</td>
                    </tr>
                  `).join('') || ''}
                  ${results?.stirrups?.map((stirrup: any) => `
                    <tr>
                      <td>${stirrup.diameter}</td>
                      <td>${stirrup.count}</td>
                      <td>${stirrup.length?.toFixed(2)}</td>
                      <td>${stirrup.weight?.toFixed(2)}</td>
                      <td>كانات</td>
                    </tr>
                  `).join('') || ''}
                </tbody></table>
              ` : `
                <div class="section-title">نتائج الجسور المختلفة</div>
                ${results?.beams?.map((beam: any) => `
                  <div style="margin-bottom: 30px;">
                    <h3 style="background: #fff7ed; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;">جسر ${beam.name}</h3>
                    <table><thead><tr><th>القيمة</th><th>البيان</th></tr></thead><tbody>
                      <tr><td>${beam.length || 0} متر</td><td>الطول</td></tr>
                      <tr><td>${beam.mainTopBars || 0}</td><td>عدد قضبان علوي</td></tr>
                      <tr><td>${beam.mainBottomBars || 0}</td><td>عدد قضبان سفلي</td></tr>
                      <tr><td>${beam.subTotalWeight?.toFixed(2) || 0} كجم</td><td>وزن الحديد</td></tr>
                    </tbody></table>
                  </div>
                `).join('') || ''}
              `}

              <div class="total-box" style="background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 3px solid #f97316; border-radius: 12px; padding: 30px; margin-bottom: 40px; text-align: center; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);">
                <label style="display: block; font-size: 20px; color: #2d3748; margin-bottom: 12px; font-weight: 600;">إجمالي وزن الحديد:</label>
                <div class="value" style="font-size: 32px; font-weight: 900; color: #ea580c;">${report.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم</div>
              </div>

              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد الجسور الأرضية للطباعة' });
        setDownloading(null);
        return;
      }

      // Check if this is a ground-slab-steel report
      if (report.calculationType === 'ground-slab-steel') {
        const steelData = report.steelData?.details;
        const results = steelData?.results;
        const inputs = steelData?.inputs;

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #fff7ed, #ffedd5); border-right: 6px solid #ea580c; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #fdba74; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #ea580c, #c2410c); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #fff7ed; }
              .section-title { background: #fff7ed; border-right: 4px solid #ea580c; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #9a3412; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد أرضية المبنى</h1>
                <p>حساب كميات حديد أرضية المبنى وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>
              <div class="info-boxes">
                <div class="info-box"><label>نوع الحساب</label><div class="value">${results?.type === 'mesh' ? 'شبك حديد' : 'حديد مفرق'}</div></div>
                <div class="info-box"><label>الكمية الإجمالية</label><div class="value">${results?.type === 'mesh' ? (results.meshBars + ' شبكة') : (results.totalBars + ' قضيب')}</div></div>
              </div>
              
              ${results?.type === 'mesh' ? `
                 <div class="section-title">بيانات شبك الحديد</div>
                 <table>
                   <thead>
                     <tr>
                       <th>القيمة</th>
                       <th>البيان</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td>${results.details?.slabArea || 0} م²</td>
                       <td>مساحة الأرضية</td>
                     </tr>
                     <tr>
                       <td>${results.details?.meshArea?.toFixed(2) || 0} م²</td>
                       <td>مساحة الشبك الواحد (بعد الخصم)</td>
                     </tr>
                     <tr>
                       <td>${inputs?.meshLength || 0} * ${inputs?.meshWidth || 0} متر</td>
                       <td>أبعاد الشبك</td>
                     </tr>
                   </tbody>
                 </table>

                 <div class="section-title">النتائج</div>
                 <table>
                     <thead>
                         <tr>
                             <th>القيمة</th>
                             <th>البيان</th>
                         </tr>
                     </thead>
                     <tbody>
                          <tr style="background: #fff7ed; font-weight: bold; color: #ea580c;">
                             <td>${results.meshBars || 0} شبكة</td>
                             <td>عدد قطع الشبك المطلوبة</td>
                         </tr>
                     </tbody>
                 </table>
              ` : `
                 <div class="section-title">بيانات الحديد المفرق</div>
                 <table>
                   <thead>
                     <tr>
                       <th>القيمة</th>
                       <th>البيان</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td>${results.details?.floorArea || 0} م²</td>
                       <td>مساحة الأرضية</td>
                     </tr>
                     <tr>
                       <td>${inputs?.barLength || 0} متر</td>
                       <td>طول القضيب</td>
                     </tr>
                      <tr>
                       <td>${inputs?.spacing || 0} متر</td>
                       <td>المسافة بين القضبان</td>
                     </tr>
                   </tbody>
                 </table>

                 <div class="section-title">تفاصيل القضبان</div>
                 <table>
                     <thead>
                         <tr>
                             <th>الكمية</th>
                             <th>البيان</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr>
                             <td>${results.longitudinalBars || 0} قضيب</td>
                             <td>عدد القضبان الطولية</td>
                         </tr>
                         <tr>
                             <td>${results.transverseBars || 0} قضيب</td>
                             <td>عدد القضبان العرضية</td>
                         </tr>
                          <tr style="background: #fff7ed; font-weight: bold; color: #ea580c;">
                             <td>${results.totalBars || 0} قضيب</td>
                             <td>المجموع الكلي للقضبان</td>
                         </tr>
                     </tbody>
                 </table>
              `}

              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد أرضية المبنى للطباعة' });
        setDownloading(null);
        return;
      }

      // Check if this is a roof-ribs-steel report
      if (report.calculationType === 'roof-ribs-steel') {
        const steelData = report.steelData?.details;
        const results = steelData?.results;
        const inputs = steelData?.inputs || {};

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #faf5ff, #f3e8ff); border-right: 6px solid #7c3aed; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #d8b4fe; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #faf5ff; }
              .section-title { background: #faf5ff; border-right: 4px solid #7c3aed; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #6b21a8; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد أعصاب السقف</h1>
                <p>حساب كميات حديد أعصاب السقف وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>

               <div class="section-title">بيانات المدخلات (أعصاب السقف)</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${inputs.barDiameter || 0} ملم</td>
                      <td>قطر القضيب</td>
                    </tr>
                    <tr>
                      <td>${inputs.beamLength || 0} م</td>
                      <td>طول الجسر</td>
                    </tr>
                    <tr>
                      <td>${inputs.effectiveDepth || 0} سم</td>
                      <td>العمق الفعال d</td>
                    </tr>
                    <tr>
                      <td>${inputs.ribSpacing || 0} سم</td>
                      <td>المسافة بين الأعصاب</td>
                    </tr>
                    <tr>
                      <td>${inputs.numberOfRibs || 0}</td>
                      <td>عدد الأعصاب</td>
                    </tr>
                    <tr>
                      <td>${inputs.buildingType || 'غير محدد'}</td>
                      <td>نوع المبنى/المنشأة</td>
                    </tr>
                  </tbody>
                </table>

                <div class="section-title">نتائج الحساب (أعصاب السقف)</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${Number(results.totalLoad || 0).toFixed(3)} kN/m</td>
                      <td>الحمل الموزع الكلي</td>
                    </tr>
                    <tr>
                      <td>${Number(results.moment || 0).toFixed(3)} kN.m</td>
                      <td>العزم M</td>
                    </tr>
                    <tr>
                      <td>${Number(results.requiredBarArea || 0).toFixed(3)} سم²</td>
                      <td>مساحة الحديد المطلوبة As</td>
                    </tr>
                    <tr style="background: #f3e8ff; font-weight: bold; color: #7c3aed;">
                      <td>${results.numberOfBars || 0} قضيب</td>
                      <td>عدد القضبان المطلوبة</td>
                    </tr>
                  </tbody>
                </table>

              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد أعصاب السقف للطباعة' });
        setDownloading(null);
        return;
      }

      // Check if this is a roof-slab-steel report
      if (report.calculationType === 'roof-slab-steel') {
        const steelData = report.steelData?.details;
        const results = steelData?.results;

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #fff1f2, #fff7ed); border-right: 6px solid #dc2626; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #fecaca; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #dc2626, #ea580c); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #fff1f2; }
              .section-title { background: #fff1f2; border-right: 4px solid #dc2626; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #991b1b; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد السقف</h1>
                <p>حساب كميات حديد السقف وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>

               <div class="info-boxes">
                <div class="info-box"><label>نوع التسليح</label><div class="value">${results?.type === 'mesh' ? 'شبك حديد' : 'حديد مفرق'}</div></div>
                <div class="info-box"><label>تاريخ الاستلام</label><div class="value">${report.sentToOwnerAt ? new Date(report.sentToOwnerAt).toLocaleDateString('ar-EG') : 'N/A'}</div></div>
              </div>

               ${results?.type === 'mesh' ? `
                 <div class="section-title">بيانات شبك الحديد</div>
                 <table>
                   <thead>
                     <tr>
                       <th>القيمة</th>
                       <th>البيان</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td>${results.details?.roofArea || 0} م²</td>
                       <td>مساحة السقف</td>
                     </tr>
                     <tr>
                       <td>${results.details?.meshArea?.toFixed(2) || 0} م²</td>
                       <td>مساحة الشبك الواحد (بعد الخصم)</td>
                     </tr>
                   </tbody>
                 </table>

                 <div class="section-title">النتائج</div>
                 <table>
                     <thead>
                         <tr>
                             <th>القيمة</th>
                             <th>البيان</th>
                         </tr>
                     </thead>
                     <tbody>
                          <tr style="background: #fff1f2; font-weight: bold; color: #dc2626;">
                             <td>${results.meshBars || 0} شبكة</td>
                             <td>عدد قطع الشبك المطلوبة</td>
                         </tr>
                     </tbody>
                 </table>
               ` : `
                 <div class="section-title">بيانات الحديد المفرق</div>
                 <table>
                   <thead>
                     <tr>
                       <th>القيمة</th>
                       <th>البيان</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr>
                       <td>${results.details?.roofArea || 0} م²</td>
                       <td>مساحة السقف</td>
                     </tr>
                      <tr>
                       <td>${results.details?.spacing || 0} م</td>
                       <td>المسافة بين القضبان</td>
                     </tr>
                   </tbody>
                 </table>

                 <div class="section-title">النتائج</div>
                 <table>
                     <thead>
                         <tr>
                             <th>القيمة</th>
                             <th>البيان</th>
                         </tr>
                     </thead>
                     <tbody>
                          <tr style="background: #fff1f2; font-weight: bold; color: #dc2626;">
                             <td>${results.separateBars || 0} قضيب</td>
                             <td>عدد القضبان المطلوبة</td>
                         </tr>
                     </tbody>
                 </table>
               `}

              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد السقف للطباعة' });
        setDownloading(null);
        return;
      }

      // Check if this is a column-ties-steel report
      if (report.calculationType === 'column-ties-steel') {
        const steelData = report.steelData?.details;
        const results = steelData?.results;
        const inputs = steelData?.inputs;

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #fff7ed, #ffedd5); border-right: 6px solid #ea580c; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #fdba74; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #ea580c, #c2410c); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #fff7ed; }
              .section-title { background: #fff7ed; border-right: 4px solid #ea580c; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #9a3412; }
              .total-box { background: linear-gradient(135deg, #ffedd5, #fed7aa); border: 3px solid #ea580c; border-radius: 12px; padding: 30px; margin-bottom: 40px; text-align: center; }
              .total-box label { display: block; font-size: 20px; color: #2d3748; margin-bottom: 12px; font-weight: 600; }
              .total-box .value { font-size: 32px; font-weight: 900; color: #ea580c; }
              .signature-section { margin-top: 60px; padding: 30px; border: 2px solid #e2e8f0; border-radius: 15px; background: #fafafa; }
              .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
              .signature-box { text-align: center; }
              .signature-line { border-bottom: 2px solid #2d3748; margin-bottom: 15px; height: 40px; }
              .signature-title { font-weight: 800; font-size: 20px; color: #2d3748; margin-bottom: 5px; }
              .signature-name { font-size: 18px; color: #4a5568; margin-bottom: 5px; }
              .signature-label { font-size: 14px; color: #718096; font-style: italic; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد الأعمدة والكانات</h1>
                <p>حساب كميات حديد الأعمدة والكانات وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>

              <div class="section-title">بيانات العمود والمدخلات</div>
              <table>
                <thead><tr><th>القيمة</th><th>البيان</th></tr></thead>
                <tbody>
                  <tr><td>${inputs.heightM || 0} م</td><td>ارتفاع العمود</td></tr>
                  <tr><td>${inputs.slabAreaM2 || 0} م²</td><td>مساحة البلاطة</td></tr>
                  <tr><td>${inputs.floors || 0}</td><td>عدد الطوابق</td></tr>
                  <tr><td>${inputs.rodDiameterMm || 0} ملم</td><td>قطر القضيب</td></tr>
                  <tr><td>${inputs.slabThicknessCm || 0} سم</td><td>سمك السقف</td></tr>
                  <tr><td>${inputs.columnShape === 'square' ? 'مربع' : inputs.columnShape === 'rectangle' ? 'مستطيل' : 'دائري'}</td><td>شكل العمود</td></tr>
                </tbody>
              </table>

              <div class="section-title">نتائج الحساب (الأعمدة والكانات)</div>
              <table>
                <thead><tr><th>القيمة</th><th>البيان</th></tr></thead>
                <tbody>
                  <tr><td>${results.verticalBarsCount || 0} قضيب</td><td>عدد القضبان العمودية</td></tr>
                  <tr><td>${results.finalRodLenM?.toFixed(2) || 0} م</td><td>طول القضيب العمودي النهائي</td></tr>
                  <tr><td>${results.totalStirrups ? Math.ceil(results.totalStirrups) : 0} كانة</td><td>عدد الكانات الإجمالي</td></tr>
                  <tr><td>${results.columnDimensions?.displayText || 'N/A'}</td><td>أبعاد العمود</td></tr>
                </tbody>
              </table>

              <div class="total-box">
                <label>إجمالي وزن الحديد للعمود:</label>
                <div class="value">${report.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم</div>
              </div>

              <div class="signature-section">
                <div class="signature-row">
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">المهندس المسؤول</div>
                    <div class="signature-name">${report.engineerName}</div>
                    <div class="signature-label">التوقيع</div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">المالك / العميل</div>
                    <div class="signature-name">${report.ownerName || 'غير محدد'}</div>
                    <div class="signature-label">التوقيع</div>
                  </div>
                </div>
              </div>

              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد الأعمدة والكانات للطباعة' });
        setDownloading(null);
        return;
      }

      // Check if this is a steel-column-base report
      if (report.calculationType === 'steel-column-base') {
        const steelData = report.steelData?.details;

        const steelHtmlContent = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { direction: rtl; font-family: 'Tajawal', sans-serif; font-size: 18px; line-height: 1.8; color: #1a1a1a; background: white; padding: 25mm; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 40px 30px; border-radius: 12px; margin-bottom: 40px; text-align: center; }
              .header h1 { font-size: 36px; margin-bottom: 10px; font-weight: 900; }
              .header p { font-size: 20px; opacity: 0.95; }
              .project-name { background: linear-gradient(to right, #f8f9ff, #e8ecff); border-right: 6px solid #2563eb; padding: 25px 30px; margin-bottom: 30px; border-radius: 8px; }
              .project-name h2 { color: #2d3748; font-size: 24px; font-weight: 700; }
              .info-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
              .info-box { background: white; border: 2px solid #e2e8f0; padding: 25px; border-radius: 10px; text-align: center; }
              .info-box label { display: block; font-size: 16px; color: #718096; margin-bottom: 8px; font-weight: 500; }
              .info-box .value { font-size: 20px; color: #2d3748; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); border-radius: 10px; overflow: hidden; }
              thead { background: linear-gradient(135deg, #2563eb, #1e40af); color: white; }
              th { padding: 20px 15px; text-align: right; font-weight: 700; font-size: 20px; }
              td { padding: 18px 15px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 18px; font-weight: 500; }
              tbody tr:nth-child(even) { background: #f8f9ff; }
              .section-title { background: #f8f9ff; border-right: 4px solid #2563eb; padding: 15px 20px; margin: 30px 0 20px 0; font-size: 22px; font-weight: 700; color: #1e40af; }
              .total-box { background: linear-gradient(135deg, #f0f4ff, #e0e7ff); border: 3px solid #2563eb; border-radius: 12px; padding: 30px; margin-bottom: 40px; text-align: center; }
              .total-box label { display: block; font-size: 20px; color: #2d3748; margin-bottom: 12px; font-weight: 600; }
              .total-box .value { font-size: 32px; font-weight: 900; color: #2563eb; }
              .signature-section { margin-top: 60px; padding: 30px; border: 2px solid #e2e8f0; border-radius: 15px; background: #fafafa; }
              .signature-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
              .signature-box { text-align: center; }
              .signature-line { border-bottom: 2px solid #2d3748; margin-bottom: 15px; height: 40px; }
              .signature-title { font-weight: 800; font-size: 20px; color: #2d3748; margin-bottom: 5px; }
              .signature-name { font-size: 18px; color: #4a5568; margin-bottom: 5px; }
              .signature-label { font-size: 14px; color: #718096; font-style: italic; }
              .footer { border-top: 2px solid #e2e8f0; padding-top: 25px; text-align: center; font-size: 14px; color: #718096; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>تقرير حديد شروش الأعمدة</h1>
                <p>حساب كميات حديد شروش الأعمدة وفق المعايير الهندسية</p>
              </div>
              <div class="project-name"><h2>المشروع: ${report.projectName}</h2></div>
              <div class="info-boxes">
                <div class="info-box"><label>المهندس المسؤول</label><div class="value">${report.engineerName}</div></div>
                <div class="info-box"><label>المالك / العميل</label><div class="value">${report.ownerName || 'غير محدد'}</div></div>
              </div>

              <div class="section-title">بيانات شروش الأعمدة</div>
              <table>
                <thead><tr><th>القيمة</th><th>البيان</th></tr></thead>
                <tbody>
                  <tr><td>${steelData?.starterLength?.toFixed(2) || 0} م</td><td>طول الشرش</td></tr>
                  <tr><td>${steelData?.numBars || 0}</td><td>عدد القضبان</td></tr>
                  <tr><td>${steelData?.rodDiameter || steelData?.barDiameter || 'N/A'} ملم</td><td>قطر القضيب</td></tr>
                  <tr><td>${steelData?.dimensionText || 'غير محدد'}</td><td>أبعاد الشرش</td></tr>
                </tbody>
              </table>

              <div class="total-box">
                <label>إجمالي وزن الحديد:</label>
                <div class="value">${report.steelData?.totalSteelWeight?.toFixed(2) || 0} كجم</div>
              </div>

              <div class="signature-section">
                <div class="signature-row">
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">المهندس المسؤول</div>
                    <div class="signature-name">${report.engineerName}</div>
                    <div class="signature-label">التوقيع</div>
                  </div>
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <div class="signature-title">المالك / العميل</div>
                    <div class="signature-name">${report.ownerName || 'غير محدد'}</div>
                    <div class="signature-label">التوقيع</div>
                  </div>
                </div>
              </div>

              <div class="footer"><p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p><p>© 2025 جميع الحقوق محفوظة</p></div>
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) throw new Error('Could not open print window');
        printWindow.document.write(steelHtmlContent);
        printWindow.document.close();
        printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
        toast({ title: 'تم فتح التقرير', description: 'تم فتح تقرير حديد شروش الأعمدة للطباعة' });
        setDownloading(null);
        return;
      }




      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              direction: rtl;
              font-family: 'Tajawal', sans-serif;
              font-size: 18px;
              line-height: 1.8;
              color: #1a1a1a;
              background: white;
              padding: 25mm;
            }
            
            .container {
              max-width: 100%;
              background: white;
            }
            
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              color: white;
              padding: 40px 30px;
              border-radius: 12px;
              margin-bottom: 40px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
            }
            
            .header h1 {
              font-size: 36px;
              margin-bottom: 10px;
              font-weight: 900;
              letter-spacing: 1px;
            }
            
            .header p {
              font-size: 20px;
              opacity: 0.95;
              font-weight: 500;
            }
            
            .project-name {
              background: linear-gradient(to right, #f8f9ff, #e8ecff);
              border-right: 6px solid #2563eb;
              padding: 25px 30px;
              margin-bottom: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            }
            
            .project-name h2 {
              color: #2d3748;
              font-size: 24px;
              font-weight: 700;
            }
            
            .info-boxes {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              margin-bottom: 40px;
            }
            
            .info-box {
              background: linear-gradient(135deg, #ffffff, #f7fafc);
              border: 2px solid #e2e8f0;
              padding: 25px;
              border-radius: 10px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            }
            
            .info-box label {
              display: block;
              font-size: 16px;
              color: #718096;
              margin-bottom: 8px;
              font-weight: 500;
            }
            
            .info-box .value {
              font-size: 20px;
              color: #2d3748;
              font-weight: 700;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
              border-radius: 10px;
              overflow: hidden;
            }
            
            thead {
              background: linear-gradient(135deg, #2563eb, #1e40af);
              color: white;
            }
            
            th {
              padding: 20px 15px;
              text-align: right;
              font-weight: 700;
              font-size: 20px;
            }
            
            td {
              padding: 18px 15px;
              text-align: right;
              border-bottom: 1px solid #e2e8f0;
              font-size: 18px;
              font-weight: 500;
            }
            
            tbody tr:nth-child(even) {
              background: #f8f9ff;
            }
            
            tbody tr:last-child {
              font-weight: 900;
              color: #2563eb;
              background: linear-gradient(to right, #f0f4ff, #e8ecff);
              font-size: 20px;
            }
            
            .total-box {
              background: linear-gradient(135deg, #d4f4dd, #bbf7d0);
              border: 3px solid #22c55e;
              border-radius: 12px;
              padding: 30px;
              margin-bottom: 40px;
              text-align: center;
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            .total-box label {
              display: block;
              font-size: 20px;
              color: #2d3748;
              margin-bottom: 12px;
              font-weight: 600;
            }
            
            .total-box .value {
              font-size: 32px;
              font-weight: 900;
              color: #16a34a;
            }
            
            .footer {
              border-top: 2px solid #e2e8f0;
              padding-top: 25px;
              text-align: center;
              font-size: 14px;
              color: #718096;
              margin-top: 50px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>تقرير كميات الخرسانة</h1>
              <p>${report.calculationType === 'column-footings' ? 'شروش الأعمدة' : report.calculationType === 'columns' ? 'الأعمدة' : report.calculationType === 'roof' ? 'السقف' : report.calculationType === 'foundation' ? 'صبة النظافة والقواعد' : report.calculationType === 'ground-bridges' ? 'الجسور الأرضية' : report.calculationType === 'ground-slab' ? 'أرضية المبنى (المِدّة)' : 'تفصيل شامل'}</p>
            </div>

            <div class="project-name">
              <h2>المشروع: ${report.projectName}</h2>
            </div>

            <div class="info-boxes">
              <div class="info-box">
                <label>المهندس المسؤول</label>
                <div class="value">${report.engineerName}</div>
              </div>
              <div class="info-box">
                <label>المالك / العميل</label>
                <div class="value">${report.ownerName || 'غير محدد'}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>الإجمالي</th>
                  <th>الكمية</th>
                  <th>البند</th>
                </tr>
              </thead>
              <tbody>
                ${report.calculationType === 'column-footings'
          ? `
                      <tr>
                        <td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>كمية خرسانة شروش الأعمدة</td>
                      </tr>
                      <tr>
                        <td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
          : report.calculationType === 'columns'
            ? `
                      <tr>
                        <td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>كمية خرسانة الأعمدة</td>
                      </tr>
                      <tr>
                        <td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
            : report.calculationType === 'roof'
              ? `
                      <tr>
                        <td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>كمية خرسانة السقف</td>
                      </tr>
                      <tr>
                        <td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
              : report.calculationType === 'ground-bridges'
                ? `
                      <tr>
                        <td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>كمية خرسانة الجسور الأرضية</td>
                      </tr>
                      <tr>
                        <td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
                : report.calculationType === 'ground-slab'
                  ? `
                      <tr>
                        <td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>كمية خرسانة أرضية المبنى (المِدّة)</td>
                      </tr>
                      <tr>
                        <td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
                  : `
                      <tr>
                        <td>${report.concreteData.cleaningVolume?.toFixed(2) || 0} م³</td>
                        <td>${report.concreteData.cleaningVolume?.toFixed(2) || 0} م³</td>
                        <td>كمية خرسانة النظافة</td>
                      </tr>
                      <tr>
                        <td>${report.concreteData.foundationsVolume?.toFixed(2) || 0} م³</td>
                        <td>${report.concreteData.foundationsVolume?.toFixed(2) || 0} م³</td>
                        <td>كمية خرسانة القواعد</td>
                      </tr>
                      ${(report.concreteData.groundSlabVolume && report.concreteData.groundSlabVolume > 0) ? `
                      <tr>
                        <td>${report.concreteData.groundSlabVolume.toFixed(2)} م³</td>
                        <td>${report.concreteData.groundSlabVolume.toFixed(2)} م³</td>
                        <td>كمية خرسانة أرضية المبنى</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td>${(() => {
                    const cleaning = report.concreteData.cleaningVolume || 0;
                    const foundations = report.concreteData.foundationsVolume || 0;
                    const groundSlab = report.concreteData.groundSlabVolume || 0;
                    return (cleaning + foundations + groundSlab).toFixed(2);
                  })()} م³</td>
                        <td>${(() => {
                    const cleaning = report.concreteData.cleaningVolume || 0;
                    const foundations = report.concreteData.foundationsVolume || 0;
                    const groundSlab = report.concreteData.groundSlabVolume || 0;
                    return (cleaning + foundations + groundSlab).toFixed(2);
                  })()} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
        }
              </tbody>
            </table>

            <div class="total-box">
              <label>المجموع الكلي:</label>
              <div class="value">
                ${report.calculationType === 'column-footings'
          ? `${(report.concreteData.totalFootingsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
          : report.calculationType === 'columns'
            ? `${(report.concreteData.columnsVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
            : report.calculationType === 'roof'
              ? `${(report.concreteData.totalConcrete || 0).toFixed(2)} م³`
              : report.calculationType === 'ground-bridges'
                ? `${(report.concreteData.totalVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
                : report.calculationType === 'ground-slab'
                  ? `${(report.concreteData.groundSlabVolume || report.concreteData.totalConcrete || 0).toFixed(2)} م³`
                  : `${(() => {
                    const cleaning = report.concreteData.cleaningVolume || 0;
                    const foundations = report.concreteData.foundationsVolume || 0;
                    const groundSlab = report.concreteData.groundSlabVolume || 0;
                    return (cleaning + foundations + groundSlab).toFixed(2);
                  })()} م³`
        }
              </div>
            </div>

            <div class="footer">
              <p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p>
              <p>© 2025 جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      toast({
        title: 'تم فتح التقرير',
        description: 'تم فتح التقرير للطباعة',
      });

      setDownloading(null);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'خطأ في الطباعة',
        description: 'حدث خطأ أثناء فتح التقرير للطباعة',
        variant: 'destructive'
      });
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'foundation': return 'القواعد وصبة النظافة';
      case 'column-footings': return 'شروش الأعمدة';
      case 'columns': return 'الأعمدة';
      case 'roof': return 'السقف';
      case 'ground-bridges': return 'الجسور الأرضية';
      case 'ground-slab': return 'أرضية المبنى (المِدّة)';
      case 'foundation-steel': return 'حديد القواعد';
      case 'ground-beams-steel': return 'حديد الجسور الأرضية';
      case 'ground-slab-steel': return 'حديد أرضية المبنى';
      case 'roof-ribs-steel': return 'حديد أعصاب السقف';
      case 'roof-slab-steel': return 'حديد السقف';
      case 'column-ties-steel': return 'حديد الأعمدة والكانات';
      case 'steel-column-base': return 'حديد شروش الأعمدة';
      default: return type;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'foundation': return <Blocks className="w-5 h-5" />;
      case 'column-footings': return <Building2 className="w-5 h-5" />;
      case 'columns': return <Building2 className="w-5 h-5" />;
      case 'roof': return <Blocks className="w-5 h-5" />;
      case 'ground-bridges': return <Blocks className="w-5 h-5" />;
      case 'ground-slab': return <Blocks className="w-5 h-5" />;
      case 'ground-slab-steel': return <Blocks className="w-5 h-5" />;
      case 'roof-ribs-steel': return <Blocks className="w-5 h-5" />;
      case 'roof-slab-steel': return <Blocks className="w-5 h-5" />;
      case 'column-ties-steel': return <Blocks className="w-5 h-5" />;
      case 'steel-column-base': return <Building2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTotalVolume = (report: QuantityReport) => {
    if (report.calculationType.includes('steel')) {
      return report.steelData?.totalSteelWeight || 0;
    }
    if (report.calculationType === 'column-footings') {
      return report.concreteData?.totalFootingsVolume || report.concreteData?.totalConcrete || 0;
    } else if (report.calculationType === 'columns') {
      return report.concreteData?.columnsVolume || report.concreteData?.totalConcrete || 0;
    } else if (report.calculationType === 'roof') {
      return report.concreteData?.totalConcrete || 0;
    } else if (report.calculationType === 'ground-bridges') {
      return report.concreteData?.totalVolume || report.concreteData?.totalConcrete || 0;
    } else if (report.calculationType === 'ground-slab') {
      return report.concreteData?.groundSlabVolume || report.concreteData?.totalConcrete || 0;
    } else {
      const cleaning = report.concreteData?.cleaningVolume || 0;
      const foundations = report.concreteData?.foundationsVolume || 0;
      const groundSlab = report.concreteData?.groundSlabVolume || 0;
      return cleaning + foundations + groundSlab;
    }
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

  // Separate reports by type
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
  const steelColumnBaseReport = reports.find(r => r.calculationType === 'steel-column-base');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl" style={{ fontSize: '16px' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Back Button */}
        <div className="mb-6">
          <Link href={`/owner/projects/${projectId}`}>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowRight className="w-4 h-4" />
              العودة إلى صفحة المشروع
            </Button>
          </Link>
        </div>

        {/* Enhanced Project Header */}
        <Card className="border-0 shadow-2xl mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold mb-3">
                    {projectInfo?.name || `مشروع #${projectId.slice(-6)}`}
                  </CardTitle>
                  <div className="flex flex-wrap gap-4 text-blue-100">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span className="text-lg">المهندس: {projectInfo?.engineerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span className="text-lg">عدد التقارير: {reports.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle */}
              {reports.length > 0 && (
                <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      viewMode === 'cards'
                        ? "bg-white text-blue-600 shadow-lg"
                        : "text-white hover:bg-white/20"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>بطاقات</span>
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                      viewMode === 'table'
                        ? "bg-white text-blue-600 shadow-lg"
                        : "text-white hover:bg-white/20"
                    )}
                  >
                    <List className="h-4 w-4" />
                    <span>جدول</span>
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* No Reports State */}
        {reports.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد تقارير مرسلة لك</h3>
              <p className="text-slate-500 mb-6">
                لم يتم إرسال أي تقارير كميات لك من المهندس بعد
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {/* Foundation Report Card */}
                {foundationReport && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                            <Blocks className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">تقرير كمية الخرسانة</CardTitle>
                            <CardDescription className="text-emerald-100 text-lg">
                              صبة النظافة والقواعد
                            </CardDescription>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        {foundationReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
                              <span className="text-slate-700 font-medium">حجم صبة النظافة</span>
                              <span className="font-bold text-emerald-600 text-lg">
                                {foundationReport.concreteData.cleaningVolume?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
                              <span className="text-slate-700 font-medium">حجم القواعد</span>
                              <span className="font-bold text-emerald-600 text-lg">
                                {foundationReport.concreteData.foundationsVolume?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            {foundationReport.concreteData.groundSlabVolume && foundationReport.concreteData.groundSlabVolume > 0 && (
                              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200/50 hover:shadow-md transition-all">
                                <span className="text-slate-700 font-medium">حجم أرضية المبنى</span>
                                <span className="font-bold text-emerald-600 text-lg">
                                  {foundationReport.concreteData.groundSlabVolume.toFixed(3)} م³
                                </span>
                              </div>
                            )}
                            <Separator className="my-6" />
                            <div className="flex justify-between items-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border-2 border-emerald-300/50 shadow-lg">
                              <div className="flex items-center gap-3">
                                <Calculator className="w-6 h-6 text-emerald-600" />
                                <span className="font-bold text-slate-800 text-lg">إجمالي الخرسانة</span>
                              </div>
                              <span className="text-3xl font-black text-emerald-600">
                                {getTotalVolume(foundationReport).toFixed(3)} م³
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <Button
                            onClick={() => downloadPDF(foundationReport._id)}
                            disabled={downloading === foundationReport._id}
                            className="w-full h-16 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 group/btn relative overflow-hidden text-lg"
                          >
                            <div className="flex items-center gap-3 relative z-10">
                              {downloading === foundationReport._id ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <Printer className="w-6 h-6" />
                              )}
                              <span>طباعة التقرير</span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                          </Button>

                          {foundationReport.sentToOwnerAt && (
                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                              <div className="flex items-center justify-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">تم الإرسال: {formatDate(foundationReport.sentToOwnerAt)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Column Footings Report Card */}
                {columnFootingsReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                          <CardDescription className="text-emerald-100">
                            شروش الأعمدة
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {columnFootingsReport?.concreteData && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">حجم شروش الأعمدة</span>
                            <span className="font-bold text-emerald-600">
                              {columnFootingsReport.concreteData.totalFootingsVolume?.toFixed(3) ||
                                columnFootingsReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                          {columnFootingsReport.concreteData.numberOfColumns && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-600">عدد الأعمدة</span>
                              <span className="font-bold text-emerald-600">
                                {columnFootingsReport.concreteData.numberOfColumns}
                              </span>
                            </div>
                          )}
                          {columnFootingsReport.concreteData.finalColumnDimensions?.displayText && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-600">أبعاد العمود</span>
                              <span className="font-bold text-emerald-600">
                                {columnFootingsReport.concreteData.finalColumnDimensions.displayText}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                            <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {columnFootingsReport.concreteData.totalFootingsVolume?.toFixed(3) ||
                                columnFootingsReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(columnFootingsReport._id)}
                          disabled={downloading === columnFootingsReport._id}
                          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === columnFootingsReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {columnFootingsReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(columnFootingsReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Columns Report Card */}
                {columnsReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                          <CardDescription className="text-emerald-100">
                            الأعمدة
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {columnsReport?.concreteData && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">حجم الأعمدة</span>
                            <span className="font-bold text-emerald-600">
                              {columnsReport.concreteData.columnsVolume?.toFixed(3) ||
                                columnsReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                          {columnsReport.concreteData.columnsData && columnsReport.concreteData.columnsData.length > 0 && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-600">عدد الأعمدة</span>
                              <span className="font-bold text-emerald-600">
                                {columnsReport.concreteData.columnsData.length}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                            <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {columnsReport.concreteData.columnsVolume?.toFixed(3) ||
                                columnsReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(columnsReport._id)}
                          disabled={downloading === columnsReport._id}
                          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === columnsReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {columnsReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(columnsReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Roof Report Card */}
                {roofReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                          <CardDescription className="text-emerald-100">
                            السقف
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {roofReport?.concreteData && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">حجم السقف</span>
                            <span className="font-bold text-emerald-600">
                              {roofReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                          {roofReport.concreteData.roofData && (
                            <>
                              {roofReport.concreteData.roofData.area && (
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="text-slate-600">مساحة السقف</span>
                                  <span className="font-bold text-emerald-600">
                                    {roofReport.concreteData.roofData.area.toFixed(2)} م²
                                  </span>
                                </div>
                              )}
                              {roofReport.concreteData.roofData.roofType && (
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                  <span className="text-slate-600">نوع السقف</span>
                                  <span className="font-bold text-emerald-600">
                                    {roofReport.concreteData.roofData.roofType === 'with-ribs' ? 'مع ربس' : 'بدون ربس'}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                            <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {roofReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(roofReport._id)}
                          disabled={downloading === roofReport._id}
                          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === roofReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {roofReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(roofReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ground Bridges Report Card */}
                {groundBridgesReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                          <CardDescription className="text-emerald-100">
                            الجسور الأرضية
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {groundBridgesReport?.concreteData && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">حجم الجسور الأرضية</span>
                            <span className="font-bold text-emerald-600">
                              {groundBridgesReport.concreteData.totalVolume?.toFixed(3) ||
                                groundBridgesReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                          {groundBridgesReport.concreteData.bridgesCount && (
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-600">عدد الجسور</span>
                              <span className="font-bold text-emerald-600">
                                {groundBridgesReport.concreteData.bridgesCount}
                              </span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                            <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {groundBridgesReport.concreteData.totalVolume?.toFixed(3) ||
                                groundBridgesReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(groundBridgesReport._id)}
                          disabled={downloading === groundBridgesReport._id}
                          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === groundBridgesReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {groundBridgesReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(groundBridgesReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ground Slab Report Card */}
                {groundSlabReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                          <CardDescription className="text-emerald-100">
                            أرضية المبنى (المِدّة)
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {groundSlabReport?.concreteData && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">حجم أرضية المبنى</span>
                            <span className="font-bold text-emerald-600">
                              {groundSlabReport.concreteData.groundSlabVolume?.toFixed(3) ||
                                groundSlabReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                            <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                            <span className="text-2xl font-black text-emerald-600">
                              {groundSlabReport.concreteData.groundSlabVolume?.toFixed(3) ||
                                groundSlabReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(groundSlabReport._id)}
                          disabled={downloading === groundSlabReport._id}
                          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === groundSlabReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {groundSlabReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(groundSlabReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Foundation Steel Report Card */}
                {foundationSteelReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد القواعد</CardTitle>
                          <CardDescription className="text-green-100">
                            كميات حديد التسليح للقواعد
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {foundationSteelReport?.steelData?.details?.results && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">نوع الحساب</span>
                            <span className="font-bold text-green-600">
                              {foundationSteelReport.steelData.details.results.type === 'similar'
                                ? 'قواعد متشابهة'
                                : 'قواعد مختلفة'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">قطر القضيب</span>
                            <span className="font-bold text-green-600">
                              {foundationSteelReport.steelData.details.inputs?.barDiameter || 'N/A'} ملم
                            </span>
                          </div>
                          {foundationSteelReport.steelData.details.results.type === 'similar' && (
                            <>
                              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <span className="text-slate-600">عدد قطع حديد U</span>
                                <span className="font-bold text-green-600">
                                  {foundationSteelReport.steelData.details.results.uSteelCount || 0} قطعة
                                </span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                <span className="font-bold text-slate-800">الطول الكلي لحديد U</span>
                                <span className="text-2xl font-black text-green-600">
                                  {foundationSteelReport.steelData.details.results.totalUSteelLength?.toFixed(2) || 0} متر
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(foundationSteelReport._id)}
                          disabled={downloading === foundationSteelReport._id}
                          className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === foundationSteelReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {foundationSteelReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(foundationSteelReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ground Beams Steel Report Card */}
                {groundBeamsSteelReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-orange-600 via-emerald-600 to-yellow-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد الجسور</CardTitle>
                          <CardDescription className="text-orange-100">
                            كميات حديد الجسور الأرضية
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {groundBeamsSteelReport?.steelData?.details?.results && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">نوع الحساب</span>
                            <span className="font-bold text-orange-600">
                              {groundBeamsSteelReport.steelData.details.results.type === 'similar'
                                ? 'جسور متشابهة'
                                : 'جسور مختلفة'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">عدد الجسور</span>
                            <span className="font-bold text-orange-600">
                              {groundBeamsSteelReport.steelData.details.results.type === 'similar'
                                ? (groundBeamsSteelReport.steelData.details.results.numberOfBeams || 0)
                                : (groundBeamsSteelReport.steelData?.details?.results?.beams?.length || 0)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <span className="font-bold text-slate-800">إجمالي وزن الحديد</span>
                            <span className="text-2xl font-black text-orange-600">
                              {groundBeamsSteelReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(groundBeamsSteelReport._id)}
                          disabled={downloading === groundBeamsSteelReport._id}
                          className="w-full h-14 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === groundBeamsSteelReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {groundBeamsSteelReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(groundBeamsSteelReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ground Slab Steel Report Card */}
                {groundSlabSteelReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد أرضية المبنى</CardTitle>
                          <CardDescription className="text-orange-100">
                            كميات حديد أرضية المبنى (المِدّة)
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {groundSlabSteelReport?.steelData?.details?.results && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">نوع الحساب</span>
                            <span className="font-bold text-orange-600">
                              {groundSlabSteelReport.steelData.details.results.type === 'mesh'
                                ? 'شبك حديد'
                                : 'حديد مفرق'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">
                              {groundSlabSteelReport.steelData.details.results.type === 'mesh' ? 'عدد الشبك' : 'عدد القصبان'}
                            </span>
                            <span className="font-bold text-orange-600">
                              {groundSlabSteelReport.steelData.details.results.type === 'mesh'
                                ? (groundSlabSteelReport.steelData.details.results.meshBars || 0)
                                : (groundSlabSteelReport.steelData.details.results.totalBars || 0)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <span className="font-bold text-slate-800">إجمالي قطع/شبك</span>
                            <span className="text-2xl font-black text-orange-600">
                              {groundSlabSteelReport.steelData.details.results.type === 'mesh'
                                ? (groundSlabSteelReport.steelData.details.results.meshBars || 0)
                                : (groundSlabSteelReport.steelData.details.results.totalBars || 0)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(groundSlabSteelReport._id)}
                          disabled={downloading === groundSlabSteelReport._id}
                          className="w-full h-14 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === groundSlabSteelReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {groundSlabSteelReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(groundSlabSteelReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Roof Ribs Steel Report Card */}
                {roofRibsSteelReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد أعصاب السقف</CardTitle>
                          <CardDescription className="text-purple-100">
                            كميات حديد أعصاب السقف
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {roofRibsSteelReport?.steelData?.details?.results && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">المساحة المطلوبة</span>
                            <span className="font-bold text-purple-600">
                              {roofRibsSteelReport.steelData.details.results.requiredBarArea || 0} سم²
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">عدد القضبان</span>
                            <span className="font-bold text-purple-600">
                              {roofRibsSteelReport.steelData.details.results.numberOfBars || 0}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(roofRibsSteelReport._id)}
                          disabled={downloading === roofRibsSteelReport._id}
                          className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === roofRibsSteelReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {roofRibsSteelReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تم الإرسال: {formatDate(roofRibsSteelReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Roof Slab Steel Report Card */}
                {roofSlabSteelReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد السقف</CardTitle>
                          <CardDescription className="text-rose-100">
                            كميات حديد السقف
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {roofSlabSteelReport?.steelData?.details?.results && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">نوع التسليح</span>
                            <span className="font-bold text-red-600">
                              {roofSlabSteelReport.steelData.details.results.type === 'mesh'
                                ? 'شبك حديد'
                                : 'حديد مفرق'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">
                              {roofSlabSteelReport.steelData.details.results.type === 'mesh' ? 'عدد الشبك' : 'عدد القصبان'}
                            </span>
                            <span className="font-bold text-red-600">
                              {roofSlabSteelReport.steelData.details.results.type === 'mesh'
                                ? (roofSlabSteelReport.steelData.details.results.meshBars || 0)
                                : (roofSlabSteelReport.steelData.details.results.separateBars || 0)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-rose-50 rounded-lg border-2 border-rose-200">
                            <span className="font-bold text-slate-800">إجمالي قطع/شبك</span>
                            <span className="text-2xl font-black text-rose-600">
                              {roofSlabSteelReport.steelData.details.results.type === 'mesh'
                                ? (roofSlabSteelReport.steelData.details.results.meshBars || 0)
                                : (roofSlabSteelReport.steelData.details.results.separateBars || 0)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(roofSlabSteelReport._id)}
                          disabled={downloading === roofSlabSteelReport._id}
                          className="w-full h-14 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === roofSlabSteelReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {roofSlabSteelReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تاريخ الاستلام: {formatDate(roofSlabSteelReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Column Ties Steel Report Card */}
                {columnTiesSteelReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد الأعمدة والكانات</CardTitle>
                          <CardDescription className="text-orange-100">
                            كميات حديد الأعمدة والكانات
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {columnTiesSteelReport?.steelData?.details?.results && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">عدد السيخ الرأسي</span>
                            <span className="font-bold text-orange-600">
                              {columnTiesSteelReport.steelData.details.results.verticalBarsCount || 0} قضيب
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">عدد الكانات</span>
                            <span className="font-bold text-orange-600">
                              {Math.ceil(columnTiesSteelReport.steelData.details.results.totalStirrups || 0)} كانة
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <span className="font-bold text-slate-800">إجمالي وزن الحديد</span>
                            <span className="text-2xl font-black text-orange-600">
                              {columnTiesSteelReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(columnTiesSteelReport._id)}
                          disabled={downloading === columnTiesSteelReport._id}
                          className="w-full h-14 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === columnTiesSteelReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {columnTiesSteelReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تاريخ الاستلام: {formatDate(columnTiesSteelReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Steel Column Base Report Card */}
                {steelColumnBaseReport && (
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                    <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Blocks className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">تقرير حديد شروش الأعمدة</CardTitle>
                          <CardDescription className="text-blue-100">
                            كميات حديد شروش الأعمدة
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {steelColumnBaseReport?.steelData?.details && (
                        <div className="space-y-4 mb-6">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">طول الشرش</span>
                            <span className="font-bold text-blue-600">
                              {steelColumnBaseReport.steelData.details.starterLength?.toFixed(2) || 0} م
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">عدد القضبان</span>
                            <span className="font-bold text-blue-600">
                              {steelColumnBaseReport.steelData.details.numBars || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-slate-600">أبعاد الشرش</span>
                            <span className="font-bold text-blue-600">
                              {steelColumnBaseReport.steelData.details.dimensionText || 'غير محدد'}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <span className="font-bold text-slate-800">إجمالي وزن الحديد</span>
                            <span className="text-2xl font-black text-blue-600">
                              {steelColumnBaseReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Button
                          onClick={() => downloadPDF(steelColumnBaseReport._id)}
                          disabled={downloading === steelColumnBaseReport._id}
                          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          {downloading === steelColumnBaseReport._id ? (
                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          ) : (
                            <Printer className="w-5 h-5 ml-2" />
                          )}
                          طباعة التقرير
                        </Button>

                        {steelColumnBaseReport.sentToOwnerAt && (
                          <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>تاريخ الاستلام: {formatDate(steelColumnBaseReport.sentToOwnerAt)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            )}

            {/* Enhanced Table View */}
            {viewMode === 'table' && (
              <div className="mb-8">
                <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-gray-200/50 py-6">
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      جدول التقارير
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-black text-gray-800 text-right py-6 text-lg">نوع التقرير</TableHead>
                            <TableHead className="font-black text-gray-800 text-right py-6 text-lg">تاريخ الإرسال</TableHead>
                            <TableHead className="font-black text-gray-800 text-center py-6 text-lg">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports.map((report, index) => (
                            <motion.tr
                              key={report._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="hover:bg-gradient-to-r hover:from-emerald-50/80 hover:via-teal-50/60 hover:to-blue-50/40 transition-all duration-300 border-b border-gray-100/50 group"
                            >
                              <TableCell className="py-6">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg group-hover:scale-110 transition-all duration-300">
                                    {getReportTypeIcon(report.calculationType)}
                                    <div className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">
                                      {getReportTypeLabel(report.calculationType)}
                                    </p>
                                    <p className="text-sm text-gray-500 font-medium">
                                      {report.calculationType.includes('steel') ? 'تقرير حسابات الحديد' : 'تقرير كمية الخرسانة'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-6">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="font-bold text-gray-900">
                                      {formatDate(report.sentToOwnerAt || report.updatedAt)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {report.sentToOwnerAt ? 'تم الإرسال' : 'تم الإنشاء'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-6">
                                <Button
                                  onClick={() => downloadPDF(report._id)}
                                  disabled={downloading === report._id}
                                  size="lg"
                                  className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-600 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-3 group/btn relative overflow-hidden"
                                >
                                  <div className="flex items-center gap-2 relative z-10">
                                    {downloading === report._id ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <Printer className="w-5 h-5" />
                                    )}
                                    <span>طباعة</span>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
