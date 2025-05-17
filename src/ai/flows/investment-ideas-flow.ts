
'use server';
/**
 * @fileOverview Generates hypothetical investment ideas using AI.
 * FOR ILLUSTRATIVE AND EDUCATIONAL PURPOSES ONLY. NOT FINANCIAL ADVICE.
 *
 * - generateInvestmentIdeas - A function that generates hypothetical investment ideas.
 * - InvestmentIdeasInput - The input type for the generateInvestmentIdeas function.
 * - InvestmentIdeasOutput - The return type for the generateInvestmentIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentIdeasInputSchema = z.object({
  riskProfile: z.enum(["Conservative", "Moderate", "Aggressive"]).describe("The user's general risk tolerance for investments."),
  investmentHorizon: z.enum(["Short-term", "Medium-term", "Long-term"]).describe("The user's general investment time horizon."),
  areasOfInterest: z.array(z.string()).describe("A list of sectors or themes the user is interested in (e.g., Technology, Renewable Energy, Healthcare)."),
  // We can add more fields here in the future, like amount to invest (for mock scaling of ideas)
});
export type InvestmentIdeasInput = z.infer<typeof InvestmentIdeasInputSchema>;

const InvestmentIdeaSchema = z.object({
  ideaName: z.string().describe("A concise name for the hypothetical investment idea (e.g., 'Diversified Tech ETF', 'High-Growth Solar Energy Stock Basket')."),
  rationale: z.string().describe("A brief, hypothetical rationale explaining why this might be an interesting area to explore, based on mock trends or general knowledge. THIS IS NOT A PREDICTION OR GUARANTEE."),
  mockPotential: z.string().describe("A purely illustrative statement about potential (e.g., 'Could see growth if sector performs well', 'Offers exposure to emerging markets'). THIS IS NOT FINANCIAL ADVICE."),
  thingsToConsider: z.string().describe("General hypothetical points to consider or research further, not specific advice (e.g., 'Research specific companies in this sector', 'Understand the risks associated with this asset class').")
});

const InvestmentIdeasOutputSchema = z.object({
  disclaimer: z.string().describe("A mandatory disclaimer stating this is not financial advice."),
  ideas: z.array(InvestmentIdeaSchema).describe("A list of 2-3 hypothetical investment ideas."),
});
export type InvestmentIdeasOutput = z.infer<typeof InvestmentIdeasOutputSchema>;

const generateIdeasPrompt = ai.definePrompt({
  name: 'generateInvestmentIdeasPrompt',
  input: {schema: InvestmentIdeasInputSchema},
  output: {schema: InvestmentIdeasOutputSchema},
  prompt: `You are an AI assistant providing HYPOTHETICAL investment ideas for EDUCATIONAL AND ILLUSTRATIVE PURPOSES ONLY.
You MUST NOT provide actual financial advice, predictions, or guarantees.
Your output will be used in a simulated environment.

User's (mock) profile:
- Risk Tolerance: {{{riskProfile}}}
- Investment Horizon: {{{investmentHorizon}}}
- Areas of Interest: {{#each areasOfInterest}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on this mock profile, generate 2-3 DIVERSE AND HYPOTHETICAL investment ideas. For each idea, provide:
1.  ideaName: A concise name for the idea.
2.  rationale: A brief, general, and HYPOTHETICAL rationale. You can mention common knowledge or mock trends. DO NOT MAKE PREDICTIONS.
3.  mockPotential: An ILLUSTRATIVE statement about what makes this type of investment potentially interesting in a general sense. DO NOT MAKE PREDICTIONS OR GUARANTEES.
4.  thingsToConsider: General hypothetical points for further research. DO NOT GIVE SPECIFIC ADVICE.

VERY IMPORTANT: Your first output field MUST be 'disclaimer' and it must contain the text: "The following are hypothetical investment ideas for illustrative and educational purposes only. This is NOT financial advice. Consult with a qualified financial advisor before making any investment decisions."

Example idea structure:
{
  "ideaName": "Mock Emerging Markets Fund",
  "rationale": "Hypothetically, emerging markets can offer growth opportunities as their economies develop, though they also come with higher volatility.",
  "mockPotential": "Purely for illustration, this could provide exposure to different economic growth cycles.",
  "thingsToConsider": "For educational purposes, one might research the political and economic stability of regions, currency risks, and specific fund objectives if this were a real investment."
}

Generate the ideas now.
`,
});

export async function generateInvestmentIdeas(input: InvestmentIdeasInput): Promise<InvestmentIdeasOutput> {
  return investmentIdeasFlow(input);
}

const investmentIdeasFlow = ai.defineFlow(
  {
    name: 'investmentIdeasFlow',
    inputSchema: InvestmentIdeasInputSchema,
    outputSchema: InvestmentIdeasOutputSchema,
  },
  async (input) => {
    const {output} = await generateIdeasPrompt(input);
    // Ensure disclaimer is always present, even if AI somehow misses it (though schema should enforce)
    return output || { disclaimer: "Error: Could not generate ideas. Remember, this tool is for illustrative purposes only and does not provide financial advice.", ideas: [] };
  }
);
