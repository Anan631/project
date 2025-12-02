"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
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
import {
  Loader2,
  UserCog,
  X,
  Mail,
  Edit3 as EditIcon,
  User,
} from 'lucide-react';
import {
  adminUpdateUserAction,
  type AdminUpdateUserFormValues,
} from '@/app/admin/actions';
import type { UserDocument, AdminUserUpdateResult } from '@/lib/db';
import { cn } from '@/lib/utils';

const editUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(3, { message: 'الاسم مطلوب (3 أحرف على الأقل).' }),
  email: z.string().email({ message: 'البريد الإلكتروني غير صالح.' }).optional(),
});

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: UserDocument | null;
  adminUserId: string;
}

export default function EditUserDialog({
  isOpen,
  onClose,
  onUserUpdated,
  user,
  adminUserId,
}: EditUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    setError,
  } = useForm<AdminUpdateUserFormValues>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (user && isOpen) {
      setValue('userId', user.id);
      setValue('name', user.name);
      if (user.role === 'ENGINEER' || user.role === 'OWNER') {
        setValue('email', user.email);
      } else {
        setValue('email', undefined);
      }
    } else if (!isOpen) {
      reset({ userId: '', name: '', email: '' });
    }
  }, [user, isOpen, setValue, reset]);

  const onSubmit: SubmitHandler<AdminUpdateUserFormValues> = async (data) => {
    if (!user) return;

    setIsLoading(true);

    const payload: AdminUpdateUserFormValues = {
      userId: user.id,
      name: data.name,
    };

    if ((user.role === 'ENGINEER' || user.role === 'OWNER') && data.email) {
      payload.email = data.email;
    }

    const result: AdminUserUpdateResult = await adminUpdateUserAction(payload, adminUserId);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'تم تحديث المستخدم',
        description: result.message || 'تم تحديث بيانات المستخدم بنجاح.',
        variant: 'default',
        className: 'bg-green-500 text-white',
      });
      onUserUpdated();
      onClose();
    } else {
      toast({
        title: 'خطأ في تحديث المستخدم',
        description: result.message || 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
      if (result.fieldErrors) {
        for (const [fieldName, fieldErrorMessages] of Object.entries(result.fieldErrors)) {
          if (fieldErrorMessages?.length) {
            setError(fieldName as keyof AdminUpdateUserFormValues, {
              type: 'server',
              message: fieldErrorMessages.join(', '),
            });
          }
        }
      }
    }
  };

  const handleCloseDialog = () => {
    onClose();
  };

  if (!user) return null;

  const canEditEmail = user.role === 'ENGINEER' || user.role === 'OWNER';
  const roleLabel = user.role === 'ADMIN' ? 'مشرف' : user.role === 'ENGINEER' ? 'مهندس' : 'مالك';

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent
        className={cn(
          'sm:max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700',
          'text-right'
        )}
      >
        <DialogHeader className="mb-6">
          <div className="flex flex-col items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4">
              <UserCog className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-800 dark:text-white">
              تعديل بيانات المستخدم
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-2 text-sm text-center">
              تحديث معلومات المستخدم: {user.name} ({roleLabel})
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register('userId')} />

          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              الاسم الكامل
            </Label>
            <div className="relative">
              <Input
                id="edit-name"
                {...register('name')}
                placeholder="مثال: علي محمد"
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
              />
              <EditIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {canEditEmail ? (
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Input
                  id="edit-email"
                  type="email"
                  {...register('email')}
                  placeholder={user.role === 'ENGINEER' ? 'engineer@example.com' : 'owner@example.com'}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">البريد الإلكتروني</Label>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.email} (لا يمكن تغييره للمشرفين)
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">دور المستخدم</Label>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{roleLabel}</span>
            </div>
          </div>

          <DialogFooter className="pt-5 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <UserCog className="ml-2 h-5 w-5" />
                  حفظ التعديلات
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              className="
                w-full sm:w-auto
                font-medium py-2.5 px-6 rounded-lg
                border border-gray-300 dark:border-gray-600
                bg-transparent
                text-black
                hover:text-red-800
                hover:bg-transparent
                shadow-sm
                transition-colors duration-200
              "
            >
              <X className="ml-2 h-5 w-5" />
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
