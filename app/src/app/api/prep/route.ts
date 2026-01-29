import { NextResponse } from "next/server";
import OpenAI from "openai";

import {
  addPrepResult,
  clearPrepResults,
  defaultPrepReason,
  generatePrepSuggestions,
  getDefaultPrepItems,
  listPrepResults,
} from "@/lib/inmemory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PREP_PROMPT =
  "You recommend household first-aid and medicine prep. Use the family profile, including ages, to tailor suggestions. Only suggest additional items beyond the default list. Use widely known medication names (generic plus common brand in parentheses when helpful). Each item must include a very detailed reason and a very detailed caution (6-8 full sentences each), with specific intended use, age considerations, dosing approach at a high level, typical scenarios, and key safety warnings or contraindications. Do not include treatment steps, manuals, or documents. End with one sentence starting with 'Reason:'. Reply in English. Output format: each item starts with '- ' and uses 'Name | Reason: ... | Caution: ...'. The final line starts with 'Reason: ...'.";

function normalizePrepItem(item: string) {
  return item
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .replace(/icepack|coldpack/gi, "icepack")
    .toLowerCase();
}

function parsePrepItem(item: string) {
  const cleaned = item.replace(/[()]/g, "").trim();
  const match = cleaned.match(
    /(\d+)\s*(pcs?|packs?|boxes?|bottles?|tubes?|rolls?)?\s*$/i,
  );
  if (!match) {
    return { name: cleaned, count: null as number | null };
  }
  const count = Number(match[1]);
  if (Number.isNaN(count)) {
    return { name: cleaned, count: null as number | null };
  }
  const name = cleaned.slice(0, match.index).trim();
  return { name, count };
}

function parseSuggestionLine(line: string) {
  const cleaned = line.replace(/^-\s*/, "").trim();
  if (!cleaned) {
    return null;
  }
  const parts = cleaned.split("|").map((part) => part.trim());
  const name = parts[0] || cleaned;
  const reasonPart = parts.find((part) =>
    part.toLowerCase().startsWith("reason:"),
  );
  const cautionPart = parts.find((part) =>
    part.toLowerCase().startsWith("caution:"),
  );
  const reason = reasonPart
    ? reasonPart.replace(/^reason:\s*/i, "").trim()
    : "Recommended based on your household profile.";
  const caution = cautionPart
    ? cautionPart.replace(/^caution:\s*/i, "").trim()
    : "Follow label directions and consult a pharmacist if unsure.";
  return { name, reason, caution };
}

export function GET() {
  return NextResponse.json({ results: listPrepResults() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const context = typeof body?.context === "string" ? body.context.trim() : "";
  const familyCount =
    typeof body?.familyCount === "number" && body.familyCount > 0
      ? body.familyCount
      : 1;

  if (!context) {
    return NextResponse.json(
      { error: "context is required" },
      { status: 400 },
    );
  }

  const defaultItems = getDefaultPrepItems(familyCount);

  if (!process.env.OPENAI_API_KEY) {
    const fallback = generatePrepSuggestions(context);
    const result = addPrepResult(
      [
        {
          title: "Suggestion List",
          items:
            fallback.length > 0
              ? fallback.map((item) => ({
                  name: item,
                  reason:
                    "Recommended based on your household profile and typical risks for similar households. This helps cover likely symptoms or minor injuries that may arise unexpectedly, especially during off-hours, travel, or when clinics are closed. It supports timely response when access to a pharmacy is limited and reduces delays in care. The item is commonly used for the types of situations noted in your family profile and is generally easy to administer with standard instructions. Keeping it on hand improves readiness for minor issues that can become more disruptive if untreated. It also helps avoid last-minute purchases during stressful moments. The suggestion aligns with common household readiness guidelines for mixed-age families.",
                  caution:
                    "Read the label carefully and follow age-specific dosing instructions, especially for children and older adults. Check for interactions with existing conditions or medications such as blood pressure drugs, anticoagulants, or allergy medicines. Avoid duplicate ingredients across multiple products to prevent accidental overdosing. Use the lowest effective dose and do not exceed the maximum daily amount. Seek professional advice if symptoms are severe, persistent, or unusual. Store properly and discard any expired or compromised items. Keep out of reach of children and avoid sharing prescriptions or personal medications.",
                }))
              : [
                  {
                    name: "No additional recommendations.",
                    reason:
                      "Your current supplies appear sufficient for the profile provided. No extra items are strongly indicated beyond what is typically kept in a basic kit. The household risk factors described do not point to specific additional needs at this time. This suggests your existing kit likely covers the most common minor issues for your group. It also indicates that the age mix and conditions reported do not require specialized OTC additions right now. Reassess after changes in health conditions, family composition, or travel habits. If new allergies or chronic conditions emerge, revisit the list for targeted items.",
                    caution:
                      "Review your kit periodically to ensure items are not expired and packaging is intact. Replace anything opened, heat-damaged, or compromised by moisture. Store medicines in a cool, dry place out of children's reach and away from direct sunlight. Keep an updated list of contents so you can spot gaps early. If anyone starts new medications, re-check for interactions with over-the-counter products. Dispose of expired items safely according to local guidelines. Keep dosing tools (syringes, cups) clean and available.",
                  },
                ],
        },
      ],
      defaultPrepReason(),
    );
    return NextResponse.json({ result, fallback: true });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PREP_PROMPT },
        { role: "user", content: context },
      ],
    });

    const raw =
      completion.choices[0]?.message?.content?.trim() ||
      "Please prepare a basic household first-aid kit.";
    const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const items = lines
      .filter((line) => line.startsWith("-"))
      .map((line) => parseSuggestionLine(line))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    const reasonLine = lines.find((line) =>
      line.toLowerCase().startsWith("reason:"),
    );
    const reason =
      reasonLine?.replace(/^reason:\s*/i, "").trim() || defaultPrepReason();
    const defaultMap = new Map(
      defaultItems.map((item) => {
        const parsed = parsePrepItem(item);
        return [normalizePrepItem(parsed.name), parsed];
      }),
    );
    const defaultNormalized = new Set(defaultMap.keys());
    const additionalItemsRaw =
      items.length > 0
        ? items
        : generatePrepSuggestions(context).map((item) => ({
            name: item,
            reason:
              "Recommended based on your household profile and typical risks for similar households. This helps cover likely symptoms or minor injuries that may arise unexpectedly, especially during off-hours, travel, or when clinics are closed. It supports timely response when access to a pharmacy is limited and reduces delays in care. The item is commonly used for the types of situations noted in your family profile and is generally easy to administer with standard instructions. Keeping it on hand improves readiness for minor issues that can become more disruptive if untreated. It also helps avoid last-minute purchases during stressful moments. The suggestion aligns with common household readiness guidelines for mixed-age families.",
            caution:
              "Read the label carefully and follow age-specific dosing instructions, especially for children and older adults. Check for interactions with existing conditions or medications such as blood pressure drugs, anticoagulants, or allergy medicines. Avoid duplicate ingredients across multiple products to prevent accidental overdosing. Use the lowest effective dose and do not exceed the maximum daily amount. Seek professional advice if symptoms are severe, persistent, or unusual. Store properly and discard any expired or compromised items. Keep out of reach of children and avoid sharing prescriptions or personal medications.",
          }));
    const additionalItems = additionalItemsRaw.filter((item) => {
      const parsed = parsePrepItem(item.name);
      const normalizedName = normalizePrepItem(parsed.name);
      return !defaultNormalized.has(normalizedName);
    });
    const result = addPrepResult(
      [
        {
          title: "Suggestion List",
          items:
            additionalItems.length > 0
              ? additionalItems
              : [
                  {
                    name: "No additional recommendations.",
                    reason:
                      "Your current supplies appear sufficient for the profile provided. No extra items are strongly indicated beyond what is typically kept in a basic kit. The household risk factors described do not point to specific additional needs at this time. This suggests your existing kit likely covers the most common minor issues for your group. It also indicates that the age mix and conditions reported do not require specialized OTC additions right now. Reassess after changes in health conditions, family composition, or travel habits. If new allergies or chronic conditions emerge, revisit the list for targeted items.",
                    caution:
                      "Review your kit periodically to ensure items are not expired and packaging is intact. Replace anything opened, heat-damaged, or compromised by moisture. Store medicines in a cool, dry place out of children's reach and away from direct sunlight. Keep an updated list of contents so you can spot gaps early. If anyone starts new medications, re-check for interactions with over-the-counter products. Dispose of expired items safely according to local guidelines. Keep dosing tools (syringes, cups) clean and available.",
                  },
                ],
        },
      ],
      reason,
    );
    return NextResponse.json({ result });
  } catch (error) {
    const fallback = generatePrepSuggestions(context);
    const result = addPrepResult(
      [
        {
          title: "Suggestion List",
          items:
            fallback.length > 0
              ? fallback.map((item) => ({
                  name: item,
                  reason:
                    "Recommended based on your household profile and typical risks for similar households. This helps cover likely symptoms or minor injuries that may arise unexpectedly, especially during off-hours, travel, or when clinics are closed. It supports timely response when access to a pharmacy is limited and reduces delays in care. The item is commonly used for the types of situations noted in your family profile and is generally easy to administer with standard instructions. Keeping it on hand improves readiness for minor issues that can become more disruptive if untreated. It also helps avoid last-minute purchases during stressful moments. The suggestion aligns with common household readiness guidelines for mixed-age families.",
                  caution:
                    "Read the label carefully and follow age-specific dosing instructions, especially for children and older adults. Check for interactions with existing conditions or medications such as blood pressure drugs, anticoagulants, or allergy medicines. Avoid duplicate ingredients across multiple products to prevent accidental overdosing. Use the lowest effective dose and do not exceed the maximum daily amount. Seek professional advice if symptoms are severe, persistent, or unusual. Store properly and discard any expired or compromised items. Keep out of reach of children and avoid sharing prescriptions or personal medications.",
                }))
              : [
                  {
                    name: "No additional recommendations.",
                    reason:
                      "Your current supplies appear sufficient for the profile provided. No extra items are strongly indicated beyond what is typically kept in a basic kit. The household risk factors described do not point to specific additional needs at this time. This suggests your existing kit likely covers the most common minor issues for your group. It also indicates that the age mix and conditions reported do not require specialized OTC additions right now. Reassess after changes in health conditions, family composition, or travel habits. If new allergies or chronic conditions emerge, revisit the list for targeted items.",
                    caution:
                      "Review your kit periodically to ensure items are not expired and packaging is intact. Replace anything opened, heat-damaged, or compromised by moisture. Store medicines in a cool, dry place out of children's reach and away from direct sunlight. Keep an updated list of contents so you can spot gaps early. If anyone starts new medications, re-check for interactions with over-the-counter products. Dispose of expired items safely according to local guidelines. Keep dosing tools (syringes, cups) clean and available.",
                  },
                ],
        },
      ],
      defaultPrepReason(),
    );
    const message = error instanceof Error ? error.message : "OpenAI error.";
    return NextResponse.json(
      { result, fallback: true, error: message },
      { status: 200 },
    );
  }
}

export function DELETE() {
  clearPrepResults();
  return NextResponse.json({ ok: true });
}
