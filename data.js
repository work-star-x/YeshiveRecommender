window.APP_DATA = {
  app: {
    title: 'מתאם הישיבות',
    subtitle: 'מצא את ההתאמה הטובה ביותר לישיבה על פי סגנון הלימוד, הערכים והיעדים שלך.'
  },
  parameters: [
    { id: 'military', label: 'אורך השירות', description: '(גבוהה - שירות מלא)' },
    { id: 'social_engagement', label: 'מעורבות חברתית', description: '(גבוה - מעורבת גבוהה)' },
    { id: 'cultural_openness', label: 'פתיחות תרבותית', description: '(גבוה - פתוח)' },
    { id: 'conservatism_authority', label: 'שמרנות', description: '(גבוה - שמרני)' },
    { id: 'classic_study', label: 'אופי הלימוד', description: '(גבוה - שיטת לימוד קלאסית)' },
    { id: 'personal_attention', label: 'יחס אישי', description: '(גבוה - יחס אישי גבוה וישיבה קטנה)' },
    { id: 'physical_conditions', label: 'ת"ש', description: '(גבוה - תנאים טובים)' }
  ],
  questions: [
    {
      id: 'q1',
      text: 'תלמידי ישיבות הסדר ברובם צריכים לשרת 3 שנים בצבא?',
      options: [
        { id: 'yes', label: 'כן', tags: ['military', 'social_engagement'], weights: { military: 3, social_engagement: 2 } },
        { id: 'no', label: 'לא', tags: ['military', 'social_engagement'], weights: { military: -3, social_engagement: -2 } }
      ]
    },
    {
      id: 'q2',
      text: 'ישיבה צריכה להכין את התלמידים שלה להשפיע ולהוביל בצבא, בתקשורת ובמערכת הציבורית.',
      options: [
        { id: 'yes', label: 'כן', tags: ['social_engagement'], weights: { social_engagement: 3 } },
        { id: 'no', label: 'לא', tags: ['social_engagement'], weights: { social_engagement: -3 } }
      ]
    },
    {
      id: 'q3',
      text: 'אני חושב שלגדול בחברה מעורבת זה דבר בריא.',
      options: [
        { id: 'yes', label: 'כן', tags: ['cultural_openness'], weights: { cultural_openness: 3 } },
        { id: 'no', label: 'לא', tags: ['cultural_openness'], weights: { cultural_openness: -3 } }
      ]
    },
    {
      id: 'q4',
      text: 'חשוב לי ללמוד בישיבה שיש לה שליחות התיישבותית.',
      options: [
        { id: 'yes', label: 'כן', tags: ['social_engagement'], weights: { social_engagement: 1 } },
        { id: 'no', label: 'לא', tags: ['social_engagement'], weights: { social_engagement: -1 } }
      ]
    },
    {
      id: 'q5',
      text: 'אני מתעניין גם בלימודי אמונה ומחשבה ולא רק בלימוד גמרא.',
      options: [
        { id: 'yes', label: 'כן', tags: ['classic_study'], weights: { classic_study: -2 } },
        { id: 'no', label: 'לא', tags: ['classic_study'], weights: { classic_study: 2 } }
      ]
    },
    {
      id: 'q6',
      text: 'אני מאמין שלימוד "חכמה מן החוץ" זה דבר שיכול לקרות גם בזמן הישיבה.',
      options: [
        { id: 'yes', label: 'כן', tags: ['cultural_openness'], weights: { cultural_openness: 2 } },
        { id: 'no', label: 'לא', tags: ['cultural_openness'], weights: { cultural_openness: -2 } }
      ]
    },
    {
      id: 'q7',
      text: 'בתקופת הישיבה עדיף לשמור מרחק מתרבות כללית (סרטים, מוזיקה וכו\').',
      options: [
        { id: 'yes', label: 'כן', tags: ['conservatism_authority', 'cultural_openness'], weights: { conservatism_authority: 3, cultural_openness: -2 } },
        { id: 'no', label: 'לא', tags: ['conservatism_authority', 'cultural_openness'], weights: { conservatism_authority: -3, cultural_openness: 2 } }
      ]
    },
    {
      id: 'q8',
      text: 'חשוב לי ללמוד בגמרא באופן שגם נוגע בחיים שלי.',
      options: [
        { id: 'yes', label: 'כן', tags: ['classic_study', 'social_engagement'], weights: { classic_study: -3, social_engagement: 1 } },
        { id: 'no', label: 'לא', tags: ['classic_study', 'social_engagement'], weights: { classic_study: 3, social_engagement: -1 } }
      ]
    },
    {
      id: 'q9',
      text: 'תורת הרב קוק צריכה לעמוד במרכז הלימוד במחשבה בישיבה.',
      options: [
        { id: 'yes', label: 'כן', tags: ['classic_study', 'conservatism_authority'], weights: { classic_study: 2, conservatism_authority: 1 } },
        { id: 'no', label: 'לא', tags: ['classic_study', 'conservatism_authority'], weights: { classic_study: -2, conservatism_authority: -1 } }
      ]
    },
    {
      id: 'q10',
      text: 'אני מעדיף ישיבה קטנה שבה הקשר האישי עם הרבנים חזק יותר, על פני ישיבה גדולה שבה הקשר האישי חלש יותר.',
      options: [
        { id: 'yes', label: 'כן', tags: ['personal_attention'], weights: { personal_attention: 3 } },
        { id: 'no', label: 'לא', tags: ['personal_attention'], weights: { personal_attention: -3 } }
      ]
    },
    {
      id: 'q11',
      text: 'כשרב גדול מכריע בעניין ציבורי או פוליטי אני אלך אחריו גם אם אני חושב אחרת.',
      options: [
        { id: 'yes', label: 'כן', tags: ['conservatism_authority'], weights: { conservatism_authority: 3 } },
        { id: 'no', label: 'לא', tags: ['conservatism_authority'], weights: { conservatism_authority: -3 } }
      ]
    },
    {
      id: 'q12',
      text: 'יצירה – כמו מוזיקה, אומנות, כתיבה יכולה להיות חלק מעבודת ה\' בישיבה.',
      options: [
        { id: 'yes', label: 'כן', tags: ['cultural_openness', 'classic_study'], weights: { cultural_openness: 3, classic_study: -3 } },
        { id: 'no', label: 'לא', tags: ['cultural_openness', 'classic_study'], weights: { cultural_openness: -3, classic_study: 3 } }
      ]
    },
    {
      id: 'q13',
      text: 'חשוב לי שיהיה בישיבה תנאים טובים (מקווה, חדר כושר, אוכל וכו\').',
      options: [
        { id: 'yes', label: 'כן', tags: ['physical_conditions'], weights: { physical_conditions: 3 } },
        { id: 'no', label: 'לא', tags: ['physical_conditions'], weights: { physical_conditions: -3 } }
      ]
    },
    {
      id: 'q14',
      text: 'חשוב לי שבישיבה יהיה קשר בין הצעירים והבוגרים.',
      options: [
        { id: 'yes', label: 'כן', tags: ['personal_attention'], weights: { personal_attention: 2 } },
        { id: 'no', label: 'לא', tags: ['personal_attention'], weights: { personal_attention: -2 } }
      ]
    },
    {
      id: 'q15',
      text: 'ללמוד תורה עם מחשבים זה דבר רע.',
      options: [
        { id: 'yes', label: 'כן', tags: ['conservatism_authority', 'classic_study'], weights: { conservatism_authority: 3, classic_study: 1 } },
        { id: 'no', label: 'לא', tags: ['conservatism_authority', 'classic_study'], weights: { conservatism_authority: -3, classic_study: -1 } }
      ]
    }
  ],
  yeshivot: [
    {
      id: 'machanaim',
      name: 'ישיבת מכמנים',
      shortName: 'מכמנים',
      tagline: 'סביבה מעורבת, מסודרת ופתוחה לחשיבה',
      description: 'ישיבה המשלבת לימוד רציני עם מעורבות חברתית, פתיחות תרבותית והפנמה של מטרות ציבוריות.',
      matchSummary: 'התאמה טובה לתלמידים שמחפשים שילוב של תורה, חברה, מנהיגות ועמידה מול העולם המודרני.',
      profileTags: {
        military: 8.1,
        social_engagement: 8.4,
        cultural_openness: 7.8,
        conservatism_authority: 6.2,
        classic_study: 7.5,
        personal_attention: 6.9,
        physical_conditions: 7.2
      },
      boostRules: { enabled: false, baselineTags: [], avoidanceTags: [], minMatches: 0, bonus: 0 }
    },
    {
      id: 'merkaz_harav',
      name: 'ישיבת מרכז הרב',
      shortName: 'מרכז הרב',
      tagline: 'לימוד קלאסי עם מסגרת ערכית ברורה',
      description: 'דגם שמחזק לימוד עיוני, חיזוק תורה ומוסר ונתיב מחשבתי יציב.',
      matchSummary: 'מתאים לתלמידים שמעריכים לימוד רציני, מסגרת ערכית, ועמדות שמרניות ומובנות.',
      profileTags: {
        military: 6.4,
        social_engagement: 5.8,
        cultural_openness: 6.1,
        conservatism_authority: 8.6,
        classic_study: 8.9,
        personal_attention: 6.3,
        physical_conditions: 6.0
      },
      boostRules: { enabled: false, baselineTags: [], avoidanceTags: [], minMatches: 0, bonus: 0 }
    },
    {
      id: 'har_etzion',
      name: 'ישיבת הר עציון',
      shortName: 'הר עציון',
      tagline: 'אינטלקטואליות, עומק ושיח פתוח',
      description: 'ישיבה המעדיפה חשיבה, דיון, חקר והעמקת ההבנה לצד מסגרת לימודית מבוססת.',
      matchSummary: 'מתאימה לתלמידים שמחפשים לימוד אינטלקטואלי עמוק, דיון פתוח ומגוון רעיוני.',
      profileTags: {
        military: 6.8,
        social_engagement: 7.1,
        cultural_openness: 8.3,
        conservatism_authority: 6.7,
        classic_study: 8.1,
        personal_attention: 6.9,
        physical_conditions: 6.8
      },
      boostRules: { enabled: false, baselineTags: [], avoidanceTags: [], minMatches: 0, bonus: 0 }
    },
    {
      id: 'yeshivat_aderet',
      name: 'ישיבת אדרת',
      shortName: 'אדרת',
      tagline: 'קהילה חמה עם תשומת לב אישית',
      description: 'סביבה קהילתית, חמה ומכילה, עם דגש על קשר אישי בין התלמידים לרבנים.',
      matchSummary: 'מתאימה לתלמידים שמעריכים חמימות, קהילה, יחס אישי ומסגרת לימודית מאוזנת.',
      profileTags: {
        military: 6.2,
        social_engagement: 7.9,
        cultural_openness: 7.0,
        conservatism_authority: 6.5,
        classic_study: 7.2,
        personal_attention: 8.7,
        physical_conditions: 7.4
      },
      boostRules: { enabled: false, baselineTags: [], avoidanceTags: [], minMatches: 0, bonus: 0 }
    },
    {
      id: 'yeshiva_ketana',
      name: 'ישיבה קטנה',
      shortName: 'ישיבה קטנה',
      tagline: 'ישיבה קטנה, יחס אישי ומסגרת קלאסית',
      description: 'מסגרת מצומצמת עם יחס אישי גבוה, שגרה קלאסית ושימת דגש על לימוד טקסטואלי מסודר.',
      matchSummary: 'מתאימה לתלמידים שמעדיפים ישיבה קטנה, קשר אישי ועמידה על מסגרת לימודית קלאסית.',
      profileTags: {
        military: 5.7,
        social_engagement: 6.4,
        cultural_openness: 5.2,
        conservatism_authority: 7.8,
        classic_study: 8.4,
        personal_attention: 9.1,
        physical_conditions: 6.5
      },
      boostRules: { enabled: false, baselineTags: [], avoidanceTags: [], minMatches: 0, bonus: 0 }
    }
  ]
};
