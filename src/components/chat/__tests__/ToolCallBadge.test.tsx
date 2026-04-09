import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// str_replace_editor — create
test("shows 'Creating <filename>' for str_replace_editor create command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

// str_replace_editor — str_replace
test("shows 'Editing <filename>' for str_replace_editor str_replace command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "src/components/Card.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

// str_replace_editor — insert
test("shows 'Editing <filename>' for str_replace_editor insert command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "insert", path: "src/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

// str_replace_editor — view
test("shows 'Reading <filename>' for str_replace_editor view command", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "view", path: "src/index.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Reading index.jsx")).toBeDefined();
});

// file_manager — delete
test("shows 'Deleting <filename>' for file_manager delete command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/OldComponent.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting OldComponent.jsx")).toBeDefined();
});

// file_manager — rename
test("shows 'Renaming <old> → <new>' for file_manager rename command", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{
        command: "rename",
        path: "src/Old.jsx",
        new_path: "src/New.jsx",
      }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming Old.jsx → New.jsx")).toBeDefined();
});

// Pending state → spinner present
test("shows spinner when state is not 'result'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="call"
    />
  );
  // Loader2 renders as an svg with the animate-spin class
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).not.toBeNull();
});

// Completed state → no spinner
test("does not show spinner when state is 'result'", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "App.jsx" }}
      state="result"
    />
  );
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeNull();
});

// Fallback for unknown tool
test("shows raw tool name for unknown tools", () => {
  render(
    <ToolCallBadge
      toolName="unknown_tool"
      args={{}}
      state="call"
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

// Uses only the filename, not the full path
test("displays only the filename, not the full path", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/components/ui/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});
