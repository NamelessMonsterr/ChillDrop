import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, and, lt } from "drizzle-orm";
import { rooms, files, messages, type Room, type InsertRoom, type File, type InsertFile, type Message, type InsertMessage } from "@shared/schema";
import bcrypt from "bcrypt";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  validateRoomPassword(roomId: string, password: string): Promise<boolean>;
  deleteExpiredRooms(): Promise<void>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFilesByRoom(roomId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  deleteExpiredFiles(): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoom(roomId: string): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const { password, expiryHours, ...roomData } = insertRoom;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));
    
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }
    
    const [room] = await db.insert(rooms).values({
      ...roomData,
      passwordHash,
      expiresAt,
    }).returning();
    
    return room;
  }
  
  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }
  
  async validateRoomPassword(roomId: string, password: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room?.passwordHash) return true;
    
    return bcrypt.compare(password, room.passwordHash);
  }
  
  async deleteExpiredRooms(): Promise<void> {
    await db.delete(rooms).where(lt(rooms.expiresAt, new Date()));
  }
  
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }
  
  async getFilesByRoom(roomId: string): Promise<File[]> {
    return db.select().from(files)
      .where(eq(files.roomId, roomId))
      .orderBy(desc(files.createdAt));
  }
  
  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }
  
  async deleteExpiredFiles(): Promise<void> {
    await db.delete(files).where(lt(files.expiresAt, new Date()));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  
  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt));
  }
}

export const storage = new DatabaseStorage();
