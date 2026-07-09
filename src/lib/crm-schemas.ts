import { z } from "zod";
import {
  CRM_STAGES,
  LEAD_STATUSES,
  LEAD_SOURCES,
  ACTIVITY_TYPES,
  TASK_PRIORITIES,
} from "@/lib/crm";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalEmail = z
  .string()
  .trim()
  .email()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const leadCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  company: optionalString,
  email: optionalEmail,
  phone: optionalString,
  title: optionalString,
  source: z.enum(LEAD_SOURCES).default("OTHER"),
  status: z.enum(LEAD_STATUSES).default("NEW"),
  estimatedValue: z.coerce.number().min(0).optional(),
  notes: optionalString,
  ownerId: optionalString,
});
export const leadUpdateSchema = leadCreateSchema.partial();

export const leadConvertSchema = z.object({
  createOpportunity: z.boolean().default(true),
  opportunityName: optionalString,
  amount: z.coerce.number().min(0).optional(),
  stage: z.enum(CRM_STAGES).default("PROSPECTING"),
  expectedCloseDate: optionalString,
});

export const accountCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  industry: optionalString,
  website: optionalString,
  phone: optionalString,
  email: optionalEmail,
  address: optionalString,
  city: optionalString,
  notes: optionalString,
  ownerId: optionalString,
});
export const accountUpdateSchema = accountCreateSchema.partial();

export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: optionalEmail,
  phone: optionalString,
  title: optionalString,
  accountId: optionalString,
  ownerId: optionalString,
});
export const contactUpdateSchema = contactCreateSchema.partial();

export const opportunityCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  accountId: z.string().trim().min(1, "Account is required"),
  contactId: optionalString,
  stage: z.enum(CRM_STAGES).default("PROSPECTING"),
  amount: z.coerce.number().min(0).default(0),
  probability: z.coerce.number().min(0).max(100).optional(),
  expectedCloseDate: optionalString,
  notes: optionalString,
  ownerId: optionalString,
});
export const opportunityUpdateSchema = opportunityCreateSchema.partial();

export const stageMoveSchema = z.object({
  stage: z.enum(CRM_STAGES),
});

export const activityCreateSchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES).default("NOTE"),
    subject: z.string().trim().min(1, "Subject is required"),
    body: optionalString,
    occurredAt: optionalString,
    leadId: optionalString,
    accountId: optionalString,
    contactId: optionalString,
    opportunityId: optionalString,
  })
  .refine(
    (v) => v.leadId || v.accountId || v.contactId || v.opportunityId,
    { message: "Activity must be linked to a record" }
  );

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalString,
  dueDate: optionalString,
  priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
  assigneeId: optionalString,
  leadId: optionalString,
  accountId: optionalString,
  contactId: optionalString,
  opportunityId: optionalString,
});
export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: optionalString,
  dueDate: optionalString,
  priority: z.enum(TASK_PRIORITIES).optional(),
  status: z.enum(["OPEN", "DONE"]).optional(),
  assigneeId: optionalString,
});

export const teamUserCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email required"),
  role: z.enum(["SALES_REP", "SALES_MANAGER"]).default("SALES_REP"),
});
