type EstimateProps = {
  estimate: number;
};

const EstimateBar = ({ estimate }: EstimateProps) => {
  const width = 0.6 * estimate + 17;
  return (
    <div className="flex justify-between items-center gap-4 py-4">
      <div
        className="bg-primary text-primary-foreground font-bold rounded-md px-2 py-1 whitespace-nowrap"
        style={{ width: `${width}%` }}
      >
        Yes
      </div>
      <div>{estimate.toFixed()}%</div>
    </div>
  );
};

export default EstimateBar;
