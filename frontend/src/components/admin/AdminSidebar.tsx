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
import { Separator } from "@/components/ui/separator";

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<"online" | "offline" | "maintenance">("online");
  const [lastLoginTime, setLastLoginTime] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    setAdminId(id);
    
    const role = localStorage.getItem("userRole");
    if (role) setAdminRole(role);
    
    const lastLogin = localStorage.getItem("lastLoginTime");
    if (lastLogin) setLastLoginTime(lastLogin);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'updateAdminName') {
        setAdminName(event.data.name);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!adminId) return;

    const fetchAdminData = async () => {
      try {
        const response = await getAdminDataAction(adminId);
        if (response.success && response.user) {
          setAdminName(response.user.name || "غير محدد");
          localStorage.setItem("userName", response.user.name || "غير محدد");
        }
      } catch (error) {
        console.error("فشل جلب بيانات الأدمن:", error);
      }
    };

    fetchAdminData();
  }, [adminId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random > 0.9) {
        setSystemStatus("maintenance");
        setTimeout(() => setSystemStatus("online"), 5000);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      // Clear all local storage data
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      // Show success message
      toast({
        title: "✅ تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح من النظام.",
      });
      
      // Redirect to login page
      router.push("/admin-login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "❌ خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء محاولة تسجيل الخروج.",
        variant: "destructive"
      });
    }
  };

  const handleToggle = () => {
    setIsCollapsing(true);
    onToggle();
    setTimeout(() => setIsCollapsing(false), 300);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { 
        color: 'bg-gradient-to-r from-amber-600 to-amber-800', 
        label: 'مشرف', 
        icon: Shield,
        borderColor: 'border-amber-700'
      },
      'ENGINEER': { 
        color: 'bg-gradient-to-r from-slate-600 to-slate-800', 
        label: 'مهندس', 
        icon: UserCog,
        borderColor: 'border-slate-700'
      },
      'OWNER': { 
        color: 'bg-gradient-to-r from-indigo-600 to-indigo-800', 
        label: 'مالك', 
        icon: Building,
        borderColor: 'border-indigo-700'
      }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.ADMIN;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} text-white border-0 flex items-center gap-1.5 w-fit px-2 py-1 text-xs shadow-lg ${config.borderColor} border`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getSystemStatus = () => {
    const statusConfig = {
      'online': { 
        color: 'bg-emerald-600', 
        label: 'النظام يعمل بشكل طبيعي', 
        icon: '●'
      },
      'offline': { 
        color: 'bg-red-600', 
        label: 'النظام غير متاح', 
        icon: '●'
      },
      'maintenance': { 
        color: 'bg-amber-600', 
        label: 'صيانة مجدولة', 
        icon: '●'
      }
    };

    const config = statusConfig[systemStatus];

    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", config.color, systemStatus === 'online' && "animate-pulse")}></div>
        <span className="text-xs text-amber-100">{config.icon}</span>
        <span className="text-xs text-amber-100">{config.label}</span>
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-amber-100 flex flex-col shadow-2xl border-l border-amber-900/30 transition-all duration-300 ease-in-out relative overflow-hidden",
          isOpen ? "w-80" : "w-20"
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-indigo-900/20 mix-blend-overlay"></div>
          <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        </div>

        {/* Header Section */}
        <div className="p-6 flex items-center border-b border-amber-900/30 h-[85px] flex-shrink-0 relative z-10">
          {isOpen ? (
            <div className="flex-grow overflow-hidden space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-600/20"></div>
                  <Shield className="h-6 w-6 text-amber-100 relative z-10" />
                </div>
                <div className="flex-grow overflow-hidden">
                  <h2 className="text-xl font-bold text-amber-50 truncate">لوحة التحكم الإدارية</h2>
                  <p className="text-amber-200/70 text-sm truncate">مرحباً، {adminName}</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                {getRoleBadge(adminRole)}
                <div className="text-xs text-amber-200/70">{formatTime(currentTime)}</div>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center shadow-lg mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-amber-600/20"></div>
              <Shield className="h-6 w-6 text-amber-100 relative z-10" />
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleToggle}
            className={cn(
              "p-2 text-amber-200/70 hover:text-amber-100 hover:bg-slate-800/50 rounded-xl transition-all duration-200",
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
                            ? "bg-gradient-to-r from-amber-800/50 to-amber-900/50 text-amber-50 shadow-lg shadow-amber-900/20 border border-amber-700/30"
                            : "text-amber-200/70 hover:bg-slate-800/50 hover:text-amber-100 hover:shadow-md"
                        )}
                      >
                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-l-full"></div>
                        )}
                        
                        {/* Icon Container */}
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 flex-shrink-0",
                            isActive
                              ? "bg-amber-700/30 text-amber-100"
                              : "group-hover:bg-slate-700/50 group-hover:text-amber-100 bg-slate-800/30 text-amber-200/70"
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
                            <p className="text-xs text-amber-200/50 truncate">
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
                        className="bg-slate-800 border-amber-700/30 text-amber-100"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-xs text-amber-200/70 max-w-[200px]">
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
        <div className="p-4 mt-auto border-t border-amber-900/30 space-y-3 relative z-10">
          <Separator className="bg-amber-900/20" />
          
          {/* System Status */}
          {isOpen && (
            <div className="flex items-center justify-between">
              {getSystemStatus()}
              <div className="text-xs text-amber-200/50">
                آخر تسجيل: {lastLoginTime ? new Date(lastLoginTime).toLocaleDateString('ar-SA') : 'غير معروف'}
              </div>
            </div>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full group",
                  "text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-transparent hover:border-red-800/30",
                  isOpen ? "justify-start" : "justify-center"
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900/20 text-red-400 group-hover:bg-red-800 group-hover:text-red-300 transition-all duration-200 flex-shrink-0">
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
                className="bg-slate-800 border-amber-700/30 text-amber-100"
              >
                <div className="space-y-1">
                  <p className="font-semibold">تسجيل الخروج</p>
                  <p className="text-xs text-amber-200/70">الخروج من لوحة التحكم</p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Collapsing Overlay Animation */}
        {isCollapsing && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-slate-900/10 animate-pulse pointer-events-none"></div>
        )}
      </aside>
    </TooltipProvider>
  );
}