// chat-simple.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessage, ChatSession } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatSimpleService {
  private userMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private sessionsSubject = new BehaviorSubject<ChatSession[]>([]);
  
  userMessages$ = this.userMessagesSubject.asObservable();
  sessions$ = this.sessionsSubject.asObservable();
  
  constructor() {
    this.loadInitialData();
  }
  
  private loadInitialData(): void {
    // Try to load from localStorage
    const savedMessages = localStorage.getItem('simpleUserMessages');
    const savedSessions = localStorage.getItem('simpleChatSessions');
    
    if (savedMessages) {
      this.userMessagesSubject.next(JSON.parse(savedMessages));
    }
    
    if (savedSessions) {
      this.sessionsSubject.next(JSON.parse(savedSessions));
    }
  }
  
  // User sends a message
  sendUserMessage(content: string): void {
    const userId = this.getOrCreateUserId();
    const userName = 'User';
    
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      content,
      timestamp: new Date(),
      isRead: false,
      userId,
      userName
    };
    
    // Add to user messages
    const currentMessages = this.userMessagesSubject.value;
    const updatedMessages = [...currentMessages, userMessage];
    this.userMessagesSubject.next(updatedMessages);
    localStorage.setItem('simpleUserMessages', JSON.stringify(updatedMessages));
    
    // Create or update session for admin
    this.updateUserSession(userId, userName, userMessage);
  }
  
  // Admin sends a message
  sendAdminMessage(content: string, sessionId: string): void {
    const sessions = this.sessionsSubject.value;
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return;
    
    const adminMessage: ChatMessage = {
      id: Date.now(),
      sender: 'admin',
      content,
      timestamp: new Date(),
      isRead: true,
      userId: session.userId,
      userName: 'Support Agent'
    };
    
    // Add to user's messages
    const userMessages = this.getUserMessagesForUser(session.userId);
    const updatedUserMessages = [...userMessages, adminMessage];
    this.saveUserMessages(session.userId, updatedUserMessages);
    
    // Update session
    const updatedSession: ChatSession = {
      ...session,
      messages: [...session.messages, adminMessage],
      lastActive: new Date()
    };
    
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? updatedSession : s
    );
    
    this.sessionsSubject.next(updatedSessions);
    localStorage.setItem('simpleChatSessions', JSON.stringify(updatedSessions));
  }
  
  private updateUserSession(userId: string, userName: string, message: ChatMessage): void {
    const sessions = this.sessionsSubject.value;
    const sessionId = 'session_' + userId;
    
    let session = sessions.find(s => s.userId === userId);
    
    if (!session) {
      const newSession: ChatSession = {
        id: sessionId,
        userId,
        userName,
        messages: [message],
        lastActive: new Date(),
        status: 'pending',
        createdAt: new Date()
      };
      
      this.sessionsSubject.next([...sessions, newSession]);
      localStorage.setItem('simpleChatSessions', JSON.stringify([...sessions, newSession]));
    } else {
      const updatedSession: ChatSession = {
        ...session,
        messages: [...session.messages, message],
        lastActive: new Date()
      };
      
      const updatedSessions = sessions.map(s => 
        s.userId === userId ? updatedSession : s
      );
      
      this.sessionsSubject.next(updatedSessions);
      localStorage.setItem('simpleChatSessions', JSON.stringify(updatedSessions));
    }
  }
  
  private getOrCreateUserId(): string {
    if (typeof window !== 'undefined' && localStorage) {
      let userId = localStorage.getItem('simpleChatUserId');
      if (!userId) {
        userId = 'user_' + Date.now();
        localStorage.setItem('simpleChatUserId', userId);
      }
      return userId;
    }
    return 'user_' + Date.now();
  }
  
  private getUserMessagesForUser(userId: string): ChatMessage[] {
    const allMessages = this.userMessagesSubject.value;
    return allMessages.filter(msg => msg.userId === userId);
  }
  
  private saveUserMessages(userId: string, messages: ChatMessage[]): void {
    const currentMessages = this.userMessagesSubject.value;
    // Remove existing messages for this user
    const otherMessages = currentMessages.filter(msg => msg.userId !== userId);
    const updatedMessages = [...otherMessages, ...messages];
    
    this.userMessagesSubject.next(updatedMessages);
    localStorage.setItem('simpleUserMessages', JSON.stringify(updatedMessages));
  }
  
  getQuickReplies() {
    return [
      { id: 1, text: 'Track my order', icon: '🚚' },
      { id: 2, text: 'Cancel my order', icon: '❌' },
      { id: 3, text: 'Change delivery address', icon: '📍' },
      { id: 4, text: 'Payment issue', icon: '💳' }
    ];
  }
}