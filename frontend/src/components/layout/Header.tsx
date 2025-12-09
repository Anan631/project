"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Instagram, Facebook, Clock, Calendar, Bell, Settings,
  User, LogOut, X, ChevronDown, Home, Calculator,
  FileText, Phone, Mail, MapPin, Star, Award, Shield
} from 'lucide-react';
import NotificationsFixed from './NotificationsFixed';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { APP_LOGO_SRC } from '@/lib/branding';
import { useSettings } from '@/contexts/SettingsContext';

// --- آية الكرسي مقسمة إلى أجزاء ---
const ayatAlKursiParts = [
  "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ",
  "لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ",
  "لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ",
  "مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ",
  "يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ",
  "وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ",
  "وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۖ",
  "وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
];
// ------------------------------------

interface DateTime {
  time: string;
  date: string;
}

interface UserRole {
  userRole: string | null;
  isLoading: boolean;
}

interface SocialLink {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hoverClass: string;
  title: string;
  ariaLabel: string;
  color: string;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

// Hook مخصص لإدارة الوقت والتاريخ
const useDateTime = (): DateTime => {
  const [dateTime, setDateTime] = useState<DateTime>({ time: '', date: '' });

  const updateDateTime = useCallback(() => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

      const time = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
      const date = now.toLocaleDateString('ar-EG-u-nu-latn', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      setDateTime({ time, date });
    } catch (error) {
      console.error('خطأ في تحديث الوقت:', error);
      setDateTime({ time: 'خطأ', date: 'خطأ' });
    }
  }, []);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [updateDateTime]);

  return dateTime;
};

// Hook مخصص لإدارة دور المستخدم
const useUserRole = (): UserRole => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const getUserRole = () => {
      try {
        if (typeof window !== 'undefined') {
          const role = localStorage.getItem('userRole');
          setUserRole(role);
        }
      } catch (error) {
        console.error('خطأ في قراءة دور المستخدم:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserRole();
  }, [pathname]);

  return { userRole, isLoading };
};

// Hook للتحكم في القائمة المحمولة
const useMobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeMenu]);

  return { isOpen, toggleMenu, closeMenu };
};

// مكون الساعة الثابتة المحسن
export function FixedClockBar() {
  const { time, date } = useDateTime();

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-3 flex items-center justify-between font-mono text-sm backdrop-blur-lg border-b border-yellow-500/30 shadow-lg">
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
          <div className="w-[140px] min-w-[140px] text-center whitespace-nowrap font-bold tracking-widest text-yellow-100">
            {time}
          </div>
        </div>
        <div className="w-px h-6 bg-yellow-500/50"></div>
        <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <Calendar className="h-5 w-5 text-yellow-400" />
          <span className="text-yellow-100 font-medium">{date}</span>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
          <MapPin className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-100">نابلس، فلسطين</span>
        </div>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
          <Phone className="h-4 w-4 text-yellow-400" />
          <span dir="ltr" className="text-yellow-100">+972 59 437 1424</span>
        </div>
      </div>
    </div>
  );
}

// مكون الروابط الاجتماعية المحسن
const SocialLinks = () => {
  const socialLinks = useMemo<SocialLink[]>(() => [
    {
      href: "https://wa.me/972594371424",
      icon: WhatsAppIcon,
      hoverClass: "hover:bg-green-500 hover:shadow-green-500/25",
      title: "تواصل عبر واتساب",
      ariaLabel: "تواصل معنا عبر واتساب",
      color: "text-green-400"
    },
    {
      href: "https://www.instagram.com/a.w.samarah3/",
      icon: Instagram,
      hoverClass: "hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/25",
      title: "تابعنا على إنستغرام",
      ariaLabel: "تابعنا على إنستغرام",
      color: "text-pink-400"
    },
    {
      href: "https://www.facebook.com/a.w.samarah4",
      icon: Facebook,
      hoverClass: "hover:bg-blue-500 hover:shadow-blue-500/25",
      title: "تابعنا على فيسبوك",
      ariaLabel: "تابعنا على فيسبوك",
      color: "text-blue-400"
    }
  ], []);

  return (
    <div className="flex items-center gap-3">
      {socialLinks.map((link, index) => {
        const IconComponent = link.icon;
        return (
          <a
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative bg-white/5 backdrop-blur-sm ${link.hoverClass} p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent border border-white/10 hover:border-white/20`}
            title={link.title}
            aria-label={link.ariaLabel}
          >
            <IconComponent className={`h-5 w-5 ${link.color} group-hover:text-white transition-colors`} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          </a>
        );
      })}
    </div>
  );
};

// مكون عرض الوقت والتاريخ المحسن
const TimeDisplay = () => {
  const { time, date } = useDateTime();

  return (
    <div className="bg-gradient-to-r from-black/30 to-black/20 backdrop-blur-lg rounded-xl px-6 py-3 border border-yellow-500/30 shadow-lg">
      <div className="flex items-center gap-4 text-yellow-100" style={{ direction: 'ltr' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
            <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-sm"></div>
          </div>
          <div
            className="w-[150px] text-center font-bold whitespace-nowrap overflow-hidden leading-none flex-shrink-0 text-lg"
            style={{
              fontFamily: 'Roboto Mono, monospace',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.1em',
            }}
          >
            {time}
          </div>
        </div>
        <div className="w-px h-6 bg-yellow-500/50"></div>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-yellow-400" />
          <span
            className="font-medium"
            style={{
              fontFamily: 'Roboto Mono, monospace',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.05em',
            }}
          >
            {date}
          </span>
        </div>
      </div>
    </div>
  );
};

// مكون القائمة المحمولة المحسن
const MobileMenu = ({ isOpen, onClose, userRole }: { isOpen: boolean; onClose: () => void; userRole: string | null }) => {
  const navigationItems = useMemo<NavigationItem[]>(() => [
    { href: '/', label: 'الصفحة الرئيسية', icon: Home },
    { href: '/calculator', label: 'حاسبة الكميات', icon: Calculator },
    { href: '/projects', label: 'المشاريع', icon: FileText, roles: ['ENGINEER', 'OWNER'] },
    { href: '/reports', label: 'التقارير', icon: FileText, roles: ['ENGINEER', 'OWNER'] },
    { href: '/settings', label: 'الإعدادات', icon: Settings, roles: ['ENGINEER', 'OWNER'] },
    { href: '/contact', label: 'اتصل بنا', icon: Phone },
  ], []);

  const filteredItems = useMemo(() => {
    return navigationItems.filter(item =>
      !item.roles || item.roles.includes(userRole || '')
    );
  }, [navigationItems, userRole]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-yellow-500/30">
        <div className="flex items-center justify-between p-6 border-b border-yellow-500/30 bg-black/20">
          <h2 className="text-2xl font-bold text-yellow-400">القائمة الرئيسية</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/30"
            aria-label="إغلاق القائمة"
          >
            <X className="h-6 w-6 text-red-400" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-3">
            {filteredItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-yellow-500/10 transition-all duration-200 text-white border border-transparent hover:border-yellow-500/30 group"
                >
                  <item.icon className="h-6 w-6 text-yellow-400 group-hover:text-yellow-300" />
                  <span className="font-medium text-lg group-hover:text-yellow-100">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

// مكون قائمة المستخدم المحسن
const UserMenu = ({ userRole }: { userRole: string | null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };


  // إخفاء القائمة تماماً للمالك والمهندس والادمن
  if (!userRole) return null;
  if (["OWNER", "ENGINEER", "ADMIN", "ADMN", "ADMINISTRATOR", "SUPERADMIN"].includes(userRole)) return null;

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ENGINEER': return 'مهندس';
      case 'OWNER': return 'مالك';
      default: return role;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 px-4 py-2 rounded-xl transition-all duration-200 text-white shadow-lg hover:shadow-yellow-500/25 border border-yellow-400/30"
        aria-label="قائمة المستخدم"
      >
        <div className="relative">
          <User className="h-5 w-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
        <span className="hidden md:block font-medium">{getRoleDisplay(userRole)}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-yellow-500/30 z-50 backdrop-blur-lg">
          <div className="p-2">
            <div className="px-4 py-3 border-b border-yellow-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{getRoleDisplay(userRole)}</p>
                  <p className="text-gray-400 text-sm">مرحباً بك</p>
                </div>
              </div>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-500/10 transition-colors text-white border border-transparent hover:border-yellow-500/30 mt-2"
            >
              <User className="h-5 w-5 text-yellow-400" />
              <span>الملف الشخصي</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-500/10 transition-colors text-white border border-transparent hover:border-yellow-500/30"
            >
              <Settings className="h-5 w-5 text-yellow-400" />
              <span>الإعدادات</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-white w-full text-right border border-transparent hover:border-red-500/30 mt-2"
            >
              <LogOut className="h-5 w-5 text-red-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون الشريط العلوي المحسن
const SocialAndClock = () => {
  // دالة لتحديد جزء الآية بناءً على اليوم
  const getDailyVerse = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return ayatAlKursiParts[dayOfYear % ayatAlKursiParts.length];
  };

  const dailyVerse = useMemo(() => getDailyVerse(), []);

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white text-sm py-3 backdrop-blur-lg border-b border-yellow-500/30">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="flex-1 flex justify-start">
          <SocialLinks />
        </div>

        <div className="flex-shrink-0 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 tracking-wider animate-pulse hidden lg:block">
          {dailyVerse}
        </div>

        <div className="flex-1 flex justify-end">
          <TimeDisplay />
        </div>
      </div>
    </div>
  );
};

// مكون الشعار والعنوان بتصميم توهج ذهبي
const LogoAndTitle = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName || "المحترف لحساب الكميات";

  return (
    <Link
      href="/"
      className="flex items-center gap-4 text-right group transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-xl p-2"
      aria-label="الصفحة الرئيسية - المحترف لحساب الكميات"
    >
      {/* حاوية الشعار بتأثير التوهج */}
      <div className="relative rounded-2xl p-1 transition-all duration-500 group-hover:scale-105">
        <Image
          src={APP_LOGO_SRC}
          unoptimized
          alt="شعار الموقع"
          width={96}
          height={96}
          className="relative rounded-xl border-2 border-gray-700 object-contain transition-all duration-500 group-hover:border-yellow-400/50"
          data-ai-hint="logo construction"
          priority
          style={{
            // تأثير التوهج الذهبي
            boxShadow: `
              0 0 5px rgba(250, 204, 21, 0.5),
              0 0 10px rgba(250, 204, 21, 0.4),
              0 0 20px rgba(250, 204, 21, 0.3),
              0 0 40px rgba(250, 204, 21, 0.2)
            `,
          }}
          // زيادة قوة التوهج عند التمرير
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `
              0 0 10px rgba(250, 204, 21, 0.8),
              0 0 20px rgba(250, 204, 21, 0.6),
              0 0 40px rgba(250, 204, 21, 0.5),
              0 0 80px rgba(250, 204, 21, 0.4)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `
              0 0 5px rgba(250, 204, 21, 0.5),
              0 0 10px rgba(250, 204, 21, 0.4),
              0 0 20px rgba(250, 204, 21, 0.3),
              0 0 40px rgba(250, 204, 21, 0.2)
            `;
          }}
        />

        {/* مؤشر الحالة */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-3 border-gray-900 flex items-center justify-center shadow-lg">
          <Shield className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* تفاصيل العنوان */}
      <div className="hidden md:block">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 group-hover:from-yellow-300 group-hover:to-yellow-500 transition-all duration-300">
          {siteName}
        </h1>
        <p className="text-lg text-gray-300 group-hover:text-yellow-100 transition-colors duration-300 font-medium">
          للحديد والباطون والابنية الانشائية
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm text-gray-400 mr-2">خدمة متميزة</span>
        </div>
      </div>
      <div className="md:hidden">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300 group-hover:from-yellow-300 group-hover:to-yellow-500 transition-all duration-300">
          {siteName.split(' ')[0] || "المحترف"}
        </h1>
        <p className="text-sm text-gray-300 group-hover:text-yellow-100 transition-colors duration-300 font-medium">
          لحساب الكميات
        </p>
      </div>
    </Link>
  );
};

// المكون الرئيسي للهيدر المحسن
export default function Header() {
  const { userRole, isLoading } = useUserRole();
  const { isOpen, toggleMenu, closeMenu } = useMobileMenu();

  const showNotifications = useMemo(() =>
    userRole === 'ENGINEER' || userRole === 'OWNER',
    [userRole]
  );

  return (
    <header className="shadow-2xl relative z-40">
      <SocialAndClock />
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white backdrop-blur-lg relative overflow-hidden">
        {/* تأثيرات الخلفية المتقدمة */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent_0deg,_rgba(255,215,0,0.1)_360deg)]"></div>

        <div className="container mx-auto flex h-24 items-center justify-between px-4 relative z-10">
          {/* الجانب الأيمن */}
          <div className="flex items-center gap-4">

            <LogoAndTitle />
          </div>

          {/* الجانب الأيسر */}
          <div className="flex items-center gap-4">
            {!isLoading && showNotifications && (
              <div className="animate-fade-in">
                <div className="relative">
                  <NotificationsFixed />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
            <UserMenu userRole={userRole} />
          </div>
        </div>
      </div>

      {/* خط ذهبي متحرك محسن */}
      <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
      </div>

      <MobileMenu isOpen={isOpen} onClose={closeMenu} userRole={userRole} />
    </header>
  );
}

// تصدير الأنماط المخصصة المحسنة
export const headerStyles = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }

  /* تحسينات الأداء والتأثيرات */
  .group:hover .group-hover\\:scale-110 {
    transform: scale(1.1);
  }

  .group:hover .group-hover\\:shadow-lg {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  /* تحسين الخلفيات المتدرجة */
  .bg-gradient-to-r {
    background-image: linear-gradient(to right, var(--tw-gradient-stops));
  }

  /* تحسين التوافق مع الأجهزة */
  @media (max-width: 768px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }

  /* تحسين الوصولية */
  .focus\\:ring-yellow-400:focus {
    --tw-ring-color: #facc15;
  }

  /* تحسين الشفافية */
  .backdrop-blur-sm {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .backdrop-blur-lg {
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  /* تأثيرات النص المتدرج */
  .bg-clip-text {
    background-clip: text;
    -webkit-background-clip: text;
  }

  /* تحسين الحدود */
  .border-3 {
    border-width: 3px;
  }
`;

// مكون لإضافة الأنماط
export const HeaderStylesInjector = () => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const existingStyle = document.getElementById('header-styles');
      if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'header-styles';
        styleSheet.textContent = headerStyles;
        document.head.appendChild(styleSheet);
      }
    }
  }, []);

  return null;
};