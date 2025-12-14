"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Calculator, HardHat, BarChart3, Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProjects, type Project } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function CalculateMaterialsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId');
      setUserId(id);
      return !!id;
    }
    return false;
  }, []);

  const fetchEngineerProjects = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const result = await getProjects(id);
      if (result.success && result.projects) {
        // Filter only active projects
        const activeProjects = result.projects.filter(
          p => p.status === 'قيد التنفيذ' || p.status === 'مخطط له'
        );
        setProjects(activeProjects);
      } else {
        toast({
          title: "خطأ",
          description: result.message || "فشل تحميل المشاريع.",
          variant: "destructive"
        });
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "خطأ فادح",
        description: "حدث خطأ أثناء تحميل بيانات المشاريع.",
        variant: "destructive"
      });
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const initializeData = async () => {
      const hasUser = await fetchUserData();
      if (hasUser && userId) {
        fetchEngineerProjects(userId);
      }
    };

    initializeData();
  }, [fetchUserData, fetchEngineerProjects, userId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 text-right" dir="rtl">
        <Card className="max-w-6xl mx-auto bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-app-red">حساب كميات المواد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 text-right" dir="rtl">
      <Card className="max-w-6xl mx-auto bg-white/95 shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <Calculator className="mx-auto h-16 w-16 text-app-gold mb-3" />
          <CardTitle className="text-3xl font-bold text-app-red">حساب كميات المواد</CardTitle>
          <CardDescription className="text-gray-600 mt-2 text-base">
            اختر مشروعاً من القائمة لحساب كميات الباطون أو الحديد
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg mb-2">لا توجد مشاريع نشطة</p>
              <p className="text-gray-500 text-sm mb-6">يجب أن يكون لديك مشاريع قيد التنفيذ أو مخطط لها لاستخدام هذه الميزة</p>
              <Button asChild>
                <Link href="/engineer/dashboard">
                  العودة إلى لوحة التحكم
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-gray-200 hover:border-app-gold transition-all shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-800 mb-2">{project.name}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={project.status === 'قيد التنفيذ' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          {project.location && (
                            <span className="text-sm text-gray-600">📍 {project.location}</span>
                          )}
                        </div>
                        {project.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        asChild
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12"
                      >
                        <Link href={`/engineer/projects/${project.id}/concrete-cards`}>
                          <HardHat className="h-5 w-5 ml-2" />
                          حساب كميات الباطون
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
                      >
                        <Link href={`/engineer/projects/${project.id}/steel-calculations`}>
                          <BarChart3 className="h-5 w-5 ml-2" />
                          حساب كميات الحديد
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full"
                      >
                        <Link href={`/engineer/projects/${project.id}`}>
                          عرض تفاصيل المشروع
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
