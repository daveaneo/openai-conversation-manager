
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

## Usage Modes

The script supports three modes of input:

### 1. JSON Config Mode
Use this mode to specify an agent configuration by ID. The configuration is defined in `agents_config.json` and includes:
- The agent prompt file path
- Default `max_tokens` and `temperature` settings

**Usage**:
```bash
node openai_prompt.js <agent_id> "<prompt_or_prompt_file>"
```

### 2. File Input Mode
Specify the file paths directly for both the agent and user prompts. This mode also allows optional custom settings for `max_tokens` and `temperature`.

**Usage**:
```bash
node openai_prompt.js <agent_file> <prompt_file> <max_tokens> <temperature>
```

### 3. Direct Input Mode
Directly provide both the agent prompt and user prompt as strings. You can also customize `max_tokens` and `temperature`.

**Usage**:
```bash
node openai_prompt.js "<agent_text>" "<prompt_text>" <max_tokens> <temperature>
```

## Parameters

| Parameter       | Description                                                                                               | Default    |
|-----------------|-----------------------------------------------------------------------------------------------------------|------------|
| `agent`         | The agent's prompt or configuration ID (based on the mode selected).                                      | Required   |
| `prompt`        | The user prompt for the AI to respond to. Can be a file or direct input.                                  | Required   |
| `max_tokens`    | Maximum number of tokens in the AI response.                                                              | 100        |
| `temperature`   | Controls the randomness of the response, ranging from 0.0 (deterministic) to 1.0 (more creative).         | 0.7        |

## Recurring Conversations

To create an ongoing conversation where the AI retains context, include previous interactions in the `messages` array. Each entry should specify a `role` (`"user"` or `"assistant"`) and `content`.

**Example History Array**:
```javascript
const messages = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "How can I communicate better with my partner?" },
  { role: "assistant", content: "Start by actively listening and validating their feelings." },
  { role: "user", content: "What if they get defensive?" }
];
```

Include this `messages` array in each new request to simulate continuity.

## Examples

### JSON Config Mode

1. **With Direct Prompt**:
   ```bash
   node openai_prompt.js empathy_evaluator "Evaluate empathy in this statement."
   ```

2. **With Prompt File**:
   ```bash
   node openai_prompt.js empathy_evaluator prompt.txt
   ```

### File Input Mode

1. **Specify Files for Agent and Prompt**:
   ```bash
   node openai_prompt.js agents/empathy_coach_prompt.txt prompt.txt
   ```

### Direct Input Mode

1. **Direct Text Input**:
   ```bash
   node openai_prompt.js "You are a relationship coach." "How can I communicate better with my partner?" 200 0.5
   ```

## Error Handling

- **Invalid Agent ID**: If the agent ID does not exist in `agents_config.json`, an error will prompt you to verify the ID.
- **Invalid File Paths**: If specified files cannot be read, an error will notify you.
- **Excessive Arguments in JSON Mode**: JSON Config Mode restricts the number of arguments to prevent unexpected behavior.

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
   - Add your OpenAI API key in the `.env` file as shown in [Prerequisites](#prerequisites).

4. **Create `agents_config.json`**:
   - Set up your JSON configuration file as described below.

## Configuration Example

The `agents_config.json` file contains predefined agent configurations with unique IDs, default settings, and file paths for agent prompts.

```json
[
  {
    "id": "return_pitfalls",
    "agent_file": "agents/return_pitfalls_given_statement.txt",
    "max_tokens": 500,
    "temperature": 0.6
  },
  {
    "id": "empathy_evaluator",
    "agent_file": "agents/empathy_evaluator_given_pillar_pass_fail.txt",
    "max_tokens": 500,
    "temperature": 0.6
  },
  {
    "id": "general_question_confirmer",
    "agent_file": "agents/general_question_confirmer.txt",
    "max_tokens": 500,
    "temperature": 0.6
  },
  {
    "id": "empathy_coach",
    "agent_file": "agents/empathy_coach_prompt.txt",
    "max_tokens": 500,
    "temperature": 0.6
  }
]
```

Each configuration entry should include:
- **`id`**: A unique identifier for the agent configuration.
- **`agent_file`**: Path to the file containing the agent’s prompt.
- **`max_tokens`**: Default maximum token count for responses.
- **`temperature`**: Default randomness control for responses.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
