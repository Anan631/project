"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, AlertCircle, HelpCircle, Mail, LogOut, LayoutDashboard, ChevronDown, Briefcase, Shield, HardHat } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const staticNavLinks = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/about', label: 'عن الموقع', icon: AlertCircle },
  { href: '/help', label: 'الأسئلة الشائعة', icon: HelpCircle },
  { href: '/contact', label: 'تواصل معنا', icon: Mail },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const name = localStorage.getItem('userName');
      if (role && name) {
        setIsLoggedIn(true);
        setUserName(name);
        setUserRole(role);
        setUserInitial(name.charAt(0).toUpperCase());
      } else {
        setIsLoggedIn(false);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      setIsLoggedIn(false);
      setUserRole(null);
      setUserName(null);
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح.",
      });
      router.push('/');
    }
  };

  const getDashboardLink = () => {
    switch (userRole) {
      case 'ADMIN': return '/admin';
      case 'ENGINEER': return '/engineer/dashboard';
      case 'OWNER': return '/owner/dashboard';
      default: return '/';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'ADMIN': return 'مدير النظام';
      case 'ENGINEER': return 'مهندس';
      case 'OWNER': return 'مالك';
      default: return 'مستخدم';
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'ADMIN': return <Shield className="h-4 w-4 text-purple-400" />;
      case 'ENGINEER': return <HardHat className="h-4 w-4 text-blue-400" />;
      case 'OWNER': return <Home className="h-4 w-4 text-green-400" />;
      default: return null;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'ADMIN': return 'from-purple-600/10 to-purple-800/10 border-purple-500/30';
      case 'ENGINEER': return 'from-blue-600/10 to-blue-800/10 border-blue-500/30';
      case 'OWNER': return 'from-green-600/10 to-green-800/10 border-green-500/30';
      default: return 'from-gray-600/10 to-gray-800/10 border-gray-500/30';
    }
  };

  const getMenuItems = () => {
    const items = [];
    
    items.push({
      href: getDashboardLink(),
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      iconColor: 'text-blue-400',
    });

    if (userRole === 'ENGINEER') {
      items.push({
        href: '/engineer/projects',
        label: 'المشاريع',
        icon: Briefcase,
        iconColor: 'text-amber-400',
      });
    }

    return items;
  };

  return (
    <nav className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl border-b border-slate-700/50 sticky top-0 z-[200] backdrop-blur-sm bg-slate-900/95">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: User Menu or Empty */}
          <div className="flex-1 flex justify-start">
            {isLoggedIn && userName && userRole && (
              <DropdownMenu onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-3 text-white hover:bg-slate-700/60 p-2 h-auto rounded-xl transition-all duration-300",
                      isDropdownOpen && "bg-slate-700/60"
                    )}
                  >
                    <div className={cn(
                      "relative rounded-full p-0.5",
                      getRoleColor()
                    )}>
                      <Avatar className="h-10 w-10 border-2 border-slate-700">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}&backgroundColor=0f172a&textColor=ffffff`}
                          alt={userName}
                        />
                        <AvatarFallback className={cn(
                          "bg-gradient-to-br font-bold text-lg",
                          userRole === 'ADMIN' && "from-purple-600 to-purple-800",
                          userRole === 'ENGINEER' && "from-blue-600 to-blue-800",
                          userRole === 'OWNER' && "from-green-600 to-green-800",
                          !userRole && "from-slate-600 to-slate-800"
                        )}>
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-1 border-2 border-slate-900">
                        {getRoleIcon()}
                      </div>
                    </div>
                    <div className="text-right hidden lg:block">
                      <span className="font-bold block text-sm truncate max-w-[140px]">
                        {userName}
                      </span>
                      <span className="text-xs flex items-center justify-end gap-1.5 mt-0.5">
                        {getRoleIcon()}
                        <span className="text-slate-300">{getRoleLabel()}</span>
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-slate-400 transition-transform duration-300",
                      isDropdownOpen && "rotate-180"
                    )} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-slate-800/95 backdrop-blur-lg border-slate-700 rounded-xl shadow-2xl p-2"
                  align="start"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="p-0">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-800/50 mb-2">
                      <Avatar className="h-12 w-12 border-2 border-slate-600">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}&backgroundColor=0f172a&textColor=ffffff`}
                          alt={userName}
                        />
                        <AvatarFallback className={cn(
                          "bg-gradient-to-br font-bold text-xl",
                          userRole === 'ADMIN' && "from-purple-600 to-purple-800",
                          userRole === 'ENGINEER' && "from-blue-600 to-blue-800",
                          userRole === 'OWNER' && "from-green-600 to-green-800"
                        )}>
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-bold text-white truncate">
                          {userName}
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          {getRoleIcon()}
                          <p className="text-xs text-slate-300 font-medium">
                            {getRoleLabel()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-600 to-transparent h-[1px] my-1" />
                  
                  {/* Dynamic Menu Items */}
                  {getMenuItems().map((item, index) => (
                    <DropdownMenuItem 
                      key={index} 
                      asChild 
                      className="focus:bg-slate-700/70 rounded-lg my-0.5 transition-colors duration-200 p-0 group"
                    >
                      <Link
                        href={item.href}
                        className="flex items-center justify-end w-full py-3 px-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-white">{item.label}</span>
                           <div className={`p-2 rounded-lg ${item.iconColor} bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors`}>
                            <item.icon className="h-5 w-5" />
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-600 to-transparent h-[1px] my-1" />
                  
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center justify-end w-full py-3 px-3 rounded-lg my-0.5 transition-colors duration-200 focus:bg-red-900/30 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-red-400 group-hover:text-red-300">
                          تسجيل الخروج
                      </span>
                      <div className="p-2 rounded-lg bg-red-900/20 group-hover:bg-red-800/30 transition-colors">
                        <LogOut className="h-5 w-5 text-red-400 group-hover:text-red-300" />
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Center: Main Links */}
          <ul className="flex justify-center items-center gap-1">
            {staticNavLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-3 text-sm font-semibold transition-all duration-300 rounded-xl group relative",
                    pathname === link.href
                      ? "text-white bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/40"
                  )}
                >
                  <link.icon className={cn(
                    "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                    pathname === link.href 
                      ? "text-amber-400" 
                      : "text-slate-400 group-hover:text-amber-300"
                  )} />
                  <span className="relative">
                    {link.label}
                    <span className={cn(
                      "absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-300 group-hover:w-full",
                      pathname === link.href && "w-full"
                    )} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Side: Spacer */}
          <div className="flex-1"></div>
        </div>
      </div>
    </nav>
  );
}