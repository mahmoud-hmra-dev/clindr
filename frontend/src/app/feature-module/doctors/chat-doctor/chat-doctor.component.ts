import { Component, OnInit } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { AuthService } from 'src/app/core/services/auth.service';
import { ChatService } from 'src/app/core/services/chat.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-chat-doctor',
  templateUrl: './chat-doctor.component.html',
  styleUrls: ['./chat-doctor.component.scss'],
  standalone: false
})
export class ChatDoctorComponent implements OnInit {

  public routes = routes;
  public chat = false;
  conversations: any[] = [];
  filteredConversations: any[] = [];
  selectedConversation: any;
  messages: any[] = [];
  newMessage = '';
  fileToSend?: File;
  messageType: 'text' | 'file' | 'audio' | 'image' = 'text';
  showEmoji = false;
  loading = false;
  loadingMessages = false;
  search = '';
  wsSub: any;
  public onlineList: OwlOptions = {
    margin: 0,
    nav: false,
    loop: false,
    dots: false,
    autoplaySpeed: 2000,
    responsive: {
      0: { items: 5 },
      768: { items: 5 },
      1170: { items: 5 },
    },
  };

    currentUserId: string = '';

isOwnMessage(msg: any): boolean {
  if (!msg.sender_id) {
    return false;
  }
  return msg.sender_id.toString() === this.currentUserId;
}

  constructor(
    private chatService: ChatService,
    private AuthService : AuthService
  ) {
    this.AuthService.getCurrentUser().subscribe((user:any) => {
      console.log('Current User:', user);
      if (user) {
        this.currentUserId = user.user.id.toString();
      }
    }
    );
  }

  ngOnInit(): void {
    this.loadConversations();
  }

  ngOnDestroy(): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }
  }

  loadConversations(): void {
    this.loading = true;
    this.chatService.getDoctorConversations().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.conversations = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.filteredConversations = [...this.conversations];
        if (!this.selectedConversation && this.filteredConversations.length) {
          this.selectConversation(this.filteredConversations[0]);
        }
        this.loading = false;
      },
      error: () => {
        this.conversations = [];
        this.filteredConversations = [];
        this.loading = false;
      },
    });
  }

  selectConversation(convo: any): void {
    this.selectedConversation = convo;
    this.loadMessages(convo.id);
    this.startRealtime(convo.id);
  }

  loadMessages(conversationId: number, silent = false): void {
    if (!silent) this.loadingMessages = true;
    this.chatService.getDoctorMessages(conversationId).subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.messages = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.loadingMessages = false;
      },
      error: () => {
        this.messages = [];
        this.loadingMessages = false;
      },
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    const payload: any = {
      conversation_id: this.selectedConversation.id,
      body: this.newMessage.trim(),
      message_type: this.messageType,
      attachment: this.fileToSend,
    };
    this.chatService.sendDoctorMessage(payload).subscribe((res) => {
      const msg = res?.data || {
        ...payload,
        id: Date.now(),
        sender: { name: 'You' },
        sent_at: new Date().toISOString(),
      };
      this.messages = [...this.messages, msg];
      this.selectedConversation.last_message = msg;
      this.selectedConversation.last_message_at = msg.sent_at;
      this.newMessage = '';
      this.fileToSend = undefined;
      this.messageType = 'text';
      this.chatService.sendRealtime(this.selectedConversation.id, msg);
    });
  }

  onFileSelected(event: any): void {
    const file = event?.target?.files?.[0];
    if (file) {
      this.fileToSend = file;
      const type = file.type.startsWith('audio') ? 'audio' : file.type.startsWith('image') ? 'image' : 'file';
      this.messageType = type as any;
    }
  }

  toggleEmoji(): void {
    this.showEmoji = !this.showEmoji;
  }

  addEmoji(emoji: string): void {
    this.newMessage = `${this.newMessage || ''}${emoji}`;
    this.showEmoji = false;
  }

  filterConversations(): void {
    const term = (this.search || '').toLowerCase();
    this.filteredConversations = this.conversations.filter((c) =>
      (c?.patient?.first_name || '').toLowerCase().includes(term)
    );
  }

  private startRealtime(conversationId: number): void {
    if (this.wsSub) {
      this.wsSub.unsubscribe();
    }
    this.wsSub = this.chatService.listen(conversationId).subscribe((msg) => {
      if (!msg || (msg.conversation_id && msg.conversation_id !== conversationId)) {
        return;
      }
      if (!this.messages.find((m) => m.id === msg.id && msg.id !== undefined)) {
        this.messages = [...this.messages, msg];
        this.selectedConversation.last_message = msg;
        this.selectedConversation.last_message_at = msg.sent_at;
      }
    });
  }

  showChat() {
    this.chat = !this.chat;
  }
}
