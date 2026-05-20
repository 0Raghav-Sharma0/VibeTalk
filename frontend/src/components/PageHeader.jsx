import BackButton from "./BackButton";

/**
 * Sticky sub-page header when Navbar is hidden or for in-page sections.
 */
export default function PageHeader({
  title,
  backTo = "/",
  backLabel = "Back",
  className = "",
  children,
}) {
  return (
    <header
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b0b0f]/95 backdrop-blur-md shrink-0 ${className}`}
    >
      <BackButton to={backTo} label={backLabel} variant="ghost" />
      {title && (
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
          {title}
        </h1>
      )}
      {children}
    </header>
  );
}
