import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Ready to get started?
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of workers and businesses already using Hello Staff 
          to connect and grow.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/jobs">
            <Button size="lg" className="h-12 px-8 text-base gap-2">
              Find a Job
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/employer/dashboard">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-2">
              Post a Job
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}