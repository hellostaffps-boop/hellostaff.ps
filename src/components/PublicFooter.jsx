import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-lg">Hello Staff</span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              The modern way to hire and get hired in hospitality. Connecting talent with opportunity.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">For Workers</h4>
            <ul className="space-y-2.5">
              <li><Link to="/jobs" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Browse Jobs</Link></li>
              <li><Link to="/about" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/candidate/dashboard" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">My Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">For Employers</h4>
            <ul className="space-y-2.5">
              <li><Link to="/employer/post-job" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Post a Job</Link></li>
              <li><Link to="/employer/dashboard" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Employer Dashboard</Link></li>
              <li><Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Contact Sales</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">Contact</Link></li>
              <li><span className="text-sm text-primary-foreground/60">Privacy Policy</span></li>
              <li><span className="text-sm text-primary-foreground/60">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/40">
            © 2026 Hello Staff. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-sm text-primary-foreground/40">Twitter</span>
            <span className="text-sm text-primary-foreground/40">LinkedIn</span>
            <span className="text-sm text-primary-foreground/40">Instagram</span>
          </div>
        </div>
      </div>
    </footer>
  );
}