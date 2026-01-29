export type VoiceMessage = {
  id: string;
  role: "user" | "assistant";
  mode: "stt" | "tts";
  text: string;
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type PrepSection = {
  title: string;
  items: PrepItem[];
};

export type PrepItem = {
  name: string;
  reason: string;
  caution: string;
};

export type PrepResult = {
  id: string;
  sections: PrepSection[];
  reason: string;
  createdAt: number;
};

const voiceMessages: VoiceMessage[] = [];
const chatMessages: ChatMessage[] = [];
const prepResults: PrepResult[] = [];

const suggestionSets: Array<{ keywords: string[]; suggestions: string[] }> = [
  {
    keywords: ["baby", "infant", "toddler", "child", "kid", "kids"],
    suggestions: [
      "Children's fever/pain relief (age-appropriate dosing) for 1-2 courses.",
      "Children's cold medicine and fever patches in suitable quantities.",
      "Kids' thermometer, bandages, and antiseptic on hand.",
    ],
  },
  {
    keywords: ["pregnant", "pregnancy"],
    suggestions: [
      "Keep a list of pregnancy-safe medications.",
      "Check prenatal vitamins and iron supplement stock.",
      "Prepare clinic contacts and insurance cards.",
    ],
  },
];

export function listVoiceMessages() {
  return voiceMessages;
}

export function listChatMessages() {
  return chatMessages;
}

export function getLastUserMessage() {
  for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
    const message = chatMessages[index];
    if (message.role === "user") {
      return message.content;
    }
  }
  return "";
}

export function clearVoiceMessages() {
  voiceMessages.length = 0;
  chatMessages.length = 0;
}

export function addChatExchange(userText: string, assistantText: string) {
  const now = Date.now();
  const userMessage: VoiceMessage = {
    id: crypto.randomUUID(),
    role: "user",
    mode: "stt",
    text: userText,
    createdAt: now,
  };
  const assistantMessage: VoiceMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    mode: "tts",
    text: assistantText,
    createdAt: now + 1,
  };

  voiceMessages.push(userMessage, assistantMessage);

  chatMessages.push(
    {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantText,
      createdAt: now + 1,
    },
  );

  return { userMessage, assistantMessage };
}

export function listPrepResults() {
  return prepResults;
}

export function clearPrepResults() {
  prepResults.length = 0;
}

const defaultPrepItems = [
  "Sterile gauze pads 1",
  "Hydrocolloid bandages 1",
  "Hydrogen peroxide 1",
  "Cotton balls 1",
  "Antibiotic ointment 1",
  "Adhesive bandages 1",
  "Waterproof bandages 1",
  "Ice pack 2",
  "Anti-itch cream 1",
  "Elastic bandage 1",
];

export function getDefaultPrepItems(familyCount: number) {
  const extraSets =
    familyCount <= 3 ? 0 : Math.ceil((familyCount - 3) / 3);
  const adjustableItems = new Set([
    "Hydrocolloid bandages",
    "Cotton balls",
    "Sterile gauze pads",
    "Adhesive bandages",
    "Waterproof bandages",
    "Ice pack",
    "Elastic bandage",
    "Antibiotic ointment",
    "Anti-itch cream",
  ]);

  return defaultPrepItems.map((item) => {
    const parts = item.split(" ");
    const count = Number(parts[parts.length - 1]);
    if (Number.isNaN(count)) {
      return item;
    }
    const name = parts.slice(0, -1).join(" ");
    const extra = adjustableItems.has(name) ? extraSets : 0;
    return `${name} ${count + extra}`;
  });
}

export function generatePrepSuggestions(context: string) {
  const normalized = context.toLowerCase();
  const matched =
    suggestionSets.find((set) =>
      set.keywords.some((keyword) => normalized.includes(keyword)),
    ) ?? null;

  const base = [
    "Adult fever/pain relief for 2-3 doses per person.",
    "Basic digestive set: antacid, anti-diarrheal, and anti-nausea.",
    "Cold/flu medicine: 1-2 boxes for adults.",
    "Allergy medicine (antihistamine) 1 box.",
    "Restock antiseptic, bandages, and gauze.",
    "Thermometer (1), hand sanitizer, and wound ointment.",
  ];

  if (matched) {
    return [...matched.suggestions, ...base];
  }

  return base;
}

export function defaultPrepReason() {
  return "Recommended based on your family profile and notes.";
}

export function addPrepResult(sections: PrepSection[], reason: string) {
  const now = Date.now();
  const result = {
    id: crypto.randomUUID(),
    sections,
    reason,
    createdAt: now,
  };
  prepResults.push(result);
  return result;
}
