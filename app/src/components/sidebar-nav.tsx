"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-4 my-12 mx-8")} {...props}>
      {items.map((item) => (
        <Button
          className="justify-start text-lg"
          variant={"ghost"}
          key={item.href}
          asChild
        >
          <Link
            href={item.href}
            className={cn(
              pathname === item.href ? "bg-muted" : "hover:bg-muted/50"
            )}
          >
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
