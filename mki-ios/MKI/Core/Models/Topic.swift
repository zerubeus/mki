import Foundation

/// Represents a topic card on the home page
struct Topic: Identifiable {
    let id: String
    let nameKeyAr: String
    let nameKeyEn: String
    let descriptionKeyAr: String
    let descriptionKeyEn: String
    let iconName: String
    let isComingSoon: Bool

    /// Get the localized name
    func name(for locale: AppLocale) -> String {
        locale == .arabic ? nameKeyAr : nameKeyEn
    }

    /// Get the localized description
    func description(for locale: AppLocale) -> String {
        locale == .arabic ? descriptionKeyAr : descriptionKeyEn
    }

    /// All available topics
    static let all: [Topic] = [
        Topic(
            id: "aqida",
            nameKeyAr: "العقيدة",
            nameKeyEn: "Creed",
            descriptionKeyAr: "أساسيات الإيمان والتوحيد",
            descriptionKeyEn: "Foundations of faith and monotheism",
            iconName: "aqida",
            isComingSoon: true
        ),
        Topic(
            id: "seera",
            nameKeyAr: "السيرة",
            nameKeyEn: "Biography",
            descriptionKeyAr: "سيرة النبي محمد صلى الله عليه وسلم",
            descriptionKeyEn: "Biography of Prophet Muhammad (PBUH)",
            iconName: "seera",
            isComingSoon: false
        ),
        Topic(
            id: "hadith",
            nameKeyAr: "الحديث",
            nameKeyEn: "Hadith",
            descriptionKeyAr: "تحليل سلسلة إسناد الأحاديث",
            descriptionKeyEn: "Analysis of Hadith Chain of Narration",
            iconName: "hadith",
            isComingSoon: false
        ),
        Topic(
            id: "history",
            nameKeyAr: "التاريخ",
            nameKeyEn: "History",
            descriptionKeyAr: "تاريخ الإسلام والحضارة الإسلامية",
            descriptionKeyEn: "Islamic history and civilization",
            iconName: "tareekh",
            isComingSoon: true
        )
    ]
}
