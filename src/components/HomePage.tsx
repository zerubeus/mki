import React, { useState } from 'react';
import aqidaIcon from '../assets/akida.png';
import ibadatIcon from '../assets/ibadat.png';
import seeraIcon from '../assets/seera.png';
import tareekh from '../assets/tareekh.png';
import './HomePage.css';

const HomePage = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('العربية');

  const topics = [
    {
      id: 'aqida',
      nameAr: 'العقيدة',
      nameEn: 'Creed',
      icon: aqidaIcon,
      description: 'أساسيات الإيمان والتوحيد'
    },
    {
      id: 'ibadat',
      nameAr: 'العبادات',
      nameEn: 'Worship',
      icon: ibadatIcon,
      description: 'الصلاة والصوم والزكاة والحج'
    },
    {
      id: 'seera',
      nameAr: 'السيرة',
      nameEn: 'Biography',
      icon: seeraIcon,
      description: 'سيرة النبي محمد صلى الله عليه وسلم'
    },
    {
      id: 'tareekh',
      nameAr: 'التاريخ',
      nameEn: 'History',
      icon: tareekh,
      description: 'تاريخ الإسلام والحضارة الإسلامية'
    }
  ];

  return (
    <div className="homepage-container">
      {/* Header */}
      <header className="header">
        <div className="title-section">
          <h1 className="main-title">اعرف دينك</h1>
          <p className="subtitle">معرفة إسلامية شاملة</p>
        </div>
        
        <div className="language-selector">
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="language-select"
          >
            <option value="العربية">العربية</option>
            <option value="English">English</option>
            <option value="Français">Français</option>
            <option value="Español">Español</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Topics Grid */}
        <section className="topics-section">
          <div className="topics-grid">
            {topics.map((topic) => (
              <div key={topic.id} className="topic-card">
                <div className="icon-container">
                  <img 
                    src={topic.icon.src} 
                    alt={topic.nameAr} 
                    width={50}
                    height={50}
                    className="topic-icon"
                  />
                </div>
                <h3 className="topic-name">{topic.nameAr}</h3>
                <p className="topic-description">{topic.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Description Section */}
        <section className="description-section">
          <div className="description-card">
            <h2 className="section-title">مرحباً بك في موقع المعرفة الإسلامية</h2>
            <p className="description-text">
              هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من الكتاب والسنة.
              يمكنك تصفح المواضيع المختلفة لتعلم أساسيات الدين الإسلامي، من العقيدة والعبادات
              إلى السيرة النبوية وتاريخ الإسلام.
            </p>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>محتوى معتمد من الكتاب والسنة</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎓</span>
                <span>شرح مبسط ومفهوم للجميع</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌍</span>
                <span>متاح بعدة لغات</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage; 