import Foundation

/// Represents a topic card on the home page
struct Topic: Identifiable {
    let id: String
    let nameKeyAr: String
    let nameKeyEn: String
    let nameKeyFr: String
    let descriptionKeyAr: String
    let descriptionKeyEn: String
    let descriptionKeyFr: String
    let iconName: String
    let isComingSoon: Bool

    /// Get the localized name
    func name(for locale: AppLocale) -> String {
        switch locale {
        case .arabic:
            return nameKeyAr
        case .english:
            return nameKeyEn
        case .french:
            return nameKeyFr
        }
    }

    /// Get the localized description
    func description(for locale: AppLocale) -> String {
        switch locale {
        case .arabic:
            return descriptionKeyAr
        case .english:
            return descriptionKeyEn
        case .french:
            return descriptionKeyFr
        }
    }

    /// All available topics
    static let all: [Topic] = [
        Topic(
            id: "aqida",
            nameKeyAr: "العقيدة",
            nameKeyEn: "Creed",
            nameKeyFr: "Croyance",
            descriptionKeyAr: "أساسيات الإيمان والتوحيد",
            descriptionKeyEn: "Foundations of faith and monotheism",
            descriptionKeyFr: "Fondements de la foi et du monothéisme",
            iconName: "aqida",
            isComingSoon: true
        ),
        Topic(
            id: "seera",
            nameKeyAr: "السيرة",
            nameKeyEn: "Biography",
            nameKeyFr: "Sîra",
            descriptionKeyAr: "سيرة النبي محمد صلى الله عليه وسلم",
            descriptionKeyEn: "Biography of Prophet Muhammad (PBUH)",
            descriptionKeyFr: "Biographie du Prophète Muhammad (que la paix soit sur lui)",
            iconName: "seera",
            isComingSoon: false
        ),
        Topic(
            id: "hadith",
            nameKeyAr: "الحديث",
            nameKeyEn: "Hadith",
            nameKeyFr: "Hadith",
            descriptionKeyAr: "تحليل سلسلة إسناد الأحاديث",
            descriptionKeyEn: "Analysis of Hadith Chain of Narration",
            descriptionKeyFr: "Analyse de la chaîne de transmission des hadiths",
            iconName: "hadith",
            isComingSoon: false
        ),
        Topic(
            id: "history",
            nameKeyAr: "التاريخ",
            nameKeyEn: "History",
            nameKeyFr: "Histoire",
            descriptionKeyAr: "تاريخ الإسلام والحضارة الإسلامية",
            descriptionKeyEn: "Islamic history and civilization",
            descriptionKeyFr: "Histoire de l'islam et de la civilisation islamique",
            iconName: "tareekh",
            isComingSoon: true
        )
    ]
}
