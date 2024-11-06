/**
 * multiMessageExample.js
 *
 * A script for interacting with the OpenAI API over multiple messages,
 * with conversation continuity and persistence. This script initializes
 * a conversation using the ConversationManager with a specified user ID,
 * loads the latest conversation history if available, sets up the model
 * configuration, and sends multiple messages. The conversation history is
 * saved after interactions, allowing for continuity in future sessions.
 *
 * Usage:
 * - Adjust user messages as needed.
 * - Run the script to interact with the assistant across multiple messages,
 *   with history preserved for later sessions.
 */


import { ConversationManager } from '../ConversationManager.js';

(async () => {
  try {
    const userId = "user123";
    const conversation = new ConversationManager(userId);

    // Use the latest conversation if it exists
    conversation.loadLatestConversation();

    // Set up the system
//    conversation.setSystem("config", { modelId: "model_name" });

    conversation.addMessage("I want to play a counting game. If we haven't already started, let's start with 0. Otherwise, give me the next number one higher than your last response. Only give me a number -- no words.");
    let response = await conversation.callAPI();


    // Save the conversation
    conversation.saveHistory();

  } catch (error) {
    console.error("Error in example:", error.message);
  }
})();
