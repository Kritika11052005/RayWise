// convex/savedProjects.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type PolygonPoint = {
  x: number;
  y: number;
};

type SavedProjectAnalysis = {
  totalPanels: number;
  totalPowerKw: number;
  orientation: number | string;
  layout: string;
  annualProduction: number;
  recommendations: string;
  sunAnalysis?: string;
  shadowAnalysis?: string;
};

type PanelLayoutItem = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type SavedProjectUpdates = {
  updatedAt: number;
  name?: string;
  description?: string;
  polygonPoints?: PolygonPoint[];
  analysis?: SavedProjectAnalysis;
  status?: "draft" | "analyzed";
  panelLayout?: PanelLayoutItem[];
};

// Helper function to get or create user
async function getOrCreateUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Try to find user by token identifier
  let user = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  // If user doesn't exist, try by email
  const email = identity.email;

  if (!user && email) {
    user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  }

  // If still no user, create one
  if (!user) {
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email || "",
      name: identity.name || "User",
      createdAt: Date.now(),
    });
    user = await ctx.db.get(userId);
  }

  if (!user) {
    throw new Error("Failed to get or create user");
  }

  return user;
}

// Save a new project (draft state)
export const saveProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    location: v.object({
      city: v.string(),
      country: v.string(),
      lat: v.optional(v.number()),
      lon: v.optional(v.number()),
    }),
    imageUrl: v.optional(v.string()),
    imageSource: v.union(v.literal("upload"), v.literal("map")),
    polygonPoints: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    ),
    imageWidth: v.number(),
    imageHeight: v.number(),
    analysis: v.optional(v.object({
      totalPanels: v.number(),
      totalPowerKw: v.number(),
      orientation: v.union(v.number(), v.string()),
      layout: v.string(),
      annualProduction: v.number(),
      recommendations: v.string(),
      sunAnalysis: v.optional(v.string()),
      shadowAnalysis: v.optional(v.string()),
    })),
    panelLayout: v.optional(v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        rotation: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const now = Date.now();
    const status = args.analysis ? "analyzed" : "draft";

    const projectId = await ctx.db.insert("savedProjects", {
      userId: user._id,
      name: args.name,
      description: args.description,
      location: args.location,
      imageUrl: args.imageUrl,
      imageSource: args.imageSource,
      polygonPoints: args.polygonPoints,
      imageWidth: args.imageWidth,
      imageHeight: args.imageHeight,
      analysis: args.analysis,
      panelLayout: args.panelLayout,
      createdAt: now,
      updatedAt: now,
      status,
    });

    return projectId;
  },
});

// Update an existing saved project
export const updateProject = mutation({
  args: {
    projectId: v.id("savedProjects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    polygonPoints: v.optional(v.array(
      v.object({
        x: v.number(),
        y: v.number(),
      })
    )),
    analysis: v.optional(v.object({
      totalPanels: v.number(),
      totalPowerKw: v.number(),
      orientation: v.union(v.number(), v.string()),
      layout: v.string(),
      annualProduction: v.number(),
      recommendations: v.string(),
      sunAnalysis: v.optional(v.string()),
      shadowAnalysis: v.optional(v.string()),
    })),
    panelLayout: v.optional(v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        rotation: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const updates: SavedProjectUpdates = {
      updatedAt: Date.now(),
    };

    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.polygonPoints) updates.polygonPoints = args.polygonPoints;
    if (args.analysis) {
      updates.analysis = args.analysis;
      updates.status = "analyzed";
    }
    if (args.panelLayout) updates.panelLayout = args.panelLayout;

    await ctx.db.patch(args.projectId, updates);

    return args.projectId;
  },
});

// Get all saved projects for current user
export const getUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return [];
    }

    // Try to find user by token identifier
    let user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    // If no user found by token, try by email (with type guard)
    if (!user && identity.email) {
      const email = identity.email; // TypeScript now knows this is string, not undefined
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
    }

    // If still no user, return empty
    if (!user) {
      return [];
    }

    // Fetch projects for this user
    const projects = await ctx.db
      .query("savedProjects")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return projects;
  },
});

// Get a single saved project
export const getProject = query({
  args: { projectId: v.id("savedProjects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || project.userId !== user._id) {
      return null;
    }

    return project;
  },
});

// Delete a saved project
export const deleteProject = mutation({
  args: { projectId: v.id("savedProjects") },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.projectId);
    return true;
  },
});

// Debug query to check user data
export const debugUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "Not authenticated", identity: null };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    return {
      identity: {
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email,
        name: identity.name,
      },
      user,
      userExists: !!user,
    };
  },
});
// Add this query function to your existing convex/savedProject.ts file

export const getProjectById = query({
  args: {
    projectId: v.id("savedProjects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    // Verify ownership
    if (project.userId !== user._id) {
      throw new Error("Unauthorized: You don't have access to this project");
    }

    return project;
  },
});