"use client";

import Link from "next/link";
import Image from "next/image";
import UserNav from "./user-nav";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";
import { DarkModeToggle } from "./dark-mode-toggle";

require("@solana/wallet-adapter-react-ui/styles.css");

const NavBar = () => {
  return (
    <header>
      <div className="border-b px-4">
        <div className="flex h-16 items-center gap-8">
          {/* Keep it as comment because I think it will be used soon */}
          {/* <MainNav /> */}
          <MobileNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
};

export default NavBar;
