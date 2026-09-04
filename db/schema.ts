import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const diloProgress = sqliteTable("dilo_progress", {
  userId: text("user_id").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const diloProgressHistory = sqliteTable("dilo_progress_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
  archivedAt: integer("archived_at").notNull(),
}, (table) => [
  index("idx_dilo_progress_history_user_archived").on(table.userId, table.archivedAt),
]);
