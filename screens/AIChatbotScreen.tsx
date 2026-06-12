import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import {
  getChatSessionDetail,
  getChatSessions,
  sendChatMessage,
  deleteChatSession
} from '../services/chat.service';
import type { ChatSession, UIChatMessage } from '../types/chat';

const WELCOME_MESSAGE: UIChatMessage = {
  id: 'welcome',
  text: 'Xin chào! Mình là trợ lý sức khỏe AI. Bạn có thể hỏi mình về thực đơn, calories, bài tập, lịch tập hoặc thói quen lành mạnh hôm nay.',
  isUser: false,
  timestamp: new Date(),
};

export function AIChatbotScreen() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<UIChatMessage>>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<UIChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');

  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  async function loadSessions() {
    try {
      setLoadingSessions(true);
      const result = await getChatSessions();
      setSessions(result);
    } catch (error) {
      console.error('loadSessions error:', error);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleSelectSession(sessionId: string) {
    try {
      setSelectedSessionId(sessionId);
      setLoadingDetail(true);

      const session = await getChatSessionDetail(sessionId);

      const mappedMessages: UIChatMessage[] = session.messages.map((item, index) => ({
        id: `${session._id}-${index}`,
        text: item.content,
        isUser: item.role === 'user',
        timestamp: new Date(),
      }));

      setMessages(mappedMessages.length > 0 ? mappedMessages : [WELCOME_MESSAGE]);
    } catch (error) {
      console.error('handleSelectSession error:', error);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteChatSession(sessionId);

      setSessions(prev => prev.filter(item => item._id !== sessionId));

      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error('delete session error:', error);
    }
  }

  function handleNewChat() {
    setSelectedSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputText('');
  }

  async function handleSend() {
    const content = inputText.trim();
    if (!content || sending) return;

    const userMessage: UIChatMessage = {
      id: `user-${Date.now()}`,
      text: content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSending(true);

    try {
      const result = await sendChatMessage({
        message: content,
        sessionId: selectedSessionId,
      });

      if (!selectedSessionId) {
        setSelectedSessionId(result.sessionId);
        loadSessions();
      }

      const aiMessage: UIChatMessage = {
        id: `ai-${Date.now()}`,
        text: result.message.content,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('send message error:', error);

      const errorMessage: UIChatMessage = {
        id: `error-${Date.now()}`,
        text: 'Xin lỗi, hiện tại mình chưa xử lý được tin nhắn này. Bạn thử lại sau nhé.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.headerTitleRow}>
              <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
              <Text style={styles.title}>Trợ lý sức khỏe AI</Text>
            </View>

            <Text style={styles.subtitle}>
              Dinh dưỡng, tập luyện & thói quen
            </Text>
          </View>

          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionList}
        >
          {loadingSessions ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.sessionChip,
                  !selectedSessionId && styles.sessionChipActive,
                ]}
                onPress={handleNewChat}
              >
                <Text
                  style={[
                    styles.sessionChipText,
                    !selectedSessionId && styles.sessionChipTextActive,
                  ]}
                >
                  Chat mới
                </Text>
              </TouchableOpacity>

              {sessions.map((session) => {
                const active = selectedSessionId === session._id;

                return (
                  <View
                    key={session._id}
                    style={[
                      styles.sessionChip,
                      active && styles.sessionChipActive,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.sessionTitleButton}
                      onPress={() => handleSelectSession(session._id)}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.sessionChipText,
                          active && styles.sessionChipTextActive,
                        ]}
                      >
                        {session.title || 'Cuộc trò chuyện'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteSession(session._id)}
                      style={styles.deleteSessionButton}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={active ? '#FFF' : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>

      {loadingDetail ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải hội thoại...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {sending && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.typingText}>AI đang trả lời...</Text>
        </View>
      )}

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Chatbot chỉ mang tính tham khảo về dinh dưỡng & luyện tập,
          không thay thế tư vấn y tế chuyên môn.
        </Text>
      </View>

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TextInput
          style={styles.input}
          placeholder="Hỏi về dinh dưỡng, tập luyện..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!sending}
          onSubmitEditing={handleSend}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: UIChatMessage }) {
  return (
    <View
      style={[
        styles.bubble,
        message.isUser ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          message.isUser ? styles.userBubbleText : styles.aiBubbleText,
        ]}
      >
        {message.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimerBox: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: '#FFF7E6',
    borderTopWidth: 1,
    borderTopColor: '#FFE0A3',
  },

  disclaimerText: {
    fontSize: 12,
    color: '#8A6D3B',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  newChatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sessionList: {
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },

  sessionChip: {
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    paddingRight: 6,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },

  sessionTitleButton: {
    maxWidth: 130,
  },

  deleteSessionButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sessionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  sessionChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  sessionChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  bubble: {
    maxWidth: '85%',
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },

  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    ...SHADOWS.sm,
  },

  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },

  userBubbleText: {
    color: '#FFF',
  },

  aiBubbleText: {
    color: COLORS.text,
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },

  typingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },

  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.6,
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },

  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { COLORS, SPACING, SHADOWS } from '../constants/theme';
// import { MOCK_CHAT_MESSAGES } from '../constants/mockData';
// import type { ChatMessage } from '../types';

// export function AIChatbotScreen() {
//   const insets = useSafeAreaInsets();
//   const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
//   const [inputText, setInputText] = useState('');

//   const handleSend = () => {
//     if (!inputText.trim()) return;
//     const userMessage: ChatMessage = {
//       id: Date.now().toString(),
//       text: inputText.trim(),
//       isUser: true,
//       timestamp: new Date(),
//     };
//     setMessages((prev) => [...prev, userMessage]);
//     setInputText('');

//     // Mock AI response
//     setTimeout(() => {
//       const aiMessage: ChatMessage = {
//         id: (Date.now() + 1).toString(),
//         text: 'Tôi có thể hỗ trợ bạn về dinh dưỡng, tập luyện và thói quen lành mạnh. Bạn muốn tìm hiểu thêm về điều gì?',
//         isUser: false,
//         timestamp: new Date(),
//       };
//       setMessages((prev) => [...prev, aiMessage]);
//     }, 800);
//   };

//   return (
//     <KeyboardAvoidingView
//       style={[styles.container, { paddingTop: insets.top }]}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//       keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//     >
//       <View style={styles.header}>
//         <Ionicons name="chatbubbles" size={24} color={COLORS.primary} />
//         <Text style={styles.title}>Trợ lý sức khỏe AI</Text>
//         <Text style={styles.subtitle}>Dinh dưỡng, tập luyện & thói quen</Text>
//       </View>

//       <FlatList
//         data={messages}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => <MessageBubble message={item} />}
//         contentContainerStyle={styles.messageList}
//         showsVerticalScrollIndicator={false}
//       />

//       <View style={[styles.inputRow, { paddingBottom: insets.bottom + SPACING.md }]}>
//         <TextInput
//           style={styles.input}
//           placeholder="Hỏi về dinh dưỡng, tập luyện..."
//           placeholderTextColor={COLORS.textMuted}
//           value={inputText}
//           onChangeText={setInputText}
//           multiline
//           maxLength={500}
//           onSubmitEditing={handleSend}
//         />
//         <TouchableOpacity
//           style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
//           onPress={handleSend}
//           disabled={!inputText.trim()}
//           activeOpacity={0.8}
//         >
//           <Ionicons name="send" size={22} color="#FFF" />
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// function MessageBubble({ message }: { message: ChatMessage }) {
//   return (
//     <View
//       style={[
//         styles.bubble,
//         message.isUser ? styles.userBubble : styles.aiBubble,
//       ]}
//     >
//       <Text
//         style={[
//           styles.bubbleText,
//           message.isUser ? styles.userBubbleText : styles.aiBubbleText,
//         ]}
//       >
//         {message.text}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   header: {
//     padding: SPACING.md,
//     paddingBottom: SPACING.sm,
//     backgroundColor: COLORS.surface,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: '700',
//     color: COLORS.text,
//     marginTop: SPACING.xs,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//     marginTop: SPACING.xs,
//   },
//   messageList: {
//     padding: SPACING.md,
//     paddingBottom: SPACING.lg,
//   },
//   bubble: {
//     maxWidth: '85%',
//     padding: SPACING.md,
//     borderRadius: 16,
//     marginBottom: SPACING.sm,
//   },
//   userBubble: {
//     alignSelf: 'flex-end',
//     backgroundColor: COLORS.primary,
//     borderBottomRightRadius: 4,
//   },
//   aiBubble: {
//     alignSelf: 'flex-start',
//     backgroundColor: COLORS.surface,
//     borderBottomLeftRadius: 4,
//     ...SHADOWS.sm,
//   },
//   bubbleText: {
//     fontSize: 16,
//     lineHeight: 22,
//   },
//   userBubbleText: {
//     color: '#FFF',
//   },
//   aiBubbleText: {
//     color: COLORS.text,
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     padding: SPACING.md,
//     backgroundColor: COLORS.surface,
//     borderTopWidth: 1,
//     borderTopColor: COLORS.border,
//     gap: SPACING.sm,
//   },
//   input: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     borderRadius: 24,
//     paddingHorizontal: SPACING.md,
//     paddingVertical: SPACING.sm,
//     fontSize: 16,
//     color: COLORS.text,
//     maxHeight: 100,
//   },
//   sendButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: COLORS.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   sendButtonDisabled: {
//     backgroundColor: COLORS.textMuted,
//     opacity: 0.6,
//   },
// });
