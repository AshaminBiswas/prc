import React from "react";

export type ProtectedLogoProps = {
  src?: string;
  alt?: string;
  className?: string;
};

export function ProtectedLogo({
  src = "/logo.png",
  alt = "PRC Hardware",
  className = "",
}: ProtectedLogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      onDragStart={(e: React.DragEvent) => e.preventDefault()}
      className={`select-none ${className}`}
    />
  );
}
