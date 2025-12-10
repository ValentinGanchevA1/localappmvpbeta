import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import { socketService } from '@/services/socketService';
import { ChatMessage } from '@/types/social';
import { SocialStackParamList } from '@/types/navigation';

type ChatScreenRouteProp = RouteProp<SocialStackParamList, 'Chat'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { userId, username } = route.params;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Mock current user ID (in real app, get from Redux/Auth)
  const currentUserId = 'current_user_123';

  useEffect(() => {
    // Connect to socket room
    socketService.connect(currentUserId);

    // Listen for incoming messages
    const unsubscribe = socketService.onMessage((newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      
      // Send read receipt if message is from the other person
      if (newMessage.senderId === userId) {
        socketService.sendReadReceipt(newMessage.id, newMessage.senderId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: userId,
      content: inputText.trim(),
      timestamp: Date.now(),
      status: 'sent',
    };

    // Optimistic update
    setMessages((prev) => [...prev, newMessage]);
    socketService.sendMessage(newMessage);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === currentUserId;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={[
          styles.messageText,
          isMyMessage ? styles.myMessageText : styles.theirMessageText
        ]}>
          {item.content}
        </Text>
        <View style={styles.footerContainer}>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMyMessage && (
            <Text style={styles.readReceipt}>
              {item.status === 'read' ? '✓✓' : item.status === 'delivered' ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{username}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.TEXT_MUTED}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: COLORS.WHITE,
  },
  headerTitle: { ...TYPOGRAPHY.H3, textAlign: 'center' },
  listContent: { padding: SPACING.MD },
  messageContainer: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: SPACING.SM },
  myMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.PRIMARY, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#E0E0E0', borderBottomLeftRadius: 4 },
  messageText: { ...TYPOGRAPHY.BODY, fontSize: 16 },
  myMessageText: { color: COLORS.WHITE },
  theirMessageText: { color: COLORS.TEXT_PRIMARY },
  footerContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  timestamp: { ...TYPOGRAPHY.CAPTION, fontSize: 10, color: 'rgba(0,0,0,0.5)', marginRight: 4 },
  readReceipt: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  inputContainer: { flexDirection: 'row', padding: SPACING.MD, backgroundColor: COLORS.WHITE, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: SPACING.SM, color: COLORS.TEXT_PRIMARY },
  sendButton: { justifyContent: 'center', paddingHorizontal: SPACING.SM },
  sendButtonText: { ...TYPOGRAPHY.BUTTON, color: COLORS.PRIMARY },
});

export default ChatScreen;
