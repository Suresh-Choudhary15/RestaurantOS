const http = require("http");
const socketIO = require("socket.io");
const socketIOClient = require("socket.io-client");
const {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} = require("@jest/globals");

describe("WebSocket Integration Tests", () => {
  let server;
  let io;
  let clientSocket;
  const testURL = "http://localhost:4001";
  const PORT = 4001;

  beforeEach((done) => {
    // Create a test HTTP server
    server = http.createServer();
    io = socketIO(server, {
      cors: {
        origin: "http://localhost:3000",
        credentials: true,
      },
    });

    // Set up basic socket event handlers
    io.on("connection", (socket) => {
      socket.on("join-room", (room) => {
        socket.join(room);
      });

      socket.on("leave-room", (room, callback) => {
        socket.leave(room);
        if (callback) callback();
      });
    });

    server.listen(PORT, () => {
      clientSocket = socketIOClient(testURL, {
        reconnection: true,
        reconnectionDelay: 100,
        reconnectionDelayMax: 1000,
      });

      clientSocket.on("connect", () => {
        done();
      });

      clientSocket.on("error", (err) => {
        console.error("Socket connection error:", err);
        done(err);
      });
    });
  });

  afterEach((done) => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close();
    server.close(() => {
      done();
    });
  });

  describe("Order Status Updates", () => {
    it("should emit order:status-update event with correct payload", (done) => {
      const mockOrder = {
        orderId: "order-123",
        status: "PREPARING",
        tableId: "table-1",
        timestamp: new Date().toISOString(),
      };

      clientSocket.on("order:status-update", (data) => {
        expect(data).toEqual(mockOrder);
        expect(data.orderId).toBe("order-123");
        expect(data.status).toBe("PREPARING");
        expect(data.tableId).toBe("table-1");
        expect(data.timestamp).toBeDefined();
        done();
      });

      // Simulate server emitting order status update
      io.emit("order:status-update", mockOrder);
    });

    it("should handle multiple order status updates", (done) => {
      const updates = [];
      const mockOrders = [
        {
          id: "order-1",
          status: "PENDING",
          tableId: "table-1",
          timestamp: new Date().toISOString(),
        },
        {
          id: "order-2",
          status: "PREPARING",
          tableId: "table-2",
          timestamp: new Date().toISOString(),
        },
        {
          id: "order-3",
          status: "READY",
          tableId: "table-3",
          timestamp: new Date().toISOString(),
        },
      ];

      clientSocket.on("order:status-update", (data) => {
        updates.push(data);
        if (updates.length === 3) {
          expect(updates).toHaveLength(3);
          expect(updates[0].status).toBe("PENDING");
          expect(updates[1].status).toBe("PREPARING");
          expect(updates[2].status).toBe("READY");
          done();
        }
      });

      // Emit multiple updates
      mockOrders.forEach((order) => {
        io.emit("order:status-update", order);
      });
    });

    it("should track order status transitions", (done) => {
      const statuses = [];

      clientSocket.on("order:status-update", (data) => {
        statuses.push(data.status);
        if (statuses.length === 3) {
          expect(statuses).toEqual(["PENDING", "PREPARING", "READY"]);
          done();
        }
      });

      const transitions = [
        {
          id: "order-123",
          status: "PENDING",
          tableId: "table-1",
          timestamp: new Date().toISOString(),
        },
        {
          id: "order-123",
          status: "PREPARING",
          tableId: "table-1",
          timestamp: new Date().toISOString(),
        },
        {
          id: "order-123",
          status: "READY",
          tableId: "table-1",
          timestamp: new Date().toISOString(),
        },
      ];

      transitions.forEach((update) => {
        io.emit("order:status-update", update);
      });
    });
  });

  describe("Low Stock Alerts", () => {
    it("should emit inventory:low-stock-alert event with correct payload", (done) => {
      const mockAlert = {
        ingredientId: "ing-123",
        name: "Tomato",
        currentStock: 5,
        reorderLevel: 10,
        unit: "kg",
        severity: "WARNING",
        timestamp: new Date().toISOString(),
      };

      clientSocket.on("inventory:low-stock-alert", (data) => {
        expect(data).toEqual(mockAlert);
        expect(data.ingredientId).toBe("ing-123");
        expect(data.name).toBe("Tomato");
        expect(data.currentStock).toBe(5);
        expect(data.reorderLevel).toBe(10);
        expect(data.severity).toBe("WARNING");
        done();
      });

      io.emit("inventory:low-stock-alert", mockAlert);
    });

    it("should distinguish between WARNING and CRITICAL severity", (done) => {
      const alerts = [];

      clientSocket.on("inventory:low-stock-alert", (data) => {
        alerts.push(data);
        if (alerts.length === 2) {
          expect(alerts[0].severity).toBe("WARNING");
          expect(alerts[1].severity).toBe("CRITICAL");
          done();
        }
      });

      io.emit("inventory:low-stock-alert", {
        ingredientId: "ing-1",
        name: "Flour",
        currentStock: 5,
        reorderLevel: 10,
        unit: "kg",
        severity: "WARNING",
        timestamp: new Date().toISOString(),
      });

      io.emit("inventory:low-stock-alert", {
        ingredientId: "ing-2",
        name: "Salt",
        currentStock: 0,
        reorderLevel: 5,
        unit: "kg",
        severity: "CRITICAL",
        timestamp: new Date().toISOString(),
      });
    });

    it("should handle multiple low stock alerts", (done) => {
      const alerts = [];
      const mockAlerts = [
        {
          ingredientId: "ing-1",
          name: "Tomato",
          currentStock: 2,
          reorderLevel: 10,
          unit: "kg",
          severity: "CRITICAL",
          timestamp: new Date().toISOString(),
        },
        {
          ingredientId: "ing-2",
          name: "Cheese",
          currentStock: 5,
          reorderLevel: 20,
          unit: "kg",
          severity: "WARNING",
          timestamp: new Date().toISOString(),
        },
        {
          ingredientId: "ing-3",
          name: "Olive Oil",
          currentStock: 1,
          reorderLevel: 5,
          unit: "l",
          severity: "CRITICAL",
          timestamp: new Date().toISOString(),
        },
      ];

      clientSocket.on("inventory:low-stock-alert", (data) => {
        alerts.push(data);
        if (alerts.length === 3) {
          expect(alerts).toHaveLength(3);
          expect(alerts.filter((a) => a.severity === "CRITICAL")).toHaveLength(
            2,
          );
          expect(alerts.filter((a) => a.severity === "WARNING")).toHaveLength(
            1,
          );
          done();
        }
      });

      mockAlerts.forEach((alert) => {
        io.emit("inventory:low-stock-alert", alert);
      });
    });
  });

  describe("Order Item Status Updates", () => {
    it("should emit order-item:status-update event", (done) => {
      const mockItemUpdate = {
        orderItemId: "item-123",
        orderId: "order-123",
        status: "READY",
        timestamp: new Date().toISOString(),
      };

      clientSocket.on("order-item:status-update", (data) => {
        expect(data).toEqual(mockItemUpdate);
        expect(data.orderItemId).toBe("item-123");
        expect(data.orderId).toBe("order-123");
        expect(data.status).toBe("READY");
        done();
      });

      io.emit("order-item:status-update", mockItemUpdate);
    });
  });

  describe("New Order Notifications", () => {
    it("should emit order:new event when order is created", (done) => {
      const mockNewOrder = {
        orderId: "order-123",
        tableId: "table-5",
        status: "PENDING",
        itemCount: 3,
        timestamp: new Date().toISOString(),
      };

      clientSocket.on("order:new", (data) => {
        expect(data).toEqual(mockNewOrder);
        expect(data.itemCount).toBe(3);
        done();
      });

      io.emit("order:new", mockNewOrder);
    });
  });

  describe("Room Operations", () => {
    it("should allow clients to join rooms", (done) => {
      const room = "kitchen-display";

      clientSocket.emit("join-room", room);

      // Give it a moment to join
      setTimeout(() => {
        // Emit event to specific room
        io.to(room).emit("room-test", { message: "test" });

        clientSocket.on("room-test", (data) => {
          expect(data.message).toBe("test");
          done();
        });
      }, 100);
    });

    it("should allow clients to leave rooms", (done) => {
      const room = "waiter-updates";

      clientSocket.emit("join-room", room);

      setTimeout(() => {
        clientSocket.emit("leave-room", room, () => {
          let messageReceived = false;

          clientSocket.on("room-specific-event", () => {
            messageReceived = true;
          });

          io.to(room).emit("room-specific-event", { data: "test" });

          setTimeout(() => {
            expect(messageReceived).toBe(false);
            done();
          }, 200);
        });
      }, 100);
    });
  });

  describe("Connection Lifecycle", () => {
    it("should handle client connections", (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    it("should track socket id", (done) => {
      expect(clientSocket.id).toBeDefined();
      expect(typeof clientSocket.id).toBe("string");
      expect(clientSocket.id.length).toBeGreaterThan(0);
      done();
    });
  });
});
