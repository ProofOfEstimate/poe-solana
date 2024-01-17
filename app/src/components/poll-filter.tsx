"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface PollFilterProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function PollFilter({ className, items, ...props }: PollFilterProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex overflow-scroll", className)} {...props}>
      {items.map((item) => (
        <Button
          className="justify-start"
          variant={"ghost"}
          key={item.href}
          asChild
        >
          <Link
            href={item.href}
            className={cn(
              pathname === item.href
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline"
            )}
          >
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
