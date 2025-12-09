"use client";
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
  const siteName = settings?.siteName || "المحترف لحساب الكميات";
  const isLoadingSettings = isLoading;
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { key: 'home', href: '/', label: 'الرئيسية' },
    { key: 'about', href: '/about', label: 'عن الموقع' },
    { key: 'contact', href: 'https://forms.gle/WaXPkD8BZMQ7pVev6', label: 'تواصل معنا' },
    { key: 'help', href: '/help', label: 'مركز المساعدة' },
    {
      key: 'create-account',
      isCustom: true,
      label: (
        <>
          إنشاء حساب كـ{' '}
          <Link href="/signup" className="text-app-gold hover:text-app-red transition-colors duration-200 hover:underline mx-1">
            مهندس
          </Link>{' '}
          أو{' '}
          <Link href="/owner-signup" className="text-app-gold hover:text-app-red transition-colors duration-200 hover:underline mx-1">
            مالك
          </Link>
        </>
      )
    },
    {
      key: 'user-login',
      isCustom: true,
      label: (
        <>
          تسجيل الدخول كـ{' '}
          <Link href="/login" className="text-app-gold hover:text-app-red transition-colors duration-200 hover:underline mx-1">
            مهندس
          </Link>{' '}
          أو{' '}
          <Link href="/owner-login" className="text-app-gold hover:text-app-red transition-colors duration-200 hover:underline mx-1">
            مالك
          </Link>
        </>
      )
    },
    { key: 'admin-login', href: '/admin-login', label: 'تسجيل دخول المدير' },
  ];

  const socialLinks = [
    { name: "Instagram", href: "https://www.instagram.com/a.w.samarah3/", icon: Instagram, hoverBg: "hover:bg-[#d62976]" },
    { name: "Facebook", href: "https://www.facebook.com/a.w.samarah4", icon: Facebook, hoverBg: "hover:bg-[#3b5998]" },
    { name: "WhatsApp", href: "https://wa.me/972594371424", icon: WhatsAppIcon, hoverBg: "hover:bg-[#128c7e]" },
  ];

  return (
    <footer className="bg-slate-900 text-white mt-auto relative overflow-hidden" dir="rtl">
      <Image
        src="/footer-logo.jpg"
        alt="خلفية تذييل معمارية"
        fill
        quality={75}
        className="absolute inset-0 z-0 opacity-5 object-cover"
        data-ai-hint="architecture blueprint"
      />
      <div className="absolute inset-0 bg-slate-900/80 z-0" />

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-app-gold via-app-red to-app-gold"></div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="text-center lg:text-right">
            <div className="flex items-center justify-center lg:justify-start mb-3">
              <div className="relative">
                <Image
                  src={APP_LOGO_SRC}
                  alt="شعار الموقع"
                  width={80}
                  height={80}
                  className="rounded-lg border-2 border-app-gold shadow-md shadow-app-gold/30 object-contain"
                  data-ai-hint="logo construction"
                  unoptimized
                />
              </div>
              <div className="mr-3">
                <h3 className="text-app-red text-lg font-bold leading-tight">{isLoadingSettings ? '...' : siteName}</h3>
                <p className="text-app-gold text-xs font-medium">دقة في الحساب • ثقة في النتائج</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              نقدم أدوات دقيقة وسهلة الاستخدام لحساب كميات مواد البناء لمشاريعكم الإنشائية.
            </p>
          </div>

          <div className="text-center lg:text-right">
            <h4 className="text-base font-semibold text-app-gold mb-3 relative pb-1">
              روابط سريعة
              <span className="block absolute bottom-0 right-0 w-10 h-0.5 bg-app-gold"></span>
            </h4>
            <nav>
              <ul className="space-y-1.5 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.key}>
                    {link.isCustom ? (
                      <div className="group flex items-center justify-center lg:justify-start gap-1.5 text-gray-300 py-0.5">
                        <span>{link.label}</span>
                      </div>
                    ) : (
                      <Link
                        href={link.href!}
                        target={link.href!.startsWith('/') ? '_self' : '_blank'}
                        rel={link.href!.startsWith('/') ? '' : 'noopener noreferrer'}
                        className="group flex items-center justify-center lg:justify-start gap-1.5 text-gray-300 hover:text-app-gold transition-colors duration-200 py-0.5"
                      >
                        <span className="mr-1">{link.label}</span>
                        {link.href && link.href.startsWith('http') && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="text-center lg:text-right">
            <h4 className="text-base font-semibold text-app-gold mb-3 relative pb-1">
              اتصل بنا
              <span className="block absolute bottom-0 right-0 w-10 h-0.5 bg-app-gold"></span>
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="group flex items-center justify-center lg:justify-start gap-2 text-gray-300">
                <Mail className="h-4 w-4 text-app-gold group-hover:text-app-red flex-shrink-0 transition-colors" />
                <a
                  href="mailto:mediaplus64@gmail.com"
                  className="hover:text-app-gold transition-colors truncate"
                >
                  mediaplus64@gmail.com
                </a>
              </div>
              <div className="group flex items-center justify-center lg:justify-start gap-2 text-gray-300">
                <WhatsAppIcon className="h-4 w-4 text-app-gold group-hover:text-app-red flex-shrink-0 transition-colors" />
                <a
                  href="tel:+972594371424"
                  className="hover:text-app-gold transition-colors"
                >
                  +972594371424
                </a>
              </div>
              <div className="group flex items-center justify-center lg:justify-start gap-2 text-gray-300">
                <MapPin className="h-4 w-4 text-app-gold group-hover:text-app-red flex-shrink-0 transition-colors" />
                <span>سلفيت، فلسطين</span>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <h4 className="text-base font-semibold text-app-gold mb-3 relative pb-1">
              تابعنا
              <span className="block absolute bottom-0 right-0 w-10 h-0.5 bg-app-gold"></span>
            </h4>
            <ul className="flex justify-center lg:justify-start items-center gap-4">
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
                        "group w-[52px] h-[52px] rounded-full bg-gray-700 flex items-center justify-center overflow-hidden transition-all duration-300",
                        link.hoverBg,
                        "active:scale-90"
                      )}
                    >
                      <IconComponent
                        className="w-6 h-6 text-white transition-transform duration-300 group-hover:animate-slide-in-top"
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="my-6">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
            <span>&copy; {currentYear} {isLoadingSettings ? '...' : siteName}. جميع الحقوق محفوظة.</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <span>صُنع بـ</span>
            <Heart className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            <span>في فلسطين | تصميم وتطوير:</span>
            <Link
              href="https://www.facebook.com/a.w.samarah4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-app-gold hover:text-app-red transition-colors font-medium"
            >
              عميد سماره
            </Link>
            <span> و </span>
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-app-gold hover:text-app-red transition-colors font-medium"
            >
              عنان كايد
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-app-gold via-app-red to-app-gold"></div>
    </footer>
  );
};

export default Footer;
