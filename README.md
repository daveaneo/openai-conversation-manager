
# OpenAI Prompt Script

This script allows you to interact with OpenAI's API to generate responses based on predefined or custom prompts. It supports three modes of operation: JSON Config Mode, File Input Mode, and Direct Input Mode. You can also simulate recurring conversations by including a history of previous exchanges within each request.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Usage Modes](#usage-modes)
  - [JSON Config Mode](#json-config-mode)
  - [File Input Mode](#file-input-mode)
  - [Direct Input Mode](#direct-input-mode)
- [Parameters](#parameters)
- [Recurring Conversations](#recurring-conversations)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Setup](#setup)
- [Configuration Example](#configuration-example)
- [License](#license)

---

## Overview

This script sends prompts to the OpenAI API using various input modes, allowing for flexible, customizable interactions. It’s designed to:
1. Load agent prompts and settings from a JSON configuration file.
2. Use direct file paths or input strings for both agent and user prompts.
3. Retain context for ongoing conversations by including previous exchanges in each request.

## Prerequisites

- **Node.js** and **npm** installed.
- An OpenAI API key stored in a `.env` file (for security).

### `.env` File Example
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

# Conversation Manager Documentation

## Overview
The Conversation Manager is a comprehensive tool for interacting with the OpenAI API in a way that maintains context across conversations, handles logging, and manages system prompts. It enables developers to create, maintain, and retrieve conversations for users with ease.

## Usage Guide

### Initializing a Conversation Manager
To start a conversation, initialize the `ConversationManager` class. If you're not saving any user data, you can instantiate it without parameters.

```javascript
// Create a new conversation without saving user data
const conversation = new ConversationManager();

// Create a conversation for a specific user
const conversation = new ConversationManager('user123');
```
This loads the user data, including past conversations, if any.

### Setting Up the System
By default, the `ConversationManager` uses predefined system settings. There are three modes for changing this setup:

1. **Direct Mode**: Directly set the prompt and options.
2. **File Mode**: Load the system settings from a file.
3. **Config Mode**: Use settings from a configuration file.

```javascript
// Setting the system with direct input
conversation.setSystem('direct', {
  agentPrompt: 'You are a helpful assistant.',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  conversationMaxTokens: 1000,
  responseTokens: 150,
});

// Setting the system from a file
conversation.setSystem('file', { agentFilePath: 'path/to/agentFile.txt' });

// Setting the system using config mode
conversation.setSystem('config', { modelId: 'empathy_coach' });
```

### Adding User Messages
Use the `addMessage` method to add a user message to the conversation.

```javascript
conversation.addMessage('Can you provide me with some tips for productivity?');
```

### Sending a Message to the API
The `callAPI` method sends the current conversation history to OpenAI and appends the assistant's response.

```javascript
const response = await conversation.callAPI();
console.log('Assistant response:', response);
```

### Saving and Loading Conversation History
The `saveHistory` method saves the current conversation, while `loadLatestConversation` loads the most recent conversation for a user.

```javascript
conversation.saveHistory(); // Save the current conversation

conversation.loadLatestConversation(); // Load the last conversation for the user
```

### Retrieving Conversation History
You can use the `getHistory` method to retrieve the current conversation history, with an option to exclude system messages.

```javascript
const history = conversation.getHistory(true); // Retrieve history without system messages
console.log(history);
```

### Method: `loadConversationById`

**Usage**: Loads a specific conversation by its unique `conversationId` for a user, setting it as the active conversation.

**Purpose**: Enables resuming or continuing a specific previous conversation, maintaining context and continuity.

**Example**:
```javascript
conversation.loadConversationById("2"); // Loads conversation with ID "2" for the user
```

### Additional Methods
- **`startNewConversation()`**: Begins a new conversation for the user.
- **`deleteHistory()`**: Deletes the current conversation history but retains system messages.

## Example Scripts

### Simple Interaction Script
```javascript
import { ConversationManager } from 'path/to/ConversationManager.js';

(async () => {
  const conversation = new ConversationManager('user123');
  conversation.setSystem('config', { modelId: 'empathy_coach' });
  conversation.addMessage('How do I improve my communication skills?');
  const response = await conversation.callAPI();
  console.log('Response:', response);
  conversation.saveHistory();
})();
```

## Error Handling
The `ConversationManager` includes built-in error handling. Ensure that file paths are valid and the `modelId` matches an entry in your configuration.



## Setup

1. **Clone the Repository**:
   ```bash
   git clone your-repo-url
   cd your-repo-name
   ```

2. **Install Dependencies**:
   ```bash
   npm install dotenv node-fetch
   ```

3. **Create `.env` File**:
   - Add your OpenAI API key in the `.env` file as shown in [Prerequisites](#prerequisites). You may copy the template, env.example to .env to do so.

4. **Create `config.json`**:
   - Set up your JSON configuration file as described below.

## Configuration Example

The `config.json` file contains predefined agent configurations with unique IDs, default settings, and file paths for agent prompts.

```json
{
  "defaults": {
    "model": "gpt-4o-mini",
    "conversationMaxTokens": 3000,
    "responseTokens": 200,
    "temperature": 0.7,
    "logPath": "logs"
  },
  "models": {
    "poet": {
      "agent_file": "agents/poet.txt",
      "conversationMaxTokens": 300,
      "responseTokens": 75,
      "temperature": 0.6,
      "model": "gpt-4o-mini"
    },
    "general_question_confirmer": {
      "agent_file": "agents/general_question_confirmer.txt",
      "conversationMaxTokens": 3000,
      "responseTokens": 200,
      "temperature": 0.6,
      "model": "gpt-4o-mini"
    }
  }
}
```

Each models entry in the configuration should include:
- **`id`**: A unique identifier for the agent configuration.
- **`agent_file`**: Path to the file containing the agent’s prompt.
- **`max_tokens`**: Default maximum token count for responses.
- **`temperature`**: Default randomness control for responses.
- **`model`**: OpenAI model name.

## User Data Structure

The `ConversationManager` stores user data in a structured JSON format for easy retrieval and persistence. Each user has a dedicated file named `username.json` that includes metadata and all their conversation histories. Below is the structure of the user data:

### File Structure

Each user's data is stored in a single JSON file named after their `userId`, with the following structure:


```json
{
  "userId": "username",
  "totalConversations": 3,
  "conversations": [
    {
      "conversationId": "1",
      "name": "How can I stay focused?",
      "timestamp": "2024-11-03T10:00:00Z",
      "messages": [
        { "role": "system", "content": "Welcome to the session." },
        { "role": "user", "content": "How can I stay focused?" },
        { "role": "assistant", "content": "Set clear goals, eliminate distractions, and take breaks." }
      ]
    },
    {
      "conversationId": "2",
      "name": "Productivity tips",
      "timestamp": "2024-11-04T14:30:00Z",
      "messages": [
        { "role": "system", "content": "Productivity coaching session started." },
        { "role": "user", "content": "Give me a quick productivity tip." },
        { "role": "assistant", "content": "Try the two-minute rule for small tasks." }
      ]
    },
    {
      "conversationId": "3",
      "name": "Empathy session",
      "timestamp": "2024-11-05T09:45:00Z",
      "messages": [
        { "role": "system", "content": "Empathy coaching session initiated." },
        { "role": "user", "content": "I need some empathy. Can you help me understand my feelings?" },
        { "role": "assistant", "content": "Of course, I'm here for you. What are you feeling at the moment?" }
      ]
    }
  ]
}
```

- **`userId`**: The unique identifier for the user.
- **`totalConversations`**: The total number of conversations stored for the user.
- **`conversations`**: An array of conversations, each containing:
  - **`conversationId`**: The unique ID of the conversation.
  - **`name`**: A brief title derived from the first user message or system prompt.
  - **`timestamp`**: The timestamp of when the conversation was created.
  - **`messages`**: An array of message objects, each containing:
    - **`role`**: The sender's role (`system`, `user`, `assistant`).
    - **`content`**: The content of the message.


## License

This project is licensed under the MIT License.
