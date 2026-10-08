import { describe, it, expect, vi, beforeEach } from "vitest";
import { tableService } from "./api";
import api from "./api";

vi.mock("axios", () => {
  return {
    default: {
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      })),
    },
  };
});

describe("API Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tableService", () => {
    it("should call GET /tables for getAll", async () => {
      api.get.mockResolvedValue({ data: [{ id: 1, tableNumber: "1" }] });
      const result = await tableService.getAll();
      expect(api.get).toHaveBeenCalledWith("/tables");
      expect(result.data).toEqual([{ id: 1, tableNumber: "1" }]);
    });

    it("should call POST /tables for create", async () => {
      const tableData = { tableNumber: "2", capacity: 4 };
      api.post.mockResolvedValue({ data: { id: 2, ...tableData } });
      const result = await tableService.create(tableData);
      expect(api.post).toHaveBeenCalledWith("/tables", tableData);
      expect(result.data.id).toBe(2);
    });
  });
});
