import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';
import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';

@Component({
  selector: 'app-chat',
  imports: [CopilotChat, StreamingAutoScrollDirective],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {}
