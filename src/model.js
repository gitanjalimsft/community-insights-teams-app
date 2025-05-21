// model.js
import dotenv from 'dotenv';
dotenv.config();

import { OpenAIModel } from '@microsoft/teams-ai';

const model = new OpenAIModel({
  apiKey: process.env.OPENAI_API_KEY,
  // Use Azure OpenAI endpoint and deployment name from environment variables
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  temperature: 0.7 // moved out of config
});
export default model;