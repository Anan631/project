"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Layout is automatically applied via layout.tsx in /engineer folder
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle, KeyRound, Save, Trash2, AlertTriangle, Check } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';


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
type UserProfileData = Omit<UserDocument, 'password_hash'> & { 
  _id?: string;
  id?: string;
};

export function EngineerProfilePageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'loading' | 'success'>('confirm');


  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setError: setProfileError
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    setError: setPasswordError
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const storedId = localStorage.getItem('userId');
      if (storedId) {
        const userProfile = await getUserProfile(storedId);
        if (userProfile) {
          // التأكد من تعيين المعرف بشكل صحيح
          // في MongoDB، المعرف يأتي باسم _id وليس id
          const profileWithId = userProfile as UserProfileData;
          profileWithId.id = (profileWithId as any)._id || profileWithId.id || storedId;
          setCurrentUser(profileWithId);
          resetProfile({
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone || '',
          });
        } else {
          const { clearAuthData } = require('@/lib/auth-utils');
          clearAuthData();
          router.push('/login');
        }
      } else {
        toast({
          title: "غير مصرح به",
          description: "يجب تسجيل الدخول للوصول إلى هذه الصفحة.",
          variant: "destructive",
        });
        router.push('/login');
      }
    };

    fetchUserData();
  }, [toast, router, resetProfile]);

  const onSubmitProfile: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!currentUser) return;
    setIsProfileLoading(true);

    const result = await updateProfileAction({
      userId: currentUser.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    setIsProfileLoading(false);

    if (result.success) {
      toast({ title: "تم تحديث الملف الشخصي بنجاح" });
      // تحديث بيانات المستخدم الحالية
      setCurrentUser({
        ...currentUser,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
    } else {
      toast({
        title: "فشل تحديث الملف الشخصي",
        description: result.message || "حدث خطأ ما.",
        variant: "destructive",
      });
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            setProfileError(field as keyof ProfileFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
    }
  };

  const onSubmitPassword: SubmitHandler<PasswordFormValues> = async (data) => {
    if (!currentUser) return;
    setIsPasswordLoading(true);

    const result = await changePasswordAction({
      userId: currentUser.id,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    setIsPasswordLoading(false);

    if (result.success) {
      toast({ title: "تم تغيير كلمة المرور بنجاح" });
      resetPassword();
    } else {
      toast({ title: "فشل تغيير كلمة المرور", description: result.message || "حدث خطأ ما.", variant: "destructive" });
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

    // استخدام _id بدلاً من id لأن MongoDB يستخدم _id
    const userId = currentUser._id || currentUser.id;
    console.log("جاري حذف حساب المستخدم بالمعرف:", userId);
    setDeleteStep('loading');
    const result = await deleteUserAccountAction(userId);

    if (result.success) {
      setDeleteStep('success');
      setTimeout(() => {
        toast({
          title: "تم تعطيل الحساب",
          description: "تم تعطيل حسابك مع الحفاظ على البيانات لمدة عام واحد. نأسف لمغادرتك.",
        });
        setIsDeleteDialogOpen(false);
        const { clearAuthData } = require('@/lib/auth-utils');
        clearAuthData();
        router.push('/');
      }, 2000);
    } else {
      toast({
        title: "فشل حذف الحساب",
        description: result.message || "حدث خطأ ما.",
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
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-app-gold" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">الملف الشخصي</h1>
          <p className="text-gray-600 mt-2">إدارة معلومات حسابك الشخصي</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* معلومات الحساب */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-app-gold" />
                معلومات الحساب
              </CardTitle>
              <CardDescription>
                تحديث معلوماتك الشخصية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم</Label>
                  <Input
                    id="name"
                    {...registerProfile('name')}
                    className={profileErrors.name ? 'border-red-500' : ''}
                  />
                  {profileErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerProfile('email')}
                    className={profileErrors.email ? 'border-red-500' : ''}
                  />
                  {profileErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    {...registerProfile('phone')}
                    className={profileErrors.phone ? 'border-red-500' : ''}
                  />
                  {profileErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.phone.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isProfileLoading} className="w-full">
                  {isProfileLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* كلمة المرور */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-app-gold" />
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription>
                تحديث كلمة مرور حسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                    className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword')}
                    className={passwordErrors.newPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmNewPassword">تأكيد كلمة المرور الجديدة</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    {...registerPassword('confirmNewPassword')}
                    className={passwordErrors.confirmNewPassword ? 'border-red-500' : ''}
                  />
                  {passwordErrors.confirmNewPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmNewPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isPasswordLoading} className="w-full">
                  {isPasswordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      تحديث كلمة المرور
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        {/* معلومات إضافية */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
            <CardDescription>
              معلومات أساسية عن حسابك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">المعرف</span>
              <span className="text-gray-600">{currentUser.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">الدور</span>
              <span className="text-gray-600">{displayRole(currentUser.role)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">الحالة</span>
              <span className="text-gray-600">{currentUser.status === 'ACTIVE' ? 'نشط' : currentUser.status}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">تاريخ الإنشاء</span>
              <span className="text-gray-600">{new Date(currentUser.createdAt).toLocaleDateString('ar-SA')}</span>
            </div>
          </CardContent>
        </Card>

        {/* حذف الحساب */}
        <Card className="shadow-md mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              حذف الحساب
            </CardTitle>
            <CardDescription>
              حذف حسابك سيؤدي إلى تعطيله مع الحفاظ على البيانات لمدة عام واحد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف حسابي
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    تأكيد حذف الحساب
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم تعطيل حسابك مع الحفاظ على البيانات لمدة عام واحد، ويمكنك استعادته خلال هذه الفترة. بعد انتهاء هذه المدة، سيتم حذف البيانات نهائياً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteStep !== 'confirm'}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteStep === 'loading' ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الحذف...
                      </>
                    ) : deleteStep === 'success' ? (
                      <>
                        <Check className="ml-2 h-4 w-4" />
                        تم الحذف
                      </>
                    ) : (
                      'نعم، احذف حسابي'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
    </div>
  );
}
