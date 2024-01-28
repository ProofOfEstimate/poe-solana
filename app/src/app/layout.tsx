import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import NavBar from "@/components/nav-bar";
import Providers from "./providers";
import { SidebarNav, sidebarNavItems } from "@/components/sidebar-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POE",
  description: "Proof of Estimate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Theme>
            <div className="flex">
              <aside className="hidden md:block md:min-w-60 md:w-1/5 border-r">
                <SidebarNav items={sidebarNavItems} />
              </aside>
              <div className="flex flex-col w-full">
                <NavBar />
                <div>{children}</div>
              </div>
            </div>
          </Theme>
        </Providers>
      </body>
    </html>
  );
}
