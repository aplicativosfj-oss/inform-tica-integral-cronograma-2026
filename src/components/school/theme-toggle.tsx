import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme-store";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const paraClaro = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={paraClaro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={paraClaro ? "Modo claro" : "Modo escuro"}
      suppressHydrationWarning
      className="size-10 hover:bg-amber-400/20 dark:hover:bg-amber-300/20 hover:scale-110 dark:hover:text-amber-300 hover:text-amber-600 transition-all duration-300 [&_svg]:size-5"
    >
      {paraClaro ? <Sun /> : <Moon />}
    </Button>
  );
}
