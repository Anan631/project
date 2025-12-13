
"use client"; // مهم: هذا يحدد أن المكون يعمل في بيئة العميل

// أيقونات نوع الحساب
import { UserCog, HardHat } from "lucide-react";
// ...existing code...

// خيارات نوع الحساب
const accountTypes = [
  { value: "owner", label: "مالك", icon: UserCog },
  { value: "engineer", label: "مهندس", icon: HardHat }
];

// ...existing code...



// ...existing code...



import { useState, useCallback, useMemo, useEffect } from 'react'; // أضفت useEffect هنا
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// تأكد أن هذا الاستيراد صحيح ويشير إلى تصدير افتراضي من ملف AppLayout
import AppLayout from "@/components/AppLayout"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Send,
  User,
  MessageSquare,
  Loader2,
  Briefcase,
  Home as HomeIcon,
  ListChecks,
  Clock,
  Globe,
  Star,
  CheckCircle,
  Shield,
  Zap,
  Heart,
  Award,
  Users,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ArrowUp
} from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { sendContactMessageAction } from "./actions";

// مخطط التحقق من صحة النموذج باستخدام Zod
const contactFormSchemaClient = z.object({
  name: z.string().min(3, { message: "الاسم مطلوب (3 أحرف على الأقل)." }),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح." }),
  messageType: z.string().min(1, { message: "يرجى اختيار نوع الرسالة." }),
  subject: z.string().min(5, { message: "الموضوع مطلوب (5 أحرف على الأقل)." }),
  message: z.string().min(10, { message: "الرسالة مطلوبة (10 أحرف على الأقل)." }),
  priority: z.enum(["low", "medium", "high"], { required_error: "يرجى اختيار أولوية الرسالة." }),
  accountType: z.string().optional()
});

// استنتاج النوع من مخطط Zod
type ContactFormValues = z.infer<typeof contactFormSchemaClient>;

// طرق الاتصال المعززة بميزات تفاعلية
const contactMethods = [
  {
    icon: Mail,
    label: "البريد الإلكتروني",
    value: "mediaplus64@gmail.com",
    href: "mailto:mediaplus64@gmail.com",
    description: "راسلنا عبر البريد الإلكتروني",
    color: "from-blue-500 via-blue-600 to-blue-700",
    hoverColor: "hover:from-blue-600 hover:via-blue-700 hover:to-blue-800",
    bgGlow: "bg-blue-500/20",
    responseTime: "خلال 2-4 ساعات",
    isInstant: false
  },
  {
    icon: Phone,
    label: "الهاتف / واتساب",
    value: "+972 594 371 424",
    href: "tel:+972594371424",
    href2: "https://wa.me/972594371424",
    description: "اتصل بنا مباشرة",
    color: "from-emerald-500 via-green-600 to-emerald-700",
    hoverColor: "hover:from-emerald-600 hover:via-green-700 hover:to-emerald-800",
    bgGlow: "bg-emerald-500/20",
    responseTime: "فوري",
    isInstant: true
  },
  {
    icon: MapPin,
    label: "الموقع",
    value: "سلفيت، فلسطين",
    href: "https://maps.google.com/?q=Salfit,Palestine", // تأكد من تحديث هذا الرابط لموقعك الفعلي
    description: "موقع مكتبنا الرئيسي",
    color: "from-rose-500 via-pink-600 to-rose-700",
    hoverColor: "hover:from-rose-600 hover:via-pink-700 hover:to-rose-800",
    bgGlow: "bg-rose-500/20",
    responseTime: "زيارة مكتبية",
    isInstant: false
  },
  {
    icon: Clock,
    label: "أوقات العمل",
    value: "الأحد - الخميس، 9 صباحًا – 4 مساءً",
    description: "أوقات الدوام الرسمي",
    color: "from-violet-500 via-purple-600 to-violet-700",
    hoverColor: "hover:from-violet-600 hover:via-purple-700 hover:to-violet-800",
    bgGlow: "bg-violet-500/20",
    responseTime: "خلال ساعات العمل",
    isInstant: false
  }
];

// أنواع الرسائل المعززة بالأولويات
const messageTypes = [
  { value: "general", label: "استفسار عام", icon: MessageSquare, priority: "medium" },
  { value: "project", label: "طلب مشروع", icon: Briefcase, priority: "high" },
  { value: "support", label: "دعم فني", icon: ListChecks, priority: "high" },
  { value: "feedback", label: "ملاحظات أو اقتراحات", icon: Star, priority: "low" },
  { value: "partnership", label: "شراكة أو تعاون", icon: Globe, priority: "high" },
  { value: "complaint", label: "شكوى أو مشكلة", icon: Shield, priority: "high" }
];

// خيارات الأولوية
const priorityOptions = [
  { value: "low", label: "منخفضة", color: "text-green-600", bgColor: "bg-green-100" },
  { value: "medium", label: "متوسطة", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  { value: "high", label: "عالية", color: "text-red-600", bgColor: "bg-red-100" }
];

// مقاييس النجاح للمصداقية
const successMetrics = [
  { icon: Users, label: "عملاء راضون", value: "500+", color: "text-blue-600" },
  { icon: Award, label: "مشاريع مكتملة", value: "200+", color: "text-green-600" },
  { icon: TrendingUp, label: "سنوات خبرة", value: "8+", color: "text-purple-600" },
  { icon: Heart, label: "تقييم العملاء", value: "4.9/5", color: "text-rose-600" }
];

// المكون الرئيسي لصفحة الاتصال
export default function ContactPageEnhanced() {
  const { toast } = useToast();
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // تهيئة react-hook-form مع Zod resolver
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchemaClient),
    defaultValues: {
      name: "",
      email: "",
      messageType: "",
      subject: "",
      message: "",
      priority: "medium"
    }
  });

  // معالج إرسال النموذج مع ملاحظات محسنة
  const onFormSubmit: SubmitHandler<ContactFormValues> = useCallback(async (data) => {
    setIsFormLoading(true);
    
    try {
      const response = await sendContactMessageAction(data);
      
      // التأكد من أن الاستجابة لديها خاصية success
      if (!response || typeof response.success === 'undefined') {
        throw new Error("استجابة غير صحيحة من الخادم");
      }
      
      if (response.success) {
        const priorityText = priorityOptions.find(p => p.value === data.priority)?.label || "متوسطة";
        
        toast({
          title: "✅ تم إرسال رسالتك بنجاح!",
          description: `أولوية الرسالة: ${priorityText} - سنتواصل معك في أقرب وقت ممكن 🚀`,
          variant: "default"
        });
        
        form.reset();
      } else {
        throw new Error(response.error || response.message || "فشل إرسال الرسالة");
      }
    } catch (error) {
      console.error('[contact page] Form submission error:', error);
      toast({
        title: "❌ حدث خطأ في الإرسال",
        description: error instanceof Error ? error.message : "يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة",
        variant: "destructive"
      });
    } finally {
      setIsFormLoading(false);
    }
  }, [form, toast]);

  // وظيفة التمرير للأعلى
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // استخدام useEffect للتعامل مع أحداث التمرير
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // [] لضمان تشغيل المستمع مرة واحدة فقط عند التركيب وإزالته عند إلغاء التركيب


  // الرسوم المتحركة المُخزنة في الذاكرة (Memoized animations)
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100
      }
    }
  }), []);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* عناصر الخلفية المتحركة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-10 w-48 h-48 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-green-200/30 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* قسم العنوان الرئيسي (Hero Section) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 py-16 relative z-10"
        >
          <div className="text-center mb-16">
            <motion.div variants={itemVariants} className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-full shadow-2xl mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <HomeIcon className="w-12 h-12 text-white relative z-10" />
            </motion.div>
            
            <motion.div variants={itemVariants} className="mb-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  تواصل معنا
                </span>
              </h1>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  متاح 24/7
                </Badge>
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </div>
            </motion.div>
            
            <motion.p variants={itemVariants} className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              فريقنا المتخصص مستعد لتقديم أفضل الحلول الرقمية والإبداعية. نحن نؤمن بأن كل فكرة تستحق التميز
            </motion.p>
          </div>

          {/* شبكة طرق الاتصال المعززة */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
            {contactMethods.map((method, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative"
              >
                <div className={`absolute inset-0 ${method.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <Card className="relative h-full bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl overflow-hidden">
                  <CardContent className="p-8 text-center relative">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${method.color} rounded-full mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <method.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="font-bold text-xl text-gray-800 mb-3">{method.label}</h3>
                    <p className="text-gray-600 mb-4">{method.description}</p>
                    
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">
                        {method.href ? (
                          <a
                            href={method.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            {method.value}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span>{method.value}</span>
                        )}
                      </div>
                      
                      {method.href2 && (
                        <div>
                          <a
                            href={method.href2}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200 text-sm"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                            واتساب
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Badge className={`${method.isInstant ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {method.isInstant && <Zap className="w-3 h-3 mr-1" />}
                        {method.responseTime}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* نموذج الاتصال المعزز */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="text-center pb-8 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-4xl font-bold text-gray-800 mb-4">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    أرسل لنا رسالة
                  </span>
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
                  املأ النموذج أدناه بدقة وسنتواصل معك في أقرب وقت ممكن
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-10">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* حقل الاسم */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-semibold text-lg">
                              <User className="inline w-5 h-5 mr-2 text-blue-600" />
                              الاسم الكامل
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل اسمك الكامل"
                                {...field}
                                className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* حقل البريد الإلكتروني */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-semibold text-lg">
                              <Mail className="inline w-5 h-5 mr-2 text-blue-600" />
                              البريد الإلكتروني
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="example@email.com"
                                {...field}
                                className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* حقل نوع الرسالة */}
                      <FormField
                        control={form.control}
                        name="messageType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-semibold text-lg">
                              <MessageSquare className="inline w-5 h-5 mr-2 text-blue-600" />
                              نوع الرسالة
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg">
                                  <SelectValue placeholder="اختر نوع الرسالة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[9999]">
                                {messageTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-3">
                                      <type.icon className="w-5 h-5" />
                                      <span>{type.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* حقل الأولوية */}
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-semibold text-lg">
                              <Star className="inline w-5 h-5 mr-2 text-blue-600" />
                              أولوية الرسالة
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg">
                                  <SelectValue placeholder="اختر أولوية الرسالة" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[9999]">
                                {priorityOptions.map((priority) => (
                                  <SelectItem key={priority.value} value={priority.value}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${priority.bgColor}`}></div>
                                      <span>{priority.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    {/* حقل نوع الحساب */}
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold text-lg">
                            <UserCog className="inline w-5 h-5 mr-2 text-blue-600" />
                            نوع الحساب
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg h-[52px] min-h-[52px] w-full min-w-0">
                                <SelectValue placeholder="اختر نوع الحساب" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="w-full min-w-0 z-[9999]">
                              {accountTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="text-lg py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <type.icon className="w-5 h-5" />
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    </div>

                    {/* حقل الموضوع */}
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold text-lg">
                            <ListChecks className="inline w-5 h-5 mr-2 text-blue-600" />
                            موضوع الرسالة
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="أدخل موضوع الرسالة"
                              {...field}
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* حقل محتوى الرسالة */}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold text-lg">
                            <MessageSquare className="inline w-5 h-5 mr-2 text-blue-600" />
                            محتوى الرسالة
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="أدخل رسالتك هنا بالتفصيل..."
                              {...field}
                              rows={8}
                              className="border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3 px-4 text-lg resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* زر الإرسال */}
                    <div className="text-center pt-6">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          type="submit"
                          disabled={isFormLoading}
                          className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700 text-white font-bold px-12 py-4 rounded-2xl shadow-2xl transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                          {isFormLoading ? (
                            <>
                              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                              جارٍ الإرسال...
                            </>
                          ) : (
                            <>
                              <Send className="mr-3 h-6 w-6" />
                              إرسال الرسالة
                              <ArrowRight className="ml-3 h-6 w-6" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {/* قسم أيقونات وسائل التواصل الاجتماعي */}
          <motion.div variants={itemVariants} className="flex justify-center gap-8 mt-16 mb-8">
            {/* واتساب */}
            <a
              href="https://wa.me/972594371424"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-500 rounded-full shadow-xl text-white transition-all duration-300 hover:scale-110"
              aria-label="واتساب"
            >
              <WhatsAppIcon className="w-8 h-8" />
            </a>
            {/* انستقرام */}
            <a
              href="https://www.instagram.com/a.w.samarah3/" // تأكد من تحديث هذا الرابط
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-400 via-rose-500 to-purple-500 rounded-full shadow-xl text-white transition-all duration-300 hover:scale-110"
              aria-label="انستقرام"
            >
              <Instagram className="w-8 h-8" />
            </a>
            {/* فيسبوك */}
            <a
              href="https://www.facebook.com/a.w.samarah4" // تأكد من تحديث هذا الرابط
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full shadow-xl text-white transition-all duration-300 hover:scale-110"
              aria-label="فيسبوك"
            >
              <Facebook className="w-8 h-8" />
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mt-16">
            <div className="inline-flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-200/50 rounded-full blur-xl animate-pulse"></div>
                <div className="relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full shadow-lg border border-green-200">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">نعدك بالرد خلال 24 ساعة كحد أقصى</span>
                </div>
              </div>
              
            </div>
          </motion.div>

        </motion.div> {/* نهاية motion.div للـ containerVariants */}

        {/* زر التمرير للأعلى */}
        <AnimatePresence>
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3 }}
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
