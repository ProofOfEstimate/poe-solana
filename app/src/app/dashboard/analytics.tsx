import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid } from "@radix-ui/themes";
import { FC } from "react";
import {
  LuGraduationCap,
  LuUserCheck,
  LuActivity,
  LuPenLine,
} from "react-icons/lu";

type AnalyticsProps = {
  score: number | undefined;
};

const Analytics: FC<AnalyticsProps> = ({ score }) => {
  return (
    <Grid
      columns={{
        initial: "1",
        sm: "2",
        lg: "4",
      }}
      gap={"3"}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score</CardTitle>
          <LuGraduationCap />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {score !== undefined ? score.toFixed(2) : "Loading..."}
          </div>
          <p className="text-xs text-muted-foreground">Rank: (42)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
          <LuActivity />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">(2)</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolved Polls</CardTitle>
          <LuUserCheck />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">(4)</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Created Polls</CardTitle>
          <LuPenLine />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">(22)</div>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default Analytics;
