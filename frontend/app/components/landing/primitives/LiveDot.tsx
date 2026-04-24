interface LiveDotProps {
  size?: number;
  className?: string;
}

export function LiveDot({ size = 7, className = "" }: LiveDotProps) {
  return (
    <span
      className={`inline-block rounded-full bg-red animate-[pulseDot_1.6s_infinite] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
