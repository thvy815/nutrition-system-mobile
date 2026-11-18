import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';

import { Badge, BottomSheet, IconButton, ScreenHeader } from '../components';
import { BORDER_RADIUS, COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import {
  deleteChatSession,
  getChatSessionDetail,
  getChatSessions,
  sendChatMessage,
} from '../services/chat.service';
import { getErrorMessage, isApiError } from '../services/api';
import type { ChatCitation, ChatSession, UIChatMessage } from '../types/chat';

const WELCOME_MESSAGE: UIChatMessage = {
  id: 'welcome',
  text:
    'Xin chào! Mình là trợ lý sức khỏe AI. Bạn có thể hỏi về **thực đơn, calo, bài tập, lịch tập** hoặc khuyến nghị vận động của WHO, Bộ Y tế.',
  isUser: false,
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'Người trưởng thành nên vận động bao nhiêu phút mỗi tuần?',
  'Hôm nay mình nên ăn gì để giảm cân?',
  'Lịch tập hôm nay của mình là gì?',
  'Một ngày nên ăn bao nhiêu muối?',
];

const REFERENCES_HEADER = 'Nguồn tham khảo:';

function hostOf(url: string) {
  const m = url.match(/^https?:\/\/([^/?#]+)/i);
  return m ? m[1].replace(/^www\./, '') : url;
}

/** Bỏ khối "Nguồn tham khảo:" ở cuối khi đã hiển thị nguồn dạng chip. */
function stripReferences(text: string) {
  const idx = text.lastIndexOf(REFERENCES_HEADER);
  return idx > 0 ? text.slice(0, idx).trimEnd() : text;
}

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
  const [activeCitation, setActiveCitation] = useState<ChatCitation | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setSessions(await getChatSessions());
    } catch (error) {
      if (__DEV__) console.warn('loadSessions error:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    try {
      setSelectedSessionId(sessionId);
      setLoadingDetail(true);
      const session = await getChatSessionDetail(sessionId);
      const mapped: UIChatMessage[] = session.messages.map((item, index) => ({
        id: `${session._id}-${index}`,
        text: item.content,
        isUser: item.role === 'user',
        timestamp: new Date(),
        dataSource: item.dataSource,
      }));
      setMessages(mapped.length ? mapped : [WELCOME_MESSAGE]);
    } catch (error) {
      Alert.alert('Lỗi', getErrorMessage(error, 'Không tải được hội thoại'));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      Alert.alert('Xóa đoạn chat', 'Bạn có chắc chắn muốn xóa đoạn chat này không?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChatSession(sessionId);
              setSessions((prev) => prev.filter((s) => s._id !== sessionId));
              if (selectedSessionId === sessionId) {
                setSelectedSessionId(null);
                setMessages([WELCOME_MESSAGE]);
              }
            } catch (error) {
              Alert.alert('Lỗi', getErrorMessage(error));
            }
          },
        },
      ]);
    },
    [selectedSessionId]
  );

  const handleNewChat = useCallback(() => {
    setSelectedSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setInputText('');
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || sending) return;

      setMessages((prev) => [
        ...prev.filter((m) => !m.failed),
        { id: `user-${Date.now()}`, text: content, isUser: true, timestamp: new Date() },
      ]);
      setInputText('');
      setSending(true);

      try {
        const result = await sendChatMessage({ message: content, sessionId: selectedSessionId });

        if (!selectedSessionId) {
          setSelectedSessionId(result.sessionId);
          loadSessions();
        }

        const citations = result.message.citations ?? [];
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            text: citations.length ? stripReferences(result.message.content) : result.message.content,
            isUser: false,
            timestamp: new Date(),
            citations,
            disclaimer: result.message.disclaimer,
            grounding: result.message.grounding,
            dataSource: result.message.dataSource,
          },
        ]);
      } catch (error) {
        const unreachable = isApiError(error) && error.code === 'GEMINI_UNREACHABLE';
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            text: unreachable
              ? 'Máy chủ AI đang bận hoặc không kết nối được. Bạn thử gửi lại sau ít phút nhé.'
              : getErrorMessage(error, 'Xin lỗi, mình chưa xử lý được tin nhắn này.'),
            isUser: false,
            timestamp: new Date(),
            failed: true,
            retryText: content,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [sending, selectedSessionId, loadSessions]
  );

  const handleRetry = useCallback(
    (text: string) => {
      // Bỏ tin nhắn user cuối (sẽ được gửi lại) + tin lỗi.
      setMessages((prev) => {
        const next = prev.filter((m) => !m.failed);
        const last = next[next.length - 1];
        return last?.isUser && last.text === text ? next.slice(0, -1) : next;
      });
      send(text);
    },
    [send]
  );

  const renderItem = useCallback(
    ({ item }: { item: UIChatMessage }) => (
      <MessageBubble message={item} onCitation={setActiveCitation} onRetry={handleRetry} />
    ),
    [handleRetry]
  );

  const showSuggestions = messages.length === 1 && messages[0].id === 'welcome' && !sending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Trợ lý AI"
        subtitle="Dựa trên tài liệu WHO, Bộ Y tế, Viện Dinh dưỡng"
        right={
          <IconButton
            icon="add"
            onPress={handleNewChat}
            color={COLORS.textInverse}
            background={COLORS.primary}
            accessibilityLabel="Cuộc trò chuyện mới"
          />
        }
      />

      <View style={styles.sessionBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionList}
        >
          <TouchableOpacity
            style={[styles.sessionChip, !selectedSessionId && styles.sessionChipActive]}
            onPress={handleNewChat}
          >
            <Ionicons
              name="sparkles"
              size={14}
              color={!selectedSessionId ? COLORS.textInverse : COLORS.primary}
            />
            <Text style={[styles.sessionText, !selectedSessionId && styles.sessionTextActive]}>
              Chat mới
            </Text>
          </TouchableOpacity>

          {loadingSessions && !sessions.length ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.sessionLoading} />
          ) : null}

          {sessions.map((s) => {
            const active = selectedSessionId === s._id;
            return (
              <View key={s._id} style={[styles.sessionChip, active && styles.sessionChipActive]}>
                <TouchableOpacity onPress={() => handleSelectSession(s._id)} style={styles.sessionTitleBtn}>
                  <Text
                    numberOfLines={1}
                    style={[styles.sessionText, active && styles.sessionTextActive]}
                  >
                    {s.title || 'Cuộc trò chuyện'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteSession(s._id)}
                  hitSlop={8}
                  accessibilityLabel="Xóa đoạn chat"
                >
                  <Ionicons name="close" size={14} color={active ? COLORS.textInverse : COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {loadingDetail ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.mutedText}>Đang tải hội thoại...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={12}
          windowSize={9}
          ListFooterComponent={
            <>
              {showSuggestions ? (
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((q) => (
                    <TouchableOpacity key={q} style={styles.suggestion} onPress={() => send(q)}>
                      <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.primaryDark} />
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        {q}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {sending ? (
                <View style={styles.typing}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.mutedText}>AI đang tra cứu tài liệu & trả lời...</Text>
                </View>
              ) : null}
            </>
          }
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: SPACING.sm + (Platform.OS === 'ios' ? 0 : 4) }]}>
        <TextInput
          style={styles.input}
          placeholder="Hỏi về dinh dưỡng, tập luyện..."
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendDisabled]}
          onPress={() => send(inputText)}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
          accessibilityLabel="Gửi"
        >
          <Ionicons name="send" size={20} color={COLORS.textInverse} />
        </TouchableOpacity>
      </View>

      <BottomSheet
        visible={!!activeCitation}
        onClose={() => setActiveCitation(null)}
        title={activeCitation?.title ?? ''}
        subtitle={[activeCitation?.org, activeCitation?.year].filter(Boolean).join(' · ')}
      >
        {activeCitation ? (
          <View style={styles.citeSheet}>
            <Badge label={`Mã nguồn ${activeCitation.id}`} tone="info" />
            {activeCitation.section ? (
              <Text style={styles.citeSection}>Mục: {activeCitation.section}</Text>
            ) : null}
            {activeCitation.url ? (
              <TouchableOpacity
                style={styles.citeLink}
                onPress={() => Linking.openURL(activeCitation.url!)}
              >
                <Ionicons name="open-outline" size={16} color={COLORS.secondary} />
                <View style={styles.citationBody}>
                  <Text style={styles.citeLinkText}>Mở tài liệu gốc</Text>
                  <Text style={styles.citationMeta} numberOfLines={1}>
                    {hostOf(activeCitation.url)}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Text style={styles.mutedText}>Tài liệu này không có đường dẫn công khai.</Text>
            )}
          </View>
        ) : null}
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */

const markdownStyles = {
  body: { ...TYPOGRAPHY.body, color: COLORS.text },
  strong: { fontWeight: '700' as const, color: COLORS.text },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginBottom: 4 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  heading3: { ...TYPOGRAPHY.h3, marginVertical: 4 },
  link: { color: COLORS.secondary },
};

const GROUNDED_ACTIONS = new Set(['passed', 'regenerated', 'stripped']);

const MessageBubble = memo(function MessageBubble({
  message,
  onCitation,
  onRetry,
}: {
  message: UIChatMessage;
  onCitation: (c: ChatCitation) => void;
  onRetry: (text: string) => void;
}) {
  const text = message.text.replace(/\\n/g, '\n');

  if (message.isUser) {
    return (
      <View style={[styles.bubble, styles.userBubble]}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    );
  }

  const verified = message.grounding?.checked && GROUNDED_ACTIONS.has(message.grounding.action);
  const hasMeta = verified || message.dataSource === 'hybrid' || !!message.citations?.length;

  return (
    <View style={styles.aiRow}>
      <View style={styles.avatar}>
        <Ionicons name="leaf" size={14} color={COLORS.primaryDark} />
      </View>
      <View style={[styles.bubble, styles.aiBubble, message.failed && styles.failedBubble]}>
        <Markdown style={markdownStyles}>{text}</Markdown>

        {message.failed && message.retryText ? (
          <TouchableOpacity style={styles.retry} onPress={() => onRetry(message.retryText!)}>
            <Ionicons name="refresh" size={14} color={COLORS.error} />
            <Text style={styles.retryText}>Gửi lại</Text>
          </TouchableOpacity>
        ) : null}

        {hasMeta ? (
          <View style={styles.metaRow}>
            {verified ? <Badge label="Đã kiểm chứng" tone="success" icon="shield-checkmark" /> : null}
            {message.dataSource === 'hybrid' ? (
              <Badge label="Dữ liệu hệ thống" tone="info" icon="server-outline" />
            ) : null}
          </View>
        ) : null}

        {message.citations?.length ? (
          <View style={styles.citations}>
            <Text style={styles.citationsTitle}>Nguồn tham khảo</Text>
            {message.citations.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.citation}
                onPress={() => onCitation(c)}
                activeOpacity={0.7}
              >
                <Text style={styles.citationId}>{c.id}</Text>
                <View style={styles.citationBody}>
                  <Text style={styles.citationTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  {c.org || c.year ? (
                    <Text style={styles.citationMeta} numberOfLines={1}>
                      {[c.org, c.year].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {message.disclaimer ? (
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.disclaimerText}>{message.disclaimer}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  sessionBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  sessionList: { paddingHorizontal: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  sessionLoading: { marginHorizontal: SPACING.sm },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    maxWidth: 200,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sessionTitleBtn: { flexShrink: 1 },
  sessionText: { ...TYPOGRAPHY.captionStrong, color: COLORS.text },
  sessionTextActive: { color: COLORS.textInverse },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  mutedText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },

  messageList: { padding: SPACING.md, paddingBottom: SPACING.lg, gap: SPACING.sm + 4 },

  bubble: { maxWidth: '85%', borderRadius: BORDER_RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  userText: { ...TYPOGRAPHY.body, color: COLORS.textInverse },
  aiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBubble: {
    flexShrink: 1,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    ...SHADOWS.sm,
  },
  failedBubble: { backgroundColor: COLORS.errorSoft },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  retryText: { ...TYPOGRAPHY.captionStrong, color: COLORS.error },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  citations: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  citationsTitle: { ...TYPOGRAPHY.small, color: COLORS.textMuted, textTransform: 'uppercase' },
  citation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
  },
  citationId: {
    ...TYPOGRAPHY.small,
    fontWeight: '700',
    color: COLORS.secondary,
    backgroundColor: COLORS.infoSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  citationBody: { flex: 1, minWidth: 0 },
  citationTitle: { ...TYPOGRAPHY.caption, color: COLORS.text },
  citationMeta: { ...TYPOGRAPHY.small, color: COLORS.textMuted },
  disclaimer: { flexDirection: 'row', gap: 4, marginTop: SPACING.sm },
  disclaimerText: { ...TYPOGRAPHY.small, color: COLORS.textMuted, flex: 1 },

  suggestions: { gap: SPACING.sm, marginTop: SPACING.sm },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
  },
  suggestionText: { ...TYPOGRAPHY.caption, color: COLORS.text, flex: 1 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    paddingTop: 11,
    paddingBottom: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },

  citeSheet: { gap: SPACING.sm + 4 },
  citeSection: { ...TYPOGRAPHY.body, color: COLORS.text },
  citeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.infoSoft,
  },
  citeLinkText: { ...TYPOGRAPHY.captionStrong, color: COLORS.secondary },
});
