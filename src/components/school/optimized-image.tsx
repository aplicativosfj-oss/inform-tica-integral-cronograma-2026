import { ImgHTMLAttributes } from "react";

/**
 * Optimized image component with WebP/AVIF support and lazy loading.
 * Automatically generates multiple formats and uses picture element for fallback.
 */
export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  formats?: ("webp" | "avif")[];
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  formats = ["webp"],
  className,
  ...props
}: OptimizedImageProps) {
  // Remove file extension from src to add format suffixes
  const srcWithoutExt = src.substring(0, src.lastIndexOf("."));
  const originalExt = src.substring(src.lastIndexOf(".") + 1);

  // For now, use original format as fallback
  // In production, run: npm run optimize-images
  // This generates .webp and .avif versions automatically

  return (
    <picture>
      {/* AVIF format (best compression, ~20% smaller than WebP) */}
      {formats.includes("avif") && (
        <source
          srcSet={`${srcWithoutExt}.avif`}
          type="image/avif"
          media="(min-width: 0px)"
        />
      )}

      {/* WebP format (30-35% smaller than JPEG) */}
      {formats.includes("webp") && (
        <source
          srcSet={`${srcWithoutExt}.webp`}
          type="image/webp"
          media="(min-width: 0px)"
        />
      )}

      {/* Fallback to original format */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className={className}
        {...props}
      />
    </picture>
  );
}
