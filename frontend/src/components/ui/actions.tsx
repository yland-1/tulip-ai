import React from "react";
import { Button } from "@/components/ui/button";

export function Actions({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}

export function Action({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground" onClick={onClick} title={label}>
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  );
}
