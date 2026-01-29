"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type VoiceMessage = {
  id: string;
  role: "user" | "assistant";
  mode: "stt" | "tts";
  text: string;
  createdAt: number;
};

type PrepResult = {
  id: string;
  sections: {
    title: string;
    items: { name: string; reason: string; caution: string }[];
  }[];
  reason: string;
  createdAt: number;
};

type TabKey = "home" | "history" | "info" | "voice" | "prep";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [isAuthenticated] = useState(true);
  const [hasSignedUp, setHasSignedUp] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assistantSteps, setAssistantSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const commandModeRef = useRef(false);
  const stepsRef = useRef<string[]>([]);
  const stepIndexRef = useRef(0);
  const conversationActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const storageKeys = {
    session: "ea.sessionId",
    profile: "ea.profile",
  };

  const [prepResults, setPrepResults] = useState<PrepResult[]>([]);
  const [prepLoading, setPrepLoading] = useState(false);
  const [selectedPrepItem, setSelectedPrepItem] = useState<{
    name: string;
    reason: string;
    caution: string;
  } | null>(null);
  const [lastPrepSignature, setLastPrepSignature] = useState("");
  const [familyCount, setFamilyCount] = useState(3);
  const [familyMembers, setFamilyMembers] = useState<
    {
      name: string;
      sex: "male" | "female" | "";
      age: number;
      conditions: string[];
      notes: string;
    }[]
  >(() => createDefaultMembers(3));

  const healthConditions = [
    "Diabetes",
    "High blood pressure",
    "Low blood pressure",
    "Atopy",
    "Allergy",
    "Asthma",
    "Heart disease",
  ];

  function createDefaultMember() {
    return {
      name: "",
      sex: "" as "male" | "female" | "",
      age: 30,
      conditions: [] as string[],
      notes: "",
    };
  }

  function createDefaultMembers(count: number) {
    return Array.from({ length: count }, (_, index) => {
      const name = index === 0 ? "User" : `Family ${index}`;
      return {
        name,
        sex: "" as "male" | "female" | "",
        age: 0,
        conditions: [],
        notes: "",
      };
    });
  }

  useEffect(() => {
    void loadVoiceMessages();
    void loadPrepSuggestions();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let isActive = true;

    async function hydrateFromStorage() {
      try {
        const response = await fetch("/api/session");
        const data = await response.json();
        const sessionId =
          typeof data?.sessionId === "string"
            ? data.sessionId
            : String(data?.sessionId ?? "");
        const storedSession = localStorage.getItem(storageKeys.session);
        if (storedSession && sessionId && storedSession !== sessionId) {
          localStorage.removeItem(storageKeys.profile);
        }
        if (sessionId) {
          localStorage.setItem(storageKeys.session, sessionId);
        }
      } catch {
        // Ignore session validation errors.
      }

      const storedProfile = localStorage.getItem(storageKeys.profile);
      if (storedProfile && isActive) {
        try {
          const parsed = JSON.parse(storedProfile) as {
            hasSignedUp?: boolean;
            familyCount?: number;
            familyMembers?: typeof familyMembers;
          };
          if (typeof parsed.hasSignedUp === "boolean") {
            setHasSignedUp(parsed.hasSignedUp);
          }
          if (
            typeof parsed.familyCount === "number" &&
            parsed.familyCount > 0
          ) {
            setFamilyCount(parsed.familyCount);
          }
          if (
            Array.isArray(parsed.familyMembers) &&
            parsed.familyMembers.length
          ) {
            setFamilyMembers(parsed.familyMembers);
          }
        } catch {
          // Ignore malformed storage.
        }
      }
      if (isActive) {
        setIsStorageReady(true);
      }
    }

    void hydrateFromStorage();

    return () => {
      isActive = false;
    };
  }, [storageKeys.profile, storageKeys.session]);

  useEffect(() => {
    if (!showSplash) {
      return;
    }
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [showSplash]);

  useEffect(() => {
    if (activeTab === "voice") {
      return;
    }
    handleConversationEnd();
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKeys.profile) {
        return;
      }
      if (!event.newValue) {
        setHasSignedUp(false);
        setFamilyCount(3);
        setFamilyMembers(createDefaultMembers(3));
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as {
          hasSignedUp?: boolean;
          familyCount?: number;
          familyMembers?: typeof familyMembers;
        };
        if (typeof parsed.hasSignedUp === "boolean") {
          setHasSignedUp(parsed.hasSignedUp);
        }
        if (typeof parsed.familyCount === "number" && parsed.familyCount > 0) {
          setFamilyCount(parsed.familyCount);
        }
        if (Array.isArray(parsed.familyMembers) && parsed.familyMembers.length) {
          setFamilyMembers(parsed.familyMembers);
        }
      } catch {
        // Ignore malformed storage.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [storageKeys.profile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!isStorageReady) {
      return;
    }
    const profile = {
      hasSignedUp,
      hasCompletedOnboarding,
      familyCount,
      familyMembers,
    };
    localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
  }, [
    hasSignedUp,
    hasCompletedOnboarding,
    isStorageReady,
    familyCount,
    familyMembers,
    storageKeys.profile,
  ]);

  useEffect(() => {
    commandModeRef.current = isCommandMode;
  }, [isCommandMode]);

  useEffect(() => {
    stepsRef.current = assistantSteps;
  }, [assistantSteps]);

  useEffect(() => {
    stepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    conversationActiveRef.current = isConversationActive;
  }, [isConversationActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (!transcript) {
        return;
      }

      if (commandModeRef.current) {
        handleVoiceCommand(transcript);
        return;
      }

      void sendVoiceText(transcript, "steps", { askSteps: false });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (conversationActiveRef.current && !isSpeakingRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== "prep" || prepLoading) {
      return;
    }
    const signature = JSON.stringify({
      familyCount,
      familyMembers: familyMembers.slice(0, familyCount),
    });
    if (!signature) {
      return;
    }
    if (prepResults.length > 0 && signature === lastPrepSignature) {
      return;
    }
    void handlePrepSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    prepLoading,
    familyCount,
    familyMembers,
    lastPrepSignature,
    prepResults.length,
  ]);

  async function loadVoiceMessages() {
    try {
      const response = await fetch("/api/voice");
      const data = await response.json();
      setVoiceMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch {
    }
  }

  async function loadPrepSuggestions() {
    try {
      const response = await fetch("/api/prep");
      const data = await response.json();
      setPrepResults(Array.isArray(data?.results) ? data.results : []);
    } catch {
    }
  }

  function speakText(text: string, onEnd?: () => void) {
    if (typeof window === "undefined") {
      return;
    }
    if (!("speechSynthesis" in window)) {
      return;
    }

    isSpeakingRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      onEnd?.();
    };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function sendVoiceText(
    text: string,
    mode: "conversation" | "steps" = "conversation",
    options?: { preserveSteps?: boolean; askSteps?: boolean; returnToSteps?: boolean },
  ) {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    if (!options?.preserveSteps && mode === "conversation") {
      setIsCommandMode(false);
      setAssistantSteps([]);
      setCurrentStepIndex(0);
    }

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          mode,
          askSteps: options?.askSteps ?? true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return;
      }

      if (Array.isArray(data?.messages)) {
        setVoiceMessages(data.messages);
      } else {
        setVoiceMessages((prev) => [
          ...prev,
          data.userMessage,
          data.assistantMessage,
        ]);
      }
      const assistantText =
        typeof data?.assistantText === "string" ? data.assistantText : "";
      const assistantStepsFromApi = Array.isArray(data?.assistantSteps)
        ? data.assistantSteps
        : null;
      const hasStepResponse = mode === "steps" && assistantStepsFromApi;

      if (assistantText || hasStepResponse) {
        if (mode === "steps") {
          const steps =
            assistantStepsFromApi ?? splitAssistantSteps(assistantText);
          const normalizedSteps =
            steps.length > 0 ? steps : [assistantText].filter(Boolean);
          setAssistantSteps(normalizedSteps);
          setCurrentStepIndex(0);
          setIsCommandMode(true);
          const firstStep = normalizedSteps[0] ?? assistantText;
          if (firstStep) {
            speakText(firstStep, startCommandListening);
          }
          return;
        }
        speakText(
          assistantText,
          options?.returnToSteps ? startCommandListening : undefined,
        );
      }
    } catch {
    } finally {
    }
  }

  function handleListenStart() {
    if (!recognitionRef.current) {
      return;
    }
    try {
      setIsCommandMode(false);
      setAssistantSteps([]);
      setCurrentStepIndex(0);
      setIsConversationActive(true);
      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }

  function handleConversationEnd() {
    setIsConversationActive(false);
    setIsCommandMode(false);
    setAssistantSteps([]);
    setCurrentStepIndex(0);
    recognitionRef.current?.stop();
    setIsListening(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }

  function handleNewChat() {
    handleConversationEnd();
    setVoiceMessages([]);
    setAssistantSteps([]);
    setCurrentStepIndex(0);
  }

  function createLocalMessage(
    role: "user" | "assistant",
    text: string,
    mode: "stt" | "tts",
  ): VoiceMessage {
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role,
      mode,
      text,
      createdAt: Date.now(),
    };
  }

  function startCommandListening() {
    if (!recognitionRef.current || !speechSupported) {
      return;
    }
    if (isListening || isSpeakingRef.current) {
      return;
    }
    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }

  function splitAssistantSteps(text: string) {
    const lines = text.split(/\n+/);
    const chunks: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }
      const sentences = trimmed.match(/[^.!?]+[.!?]?/g);
      if (sentences && sentences.length > 0) {
        sentences.forEach((sentence) => {
          const cleaned = sentence.trim();
          if (cleaned) {
            chunks.push(...splitLongStep(cleaned));
          }
        });
      } else {
        chunks.push(...splitLongStep(trimmed));
      }
    });

    return chunks.length > 0 ? chunks : [text];
  }

  function splitLongStep(step: string) {
    const trimmed = step.trim();
    if (!trimmed) {
      return [];
    }

    return [trimmed];
  }

  function normalizeCommand(transcript: string) {
    const cleaned = transcript.toLowerCase().replace(/\s+/g, "");
    if (cleaned.includes("next")) {
      return "next";
    }
    if (cleaned.includes("back") || cleaned.includes("previous")) {
      return "back";
    }
    if (cleaned.includes("again") || cleaned.includes("repeat")) {
      return "again";
    }
    return null;
  }

  function updateFamilyCount(count: number) {
    setFamilyCount(count);
    setFamilyMembers((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push(createDefaultMember());
      }
      return updated.slice(0, count);
    });
  }

  function handleVoiceCommand(transcript: string) {
    const command = normalizeCommand(transcript);
    const steps = stepsRef.current;
    const currentIndex = stepIndexRef.current;
    if (!command) {
      const lastStep = steps[currentIndex] ?? "";
      const isFollowUp =
        steps.length > 0 &&
        currentIndex === steps.length - 1 &&
        lastStep.trim().endsWith("?");
      if (isFollowUp) {
        void sendVoiceText(
          `Follow-up to: "${lastStep}" User answer: ${transcript}`,
          "steps",
          { askSteps: false },
        );
        return;
      }
      void sendVoiceText(transcript, "conversation", {
        preserveSteps: true,
        askSteps: false,
        returnToSteps: true,
      });
      return;
    }

    setVoiceMessages((prev) => [
      ...prev,
      createLocalMessage("user", transcript, "stt"),
    ]);

    if (steps.length === 0) {
      const responseText = "There Are No Steps To Guide.";
      setVoiceMessages((prev) => [
        ...prev,
        createLocalMessage("assistant", responseText, "tts"),
      ]);
      speakText(responseText, startCommandListening);
      return;
    }

    let nextIndex = stepIndexRef.current;

    if (command == "next") {
      if (nextIndex < steps.length - 1) {
        nextIndex += 1;
        setCurrentStepIndex(nextIndex);
        const responseText = steps[nextIndex];
        setVoiceMessages((prev) => [
          ...prev,
          createLocalMessage("assistant", responseText, "tts"),
        ]);
        speakText(responseText, startCommandListening);
        return;
      }
      const responseText = "This Is The Last Step.";
      setVoiceMessages((prev) => [
        ...prev,
        createLocalMessage("assistant", responseText, "tts"),
      ]);
      speakText(responseText, startCommandListening);
      return;
    }

    if (command == "back") {
      if (nextIndex > 0) {
        nextIndex -= 1;
        setCurrentStepIndex(nextIndex);
        const responseText = steps[nextIndex];
        setVoiceMessages((prev) => [
          ...prev,
          createLocalMessage("assistant", responseText, "tts"),
        ]);
        speakText(responseText, startCommandListening);
        return;
      }
      const responseText = "This Is The First Step.";
      setVoiceMessages((prev) => [
        ...prev,
        createLocalMessage("assistant", responseText, "tts"),
      ]);
      speakText(responseText, startCommandListening);
      return;
    }

    const responseText = steps[nextIndex];
    setVoiceMessages((prev) => [
      ...prev,
      createLocalMessage("assistant", responseText, "tts"),
    ]);
    speakText(responseText, startCommandListening);
  }

  async function handlePrepSubmit() {
    const context = "";
    const signature = JSON.stringify({
      familyCount,
      familyMembers: familyMembers.slice(0, familyCount),
    });
    if (prepResults.length > 0 && signature === lastPrepSignature) {
      return;
    }
    const memberSummary = familyMembers
      .slice(0, familyCount)
      .map((member, index) => {
        const roleLabel = index == 0 ? "User" : `Family ${index}`;
        const sexLabel =
          member.sex === "male"
            ? "Male"
            : member.sex === "female"
              ? "Female"
              : "Unspecified";
        const conditionLabel =
          member.conditions.length > 0
            ? `Conditions: ${member.conditions.join(", ")}`
            : "Conditions: None";
        const noteLabel = member.notes ? `Notes: ${member.notes}` : "Notes: None";
        return `${roleLabel}: ${member.name || "Unnamed"}, ${sexLabel}, ${member.age} years, ${conditionLabel}, ${noteLabel}`;
      })
      .join(" / ");
    const combinedContext = [
      `Family size: ${familyCount}`,
      memberSummary,
      context,
    ]
      .filter((value) => value.trim().length > 0)
      .join(" | ");

    if (!combinedContext.trim()) {
      return;
    }

    setLastPrepSignature(signature);
    setPrepLoading(true);

    try {
      const response = await fetch("/api/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: combinedContext,
          familyCount,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data?.result) {
        setPrepResults([data.result]);
      }
      setSelectedPrepItem(null);
    } catch {
    } finally {
      setPrepLoading(false);
    }
  }

  const guidanceHistory = voiceMessages.filter(
    (message) => message.role === "assistant",
  );
  const latestPrepResult = prepResults[0] ?? null;
  const isPrimaryTab =
    activeTab === "home" || activeTab === "history" || activeTab === "info";
  const showBottomNav = isAuthenticated && isPrimaryTab;
  const showTopBar = isAuthenticated;
  const showBackButton = activeTab === "voice" || activeTab === "prep";
  const topTitle =
    activeTab === "voice"
      ? "AI Emergency Assistant"
      : activeTab === "prep"
        ? "AI Medication Recommendation"
        : activeTab === "history"
          ? "Usage History"
          : activeTab === "info"
            ? "Edit Family Information"
            : "Homspital";
  const lastGuidanceAt =
    guidanceHistory.length > 0
      ? new Date(
          guidanceHistory[guidanceHistory.length - 1].createdAt,
        ).toLocaleString()
      : null;
  const onboardingSlides = [
    {
      title: "Safe Home,\nMade Into An\nEmergency Assistant",
      accent: "bg-emerald-50",
      icon: "🏠",
    },
    {
      title:
        "We Recommend Over-The-Counter\nMedicines\nThat Fit Your Household Perfectly",
      accent: "bg-sky-50",
      icon: "💊",
    },
    {
      title:
        "In An Emergency,\nAn AI Agent Helps You Respond\nIn Real Time",
      accent: "bg-purple-50",
      icon: "🤖",
    },
  ];
  const currentSlide = onboardingSlides[onboardingStep];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto h-screen w-full max-w-md bg-white md:my-8 md:h-[844px] md:w-[390px] md:rounded-[32px] md:shadow-xl md:overflow-hidden md:relative">
        <div className="flex h-full flex-col">
            {showTopBar && !showSplash && hasCompletedOnboarding ? (
              <header className="border-b border-slate-200 bg-white px-5 py-4">
                {activeTab === "home" ? (
                  <div className="flex justify-center">
                    <Image
                      src="/logo.png"
                      alt="Homspital"
                      width={140}
                      height={60}
                      className="h-8 w-auto"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {showBackButton ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleConversationEnd();
                            setActiveTab("home");
                          }}
                          className="text-xl text-slate-500"
                        >
                          ←
                        </button>
                      ) : null}
                      <h1 className="text-base font-semibold text-slate-900">
                        {topTitle}
                      </h1>
                    </div>
                    {activeTab === "voice" ? (
                      <button
                        type="button"
                        onClick={handleNewChat}
                        className="rounded-full border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-600"
                      >
                        New Chat
                      </button>
                    ) : null}
                  </div>
                )}
              </header>
            ) : null}

            <main
              className={`flex-1 overflow-y-auto px-5 pb-10 pt-6 ${
                showBottomNav ? "pb-24" : "pb-10"
              }`}
            >
              {showSplash ? (
                <section
                  onClick={() => setShowSplash(false)}
                  className="flex min-h-full flex-col items-center justify-center gap-4 text-center"
                >
                  <Image
                    src="/logo.png"
                    alt="Homspital"
                    width={240}
                    height={120}
                    className="h-20 w-auto"
                    priority
                  />
                  <p className="text-xs text-slate-400">
                    Tap Anywhere To Continue
                  </p>
                </section>
              ) : !hasCompletedOnboarding ? (
                <section className="flex min-h-full flex-col items-center text-center">
                  <div className="mt-4 flex w-full items-center gap-3">
                    {onboardingSlides.map((_, index) => (
                      <span
                        key={`onboard-line-${index}`}
                        className={`h-1 flex-1 rounded-full ${
                          index === onboardingStep
                            ? "bg-emerald-600"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-10 text-lg font-semibold leading-relaxed text-slate-900 whitespace-pre-line">
                    {currentSlide?.title}
                  </div>
                  <div
                    className={`mt-8 flex h-40 w-40 items-center justify-center rounded-3xl text-5xl ${currentSlide?.accent}`}
                  >
                    {currentSlide?.icon}
                  </div>
                  <div className="mt-6 flex items-center gap-2">
                    {onboardingSlides.map((_, index) => (
                      <span
                        key={`onboard-dot-${index}`}
                        className={`h-2 w-2 rounded-full ${
                          index === onboardingStep
                            ? "bg-emerald-600"
                            : "bg-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onboardingStep < onboardingSlides.length - 1) {
                        setOnboardingStep((prev) => prev + 1);
                        return;
                      }
                      setHasCompletedOnboarding(true);
                    }}
                    className="mt-8 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasCompletedOnboarding(true)}
                    className="mt-3 text-sm text-slate-400"
                  >
                    Skip
                  </button>
                </section>
              ) : activeTab === "home" ? (
                <section className="flex flex-col gap-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      Family Information
                    </div>
                    <div className="mt-4 space-y-3">
                      {familyMembers.slice(0, familyCount).map((member, index) => {
                        const roleLabel =
                          index === 0 ? "User" : `Family ${index}`;
                        const displayName =
                          member.name?.trim() || (index === 0 ? "User" : roleLabel);
                        return (
                          <div
                            key={`home-family-${index}`}
                            className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                          >
                            <div className="h-10 w-10 rounded-full bg-emerald-50" />
                            <div>
                              <div className="text-xs text-slate-400">
                                {displayName}
                              </div>
                              <div className="font-medium text-slate-700">
                                {member.sex === "male"
                                  ? "Male"
                                  : member.sex === "female"
                                    ? "Female"
                                    : "Unspecified"}{" "}
                                · {member.age} Years
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleConversationEnd();
                        setActiveTab("prep");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                    >
                      <div className="text-sm font-semibold text-slate-700">
                        AI Medication Recommendation
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Personalized Medicine List
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleConversationEnd();
                        setActiveTab("info");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
                    >
                      <div className="text-sm font-semibold text-slate-700">
                        Edit Family Information
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Update Profiles
                      </p>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("voice")}
                    className="flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-sm"
                  >
                    <span>AI Emergency Assistant</span>
                    <span>🤖</span>
                  </button>
                </section>
              ) : activeTab === "history" ? (
                <section className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-slate-600">
                    Total Guidance Responses: {guidanceHistory.length}
                    {lastGuidanceAt ? ` · Last: ${lastGuidanceAt}` : ""}
                  </div>
                  {guidanceHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No Guidance History Yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {guidanceHistory.map((message) => (
                        <div
                          key={`history-${message.id}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Guidance</span>
                            <span>
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-2 text-slate-700">{message.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : activeTab === "info" ? (
                <section className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">
                      Family Info (Including You)
                    </p>
                    <div className="mt-3">
                      <select
                        value={familyCount}
                        onChange={(event) =>
                          updateFamilyCount(Number(event.target.value))
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6].map((count) => (
                          <option key={count} value={count}>
                            {count} Member{count > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 space-y-4">
                      {familyMembers.slice(0, familyCount).map((member, index) => {
                        const roleLabel =
                          index === 0 ? "User" : `Family ${index}`;
                        return (
                          <div
                            key={`settings-family-${index}`}
                            className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                          >
                            <p className="font-semibold text-slate-700">
                              {roleLabel}
                            </p>
                            <label className="mt-2 flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Name
                              <input
                                value={member.name}
                                onChange={(event) => {
                                  const name = event.target.value;
                                  setFamilyMembers((prev) => {
                                    const updated = [...prev];
                                    updated[index] = { ...updated[index], name };
                                    return updated;
                                  });
                                }}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              />
                            </label>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Sex
                                <select
                                  value={member.sex}
                                  onChange={(event) => {
                                    const sex = event.target.value as
                                      | "male"
                                      | "female"
                                      | "";
                                    setFamilyMembers((prev) => {
                                      const updated = [...prev];
                                      updated[index] = {
                                        ...updated[index],
                                        sex,
                                      };
                                      return updated;
                                    });
                                  }}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                >
                                  <option value="">Select</option>
                                  {(["male", "female"] as const).map((sex) => (
                                    <option key={sex} value={sex}>
                                      {sex === "male" ? "Male" : "Female"}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Age
                                <input
                                  type="number"
                                  min={0}
                                  value={member.age}
                                  onChange={(event) => {
                                    const age = Number(event.target.value);
                                    setFamilyMembers((prev) => {
                                      const updated = [...prev];
                                      updated[index] = {
                                        ...updated[index],
                                        age: Number.isNaN(age) ? 0 : age,
                                      };
                                      return updated;
                                    });
                                  }}
                                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                                />
                              </label>
                            </div>
                            <div className="mt-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Special Health Issues
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {healthConditions.map((condition) => (
                                  <label
                                    key={`settings-${index}-${condition}`}
                                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={member.conditions.includes(
                                        condition,
                                      )}
                                      onChange={() =>
                                        setFamilyMembers((prev) => {
                                          const updated = [...prev];
                                          const current =
                                            updated[index].conditions;
                                          const nextConditions = current.includes(
                                            condition,
                                          )
                                            ? current.filter(
                                                (item) => item !== condition,
                                              )
                                            : [...current, condition];
                                          updated[index] = {
                                            ...updated[index],
                                            conditions: nextConditions,
                                          };
                                          return updated;
                                        })
                                      }
                                    />
                                    {condition}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <label className="mt-3 flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Additional Notes
                              <textarea
                                value={member.notes}
                                onChange={(event) => {
                                  const notes = event.target.value;
                                  setFamilyMembers((prev) => {
                                    const updated = [...prev];
                                    updated[index] = { ...updated[index], notes };
                                    return updated;
                                  });
                                }}
                                rows={2}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              />
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("home")}
                      className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Save
                    </button>
                  </div>
                </section>
              ) : activeTab === "voice" ? (
                <section className="flex h-full flex-col gap-4">
                  <div className="flex-1 space-y-3">
                    {voiceMessages.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                        <div className="text-5xl">🎤</div>
                        <p className="mt-4 text-base font-semibold text-slate-900">
                          Please Describe The Situation Where You Need Help
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Press The Button And Explain The Situation By Voice
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {voiceMessages.map((message) => (
                          <div
                            key={`voice-${message.id}`}
                            className={`flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                message.role === "user"
                                  ? "bg-emerald-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-700"
                              }`}
                            >
                              {message.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">
                      Voice Guidance
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Speak Your Situation Or Say Next, Back, Again
                    </p>
                    <button
                      type="button"
                      onClick={handleListenStart}
                      disabled={!speechSupported || isListening || isSpeaking}
                      className="mt-4 h-16 w-16 rounded-full bg-emerald-600 text-2xl text-white"
                    >
                      🎙
                    </button>
                  </div>
                  {assistantSteps.length > 0 ? (
                    <div className="mt-auto pb-2">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleVoiceCommand("back")}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600"
                        >
                          ‹ Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoiceCommand("again")}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600"
                        >
                          ↻ Again
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoiceCommand("next")}
                          className="rounded-full bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white"
                        >
                          Next ›
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : (
                <section className="flex flex-col gap-4">
                  {selectedPrepItem ? (
                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="text-center text-lg font-semibold text-slate-900">
                        {selectedPrepItem.name}
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-slate-700">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                            Reason For Recommendation
                          </p>
                          <p className="mt-3 leading-relaxed">
                            {selectedPrepItem.reason}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-orange-50 p-4 text-sm text-slate-700">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                            Warning
                          </p>
                          <p className="mt-3 leading-relaxed">
                            {selectedPrepItem.caution}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPrepItem(null)}
                        className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        Check
                      </button>
                    </div>
                  ) : !latestPrepResult ? (
                    <p className="text-sm text-slate-500">
                      No Suggestions Yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {latestPrepResult.sections.map((section) => (
                        <div key={section.title}>
                          <div className="mb-2 text-sm font-semibold text-slate-700">
                            {section.title}
                          </div>
                          <div className="space-y-3">
                            {section.items.map((item) => (
                              <button
                                key={`${latestPrepResult.id}-${item.name}`}
                                type="button"
                                onClick={() => setSelectedPrepItem(item)}
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-700 shadow-sm"
                              >
                                {item.name}
                                <span className="text-slate-400">›</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </main>

            {showBottomNav && !showSplash && hasCompletedOnboarding ? (
              <nav className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-6 py-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  {(["home", "history", "info"] as TabKey[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        if (tab === "home") {
                          handleConversationEnd();
                        }
                        setActiveTab(tab);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className="h-6 w-6"
                        style={{
                          WebkitMaskImage:
                            tab === "home"
                              ? "url(/icons/home.png)"
                              : tab === "history"
                                ? "url(/icons/history.png)"
                                : "url(/icons/info.png)",
                          maskImage:
                            tab === "home"
                              ? "url(/icons/home.png)"
                              : tab === "history"
                                ? "url(/icons/history.png)"
                                : "url(/icons/info.png)",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskSize: "contain",
                          maskSize: "contain",
                          WebkitMaskPosition: "center",
                          maskPosition: "center",
                          backgroundColor:
                            activeTab === tab ? "#10b981" : "#9ca3af",
                        }}
                      />
                      <span
                        className={`text-[10px] font-semibold tracking-[0.2em] ${
                          activeTab === tab ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {tab === "home"
                          ? "HOME"
                          : tab === "history"
                            ? "USAGE HISTORY"
                            : "MY INFO"}
                      </span>
                    </button>
                  ))}
                </div>
              </nav>
            ) : null}
          </div>
      </div>
    </div>
  );
}
