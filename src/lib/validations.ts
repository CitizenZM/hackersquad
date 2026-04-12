import { z } from "zod";

export const competitorSchema = z.object({
  name: z.string().min(1, "Competitor name is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const createProjectSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  brandUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  category: z.string().optional(),
  campaignGoal: z.string().optional(),
  competitors: z.array(competitorSchema).min(1, "Add at least one competitor"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
