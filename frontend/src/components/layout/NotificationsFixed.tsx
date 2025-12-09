"use client";

import { Bell, BellOff, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";


interface Notification {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  read: boolean;
}

const DUMMY_NOTIFICATIONS: Notification[] = [];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const hasNotifications = notifications.length > 0;
  const hasUnreadNotifications = notifications.some(n => !n.read);

  const handleMarkAllRead = () => {
    // In a real app, this would call an API
    console.log("Marking all notifications as read");
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDeleteAll = () => {
    // In a real app, this would call an API
    console.log("Deleting all notifications");
    setNotifications([]);
  };

  return (
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 p-0">
          <Bell className="h-6 w-6 text-white" />
          {hasUnreadNotifications && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 mt-2 p-0" align="end">
        <DropdownMenuLabel className="p-3 font-semibold text-right flex justify-between items-center">
          <span>الإشعارات</span>
          {hasNotifications && (
            <TooltipProvider>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-600 hover:text-white transition-colors" onClick={handleMarkAllRead}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>وضع علامة "مقروء" على الكل</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-600 hover:text-white transition-colors" onClick={handleDeleteAll}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>حذف كل الإشعارات</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {hasNotifications ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "p-3 text-right transition-colors",
                    notification.read ? "bg-gray-50 dark:bg-gray-800/20" : "hover:bg-muted/50"
                  )}
                >
                  <Link href="#" className={cn("block", notification.read && "opacity-70")}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground shrink-0 pl-2">{notification.time}</p>
                    </div>
                    {notification.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{notification.subtitle}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <BellOff className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">لا توجد إشعارات جديدة.</p>
            </div>
          )}
        </div>
        {hasNotifications && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuFooter className="p-1">
              <Button asChild variant="ghost" className="w-full text-sm">
                <Link href="#">عرض كل الإشعارات</Link>
              </Button>
            </DropdownMenuFooter>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}