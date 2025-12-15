"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Download,
  ArrowRight,
  Loader2,
  User,
  Calendar,
  Blocks,
  CircleDot,
  CheckCircle2,
  AlertCircle,
  Printer,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface QuantityReport {
  _id: string;
  projectId: string;
  projectName: string;
  engineerName: string;
  ownerName: string;
  ownerEmail: string;
  calculationType: string;
  concreteData: {
    cleaningVolume: number;
    foundationsVolume: number;
    totalConcrete: number;
    totalLoad: number;
    foundationDimensions: string;
  };
  steelData: {
    totalSteelWeight: number;
    foundationSteel: number;
    columnSteel?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProjectReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;
  
  const [reports, setReports] = useState<QuantityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<{
    name: string;
    engineerName: string;
    ownerName: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    reportId: string | null;
    reportType: string | null;
    reportDate: string | null;
  }>({
    open: false,
    reportId: null,
    reportType: null,
    reportDate: null,
  });

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/project/${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
        if (data.reports.length > 0) {
          setProjectInfo({
            name: data.reports[0].projectName,
            engineerName: data.reports[0].engineerName,
            ownerName: data.reports[0].ownerName || 'غير محدد'
          });
        } else if (data.project) {
          setProjectInfo({
            name: data.project.name,
            engineerName: data.project.engineer || '',
            ownerName: data.project.clientName || 'غير محدد'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب التقارير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (reportId: string, type: 'concrete' | 'steel') => {
    setDownloading(`${reportId}-${type}`);
    try {
      const report = reports.find(r => r._id === reportId);
      if (!report) {
        throw new Error('Report not found');
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
              position: relative;
            }
            
            .logo {
              position: absolute;
              top: 20px;
              left: 20px;
              width: 150px;
              height: 150px;
              object-fit: contain;
              border: none;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
              transition: transform 0.3s ease;
            }
            
            .info-box:hover {
              transform: translateY(-2px);
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
            
            .date-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              font-size: 16px;
              color: #718096;
              text-align: center;
              padding: 15px;
              background: #f7fafc;
              border-radius: 8px;
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
              letter-spacing: 0.5px;
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
              background: ${type === 'concrete' 
                ? 'linear-gradient(135deg, #d4f4dd, #bbf7d0)' 
                : 'linear-gradient(135deg, #2563eb, #1e40af)'};
              border: 3px solid ${type === 'concrete' ? '#22c55e' : '#2563eb'};
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
              color: ${type === 'concrete' ? '#16a34a' : '#2563eb'};
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .footer {
              border-top: 2px solid #e2e8f0;
              padding-top: 25px;
              text-align: center;
              font-size: 14px;
              color: #718096;
              margin-top: 50px;
            }
            
            .stamp-section {
              text-align: center;
              border: 2px dashed #718096;
              border-radius: 50%;
              width: 120px;
              height: 120px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              opacity: 0.7;
              margin: 20px auto;
            }
            
            .stamp-text {
              font-size: 14px;
              color: #4a5568;
              font-weight: 600;
              line-height: 1.2;
            }
            
            .signature-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 100px;
            }
            
            .signature-box {
              text-align: center;
              width: 45%;
              padding: 20px;
              background: #f8f9ff;
              border-radius: 10px;
              border: 2px solid #e2e8f0;
            }
            
            .signature-line {
              border-bottom: 3px solid #4a5568;
              margin-bottom: 15px;
              height: 70px;
            }
            
            .signature-title {
              font-size: 20px;
              font-weight: 700;
              color: #2d3748;
              margin-bottom: 8px;
            }
            
            .signature-name {
              font-size: 18px;
              color: #4a5568;
              margin-bottom: 5px;
            }
            
            .signature-label {
              font-size: 16px;
              color: #718096;
            }
            
            .signature-date {
              text-align: center;
              margin-top: 40px;
              font-size: 16px;
              color: #4a5568;
              font-weight: 500;
            }
            
            @media print {
              body {
                padding: 15mm;
                font-size: 16px;
              }
              .container {
                page-break-inside: avoid;
              }
              .header {
                page-break-after: avoid;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
            
            @page {
              margin: 20mm;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/header-bg.jpg" alt="شعار الموقع" class="logo">
              <h1>طلبية خرسانة</h1>
              <p>تقرير كميات ${type === 'concrete' ? 'الخرسانة' : 'الحديد'}</p>
              <p>تفصيل شامل لكميات المواد والمعدات</p>
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

            <div class="date-info">
              <span>عدد البنود: 3</span>
              <span>تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</span>
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
                ${
                  type === 'concrete' && report.concreteData
                    ? `
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
                      <tr>
                        <td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>${(report.concreteData.totalConcrete || 0).toFixed(2)} م³</td>
                        <td>إجمالي الخرسانة</td>
                      </tr>
                    `
                    : `
                      <tr>
                        <td>${report.steelData?.foundationSteel?.toFixed(2) || 0} كجم</td>
                        <td>${report.steelData?.foundationSteel?.toFixed(2) || 0} كجم</td>
                        <td>حديد القواعد</td>
                      </tr>
                      <tr>
                        <td>${report.steelData?.columnSteel?.toFixed(2) || 0} كجم</td>
                        <td>${report.steelData?.columnSteel?.toFixed(2) || 0} كجم</td>
                        <td>حديد الأعمدة</td>
                      </tr>
                      <tr>
                        <td>${(report.steelData?.totalSteelWeight || 0).toFixed(2)} كجم</td>
                        <td>${(report.steelData?.totalSteelWeight || 0).toFixed(2)} كجم</td>
                        <td>إجمالي الحديد</td>
                      </tr>
                    `
                }
              </tbody>
            </table>

            <div class="total-box">
              <label>المجموع الكلي:</label>
              <div class="value">
                ${
                  type === 'concrete' && report.concreteData
                    ? `${(report.concreteData.totalConcrete || 0).toFixed(2)} م³`
                    : `${(report.steelData?.totalSteelWeight || 0).toFixed(2)} كجم`
                }
              </div>
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
              <div class="signature-date">
                تاريخ التوقيع: _______________
              </div>
            </div>

            <div class="stamp-section">
              <div class="stamp-text">الختم<br/>إن وجد</div>
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
        description: `تم فتح تقرير ${type === 'concrete' ? 'الخرسانة' : 'الحديد'} للطباعة`,
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

  const handleDeleteReport = (reportId: string) => {
    const report = reports.find(r => r._id === reportId);
    if (!report) return;

    setDeleteDialog({
      open: true,
      reportId,
      reportType: report.calculationType === 'foundation' ? 'القواعد وصبة النظافة' : 
                 report.calculationType === 'column-footings' ? 'شروش الأعمدة' : 
                 report.calculationType,
      reportDate: formatDate(report.updatedAt),
    });
  };

  const confirmDeleteReport = async () => {
    if (!deleteDialog.reportId) return;
    
    setDeleting(deleteDialog.reportId);
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/${deleteDialog.reportId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setReports(prev => prev.filter(report => report._id !== deleteDialog.reportId));
        toast({
          title: 'تم الحذف بنجاح',
          description: `تم حذف تقرير ${deleteDialog.reportType} بنجاح`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف التقرير',
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
      setDeleteDialog({ open: false, reportId: null, reportType: null, reportDate: null });
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

  const latestReport = reports[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl" style={{ fontSize: '16px' }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/engineer/quantity-reports">
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowRight className="w-4 h-4" />
              العودة لقائمة المشاريع
            </Button>
          </Link>
        </div>

        {/* Project Header */}
        <Card className="border-0 shadow-xl mb-8 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold mb-2">
                  {projectInfo?.name || `مشروع #${projectId.slice(-6)}`}
                </CardTitle>
                <div className="flex flex-wrap gap-4 text-blue-100">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>المهندس: {projectInfo?.engineerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>المالك: {projectInfo?.ownerName}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* No Reports State */}
        {reports.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد تقارير لهذا المشروع</h3>
              <p className="text-slate-500 mb-6">
                قم بإجراء حسابات الكميات من صفحة المشروع لإنشاء التقارير
              </p>
              <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  الذهاب لحسابات الخرسانة
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Download Buttons */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Concrete Report Download */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Blocks className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                      <CardDescription className="text-emerald-100">
                        صبة النظافة والقواعد
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {latestReport?.concreteData && (
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">حجم صبة النظافة</span>
                        <span className="font-bold text-emerald-600">
                          {latestReport.concreteData.cleaningVolume?.toFixed(3) || 0} م³
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">حجم القواعد</span>
                        <span className="font-bold text-emerald-600">
                          {latestReport.concreteData.foundationsVolume?.toFixed(3) || 0} م³
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                        <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                        <span className="text-2xl font-black text-emerald-600">
                          {latestReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => downloadPDF(latestReport._id, 'concrete')}
                    disabled={downloading === `${latestReport._id}-concrete`}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {downloading === `${latestReport._id}-concrete` ? (
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    ) : (
                      <Printer className="w-5 h-5 ml-2" />
                    )}
                    طباعة تقرير الخرسانة PDF
                  </Button>
                </CardContent>
              </Card>

              {/* Steel Report Download */}
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                <CardHeader className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CircleDot className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">تقرير كمية الحديد</CardTitle>
                      <CardDescription className="text-orange-100">
                        حديد التسليح المطلوب
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {latestReport && (
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">حديد القواعد (تقديري)</span>
                        <span className="font-bold text-orange-600">
                          {((latestReport.concreteData?.totalConcrete || 0) * 80 * 0.3).toFixed(2)} كجم
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">معدل الحديد</span>
                        <span className="font-bold text-orange-600">~80 كجم/م³</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                        <span className="font-bold text-slate-800">إجمالي الحديد (تقديري)</span>
                        <span className="text-2xl font-black text-orange-600">
                          {((latestReport.concreteData?.totalConcrete || 0) * 80).toFixed(2)} كجم
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => downloadPDF(latestReport._id, 'steel')}
                    disabled={downloading === `${latestReport._id}-steel`}
                    className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {downloading === `${latestReport._id}-steel` ? (
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    ) : (
                      <Printer className="w-5 h-5 ml-2" />
                    )}
                    طباعة تقرير الحديد PDF
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Report History */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-600" />
                  سجل التقارير
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div 
                      key={report._id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="font-medium text-slate-800">
                            تقرير {report.calculationType === 'foundation' ? 'القواعد وصبة النظافة' : 
                                   report.calculationType === 'column-footings' ? 'شروش الأعمدة' : 
                                   report.calculationType}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-white">
                          {report.concreteData?.totalConcrete?.toFixed(2) || 0} م³
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReport(report._id)}
                          disabled={deleting === report._id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        >
                          {deleting === report._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Enhanced Delete Report Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent className="max-w-lg" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <AlertDialogTitle className="text-right text-xl font-bold">
                تأكيد حذف التقرير
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-right text-base leading-relaxed">
              <div className="space-y-3">
                <div>
                  هل أنت متأكد من حذف تقرير:
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <div className="font-bold text-amber-800 text-lg mb-2">
                    {deleteDialog.reportType}
                  </div>
                  <div className="text-amber-700 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>التاريخ: {deleteDialog.reportDate}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-4 h-4" />
                      <span>المشروع: {projectInfo?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    هذا الإجراء لا يمكن التراجع عنه
                  </div>
                  <div className="text-red-700 text-sm mt-1">
                    سيتم حذف جميع البيانات المتعلقة بهذا التقرير بشكل دائم
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 mt-6">
            <AlertDialogCancel className="flex-1 h-12 text-base font-medium">
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReport}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white text-base font-medium"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف التقرير
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}