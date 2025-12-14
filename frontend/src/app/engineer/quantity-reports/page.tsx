"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Search,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  FolderOpen,
  BarChart3,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProjectReport {
  projectId: string;
  projectName: string;
  engineerName: string;
  ownerName: string;
  ownerEmail: string;
  reports: Array<{
    _id: string;
    calculationType: string;
    createdAt: string;
    updatedAt: string;
  }>;
  lastUpdated: string;
}

export default function QuantityReportsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [engineerId, setEngineerId] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setEngineerId(userId);
    
    if (userId) {
      fetchProjects(userId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProjects = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/quantity-reports/engineer/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReportTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      'foundation': { label: 'قواعد', color: 'bg-blue-500' },
      'cleaning-slab': { label: 'صبة نظافة', color: 'bg-green-500' },
      'columns': { label: 'أعمدة', color: 'bg-purple-500' },
      'beams': { label: 'كمرات', color: 'bg-orange-500' },
      'slabs': { label: 'بلاطات', color: 'bg-cyan-500' },
      'full': { label: 'شامل', color: 'bg-emerald-500' }
    };
    return types[type] || { label: type, color: 'bg-gray-500' };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">تقارير الكميات</h1>
              <p className="text-slate-600">عرض وتحميل تقارير كميات الخرسانة والحديد للمشاريع</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="البحث في المشاريع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 h-12 bg-white/80 border-slate-200 focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Projects Table */}
        {filteredProjects.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد تقارير</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إنشاء أي تقارير كميات بعد'}
              </p>
              <Link href="/engineer/projects">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  الذهاب للمشاريع
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                المشاريع ({filteredProjects.length})
              </CardTitle>
              <CardDescription className="text-emerald-100">
                اختر مشروعًا لعرض وتحميل التقارير
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-right font-bold">المشروع</TableHead>
                    <TableHead className="text-right font-bold">المالك</TableHead>
                    <TableHead className="text-right font-bold">التقارير</TableHead>
                    <TableHead className="text-right font-bold">آخر تحديث</TableHead>
                    <TableHead className="text-right font-bold">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow 
                      key={project.projectId}
                      className="hover:bg-emerald-50/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/engineer/quantity-reports/${project.projectId}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{project.projectName}</p>
                            <p className="text-sm text-slate-500">#{project.projectId.slice(-6)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{project.ownerName || 'غير محدد'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {project.reports.map((report) => {
                            const badge = getReportTypeBadge(report.calculationType);
                            return (
                              <Badge 
                                key={report._id}
                                className={`${badge.color} text-white text-xs`}
                              >
                                {badge.label}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(project.lastUpdated)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/engineer/quantity-reports/${project.projectId}`);
                          }}
                        >
                          <span>عرض التقارير</span>
                          <ArrowLeft className="w-4 h-4 mr-2" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
