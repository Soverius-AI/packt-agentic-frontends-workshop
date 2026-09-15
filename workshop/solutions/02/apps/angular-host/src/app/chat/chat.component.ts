import { Component } from '@angular/core';
import { BasicChatComponent } from './basic-chat.component';

@Component({
  selector: 'app-chat',
  imports: [BasicChatComponent],
  template: '<app-basic-chat />',
  styles: ':host { display: contents; }',
})
export class ChatComponent {}
