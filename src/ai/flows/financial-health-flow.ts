
'use server';
/**
 * @fileOverview Calculates a financial health score based on user's financial habits.
 *
 * - calculateFinancialHealth - A function that calculates the financial health score.
 * - FinancialHealthInput - The input type for the calculateFinancialHealth function.
 * - FinancialHealthOutput - The return type for the calculateFinancialHealth function.
 */

import {ai} from '@/ai/genkit';
import {z}
from 'genkit';

const FinancialHealthInputSchema = z.object({
  financialSummary: z
    .string()
    .describe(
      'A summary of the user\'s financial habits, including income, spending patterns, savings, and debt.'
    ),
});
export type FinancialHealthInput = z.infer<typeof FinancialHealthInputSchema>;

const FinancialHealthOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('A financial health score between 0 and 100, where 100 is excellent.'),
  explanation: z
    .string()
    .describe('A brief explanation of the score, highlighting key positive or negative factors.'),
});
export type FinancialHealthOutput = z.infer<typeof FinancialHealthOutputSchema>;

const calculateHealthScorePrompt = ai.definePrompt({
  name: 'calculateHealthScorePrompt',
  input: {schema: FinancialHealthInputSchema},
  output: {schema: FinancialHealthOutputSchema},
  prompt: `You are an AI financial advisor. Based on the following summary of financial habits, calculate a financial health score from 0 to 100 (100 being excellent) and provide a concise, one or two-sentence explanation for the score.

Consider factors like income vs. expenses, savings rate, debt levels, and emergency fund status if mentioned. If not enough detail is provided for a robust score, provide a general score based on the information given and mention that more details would refine the score.

Financial Summary:
{{{financialSummary}}}
`,
});

export async function calculateFinancialHealth(input: FinancialHealthInput): Promise<FinancialHealthOutput> {
  return financialHealthFlow(input);
}

const financialHealthFlow = ai.defineFlow(
  {
    name: 'financialHealthFlow',
    inputSchema: FinancialHealthInputSchema,
    outputSchema: FinancialHealthOutputSchema,
  },
  async (input) => {
    const {output} = await calculateHealthScorePrompt(input);
    // Ensure a default score and explanation if the output is somehow null
    // though the schema validation should prevent this.
    return output || { score: 0, explanation: "Could not calculate score due to an unexpected error." };
  }
);
