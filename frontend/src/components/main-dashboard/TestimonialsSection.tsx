"use client";

import { Quote, Sparkles, Star } from 'lucide-react';
import { motion } from "framer-motion";
import React from 'react';

const testimonials = [
  {
    name: "عميد سماره",
    role: "صاحب مشروع",
    testimonial: "الموقع رائع وسهل الاستخدام! ساعدني كثيرًا في تقدير كميات المواد لمشروعي بسرعة ودقة. أنصح به بشدة.",
    avatar: "https://ui-avatars.com/api/?name=عميد&background=f97316&color=fff&font-size=0.5",
  },
  {
    name: "م. أحمد خالد",
    role: "مهندس إنشائي",
    testimonial: "كـ مهندس، أجد هذا الموقع أداة قيمة جدًا. المعادلات دقيقة والواجهة سهلة. يوفر الكثير من الوقت والجهد.",
    avatar: "https://ui-avatars.com/api/?name=أحمد&background=3b82f6&color=fff&font-size=0.5",
  },
  {
    name: "سارة عبدالله",
    role: "مستخدم جديد",
    testimonial: "أخيرًا موقع عربي متكامل لحساب كميات البناء! تصميم جذاب وأدوات مفيدة للغاية. شكرًا للقائمين عليه.",
    avatar: "https://ui-avatars.com/api/?name=سارة&background=ec4899&color=fff&font-size=0.5",
  },
    {
    name: "شركة البناء الحديث",
    role: "مقاولات عامة",
    testimonial: "نستخدم الموقع لتقديراتنا الأولية للمشاريع. يساعدنا في تقديم عروض أسعار سريعة لعملائنا. عمل ممتاز!",
    avatar: "https://ui-avatars.com/api/?name=ش&background=8b5cf6&color=fff&font-size=0.5",
  },
  {
    name: "خالد العلي",
    role: "مقاول",
    testimonial: "دقة الحسابات وسرعة الأداء تجعل هذا الموقع خياري الأول دائما. لا يمكنني الاستغناء عنه.",
    avatar: "https://ui-avatars.com/api/?name=خالد&background=10b981&color=fff&font-size=0.5",
  },
  {
    name: "نورة سالم",
    role: "مالكة مشروع",
    testimonial: "تجربة ممتازة من البداية إلى النهاية، التقارير واضحة والفريق متعاون.",
    avatar: "https://ui-avatars.com/api/?name=نورة&background=ef4444&color=fff&font-size=0.5",
  }
];

const TestimonialCard = ({ name, role, testimonial, avatar }: typeof testimonials[0]) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group relative"
    >
      <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl hover:shadow-amber-500/10 hover:shadow-2xl transition-all duration-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700"></div>

        <div className="relative mb-6 flex justify-center">
          <div className="relative inline-block">
            <img src={avatar} alt={name} className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-md transform transition-transform group-hover:scale-110">
                <Quote className="w-5 h-5" style={{ transform: "scaleX(-1)" }}/>
            </div>
          </div>
        </div>

        <div className="relative text-center">
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6 font-light italic">
              "{testimonial}"
            </p>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <h4 className="font-bold text-xl text-gray-900 dark:text-white">{name}</h4>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{role}</p>
            </div>
        </div>

        <div className="absolute bottom-4 left-4 flex gap-1 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
            <Star className="w-3 h-3 fill-current" />
        </div>
      </div>
      
      <div className="absolute -bottom-4 left-4 right-4 h-4 bg-gray-200 dark:bg-gray-800 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
    </motion.div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const cardVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const TestimonialsSection = () => {
  return (
    <section className="relative py-20 md:py-28 bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-gradient-to-br from-amber-100 to-transparent rounded-full blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-3xl opacity-30 dark:opacity-10"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-full mb-6 border border-amber-300/50 dark:border-amber-800/30">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">شهادات نعتز بها</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 dark:from-amber-400 dark:via-orange-300 dark:to-amber-400 bg-clip-text text-transparent">
            ماذا يقول المستخدمون عنا؟
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            آراء وشهادات من مهندسين وملاك مشاريع يثقون في منصتنا ويشاركونا قصص نجاحهم.
          </p>
        </motion.div>
      
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                {...testimonial}
              />
            ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;