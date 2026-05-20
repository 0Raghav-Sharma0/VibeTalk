import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * @param {object} props
 * @param {string} [props.to] - Fallback route when history back is unavailable
 * @param {string} [props.label] - Visible label (hidden on xs if showLabelOnMobile false)
 * @param {boolean} [props.preferHistory] - Try navigate(-1) first when same-session
 * @param {string} [props.className]
 * @param {string} [props.variant] - 'default' | 'ghost' | 'settings'
 * @param {() => void} [props.onClick] - Optional override (runs before navigation)
 */
export default function BackButton({
  to = "/",
  label = "Back",
  preferHistory = true,
  className = "",
  variant = "default",
  showLabel = true,
  onClick,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    onClick?.();
    if (onClick) return;
    if (preferHistory && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(to);
  };

  const variants = {
    default:
      "text-gray-700 hover:bg-gray-100 dark:text-[#b29bff] dark:hover:bg-white/10",
    ghost: "text-gray-600 hover:bg-gray-100/80 dark:text-white/90 dark:hover:bg-white/10",
    settings:
      "text-gray-800 hover:bg-black/5 dark:text-white/90 dark:hover:bg-white/10",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-2 min-h-[44px] min-w-[44px] sm:min-w-0 font-medium text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 ${variants[variant] || variants.default} ${className}`}
    >
      <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={2.25} />
      {showLabel && (
        <span className="hidden sm:inline truncate max-w-[120px]">{label}</span>
      )}
    </button>
  );
}
