
'use server';
/**
 * @fileOverview Calculates a financial health score and provides improvement tips based on user's financial habits.
 *
 * - calculateFinancialHealth - A function that calculates the financial health score and tips.
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
  improvementTips: z.array(z.string()).describe('A list of 2-3 actionable, general tips to improve financial health based on the score and explanation.'),
});
export type FinancialHealthOutput = z.infer<typeof FinancialHealthOutputSchema>;

const calculateHealthScorePrompt = ai.definePrompt({
  name: 'calculateHealthScorePrompt',
  input: {schema: FinancialHealthInputSchema},
  output: {schema: FinancialHealthOutputSchema},
  prompt: `You are an AI financial advisor. Based on the following summary of financial habits, calculate a financial health score from 0 to 100 (100 being excellent).
Provide:
1. A concise, one or two-sentence 'explanation' for the score.
2. A list of 2-3 actionable and general 'improvementTips' to improve financial health, tailored to the provided summary.

Consider factors like income vs. expenses, savings rate, debt levels, and emergency fund status if mentioned. If not enough detail is provided for a robust score, provide a general score and tips based on the information given and mention that more details would refine the score and advice.

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
    try {
      const {output} = await calculateHealthScorePrompt(input);
      // Ensure a default score, explanation, and tips if the output is somehow null
      return output || { 
        score: 0, 
        explanation: "Could not calculate score due to an unexpected error from the AI.", 
        improvementTips: ["Review spending habits.", "Consider creating a budget."] 
      };
    } catch (error: any) {
      console.error("Error in financialHealthFlow calling calculateHealthScorePrompt:", error);
      let userMessage = "An unexpected error occurred while calculating financial health. Please try again later.";
      if (error.message && (error.message.includes("503") || error.message.toLowerCase().includes("overloaded") || error.message.toLowerCase().includes("service unavailable"))) {
        userMessage = "The AI financial health service is temporarily unavailable or overloaded. Please try again in a few moments.";
      }
      return {
        score: 0, // Default score on error
        explanation: userMessage,
        improvementTips: ["Please try refreshing the financial health score later."]
      };
    }
  }
);
