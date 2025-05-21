import pkg from '@microsoft/teams-ai';
const { MCPService } = pkg;
import axios from 'axios';

// Fetches developer feedback from GitHub issues and Stack Overflow questions
export async function fetchDeveloperFeedback() {
  const feedbackItems = []; // Array to store all feedback items

  // --- Fetch GitHub Issues ---
  try {
    // Get issues from the Microsoft Teams AI GitHub repo
    const githubIssues = await axios.get(
      `https://api.github.com/repos/microsoft/teams-ai/issues`,
      { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
    );

    // Add each GitHub issue as a feedback item
    githubIssues.data.forEach(issue => {
      feedbackItems.push({
        type: 'text',
        source: 'GitHub',
        content: issue.title + '\n' + issue.body,
        metadata: { url: issue.html_url }
      });
    });
  } catch (err) {
    // Log error if GitHub fetch fails
    console.error("❌ GitHub fetch failed:", err.message);
  }

  // --- Fetch Stack Overflow Questions ---
  try {
    // Get recent Stack Overflow questions tagged with both 'microsoft-teams' and 'botframework'
    const stackoverflowPosts = await axios.get(
      `https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=microsoft-teams;botframework&site=stackoverflow`
    );

    // Add each Stack Overflow question as a feedback item
    stackoverflowPosts.data.items.forEach(post => {
      feedbackItems.push({
        type: 'text',
        source: 'Stack Overflow',
        content: post.title,
        metadata: { url: post.link }
      });
    });
  } catch (err) {
    // Log error if Stack Overflow fetch fails
    console.error("❌ Stack Overflow fetch failed:", err.message);
  }

  // --- Fallback Example ---
  // If no feedback was found, add a fallback example
  if (feedbackItems.length === 0) {
    feedbackItems.push({
      type: 'text',
      source: 'Fallback',
      content: 'Example feedback: The documentation for Teams AI is confusing.',
      metadata: { url: 'https://example.com' }
    });
  }

  // Log and return all collected feedback items
  console.log("✅ Returning feedbackItems:", feedbackItems);
  return feedbackItems;
}