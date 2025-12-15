'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, ExternalLink, Heart, Facebook, Instagram } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import WhatsAppIcon from '../icons/WhatsAppIcon';
import { APP_LOGO_SRC } from '@/lib/branding';
import { useSettings } from '@/contexts/SettingsContext';

const Footer = () => {
  const { settings, isLoading } = useSettings();
  const siteName = settings?.siteName || 'المحترف لحساب الكميات';
  const isLoadingSettings = isLoading;
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { key: 'home', href: '/', label: 'الرئيسية' },
    { key: 'about', href: '/about', label: 'عن الموقع' },
    { key: 'contact', href: '/contact', label: 'تواصل معنا' },
    { key: 'help', href: '/help', label: 'مركز المساعدة' },
    {
      key: 'create-account',
      isCustom: true,
      label: (
        <>
          إنشاء حساب كـ{' '}
          <Link href="/signup" className="text-cyan-400 hover:text-purple-400 transition-colors duration-200 hover:underline mx-1 font-semibold">
            مهندس
          </Link>{' '}
          أو{' '}
          <Link href="/owner-signup" className="text-cyan-400 hover:text-purple-400 transition-colors duration-200 hover:underline mx-1 font-semibold">
            مالك
          </Link>
        </>
      ),
    },
    {
      key: 'user-login',
      isCustom: true,
      label: (
        <>
          تسجيل الدخول كـ{' '}
          <Link href="/login" className="text-cyan-400 hover:text-purple-400 transition-colors duration-200 hover:underline mx-1 font-semibold">
            مهندس
          </Link>{' '}
          أو{' '}
          <Link href="/owner-login" className="text-cyan-400 hover:text-purple-400 transition-colors duration-200 hover:underline mx-1 font-semibold">
            مالك
          </Link>
        </>
      ),
    },
    { key: 'admin-login', href: '/admin-login', label: 'تسجيل دخول المدير' },
  ];

  const socialLinks = [
    { name: 'Instagram', href: 'https://www.instagram.com/a.w.samarah3/', icon: Instagram, hoverBg: 'hover:bg-gradient-to-br hover:from-pink-500 hover:to-red-500' },
    { name: 'Facebook', href: 'https://www.facebook.com/a.w.samarah4', icon: Facebook, hoverBg: 'hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-700' },
    { name: 'WhatsApp', href: 'https://wa.me/972594371424', icon: WhatsAppIcon, hoverBg: 'hover:bg-gradient-to-br hover:from-green-400 hover:to-green-600' },
  ];

  return (
    <footer className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white mt-auto relative overflow-hidden" dir="rtl">
      <Image
        src="/footer-logo.jpg"
        alt="خلفية تذييل معمارية"
        fill
        quality={75}
        className="absolute inset-0 z-0 opacity-10 object-cover"
        data-ai-hint="architecture blueprint"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/80 to-slate-950/70 z-0" />

      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 via-pink-500 to-orange-500 shadow-lg shadow-purple-500/50"></div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="text-center lg:text-right">
            <div className="flex items-center justify-center lg:justify-start mb-6 hover:scale-105 transition-transform duration-300">
              <Link href="/" aria-label="العودة إلى الصفحة الرئيسية">
                <Image
                  src={APP_LOGO_SRC}
                  alt="شعار الموقع"
                  width={90}
                  height={90}
                  className="rounded-lg border-2 border-cyan-400 shadow-lg shadow-cyan-400/40 object-contain"
                  data-ai-hint="logo construction"
                  unoptimized
                />
              </Link>
              <div className="mr-4">
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-2xl font-bold leading-tight">{isLoadingSettings ? '...' : siteName}</h3>
                <p className="text-cyan-300 text-sm font-semibold tracking-wide">دقة في الحساب • ثقة في النتائج</p>
              </div>
            </div>
            <p className="text-gray-200 text-sm leading-relaxed">
              نقدم أدوات دقيقة وسهلة الاستخدام لحساب كميات مواد البناء لمشاريعكم الإنشائية.
            </p>
          </div>

          <div className="text-center lg:text-right">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-6 relative pb-3">
              روابط سريعة
              <span className="block absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></span>
            </h4>
            <nav>
              <ul className="space-y-3 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.key}>
                    {link.isCustom ? (
                      <div className="group flex items-center justify-center lg:justify-start gap-2 text-gray-200 py-2">
                        <span className="text-xs sm:text-sm">{link.label}</span>
                      </div>
                    ) : (
                      <Link
                        href={link.href!}
                        target={link.href!.startsWith('/') ? '_self' : '_blank'}
                        rel={link.href!.startsWith('/') ? '' : 'noopener noreferrer'}
                        className="group flex items-center justify-center lg:justify-start gap-2 text-gray-300 hover:text-cyan-300 hover:translate-x-1 transition-all duration-200 py-2"
                      >
                        <span className="mr-1">{link.label}</span>
                        {link.href && link.href.startsWith('http') && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="text-center lg:text-right">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6 relative pb-3">
              اتصل بنا
              <span className="block absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></span>
            </h4>
            <div className="space-y-4 text-sm">
              <div className="group flex items-center justify-center lg:justify-start gap-3 text-gray-200 hover:text-purple-300 transition-colors cursor-pointer">
                <Mail className="h-5 w-5 text-purple-400 group-hover:text-pink-400 flex-shrink-0 transition-colors" />
                <a href="mailto:mediaplus64@gmail.com" className="hover:underline truncate">
                  mediaplus64@gmail.com
                </a>
              </div>
              <div className="group flex items-center justify-center lg:justify-start gap-3 text-gray-200 hover:text-green-300 transition-colors cursor-pointer">
                <WhatsAppIcon className="h-5 w-5 text-green-400 group-hover:text-green-300 flex-shrink-0 transition-colors" />
                <a href="tel:+972594371424" className="hover:underline">
                  +972594371424
                </a>
              </div>
              <div className="group flex items-center justify-center lg:justify-start gap-3 text-gray-200 hover:text-orange-300 transition-colors cursor-pointer">
                <MapPin className="h-5 w-5 text-orange-400 group-hover:text-orange-300 flex-shrink-0 transition-colors" />
                <span>سلفيت، فلسطين</span>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400 mb-6 relative pb-3">
              تابعنا
              <span className="block absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full"></span>
            </h4>
            <ul className="flex justify-center lg:justify-start items-center gap-5">
              {socialLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.name}
                      className={cn(
                        'group w-[56px] h-[56px] rounded-full bg-gray-700 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110',
                        link.hoverBg,
                        'active:scale-90'
                      )}
                    >
                      <IconComponent className="w-7 h-7 text-white transition-transform duration-300 group-hover:animate-slide-in-top" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="my-10">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-600 via-30% to-transparent"></div>
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-300">
            <span>&copy; {currentYear} {isLoadingSettings ? '...' : siteName}. جميع الحقوق محفوظة.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-400">
            <span>صُنع بـ</span>
            <Heart className="h-4 w-4 text-red-500 animate-pulse" />
            <span>في فلسطين | تصميم وتطوير:</span>
            <Link
              href="https://www.facebook.com/a.w.samarah4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-purple-400 transition-colors font-semibold underline"
            >
              عميد سماره
            </Link>
            <span> و </span>
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-purple-400 transition-colors font-semibold underline"
            >
              عنان كايد
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 via-purple-500 via-pink-500 to-orange-500"></div>
    </footer>
  );
};

export default Footer;
