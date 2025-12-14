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
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const [projectInfo, setProjectInfo] = useState<{
    name: string;
    engineerName: string;
    ownerName: string;
  } | null>(null);

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
      // Find the report from the loaded reports
      const report = reports.find(r => r._id === reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
            }
            body {
              direction: rtl;
              padding: 20mm;
              background: white;
            }
            .container {
              max-width: 100%;
              background: white;
            }
            .header {
              background: linear-gradient(135deg, #3f51b5 0%, #2196f3 100%);
              color: white;
              padding: 30px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: right;
            }
            .header h1 {
              font-size: 28px;
              margin-bottom: 5px;
              font-weight: bold;
            }
            .header p {
              font-size: 14px;
              opacity: 0.9;
            }
            .project-name {
              background: #f0f4f9;
              border-right: 4px solid #3f51b5;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
              text-align: right;
            }
            .project-name h2 {
              color: #1e293b;
              font-size: 16px;
              font-weight: bold;
            }
            .info-boxes {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
            }
            .info-box {
              background: #f5f7fa;
              border: 1px solid #3f51b5;
              padding: 15px;
              border-radius: 4px;
              text-align: right;
            }
            .info-box label {
              display: block;
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .info-box .value {
              font-size: 14px;
              color: #1e293b;
              font-weight: bold;
            }
            .date-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 12px;
              color: #6b7280;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            thead {
              background: #3f51b5;
              color: white;
            }
            th {
              padding: 12px;
              text-align: right;
              font-weight: bold;
              font-size: 12px;
            }
            td {
              padding: 12px;
              text-align: right;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            tbody tr:nth-child(even) {
              background: #f8fafb;
            }
            tbody tr:last-child {
              font-weight: bold;
              color: #3f51b5;
            }
            .total-box {
              background: ${type === 'concrete' ? '#e8f5e9' : '#fff1e8'};
              border: 2px solid ${type === 'concrete' ? '#4caf50' : '#e17055'};
              border-radius: 4px;
              padding: 20px;
              margin-bottom: 30px;
              text-align: right;
            }
            .total-box label {
              display: block;
              font-size: 14px;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .total-box .value {
              font-size: 24px;
              font-weight: bold;
              color: ${type === 'concrete' ? '#4caf50' : '#e17055'};
            }
            .footer {
              border-top: 1px solid #d3d4d6;
              padding-top: 15px;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
              margin-top: 30px;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .container {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>تقرير كميات ${type === 'concrete' ? 'الخرسانة' : 'الحديد'}</h1>
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
                        <td>كمية خرسانة النظاف</td>
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

            <div class="footer">
              <p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p>
              <p>© 2025 جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create a new window and write the HTML content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for the content to load and then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 100);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
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
                            تقرير {report.calculationType === 'foundation' ? 'القواعد وصبة النظافة' : report.calculationType}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-white">
                        {report.concreteData?.totalConcrete?.toFixed(2) || 0} م³
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
