import { afterNextRender, DestroyRef, Directive, effect, ElementRef, inject } from '@angular/core';
import { injectAgentStore } from '@copilotkit/angular';

@Directive({
  selector: 'copilot-chat[appStreamingAutoScroll]',
})
export class StreamingAutoScrollDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly agentStore = injectAgentStore('default');

  private scrollContainer?: HTMLElement;
  private viewObserver?: MutationObserver;
  private contentObserver?: MutationObserver;
  private animationFrame?: number;
  private followsLatestMessage = true;

  constructor() {
    afterNextRender(() => {
      if (!this.connectToScrollContainer()) {
        this.viewObserver = new MutationObserver(() => this.connectToScrollContainer());
        this.viewObserver.observe(this.host.nativeElement, { childList: true, subtree: true });
      }
    });

    effect(() => {
      if (this.agentStore().isRunning()) {
        this.followsLatestMessage = true;
        this.scheduleScrollToBottom();
      }
    });

    this.destroyRef.onDestroy(() => this.disconnect());
  }

  private connectToScrollContainer(): boolean {
    if (this.scrollContainer) {
      return true;
    }

    const scrollContainer = this.host.nativeElement.querySelector<HTMLElement>(
      'copilot-chat-view-scroll-view [cdkscrollable]',
    );

    if (!scrollContainer) {
      return false;
    }

    this.scrollContainer = scrollContainer;
    this.viewObserver?.disconnect();
    this.viewObserver = undefined;
    this.scrollContainer.addEventListener('scroll', this.handleScroll, { passive: true });
    this.scrollContainer.addEventListener('wheel', this.handleWheel, { passive: true });
    this.scrollContainer.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.contentObserver = new MutationObserver(() => {
      if (this.agentStore().isRunning() && this.followsLatestMessage) {
        this.scheduleScrollToBottom();
      }
    });
    this.contentObserver.observe(this.scrollContainer, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    if (this.agentStore().isRunning()) {
      this.scheduleScrollToBottom();
    }

    return true;
  }

  private readonly handleScroll = (): void => {
    if (!this.scrollContainer) {
      return;
    }

    const distanceFromBottom =
      this.scrollContainer.scrollHeight -
      this.scrollContainer.clientHeight -
      this.scrollContainer.scrollTop;

    if (distanceFromBottom <= 16) {
      this.followsLatestMessage = true;
    }
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    if (event.deltaY < 0) {
      this.followsLatestMessage = false;
    }
  };

  private readonly handleTouchStart = (): void => {
    this.followsLatestMessage = false;
  };

  private scheduleScrollToBottom(): void {
    if (!this.scrollContainer) {
      return;
    }

    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.animationFrame = requestAnimationFrame(() => {
      if (this.scrollContainer) {
        this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
      }
      this.animationFrame = undefined;
    });
  }

  private disconnect(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.viewObserver?.disconnect();
    this.contentObserver?.disconnect();
    this.scrollContainer?.removeEventListener('scroll', this.handleScroll);
    this.scrollContainer?.removeEventListener('wheel', this.handleWheel);
    this.scrollContainer?.removeEventListener('touchstart', this.handleTouchStart);
  }
}
