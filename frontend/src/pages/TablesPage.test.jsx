import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TablesPage from "./TablesPage";
import { tableService } from "../services/api";

vi.mock("../services/api", () => ({
  tableService: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("TablesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the table management heading", () => {
    render(<TablesPage />);
    expect(screen.getByText(/Table Management/i)).toBeInTheDocument();
  });

  it("loads and displays tables on mount", async () => {
    const mockTables = [
      { id: 1, tableNumber: "1", capacity: 4 },
      { id: 2, tableNumber: "2", capacity: 2 },
    ];
    tableService.getAll.mockResolvedValue({ data: mockTables });

    render(<TablesPage />);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    });
  });

  it("allows adding a new table", async () => {
    tableService.getAll.mockResolvedValue({ data: [] });
    tableService.create.mockResolvedValue({
      data: { id: 3, tableNumber: "3", capacity: 6 },
    });

    render(<TablesPage />);

    fireEvent.change(screen.getByPlaceholderText(/Table Number/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Capacity/i), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByText(/Add Table/i));

    await waitFor(() => {
      expect(tableService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tableNumber: "3",
          capacity: 6,
        }),
      );
    });
  });
});
