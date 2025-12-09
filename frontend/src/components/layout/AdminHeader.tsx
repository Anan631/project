"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook } from 'lucide-react';
import NotificationsFixed from './NotificationsFixed';
import WhatsAppIcon from '../icons/WhatsAppIcon';

// Social & Clock Component
const SocialAndClock = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // ثابت العرض للوقت
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
      setTime(`${formattedHours}:${minutes}:${seconds} ${ampm}`);
      setDate(now.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateDateTime();
    const timerId = setInterval(updateDateTime, 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="bg-slate-800 text-white text-sm py-2">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Left Side: Social Icons */}
        <div className="flex-1 flex justify-start">
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/972594371424"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-800/70 hover:bg-green-600 p-2.5 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md"
              title="تواصل عبر واتساب"
            >
              <WhatsAppIcon className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
            </a>
            <a
              href="https://www.instagram.com/a.w.samarah3/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-800/70 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 p-2.5 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md"
              title="تابعنا على إنستغرام"
            >
              <Instagram className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
            </a>
            <a
              href="https://www.facebook.com/a.w.samarah4"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-800/70 hover:bg-blue-600 p-2.5 rounded-lg transition-all duration-300 transform hover:scale-110 hover:shadow-md"
              title="تابعنا على فيسبوك"
            >
              <Facebook className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>

        {/* Center: Bismillah */}
        <div className="flex-shrink-0 text-lg font-semibold text-app-gold tracking-wider">
          بِسْمِ اللهِ الرَّحْمنِ الرَّحِيم
        </div>

        {/* Right Side: Time and Date */}
        <div className="flex-1 flex justify-end">
          <div className="bg-slate-800/70 rounded-lg px-4 py-2">
            <div className="flex items-center gap-4 text-gray-300" style={{ direction: 'ltr' }}>
              <div
                className="w-[140px] text-center font-bold whitespace-nowrap overflow-hidden leading-none flex-shrink-0"
                style={{
                  fontFamily: 'Roboto Mono, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.1em',
                }}
              >
                {time}
              </div>
              <span
                style={{
                  fontFamily: 'Roboto Mono, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.1em',
                }}
              >
                -
              </span>
              <span
                style={{
                  fontFamily: 'Roboto Mono, monospace',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.1em',
                }}
              >
                {date}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Header Component
export default function AdminHeader() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();

  // تحميل دور المستخدم من التخزين المحلي عند تغيير المسار
  useEffect(() => {
    // التأكد من أن الكود يعمل فقط في العميل
    if (typeof window !== 'undefined') {
      try {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        setUserRole(null);
      }
    }
  }, [pathname]);

  // تحديد ما إذا كان يجب عرض إشعارات بناءً على دور المستخدم
  const showNotifications = userRole === 'ENGINEER' || userRole === 'OWNER';

  return (
    <header className="shadow-md">
      <SocialAndClock />
      <div className="bg-slate-800 text-white backdrop-blur-sm transition-all duration-300">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          {/* Right Side: Spacer */}
          <div className="flex-1 flex justify-start">
            {/* This is a spacer to balance the layout */}
          </div>

          {/* Center: Logo & Title */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-4 text-right">
              <Image src="/admin-logo.jpg" alt="شعار الموقع" width={56} height={56} className="rounded-full border-2 border-app-gold" data-ai-hint="logo construction" />
              <div>
                <h1 className="text-3xl font-extrabold text-app-red">حساب أسعار المواد</h1>
                <p className="text-base text-gray-400">أدوات احتساب كميات الحديد والباطون للمشروع</p>
              </div>
            </Link>
          </div>

          {/* Left Side: Notifications */}
          <div className="flex-1 flex justify-end">
            {showNotifications && <NotificationsFixed />}
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-app-gold transition-all duration-300" />
    </header>
  );
}
