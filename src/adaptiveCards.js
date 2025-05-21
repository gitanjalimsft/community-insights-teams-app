// Function to create an Adaptive Card for insights
export function createInsightsCard({ summary, url, source }) {
  return {
    contentType: 'application/vnd.microsoft.card.adaptive', // Required content type for Teams
    content: {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        // Show the source (GitHub or Stack Overflow)
        { type: 'TextBlock', text: `Source: ${source}`, weight: 'Bolder', size: 'Medium' },
        // Show the summarized pain point
        { type: 'TextBlock', text: summary, wrap: true },
      ],
      actions: url ? [
        // Add a button to view the original feedback
        { type: 'Action.OpenUrl', title: 'View Original', url }
      ] : []
    }
  };
}