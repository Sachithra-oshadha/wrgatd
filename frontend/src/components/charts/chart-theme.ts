export const chartTheme = {
  brand: "#1E90FF",
  grid: "#E2E8F0",
  axis: "#666666",
  text: "#333333",

  status: {
    APPROVED: "#2E865F",
    SUBMITTED: "#1E90FF",
    NEEDS_CORRECTION: "#D97706",
    DRAFT: "#666666",
    NOT_STARTED: "#94A3B8",
    LATE: "#D63939",
  },

  /** Validated categorical order. Assign in sequence, never cycle. */
  categorical: [
    "#2a78d6",
    "#eb6834",
    "#1baf7a",
    "#eda100",
    "#e87ba4",
    "#008300",
  ],
} as const;


export const axisProps = {
  stroke: chartTheme.axis,
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;


export const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #E2E8F0",
    backgroundColor: "#FFFFFF",
    fontSize: 12,
    color: chartTheme.text,
  },
  cursor: { fill: "rgba(30, 144, 255, 0.06)" },
} as const;
