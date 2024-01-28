"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { AiOutlineHome } from "react-icons/ai";
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { MdCreate } from "react-icons/md";

export const sidebarNavItems = [
  {
    title: "Home",
    href: "/",
    icon: <AiOutlineHome />,
  },
  {
    title: "My Polls",
    href: "/my-polls",
    icon: <HiMiniSquare3Stack3D />,
  },
  {
    title: "Create Polls",
    href: "/create-poll",
    icon: <MdCreate />,
  },
];

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: JSX.Element;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <h2 className="text-3xl p-8 mb-12">POE</h2>
      <nav className={cn("flex flex-col gap-6")} {...props}>
        {items.map((item) => (
          <Button
            variant={"ghost"}
            key={item.href}
            className="flex justify-start text-xl pl-8"
            asChild
          >
            <div
              className={cn(
                pathname === item.href ? "bg-muted" : "hover:bg-muted/50",
                "flex gap-4"
              )}
            >
              {item.icon}
              <Link href={item.href} className="justify-self-start">
                {item.title}
              </Link>
            </div>
          </Button>
        ))}
      </nav>
    </>
  );
}
