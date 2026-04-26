export default function PageHeader({ title, description, children = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start lg:items-center justify-between gap-4 mb-8">
      <div className="flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-nowrap">
          {children}
        </div>
      )}
    </div>
  );
}