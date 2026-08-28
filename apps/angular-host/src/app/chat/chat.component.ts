import { Component } from '@angular/core';
import { CopilotChat, registerRenderToolCall } from '@copilotkit/angular';
import { queryHistorianToolSchema } from '@packt-workshop/contracts';
import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';
import { HistorianQueryRenderer } from './historian-query-renderer';

@Component({
  selector: 'app-chat',
  imports: [CopilotChat, StreamingAutoScrollDirective],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  constructor() {
    registerRenderToolCall({
      name: 'query_historian',
      args: queryHistorianToolSchema,
      component: HistorianQueryRenderer,
      agentId: 'default',
    });
  }
}
