import * as React from "react";
import { cn } from "@/lib/utils";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: DivProps) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...props} />
);

export const CardHeader = ({ className, ...props }: DivProps) => (
  <div className={cn("flex flex-col gap-1 p-6 pb-4", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-base font-semibold text-slate-900", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-slate-500", className)} {...props} />
);

export const CardContent = ({ className, ...props }: DivProps) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

export const CardFooter = ({ className, ...props }: DivProps) => (
  <div className={cn("flex items-center gap-2 border-t border-slate-100 px-6 py-4", className)} {...props} />
);
