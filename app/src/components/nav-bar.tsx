"use client";

import Link from "next/link";
import Image from "next/image";
import UserNav from "./user-nav";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

require("@solana/wallet-adapter-react-ui/styles.css");

const NavBar = () => {
  return (
    <header>
      <div className="border-b px-4">
        <div className="flex h-16 items-center gap-8">
          <div className="hidden md:flex md:items-center md:gap-12">
            <Link className="flex items-center" href="/">
              <span className="sr-only">Home</span>
              <Image
                src="/logo_poe.png"
                alt="Logo"
                className="md:block dark:invert"
                width={40}
                height={40}
                priority
              />
              <div className="text-xl">POE</div>
            </Link>
          </div>
          <MainNav />
          <MobileNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
          <div>tsf</div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
