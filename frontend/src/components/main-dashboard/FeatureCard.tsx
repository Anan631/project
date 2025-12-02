"use client";

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  iconBgColor?: string;
  className?: string;
  dataAiHint?: string;
  badge?: string;
  badgeVariant?: 'default' | 'premium' | 'new' | 'popular';
  onClick?: () => void;
  showCTA?: boolean;
  stats?: string;
  gradientDirection?: 'top-right' | 'bottom-left' | 'diagonal';
}

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  iconBgColor = "bg-gradient-to-br from-blue-500/10 to-indigo-500/10", 
  className, 
  dataAiHint,
  badge,
  badgeVariant = 'default',
  onClick,
  showCTA = true,
  stats,
  gradientDirection = 'top-right'
}: FeatureCardProps) => {
  
  const badgeConfig = {
    default: "bg-gradient-to-r from-gray-600 to-gray-800",
    premium: "bg-gradient-to-r from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25",
    new: "bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25",
    popular: "bg-gradient-to-r from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25"
  };

  const gradientDirections = {
    'top-right': 'from-transparent via-blue-500/5 to-indigo-500/10',
    'bottom-left': 'from-indigo-500/10 via-blue-500/5 to-transparent',
    'diagonal': 'from-blue-500/5 via-transparent to-indigo-500/10'
  };

  return (
    <Card 
      className={cn(
        "group relative bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm",
        "shadow-lg hover:shadow-2xl rounded-3xl p-7",
        "border border-gray-200/60 hover:border-blue-200/80",
        "transition-all duration-500 ease-out",
        "hover:-translate-y-2 cursor-pointer overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-br",
        `before:${gradientDirections[gradientDirection]}`,
        "before:opacity-0 before:group-hover:opacity-100",
        "before:transition-opacity before:duration-700",
        className
      )}
      data-ai-hint={dataAiHint || title.toLowerCase().replace(/\s+/g, '-')}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-500/5 to-transparent rounded-full blur-xl"></div>
      </div>

      {/* Badge */}
      {badge && (
        <div className={cn(
          "absolute top-4 right-4 text-white text-xs px-3 py-1.5 rounded-full font-semibold",
          "shadow-lg z-20 backdrop-blur-sm border border-white/20",
          badgeConfig[badgeVariant]
        )}>
          <div className="flex items-center gap-1.5">
            {badgeVariant === 'new' && <Sparkles className="h-3 w-3" />}
            {badgeVariant === 'premium' && <Zap className="h-3 w-3" />}
            {badgeVariant === 'popular' && <TrendingUp className="h-3 w-3" />}
            <span>{badge}</span>
          </div>
        </div>
      )}

      {/* Stats Indicator */}
      {stats && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-medium border border-emerald-200/60 z-20">
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3" />
            <span>{stats}</span>
          </div>
        </div>
      )}

      {/* Icon Container */}
      <div className="relative mb-7">
        <div className={cn(
          "relative inline-flex items-center justify-center p-5 rounded-2xl",
          "transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
          "shadow-lg group-hover:shadow-xl",
          iconBgColor,
          "before:absolute before:inset-0 before:rounded-2xl",
          "before:bg-gradient-to-br before:from-white/50 before:to-transparent",
          "before:opacity-0 before:group-hover:opacity-100",
          "before:transition-opacity before:duration-500"
        )}>
          <div className="relative z-10">
            {icon}
          </div>
          
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500"></div>
          
          {/* Sparkle Effects */}
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 group-hover:animate-pulse" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-6">
            {description}
          </p>
          
          {/* CTA Button */}
          {showCTA && (
            <div className="flex items-center justify-between pt-5 border-t border-gray-200/60 group-hover:border-blue-200/80 transition-colors duration-300">
              <button className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium text-sm transition-all duration-300 group/btn">
                <span className="relative">
                  اكتشف المزيد
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover/btn:w-full transition-all duration-300"></span>
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:text-blue-600" />
              </button>
              
              {/* Optional Indicator */}
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span>متاح الآن</span>
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {/* Bottom Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transform scale-x-0 group-hover:scale-x-100 transition-all duration-500 origin-center"></div>
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-gray-300/50 rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-gray-300/50 rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"></div>
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-gray-300/50 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-gray-300/50 rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300"></div>
    </Card>
  );
};

export default FeatureCard;