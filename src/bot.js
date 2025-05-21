import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import pkg from '@microsoft/teams-ai';
const { Application, OpenAIModel } = pkg;
import model from './model.js';
import { MemoryStorage } from 'botbuilder';
import { extractPainPoints } from './feedbackProcessor.js';
import { fetchDeveloperFeedback } from './mcpService.js';
import { createInsightsCard } from './adaptiveCards.js';

// Create the Teams bot application instance
const bot = new Application({
  storage: new MemoryStorage(), // In-memory storage for conversation state
  model // Use the OpenAI model instance
});
//console.log("OpenAI API Key:", process.env.OPENAI_API_KEY);

// Main message handler for the bot
bot.message(async (context, state) => {
  const text = context.activity.text?.trim();
  // Ensure state is always an object
  if (!state || typeof state !== 'object') {
    state = {};
  }
  // Allow setting a custom prompt via /prompt command
  if (text && text.startsWith('/prompt ')) {
    state.customPrompt = text.slice(8).trim();
    await context.sendActivity('✅ Custom prompt set for this conversation.');
    return;
  }

  // Notify user that feedback is being gathered
  await context.sendActivity(`🔄 Gathering feedback from GitHub and Stack Overflow...`);

  // Fetch feedback from GitHub and Stack Overflow
  const rawFeedback = await fetchDeveloperFeedback();

  // Ensure rawFeedback is always an array
  let feedbackArray;
  if (Array.isArray(rawFeedback)) {
    feedbackArray = rawFeedback;
  } else if (rawFeedback && typeof rawFeedback === 'object') {
    feedbackArray = [rawFeedback];
  } else {
    await context.sendActivity("❌ Could not retrieve feedback data.");
    console.error("rawFeedback is not an array or object:", rawFeedback);
    return;
  }

  // Debug: log feedbackArray type and value
  console.log("feedbackArray type:", Array.isArray(feedbackArray) ? "array" : typeof feedbackArray, "value:", feedbackArray);

  // Extract custom prompt from state if present
  let customPrompt = undefined;
  if (state && state.customPrompt && typeof state.customPrompt === 'string') {
    customPrompt = state.customPrompt;
  }

  // Extract pain points from feedback using OpenAI
  const insights = await extractPainPoints(feedbackArray, customPrompt);

  // Group insights by source
  const githubInsights = insights.filter(i => i.source === 'GitHub');
  const stackOverflowInsights = insights.filter(i => i.source === 'Stack Overflow');
  // Interleave GitHub and Stack Overflow insights for a mix
  const maxLen = Math.max(githubInsights.length, stackOverflowInsights.length);
  const mixed = [];
  for (let i = 0; i < maxLen; i++) {
    if (githubInsights[i]) mixed.push(githubInsights[i]);
    if (stackOverflowInsights[i]) mixed.push(stackOverflowInsights[i]);
  }
  // Show up to 6, or all if fewer
  for (const insight of mixed.slice(0, 6)) {
    await context.sendActivity({
      attachments: [createInsightsCard(insight)]
    });
  }
});

export default bot;