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
    >
      {paraClaro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
