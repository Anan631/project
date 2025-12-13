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

// آية الكرسي مقسمة لأجزاء
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

// ==================== أنواع البيانات ====================
interface DateTime { time: string; date: string; }
interface UserRole { userRole: string | null; isLoading: boolean; }
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

// ==================== الهوكس المخصصة ====================
const useDateTime = (): DateTime => {
  const [dateTime, setDateTime] = useState<DateTime>({ time: '', date: '' });

  const updateDateTime = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

    setDateTime({
      time: `${formattedHours}:${minutes}:${seconds} ${ampm}`,
      date: now.toLocaleDateString('ar-EG-u-nu-latn', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });
  }, []);

  useEffect(() => {
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [updateDateTime]);

  return dateTime;
};

const useUserRole = (): UserRole => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const getUserRole = () => {
      try {
        if (typeof window !== 'undefined') {
          setUserRole(localStorage.getItem('userRole'));
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

const useMobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
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

// ==================== مكونات الهيدر ====================

// شريط الساعة الثابتة
export function FixedClockBar() {
  const { time, date } = useDateTime();

  return (
    <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-3 flex items-center justify-between font-mono text-sm backdrop-blur-lg border-b border-amber-500/30 shadow-xl">
      <div className="flex gap-6 items-center">
        <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-amber-500/20">
          <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
          <div className="w-[140px] min-w-[140px] text-center font-bold tracking-widest text-amber-100 bg-black/20 px-3 py-1 rounded">
            {time}
          </div>
        </div>
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent"></div>
        <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm border border-amber-500/20">
          <Calendar className="h-5 w-5 text-amber-400" />
          <span className="text-amber-100 font-medium">{date}</span>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-amber-500/20">
          <MapPin className="h-4 w-4 text-amber-400" />
          <span className="text-amber-100">نابلس، فلسطين</span>
        </div>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-amber-500/20">
          <Phone className="h-4 w-4 text-amber-400" />
          <span dir="ltr" className="text-amber-100">+972 59 437 1424</span>
        </div>
      </div>
    </div>
  );
}

// الروابط الاجتماعية
const SocialLinks = () => {
  const socialLinks = useMemo<SocialLink[]>(() => [
    {
      href: "https://wa.me/972594371424",
      icon: WhatsAppIcon,
      hoverClass: "hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600",
      title: "تواصل عبر واتساب",
      ariaLabel: "تواصل معنا عبر واتساب",
      color: "text-green-400"
    },
    {
      href: "https://www.instagram.com/a.w.samarah3/",
      icon: Instagram,
      hoverClass: "hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-500",
      title: "تابعنا على إنستغرام",
      ariaLabel: "تابعنا على إنستغرام",
      color: "text-pink-400"
    },
    {
      href: "https://www.facebook.com/a.w.samarah4",
      icon: Facebook,
      hoverClass: "hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700",
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
            className={`group relative bg-white/10 backdrop-blur-sm ${link.hoverClass} p-3 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900 border border-white/20 hover:border-white/40`}
            title={link.title}
            aria-label={link.ariaLabel}
          >
            <IconComponent className={`h-5 w-5 ${link.color} group-hover:text-white transition-colors`} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl animate-shimmer"></div>
          </a>
        );
      })}
    </div>
  );
};

// عرض الوقت والتاريخ
const TimeDisplay = () => {
  const { time, date } = useDateTime();

  return (
    <div className="bg-gradient-to-r from-black/40 to-black/30 backdrop-blur-lg rounded-xl px-6 py-3 border border-amber-500/30 shadow-xl">
      <div className="flex items-center gap-4 text-amber-100" style={{ direction: 'ltr' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
            <div className="absolute -inset-1 bg-amber-400/30 rounded-full blur-sm"></div>
          </div>
          <div className="w-[150px] text-center font-bold whitespace-nowrap overflow-hidden leading-none text-lg bg-black/20 px-3 py-1 rounded font-mono tracking-widest">
            {time}
          </div>
        </div>
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-amber-500/50 to-transparent"></div>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-amber-400" />
          <span className="font-medium font-mono tracking-wide bg-black/20 px-3 py-1 rounded">
            {date}
          </span>
        </div>
      </div>
    </div>
  );
};

// القائمة المحمولة
const MobileMenu = ({ isOpen, onClose, userRole }: { isOpen: boolean; onClose: () => void; userRole: string | null }) => {
  const navigationItems = useMemo<NavigationItem[]>(() => [
    { href: '/', label: 'الصفحة الرئيسية', icon: Home },
    { href: '/calculator', label: 'حاسبة الكميات', icon: Calculator },
    { href: '/projects', label: 'المشاريع', icon: FileText, roles: ['ENGINEER', 'OWNER'] },
    { href: '/reports', label: 'التقارير', icon: FileText, roles: ['ENGINEER', 'OWNER'] },
    { href: '/settings', label: 'الإعدادات', icon: Settings, roles: ['ENGINEER', 'OWNER'] },
    { href: '/contact', label: 'اتصل بنا', icon: Phone },
  ], []);

  const filteredItems = useMemo(() => 
    navigationItems.filter(item => !item.roles || item.roles.includes(userRole || '')),
    [navigationItems, userRole]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-80 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl border-l border-amber-500/30">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/30 bg-gradient-to-r from-amber-900/20 to-transparent">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
            القائمة الرئيسية
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/30"
            aria-label="إغلاق القائمة"
          >
            <X className="h-6 w-6 text-red-400" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-amber-600/10 transition-all duration-200 text-white border border-transparent hover:border-amber-500/30 group"
                >
                  <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20">
                    <item.icon className="h-5 w-5 text-amber-400 group-hover:text-amber-300" />
                  </div>
                  <span className="font-medium text-lg group-hover:text-amber-100">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

// قائمة المستخدم
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

  if (!userRole || ["OWNER", "ENGINEER", "ADMIN", "ADMN", "ADMINISTRATOR", "SUPERADMIN"].includes(userRole)) return null;

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      'ENGINEER': 'مهندس',
      'OWNER': 'مالك',
      'ADMIN': 'مدير',
      'USER': 'مستخدم'
    };
    return roles[role] || role;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 px-4 py-3 rounded-xl transition-all duration-200 text-white shadow-xl hover:shadow-amber-500/25 border border-amber-400/30 group"
        aria-label="قائمة المستخدم"
      >
        <div className="relative">
          <div className="p-2 bg-amber-400/20 rounded-lg group-hover:bg-amber-300/30">
            <User className="h-4 w-4" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
        </div>
        <span className="hidden md:block font-medium">{getRoleDisplay(userRole)}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-amber-500/30 z-50 backdrop-blur-lg">
          <div className="p-2">
            <div className="px-4 py-3 border-b border-amber-500/30 bg-gradient-to-r from-amber-900/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{getRoleDisplay(userRole)}</p>
                  <p className="text-amber-300/70 text-sm">مرحباً بك</p>
                </div>
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-amber-600/10 transition-colors text-white border border-transparent hover:border-amber-500/30"
              >
                <User className="h-5 w-5 text-amber-400" />
                <span>الملف الشخصي</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-amber-600/10 transition-colors text-white border border-transparent hover:border-amber-500/30"
              >
                <Settings className="h-5 w-5 text-amber-400" />
                <span>الإعدادات</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 transition-colors text-white w-full text-right border border-transparent hover:border-red-500/30"
              >
                <LogOut className="h-5 w-5 text-red-400" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// الشريط العلوي (روابط اجتماعية + آية + وقت)
const SocialAndClock = () => {
  const getDailyVerse = () => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return ayatAlKursiParts[dayOfYear % ayatAlKursiParts.length];
  };

  const dailyVerse = useMemo(() => getDailyVerse(), []);

  return (
    <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white py-3 backdrop-blur-lg border-b border-amber-500/30">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="flex-1 flex justify-start">
          <SocialLinks />
        </div>

        <div className="flex-shrink-0 text-xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent tracking-wider animate-pulse hidden lg:block px-4 py-2 bg-black/30 rounded-lg border border-amber-500/20">
          {dailyVerse}
        </div>

        <div className="flex-1 flex justify-end">
          <TimeDisplay />
        </div>
      </div>
    </div>
  );
};

// الشعار والعنوان مع تأثير توهج ذهبي
const LogoAndTitle = () => {
  const { settings } = useSettings();
  const siteName = settings?.siteName || "المحترف لحساب الكميات";

  const [glowIntensity, setGlowIntensity] = useState(0.5);

  return (
    <Link
      href="/"
      className="flex items-center gap-6 text-right group transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-2xl p-3 hover:bg-gradient-to-r hover:from-amber-500/5 hover:to-amber-600/5"
      aria-label="الصفحة الرئيسية - المحترف لحساب الكميات"
      onMouseEnter={() => setGlowIntensity(1)}
      onMouseLeave={() => setGlowIntensity(0.5)}
    >
      {/* حاوية الشعار بتأثير التوهج الذهبي */}
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-2xl blur-xl transition-all duration-500"
          style={{
            background: `radial-gradient(circle at center, 
              rgba(251, 191, 36, ${glowIntensity}) 0%, 
              rgba(251, 191, 36, ${glowIntensity * 0.5}) 25%,
              rgba(251, 191, 36, ${glowIntensity * 0.2}) 50%,
              transparent 70%)`,
            transform: 'scale(1.1)',
          }}
        />
        
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-1.5 rounded-2xl border-2 border-amber-500/30 shadow-2xl group-hover:border-amber-400/50 transition-all duration-300">
          <Image
            src={APP_LOGO_SRC}
            unoptimized
            alt="شعار المحترف لحساب الكميات"
            width={80}
            height={80}
            className="rounded-xl object-contain"
            priority
          />
          
          {/* مؤشر الحالة */}
          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-3 border-gray-900 flex items-center justify-center shadow-lg">
            <Shield className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>

      {/* تفاصيل العنوان */}
      <div className="hidden md:block">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-amber-200 transition-all duration-500">
          {siteName}
        </h1>
        <p className="text-lg text-gray-300 group-hover:text-amber-100 transition-colors duration-300 font-medium mt-1">
          للحديد والباطون والابنية الانشائية
        </p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 text-amber-400 fill-current" />
          ))}
          <span className="text-sm text-gray-400 mr-2 font-medium">خدمة متميزة</span>
          <Award className="h-4 w-4 text-amber-400 ml-2" />
        </div>
      </div>
      <div className="md:hidden">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
          {siteName.split(' ')[0] || "المحترف"}
        </h1>
        <p className="text-sm text-gray-300 group-hover:text-amber-100 transition-colors duration-300 font-medium">
          لحساب الكميات
        </p>
      </div>
    </Link>
  );
};

// ==================== المكون الرئيسي ====================
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
      
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white relative overflow-hidden">
        {/* تأثيرات خلفية متقدمة */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent_0deg,_rgba(251,191,36,0.1)_360deg)] opacity-30"></div>
          <div className="absolute top-0 left-1/3 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto flex h-28 items-center justify-between px-6 relative z-10">
          {/* الجانب الأيمن */}
          <div className="flex items-center gap-6">
            {/* زر القائمة المحمولة */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 transition-all duration-200 border border-amber-500/30"
              aria-label="فتح القائمة الرئيسية"
            >
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-amber-400 rounded-full"></div>
                <div className="w-6 h-0.5 bg-amber-400 rounded-full"></div>
                <div className="w-4 h-0.5 bg-amber-400 rounded-full ml-auto"></div>
              </div>
            </button>

            <LogoAndTitle />
          </div>

          {/* الجانب الأيسر */}
          <div className="flex items-center gap-4">
            {!isLoading && showNotifications && (
              <div className="animate-fade-in">
                <div className="relative">
                  <NotificationsFixed />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse border border-white/50"></div>
                </div>
              </div>
            )}
            <UserMenu userRole={userRole} />
          </div>
        </div>
      </div>

      {/* خط ذهبي متحرك محسن */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer"></div>
      </div>

      <MobileMenu isOpen={isOpen} onClose={closeMenu} userRole={userRole} />
    </header>
  );
}

// ==================== الأنماط المخصصة ====================
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

  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  .animate-shimmer {
    animation: shimmer 3s infinite linear;
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  /* تحسينات الأداء */
  .backdrop-blur-lg {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  /* تدرجات ذهبية محسنة */
  .bg-gradient-gold {
    background: linear-gradient(135deg, 
      #fbbf24 0%, 
      #f59e0b 25%, 
      #d97706 50%, 
      #b45309 75%, 
      #92400e 100%
    );
  }

  /* تأثيرات الظل المحسنة */
  .shadow-gold {
    box-shadow: 
      0 10px 40px rgba(251, 191, 36, 0.15),
      0 5px 20px rgba(251, 191, 36, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  /* تحسينات للهواتف */
  @media (max-width: 768px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    
    .text-balance {
      text-wrap: balance;
    }
  }

  /* تحسين الوصولية */
  :focus-visible {
    outline: 2px solid #fbbf24;
    outline-offset: 2px;
  }

  /* تحسينات التدرج النصي */
  .bg-clip-text {
    background-clip: text;
    -webkit-background-clip: text;
    text-fill-color: transparent;
    -webkit-text-fill-color: transparent;
  }

  /* حدود ذهبية محسنة */
  .border-gold-gradient {
    border-image: linear-gradient(45deg, #fbbf24, #d97706, #fbbf24) 1;
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