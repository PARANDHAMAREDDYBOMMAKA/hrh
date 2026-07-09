import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, actorOf } from "@/lib/audit";
import {
  requireCrmUser,
  canAccessOwner,
  stageProbability,
  parseDate,
  type CrmStageName,
} from "@/lib/crm";
import { leadConvertSchema } from "@/lib/crm-schemas";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCrmUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const lead = await prisma.crmLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessOwner(session, lead.ownerId))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (lead.status === "CONVERTED")
    return NextResponse.json({ error: "Lead is already converted" }, { status: 409 });

  const parsed = leadConvertSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const opts = parsed.data;

  const [firstName, ...rest] = lead.name.trim().split(" ");
  const lastName = rest.join(" ") || firstName;
  const stage = opts.stage as CrmStageName;

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.crmAccount.create({
      data: {
        name: lead.company || lead.name,
        phone: lead.phone,
        email: lead.email,
        ownerId: lead.ownerId,
      },
    });

    const contact = await tx.crmContact.create({
      data: {
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        accountId: account.id,
        ownerId: lead.ownerId,
      },
    });

    let opportunity = null;
    if (opts.createOpportunity) {
      opportunity = await tx.crmOpportunity.create({
        data: {
          name: opts.opportunityName || `${account.name} — New Deal`,
          accountId: account.id,
          contactId: contact.id,
          stage,
          amount: opts.amount ?? lead.estimatedValue ?? 0,
          probability: stageProbability(stage),
          expectedCloseDate: parseDate(opts.expectedCloseDate),
          ownerId: lead.ownerId,
        },
      });
    }

    await tx.crmLead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
        convertedAccountId: account.id,
        convertedContactId: contact.id,
        convertedOppId: opportunity?.id ?? null,
      },
    });

    return { account, contact, opportunity };
  });

  audit(req, {
    action: "CRM_LEAD_CONVERT",
    entityType: "CrmLead",
    entityId: lead.id,
    actor: actorOf(session),
    metadata: {
      accountId: result.account.id,
      contactId: result.contact.id,
      opportunityId: result.opportunity?.id ?? null,
    },
  });

  return NextResponse.json(result, { status: 201 });
}
