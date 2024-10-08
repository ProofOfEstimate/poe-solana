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
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
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
import { useAllPolls } from "@/hooks/queries/useAllPolls";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { useAllPollsByUser } from "@/hooks/queries/useAllPollsByUser";
import { Skeleton } from "./ui/skeleton";
import { useUserAccount } from "@/hooks/queries/useUserAccount";

const ConnectWalletButton = () => {
  const wallet = useAnchorWallet();
  const { disconnect, connected, publicKey } = useWallet();
  const program = useAnchorProgram();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const { data: userScore, isLoading: isScoreLoading } = useUserAccount(
    program,
    connection,
    publicKey
  );

  const { data: userPolls } = useAllPollsByUser(program, publicKey);
  const { data: allPolls } = useAllPolls(program);
  const createdPolls =
    allPolls !== undefined
      ? allPolls.filter(
          (poll) => poll.creator.toBase58() === publicKey?.toBase58()
        )
      : [];

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
              <Text className="flex items-center gap-2">
                Score:{" "}
                {!isScoreLoading ? (
                  userScore ? (
                    userScore.score.toFixed(2)
                  ) : (
                    0.0
                  )
                ) : (
                  <Skeleton className="w-6 h-4 rounded-md" />
                )}
              </Text>
              <Text className="flex items-center gap-2">
                Active Polls:{" "}
                {userPolls ? (
                  userPolls.filter((poll) => poll.result === null).length
                ) : (
                  <Skeleton className="w-6 h-4 rounded-md" />
                )}
              </Text>
              <Text className="flex items-center gap-2">
                Resolved Polls:{" "}
                {userPolls ? (
                  userPolls.filter((poll) => poll.result !== null).length
                ) : (
                  <Skeleton className="w-6 h-4 rounded-md" />
                )}
              </Text>
              <Text>Created Polls: {createdPolls.length}</Text>
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
