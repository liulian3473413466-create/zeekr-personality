import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const participants = sqliteTable("participants", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});
export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  participantKey: text("participant_key").notNull().references(() => participants.key),
  expiresAt: integer("expires_at").notNull(),
});
export const results = sqliteTable("results", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull(),
  participantKey: text("participant_key").notNull().references(() => participants.key),
  answers: text("answers").notNull(),
  result: text("result").notNull(),
  createdAt: integer("created_at").notNull(),
}, (t) => [uniqueIndex("results_request_unique").on(t.requestId), index("results_participant_idx").on(t.participantKey)]);
