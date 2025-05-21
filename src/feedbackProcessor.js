// Import the OpenAI library
import OpenAI from "openai";

// Initialize the OpenAI client for Azure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_ENDPOINT, // e.g., https://YOUR-RESOURCE-NAME.openai.azure.com/
  defaultHeaders: { 'api-key': process.env.OPENAI_API_KEY },
  defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview' }
});

/**
 * Extracts pain points from an array of developer feedback items using OpenAI.
 * @param {Array} feedbackItems - Array of feedback objects (from GitHub, Stack Overflow, etc.)
 * @param {string} [customPrompt] - Optional custom prompt to use instead of the default template.
 * @returns {Promise<Array>} Array of objects with summarized pain points for each feedback item.
 */
export async function extractPainPoints(feedbackItems, customPrompt) {
  // Validate input is an array
  if (!Array.isArray(feedbackItems)) {
    throw new TypeError("❌ extractPainPoints expected an array but got: " + typeof feedbackItems);
  }

  const results = [];

  // Batch size for grouping feedback items
  const batchSize = 5;

  // Process feedback items in batches
  for (let i = 0; i < feedbackItems.length; i += batchSize) {
    const batch = feedbackItems.slice(i, i + batchSize);
    // Example custom prompt for extracting only the most critical technical blocker:
    // /prompt For each developer feedback below, extract only the most critical technical blocker as a single sentence. Ignore any positive comments or general suggestions. Format your answer as:
    // Blocker 1: <sentence>
    // Blocker 2: <sentence>
    // Blocker 3: <sentence>
    // The bot will use this prompt if provided by the user, otherwise it uses the default template.
    //
    // --- End of custom prompt example ---
    const prompt = customPrompt || `You are an expert AI assistant that extracts specific pain points from developer feedback. For each feedback, list the pain points as bullet points. Ignore compliments or general statements.\n\nExample:\nFeedback 1: \"The documentation is confusing and the setup process is slow.\"\nPain Points 1:\n- Documentation is confusing\n- Setup process is slow\n\nFeedback 2: \"Great tool, but the error messages are unclear and support is slow.\"\nPain Points 2:\n- Error messages are unclear\n- Support is slow\n\nFeedback 3: \"The UI is slow to load and the export feature is buggy.\"\nPain Points 3:\n- UI is slow to load\n- Export feature is buggy\n\n${batch.map((item, idx) => `Feedback ${idx + 1}: \"${item.content}\"`).join("\n\n")}\n${batch.map((_, idx) => `Pain Points ${idx + 1}:`).join("\n")}\n`;

    // Log the prompt being sent to OpenAI for debugging
    console.log('PROMPT SENT TO OPENAI:', prompt);

    let summaries = [];
    let attempt = 0;
    let maxAttempts = 2;
    while (attempt < maxAttempts) {
      try {
        // Call OpenAI API to get the summary for the batch
        const response = await openai.completions.create({
          deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME, // Use Azure deployment name
          prompt,
          max_tokens: 4096
        });
        // Extract and clean up the summaries from the response
        const text = response.choices[0].text.trim();
        console.log('RAW OPENAI RESPONSE:', text); // Log the raw model output for debugging
        // Parse the OpenAI response so each feedback gets its own summary
        const painPointsSections = text.split(/Pain Points \d+:/g).slice(1); // First split is before first section
        summaries = painPointsSections.map(section => section.trim() || "No summary returned.");
        // If parsing fails or not enough sections, fallback to the whole text
        if (summaries.length !== batch.length) {
          summaries = batch.map(() => text);
        }
        break; // Success, exit retry loop
      } catch (error) {
        if (error.status === 429 || error.code === 429) {
          if (attempt < maxAttempts - 1) {
            console.log("Rate limit hit. Retrying after delay...");
            await new Promise(res => setTimeout(res, 3000)); // Wait 3 seconds
            attempt++;
            continue;
          } else {
            summaries = batch.map(() => "Rate limit exceeded. Please try again later.");
            break;
          }
        } else {
          summaries = batch.map(() => `Error: ${error.message || error}`);
          break;
        }
      }
    }
    // Add the results to the output array
    for (let j = 0; j < batch.length; j++) {
      results.push({
        source: batch[j].source,
        summary: summaries[j],
        url: batch[j].metadata.url
      });
    }
  }

  // Return all extracted pain points
  return results;
}