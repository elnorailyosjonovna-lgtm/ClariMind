import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface SavedIdea {
  transcription: string;
  structured: string;
  timestamp: number;
}

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [structured, setStructured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const savedFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved ideas on component mount
  useEffect(() => {
    loadIdeas();
    
    // Cleanup timeout on unmount
    return () => {
      if (savedFeedbackTimeoutRef.current) {
        clearTimeout(savedFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const loadIdeas = async () => {
    try {
      const stored = await AsyncStorage.getItem('ideas');
      if (stored) {
        setIdeas(JSON.parse(stored));
        console.log('Loaded', JSON.parse(stored).length, 'ideas');
      }
    } catch (error) {
      console.error('Failed to load ideas:', error);
    }
  };

  const saveIdea = async (transcriptionText: string, structuredText: string) => {
    try {
      const newIdea: SavedIdea = {
        transcription: transcriptionText,
        structured: structuredText,
        timestamp: Date.now(),
      };

      const updatedIdeas = [newIdea, ...ideas];
      await AsyncStorage.setItem('ideas', JSON.stringify(updatedIdeas));
      setIdeas(updatedIdeas);
      console.log('Idea saved, total ideas:', updatedIdeas.length);

      // Show saved feedback for 2 seconds
      setShowSavedFeedback(true);
      if (savedFeedbackTimeoutRef.current) {
        clearTimeout(savedFeedbackTimeoutRef.current);
      }
      savedFeedbackTimeoutRef.current = setTimeout(() => {
        setShowSavedFeedback(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save idea:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const extractErrorDetails = (error: unknown): { message: string; type: string } => {
    if (error instanceof TypeError) {
      return { message: error.message, type: 'TypeError' };
    }
    if (error instanceof Error) {
      return { message: error.message, type: error.constructor.name };
    }
    return { message: String(error), type: 'Unknown' };
  };

  const getErrorMessage = (error: unknown, responseStatus?: number): string => {
    // Log full technical details
    if (error) {
      const { message, type } = extractErrorDetails(error);
      console.error(`[${type}] ${message}`);
    }

    // Network errors
    if (error instanceof TypeError) {
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        return 'No internet connection. Please check your network.';
      }
    }

    // HTTP status codes
    if (responseStatus === 429) {
      return 'OpenAI quota exceeded. Please check your API credits or plan.';
    }
    if (responseStatus === 401) {
      return 'Authentication failed. Please check your API key.';
    }
    if (responseStatus === 503) {
      return 'OpenAI service is temporarily unavailable. Please try again.';
    }
    if (responseStatus === 400) {
      return 'Invalid request. Please try again.';
    }
    if (responseStatus && responseStatus >= 500) {
      return 'Server error. Please try again later.';
    }
    if (responseStatus !== undefined) {
      return 'Request failed. Please try again.';
    }

    // Permission errors
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('Permission')) {
        return 'Microphone permission denied. Please enable it in settings.';
      }
    }

    return 'Something went wrong. Please try again.';
  };

  const safeErrorMessage = (message: unknown, context: string = ''): string => {
    // Ensure only safe, predefined messages are shown
    const SAFE_MESSAGES = {
      'OpenAI API key not configured': 'OpenAI API key not configured',
      'Could not request microphone permission. Please try again.': 'Could not request microphone permission. Please try again.',
      'Microphone permission denied. Please enable it in app settings.': 'Microphone permission denied. Please enable it in app settings.',
      'Failed to configure audio. Please try again.': 'Failed to configure audio. Please try again.',
      'Failed to prepare recording. Please try again.': 'Failed to prepare recording. Please try again.',
      'Failed to start recording. Please try again.': 'Failed to start recording. Please try again.',
      'Failed to stop recording. Please try again.': 'Failed to stop recording. Please try again.',
      'Transcription response was invalid. Please try again.': 'Transcription response was invalid. Please try again.',
    };

    // If it's a known safe message, return it
    if (typeof message === 'string' && message in SAFE_MESSAGES) {
      return message;
    }

    // If it's an unknown error, log details and return generic message
    if (typeof message === 'string' && message.length > 0) {
      console.error(`[${context || 'Error'}] ${message}`);
    }

    return 'Something went wrong. Please try again.';
  };

  const getDisplayError = (): string | null => {
    // Final safety check before displaying error - ensures no raw error text ever appears
    if (!error) return null;
    
    const ALLOWED_ERRORS = [
      'OpenAI API key not configured',
      'Could not request microphone permission. Please try again.',
      'Microphone permission denied. Please enable it in app settings.',
      'Failed to configure audio. Please try again.',
      'Failed to prepare recording. Please try again.',
      'Failed to start recording. Please try again.',
      'Failed to stop recording. Please try again.',
      'Transcription response was invalid. Please try again.',
      'No internet connection. Please check your network.',
      'OpenAI quota exceeded. Please check your API credits or plan.',
      'Authentication failed. Please check your API key.',
      'OpenAI service is temporarily unavailable. Please try again.',
      'Invalid request. Please try again.',
      'Server error. Please try again later.',
      'Request failed. Please try again.',
      'Something went wrong. Please try again.',
    ];

    // Only show if it's in our allowed list
    if (ALLOWED_ERRORS.includes(error)) {
      return error;
    }

    // If error is not in whitelist, log it and show generic message
    console.error('Unexpected error message attempted to display:', error);
    return 'Something went wrong. Please try again.';
  };

  const transcribeAudio = async (audioUri: string): Promise<string | null> => {
    try {
      setIsTranscribing(true);
      setError(null);
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        const errMsg = 'OpenAI API key not configured';
        setError(safeErrorMessage(errMsg, 'API Key Check'));
        setIsTranscribing(false);
        return null;
      }

      console.log('Starting transcription for:', audioUri);

      // Create FormData with the audio file URI
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      console.log('Sending request to OpenAI API...');

      // Send to OpenAI API
      let transcriptionResponse;
      try {
        transcriptionResponse = await fetch(
          'https://api.openai.com/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          }
        );
      } catch (networkError) {
        console.error('Network error during transcription:', networkError);
        setError(getErrorMessage(networkError));
        setIsTranscribing(false);
        return null;
      }

      console.log('Response status:', transcriptionResponse.status);

      if (!transcriptionResponse.ok) {
        let errorMessage = 'Failed to transcribe audio';
        
        // Check for quota or rate limit errors
        if (transcriptionResponse.status === 429) {
          console.log('Rate limit error (429)');
          errorMessage = getErrorMessage(null, 429);
        } else if (transcriptionResponse.status === 401) {
          console.log('Authentication error (401)');
          errorMessage = getErrorMessage(null, 401);
        } else if (transcriptionResponse.status === 503) {
          console.log('Service unavailable (503)');
          errorMessage = getErrorMessage(null, 503);
        } else {
          // Try to parse error response for logging
          try {
            const errorData = await transcriptionResponse.json();
            console.log('Error response:', errorData);
            
            if (errorData.error?.code === 'insufficient_quota') {
              errorMessage = getErrorMessage(null, 429);
            } else {
              // Log technical error but show generic message
              console.log('API error message:', errorData.error?.message);
              errorMessage = getErrorMessage(null, transcriptionResponse.status);
            }
          } catch (parseError) {
            console.log('Could not parse error response:', parseError);
            errorMessage = getErrorMessage(null, transcriptionResponse.status);
          }
        }
        
        setError(errorMessage);
        setIsTranscribing(false);
        return null;
      }

      let data;
      try {
        data = await transcriptionResponse.json();
      } catch (parseError) {
        console.error('Failed to parse transcription response:', parseError);
        setError(safeErrorMessage('Transcription response was invalid. Please try again.', 'Transcription Parse'));
        setIsTranscribing(false);
        return null;
      }

      console.log('Transcription success:', data);
      setTranscription(data.text);
      setIsTranscribing(false);
      
      return data.text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Transcription error:', errorMsg);
      setError(getErrorMessage(error));
      setIsTranscribing(false);
      return null;
    }
  };

  const structureTranscription = async (text: string): Promise<void> => {
    try {
      if (!text) {
        console.log('No text provided for structuring');
        return;
      }

      setIsStructuring(true);
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        console.log('API key not available for structuring');
        setIsStructuring(false);
        // Save transcription without structure
        await saveIdea(text, '');
        return;
      }

      console.log('Starting structuring...');

      let response;
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are an assistant that converts messy spoken thoughts into structured ideas.

Organize the text into:
- Idea
- Features
- Purpose
- Next Steps

Keep it clear and concise.`,
              },
              {
                role: 'user',
                content: text,
              },
            ],
            temperature: 0.7,
          }),
        });
      } catch (networkError) {
        console.error('Network error during structuring:', networkError);
        setIsStructuring(false);
        // Save transcription without structure on network failure
        await saveIdea(text, '');
        return;
      }

      console.log('Structure response status:', response.status);

      if (!response.ok) {
        console.log(`Structuring failed with status ${response.status}`);
        
        // Log structured error for debugging
        try {
          const errorData = await response.json();
          console.log('Structuring error response:', errorData);
        } catch (_parseError) {
          // Could not parse error response, continue anyway
          if (_parseError instanceof Error) {
            console.log('Could not parse structuring error:', _parseError.message);
          } else {
            console.log('Could not parse structuring error');
          }
        }
        
        setIsStructuring(false);
        // Save transcription without structure - don't overwrite error with structuring failure
        await saveIdea(text, '');
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse structuring response:', parseError);
        setIsStructuring(false);
        // Save transcription without structure
        await saveIdea(text, '');
        return;
      }

      console.log('Structure success:', data);
      const structuredText = data.choices?.[0]?.message?.content || '';
      setStructured(structuredText);
      setIsStructuring(false);

      // Save idea with structure
      await saveIdea(text, structuredText);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Structure error:', errorMsg);
      setIsStructuring(false);
      // Save transcription without structure - prevent crash
      await saveIdea(text, '');
    }
  };

  const handleToggleRecording = async () => {
    try {
      if (!isRecording) {
        // Prevent multiple recording instances
        if (isPreparingRecording || recordingRef.current) {
          console.log('Recording already in progress or being prepared');
          return;
        }

        // Start recording - clear previous state
        setError(null);
        setTranscription(null);
        setStructured(null);
        setIsPreparingRecording(true);

        // Start recording
        let permission;
        try {
          permission = await Audio.requestPermissionsAsync();
        } catch (permissionError) {
          console.error('Permission request error:', permissionError);
          setError(safeErrorMessage('Could not request microphone permission. Please try again.', 'Permission Request'));
          setIsPreparingRecording(false);
          return;
        }

        if (!permission.granted) {
          setError(safeErrorMessage('Microphone permission denied. Please enable it in app settings.', 'Permission Check'));
          setIsPreparingRecording(false);
          return;
        }

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        } catch (audioModeError) {
          console.error('Failed to set audio mode:', audioModeError);
          setError(safeErrorMessage('Failed to configure audio. Please try again.', 'Audio Mode'));
          setIsPreparingRecording(false);
          return;
        }

        const recording = new Audio.Recording();
        console.log('Creating new recording instance');
        
        try {
          await recording.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          console.log('Recording prepared successfully');
        } catch (prepareError) {
          console.error('Failed to prepare recording:', prepareError);
          setError(safeErrorMessage('Failed to prepare recording. Please try again.', 'Recording Prepare'));
          setIsPreparingRecording(false);
          return;
        }

        try {
          await recording.startAsync();
        } catch (startError) {
          console.error('Failed to start recording:', startError);
          setError(safeErrorMessage('Failed to start recording. Please try again.', 'Recording Start'));
          setIsPreparingRecording(false);
          return;
        }

        recordingRef.current = recording;
        setIsRecording(true);
        setIsPreparingRecording(false);
        console.log('Recording started');
      } else {
        // Stop recording
        if (!recordingRef.current) {
          console.log('No active recording to stop');
          setIsRecording(false);
          return;
        }

        try {
          console.log('Stopping recording');
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          console.log('Recording stopped, URI:', uri);
          
          // Reset recording state completely
          recordingRef.current = null;
          setIsRecording(false);

          if (uri) {
            // Start transcription process
            const transcribedText = await transcribeAudio(uri);
            
            // Only attempt structuring if transcription succeeded
            if (transcribedText) {
              await structureTranscription(transcribedText);
            }
          }
        } catch (stopError) {
          console.error('Failed to stop recording:', stopError);
          setError(safeErrorMessage('Failed to stop recording. Please try again.', 'Recording Stop'));
          recordingRef.current = null;
          setIsRecording(false);
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      const errorMsg = getErrorMessage(error);
      setError(errorMsg);
      recordingRef.current = null;
      setIsRecording(false);
      setIsPreparingRecording(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {isRecording && (
            <View style={styles.statusIndicator}>
              <ThemedText type="title" style={styles.recordingText}>
                ⏺️ Recording...
              </ThemedText>
            </View>
          )}

          <Pressable
            onPress={handleToggleRecording}
            disabled={isTranscribing || isStructuring || isPreparingRecording}
            style={[
              styles.button,
              isRecording && styles.buttonActive,
              (isTranscribing || isStructuring || isPreparingRecording) && styles.buttonDisabled,
            ]}
          >
            <ThemedText style={styles.buttonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </ThemedText>
          </Pressable>

          {isTranscribing && (
            <View style={styles.statusIndicator}>
              <ThemedText type="subtitle" style={styles.loadingText}>
                ⏳ Transcribing...
              </ThemedText>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{getDisplayError()}</ThemedText>
            </View>
          )}

          {transcription && (
            <View style={styles.transcriptionContainer}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>🎙️ Transcription</ThemedText>
              <ThemedText style={styles.transcriptionText}>{transcription}</ThemedText>
            </View>
          )}

          {isStructuring && (
            <View style={styles.statusIndicator}>
              <ThemedText type="subtitle" style={styles.loadingText}>
                ✨ Structuring...
              </ThemedText>
            </View>
          )}

          {structured && (
            <View style={styles.structuredContainer}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>📋 Structured Result</ThemedText>
              <ThemedText style={styles.structuredText}>{structured}</ThemedText>
            </View>
          )}

          {showSavedFeedback && (
            <View style={styles.savedFeedback}>
              <ThemedText style={styles.savedFeedbackText}>✅ Saved</ThemedText>
            </View>
          )}

          <View style={styles.historySection}>
            <ThemedText type="subtitle" style={styles.historyTitle}>
              💾 Idea History
            </ThemedText>
            {ideas.length > 0 ? (
              <View>
                <ThemedText style={styles.historyCount}>
                  {ideas.length} saved idea{ideas.length !== 1 ? 's' : ''}
                </ThemedText>
                <FlatList
                  data={ideas}
                  keyExtractor={(_, index) => `idea_${index}_${ideas.length}`}
                  renderItem={({ item }) => (
                    <View style={styles.historyItem}>
                      <ThemedText style={styles.historyTime}>
                        {formatTime(item.timestamp)}
                      </ThemedText>
                      <ThemedText style={styles.historyTranscription}>
                        {item.transcription}
                      </ThemedText>
                      <View style={styles.historyStructuredBox}>
                        <ThemedText style={styles.historyStructured}>
                          {item.structured}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  scrollEnabled={false}
                  nestedScrollEnabled={false}
                  style={styles.historyList}
                />
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <ThemedText style={styles.emptyStateText}>
                  No saved ideas yet. Start recording to create your first idea!
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingVertical: 16,
  },
  content: {
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  recordingText: {
    marginBottom: 0,
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '700',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#FF3333',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  loadingText: {
    color: '#FFC107',
    marginTop: 0,
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
  },
  errorText: {
    fontSize: 14,
    color: '#CC0000',
    lineHeight: 20,
  },
  transcriptionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    maxWidth: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  transcriptionText: {
    marginTop: 0,
    fontSize: 15,
    lineHeight: 22,
    color: '#0D47A1',
    fontWeight: '500',
  },
  structuredContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    maxWidth: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#388E3C',
  },
  structuredText: {
    marginTop: 0,
    fontSize: 15,
    lineHeight: 22,
    color: '#1B5E20',
    fontWeight: '500',
  },
  savedFeedback: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#C8E6C9',
    alignSelf: 'center',
  },
  savedFeedbackText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ideasCountContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3E5F5',
  },
  ideasCountText: {
    fontSize: 12,
    color: '#7B1FA2',
    fontWeight: '500',
  },
  historySection: {
    marginTop: 32,
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  historyTitle: {
    marginBottom: 16,
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  historyCount: {
    marginBottom: 12,
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  historyList: {
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  historyTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  historyTranscription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  historyStructuredBox: {
    backgroundColor: '#F1F8E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  historyStructured: {
    fontSize: 13,
    color: '#1B5E20',
    lineHeight: 18,
    fontWeight: '500',
  },
});
