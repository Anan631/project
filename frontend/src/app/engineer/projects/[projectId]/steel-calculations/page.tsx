"use client";

import { useParams } from 'next/navigation';
import {
  Building2,
  ArrowRight,
  Blocks,
  Layers,
  Component,
  Grid3x3,
  Columns,
  LayoutDashboard
} from "lucide-react";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function SteelCalculationsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const calculationCards = [
    {
      id: 'foundation',
      title: 'القواعد',
      description: 'حساب كميات الحديد للقواعد وفق المعايير الهندسية',
      icon: Blocks,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBorder: 'hover:border-green-500',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'column-base',
      title: 'شروش الأعمدة',
      description: 'حساب كميات الحديد لرقاب الأعمدة (الشروش)',
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-500',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'ground-beams',
      title: 'الجسور الأرضية',
      description: 'حساب كميات الحديد للجسور الأرضية (الميدات)',
      icon: Component,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-500',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'ground-slab',
      title: 'أرضية المبنى',
      description: 'حساب كميات الحديد لأرضية المبنى (Slab on Grade)',
      icon: Grid3x3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-500',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      id: 'columns',
      title: 'الأعمدة والكانات (الأساور)',
      description: 'حساب كميات الحديد للأعمدة الخرسانية والكانات',
      icon: Columns,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      hoverBorder: 'hover:border-pink-500',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      id: 'roof-beam',
      title: ' جسر السقف',
      description: 'حساب كميات الحديد لجسور السقف الخرسانية',
      icon: LayoutDashboard,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      hoverBorder: 'hover:border-cyan-500',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'roof-ribs',
      title: 'أعصاب السقف',
      description: 'حساب كميات الحديد لأعصاب السقف والبلاطات المفرغة',
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBorder: 'hover:border-purple-500',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'roof-slab',
      title: 'السقف',
      description: 'حساب كميات الحديد للأسقف والبلاطات الخرسانية',
      icon: Grid3x3,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverBorder: 'hover:border-red-500',
      gradient: 'from-red-500 to-rose-600'
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4 min-h-screen bg-gray-50/50" dir="rtl">

      {/* Header Section */}
      <div className="mb-12 text-center space-y-4">
        <div className="inline-block p-3 rounded-2xl bg-white shadow-sm mb-4">
          <Building2 className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          حاسبة كميات الحديد
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-600">
          اختر العنصر الإنشائي للبدء في حساب كميات الحديد بدقة وسهولة.
        </p>

        <Link href={`/engineer/projects/${projectId}`}>
          <Button variant="outline" className="mt-6 gap-2 hover:bg-gray-100 transition-colors">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمشروع
          </Button>
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {calculationCards.map((card, index) => (
          <Link
            key={card.id}
            href={
              card.id === 'ground-slab'
                ? `/engineer/projects/${projectId}/steel-calculations/ground-slab`
                : card.id === 'roof-slab'
                ? `/engineer/projects/${projectId}/steel-calculations/roof-slab`
                : card.id === 'roof-ribs'
                ? `/engineer/projects/${projectId}/steel-calculations/roof-ribs`
                : '#'
            }
            className={cn(
              "group block h-full",
              (card.id === 'ground-slab' || card.id === 'roof-slab' || card.id === 'roof-ribs') ? 'cursor-pointer' : 'cursor-not-allowed',
              card.id !== 'ground-slab' && card.id !== 'roof-slab' && card.id !== 'roof-ribs' && 'opacity-80'
            )}
            aria-disabled={card.id !== 'ground-slab' && card.id !== 'roof-slab' && card.id !== 'roof-ribs'}
          >
            <div className={cn(
              "relative h-full rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-white to-gray-50/50",
              "border border-gray-200/60",
              "transition-all duration-700 ease-out",
              "hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]",
              "hover:border-transparent",
              "hover:-translate-y-1 hover:scale-[1.02]"
            )}>
              
              {/* Gradient Overlay on Hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
                "bg-gradient-to-br pointer-events-none",
                card.gradient,
                "mix-blend-soft-light"
              )} style={{ opacity: 0.03 }} />

              {/* Content Container */}
              <div className="relative p-7 flex flex-col h-full">
                
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                  
                  {/* Icon with Animated Background */}
                  <div className="relative">
                    <div className={cn(
                      "absolute inset-0 rounded-xl blur-2xl opacity-0 group-hover:opacity-60",
                      "transition-all duration-700",
                      "bg-gradient-to-br",
                      card.gradient
                    )} />
                    <div className={cn(
                      "relative w-14 h-14 rounded-xl flex items-center justify-center",
                      "transition-all duration-500",
                      "bg-gradient-to-br shadow-lg",
                      card.gradient,
                      "group-hover:scale-110 group-hover:rotate-6"
                    )}>
                      <card.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* Number Badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    "text-xs font-bold transition-all duration-500",
                    "bg-gray-100 text-gray-400",
                    "group-hover:bg-gradient-to-br group-hover:text-white group-hover:scale-110",
                    card.gradient
                  )}>
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="flex-grow mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2.5 leading-tight group-hover:text-gray-800 transition-colors duration-300">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Action Footer */}
                <div className="relative">
                  {/* Divider Line */}
                  <div className={cn(
                    "h-px w-full mb-4 transition-all duration-500",
                    "bg-gradient-to-r from-transparent via-gray-200 to-transparent",
                    "group-hover:via-gray-300"
                  )} />
                  
                  {/* CTA Button */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-sm font-semibold transition-all duration-300",
                      "flex items-center gap-2",
                      card.color
                    )}>
                      <span>ابدأ الحساب</span>
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-transform duration-500",
                        "group-hover:-translate-x-2"
                      )} strokeWidth={2.5} />
                    </span>

                    {/* Animated Circle */}
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center",
                      "transition-all duration-500",
                      "bg-gray-100 group-hover:bg-gradient-to-br",
                      card.gradient,
                      "group-hover:scale-110 group-hover:rotate-90"
                    )}>
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-colors duration-500",
                        card.color,
                        "group-hover:text-white"
                      )} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Corner Accent */}
              <div className={cn(
                "absolute top-0 left-0 w-24 h-24 opacity-0 group-hover:opacity-10",
                "transition-opacity duration-700",
                "bg-gradient-to-br rounded-br-full",
                card.gradient
              )} />

              {/* Bottom Right Accent */}
              <div className={cn(
                "absolute bottom-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-5",
                "transition-opacity duration-700",
                "bg-gradient-to-tl rounded-tl-full",
                card.gradient
              )} />

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}