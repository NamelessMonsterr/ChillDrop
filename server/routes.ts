import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRoomSchema, insertFileSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Room routes
  app.post("/api/rooms", async (req, res) => {
    try {
      console.log("Received room data:", req.body);
      const roomData = insertRoomSchema.parse(req.body);
      console.log("Parsed room data:", roomData);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      console.error("Room creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid room data", details: error.errors });
      } else {
        res.status(400).json({ error: "Invalid room data" });
      }
    }
  });
  
  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      
      // Don't return password hash
      const { passwordHash, ...safeRoom } = room;
      res.json({ ...safeRoom, hasPassword: !!passwordHash });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });
  
  app.post("/api/rooms/:id/validate-password", async (req, res) => {
    try {
      const { password } = req.body;
      const isValid = await storage.validateRoomPassword(req.params.id, password);
      res.json({ valid: isValid });
    } catch (error) {
      res.status(500).json({ error: "Failed to validate password" });
    }
  });
  
  // File routes
  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.json(file);
    } catch (error) {
      res.status(400).json({ error: "Invalid file data" });
    }
  });
  
  app.get("/api/rooms/:roomId/files", async (req, res) => {
    try {
      const files = await storage.getFilesByRoom(req.params.roomId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });
  
  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });
  
  // Message routes
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });
  
  app.get("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesByRoom(req.params.roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // Cleanup route (would be called by scheduled job)
  app.post("/api/cleanup", async (req, res) => {
    try {
      await storage.deleteExpiredFiles();
      await storage.deleteExpiredRooms();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Cleanup failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
