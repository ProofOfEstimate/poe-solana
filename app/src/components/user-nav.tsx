"use client";

import { Text } from "@radix-ui/themes";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const UserNav = () => {
  const wallet = useAnchorWallet();
  const { disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-12 w-12 rounded-full">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/avatar.png" alt="@shadcn" />
            <AvatarFallback>Av</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {wallet ? (
          <Link href={"/dashboard"} className="w-full">
            <DropdownMenuItem className="font-normal">
              <div className="flex flex-col space-y-1">
                <Text className="text-sm font-normal leading-none">
                  {wallet.publicKey.toBase58().slice(0, 4) +
                    "..." +
                    wallet.publicKey.toBase58().slice(-4)}
                </Text>
                <Text className="text-xs">Jane Doe</Text>
              </div>
            </DropdownMenuItem>
          </Link>
        ) : (
          <DropdownMenuItem className="font-normal">
            <div
              className="hover:cursor-pointer"
              onClick={() => {
                setVisible(true);
              }}
            >
              Connect wallet
            </div>{" "}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href={"/settings"} className="w-full">
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </Link>
          <Link href={"/about"} className="w-full">
            <DropdownMenuItem>About POE</DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        {wallet && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={disconnect}
              className="hover:cursor-pointer"
            >
              Disconnect
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
