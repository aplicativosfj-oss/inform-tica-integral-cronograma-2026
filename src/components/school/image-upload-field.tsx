import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { fileToCompressedDataUrl } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value?: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
  shape?: "circle" | "square";
  size?: number;
  maxSize?: number;
}

export function ImageUploadField({
  value,
  onChange,
  shape = "circle",
  size = 96,
  maxSize = 480,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-border bg-muted text-muted-foreground",
          shape === "circle" ? "rounded-full" : "rounded-lg",
        )}
        style={{ width: size, height: size }}
      >
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setIsLoading(true);
            try {
              const dataUrl = await fileToCompressedDataUrl(file, maxSize);
              onChange(dataUrl);
            } finally {
              setIsLoading(false);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
        >
          {isLoading ? "Enviando..." : value ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange(undefined)}
          >
            <X /> Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
