import React from "react";

export function ProgressBar() {
  const yesWidth = "80%";
  const noWidth = "20%";

  return (
    <>
      <br />
      <div style={{ width: "100%" }}>
        <div
          className="h-8 bg-pink-600 text-base font-medium text-blue-100 text-center p-1 leading-none rounded-full"
          style={{
            width: yesWidth,
            textAlign: "left",
            borderRadius: "5px",
            paddingTop: "10px",
            float: "left",
          }}
        >
          Yes
        </div>
        <p style={{ textAlign: "right", marginTop: "5px", float: "right" }}>
          60%
        </p>
      </div>
      <br />
      <div style={{ width: "100%" }}>
        <div
          className="h-8 bg-pink-600 text-base font-medium text-blue-100 text-center p-1 leading-none rounded-full"
          style={{
            width: noWidth,
            textAlign: "left",
            borderRadius: "5px",
            paddingTop: "10px",
            float: "left",
          }}
        >
          No
        </div>
        <p style={{ textAlign: "right", marginTop: "5px", float: "right" }}>
          40%
        </p>
      </div>
      <p
        className="text-sm text-muted-foreground"
        style={{ textAlign: "left", marginTop: "5px", float: "left" }}
      >
        5 participants, 56 estimate
      </p>
    </>
  );
}
