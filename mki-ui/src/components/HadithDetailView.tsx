import { useState, useEffect, useMemo, useRef } from "react";
import mermaid from "mermaid";
import {
  getHadithById,
  resolveChain,
  getNarratorByIndex,
} from "../data/hadith/csvService";
import { statusLabels, generationLabels, statusHexColors } from "../data/hadith/constants";
import type { CsvHadith, ExtendedNarrator } from "../types";
import ExtendedNarratorDetails from "./ExtendedNarratorDetails";

interface HadithDetailViewProps {
  locale: "ar" | "en";
  t: Record<string, string>;
}

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  flowchart: {
    curve: "basis",
    nodeSpacing: 30,
    rankSpacing: 50,
    padding: 10,
  },
  themeVariables: {
    primaryColor: "#1a1f2e",
    primaryTextColor: "#fff",
    primaryBorderColor: "#374151",
    lineColor: "#6b7280",
    background: "#0f1319",
  },
});

// Generation order for sorting
const generationOrder = ["prophet", "sahaba", "tabieen", "atba_tabieen", "later"];

// Source info with Arabic names
const sourceInfo: Record<string, { nameAr: string; nameEn: string }> = {
  "Sahih Bukhari": { nameAr: "صحيح البخاري", nameEn: "Sahih Bukhari" },
  " Sahih Bukhari ": { nameAr: "صحيح البخاري", nameEn: "Sahih Bukhari" },
  "Sahih Muslim": { nameAr: "صحيح مسلم", nameEn: "Sahih Muslim" },
  "Sunan Abu Dawud": { nameAr: "سنن أبي داود", nameEn: "Sunan Abu Dawud" },
  "Jami at-Tirmidhi": { nameAr: "جامع الترمذي", nameEn: "Jami at-Tirmidhi" },
  "Sunan an-Nasai": { nameAr: "سنن النسائي", nameEn: "Sunan an-Nasai" },
  "Sunan Ibn Majah": { nameAr: "سنن ابن ماجه", nameEn: "Sunan Ibn Majah" },
};

function getSourceDisplay(source: string, locale: "ar" | "en"): string {
  const trimmed = source.trim();
  const info = sourceInfo[source] || sourceInfo[trimmed];
  if (info) {
    return locale === "ar" ? info.nameAr : info.nameEn;
  }
  return trimmed;
}

// Generate Mermaid diagram from resolved chain
function generateSanadMermaidDiagram(
  sanad: ExtendedNarrator[],
  locale: "ar" | "en" = "ar"
): string {
  if (sanad.length === 0) return "";

  const lines: string[] = ["flowchart TB"];

  // Style definitions
  lines.push("classDef prophet fill:#9333ea,stroke:#a855f7,color:#fff,stroke-width:3px");
  lines.push("classDef companion fill:#14b8a6,stroke:#2dd4bf,color:#fff,stroke-width:2px");
  lines.push("classDef trustworthy fill:#22c55e,stroke:#4ade80,color:#fff,stroke-width:2px");
  lines.push("classDef truthful fill:#4ade80,stroke:#86efac,color:#fff,stroke-width:2px");
  lines.push("classDef unknown fill:#f97316,stroke:#fb923c,color:#fff,stroke-width:2px");
  lines.push("classDef weak fill:#ef4444,stroke:#f87171,color:#fff,stroke-width:2px");
  lines.push("classDef collector fill:#d97706,stroke:#f59e0b,color:#fff,stroke-width:2px");

  // Group narrators by generation
  const narratorsByGen: Record<string, { narrator: ExtendedNarrator; index: number }[]> = {};

  sanad.forEach((narrator, index) => {
    const gen = narrator.generation || "later";
    if (!narratorsByGen[gen]) {
      narratorsByGen[gen] = [];
    }
    narratorsByGen[gen].push({ narrator, index });
  });

  // Create subgraphs by generation
  generationOrder.forEach((gen) => {
    const narratorsInGen = narratorsByGen[gen];
    if (!narratorsInGen || narratorsInGen.length === 0) return;

    const genLabel = generationLabels[locale][gen as keyof typeof generationLabels["ar"]];
    lines.push(`subgraph gen_${gen}["${genLabel}"]`);

    narratorsInGen.forEach(({ narrator, index }) => {
      // Clean the label for Mermaid
      const name = (locale === "ar" ? narrator.nameAr : narrator.nameEn)
        .replace(/"/g, "'")
        .replace(/\[/g, "(")
        .replace(/\]/g, ")")
        .replace(/[<>]/g, "");

      // Build label with death year if available
      let label = name;
      if (narrator.deathYear && narrator.status !== "prophet") {
        const deathPrefix = locale === "ar" ? "ت." : "d.";
        label += `<br/><small>${deathPrefix}${narrator.deathYear}</small>`;
      }

      // Add status label
      if (narrator.status !== "prophet") {
        label += `<br/><small>${statusLabels[locale][narrator.status]}</small>`;
      }

      // Different node shapes based on status
      if (narrator.status === "prophet") {
        lines.push(`  n${index}(["${name}"])`);
      } else if (narrator.status === "collector") {
        lines.push(`  n${index}{{"${label}"}}`);
      } else {
        lines.push(`  n${index}["${label}"]`);
      }

      const status = narrator.status || "unknown";
      lines.push(`  class n${index} ${status}`);
    });

    lines.push("end");
  });

  // Add edges (chain flows from first narrator down to last)
  for (let i = 0; i < sanad.length - 1; i++) {
    lines.push(`  n${i} --> n${i + 1}`);
  }

  return lines.join("\n");
}

// Sanad Diagram Component
function SanadDiagram({
  sanad,
  locale,
  onNodeClick,
  selectedNarratorIndex,
}: {
  sanad: ExtendedNarrator[];
  locale: "ar" | "en";
  onNodeClick: (index: number) => void;
  selectedNarratorIndex: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramCode = useMemo(() => generateSanadMermaidDiagram(sanad, locale), [sanad, locale]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !diagramCode) return;

      try {
        const id = `mermaid-sanad-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagramCode);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // Add click handlers to nodes
          const nodes = containerRef.current.querySelectorAll(".node");
          nodes.forEach((node) => {
            const nodeId = node.id;
            const match = nodeId.match(/flowchart-n(\d+)-\d+$/);
            if (match) {
              const index = parseInt(match[1], 10);
              node.addEventListener("click", () => onNodeClick(index));
              (node as HTMLElement).style.cursor = "pointer";

              // Highlight selected narrator
              if (selectedNarratorIndex !== null) {
                if (index === selectedNarratorIndex) {
                  (node as HTMLElement).style.filter = "brightness(1.3) drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))";
                } else {
                  (node as HTMLElement).style.opacity = "0.5";
                }
              }
            }
          });
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };

    renderDiagram();
  }, [diagramCode, onNodeClick, selectedNarratorIndex]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-amber-400">
          {locale === "ar" ? "سلسلة الرواة (الإسناد)" : "Chain of Narrators (Isnad)"}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {locale === "ar"
            ? `${sanad.length} راوٍ في السلسلة - انقر على راوٍ لمشاهدة تفاصيله`
            : `${sanad.length} narrators in the chain - Click a narrator to view details`}
        </div>
      </div>

      <div ref={containerRef} className="mermaid-container w-full overflow-x-auto" />
    </div>
  );
}

// Legend Component
function ChainLegend({ locale }: { locale: "ar" | "en" }) {
  const labels = statusLabels[locale];
  const items = [
    { status: "prophet", label: labels.prophet, color: statusHexColors.prophet },
    { status: "companion", label: labels.companion, color: statusHexColors.companion },
    { status: "trustworthy", label: labels.trustworthy, color: statusHexColors.trustworthy },
    { status: "unknown", label: labels.unknown, color: statusHexColors.unknown },
    { status: "collector", label: labels.collector, color: statusHexColors.collector },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 mb-4">
      {items.map(({ status, label, color }) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-gray-400 text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
}

// Sanad Not Available Component
function SanadNotAvailable({ locale }: { locale: "ar" | "en" }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="text-lg mb-2">
        {locale === "ar" ? "بيانات الإسناد غير متوفرة" : "Isnad data not available"}
      </p>
      <p className="text-sm text-gray-600">
        {locale === "ar"
          ? "لم يتم العثور على بيانات سلسلة الرواة لهذا الحديث في قاعدة البيانات"
          : "Chain of narration data was not found for this hadith in the database"}
      </p>
    </div>
  );
}

export default function HadithDetailView({
  locale,
  t: _t,
}: HadithDetailViewProps) {
  const [hadith, setHadith] = useState<CsvHadith | null>(null);
  const [resolvedSanad, setResolvedSanad] = useState<ExtendedNarrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNarratorIndex, setSelectedNarratorIndex] = useState<number | null>(null);
  const [selectedNarrator, setSelectedNarrator] = useState<ExtendedNarrator | null>(null);

  const isRTL = locale === "ar";

  // Load hadith data
  useEffect(() => {
    const loadHadith = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");

      if (!id) {
        setError(locale === "ar" ? "معرف الحديث مفقود" : "Missing hadith identifier");
        setLoading(false);
        return;
      }

      try {
        const foundHadith = await getHadithById(id);
        if (foundHadith) {
          setHadith(foundHadith);

          // Resolve the chain
          if (foundHadith.chainIndices.length > 0) {
            const chain = await resolveChain(foundHadith.chainIndices);
            setResolvedSanad(chain);
          }
        } else {
          setError(locale === "ar" ? "الحديث غير موجود" : "Hadith not found");
        }
      } catch (err) {
        console.error("Failed to load hadith:", err);
        setError(locale === "ar" ? "فشل تحميل الحديث" : "Failed to load hadith");
      } finally {
        setLoading(false);
      }
    };

    loadHadith();
  }, [locale]);

  // Handle narrator selection
  const handleNarratorClick = async (index: number) => {
    if (selectedNarratorIndex === index) {
      // Deselect
      setSelectedNarratorIndex(null);
      setSelectedNarrator(null);
    } else {
      setSelectedNarratorIndex(index);
      const narrator = resolvedSanad[index];
      if (narrator) {
        setSelectedNarrator(narrator);
      }
    }
  };

  // Handle clicking a narrator in the details panel
  const handleNarratorDetailsClick = async (scholarIndx: number) => {
    const narrator = await getNarratorByIndex(scholarIndx);
    if (narrator) {
      setSelectedNarrator(narrator);
      // Find index in current chain
      const index = resolvedSanad.findIndex((n) => n.scholarIndx === scholarIndx);
      setSelectedNarratorIndex(index >= 0 ? index : null);
    }
  };

  // Extract chapter name
  const getChapterDisplay = (chapter: string): string => {
    const parts = chapter.split(" - ");
    if (parts.length === 2) {
      return locale === "ar" ? parts[1] : parts[0];
    }
    return chapter;
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f1319] flex items-center justify-center ${isRTL ? "font-['Cairo']" : ""}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
          <div className="text-amber-400">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</div>
        </div>
      </div>
    );
  }

  if (error || !hadith) {
    return (
      <div className={`min-h-screen bg-[#0f1319] flex flex-col items-center justify-center gap-4 ${isRTL ? "font-['Cairo']" : ""}`}>
        <div className="text-red-400">{error}</div>
        <a
          href={locale === "ar" ? "/hadith" : "/en/hadith"}
          className="text-amber-400 hover:underline"
        >
          {locale === "ar" ? "العودة للمكتبة" : "Back to Library"}
        </a>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#0f1319] ${isRTL ? "font-['Cairo']" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <a
          href={locale === "ar" ? "/hadith" : "/en/hadith"}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
          {locale === "ar" ? "العودة للمكتبة" : "Back to Library"}
        </a>
      </div>

      {/* Hadith Text Box */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-[#1a1f2e] rounded-xl p-5 border border-amber-700/30">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="bg-amber-600/20 text-amber-400 text-sm px-3 py-1 rounded">
              {getSourceDisplay(hadith.source, locale)} #{hadith.hadithNo}
            </span>
            {hadith.chapter && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                {getChapterDisplay(hadith.chapter)}
              </span>
            )}
          </div>
          <p className="text-lg md:text-xl text-white leading-relaxed">
            {locale === "ar" ? hadith.textAr : hadith.textEn}
          </p>
        </div>
      </div>

      {/* Chain Visualization */}
      {resolvedSanad.length > 0 ? (
        <>
          <ChainLegend locale={locale} />

          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Sidebar - Narrator Details */}
              <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                {selectedNarrator ? (
                  <ExtendedNarratorDetails
                    narrator={selectedNarrator}
                    locale={locale}
                    onNarratorClick={handleNarratorDetailsClick}
                  />
                ) : (
                  <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-700/50">
                    <h3 className="text-base font-semibold text-gray-300 mb-3">
                      {locale === "ar" ? "معلومات الراوي" : "Narrator Info"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {locale === "ar" ? "اختر راوياً من السلسلة" : "Select a narrator from the chain"}
                    </p>
                  </div>
                )}
              </div>

              {/* Diagram */}
              <div className="lg:col-span-9 bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6 order-1 lg:order-2">
                <SanadDiagram
                  sanad={resolvedSanad}
                  locale={locale}
                  onNodeClick={handleNarratorClick}
                  selectedNarratorIndex={selectedNarratorIndex}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6">
            <SanadNotAvailable locale={locale} />
          </div>
        </div>
      )}

      {/* Mermaid styles */}
      <style>{`
        .mermaid-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .mermaid-container svg {
          max-width: 100%;
          height: auto;
          margin: 0 auto;
        }
        .mermaid-container .node rect,
        .mermaid-container .node polygon {
          stroke-width: 2px !important;
        }
        .mermaid-container .edgePath path {
          stroke: #6b7280 !important;
          stroke-width: 2px !important;
        }
        .mermaid-container .node:hover {
          filter: brightness(1.1);
        }
        .mermaid-container .cluster rect {
          fill: rgba(255, 255, 255, 0.03) !important;
          stroke: #374151 !important;
          stroke-width: 1px !important;
          stroke-dasharray: 5 5 !important;
          rx: 8px !important;
        }
        .mermaid-container .cluster-label {
          fill: #9ca3af !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
  );
}
