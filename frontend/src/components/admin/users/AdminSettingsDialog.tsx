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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, KeyRound, User, Shield, Lock, Info, Check, ArrowRight, Eye, EyeOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminChangePasswordAction, adminUpdateEmailAction, adminUpdateNameAction, getAdminDataAction } from '@/app/admin/actions';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

// تعريف المخططات للتأكد من صحة البيانات
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'كلمة المرور الحالية مطلوبة.' }),
  newPassword: z.string().min(6, { message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.' }),
  confirmPassword: z.string().min(1, { message: 'تأكيد كلمة المرور مطلوب.' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين.',
  path: ['confirmPassword'],
});

const emailSchema = z.object({
  currentPassword: z.string().min(1, { message: 'كلمة المرور مطلوبة للتحقق.' }),
  newEmail: z.string().email({ message: 'البريد الإلكتروني غير صالح.' }),
});

const nameSchema = z.object({
  currentPassword: z.string().min(1, { message: 'كلمة المرور مطلوبة للتحقق.' }),
  newName: z.string().min(3, { message: 'الاسم يجب أن يكون 3 أحرف على الأقل.' }),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;
type NameFormValues = z.infer<typeof nameSchema>;

interface AdminSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
}

// الأنيميشن المخصصة
const customStyles = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes scale-in {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-scale-in {
  animation: scale-in 0.5s ease-out forwards;
}

.animate-checkmark {
  animation: checkmark 0.6s ease-out forwards;
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}
`;

export default function AdminSettingsDialog({ isOpen, onOpenChange, adminId }: AdminSettingsDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email' | 'name'>('profile');
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // حالة البيانات - نبدأ بـ null لأننا سنجلب البيانات من السيرفر
  const [adminData, setAdminData] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

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
      newEmail: '',
    },
  });

  // نموذج تغيير الاسم
  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      currentPassword: '',
      newName: '',
    },
  });

  // دالة لجلب بيانات الأدمن باستخدام Server Action
  const fetchData = async () => {
    if (!adminId) {
      setDataLoadError('معرف الأدمن مطلوب.');
      setIsLoadingAdminData(false);
      return;
    }

    setIsLoadingAdminData(true);
    setDataLoadError(null);

    try {
      // استخدام Server Action لجلب بيانات الأدمن
      const response = await getAdminDataAction(adminId);

      if (response.success && response.user) {
        const userData = {
          name: response.user.name || "غير محدد",
          email: response.user.email || "غير محدد",
          role: response.user.role || "ADMIN",
        };
        
        setAdminData(userData);
        emailForm.setValue('newEmail', userData.email);
        nameForm.setValue('newName', userData.name);
      } else {
        setDataLoadError(response.message || 'فشل جلب بيانات الأدمن');
      }
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      setDataLoadError(error.message || 'حدث خطأ أثناء جلب بيانات الأدمن');
    } finally {
      setIsLoadingAdminData(false);
    }
  };

  // جلب البيانات عند فتح النافذة أو عند تغيير معرف الأدمن
  useEffect(() => {
    if (isOpen && adminId) {
      fetchData();
    }
  }, [isOpen, adminId]);

  // دالة لتحديث البيانات يدويًا
  const refreshData = async () => {
    await fetchData();
  };

  // دالة لتحديث اسم الأدمن في الشريط الجانبي
  const updateAdminNameInSidebar = (newName: string) => {
    // تحديث حالة الاسم في الشريط الجانبي
    window.postMessage({
      type: 'updateAdminName',
      name: newName
    }, '*');
    
    // تحديث التخزين المؤقت
    localStorage.setItem('userName', newName);
  };

  // إعادة تعيين النماذج عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      passwordForm.reset();
      emailForm.reset();
      nameForm.reset();
      setActiveTab('profile');
      setStep('form');
      setShowPassword(false);
      setShowCurrentPassword(false);
    }
  }, [isOpen, passwordForm, emailForm, nameForm]);

  // إرسال نموذج تغيير كلمة المرور
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setStep('loading');
    const result = await adminChangePasswordAction(adminId, data.currentPassword, data.newPassword);

    if (result.success) {
      setStep('success');
      setTimeout(() => {
        toast({
          title: '✅ تم تغيير كلمة المرور',
          description: result.message,
        });
        passwordForm.reset();
        setStep('form');
        // تحديث البيانات بعد الحفظ
        refreshData();
      }, 1500);
    } else {
      setStep('form');
      toast({
        title: '❌ خطأ في تغيير كلمة المرور',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // إرسال نموذج تغيير البريد الإلكتروني
  const onEmailSubmit = async (data: EmailFormValues) => {
    setStep('loading');
    const result = await adminUpdateEmailAction(adminId, data.newEmail, data.currentPassword);

    if (result.success) {
      // تحديث البيانات المحلية
      if (adminData) {
        setAdminData({ ...adminData, email: data.newEmail });
      }

      setStep('success');
      setTimeout(() => {
        toast({
          title: '✅ تم تحديث البريد الإلكتروني',
          description: result.message,
        });
        emailForm.reset({ currentPassword: '', newEmail: data.newEmail });
        setStep('form');
        // تحديث البيانات بعد الحفظ
        refreshData();
      }, 1500);
    } else {
      setStep('form');
      toast({
        title: '❌ خطأ في تحديث البريد الإلكتروني',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // إرسال نموذج تغيير الاسم
  const onNameSubmit = async (data: NameFormValues) => {
    setStep('loading');
    const result = await adminUpdateNameAction(adminId, data.newName, data.currentPassword);

    if (result.success) {
      // تحديث البيانات المحلية
      if (adminData) {
        setAdminData({ ...adminData, name: data.newName });
      }

      setStep('success');
      setTimeout(() => {
        toast({
          title: '✅ تم تحديث الاسم',
          description: result.message,
        });
        nameForm.reset({ currentPassword: '', newName: data.newName });
        setStep('form');
        // تحديث البيانات بعد الحفظ
        refreshData();
        // تحديث اسم الأدمن في الشريط الجانبي
        updateAdminNameInSidebar(data.newName);
      }, 1500);
    } else {
      setStep('form');
      toast({
        title: '❌ خطأ في تحديث الاسم',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getTabConfig = () => {
    const config = {
      profile: { color: 'from-blue-400 to-sky-400', icon: User },
      password: { color: 'from-amber-400 to-orange-400', icon: KeyRound },
      email: { color: 'from-purple-400 to-indigo-400', icon: Mail },
      name: { color: 'from-emerald-400 to-green-400', icon: User }
    };
    return config[activeTab] || config.profile;
  };

  const tabConfig = getTabConfig();
  const IconComponent = tabConfig.icon;

  return (
    <>
      <style jsx>{customStyles}</style>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-slate-50/30 backdrop-blur-sm overflow-hidden">
          <DialogTitle className="sr-only">إعدادات الأدمن</DialogTitle>
          <DialogDescription className="sr-only">تغيير إعدادات حساب الأدمن</DialogDescription>
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${tabConfig.color}`}></div>

          {isLoadingAdminData ? (
            <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                <User className="absolute inset-0 m-auto h-10 w-10 text-sky-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-sky-600">جاري تحميل البيانات...</h2>
                <p className="text-slate-500 text-lg">يتم الآن تحميل بيانات الأدمن من قاعدة البيانات</p>
                <div className="w-full bg-sky-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          ) : step === 'form' ? (
            <>
              <DialogHeader className="text-center items-center space-y-6 pt-8 pb-4">
                <div className="relative">
                  <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-blue-100 border-8 border-slate-50/80 shadow-lg animate-pulse`}>
                    <IconComponent className="h-14 w-14 text-sky-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-sky-300 rounded-full opacity-60 animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-300 rounded-full opacity-40 animate-bounce delay-300"></div>
                </div>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-sky-600 bg-clip-text text-transparent">
                  {activeTab === 'profile' && 'معلومات الحساب'}
                  {activeTab === 'password' && 'تغيير كلمة المرور'}
                  {activeTab === 'email' && 'تغيير البريد الإلكتروني'}
                  {activeTab === 'name' && 'تغيير الاسم'}
                </DialogTitle>
              </DialogHeader>

              <div className="px-6 pb-6">
                {/* علامات التبويب */}
                <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'profile' as const, label: 'المعلومات', icon: User },
                    { id: 'password' as const, label: 'كلمة المرور', icon: KeyRound },
                    { id: 'email' as const, label: 'البريد', icon: Mail },
                    { id: 'name' as const, label: 'الاسم', icon: User }
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2",
                          activeTab === tab.id
                            ? "bg-white shadow-lg text-sky-600 scale-105"
                            : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                        )}
                      >
                        <TabIcon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* محتوى التبويبات */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {dataLoadError ? (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                        <div>
                          <p className="font-bold text-red-700 text-lg">فشل تحميل البيانات</p>
                          <p className="text-red-600 text-sm mt-2">{dataLoadError}</p>
                        </div>
                        <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700 text-white">
                          <RefreshCw className="h-4 w-4 ml-2" />
                          إعادة المحاولة
                        </Button>
                      </div>
                    ) : adminData ? (
                      <>
                        <div className="flex justify-end mb-4">
                          <Button 
                            onClick={refreshData}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            size="sm"
                          >
                            <RefreshCw className="h-4 w-4" />
                            تحديث البيانات
                          </Button>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                              <User className="h-10 w-10 text-white" />
                            </div>
                            <div className="text-right flex-1">
                              <p className="font-bold text-slate-800 text-xl">{adminData?.name || "غير متوفر"}</p>
                              <p className="text-slate-600 text-sm mt-1">{adminData?.email || "غير متوفر"}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <div className="bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium rounded-lg">
                                  <Shield className="h-3.5 w-3.5" />
                                  مشرف
                                </div>
                                <div className="bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium rounded-lg">
                                  <Check className="h-3.5 w-3.5" />
                                  من MongoDB
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-sm">
                          <p className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            لتغيير كلمة المرور أو البريد الإلكتروني أو الاسم، استخدم علامات التبويب أعلاه.
                          </p>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}

                {activeTab === 'password' && (
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-slate-700 font-medium text-lg">كلمة المرور الحالية</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              {...passwordForm.register('currentPassword')}
                              className="bg-white border-slate-300 focus:border-amber-400 h-12 rounded-xl text-lg pr-12"
                              placeholder="أدخل كلمة المرور الحالية"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-5 w-5 text-slate-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-slate-400" />
                              )}
                            </Button>
                          </div>
                          {passwordForm.formState.errors.currentPassword && (
                            <p className="text-sm text-red-600">
                              {passwordForm.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-slate-700 font-medium text-lg">كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPassword ? "text" : "password"}
                              {...passwordForm.register('newPassword')}
                              className="bg-white border-slate-300 focus:border-amber-400 h-12 rounded-xl text-lg pr-12"
                              placeholder="أدخل كلمة المرور الجديدة"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-slate-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-slate-400" />
                              )}
                            </Button>
                          </div>
                          {passwordForm.formState.errors.newPassword && (
                            <p className="text-sm text-red-600">
                              {passwordForm.formState.errors.newPassword.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-slate-700 font-medium text-lg">تأكيد كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              {...passwordForm.register('confirmPassword')}
                              className="bg-white border-slate-300 focus:border-amber-400 h-12 rounded-xl text-lg pr-12"
                              placeholder="أعد إدخال كلمة المرور الجديدة"
                            />
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          </div>
                          {passwordForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-red-600">
                              {passwordForm.formState.errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-sm">
                      <p className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        ملاحظة: يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل وتحتوي على حروف وأرقام.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                      <Button
                        type="button"
                        onClick={handleClose}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300"
                      >
                        إلغاء الأمر
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      >
                        <KeyRound className="h-5 w-5" />
                        تغيير كلمة المرور
                      </Button>
                    </div>
                  </form>
                )}

                {activeTab === 'email' && (
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newEmail" className="text-slate-700 font-medium text-lg">البريد الإلكتروني الجديد</Label>
                          <div className="relative">
                            <Input
                              id="newEmail"
                              type="email"
                              {...emailForm.register('newEmail')}
                              className="bg-white border-slate-300 focus:border-purple-400 h-12 rounded-xl text-lg pr-12"
                            />
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          </div>
                          {emailForm.formState.errors.newEmail && (
                            <p className="text-sm text-red-600">
                              {emailForm.formState.errors.newEmail.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emailPassword" className="text-slate-700 font-medium text-lg">كلمة المرور (للتأكيد)</Label>
                          <div className="relative">
                            <Input
                              id="emailPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              {...emailForm.register('currentPassword')}
                              className="bg-white border-slate-300 focus:border-purple-400 h-12 rounded-xl text-lg pr-12"
                              placeholder="أدخل كلمة المرور الحالية"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-5 w-5 text-slate-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-slate-400" />
                              )}
                            </Button>
                          </div>
                          {emailForm.formState.errors.currentPassword && (
                            <p className="text-sm text-red-600">
                              {emailForm.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-sm">
                      <p className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        ملاحظة: لتغيير البريد الإلكتروني، يجب إدخال كلمة المرور الحالية للتحقق من الهوية.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                      <Button
                        type="button"
                        onClick={handleClose}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300"
                      >
                        إلغاء الأمر
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      >
                        <Mail className="h-5 w-5" />
                        تحديث البريد الإلكتروني
                      </Button>
                    </div>
                  </form>
                )}

                {activeTab === 'name' && (
                  <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-6">
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newName" className="text-slate-700 font-medium text-lg">الاسم الجديد</Label>
                          <div className="relative">
                            <Input
                              id="newName"
                              type="text"
                              {...nameForm.register('newName')}
                              className="bg-white border-slate-300 focus:border-emerald-400 h-12 rounded-xl text-lg pr-12"
                            />
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          </div>
                          {nameForm.formState.errors.newName && (
                            <p className="text-sm text-red-600">
                              {nameForm.formState.errors.newName.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="namePassword" className="text-slate-700 font-medium text-lg">كلمة المرور (للتأكيد)</Label>
                          <div className="relative">
                            <Input
                              id="namePassword"
                              type={showCurrentPassword ? "text" : "password"}
                              {...nameForm.register('currentPassword')}
                              className="bg-white border-slate-300 focus:border-emerald-400 h-12 rounded-xl text-lg pr-12"
                              placeholder="أدخل كلمة المرور الحالية"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-5 w-5 text-slate-400" />
                              ) : (
                                <Eye className="h-5 w-5 text-slate-400" />
                              )}
                            </Button>
                          </div>
                          {nameForm.formState.errors.currentPassword && (
                            <p className="text-sm text-red-600">
                              {nameForm.formState.errors.currentPassword.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-sm">
                      <p className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        ملاحظة: لتغيير الاسم، يجب إدخال كلمة المرور الحالية للتحقق من الهوية.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                      <Button
                        type="button"
                        onClick={handleClose}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300"
                      >
                        إلغاء الأمر
                      </Button>
                      <Button
                        type="submit"
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                      >
                        <User className="h-5 w-5" />
                        تحديث الاسم
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : step === 'loading' ? (
            <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                <IconComponent className="absolute inset-0 m-auto h-10 w-10 text-sky-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-sky-600">
                  {activeTab === 'password' && 'جاري تغيير كلمة المرور...'}
                  {activeTab === 'email' && 'جاري تحديث البريد الإلكتروني...'}
                  {activeTab === 'name' && 'جاري تحديث الاسم...'}
                </h2>
                <p className="text-slate-500 text-lg">يتم الآن معالجة طلبك</p>
                <div className="w-full bg-sky-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
              <div className="relative">
                <div className="h-28 w-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center ring-8 ring-emerald-50 shadow-lg animate-scale-in">
                  <Check className="h-14 w-14 text-emerald-500 animate-checkmark" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-emerald-600 animate-fade-in">
                  {activeTab === 'password' && 'تم التغيير بنجاح! 🎉'}
                  {activeTab === 'email' && 'تم التحديث بنجاح! 🎉'}
                  {activeTab === 'name' && 'تم التحديث بنجاح! 🎉'}
                </h2>
                <p className="text-slate-500 text-lg animate-fade-in-delay">
                  {activeTab === 'password' && 'تم تغيير كلمة المرور بنجاح'}
                  {activeTab === 'email' && 'تم تحديث البريد الإلكتروني بنجاح'}
                  {activeTab === 'name' && 'تم تحديث الاسم بنجاح'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}