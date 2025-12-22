import React from "react";
import type { EventEra, EventType } from "../types";

interface FilterBarProps {
  activeEras: EventEra[];
  activeTypes: EventType[];
  onEraToggle: (era: EventEra) => void;
  onTypeToggle: (type: EventType) => void;
  onClearAll: () => void;
  locale?: "ar" | "en";
}

// Era configuration with colored dots
const ERA_CONFIG: { era: EventEra; colorClass: string; labelEn: string; labelAr: string }[] = [
  { era: "Pre-Prophethood", colorClass: "bg-sky-500", labelEn: "Pre-Prophet", labelAr: "قبل النبوة" },
  { era: "Meccan", colorClass: "bg-amber-500", labelEn: "Meccan", labelAr: "المكية" },
  { era: "Medinan", colorClass: "bg-emerald-500", labelEn: "Medinan", labelAr: "المدنية" },
];

// Type configuration with short labels
const TYPE_CONFIG: { type: EventType; labelEn: string; labelAr: string }[] = [
  { type: "Birth", labelEn: "Birth", labelAr: "ولادة" },
  { type: "Marriage", labelEn: "Marriage", labelAr: "زواج" },
  { type: "Battle", labelEn: "Battle", labelAr: "غزوة" },
  { type: "Treaty", labelEn: "Treaty", labelAr: "معاهدة" },
  { type: "Religious", labelEn: "Religious", labelAr: "دينية" },
  { type: "Personal", labelEn: "Personal", labelAr: "شخصية" },
  { type: "Migration", labelEn: "Migration", labelAr: "هجرة" },
  { type: "Death", labelEn: "Death", labelAr: "وفاة" },
];

const FilterBar: React.FC<FilterBarProps> = ({
  activeEras,
  activeTypes,
  onEraToggle,
  onTypeToggle,
  onClearAll,
  locale = "en",
}) => {
  const hasActiveFilters = activeEras.length > 0 || activeTypes.length > 0;

  return (
    <div className="bg-[#1a1f2e] border-b border-gray-700/50 px-4 py-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* Era Filters */}
        <div className="flex items-center gap-2">
          {ERA_CONFIG.map(({ era, colorClass, labelEn, labelAr }) => {
            const isActive = activeEras.includes(era);
            return (
              <button
                key={era}
                onClick={() => onEraToggle(era)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150
                  ${isActive
                    ? `${colorClass} text-white`
                    : "bg-[#0f1319] text-gray-400 hover:text-gray-200 hover:bg-[#252a3a] border border-gray-700/50"
                  }
                `}
              >
                <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                {locale === "ar" ? labelAr : labelEn}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-700/50" />

        {/* Type Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {TYPE_CONFIG.map(({ type, labelEn, labelAr }) => {
            const isActive = activeTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => onTypeToggle(type)}
                className={`
                  px-2.5 py-1 rounded text-xs font-medium transition-all duration-150
                  ${isActive
                    ? "bg-amber-600 text-white"
                    : "bg-[#0f1319] text-gray-400 hover:text-gray-200 hover:bg-[#252a3a] border border-gray-700/50"
                  }
                `}
              >
                {locale === "ar" ? labelAr : labelEn}
              </button>
            );
          })}
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <>
            <div className="h-5 w-px bg-gray-700/50" />
            <button
              onClick={onClearAll}
              className="px-2.5 py-1 rounded text-xs font-medium bg-[#0f1319] text-red-400 hover:text-red-300 hover:bg-red-900/30 border border-gray-700/50 transition-all duration-150"
            >
              {locale === "ar" ? "مسح" : "Clear"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
