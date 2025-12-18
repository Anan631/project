"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, PlusCircle, MapPin, Calendar, HardHat, Building, User, 
  DollarSign, Mail, Check, AlertCircle, ArrowLeft, Save, Info, 
  FileText, Clock, TrendingUp, Briefcase, Home, Archive,
  ChevronLeft, ChevronRight, Sparkles, Target, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addProject as dbAddProject, type Project, type ProjectStatusType } from '@/lib/db';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const createProjectSchema = z.object({
  projectName: z.string().min(3, { message: "اسم المشروع مطلوب (3 أحرف على الأقل)." }),
  location: z.string().min(3, { message: "موقع المشروع مطلوب." }),
  description: z.string().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "تاريخ البدء غير صالح." }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "تاريخ الانتهاء غير صالح." }),
  status: z.enum(['مخطط له', 'قيد التنفيذ', 'مكتمل', 'مؤرشف'], {
    required_error: "حالة المشروع مطلوبة."
  }),
  engineer: z.string().min(3, { message: "اسم المهندس مطلوب." }), 
  clientName: z.string().min(3, { message: "اسم العميل/المالك مطلوب." }),
  budget: z.preprocess((val) => {
    if (val === '' || val === null || typeof val === 'undefined' || Number.isNaN(val)) {
      return undefined;
    }
    return typeof val === 'number' ? val : Number(val);
  }, z.number().positive({ message: "الميزانية يجب أن تكون رقمًا موجبًا." }).optional()),
  linkedOwnerEmail: z.preprocess((val) => {
    return val === '' ? undefined : val;
  }, z.string().email({ message: "بريد المالك الإلكتروني غير صالح." }).optional())
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "تاريخ الانتهاء يجب أن يكون بعد أو نفس تاريخ البدء.",
  path: ["endDate"],
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const projectStatusOptions: { value: ProjectStatusType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'مخطط له', label: 'مخطط له', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-500' },
  { value: 'قيد التنفيذ', label: 'قيد التنفيذ', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-orange-500' },
  { value: 'مكتمل', label: 'مكتمل', icon: <Check className="h-4 w-4" />, color: 'bg-green-500' },
  { value: 'مؤرشف', label: 'مؤرشف', icon: <Archive className="h-4 w-4" />, color: 'bg-gray-500' },
];

const formSteps = [
  { 
    id: 1, 
    title: 'المعلومات الأساسية', 
    description: 'اسم المشروع والموقع',
    icon: <Building className="h-5 w-5" />
  },
  { 
    id: 2, 
    title: 'التفاصيل والجدول', 
    description: 'الوصف والتواريخ والمرحلة',
    icon: <FileText className="h-5 w-5" />
  },
  { 
    id: 3, 
    title: 'المعلومات المالية', 
    description: 'الميزانية والمالك',
    icon: <DollarSign className="h-5 w-5" />
  },
];

export default function CreateProjectPage() {
  const { toast } = useToast();
  const router = useRouter(); 
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isValid }, 
    reset, 
    control, 
    setValue, 
    watch, 
    trigger 
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      engineer: "",
      status: 'مخطط له',
    },
    mode: 'onChange'
  });

  // Watch form values for progress calculation
  const watchedValues = watch();
  
  // Calculate form progress
  useEffect(() => {
    const fields = ['projectName', 'location', 'description', 'startDate', 'endDate', 'status', 'engineer', 'clientName'];
    const filledFields = fields.filter(field => watchedValues[field as keyof CreateProjectFormValues]);
    const progress = (filledFields.length / fields.length) * 100;
    setFormProgress(progress);
    setIsFormValid(isValid);
  }, [watchedValues, isValid]);

  useEffect(() => {
    const engineerNameFromStorage = localStorage.getItem('userName');
    const idFromStorage = localStorage.getItem('userId');
    setUserId(idFromStorage);
    
    if (engineerNameFromStorage) {
      setValue('engineer', engineerNameFromStorage);
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على معلومات المهندس. يرجى تسجيل الدخول مرة أخرى.",
        variant: "destructive"
      });
      router.push('/login');
    }
  }, [setValue, router, toast]);

  const nextStep = useCallback(async () => {
    const fieldsToValidate = currentStep === 1 
      ? ['projectName', 'location'] 
      : currentStep === 2 
        ? ['description', 'startDate', 'endDate', 'status'] 
        : ['clientName'];
    
    const isStepValid = await trigger(fieldsToValidate as any);
    
    if (isStepValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const onSubmit: SubmitHandler<CreateProjectFormValues> = async (data) => {
    setIsLoading(true);
    
    try {
      const projectDataForDb: Omit<Project, 'id' | 'overallProgress' | 'photos' | 'timelineTasks' | 'comments' | 'createdAt'> = {
        name: data.projectName,
        location: data.location,
        description: data.description || '',
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status as ProjectStatusType,
        engineer: data.engineer,
        clientName: data.clientName,
        budget: data.budget,
        linkedOwnerEmail: data.linkedOwnerEmail,
        quantitySummary: ""
      };

      const newProject = await dbAddProject(projectDataForDb, userId || undefined);

      if (newProject) {
        toast({
          title: "🎉 تم إنشاء المشروع بنجاح",
          description: `مشروع "${newProject.name}" جاهز الآن للإدارة والمتابعة.`,
          variant: "default",
        });
        reset();
        router.push(`/engineer/projects/${newProject.id}`);
      } else {
        toast({
          title: "❌ خطأ في إنشاء المشروع",
          description: "لم يتمكن النظام من إنشاء المشروع. يرجى المحاولة مرة أخرى.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "❌ خطأ في إنشاء المشروع",
        description: "حدث خطأ غير متوقع أثناء إنشاء المشروع.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/10 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900 group">
              <Link href="/engineer/projects" className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                <span>العودة إلى المشاريع</span>
              </Link>
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Home className="h-4 w-4" />
              <span>/</span>
              <span>المشاريع</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">إنشاء مشروع جديد</span>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl mb-2 shadow-2xl shadow-red-200"
            >
              <Building className="h-12 w-12 text-white" />
            </motion.div>
            
            <div className="space-y-3">
              <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-0 px-4 py-1.5">
                <Sparkles className="h-3 w-3 ml-1" />
                نظام إدارة المشاريع الإنشائية
              </Badge>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                إنشاء مشروع جديد
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                ابدأ رحلة مشروعك الإنشائي بإدخال التفاصيل الأساسية لإدارة فعالة ومتابعة دقيقة
              </p>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <Target className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">مراحل إنشاء المشروع</h2>
                    <p className="text-gray-500 text-sm">اتبع الخطوات لإكمال بيانات المشروع</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{Math.round(formProgress)}%</div>
                  <div className="text-sm text-gray-500">مكتمل</div>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>بداية المشروع</span>
                  <span>اكتمال البيانات</span>
                </div>
                <Progress value={formProgress} className="h-3 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${formProgress}%` }}
                  />
                </Progress>
              </div>

              {/* Enhanced Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {formSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 transition-all duration-300",
                      currentStep > step.id
                        ? "bg-green-50 border-green-200 shadow-lg"
                        : currentStep === step.id
                        ? "bg-white border-red-300 shadow-2xl scale-105"
                        : "bg-gray-50/50 border-gray-200"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold transition-all duration-300",
                        currentStep > step.id
                          ? "bg-green-500 shadow-lg"
                          : currentStep === step.id
                          ? "bg-gradient-to-br from-red-500 to-orange-500 shadow-lg"
                          : "bg-gray-400"
                      )}>
                        {currentStep > step.id ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-bold text-lg mb-1",
                          currentStep >= step.id ? "text-gray-900" : "text-gray-500"
                        )}>
                          {step.title}
                        </h3>
                        <p className={cn(
                          "text-sm",
                          currentStep >= step.id ? "text-gray-600" : "text-gray-400"
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Connection line */}
                    {index < formSteps.length - 1 && (
                      <div className={cn(
                        "hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 transform -translate-y-1/2 transition-all duration-300",
                        currentStep > step.id ? "bg-green-400" : "bg-gray-300"
                      )} />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
                {/* Step 1: Basic Information */}
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="p-8 space-y-8"
                    >
                      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">المعلومات الأساسية</h3>
                          <p className="text-gray-600">أدخل البيانات الأساسية للمشروع الإنشائي</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <Label htmlFor="projectName" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <Building className="h-4 w-4 text-red-500" />
                              اسم المشروع
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                              id="projectName" 
                              type="text" 
                              {...register("projectName")} 
                              className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl text-lg" 
                              placeholder="مثال: بناء فيلا سكنية - مشروع مركز تجاري" 
                            />
                            {errors.projectName && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertCircle className="h-4 w-4" />
                                {errors.projectName.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="location" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <MapPin className="h-4 w-4 text-red-500" />
                              موقع المشروع
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                              id="location" 
                              type="text" 
                              {...register("location")} 
                              className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl text-lg" 
                              placeholder="مثال: مدينة الرياض، حي النرجس" 
                            />
                            {errors.location && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertCircle className="h-4 w-4" />
                                {errors.location.message}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-blue-900 mb-2">نصائح للمعلومات الأساسية</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                  <li>• اختر اسمًا واضحًا ومعبرًا عن طبيعة المشروع</li>
                                  <li>• حدد الموقع بدقة لتسهيل عملية المتابعة</li>
                                  <li>• يمكنك تعديل هذه البيانات لاحقًا عند الحاجة</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-gray-100">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            type="button" 
                            onClick={nextStep}
                            className="h-12 px-8 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <span>التالي</span>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 2: Details */}
                <AnimatePresence mode="wait">
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="p-8 space-y-8"
                    >
                      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                        <div className="p-3 bg-green-50 rounded-2xl">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">التفاصيل والجدول الزمني</h3>
                          <p className="text-gray-600">حدد وصف المشروع والتواريخ والمرحلة الحالية</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="description" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <FileText className="h-4 w-4 text-red-500" />
                              وصف المشروع
                            </Label>
                            <Textarea
                              id="description"
                              {...register("description")}
                              rows={5}
                              className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl resize-none text-lg min-h-[120px]"
                              placeholder="صف بإيجاز طبيعة المشروع، أهدافه، وأهم مكوناته..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="startDate" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                                <Calendar className="h-4 w-4 text-red-500" />
                                تاريخ البدء
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input 
                                id="startDate" 
                                type="date" 
                                {...register("startDate")} 
                                className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl"
                              />
                              {errors.startDate && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  {errors.startDate.message}
                                </motion.p>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              <Label htmlFor="endDate" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                                <Calendar className="h-4 w-4 text-red-500" />
                                تاريخ الانتهاء
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input 
                                id="endDate" 
                                type="date" 
                                {...register("endDate")} 
                                className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl"
                              />
                              {errors.endDate && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  {errors.endDate.message}
                                </motion.p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="engineer" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <HardHat className="h-4 w-4 text-red-500" />
                              المهندس المسؤول
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                              id="engineer" 
                              type="text" 
                              {...register("engineer")} 
                              className="h-14 bg-gray-50 border-2 border-gray-200 cursor-not-allowed rounded-xl text-lg" 
                              readOnly 
                              placeholder="جاري تحميل اسم المهندس..." 
                            />
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="status" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <TrendingUp className="h-4 w-4 text-red-500" />
                              المرحلة الحالية
                              <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                              name="status"
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                                  <SelectTrigger id="status" className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl text-lg">
                                    <SelectValue placeholder="اختر الحالة" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-2 border-gray-200">
                                    {projectStatusOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value} className="py-4">
                                        <div className="flex items-center gap-3">
                                          <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                                          {option.icon}
                                          <span className="font-medium">{option.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            {errors.status && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertCircle className="h-4 w-4" />
                                {errors.status.message}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-6 border-t border-gray-100">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={prevStep}
                            className="h-12 px-8 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-xl transition-all duration-300"
                          >
                            <ChevronRight className="h-4 w-4 ml-2" />
                            <span>السابق</span>
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            type="button" 
                            onClick={nextStep}
                            className="h-12 px-8 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <span>التالي</span>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 3: Budget and Owner */}
                <AnimatePresence mode="wait">
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="p-8 space-y-8"
                    >
                      <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                        <div className="p-3 bg-purple-50 rounded-2xl">
                          <DollarSign className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">المعلومات المالية والمالك</h3>
                          <p className="text-gray-600">أدخل بيانات الميزانية والعميل</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label htmlFor="clientName" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <User className="h-4 w-4 text-red-500" />
                              اسم العميل/المالك
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                              id="clientName" 
                              type="text" 
                              {...register("clientName")} 
                              className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl text-lg" 
                              placeholder="اسم صاحب المشروع" 
                            />
                            {errors.clientName && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertCircle className="h-4 w-4" />
                                {errors.clientName.message}
                              </motion.p>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <Label htmlFor="budget" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <DollarSign className="h-4 w-4 text-red-500" />
                              الميزانية التقديرية (شيكل)
                              <span className="text-gray-400 text-sm font-normal">(اختياري)</span>
                            </Label>
                            <div className="relative">
                              <Input 
                                id="budget" 
                                type="number" 
                                {...register("budget", { valueAsNumber: true })} 
                                className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl text-lg pl-12" 
                                placeholder="1500000" 
                              />
                              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">
                                ₪
                              </div>
                            </div>
                            {errors.budget && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertCircle className="h-4 w-4" />
                                {errors.budget.message}
                              </motion.p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="linkedOwnerEmail" className="flex items-center gap-2 text-gray-700 font-semibold text-base">
                              <Mail className="h-4 w-4 text-red-500" />
                              بريد المالك الإلكتروني
                              <span className="text-gray-400 text-sm font-normal">(اختياري)</span>
                            </Label>
                            <Input 
                              id="linkedOwnerEmail" 
                              type="email" 
                              {...register("linkedOwnerEmail")} 
                              className="h-14 border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all duration-200 rounded-xl text-lg" 
                              placeholder="owner@example.com" 
                            />
                            {errors.linkedOwnerEmail && (
                              <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertCircle className="h-4 w-4" />
                                {errors.linkedOwnerEmail.message}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                              <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-purple-900 mb-3">معلومات مهمة</h4>
                                <ul className="text-sm text-purple-700 space-y-2">
                                  <li className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>سيتم إنشاء المشروع تلقائيًا بحالة "مخطط له"</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>يمكنك تعديل جميع البيانات لاحقًا من صفحة المشروع</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>سيتم إرسال رسالة ترحيب إلى بريد المالك إذا تم إدخاله</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between pt-6 border-t border-gray-100">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={prevStep}
                            className="h-12 px-8 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-xl transition-all duration-300"
                          >
                            <ChevronRight className="h-4 w-4 ml-2" />
                            <span>السابق</span>
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            type="submit" 
                            className="h-14 px-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
                            disabled={isLoading || !isFormValid}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                <span>جاري الإنشاء...</span>
                              </>
                            ) : (
                              <>
                                <Save className="ml-2 h-5 w-5" />
                                <span>إنشاء المشروع</span>
                                <Sparkles className="mr-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-gray-500 text-sm"
        >
          <p>
            تحتاج مساعدة؟ 
            <Link href="/help" className="text-red-600 hover:text-red-700 font-medium mx-1">
              راجع دليل المستخدم
            </Link>
            أو
            <Link href="/contact" className="text-red-600 hover:text-red-700 font-medium mx-1">
              اتصل بالدعم الفني
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}