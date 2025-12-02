"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Edit, UserPlus, KeyRound, UserCheck, Search, AlertTriangle, Check, RefreshCw, Users, Shield, Building, UserCog, Filter, MoreVertical, Mail, Phone, Calendar, Clock, ArrowRight, UserCheck2, Ban, RotateCcw, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type UserDocument as User, deleteUser as dbDeleteUser, getUsers, suspendUser, approveEngineer, restoreUser, } from "@/lib/db";
import AddUserDialog from "@/components/admin/users/AddUserDialog";
import ResetPasswordDialog from "@/components/admin/users/ResetPasswordDialog";
import EditUserDialog from "@/components/admin/users/EditUserDialog";
import AdminSettingsDialog from "@/components/admin/users/AdminSettingsDialog";

// إضافة الأنيميشن المخصصة
const customStyles = `
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes scale-in {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes checkmark {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fade-in {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-delay {
  0% { opacity: 0; transform: translateY(10px); }
  50% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-scale-in {
  animation: scale-in 0.5s ease-out forwards;
}

.animate-checkmark {
  animation: checkmark 0.6s ease-out forwards;
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}

.animate-fade-in-delay {
  animation: fade-in-delay 1.2s ease-out forwards;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
`;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsersState] = useState<Omit<User, 'password_hash'>[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFetching, setIsFetching] = useState(true);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<{ id: string; name: string; } | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<Omit<User, 'password_hash'> | null>(null);
  const [userToDelete, setUserToDelete] = useState<Omit<User, 'password_hash'> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "loading" | "success">( "confirm" );
  const [userToRestore, setUserToRestore] = useState<Omit<User, 'password_hash'> | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restoreStep, setRestoreStep] = useState<"confirm" | "loading" | "success">( "confirm" );
  const [userToSuspend, setUserToSuspend] = useState<Omit<User, 'password_hash'> | null>(null);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [suspendStep, setSuspendStep] = useState<"confirm" | "loading" | "success">( "confirm" );
  const [userToApprove, setUserToApprove] = useState<Omit<User, 'password_hash'> | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approveStep, setApproveStep] = useState<"confirm" | "loading" | "success">( "confirm" );
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isAdminSettingsDialogOpen, setIsAdminSettingsDialogOpen] = useState(false);
  const [adminName, setAdminName] = useState<string>("");
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const name = localStorage.getItem("userName") || "مشرف";
    const email = localStorage.getItem("userEmail") || "admin@example.com";
    if (id) {
      setAdminUserId(id);
      setAdminName(name);
      setAdminEmail(email);
    }
  }, []);

  const refreshUsersFromDb = async () => {
    setIsFetching(true);
    try {
      const usersResponse = await getUsers();
      if (usersResponse.success && usersResponse.users) {
        setUsersState(usersResponse.users ? [...usersResponse.users] : []);
        setTotalUsersCount(usersResponse.users.length);
      } else {
        setUsersState([]);
        setTotalUsersCount(0);
        toast({
          title: "❌ خطأ في التحميل",
          description: usersResponse.message || "فشل تحميل المستخدمين.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setUsersState([]);
      setTotalUsersCount(0);
      toast({
        title: "❌ خطأ فادح",
        description: "حدث خطأ أثناء جلب المستخدمين.",
        variant: "destructive",
      });
      console.error("Error fetching users:", error);
    }
    setIsFetching(false);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        (user.name.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm)) &&
        (roleFilter === "all" || user.role === roleFilter) &&
        (statusFilter === "all" || user.status === statusFilter)
    );
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleOpenDeleteDialog = (user: Omit<User, 'password_hash'>) => {
    setUserToDelete(user);
    setDeleteStep("confirm");
    setIsDeleteDialogOpen(true);
  };

  const handleOpenRestoreDialog = (user: Omit<User, 'password_hash'>) => {
    setUserToRestore(user);
    setRestoreStep("confirm");
    setIsRestoreDialogOpen(true);
  };

  const handleOpenSuspendDialog = (user: Omit<User, 'password_hash'>) => {
    setUserToSuspend(user);
    setSuspendStep("confirm");
    setIsSuspendDialogOpen(true);
  };

  const handleOpenApproveDialog = (user: Omit<User, 'password_hash'>) => {
    setUserToApprove(user);
    setApproveStep("confirm");
    setIsApproveDialogOpen(true);
  };

  async function handleDeleteUser() {
    if (!userToDelete || !adminUserId) return;
    setDeleteStep("loading");
    const result = await dbDeleteUser(userToDelete.id, adminUserId);
    if (result.success) {
      setDeleteStep("success");
      setTimeout(() => {
        setIsDeleteDialogOpen(false);
        refreshUsersFromDb();
      }, 1500);
    } else {
      toast({
        title: "❌ خطأ في الحذف",
        description: result.message,
        variant: "destructive"
      });
      setIsDeleteDialogOpen(false);
    }
  }

  async function handleRestoreUser() {
    if (!userToRestore || !adminUserId) return;
    setRestoreStep("loading");
    const result = await restoreUser(userToRestore.id, adminUserId);
    if (result.success) {
      setRestoreStep("success");
      setTimeout(() => {
        setIsRestoreDialogOpen(false);
        refreshUsersFromDb();
      }, 1500);
    } else {
      toast({
        title: "❌ خطأ في الاستعادة",
        description: result.message,
        variant: "destructive"
      });
      setIsRestoreDialogOpen(false);
    }
  }

  async function handleSuspendUser() {
    if (!userToSuspend || !adminUserId) return;
    setSuspendStep("loading");
    const result = await suspendUser(adminUserId, userToSuspend.id);
    if (result.success) {
      setSuspendStep("success");
      setTimeout(() => {
        setIsSuspendDialogOpen(false);
        refreshUsersFromDb();
      }, 1500);
    } else {
      toast({
        title: "❌ خطأ في التعليق",
        description: result.message,
        variant: "destructive"
      });
      setIsSuspendDialogOpen(false);
    }
  }

  async function handleApproveUser() {
    if (!userToApprove || !adminUserId) return;
    setApproveStep("loading");
    const result = await approveEngineer(adminUserId, userToApprove.id);
    if (result.success) {
      setApproveStep("success");
      setTimeout(() => {
        setIsApproveDialogOpen(false);
        refreshUsersFromDb();
      }, 1500);
    } else {
      toast({
        title: "❌ خطأ في الموافقة",
        description: result.message,
        variant: "destructive"
      });
      setIsApproveDialogOpen(false);
    }
  }

  const handleOpenResetPasswordDialog = (userId: string, userName: string) => {
    setSelectedUserForPasswordReset({ id: userId, name: userName });
    setIsResetPasswordDialogOpen(true);
  };

  const handleOpenEditUserDialog = (user: Omit<User, 'password_hash'>) => {
    setSelectedUserForEdit(user);
    setIsEditUserDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield, label: 'مشرف' },
      'ENGINEER': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserCog, label: 'مهندس' },
      'OWNER': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Building, label: 'مالك' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Users, label: 'مستخدم' };
    const IconComponent = config.icon;
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 w-fit px-3 py-1.5 text-xs font-medium`}>
        <IconComponent className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'نشط' },
      'PENDING_APPROVAL': { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'بانتظار الموافقة' },
      'SUSPENDED': { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'معلق' },
      'DELETED': { color: 'bg-red-100 text-red-700 border-red-200', label: 'محذوف' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return (
      <Badge className={`${config.color} border px-3 py-1.5 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getRoleStats = () => {
    const stats = {
      total: users.length,
      admin: users.filter(user => user.role === 'ADMIN').length,
      engineer: users.filter(user => user.role === 'ENGINEER').length,
      owner: users.filter(user => user.role === 'OWNER').length,
      active: users.filter(user => user.status === 'ACTIVE').length,
      pending: users.filter(user => user.status === 'PENDING_APPROVAL').length,
    };
    return stats;
  };

  const stats = getRoleStats();

  useEffect(() => {
    refreshUsersFromDb();
  }, []);

  const handleUserAddedOrUpdated = () => {
    refreshUsersFromDb();
    setIsAddUserDialogOpen(false);
    setIsEditUserDialogOpen(false);
  };
  
  const handleAdminSettingsUpdated = () => {
    // تحديث بيانات المشرف من التخزين المحلي
    const name = localStorage.getItem("userName") || "مشرف";
    const email = localStorage.getItem("userEmail") || "admin@example.com";
    setAdminName(name);
    setAdminEmail(email);
    refreshUsersFromDb(); // تحديث قائمة المستخدمين
  };
  
  // جلب بيانات المشرف من قاعدة البيانات عند فتح نافذة الإعدادات
  const fetchAdminData = async () => {
    if (!adminUserId) return;
    
    try {
      const { findUserById } = await import("@/lib/db");
      const adminData = await findUserById(adminUserId);
      
      if (adminData) {
        console.log("Admin data from DB:", adminData); // للتأكد من البيانات
        
        // تحديث التخزين المحلي بالبيانات من قاعدة البيانات
        localStorage.setItem("userName", adminData.name);
        localStorage.setItem("userEmail", adminData.email);
        
        // تحديث الحالة مباشرة
        setAdminName(adminData.name);
        setAdminEmail(adminData.email);
        
        // فرض تحديث المكون بعد فترة قصيرة
        setTimeout(() => {
          setAdminName(adminData.name);
          setAdminEmail(adminData.email);
          // إرسال حدث مخصص لتحديث المكونات الأخرى
          window.dispatchEvent(new CustomEvent("adminDataUpdated", { 
            detail: { name: adminData.name, email: adminData.email } 
          }));
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 py-8 px-4">
      {/* إضافة الأنيميشن المخصصة */}
      <style jsx>{customStyles}</style>
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                <Users className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  إدارة المستخدمين
                </h1>
                <p className="text-slate-600 text-lg mt-1">إدارة وتنظيم حسابات المستخدمين في النظام</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-sky-600">{stats.total}</p>
                  <p className="text-sm text-slate-500">إجمالي المستخدمين</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">المشرفين</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.admin}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserCog className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">المهندسين</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.engineer}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">المالكين</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.owner}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">النشطين</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-slate-700">بانتظار الموافقة</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">المجموع</span>
              </div>
              <p className="text-2xl font-bold text-slate-600">{stats.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Users Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-emerald-400 rounded-full"></div>
                  قائمة المستخدمين
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  إدارة جميع حسابات المستخدمين في النظام
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={refreshUsersFromDb} variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-all duration-300 rounded-xl" disabled={isFetching} >
                  <RefreshCw className={`h-4 w-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                <Button onClick={() => setIsAddUserDialogOpen(true)} className="bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105" >
                  <UserPlus className="h-4 w-4 ml-2" />
                  إضافة مستخدم
                </Button>
                {adminUserId && (
                  <Button onClick={() => setIsAdminSettingsDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105" >
                    <Settings className="h-4 w-4 ml-2" />
                    إعدادات المشرف
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Search and Filter Section */}
            <div className="flex flex-col lg:flex-row gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-100 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder="ابحث بالاسم، البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pr-12 bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter} dir="rtl">
                <SelectTrigger className="w-full lg:w-48 bg-white border-slate-300 focus:border-sky-400 text-right h-12 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Filter className="h-5 w-5 text-slate-400" />
                    <SelectValue placeholder="جميع الأدوار" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-lg">👥 جميع الأدوار</SelectItem>
                  <SelectItem value="ADMIN" className="text-lg">🛡️ مشرف</SelectItem>
                  <SelectItem value="ENGINEER" className="text-lg">🔧 مهندس</SelectItem>
                  <SelectItem value="OWNER" className="text-lg">🏢 مالك</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
                <SelectTrigger className="w-full lg:w-48 bg-white border-slate-300 focus:border-sky-400 text-right h-12 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Filter className="h-5 w-5 text-slate-400" />
                    <SelectValue placeholder="جميع الحالات" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-lg">📊 جميع الحالات</SelectItem>
                  <SelectItem value="ACTIVE" className="text-lg">✅ نشط</SelectItem>
                  <SelectItem value="PENDING_APPROVAL" className="text-lg">⏳ بانتظار الموافقة</SelectItem>
                  <SelectItem value="SUSPENDED" className="text-lg">⚠️ معلق</SelectItem>
                  <SelectItem value="DELETED" className="text-lg">🗑️ محذوف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                  <Users className="absolute inset-0 m-auto h-8 w-8 text-sky-600 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-semibold text-slate-700">جاري تحميل المستخدمين</p>
                  <p className="text-slate-500">يرجى الانتظار...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/50 hover:bg-transparent border-b-2 border-slate-100">
                      <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                        المستخدم
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                        معلومات الاتصال
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                        الدور
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700 text-lg py-4">
                        الحالة
                      </TableHead>
                      <TableHead className="text-center font-bold text-slate-700 text-lg py-4">
                        الإجراءات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="group hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-emerald-50/30 transition-all duration-300 border-b border-slate-100/50"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-400 rounded-xl flex items-center justify-center">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-slate-800 text-lg">{user.name}</div>
                              <div className="text-sm text-slate-500">ID: {user.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-700">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-slate-700">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-sm">{user.phone}</span>
                              </div>
                            )}
                            {user.createdAt && (
                              <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <Calendar className="h-3 w-3" />
                                <span>أنشئ في {new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(user.status)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex justify-center gap-2">
                            {user.role === "ENGINEER" && user.status === "PENDING_APPROVAL" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
                                title="موافقة على المهندس"
                                onClick={() => handleOpenApproveDialog(user)}
                              >
                                <UserCheck className="h-4 w-4 ml-1" />
                                موافقة
                              </Button>
                            )}
                            {user.role !== "ADMIN" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
                                title="تعديل"
                                onClick={() => handleOpenEditUserDialog(user)}
                              >
                                <Edit className="h-4 w-4 ml-1" />
                                تعديل
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
                              title="إعادة تعيين كلمة المرور"
                              onClick={() => handleOpenResetPasswordDialog(user.id, user.name)}
                              disabled={user.role === "ADMIN"}
                            >
                              <KeyRound className="h-4 w-4 ml-1" />
                              كلمة المرور
                            </Button>
                            {user.role !== "ADMIN" && (
                              user.status === "DELETED" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
                                  title="استعادة الحساب"
                                  onClick={() => handleOpenRestoreDialog(user)}
                                >
                                  <RotateCcw className="h-4 w-4 ml-1" />
                                  استعادة
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
                                    title={user.status === "SUSPENDED" ? "إلغاء تعليق المستخدم" : "تعليق المستخدم"}
                                    onClick={() => handleOpenSuspendDialog(user)}
                                  >
                                    <Ban className="h-4 w-4 ml-1" />
                                    {user.status === "SUSPENDED" ? "إلغاء التعليق" : "تعليق"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 py-2 transition-all duration-300 hover:scale-105"
                                    title="حذف"
                                    onClick={() => handleOpenDeleteDialog(user)}
                                  >
                                    <Trash2 className="h-4 w-4 ml-1" />
                                    حذف
                                  </Button>
                                </>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4 text-slate-500">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                              <Users className="h-10 w-10 text-slate-300" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xl font-semibold">لا يوجد مستخدمون</p>
                              <p className="text-slate-400">
                                {users.length === 0
                                  ? "لا يوجد مستخدمون في النظام حالياً."
                                  : "لم يتم العثور على مستخدمين يطابقون معايير البحث أو التصفية."}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Table Footer */}
                {!isFetching && filteredUsers.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-50/50 border-t border-slate-200">
                    <p className="text-slate-600 text-sm">
                      عرض <span className="font-semibold text-sky-600">{filteredUsers.length}</span> من أصل{' '}
                      <span className="font-semibold text-sky-600">{totalUsersCount}</span> مستخدم
                    </p>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      تم تحميل جميع البيانات
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog - Red Theme */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-red-50/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 to-rose-400"></div>
          
          {deleteStep === "confirm" && userToDelete && (
            <>
              <AlertDialogHeader className="text-center items-center space-y-6 pt-8 pb-4">
                <div className="relative">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100 border-8 border-red-50/80 shadow-lg animate-pulse">
                    <Trash2 className="h-14 w-14 text-red-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-300 rounded-full opacity-60 animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-rose-300 rounded-full opacity-40 animate-bounce delay-300"></div>
                </div>
                <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  تأكيد الحذف
                </AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="px-6 pb-6 space-y-6">
                <div className="text-center text-base text-slate-700 space-y-4">
                  <p className="text-xl font-medium text-slate-800">
                    هل أنت متأكد من رغبتك في حذف هذا المستخدم؟
                  </p>
                  
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Users className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="font-bold text-red-700 text-lg">المستخدم المراد حذفه</p>
                    </div>
                    
                    <div className="space-y-2 text-right">
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الاسم:</span>
                        <span className="font-bold text-red-700">{userToDelete.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">البريد الإلكتروني:</span>
                        <span className="font-bold text-red-700 text-sm">{userToDelete.email}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الدور:</span>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(userToDelete.role)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center text-red-700 bg-red-50 p-4 rounded-2xl border border-red-200">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="font-medium">هذا الإجراء لا يمكن التراجع عنه</p>
                  </div>
                </div>
                
                <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                  <Button
                    onClick={handleDeleteUser}
                    className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <Trash2 className="h-5 w-5" />
                    تأكيد الحذف
                  </Button>
                  <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
                    إلغاء الأمر
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </div>
            </>
          )}
          
          {deleteStep === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                <Trash2 className="absolute inset-0 m-auto h-10 w-10 text-red-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-red-600">جاري الحذف...</h2>
                <p className="text-slate-500 text-lg">يتم الآن حذف المستخدم من النظام</p>
                <div className="w-full bg-red-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-rose-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          )}
          
          {deleteStep === "success" && (
            <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
              <div className="relative">
                <div className="h-28 w-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center ring-8 ring-emerald-50">
                  <Check className="h-14 w-14 text-emerald-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-emerald-600">تم الحذف بنجاح</h2>
                <p className="text-slate-500 text-lg">تم حذف المستخدم بنجاح من النظام</p>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog - Emerald Theme */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-green-400"></div>
          
          {restoreStep === "confirm" && userToRestore && (
            <>
              <AlertDialogHeader className="text-center items-center space-y-6 pt-8 pb-4">
                <div className="relative">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border-8 border-emerald-50/80 shadow-lg animate-pulse">
                    <RotateCcw className="h-14 w-14 text-emerald-500 animate-spin-slow" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-300 rounded-full opacity-60 animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-300 rounded-full opacity-40 animate-bounce delay-300"></div>
                </div>
                <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  استعادة الحساب
                </AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="px-6 pb-6 space-y-6">
                <div className="text-center text-base text-slate-700 space-y-4">
                  <p className="text-xl font-medium text-slate-800">
                    هل أنت متأكد من رغبتك في استعادة هذا الحساب؟
                  </p>
                  
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                        <UserCheck2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="font-bold text-emerald-700 text-lg">معلومات الحساب</p>
                    </div>
                    
                    <div className="space-y-2 text-right">
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الاسم:</span>
                        <span className="font-bold text-emerald-700">{userToRestore.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">البريد الإلكتروني:</span>
                        <span className="font-bold text-emerald-700 text-sm">{userToRestore.email}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الدور:</span>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(userToRestore.role)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <Clock className="h-6 w-6" />
                    <p className="font-medium">سيتم استعادة الحساب مع جميع صلاحياته السابقة</p>
                  </div>
                </div>
                
                <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                  <Button
                    onClick={handleRestoreUser}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <RotateCcw className="h-5 w-5" />
                    استعادة الحساب
                  </Button>
                  <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
                    إلغاء الأمر
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </div>
            </>
          )}
          
          {restoreStep === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <RotateCcw className="absolute inset-0 m-auto h-10 w-10 text-emerald-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-emerald-600">جاري استعادة الحساب...</h2>
                <p className="text-slate-500 text-lg">يتم الآن استعادة الحساب وبياناته</p>
                <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          )}
          
          {restoreStep === "success" && (
            <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
              <div className="relative">
                <div className="h-28 w-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center ring-8 ring-emerald-50 shadow-lg animate-scale-in">
                  <Check className="h-14 w-14 text-emerald-500 animate-checkmark" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-emerald-600 animate-fade-in">
                  تمت الاستعادة بنجاح! 🎉
                </h2>
                <p className="text-slate-500 text-lg animate-fade-in-delay">تم استعادة حساب المستخدم بنجاح في النظام</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl animate-fade-in">
                  <UserCheck2 className="h-5 w-5" />
                  <p className="font-medium">الحساب الآن نشط وجاهز للاستخدام</p>
                </div>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Confirmation Dialog - Orange Theme */}
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-amber-400"></div>
          
          {suspendStep === "confirm" && userToSuspend && (
            <>
              <AlertDialogHeader className="text-center items-center space-y-6 pt-8 pb-4">
                <div className="relative">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-8 border-orange-50/80 shadow-lg animate-pulse">
                    <Ban className="h-14 w-14 text-orange-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-300 rounded-full opacity-60 animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-300 rounded-full opacity-40 animate-bounce delay-300"></div>
                </div>
                <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {userToSuspend.status === "SUSPENDED" ? "إلغاء تعليق الحساب" : "تعليق الحساب"}
                </AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="px-6 pb-6 space-y-6">
                <div className="text-center text-base text-slate-700 space-y-4">
                  <p className="text-xl font-medium text-slate-800">
                    {userToSuspend.status === "SUSPENDED" 
                      ? "هل أنت متأكد من رغبتك في إلغاء تعليق هذا الحساب؟"
                      : "هل أنت متأكد من رغبتك في تعليق هذا الحساب؟"}
                  </p>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                      <p className="font-bold text-orange-700 text-lg">معلومات الحساب</p>
                    </div>
                    
                    <div className="space-y-2 text-right">
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الاسم:</span>
                        <span className="font-bold text-orange-700">{userToSuspend.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">البريد الإلكتروني:</span>
                        <span className="font-bold text-orange-700 text-sm">{userToSuspend.email}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الحالة الحالية:</span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(userToSuspend.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center text-orange-700 bg-orange-50 p-4 rounded-2xl border border-orange-200">
                    <AlertTriangle className="h-6 w-6" />
                    <p className="font-medium">
                      {userToSuspend.status === "SUSPENDED" 
                        ? "سيتمكن المستخدم من تسجيل الدخول مرة أخرى"
                        : "لن يتمكن المستخدم من تسجيل الدخول حتى إلغاء التعليق"}
                    </p>
                  </div>
                </div>
                
                <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                  <Button
                    onClick={handleSuspendUser}
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <Ban className="h-5 w-5" />
                    {userToSuspend.status === "SUSPENDED" ? "إلغاء التعليق" : "تأكيد التعليق"}
                  </Button>
                  <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
                    إلغاء الأمر
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </div>
            </>
          )}
          
          {suspendStep === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <Ban className="absolute inset-0 m-auto h-10 w-10 text-orange-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-orange-600">
                  {userToSuspend?.status === "SUSPENDED" ? "جاري إلغاء التعليق..." : "جاري التعليق..."}
                </h2>
                <p className="text-slate-500 text-lg">يتم الآن معالجة طلبك</p>
                <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          )}
          
          {suspendStep === "success" && (
            <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
              <div className="relative">
                <div className="h-28 w-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center ring-8 ring-emerald-50 shadow-lg animate-scale-in">
                  <Check className="h-14 w-14 text-emerald-500 animate-checkmark" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-emerald-600 animate-fade-in">
                  {userToSuspend?.status === "SUSPENDED" ? "تم إلغاء التعليق بنجاح!" : "تم التعليق بنجاح!"}
                </h2>
                <p className="text-slate-500 text-lg animate-fade-in-delay">
                  {userToSuspend?.status === "SUSPENDED" 
                    ? "تم إلغاء تعليق الحساب بنجاح"
                    : "تم تعليق الحساب بنجاح"}
                </p>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Engineer Dialog - Emerald Theme */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-green-400"></div>
          
          {approveStep === "confirm" && userToApprove && (
            <>
              <AlertDialogHeader className="text-center items-center space-y-6 pt-8 pb-4">
                <div className="relative">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-green-100 border-8 border-emerald-50/80 shadow-lg animate-pulse">
                    <UserCheck className="h-14 w-14 text-emerald-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-300 rounded-full opacity-60 animate-bounce"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-300 rounded-full opacity-40 animate-bounce delay-300"></div>
                </div>
                <AlertDialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  الموافقة على المهندس
                </AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="px-6 pb-6 space-y-6">
                <div className="text-center text-base text-slate-700 space-y-4">
                  <p className="text-xl font-medium text-slate-800">
                    هل أنت متأكد من رغبتك في الموافقة على هذا المهندس؟
                  </p>
                  
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                        <UserCog className="h-6 w-6 text-emerald-600" />
                      </div>
                      <p className="font-bold text-emerald-700 text-lg">معلومات المهندس</p>
                    </div>
                    
                    <div className="space-y-2 text-right">
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الاسم:</span>
                        <span className="font-bold text-emerald-700">{userToApprove.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">البريد الإلكتروني:</span>
                        <span className="font-bold text-emerald-700 text-sm">{userToApprove.email}</span>
                      </div>
                      
                      <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl">
                        <span className="text-slate-600 font-medium">الحالة الحالية:</span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(userToApprove.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <UserCheck className="h-6 w-6" />
                    <p className="font-medium">سيتم تفعيل حساب المهندس وجميع صلاحياته</p>
                  </div>
                </div>
                
                <AlertDialogFooter className="flex-col sm:flex-row sm:justify-center gap-4 pt-2">
                  <Button
                    onClick={handleApproveUser}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                  >
                    <UserCheck className="h-5 w-5" />
                    تأكيد الموافقة
                  </Button>
                  <AlertDialogCancel className="w-full sm:w-auto mt-0 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold py-3 px-8 rounded-xl border-0 shadow-sm transition-all duration-300">
                    إلغاء الأمر
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </div>
            </>
          )}
          
          {approveStep === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-8 p-12 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <UserCheck className="absolute inset-0 m-auto h-10 w-10 text-emerald-600 animate-pulse" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-emerald-600">جاري الموافقة...</h2>
                <p className="text-slate-500 text-lg">يتم الآن تفعيل حساب المهندس</p>
                <div className="w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            </div>
          )}
          
          {approveStep === "success" && (
            <div className="flex flex-col items-center justify-center space-y-6 p-12 text-center">
              <div className="relative">
                <div className="h-28 w-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center ring-8 ring-emerald-50 shadow-lg animate-scale-in">
                  <Check className="h-14 w-14 text-emerald-500 animate-checkmark" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-2 shadow-lg">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-emerald-600 animate-fade-in">
                  تمت الموافقة بنجاح! 🎉
                </h2>
                <p className="text-slate-500 text-lg animate-fade-in-delay">تم تفعيل حساب المهندس بنجاح</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl animate-fade-in">
                  <UserCog className="h-5 w-5" />
                  <p className="font-medium">المهندس الآن نشط وجاهز للعمل</p>
                </div>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onUserAdded={handleUserAddedOrUpdated}
      />
      {selectedUserForPasswordReset && adminUserId && (
        <ResetPasswordDialog
          isOpen={isResetPasswordDialogOpen}
          onClose={() => {
            setIsResetPasswordDialogOpen(false);
            setSelectedUserForPasswordReset(null);
          }}
          userId={selectedUserForPasswordReset.id}
          userName={selectedUserForPasswordReset.name}
          adminUserId={adminUserId}
        />
      )}
      {selectedUserForEdit && adminUserId && (
        <EditUserDialog
          isOpen={isEditUserDialogOpen}
          onClose={() => {
            setIsEditUserDialogOpen(false);
            setSelectedUserForEdit(null);
          }}
          onUserUpdated={handleUserAddedOrUpdated}
          user={selectedUserForEdit}
          adminUserId={adminUserId}
        />
      )}
      
      {/* Admin Settings Dialog */}
      {adminUserId && (
        <AdminSettingsDialog
          isOpen={isAdminSettingsDialogOpen}
          onOpenChange={(open) => {
            setIsAdminSettingsDialogOpen(open);
            if (open) {
              fetchAdminData();
            } else {
              handleAdminSettingsUpdated();
            }
          }}
          adminId={adminUserId}
          adminName={adminName}
          adminEmail={adminEmail}
        />
      )}
    </div>
  );
}