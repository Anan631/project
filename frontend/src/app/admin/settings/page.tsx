"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Settings as SettingsIcon,
  Loader2,
  Mail,
  ShieldAlert,
  Globe,
  Upload,
  Bell,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Shield,
  Key,
  Lock,
  Database
} from 'lucide-react';
import { getSystemSettings, updateSystemSettings, type SystemSettingsDocument } from '@/lib/db';
import { useSettings } from '@/contexts/SettingsContext';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  // We can use the context here too, but for admin page maybe we want fresh fetch or direct control?
  // The user code used manual fetch. Let's stick to user code style for now but ensure we update context if we can.
  // Actually, updating the DB will update the backend, but context might need manual refresh if it doesn't poll.
  // The SettingsProvider fetches on mount. If we update here, other simple user's won't see it until refresh.
  // That's acceptable for now.

  const [settings, setSettings] = useState<SystemSettingsDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Hook into global settings to trigger updates if we wanted (optional, but good practice)
  const { updateSettings: updateGlobalSettings } = useSettings();

  useEffect(() => {
    async function fetchSettings() {
      setIsFetching(true);
      try {
        const fetchedSettings = await getSystemSettings();
        if (fetchedSettings) {
          setSettings(fetchedSettings);
        } else {
          toast({
            title: "⚠️ خطأ في التحميل",
            description: "فشل تحميل إعدادات النظام.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "❌ خطأ فادح",
          description: "حدث خطأ أثناء تحميل الإعدادات.",
          variant: "destructive"
        });
        console.error("Error fetching settings:", error);
      }
      setIsFetching(false);
    }
    fetchSettings();
  }, [toast]);

  const handleChange = (field: keyof SystemSettingsDocument, value: string | number | boolean | string[]) => {
    setSettings(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!settings) {
      toast({
        title: "❌ خطأ",
        description: "لا توجد إعدادات لحفظها.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);

    try {
      // محاكاة عملية الحفظ
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await updateSystemSettings(settings);

      if (result.success) {
        toast({
          title: "✅ تم الحفظ بنجاح",
          description: result.message || "تم تحديث إعدادات النظام بنجاح.",
          variant: "default",
        });
        // Update global context so header/footer update immediately without refresh
        updateGlobalSettings(settings);
      } else {
        toast({
          title: "❌ خطأ في الحفظ",
          description: result.message || "فشل تحديث إعدادات النظام.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRestoreDefaults = () => {
    if (!settings) return;

    // Default system settings
    const defaultSettings: SystemSettingsDocument = {
      ...settings, // preserve ID and unrelated fields
      siteName: "المحترف لحساب الكميات",
      maintenanceMode: false,
      emailNotificationsEnabled: true,
      fileScanning: false,
      loginAttemptsLimit: 5,
      passwordResetExpiry: 24,
      maxUploadSizeMB: 10,
      notificationFrequency: 'instant',
      allowedFileTypes: ['pdf', 'docx', 'jpg', 'png', 'mp4'],
      notificationEmail: settings.notificationEmail // preserve email if changing defaults or reset it? User asked for "default settings". Usually email is config, not default. Let's keep existing email to be safe, or empty it. Prompt implied "Default Settings". Let's assume site name and maintenance are key.
    };

    setSettings(defaultSettings);

    toast({
      title: "🔄 تم استعادة الافتراضي",
      description: "تم استعادة الإعدادات الافتراضية. يرجى الضغط على حفظ لتأكيد التغييرات.",
      variant: "default",
    });
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            <SettingsIcon className="absolute inset-0 m-auto h-8 w-8 text-sky-600 animate-pulse" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-700">جاري تحميل الإعدادات</h3>
            <p className="text-slate-500">يتم الآن تحميل إعدادات النظام...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-red-600">فشل تحميل الإعدادات</h3>
              <p className="text-slate-600">تعذر تحميل إعدادات النظام. يرجى المحاولة مرة أخرى.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-slate-300"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                <SettingsIcon className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                  إعدادات النظام
                </h1>
                <p className="text-slate-600 text-lg mt-1">تهيئة وإدارة إعدادات النظام الأساسية والمتقدمة</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-slate-500">حالة النظام</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-700">يعمل بشكل طبيعي</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-400 rounded-xl flex items-center justify-center">
                  <Server className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Settings Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-sky-500 to-emerald-400 rounded-full"></div>
                  لوحة التحكم بالإعدادات
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  قم بإدارة وتخصيص إعدادات النظام حسب متطلباتك
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-all duration-300 rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRestoreDefaults}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-amber-600 rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  استعادة الافتراضي
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
              <TabsList className="grid w-full grid-cols-4 gap-2 mb-8 bg-slate-100 p-2 rounded-2xl">
                <TabsTrigger
                  value="general"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-sky-600 rounded-xl transition-all duration-300"
                >
                  <Globe className="w-4 h-4 ml-2" />
                  الإعدادات العامة
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-sky-600 rounded-xl transition-all duration-300"
                >
                  <Shield className="w-4 h-4 ml-2" />
                  الأمان
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-sky-600 rounded-xl transition-all duration-300"
                >
                  <Bell className="w-4 h-4 ml-2" />
                  الإشعارات
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-sky-600 rounded-xl transition-all duration-300"
                >
                  <Database className="w-4 h-4 ml-2" />
                  الملفات والتخزين
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSaveSettings}>
                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="siteName" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-sky-600" />
                          اسم الموقع
                        </Label>
                        <Input
                          id="siteName"
                          value={settings.siteName}
                          onChange={(e) => handleChange('siteName', e.target.value)}
                          className="bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                          placeholder="أدخل اسم الموقع..."
                        />
                        <p className="mt-2 text-sm text-slate-500">الاسم الذي سيظهر في أعلى الموقع وشريط العنوان</p>
                      </div>

                      {/* Default Language Section Removed Here */}

                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label htmlFor="maintenanceMode" className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                              <ShieldAlert className="w-5 h-5 text-amber-600" />
                              وضع الصيانة
                            </Label>
                            <p className="text-sm text-slate-600">
                              عند التفعيل، سيتم إغلاق الموقع أمام الزوار وعرض صفحة الصيانة
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="maintenanceMode"
                              checked={settings.maintenanceMode}
                              onCheckedChange={(checked) => handleChange('maintenanceMode', !!checked)}
                              className={`h-6 w-6 ${settings.maintenanceMode ? 'bg-amber-500 border-amber-500' : ''}`}
                            />
                          </div>
                        </div>
                        {settings.maintenanceMode && (
                          <Badge variant="destructive" className="mt-3 flex items-center gap-1 w-fit">
                            <ShieldAlert className="h-3 w-3" />
                            الموقع في وضع الصيانة
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="loginAttemptsLimit" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-sky-600" />
                          حد محاولات تسجيل الدخول
                        </Label>
                        <Input
                          id="loginAttemptsLimit"
                          type="number"
                          min="1"
                          max="10"
                          value={settings.loginAttemptsLimit || 5}
                          onChange={(e) => handleChange('loginAttemptsLimit', parseInt(e.target.value, 10))}
                          className="bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                        />
                        <p className="mt-2 text-sm text-slate-500">عدد المحاولات المسموحة قبل القفل المؤقت للحساب</p>
                      </div>

                      <div>
                        <Label htmlFor="passwordResetExpiry" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-sky-600" />
                          صلاحية رابط إعادة التعيين (ساعة)
                        </Label>
                        <Input
                          id="passwordResetExpiry"
                          type="number"
                          min="1"
                          max="72"
                          value={settings.passwordResetExpiry || 24}
                          onChange={(e) => handleChange('passwordResetExpiry', parseInt(e.target.value, 10))}
                          className="bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                        />
                        <p className="mt-2 text-sm text-slate-500">المدة الزمنية لصلاحية رابط إعادة تعيين كلمة المرور</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Advanced Security Tools section removed */}
                    </div>
                  </div>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label htmlFor="emailNotificationsEnabled" className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                              <Mail className="w-5 h-5 text-sky-600" />
                              تفعيل إشعارات البريد الإلكتروني
                            </Label>
                            <p className="text-sm text-slate-600">
                              إرسال إشعارات عبر البريد للمستخدمين عند حدوث أنشطة مهمة
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="emailNotificationsEnabled"
                              checked={settings.emailNotificationsEnabled}
                              onCheckedChange={(checked) => handleChange('emailNotificationsEnabled', !!checked)}
                              className={`h-6 w-6 ${settings.emailNotificationsEnabled ? 'bg-sky-500 border-sky-500' : ''}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notificationEmail" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-sky-600" />
                          بريد الإشعارات
                        </Label>
                        <Input
                          id="notificationEmail"
                          type="email"
                          value={settings.notificationEmail || ''}
                          onChange={(e) => handleChange('notificationEmail', e.target.value)}
                          className="bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                          placeholder="admin@example.com"
                        />
                        <p className="mt-2 text-sm text-slate-500">البريد الإلكتروني الذي سيتم إرسال الإشعارات منه</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="notificationFrequency" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-sky-600" />
                          تكرار الإشعارات
                        </Label>
                        <Select
                          value={settings.notificationFrequency || 'instant'}
                          onValueChange={(value) => handleChange('notificationFrequency', value)}
                        >
                          <SelectTrigger className="w-full bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-right">
                            <SelectValue placeholder="اختر التكرار..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="instant" className="flex justify-end text-lg">🔔 فوري</SelectItem>
                            <SelectItem value="daily" className="flex justify-end text-lg">📅 يومي</SelectItem>
                            <SelectItem value="weekly" className="flex justify-end text-lg">🗓️ أسبوعي</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-2 text-sm text-slate-500">معدل إرسال الإشعارات المجمعة للمستخدمين</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Files Settings */}
                <TabsContent value="files" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="maxUploadSizeMB" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Upload className="w-4 h-4 text-sky-600" />
                          الحد الأقصى لحجم الملف (MB)
                        </Label>
                        <Input
                          id="maxUploadSizeMB"
                          type="number"
                          min="1"
                          max="100"
                          value={settings.maxUploadSizeMB}
                          onChange={(e) => handleChange('maxUploadSizeMB', parseInt(e.target.value, 10))}
                          className="bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                        />
                        <p className="mt-2 text-sm text-slate-500">الحجم الأقصى المسموح به لرفع الملفات بالميجابايت</p>
                      </div>

                      <div>
                        <Label htmlFor="allowedFileTypes" className="block mb-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Database className="w-4 h-4 text-sky-600" />
                          أنواع الملفات المسموحة
                        </Label>
                        <Input
                          id="allowedFileTypes"
                          value={settings.allowedFileTypes?.join(', ') || ''}
                          onChange={(e) => handleChange('allowedFileTypes', e.target.value.split(',').map(s => s.trim()))}
                          className="bg-white border-slate-300 focus:border-sky-400 h-12 rounded-xl text-lg"
                          placeholder="pdf, docx, jpg, png, mp4"
                        />
                        <p className="mt-2 text-sm text-slate-500">أدخل أنواع الملفات مفصولة بفاصلة (pdf, docx, jpg, etc.)</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label htmlFor="fileScanning" className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                              <Shield className="w-5 h-5 text-green-600" />
                              فحص الملفات المضغوطة
                            </Label>
                            <p className="text-sm text-slate-600">
                              فحص محتويات الملفات المضغوطة (ZIP, RAR) قبل الرفع للتأكد من الأمان
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="fileScanning"
                              checked={settings.fileScanning || false}
                              onCheckedChange={(checked) => handleChange('fileScanning', !!checked)}
                              className={`h-6 w-6 ${settings.fileScanning ? 'bg-green-500 border-green-500' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                      {isLoading ? 'جاري حفظ التغييرات...' : 'جميع التغييرات جاهزة للحفظ'}
                    </div>

                    <Button
                      type="submit"
                      className="w-full lg:w-auto bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold py-3 px-8 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="ms-2 h-5 w-5 animate-spin" />
                          جاري حفظ الإعدادات...
                        </>
                      ) : (
                        <>
                          <Save className="ms-2 h-5 w-5" />
                          حفظ جميع الإعدادات
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}