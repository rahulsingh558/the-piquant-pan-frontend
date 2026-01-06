import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { ChatMessage, ChatSession, QuickReply } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_URL = 'http://localhost:5001/api/chat';
  private isBrowser = false;

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private sessionsSubject = new BehaviorSubject<ChatSession[]>([]);
  private isChatOpenSubject = new BehaviorSubject<boolean>(false);

  private pollingInterval: any;
  private currentUserId: string = '';
  private currentSessionId: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.currentUserId = this.getOrCreateUserId();
      this.currentSessionId = 'session_' + this.currentUserId;
    }
  }

  // Observables
  get messages$(): Observable<ChatMessage[]> {
    return this.messagesSubject.asObservable();
  }

  get sessions$(): Observable<ChatSession[]> {
    return this.sessionsSubject.asObservable();
  }

  get isChatOpen$(): Observable<boolean> {
    return this.isChatOpenSubject.asObservable();
  }

  // Initialize user session and start polling
  initializeUserChat(): void {
    if (!this.isBrowser) return;

    // Load initial messages
    this.loadUserMessages();

    // Start polling for new messages every 5 seconds
    this.startPolling();
  }

  // Load messages for current user
  loadUserMessages(): void {
    if (!this.isBrowser) return;

    this.http.get<any>(`${this.API_URL}/messages/${this.currentSessionId}`)
      .subscribe({
        next: (response) => {
          const messages = response.messages || [];
          this.messagesSubject.next(messages);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.messagesSubject.next([]);
        }
      });
  }

  // Send message from user
  sendUserMessage(content: string, userName?: string): Observable<any> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.error('Not in browser'));
    }

    const messageData = {
      sessionId: this.currentSessionId,
      userId: this.currentUserId,
      userName: userName || this.getUserName(),
      sender: 'user',
      content
    };

    return this.http.post(`${this.API_URL}/send`, messageData).pipe(
      tap(() => {
        // Reload messages after sending
        this.loadUserMessages();
      }),
      catchError((error) => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  // Send message from admin
  sendAdminMessage(content: string, sessionId: string): Observable<any> {
    const messageData = {
      sessionId,
      userId: sessionId.replace('session_', ''),
      userName: 'Admin',
      sender: 'admin',
      content
    };

    return this.http.post(`${this.API_URL}/send`, messageData).pipe(
      tap(() => {
        // Reload sessions after sending
        this.loadAdminSessions();
      }),
      catchError((error) => {
        console.error('Error sending admin message:', error);
        throw error;
      })
    );
  }

  // Load all sessions for admin
  loadAdminSessions(): void {
    this.http.get<any>(`${this.API_URL}/sessions`)
      .subscribe({
        next: (response) => {
          const sessions = response.sessions || [];

          // Transform backend sessions to match frontend ChatSession interface
          const transformedSessions: ChatSession[] = sessions.map((s: any) => ({
            id: s.sessionId,
            userId: s.userId,
            userName: s.userName,
            userEmail: s.userEmail,
            userPhone: s.userPhone,
            messages: [],
            lastActive: new Date(s.lastActive),
            status: s.status,
            assignedTo: s.assignedTo,
            createdAt: new Date(s.lastActive)
          }));

          this.sessionsSubject.next(transformedSessions);
        },
        error: (error) => {
          console.error('[ChatService] Error loading sessions:', error);
          this.sessionsSubject.next([]);
        }
      });
  }

  // Get messages for a specific session (for admin)
  getSessionMessages(sessionId: string): Observable<ChatMessage[]> {
    return this.http.get<any>(`${this.API_URL}/messages/${sessionId}`).pipe(
      tap((response) => {
        const messages = response.messages || [];

        // Update the session with messages
        const currentSessions = this.sessionsSubject.getValue();
        const updatedSessions = currentSessions.map(session => {
          if (session.id === sessionId) {
            return { ...session, messages };
          }
          return session;
        });
        this.sessionsSubject.next(updatedSessions);
      }),
      switchMap((response) => [response.messages || []])
    );
  }

  // Mark session as resolved
  markSessionResolved(sessionId: string): Observable<any> {
    return this.http.put(`${this.API_URL}/session/${sessionId}/status`, {
      status: 'resolved'
    }).pipe(
      tap(() => {
        this.loadAdminSessions();
      })
    );
  }

  // Assign session to admin
  assignSessionToAdmin(sessionId: string, adminName: string): Observable<any> {
    return this.http.put(`${this.API_URL}/session/${sessionId}/status`, {
      status: 'active',
      assignedTo: adminName
    }).pipe(
      tap(() => {
        this.loadAdminSessions();
      })
    );
  }

  // Mark messages as read
  markMessagesAsRead(sessionId: string, sender: 'user' | 'admin' = 'user'): Observable<any> {
    return this.http.put(`${this.API_URL}/read/${sessionId}`, { sender });
  }

  // Get unread count
  getUserUnreadCount(): Observable<number> {
    if (!this.isBrowser) {
      return new Observable(observer => observer.next(0));
    }

    return this.http.get<any>(`${this.API_URL}/unread/${this.currentSessionId}`).pipe(
      switchMap((response) => [response.unreadCount || 0])
    );
  }

  // Start polling for new messages
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll every 5 seconds
    this.pollingInterval = setInterval(() => {
      this.loadUserMessages();
    }, 5000);
  }

  // Stop polling
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Toggle chat window
  toggleChat(): void {
    const currentState = this.isChatOpenSubject.getValue();
    this.isChatOpenSubject.next(!currentState);

    if (!currentState) {
      // Opening chat - initialize if needed
      this.initializeUserChat();
    }
  }

  // Open chat
  openChat(): void {
    this.isChatOpenSubject.next(true);
    this.initializeUserChat();
  }

  // Close chat
  closeChat(): void {
    this.isChatOpenSubject.next(false);
  }

  // Get quick replies
  getQuickReplies(): QuickReply[] {
    return [
      { id: 1, text: 'Track my order', icon: '🚚' },
      { id: 2, text: 'Cancel my order', icon: '❌' },
      { id: 3, text: 'Change delivery address', icon: '📍' },
      { id: 4, text: 'Payment issue', icon: '💳' },
      { id: 5, text: 'Refund status', icon: '💰' },
      { id: 6, text: 'Speak with an agent', icon: '👨‍💼' },
    ];
  }

  // Get common questions
  getCommonQuestions(): string[] {
    return [
      'How long will my delivery take?',
      'Can I modify my order?',
      'What are your delivery hours?',
      'Do you offer contactless delivery?',
      'How can I apply a coupon?',
    ];
  }

  // Get canned responses for admin
  getCannedResponses(): string[] {
    return [
      'Thanks for reaching out! How can I help you today?',
      'Your order is being prepared and will be delivered in 25-30 minutes.',
      'I apologize for the inconvenience. Let me check and get back to you.',
      'Could you please share your order ID for faster assistance?',
      'Our delivery partner is on the way to your location.',
      'I understand your concern. Let me escalate this to our team.',
      'We appreciate your patience. Your issue is being looked into.',
      'Is there anything else I can help you with?',
    ];
  }

  // Get or create user ID
  private getOrCreateUserId(): string {
    if (!this.isBrowser) return 'anonymous_user_' + Date.now();

    let userId = localStorage.getItem('chatUserId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatUserId', userId);
    }
    return userId;
  }

  // Get user name
  private getUserName(): string {
    if (!this.isBrowser) return 'User';
    return localStorage.getItem('chatUserName') || 'User';
  }

  // Cleanup
  ngOnDestroy(): void {
    this.stopPolling();
  }
}