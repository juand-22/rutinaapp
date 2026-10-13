import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { MLCEngineInterface } from "@mlc-ai/web-llm";
import { ChatIcon, PlusIcon, SendIcon, TrashIcon } from "../../../shared/components/Icons";
import MarkdownView from "../../../shared/components/MarkdownView";
import {
  db,
  type ChatConversation,
  type ChatMessage,
} from "../../../shared/db/database";
import { formatShortDate } from "../../../shared/utils/date";

const LOW_GPU_BUFFER_LIMIT = 128 * 1024 * 1024;
const SYSTEM_PROMPT =
  "Eres un asistente útil. Responde en español de forma clara y concisa.";

function currentTimestamp() {
  return Date.now();
}

const MODELS = [
  {
    id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
    name: "Ligero · SmolLM2 360M",
    strength: "Más rápido y pequeño",
    vramMB: 580,
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
    name: "Equilibrado · Qwen 2.5 0.5B",
    strength: "Mejor equilibrio",
    vramMB: 1061,
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    name: "Potente · Llama 3.2 3B",
    strength: "Más capaz, mayor consumo",
    vramMB: 2952,
  },
] as const;

type ModelId = (typeof MODELS)[number]["id"];

type DeviceCheck =
  | { state: "checking" }
  | { state: "unsupported"; message: string }
  | {
      state: "available";
      memoryGB: number | null;
      lowBufferLimit: boolean;
    };

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

function createConversation(modelId: ModelId): ChatConversation {
  const now = currentTimestamp();
  return {
    id: crypto.randomUUID(),
    title: "Nuevo chat",
    modelId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function getModel(modelId: string) {
  return MODELS.find((model) => model.id === modelId) ?? MODELS[1];
}

export default function ChatPage() {
  const engineRef = useRef<MLCEngineInterface | null>(null);
  const initializedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const conversations = useLiveConversations();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(MODELS[1].id);
  const [loadedModelId, setLoadedModelId] = useState<ModelId | null>(null);
  const [cachedModelIds, setCachedModelIds] = useState<Set<ModelId>>(
    () => new Set(),
  );
  const [checkingModelCache, setCheckingModelCache] = useState(true);
  const [modelCacheError, setModelCacheError] = useState("");
  const [deviceCheck, setDeviceCheck] = useState<DeviceCheck>({
    state: "checking",
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ value: 0, text: "" });
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  const selectedModel = getModel(selectedModelId);
  const currentConversation = conversations?.find(
    (conversation) => conversation.id === selectedChatId,
  );

  useEffect(() => {
    let cancelled = false;
    const checkDevice = async () => {
      const browserNavigator = navigator as NavigatorWithDeviceMemory;
      if (!window.isSecureContext) {
        setDeviceCheck({
          state: "unsupported",
          message:
            "WebGPU requiere una conexión segura (HTTPS o localhost). Abre la app desde un sitio HTTPS actualizado.",
        });
        return;
      }
      if (!navigator.gpu) {
        setDeviceCheck({
          state: "unsupported",
          message:
            "Este navegador no ofrece WebGPU. Prueba una versión reciente de Chrome, Edge o Safari en un dispositivo compatible.",
        });
        return;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (cancelled) return;
        if (!adapter) {
          setDeviceCheck({
            state: "unsupported",
            message:
              "WebGPU está disponible, pero no se encontró un adaptador gráfico compatible o habilitado en este dispositivo.",
          });
          return;
        }

        setDeviceCheck({
          state: "available",
          memoryGB: browserNavigator.deviceMemory ?? null,
          lowBufferLimit:
            adapter.limits.maxStorageBufferBindingSize < LOW_GPU_BUFFER_LIMIT,
        });
      } catch (checkError) {
        if (cancelled) return;
        const detail =
          checkError instanceof Error ? ` (${checkError.message})` : "";
        setDeviceCheck({
          state: "unsupported",
          message: `No se pudo comprobar el adaptador WebGPU${detail}. Revisa la compatibilidad del navegador y del controlador gráfico.`,
        });
      }
    };

    const updateConnection = () => setOnline(navigator.onLine);
    void checkDevice();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      cancelled = true;
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (conversations === undefined || initializedRef.current) return;
    initializedRef.current = true;
    const latest = conversations[0];
    if (latest) {
      queueMicrotask(() => {
        setSelectedChatId(latest.id);
        setSelectedModelId(getModel(latest.modelId).id);
        setMessages(latest.messages);
      });
      return;
    }

    const initial = createConversation(MODELS[1].id);
    void db.chats
      .add(initial)
      .then(() => {
        setSelectedChatId(initial.id);
        setMessages([]);
      })
      .catch((storageError: unknown) => {
        setError(
          `No se pudo crear un chat en IndexedDB: ${getErrorMessage(storageError)}`,
        );
      });
  }, [conversations]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, generating]);

  useEffect(() => {
    let cancelled = false;
    const checkModelCache = async () => {
      try {
        const { hasModelInCache } = await import("@mlc-ai/web-llm");
        const cached = await Promise.all(
          MODELS.map(async (model) =>
            (await hasModelInCache(model.id)) ? model.id : null,
          ),
        );
        if (!cancelled) {
          setCachedModelIds(
            new Set(cached.filter((id): id is ModelId => id !== null)),
          );
        }
      } catch (cacheError) {
        if (!cancelled) {
          setModelCacheError(
            `No se pudo comprobar qué modelos están descargados: ${getErrorMessage(cacheError)}`,
          );
        }
      } finally {
        if (!cancelled) setCheckingModelCache(false);
      }
    };
    void checkModelCache();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      const engine = engineRef.current;
      if (engine) void engine.unload();
    },
    [],
  );

  const selectConversation = async (conversation: ChatConversation) => {
    if (generating || loading) return;
    const nextModelId = getModel(conversation.modelId).id;
    if (engineRef.current && loadedModelId !== nextModelId) {
      setLoading(true);
      try {
        await engineRef.current.unload();
        engineRef.current = null;
        setLoadedModelId(null);
      } catch (unloadError) {
        setError(
          `No se pudo liberar el modelo actual: ${getErrorMessage(unloadError)}`,
        );
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setError("");
    setSelectedChatId(conversation.id);
    setSelectedModelId(nextModelId);
    setMessages(conversation.messages);
  };

  const startNewConversation = async () => {
    if (generating || loading) return;
    const conversation = createConversation(selectedModelId);
    try {
      await db.chats.add(conversation);
      setError("");
      setSelectedChatId(conversation.id);
      setMessages([]);
    } catch (storageError) {
      setError(
        `No se pudo guardar el chat nuevo en IndexedDB: ${getErrorMessage(storageError)}`,
      );
    }
  };

  const deleteConversation = async () => {
    if (!currentConversation || generating || loading) return;
    if (!window.confirm(`¿Eliminar "${currentConversation.title}"?`)) return;

    const remaining = (conversations ?? []).filter(
      (conversation) => conversation.id !== currentConversation.id,
    );
    const replacement = remaining[0] ?? createConversation(selectedModelId);
    try {
      await db.transaction("rw", db.chats, async () => {
        await db.chats.delete(currentConversation.id);
        if (remaining.length === 0) await db.chats.add(replacement);
      });
      setError("");
      setSelectedChatId(replacement.id);
      setSelectedModelId(getModel(replacement.modelId).id);
      setMessages(replacement.messages);
    } catch (storageError) {
      setError(
        `No se pudo eliminar el chat de IndexedDB: ${getErrorMessage(storageError)}`,
      );
    }
  };

  const chooseModel = async (modelId: ModelId) => {
    if (loading || generating || modelId === selectedModelId) return;
    const previousEngine = engineRef.current;
    if (previousEngine) {
      setLoading(true);
      try {
        await previousEngine.unload();
        engineRef.current = null;
        setLoadedModelId(null);
      } catch (unloadError) {
        setError(
          `No se pudo liberar el modelo actual: ${getErrorMessage(unloadError)}`,
        );
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setSelectedModelId(modelId);
    if (!selectedChatId) return;
    try {
      await db.chats.update(selectedChatId, {
        modelId,
        updatedAt: currentTimestamp(),
      });
      setError("");
    } catch (storageError) {
      setError(
        `No se pudo guardar el modelo elegido en IndexedDB: ${getErrorMessage(storageError)}`,
      );
    }
  };

  const loadModel = async () => {
    if (
      loading ||
      loadedModelId === selectedModelId ||
      deviceCheck.state !== "available"
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setProgress({ value: 0, text: "Preparando WebGPU…" });
    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
      const engine = await CreateMLCEngine(selectedModelId, {
        initProgressCallback: (report) => {
          setProgress({
            value: Math.min(100, Math.max(0, Math.round(report.progress * 100))),
            text: report.text,
          });
        },
      });
      engineRef.current = engine;
      setLoadedModelId(selectedModelId);
      setCachedModelIds((cached) => new Set(cached).add(selectedModelId));
      setProgress({ value: 100, text: "Modelo listo en este dispositivo." });
    } catch (loadError) {
      setError(
        navigator.onLine
          ? `No se pudo descargar o iniciar el modelo. Puede faltar memoria GPU/RAM o haber un problema de conexión. Detalle: ${getErrorMessage(loadError)}`
          : `No se pudo cargar el modelo offline. Si no se había descargado antes, conéctate a internet para obtenerlo. Detalle: ${getErrorMessage(loadError)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    const engine = engineRef.current;
    if (!content || generating) return;
    if (loadedModelId !== selectedModelId || !engine) {
      setError(
        `Activa o descarga ${selectedModel.name} antes de enviar el mensaje. Tu texto se conservará.`,
      );
      return;
    }
    if (!selectedChatId) {
      setError("Espera a que se cree la conversación antes de enviar.");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const responseId = crypto.randomUUID();
    const conversationMessages = [
      ...messages,
      userMessage,
      { id: responseId, role: "assistant" as const, content: "" },
    ];
    const title =
      currentConversation?.title === "Nuevo chat"
        ? content.slice(0, 48)
        : (currentConversation?.title ?? content.slice(0, 48));

    setDraft("");
    setError("");
    setGenerating(true);
    setMessages(conversationMessages);

    try {
      await db.chats.update(selectedChatId, {
        title,
        messages: conversationMessages,
        modelId: selectedModelId,
        updatedAt: currentTimestamp(),
      });
    } catch (storageError) {
      setMessages(messages);
      setGenerating(false);
      setError(
        `No se pudo guardar tu mensaje en IndexedDB, así que no se envió al modelo: ${getErrorMessage(storageError)}`,
      );
      return;
    }

    const promptMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.map(({ role, content: previousContent }) => ({
        role,
        content: previousContent,
      })),
      { role: "user" as const, content },
    ];
    let response = "";

    try {
      const stream = await engine.chat.completions.create({
        messages: promptMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 256,
      });
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta.content;
        if (typeof text !== "string" || text.length === 0) continue;
        response += text;
        setMessages((current) =>
          current.map((message) =>
            message.id === responseId
              ? { ...message, content: response }
              : message,
          ),
        );
      }
      if (!response) throw new Error("El modelo no generó una respuesta.");

      const completedMessages = conversationMessages.map((message) =>
        message.id === responseId ? { ...message, content: response } : message,
      );
      setMessages(completedMessages);
      try {
        await db.chats.update(selectedChatId, {
          messages: completedMessages,
          updatedAt: currentTimestamp(),
        });
      } catch (storageError) {
        setError(
          `La respuesta se generó, pero no se pudo guardar en IndexedDB. Puede seguir visible hasta que cierres o recargues la app. Detalle: ${getErrorMessage(storageError)}`,
        );
      }
    } catch (generationError) {
      const retainedMessages = response
        ? conversationMessages.map((message) =>
            message.id === responseId ? { ...message, content: response } : message,
          )
        : conversationMessages.filter((message) => message.id !== responseId);
      setMessages(retainedMessages);
      try {
        await db.chats.update(selectedChatId, {
          messages: retainedMessages,
          updatedAt: currentTimestamp(),
        });
        setError(
          response
            ? `La generación se interrumpió; se guardó la respuesta parcial y tu mensaje. Detalle: ${getErrorMessage(generationError)}`
            : `No se pudo generar la respuesta. Tu mensaje quedó guardado. Detalle: ${getErrorMessage(generationError)}`,
        );
      } catch (storageError) {
        setError(
          `Falló la generación (${getErrorMessage(generationError)}) y tampoco se pudo actualizar el chat en IndexedDB (${getErrorMessage(storageError)}).`,
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const modelFit = getModelFit(selectedModel.vramMB, deviceCheck);

  return (
    <section className="mx-auto flex h-[calc(100dvh-7rem)] min-h-0 max-w-2xl flex-col overflow-hidden px-3 pt-3">
      <header className="mb-2 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Chat local
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Elige el tamaño del modelo. Las conversaciones se guardan en este
          dispositivo.
        </p>
      </header>

      {deviceCheck.state === "checking" && (
        <StatusBanner tone="info">
          Comprobando WebGPU y los recursos disponibles…
        </StatusBanner>
      )}
      {deviceCheck.state === "unsupported" && (
        <StatusBanner tone="error">{deviceCheck.message}</StatusBanner>
      )}
      {deviceCheck.state === "available" && (
        <StatusBanner tone={modelFit.tone}>
          {modelFit.message}
        </StatusBanner>
      )}
      {modelCacheError && (
        <StatusBanner tone="warning">{modelCacheError}</StatusBanner>
      )}

      <div className="mt-2 shrink-0 rounded-xl bg-white/70 px-3 py-2 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-900/5 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
        {online
          ? "Los chats se guardan automáticamente en este dispositivo. La primera descarga del modelo requiere internet."
          : "Estás offline. Puedes conversar con un modelo ya descargado; los chats siguen guardándose en este dispositivo."}
      </div>

      <div className="relative z-20 mt-2 shrink-0 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-900/5 dark:bg-[#1a1726] dark:ring-white/10">
        <div className="flex items-center gap-2">
          <details className="group min-w-0 flex-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedModel.name}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {cachedModelIds.has(selectedModelId)
                    ? "Descargado · "
                    : "No descargado · "}
                  {selectedModel.vramMB} MB GPU · cambiar modelo
                </span>
              </span>
              <span className="shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="space-y-2 px-1 pb-1">
              {MODELS.map((model) => {
                const fit = getModelFit(model.vramMB, deviceCheck);
                const selected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => void chooseModel(model.id)}
                    disabled={loading || generating}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-slate-200 hover:border-primary-300 dark:border-white/10 dark:hover:border-primary-700"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {model.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {model.strength} · aprox. {model.vramMB} MB de memoria GPU
                      </span>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          cachedModelIds.has(model.id)
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
                        }`}
                      >
                        {cachedModelIds.has(model.id)
                          ? "Descargado en este dispositivo"
                          : checkingModelCache
                            ? "Comprobando descarga…"
                            : "Aún no descargado"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        fit.tone === "success"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                          : fit.tone === "warning"
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
                            : fit.tone === "error"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                              : "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
                      }`}
                    >
                      {fit.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        <button
          type="button"
          onClick={() => void loadModel()}
          disabled={
            loading ||
            loadedModelId === selectedModelId ||
            deviceCheck.state !== "available" ||
            (!online && !cachedModelIds.has(selectedModelId))
          }
          className="shrink-0 rounded-xl bg-primary-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? `${progress.value}%`
            : loadedModelId === selectedModelId
              ? "Listo"
              : cachedModelIds.has(selectedModelId)
                ? "Activar"
                : online
                  ? "Descargar"
                  : "Offline"}
        </button>
        </div>
        {loading && (
          <div className="mt-2 px-2" aria-live="polite">
            <div className="mb-2 flex justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{progress.text || "Cargando modelo…"}</span>
              <span>{progress.value}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"
              role="progressbar"
              aria-valuenow={progress.value}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${progress.value}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-2 shrink-0 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900"
        >
          {error}
        </div>
      )}

      <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 dark:bg-[#1a1726] dark:ring-white/10">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-2 py-2 dark:border-white/10">
          <select
            id="saved-chat"
            aria-label="Conversación guardada"
            value={selectedChatId ?? ""}
            onChange={(event) => {
              const conversation = conversations?.find(
                (item) => item.id === event.target.value,
              );
              if (conversation) void selectConversation(conversation);
            }}
            disabled={!conversations?.length || generating || loading}
            className="min-w-0 flex-1 rounded-lg bg-slate-50 px-2 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 dark:bg-white/5 dark:text-slate-100"
          >
            {(conversations ?? []).map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title} · {formatShortDate(conversation.updatedAt)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void startNewConversation()}
            disabled={generating || loading}
            aria-label="Nuevo chat"
            title="Nuevo chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 hover:bg-primary-200 disabled:opacity-50 dark:bg-primary-900/40 dark:text-primary-200"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => void deleteConversation()}
            disabled={!currentConversation || generating || loading}
            aria-label="Eliminar chat"
            title="Eliminar chat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 dark:bg-red-950/40 dark:text-red-200"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={messagesContainerRef}
          className="chat-messages min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.length === 0 && (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <ChatIcon className="mb-3 h-9 w-9 text-primary-500" />
              <p className="font-medium text-slate-800 dark:text-slate-100">
                ¿En qué te puedo ayudar?
              </p>
              <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Esta conversación se guardará automáticamente en este
                dispositivo.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "rounded-br-md bg-primary-600 text-white"
                    : "chat-assistant-bubble rounded-bl-md bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100"
                }`}
              >
                {message.role === "assistant" ? (
                  message.content ? (
                    <MarkdownView
                      content={message.content}
                      className="chat-markdown"
                    />
                  ) : (
                    generating && (
                      <span className="animate-pulse">Pensando…</span>
                    )
                  )
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(event) => void sendMessage(event)}
          className="flex items-end gap-2 border-t border-slate-100 p-3 dark:border-white/10"
        >
          <label className="sr-only" htmlFor="chat-message">
            Escribe un mensaje
          </label>
          <textarea
            id="chat-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={
              loadedModelId === selectedModelId
                ? "Escribe un mensaje…"
                : "Escribe aquí; activa un modelo para enviarlo…"
            }
            rows={1}
            disabled={generating}
            className="max-h-32 min-h-11 flex-1 resize-y rounded-xl bg-slate-100 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 dark:bg-white/5 dark:text-white"
          />
          <button
            type="submit"
            aria-label="Enviar mensaje"
            disabled={
              !draft.trim() ||
              generating
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  );
}

function useLiveConversations() {
  return useLiveQuery(
    () => db.chats.orderBy("updatedAt").reverse().toArray(),
    [],
  );
}

function getModelFit(
  vramMB: number,
  check: DeviceCheck,
): {
  label: string;
  tone: "info" | "success" | "warning" | "error";
  message: string;
} {
  if (check.state === "checking") {
    return {
      label: "Comprobando",
      tone: "info",
      message: "Comprobando compatibilidad de WebGPU y memoria del dispositivo…",
    };
  }
  if (check.state === "unsupported") {
    return {
      label: "No compatible",
      tone: "error",
      message: check.message,
    };
  }
  if (check.memoryGB === null) {
    return {
      label: "No estimable",
      tone: "warning",
      message: `WebGPU está disponible. El modelo seleccionado requiere aprox. ${vramMB} MB de GPU, pero el navegador no expone la memoria del dispositivo para estimar si alcanzará.`,
    };
  }
  const estimatedMemoryMB = check.memoryGB * 1024;
  const likelyEnough = estimatedMemoryMB >= vramMB * 1.5;
  if (!likelyEnough || check.lowBufferLimit) {
    return {
      label: "No recomendable",
      tone: "warning",
      message: `WebGPU está disponible, pero este dispositivo podría no tener recursos suficientes para el modelo (aprox. ${vramMB} MB de GPU). La RAM reportada por el navegador es ${check.memoryGB} GB${check.lowBufferLimit ? " y el límite del adaptador gráfico es bajo" : ""}. Puedes intentar cargarlo, aunque podría fallar o cerrar la pestaña.`,
    };
  }
  return {
    label: "Probablemente compatible",
    tone: "success",
    message: `WebGPU está disponible y la RAM reportada (${check.memoryGB} GB) parece suficiente para este modelo (aprox. ${vramMB} MB de GPU). Es solo una estimación: el navegador no informa la VRAM libre exacta.`,
  };
}

function StatusBanner({
  tone,
  children,
}: {
  tone: "info" | "success" | "warning" | "error";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900",
    success:
      "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
    warning:
      "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
    error:
      "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900",
  };
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ring-1 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
