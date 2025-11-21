// convex/dashboard.ts
import { query } from "./_generated/server";

export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 getDashboardData called");
    
    const identity = await ctx.auth.getUserIdentity();
    console.log("👤 Identity:", identity ? "Found" : "Not found");
    
    if (!identity) {
      const emptyResponse = {
        user: null,
        savedProjects: [],
        finalizedLayouts: [],
        userSolutions: [],
        savedRecommendations: [],
        debugInfo: {
          error: "Not authenticated",
          identity: null,
          user: null,
          userExists: false,
        },
      };
      console.log("❌ Returning empty (no identity):", emptyResponse);
      return emptyResponse;
    }

    // Find user by token identifier
    let user = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    console.log("🔍 User by token:", user ? "Found" : "Not found");

    // If not found by token, try by email
    if (!user && identity.email) {
      const email = identity.email;
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
      console.log("🔍 User by email:", user ? "Found" : "Not found");
    }

    // If still no user, return empty data
    if (!user) {
      const noUserResponse = {
        user: null,
        savedProjects: [],
        finalizedLayouts: [],
        userSolutions: [],
        savedRecommendations: [],
        debugInfo: {
          error: "User not found in database",
          identity: {
            tokenIdentifier: identity.tokenIdentifier,
            email: identity.email ?? "no-email",
            name: identity.name ?? "no-name",
          },
          user: null,
          userExists: false,
        },
      };
      console.log("❌ Returning empty (no user):", noUserResponse);
      return noUserResponse;
    }

    console.log("✅ User found:", user._id, user.email);

    // Fetch all dashboard data in parallel for maximum performance
    const [
      savedProjects,
      finalizedLayouts,
      userSolutions,
      savedRecommendations,
    ] = await Promise.all([
      ctx.db
        .query("savedProjects")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect(),
      
      ctx.db
        .query("finalizedLayouts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect(),
      
      ctx.db
        .query("userSelectedSolutions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect(),
      
      ctx.db
        .query("savedRecommendations")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect(),
    ]);

    const response = {
      user,
      savedProjects,
      finalizedLayouts,
      userSolutions,
      savedRecommendations,
      debugInfo: {
        identity: {
          tokenIdentifier: identity.tokenIdentifier,
          email: identity.email ?? "no-email",
          name: identity.name ?? "no-name",
        },
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
        userExists: true,
        counts: {
          savedProjects: savedProjects.length,
          finalizedLayouts: finalizedLayouts.length,
          userSolutions: userSolutions.length,
          savedRecommendations: savedRecommendations.length,
        },
      },
    };

    console.log("✅ Returning full response:", {
      userEmail: user.email,
      counts: response.debugInfo.counts
    });

    return response;
  },
});