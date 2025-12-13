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
                "flex items-center gap-4 rounded-lg p-3 text-base font-medium transition-colors duration-200 group mb-2",
                !isOpen && "justify-center",
                isActive
                  ? "bg-muted text-app-red"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300",
                isActive ? "bg-app-red/10" : "bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600"
              )}>
                <link.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-app-red" : "")} />
              </div>
              {isOpen && <span className="font-semibold">{link.label}</span>}
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
    accordionItems.map((item) => {
      const isAccordionActive = item.links.some(link => pathname.startsWith(link.href));
      return (
        <AccordionItem value={item.value} key={item.value} className="border-b-0">
          <AccordionTrigger className={cn(
            "hover:no-underline rounded-lg transition-colors duration-200 group p-3",
            isAccordionActive ? "bg-muted" : "hover:bg-muted/50"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300",
                "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
                "group-hover:scale-105 group-hover:shadow-md",
                isAccordionActive ? "shadow-inner" : ""
              )}>
                <item.icon className={cn("h-5 w-5 transition-colors", isAccordionActive ? "text-app-red" : item.color)} />
              </div>
              {isOpen && <span className="text-base font-semibold text-foreground">{item.title}</span>}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-10 pr-2 pb-1 pt-1">
            <ul className="space-y-1 border-r-2 border-dashed border-gray-200 dark:border-gray-700">
              {item.links.map((link) => {
                const isLinkActive = pathname === link.href;
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-r-lg px-4 py-2 text-sm font-medium transition-colors duration-200 relative -right-px",
                        isLinkActive
                          ? "bg-app-red/10 text-app-red border-r-4 border-app-red"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
      )
    })
  ), [isOpen, pathname]);

  const memoizedCollapsedItems = useMemo(() => (
    accordionItems.map((item) => {
      const isActive = item.links.some(link => pathname.startsWith(link.href));
      return (
        <Tooltip key={item.value}>
          <TooltipTrigger asChild>
            <Link
              href={item.links[0].href}
              className={cn(
                "flex items-center justify-center rounded-lg p-3 text-sm font-medium transition-colors mb-2",
                 isActive
                  ? "bg-muted text-app-red"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive ? "text-app-red" : item.color)} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left" align="center">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      )
    })
  ), [pathname]);

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "bg-card text-card-foreground flex flex-col shadow-lg border-l z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-80" : "w-24"
      )}>
        <div className="p-4 flex items-center justify-between border-b h-[70px] flex-shrink-0">
          {isOpen && (
            <div className="text-center flex-grow overflow-hidden px-2">
              <h2 className="text-xl font-bold text-app-red truncate">لوحة تحكم المهندس</h2>
              <p className="text-sm text-muted-foreground truncate">مرحباً، {engineerName}</p>
            </div>
          )}
          <Button 
            variant="ghost"
            onClick={onToggle} 
            className="p-2 text-muted-foreground hover:text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-app-gold"
            aria-label={isOpen ? "طي الشريط الجانبي" : "فتح الشريط الجانبي"}
          >
            {isOpen ? <ChevronLeft size={24} /> : <MenuIcon size={24} />}
          </Button>
        </div>

        <nav className="flex-grow overflow-y-auto px-4 py-4 space-y-4">
          <div>
            <h3 className={cn("px-3 py-2 text-xs font-bold uppercase text-muted-foreground", isOpen ? "" : "text-center")}>
              {isOpen ? "القائمة" : "..."}
            </h3>
            {memoizedMainLinks}
          </div>

          {isOpen ? (
            <Accordion type="multiple" defaultValue={accordionItems.filter(item => item.links.some(link => pathname.startsWith(link.href))).map(item => item.value)} className="w-full space-y-2">
              {memoizedAccordionItems}
            </Accordion>
          ) : (
            <div className="space-y-2 mt-2 border-t pt-4">
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
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                  "bg-muted/50 text-foreground/80 hover:bg-muted/100 hover:text-foreground",
                  isOpen ? "justify-start text-left" : "justify-center"
                )}
              >
                <UserCircle size={isOpen ? 22 : 26} className="flex-shrink-0"/>
                {isOpen && <span className="truncate font-semibold">الملف الشخصي</span>}
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
            <Link
                href="/login"
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left",
                  "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                  isOpen ? "justify-start text-left" : "justify-center"
                )}
              >
                <LogOut size={isOpen ? 22 : 26} className="flex-shrink-0"/>
                {isOpen && <span className="truncate font-semibold">تسجيل الخروج</span>}
              </Link>
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
