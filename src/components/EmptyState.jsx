import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionPath }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4 sm:mb-6">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-semibold text-base sm:text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4 sm:mb-6">{description}</p>
      {actionLabel && actionPath && (
        <Link to={actionPath}>
          <Button size="sm" className="gap-2">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}