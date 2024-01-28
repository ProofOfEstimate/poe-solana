"use client";

import { Flex, Text } from "@radix-ui/themes";
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
import { RiArrowDropDownLine } from "react-icons/ri";
import { TbCopy } from "react-icons/tb";
import { toast } from "./ui/use-toast";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const ConnectWalletButton = () => {
  const wallet = useAnchorWallet();
  const { disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected) {
    return (
      <Button
        onClick={() => {
          setVisible(true);
        }}
      >
        Connect wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          Connected <RiArrowDropDownLine className="text-xl ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="font-normal">
          {wallet && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger>
                  <Flex
                    align={"center"}
                    onClick={() => {
                      navigator.clipboard.writeText(
                        wallet.publicKey?.toBase58() ?? ""
                      );
                      toast({ variant: "default", title: "Copied!" });
                    }}
                  >
                    <Text>
                      {wallet.publicKey.toBase58().slice(0, 4) +
                        "..." +
                        wallet.publicKey.toBase58().slice(-4)}
                    </Text>
                    <TbCopy className="ml-2" />
                  </Flex>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <Text size={"1"}>{wallet.publicKey.toBase58()}</Text>
                  <TooltipArrow />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <div className="border rounded-md py-2 px-1 my-2">
            <Flex direction={"column"} className="mx-2 gap-2 text-sm">
              <Text>Score: 1.0</Text>
              <Text>Active Polls: 10</Text>
              <Text>Resolved Polls: 0</Text>
              <Text>Created Polls: 2</Text>
            </Flex>
          </div>
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

export default ConnectWalletButton;
