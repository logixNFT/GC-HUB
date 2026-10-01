import Anthropic from "@anthropic-ai/sdk";

/* ============================================================
   POST /api/agent — the GC HUB crew's drafting desk, on Claude
   Fable 5.1. Two tasks:
     { task: "draft", agent, record, context }  → { title, body }
     { task: "overseer", sweep }                → { summary, directives }

   The browser sends only the record (and its related records) it
   wants drafted; GC HUB keeps the rest of its data local. Needs
   this project's own ANTHROPIC_API_KEY — without one it answers
   503 and the floor carries on with rule-based sweeps.
   ============================================================ */

const MODEL = "claude-fable-5-1";

const DRAFTS = {
  documents: "a short document-control memo for this drawing: what is missing or conflicting in the register, what to do about each, and a one-line transmittal note if it is ready to issue",
  regulation: "a compliance checklist for this permit or assembly under the rule it cites: each requirement, the submittal item that evidences it, and anything the record shows is missing. Cite the rule as given in the record; do not invent section numbers",
  permitting: "a next-action plan for this permit (what, who, by when, from the dates in the record) and a short, courteous follow-up email to the reviewing agency if it is waiting on them",
  vendor: "a short, firm, professional email to this subcontractor requesting the missing or lapsing compliance documents named in the findings, with a date to provide them by",
  scope: "a scope of work for this project, organised by CSI division: inclusions, exclusions, assumptions and the permits/assemblies it relies on. Base it only on the project record and the related records provided; mark anything you had to assume",
};

const DRAFT_SCHEMA = {
  type: "object",
  properties: { title: { type: "string" }, body: { type: "string", description: "Markdown" } },
  required: ["title", "body"],
  additionalProperties: false,
};

const OVERSEER_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    directives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          agent: { type: "string", enum: ["documents", "regulation", "permitting", "vendor", "scope"] },
          severity: { type: "string", enum: ["act", "watch", "ok"] },
          directive: { type: "string" },
          why: { type: "string" },
        },
        required: ["agent", "severity", "directive", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "directives"],
  additionalProperties: false,
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "Fable is not connected: set ANTHROPIC_API_KEY on the gc-hub Vercel project." }, 503);
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  let system, user, schema;
  if (input.task === "draft") {
    const what = DRAFTS[input.agent];
    if (!what || !input.record) return json({ error: "draft needs a known agent and a record." }, 400);
    system = `You are the ${input.agent} agent on a general contractor's operations team in Florida. You write ${what}. Write for a construction professional: plain, specific, no filler. Use only the facts in the records you are given; where something is unknown, say so rather than invent it.`;
    user = `Record:\n${JSON.stringify(input.record)}\n\nFindings on it:\n${JSON.stringify(input.findings ?? [])}\n\nRelated records:\n${JSON.stringify(input.context ?? {})}`;
    schema = DRAFT_SCHEMA;
  } else if (input.task === "overseer") {
    system = "You are the Overseer of a contractor's agent crew. Five agents each own an area: documents (drawing register), regulation (assemblies and governing rules), permitting (permit pipeline), vendor (subcontractor compliance), scope (scopes of work). From their sweep results, issue directives that keep each one working on the most important thing in its area: at most one per agent, most urgent first; 'act' for things to fix now, 'watch' for drift. Ground every directive in the findings — never invent a record or a number. summary: one line on the state of the operation.";
    user = `Sweep results:\n${JSON.stringify(input.sweep)}`;
    schema = OVERSEER_SCHEMA;
  } else {
    return json({ error: "task must be draft or overseer." }, 400);
  }

  try {
    const client = new Anthropic({ timeout: 120_000, maxRetries: 1 });
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: input.task === "overseer" ? "low" : "medium", format: { type: "json_schema", schema } },
      system,
      messages: [{ role: "user", content: user }],
    });
    if (msg.stop_reason === "refusal") return json({ error: "Fable declined this request." }, 422);
    const text = msg.content.find((b) => b.type === "text")?.text ?? "";
    return json({ ...JSON.parse(text), model: msg.model });
  } catch (e) {
    const why = e instanceof Anthropic.APIError ? `Fable API ${e.status}: ${e.message}` : e instanceof Error ? e.message : String(e);
    return json({ error: why }, 502);
  }
}
