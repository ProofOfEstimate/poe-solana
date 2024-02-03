"use client";

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

import React from "react";
import { usePollById } from "@/hooks/queries/usePollById";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { Skeleton } from "@/components/ui/skeleton";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { useEstimateUpdatesByPoll } from "@/hooks/queries/useEstimateUpdatesByPoll";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { categoryOptions } from "@/types/options";

export default function PollDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const program = useAnchorProgram();
  const { publicKey } = useWallet();

  const { data: poll, isLoading: isLoadingPoll } = usePollById(
    program,
    Number.parseInt(params.id)
  );

  const { data: estimateUpdates } = useEstimateUpdatesByPoll(
    program,
    Number.parseInt(params.id),
    publicKey
  );

  return (
    <main className="flex min-h-screen flex-col justify-start items-start px-4 sm:px-12 lg:px-16 py-4 sm:py-8">
      <Button
        onClick={() => router.back()}
        variant={"ghost"}
        className="p-0 hover:bg-transparent"
      >
        <FaArrowLeftLong />
      </Button>

      {isLoadingPoll ? (
        <Skeleton className="w-full sm:w-2/3 lg:w-1/2 h-10 rounded-md" />
      ) : (
        <Flex gap={"8"} align={"center"} wrap={"wrap"}>
          <Heading
            className="py-4"
            as="h1"
            size={{
              initial: "5",
              xs: "7",
              xl: "8",
            }}
          >
            {poll?.question}
          </Heading>
          {poll && (
            <Badge variant={"default"} className="h-fit">
              {categoryOptions[poll.category].label}
            </Badge>
          )}
        </Flex>
      )}
      <Flex direction={"column"} my={"4"}>
        <Text size={"5"}>Yes</Text>
        {poll?.collectiveEstimate && (
          <Text size={"4"} className="text-primary">
            {poll.collectiveEstimate / 10000} % Chance
          </Text>
        )}
      </Flex>
      <div className="h-96 w-full border rounded-lg p-8">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={estimateUpdates}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              type="number"
              domain={[]}
              tickFormatter={(number) =>
                new Date(number * 1000).toLocaleString()
              }
              tickCount={10}
            />
            <YAxis />
            <Tooltip
              formatter={(value, name, prop) => {
                switch (name) {
                  case "confidenceInterval":
                    prop.color = "hsl(0 0% 100%)";

                    return [undefined, undefined];
                  case "estimate":
                    const interval =
                      prop.payload.confidenceInterval[1] -
                      prop.payload.confidenceInterval[0];
                    return [
                      Number(value).toFixed(2) +
                        "%  ± " +
                        (interval / 2).toFixed(1) +
                        "%",
                      "Collective Estimate",
                    ];
                  case "userEstimate":
                    const userInterval =
                      prop.payload.userInterval[1] -
                      prop.payload.userInterval[0];
                    return [
                      Number(value).toFixed(2) +
                        "%  ± " +
                        (userInterval / 2).toFixed(1) +
                        "%",
                      "Your Estimate",
                    ];

                  default:
                    return [undefined, undefined];
                }
              }}
              labelFormatter={(label) =>
                new Date(label * 1000).toLocaleString()
              }
            />

            <Area
              type="monotone"
              dataKey="userInterval"
              opacity={0.4}
              stroke="#ffffff00"
              activeDot={false}
              isAnimationActive={false}
              hide={publicKey === null}
            />
            <Line
              dot={false}
              type="linear"
              dataKey="userEstimate"
              isAnimationActive={false}
              hide={publicKey === null}
            />

            <Area
              type="monotone"
              dataKey="confidenceInterval"
              fill="hsl(var(--primary))"
              opacity={0.2}
              stroke="#ffffff00"
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dot={false}
              type="linear"
              dataKey="estimate"
              stroke="hsl(var(--primary))"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {isLoadingPoll ? (
        <Flex direction={"column"} gap={"1"} width={"100%"}>
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-1/3 h-4 rounded-md" />
        </Flex>
      ) : (
        <Text size={"2"}>{poll?.description}</Text>
      )}
    </main>
  );
}
