/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as finalizedLayouts from "../finalizedLayouts.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as recommendations from "../recommendations.js";
import type * as rooftopAnalysis from "../rooftopAnalysis.js";
import type * as savedProject from "../savedProject.js";
import type * as savedRecommendations from "../savedRecommendations.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  finalizedLayouts: typeof finalizedLayouts;
  http: typeof http;
  notifications: typeof notifications;
  recommendations: typeof recommendations;
  rooftopAnalysis: typeof rooftopAnalysis;
  savedProject: typeof savedProject;
  savedRecommendations: typeof savedRecommendations;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
