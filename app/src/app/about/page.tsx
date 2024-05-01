import { Heading, Text } from "@radix-ui/themes";

export default function About() {
  return (
    <main className="flex min-h-screen flex-col justify-start px-4 sm:px-24 lg:px-48 py-24">
      <Heading size={{ initial: "7", sm: "8", md: "9" }}>
        Individually, we are one drop. Together, we are an ocean.
      </Heading>
      <Text>– Ryunosuke Satoro</Text>

      <div className="mt-8 text-lg sm:text-xl">
        <span className="text-primary">POE</span> is a prediction poll that
        leverages the <span className="text-primary">collective wisdom</span> of
        its users to make predictions about future events. It aims to be{" "}
        <span className="text-primary">collaborative</span> rather than
        competitive, encouraging users to share their insights and reasoning
        behind their predictions.{" "}
      </div>
      <div className="mt-8 text-lg sm:text-xl">
        Your prediction is weighted by your{" "}
        <span className="text-primary">score and your certainty</span>. You
        maximize your expected score if you predict the true probability, i.e.
        if you predict the probability of a fair coin flip you would maximize
        your expected score by predicting 50%.
      </div>
    </main>
  );
}
