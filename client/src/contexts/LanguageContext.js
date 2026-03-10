import React, { createContext, useState, useEffect } from 'react';

// Basic JSON dictionary mapping keys to Language translations
export const translations = {
    "en": {
        "nav.home": "Home",
        "nav.about": "About Us",
        "nav.awards": "Awards",
        "nav.contact": "Contact",
        "nav.gallery": "Gallery",
        "nav.signup": "Sign Up",
        "nav.signin": "Sign In",
        "hero.tag": "Core Modules",
        "hero.title": "Complete ERP for Rubber Manufacturing",
        "hero.desc": "Purpose-built modules to manage latex collection, processing, workforce, and finance efficiently.",
        "hero.getstarted": "Request Demo",
        "hero.viewfeatures": "View Features",
        "stats.experience": "Years Experience",
        "stats.farmers": "Registered Farmers",
        "stats.capacity": "MT Daily Capacity",
        "who.title": "Who We Are",
        "who.desc": "The Holy Family Polymers group of companies with its head office in Kooroppada, Kottayam have been processing natural rubber for the last 25 years. The group's major activity, Holy Family Polymers, is a leading producer of centrifuged latex, becoming over the years one of the largest exporters of all grades of natural rubber from India.",
        "who.learnmore": "Learn more",
        "mission.title": "Our Mission",
        "mission.desc": "Our mission is to establish Holy Family Polymers as the premier brand in the natural rubber processing industry, both domestically and internationally. We are committed to achieving this through an unrelenting focus on quality, utilizing advanced technology, and fostering sustainable practices that benefit our clients and the environment.",
        "vision.title": "Our Vision",
        "vision.desc": "To be the global leader in natural rubber processing, recognized for our unwavering dedication to quality, innovation, and sustainability. We aspire to set the industry standard, ensuring that every product bearing our name reflects excellence and reliability."
    },
    "ml": {
        "nav.home": "ഹോം",
        "nav.about": "ഞങ്ങളെക്കുറിച്ച്",
        "nav.awards": "അവാർഡുകൾ",
        "nav.contact": "ബന്ധപ്പെടുക",
        "nav.gallery": "ഗാലറി",
        "nav.signup": "രജിസ്റ്റർ",
        "nav.signin": "ലോഗിൻ",
        "hero.tag": "പ്രധാന മൊഡ്യൂളുകൾ",
        "hero.title": "റബ്ബർ നിർമ്മാണത്തിനുള്ള സമ്പൂർണ്ണ ERP",
        "hero.desc": "ലാറ്റക്സ് ശേഖരണം, ഗാഡ്‌ഗെറ്റിങ്, തൊഴിലാളികൾ, സാമ്പത്തികം എന്നിവ കാര്യക്ഷമമായി കൈകാര്യം ചെയ്യുന്നതിനുള്ള മികച്ച മൊഡ്യൂളുകൾ.",
        "hero.getstarted": "ഡെമോ ആവശ്യപ്പെടുക",
        "hero.viewfeatures": "സവിശേഷതകൾ കാണുക",
        "stats.experience": "വർഷത്തെ പരിചയം",
        "stats.farmers": "രജിസ്റ്റർ ചെയ്ത കർഷകർ",
        "stats.capacity": "പ്രതിദിന ഉത്പാദനം (MT)",
        "who.title": "ഞങ്ങൾ ആരാണ്",
        "who.desc": "കോട്ടയത്തെ കൂരോപ്പട ആസ്ഥാനമായി പ്രവർത്തിക്കുന്ന ഹോളി ഫാമിലി പോളിമേഴ്സ് ഗ്രൂപ്പ് ഓഫ് കമ്പനീസ് കഴിഞ്ഞ 25 വർഷമായി പ്രകൃതിദത്ത റബ്ബർ സംസ്കരണ രംഗത്ത് സജീവമാണ്. സെൻട്രിഫ്യൂജ്ഡ് ലാറ്റക്സ് ഉൽപ്പാദിപ്പിക്കുന്നതിൽ മുൻപന്തിയിലുള്ള ഹോളി ഫാമിലി പോളിമേഴ്സ് വർഷങ്ങളിലൂടെ ഇന്ത്യയിൽ നിന്നുള്ള എല്ലാ ഗ്രേഡ് പ്രകൃതിദത്ത റബ്ബറിന്റെയും ഏറ്റവും വലിയ കയറ്റുമതിക്കാരിൽ ഒന്നായി മാറിയിരിക്കുന്നു.",
        "who.learnmore": "കൂടുതൽ അറിയുക",
        "mission.title": "ഞങ്ങളുടെ ലക്ഷ്യം",
        "mission.desc": "ആഭ്യന്തരമായും അന്തർദ്ദേശീയമായും പ്രകൃതിദത്ത റബ്ബർ സംസ്കരണ വ്യവസായത്തിലെ പ്രധാന ബ്രാൻഡായി ഹോളി ഫാമിലി പോളിമർ സ്ഥാപിക്കുക എന്നതാണ് ഞങ്ങളുടെ ദൗത്യം. ഗുണനിലവാരത്തിൽ വിട്ടുവീഴ്ചയില്ലാത്ത ശ്രദ്ധ കേന്ദ്രീകരിച്ചും, നൂതന സാങ്കേതികവിദ്യ ഉപയോഗിച്ചും, ഞങ്ങളുടെ ഉപഭോക്താക്കൾക്കും പരിസ്ഥിതിക്കും പ്രയോജനപ്പെടുന്ന സുസ്ഥിരമായ രീതികൾ വളർത്തിയെടുത്തും ഇത് നേടിയെടുക്കാൻ ഞങ്ങൾ പ്രതിജ്ഞാബദ്ധരാണ്.",
        "vision.title": "ഞങ്ങളുടെ വീക്ഷണം",
        "vision.desc": "ഗുണനിലവാരം, നൂതനത്വം, സുസ്ഥിരത എന്നിവയോടുള്ള ഞങ്ങളുടെ അചഞ്ചലമായ സമർപ്പണത്തിന് അംഗീകാരം ലഭിച്ചുകൊണ്ട് പ്രകൃതിദത്ത റബ്ബർ സംസ്കരണത്തിൽ ആഗോള തലവനാകാൻ. ഞങ്ങളുടെ പേര് വഹിക്കുന്ന എല്ലാ ഉൽപ്പന്നങ്ങളും മികവും വിശ്വാസ്യതയും പ്രതിഫലിപ്പിക്കുന്നുവെന്ന് ഉറപ്പാക്കിക്കൊണ്ട് വ്യവസായ നിലവാരം സജ്ജമാക്കാൻ ഞങ്ങൾ ആഗ്രഹിക്കുന്നു."
    },
    "hi": {
        "nav.home": "होम",
        "nav.about": "हमारे बारे में",
        "nav.awards": "पुरस्कार",
        "nav.contact": "संपर्क करें",
        "nav.gallery": "गैलरी",
        "nav.signup": "साइन अप",
        "nav.signin": "साइन इन",
        "hero.tag": "मुख्य मॉड्यूल",
        "hero.title": "रबर निर्माण के लिए पूर्ण ईआरपी",
        "hero.desc": "लेटेक्स संग्रह, प्रसंस्करण, कार्यबल और वित्त को कुशलतापूर्वक प्रबंधित करने के लिए उद्देश्य-निर्मित मॉड्यूल।",
        "hero.getstarted": "डेमो का अनुरोध करें",
        "hero.viewfeatures": "सुविधाएँ देखें",
        "stats.experience": "साल का अनुभव",
        "stats.farmers": "पंजीकृत किसान",
        "stats.capacity": "एमटी दैनिक क्षमता",
        "who.title": "हम कौन हैं",
        "who.desc": "कूरप्पडा, कोट्टायम में अपने मुख्य कार्यालय के साथ होली फैमिली पॉलीमर्स ग्रुप ऑफ कंपनीज पिछले 25 वर्षों से प्राकृतिक रबर का प्रसंस्करण कर रही है। समूह की प्रमुख गतिविधि, होली फैमिली पॉलीमर्स, सेंट्रीफ्यूज्ड लेटेक्स का एक अग्रणी उत्पादक है, जो पिछले कुछ वर्षों में भारत से प्राकृतिक रबर के सभी ग्रेड के सबसे बड़े निर्यातकों में से एक बन गया है।",
        "who.learnmore": "अधिक जानें",
        "mission.title": "हमारा मिशन",
        "mission.desc": "हमारा मिशन होली फैमिली पॉलीमर्स को घरेलू और अंतरराष्ट्रीय स्तर पर प्राकृतिक रबर प्रसंस्करण उद्योग में प्रमुख ब्रांड के रूप में स्थापित करना है। हम गुणवत्ता पर निरंतर ध्यान केंद्रित करने, उन्नत तकनीक का उपयोग करने और हमारे ग्राहकों और पर्यावरण को लाभ पहुंचाने वाली स्थायी प्रथाओं को बढ़ावा देने के माध्यम से इसे प्राप्त करने के लिए प्रतिबद्ध हैं।",
        "vision.title": "हमारी दृष्टि",
        "vision.desc": "प्राकृतिक रबर प्रसंस्करण में वैश्विक नेता बनने के लिए, गुणवत्ता, नवीनता और स्थिरता के प्रति हमारे अटूट समर्पण के लिए पहचाना जाता है। हम उद्योग मानक निर्धारित करने की आकांक्षा रखते हैं, यह सुनिश्चित करते हुए कि हमारा नाम धारण करने वाला प्रत्येक उत्पाद उत्कृष्टता और विश्वसनीयता को दर्शाता है।"
    }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Default to 'en' or fetch from localStorage
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('appLanguage') || 'en';
    });

    // Save preference when changed
    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    // Simple translation function
    const t = (key) => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
