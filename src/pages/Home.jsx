import HeroSection from "../components/landing/HeroSection";
import HowItWorks from "../components/landing/HowItWorks";
import JobCategories from "../components/landing/JobCategories";
import FeaturesSection from "../components/landing/FeaturesSection";
import WhySection from "../components/landing/WhySection";
import Testimonials from "../components/landing/Testimonials";
import FAQ from "../components/landing/FAQ";
import CTASection from "../components/landing/CTASection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <HowItWorks />
      <JobCategories />
      <FeaturesSection />
      <WhySection />
      <Testimonials />
      <FAQ />
      <CTASection />
    </div>
  );
}