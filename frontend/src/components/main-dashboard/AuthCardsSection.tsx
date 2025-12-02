"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  LogIn,
  UserPlus,
  HardHat,
  Home as HomeIcon,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Building2,
  Briefcase
} from "lucide-react";
import InfoCard from "@/components/ui/InfoCard";
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const authCardsData = [
  {
    id: "signup",
    icon: <UserPlus className="h-10 w-10 text-white" />,
    iconWrapperClass: "bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-pink-500/20",
    title: "إنشاء حساب جديد",
    description: "انضم إلى منصة إدارة المشاريع وابدأ رحلتك في إدارة مشاريعك بكفاءة واحترافية.",
    frontCustomClass: "bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm",
    backCustomClass: "bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800",
    badge: "جديد",
    badgeColor: "bg-gradient-to-r from-rose-500 to-pink-600",
    back: {
      title: "اختر نوع حسابك",
      description: "اختر النوع الذي يناسب احتياجاتك للبدء في إدارة مشاريعك",
      actions: [
        {
          label: "حساب مهندس",
          href: "/signup",
          icon: <Briefcase className="h-5 w-5" />,
          description: "للإشراف على المشاريع والتنفيذ",
          buttonClass: "bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm",
        },
        {
          label: "حساب مالك",
          href: "/owner-signup",
          icon: <Building2 className="h-5 w-5" />,
          description: "لمتابعة المشاريع والموارد",
          buttonClass: "bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm",
        },
      ],
    },
  },
  {
    id: "user-login",
    icon: <LogIn className="h-10 w-10 text-white" />,
    iconWrapperClass: "bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/20",
    title: "تسجيل الدخول",
    description: "لديك حساب بالفعل؟ تابع أعمالك من حيث توقفت باستخدام بيانات الدخول الخاصة بك.",
    frontCustomClass: "bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm",
    backCustomClass: "bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-800",
    back: {
      title: "بوابة الدخول",
      description: "اختر نوع الحساب للدخول إلى لوحة التحكم الخاصة بك",
      actions: [
        {
          label: "دخول كمهندس",
          href: "/login",
          icon: <Briefcase className="h-5 w-5" />,
          description: "لوحة تحكم المهندس",
          buttonClass: "bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm",
        },
        {
          label: "دخول كمالك",
          href: "/owner-login",
          icon: <Building2 className="h-5 w-5" />,
          description: "لوحة تحكم المالك",
          buttonClass: "bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 backdrop-blur-sm",
        },
      ],
    },
  },
  {
    id: "admin-login",
    icon: <ShieldCheck className="h-10 w-10 text-white" />,
    iconWrapperClass: "bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20",
    title: "لوحة المسؤول",
    description: "إدارة النظام الكاملة، المستخدمين، الصلاحيات، والإحصائيات في مكان واحد.",
    frontCustomClass: "bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm",
    backCustomClass: "bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800",
    featured: true,
    back: {
      title: "الإدارة المتكاملة",
      description: "الوصول إلى أدوات التحكم والإدارة المتقدمة للنظام",
      actions: [
        {
          label: "الدخول كمسؤول",
          href: "/admin-login",
          icon: <ShieldCheck className="h-5 w-5"/>,
          description: "إدارة النظام بالكامل",
          buttonClass: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-white border-emerald-400/30 hover:border-emerald-400/50 backdrop-blur-sm",
        },
      ],
    },
  },
];

export default function AuthCardsSection() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <section 
      id="start-journey" 
      className="relative py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500" />
      <div className="absolute top-20 -left-20 w-64 h-64 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full mb-6 border border-blue-100">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">بوابات الدخول المتكاملة</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            ابدأ رحلتك الاحترافية
          </h2>
          
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
            اختر البوابة المناسبة لتبدأ في إدارة مشاريعك بكفاءة واحترافية عالية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {authCardsData.map((card) => (
            <div 
              key={card.id}
              className={cn(
                "relative transition-all duration-300 hover:-translate-y-1",
                card.featured && "md:col-span-2 lg:col-span-1 lg:scale-[1.05]"
              )}
              onMouseEnter={() => setActiveCard(card.id)}
              onMouseLeave={() => setActiveCard(null)}
            >
              {card.featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-full shadow-lg">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3" />
                      مميز
                    </span>
                  </div>
                </div>
              )}
              
              {card.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 px-3 py-1 ${card.badgeColor} text-white text-xs font-semibold rounded-full shadow-lg`}>
                  {card.badge}
                </div>
              )}
              
              <InfoCard 
                applyFlipEffect={true}
                title={card.title}
                description={card.description}
                icon={card.icon}
                iconWrapperClass={cn(
                  "p-4 rounded-2xl shadow-lg transition-all duration-300",
                  card.iconWrapperClass,
                  activeCard === card.id && "scale-110 shadow-xl"
                )}
                dataAiHint={card.id}
                frontCustomClass={cn(
                  "relative overflow-hidden border border-gray-200/50 shadow-lg rounded-2xl",
                  card.frontCustomClass,
                  activeCard === card.id && "shadow-xl border-gray-300/50"
                )}
                backCustomClass={cn(
                  "relative overflow-hidden border border-transparent shadow-xl rounded-2xl",
                  card.backCustomClass
                )}
                flipTrigger="hover"
                backCustomContent={
                  <div className="flex flex-col justify-center items-center h-full text-white p-6">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/30 to-transparent" />
                    
                    <h3 className="text-2xl font-bold mb-3 text-center">{card.back.title}</h3>
                    <p className="text-white/90 text-sm mb-8 text-center leading-relaxed">
                      {card.back.description}
                    </p>
                    
                    <div className="w-full space-y-4">
                      {card.back.actions.map((action) => (
                        <Button
                          key={action.href}
                          asChild
                          className={cn(
                            "group w-full justify-between py-4 px-5 rounded-xl font-semibold transition-all duration-300 border hover:shadow-lg",
                            action.buttonClass
                          )}
                          variant="ghost"
                        >
                          <Link href={action.href}>
                            <div className="flex flex-col items-start gap-1">
                              <span className="flex items-center gap-2 text-base">
                                {action.icon}
                                {action.label}
                              </span>
                              {action.description && (
                                <span className="text-xs text-white/70 font-normal">
                                  {action.description}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                    
                    <div className="absolute bottom-4 text-xs text-white/50 mt-6">
                      اضغط للعودة
                    </div>
                  </div>
                }
                frontCustomContent={
                  <div className="relative h-full flex flex-col">
                    <div className="absolute top-6 right-6">
                      <div className={cn(
                        "p-3 rounded-xl transition-all duration-300",
                        card.iconWrapperClass
                      )}>
                        {card.icon}
                      </div>
                    </div>
                    
                    <div className="mt-24 flex-grow">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {card.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          اضغط للتفاصيل
                        </span>
                        <div className="flex items-center gap-1 text-blue-600">
                          <span className="text-sm font-medium">اختر</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-sm">أسس حسابك في أقل من دقيقتين</span>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}