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
  Trash2,
  AlertTriangle,
  X,
  Send,
  TrendingUp,
  BarChart3,
  Activity,
  Package,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    totalLoad?: number;
    foundationDimensions?: string;
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
  steelData: {
    totalSteelWeight: number;
    foundationSteel: number;
    columnSteel?: number;
    beamSteel?: number;
    slabSteel?: number;
    stirrupsSteel?: number;
    [key: string]: any;
  };
  sentToOwner?: boolean;
  sentToOwnerAt?: string;
  createdAt: string;
  updatedAt: string;
}

const ALLOWED_CALCULATION_TYPES = [
  'foundations',
  'ground-bridges',
  'ground-slab',
  'roof',
  'column-footings',
  'columns',
  'foundation-steel',
  'ground-beams-steel',
  'ground-slab-steel',
  'roof-ribs-steel',
  'roof-slab-steel',
  'column-ties-steel',
  'steel-column-base',
];

export default function ProjectReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.projectId as string;

  const [reports, setReports] = useState<QuantityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sendingToOwner, setSendingToOwner] = useState<string | null>(null);
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

  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/project/${projectId}`);
      const data = await response.json();

      if (data.success) {
        const allReports: QuantityReport[] = Array.isArray(data.reports) ? data.reports : [];
        const visibleReports = allReports.filter(r => ALLOWED_CALCULATION_TYPES.includes(r.calculationType));
        const hiddenReports = allReports.filter(r => !ALLOWED_CALCULATION_TYPES.includes(r.calculationType));

        if (hiddenReports.length > 0) {
          await Promise.allSettled(
            hiddenReports.map((report) =>
              fetch(`http://localhost:5000/api/quantity-reports/${report._id}`, {
                method: 'DELETE'
              })
            )
          );
        }

        setReports(visibleReports);
        if (visibleReports.length > 0) {
          setProjectInfo({
            name: visibleReports[0].projectName,
            engineerName: visibleReports[0].engineerName,
            ownerName: visibleReports[0].ownerName || 'غير محدد'
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

      // Check if this is a foundation-steel report or ground-beams-steel report or ground-slab-steel report or roof-ribs-steel report or column-ties-steel report or steel-column-base report
      if (report.calculationType === 'foundation-steel' || report.calculationType === 'ground-beams-steel' || report.calculationType === 'ground-slab-steel' || report.calculationType === 'roof-ribs-steel' || report.calculationType === 'roof-slab-steel' || report.calculationType === 'column-ties-steel' || report.calculationType === 'steel-column-base') {
        const isGroundBeams = report.calculationType === 'ground-beams-steel';
        const isGroundSlab = report.calculationType === 'ground-slab-steel';
        const isRoofRibs = report.calculationType === 'roof-ribs-steel';
        const isRoofSlab = report.calculationType === 'roof-slab-steel';
        const isColumnTies = report.calculationType === 'column-ties-steel';
        const isSteelColumnBase = report.calculationType === 'steel-column-base';

        // Generate Steel Report PDF (Foundation or Ground Beams or Ground Slab or Roof Ribs or Roof Slab or Column Ties or Steel Column Base)
        const steelData = report.steelData?.details;
        const results = steelData?.results;
        const inputs = steelData?.inputs || steelData || {}; // Use steelData as fallback for steel column base

        // Prepare data specific to report type
        const reportTitle = isGroundBeams ? 'تقرير حديد الجسور الأرضية - طلبية حديد' : isGroundSlab ? 'تقرير حديد أرضية المبنى - طلبية حديد' : isRoofRibs ? 'تقرير حديد أعصاب السقف - طلبية حديد' : isRoofSlab ? 'تقرير حديد السقف - طلبية حديد' : isColumnTies ? 'تقرير حديد الأعمدة والكانات - طلبية حديد' : isSteelColumnBase ? 'تقرير حديد شروش الأعمدة - طلبية حديد' : 'تقرير حديد القواعد - طلبية حديد';
        const reportSubtitle = isGroundBeams ? 'حساب كميات حديد الجسور الأرضية وفق المعايير الهندسية' : isGroundSlab ? 'حساب كميات حديد أرضية المبنى وفق المعايير الهندسية' : isRoofRibs ? 'حساب كميات حديد أعصاب السقف وفق المعايير الهندسية' : isRoofSlab ? 'حساب كميات حديد السقف وفق المعايير الهندسية' : isColumnTies ? 'حساب كميات حديد الأعمدة والكانات وفق المعايير الهندسية' : isSteelColumnBase ? 'حساب كميات حديد شروش الأعمدة وفق المعايير الهندسية' : 'حساب كميات حديد القواعد وفق المعايير الهندسية';

        let specificTablesHtml = '';

        if (isColumnTies) {
          specificTablesHtml = `
                <div class="section-title">بيانات العمود والمدخلات</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${inputs.heightM || 0} م</td>
                      <td>ارتفاع العمود</td>
                    </tr>
                    <tr>
                      <td>${inputs.slabAreaM2 || 0} م²</td>
                      <td>مساحة البلاطة</td>
                    </tr>
                    <tr>
                      <td>${inputs.floors || 0}</td>
                      <td>عدد الطوابق</td>
                    </tr>
                    <tr>
                      <td>${inputs.rodDiameterMm || 0} ملم</td>
                      <td>قطر القضيب</td>
                    </tr>
                    <tr>
                      <td>${inputs.slabThicknessCm || 0} سم</td>
                      <td>سمك السقف</td>
                    </tr>
                  </tbody>
                </table>

                <div class="section-title">نتائج الحساب (الأعمدة والكانات)</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${results.verticalBarsCount || 0} قضيب</td>
                      <td>عدد القضبان العمودية</td>
                    </tr>
                    <tr>
                      <td>${results.finalRodLenM?.toFixed(2) || 0} م</td>
                      <td>طول القضيب العمودي النهائي</td>
                    </tr>
                    <tr>
                      <td>${results.totalStirrups ? Math.ceil(results.totalStirrups) : 0} كانة</td>
                      <td>عدد الكانات الإجمالي</td>
                    </tr>
                    <tr>
                      <td>${results.columnDimensions?.displayText || 'N/A'}</td>
                      <td>أبعاد العمود</td>
                    </tr>
                    <tr style="background: #d1fae5; font-weight: bold;">
                      <td>${results.rodWeight?.toFixed(3) || 0} كجم</td>
                      <td>وزن الحديد للعمود</td>
                    </tr>
                  </tbody>
                </table>
              `;
        } else if (isGroundBeams) {
          const type = results?.type;
          const isSimilar = type === 'similar';

          if (isSimilar) {
            specificTablesHtml = `
                    <div class="section-title">بيانات الجسور</div>
                    <table>
                      <thead>
                        <tr>
                          <th>القيمة</th>
                          <th>البيان</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>${results.numberOfBeams || 0} جسر</td>
                          <td>عدد الجسور</td>
                        </tr>
                        <tr>
                          <td>${results.beamHeight || 0} سم</td>
                          <td>ارتفاع الجسر</td>
                        </tr>
                        <tr>
                          <td>${results.beamWidth || 0} سم</td>
                          <td>عرض الجسر</td>
                        </tr>
                         <tr>
                          <td>${results.barDiameter || 'N/A'} ملم</td>
                          <td>قطر القضيب</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="section-title">نتائج الحديد</div>
                    <table>
                        <thead>
                            <tr>
                                <th>القيمة</th>
                                <th>البيان</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${results.barsPerBeam || 0} قضيب</td>
                                <td>عدد القضبان في الجسر الواحد</td>
                            </tr>
                             <tr style="background: #d1fae5; font-weight: bold;">
                                <td>${results.totalBars || 0} قضيب</td>
                                <td>المجموع الكلي للقضبان</td>
                            </tr>
                        </tbody>
                    </table>
                 `;
          } else {
            if (results?.beams && Array.isArray(results.beams)) {
              specificTablesHtml = `
                        <div class="section-title">بيانات الجسور المختلفة</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>عدد القضبان</th>
                                    <th>العرض (سم)</th>
                                    <th>الارتفاع (سم)</th>
                                    <th>رقم الجسر</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.beams.map((beam: any) => `
                                    <tr>
                                        <td>${beam.barsPerBeam}</td>
                                        <td>${beam.width}</td>
                                        <td>${beam.height}</td>
                                        <td>${beam.id}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                         
                        <div class="total-box">
                            <label>المجموع الكلي للقضبان:</label>
                            <div class="value">${results.totalBars || 0} قضيب</div>
                        </div>
                     `;
            }
          }

        } else if (isSteelColumnBase) {
          specificTablesHtml = `
                <div class="section-title">بيانات شروش الأعمدة</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${steelData.starterLength?.toFixed(2) || 0} م</td>
                      <td>طول الشرش</td>
                    </tr>
                    <tr>
                      <td>${steelData.numBars || 0}</td>
                      <td>عدد القضبان</td>
                    </tr>
                    <tr>
                      <td>${steelData?.rodDiameter || steelData?.barDiameter || inputs?.rodDiameter || report.steelData?.details?.rodDiameter || report.steelData?.details?.barDiameter || 'N/A'} ملم</td>
                      <td>قطر القضيب</td>
                    </tr>
                    <tr>
                      <td>${steelData.dimensionText || 'غير محدد'}</td>
                      <td>أبعاد الشرش</td>
                    </tr>
                  </tbody>
                </table>

                <div class="section-title">نتائج الحسابات</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${steelData.totalSteelWeight || report.steelData?.totalSteelWeight || 0} كجم</td>
                      <td>الوزن الإجمالي للحديد</td>
                    </tr>
                  </tbody>
                </table>
              `;
        } else if (isGroundSlab) {
          const type = results?.type;

          if (type === 'mesh') {
            specificTablesHtml = `
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
                     <td>${inputs.meshLength || 0} * ${inputs.meshWidth || 0} متر</td>
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
             `;
          } else {
            // Separate
            specificTablesHtml = `
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
                     <td>${inputs.barLength || 0} متر</td>
                     <td>طول القضيب</td>
                   </tr>
                    <tr>
                     <td>${inputs.spacing || 0} متر</td>
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
             `;
          }
        } else if (isRoofSlab) {
          const type = results?.type;
          if (type === 'mesh') {
            specificTablesHtml = `
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
                         <tr style="background: #fff7ed; font-weight: bold; color: #ea580c;">
                            <td>${results.meshBars || 0} شبكة</td>
                            <td>عدد قطع الشبك المطلوبة</td>
                        </tr>
                    </tbody>
                </table>
             `;
          } else {
            specificTablesHtml = `
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
                         <tr style="background: #fff7ed; font-weight: bold; color: #ea580c;">
                            <td>${results.separateBars || 0} قضيب</td>
                            <td>عدد القضبان المطلوبة</td>
                        </tr>
                    </tbody>
                </table>
             `;
          }
        } else {
          // Foundation Steel Logic (Existing)
          specificTablesHtml = results?.type === 'similar' ? `
                <div class="section-title">معلومات القواعد</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${results.numberOfFoundations || 0}</td>
                      <td>عدد القواعد</td>
                    </tr>
                    <tr>
                      <td>${results.foundationLength || 0} متر</td>
                      <td>الطول</td>
                    </tr>
                    <tr>
                      <td>${results.foundationWidth || 0} متر</td>
                      <td>العرض</td>
                    </tr>
                    <tr>
                      <td>${inputs?.uSteelSpacing || 0} متر</td>
                      <td>المسافة بين حديد U</td>
                    </tr>
                    <tr>
                      <td>${inputs?.barDiameter || results?.barDiameter || report.steelData?.details?.inputs?.barDiameter || 'N/A'} ملم</td>
                      <td>قطر القضيب</td>
                    </tr>
                  </tbody>
                </table>

                <div class="section-title">نتائج حديد U</div>
                <table>
                  <thead>
                    <tr>
                      <th>القيمة</th>
                      <th>البيان</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${results.uSteelCount || 0} قطعة</td>
                      <td>عدد قطع حديد U</td>
                    </tr>
                    <tr>
                      <td>${results.bendLength?.toFixed(2) || 0} متر</td>
                      <td>طول الثنية</td>
                    </tr>
                    <tr>
                      <td>${results.seaLength?.toFixed(2) || 0} متر</td>
                      <td>طول البحر</td>
                    </tr>
                    <tr style="background: #d1fae5; font-weight: bold;">
                      <td>${results.totalUSteelLength?.toFixed(2) || 0} متر</td>
                      <td>الطول الكلي لحديد U</td>
                    </tr>
                  </tbody>
                </table>

                <div class="section-title">التسليح العلوي والسفلي</div>
                <table>
                  <thead>
                    <tr>
                      <th>طول القضيب (م)</th>
                      <th>عدد القضبان</th>
                      <th>نوع التسليح</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${results.reinforcement?.map((row: any) => `
                      <tr>
                        <td>${row.barLength?.toFixed(2) || 0}</td>
                        <td>${row.numberOfBars || 0}</td>
                        <td>${row.type || ''}</td>
                      </tr>
                    `).join('') || ''}
                  </tbody>
                </table>
              ` : `
                <div class="section-title">نتائج القواعد المختلفة</div>
                ${results?.foundations?.map((foundation: any, idx: number) => `
                  <div style="margin-bottom: 30px;">
                    <h3 style="background: #f0fdf4; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;">قاعدة ${foundation.id}</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>القيمة</th>
                          <th>البيان</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>${foundation.foundationLength || 0} متر</td>
                          <td>الطول</td>
                        </tr>
                        <tr>
                          <td>${foundation.foundationWidth || 0} متر</td>
                          <td>العرض</td>
                        </tr>
                        <tr>
                          <td>${foundation.uSteelCount || 0} قطعة</td>
                          <td>عدد قطع حديد U</td>
                        </tr>
                        <tr>
                          <td>${foundation.totalUSteelLength?.toFixed(2) || 0} متر</td>
                          <td>الطول الكلي لحديد U</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="section-title" style="margin-top: 20px; font-size: 18px;">التسليح العلوي والسفلي</div>
                    <table>
                      <thead>
                        <tr>
                          <th>طول القضيب (م)</th>
                          <th>عدد القضبان</th>
                          <th>نوع التسليح</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${foundation.reinforcement?.map((row: any) => `
                          <tr>
                            <td>${row.barLength?.toFixed(2) || 0}</td>
                            <td>${row.numberOfBars || 0}</td>
                            <td>${row.type || ''}</td>
                          </tr>
                        `).join('') || ''}
                      </tbody>
                    </table>
                  </div>
                `).join('') || ''}
              `;
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
              
              .header {
                background: linear-gradient(135deg, ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ea580c' : '#059669'} 0%, ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#c2410c' : '#10b981'} 100%);
                color: white;
                padding: 40px 30px;
                border-radius: 12px;
                margin-bottom: 40px;
                text-align: center;
              }
              
              .header h1 {
                font-size: 36px;
                margin-bottom: 10px;
                font-weight: 900;
              }
              
              .header p {
                font-size: 20px;
                opacity: 0.95;
              }
              
              .project-name {
                background: linear-gradient(to right, ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#fff7ed' : '#f0fdf4'}, ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ffedd5' : '#dcfce7'});
                border-right: 6px solid ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ea580c' : '#059669'};
                padding: 25px 30px;
                margin-bottom: 30px;
                border-radius: 8px;
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
                background: white;
                border: 2px solid ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#fed7aa' : '#d1fae5'};
                padding: 25px;
                border-radius: 10px;
                text-align: center;
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
                background: linear-gradient(135deg, ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ea580c' : '#059669'}, ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#c2410c' : '#10b981'});
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
                background: ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#fff7ed' : '#f0fdf4'};
              }
              
              .total-box {
                background: ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ffedd5' : '#d1fae5'};
                border: 3px solid ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ea580c' : '#059669'};
                border-radius: 12px;
                padding: 30px;
                margin-bottom: 40px;
                text-align: center;
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
                color: ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ea580c' : '#059669'};
              }

              .section-title {
                background: ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#fff7ed' : '#f0fdf4'};
                border-right: 4px solid ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#ea580c' : '#065f46'};
                padding: 15px 20px;
                margin: 30px 0 20px 0;
                font-size: 22px;
                font-weight: 700;
                color: ${isGroundBeams || isGroundSlab || isColumnTies || isSteelColumnBase ? '#9a3412' : '#065f46'};
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
                <h1>${reportTitle}</h1>
                <p>${reportSubtitle}</p>
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

              <div class="info-boxes">
                <div class="info-box">
                  <label>قطر القضيب</label>
                  <div class="value">${isGroundSlab ? '6' : (steelData?.barDiameter || inputs?.barDiameter || results?.barDiameter || report.steelData?.details?.inputs?.barDiameter || report.steelData?.details?.barDiameter || report.steelData?.details?.inputs?.rodDiameter || report.steelData?.details?.rodDiameter || 'N/A')} ملم</div>
                </div>
              </div>

              ${specificTablesHtml}

              <div class="footer">
                <p>تم إنشاء هذا التقرير بواسطة منصة المحترف لحساب الكميات</p>
                <p> 2025 جميع الحقوق محفوظة</p>
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
          description: `تم فتح ${reportTitle} للطباعة`,
        });

        setDownloading(null);
        return;
      }

      // Original concrete report code continues here...
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
              <p>تقرير كميات الخرسانة - طلبية خرسانة</p>
              <p>${report.calculationType === 'column-footings' ? 'شروش الأعمدة' : report.calculationType === 'columns' ? 'الأعمدة' : report.calculationType === 'roof' ? 'السقف' : report.calculationType === 'foundation' ? 'صبة النظافة والقواعد' : report.calculationType === 'ground-bridges' ? 'الجسور الأرضية' : report.calculationType === 'ground-slab' ? 'أرضية المبنى (المِدّة)' : 'تفصيل شامل لكميات المواد والمعدات'}</p>
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
              <span>عدد البنود: ${report.calculationType === 'column-footings' || report.calculationType === 'columns' || report.calculationType === 'roof' || report.calculationType === 'ground-bridges' || report.calculationType === 'ground-slab' ? '1' : '3'}</span>
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
                ${type === 'concrete' && report.concreteData
          ? report.calculationType === 'column-footings'
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
          : ''
        }
              </tbody>
            </table>

            <div class="total-box">
              <label>المجموع الكلي:</label>
              <div class="value">
                ${type === 'concrete' && report.concreteData
          ? report.calculationType === 'column-footings'
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
              <p> 2025 جميع الحقوق محفوظة</p>
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
          report.calculationType === 'columns' ? 'الأعمدة' :
            report.calculationType === 'roof' ? 'السقف' :
              report.calculationType === 'ground-bridges' ? 'الجسور الأرضية' :
                report.calculationType === 'ground-slab' ? 'أرضية المبنى (المِدّة)' :
                  report.calculationType === 'foundation-steel' ? 'حديد القواعد' :
                    report.calculationType === 'ground-beams-steel' ? 'حديد الجسور الأرضية' :
                      report.calculationType === 'ground-slab-steel' ? 'حديد أرضية المبنى' :
                        report.calculationType === 'roof-ribs-steel' ? 'حديد أعصاب السقف' :
                          report.calculationType === 'roof-slab-steel' ? 'حديد السقف' :
                            report.calculationType === 'column-ties-steel' ? 'حديد الأعمدة والكانات' :
                              report.calculationType === 'steel-column-base' ? 'حديد شروش الأعمدة' :
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

  const handleSendToOwner = async (reportId: string) => {
    setSendingToOwner(reportId);
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/${reportId}/send-to-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        // Update the report in state
        setReports(prev => prev.map(report =>
          report._id === reportId
            ? { ...report, sentToOwner: true, sentToOwnerAt: new Date().toISOString() }
            : report
        ));
        toast({
          title: 'تم الإرسال بنجاح',
          description: 'تم إرسال التقرير للمالك بنجاح',
        });
      } else {
        throw new Error(data.message || 'فشل إرسال التقرير');
      }
    } catch (error: any) {
      console.error('Error sending report to owner:', error);
      toast({
        title: 'خطأ في الإرسال',
        description: error.message || 'حدث خطأ أثناء إرسال التقرير للمالك',
        variant: 'destructive'
      });
    } finally {
      setSendingToOwner(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDeleteAllReports = async () => {
    setDeletingAll(true);
    try {
      const deletePromises = reports.map(report =>
        fetch(`http://localhost:5000/api/quantity-reports/${report._id}`, {
          method: 'DELETE'
        })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(responses.map(res => res.json()));

      const failedDeletes = results.filter(result => !result.success);

      if (failedDeletes.length === 0) {
        setReports([]);
        toast({
          title: 'تم الحذف بنجاح',
          description: `تم حذف جميع التقارير (${reports.length}) بنجاح`,
        });
      } else {
        throw new Error(`فشل في حذف ${failedDeletes.length} تقرير`);
      }
    } catch (error: any) {
      console.error('Error deleting all reports:', error);
      toast({
        title: 'خطأ في الحذف',
        description: error.message || 'حدث خطأ أثناء حذف التقارير',
        variant: 'destructive'
      });
    } finally {
      setDeletingAll(false);
      setDeleteAllDialog(false);
    }
  };



  // Calculate statistics
  const totalConcreteVolume = reports.reduce((sum, report) => {
    if (report.calculationType === 'column-footings') {
      return sum + (report.concreteData?.totalFootingsVolume || report.concreteData?.totalConcrete || 0);
    } else if (report.calculationType === 'columns') {
      return sum + (report.concreteData?.columnsVolume || report.concreteData?.totalConcrete || 0);
    } else if (report.calculationType === 'roof') {
      return sum + (report.concreteData?.totalConcrete || 0);
    } else if (report.calculationType === 'ground-bridges') {
      return sum + (report.concreteData?.totalVolume || report.concreteData?.totalConcrete || 0);
    } else if (report.calculationType === 'ground-slab') {
      return sum + (report.concreteData?.groundSlabVolume || report.concreteData?.totalConcrete || 0);
    } else {
      const cleaning = report.concreteData?.cleaningVolume || 0;
      const foundations = report.concreteData?.foundationsVolume || 0;
      const groundSlab = report.concreteData?.groundSlabVolume || 0;
      return sum + cleaning + foundations + groundSlab;
    }
  }, 0);

  const totalSteelWeight = reports.reduce((sum, report) => {
    return sum + (report.steelData?.totalSteelWeight || 0);
  }, 0);

  const sentReportsCount = reports.filter(report => report.sentToOwner).length;

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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
        <div className="text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">جاري تحميل التقارير</h2>
            <p className="text-slate-600">يرجى الانتظار بينما نحضر بيانات التقارير...</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl" style={{ fontSize: '16px' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/engineer/quantity-reports">
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-300 px-4 py-2 rounded-lg">
              <ArrowRight className="w-4 h-4" />
              العودة لقائمة المشاريع
            </Button>
          </Link>
        </div>

        {/* Project Header */}
        <Card className="border-0 shadow-xl mb-8 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold mb-3">
                    {projectInfo?.name || `مشروع #${projectId.slice(-6)}`}
                  </CardTitle>
                  <div className="flex flex-wrap gap-6 text-blue-100">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <User className="w-4 h-4" />
                      <span>المهندس: {projectInfo?.engineerName}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                      <User className="w-4 h-4" />
                      <span>المالك: {projectInfo?.ownerName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* No Reports State */}
        {reports.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">لا توجد تقارير لهذا المشروع</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                قم بإجراء حسابات الكميات من صفحة المشروع لإنشاء التقارير
              </p>
              <Link href={`/engineer/projects/${projectId}/concrete-cards`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all">
                  الذهاب لحسابات الخرسانة
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-md">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <BarChart3 className="w-4 h-4 ml-2" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 ml-2" />
                  التقارير
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 ml-2" />
                  التحليلات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-sm mb-1">إجمالي التقارير</p>
                          <p className="text-3xl font-bold text-slate-800">{reports.length}</p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center">
                            <Activity className="w-3 h-3 ml-1" />
                            نشط
                          </p>
                        </div>
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="w-7 h-7 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-sm mb-1">إجمالي الخرسانة</p>
                          <p className="text-3xl font-bold text-emerald-600">{totalConcreteVolume.toFixed(2)}</p>
                          <p className="text-xs text-slate-500 mt-1">م³</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Blocks className="w-7 h-7 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-sm mb-1">إجمالي الحديد</p>
                          <p className="text-3xl font-bold text-indigo-600">{totalSteelWeight.toFixed(2)}</p>
                          <p className="text-xs text-slate-500 mt-1">كجم</p>
                        </div>
                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Package className="w-7 h-7 text-indigo-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-sm mb-1">تم الإرسال للمالك</p>
                          <p className="text-3xl font-bold text-blue-600">{sentReportsCount}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {reports.length > 0 ? `${((sentReportsCount / reports.length) * 100).toFixed(0)}%` : '0%'}
                          </p>
                        </div>
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                          <Send className="w-7 h-7 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart Placeholder */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      نظرة عامة على كميات المواد
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-4">معلومات المشروع</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-700">اسم المشروع</span>
                          <span className="font-bold text-indigo-800">{projectInfo?.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-700">المهندس المسؤول</span>
                          <span className="font-bold text-indigo-800">{projectInfo?.engineerName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-700">المالك</span>
                          <span className="font-bold text-indigo-800">{projectInfo?.ownerName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-700">عدد التقارير</span>
                          <span className="font-bold text-indigo-800">{reports.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-indigo-700">تم الإرسال للمالك</span>
                          <span className="font-bold text-indigo-800">{sentReportsCount}/{reports.length}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                {/* Delete All Reports Button */}
                {reports.length > 0 && (
                  <div className="mb-6 flex justify-end">
                    <Button
                      onClick={() => setDeleteAllDialog(true)}
                      disabled={deletingAll}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      {deletingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          جاري حذف جميع التقارير...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف جميع التقارير ({reports.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Reports Cards - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {/* Foundation Report Card */}
                  {foundationReport && (
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Blocks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                              <CardDescription className="text-emerald-100">
                                صبة النظافة والقواعد
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {foundationReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم صبة النظافة</span>
                              <span className="font-bold text-emerald-600">
                                {foundationReport.concreteData.cleaningVolume?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم القواعد</span>
                              <span className="font-bold text-emerald-600">
                                {foundationReport.concreteData.foundationsVolume?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            {foundationReport.concreteData.groundSlabVolume && foundationReport.concreteData.groundSlabVolume > 0 && (
                              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="text-slate-600 font-medium">حجم أرضية المبنى</span>
                                <span className="font-bold text-emerald-600">
                                  {foundationReport.concreteData.groundSlabVolume.toFixed(3)} م³
                                </span>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                              <span className="font-bold text-slate-800">إجمالي الخرسانة</span>
                              <span className="text-2xl font-black text-emerald-600">
                                {(() => {
                                  const cleaning = foundationReport.concreteData.cleaningVolume || 0;
                                  const foundations = foundationReport.concreteData.foundationsVolume || 0;
                                  const groundSlab = foundationReport.concreteData.groundSlabVolume || 0;
                                  const total = cleaning + foundations + groundSlab;
                                  return total.toFixed(3);
                                })()} م³
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(foundationReport._id, 'concrete')}
                            disabled={downloading === `${foundationReport._id}-concrete`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${foundationReport._id}-concrete` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة تقرير الخرسانة PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(foundationReport._id)}
                            disabled={sendingToOwner === foundationReport._id || foundationReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${foundationReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === foundationReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : foundationReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(foundationReport._id)}
                            disabled={deleting === foundationReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === foundationReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Column Footings Report Card */}
                  {columnFootingsReport && (
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Blocks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                              <CardDescription className="text-emerald-100">
                                شروش الأعمدة
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {columnFootingsReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم شروش الأعمدة</span>
                              <span className="font-bold text-emerald-600">
                                {columnFootingsReport.concreteData.totalFootingsVolume?.toFixed(3) ||
                                  columnFootingsReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            {columnFootingsReport.concreteData.numberOfColumns && (
                              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="text-slate-600 font-medium">عدد الأعمدة</span>
                                <span className="font-bold text-emerald-600">
                                  {columnFootingsReport.concreteData.numberOfColumns}
                                </span>
                              </div>
                            )}
                            {columnFootingsReport.concreteData.finalColumnDimensions?.displayText && (
                              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="text-slate-600 font-medium">أبعاد العمود</span>
                                <span className="font-bold text-emerald-600">
                                  {columnFootingsReport.concreteData.finalColumnDimensions.displayText}
                                </span>
                              </div>
                            )}
                            <Separator className="my-2" />
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
                            onClick={() => downloadPDF(columnFootingsReport._id, 'concrete')}
                            disabled={downloading === `${columnFootingsReport._id}-concrete`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${columnFootingsReport._id}-concrete` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة تقرير الخرسانة PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(columnFootingsReport._id)}
                            disabled={sendingToOwner === columnFootingsReport._id || columnFootingsReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${columnFootingsReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === columnFootingsReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : columnFootingsReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(columnFootingsReport._id)}
                            disabled={deleting === columnFootingsReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === columnFootingsReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Columns Report Card */}
                  {columnsReport && (
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Blocks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                              <CardDescription className="text-emerald-100">
                                الأعمدة
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {columnsReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم الأعمدة</span>
                              <span className="font-bold text-emerald-600">
                                {columnsReport.concreteData.columnsVolume?.toFixed(3) ||
                                  columnsReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            {columnsReport.concreteData.columnsData && columnsReport.concreteData.columnsData.length > 0 && (
                              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="text-slate-600 font-medium">عدد الأعمدة</span>
                                <span className="font-bold text-emerald-600">
                                  {columnsReport.concreteData.columnsData.length}
                                </span>
                              </div>
                            )}
                            <Separator className="my-2" />
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
                            onClick={() => downloadPDF(columnsReport._id, 'concrete')}
                            disabled={downloading === `${columnsReport._id}-concrete`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${columnsReport._id}-concrete` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة تقرير الخرسانة PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(columnsReport._id)}
                            disabled={sendingToOwner === columnsReport._id || columnsReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${columnsReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === columnsReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : columnsReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(columnsReport._id)}
                            disabled={deleting === columnsReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === columnsReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Roof Report Card */}
                  {roofReport && (
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Blocks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                              <CardDescription className="text-emerald-100">
                                السقف
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {roofReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم السقف</span>
                              <span className="font-bold text-emerald-600">
                                {roofReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            {roofReport.concreteData.roofData && (
                              <>
                                {roofReport.concreteData.roofData.area && (
                                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <span className="text-slate-600 font-medium">مساحة السقف</span>
                                    <span className="font-bold text-emerald-600">
                                      {roofReport.concreteData.roofData.area.toFixed(2)} م²
                                    </span>
                                  </div>
                                )}
                                {roofReport.concreteData.roofData.roofType && (
                                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <span className="text-slate-600 font-medium">نوع السقف</span>
                                    <span className="font-bold text-emerald-600">
                                      {roofReport.concreteData.roofData.roofType === 'with-ribs' ? 'مع ربس' : 'بدون ربس'}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            <Separator className="my-2" />
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
                            onClick={() => downloadPDF(roofReport._id, 'concrete')}
                            disabled={downloading === `${roofReport._id}-concrete`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${roofReport._id}-concrete` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة تقرير الخرسانة PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(roofReport._id)}
                            disabled={sendingToOwner === roofReport._id || roofReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${roofReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === roofReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : roofReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(roofReport._id)}
                            disabled={deleting === roofReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === roofReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Ground Bridges Report Card */}
                  {groundBridgesReport && (
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Blocks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                              <CardDescription className="text-emerald-100">
                                الجسور الأرضية
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {groundBridgesReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم الجسور الأرضية</span>
                              <span className="font-bold text-emerald-600">
                                {groundBridgesReport.concreteData.totalVolume?.toFixed(3) ||
                                  groundBridgesReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            {groundBridgesReport.concreteData.bridgesCount && (
                              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="text-slate-600 font-medium">عدد الجسور</span>
                                <span className="font-bold text-emerald-600">
                                  {groundBridgesReport.concreteData.bridgesCount}
                                </span>
                              </div>
                            )}
                            <Separator className="my-2" />
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
                            onClick={() => downloadPDF(groundBridgesReport._id, 'concrete')}
                            disabled={downloading === `${groundBridgesReport._id}-concrete`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${groundBridgesReport._id}-concrete` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة تقرير الخرسانة PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(groundBridgesReport._id)}
                            disabled={sendingToOwner === groundBridgesReport._id || groundBridgesReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${groundBridgesReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === groundBridgesReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : groundBridgesReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(groundBridgesReport._id)}
                            disabled={deleting === groundBridgesReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === groundBridgesReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Ground Slab Report Card */}
                  {groundSlabReport && (
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/90 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Blocks className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl">تقرير كمية الخرسانة</CardTitle>
                              <CardDescription className="text-emerald-100">
                                أرضية المبنى (المِدّة)
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {groundSlabReport?.concreteData && (
                          <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-slate-600 font-medium">حجم أرضية المبنى</span>
                              <span className="font-bold text-emerald-600">
                                {groundSlabReport.concreteData.groundSlabVolume?.toFixed(3) ||
                                  groundSlabReport.concreteData.totalConcrete?.toFixed(3) || 0} م³
                              </span>
                            </div>
                            <Separator className="my-2" />
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
                            onClick={() => downloadPDF(groundSlabReport._id, 'concrete')}
                            disabled={downloading === `${groundSlabReport._id}-concrete`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${groundSlabReport._id}-concrete` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة تقرير الخرسانة PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(groundSlabReport._id)}
                            disabled={sendingToOwner === groundSlabReport._id || groundSlabReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${groundSlabReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === groundSlabReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : groundSlabReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(groundSlabReport._id)}
                            disabled={deleting === groundSlabReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === groundSlabReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Foundation Steel Report Card */}
                  {foundationSteelReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد القواعد
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {foundationSteelReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-green-100 mt-2">
                          تاريخ التقرير: {formatDate(foundationSteelReport.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4 mb-6">
                          {foundationSteelReport.steelData?.details?.results && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                                <p className="text-sm text-slate-600 mb-1">قطر القضيب</p>
                                <p className="text-xl font-black text-blue-700">
                                  {foundationSteelReport.steelData.details.inputs.barDiameter} ملم
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(foundationSteelReport._id, 'steel')}
                            disabled={downloading === `${foundationSteelReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${foundationSteelReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(foundationSteelReport._id)}
                            disabled={sendingToOwner === foundationSteelReport._id || foundationSteelReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${foundationSteelReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === foundationSteelReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : foundationSteelReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(foundationSteelReport._id)}
                            disabled={deleting === foundationSteelReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === foundationSteelReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Ground Beams Steel Report Card */}
                  {groundBeamsSteelReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد الجسور الأرضية
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {groundBeamsSteelReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-orange-100 mt-2">
                          تاريخ التقرير: {formatDate(groundBeamsSteelReport.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4 mb-6">
                          {groundBeamsSteelReport.steelData?.details?.results && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                                <p className="text-sm text-slate-600 mb-1">عدد الجسور</p>
                                <p className="text-xl font-black text-blue-700">
                                  {groundBeamsSteelReport.steelData.details.results.type === 'similar' ? (groundBeamsSteelReport.steelData.details.results.numberOfBeams || 0) : (groundBeamsSteelReport.steelData?.details?.results?.beams?.length || 0)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(groundBeamsSteelReport._id, 'steel')}
                            disabled={downloading === `${groundBeamsSteelReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${groundBeamsSteelReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(groundBeamsSteelReport._id)}
                            disabled={sendingToOwner === groundBeamsSteelReport._id || groundBeamsSteelReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${groundBeamsSteelReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === groundBeamsSteelReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : groundBeamsSteelReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(groundBeamsSteelReport._id)}
                            disabled={deleting === groundBeamsSteelReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === groundBeamsSteelReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Ground Slab Steel Report Card */}
                  {groundSlabSteelReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد أرضية المبنى
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {groundSlabSteelReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-orange-100 mt-2">
                          تاريخ التقرير: {formatDate(groundSlabSteelReport.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4 mb-6">
                          {groundSlabSteelReport.steelData?.details?.results && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl border-2 border-red-200">
                                <p className="text-sm text-slate-600 mb-1">نوع التسليح</p>
                                <p className="text-xl font-black text-red-700">
                                  {groundSlabSteelReport.steelData.details.results.type === 'mesh' ? 'شبك حديد' : 'حديد مفرق'}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border-2 border-amber-200">
                                <p className="text-sm text-slate-600 mb-1">
                                  {groundSlabSteelReport.steelData.details.results.type === 'mesh' ? 'عدد الشبك' : 'عدد القصبان'}
                                </p>
                                <p className="text-xl font-black text-amber-700">
                                  {groundSlabSteelReport.steelData.details.results.type === 'mesh' ? (groundSlabSteelReport.steelData.details.results.meshBars || 0) : (groundSlabSteelReport.steelData.details.results.separateBars || 0)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(groundSlabSteelReport._id, 'steel')}
                            disabled={downloading === `${groundSlabSteelReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${groundSlabSteelReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(groundSlabSteelReport._id)}
                            disabled={sendingToOwner === groundSlabSteelReport._id || groundSlabSteelReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${groundSlabSteelReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === groundSlabSteelReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : groundSlabSteelReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(groundSlabSteelReport._id)}
                            disabled={deleting === groundSlabSteelReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === groundSlabSteelReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Roof Ribs Steel Report Card */}
                  {roofRibsSteelReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد أعصاب السقف
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {roofRibsSteelReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-purple-100 mt-2">
                          تاريخ التقرير: {formatDate(roofRibsSteelReport.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                            <p className="text-sm text-slate-500 font-medium mb-1">المساحة المطلوبة</p>
                            <p className="text-2xl font-bold text-slate-800">
                              {roofRibsSteelReport.steelData?.details?.results?.requiredBarArea || 0} <span className="text-sm font-normal text-slate-500">سم²</span>
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                            <p className="text-sm text-slate-500 font-medium mb-1">عدد القضبان</p>
                            <p className="text-2xl font-bold text-slate-800">
                              {roofRibsSteelReport.steelData?.details?.results?.numberOfBars || 0}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(roofRibsSteelReport._id, 'steel')}
                            disabled={downloading === `${roofRibsSteelReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${roofRibsSteelReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(roofRibsSteelReport._id)}
                            disabled={sendingToOwner === roofRibsSteelReport._id || roofRibsSteelReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${roofRibsSteelReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === roofRibsSteelReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : roofRibsSteelReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(roofRibsSteelReport._id)}
                            disabled={deleting === roofRibsSteelReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === roofRibsSteelReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Roof Slab Steel Report Card */}
                  {roofSlabSteelReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد السقف
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {roofSlabSteelReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-rose-100 mt-2">
                          تاريخ التقرير: {formatDate(roofSlabSteelReport.updatedAt)}
                        </CardDescription>
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
                                <p className="text-sm text-slate-600 mb-1">
                                  {roofSlabSteelReport.steelData.details.results.type === 'mesh' ? 'عدد الشبك' : 'عدد القصبان'}
                                </p>
                                <p className="text-xl font-black text-amber-700">
                                  {roofSlabSteelReport.steelData.details.results.type === 'mesh' ? (roofSlabSteelReport.steelData.details.results.meshBars || 0) : (roofSlabSteelReport.steelData.details.results.separateBars || 0)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(roofSlabSteelReport._id, 'steel')}
                            disabled={downloading === `${roofSlabSteelReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:via-orange-700 hover:to-amber-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${roofSlabSteelReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(roofSlabSteelReport._id)}
                            disabled={sendingToOwner === roofSlabSteelReport._id || roofSlabSteelReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${roofSlabSteelReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === roofSlabSteelReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : roofSlabSteelReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(roofSlabSteelReport._id)}
                            disabled={deleting === roofSlabSteelReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === roofSlabSteelReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Steel Column Base Report Card */}
                  {steelColumnBaseReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد شروش الأعمدة
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {steelColumnBaseReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-indigo-100 mt-2">
                          تاريخ التقرير: {formatDate(steelColumnBaseReport.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4 mb-6">
                          {steelColumnBaseReport.steelData?.details && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border-2 border-indigo-200">
                                <p className="text-sm text-slate-600 mb-1">طول الشرش</p>
                                <p className="text-xl font-black text-indigo-700">
                                  {steelColumnBaseReport.steelData.details.starterLength?.toFixed(2) || 0} م
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border-2 border-cyan-200">
                                <p className="text-sm text-slate-600 mb-1">عدد القضبان</p>
                                <p className="text-xl font-black text-cyan-700">
                                  {steelColumnBaseReport.steelData.details.numBars || 0}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                                <p className="text-sm text-slate-600 mb-1">أبعاد الشرش</p>
                                <p className="text-lg font-black text-blue-700">
                                  {steelColumnBaseReport.steelData.details.dimensionText || 'غير محدد'}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border-2 border-emerald-200">
                                <p className="text-sm text-slate-600 mb-1">الوزن الإجمالي</p>
                                <p className="text-xl font-black text-emerald-700">
                                  {steelColumnBaseReport.steelData.totalSteelWeight?.toFixed(2) || 0} كجم
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(steelColumnBaseReport._id, 'steel')}
                            disabled={downloading === `${steelColumnBaseReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-700 hover:via-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${steelColumnBaseReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(steelColumnBaseReport._id)}
                            disabled={sendingToOwner === steelColumnBaseReport._id || steelColumnBaseReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${steelColumnBaseReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === steelColumnBaseReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : steelColumnBaseReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(steelColumnBaseReport._id)}
                            disabled={deleting === steelColumnBaseReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === steelColumnBaseReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Column Ties Steel Report Card */}
                  {columnTiesSteelReport && (
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl flex items-center gap-3">
                            <Blocks className="w-6 h-6" />
                            تقرير حديد الأعمدة والكانات
                          </CardTitle>
                          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                            {columnTiesSteelReport.sentToOwner ? 'تم الإرسال' : 'محفوظ'}
                          </Badge>
                        </div>
                        <CardDescription className="text-pink-100 mt-2">
                          تاريخ التقرير: {formatDate(columnTiesSteelReport.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4 mb-6">
                          {columnTiesSteelReport.steelData?.details?.results && (
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-200">
                                <p className="text-sm text-slate-600 mb-1">قطر القضيب</p>
                                <p className="text-xl font-black text-pink-700">
                                  {columnTiesSteelReport.steelData?.details?.inputs?.rodDiameterMm || columnTiesSteelReport.steelData?.details?.inputs?.rodDiameter || 0} مم
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-200">
                                <p className="text-sm text-slate-600 mb-1">عدد القضبان</p>
                                <p className="text-xl font-black text-pink-700">
                                  {columnTiesSteelReport.steelData.details.results.verticalBarsCount || 0}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                                <p className="text-sm text-slate-600 mb-1">الوزن</p>
                                <p className="text-xl font-black text-blue-700">
                                  {columnTiesSteelReport.steelData.details.results.rodWeight?.toFixed(2) || 0} كجم
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={() => downloadPDF(columnTiesSteelReport._id, 'steel')}
                            disabled={downloading === `${columnTiesSteelReport._id}-steel`}
                            className="w-full h-14 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 hover:from-pink-700 hover:via-rose-700 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {downloading === `${columnTiesSteelReport._id}-steel` ? (
                              <Loader2 className="w-5 h-5 animate-spin ml-2" />
                            ) : (
                              <Printer className="w-5 h-5 ml-2" />
                            )}
                            طباعة التقرير PDF
                          </Button>

                          <Button
                            onClick={() => handleSendToOwner(columnTiesSteelReport._id)}
                            disabled={sendingToOwner === columnTiesSteelReport._id || columnTiesSteelReport.sentToOwner}
                            className={`w-full h-12 font-bold shadow-lg hover:shadow-xl transition-all ${columnTiesSteelReport.sentToOwner
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                              }`}
                          >
                            {sendingToOwner === columnTiesSteelReport._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                جاري الإرسال...
                              </>
                            ) : columnTiesSteelReport.sentToOwner ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                تم الإرسال للمالك
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال التقرير للمالك
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleDeleteReport(columnTiesSteelReport._id)}
                            disabled={deleting === columnTiesSteelReport._id}
                            variant="destructive"
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            {deleting === columnTiesSteelReport._id ? (
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
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}


                </div>


              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                {/* Analytics Charts */}
                <div className="mb-8">
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                      <CardTitle className="flex items-center gap-3 text-slate-800">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        إحصائيات المشروع
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">إجمالي التقارير</p>
                              <p className="text-2xl font-bold text-slate-800">{reports.length}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">معدل الإرسال</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {reports.length > 0 ? `${((sentReportsCount / reports.length) * 100).toFixed(0)}%` : '0%'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <Blocks className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">إجمالي الخرسانة</p>
                              <p className="text-2xl font-bold text-slate-800">{totalConcreteVolume.toFixed(2)} م³</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">إجمالي الحديد</p>
                            <p className="text-2xl font-bold text-indigo-600">{totalSteelWeight.toFixed(2)} كجم</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">آخر تقرير</p>
                              <p className="text-lg font-bold text-slate-800">
                                {reports.length > 0 ? formatDate(reports.sort((a, b) =>
                                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                                )[0].updatedAt) : 'لا يوجد'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">الحالة</p>
                            <p className="text-lg font-bold text-green-600">
                              {sentReportsCount === reports.length && reports.length > 0 ? 'مكتمل' : 'قيد التنفيذ'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>


              </TabsContent>
            </Tabs>
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
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-right text-base leading-relaxed">
                <p>هل أنت متأكد من حذف تقرير:</p>
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

      {/* Delete All Reports Dialog */}
      <AlertDialog open={deleteAllDialog} onOpenChange={setDeleteAllDialog}>
        <AlertDialogContent className="max-w-lg" dir="rtl">
          <AlertDialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <AlertDialogTitle className="text-right text-xl font-bold">
                تأكيد حذف جميع التقارير
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-right text-base leading-relaxed">
                <p>هل أنت متأكد من حذف جميع التقارير؟</p>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <div className="font-bold text-amber-800 text-lg mb-2">
                    سيتم حذف {reports.length} تقرير
                  </div>
                  <div className="text-amber-700 text-sm">
                    <div className="flex items-center gap-2">
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
                    سيتم حذف جميع التقارير وبياناتها بشكل دائم
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
              onClick={handleDeleteAllReports}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white text-base font-medium"
            >
              {deletingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف جميع التقارير
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}