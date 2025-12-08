"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, Download, Calendar, User, DollarSign, Loader2 } from 'lucide-react';
import { getCostReportsForProject } from '@/lib/db';
import type { CostReport } from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [reports, setReports] = useState<CostReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      if (!projectId) return;
      setIsLoading(true);
      try {
        const fetchedReports = await getCostReportsForProject(projectId);
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, [projectId]);

  // Generate PDF from report data
  const generatePDF = (report: CostReport) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('helvetica');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text(`تقرير تكلفة البناء: ${report.reportName}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);

    doc.text(`المهندس المسؤول: ${report.engineerName}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`المالك/العميل: ${report.ownerName}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`تاريخ التقرير: ${new Date(report.createdAt).toLocaleDateString('ar-EG')}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;
    doc.text(`العملة: شيكل (₪)`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 15;

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    // Table data from items
    if (report.items && report.items.length > 0) {
      const tableData = report.items.map((item, index) => [
        `${item.totalCost_ILS.toFixed(2)} ₪`,
        `${item.pricePerUnit_ILS.toFixed(2)} ₪`,
        `${item.quantity} ${item.unit}`,
        item.name,
        (index + 1).toString()
      ]);

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
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, finalY, pageWidth - (margin * 2), 15, 'F');

      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.text('المجموع الكلي:', pageWidth - margin - 5, finalY + 10, { align: 'right' });

      doc.setTextColor(30, 41, 59);
      doc.text(`${report.totalCost_ILS.toFixed(2)} ₪`, margin + 40, finalY + 10, { align: 'left' });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(`المجموع الكلي: ${report.totalCost_ILS.toLocaleString('en-US')} ₪`, pageWidth - margin, yPos + 20, { align: 'right' });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );

    return doc;
  };

  const handleDownloadPDF = (report: CostReport) => {
    const doc = generatePDF(report);
    doc.save(`${report.reportName}_${new Date(report.createdAt).toLocaleDateString('en-US')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 text-right">
      <Card className="max-w-4xl mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center border-b">
          <FileText className="mx-auto h-16 w-16 text-app-gold mb-3" />
          <CardTitle className="text-3xl font-bold text-app-red">تقارير الكميات والتكاليف</CardTitle>
          <CardDescription className="text-gray-600 mt-2 text-base">
            عرض وتنزيل التقارير التفصيلية للكميات والتكاليف
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {reports.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <FileText className="mx-auto h-16 w-16 text-gray-300" />
              <p className="text-gray-600 text-lg">لا توجد تقارير متاحة حالياً</p>
              <p className="text-gray-500 text-sm">سيقوم المهندس برفع التقارير هنا عند اكتمالها</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div
                  key={report.id || `report-${index}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{report.reportName}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4 text-blue-500" />
                        المهندس: {report.engineerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-green-500" />
                        {new Date(report.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        {report.totalCost_ILS.toLocaleString('en-US')} ₪
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadPDF(report)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تنزيل PDF
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t flex justify-center">
            <Button asChild size="lg" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <Link href={`/owner/projects/${projectId}`}>
                <ArrowLeft className="mr-2 h-5 w-5" />
                العودة إلى تفاصيل المشروع
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
