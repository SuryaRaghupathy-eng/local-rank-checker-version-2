import { 
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Search,
  type InsertSearch,
  type RankingResult,
  type InsertRankingResult,
  users,
  projects,
  searches,
  rankingResults
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  createSearch(search: InsertSearch): Promise<Search>;
  getSearch(id: string): Promise<Search | undefined>;
  updateSearch(id: string, search: Partial<InsertSearch>): Promise<Search | undefined>;
  getSearchesByProject(projectId: string): Promise<Search[]>;
  getAllSearches(limit?: number): Promise<Search[]>;
  getScheduledSearches(): Promise<Search[]>;
  
  createRankingResult(result: InsertRankingResult): Promise<RankingResult>;
  createRankingResults(results: InsertRankingResult[]): Promise<RankingResult[]>;
  getRankingResultsBySearch(searchId: string): Promise<RankingResult[]>;
  getRankingHistory(query: string, brand: string, branch: string, startDate?: Date, endDate?: Date): Promise<RankingResult[]>;
}

export class PostgresStorage implements IStorage {
  private db;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    const pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values(project).returning();
    return result[0];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return await this.db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async createSearch(search: InsertSearch): Promise<Search> {
    const normalizedSearch: any = { ...search };
    
    if (normalizedSearch.projectId === undefined) {
      normalizedSearch.projectId = null;
    }
    if (normalizedSearch.isRecurring === undefined) {
      normalizedSearch.isRecurring = false;
    }
    if (normalizedSearch.processingTimeSeconds === undefined) {
      normalizedSearch.processingTimeSeconds = null;
    }
    if (normalizedSearch.scheduledFor === undefined) {
      normalizedSearch.scheduledFor = null;
    }
    if (normalizedSearch.recurringInterval === undefined) {
      normalizedSearch.recurringInterval = null;
    }
    
    const result = await this.db.insert(searches).values(normalizedSearch).returning();
    return result[0];
  }

  async getSearch(id: string): Promise<Search | undefined> {
    const result = await this.db.select().from(searches).where(eq(searches.id, id)).limit(1);
    return result[0];
  }

  async updateSearch(id: string, search: Partial<InsertSearch>): Promise<Search | undefined> {
    const result = await this.db
      .update(searches)
      .set(search)
      .where(eq(searches.id, id))
      .returning();
    return result[0];
  }

  async getSearchesByProject(projectId: string): Promise<Search[]> {
    return await this.db
      .select()
      .from(searches)
      .where(eq(searches.projectId, projectId))
      .orderBy(desc(searches.createdAt));
  }

  async getAllSearches(limit: number = 50): Promise<Search[]> {
    return await this.db
      .select()
      .from(searches)
      .orderBy(desc(searches.createdAt))
      .limit(limit);
  }

  async getScheduledSearches(): Promise<Search[]> {
    const now = new Date();
    return await this.db
      .select()
      .from(searches)
      .where(
        and(
          eq(searches.isRecurring, true),
          lte(searches.scheduledFor, now)
        )
      );
  }

  async createRankingResult(result: InsertRankingResult): Promise<RankingResult> {
    const insertResult = await this.db.insert(rankingResults).values(result).returning();
    return insertResult[0];
  }

  async createRankingResults(results: InsertRankingResult[]): Promise<RankingResult[]> {
    if (results.length === 0) return [];
    const insertedResults = await this.db.insert(rankingResults).values(results).returning();
    return insertedResults;
  }

  async getRankingResultsBySearch(searchId: string): Promise<RankingResult[]> {
    return await this.db
      .select()
      .from(rankingResults)
      .where(eq(rankingResults.searchId, searchId))
      .orderBy(rankingResults.query, rankingResults.rankingPosition);
  }

  async getRankingHistory(
    query: string, 
    brand: string, 
    branch: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RankingResult[]> {
    const conditions = [
      eq(rankingResults.query, query),
      eq(rankingResults.brand, brand),
      eq(rankingResults.branch, branch),
    ];

    if (startDate) {
      conditions.push(gte(rankingResults.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(rankingResults.createdAt, endDate));
    }

    return await this.db
      .select()
      .from(rankingResults)
      .where(and(...conditions))
      .orderBy(desc(rankingResults.createdAt));
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private searches: Map<string, Search>;
  private rankingResults: Map<string, RankingResult>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.searches = new Map();
    this.rankingResults = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      ...project,
      description: project.description ?? null,
      queryData: project.queryData ?? null,
      country: project.country ?? null,
      language: project.language ?? null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...project, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async createSearch(search: InsertSearch): Promise<Search> {
    const id = randomUUID();
    const newSearch: Search = {
      ...search,
      status: search.status ?? 'completed',
      country: search.country ?? 'gb',
      language: search.language ?? 'en',
      isRecurring: search.isRecurring ?? false,
      projectId: search.projectId ?? null,
      processingTimeSeconds: search.processingTimeSeconds ?? null,
      scheduledFor: search.scheduledFor ?? null,
      recurringInterval: search.recurringInterval ?? null,
      id,
      createdAt: new Date(),
    };
    this.searches.set(id, newSearch);
    return newSearch;
  }

  async getSearch(id: string): Promise<Search | undefined> {
    return this.searches.get(id);
  }

  async updateSearch(id: string, search: Partial<InsertSearch>): Promise<Search | undefined> {
    const existing = this.searches.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...search };
    this.searches.set(id, updated);
    return updated;
  }

  async getSearchesByProject(projectId: string): Promise<Search[]> {
    return Array.from(this.searches.values())
      .filter(s => s.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllSearches(limit: number = 50): Promise<Search[]> {
    return Array.from(this.searches.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getScheduledSearches(): Promise<Search[]> {
    const now = new Date();
    return Array.from(this.searches.values()).filter(
      s => s.isRecurring && s.scheduledFor && s.scheduledFor <= now
    );
  }

  async createRankingResult(result: InsertRankingResult): Promise<RankingResult> {
    const id = randomUUID();
    const newResult: RankingResult = {
      ...result,
      rankingPosition: result.rankingPosition ?? null,
      title: result.title ?? null,
      address: result.address ?? null,
      rating: result.rating ?? null,
      category: result.category ?? null,
      latitude: result.latitude ?? null,
      longitude: result.longitude ?? null,
      rawData: result.rawData ?? null,
      id,
      createdAt: new Date(),
    };
    this.rankingResults.set(id, newResult);
    return newResult;
  }

  async createRankingResults(results: InsertRankingResult[]): Promise<RankingResult[]> {
    return Promise.all(results.map(r => this.createRankingResult(r)));
  }

  async getRankingResultsBySearch(searchId: string): Promise<RankingResult[]> {
    return Array.from(this.rankingResults.values())
      .filter(r => r.searchId === searchId)
      .sort((a, b) => {
        if (a.query !== b.query) return a.query.localeCompare(b.query);
        return (a.rankingPosition || 0) - (b.rankingPosition || 0);
      });
  }

  async getRankingHistory(
    query: string,
    brand: string,
    branch: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RankingResult[]> {
    return Array.from(this.rankingResults.values())
      .filter(r => {
        if (r.query !== query || r.brand !== brand || r.branch !== branch) return false;
        if (startDate && r.createdAt < startDate) return false;
        if (endDate && r.createdAt > endDate) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
