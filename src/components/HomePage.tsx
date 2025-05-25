import React, { useState } from "react";
import aqidaIcon from "../assets/akida.png";
import ibadatIcon from "../assets/ibadat.png";
import seeraIcon from "../assets/seera.png";
import tareekh from "../assets/tareekh.png";

const HomePage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("العربية");

  const topics = [
    {
      id: "aqida",
      nameAr: "العقيدة",
      nameEn: "Creed",
      icon: aqidaIcon,
      description: "أساسيات الإيمان والتوحيد",
    },
    {
      id: "ibadat",
      nameAr: "العبادات",
      nameEn: "Worship",
      icon: ibadatIcon,
      description: "الصلاة والصوم والزكاة والحج",
    },
    {
      id: "seera",
      nameAr: "السيرة",
      nameEn: "Biography",
      icon: seeraIcon,
      description: "سيرة النبي محمد صلى الله عليه وسلم",
    },
    {
      id: "tareekh",
      nameAr: "التاريخ",
      nameEn: "History",
      icon: tareekh,
      description: "تاريخ الإسلام والحضارة الإسلامية",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes titleGlow {
          0% { filter: brightness(1) drop-shadow(0 0 10px rgba(255, 215, 0, 0.3)); }
          100% { filter: brightness(1.1) drop-shadow(0 0 20px rgba(255, 215, 0, 0.5)); }
        }
      `}</style>

      <div
        className="min-h-screen p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 75%, #764ba2 100%)",
        }}
      >
        {/* Background overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 60%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              radial-gradient(circle at 40% 40%, rgba(255, 215, 0, 0.1) 0%, transparent 40%)
            `,
          }}
        />

        {/* Header */}
        <header className="flex justify-between items-center mb-12 relative z-10 flex-col md:flex-row gap-8 md:gap-0 text-center md:text-right">
          <div className="order-2 md:order-1">
            <h1
              className="text-4xl md:text-6xl font-extrabold text-white m-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 bg-clip-text text-transparent"
              style={{
                textShadow:
                  "3px 3px 6px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.3)",
                animation: "titleGlow 3s ease-in-out infinite alternate",
              }}
            >
              اعرف دينك
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mt-2 font-semibold tracking-wide">
              معرفة إسلامية شاملة
            </p>
          </div>

          <div className="relative order-1 md:order-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-6 py-4 border-none rounded-full bg-white/95 backdrop-blur-sm text-gray-800 font-semibold cursor-pointer shadow-xl transition-all duration-300 hover:bg-white hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-yellow-400/30 appearance-none min-w-[140px]"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
                backdropFilter: "blur(15px)",
              }}
            >
              <option value="العربية">العربية</option>
              <option value="English">English</option>
            </select>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10">
          {/* Topics Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-10 text-center shadow-xl border-2 border-white/40 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:scale-105 relative overflow-hidden group"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92))",
                    backdropFilter: "blur(25px)",
                  }}
                >
                  {/* Top border gradient */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #ffd700 100%)",
                    }}
                  />

                  <div
                    className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    }}
                  >
                    <img
                      src={topic.icon.src}
                      alt={topic.nameAr}
                      width={50}
                      height={50}
                      className="object-contain brightness-110 contrast-110 relative z-10"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 tracking-wide">
                    {topic.nameAr}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    {topic.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Description Section */}
          <section>
            <div
              className="bg-white/95 backdrop-blur-md rounded-3xl p-16 shadow-2xl border-2 border-white/40 text-center relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92))",
                backdropFilter: "blur(25px)",
              }}
            >
              {/* Top border gradient */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background:
                    "linear-gradient(90deg, #667eea 0%, #764ba2 25%, #ffd700 75%, #f093fb 100%)",
                }}
              />

              <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-wide">
                مرحباً بك في موقع المعرفة الإسلامية
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-12 max-w-4xl mx-auto font-medium">
                هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من
                الكتاب والسنة. يمكنك تصفح المواضيع المختلفة لتعلم أساسيات الدين
                الإسلامي، من العقيدة والعبادات إلى السيرة النبوية وتاريخ
                الإسلام.
              </p>
              <div className="flex justify-center gap-10 flex-wrap">
                <div className="flex items-center gap-3 bg-blue-100/50 px-8 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 hover:bg-blue-200/50 hover:-translate-y-1 border border-blue-200/50">
                  <span className="text-2xl">📚</span>
                  <span>محتوى معتمد من الكتاب والسنة</span>
                </div>
                <div className="flex items-center gap-3 bg-blue-100/50 px-8 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 hover:bg-blue-200/50 hover:-translate-y-1 border border-blue-200/50">
                  <span className="text-2xl">🎓</span>
                  <span>شرح مبسط ومفهوم للجميع</span>
                </div>
                <div className="flex items-center gap-3 bg-blue-100/50 px-8 py-4 rounded-2xl font-semibold text-gray-800 transition-all duration-300 hover:bg-blue-200/50 hover:-translate-y-1 border border-blue-200/50">
                  <span className="text-2xl">🌍</span>
                  <span>متاح بعدة لغات</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default HomePage;
