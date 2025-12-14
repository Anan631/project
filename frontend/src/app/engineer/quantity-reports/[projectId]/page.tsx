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
  FileDown,
  CheckCircle2,
  AlertCircle,
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
      const response = await fetch(
        `http://localhost:5000/api/quantity-reports/pdf/${type}/${reportId}`,
        { method: 'GET' }
      );
      
      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: 'تم التحميل',
        description: `تم تحميل تقرير ${type === 'concrete' ? 'الخرسانة' : 'الحديد'} بنجاح`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'خطأ في التحميل',
        description: 'حدث خطأ أثناء تحميل التقرير',
        variant: 'destructive'
      });
    } finally {
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
                      <FileDown className="w-5 h-5 ml-2" />
                    )}
                    تحميل تقرير الخرسانة PDF
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
                      <FileDown className="w-5 h-5 ml-2" />
                    )}
                    تحميل تقرير الحديد PDF
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
