import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { ChatMessage, QuickReply } from '../../models/chat';

@Component({
  standalone: true,
  selector: 'app-chat-widget',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef;

  messages: ChatMessage[] = [];
  quickReplies: QuickReply[] = [];
  commonQuestions: string[] = [];
  newMessage = '';
  isChatOpen = false;
  unreadCount = 0;
  isTyping = false;
  selectedContact = 'Customer Support';
  showQuickReplies = true;
  userId = '';
  userName = 'User';

  private chatOpenSubscription!: Subscription;
  private messagesSubscription!: Subscription;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    // Get user info
    this.userId = this.getUserId();
    this.userName = this.getUserName();

    // Subscribe to messages
    this.messagesSubscription = this.chatService.messages$.subscribe(messages => {
      this.messages = messages;
      this.unreadCount = this.calculateUnreadCount();
      setTimeout(() => this.scrollToBottom(), 100);
    });

    // Subscribe to chat open state
    this.chatOpenSubscription = this.chatService.isChatOpen$.subscribe(isOpen => {
      this.isChatOpen = isOpen;
      if (isOpen) {
        // Mark messages as read when opening chat
        this.markMessagesAsRead();
        setTimeout(() => {
          this.chatInput?.nativeElement?.focus();
        }, 300);
      }
    });

    // Get quick replies and common questions
    this.quickReplies = this.chatService.getQuickReplies();
    this.commonQuestions = this.chatService.getCommonQuestions();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.chatOpenSubscription) {
      this.chatOpenSubscription.unsubscribe();
    }
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
    this.chatService.stopPolling();
  }

  // Get sender label for message
  getSenderLabel(message: ChatMessage): string {
    if (message.sender === 'user') {
      return 'You';
    } else {
      return 'Support Agent';
    }
  }

  // Load user messages from local storage
  // This method is no longer needed as messages are handled by the subscription
  // loadUserMessages(): void {
  //   const storedMessages = this.chatService.getUserMessages(this.userId);

  //   // Filter to only show messages for this user
  //   this.messages = storedMessages.filter(msg => 
  //     // Show messages where:
  //     // 1. The message is from this user (userId matches and sender is 'user')
  //     // 2. OR the message is from admin (sender is 'admin')
  //     (msg.userId === this.userId && msg.sender === 'user') || 
  //     msg.sender === 'admin'
  //   );

  //   // Sort by timestamp
  //   this.messages.sort((a, b) => 
  //     new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  //   );

  //   setTimeout(() => this.scrollToBottom(), 100);
  // }

  // Get or create user ID
  getUserId(): string {
    if (typeof window !== 'undefined' && localStorage) {
      let userId = localStorage.getItem('chatUserId');
      if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('chatUserId', userId);
      }
      return userId;
    }
    return 'anonymous_user_' + Date.now();
  }

  // Get user name
  getUserName(): string {
    if (typeof window !== 'undefined' && localStorage) {
      return localStorage.getItem('chatUserName') || 'User';
    }
    return 'User';
  }

  // Calculate unread count
  calculateUnreadCount(): number {
    return this.messages.filter(msg => !msg.isRead && msg.sender === 'admin').length;
  }

  // Mark all messages as read
  markMessagesAsRead(): void {
    this.unreadCount = 0;
  }

  // Toggle chat window
  toggleChat(): void {
    this.chatService.toggleChat();
  }

  // Send message
  sendMessage(): void {
    const message = this.newMessage.trim();
    if (!message) return;

    // Show typing indicator
    this.isTyping = true;

    this.chatService.sendUserMessage(message, this.userName).subscribe({
      next: () => {
        this.newMessage = '';
        this.showQuickReplies = false;
        this.isTyping = false;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isTyping = false;
      }
    });
  }

  // Send quick reply
  sendQuickReply(text: string): void {
    this.newMessage = text;
    this.sendMessage();
  }

  // Send common question
  sendCommonQuestion(question: string): void {
    this.newMessage = question;
    this.sendMessage();
  }

  // Format time
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Scroll to bottom of messages
  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messageContainer) {
          this.messageContainer.nativeElement.scrollTop =
            this.messageContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) { }
  }

  // Handle Enter key
  @HostListener('document:keydown.enter')
  onEnterKey(): void {
    if (this.isChatOpen && this.newMessage.trim()) {
      this.sendMessage();
    }
  }

  // Handle Escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isChatOpen) {
      this.chatService.closeChat();
    }
  }

  // Start new conversation
  startNewConversation(): void {
    // In a real app, this would create a new session
    // For now, just show quick replies
    this.showQuickReplies = true;
  }

  // Get today's date string
  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Check if agent is online (simulate)
  isAgentOnline(): boolean {
    const hours = new Date().getHours();
    return hours >= 9 && hours < 21; // 9 AM to 9 PM
  }
}