import AppLayout from "@/components/AppLayout";
import HeroSection from "@/components/main-dashboard/HeroSection";
import FeaturesSection from "@/components/main-dashboard/FeaturesSection";
import MainDashboardClient from "@/components/main-dashboard/MainDashboardClient";
import AuthCardsSection from "@/components/main-dashboard/AuthCardsSection";
import UserTasksSection from "@/components/main-dashboard/UserTasksSection";
import TestimonialsSection from "@/components/main-dashboard/TestimonialsSection";
import WhyUsSection from "@/components/main-dashboard/WhyUsSection";
import WelcomeMessage from "@/components/main-dashboard/WelcomeMessage";
import AnimatedSeparator from "@/components/ui/AnimatedSeparator";
import "@/styles/AnimatedSeparator.css";

export default function HomePage() {
  return (
    <>
      <WelcomeMessage />
      <AppLayout>
        <HeroSection />
        <AnimatedSeparator />
        <AuthCardsSection />
        <AnimatedSeparator />
        <MainDashboardClient />
        <AnimatedSeparator />
        <UserTasksSection />
        <AnimatedSeparator />
        <WhyUsSection />
        <AnimatedSeparator />
        <FeaturesSection />
        <AnimatedSeparator />
        <TestimonialsSection />
      </AppLayout>
    </>
  );
}
