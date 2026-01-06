import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../services/chat.service';
import { ChatSession, ChatMessage } from '../../../models/chat';

@Component({
  standalone: true,
  selector: 'app-admin-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-chat.component.html',
  styleUrls: ['./admin-chat.component.css']
})
export class AdminChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('chatInput') private chatInput!: ElementRef;

  sessions: ChatSession[] = [];
  activeSessions: ChatSession[] = [];
  pendingSessions: ChatSession[] = [];
  resolvedSessions: ChatSession[] = [];
  filteredSessions: ChatSession[] = [];
  cannedResponses: string[] = [];

  selectedSession: ChatSession | null = null;
  newMessage = '';
  selectedCannedResponse = '';
  searchQuery = '';
  filterStatus: 'all' | 'active' | 'pending' | 'resolved' = 'all';
  adminName = 'Admin User';

  filterOptions: Array<'all' | 'active' | 'pending' | 'resolved'> = ['all', 'active', 'pending', 'resolved'];

  private sessionsSubscription!: Subscription;
  private refreshInterval: any;

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    // Load sessions from backend
    this.chatService.loadAdminSessions();

    // Subscribe to sessions
    this.sessionsSubscription = this.chatService.sessions$.subscribe(sessions => {
      this.sessions = sessions;
      this.updateFilteredSessions();

      // If a session is selected, update it
      if (this.selectedSession) {
        const updatedSession = sessions.find(s => s.id === this.selectedSession!.id);
        if (updatedSession) {
          this.selectedSession = updatedSession;
          setTimeout(() => this.scrollToBottom(), 100);
        }
      }
    });

    // Get canned responses
    this.cannedResponses = this.chatService.getCannedResponses();

    // Refresh sessions every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.chatService.loadAdminSessions();

      // Also refresh selected session messages if any
      if (this.selectedSession) {
        this.chatService.getSessionMessages(this.selectedSession.id).subscribe();
      }
    }, 10000);
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.sessionsSubscription) {
      this.sessionsSubscription.unsubscribe();
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Get sender label for message
  getSenderLabel(message: ChatMessage): string {
    //Debug: logmessage sender
    console.log('Message sender:', message.sender, 'Content:', message.content.substring(0, 30));

    if (message.sender === 'user') {
      return this.selectedSession?.userName || 'User';
    } else {
      return 'You (Admin)';
    }
  }

  // Select a chat session
  selectSession(session: ChatSession): void {
    this.selectedSession = session;

    // Load messages for this session
    this.chatService.getSessionMessages(session.id).subscribe({
      next: (messages) => {
        // Messages are already updated in the session via the subscription
        setTimeout(() => {
          this.scrollToBottom();
          this.chatInput?.nativeElement?.focus();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading session messages:', error);
      }
    });

    // Mark session as active if it was pending
    if (session.status === 'pending') {
      this.markSessionAsActive(session.id);
    }
  }

  // Send message to selected session
  sendMessage(): void {
    if (!this.selectedSession || !this.newMessage.trim()) return;

    this.chatService.sendAdminMessage(this.newMessage, this.selectedSession.id).subscribe({
      next: () => {
        this.newMessage = '';
        // Reload messages for this session
        this.chatService.getSessionMessages(this.selectedSession!.id).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  // Send canned response
  sendCannedResponse(): void {
    if (!this.selectedSession || !this.selectedCannedResponse.trim()) return;

    this.chatService.sendAdminMessage(this.selectedCannedResponse, this.selectedSession.id).subscribe({
      next: () => {
        this.selectedCannedResponse = '';
        // Reload messages for this session
        this.chatService.getSessionMessages(this.selectedSession!.id).subscribe();
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error sending canned response:', error);
      }
    });
  }

  // Mark session as resolved
  resolveSession(): void {
    if (!this.selectedSession) return;

    this.chatService.markSessionResolved(this.selectedSession.id).subscribe({
      next: () => {
        this.selectedSession = null;
      },
      error: (error) => {
        console.error('Error resolving session:', error);
      }
    });
  }

  // Assign session to admin
  assignToMe(): void {
    if (!this.selectedSession) return;

    this.chatService.assignSessionToAdmin(this.selectedSession.id, this.adminName).subscribe({
      error: (error) => {
        console.error('Error assigning session:', error);
      }
    });
  }

  // Mark session as active
  markSessionAsActive(sessionId: string): void {
    this.chatService.assignSessionToAdmin(sessionId, this.adminName).subscribe({
      error: (error) => {
        console.error('Error marking session as active:', error);
      }
    });
  }

  // Format time
  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format date
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculate time ago
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // Get unread count for session
  getUnreadCount(session: ChatSession): number {
    return session.messages.filter(msg => !msg.isRead && msg.sender === 'user').length;
  }

  // Filter sessions
  updateFilteredSessions(): void {
    this.activeSessions = this.sessions.filter(s => s.status === 'active');
    this.pendingSessions = this.sessions.filter(s => s.status === 'pending');
    this.resolvedSessions = this.sessions.filter(s => s.status === 'resolved');

    // Update filtered sessions cache
    this.applyFilters();
  }

  // Apply current filters and update the filtered sessions cache
  applyFilters(): void {
    let filtered = this.sessions;

    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === this.filterStatus);
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.userName.toLowerCase().includes(query) ||
        session.userEmail?.toLowerCase().includes(query) ||
        session.userPhone?.includes(query) ||
        session.messages.some(msg => msg.content.toLowerCase().includes(query))
      );
    }

    // Sort by last activity (most recent first)
    this.filteredSessions = filtered.sort((a, b) =>
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );

    console.log('[AdminChat] filteredSessions updated:', this.filteredSessions.length, 'sessions');
  }

  // Get filtered sessions based on search and filter
  getFilteredSessions(): ChatSession[] {
    console.log('[AdminChat] getFilteredSessions called - filterStatus:', this.filterStatus, 'total sessions:', this.sessions.length);
    let filtered = this.sessions;

    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === this.filterStatus);
      console.log('[AdminChat] After status filter:', filtered.length, 'sessions');
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(session =>
        session.userName.toLowerCase().includes(query) ||
        session.userEmail?.toLowerCase().includes(query) ||
        session.userPhone?.includes(query) ||
        session.messages.some(msg => msg.content.toLowerCase().includes(query))
      );
      console.log('[AdminChat] After search filter:', filtered.length, 'sessions');
    }

    // Sort by last activity (most recent first)
    const sorted = filtered.sort((a, b) =>
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );

    console.log('[AdminChat] Returning', sorted.length, 'filtered sessions');
    return sorted;
  }

  // Get session stats
  getSessionStats() {
    return {
      total: this.sessions.length,
      active: this.activeSessions.length,
      pending: this.pendingSessions.length,
      resolved: this.resolvedSessions.length
    };
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  // Scroll to bottom
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
}