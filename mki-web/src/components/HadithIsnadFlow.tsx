import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import mermaid from "mermaid";

import type { CsvHadith, ExtendedNarrator } from "../types";
import { statusLabels, generationLabels, statusHexColors } from "../data/hadith/constants";
import ExtendedNarratorDetails from "./ExtendedNarratorDetails";

// API helper functions
async function fetchHadiths(page: number = 1, perPage: number = 50): Promise<{ hadiths: CsvHadith[]; total: number }> {
  const res = await fetch(`/api/hadiths?page=${page}&perPage=${perPage}`);
  if (!res.ok) throw new Error("Failed to fetch hadiths");
  return res.json();
}

async function fetchResolveChain(indices: number[]): Promise<ExtendedNarrator[]> {
  if (indices.length === 0) return [];
  const res = await fetch(`/api/narrators/resolve?ids=${indices.join(",")}`);
  if (!res.ok) return [];
  return res.json();
}

async function fetchNarratorByIndex(scholarIndx: number): Promise<ExtendedNarrator | null> {
  const res = await fetch(`/api/narrators/${scholarIndx}?withRelationships=false`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.narrator;
}

interface HadithIsnadFlowProps {
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

// Generate Mermaid diagram from chain
function generateMermaidDiagram(chain: ExtendedNarrator[], locale: "ar" | "en"): string {
  if (chain.length === 0) return "";

  const lines: string[] = ["flowchart TB"];

  // Define styles for each status
  lines.push("classDef prophet fill:#9333ea,stroke:#a855f7,color:#fff,stroke-width:3px");
  lines.push("classDef companion fill:#14b8a6,stroke:#2dd4bf,color:#fff,stroke-width:2px");
  lines.push("classDef trustworthy fill:#22c55e,stroke:#4ade80,color:#fff,stroke-width:2px");
  lines.push("classDef truthful fill:#4ade80,stroke:#86efac,color:#fff,stroke-width:2px");
  lines.push("classDef unknown fill:#f97316,stroke:#fb923c,color:#fff,stroke-width:2px");
  lines.push("classDef weak fill:#ef4444,stroke:#f87171,color:#fff,stroke-width:2px");
  lines.push("classDef collector fill:#6b7280,stroke:#9ca3af,color:#fff,stroke-width:2px");

  // Group narrators by generation
  const narratorsByGen: Record<string, { narrator: ExtendedNarrator; index: number }[]> = {};

  chain.forEach((narrator, index) => {
    const gen = narrator.generation || "later";
    if (!narratorsByGen[gen]) {
      narratorsByGen[gen] = [];
    }
    narratorsByGen[gen].push({ narrator, index });
  });

  // Create subgraphs for each generation in order
  generationOrder.forEach((gen) => {
    const narratorsInGen = narratorsByGen[gen];
    if (!narratorsInGen || narratorsInGen.length === 0) return;

    const genLabel = generationLabels[locale][gen as keyof typeof generationLabels["ar"]];
    lines.push(`subgraph gen_${gen}["${genLabel}"]`);

    narratorsInGen.forEach(({ narrator, index }) => {
      const name = (locale === "ar" ? narrator.nameAr : narrator.nameEn)
        .replace(/"/g, "'")
        .replace(/\[/g, "(")
        .replace(/\]/g, ")")
        .replace(/[<>]/g, "");

      // Build node label with death year and status
      let nodeLabel = name;

      if (narrator.deathYear && narrator.status !== "prophet") {
        const deathPrefix = locale === "ar" ? "ت." : "d.";
        const yearSuffix = locale === "ar" ? "هـ" : "AH";
        nodeLabel += `<br/><small>${deathPrefix}${narrator.deathYear}${yearSuffix}</small>`;
      }

      if (narrator.status !== "prophet") {
        nodeLabel += `<br/><small>${statusLabels[locale][narrator.status]}</small>`;
      }

      // Use different shapes based on role
      if (narrator.status === "prophet") {
        lines.push(`  n${index}(["${name}"])`);
      } else if (narrator.status === "collector") {
        lines.push(`  n${index}{{"${nodeLabel}"}}`);
      } else {
        lines.push(`  n${index}["${nodeLabel}"]`);
      }

      lines.push(`  class n${index} ${narrator.status}`);
    });

    lines.push("end");
  });

  // Add edges
  for (let i = 0; i < chain.length - 1; i++) {
    lines.push(`n${i} --> n${i + 1}`);
  }

  return lines.join("\n");
}

// Mermaid Diagram Component
function MermaidDiagram({
  chain,
  hadithId,
  locale,
  onNodeClick,
  selectedNarratorIndex,
}: {
  chain: ExtendedNarrator[];
  hadithId: string;
  locale: "ar" | "en";
  onNodeClick: (index: number) => void;
  selectedNarratorIndex: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramCode = useMemo(() => generateMermaidDiagram(chain, locale), [chain, locale]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !diagramCode) return;

      try {
        const id = `mermaid-${hadithId}-${Date.now()}`;
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

              // Apply highlighting
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
  }, [diagramCode, hadithId, onNodeClick, selectedNarratorIndex]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-amber-400">
          {locale === "ar" ? "الإسناد" : "The Chain"}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {locale === "ar"
            ? `${chain.length} راوٍ - انقر على راوٍ لعرض التفاصيل`
            : `${chain.length} narrators - Click to view details`}
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

// Main Component
export default function HadithIsnadFlow({ locale, t }: HadithIsnadFlowProps) {
  const [sampleHadiths, setSampleHadiths] = useState<CsvHadith[]>([]);
  const [selectedHadith, setSelectedHadith] = useState<CsvHadith | null>(null);
  const [chain, setChain] = useState<ExtendedNarrator[]>([]);
  const [selectedNarratorIndex, setSelectedNarratorIndex] = useState<number | null>(null);
  const [selectedNarrator, setSelectedNarrator] = useState<ExtendedNarrator | null>(null);
  const [loading, setLoading] = useState(true);

  const isRTL = locale === "ar";

  // Load sample hadiths on mount
  useEffect(() => {
    const loadSampleHadiths = async () => {
      setLoading(true);
      try {
        const { hadiths } = await fetchHadiths(1, 100);
        // Get first 5 hadiths with chain data as samples
        const samples = hadiths
          .filter((h) => h.chainIndices.length > 0)
          .slice(0, 5);
        setSampleHadiths(samples);

        if (samples.length > 0) {
          setSelectedHadith(samples[0]);
        }
      } catch (error) {
        console.error("Failed to load hadiths:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSampleHadiths();
  }, []);

  // Resolve chain when hadith changes
  useEffect(() => {
    const resolveHadithChain = async () => {
      if (!selectedHadith) return;

      try {
        const resolvedChain = await fetchResolveChain(selectedHadith.chainIndices);
        setChain(resolvedChain);
        setSelectedNarratorIndex(null);
        setSelectedNarrator(null);
      } catch (error) {
        console.error("Failed to resolve chain:", error);
      }
    };
    resolveHadithChain();
  }, [selectedHadith]);

  const handleNarratorClick = useCallback(
    (index: number) => {
      if (selectedNarratorIndex === index) {
        setSelectedNarratorIndex(null);
        setSelectedNarrator(null);
      } else {
        setSelectedNarratorIndex(index);
        const narrator = chain[index];
        if (narrator) {
          setSelectedNarrator(narrator);
        }
      }
    },
    [chain, selectedNarratorIndex]
  );

  const handleNarratorDetailsClick = async (scholarIndx: number) => {
    const narrator = await fetchNarratorByIndex(scholarIndx);
    if (narrator) {
      setSelectedNarrator(narrator);
      const index = chain.findIndex((n) => n.scholarIndx === scholarIndx);
      setSelectedNarratorIndex(index >= 0 ? index : null);
    }
  };

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

  if (!selectedHadith) {
    return (
      <div className={`min-h-screen bg-[#0f1319] flex items-center justify-center ${isRTL ? "font-['Cairo']" : ""}`}>
        <div className="text-gray-500">{locale === "ar" ? "لا توجد أحاديث" : "No hadiths available"}</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#0f1319] ${isRTL ? "font-['Cairo']" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-xl md:text-2xl font-bold text-amber-400/90">
          {t.hadithPageTitle || (locale === "ar" ? "تحليل سلسلة الرواة" : "Chain of Narrators Analysis")}
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {locale === "ar"
            ? "استكشف سلاسل الرواة التفاعلية"
            : "Explore interactive chains of narration"}
        </p>
      </div>

      {/* Hadith Text Box */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-[#1a1f2e] rounded-xl p-5 border border-amber-700/30">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="bg-amber-600/20 text-amber-400 text-sm px-3 py-1 rounded">
              {selectedHadith.source.trim()} #{selectedHadith.hadithNo}
            </span>
            {selectedHadith.chapter && (
              <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                {getChapterDisplay(selectedHadith.chapter)}
              </span>
            )}
          </div>
          <p className="text-lg md:text-xl text-white leading-relaxed">
            {locale === "ar" ? selectedHadith.textAr : selectedHadith.textEn}
          </p>
        </div>
      </div>

      {/* Legend */}
      <ChainLegend locale={locale} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar */}
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

          {/* Diagram Area */}
          <div className="lg:col-span-9 bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6 order-1 lg:order-2">
            {chain.length > 0 ? (
              <MermaidDiagram
                chain={chain}
                hadithId={selectedHadith.id}
                locale={locale}
                onNodeClick={handleNarratorClick}
                selectedNarratorIndex={selectedNarratorIndex}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                {locale === "ar" ? "لا توجد بيانات سلسلة الرواة" : "No chain data available"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hadith Selector */}
      {sampleHadiths.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 mt-8 pb-8">
          <p className="text-center text-gray-500 text-sm mb-3">
            {locale === "ar" ? "اختر حديثاً آخر:" : "Select another hadith:"}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {sampleHadiths.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHadith(h)}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 border ${
                  selectedHadith.id === h.id
                    ? "bg-[#1a1f2e] text-amber-400 border-amber-700/50"
                    : "text-gray-400 hover:text-white border-gray-700/30 hover:border-gray-600"
                }`}
              >
                {(locale === "ar" ? h.textAr : h.textEn).slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mermaid custom styles */}
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
