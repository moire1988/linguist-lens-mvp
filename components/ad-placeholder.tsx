import { cn } from "@/lib/utils";

interface AdPlaceholderProps {
  slot?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AdPlaceholder({
  slot: _slot = "バナー",
  className: _className,
  size: _size = "md",
}: AdPlaceholderProps) {
  // TODO: AdSense 準備完了後に広告コードを実装する
  return null;
}
