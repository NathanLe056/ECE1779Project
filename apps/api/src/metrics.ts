import client from "prom-client";
import type { Request, Response, NextFunction } from "express";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

export const httpRequestsInFlight = new client.Gauge({
  name: "http_requests_in_flight",
  help: "Number of HTTP requests currently being processed",
  registers: [register],
});

// Auth metrics
export const loginTotal = new client.Counter({
  name: "auth_login_total",
  help: "Total login attempts",
  labelNames: ["result"] as const,
  registers: [register],
});

export const signupTotal = new client.Counter({
  name: "auth_signup_total",
  help: "Total signup attempts",
  labelNames: ["result"] as const,
  registers: [register],
});

// Tournament metrics
export const tournamentsCreatedTotal = new client.Counter({
  name: "tournaments_created_total",
  help: "Total tournaments created",
  registers: [register],
});

export const tournamentsUpdatedTotal = new client.Counter({
  name: "tournaments_updated_total",
  help: "Total tournament updates",
  registers: [register],
});

export const tournamentsDeletedTotal = new client.Counter({
  name: "tournaments_deleted_total",
  help: "Total tournaments deleted",
  registers: [register],
});

// Match metrics
export const matchesCreatedTotal = new client.Counter({
  name: "matches_created_total",
  help: "Total matches created",
  registers: [register],
});

export const matchesUpdatedTotal = new client.Counter({
  name: "matches_updated_total",
  help: "Total match score updates",
  registers: [register],
});

// WebSocket metrics
export const wsConnectionsActive = new client.Gauge({
  name: "ws_connections_active",
  help: "Number of currently active WebSocket connections",
  registers: [register],
});

export const wsConnectionsTotal = new client.Counter({
  name: "ws_connections_total",
  help: "Total WebSocket connections established",
  registers: [register],
});

export const wsBroadcastsTotal = new client.Counter({
  name: "ws_broadcasts_total",
  help: "Total WebSocket broadcast events sent",
  registers: [register],
});

export const wsMessagesSentTotal = new client.Counter({
  name: "ws_messages_sent_total",
  help: "Total individual WebSocket messages sent to clients",
  registers: [register],
});

// Email metrics
export const emailsSentTotal = new client.Counter({
  name: "emails_sent_total",
  help: "Total emails sent",
  labelNames: ["result"] as const,
  registers: [register],
});

// Database metrics
export const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "model"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

export const dbErrorsTotal = new client.Counter({
  name: "db_errors_total",
  help: "Total database errors",
  labelNames: ["operation", "model"] as const,
  registers: [register],
});

// Tournament member metrics
export const tournamentMembersJoinedTotal = new client.Counter({
  name: "tournament_members_joined_total",
  help: "Total tournament member joins",
  registers: [register],
});

export const tournamentMembersRemovedTotal = new client.Counter({
  name: "tournament_members_removed_total",
  help: "Total tournament member removals",
  registers: [register],
});

/**
 * Records request duration, counts, and in-flight gauge.
 * Must be mounted BEFORE route handlers.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === "/metrics") {
    next();
    return;
  }

  httpRequestsInFlight.inc();
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const route = normaliseRoute(req.route?.path ?? req.path, req.baseUrl);
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    end(labels);
    httpRequestsTotal.inc(labels);
    httpRequestsInFlight.dec();
  });

  next();
}

// Collapses numeric path segments into :id to avoid high-cardinality labels
function normaliseRoute(routePath: string, baseUrl: string): string {
  const full = `${baseUrl}${routePath}`.replace(/\/+/g, "/");
  return full.replace(/\/\d+/g, "/:id") || "/";
}
