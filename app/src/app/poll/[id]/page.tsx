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
import { Flex, Text } from "@radix-ui/themes";
import { useEstimateUpdatesByPoll } from "@/hooks/queries/useEstimateUpdatesByPoll";
import { useWallet } from "@solana/wallet-adapter-react";

export default function PollDetails({ params }: { params: { id: string } }) {
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
    <main className="flex flex-col min-h-screen items-center justify-start p-4 sm:p-24 gap-12">
      {isLoadingPoll ? (
        <Skeleton className="w-full sm:w-2/3 lg:w-1/2 h-10 rounded-md" />
      ) : (
        <Text size={"7"} className="font-bold">
          {poll?.question}
        </Text>
      )}
      {isLoadingPoll ? (
        <Flex direction={"column"} gap={"1"} width={"100%"}>
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-1/3 h-4 rounded-md" />
        </Flex>
      ) : (
        <Text size={"2"}>{poll?.description}</Text>
      )}
      <div className="font-bold text-xl">Collective Estimate</div>
      <div className="h-96 w-full">
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
    </main>
  );
}
