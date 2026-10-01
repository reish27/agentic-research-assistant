export type ToolKind = "read" | "edit" | "terminal" | "search";

export type ToolStatus = "running" | "done";

export interface ToolCall {
  id: string;
  kind: ToolKind;
  label: string;
  detail: string;
  status: ToolStatus;
}

export interface PipelineTestResult {
  test_number?: number;
  passed: boolean;
  input?: string;
  expected_output?: string;
  actual_output?: string;
  error?: string;
}

export interface PipelineCompileResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PipelineResult {
  mode?: "code" | "answer" | "error";
  status: "success" | "failed" | "error";
  language?: string | null;
  answer?: string | null;
  reasoning?: string | null;
  code?: string | null;
  compile?: PipelineCompileResult | null;
  test?: {
    all_passed?: boolean;
    total_tests?: number;
    passed_tests?: number;
    failed_tests?: number;
    results?: PipelineTestResult[];
  } | null;
  error?: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content?: string;
  stream?: boolean;
  toolCalls?: ToolCall[];
  pipeline?: PipelineResult;
}

export interface Session {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}
