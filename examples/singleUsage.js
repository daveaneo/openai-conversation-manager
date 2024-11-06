/**
 * singleUsage.js
 *
 * A simple script for single-use interactions with the OpenAI API.
 * This script initializes a blank conversation using the ConversationManager,
 * sets a specified model configuration, adds a single user message, and
 * retrieves the assistant's response. Ideal for quick, one-off queries
 * where conversation history and persistence are not required.
 *
 * Usage:
 * - Adjust the user message as needed.
 * - Run the script to get a response from the assistant without saving history.
 */


import { ConversationManager } from '../ConversationManager.js';

(async () => {
  try {
    // Initialize the ConversationManager with default settings
    const conversation = new ConversationManager();

    // Set the system configuration in "config" mode with model ID "empathy_coach"
    conversation.setSystem("config", { modelId: "poet" });

    // Add a single user message
    conversation.addMessage("I need some empathy. Can you help me understand my feelings? Please limit your response to 25 words.");

    // Send the message to the OpenAI API and get a response
    const response = await conversation.callAPI();
    console.log("Assistant response:\n\n", response);

  } catch (error) {
    console.error("Error in single-use example:", error.message);
  }
})();
