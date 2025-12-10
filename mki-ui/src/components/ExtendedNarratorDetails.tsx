import { useState, useEffect } from 'react';
import type { ExtendedNarrator } from '../types';
import { getNarratorTeachers, getNarratorStudents } from '../data/hadith/csvService';
import { statusLabels, statusHexColors } from '../data/hadith/constants';

interface ExtendedNarratorDetailsProps {
  narrator: ExtendedNarrator;
  locale: 'ar' | 'en';
  onNarratorClick?: (index: number) => void;
}

export default function ExtendedNarratorDetails({
  narrator,
  locale,
  onNarratorClick,
}: ExtendedNarratorDetailsProps) {
  const [teachers, setTeachers] = useState<ExtendedNarrator[]>([]);
  const [students, setStudents] = useState<ExtendedNarrator[]>([]);
  const [activeTab, setActiveTab] = useState<'bio' | 'teachers' | 'students' | 'family'>('bio');
  const [loading, setLoading] = useState(true);

  const isRTL = locale === 'ar';

  useEffect(() => {
    const loadRelationships = async () => {
      setLoading(true);
      try {
        const [t, s] = await Promise.all([getNarratorTeachers(narrator), getNarratorStudents(narrator)]);
        setTeachers(t);
        setStudents(s);
      } catch (error) {
        console.error('Failed to load narrator relationships:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRelationships();
  }, [narrator.scholarIndx]);

  const name = locale === 'ar' ? narrator.nameAr : narrator.nameEn;
  const altName = locale === 'ar' ? narrator.nameEn : narrator.nameAr;
  const color = statusHexColors[narrator.status] || '#6b7280';
  const statusLabel = statusLabels[locale][narrator.status];

  const formatDates = () => {
    const yearSuffix = locale === 'ar' ? ' هـ' : ' AH';
    if (narrator.birthYear && narrator.deathYear) {
      return `${narrator.birthYear} - ${narrator.deathYear}${yearSuffix}`;
    } else if (narrator.deathYear) {
      return `${locale === 'ar' ? 'ت.' : 'd.'} ${narrator.deathYear}${yearSuffix}`;
    } else if (narrator.birthYear) {
      return `${locale === 'ar' ? 'و.' : 'b.'} ${narrator.birthYear}${yearSuffix}`;
    }
    return null;
  };

  const tabs = [
    { id: 'bio' as const, label: locale === 'ar' ? 'السيرة' : 'Bio' },
    { id: 'teachers' as const, label: locale === 'ar' ? 'الشيوخ' : 'Teachers', count: teachers.length },
    { id: 'students' as const, label: locale === 'ar' ? 'التلاميذ' : 'Students', count: students.length },
    { id: 'family' as const, label: locale === 'ar' ? 'العائلة' : 'Family' },
  ];

  const renderNarratorCard = (person: ExtendedNarrator) => {
    const personName = locale === 'ar' ? person.nameAr : person.nameEn;
    const personColor = statusHexColors[person.status] || '#6b7280';

    return (
      <button
        key={person.scholarIndx}
        onClick={() => onNarratorClick?.(person.scholarIndx)}
        className="w-full text-start p-3 rounded-lg bg-[#0f1319] hover:bg-[#1a1f2e] border border-gray-800 hover:border-amber-600/30 transition-all group"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-1 self-stretch rounded-full flex-shrink-0"
            style={{ backgroundColor: personColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-relaxed break-words">
              {personName}
            </p>
            {person.grade && (
              <p className="text-gray-500 text-xs mt-1 break-words">{person.grade}</p>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-600 group-hover:text-amber-400 flex-shrink-0 mt-1 transition-colors ${isRTL ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    );
  };

  const renderNarratorList = (list: ExtendedNarrator[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent"></div>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {list.map(renderNarratorCard)}
      </div>
    );
  };

  const parseTags = (tagsStr?: string): string[] => {
    if (!tagsStr) return [];
    return tagsStr
      .split(',')
      .map((tag) => {
        const match = tag.match(/^([^[]+)/);
        return match ? match[1].trim() : tag.trim();
      })
      .filter(Boolean);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="py-2 border-b border-gray-800/50 last:border-0">
      <span className="text-gray-500 text-xs block mb-1">{label}</span>
      <p className="text-gray-300 text-sm break-words">{value}</p>
    </div>
  );

  return (
    <div className="bg-[#1a1f2e] rounded-xl border border-gray-700/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        {/* Name */}
        <h4
          className="text-lg font-bold text-white leading-relaxed"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {name}
        </h4>
        {altName && (
          <p
            className="text-gray-400 text-sm mt-0.5"
            dir={isRTL ? 'ltr' : 'rtl'}
          >
            {altName}
          </p>
        )}

        {/* Dates */}
        {formatDates() && (
          <p className="text-gray-400 text-sm mt-2">{formatDates()}</p>
        )}

        {/* Status badge */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {statusLabel}
          </span>
          {narrator.deathReason && narrator.deathReason !== 'Natural' && (
            <span className="inline-block px-2 py-1 rounded-full bg-red-900/30 text-red-400 text-xs border border-red-800/50">
              {narrator.deathReason}
            </span>
          )}
        </div>

        {/* Grade */}
        {narrator.grade && (
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">{narrator.grade}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-amber-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs ${activeTab === tab.id ? 'text-amber-400/70' : 'text-gray-600'}`}>
                ({tab.count})
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {activeTab === 'bio' && (
          <div>
            {narrator.areaOfInterest && (
              <InfoRow
                label={locale === 'ar' ? 'مجالات الاهتمام' : 'Areas of Interest'}
                value={narrator.areaOfInterest}
              />
            )}

            {narrator.tags && (
              <div className="py-2 border-b border-gray-800/50">
                <span className="text-gray-500 text-xs block mb-2">
                  {locale === 'ar' ? 'الوسوم' : 'Tags'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parseTags(narrator.tags).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-800/80 rounded-md text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {narrator.placesOfStay && (
              <InfoRow
                label={locale === 'ar' ? 'أماكن الإقامة' : 'Places of Stay'}
                value={narrator.placesOfStay}
              />
            )}

            {narrator.birthPlace && (
              <InfoRow
                label={locale === 'ar' ? 'مكان الولادة' : 'Birth Place'}
                value={narrator.birthPlace}
              />
            )}

            {narrator.deathPlace && (
              <InfoRow
                label={locale === 'ar' ? 'مكان الوفاة' : 'Death Place'}
                value={narrator.deathPlace}
              />
            )}

            {narrator.books && narrator.books !== 'NA' && (
              <InfoRow
                label={locale === 'ar' ? 'الكتب' : 'Books'}
                value={narrator.books}
              />
            )}

            {!narrator.areaOfInterest &&
              !narrator.tags &&
              !narrator.placesOfStay &&
              !narrator.birthPlace &&
              !narrator.deathPlace &&
              (!narrator.books || narrator.books === 'NA') && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">
                    {locale === 'ar'
                      ? 'لا توجد معلومات سيرة إضافية'
                      : 'No additional biography information'}
                  </p>
                </div>
              )}
          </div>
        )}

        {activeTab === 'teachers' &&
          renderNarratorList(
            teachers,
            locale === 'ar' ? 'لا يوجد شيوخ مسجلين' : 'No teachers recorded'
          )}

        {activeTab === 'students' &&
          renderNarratorList(
            students,
            locale === 'ar' ? 'لا يوجد تلاميذ مسجلين' : 'No students recorded'
          )}

        {activeTab === 'family' && (
          <div>
            {narrator.parents && (
              <InfoRow
                label={locale === 'ar' ? 'الوالدان' : 'Parents'}
                value={narrator.parents}
              />
            )}

            {narrator.spouse && (
              <InfoRow
                label={locale === 'ar' ? 'الزوج/الزوجة' : 'Spouse(s)'}
                value={narrator.spouse}
              />
            )}

            {narrator.siblings && narrator.siblings !== 'NA' && (
              <InfoRow
                label={locale === 'ar' ? 'الأخوة' : 'Siblings'}
                value={narrator.siblings}
              />
            )}

            {narrator.children && (
              <InfoRow
                label={locale === 'ar' ? 'الأبناء' : 'Children'}
                value={narrator.children}
              />
            )}

            {!narrator.parents &&
              !narrator.spouse &&
              (!narrator.siblings || narrator.siblings === 'NA') &&
              !narrator.children && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">
                    {locale === 'ar'
                      ? 'لا توجد معلومات عائلية متاحة'
                      : 'No family information available'}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
