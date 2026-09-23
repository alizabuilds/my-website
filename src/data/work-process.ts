export type ProductState = "vague" | "defined" | "built" | "refined" | "fit";

export interface WorkStage {
  id: string;
  title: string;
  description: string;
  productState: ProductState;
}

/** Shown before the product box reaches the first station. Not a station. */
export const workProcessIntro: WorkStage = {
  id: "intro",
  title: "Vague idea",
  description:
    "You have a direction, not a spec. We start before the product has a shape.",
  productState: "vague",
};

export const workStages: WorkStage[] = [
  {
    id: "discovery",
    title: "Product Discovery",
    description:
      "We name who it is for, the problem, and the job of the first version.",
    productState: "defined",
  },
  {
    id: "building",
    title: "Building",
    description:
      "I build an MVP people can use now, light enough to change as soon as we learn.",
    productState: "built",
  },
  {
    id: "iteration",
    title: "Iteration",
    description:
      "Real use shows what to keep. We tighten what works and let go of what people skip.",
    productState: "refined",
  },
  {
    id: "fit",
    title: "Product-Market Fit",
    description:
      "People return on their own. The fit is real, and the next question is how to grow.",
    productState: "fit",
  },
];

export function formatStageIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}
