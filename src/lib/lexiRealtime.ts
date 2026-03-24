import WebSocket from 'ws';
import { UserProfile } from './userLearning';

export interface RealtimeSession {
  sessionId: string;
  isActive: boolean;
  isListening: boolean;
  transcript: string;
  messageId?: string;
}

export interface RealtimeMessage {
  type: string;
  [key: string]: string | boolean | number | object | undefined;
}

export interface RealtimeConfig {
  voice?: string;
  instructions?: string;
  onSessionCreated?: (sessionId: string) => void;
  onSpeechStarted?: () => void;
  onTranscript?: (text: string) => void;
  onAudioDelta?: (audio: Buffer) => void;
  onDone?: (usage: Record<string, unknown>) => void;
  onError?: (error: Record<string, unknown> | Error) => void;
}

/**
 * LEXI Realtime WebSocket Manager
 * Handles voice conversations with x.ai using the realtime API
 * 
 * Usage:
 * const manager = new LexiRealtimeManager({
 *   voice: 'Eve',
 *   instructions: "You are LEXI...",
 *   onTranscript: (text) => console.log(text),
 *   onDone: (usage) => console.log('Done:', usage)
 * });
 * 
 * await manager.connect();
 * manager.sendText("Hello!");
 * manager.sendAudio(pcmBuffer);
 * await manager.disconnect();
 */
export class LexiRealtimeManager {
  private ws: WebSocket | null = null;
  private config: Required<RealtimeConfig>;
  private session: RealtimeSession = {
    sessionId: '',
    isActive: false,
    isListening: false,
    transcript: '',
  };
  private apiKey: string;

  constructor(config: RealtimeConfig = {}) {
    this.apiKey = process.env.GROK_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GROK_API_KEY environment variable must be set');
    }

    this.config = {
      voice: config.voice || 'Eve',
      instructions: config.instructions || 'You are LEXI, a helpful AI assistant. Be conversational and genuine.',
      onSessionCreated: config.onSessionCreated || (() => {}),
      onSpeechStarted: config.onSpeechStarted || (() => {}),
      onTranscript: config.onTranscript || (() => {}),
      onAudioDelta: config.onAudioDelta || (() => {}),
      onDone: config.onDone || (() => {}),
      onError: config.onError || (() => {}),
    };
  }

  /**
   * Connect to x.ai realtime API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection with Bearer auth
        this.ws = new WebSocket('wss://api.x.ai/v1/realtime', {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        });

        this.ws.on('open', () => {
          this.initializeSession();
          resolve();
        });

        this.ws.on('message', (raw: Buffer) => {
          this.handleMessage(raw);
        });

        this.ws.on('error', (error: Error) => {
          console.error('[LEXI Realtime] WebSocket error:', error);
          this.config.onError(error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('[LEXI Realtime] WebSocket closed');
          this.session.isActive = false;
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize the realtime session with configuration
   */
  private initializeSession(): void {
    if (!this.ws) return;

    console.log('[LEXI Realtime] Initializing session...');
    this.send({
      type: 'session.update',
      session: {
        voice: this.config.voice,
        instructions: this.config.instructions,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.85,
          silence_duration_ms: 500,
        },
        tools: [
          { type: 'web_search' },
          { type: 'x_search' },
        ],
        input_audio_transcription: {
          model: 'grok-4-audio',
        },
        audio: {
          input: {
            format: {
              type: 'audio/pcm',
              rate: 24000,
            },
          },
          output: {
            format: {
              type: 'audio/pcm',
              rate: 24000,
            },
          },
        },
      },
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(raw: Buffer): void {
    try {
      const event = JSON.parse(raw.toString());
      console.log('[LEXI Realtime] Event:', event.type);

      switch (event.type) {
        case 'session.created':
          this.session.sessionId = event.session.id;
          this.session.isActive = true;
          console.log('[LEXI Realtime] Session created:', event.session.id);
          this.config.onSessionCreated(event.session.id);
          break;

        case 'input_audio_buffer.speech_started':
          this.session.isListening = true;
          this.session.transcript = '';
          console.log('[LEXI Realtime] Speech started');
          this.config.onSpeechStarted();
          // Cancel any playback when user starts speaking
          this.send({ type: 'response.cancel' });
          break;

        case 'input_audio_buffer.speech_stopped':
          this.session.isListening = false;
          console.log('[LEXI Realtime] Speech stopped');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          const transcribedText = event.transcript;
          this.session.transcript = transcribedText;
          console.log('[LEXI Realtime] Transcription:', transcribedText);
          this.config.onTranscript(transcribedText);
          break;

        case 'response.output_audio.delta':
          // Base64-encoded PCM audio chunk
          try {
            const pcm = Buffer.from(event.delta, 'base64');
            this.config.onAudioDelta(pcm);
          } catch (e) {
            console.error('[LEXI Realtime] Error decoding audio:', e);
          }
          break;

        case 'response.output_audio_transcript.delta':
          process.stdout.write(event.delta);
          break;

        case 'response.done':
          console.log('[LEXI Realtime] Response completed');
          console.log('[LEXI Realtime] Tokens used:', event.usage?.total_tokens);
          this.config.onDone(event.usage);
          break;

        case 'error':
          console.error('[LEXI Realtime] API Error:', event.message);
          this.config.onError(event);
          break;

        default:
          console.log('[LEXI Realtime] Unhandled event type:', event.type);
      }
    } catch (error) {
      console.error('[LEXI Realtime] Error handling message:', error);
    }
  }

  /**
   * Send a message through the WebSocket
   */
  private send(message: RealtimeMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[LEXI Realtime] WebSocket not ready');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send text message to LEXI
   */
  sendText(text: string): void {
    console.log('[LEXI Realtime] Sending text:', text);
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    });
    this.send({ type: 'response.create' });
  }

  /**
   * Send audio buffer (base64 encoded PCM)
   */
  sendAudio(pcmBuffer: Buffer): void {
    const base64Audio = pcmBuffer.toString('base64');
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  /**
   * Commit the audio buffer (signals end of input)
   */
  commitAudio(): void {
    this.send({ type: 'input_audio_buffer.commit' });
  }

  /**
   * Cancel the current response
   */
  cancel(): void {
    this.send({ type: 'response.cancel' });
  }

  /**
   * Get current session info
   */
  getSession(): RealtimeSession {
    return { ...this.session };
  }

  /**
   * Disconnect from the realtime API
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.ws) {
        this.ws.close();
        this.ws.on('close', () => {
          this.ws = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Create a realtime manager with user profile context
 */
export function createLexiRealtimeManager(
  userProfile?: UserProfile,
  config?: RealtimeConfig
): LexiRealtimeManager {
  const instructions = `You are LEXI, an advanced AI assistant.

${userProfile?.name ? `The user's name is ${userProfile.name}.` : ''}

${
  userProfile?.personalityTraits && userProfile.personalityTraits.length > 0
    ? `User traits: ${userProfile.personalityTraits.join(', ')}`
    : ''
}

Be conversational, genuine, and adapt to the user's communication style.
${
  userProfile?.preferences.humor
    ? 'Feel free to use humor when appropriate.'
    : 'Keep responses straightforward.'
}`;

  return new LexiRealtimeManager({
    voice: 'Eve',
    instructions: instructions,
    ...config,
  });
}
