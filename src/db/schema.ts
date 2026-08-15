import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resumes = sqliteTable("resumes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sha256: text("sha256").notNull().unique(),
  label: text("label").notNull(),
  originalFilename: text("original_filename").notNull(),
  extension: text("extension").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
});

export const applications = sqliteTable(
  "applications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    company: text("company").notNull(),
    url: text("url"),
    location: text("location"),
    workMode: text("work_mode"),
    source: text("source"),
    salary: text("salary"),
    status: text("status").notNull(),
    resumeId: integer("resume_id").references(() => resumes.id),
    appliedAt: text("applied_at"),
    followUpOn: text("follow_up_on"),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("idx_applications_status").on(table.status),
    index("idx_applications_applied_at").on(table.appliedAt),
    index("idx_applications_deleted_at").on(table.deletedAt),
  ],
);

export const statusEvents = sqliteTable(
  "status_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id),
    status: text("status").notNull(),
    changedAt: text("changed_at").notNull(),
  },
  (table) => [index("idx_status_events_application_id").on(table.applicationId)],
);

export type Resume = typeof resumes.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type StatusEvent = typeof statusEvents.$inferSelect;
