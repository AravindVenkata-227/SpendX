'use server';
/**
 * @fileOverview Generates personalized spending insights and determines if they should be sent to the user.
 *
 * - generateSpendingInsight - A function that generates a spending insight.
 * - SpendingInsightInput - The input type for the generateSpendingInsight function.
 * - SpendingInsightOutput - The return type for the generateSpendingInsight function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingInsightInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A string containing spending data, including categories, amounts, and time periods.'
    ),
  userPreferences: z
    .string()
    .describe('A string containing user preferences for receiving notifications.'),
});
export type SpendingInsightInput = z.infer<typeof SpendingInsightInputSchema>;

const SpendingInsightOutputSchema = z.object({
  insight: z.string().describe('The generated spending insight. This should be concise and actionable.'),
  sendNotification: z
    .boolean()
    .describe(
      'Whether a notification should be sent to the user based on the insight and their preferences. Only set to true if the insight is significant and aligns with user preferences (e.g., major overspending, savings opportunities, unusual activity).'
    ),
});
export type SpendingInsightOutput = z.infer<typeof SpendingInsightOutputSchema>;

const generateInsightPrompt = ai.definePrompt({
  name: 'generateInsightPrompt',
  input: {schema: SpendingInsightInputSchema},
  output: {schema: SpendingInsightOutputSchema},
  prompt: `You are an AI financial assistant. Your goal is to analyze the provided spending data and user preferences to generate a personalized, concise, and actionable spending insight.

You must ALWAYS generate an insight.

Carefully consider the user's preferences when deciding if a notification should be sent. Only recommend sending a notification (set 'sendNotification' to true) if the insight is genuinely important for the user's financial well-being, such as highlighting significant overspending, identifying savings opportunities, or flagging unusual activity that matches their notification preferences.

Spending Data:
{{{spendingData}}}

User Preferences:
{{{userPreferences}}}
`,
});

export async function generateSpendingInsight(input: SpendingInsightInput): Promise<SpendingInsightOutput> {
  return spendingInsightsFlow(input);
}

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingInsightInputSchema,
    outputSchema: SpendingInsightOutputSchema,
  },
  async input => {
    const {output} = await generateInsightPrompt(input);
    return output!;
  }
);
