export interface WorkStage {
  id: string;
  title: string;
  description: string;
}

/** Shown before the product box reaches the first station. Not a station. */
export const workProcessIntro: WorkStage = {
  id: "intro",
  title: "Vague idea",
  description: "Placeholder. The idea has not entered the line yet.",
};

export const workStages: WorkStage[] = [
  {
    id: "discovery",
    title: "Product Discovery",
    description: "Placeholder description for product discovery.",
  },
  {
    id: "building",
    title: "Building",
    description: "Placeholder description for building.",
  },
  {
    id: "iteration",
    title: "Iteration",
    description: "Placeholder description for iteration.",
  },
  {
    id: "fit",
    title: "Product-Market Fit",
    description: "Placeholder description for product-market fit.",
  },
];

export function formatStageIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}
