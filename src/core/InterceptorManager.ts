export class InterceptorManager<V> {
  private handlers: Array<{
    onFulfilled?: (value: V) => V | Promise<V>;
    onRejected?: (error: any) => any;
  } | null>;

  constructor() {
    this.handlers = [];
  }

  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: any) => any
  ): number {
    this.handlers.push({
      ...(onFulfilled ? { onFulfilled } : {}),
      ...(onRejected ? { onRejected } : {}),
    });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  forEach(
    fn: (interceptor: {
      onFulfilled?: (value: V) => V | Promise<V>;
      onRejected?: (error: any) => any;
    }) => void
  ): void {
    this.handlers.forEach((h) => {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
