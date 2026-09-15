// Generated from speaker-notes and solutions. Run pnpm workshop:notes to refresh.
window.workshopPresenter = {
  milestones: [
    {
      id: "01",
      name: "Conventional application",
      source: "workshop/speaker-notes/01-conventional-app.md",
      intro:
        "**Start:** `pnpm workshop:select 01`, then `pnpm dev`. Open http://localhost:4300.\nMastra need not be running. No model key is required.",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** `pnpm workshop:select 01`, then `pnpm dev`. Open http://localhost:4300.\nMastra need not be running. No model key is required.",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“This application already works. It owns the readings, filters, history, and alarm\nactions. We are going to connect an assistant to selected capabilities.”\n\nExplain that Snapshot shows the latest reading per metric; Reading log filters\npersisted records. A model response and a database reading have different origins.",
        },
        {
          label: "OPEN",
          title: "Open · 1",
          body: "The application first; keep the editor closed for the initial tour.",
        },
        {
          label: "OPEN",
          title: "Open · 2",
          body: "`apps/angular-host/src/app/facility-api.ts`: point at the ordinary HTTP calls.",
        },
        {
          label: "OPEN",
          title: "Open · 3",
          body: "`packages/contracts/src/index.ts`: show a single dashboard schema and its\n  inferred TypeScript type. The same contract is used in Angular and the server.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 1",
          body: "Show the latest readings and the continuous-update behavior in Snapshot.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 2",
          body: "Open Reading log. Choose Cooling room and Warning; show that filters and\n   pagination already work without an assistant.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 3",
          body: "Open seven-day history from a metric. Explain that readings are stored in SQLite.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 4",
          body: "If demonstrating a manual alarm, raise, acknowledge, and resolve it using the\n   conventional controls. Leave the intended approval-demo metric without an active\n   alarm. The empty decision-audit panel is prepared infrastructure for milestone 07.",
        },
        {
          label: "DEMONSTRATE",
          title: "Do and demonstrate · 5",
          body: "Point to the prepared assistant area: nothing is connected yet.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“The interface can do these operations, but it cannot answer an ordinary question.\nLet's connect a conversation first.”\n\n**No live code in this milestone.** Avoid explaining telemetry generation or table\nmarkup line by line. They are the prepared application on which the talk builds.",
        },
      ],
      prompts: [],
      recovery:
        "Check the facility terminal and http://localhost:3101/api/health if readings fail.\nThis is an API/proxy issue, not an AI issue. Never reset the database to fix a chat\nproblem. Reload the browser after selecting checkpoint 01.",
      files: [],
      flow: ["Angular controls", "Facility API", "SQLite"],
    },
    {
      id: "02",
      name: "Basic chat",
      source: "workshop/speaker-notes/02-basic-chat.md",
      intro:
        "**Start:** completed 01. Configure `.env` privately before this section.\n**Completed code:** [solution 02](../solutions/02/).",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 01. Configure `.env` privately before this section.\n**Completed code:** [solution 02](../solutions/02/).",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The first connection carries messages to a model. It supplies a static application\ndescription, but no live readings, current filters, database tools, or actions.”",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 1",
          body: "`apps/facility-service/src/prompts/basic-chat.ts`: read the paragraph defining\n   what the assistant cannot inspect. The prompt is prepared; do not type it.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 2",
          body: "`apps/facility-service/src/chat.ts`: show `client.chat.completions.create`, the\n   system message, conversation messages, and the returned assistant message.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 3",
          body: "`apps/facility-service/src/workshop.ts`: import `createChatService` and replace\n   `chat: undefined` with `chat: createChatService(options)`. Leave the Copilot\n   runtime disconnected. [Exact file](../solutions/02/apps/facility-service/src/workshop.ts).",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 4",
          body: "Paste the prepared native `chat.component.ts`, `.html`, and `.scss` from\n   solution 02 into `apps/angular-host/src/app/chat/`. Briefly show `send()` calling\n   `ChatApi.send(messages)`; the message list, form, loading and error UI are ready.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 5",
          body: "Open `chat/chat-api.ts`: point to `POST /api/chat`. Explain the request schema\n   and response validation rather than the form implementation.",
        },
        {
          label: "DO",
          title: "Open and change, in this order · 6",
          body: "Restart `pnpm dev` to rebuild the server; reload the browser.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Type: **Why does temperature control matter when making chocolate?**\n\nExpected: an ordinary general-knowledge answer. Show the `/api/chat` request in\nthe browser Network panel; this response is not streamed.\n\nThen type: **What is the current air temperature in our Cooling room?**\n\nExpected: the assistant acknowledges that it cannot inspect current facility data.\nIf it invents a value, use that as a prompt-boundary failure and compare it with\nthe actual dashboard. Never describe a correct guess as data access.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“Before connecting tools, we need a standardized way to represent an agent run.”",
        },
      ],
      prompts: [
        "Why does temperature control matter when making chocolate?",
        "What is the current air temperature in our Cooling room?",
      ],
      recovery:
        "`pnpm workshop:select 02`, restart `pnpm dev`, reload the browser. On a provider\nerror, inspect the backend terminal and key configuration off screen. Successful\ndashboard loading does not prove that a model request can succeed.",
      files: [
        {
          path: "apps/angular-host/src/app/chat/chat.component.ts",
          after:
            "import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';\nimport { FormField, form, maxLength, required, submit } from '@angular/forms/signals';\nimport type { ChatMessage } from '@packt-workshop/contracts';\nimport { ChatApi } from './chat-api';\n\n@Component({\n  selector: 'app-chat',\n  imports: [FormField],\n  templateUrl: './chat.component.html',\n  styleUrl: './chat.component.scss',\n})\nexport class ChatComponent {\n  readonly #api = inject(ChatApi);\n  private readonly conversation = viewChild\u003cElementRef\u003cHTMLOListElement>>('conversation');\n\n  protected readonly messages = signal\u003creadonly ChatMessage[]>([]);\n  protected readonly pending = signal(false);\n  protected readonly error = signal\u003cstring | undefined>(undefined);\n  protected readonly draft = signal({ content: '' });\n  protected readonly chatForm = form(this.draft, (path) => {\n    required(path.content, { message: 'Enter a message.' });\n    maxLength(path.content, 4_000, {\n      message: 'Keep the message below 4,000 characters.',\n    });\n  });\n\n  constructor() {\n    effect(() => {\n      this.messages();\n      this.pending();\n      const conversation = this.conversation()?.nativeElement;\n      if (!conversation) return;\n      queueMicrotask(() => {\n        conversation.scrollTop = conversation.scrollHeight;\n      });\n    });\n  }\n\n  protected send(): void {\n    if (this.pending()) return;\n    submit(this.chatForm, async () => {\n      const content = this.draft().content.trim();\n      if (!content) return;\n      const previousMessages = this.messages();\n      const messages: readonly ChatMessage[] = [...previousMessages, { role: 'user', content }];\n      this.messages.set(messages);\n      this.pending.set(true);\n      this.error.set(undefined);\n      try {\n        const response = await this.#api.send(messages);\n        this.messages.set([...messages, response.message]);\n        this.draft.set({ content: '' });\n        this.chatForm().reset();\n      } catch (error) {\n        this.messages.set(previousMessages);\n        this.error.set(error instanceof Error ? error.message : 'Unexpected chat error.');\n      } finally {\n        this.pending.set(false);\n      }\n    });\n  }\n\n  protected handleKeydown(event: KeyboardEvent): void {\n    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;\n    event.preventDefault();\n    this.send();\n  }\n}\n",
          diff: "@@ -1,7 +1,68 @@\n-import { Component } from '@angular/core';\n+import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';\n+import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';\n+import type { ChatMessage } from '@packt-workshop/contracts';\n+import { ChatApi } from './chat-api';\n+\n @Component({\n   selector: 'app-chat',\n+  imports: [FormField],\n   templateUrl: './chat.component.html',\n   styleUrl: './chat.component.scss',\n })\n-export class ChatComponent {}\n+export class ChatComponent {\n+  readonly #api = inject(ChatApi);\n+  private readonly conversation = viewChild\u003cElementRef\u003cHTMLOListElement>>('conversation');\n+\n+  protected readonly messages = signal\u003creadonly ChatMessage[]>([]);\n+  protected readonly pending = signal(false);\n+  protected readonly error = signal\u003cstring | undefined>(undefined);\n+  protected readonly draft = signal({ content: '' });\n+  protected readonly chatForm = form(this.draft, (path) => {\n+    required(path.content, { message: 'Enter a message.' });\n+    maxLength(path.content, 4_000, {\n+      message: 'Keep the message below 4,000 characters.',\n+    });\n+  });\n+\n+  constructor() {\n+    effect(() => {\n+      this.messages();\n+      this.pending();\n+      const conversation = this.conversation()?.nativeElement;\n+      if (!conversation) return;\n+      queueMicrotask(() => {\n+        conversation.scrollTop = conversation.scrollHeight;\n+      });\n+    });\n+  }\n+\n+  protected send(): void {\n+    if (this.pending()) return;\n+    submit(this.chatForm, async () => {\n+      const content = this.draft().content.trim();\n+      if (!content) return;\n+      const previousMessages = this.messages();\n+      const messages: readonly ChatMessage[] = [...previousMessages, { role: 'user', content }];\n+      this.messages.set(messages);\n+      this.pending.set(true);\n+      this.error.set(undefined);\n+      try {\n+        const response = await this.#api.send(messages);\n+        this.messages.set([...messages, response.message]);\n+        this.draft.set({ content: '' });\n+        this.chatForm().reset();\n+      } catch (error) {\n+        this.messages.set(previousMessages);\n+        this.error.set(error instanceof Error ? error.message : 'Unexpected chat error.');\n+      } finally {\n+        this.pending.set(false);\n+      }\n+    });\n+  }\n+\n+  protected handleKeydown(event: KeyboardEvent): void {\n+    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;\n+    event.preventDefault();\n+    this.send();\n+  }\n+}\n",
        },
        {
          path: "apps/angular-host/src/app/chat/chat.component.html",
          after:
            '\u003caside aria-labelledby="chat-title">\n  \u003cdiv class="chat-heading">\n    \u003cdiv>\n      \u003cp class="eyebrow">Gemma 4 via OpenRouter\u003c/p>\n      \u003ch2 id="chat-title">Factory assistant\u003c/h2>\n    \u003c/div>\n    \u003cspan>Chat only\u003c/span>\n  \u003c/div>\n  \u003cp class="chat-boundary">\n    The assistant understands this application’s domain, but it cannot see its current data or\n    perform actions.\n  \u003c/p>\n\n  \u003col\n    #conversation\n    class="conversation"\n    role="log"\n    aria-live="polite"\n    aria-label="Chat conversation"\n  >\n    @for (message of messages(); track $index) {\n      \u003cli class="chat-message chat-message-{{ message.role }}">\n        \u003cstrong>{{ message.role === \'user\' ? \'You\' : \'Assistant\' }}\u003c/strong>\n        \u003cp>{{ message.content }}\u003c/p>\n      \u003c/li>\n    } @empty {\n      \u003cli class="chat-empty">Ask a general question about incident management.\u003c/li>\n    }\n    @if (pending()) {\n      \u003cli class="chat-message chat-message-assistant chat-pending" role="status">\n        \u003cstrong>Assistant\u003c/strong>\n        \u003cp>Thinking…\u003c/p>\n      \u003c/li>\n    }\n  \u003c/ol>\n\n  @if (error()) {\n    \u003cp class="chat-error" role="alert">{{ error() }}\u003c/p>\n  }\n\n  \u003cform class="chat-form" (submit)="send(); $event.preventDefault()">\n    \u003clabel for="chat-message">Message\u003c/label>\n    \u003ctextarea\n      id="chat-message"\n      rows="4"\n      [formField]="chatForm.content"\n      (keydown)="handleKeydown($event)"\n      aria-describedby="chat-help"\n    >\u003c/textarea>\n    \u003cdiv class="chat-form-actions">\n      \u003csmall id="chat-help">Enter adds a line · Ctrl/⌘ + Enter sends\u003c/small>\n      \u003cbutton type="submit" [disabled]="pending() || chatForm().invalid()">\n        {{ pending() ? \'Sending…\' : \'Send\' }}\n      \u003c/button>\n    \u003c/div>\n  \u003c/form>\n\u003c/aside>\n',
          diff: '@@ -1,4 +1,57 @@\n-\u003caside aria-label="Assistant">\n-  \u003ch2>Factory assistant\u003c/h2>\n-  \u003cp>The assistant is not connected yet.\u003c/p>\n+\u003caside aria-labelledby="chat-title">\n+  \u003cdiv class="chat-heading">\n+    \u003cdiv>\n+      \u003cp class="eyebrow">Gemma 4 via OpenRouter\u003c/p>\n+      \u003ch2 id="chat-title">Factory assistant\u003c/h2>\n+    \u003c/div>\n+    \u003cspan>Chat only\u003c/span>\n+  \u003c/div>\n+  \u003cp class="chat-boundary">\n+    The assistant understands this application’s domain, but it cannot see its current data or\n+    perform actions.\n+  \u003c/p>\n+\n+  \u003col\n+    #conversation\n+    class="conversation"\n+    role="log"\n+    aria-live="polite"\n+    aria-label="Chat conversation"\n+  >\n+    @for (message of messages(); track $index) {\n+      \u003cli class="chat-message chat-message-{{ message.role }}">\n+        \u003cstrong>{{ message.role === \'user\' ? \'You\' : \'Assistant\' }}\u003c/strong>\n+        \u003cp>{{ message.content }}\u003c/p>\n+      \u003c/li>\n+    } @empty {\n+      \u003cli class="chat-empty">Ask a general question about incident management.\u003c/li>\n+    }\n+    @if (pending()) {\n+      \u003cli class="chat-message chat-message-assistant chat-pending" role="status">\n+        \u003cstrong>Assistant\u003c/strong>\n+        \u003cp>Thinking…\u003c/p>\n+      \u003c/li>\n+    }\n+  \u003c/ol>\n+\n+  @if (error()) {\n+    \u003cp class="chat-error" role="alert">{{ error() }}\u003c/p>\n+  }\n+\n+  \u003cform class="chat-form" (submit)="send(); $event.preventDefault()">\n+    \u003clabel for="chat-message">Message\u003c/label>\n+    \u003ctextarea\n+      id="chat-message"\n+      rows="4"\n+      [formField]="chatForm.content"\n+      (keydown)="handleKeydown($event)"\n+      aria-describedby="chat-help"\n+    >\u003c/textarea>\n+    \u003cdiv class="chat-form-actions">\n+      \u003csmall id="chat-help">Enter adds a line · Ctrl/⌘ + Enter sends\u003c/small>\n+      \u003cbutton type="submit" [disabled]="pending() || chatForm().invalid()">\n+        {{ pending() ? \'Sending…\' : \'Send\' }}\n+      \u003c/button>\n+    \u003c/div>\n+  \u003c/form>\n \u003c/aside>\n',
        },
        {
          path: "apps/angular-host/src/app/chat/chat.component.scss",
          after:
            ":host {\n  display: flex;\n  align-self: stretch;\n  min-width: 0;\n  min-height: 780px;\n  margin: -22px -22px -22px 0;\n  padding: 22px;\n  overflow: hidden;\n  border-left: 1px solid #e0d8cf;\n  background: #faf8f4;\n  color: #211c18;\n  contain: size;\n}\n\n* {\n  box-sizing: border-box;\n}\n\naside {\n  display: flex;\n  flex: 1;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n}\n\n.eyebrow {\n  margin: 0;\n  color: #73513a;\n  font-size: 0.68rem;\n  font-weight: 850;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n\n.chat-heading {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n.chat-heading h2 {\n  margin: 3px 0 0;\n  font-size: 1.45rem;\n  line-height: 1.1;\n}\n\n.chat-heading > span {\n  padding: 6px 9px;\n  border-radius: 999px;\n  background: #e8e4ee;\n  color: #473e55;\n  font-size: 0.68rem;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n.chat-boundary {\n  margin: 14px 0;\n  color: #655d56;\n  font-size: 0.82rem;\n}\n\n.conversation {\n  display: grid;\n  flex: 1;\n  align-content: start;\n  gap: 10px;\n  min-height: 0;\n  padding: 14px;\n  margin: 0 0 14px;\n  overflow-y: auto;\n  border: 1px solid #ded6cd;\n  border-radius: 12px;\n  background: #faf8f4;\n  list-style: none;\n}\n\n.chat-message {\n  max-width: 92%;\n  padding: 10px 12px;\n  border-radius: 12px;\n  background: #ece3d8;\n}\n\n.chat-message-user {\n  justify-self: end;\n  background: #684529;\n  color: #fff;\n}\n\n.chat-message strong {\n  display: block;\n  margin-bottom: 4px;\n  font-size: 0.68rem;\n}\n\n.chat-message p {\n  margin: 0;\n  white-space: pre-wrap;\n}\n\n.chat-empty,\n.chat-pending {\n  color: #655d56;\n  font-size: 0.8rem;\n}\n\n.chat-error {\n  padding: 9px 10px;\n  border-left: 4px solid #b53b2d;\n  background: #fff2ef;\n  color: #71291f;\n  font-size: 0.8rem;\n}\n\n.chat-form {\n  display: grid;\n  gap: 8px;\n}\n\n.chat-form label {\n  font-size: 0.78rem;\n  font-weight: 800;\n}\n\n.chat-form textarea {\n  width: 100%;\n  resize: vertical;\n  padding: 10px;\n  border: 1px solid #b9aa9c;\n  border-radius: 9px;\n  color: #211c18;\n  background: #fff;\n  font: inherit;\n  line-height: 1.45;\n}\n\n.chat-form textarea:focus-visible,\nbutton:focus-visible {\n  outline: 3px solid #d38a2e;\n  outline-offset: 2px;\n}\n\n.chat-form-actions {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n}\n\n.chat-form-actions small {\n  color: #6d655e;\n  font-size: 0.68rem;\n}\n\nbutton {\n  padding: 9px 12px;\n  border: 0;\n  border-radius: 9px;\n  background: #684529;\n  color: #fff;\n  font: inherit;\n  font-size: 0.78rem;\n  font-weight: 800;\n  cursor: pointer;\n}\n\nbutton:disabled {\n  cursor: not-allowed;\n  opacity: 0.58;\n}\n\n@media (max-width: 1100px) {\n  :host {\n    order: -1;\n    min-height: 480px;\n    margin: 0;\n    padding: 20px 0 22px;\n    border-left: 0;\n    border-bottom: 1px solid #e0d8cf;\n    background: transparent;\n  }\n}\n",
          diff: "@@ -1,11 +1,8 @@\n :host {\n-  position: sticky;\n-  top: 24px;\n   display: flex;\n-  align-self: start;\n-  height: clamp(520px, calc(100vh - 48px), 900px);\n+  align-self: stretch;\n   min-width: 0;\n-  min-height: 0;\n+  min-height: 780px;\n   margin: -22px -22px -22px 0;\n   padding: 22px;\n   overflow: hidden;\n@@ -65,26 +62,119 @@ aside {\n   font-size: 0.82rem;\n }\n \n-.copilot-chat-shell {\n-  display: block;\n+.conversation {\n+  display: grid;\n   flex: 1;\n+  align-content: start;\n+  gap: 10px;\n   min-height: 0;\n+  padding: 14px;\n+  margin: 0 0 14px;\n+  overflow-y: auto;\n   border: 1px solid #ded6cd;\n   border-radius: 12px;\n   background: #faf8f4;\n-  overflow: hidden;\n+  list-style: none;\n+}\n+\n+.chat-message {\n+  max-width: 92%;\n+  padding: 10px 12px;\n+  border-radius: 12px;\n+  background: #ece3d8;\n+}\n+\n+.chat-message-user {\n+  justify-self: end;\n+  background: #684529;\n+  color: #fff;\n }\n \n-copilot-chat {\n+.chat-message strong {\n   display: block;\n-  height: 100%;\n+  margin-bottom: 4px;\n+  font-size: 0.68rem;\n+}\n+\n+.chat-message p {\n+  margin: 0;\n+  white-space: pre-wrap;\n+}\n+\n+.chat-empty,\n+.chat-pending {\n+  color: #655d56;\n+  font-size: 0.8rem;\n+}\n+\n+.chat-error {\n+  padding: 9px 10px;\n+  border-left: 4px solid #b53b2d;\n+  background: #fff2ef;\n+  color: #71291f;\n+  font-size: 0.8rem;\n+}\n+\n+.chat-form {\n+  display: grid;\n+  gap: 8px;\n+}\n+\n+.chat-form label {\n+  font-size: 0.78rem;\n+  font-weight: 800;\n+}\n+\n+.chat-form textarea {\n+  width: 100%;\n+  resize: vertical;\n+  padding: 10px;\n+  border: 1px solid #b9aa9c;\n+  border-radius: 9px;\n+  color: #211c18;\n+  background: #fff;\n+  font: inherit;\n+  line-height: 1.45;\n+}\n+\n+.chat-form textarea:focus-visible,\n+button:focus-visible {\n+  outline: 3px solid #d38a2e;\n+  outline-offset: 2px;\n+}\n+\n+.chat-form-actions {\n+  display: flex;\n+  align-items: center;\n+  justify-content: space-between;\n+  gap: 10px;\n+}\n+\n+.chat-form-actions small {\n+  color: #6d655e;\n+  font-size: 0.68rem;\n+}\n+\n+button {\n+  padding: 9px 12px;\n+  border: 0;\n+  border-radius: 9px;\n+  background: #684529;\n+  color: #fff;\n+  font: inherit;\n+  font-size: 0.78rem;\n+  font-weight: 800;\n+  cursor: pointer;\n+}\n+\n+button:disabled {\n+  cursor: not-allowed;\n+  opacity: 0.58;\n }\n \n @media (max-width: 1100px) {\n   :host {\n-    position: static;\n     order: -1;\n-    height: 620px;\n     min-height: 480px;\n     margin: 0;\n     padding: 20px 0 22px;\n",
        },
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createChatService } from "./chat.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: createChatService(options),\n    copilotRuntime: undefined,\n  };\n}\n',
          diff: '@@ -1,10 +1,11 @@\n import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\n+import { createChatService } from "./chat.js";\n \n export function createWorkshopConnections(\n-  _options: WorkshopOptions,\n+  options: WorkshopOptions,\n ): WorkshopConnections {\n   return {\n-    chat: undefined,\n+    chat: createChatService(options),\n     copilotRuntime: undefined,\n   };\n }\n',
        },
      ],
      flow: ["Native chat", "Facility /api/chat", "Model"],
    },
    {
      id: "03",
      name: "CopilotKit and AG-UI",
      source: "workshop/speaker-notes/03-copilotkit.md",
      intro:
        "**Start:** completed 02. **Completed code:** [solution 03](../solutions/03/).",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 02. **Completed code:** [solution 03](../solutions/03/).",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The next change is how we connect and display an agent run. The assistant still\nhas the same data limitation. CopilotKit provides the interaction; AG-UI carries\nthe run lifecycle, streamed text, and later tool activity.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/angular-host/src/app/app.config.ts`: add the `provideCopilotKit` and label\n   providers from [solution 03](../solutions/03/apps/angular-host/src/app/app.config.ts).\n   Point to `runtimeUrl: '/api/copilotkit'` and the Angular development proxy.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: 'Replace the three `chat.component.*` files with solution 03. Open the template\n   and focus on `\u003ccopilot-chat agentId="default" appStreamingAutoScroll />`.\n   The scrolling directive and surrounding layout are prepared support.',
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "`apps/facility-service/src/workshop.ts`: connect\n   `createEmbeddedCopilotRuntime(options)` and disconnect native chat.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "Open `embedded-copilot-runtime.ts`: show the `BuiltInAgent`, model, static prompt,\n   `agents.default`, and listener. No tools are registered.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Restart `pnpm dev`; reload the browser to start a new conversation.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Ask: **Why does temperature control matter when making chocolate?**\n\nShow text arriving incrementally.\nIn Network, inspect the CopilotKit request and its streaming response; locate\nthe run-start, text-message, and run-finish events where exposed by the transport.\nExplain that streaming chunks are transport observations, not a trace of hidden reasoning.\n\nAsk: **Show only warnings from the Cooling room.**\n\nExpected: no filter changes because no frontend tools have been connected. The\nfrontend still owns the filters and the runtime has no handler to change them.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“We have a stable frontend connection. We can now move the agent into Mastra while\nkeeping that interface.”",
        },
      ],
      prompts: [
        "Why does temperature control matter when making chocolate?",
        "Show only warnings from the Cooling room.",
      ],
      recovery:
        "Select 03, restart the facility process and reload. Check\nhttp://localhost:3101/api/copilotkit/info for discovery. Inspect matching\n`default` agent IDs and provider URL if the chat is empty. Mastra is not needed yet.",
      files: [
        {
          path: "apps/angular-host/src/app/chat/chat.component.ts",
          after:
            "import { Component } from '@angular/core';\nimport { CopilotChat } from '@copilotkit/angular';\nimport { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';\n\n@Component({\n  selector: 'app-chat',\n  imports: [CopilotChat, StreamingAutoScrollDirective],\n  templateUrl: './chat.component.html',\n  styleUrl: './chat.component.scss',\n})\nexport class ChatComponent {}\n",
          diff: "@@ -1,68 +1,11 @@\n-import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';\n-import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';\n-import type { ChatMessage } from '@packt-workshop/contracts';\n-import { ChatApi } from './chat-api';\n+import { Component } from '@angular/core';\n+import { CopilotChat } from '@copilotkit/angular';\n+import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';\n \n @Component({\n   selector: 'app-chat',\n-  imports: [FormField],\n+  imports: [CopilotChat, StreamingAutoScrollDirective],\n   templateUrl: './chat.component.html',\n   styleUrl: './chat.component.scss',\n })\n-export class ChatComponent {\n-  readonly #api = inject(ChatApi);\n-  private readonly conversation = viewChild\u003cElementRef\u003cHTMLOListElement>>('conversation');\n-\n-  protected readonly messages = signal\u003creadonly ChatMessage[]>([]);\n-  protected readonly pending = signal(false);\n-  protected readonly error = signal\u003cstring | undefined>(undefined);\n-  protected readonly draft = signal({ content: '' });\n-  protected readonly chatForm = form(this.draft, (path) => {\n-    required(path.content, { message: 'Enter a message.' });\n-    maxLength(path.content, 4_000, {\n-      message: 'Keep the message below 4,000 characters.',\n-    });\n-  });\n-\n-  constructor() {\n-    effect(() => {\n-      this.messages();\n-      this.pending();\n-      const conversation = this.conversation()?.nativeElement;\n-      if (!conversation) return;\n-      queueMicrotask(() => {\n-        conversation.scrollTop = conversation.scrollHeight;\n-      });\n-    });\n-  }\n-\n-  protected send(): void {\n-    if (this.pending()) return;\n-    submit(this.chatForm, async () => {\n-      const content = this.draft().content.trim();\n-      if (!content) return;\n-      const previousMessages = this.messages();\n-      const messages: readonly ChatMessage[] = [...previousMessages, { role: 'user', content }];\n-      this.messages.set(messages);\n-      this.pending.set(true);\n-      this.error.set(undefined);\n-      try {\n-        const response = await this.#api.send(messages);\n-        this.messages.set([...messages, response.message]);\n-        this.draft.set({ content: '' });\n-        this.chatForm().reset();\n-      } catch (error) {\n-        this.messages.set(previousMessages);\n-        this.error.set(error instanceof Error ? error.message : 'Unexpected chat error.');\n-      } finally {\n-        this.pending.set(false);\n-      }\n-    });\n-  }\n-\n-  protected handleKeydown(event: KeyboardEvent): void {\n-    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey)) return;\n-    event.preventDefault();\n-    this.send();\n-  }\n-}\n+export class ChatComponent {}\n",
        },
        {
          path: "apps/angular-host/src/app/chat/chat.component.html",
          after:
            '\u003caside aria-labelledby="chat-title">\n  \u003cdiv class="chat-heading">\n    \u003cdiv>\n      \u003cp class="eyebrow">CopilotKit · AG-UI streaming\u003c/p>\n      \u003ch2 id="chat-title">Factory assistant\u003c/h2>\n    \u003c/div>\n    \u003cspan>AG-UI\u003c/span>\n  \u003c/div>\n  \u003cp class="chat-boundary">\n    Available capabilities depend on the tools connected to this assistant.\n  \u003c/p>\n\n  \u003cdiv class="copilot-chat-shell">\n    \u003ccopilot-chat agentId="default" appStreamingAutoScroll />\n  \u003c/div>\n\u003c/aside>\n',
          diff: '@@ -1,57 +1,16 @@\n \u003caside aria-labelledby="chat-title">\n   \u003cdiv class="chat-heading">\n     \u003cdiv>\n-      \u003cp class="eyebrow">Gemma 4 via OpenRouter\u003c/p>\n+      \u003cp class="eyebrow">CopilotKit · AG-UI streaming\u003c/p>\n       \u003ch2 id="chat-title">Factory assistant\u003c/h2>\n     \u003c/div>\n-    \u003cspan>Chat only\u003c/span>\n+    \u003cspan>AG-UI\u003c/span>\n   \u003c/div>\n   \u003cp class="chat-boundary">\n-    The assistant understands this application’s domain, but it cannot see its current data or\n-    perform actions.\n+    Available capabilities depend on the tools connected to this assistant.\n   \u003c/p>\n \n-  \u003col\n-    #conversation\n-    class="conversation"\n-    role="log"\n-    aria-live="polite"\n-    aria-label="Chat conversation"\n-  >\n-    @for (message of messages(); track $index) {\n-      \u003cli class="chat-message chat-message-{{ message.role }}">\n-        \u003cstrong>{{ message.role === \'user\' ? \'You\' : \'Assistant\' }}\u003c/strong>\n-        \u003cp>{{ message.content }}\u003c/p>\n-      \u003c/li>\n-    } @empty {\n-      \u003cli class="chat-empty">Ask a general question about incident management.\u003c/li>\n-    }\n-    @if (pending()) {\n-      \u003cli class="chat-message chat-message-assistant chat-pending" role="status">\n-        \u003cstrong>Assistant\u003c/strong>\n-        \u003cp>Thinking…\u003c/p>\n-      \u003c/li>\n-    }\n-  \u003c/ol>\n-\n-  @if (error()) {\n-    \u003cp class="chat-error" role="alert">{{ error() }}\u003c/p>\n-  }\n-\n-  \u003cform class="chat-form" (submit)="send(); $event.preventDefault()">\n-    \u003clabel for="chat-message">Message\u003c/label>\n-    \u003ctextarea\n-      id="chat-message"\n-      rows="4"\n-      [formField]="chatForm.content"\n-      (keydown)="handleKeydown($event)"\n-      aria-describedby="chat-help"\n-    >\u003c/textarea>\n-    \u003cdiv class="chat-form-actions">\n-      \u003csmall id="chat-help">Enter adds a line · Ctrl/⌘ + Enter sends\u003c/small>\n-      \u003cbutton type="submit" [disabled]="pending() || chatForm().invalid()">\n-        {{ pending() ? \'Sending…\' : \'Send\' }}\n-      \u003c/button>\n-    \u003c/div>\n-  \u003c/form>\n+  \u003cdiv class="copilot-chat-shell">\n+    \u003ccopilot-chat agentId="default" appStreamingAutoScroll />\n+  \u003c/div>\n \u003c/aside>\n',
        },
        {
          path: "apps/angular-host/src/app/chat/chat.component.scss",
          after:
            ":host {\n  position: sticky;\n  top: 24px;\n  display: flex;\n  align-self: start;\n  height: clamp(520px, calc(100vh - 48px), 900px);\n  min-width: 0;\n  min-height: 0;\n  margin: -22px -22px -22px 0;\n  padding: 22px;\n  overflow: hidden;\n  border-left: 1px solid #e0d8cf;\n  background: #faf8f4;\n  color: #211c18;\n  contain: size;\n}\n\n* {\n  box-sizing: border-box;\n}\n\naside {\n  display: flex;\n  flex: 1;\n  flex-direction: column;\n  min-width: 0;\n  min-height: 0;\n}\n\n.eyebrow {\n  margin: 0;\n  color: #73513a;\n  font-size: 0.68rem;\n  font-weight: 850;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n\n.chat-heading {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n.chat-heading h2 {\n  margin: 3px 0 0;\n  font-size: 1.45rem;\n  line-height: 1.1;\n}\n\n.chat-heading > span {\n  padding: 6px 9px;\n  border-radius: 999px;\n  background: #e8e4ee;\n  color: #473e55;\n  font-size: 0.68rem;\n  font-weight: 800;\n  white-space: nowrap;\n}\n\n.chat-boundary {\n  margin: 14px 0;\n  color: #655d56;\n  font-size: 0.82rem;\n}\n\n.copilot-chat-shell {\n  display: block;\n  flex: 1;\n  min-height: 0;\n  border: 1px solid #ded6cd;\n  border-radius: 12px;\n  background: #faf8f4;\n  overflow: hidden;\n}\n\ncopilot-chat {\n  display: block;\n  height: 100%;\n}\n\n@media (max-width: 1100px) {\n  :host {\n    position: static;\n    order: -1;\n    height: 620px;\n    min-height: 480px;\n    margin: 0;\n    padding: 20px 0 22px;\n    border-left: 0;\n    border-bottom: 1px solid #e0d8cf;\n    background: transparent;\n  }\n}\n",
          diff: "@@ -1,8 +1,11 @@\n :host {\n+  position: sticky;\n+  top: 24px;\n   display: flex;\n-  align-self: stretch;\n+  align-self: start;\n+  height: clamp(520px, calc(100vh - 48px), 900px);\n   min-width: 0;\n-  min-height: 780px;\n+  min-height: 0;\n   margin: -22px -22px -22px 0;\n   padding: 22px;\n   overflow: hidden;\n@@ -62,119 +65,26 @@ aside {\n   font-size: 0.82rem;\n }\n \n-.conversation {\n-  display: grid;\n+.copilot-chat-shell {\n+  display: block;\n   flex: 1;\n-  align-content: start;\n-  gap: 10px;\n   min-height: 0;\n-  padding: 14px;\n-  margin: 0 0 14px;\n-  overflow-y: auto;\n   border: 1px solid #ded6cd;\n   border-radius: 12px;\n   background: #faf8f4;\n-  list-style: none;\n-}\n-\n-.chat-message {\n-  max-width: 92%;\n-  padding: 10px 12px;\n-  border-radius: 12px;\n-  background: #ece3d8;\n-}\n-\n-.chat-message-user {\n-  justify-self: end;\n-  background: #684529;\n-  color: #fff;\n+  overflow: hidden;\n }\n \n-.chat-message strong {\n+copilot-chat {\n   display: block;\n-  margin-bottom: 4px;\n-  font-size: 0.68rem;\n-}\n-\n-.chat-message p {\n-  margin: 0;\n-  white-space: pre-wrap;\n-}\n-\n-.chat-empty,\n-.chat-pending {\n-  color: #655d56;\n-  font-size: 0.8rem;\n-}\n-\n-.chat-error {\n-  padding: 9px 10px;\n-  border-left: 4px solid #b53b2d;\n-  background: #fff2ef;\n-  color: #71291f;\n-  font-size: 0.8rem;\n-}\n-\n-.chat-form {\n-  display: grid;\n-  gap: 8px;\n-}\n-\n-.chat-form label {\n-  font-size: 0.78rem;\n-  font-weight: 800;\n-}\n-\n-.chat-form textarea {\n-  width: 100%;\n-  resize: vertical;\n-  padding: 10px;\n-  border: 1px solid #b9aa9c;\n-  border-radius: 9px;\n-  color: #211c18;\n-  background: #fff;\n-  font: inherit;\n-  line-height: 1.45;\n-}\n-\n-.chat-form textarea:focus-visible,\n-button:focus-visible {\n-  outline: 3px solid #d38a2e;\n-  outline-offset: 2px;\n-}\n-\n-.chat-form-actions {\n-  display: flex;\n-  align-items: center;\n-  justify-content: space-between;\n-  gap: 10px;\n-}\n-\n-.chat-form-actions small {\n-  color: #6d655e;\n-  font-size: 0.68rem;\n-}\n-\n-button {\n-  padding: 9px 12px;\n-  border: 0;\n-  border-radius: 9px;\n-  background: #684529;\n-  color: #fff;\n-  font: inherit;\n-  font-size: 0.78rem;\n-  font-weight: 800;\n-  cursor: pointer;\n-}\n-\n-button:disabled {\n-  cursor: not-allowed;\n-  opacity: 0.58;\n+  height: 100%;\n }\n \n @media (max-width: 1100px) {\n   :host {\n+    position: static;\n     order: -1;\n+    height: 620px;\n     min-height: 480px;\n     margin: 0;\n     padding: 20px 0 22px;\n",
        },
        {
          path: "apps/angular-host/src/app/app.config.ts",
          after:
            "import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\nimport { provideHttpClient } from '@angular/common/http';\nimport { provideRouter } from '@angular/router';\nimport { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';\n\nimport { routes } from './app.routes';\n\nexport const appConfig: ApplicationConfig = {\n  providers: [\n    provideBrowserGlobalErrorListeners(),\n    provideHttpClient(),\n    provideRouter(routes),\n    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),\n    provideCopilotChatLabels({\n      chatInputPlaceholder: 'Ask about this view or its history…',\n      welcomeMessageText: 'How can I help?',\n      chatDisclaimerText:\n        'Check answers against facility evidence. Operational actions require operator control.',\n    }),\n  ],\n};\n",
          diff: "@@ -1,9 +1,21 @@\n import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';\n import { provideHttpClient } from '@angular/common/http';\n import { provideRouter } from '@angular/router';\n+import { provideCopilotChatLabels, provideCopilotKit } from '@copilotkit/angular';\n \n import { routes } from './app.routes';\n \n export const appConfig: ApplicationConfig = {\n-  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(), provideRouter(routes)],\n+  providers: [\n+    provideBrowserGlobalErrorListeners(),\n+    provideHttpClient(),\n+    provideRouter(routes),\n+    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),\n+    provideCopilotChatLabels({\n+      chatInputPlaceholder: 'Ask about this view or its history…',\n+      welcomeMessageText: 'How can I help?',\n+      chatDisclaimerText:\n+        'Check answers against facility evidence. Operational actions require operator control.',\n+    }),\n+  ],\n };\n",
        },
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: undefined,\n    copilotRuntime: createEmbeddedCopilotRuntime(options),\n  };\n}\n',
          diff: '@@ -1,11 +1,11 @@\n import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\n-import { createChatService } from "./chat.js";\n+import { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";\n \n export function createWorkshopConnections(\n   options: WorkshopOptions,\n ): WorkshopConnections {\n   return {\n-    chat: createChatService(options),\n-    copilotRuntime: undefined,\n+    chat: undefined,\n+    copilotRuntime: createEmbeddedCopilotRuntime(options),\n   };\n }\n',
        },
      ],
      flow: ["CopilotChat", "Copilot runtime", "BuiltInAgent", "Model"],
    },
    {
      id: "04",
      name: "Mastra agent",
      source: "workshop/speaker-notes/04-mastra.md",
      intro:
        "**Start:** completed 03. **Completed code:** [solution 04](../solutions/04/).",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 03. **Completed code:** [solution 04](../solutions/04/).",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The Angular chat can remain as it is. We are changing the agent behind the runtime\nand adding a place to inspect its execution.”\n\nShow the route: Angular :4300 → facility runtime :3101 → Mastra :4211 → model.",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/agent-service/src/mastra/agents/main/agent.ts`: show `new Agent`, the\n   `default` ID, prepared `main-04` prompt, injected model configuration, and empty\n   `tools`. This agent factory already exists in the starter; type a small part\n   if useful or explain it directly.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "`apps/agent-service/src/mastra/index.ts`: show agent registration, storage and\n   observability. Environment/model resolution lives here. Prepared historian\n   code is not registered as a Studio workflow until milestone 06.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "Start `pnpm dev:agent` in a second terminal. Open http://localhost:4211 and check\n   that the default agent appears. Do not display the API key.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "`apps/facility-service/src/workshop.ts`: switch the import and call from\n   `createEmbeddedCopilotRuntime` to `createWorkshopCopilotRuntime`.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Open `copilot-runtime.ts`: show the remote Mastra agent and AG-UI bridge. Explain\n   that its CommonJS compatibility loading is prepared setup, not the teaching goal.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Restart `pnpm dev` and reload the browser. No Angular file changes are needed.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "From the application ask: **In one sentence, why is humidity relevant in a chocolate factory?**\n\nIn Studio's observability/traces view find the run from that app request. Show\ninput, model call, output, and timing. Distinguish execution tracing from the\ndecision audit introduced later. Ask a live-reading question again: still no data tool.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“We can see the run, but the agent still cannot operate the application. Next we\ngive it specific frontend capabilities.”",
        },
      ],
      prompts: [
        "In one sentence, why is humidity relevant in a chocolate factory?",
      ],
      recovery:
        "Select 04, restart both terminals, reload browser/Studio. Confirm port 4211 and\nthe bridge URL before investigating model behavior. A direct Studio conversation\ndoes not have the app's browser tools; use the app for subsequent demonstrations.",
      files: [
        {
          path: "apps/facility-service/src/workshop.ts",
          after:
            'import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\nimport { createWorkshopCopilotRuntime } from "./copilot-runtime.js";\n\nexport function createWorkshopConnections(\n  options: WorkshopOptions,\n): WorkshopConnections {\n  return {\n    chat: undefined,\n    copilotRuntime: createWorkshopCopilotRuntime(options),\n  };\n}\n',
          diff: '@@ -1,11 +1,11 @@\n import type { WorkshopConnections, WorkshopOptions } from "./workshop-types.js";\n-import { createEmbeddedCopilotRuntime } from "./embedded-copilot-runtime.js";\n+import { createWorkshopCopilotRuntime } from "./copilot-runtime.js";\n \n export function createWorkshopConnections(\n   options: WorkshopOptions,\n ): WorkshopConnections {\n   return {\n     chat: undefined,\n-    copilotRuntime: createEmbeddedCopilotRuntime(options),\n+    copilotRuntime: createWorkshopCopilotRuntime(options),\n   };\n }\n',
        },
      ],
      flow: ["CopilotChat", "Copilot runtime", "Mastra agent", "Model"],
    },
    {
      id: "05",
      name: "Frontend tools",
      source: "workshop/speaker-notes/05-frontend-tools.md",
      intro:
        "**Start:** completed 04. **Completed code:** [solution 05](../solutions/05/).",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 04. **Completed code:** [solution 05](../solutions/05/).",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The model chooses a named operation with structured arguments. Angular applies\nthat operation to its existing state. We expose a small view description and\ndiscovery tools, not the entire application or its database.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/angular-host/src/app/workshop/connect.ts`: add `connectViewContext(host)`\n   and `registerFacilityTools(host)` with their prepared imports.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "Open `workshop/prepared-tools.ts`: explain `connectAgentContext`, then one\n   discovery tool (`list_rooms`) and one action (`update_filters`). There are four\n   catalog tools and three view/filter tools; do not type all seven registrations.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "Point to the schema, description, `agentId`, validation, and handler. The\n   handler reaches the existing `configureFacilityView` operation through the\n   prepared host adapter. The call executes in Angular's injection context.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "In `apps/agent-service/src/mastra/agents/main/agent.ts`, change the prompt import\n   from `main-04` to `main-05`. Keep backend `tools: {}`: these tools come from the\n   browser, not the Mastra server tool list.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Restart Mastra if needed and reload the browser. Keep `pnpm dev` running.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Ask: **Which rooms and shift managers can I filter by?** Inspect discovery calls.\n\nThen: **Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.**\n\nExpected: Reading log, room, condition and manager reflect the request.\n\nThen: **Change the start date to now.**\n\nBefore sending, say which values should stay the same. Afterward, inspect all\nfilters: only the start boundary changes. A temporarily empty log is reasonable\nbecause the range starts now. Clear the start date and show the prior filters remain.\n\nExplain omitted fields versus explicit clearing. For a code-level explanation,\nopen `applyFacilityViewCommand` in `packages/contracts/src/index.ts`; that is the\nprepared patch behavior behind the visible controls.",
        },
        {
          label: "TRANSITION",
          title: "Transition",
          body: "“These tools can operate existing filters. A question such as maximum temperature\nper manager needs a different data capability.”",
        },
      ],
      prompts: [
        "Which rooms and shift managers can I filter by?",
        "Switch to the reading log and show only warnings from the Cooling room managed by Charles Bond.",
        "Change the start date to now.",
      ],
      recovery:
        "Select 05 and restart/reload. If the model guesses an option, ask for discovery\nfirst and inspect the returned IDs. If filters unexpectedly disappear, inspect\nthe patch arguments and handler before changing the model prompt.",
      files: [
        {
          path: "apps/angular-host/src/app/workshop/connect.ts",
          after:
            "import type { WorkshopHost } from './host';\nimport { connectViewContext, registerFacilityTools } from './prepared-tools';\n\nexport function connectWorkshop(host: WorkshopHost): void {\n  connectViewContext(host);\n  registerFacilityTools(host);\n}\n",
          diff: "@@ -1,5 +1,7 @@\n import type { WorkshopHost } from './host';\n+import { connectViewContext, registerFacilityTools } from './prepared-tools';\n \n-export function connectWorkshop(_host: WorkshopHost): void {\n-  // Milestone 5: connect view context and frontend tools here.\n+export function connectWorkshop(host: WorkshopHost): void {\n+  connectViewContext(host);\n+  registerFacilityTools(host);\n }\n",
        },
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-05";\n\nexport const historianEnabled = false;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    tools: {},\n  });\n}\n',
          diff: '@@ -1,7 +1,7 @@\n import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-04";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-05";\n \n export const historianEnabled = false;\n export function createMainAgent(\n',
        },
      ],
      flow: ["Agent tool call", "AG-UI", "Angular handler", "View state"],
    },
    {
      id: "06",
      name: "Reviewed historian workflow",
      source: "workshop/speaker-notes/06-historian.md",
      intro:
        "**Start:** completed 05. **Completed code:** [solution 06](../solutions/06/).",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 05. **Completed code:** [solution 06](../solutions/06/).",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The agent gets one narrow question tool. A workflow generates a SQL proposal,\nreviews its meaning, and asks the facility service to validate and execute it.\nThe result still has to fit our prepared reading table.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "`apps/agent-service/src/mastra/agents/main/agent.ts`: select `main-06`, set\n   `historianEnabled = true`, import `createQueryHistorianTool`, and add\n   `query_historian: createQueryHistorianTool(workflow)` to `tools`.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "Open `tools/query-historian-tool.ts`: point to the input/output schemas and\n   `workflow.createRun()` → `run.start()`. The tool adapter does not generate SQL.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "Open `workflows/historian-query/workflow.ts`. Explain the three `.then(...)`\n   connections in order. The steps are already prepared; show their composition\n   without rewriting SQL execution infrastructure.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "Open the two prepared prompts under `mastra/prompts/sql-generator.ts` and\n   `sql-reviewer.ts`. Show the allowed view/columns and complete-reading result\n   requirement. Long prompt text is copied or imported, never typed live.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "In Angular's `workshop/connect.ts`, add `registerHistorianView(host)`. In\n   `prepared-tools.ts`, show how `show_historian_readings` validates the response\n   and opens the prepared Historian result view.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Restart Mastra and reload the browser/Studio. The historian workflow should\n   now appear in Studio. The facility API was already prepared in the starter.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate",
          body: "Ask: **Show me the maximum air temperature for each shift manager.**\n\nTrace `query_historian` → generator → reviewer → deterministic validation/execution\n→ `show_historian_readings`. Inspect the complete reading records in the result\nview. Explain that a maximum can be represented by selecting the stored row that\ncontains it. Do not promise an exact row count or value before seeing the data.\n\nThen: **Show me the average air temperature for each shift manager.**\n\nExpected: an explicit unsupported/rejected result because computed summaries do\nnot fit this milestone's complete-reading grid. It must not pretend an average\nis a stored reading. This motivates the later A2UI addition.\n\nFor the policy boundary, inspect `historian-query.ts` in the facility service:\nthe reviewer assesses meaning; deterministic policy and the read-only connection\nenforce execution restrictions. This branch preserves milestone 07's sequence:\ngenerate → review → validate-and-execute. Do not describe the unfinished 08 sequence.",
        },
      ],
      prompts: [
        "Show me the maximum air temperature for each shift manager.",
        "Show me the average air temperature for each shift manager.",
      ],
      recovery:
        "Select 06, restart services and reload. On failure find the workflow step and\nstructured error. A model refusal, schema mismatch, validator rejection and HTTP\nfailure are distinct. Never weaken SQL restrictions to make a live demo pass.",
      files: [
        {
          path: "apps/angular-host/src/app/workshop/connect.ts",
          after:
            "import type { WorkshopHost } from './host';\nimport { connectViewContext, registerFacilityTools, registerHistorianView } from './prepared-tools';\n\nexport function connectWorkshop(host: WorkshopHost): void {\n  connectViewContext(host);\n  registerFacilityTools(host);\n  registerHistorianView(host);\n}\n",
          diff: "@@ -1,7 +1,8 @@\n import type { WorkshopHost } from './host';\n-import { connectViewContext, registerFacilityTools } from './prepared-tools';\n+import { connectViewContext, registerFacilityTools, registerHistorianView } from './prepared-tools';\n \n export function connectWorkshop(host: WorkshopHost): void {\n   connectViewContext(host);\n   registerFacilityTools(host);\n+  registerHistorianView(host);\n }\n",
        },
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\nimport { createQueryHistorianTool } from "./tools/query-historian-tool";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-06";\n\nexport const historianEnabled = true;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    tools: { query_historian: createQueryHistorianTool(workflow) },\n  });\n}\n',
          diff: '@@ -1,9 +1,10 @@\n import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-05";\n+import { createQueryHistorianTool } from "./tools/query-historian-tool";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-06";\n \n-export const historianEnabled = false;\n+export const historianEnabled = true;\n export function createMainAgent(\n   apiKey: string,\n   model: string,\n@@ -18,6 +19,6 @@ export function createMainAgent(\n     name: "Soverius Chocolate Factory Assistant",\n     instructions: CHAT_SYSTEM_PROMPT,\n     model: openrouter(model),\n-    tools: {},\n+    tools: { query_historian: createQueryHistorianTool(workflow) },\n   });\n }\n',
        },
      ],
      flow: [
        "Historian tool",
        "Generate → review",
        "Validate + execute",
        "Result view",
      ],
    },
    {
      id: "07",
      name: "Human approval and audit",
      source: "workshop/speaker-notes/07-approval.md",
      intro:
        "**Start:** completed 06. Ensure the demo metric has no active alarm; use the\nconventional controls to acknowledge/resolve an existing one.\n**Completed code:** [solution 07](../solutions/07/).",
      actions: [
        {
          label: "PREPARE",
          title: "Before you begin",
          body: "**Start:** completed 06. Ensure the demo metric has no active alarm; use the\nconventional controls to acknowledge/resolve an existing one.\n**Completed code:** [solution 07](../solutions/07/).",
        },
        {
          label: "EXPLAIN",
          title: "Say",
          body: "“The assistant can propose an alarm. The operator decides, and the facility service\nrecords the actual outcome. A plausible model response is not authorization.”",
        },
        {
          label: "DO",
          title: "Open and change · 1",
          body: "In Angular's `workshop/connect.ts`, add `registerAlarmApproval()`.",
        },
        {
          label: "DO",
          title: "Open and change · 2",
          body: "In `prepared-tools.ts`, show the `registerHumanInTheLoop` call, shared schema,\n   and `AlarmApprovalCard` reference. The complete component already exists.",
        },
        {
          label: "DO",
          title: "Open and change · 3",
          body: "In the Mastra agent factory, change the instruction import to `main-07`.\n   Read its approval/rejection paragraph. No server-side alarm tool is added.",
        },
        {
          label: "DO",
          title: "Open and change · 4",
          body: "Open `alarm-approval-card.ts` and locate `decide()`: explain the facility API\n   call, persisted outcome, and the response that allows the paused run to continue.",
        },
        {
          label: "DO",
          title: "Open and change · 5",
          body: "Briefly open `FacilityRepository.decideAlarmApproval` to explain its transaction\n   and correlation ID. Implementation is prepared; do not type database code.",
        },
        {
          label: "DO",
          title: "Open and change · 6",
          body: "Restart Mastra if needed and reload the browser.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate: rejection first",
          body: "Ask: **Raise an alarm for the Packaging hall package reject rate because I want it investigated.**\n\nWait for the approval card. Point to the exact metric, reason and named operator.\nClick **Reject**. Show that no alarm was raised and that the audit records the\nrejection with its correlation ID. The assistant should report rejection.",
        },
        {
          label: "DEMONSTRATE",
          title: "Demonstrate: approval",
          body: "Make the request again and click **Approve and raise alarm**. Confirm the actual\nalarm in the conventional UI and the executed result in the audit. If execution\nfails, distinguish approval from successful execution. Acknowledge and resolve\nthe demo alarm with the conventional controls when finished.\n\nIf explaining duplicate decisions, show that replaying the same correlation ID\ndoes not create another alarm. Do not claim that every new conversational request\nshares that ID; a new proposal is a new decision.",
        },
        {
          label: "DO",
          title: "Transition to future content",
          body: "“We can select readings and request an approved action. Our result layout is still\nfixed. A2UI will let the assistant compose a view from components we supply.”\n\nStop at this promise until reviewed milestone 08 is adapted. A2A and MCP/MCP Apps\nremain later additions, not hidden capabilities in this starter.",
        },
      ],
      prompts: [
        "Raise an alarm for the Packaging hall package reject rate because I want it investigated.",
        "Reject",
        "Approve and raise alarm",
      ],
      recovery:
        "Select 07, restart/reload. If no card appears, check the registration, metric\ndiscovery and tool arguments. If saving a decision fails, inspect the facility\nresponse; never report success based only on the model's acknowledgement.",
      files: [
        {
          path: "apps/angular-host/src/app/workshop/connect.ts",
          after:
            "import type { WorkshopHost } from './host';\nimport {\n  connectViewContext,\n  registerFacilityTools,\n  registerHistorianView,\n  registerAlarmApproval,\n} from './prepared-tools';\n\nexport function connectWorkshop(host: WorkshopHost): void {\n  connectViewContext(host);\n  registerFacilityTools(host);\n  registerHistorianView(host);\n  registerAlarmApproval();\n}\n",
          diff: "@@ -1,8 +1,14 @@\n import type { WorkshopHost } from './host';\n-import { connectViewContext, registerFacilityTools, registerHistorianView } from './prepared-tools';\n+import {\n+  connectViewContext,\n+  registerFacilityTools,\n+  registerHistorianView,\n+  registerAlarmApproval,\n+} from './prepared-tools';\n \n export function connectWorkshop(host: WorkshopHost): void {\n   connectViewContext(host);\n   registerFacilityTools(host);\n   registerHistorianView(host);\n+  registerAlarmApproval();\n }\n",
        },
        {
          path: "apps/agent-service/src/mastra/agents/main/agent.ts",
          after:
            'import { createOpenAI } from "@ai-sdk/openai";\nimport { Agent } from "@mastra/core/agent";\nimport type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\nimport { createQueryHistorianTool } from "./tools/query-historian-tool";\nimport { CHAT_SYSTEM_PROMPT } from "../../prompts/main-07";\n\nexport const historianEnabled = true;\nexport function createMainAgent(\n  apiKey: string,\n  model: string,\n  workflow: ReturnType\u003ctypeof createHistorianQueryWorkflow>,\n) {\n  const openrouter = createOpenAI({\n    apiKey,\n    baseURL: "https://openrouter.ai/api/v1",\n  });\n  return new Agent({\n    id: "default",\n    name: "Soverius Chocolate Factory Assistant",\n    instructions: CHAT_SYSTEM_PROMPT,\n    model: openrouter(model),\n    tools: { query_historian: createQueryHistorianTool(workflow) },\n  });\n}\n',
          diff: '@@ -2,7 +2,7 @@ import { createOpenAI } from "@ai-sdk/openai";\n import { Agent } from "@mastra/core/agent";\n import type { createHistorianQueryWorkflow } from "../../workflows/historian-query/workflow";\n import { createQueryHistorianTool } from "./tools/query-historian-tool";\n-import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-06";\n+import { CHAT_SYSTEM_PROMPT } from "../../prompts/main-07";\n \n export const historianEnabled = true;\n export function createMainAgent(\n',
        },
      ],
      flow: [
        "Alarm proposal",
        "Operator decision",
        "Facility transaction",
        "Alarm + audit",
      ],
    },
  ],
};
