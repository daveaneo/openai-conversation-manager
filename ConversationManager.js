/**
 * @title Conversation Manager for OpenAI API
 * @notice This script defines a ConversationManager class that integrates with OpenAI's API.
 *         It supports message history management, API interaction, and optional logging of responses.
 *         It also includes helper classes (APIHandler and Logger) to modularize functionality.
 * @dev Requires an OpenAI API key stored in a .env file, along with default configurations in config.json.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * @notice Loads configuration settings from a JSON file.
 * @dev This function is used to set default values for various parameters, including model, maxTokens, etc.
 * @param {string|null} modelId - The model ID to load specific configurations.
 * @return {Object} The parsed JSON configuration data or default settings if loading fails.
 */
const loadConfig = (modelId = null) => {
  try {
    const configData = fs.readFileSync('config.json', 'utf-8');
    const config = JSON.parse(configData);

    // If a modelId is specified and exists in models, retrieve it; otherwise, return defaults
    if (modelId && config.models && config.models[modelId]) {
      return config.models[modelId];
    }

    return config.defaults;
  } catch (error) {
    console.error("Error loading config.json. Please ensure it exists and is valid JSON:", error.message);
    return {
      model: "gpt-4o-mini",
      temperature: 0.7,
      logPath: "logs",
      conversationMaxTokens: 500,
      responseTokens: 100,
    };
  }
};

// Load default configuration
const defaults = loadConfig();
const apiKey = process.env.OPENAI_API_KEY || "";
const defaultModel = defaults.model || "gpt-4o-mini";
const defaultTemperature = defaults.temperature || 0.7;
const defaultLogPath = defaults.logPath || "logs";
const defaultConversationMaxTokens = defaults.conversationMaxTokens || 500;
const defaultResponseTokens = defaults.responseTokens || 100;

/**
 * @title APIHandler
 * @notice Handles API calls to OpenAI.
 * @dev Ensures that the OpenAI API key is set and manages the actual API request.
 */
export class APIHandler {
  /**
   * @param {string} apiKey - The OpenAI API key required for authentication.
   * @param {string} model - The OpenAI model to use for completions.
   */
  constructor(apiKey, model) {
    if (!apiKey) {
      throw new Error("API key is required. Please set OPENAI_API_KEY in the .env file.");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * @notice Makes an API call to OpenAI's chat completions endpoint.
   * @param {Array<Object>} messages - An array of message objects representing the conversation history.
   * @param {number} maxTokens - The maximum number of tokens for the response.
   * @param {number} temperature - Controls randomness of the response.
   * @return {Promise<string>} The assistant's response text.
   * @throws Will throw an error if the API call fails or returns no response.
   */
  async callAPI(messages, maxTokens, temperature) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: this.model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error("No response from OpenAI API.");
      }
    } catch (error) {
      console.error("Error calling OpenAI:", error.message);
      throw error;
    }
  }
}

/**
 * @title Logger
 * @notice Manages saving and loading conversation history, as well as logging responses.
 */
export class Logger {
  /**
   * @param {string} [logPath="logs"] - Directory path where logs are saved.
   */
  constructor(logPath = "logs") {
    this.logPath = logPath;
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
  }

  /**
   * @notice Loads user data from the file or initializes it if not present.
   * @param {string} userId - The unique user identifier.
   * @return {Object} The user data object with conversations or an empty structure if not found.
   */
  loadUserData(userId) {
    const filePath = `${this.logPath}/${userId}.json`;
    try {
      const data = JSON.parse(fs.readFileSync(filePath));
      // Ensure conversations array exists
      data.conversations = data.conversations || [];
      return data;
    } catch (error) {
      // Return a default structure if the file does not exist
      console.log(`No existing user data for user: ${userId}. Initializing new data.`);
      return { userId, totalConversations: 0, conversations: [] };
    }
  }

  /**
   * @notice Saves the user data, including all conversations, to the designated file.
   * @param {string} userId - The unique identifier for the user.
   * @param {Object} userData - The data structure containing user metadata and conversations.
   */
  saveUserData(userId, userData) {
    const filePath = `${this.logPath}/${userId}.json`;
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
    console.log(`Saved data for user: ${userId}`);
  }

  /**
   * @notice Generates a unique conversation ID based on existing user data.
   * @param {Object} userData - The user data object containing conversations.
   * @return {string} The new conversation ID.
   */
  generateConversationId(userData) {
    const highestId = userData.conversations.length > 0
      ? Math.max(...userData.conversations.map(convo => parseInt(convo.conversationId, 10)))
      : 0;
    return (highestId + 1).toString();
  }

  /**
   * @notice Generates a default name for the conversation based on the first user message or a fallback.
   * @param {Array<Object>} messages - The conversation messages array.
   * @return {string} The generated conversation name.
   */
  generateConversationName(messages) {
    const firstUserMessage = messages.find(msg => msg.role === "user");
    return firstUserMessage ? firstUserMessage.content.substring(0, 30).trim() : "Untitled Conversation";
  }

  /**
   * @notice Logs the current conversation to a timestamped file.
   * @param {string} userId - The user ID for identifying the log file.
   * @param {Array<Object>} messages - The conversation messages to log.
   */
  logResponse(userId, messages) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `${this.logPath}/${userId}_${timestamp}.json`;
    fs.writeFileSync(logFileName, JSON.stringify(messages, null, 2));
    console.log(`Logged conversation for user: ${userId} at ${logFileName}`);
  }
}

/**
 * @title ConversationManager
 * @notice Main interface for managing conversations with OpenAI.
 * @dev Uses helper classes APIHandler and Logger for API interaction and logging.
 */
export class ConversationManager {
  /**
   * @param {string} [userId=""] - The unique identifier for the user.
   * @param {string} [model=defaultModel] - The model to use for responses.
   */
  constructor(userId = "", model = defaultModel) {
    this.userId = userId;
    this.model = model;
    this.logger = new Logger(defaultLogPath);
    this.messages = [];
    this.activeConversationId = null; // Holds the ID of the current active conversation
    this.systemSet = false;
    this.apiHandler = null;
    this.temperature = defaultTemperature;
    this.conversationMaxTokens = defaultConversationMaxTokens;
    this.responseTokens = defaultResponseTokens;
    this.conversationName = "";

    if (userId) {
      // Load user data if it exists, otherwise start with a new conversation
      this.loadUserData();
    }

    // Automatically set up the system with default settings if not already set
    if (!this.systemSet) {
      this.setDefaultSystem();
    }
  }

  /**
   * @notice Sets up the system with default settings.
   * @dev This method is called automatically in the constructor if `setSystem` is not invoked.
   */
  setDefaultSystem() {
    // Load default configurations from config.json
    const config = loadConfig();

    // Initialize APIHandler with default model
    this.apiHandler = new APIHandler(apiKey, config.model);

    // Add default system message
    this.messages.push({ role: "system", content: "You are a helpful assistant." });

    // Apply default configurations
    this.temperature = config.temperature;
    this.conversationMaxTokens = config.conversationMaxTokens;
    this.responseTokens = config.responseTokens;
    this.systemSet = true;  // Mark system as set to prevent reloading

    console.log("Default system settings applied.");
  }

  /**
   * @notice Loads user data and always starts a new conversation as the active session.
   */
  loadUserData() {
    const userData = this.logger.loadUserData(this.userId);

    // Set the user data and start a new conversation each time
    this.userData = userData;
    this.startNewConversation();  // Start a fresh conversation for each session
  }

  /**
   * @notice Starts a new conversation for the user, generating a unique conversation ID.
   */
  startNewConversation() {
    this.activeConversationId = this.logger.generateConversationId(this.userData);
    this.messages = [];

    // Generate a name for the conversation based on the first message
    this.conversationName = `Conversation ${this.activeConversationId}`;
    console.log(`Starting new conversation with ID: ${this.activeConversationId}`);
  }

  /**
   * @notice Loads the latest conversation for the user.
   */
  loadLatestConversation() {
    const userData = this.logger.loadUserData(this.userId);
    if (userData && userData.conversations.length > 0) {
      const latestConversation = userData.conversations[userData.conversations.length - 1];
      this.activeConversationId = latestConversation.conversationId;
      this.messages = latestConversation.messages;
    } else {
      console.warn("No conversations found for this user.");
      this.startNewConversation();
    }
  }

  /**
   * @notice Sets an existing conversation as the active conversation by ID.
   * @param {string} conversationId - The conversation ID to set as active.
   */
  setActiveConversation(conversationId) {
    const userData = this.logger.loadUserData(this.userId);
    const conversation = userData.conversations.find(convo => convo.conversationId === conversationId);
    if (conversation) {
      this.activeConversationId = conversationId;
      this.messages = conversation.messages;
    } else {
      console.warn(`Conversation with ID ${conversationId} not found.`);
    }
  }

  /**
   * @notice Adds a system message to the conversation.
   */
  addSystemMessage() {
    if (!this.systemSet) {
      const defaultPrompt = "You are a helpful assistant.";
      this.messages.unshift({ role: "system", content: defaultPrompt });
      this.systemSet = true;
    }
  }

  /**
   * @notice Deletes the entire conversation history for the current active conversation, including the file.
   */
  deleteHistory() {
    if (!this.activeConversationId) {
      console.warn("No active conversation to delete.");
      return;
    }

    // Keep only the system message(s) in `this.messages`
    this.messages = this.messages.filter(msg => msg.role === 'system');

    const filePath = `${this.logger.logPath}/${this.activeConversationId}_history.json`;

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Conversation history file for conversation ${this.activeConversationId} deleted.`);
      } else {
        console.log(`No history file found for conversation ${this.activeConversationId}.`);
      }
    } catch (error) {
      console.error(`Error deleting history file for conversation ${this.activeConversationId}:`, error.message);
    }

    console.log("Conversation history cleared, system settings retained.");
  }

  /**
   * @notice Sets up the system prompt and settings based on the specified mode.
   * @param {string} [mode="config"] - The mode to configure the AI: 'direct', 'config', or 'file'.
   * @param {Object} [options={}] - Additional settings, varying by mode.
   *        - In 'direct' mode, options include `agentPrompt`, `model`, `temperature`, `conversationMaxTokens`, `responseTokens`.
   *        - In 'config' mode, options include `modelId`.
   *        - In 'file' mode, options include `agentFilePath`.
   * @throws Will throw an error if an invalid mode is provided or if required options are missing.
   */
  setSystem(mode = "config", options = {}) {
    // If the system has already been set, clear existing settings and log the update
    if (this.systemSet) {
      console.log("System is already set. Updating agent and system settings...");
      // Remove any existing system message
      this.messages = this.messages.filter(msg => msg.role !== "system");
      // Reset system variables
      this.systemSet = false;
    }

    let config = {
      model: defaultModel,
      temperature: defaultTemperature,
      conversationMaxTokens: defaultConversationMaxTokens,
      responseTokens: defaultResponseTokens,
    };

    if (mode === "direct") {
      // Direct mode: settings are passed directly in options
      config.model = options.model || config.model;
      config.temperature = options.temperature || config.temperature;
      config.conversationMaxTokens = options.conversationMaxTokens || config.conversationMaxTokens;
      config.responseTokens = options.responseTokens || config.responseTokens;
      this.agentPrompt = options.agentPrompt || "You are a helpful assistant.";

    } else if (mode === "config") {
      // Config mode: load settings from config.json by model ID
      const modelId = options.modelId;
      const loadedConfig = loadConfig(modelId);
      config = { ...config, ...loadedConfig };  // Merge defaults with loaded config

      if (config.agent_file && fs.existsSync(config.agent_file)) {
        console.log(`Loading agent file from ${config.agent_file}`);
        this.agentPrompt = fs.readFileSync(config.agent_file, "utf-8");
      } else {
        console.warn(`Agent file not found or undefined for model ID '${modelId}'. Using default prompt.`);
        this.agentPrompt = "You are a helpful assistant.";
      }

    } else if (mode === "file") {
      // File mode: load prompt from a specified file path
      config.model = options.model || config.model;
      config.temperature = options.temperature || config.temperature;
      config.conversationMaxTokens = options.conversationMaxTokens || config.conversationMaxTokens;
      config.responseTokens = options.responseTokens || config.responseTokens;

      if (options.agentFilePath && fs.existsSync(options.agentFilePath)) {
        console.log(`Loading agent file from ${options.agentFilePath}`);
        this.agentPrompt = fs.readFileSync(options.agentFilePath, "utf-8");
      } else {
        throw new Error("Agent file path is missing or invalid in 'file' mode.");
      }
    } else {
      throw new Error("Invalid mode. Please use 'direct', 'config', or 'file'.");
    }

    // Apply configuration values
    this.apiHandler = new APIHandler(apiKey, config.model);
    this.messages.push({ role: "system", content: this.agentPrompt });
    this.temperature = config.temperature;
    this.conversationMaxTokens = config.conversationMaxTokens;
    this.responseTokens = config.responseTokens;
    this.systemSet = true;  // Mark system as set to prevent reloading
  }

  /**
   * @notice Counts the number of user and assistant turns in the entire conversation.
   * @return {Object} An object with accurate counts of user and assistant turns.
   */
  countTurns() {
    const userMessages = this.messages.filter(msg => msg.role === "user").length;
    const assistantResponses = this.messages.filter(msg => msg.role === "assistant").length;
    return { userMessages, assistantResponses };
  }

  /**
   * @notice Adds a message to the conversation history with a timestamp.
   * @param {string} content - The content of the message.
   * @param {string} [role="user"] - The role of the message.
   */
  addMessage(content, role = "user") {
    const timestamp = new Date().toISOString();
    this.messages.push({ role, content, timestamp });
    this.trimHistory();  // Ensure total tokens stay within `conversationMaxTokens`
  }

  /**
   * @notice Trims the conversation history to stay within token and message limits.
   */
  trimHistory() {
    // Check if the first message is the system message
    if (this.messages.length > 0 && this.messages[0].role === "system") {
      // Extract the system message temporarily
      const systemMessage = this.messages[0];

      // Trim remaining messages without the system message
      this.messages = this.messages.slice(1); // Remove the system message temporarily
      while (this.getTotalTokens() > this.conversationMaxTokens && this.messages.length > 0) {
        this.messages.shift(); // Trim from the oldest user/assistant messages
      }

      // Reinsert the system message at the start after trimming
      this.messages.unshift(systemMessage);
    } else {
      // If no system message, trim as usual
      while (this.getTotalTokens() > this.conversationMaxTokens && this.messages.length > 0) {
        this.messages.shift();
      }
    }
  }

  /**
   * @notice Utility to calculate token count for a given text.
   * @param {string} text - The text to count tokens for.
   * @return {number} The approximate token count.
   */
  getTokenCount(text) {
    // Simple approximation: one token per word
    return text.split(/\s+/).length;
  }

  /**
   * @notice Calculates the total token count of the current conversation.
   * @return {number} The approximate total token count.
   */
  getTotalTokens() {
    return this.messages.reduce((count, msg) => count + this.getTokenCount(msg.content), 0);
  }

  /**
   * @notice Sends the conversation history to OpenAI and appends the assistant's response.
   * @return {Promise<string>} The assistant's response.
   * @throws Will throw an error if there is not enough token space for a response.
   */
  async callAPI() {
    // Ensure only one system message is present at the start of `this.messages`
    const systemMessages = this.messages.filter(msg => msg.role === 'system');
    if (systemMessages.length > 1) {
      console.warn("Duplicate system messages found. Keeping only the first instance.");
      this.messages = [
        systemMessages[0],  // Keep the first system message
        ...this.messages.filter(msg => msg.role !== 'system') // Include only non-system messages
      ];
    }

    // Calculate remaining tokens for response within `conversationMaxTokens`
    const availableTokens = this.conversationMaxTokens - this.getTotalTokens();
    const responseLimit = Math.min(this.responseTokens, availableTokens);

    if (responseLimit <= 0) {
      throw new Error("Not enough token space for a response. Clear conversation history to continue.");
    }

    // Use getMessagesForAPI to remove timestamps and other metadata before sending to API
    const messagesForAPI = this.getMessagesForAPI();

    // Call the API with the filtered messages
    const assistantResponse = await this.apiHandler.callAPI(messagesForAPI, responseLimit, this.temperature);

    // Append the assistant's response to the conversation
    this.addMessage(assistantResponse, "assistant");

    return assistantResponse;
  }

  /**
   * @notice Gets history for the active conversation or a specified conversation ID.
   * @param {string|null} [conversationId=null] - The ID of the conversation to get history for.
   * @param {boolean} [onlyNonSystem=false] - If true, returns only non-system messages.
   * @return {Array<Object>} The conversation messages.
   */
  getHistory(conversationId = null, onlyNonSystem = false) {
    const idToUse = conversationId || this.activeConversationId;
    const userData = this.logger.loadUserData(this.userId);
    const conversation = userData.conversations.find(convo => convo.conversationId === idToUse);

    if (!conversation) {
      return [];
    }

    return onlyNonSystem
      ? conversation.messages.filter(msg => msg.role !== "system")
      : conversation.messages;
  }

  /**
   * @notice Returns only the system messages from the conversation history.
   * @return {Array<Object>} An array of system messages.
   */
  getSystem() {
    return this.messages.filter(msg => msg.role === 'system');
  }

  /**
   * @notice Prepares messages for API call by removing timestamps.
   * @return {Array<Object>} The conversation history without timestamps.
   */
  getMessagesForAPI() {
    return this.messages.map(({ role, content }) => ({ role, content }));
  }

  /**
   * @notice Saves the conversation history for the current user and conversation.
   */
  saveHistory() {
    const userData = this.logger.loadUserData(this.userId);

    // Ensure userData is structured correctly
    userData.conversations = userData.conversations || [];

    // Check if the current conversation already exists in userData
    const existingConversation = userData.conversations.find(convo => convo.conversationId === this.activeConversationId);

    if (existingConversation) {
      // Update messages for the existing conversation
      existingConversation.messages = this.messages;
    } else {
      // Add new conversation details if it's a new conversation
      const newConversation = {
        conversationId: this.activeConversationId,
        name: this.logger.generateConversationName(this.messages),
        timestamp: new Date().toISOString(),
        messages: this.messages
      };
      userData.conversations.push(newConversation);
      userData.totalConversations += 1;
    }

    // Save the updated userData back to the file
    this.logger.saveUserData(this.userId, userData);
  }

  /**
   * @notice Loads a specific conversation's messages for a user.
   * @param {string} conversationId - The conversation ID to load.
   * @return {Array<Object>} The loaded conversation messages, or an empty array if not found.
   */
  loadHistory(conversationId) {
    const userData = this.logger.loadUserData(this.userId);
    const conversation = userData.conversations.find(
      convo => convo.conversationId === conversationId
    );

    return conversation ? conversation.messages : [];
  }

  /**
   * @notice Logs the current conversation to a timestamped file.
   */
  logResponse() {
    this.logger.logResponse(this.userId, this.messages);
  }
}
