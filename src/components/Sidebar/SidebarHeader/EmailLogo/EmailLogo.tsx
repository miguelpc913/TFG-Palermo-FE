type EmailLogoProps = {
  email: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const EMAIL_COLORS = [
  "from-pink-400 to-rose-400",
  "from-sky-400 to-cyan-400",
  "from-emerald-400 to-teal-400",
  "from-violet-400 to-fuchsia-400",
  "from-amber-400 to-orange-400",
  "from-lime-400 to-emerald-400",
];

const sizeMap: Record<NonNullable<EmailLogoProps["size"]>, string> = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-14 h-14 text-xl",
};

function getFirstChar(email: string): string {
  if (!email) return "?";
  const trimmed = email.trim();
  const first = trimmed[0] || "?";
  return first.toUpperCase();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function EmailLogo({ email, size = "md", className = "" }: EmailLogoProps) {
  const letter = getFirstChar(email);
  const hash = hashString(email || "default");
  const colorIndex = hash % EMAIL_COLORS.length;
  const gradient = EMAIL_COLORS[colorIndex];
  const sizeClasses = sizeMap[size];

  return (
    <div
      className={`
		  inline-flex items-center justify-center
		  rounded-full
		  bg-gradient-to-br ${gradient}
		  text-white font-semibold
		  shadow-md shadow-black/10
		  ring-2 ring-white/70
		  overflow-hidden
		  relative
		  ${sizeClasses}
		  ${className}
		`}
      aria-label={`Avatar for ${email}`}
    >
      <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{letter}</span>

      {/* tiny sparkle for cuteness ✨ */}
      <span className="pointer-events-none absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/80" />
    </div>
  );
}
