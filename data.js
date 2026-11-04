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
      id: 'merkaz_harav',
      name: 'ישיבת מרכז הרב',
      shortName: 'מרכז הרב',
      tagline: 'לימוד קלאסי ושמרנות גבוהה',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף שמרנות ולימוד קלאסי.',
      profileTags: {
        military: 3,
        social_engagement: 3,
        cultural_openness: 1,
        conservatism_authority: 10,
        classic_study: 10,
        personal_attention: 3,
        physical_conditions: 5
      }
    },
    {
      id: 'har_etzion',
      name: 'ישיבת הר עציון',
      shortName: 'הר עציון',
      tagline: 'מעורבות חברתית, פתיחות ולימוד מעמיק',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמחפש שילוב של מעורבות, פתיחות ולימוד קלאסי.',
      profileTags: {
        military: 8,
        social_engagement: 8,
        cultural_openness: 8,
        conservatism_authority: 4,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 7
      }
    },
    {
      id: 'kerem_beyavne',
      name: 'ישיבת כרם ביבנה',
      shortName: 'כרם ביבנה',
      tagline: 'לימוד קלאסי ומסגרת שמרנית',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף לימוד קלאסי ושמרנות לצד מעורבות מתונה.',
      profileTags: {
        military: 6,
        social_engagement: 6,
        cultural_openness: 3,
        conservatism_authority: 8,
        classic_study: 10,
        personal_attention: 6,
        physical_conditions: 6
      }
    },
    {
      id: 'shaalvim',
      name: 'ישיבת שעלבים',
      shortName: 'שעלבים',
      tagline: 'פרופיל מאוזן עם דגש על לימוד קלאסי',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמחפש איזון בין הפרמטרים וסגנון לימוד קלאסי.',
      profileTags: {
        military: 6,
        social_engagement: 6,
        cultural_openness: 6,
        conservatism_authority: 6,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 7
      }
    },
    {
      id: 'otniel',
      name: 'ישיבת עתניאל',
      shortName: 'עתניאל',
      tagline: 'מעורבות גבוהה, פתיחות ויחס אישי',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף מעורבות ופתיחות גבוהות לצד יחס אישי.',
      profileTags: {
        military: 8,
        social_engagement: 10,
        cultural_openness: 8,
        conservatism_authority: 3,
        classic_study: 6,
        personal_attention: 8,
        physical_conditions: 6
      }
    },
    {
      id: 'har_bracha',
      name: 'ישיבת הר ברכה',
      shortName: 'הר ברכה',
      tagline: 'מעורבות גבוהה ושמרנות גבוהה',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף מעורבות לצד שמרנות ולימוד קלאסי.',
      profileTags: {
        military: 6,
        social_engagement: 8,
        cultural_openness: 3,
        conservatism_authority: 10,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 5
      }
    },
    {
      id: 'siach_yitzchak',
      name: 'ישיבת שיח יצחק',
      shortName: 'שיח יצחק',
      tagline: 'פתיחות ויחס אישי גבוהים',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף פתיחות, יחס אישי ומעורבות גבוהים.',
      profileTags: {
        military: 3,
        social_engagement: 8,
        cultural_openness: 10,
        conservatism_authority: 1,
        classic_study: 3,
        personal_attention: 10,
        physical_conditions: 7
      }
    },
    {
      id: 'shavei_hevron',
      name: 'ישיבת שבי חברון',
      shortName: 'שבי חברון',
      tagline: 'לימוד קלאסי ושמרנות גבוהה',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף שמרנות ולימוד קלאסי.',
      profileTags: {
        military: 3,
        social_engagement: 3,
        cultural_openness: 1,
        conservatism_authority: 10,
        classic_study: 10,
        personal_attention: 3,
        physical_conditions: 5
      }
    },
    {
      id: 'hesder_tzfat',
      name: 'ישיבת ההסדר צפת',
      shortName: 'ההסדר צפת',
      tagline: 'שירות ומעורבות חברתית גבוהים',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף שירות ומעורבות חברתית גבוהים.',
      profileTags: {
        military: 10,
        social_engagement: 8,
        cultural_openness: 6,
        conservatism_authority: 6,
        classic_study: 6,
        personal_attention: 8,
        physical_conditions: 5
      }
    },
    {
      id: 'tekoa',
      name: 'ישיבת תקוע',
      shortName: 'תקוע',
      tagline: 'פתיחות תרבותית גבוהה ושמרנות נמוכה',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה למי שמעדיף פתיחות תרבותית גבוהה לצד לימוד קלאסי.',
      profileTags: {
        military: 3,
        social_engagement: 6,
        cultural_openness: 10,
        conservatism_authority: 1,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 6
      }
    },
    {
      id: 'machanim',
      name: 'ישיבת מחנים',
      shortName: 'מחנים',
      tagline: 'פתיחות תרבותית ויחס אישי גבוהים',
      description: 'פרופיל התאמה המבוסס על ערכי הפרמטרים שהוגדרו.',
      matchSummary: 'מתאימה במיוחד למי שפרופילו משלב פתיחות גבוהה, שמרנות נמוכה ולימוד פחות קלאסי.',
      profileTags: {
        military: 5,
        social_engagement: 7,
        cultural_openness: 9,
        conservatism_authority: 2,
        classic_study: 4,
        personal_attention: 9,
        physical_conditions: 7
      }
    }
  ]
};
