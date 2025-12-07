import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import mermaid from "mermaid";

import type { Hadith, Narrator } from "../types";
import {
  hadiths,
  narrators,
  statusLabels,
  generationLabels,
} from "../data/hadith";

interface HadithIsnadFlowProps {
  locale: "ar" | "en";
  t: Record<string, string>;
}

// Status colors for node styling
const statusColors: Record<string, string> = {
  prophet: "#9333ea",
  companion: "#14b8a6",
  trustworthy: "#22c55e",
  truthful: "#4ade80",
  unknown: "#f97316",
  weak: "#ef4444",
  collector: "#6b7280",
};

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

// Find the common link (مدار) - narrator where multiple chains converge
function findCommonLink(hadith: Hadith): string | null {
  if (hadith.chains.length <= 1) return null;

  // Count how many chains each narrator appears in
  const narratorCount: Record<string, number> = {};
  hadith.chains.forEach((chain) => {
    chain.narrators.forEach((id) => {
      narratorCount[id] = (narratorCount[id] || 0) + 1;
    });
  });

  // Find narrator that appears in most chains (excluding prophet and collectors)
  let commonLink: string | null = null;
  let maxCount = 1;

  Object.entries(narratorCount).forEach(([id, count]) => {
    const narrator = narrators[id];
    if (narrator &&
        narrator.status !== "prophet" &&
        narrator.status !== "collector" &&
        count > maxCount) {
      maxCount = count;
      commonLink = id;
    }
  });

  return maxCount > 1 ? commonLink : null;
}

// Generate Mermaid diagram from hadith chains with subgraphs for periods
function generateMermaidDiagram(hadith: Hadith, locale: "ar" | "en"): string {
  const lines: string[] = ["flowchart TB"];
  const addedNodes = new Set<string>();
  const addedEdges = new Set<string>();
  const classAssignments: string[] = [];

  // Find common link for this hadith
  const commonLinkId = findCommonLink(hadith);

  // Define styles for each status
  lines.push("classDef prophet fill:#9333ea,stroke:#a855f7,color:#fff,stroke-width:3px");
  lines.push("classDef companion fill:#14b8a6,stroke:#2dd4bf,color:#fff,stroke-width:2px");
  lines.push("classDef trustworthy fill:#22c55e,stroke:#4ade80,color:#fff,stroke-width:2px");
  lines.push("classDef unknown fill:#f97316,stroke:#fb923c,color:#fff,stroke-width:2px");
  lines.push("classDef collector fill:#6b7280,stroke:#9ca3af,color:#fff,stroke-width:2px");
  // Special style for common link (مدار)
  lines.push("classDef commonLink fill:#eab308,stroke:#facc15,color:#000,stroke-width:3px");

  // Group narrators by generation
  const narratorsByGen: Record<string, Set<string>> = {};
  const edges: { from: string; to: string }[] = [];

  hadith.chains.forEach((chain) => {
    const reversed = [...chain.narrators].reverse();

    reversed.forEach((narratorId, index) => {
      const narrator = narrators[narratorId];
      if (!narrator) return;

      // Add to generation group
      if (!narratorsByGen[narrator.generation]) {
        narratorsByGen[narrator.generation] = new Set();
      }
      narratorsByGen[narrator.generation].add(narratorId);

      // Collect edges
      if (index < reversed.length - 1) {
        const nextId = reversed[index + 1];
        const edgeKey = `${narratorId}->${nextId}`;
        if (!addedEdges.has(edgeKey)) {
          edges.push({ from: narratorId, to: nextId });
          addedEdges.add(edgeKey);
        }
      }
    });
  });

  // Create subgraphs for each generation in order
  generationOrder.forEach((gen) => {
    const narratorsInGen = narratorsByGen[gen];
    if (!narratorsInGen || narratorsInGen.size === 0) return;

    const genLabel = generationLabels[locale][gen as keyof typeof generationLabels["ar"]];
    // Use gen_ prefix to avoid conflicts with node IDs
    lines.push(`subgraph gen_${gen}["${genLabel}"]`);

    narratorsInGen.forEach((narratorId) => {
      if (addedNodes.has(narratorId)) return;

      const narrator = narrators[narratorId];
      if (!narrator) return;

      const name = locale === "ar" ? narrator.nameAr : narrator.nameEn;

      // Build node label with death year and status
      let nodeLabel = name;

      // Add death year if available (not for prophet)
      if (narrator.deathYear && narrator.status !== "prophet") {
        const deathPrefix = locale === "ar" ? "ت." : "d.";
        const yearSuffix = locale === "ar" ? "هـ" : "AH";
        nodeLabel += `<br/><small style='opacity:0.7'>${deathPrefix}${narrator.deathYear}${yearSuffix}</small>`;
      }

      // Add status label (not for prophet)
      if (narrator.status !== "prophet") {
        nodeLabel += `<br/><small>${statusLabels[locale][narrator.status]}</small>`;
      }

      // Add common link indicator
      if (narratorId === commonLinkId) {
        const madarLabel = locale === "ar" ? "مدار" : "pivot";
        nodeLabel += `<br/><small><b>${madarLabel}</b></small>`;
      }

      // Use different shapes based on role
      if (narrator.status === "prophet") {
        // Stadium shape for prophet
        lines.push(`  ${narratorId}(["${name}"])`);
      } else if (narrator.status === "collector") {
        // Hexagon for collectors
        lines.push(`  ${narratorId}{{"${nodeLabel}"}}`);
      } else {
        // Rectangle for others
        lines.push(`  ${narratorId}["${nodeLabel}"]`);
      }

      // Collect class assignments for later (outside subgraph)
      if (narratorId === commonLinkId) {
        classAssignments.push(`class ${narratorId} commonLink`);
      } else {
        classAssignments.push(`class ${narratorId} ${narrator.status}`);
      }
      addedNodes.add(narratorId);
    });

    lines.push("end");
  });

  // Add edges after all subgraphs
  edges.forEach(({ from, to }) => {
    lines.push(`${from} --> ${to}`);
  });

  // Add class assignments at the end (outside subgraphs)
  classAssignments.forEach((c) => lines.push(c));

  return lines.join("\n");
}

// Get all narrators in chains that include a specific narrator
function getNarratorsInSameChains(hadith: Hadith, narratorId: string): Set<string> {
  const result = new Set<string>();

  hadith.chains.forEach((chain) => {
    if (chain.narrators.includes(narratorId)) {
      chain.narrators.forEach((id) => result.add(id));
    }
  });

  return result;
}

// Mermaid Diagram Component
function MermaidDiagram({
  hadith,
  locale,
  onNodeClick,
  selectedNarratorId,
}: {
  hadith: Hadith;
  locale: "ar" | "en";
  onNodeClick: (narratorId: string) => void;
  selectedNarratorId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramCode = useMemo(() => generateMermaidDiagram(hadith, locale), [hadith, locale]);

  // Get narrators to highlight (those in same chain as selected)
  const highlightedNarrators = useMemo(() => {
    if (!selectedNarratorId) return new Set<string>();
    return getNarratorsInSameChains(hadith, selectedNarratorId);
  }, [hadith, selectedNarratorId]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        const id = `mermaid-${hadith.id}-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagramCode);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // Add click handlers to nodes and apply highlighting
          const nodes = containerRef.current.querySelectorAll(".node");
          nodes.forEach((node) => {
            const nodeId = node.id;
            const match = nodeId.match(/flowchart-(.+)-\d+$/);
            if (match) {
              const narratorId = match[1];
              node.addEventListener("click", () => onNodeClick(narratorId));
              (node as HTMLElement).style.cursor = "pointer";

              // Apply highlighting
              if (selectedNarratorId) {
                if (highlightedNarrators.has(narratorId)) {
                  (node as HTMLElement).style.opacity = "1";
                  (node as HTMLElement).style.filter = narratorId === selectedNarratorId
                    ? "brightness(1.3) drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))"
                    : "brightness(1.1)";
                } else {
                  (node as HTMLElement).style.opacity = "0.3";
                }
              }
            }
          });

          // Highlight edges in the same chains
          if (selectedNarratorId && containerRef.current) {
            const edges = containerRef.current.querySelectorAll(".edgePath path");
            edges.forEach((edge) => {
              // Dim all edges by default when a narrator is selected
              (edge as HTMLElement).style.opacity = "0.2";
            });

            // Find edges that belong to highlighted chains
            const edgeLabels = containerRef.current.querySelectorAll(".edgeLabel");
            edgeLabels.forEach((label) => {
              (label as HTMLElement).style.opacity = "0.2";
            });
          }
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };

    renderDiagram();
  }, [diagramCode, hadith.id, onNodeClick, selectedNarratorId, highlightedNarrators]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-amber-400">
          {locale === "ar" ? "الإسناد" : "The Chain"}
        </div>
        {selectedNarratorId && (
          <div className="text-xs text-gray-500 mt-1">
            {locale === "ar" ? "انقر مرة أخرى لإلغاء التحديد" : "Click again to deselect"}
          </div>
        )}
      </div>

      {/* Mermaid diagram with subgraphs handles period grouping */}
      <div
        ref={containerRef}
        className="mermaid-container w-full overflow-x-auto"
      />
    </div>
  );
}

// Narrator Details Panel
function NarratorDetailsPanel({
  narrator,
  locale,
  t,
}: {
  narrator: Narrator | null;
  locale: "ar" | "en";
  t: Record<string, string>;
}) {
  if (!narrator) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-700/50">
        <h3 className="text-base font-semibold text-gray-300 mb-3">{t.narratorInfo}</h3>
        <p className="text-gray-500 text-sm">{t.selectNarrator}</p>
      </div>
    );
  }

  const color = statusColors[narrator.status];
  const statusLabel = statusLabels[locale][narrator.status];
  const name = locale === "ar" ? narrator.nameAr : narrator.nameEn;
  const biography = locale === "ar" ? narrator.biographyAr : narrator.biographyEn;

  // Format life dates
  const getLifeDates = () => {
    if (!narrator.birthYear && !narrator.deathYear) return null;
    const yearSuffix = locale === "ar" ? "هـ" : " AH";

    if (narrator.birthYear && narrator.deathYear) {
      return `${narrator.birthYear} - ${narrator.deathYear}${yearSuffix}`;
    } else if (narrator.deathYear) {
      const deathPrefix = locale === "ar" ? "ت." : "d.";
      return `${deathPrefix} ${narrator.deathYear}${yearSuffix}`;
    }
    return null;
  };

  const lifeDates = getLifeDates();

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 border border-amber-700/30">
      <h3 className="text-base font-semibold text-gray-300 mb-4">{t.narratorInfo}</h3>

      <div className="space-y-3">
        <div>
          <h4 className="text-lg font-bold text-white">{name}</h4>
          {lifeDates && (
            <div className="text-gray-500 text-sm mt-1">{lifeDates}</div>
          )}
          <span
            className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {statusLabel}
          </span>
        </div>

        {biography && (
          <div className="text-gray-400 text-sm leading-relaxed">
            {biography}
          </div>
        )}

        {narrator.grade && (
          <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-700/30">
            <p className="text-amber-400 text-sm">
              {locale === "ar" ? "الدرجة" : "Grade"}: {narrator.grade}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Analysis Panel Component
function AnalysisPanel({
  hadith,
  locale,
}: {
  hadith: Hadith;
  locale: "ar" | "en";
}) {
  const analysis = locale === "ar" ? hadith.analysisAr : hadith.analysisEn;

  if (!analysis) return null;

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-4 border border-amber-700/30">
      <h3 className="text-base font-semibold text-amber-400 mb-3">
        {locale === "ar" ? "تحليل الحديث" : "Hadith Analysis"}
      </h3>
      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
        {analysis}
      </div>
    </div>
  );
}

// Legend Component
function ChainLegend({ locale }: { locale: "ar" | "en" }) {
  const labels = statusLabels[locale];
  const items = [
    { status: "prophet", label: labels.prophet, color: statusColors.prophet },
    { status: "companion", label: labels.companion, color: statusColors.companion },
    { status: "trustworthy", label: labels.trustworthy, color: statusColors.trustworthy },
    { status: "unknown", label: labels.unknown, color: statusColors.unknown },
    { status: "collector", label: labels.collector, color: statusColors.collector },
    { status: "commonLink", label: locale === "ar" ? "مدار (نقطة التقاء)" : "Pivot (Common Link)", color: "#eab308" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 mb-4">
      {items.map(({ status, label, color }) => (
        <div key={status} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-gray-400 text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
}

// Main Component
export default function HadithIsnadFlow({ locale, t }: HadithIsnadFlowProps) {
  const [selectedHadith, setSelectedHadith] = useState<Hadith>(hadiths[0]);
  const [selectedNarrator, setSelectedNarrator] = useState<Narrator | null>(null);

  const isRTL = locale === "ar";

  const handleNarratorClick = useCallback((narratorId: string) => {
    const narrator = narrators[narratorId];
    if (narrator) {
      setSelectedNarrator((prev) => (prev?.id === narratorId ? null : narrator));
    }
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#0f1319] ${isRTL ? "font-['Cairo']" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-xl md:text-2xl font-bold text-amber-400/90">
          {t.hadithPageTitle}
        </h1>
      </div>

      {/* Hadith Text Box */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-[#1a1f2e] rounded-xl p-5 border border-amber-700/30">
          <p className="text-lg md:text-xl text-center text-white font-semibold">
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
            <NarratorDetailsPanel narrator={selectedNarrator} locale={locale} t={t} />
            <AnalysisPanel hadith={selectedHadith} locale={locale} />
          </div>

          {/* Diagram Area */}
          <div className="lg:col-span-9 bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6 order-1 lg:order-2">
            <MermaidDiagram
              hadith={selectedHadith}
              locale={locale}
              onNodeClick={handleNarratorClick}
              selectedNarratorId={selectedNarrator?.id || null}
            />
          </div>
        </div>
      </div>

      {/* Hadith Selector */}
      {hadiths.length > 1 && (
        <div className="max-w-4xl mx-auto px-4 mt-8 pb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {hadiths.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setSelectedHadith(h);
                  setSelectedNarrator(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 border ${
                  selectedHadith.id === h.id
                    ? "bg-[#1a1f2e] text-amber-400 border-amber-700/50"
                    : "text-gray-400 hover:text-white border-gray-700/30 hover:border-gray-600"
                }`}
              >
                {locale === "ar" ? h.textAr.slice(0, 25) : h.textEn.slice(0, 25)}...
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
