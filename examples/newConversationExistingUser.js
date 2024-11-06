/**
 * startNewConversationExample.js
 *
 * A script for starting a new conversation with an existing user using the OpenAI API.
 * This script initializes a conversation for a specified user ID, sets up the model
 * configuration, and sends a message to initiate a counting game. The conversation is
 * saved after the interaction, allowing the assistant to continue counting in future
 * sessions if the conversation is revisited.
 *
 * Usage:
 * - Customize the initial user message as needed to start a new conversation.
 * - Run the script to initiate the counting game and preserve the conversation history.
 */


import { ConversationManager } from '../ConversationManager.js';

(async () => {
  try {
    const userId = "user123";
    const conversation = new ConversationManager(userId);

    let history;

    history = conversation.getHistory();

    // Set up the system
//    conversation.setSystem("config", { modelId: "model_name" });
    conversation.setSystem();

    conversation.addMessage("I want to play a counting game. If we haven't already started, let's start with 'a'. Otherwise, give me the next letter.");
    let response = await conversation.callAPI();

    // Save the conversation
    conversation.saveHistory();

    history = conversation.getHistory();

  } catch (error) {
    console.error("Error in example:", error.message);
  }
})();
