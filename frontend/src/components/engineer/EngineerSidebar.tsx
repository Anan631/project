"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Blocks,
  ClipboardCheck,
  Calculator,
  BarChart3,
  Settings2,
  Download,
  FileText,
  TrendingUp,
  PenSquare,
  Camera,
  GanttChartSquare,
  Users,
  LogOut,
  Home,
  Coins,
  Menu as MenuIcon,
  ChevronLeft,
  UserCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { useSidebar } from "@/contexts/SidebarContext";

const mainLinks = [
  { href: '/', label: 'الرئيسية للموقع', icon: Home },
  { href: '/engineer/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
];

const accordionItems = [
  {
    value: "projects",
    title: "المشاريع",
    icon: FolderKanban,
    color: "text-blue-500",
    links: [
      { href: "/engineer/create-project", label: "إنشاء مشروع جديد", icon: PlusCircle },
      { href: "/engineer/projects", label: "إدارة المشاريع", icon: FolderKanban },
    ],
  },
  {
    value: "structural-elements",
    title: "العناصر الإنشائية",
    icon: Blocks,
    color: "text-purple-500",
    links: [
      { href: "/engineer/structural-elements/input-details", label: "إدخال تفاصيل العناصر", icon: PenSquare },
      { href: "/engineer/structural-elements/validate-data", label: "التحقق من صحة البيانات", icon: ClipboardCheck },
    ],
  },
  {
    value: "quantity-survey",
    title: "حساب الكميات",
    icon: Calculator,
    color: "text-green-500",
    links: [
      { href: "/engineer/cost-estimator", label: "حاسبة أسعار المواد", icon: Coins },
      { href: "/engineer/quantity-survey/calculate-materials", label: "حساب كميات المواد", icon: Calculator },
      { href: "/engineer/quantity-survey/view-reports", label: "عرض تقارير الكميات", icon: BarChart3 },
      { href: "/engineer/quantity-survey/customize-reports", label: "تخصيص عرض التقارير", icon: Settings2 },
      { href: "/engineer/quantity-survey/export-reports", label: "تصدير التقارير", icon: Download },
      { href: "/engineer/quantity-survey/generate-report-data", label: "توليد بيانات التقرير", icon: FileText },
    ],
  },
  {
    value: "construction-progress",
    title: "تقدم البناء",
    icon: TrendingUp,
    color: "text-orange-500",
    links: [
      { href: "/engineer/update-progress", label: "تحديث التقدم", icon: TrendingUp },
      { href: "/engineer/progress/notes", label: "ملاحظات التقدم", icon: PenSquare },
      { href: "/engineer/progress/upload-media", label: "رفع صور/فيديوهات", icon: Camera },
      { href: "/engineer/progress/define-stages", label: "تحديد مراحل المشروع", icon: GanttChartSquare },
    ],
  },
  {
    value: "owner-linking",
    title: "ربط المالكين",
    icon: Users,
    color: "text-red-500",
    links: [
      { href: "/engineer/link-owner", label: "ربط مالك بمشروع", icon: Users },
    ],
  },
];

interface EngineerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function EngineerSidebar({ isOpen, onToggle }: EngineerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [engineerName, setEngineerName] = useState("المهندس");
  
  // الاستماع لتغييرات حالة الشريط الجانبي
  // تم إزالة useEffect الخاص بالاستماع للأحداث المخصصة لأن الحالة ستدار بواسطة الخصائص

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setEngineerName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem('engineerSidebarState');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح.",
    });
    router.push("/login");
  };

  const memoizedMainLinks = useMemo(() => (
    mainLinks.map((link) => {
      const isActive = pathname === link.href;
      return (
        <Tooltip key={link.href}>
          <TooltipTrigger asChild>
            <Link
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-2",
                !isOpen && "justify-center",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>{link.label}</span>}
            </Link>
          </TooltipTrigger>
          {!isOpen && (
            <TooltipContent side="left" align="center">
              <p>{link.label}</p>
            </TooltipContent>
          )}
        </Tooltip>
      );
    })
  ), [isOpen, pathname]);

  const memoizedAccordionItems = useMemo(() => (
    accordionItems.map((item) => (
      <AccordionItem value={item.value} key={item.value}>
        <AccordionTrigger className="hover:no-underline text-base font-semibold text-foreground px-3 py-2.5 rounded-md hover:bg-muted">
          <div className="flex items-center gap-3">
            <item.icon className={cn("h-5 w-5", item.color)} />
            {item.title}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pl-6 pr-2 pb-1 pt-1">
          <ul className="space-y-1">
            {item.links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-app-red text-white"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    ))
  ), [pathname]);

  const memoizedCollapsedItems = useMemo(() => (
    accordionItems.map((item) => (
      <Tooltip key={item.value}>
        <TooltipTrigger asChild>
          <Link
            href={item.links[0].href}
            className={cn(
              "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors mb-2",
              pathname === item.links[0].href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", item.color)} />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left" align="center">
          <p>{item.title}</p>
        </TooltipContent>
      </Tooltip>
    ))
  ), [pathname]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "bg-card text-card-foreground flex flex-col shadow-lg border-l z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-72" : "w-20"
      )}>
        <div className="p-4 flex items-center border-b h-[70px] flex-shrink-0">
          {isOpen && (
            <div className="text-center flex-grow overflow-hidden px-2">
              <h2 className="text-xl font-bold text-app-red truncate">لوحة تحكم المهندس</h2>
              <p className="text-sm text-muted-foreground truncate">مرحباً، {engineerName}</p>
            </div>
          )}
          <Button 
            variant="ghost"
            onClick={onToggle} 
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-app-gold"
            aria-label={isOpen ? "طي الشريط الجانبي" : "فتح الشريط الجانبي"}
          >
            {isOpen ? <ChevronLeft size={24} /> : <MenuIcon size={24} />}
          </Button>
        </div>

        <nav className="flex-grow overflow-y-auto px-2 py-4">
          {memoizedMainLinks}

          {isOpen ? (
            <Accordion type="multiple" className="w-full">
              {memoizedAccordionItems}
            </Accordion>
          ) : (
            <div className="space-y-2 mt-2 border-t pt-2">
              {memoizedCollapsedItems}
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto border-t space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/engineer/profile"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                  "bg-muted/50 text-foreground/80 hover:bg-muted/100 hover:text-foreground",
                  isOpen ? "justify-start text-left" : "justify-center"
                )}
              >
                <UserCircle size={isOpen ? 20 : 24} className="flex-shrink-0"/>
                {isOpen && <span className="truncate">الملف الشخصي</span>}
              </Link>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="left" align="center">
                <p>الملف الشخصي</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left",
                  "bg-red-700/10 text-red-600 hover:bg-red-700/20",
                  isOpen ? "justify-start text-left" : "justify-center"
                )}
              >
                <LogOut size={isOpen ? 20 : 24} className="flex-shrink-0"/>
                {isOpen && <span className="truncate">تسجيل الخروج</span>}
              </button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="left" align="center">
                <p>تسجيل الخروج</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
