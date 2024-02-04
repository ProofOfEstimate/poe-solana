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
  Brush,
} from "recharts";

import React, { useEffect, useState } from "react";
import { usePollById } from "@/hooks/queries/usePollById";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { Skeleton } from "@/components/ui/skeleton";
import { Flex, Heading, Text } from "@radix-ui/themes";
import { useEstimateUpdatesByPoll } from "@/hooks/queries/useEstimateUpdatesByPoll";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { categoryOptions } from "@/types/options";
import { EstimateSlider } from "@/components/estimate-slider";
import { useUserEstimateByPoll } from "@/hooks/queries/useUserEstimateByPoll";
import { TbLoader2 } from "react-icons/tb";
import { useMakeEstimate } from "@/hooks/mutations/useMakeEstimate";
import { useUpdateEstimate } from "@/hooks/mutations/useUpdateEstimate";

export default function PollDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const program = useAnchorProgram();
  const { connection } = useConnection();
  const wallet = useWallet();

  const pollId = Number.parseInt(params.id);

  const { data: poll, isLoading: isLoadingPoll } = usePollById(program, pollId);

  const { data: estimateUpdates } = useEstimateUpdatesByPoll(
    program,
    pollId,
    wallet.publicKey
  );

  const {
    data: userEstimate,
    isError: isErrorEstimate,
    error: errorEstimate,
    isLoading: isLoadingEstimate,
  } = useUserEstimateByPoll(program, connection, wallet.publicKey, pollId);

  console.log("User estimate", isLoadingEstimate);

  const { mutate: submitEstimate, isPending: isSubmitting } = useMakeEstimate(
    program,
    connection,
    wallet
  );
  const { mutate: updateEstimate, isPending: isUpdating } = useUpdateEstimate(
    program,
    connection,
    wallet
  );

  const [lowerEstimate, setLowerEstimate] = useState(
    userEstimate?.lowerEstimate
  );
  const [upperEstimate, setUpperEstimate] = useState(
    userEstimate?.upperEstimate
  );

  const handleChange = (
    lower: number | undefined,
    upper: number | undefined
  ) => {
    setLowerEstimate(lower);
    setUpperEstimate(upper);
  };

  const [brushStartIndex, setBrushStartIndex] = useState<number>();
  const [brushEndIndex, setBrushEndIndex] = useState<number>();

  const handleBrushChange = ({
    startIndex,
    endIndex,
  }: {
    startIndex?: number;
    endIndex?: number;
  }) => {
    setBrushStartIndex(startIndex);
    setBrushEndIndex(endIndex);
  };

  useEffect(() => {
    if (userEstimate !== null && userEstimate !== undefined) {
      setLowerEstimate(userEstimate.lowerEstimate);
      setUpperEstimate(userEstimate.upperEstimate);
    }
  }, [userEstimate]);

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
        <Flex gap={"4"} align={"center"} wrap={"wrap"}>
          <Heading
            className="my-4"
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
          {poll &&
            (poll.result === true ? (
              <Badge variant={"secondary"} className="h-fit">
                Resolved to Yes
              </Badge>
            ) : poll.result === false ? (
              <Badge variant={"destructive"} className="h-fit">
                Resolved to No
              </Badge>
            ) : (
              <Badge variant={"outline"} className="h-fit">
                Active
              </Badge>
            ))}
        </Flex>
      )}
      <Flex gap={"8"} align={"center"}>
        <Flex direction={"column"} my={"4"}>
          <Text size={"5"}>Crowd</Text>
          {poll?.collectiveEstimate && (
            <Text size={"4"} className="text-primary">
              {(poll.collectiveEstimate / 10000).toFixed(2)} %
            </Text>
          )}
        </Flex>
        <Flex direction={"column"} my={"4"}>
          <Text size={"5"}>You</Text>
          {isLoadingEstimate ? (
            <Skeleton className="w-14 h-5 rounded-md" />
          ) : (
            <Text size={"4"} className="text-primary">
              {lowerEstimate !== undefined && upperEstimate !== undefined
                ? ((lowerEstimate + upperEstimate) / 2).toString() + " %"
                : "-"}
            </Text>
          )}
        </Flex>
        {poll && (
          <div>
            <div>
              {poll.numForecasters.toString()} participant
              {poll.numForecasters.toNumber() > 1 ? "s" : ""}
            </div>
            <div>
              {poll.numEstimateUpdates.toString()} estimate
              {poll.numEstimateUpdates.toNumber() > 1 ? "s" : ""}
            </div>
          </div>
        )}
      </Flex>
      <div className="flex sm:flex-row flex-col gap-4 w-full my-8">
        {poll && poll.result === null && (
          <div className="flex flex-col gap-4 items-stretch justify-stretch my-4">
            <EstimateSlider
              className="w-full"
              min={0}
              max={100}
              oldLowerEstimate={userEstimate?.lowerEstimate}
              oldUpperEstimate={userEstimate?.upperEstimate}
              onSliderChange={handleChange}
            />
            {userEstimate !== undefined && userEstimate !== null ? (
              <Button
                disabled={
                  isUpdating ||
                  (lowerEstimate === userEstimate.lowerEstimate &&
                    upperEstimate === userEstimate.upperEstimate)
                }
                className="w-full"
                onClick={() =>
                  updateEstimate({
                    pollId,
                    lowerEstimate: lowerEstimate,
                    upperEstimate: upperEstimate,
                  })
                }
              >
                {isUpdating && (
                  <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Estimate
              </Button>
            ) : (
              <Button
                disabled={
                  isSubmitting ||
                  lowerEstimate === undefined ||
                  upperEstimate === undefined
                }
                className="w-full"
                onClick={() =>
                  submitEstimate({
                    pollId,
                    lowerEstimate: lowerEstimate,
                    upperEstimate: upperEstimate,
                  })
                }
              >
                {isSubmitting && (
                  <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Estimate
              </Button>
            )}
          </div>
        )}
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
                hide={wallet.publicKey === null}
              />
              <Line
                dot={false}
                type="linear"
                dataKey="userEstimate"
                isAnimationActive={false}
                hide={wallet.publicKey === null}
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
              <Brush
                dataKey="name"
                height={30}
                stroke="#8884d8"
                onChange={handleBrushChange}
                startIndex={brushStartIndex}
                endIndex={brushEndIndex}
                tickFormatter={(number) =>
                  new Date(number * 1000).toLocaleString()
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Text size={"5"} weight={"bold"}>
        Description
      </Text>
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
