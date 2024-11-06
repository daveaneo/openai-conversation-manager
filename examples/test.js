import { ConversationManager } from '../ConversationManager.js';

(async () => {
  try {
    // Initialize the ConversationManager with default settings
    const conversation = new ConversationManager();

    // Set the system configuration in "config" mode with model ID "empathy_coach"
    conversation.setSystem("config", { modelId: "empathy_coach" });

    // Add a single user message
    conversation.addMessage("I need some empathy. Can you help me understand my feelings?");

    // Send the message to the OpenAI API and get a response
    const response = await conversation.callAPI();
    console.log("Assistant response:", response);

  } catch (error) {
    console.error("Error in single-use example:", error.message);
  }
})();
