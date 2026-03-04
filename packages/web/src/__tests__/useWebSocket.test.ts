import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebSocket } from "../hooks/useWebSocket";
import type { WsMessage } from "../types";

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  close = vi.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.();
  }

  simulateMessage(data: WsMessage) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = 3;
    this.onclose?.();
  }
}

describe("useWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("connects to ws://localhost:5173/ws", () => {
    renderHook(() => useWebSocket(vi.fn()));
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe("ws://localhost:5173/ws");
  });

  it("reports connected status on open", () => {
    const { result } = renderHook(() => useWebSocket(vi.fn()));
    expect(result.current).toBe("disconnected");

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });
    expect(result.current).toBe("connected");
  });

  it("calls onMessage with parsed WsMessage", () => {
    const onMessage = vi.fn();
    renderHook(() => useWebSocket(onMessage));

    const msg: WsMessage = {
      type: "agent_status",
      payload: { id: "a1", status: "working" },
      ts: Date.now(),
    };

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage(msg);
    });

    expect(onMessage).toHaveBeenCalledWith(msg);
  });

  it("reports disconnected on close", () => {
    const { result } = renderHook(() => useWebSocket(vi.fn()));

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });
    expect(result.current).toBe("connected");

    act(() => {
      MockWebSocket.instances[0].simulateClose();
    });
    expect(result.current).toBe("disconnected");
  });

  it("attempts reconnect with exponential backoff", () => {
    renderHook(() => useWebSocket(vi.fn()));
    const initialCount = MockWebSocket.instances.length;

    act(() => {
      MockWebSocket.instances[0].simulateClose();
    });

    // First reconnect after 1s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(MockWebSocket.instances.length).toBe(initialCount + 1);

    // Second reconnect after 2s
    act(() => {
      MockWebSocket.instances[MockWebSocket.instances.length - 1].simulateClose();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(MockWebSocket.instances.length).toBe(initialCount + 2);
  });

  it("closes WebSocket on unmount", () => {
    const { unmount } = renderHook(() => useWebSocket(vi.fn()));
    const ws = MockWebSocket.instances[0];
    act(() => {
      ws.simulateOpen();
    });
    unmount();
    expect(ws.close).toHaveBeenCalled();
  });
});
