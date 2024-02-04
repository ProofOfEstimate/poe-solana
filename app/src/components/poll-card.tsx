import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";
import useAnchorProgram from "@/hooks/useAnchorProgram";
import { useUserEstimateByPoll } from "@/hooks/queries/useUserEstimateByPoll";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "./ui/skeleton";
import { Flex, Strong, Text } from "@radix-ui/themes";
import { EstimateSlider } from "./estimate-slider";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMakeEstimate } from "@/hooks/mutations/useMakeEstimate";
import { useUpdateEstimate } from "@/hooks/mutations/useUpdateEstimate";
import { usePollById } from "@/hooks/queries/usePollById";
import { useCollectPoints } from "@/hooks/mutations/useCollectPoints";
import { useUserScore } from "@/hooks/queries/useUserScore";
import { TbPlusMinus, TbLoader2 } from "react-icons/tb";
import { RiArrowRightDoubleLine } from "react-icons/ri";

type PollCardInput = {
  pollId: number;
  question: string;
};

type PollCardProps = PollCardInput & React.ComponentProps<typeof Card>;

export function PollCard({
  pollId,
  question,
  className,
  ...props
}: PollCardProps) {
  const program = useAnchorProgram();
  const { connection } = useConnection();
  const wallet = useWallet();
  const {
    data: userEstimate,
    isError: isErrorEstimate,
    error: errorEstimate,
    isLoading: isLoadingEstimate,
  } = useUserEstimateByPoll(program, connection, wallet.publicKey, pollId);

  const {
    data: poll,
    isLoading: isLoadingPoll,
    isError: isErrorPoll,
    error: errorPoll,
  } = usePollById(program, pollId);

  const { data: userScore, isLoading: isLoadingScore } = useUserScore(
    program,
    connection,
    wallet.publicKey,
    pollId
  );

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
  const { mutate: collectPoints, isPending: isCollecting } = useCollectPoints(
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

  useEffect(() => {
    if (userEstimate !== null && userEstimate !== undefined) {
      setLowerEstimate(userEstimate.lowerEstimate);
      setUpperEstimate(userEstimate.upperEstimate);
    }
  }, [userEstimate]);

  const handleChange = (
    lower: number | undefined,
    upper: number | undefined
  ) => {
    setLowerEstimate(lower);
    setUpperEstimate(upper);
  };

  if (isErrorEstimate) {
    return (
      <div>
        {errorEstimate.name} : {errorEstimate.message}
      </div>
    );
  }

  return (
    <Card className={cn("w-[320px]", className)} {...props}>
      <CardHeader>
        <CardTitle
          className={cn(
            "h-12 leading-tight text-md sm:text-md",
            poll && poll.question.length < 60 ? "sm:text-lg" : ""
          )}
        >
          {question}
        </CardTitle>
      </CardHeader>

      <CardContent className="grid">
        <Separator color="primary" />

        <Flex mt={"4"} gap={"2"}>
          <Text className="text-sm font-medium">Collective Estimate:</Text>
          {isLoadingPoll ? (
            <Skeleton className="w-14 h-5 rounded-md" />
          ) : (
            <Text className="text-sm font-medium">
              {isErrorPoll ? (
                errorPoll.name
              ) : poll !== undefined ? (
                poll.collectiveEstimate !== null && poll.variance !== null ? (
                  <span className="flex items-center gap-1">
                    {(poll.collectiveEstimate / 10000).toFixed(2)}
                    <TbPlusMinus />
                    {/* divide variance by two so sqrt equals confidence interval */}
                    {Math.sqrt(poll.variance / 2).toFixed(2)} %
                  </span>
                ) : (
                  "-"
                )
              ) : (
                "-"
              )}
            </Text>
          )}
        </Flex>
        <Flex gap={"2"}>
          <Text className="text-sm text-muted-foreground"># Forecasters:</Text>
          {isLoadingPoll ? (
            <Skeleton className="w-8 h-5 rounded-md" />
          ) : (
            <Text className="text-sm text-muted-foreground">
              {poll?.numForecasters.toString()}
            </Text>
          )}
        </Flex>
        <Flex mt={"4"} gap={"2"} align={"center"}>
          <Text className="text-sm">Your Estimate:</Text>
          {isLoadingEstimate ? (
            <Skeleton className="w-14 h-5 rounded-md" />
          ) : (
            <>
              <Text className="text-sm">
                {lowerEstimate !== undefined && upperEstimate !== undefined
                  ? ((lowerEstimate + upperEstimate) / 2).toString() + " %"
                  : "-"}
              </Text>
              {lowerEstimate !== undefined &&
              upperEstimate !== undefined &&
              lowerEstimate < upperEstimate ? (
                <span className="flex items-center gap-1 text-xs text-gray-700">
                  <TbPlusMinus />
                  {(upperEstimate - lowerEstimate) / 2} %
                </span>
              ) : (
                <></>
              )}
            </>
          )}
        </Flex>

        <EstimateSlider
          min={0}
          max={100}
          oldLowerEstimate={userEstimate?.lowerEstimate}
          oldUpperEstimate={userEstimate?.upperEstimate}
          onSliderChange={handleChange}
          disabled={poll?.result !== null}
        />
      </CardContent>
      <CardFooter className="justify-between">
        {isLoadingPoll ? (
          <Skeleton className="w-3/5 h-9 rounded-md" />
        ) : poll?.result !== null ? (
          userScore === null || userScore === undefined || isLoadingScore ? (
            <Text>
              Resolved to{" "}
              {poll !== undefined ? (
                poll.result ? (
                  <Strong className="text-primary">Yes</Strong>
                ) : (
                  <Strong className="text-primary">No</Strong>
                )
              ) : (
                ""
              )}
            </Text>
          ) : (
            <Button
              disabled={isCollecting}
              className="w-3/5"
              onClick={() => collectPoints({ pollId })}
            >
              {isCollecting && (
                <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Collect Points
            </Button>
          )
        ) : userEstimate !== undefined && userEstimate !== null ? (
          <Button
            disabled={
              isUpdating ||
              (lowerEstimate === userEstimate.lowerEstimate &&
                upperEstimate === userEstimate.upperEstimate)
            }
            className="w-3/5"
            onClick={() =>
              updateEstimate({
                pollId,
                lowerEstimate: lowerEstimate,
                upperEstimate: upperEstimate,
              })
            }
          >
            {isUpdating && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Estimate
          </Button>
        ) : (
          <Button
            disabled={
              isSubmitting ||
              lowerEstimate === undefined ||
              upperEstimate === undefined
            }
            className="w-3/5"
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
        <Button size={"sm"} variant={"ghost"} asChild>
          <Link className="text-xs" href={"/poll/" + pollId}>
            <RiArrowRightDoubleLine className="mr-2" /> Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
