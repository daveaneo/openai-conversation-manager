// ConversationManager.test.js

import { expect } from 'chai';
import fs from 'fs';
import sinon from 'sinon';
import { ConversationManager, APIHandler, Logger } from '../ConversationManager.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

describe('ConversationManager Tests', () => {
  let fetchStub;

  beforeEach(() => {
    // Stub the global fetch
    fetchStub = sinon.stub(global, 'fetch');
  });

  afterEach(() => {
    // Restore fetch
    fetchStub.restore();
  });

  it('should call API with a single user message and receive a non-null response', async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Assistant response' } }],
      }),
    });

    // Initialize the ConversationManager with default settings
    const conversation = new ConversationManager();

    // Set the system configuration in "config" mode with model ID "poet"
    conversation.setSystem("config", { modelId: "poet" });

    // Add a single user message
    conversation.addMessage("I need some empathy. Can you help me understand my feelings? Please limit your response to 25 words.");


    // Send the message to the OpenAI API and get a response
    const response = await conversation.callAPI();

    // Assert that the response is not null
    expect(response).to.not.be.null;
    expect(response).to.equal('Assistant response');
    expect(fetchStub.calledOnce).to.be.true;
  });


  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const conversationManager = new ConversationManager();
      expect(conversationManager.userId).to.equal('');
      expect(conversationManager.model).to.equal('gpt-4o-mini');
    });
  });

describe('setSystem', () => {
  it('should set system in "direct" mode', () => {
    const conversationManager = new ConversationManager();
    conversationManager.setSystem('direct', {
      agentPrompt: 'You are a test assistant.',
      model: 'test-model',
      temperature: 0.5,
      conversationMaxTokens: 1000,
      responseTokens: 50,
    });
    expect(conversationManager.apiHandler.model).to.equal('test-model');
    expect(conversationManager.temperature).to.equal(0.5);
    expect(conversationManager.conversationMaxTokens).to.equal(1000);
    expect(conversationManager.responseTokens).to.equal(50);
    expect(conversationManager.messages[0]).to.deep.equal({
      role: 'system',
      content: 'You are a test assistant.',
    });
  });

  it('should set system in "config" mode with existing model ID', () => {
    const conversationManager = new ConversationManager();
    conversationManager.setSystem('config', { modelId: 'poet' });

    expect(conversationManager.temperature).to.equal(0.6);
    expect(conversationManager.conversationMaxTokens).to.equal(300);
    expect(conversationManager.responseTokens).to.equal(75);
    expect(conversationManager.model).to.equal("gpt-4o-mini");

  });

  it('should throw an error if agent file for "config" mode does not exist', () => {
    const conversationManager = new ConversationManager();
    sinon.stub(fs, 'existsSync').returns(false);

    expect(() => {
      conversationManager.setSystem('config', { modelId: 'nonexistentModel' });
    }).to.throw('Agent file not found or undefined for model ID \'nonexistentModel\'. Using default prompt.');

    fs.existsSync.restore();
  });

  it('should set system in "file" mode with existing file path', () => {
    const conversationManager = new ConversationManager();
    sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns('You are a file-based assistant.');

    conversationManager.setSystem('file', { agentFilePath: 'path/to/agent.txt' });

    expect(conversationManager.messages[0]).to.deep.equal({
      role: 'system',
      content: 'You are a file-based assistant.',
    });

    fs.existsSync.restore();
    fs.readFileSync.restore();
  });

  it('should throw an error for missing agent file in "file" mode', () => {
    const conversationManager = new ConversationManager();
    sinon.stub(fs, 'existsSync').returns(false);

    expect(() => {
      conversationManager.setSystem('file', { agentFilePath: 'path/to/missing-agent.txt' });
    }).to.throw('Agent file path is missing or invalid in \'file\' mode.');

    fs.existsSync.restore();
  });

  it('should throw an error for invalid mode', () => {
    const conversationManager = new ConversationManager();
    expect(() => {
      conversationManager.setSystem('invalidMode', {});
    }).to.throw('Invalid mode. Please use \'direct\', \'config\', or \'file\'.');
  });
});


  describe('Conversation Management', () => {
    it('should start a new conversation', () => {
      const conversationManager = new ConversationManager('user123');
      conversationManager.startNewConversation();
      expect(conversationManager.activeConversationId).to.not.be.null;
      expect(conversationManager.messages).to.deep.equal([]);
    });

    // Commenting out tests that require file operations
    /*
    it('should save conversation history', () => {
      const conversationManager = new ConversationManager('user123');
      conversationManager.messages = [{ role: 'user', content: 'Test message' }];
      conversationManager.activeConversationId = '1';
      conversationManager.saveHistory();
      expect(fs.writeFileSync).to.have.been.called;
    });

    it('should load conversation history', () => {
      const conversationManager = new ConversationManager('user123');
      const messages = conversationManager.loadHistory('1');
      expect(messages).to.deep.equal([{ role: 'user', content: 'Hello' }]);
    });

    it('should delete conversation history', () => {
      const conversationManager = new ConversationManager('user123');
      conversationManager.activeConversationId = '1';
      conversationManager.messages = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'User message' },
      ];
      conversationManager.deleteHistory();
      expect(conversationManager.messages).to.deep.equal([
        { role: 'system', content: 'System message' },
      ]);
      expect(fs.unlinkSync).to.have.been.called;
    });
    */
  });

  describe('API Interaction', () => {
    it('should handle API errors', async () => {
      fetchStub.resolves({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error message',
      });

      const conversationManager = new ConversationManager();
      conversationManager.apiHandler = new APIHandler('test-api-key', 'test-model');
      conversationManager.addMessage('Hello');
      try {
        await conversationManager.callAPI();
        // Should not reach here
        expect.fail('Expected callAPI to throw an error');
      } catch (error) {
        expect(error.message).to.equal('OpenAI API Error: 500 Internal Server Error - Error message');
      }
      expect(fetchStub.calledOnce).to.be.true;
    });
  });

  describe('Token Management', () => {
    it('should calculate token count', () => {
      const conversationManager = new ConversationManager();
      const count = conversationManager.getTokenCount('This is a test');
      expect(count).to.equal(4);
    });

    it('should calculate total tokens', () => {
      const conversationManager = new ConversationManager();
      conversationManager.messages = [
        { role: 'user', content: 'Hello world' },
        { role: 'assistant', content: 'Hi there' },
      ];
      const totalTokens = conversationManager.getTotalTokens();
      expect(totalTokens).to.equal(4);
    });

    it('should trim history when tokens exceed limit', () => {
      const conversationManager = new ConversationManager();
      conversationManager.conversationMaxTokens = 5;
      conversationManager.messages = [
        { role: 'system', content: 'System message' },
        { role: 'user', content: 'Message one' },
        { role: 'assistant', content: 'Response one' },
        { role: 'user', content: 'Message two' },
      ];
      conversationManager.trimHistory();
      expect(conversationManager.messages.length).to.be.at.most(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key', () => {
      process.env.OPENAI_API_KEY = '';
      expect(() => new APIHandler('', 'model')).to.throw(
        'API key is required. Please set OPENAI_API_KEY in the .env file.'
      );
    });
  });
});

describe('Logging Functionality', () => {
  let writeFileSyncStub;

  beforeEach(() => {
    // Stub fs.writeFileSync to prevent actual file writing
    writeFileSyncStub = sinon.stub(fs, 'writeFileSync').returns();
  });

  afterEach(() => {
    // Restore the original fs methods after each test
    sinon.restore();
  });

  it('should generate unique conversation IDs', () => {
    const logger = new Logger();
    const userData = { conversations: [{ conversationId: '1' }, { conversationId: '2' }] };
    const newId = logger.generateConversationId(userData);
    expect(newId).to.equal('3');
  });

  it('should log a response without errors', () => {
    const conversationManager = new ConversationManager('user123');
    conversationManager.addMessage('Hello');
    conversationManager.addMessage('Hi, how can I help you?', 'assistant');
    expect(() => conversationManager.logResponse()).to.not.throw();
  });
});

describe('addMessage Edge Cases', () => {
  it('should handle adding empty message content', () => {
    const conversationManager = new ConversationManager();
    expect(() => conversationManager.addMessage('')).to.throw('Message content cannot be empty.');
  });
});

describe('History Loading Edge Cases', () => {
  it('should return an empty array when loading non-existent conversation history', () => {
    const conversationManager = new ConversationManager('user123');
    const history = conversationManager.loadHistory('nonExistentId');
    expect(history).to.deep.equal([]);
  });
});

describe('addMessage Edge Cases', () => {
  it('should throw an error when adding empty message content', () => {
    const conversationManager = new ConversationManager();

    expect(() => {
      conversationManager.addMessage('');
    }).to.throw('Message content cannot be empty.');

    expect(() => {
      conversationManager.addMessage('   ');
    }).to.throw('Message content cannot be empty.');
  });
});
