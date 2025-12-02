"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, KeyRound, User, Shield, Lock, Info } from 'lucide-react';
import { adminChangePasswordAction, adminUpdateEmailAction, adminUpdateNameAction } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

// تعريف المخططات للتأكد من صحة البيانات
const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: 'كلمة المرور الحالية مطلوبة.' }),
  newPassword: z.string().min(6, { message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.' }),
  confirmPassword: z.string().min(6, { message: 'تأكيد كلمة المرور مطلوب.' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين.',
  path: ['confirmPassword'],
});

const emailSchema = z.object({
  currentPassword: z.string().min(6, { message: 'كلمة المرور مطلوبة للتحقق.' }),
  newEmail: z.string().email({ message: 'البريد الإلكتروني غير صالح.' }),
});

const nameSchema = z.object({
  currentPassword: z.string().min(6, { message: 'كلمة المرور مطلوبة للتحقق.' }),
  newName: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل.' }),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;
type NameFormValues = z.infer<typeof nameSchema>;

interface AdminProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
  adminName: string;
  adminEmail: string;
}

export default function AdminProfileDialog({ isOpen, onClose, adminId, adminName, adminEmail }: AdminProfileDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'password' | 'email' | 'name'>('password');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isNameLoading, setIsNameLoading] = useState(false);

  // نموذج تغيير كلمة المرور
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // نموذج تغيير البريد الإلكتروني
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      currentPassword: '',
      newEmail: adminEmail,
    },
  });

  // نموذج تغيير الاسم
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      currentPassword: '',
      newName: adminName,
    },
  });

  // إعادة تعيين النماذج عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      passwordForm.reset();
      emailForm.reset({ currentPassword: '', newEmail: adminEmail });
      nameForm.reset({ currentPassword: '', newName: adminName });
      setActiveTab('password');
    }
  }, [isOpen, passwordForm, emailForm, nameForm, adminEmail, adminName]);

  // إرسال نموذج تغيير كلمة المرور
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    const result = await adminChangePasswordAction(adminId, data.currentPassword, data.newPassword);
    setIsPasswordLoading(false);

    if (result.success) {
      toast({
        title: 'تم تغيير كلمة المرور',
        description: result.message,
      });
      passwordForm.reset();
    } else {
      toast({
        title: 'خطأ في تغيير كلمة المرور',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // إرسال نموذج تغيير البريد الإلكتروني
  const onEmailSubmit = async (data: EmailFormValues) => {
    setIsEmailLoading(true);
    const result = await adminUpdateEmailAction(adminId, data.newEmail, data.currentPassword);
    setIsEmailLoading(false);

    if (result.success) {
      toast({
        title: 'تم تحديث البريد الإلكتروني',
        description: result.message,
      });
      emailForm.reset({ currentPassword: '', newEmail: data.newEmail });
    } else {
      toast({
        title: 'خطأ في تحديث البريد الإلكتروني',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // إرسال نموذج تغيير الاسم
  const onNameSubmit = async (data: NameFormValues) => {
    setIsNameLoading(true);
    const result = await adminUpdateNameAction(adminId, data.newName, data.currentPassword);
    setIsNameLoading(false);

    if (result.success) {
      toast({
        title: 'تم تحديث الاسم',
        description: result.message,
      });
      nameForm.reset({ currentPassword: '', newName: data.newName });
    } else {
      toast({
        title: 'خطأ في تحديث الاسم',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 p-1">
          <div className="bg-white rounded-t-3xl p-6">
            <DialogHeader className="text-center items-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-sky-600 shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-sky-600 bg-clip-text text-transparent">
                إعدادات المشرف
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                إدارة كلمة المرور والبريد الإلكتروني لحساب المشرف
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6">
          {/* معلومات الحساب */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <User className="h-6 w-6 text-slate-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 text-lg">{adminName}</p>
                <p className="text-slate-600 text-sm">{adminEmail}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium rounded-lg">
                    <Shield className="h-3.5 w-3.5" />
                    مشرف
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* علامات التبويب */}
          <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('password')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                activeTab === 'password' 
                  ? "bg-white shadow-sm text-sky-600" 
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              <KeyRound className="h-4 w-4" />
              كلمة المرور
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                activeTab === 'email' 
                  ? "bg-white shadow-sm text-sky-600" 
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              <Mail className="h-4 w-4" />
              البريد الإلكتروني
            </button>
            <button
              onClick={() => setActiveTab('name')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                activeTab === 'name'
                  ? "bg-white shadow-sm text-sky-600"
                  : "text-slate-600 hover:text-slate-800"
              )}
            >
              <User className="h-4 w-4" />
              الاسم
            </button>
          </div>

          {/* محتوى التبويبات */}
          {activeTab === 'name' && (
            <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newName">الاسم الجديد</Label>
                <div className="relative">
                  <Input
                    id="newName"
                    type="text"
                    {...nameForm.register('newName')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {nameForm.formState.errors.newName && (
                  <p className="text-sm text-red-600">
                    {nameForm.formState.errors.newName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="namePassword">كلمة المرور (للتأكيد)</Label>
                <div className="relative">
                  <Input
                    id="namePassword"
                    type="password"
                    {...nameForm.register('currentPassword')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {nameForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-600">
                    {nameForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  ملاحظة: لتغيير الاسم، يجب إدخال كلمة المرور الحالية للتحقق من الهوية.
                </p>
              </div>

              <DialogFooter className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isNameLoading}
                  className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                >
                  {isNameLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <User className="ml-2 h-4 w-4" />
                      تحديث الاسم
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register('currentPassword')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register('newPassword')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register('confirmPassword')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  ملاحظة: يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية.
                </p>
              </div>

              <DialogFooter className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isPasswordLoading}
                  className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                >
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التغيير...
                    </>
                  ) : (
                    <>
                      <KeyRound className="ml-2 h-4 w-4" />
                      تغيير كلمة المرور
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {activeTab === 'email' && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">البريد الإلكتروني الجديد</Label>
                <div className="relative">
                  <Input
                    id="newEmail"
                    type="email"
                    {...emailForm.register('newEmail')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {emailForm.formState.errors.newEmail && (
                  <p className="text-sm text-red-600">
                    {emailForm.formState.errors.newEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPassword">كلمة المرور (للتأكيد)</Label>
                <div className="relative">
                  <Input
                    id="emailPassword"
                    type="password"
                    {...emailForm.register('currentPassword')}
                    className="bg-white border-slate-300 focus:border-sky-400 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {emailForm.formState.errors.currentPassword && (
                  <p className="text-sm text-red-600">
                    {emailForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  ملاحظة: لتغيير البريد الإلكتروني، يجب إدخال كلمة المرور الحالية للتحقق من الهوية.
                </p>
              </div>

              <DialogFooter className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isEmailLoading}
                  className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700"
                >
                  {isEmailLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Mail className="ml-2 h-4 w-4" />
                      تحديث البريد الإلكتروني
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}