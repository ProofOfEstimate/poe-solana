"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Flex } from "@radix-ui/themes";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

type SliderRange = [number] | [number, number, number];

type SliderInputProps = {
  oldLowerEstimate: number | undefined;
  oldUpperEstimate: number | undefined;
  onSliderChange: (
    lower: number | undefined,
    upper: number | undefined
  ) => void;
};

const EstimateSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & SliderInputProps
>(
  (
    { oldLowerEstimate, oldUpperEstimate, onSliderChange, className, ...props },
    ref
  ) => {
    const maxInterval = (estimate: number, length: number) => {
      return (
        Math.round(length / 2) > 100 - estimate ||
        Math.round(length / 2) > estimate
      );
    };

    const intervalLength = (estimate: number, length: number) => {
      setIsMaxInterval(maxInterval(estimate, length));
      return Math.min(100 - estimate, estimate, Math.round(length / 2));
    };

    const estimate = (lower: number | undefined, upper: number | undefined) => {
      if (lower !== undefined && upper !== undefined) {
        return (lower + upper) / 2;
      } else {
        return 50;
      }
    };

    const [lowerEstimate, setLowerEstimate] = useState(oldLowerEstimate);
    const [upperEstimate, setUpperEstimate] = useState(oldUpperEstimate);
    const [isConfidenceInterval, setIsConfidenceInterval] = useState(
      oldLowerEstimate !== undefined &&
        oldUpperEstimate !== undefined &&
        oldLowerEstimate < oldUpperEstimate
        ? true
        : false
    );
    const [isMaxInterval, setIsMaxInterval] = useState(
      oldLowerEstimate !== undefined && oldUpperEstimate !== undefined
        ? maxInterval(
            estimate(oldLowerEstimate, oldUpperEstimate),
            oldUpperEstimate - oldLowerEstimate
          )
        : false
    );
    const [confidenceIntervalLength, setConfidenceIntervalLength] = useState(
      oldLowerEstimate !== undefined &&
        oldUpperEstimate !== undefined &&
        oldLowerEstimate < oldUpperEstimate
        ? oldUpperEstimate - oldLowerEstimate
        : 20
    );
    const [isOuterThumb, setIsOuterThumb] = useState(false);

    useEffect(() => {
      if (oldLowerEstimate !== undefined && oldUpperEstimate !== undefined) {
        setIsConfidenceInterval(oldLowerEstimate < oldUpperEstimate);
        setLowerEstimate(oldLowerEstimate);
        setUpperEstimate(oldUpperEstimate);
        setIsMaxInterval(
          maxInterval(
            estimate(oldLowerEstimate, oldUpperEstimate),
            oldUpperEstimate - oldLowerEstimate
          )
        );
        setConfidenceIntervalLength(
          oldLowerEstimate < oldUpperEstimate
            ? oldUpperEstimate - oldLowerEstimate
            : 20
        );
      }
    }, [oldLowerEstimate, oldUpperEstimate]);

    return (
      <Flex direction={"column"} gap={"4"}>
        <Flex gap={"2"} width={"100%"}>
          <SliderPrimitive.Root
            step={isMaxInterval && isOuterThumb ? 2 : 1}
            value={
              isConfidenceInterval
                ? [
                    lowerEstimate!,
                    estimate(lowerEstimate, upperEstimate),
                    upperEstimate!,
                  ]
                : [estimate(lowerEstimate, upperEstimate)]
            }
            onValueChange={(sliderRange: SliderRange) => {
              if (sliderRange.length === 1) {
                setIsOuterThumb(false);
                onSliderChange(sliderRange[0], sliderRange[0]);
                setLowerEstimate(sliderRange[0]);
                setUpperEstimate(sliderRange[0]);
              } else {
                if (sliderRange[1] === estimate(lowerEstimate, upperEstimate)) {
                  setIsOuterThumb(true);
                  const interval = sliderRange[2] - sliderRange[0];

                  setConfidenceIntervalLength(interval);

                  if (isMaxInterval) {
                    setLowerEstimate(sliderRange[0]);
                    setUpperEstimate(sliderRange[2]);
                    onSliderChange(sliderRange[0], sliderRange[2]);
                  } else {
                    setLowerEstimate(
                      estimate(lowerEstimate, upperEstimate) -
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          interval
                        )
                    );
                    setUpperEstimate(
                      estimate(lowerEstimate, upperEstimate) +
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          interval
                        )
                    );
                    onSliderChange(
                      estimate(lowerEstimate, upperEstimate) -
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          interval
                        ),
                      estimate(lowerEstimate, upperEstimate) +
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          interval
                        )
                    );
                  }
                } else {
                  setIsOuterThumb(false);
                  const interval = sliderRange[2] - sliderRange[0];

                  setConfidenceIntervalLength(
                    2 * intervalLength(sliderRange[1], interval)
                  );
                  setLowerEstimate(
                    sliderRange[1] - intervalLength(sliderRange[1], interval)
                  );
                  setUpperEstimate(
                    sliderRange[1] + intervalLength(sliderRange[1], interval)
                  );
                  onSliderChange(
                    sliderRange[1] - intervalLength(sliderRange[1], interval),
                    sliderRange[1] + intervalLength(sliderRange[1], interval)
                  );
                }
              }
            }}
            ref={ref}
            className={cn(
              "relative flex touch-none select-none items-center w-full",
              className
            )}
            {...props}
          >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
              <SliderPrimitive.Range
                className={cn(
                  "absolute h-full",
                  isConfidenceInterval && "bg-primary"
                )}
              />
            </SliderPrimitive.Track>
            {isConfidenceInterval ? (
              <>
                <SliderPrimitive.Thumb className="block h-8 w-[1px] rounded-full bg-primary shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
                <SliderPrimitive.Thumb className="block h-4 w-[1px] bg-primary shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
                <SliderPrimitive.Thumb className="block h-8 w-[1px] rounded-full bg-primary shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
              </>
            ) : (
              <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
            )}
          </SliderPrimitive.Root>
          <Button
            disabled={
              oldLowerEstimate === lowerEstimate &&
              oldUpperEstimate === upperEstimate
            }
            size={"xs"}
            variant={"outline"}
            onClick={() => {
              onSliderChange(oldLowerEstimate, oldUpperEstimate);
              setLowerEstimate(oldLowerEstimate);
              setUpperEstimate(oldUpperEstimate);
              setIsConfidenceInterval(
                oldLowerEstimate !== undefined &&
                  oldUpperEstimate !== undefined &&
                  oldLowerEstimate < oldUpperEstimate
                  ? true
                  : false
              );
            }}
          >
            Reset
          </Button>
        </Flex>
        <div className="flex items-center space-x-2">
          <Switch
            checked={isConfidenceInterval}
            disabled={lowerEstimate === 100 || upperEstimate === 0}
            id="confidence-interval"
            onCheckedChange={(value) => {
              setIsConfidenceInterval(value);
              setConfidenceIntervalLength(
                2 *
                  intervalLength(
                    estimate(lowerEstimate, upperEstimate),
                    confidenceIntervalLength
                  )
              );
              if (value) {
                setLowerEstimate(
                  lowerEstimate !== undefined
                    ? lowerEstimate -
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          confidenceIntervalLength
                        )
                    : 50 - intervalLength(50, confidenceIntervalLength)
                );
                setUpperEstimate(
                  upperEstimate !== undefined
                    ? upperEstimate +
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          confidenceIntervalLength
                        )
                    : 50 + intervalLength(50, confidenceIntervalLength)
                );
                onSliderChange(
                  lowerEstimate !== undefined
                    ? lowerEstimate -
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          confidenceIntervalLength
                        )
                    : 50 - intervalLength(50, confidenceIntervalLength),
                  upperEstimate !== undefined
                    ? upperEstimate +
                        intervalLength(
                          estimate(lowerEstimate, upperEstimate),
                          confidenceIntervalLength
                        )
                    : 50 + intervalLength(50, confidenceIntervalLength)
                );
              } else {
                setLowerEstimate(estimate(lowerEstimate, upperEstimate));
                setUpperEstimate(estimate(lowerEstimate, upperEstimate));
                onSliderChange(
                  estimate(lowerEstimate, upperEstimate),
                  estimate(lowerEstimate, upperEstimate)
                );
              }
            }}
          />
          <Label htmlFor="confidence-interval">Confidence Interval</Label>
        </div>
      </Flex>
    );
  }
);
EstimateSlider.displayName = SliderPrimitive.Root.displayName;

export { EstimateSlider };
