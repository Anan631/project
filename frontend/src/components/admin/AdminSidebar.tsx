"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAdminDataAction } from "@/app/admin/actions";
import {
  LayoutDashboard,
  Users,
  Settings,
  ScrollText,
  LogOut,
  Home,
  Menu as MenuIcon,
  ChevronLeft,
  Briefcase,
  MailCheck,
  Building,
  Shield,
  Database,
  Bell,
  Folder,
  UserCog,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const adminNavItems = [
  { 
    href: "/", 
    label: "الرئيسية للموقع", 
    icon: Home,
    description: "العودة لصفحة الموقع الرئيسية"
  },
  { 
    href: "/admin", 
    label: "لوحة التحكم", 
    icon: LayoutDashboard,
    description: "نظرة عامة على إحصائيات النظام"
  },
  { 
    href: "/admin/users", 
    label: "إدارة المستخدمين", 
    icon: Users,
    description: "إدارة حسابات المستخدمين والأدوار"
  },
  { 
    href: "/admin/projects", 
    label: "إدارة المشاريع", 
    icon: Briefcase,
    description: "إدارة ومتابعة المشاريع الإنشائية"
  },
  { 
    href: "/admin/settings", 
    label: "إعدادات النظام", 
    icon: Settings,
    description: "تهيئة إعدادات النظام العامة"
  },
  { 
    href: "/admin/logs", 
    label: "سجلات النظام", 
    icon: ScrollText,
    description: "مراجعة سجلات وأحداث النظام"
  },
  { 
    href: "/admin/email-tester", 
    label: "فحص البريد", 
    icon: MailCheck,
    description: "اختبار إعدادات البريد الإلكتروني"
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [adminName, setAdminName] = useState("جاري التحميل...");
  const [adminRole, setAdminRole] = useState("ADMIN");
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    // جلب معرف الأدمن من التخزين المؤقت
    const id = localStorage.getItem("userId");
    setAdminId(id);
    
    const role = localStorage.getItem("userRole");
    if (role) setAdminRole(role);
    
    // إضافة معالج رسائل لتحديث اسم الأدمن
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'updateAdminName') {
        setAdminName(event.data.name);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // تأثير لجلب بيانات الأدمن من قاعدة البيانات
  useEffect(() => {
    if (!adminId) return;

    const fetchAdminData = async () => {
      try {
        const response = await getAdminDataAction(adminId);
        if (response.success && response.user) {
          setAdminName(response.user.name || "غير محدد");
          // تحديث التخزين المؤقت للاستقبال السريع
          localStorage.setItem("userName", response.user.name || "غير محدد");
        }
      } catch (error) {
        console.error("فشل جلب بيانات الأدمن:", error);
      }
    };

    fetchAdminData();
  }, [adminId]);

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "✅ تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح من النظام.",
    });
    router.push("/admin-login");
  };

  const handleToggle = () => {
    setIsCollapsing(true);
    onToggle();
    setTimeout(() => setIsCollapsing(false), 300);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-gradient-to-r from-purple-500 to-pink-500', label: 'مشرف', icon: Shield },
      'ENGINEER': { color: 'bg-gradient-to-r from-blue-500 to-cyan-500', label: 'مهندس', icon: UserCog },
      'OWNER': { color: 'bg-gradient-to-r from-emerald-500 to-green-500', label: 'مالك', icon: Building }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.ADMIN;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} text-white border-0 flex items-center gap-1.5 w-fit px-2 py-1 text-xs`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl border-l border-slate-700 transition-all duration-300 ease-in-out relative overflow-hidden",
          isOpen ? "w-80" : "w-20"
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-emerald-400 mix-blend-overlay"></div>
        </div>

        {/* Header Section */}
        <div className="p-6 flex items-center border-b border-slate-700 h-[85px] flex-shrink-0 relative z-10">
          {isOpen ? (
            <div className="flex-grow overflow-hidden space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="flex-grow overflow-hidden">
                  <h2 className="text-xl font-bold text-white truncate">لوحة تحكم المسؤول</h2>
                  <p className="text-slate-300 text-sm truncate">مرحباً، {adminName}</p>
                </div>
              </div>
              <div className="flex justify-start">
                {getRoleBadge(adminRole)}
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
              <Shield className="h-6 w-6 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleToggle}
            className={cn(
              "p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200",
              isOpen ? "absolute left-4 top-6" : "mx-auto"
            )}
            aria-label={isOpen ? "طي الشريط الجانبي" : "فتح الشريط الجانبي"}
          >
            {isOpen ? <ChevronLeft size={20} /> : <MenuIcon size={20} />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow overflow-y-auto px-3 py-6 relative z-10">
          <ul className="space-y-2">
            {adminNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const isDashboard = item.href === "/admin";

              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                          isOpen ? "justify-start" : "justify-center",
                          isActive
                            ? "bg-gradient-to-r from-sky-600 to-emerald-600 text-white shadow-lg shadow-sky-500/25"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md"
                        )}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                        )}
                        
                        {/* Icon Container */}
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 flex-shrink-0",
                            isActive
                              ? "bg-white/20 text-white"
                              : "group-hover:bg-slate-600/50 group-hover:text-white bg-slate-700/30 text-slate-300"
                          )}
                        >
                          <item.icon size={20} />
                        </div>
                        
                        {/* Text Content */}
                        {isOpen && (
                          <div className="flex-grow overflow-hidden space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{item.label}</span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {item.description}
                            </p>
                          </div>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent 
                        side="left" 
                        align="center" 
                        className="bg-slate-800 border-slate-700 text-white"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-xs text-slate-300 max-w-[200px]">
                            {item.description}
                          </p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="p-4 mt-auto border-t border-slate-700 space-y-2 relative z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full group",
                  "text-red-400 hover:bg-red-600/20 hover:text-red-300 border border-transparent hover:border-red-500/30",
                  isOpen ? "justify-start" : "justify-center"
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-600/20 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all duration-200 flex-shrink-0">
                  <LogOut size={20} />
                </div>
                {isOpen && (
                  <div className="flex-grow overflow-hidden">
                    <span className="font-semibold">تسجيل الخروج</span>
                    <p className="text-xs text-red-400/70 group-hover:text-red-300/70 truncate">
                      الخروج من لوحة التحكم
                    </p>
                  </div>
                )}
              </button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent 
                side="left" 
                align="center"
                className="bg-slate-800 border-slate-700 text-white"
              >
                <div className="space-y-1">
                  <p className="font-semibold">تسجيل الخروج</p>
                  <p className="text-xs text-slate-300">الخروج من لوحة التحكم</p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>

          {/* System Status */}
          {isOpen && (
            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>النظام يعمل بشكل طبيعي</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsing Overlay Animation */}
        {isCollapsing && (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-emerald-500/10 animate-pulse pointer-events-none"></div>
        )}
      </aside>
    </TooltipProvider>
  );
}