"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserCircle, X, ShieldCheck as AdminIcon, TriangleAlert, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthRequiredModal = ({ isOpen, onClose }: AuthRequiredModalProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const role = localStorage.getItem('userRole');
        const isAuthenticated = !!role;
        setIsLoggedIn(isAuthenticated);
        setUserRole(role);
        setIsAdmin(role === 'ADMIN');
        setIsLoading(false);
      }, 50);
    } else {
      setIsLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoToAccount = () => {
    const dashboardPath = userRole === 'OWNER' ? '/owner/dashboard' : '/engineer/dashboard';
    router.push(dashboardPath);
    onClose();
  };
  
  const handleGoToAdminDashboard = () => {
    router.push('/admin');
    onClose();
  };

  const state: 'loggedOut' | 'loggedIn' | 'admin' = isLoggedIn ? (isAdmin ? 'admin' : 'loggedIn') : 'loggedOut';

  const theme = {
    loggedOut: { Icon: TriangleAlert, color: "red", gradient: "from-red-500 to-orange-500" },
    loggedIn: { Icon: CheckCircle, color: "blue", gradient: "from-blue-500 to-cyan-500" },
    admin: { Icon: AdminIcon, color: "yellow", gradient: "from-yellow-500 to-amber-500" },
  };

  const currentTheme = theme[state];
  const { Icon } = currentTheme;
  
  const descriptionText = isLoggedIn && isAdmin
    ? "لقد قمت بتسجيل الدخول كمسؤول. للوصول إلى هذه الميزة، يلزمك أن تكون مالكًا أو مهندسًا."
    : isLoggedIn
    ? "لقد قمت بتسجيل دخولك مسبقًا. يرجى النقر على زر 'حسابي' للانتقال إلى لوحة التحكم الخاصة بك."
    : "لاستخدام هذه الميزة وغيرها من الميزات المتقدمة في منصة \"المحترف لحساب الكميات\"، يرجى تسجيل الدخول إلى حسابك أو إنشاء حساب جديد إذا لم تكن مسجلاً بعد.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 sm:max-w-lg p-0 rounded-2xl border-gray-200 dark:border-gray-800 border-2 shadow-2xl overflow-hidden">
        
        {/* Accessibility hidden title and description */}
        <div className="sr-only">
          <DialogTitle>{isLoggedIn ? "تم تسجيل الدخول" : "يجب عليك تسجيل الدخول"}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </div>

        {/* Decorative Gradient Bar */}
        <div className={`h-2 w-full bg-gradient-to-r ${currentTheme.gradient}`} />

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4"><div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div></div>
            <div className="h-8 w-3/4 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-4"></div>
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2"></div>
            <div className="h-4 w-5/6 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-6"></div>
            <div className="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
        )}

        {!isLoading && (
          <div className="p-8 pt-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className={`flex items-center justify-center h-16 w-16 rounded-full bg-${currentTheme.color}-100 dark:bg-${currentTheme.color}-900/20`}>
                  <Icon className={`h-10 w-10 text-${currentTheme.color}-600 dark:text-${currentTheme.color}-400`} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center">
                {isLoggedIn ? "تم تسجيل الدخول" : "يجب عليك تسجيل الدخول"}
              </h2>
            </div>
            
            <p className="text-center text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8">
              {isLoggedIn && isAdmin ? (
                "لقد قمت بتسجيل الدخول كمسؤول. للوصول إلى هذه الميزة، يلزمك أن تكون مالكًا أو مهندسًا."
              ) : isLoggedIn ? (
                "لقد قمت بتسجيل دخولك مسبقًا. يرجى النقر على زر 'حسابي' للانتقال إلى لوحة التحكم الخاصة بك."
              ) : (
                <>
                  لاستخدام هذه الميزة وغيرها من الميزات المتقدمة في منصة 
                  <span className={`font-semibold text-${currentTheme.color}-600 dark:text-${currentTheme.color}-400`}> " المحترف لحساب الكميات"</span>، 
                  يرجى تسجيل الدخول إلى حسابك أو إنشاء حساب جديد إذا لم تكن مسجلاً بعد.
                </>
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn && isAdmin ? (
                <>
                  <Button 
                    onClick={handleGoToAdminDashboard} 
                    className={`flex-1 bg-gradient-to-r ${currentTheme.gradient} text-white font-bold py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    <AdminIcon className="ml-2 h-5 w-5" />
                    حساب المسؤول
                  </Button>
                  <Button 
                    onClick={onClose} 
                    variant="ghost"
                    className="flex-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold py-3 text-base rounded-lg"
                  >
                    إغلاق
                  </Button>
                </>
              ) : isLoggedIn ? (
                <>
                  <Button 
                    onClick={handleGoToAccount} 
                    className={`flex-1 bg-gradient-to-r ${currentTheme.gradient} text-white font-bold py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    <UserCircle className="ml-2 h-5 w-5" />
                    حسابي
                  </Button>
                  <Button 
                    onClick={onClose} 
                    variant="ghost"
                    className="flex-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold py-3 text-base rounded-lg"
                  >
                    إغلاق
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={onClose} 
                  className={`w-full bg-gradient-to-r ${currentTheme.gradient} text-white font-bold py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  إغلاق
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredModal;