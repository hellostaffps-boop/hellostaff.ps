import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionPath }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
      {Icon && (
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Decorative background blurs */}
          <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-150" />
          <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full scale-110" />
          
          {/* Main Icon Container */}
          <motion.div 
            className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-secondary flex items-center justify-center border border-border/50 shadow-xl shadow-accent/5"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className="w-10 h-10 text-accent drop-shadow-md" strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      )}

      <motion.h3 
        className="font-bold text-xl sm:text-2xl mb-3 text-foreground tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.h3>

      <motion.p 
        className="text-sm sm:text-base text-muted-foreground max-w-md mb-8 leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {description}
      </motion.p>

      {actionLabel && actionPath && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link to={actionPath}>
            <Button size="lg" className="h-12 px-8 rounded-xl font-medium shadow-lg shadow-primary/10 transition-transform hover:scale-105 active:scale-95">
              {actionLabel}
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}