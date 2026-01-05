import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../services/chat.service';
import { ChatSession, AdminUser, ChatMessage } from '../../../models/chat';

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
  adminUsers: AdminUser[] = [];
  cannedResponses: string[] = [];
  
  selectedSession: ChatSession | null = null;
  newMessage = '';
  selectedCannedResponse = '';
  searchQuery = '';
  filterStatus: 'all' | 'active' | 'pending' | 'resolved' = 'all';
  adminName = 'Admin User';
  
  // Add filter options array with explicit types
  filterOptions: Array<'all' | 'active' | 'pending' | 'resolved'> = ['all', 'active', 'pending', 'resolved'];
  
  private sessionsSubscription!: Subscription;
  private adminSubscription!: Subscription;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
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

    // Subscribe to admin users
    this.adminSubscription = this.chatService.adminUsers$.subscribe(admins => {
      this.adminUsers = admins;
    });

    // Get canned responses
    this.cannedResponses = this.chatService.getCannedResponses();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.sessionsSubscription) {
      this.sessionsSubscription.unsubscribe();
    }
    if (this.adminSubscription) {
      this.adminSubscription.unsubscribe();
    }
  }

  // Get sender label for message
  getSenderLabel(message: ChatMessage): string {
    if (message.sender === 'user') {
      return this.selectedSession?.userName || 'User';
    } else {
      return 'You (Admin)';
    }
  }

  // Select a chat session
  selectSession(session: ChatSession): void {
    this.selectedSession = session;
    
    // Mark session as active if it was pending
    if (session.status === 'pending') {
      this.markSessionAsActive(session.id);
    }
    
    setTimeout(() => {
      this.scrollToBottom();
      this.chatInput?.nativeElement?.focus();
    }, 100);
  }

  // Send message to selected session
  sendMessage(): void {
    if (!this.selectedSession || !this.newMessage.trim()) return;

    this.chatService.sendAdminMessage(this.newMessage, this.selectedSession.id);
    this.newMessage = '';
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  // Send canned response
  sendCannedResponse(): void {
    if (!this.selectedSession || !this.selectedCannedResponse.trim()) return;

    this.chatService.sendAdminMessage(this.selectedCannedResponse, this.selectedSession.id);
    this.selectedCannedResponse = '';
    
    setTimeout(() => this.scrollToBottom(), 100);
  }

  // Mark session as resolved
  resolveSession(): void {
    if (!this.selectedSession) return;
    
    this.chatService.markSessionResolved(this.selectedSession.id);
    this.selectedSession = null;
  }

  // Assign session to admin
  assignToMe(): void {
    if (!this.selectedSession) return;
    
    this.chatService.assignSessionToAdmin(this.selectedSession.id, this.adminName);
  }

  // Mark session as active
  markSessionAsActive(sessionId: string): void {
    this.chatService.assignSessionToAdmin(sessionId, this.adminName);
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
  }

  // Get filtered sessions based on search and filter
  getFilteredSessions(): ChatSession[] {
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
    return filtered.sort((a, b) => 
      new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    );
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
    } catch(err) { }
  }
}