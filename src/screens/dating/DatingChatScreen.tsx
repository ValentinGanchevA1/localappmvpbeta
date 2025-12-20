// src/screens/dating/DatingChatScreen.tsx
// Full-featured Dating Chat Screen with messaging

import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {DatingStackParamList} from '@/navigation/DatingNavigator';
import {COLORS, SPACING} from '@/config/theme';
import {useAppSelector} from '@/store/hooks';

// ============================================
// Types
// ============================================

type DatingChatScreenRouteProp = RouteProp<DatingStackParamList, 'DatingChat'>;

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

// ============================================
// Mock Messages
// ============================================

const generateMockMessages = (userId: string, currentUserId: string): Message[] => {
  const messages: Message[] = [
    {
      id: '1',
      text: 'Hey! I saw we matched. Love your profile! 😊',
      senderId: userId,
      timestamp: new Date(Date.now() - 3600000 * 24),
      status: 'read',
    },
    {
      id: '2',
      text: "Hi! Thanks! I noticed we both love hiking. What's your favorite trail?",
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 3600000 * 23),
      status: 'read',
    },
    {
      id: '3',
      text: "There's this amazing trail at Mount Tam with incredible views. Have you been?",
      senderId: userId,
      timestamp: new Date(Date.now() - 3600000 * 22),
      status: 'read',
    },
    {
      id: '4',
      text: "I haven't! But I've heard great things. Would love to check it out sometime.",
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 3600000 * 20),
      status: 'read',
    },
    {
      id: '5',
      text: "Maybe we could go together? There's a coffee spot nearby too ☕",
      senderId: userId,
      timestamp: new Date(Date.now() - 3600000 * 18),
      status: 'read',
    },
  ];
  return messages;
};

// ============================================
// Message Bubble Component
// ============================================

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  avatar?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  avatar,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  };

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && showAvatar && (
        <Image
          source={{uri: avatar || 'https://via.placeholder.com/36'}}
          style={styles.messageAvatar}
        />
      )}
      {!isOwn && !showAvatar && <View style={styles.messageAvatarPlaceholder} />}

      <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
          {message.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(message.timestamp)}
          </Text>
          {isOwn && (
            <Icon
              name={message.status === 'read' ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={message.status === 'read' ? '#51CF66' : 'rgba(255,255,255,0.6)'}
              style={styles.statusIcon}
            />
          )}
        </View>
      </View>
    </View>
  );
};

// ============================================
// Main Component
// ============================================

export const DatingChatScreen: React.FC = () => {
  const route = useRoute<DatingChatScreenRouteProp>();
  const navigation = useNavigation();
  const {matchId, userId, username} = route.params;
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = useAppSelector(state => state.auth.user?.id || 'current-user');
  const match = useAppSelector(state =>
    state.dating.matches.find(m => m.id === matchId)
  );

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Get other user's avatar
  const getAvatar = () => {
    if (match) {
      const profile = match.user1Id === currentUserId ? match.user2Profile : match.user1Profile;
      if (profile.photos && profile.photos.length > 0) {
        const photo = profile.photos[0];
        return typeof photo === 'string' ? photo : photo.url;
      }
    }
    return `https://ui-avatars.com/api/?name=${username}&background=random`;
  };

  const avatar = getAvatar();

  // Load mock messages on mount
  useEffect(() => {
    const mockMessages = generateMockMessages(userId, currentUserId);
    setMessages(mockMessages);
  }, [userId, currentUserId]);

  // Simulate typing indicator
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].senderId === currentUserId) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, currentUserId]);

  // Send message
  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: currentUserId,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    Keyboard.dismiss();

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);

    // Simulate message being delivered and read
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === newMessage.id ? {...m, status: 'delivered'} : m))
      );
    }, 500);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === newMessage.id ? {...m, status: 'read'} : m))
      );
    }, 1500);
  }, [inputText, currentUserId]);

  // Render message item
  const renderMessage = useCallback(
    ({item, index}: {item: Message; index: number}) => {
      const isOwn = item.senderId === currentUserId;
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== item.senderId);

      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          showAvatar={showAvatar}
          avatar={avatar}
        />
      );
    },
    [currentUserId, messages, avatar]
  );

  // Date header
  const renderDateHeader = () => {
    if (messages.length === 0) return null;
    const firstMessage = messages[0];
    const isToday = new Date().toDateString() === firstMessage.timestamp.toDateString();
    const dateStr = isToday
      ? 'Today'
      : firstMessage.timestamp.toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

    return (
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          onPress={() => {
            // Navigate to profile
          }}>
          <Image source={{uri: avatar}} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{username}</Text>
            {isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : (
              <Text style={styles.headerStatus}>Online</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Icon name="ellipsis-vertical" size={22} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderDateHeader}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: false})}
        />

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <Image source={{uri: avatar}} style={styles.typingAvatar} />
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="add-circle-outline" size={28} color={COLORS.PRIMARY} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.GRAY_400}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Icon name="happy-outline" size={24} color={COLORS.GRAY_400} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}>
            <Icon
              name="send"
              size={22}
              color={inputText.trim() ? COLORS.WHITE : COLORS.GRAY_400}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  backButton: {
    padding: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.SM,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_200,
  },
  headerInfo: {
    marginLeft: SPACING.SM,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.SUCCESS,
    marginTop: 1,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    fontStyle: 'italic',
    marginTop: 1,
  },
  menuButton: {
    padding: 8,
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },

  // Date header
  dateHeader: {
    alignItems: 'center',
    marginVertical: SPACING.MD,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Message
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    width: 28,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.GRAY_100,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  ownMessageText: {
    color: COLORS.WHITE,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.GRAY_500,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  statusIcon: {
    marginLeft: 4,
  },

  // Typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: 8,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  typingBubble: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.GRAY_400,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    backgroundColor: COLORS.WHITE,
  },
  attachButton: {
    padding: 4,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    maxHeight: 80,
    paddingVertical: 0,
  },
  emojiButton: {
    marginLeft: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.GRAY_200,
  },
});

export default DatingChatScreen;
