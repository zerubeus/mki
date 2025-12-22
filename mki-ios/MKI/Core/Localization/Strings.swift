import Foundation

/// Type-safe localized strings
enum Strings {
    // MARK: - App
    enum App {
        static func title(_ locale: AppLocale) -> String {
            locale == .arabic ? "اعرف دينك" : "Know Your Religion"
        }

        static func subtitle(_ locale: AppLocale) -> String {
            locale == .arabic ? "معرفة إسلامية شاملة" : "Comprehensive Islamic Knowledge"
        }
    }

    // MARK: - Topics
    enum Topics {
        static func aqida(_ locale: AppLocale) -> String {
            locale == .arabic ? "العقيدة" : "Creed"
        }

        static func aqidaDesc(_ locale: AppLocale) -> String {
            locale == .arabic ? "أساسيات الإيمان والتوحيد" : "Foundations of faith and monotheism"
        }

        static func seera(_ locale: AppLocale) -> String {
            locale == .arabic ? "السيرة" : "Biography"
        }

        static func seeraDesc(_ locale: AppLocale) -> String {
            locale == .arabic ? "سيرة النبي محمد صلى الله عليه وسلم" : "Biography of Prophet Muhammad (PBUH)"
        }

        static func hadith(_ locale: AppLocale) -> String {
            locale == .arabic ? "الحديث" : "Hadith"
        }

        static func hadithDesc(_ locale: AppLocale) -> String {
            locale == .arabic ? "تحليل سلسلة إسناد الأحاديث" : "Analysis of Hadith Chain of Narration"
        }

        static func history(_ locale: AppLocale) -> String {
            locale == .arabic ? "التاريخ" : "History"
        }

        static func historyDesc(_ locale: AppLocale) -> String {
            locale == .arabic ? "تاريخ الإسلام والحضارة الإسلامية" : "Islamic history and civilization"
        }
    }

    // MARK: - Welcome
    enum Welcome {
        static func title(_ locale: AppLocale) -> String {
            locale == .arabic
                ? "مرحباً بك في موقع المعرفة الإسلامية"
                : "Welcome to the Islamic Knowledge Website"
        }

        static func description(_ locale: AppLocale) -> String {
            locale == .arabic
                ? "هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من الكتاب والسنة."
                : "This website aims to provide authentic and documented Islamic knowledge from the Quran and Sunnah."
        }

        static func feature1(_ locale: AppLocale) -> String {
            locale == .arabic ? "محتوى معتمد من الكتاب والسنة" : "Content based on Quran and Sunnah"
        }

        static func feature2(_ locale: AppLocale) -> String {
            locale == .arabic ? "شرح مبسط ومفهوم للجميع" : "Simple explanations for everyone"
        }

        static func feature3(_ locale: AppLocale) -> String {
            locale == .arabic ? "متاح بعدة لغات" : "Available in multiple languages"
        }
    }

    // MARK: - Seerah
    enum Seerah {
        static func title(_ locale: AppLocale) -> String {
            locale == .arabic ? "مسار النبي ﷺ" : "The Prophet's Path ﷺ"
        }

        static func subtitle(_ locale: AppLocale) -> String {
            locale == .arabic ? "رحلة تفاعلية عبر السيرة" : "An Interactive Journey Through Seerah"
        }

        static func timelineTitle(_ locale: AppLocale) -> String {
            locale == .arabic ? "الخط الزمني للأحداث" : "Timeline of Events"
        }

        static func details(_ locale: AppLocale) -> String {
            locale == .arabic ? "التفاصيل" : "Details"
        }

        static func date(_ locale: AppLocale) -> String {
            locale == .arabic ? "التاريخ" : "Date"
        }

        static func location(_ locale: AppLocale) -> String {
            locale == .arabic ? "الموقع" : "Location"
        }

        static func type(_ locale: AppLocale) -> String {
            locale == .arabic ? "النوع" : "Type"
        }
    }

    // MARK: - Eras
    enum Eras {
        static func preProphethood(_ locale: AppLocale) -> String {
            locale == .arabic ? "ما قبل النبوة" : "Pre-Prophethood"
        }

        static func meccan(_ locale: AppLocale) -> String {
            locale == .arabic ? "العهد المكي" : "Meccan Period"
        }

        static func medinan(_ locale: AppLocale) -> String {
            locale == .arabic ? "العهد المدني" : "Medinan Period"
        }
    }

    // MARK: - Common
    enum Common {
        static func backToHome(_ locale: AppLocale) -> String {
            locale == .arabic ? "العودة للرئيسية" : "Back to Home"
        }

        static func home(_ locale: AppLocale) -> String {
            locale == .arabic ? "الرئيسية" : "Home"
        }

        static func loading(_ locale: AppLocale) -> String {
            locale == .arabic ? "جاري التحميل..." : "Loading..."
        }

        static func retry(_ locale: AppLocale) -> String {
            locale == .arabic ? "إعادة المحاولة" : "Retry"
        }

        static func comingSoon(_ locale: AppLocale) -> String {
            locale == .arabic ? "قريباً" : "Coming Soon"
        }
    }
}
