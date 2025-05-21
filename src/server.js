// Import dotenv to load environment variables
import dotenv from 'dotenv';
dotenv.config();  // Load .env variables before anything else

// Import required modules and bot logic
import bot from './bot.js';
import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication } from 'botbuilder';

// Credentials from environment variables
const MicrosoftAppId = process.env.MICROSOFT_APP_ID || '';
const MicrosoftAppPassword = process.env.MICROSOFT_APP_PASSWORD || '';
const MicrosoftAppType = process.env.MICROSOFT_APP_TYPE || 'MultiTenant';

// Create botFrameworkAuthentication for secure connection
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId,
  MicrosoftAppPassword,
  MicrosoftAppType
});
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(undefined, credentialsFactory);

// Create the adapter to connect the bot to Teams
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Set up the Express web server
import express from 'express';
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint for Teams messages
app.post('/api/messages', async (req, res) => {
  console.log("hello world"); // Debug log for incoming requests
  await adapter.process(req, res, (context) => bot.run(context));
});

// Start the server on the specified port
const PORT = process.env.PORT || 3980;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}/api/messages`);
});