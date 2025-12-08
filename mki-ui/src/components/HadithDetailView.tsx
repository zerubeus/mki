import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import mermaid from "mermaid";
import {
  getHadithByNumber,
  resolveChain,
  type BookKey,
  type ImportedHadith,
  type EnrichedNarrator,
} from "../data/hadith/books";
import {
  hadiths as curatedHadiths,
  narrators,
  statusLabels,
  generationLabels,
} from "../data/hadith";
import type { Hadith, Narrator } from "../types";

interface HadithDetailViewProps {
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

// Find the common link (مدار)
function findCommonLink(hadith: Hadith): string | null {
  if (hadith.chains.length <= 1) return null;

  const narratorCount: Record<string, number> = {};
  hadith.chains.forEach((chain) => {
    chain.narrators.forEach((id) => {
      narratorCount[id] = (narratorCount[id] || 0) + 1;
    });
  });

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

// Generate Mermaid diagram
function generateMermaidDiagram(hadith: Hadith, locale: "ar" | "en"): string {
  const lines: string[] = ["flowchart TB"];
  const addedNodes = new Set<string>();
  const addedEdges = new Set<string>();
  const classAssignments: string[] = [];

  const commonLinkId = findCommonLink(hadith);

  lines.push("classDef prophet fill:#9333ea,stroke:#a855f7,color:#fff,stroke-width:3px");
  lines.push("classDef companion fill:#14b8a6,stroke:#2dd4bf,color:#fff,stroke-width:2px");
  lines.push("classDef trustworthy fill:#22c55e,stroke:#4ade80,color:#fff,stroke-width:2px");
  lines.push("classDef unknown fill:#f97316,stroke:#fb923c,color:#fff,stroke-width:2px");
  lines.push("classDef collector fill:#6b7280,stroke:#9ca3af,color:#fff,stroke-width:2px");
  lines.push("classDef commonLink fill:#eab308,stroke:#facc15,color:#000,stroke-width:3px");

  const narratorsByGen: Record<string, Set<string>> = {};
  const edges: { from: string; to: string }[] = [];

  hadith.chains.forEach((chain) => {
    const reversed = [...chain.narrators].reverse();

    reversed.forEach((narratorId, index) => {
      const narrator = narrators[narratorId];
      if (!narrator) return;

      if (!narratorsByGen[narrator.generation]) {
        narratorsByGen[narrator.generation] = new Set();
      }
      narratorsByGen[narrator.generation].add(narratorId);

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

  generationOrder.forEach((gen) => {
    const narratorsInGen = narratorsByGen[gen];
    if (!narratorsInGen || narratorsInGen.size === 0) return;

    const genLabel = generationLabels[locale][gen as keyof typeof generationLabels["ar"]];
    lines.push(`subgraph gen_${gen}["${genLabel}"]`);

    narratorsInGen.forEach((narratorId) => {
      if (addedNodes.has(narratorId)) return;

      const narrator = narrators[narratorId];
      if (!narrator) return;

      const name = locale === "ar" ? narrator.nameAr : narrator.nameEn;
      let nodeLabel = name;

      if (narrator.deathYear && narrator.status !== "prophet") {
        const deathPrefix = locale === "ar" ? "ت." : "d.";
        const yearSuffix = locale === "ar" ? "هـ" : "AH";
        nodeLabel += `<br/><small style='opacity:0.7'>${deathPrefix}${narrator.deathYear}${yearSuffix}</small>`;
      }

      if (narrator.status !== "prophet") {
        nodeLabel += `<br/><small>${statusLabels[locale][narrator.status]}</small>`;
      }

      if (narratorId === commonLinkId) {
        const madarLabel = locale === "ar" ? "مدار" : "pivot";
        nodeLabel += `<br/><small><b>${madarLabel}</b></small>`;
      }

      if (narrator.status === "prophet") {
        lines.push(`  ${narratorId}(["${name}"])`);
      } else if (narrator.status === "collector") {
        lines.push(`  ${narratorId}{{"${nodeLabel}"}}`);
      } else {
        lines.push(`  ${narratorId}["${nodeLabel}"]`);
      }

      if (narratorId === commonLinkId) {
        classAssignments.push(`class ${narratorId} commonLink`);
      } else {
        classAssignments.push(`class ${narratorId} ${narrator.status}`);
      }
      addedNodes.add(narratorId);
    });

    lines.push("end");
  });

  edges.forEach(({ from, to }) => {
    lines.push(`${from} --> ${to}`);
  });

  classAssignments.forEach((c) => lines.push(c));

  return lines.join("\n");
}

// Get narrators in same chains
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

          const nodes = containerRef.current.querySelectorAll(".node");
          nodes.forEach((node) => {
            const nodeId = node.id;
            const match = nodeId.match(/flowchart-(.+)-\d+$/);
            if (match) {
              const narratorId = match[1];
              node.addEventListener("click", () => onNodeClick(narratorId));
              (node as HTMLElement).style.cursor = "pointer";

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

          if (selectedNarratorId && containerRef.current) {
            const edges = containerRef.current.querySelectorAll(".edgePath path");
            edges.forEach((edge) => {
              (edge as HTMLElement).style.opacity = "0.2";
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
          {locale === "ar" ? "الإسناد" : "Chain of Narration"}
        </div>
        {selectedNarratorId && (
          <div className="text-xs text-gray-500 mt-1">
            {locale === "ar" ? "انقر مرة أخرى لإلغاء التحديد" : "Click again to deselect"}
          </div>
        )}
      </div>
      <div ref={containerRef} className="mermaid-container w-full overflow-x-auto" />
    </div>
  );
}

// Narrator Details Panel
function NarratorDetailsPanel({
  narrator,
  locale,
}: {
  narrator: Narrator | null;
  locale: "ar" | "en";
}) {
  if (!narrator) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-700/50">
        <h3 className="text-base font-semibold text-gray-300 mb-3">
          {locale === "ar" ? "معلومات الراوي" : "Narrator Info"}
        </h3>
        <p className="text-gray-500 text-sm">
          {locale === "ar" ? "اختر راوياً من السلسلة" : "Select a narrator from the chain"}
        </p>
      </div>
    );
  }

  const color = statusColors[narrator.status];
  const statusLabel = statusLabels[locale][narrator.status];
  const name = locale === "ar" ? narrator.nameAr : narrator.nameEn;
  const biography = locale === "ar" ? narrator.biographyAr : narrator.biographyEn;

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
      <h3 className="text-base font-semibold text-gray-300 mb-4">
        {locale === "ar" ? "معلومات الراوي" : "Narrator Info"}
      </h3>

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
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-gray-400 text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
}

// Generate Mermaid diagram from enriched narrator array
function generateSanadMermaidDiagram(sanad: EnrichedNarrator[], locale: "ar" | "en" = "ar"): string {
  if (sanad.length === 0) return "";

  const lines: string[] = ["flowchart TB"];

  // Style definitions - using actual narrator status
  lines.push("classDef prophet fill:#9333ea,stroke:#a855f7,color:#fff,stroke-width:3px");
  lines.push("classDef companion fill:#14b8a6,stroke:#2dd4bf,color:#fff,stroke-width:2px");
  lines.push("classDef trustworthy fill:#22c55e,stroke:#4ade80,color:#fff,stroke-width:2px");
  lines.push("classDef truthful fill:#4ade80,stroke:#86efac,color:#fff,stroke-width:2px");
  lines.push("classDef unknown fill:#f97316,stroke:#fb923c,color:#fff,stroke-width:2px");
  lines.push("classDef weak fill:#ef4444,stroke:#f87171,color:#fff,stroke-width:2px");
  lines.push("classDef collector fill:#d97706,stroke:#f59e0b,color:#fff,stroke-width:2px");

  // Add nodes with biographical info
  sanad.forEach((narrator, index) => {
    // Clean the label for Mermaid
    const name = narrator.nameAr
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

    lines.push(`  n${index}["${label}"]`);

    // Use actual status from biographical data
    const status = narrator.status || "unknown";
    lines.push(`  class n${index} ${status}`);
  });

  // Add edges (chain flows from collector down to source)
  for (let i = 0; i < sanad.length - 1; i++) {
    lines.push(`  n${i} --> n${i + 1}`);
  }

  return lines.join("\n");
}

// Imported Sanad Diagram Component (for imported hadiths with structured sanad data)
function ImportedSanadDiagram({
  sanad,
  sanadLength,
  locale,
}: {
  sanad: EnrichedNarrator[];
  sanadLength?: number;
  locale: "ar" | "en";
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
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      }
    };

    renderDiagram();
  }, [diagramCode]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-amber-400">
          {locale === "ar" ? "سلسلة الرواة (الإسناد)" : "Chain of Narrators (Isnad)"}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {locale === "ar"
            ? `${sanadLength || sanad.length} راوٍ في السلسلة`
            : `${sanadLength || sanad.length} narrators in the chain`}
        </div>
      </div>

      {/* Simple Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#d97706" }} />
          <span className="text-gray-400 text-xs">{locale === "ar" ? "المحدث/الراوي الأول" : "Collector"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6b7280" }} />
          <span className="text-gray-400 text-xs">{locale === "ar" ? "الراوي" : "Narrator"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#14b8a6" }} />
          <span className="text-gray-400 text-xs">{locale === "ar" ? "الصحابي" : "Companion"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#9333ea" }} />
          <span className="text-gray-400 text-xs">{locale === "ar" ? "النبي ﷺ" : "Prophet ﷺ"}</span>
        </div>
      </div>

      <div ref={containerRef} className="mermaid-container w-full overflow-x-auto" />
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
  const [importedHadith, setImportedHadith] = useState<ImportedHadith | null>(null);
  const [curatedHadith, setCuratedHadith] = useState<Hadith | null>(null);
  const [resolvedSanad, setResolvedSanad] = useState<EnrichedNarrator[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNarrator, setSelectedNarrator] = useState<Narrator | null>(null);

  const isRTL = locale === "ar";

  // Load hadith data - read URL params on client side
  useEffect(() => {
    const loadHadith = async () => {
      setLoading(true);
      setError(null);

      // Read URL params from browser
      const params = new URLSearchParams(window.location.search);
      const book = params.get("book");
      const numberStr = params.get("number");
      const curatedId = params.get("id");
      const number = numberStr ? parseInt(numberStr, 10) : null;

      try {
        // Check if it's a curated hadith by ID
        if (curatedId) {
          const found = curatedHadiths.find((h) => h.id === curatedId);
          if (found) {
            setCuratedHadith(found);
            setImportedHadith(null);
          } else {
            setError(locale === "ar" ? "الحديث غير موجود" : "Hadith not found");
          }
        }
        // Load from imported books
        else if (book && number) {
          const hadith = await getHadithByNumber(book as BookKey, number);
          if (hadith) {
            setImportedHadith(hadith);
            // Check if there's a matching curated hadith
            const matchingCurated = curatedHadiths.find(
              (h) => h.chains.some((c) =>
                c.source.toLowerCase().includes(book.toLowerCase()) &&
                c.referenceNumber === String(number)
              )
            );
            setCuratedHadith(matchingCurated || null);
          } else {
            setError(locale === "ar" ? "الحديث غير موجود" : "Hadith not found");
          }
        } else {
          setError(locale === "ar" ? "معرف الحديث مفقود" : "Missing hadith identifier");
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

  // Resolve chain ID to narrator names
  useEffect(() => {
    const loadChain = async () => {
      if (importedHadith?.chainId) {
        const sanad = await resolveChain(importedHadith.chainId);
        setResolvedSanad(sanad);
      } else {
        setResolvedSanad(null);
      }
    };
    loadChain();
  }, [importedHadith?.chainId]);

  const handleNarratorClick = useCallback((narratorId: string) => {
    const narrator = narrators[narratorId];
    if (narrator) {
      setSelectedNarrator((prev) => (prev?.id === narratorId ? null : narrator));
    }
  }, []);

  // Get display text
  const displayText = curatedHadith
    ? (locale === "ar" ? curatedHadith.textAr : curatedHadith.textEn)
    : importedHadith
    ? (locale === "ar" ? importedHadith.textAr : importedHadith.textEn)
    : "";

  const displaySource = importedHadith
    ? (locale === "ar" ? importedHadith.sourceAr : importedHadith.source)
    : curatedHadith?.chains[0]
    ? (locale === "ar" ? curatedHadith.chains[0].sourceAr : curatedHadith.chains[0].source)
    : "";

  const hadithNumber = importedHadith?.hadithNumber || curatedHadith?.chains[0]?.referenceNumber;

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f1319] flex items-center justify-center ${isRTL ? "font-['Cairo']" : ""}`}>
        <div className="text-amber-400">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</div>
      </div>
    );
  }

  if (error) {
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
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-amber-600/20 text-amber-400 text-sm px-3 py-1 rounded">
              {displaySource} #{hadithNumber}
            </span>
          </div>
          <p className="text-lg md:text-xl text-white leading-relaxed">
            {displayText}
          </p>
        </div>
      </div>

      {/* Chain Visualization */}
      {curatedHadith && curatedHadith.chains.length > 0 ? (
        /* Curated hadith with full chain data */
        <>
          <ChainLegend locale={locale} />

          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Sidebar */}
              <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                <NarratorDetailsPanel narrator={selectedNarrator} locale={locale} />

                {/* Analysis */}
                {(curatedHadith.analysisAr || curatedHadith.analysisEn) && (
                  <div className="bg-[#1a1f2e] rounded-lg p-4 border border-amber-700/30">
                    <h3 className="text-base font-semibold text-amber-400 mb-3">
                      {locale === "ar" ? "تحليل الحديث" : "Hadith Analysis"}
                    </h3>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {locale === "ar" ? curatedHadith.analysisAr : curatedHadith.analysisEn}
                    </div>
                  </div>
                )}
              </div>

              {/* Diagram */}
              <div className="lg:col-span-9 bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6 order-1 lg:order-2">
                <MermaidDiagram
                  hadith={curatedHadith}
                  locale={locale}
                  onNodeClick={handleNarratorClick}
                  selectedNarratorId={selectedNarrator?.id || null}
                />
              </div>
            </div>
          </div>
        </>
      ) : resolvedSanad && resolvedSanad.length > 0 ? (
        /* Imported hadith with resolved sanad chain */
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6">
            <ImportedSanadDiagram
              sanad={resolvedSanad}
              sanadLength={resolvedSanad.length}
              locale={locale}
            />
          </div>
        </div>
      ) : importedHadith ? (
        /* Imported hadith without sanad data */
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[#1a1f2e]/50 rounded-xl border border-gray-700/30 p-6">
            <SanadNotAvailable locale={locale} />
          </div>
        </div>
      ) : null}

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
