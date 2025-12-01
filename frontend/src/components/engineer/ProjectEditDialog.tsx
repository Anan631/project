"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, Building, MapPin, User, Mail, Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { updateProjectAction } from '@/app/engineer/projects/actions';
import { updateProjectSchema, type UpdateProjectFormValues } from '@/app/engineer/projects/schemas';
import type { Project, ProjectStatusType } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  project: Project | null;
}

const projectStatusOptions: { value: ProjectStatusType; label: string; color: string }[] = [
    { value: 'مخطط له', label: 'مخطط له', color: 'bg-amber-500' },
    { value: 'قيد التنفيذ', label: 'قيد التنفيذ', color: 'bg-blue-500' },
    { value: 'مكتمل', label: 'مكتمل', color: 'bg-emerald-500' },
    { value: 'مؤرشف', label: 'مؤرشف', color: 'bg-gray-500' },
];

export default function EditProjectDialog({ isOpen, onClose, onProjectUpdated, project }: EditProjectDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control, setError } = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(updateProjectSchema),
  });

  useEffect(() => {
    if (project && isOpen) {
      reset({
        projectId: project.id.toString(),
        name: project.name,
        location: project.location,
        description: project.description,
        startDate: new Date(project.startDate).toISOString().split('T')[0],
        endDate: new Date(project.endDate).toISOString().split('T')[0],
        status: project.status,
        clientName: project.clientName || '',
        budget: project.budget,
        linkedOwnerEmail: project.linkedOwnerEmail,
      });
    }
  }, [project, isOpen, reset]);

  const onSubmit: SubmitHandler<UpdateProjectFormValues> = async (data) => {
    setIsLoading(true);
    const result = await updateProjectAction(data);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "🎉 تم تحديث المشروع بنجاح",
        description: result.message || "تم تحديث بيانات المشروع بنجاح.",
        variant: "default",
      });
      onProjectUpdated();
      onClose();
    } else {
      toast({
        title: "❌ خطأ في تحديث المشروع",
        description: result.message || "حدث خطأ ما أثناء تحديث المشروع.",
        variant: "destructive",
      });
      if (result.fieldErrors) {
        Object.keys(result.fieldErrors).forEach((key) => {
          setError(key as keyof UpdateProjectFormValues, {
            type: 'server',
            message: result.fieldErrors[key]?.join(', '),
          });
        });
      }
    }
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto text-right bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
        {/* Header Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 absolute top-0 left-0 right-0 rounded-t-lg" />
        
        <DialogHeader className="pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                تعديل المشروع
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
                  {project.name}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base mt-1">
                قم بتحديث تفاصيل المشروع الإنشائي للحفاظ على بيانات دقيقة ومحدثة
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-1 space-y-6">
            {/* Basic Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-lg">المعلومات الأساسية</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Building className="h-4 w-4 text-blue-500" />
                    اسم المشروع
                  </Label>
                  <Input 
                    id="edit-name" 
                    {...register("name")} 
                    className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="أدخل اسم المشروع..."
                  />
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location" className="flex items-center gap-2 text-gray-700 font-medium">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    موقع المشروع
                  </Label>
                  <Input 
                    id="edit-location" 
                    {...register("location")} 
                    className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="موقع المشروع..."
                  />
                  <AnimatePresence>
                    {errors.location && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.location.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description" className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText className="h-4 w-4 text-blue-500" />
                  وصف المشروع
                </Label>
                <Textarea 
                  id="edit-description" 
                  {...register("description")} 
                  className="min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none"
                  placeholder="وصف تفصيلي للمشروع وأهدافه..."
                />
                <AnimatePresence>
                  {errors.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                    >
                      <span>⚠️</span>
                      {errors.description.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Client & Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <User className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-800 text-lg">معلومات العميل والاتصال</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-clientName" className="flex items-center gap-2 text-gray-700 font-medium">
                    <User className="h-4 w-4 text-green-500" />
                    اسم العميل
                  </Label>
                  <Input 
                    id="edit-clientName" 
                    {...register("clientName")} 
                    className="h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200"
                    placeholder="اسم العميل أو المالك..."
                  />
                  <AnimatePresence>
                    {errors.clientName && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.clientName.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-linkedOwnerEmail" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Mail className="h-4 w-4 text-green-500" />
                    بريد المالك
                    <span className="text-gray-400 text-sm font-normal">(اختياري)</span>
                  </Label>
                  <Input 
                    id="edit-linkedOwnerEmail" 
                    type="email" 
                    {...register("linkedOwnerEmail")} 
                    className="h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200"
                    placeholder="example@email.com"
                  />
                  <AnimatePresence>
                    {errors.linkedOwnerEmail && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.linkedOwnerEmail.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Timeline & Budget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800 text-lg">الجدول الزمني والميزانية</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    تاريخ البدء
                  </Label>
                  <Input 
                    id="edit-startDate" 
                    type="date" 
                    {...register("startDate")} 
                    className="h-11 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  <AnimatePresence>
                    {errors.startDate && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.startDate.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-endDate" className="flex items-center gap-2 text-gray-700 font-medium">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    تاريخ الانتهاء
                  </Label>
                  <Input 
                    id="edit-endDate" 
                    type="date" 
                    {...register("endDate")} 
                    className="h-11 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  <AnimatePresence>
                    {errors.endDate && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.endDate.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-budget" className="flex items-center gap-2 text-gray-700 font-medium">
                    <DollarSign className="h-4 w-4 text-orange-500" />
                    الميزانية
                    <span className="text-gray-400 text-sm font-normal">(اختياري)</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="edit-budget" 
                      type="number" 
                      {...register("budget", { valueAsNumber: true })} 
                      className="h-11 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 pl-12"
                      placeholder="0.00"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium" title="شيكل">
                      ₪
                    </div>
                  </div>
                  <AnimatePresence>
                    {errors.budget && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.budget.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="flex items-center gap-2 text-gray-700 font-medium">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    حالة المشروع
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                        <SelectTrigger id="edit-status" className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-2 border-gray-200">
                          {projectStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value} className="py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                                <span className="font-medium">{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <AnimatePresence>
                    {errors.status && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200"
                      >
                        <span>⚠️</span>
                        {errors.status.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer - Enhanced Cancel Button */}
          <DialogFooter className="pt-6 pb-4 border-t border-gray-100 gap-3 flex-col sm:flex-row">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-8 border-2 border-gray-300 text-gray-700 hover:bg-red-600 hover:text-white hover:border-red-600 font-semibold transition-all duration-200 flex items-center gap-3 flex-1 sm:flex-none"
            >
              <X className="h-5 w-5" />
              <span className="text-base">إلغاء</span>
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-12 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-base">جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span className="text-base">حفظ التغييرات</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}