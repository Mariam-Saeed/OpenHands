import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AgentStatus } from "#/components/features/controls/agent-status";
import { AgentState } from "#/types/agent-state";
import { useAgentState } from "#/hooks/use-agent-state";
import { useStatusStore } from "#/state/status-store";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useUnifiedWebSocketStatus } from "#/hooks/use-unified-websocket-status";
import { useTaskPolling } from "#/hooks/query/use-task-polling";
import { useSubConversationTaskPolling } from "#/hooks/query/use-sub-conversation-task-polling";
import { useConversationStore } from "#/state/conversation-store";

// Mock all the hooks
vi.mock("#/hooks/use-agent-state");
vi.mock("#/state/status-store");
vi.mock("#/hooks/query/use-active-conversation");
vi.mock("#/hooks/use-unified-websocket-status");
vi.mock("#/hooks/query/use-task-polling");
vi.mock("#/hooks/query/use-sub-conversation-task-polling");
vi.mock("#/state/conversation-store");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("AgentStatus - isLoading logic", () => {
  const defaultProps = {
    handleStop: vi.fn(),
    handleResumeAgent: vi.fn(),
    disabled: false,
    isPausing: false,
  };

  const setupMocks = ({
    curAgentState = AgentState.INIT,
    webSocketStatus = "CONNECTED" as const,
    taskStatus = null,
    subConversationTaskStatus = null,
    isPausing = false,
  }) => {
    vi.mocked(useAgentState).mockReturnValue({
      curAgentState,
    });

    vi.mocked(useStatusStore).mockReturnValue({
      curStatusMessage: null,
      setShouldShownAgentLoading: vi.fn(),
    } as any);

    vi.mocked(useActiveConversation).mockReturnValue({
      data: {
        status: null,
        runtime_status: null,
        conversation_id: "test-id",
      },
    } as any);

    vi.mocked(useUnifiedWebSocketStatus).mockReturnValue(webSocketStatus);

    vi.mocked(useTaskPolling).mockReturnValue({
      taskStatus,
    } as any);

    vi.mocked(useSubConversationTaskPolling).mockReturnValue({
      taskStatus: subConversationTaskStatus,
    } as any);

    vi.mocked(useConversationStore).mockReturnValue({
      subConversationTaskId: null,
      setShouldShownAgentLoading: vi.fn(),
    } as any);

    return { ...defaultProps, isPausing };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("shouldShownAgentLoading conditions", () => {
    it("should show loading when curAgentState is INIT", () => {
      const props = setupMocks({ curAgentState: AgentState.INIT });
      render(<AgentStatus {...props} />);

      // AgentLoading component should be rendered
      const loadingElement = screen.getByTestId("agent-loading-spinner");
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe("isPausing prop", () => {
    it("should show loading when isPausing is true, even if shouldShownAgentLoading is false", () => {
      const props = setupMocks({
        curAgentState: AgentState.AWAITING_USER_INPUT,
        isPausing: true,
      });
      render(<AgentStatus {...props} />);

      const loadingElement = screen.getByTestId("agent-loading-spinner");
      expect(loadingElement).toBeInTheDocument();
    });

    it("should show loading when both isPausing and shouldShownAgentLoading are true", () => {
      const props = setupMocks({
        curAgentState: AgentState.LOADING,
        isPausing: true,
      });
      render(<AgentStatus {...props} />);

      const loadingElement = screen.getByTestId("agent-loading-spinner");
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe("global state management", () => {
    it("should NOT update global shouldShownAgentLoading when only isPausing is true", () => {
      const mockSetShouldShownAgentLoading = vi.fn();

      vi.mocked(useAgentState).mockReturnValue({
        curAgentState: AgentState.AWAITING_USER_INPUT,
      });

      vi.mocked(useStatusStore).mockReturnValue({
        curStatusMessage: null,
        setShouldShownAgentLoading: vi.fn(),
      } as any);

      vi.mocked(useActiveConversation).mockReturnValue({
        data: {
          status: null,
          runtime_status: null,
          conversation_id: "test-id",
        },
      } as any);

      vi.mocked(useUnifiedWebSocketStatus).mockReturnValue("CONNECTED");

      vi.mocked(useTaskPolling).mockReturnValue({
        taskStatus: null,
      } as any);

      vi.mocked(useSubConversationTaskPolling).mockReturnValue({
        taskStatus: null,
      } as any);

      vi.mocked(useConversationStore).mockReturnValue({
        subConversationTaskId: null,
        setShouldShownAgentLoading: mockSetShouldShownAgentLoading,
      } as any);

      const props = {
        ...defaultProps,
        isPausing: true,
      };

      render(<AgentStatus {...props} />);

      // The component should render loading UI
      expect(screen.getByTestId("agent-loading-spinner")).toBeInTheDocument();

      // But global state should be set to false because shouldShownAgentLoading is false
      expect(mockSetShouldShownAgentLoading).toHaveBeenCalledWith(false);
    });
  });
});
