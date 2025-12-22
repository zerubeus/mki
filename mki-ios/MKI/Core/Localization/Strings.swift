import Foundation

/// Type-safe localized strings
enum Strings {
    private static func localized(_ locale: AppLocale, arabic: String, english: String, french: String) -> String {
        switch locale {
        case .arabic:
            return arabic
        case .english:
            return english
        case .french:
            return french
        }
    }

    // MARK: - App
    enum App {
        static func title(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "اعرف دينك",
                english: "Know Your Religion",
                french: "Connais ta religion"
            )
        }

        static func subtitle(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "معرفة إسلامية شاملة",
                english: "Comprehensive Islamic Knowledge",
                french: "Connaissance islamique complète"
            )
        }
    }

    // MARK: - Topics
    enum Topics {
        static func aqida(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "العقيدة",
                english: "Creed",
                french: "Croyance"
            )
        }

        static func aqidaDesc(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "أساسيات الإيمان والتوحيد",
                english: "Foundations of faith and monotheism",
                french: "Fondements de la foi et du monothéisme"
            )
        }

        static func seera(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "السيرة",
                english: "Biography",
                french: "Sîra"
            )
        }

        static func seeraDesc(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "سيرة النبي محمد صلى الله عليه وسلم",
                english: "Biography of Prophet Muhammad (PBUH)",
                french: "Biographie du Prophète Muhammad (que la paix soit sur lui)"
            )
        }

        static func hadith(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "الحديث",
                english: "Hadith",
                french: "Hadith"
            )
        }

        static func hadithDesc(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "تحليل سلسلة إسناد الأحاديث",
                english: "Analysis of Hadith Chain of Narration",
                french: "Analyse de la chaîne de transmission des hadiths"
            )
        }

        static func history(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "التاريخ",
                english: "History",
                french: "Histoire"
            )
        }

        static func historyDesc(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "تاريخ الإسلام والحضارة الإسلامية",
                english: "Islamic history and civilization",
                french: "Histoire de l'islam et de la civilisation islamique"
            )
        }
    }

    // MARK: - Welcome
    enum Welcome {
        static func title(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "مرحباً بك في موقع المعرفة الإسلامية",
                english: "Welcome to the Islamic Knowledge Website",
                french: "Bienvenue sur le site de la connaissance islamique"
            )
        }

        static func description(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من الكتاب والسنة.",
                english: "This website aims to provide authentic and documented Islamic knowledge from the Quran and Sunnah.",
                french: "Ce site vise à offrir une connaissance islamique authentique et documentée tirée du Coran et de la Sunna."
            )
        }

        static func feature1(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "محتوى معتمد من الكتاب والسنة",
                english: "Content based on Quran and Sunnah",
                french: "Contenu basé sur le Coran et la Sunna"
            )
        }

        static func feature2(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "شرح مبسط ومفهوم للجميع",
                english: "Simple explanations for everyone",
                french: "Explications simples et accessibles à tous"
            )
        }

        static func feature3(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "متاح بعدة لغات",
                english: "Available in multiple languages",
                french: "Disponible en plusieurs langues"
            )
        }
    }

    // MARK: - Seerah
    enum Seerah {
        static func title(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "مسار النبي ﷺ",
                english: "The Prophet's Path ﷺ",
                french: "Le chemin du Prophète ﷺ"
            )
        }

        static func subtitle(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "رحلة تفاعلية عبر السيرة",
                english: "An Interactive Journey Through Seerah",
                french: "Un voyage interactif à travers la sîra"
            )
        }

        static func timelineTitle(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "الخط الزمني للأحداث",
                english: "Timeline of Events",
                french: "Chronologie des événements"
            )
        }

        static func details(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "التفاصيل",
                english: "Details",
                french: "Détails"
            )
        }

        static func date(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "التاريخ",
                english: "Date",
                french: "Date"
            )
        }

        static func location(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "الموقع",
                english: "Location",
                french: "Lieu"
            )
        }

        static func type(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "النوع",
                english: "Type",
                french: "Type"
            )
        }
    }

    // MARK: - Eras
    enum Eras {
        static func preProphethood(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "ما قبل النبوة",
                english: "Pre-Prophethood",
                french: "Avant la prophétie"
            )
        }

        static func meccan(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "العهد المكي",
                english: "Meccan Period",
                french: "Période mecquoise"
            )
        }

        static func medinan(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "العهد المدني",
                english: "Medinan Period",
                french: "Période médinoise"
            )
        }
    }

    // MARK: - Common
    enum Common {
        static func backToHome(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "العودة للرئيسية",
                english: "Back to Home",
                french: "Retour à l'accueil"
            )
        }

        static func home(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "الرئيسية",
                english: "Home",
                french: "Accueil"
            )
        }

        static func loading(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "جاري التحميل...",
                english: "Loading...",
                french: "Chargement..."
            )
        }

        static func retry(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "إعادة المحاولة",
                english: "Retry",
                french: "Réessayer"
            )
        }

        static func comingSoon(_ locale: AppLocale) -> String {
            Strings.localized(
                locale,
                arabic: "قريباً",
                english: "Coming Soon",
                french: "Bientôt"
            )
        }
    }
}
