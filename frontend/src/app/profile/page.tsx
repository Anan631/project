"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import OwnerAppLayout from "@/components/owner/OwnerAppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle, KeyRound, Save, Trash2, AlertTriangle, Check, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateProfileAction, changePasswordAction, getUserProfile, deleteUserAccountAction } from './actions';
import type { UserDocument, ChangePasswordResult } from '@/lib/db';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  name: z.string().min(3, { message: "الاسم مطلوب (3 أحرف على الأقل)." }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "كلمة المرور الحالية مطلوبة." }),
  newPassword: z.string().min(6, { message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." }),
  confirmNewPassword: z.string().min(6, { message: "تأكيد كلمة المرور الجديدة مطلوب." }),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "كلمتا المرور الجديدتان غير متطابقتين.",
  path: ["confirmNewPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type UserProfileData = Omit<UserDocument, 'password_hash'>;

export function ProfilePageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'loading' | 'success'>('confirm');
  
  // إضافة حالات لعرض/إخفاء كلمات المرور
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile,
    setError: setProfileError
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isDirty: isPasswordDirty },
    reset: resetPassword,
    setError: setPasswordError
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const storedId = localStorage.getItem('userId');
      if (storedId) {
        const userProfileResult = await getUserProfile(storedId);
        if (userProfileResult && userProfileResult.success && userProfileResult.user) {
          const userProfile = userProfileResult.user;
          userProfile.id = userProfile._id || userProfile.id || storedId;
          setCurrentUser(userProfile);
          resetProfile({
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone || '',
          });
        } else {
          localStorage.clear();
          router.push('/login');
        }
      } else {
        toast({
          title: "غير مصرح به",
          description: "يجب تسجيل الدخول لعرض هذه الصفحة.",
          variant: "destructive"
        });
        router.push('/login');
      }
    };
    fetchUserData();
  }, [router, toast, resetProfile]);

  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!currentUser) return;
    setIsProfileLoading(true);
    const result = await updateProfileAction({ userId: currentUser.id, ...data });
    setIsProfileLoading(false);

    if (result.success && result.user) {
      toast({ 
        title: "تم التحديث بنجاح",
        description: "تم تحديث معلومات الملف الشخصي بنجاح."
      });
      const updatedUser = { ...currentUser, name: result.user.name, email: result.user.email, phone: result.user.phone };
      setCurrentUser(updatedUser);
      localStorage.setItem('userName', result.user.name);
      localStorage.setItem('userEmail', result.user.email);
      resetProfile(data);
    } else {
      toast({
        title: "فشل التحديث",
        description: result.message || "حدث خطأ أثناء تحديث الملف الشخصي.",
        variant: "destructive"
      });
      if (result.fieldErrors) {
        for (const [key, value] of Object.entries(result.fieldErrors)) {
          if(value) setProfileError(key as keyof ProfileFormValues, { type: 'server', message: value.join(', ')});
        }
      }
    }
  };

  const onPasswordSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
    if (!currentUser) return;
    setIsPasswordLoading(true);
    const result: ChangePasswordResult = await changePasswordAction({
      userId: currentUser.id,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    setIsPasswordLoading(false);

    if (result.success) {
      toast({ 
        title: "تم التغيير بنجاح",
        description: "تم تغيير كلمة المرور بنجاح." 
      });
      resetPassword();
    } else {
      toast({ 
        title: "فشل التغيير", 
        description: result.message || "حدث خطأ أثناء تغيير كلمة المرور.", 
        variant: "destructive" 
      });
      if (result.errorType === 'invalid_current_password') {
        setPasswordError('currentPassword', { type: 'server', message: result.message });
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) {
      console.error("لا يمكن حذف الحساب: المستخدم الحالي غير موجود");
      toast({
        title: "خطأ",
        description: "لا يمكن حذف الحساب: بيانات المستخدم غير متوفرة",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentUser.id) {
      console.error("لا يمكن حذف الحساب: معرف المستخدم غير موجود");
      toast({
        title: "خطأ",
        description: "لا يمكن حذف الحساب: معرف المستخدم غير متوفر",
        variant: "destructive"
      });
      return;
    }
    
    const userId = currentUser._id || currentUser.id;
    console.log("جاري حذف حساب المستخدم بالمعرف:", userId);
    setDeleteStep('loading');
    const result = await deleteUserAccountAction({ userId });
    if (result.success) {
      setDeleteStep('success');
      setTimeout(() => {
        toast({
          title: "تم تعطيل الحساب",
          description: "تم تعطيل حسابك مع الحفاظ على البيانات لمدة عام واحد. نأسف لمغادرتك.",
        });
        setIsDeleteDialogOpen(false);
        localStorage.clear();
        router.push('/');
      }, 2000);
    } else {
      toast({
        title: "فشل الحذف",
        description: result.message || "حدث خطأ أثناء حذف الحساب.",
        variant: "destructive",
      });
      setDeleteStep('confirm');
      setIsDeleteDialogOpen(false);
    }
  };

  const displayRole = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'OWNER': return 'مالك';
      case 'ENGINEER': return 'مهندس';
      case 'ADMIN': return 'مشرف';
      default: return role || '...';
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <UserCircle className="h-12 w-12 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
          <p className="text-gray-600 mt-2">إدارة معلومات حسابك وإعدادات الأمان</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Personal Info Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">المعلومات الشخصية</CardTitle>
                <CardDescription className="text-gray-600">قم بتحديث معلوماتك الشخصية</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profileName" className="text-sm font-medium text-gray-700 mb-2 block">
                    الاسم الكامل
                  </Label>
                  <div className="relative">
                    <Input 
                      id="profileName" 
                      {...registerProfile("name")} 
                      className="bg-gray-50/80 border-gray-300 pl-10 focus:bg-white transition-colors"
                    />
                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {profileErrors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {profileErrors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="profileEmail" className="text-sm font-medium text-gray-700 mb-2 block">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Input 
                      id="profileEmail" 
                      type="email" 
                      {...registerProfile("email")} 
                      className="bg-gray-50/80 border-gray-300 pl-10 focus:bg-white transition-colors"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {profileErrors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {profileErrors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="profileRole" className="text-sm font-medium text-gray-700 mb-2 block">
                    الدور الوظيفي
                  </Label>
                  <div className="flex gap-3 items-center">
                    <Input 
                      id="profileRole" 
                      readOnly 
                      value={displayRole(currentUser.role)} 
                      className="bg-gray-100 border-gray-300 cursor-not-allowed text-gray-700 font-medium"
                    />
                    <Badge variant="secondary" className="shrink-0">
                      {displayRole(currentUser.role)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="profilePhone" className="text-sm font-medium text-gray-700 mb-2 block">
                    رقم الهاتف
                    <span className="text-gray-400 text-xs font-normal mr-2">(اختياري)</span>
                  </Label>
                  <div className="relative">
                    <Input 
                      id="profilePhone" 
                      {...registerProfile("phone")} 
                      placeholder="+966 5X XXX XXXX"
                      className="bg-gray-50/80 border-gray-300 pl-10 focus:bg-white transition-colors"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">يُستخدم لإعادة تعيين كلمة المرور والاتصال العاجل</p>
                  {profileErrors.phone && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {profileErrors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isProfileLoading || !isProfileDirty}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProfileLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Change Password Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">الأمان</CardTitle>
                <CardDescription className="text-gray-600">قم بتحديث كلمة المرور الخاصة بك</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                    كلمة المرور الحالية
                  </Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword" 
                      type={showCurrentPassword ? "text" : "password"} 
                      {...registerPassword("currentPassword")} 
                      className="bg-gray-50/80 border-gray-300 pl-10 pr-10 focus:bg-white transition-colors"
                    />
                    <KeyRound className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                    كلمة المرور الجديدة
                  </Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"} 
                      {...registerPassword("newPassword")} 
                      className="bg-gray-50/80 border-gray-300 pr-10 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                    تأكيد كلمة المرور الجديدة
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirmNewPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      {...registerPassword("confirmNewPassword")} 
                      className="bg-gray-50/80 border-gray-300 pr-10 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmNewPassword && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {passwordErrors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isPasswordLoading || !isPasswordDirty}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPasswordLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <KeyRound className="ml-2 h-4 w-4" />
                    تغيير كلمة المرور
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone Section */}
      <Card className="shadow-lg border border-red-200 bg-gradient-to-br from-red-50/80 to-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-red-700">منطقة الخطر</CardTitle>
              <CardDescription className="text-red-600">
                الإجراءات التالية لا يمكن التراجع عنها
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-red-200 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-900">حذف الحساب</h3>
                  <p className="text-gray-600 text-sm">
                    سيتم تعطيل حسابك فوراً، مع الحفاظ على بياناتك ومشاريعك لمدة عام واحد.
                  </p>
                </div>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                      <Trash2 className="ml-2 h-4 w-4"/>
                      حذف الحساب
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-md text-center">
                    {deleteStep === 'confirm' && currentUser && (
                      <>
                        <AlertDialogHeader className="text-center space-y-4">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                            <Trash2 className="h-8 w-8 text-red-600" />
                          </div>
                          <AlertDialogTitle className="text-xl font-bold text-gray-900 text-center">
                            تأكيد حذف الحساب
                          </AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="text-gray-600 space-y-3 text-center">
                          <p className="text-base">هل أنت متأكد تمامًا من رغبتك في حذف حسابك؟</p>
                          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center">
                            سيتم تعطيل حساب: <span className="font-bold">"{currentUser.name}"</span>
                          </div>
                          <p className="text-xs text-gray-500 text-center">يمكنك استعادة حسابك خلال سنة واحدة من تاريخ الحذف.</p>
                        </div>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-4 justify-center">
                          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-0 font-medium">
                            إلغاء
                          </AlertDialogCancel>
                          <Button 
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium"
                          >
                            نعم، أحذف حسابي
                          </Button>
                        </AlertDialogFooter>
                      </>
                    )}
                    {deleteStep === 'loading' && (
                      <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
                        <h3 className="text-lg font-semibold text-gray-900 text-center">جاري حذف الحساب...</h3>
                        <p className="text-gray-600 text-center">يتم حذف حسابك وبياناتك الآن</p>
                      </div>
                    )}
                    {deleteStep === 'success' && (
                      <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-700 text-center">تم التعطيل بنجاح</h3>
                        <p className="text-gray-600 text-center">تم تعطيل حسابك مع الحفاظ على البيانات</p>
                      </div>
                    )}
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <OwnerAppLayout>
      <ProfilePageContent />
    </OwnerAppLayout>
  );
}