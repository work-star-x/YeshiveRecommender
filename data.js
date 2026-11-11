window.APP_DATA = {
  app: {
    title: 'ישיבומטר',
    subtitle: 'מצא את הישיבה שמתאימה לך'
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
      text: 'תלמידי ישיבות ברובם צריכים לשרת 3 שנים בצבא?',
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
      type: 'rating',
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
      type: 'rating',
      text: 'אני מאמין שלימוד "חכמה מן החוץ" (פילוסופיה, פסיכולוגיה, ספרות וכו\') זה דבר שיכול לקרות גם בזמן הישיבה.',
      options: [
        { id: 'yes', label: 'כן', tags: ['cultural_openness'], weights: { cultural_openness: 2 } },
        { id: 'no', label: 'לא', tags: ['cultural_openness'], weights: { cultural_openness: -2 } }
      ]
    },
    {
      id: 'q7',
      type: 'rating',
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
      type: 'rating',
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
      type: 'rating',
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
      type: 'rating',
      text: 'חשוב לי שבישיבה יהיה קשר בין הצעירים והבוגרים.',
      options: [
        { id: 'yes', label: 'כן', tags: ['personal_attention'], weights: { personal_attention: 2 } },
        { id: 'no', label: 'לא', tags: ['personal_attention'], weights: { personal_attention: -2 } }
      ]
    },
    {
      id: 'q15',
      type: 'rating',
      text: 'ללמוד תורה עם מחשבים זה דבר רע.',
      options: [
        { id: 'yes', label: 'כן', tags: ['conservatism_authority', 'classic_study'], weights: { conservatism_authority: 3, classic_study: 1 } },
        { id: 'no', label: 'לא', tags: ['conservatism_authority', 'classic_study'], weights: { conservatism_authority: -3, classic_study: -1 } }
      ]
    }
  ],
  yeshivot: [
    {
      id: 'yeshiva_1',
      name: 'ישיבת אור וישועה',
      shortName: 'אור וישועה',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבה בעלת מסורת לימוד ספרדית, עם דגש על עיון תלמודי, הלכה ואהבת עם ישראל.',
      profileTags: {
        military: 4,
        social_engagement: 6,
        cultural_openness: 5,
        conservatism_authority: 7,
        classic_study: 6,
        personal_attention: 5,
        physical_conditions: 5
      }
    },
    {
      id: 'yeshiva_2',
      name: 'ישיבת אורות שאול',
      shortName: 'אורות שאול',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'בית מדרש תל אביבי המחבר לימוד תורה עמוק עם סוגיות חברתיות, אתיקה, דת ומדינה.',
      profileTags: {
        military: 5,
        social_engagement: 9,
        cultural_openness: 7,
        conservatism_authority: 4,
        classic_study: 5,
        personal_attention: 6,
        physical_conditions: 3
      }
    },
    {
      id: 'yeshiva_3',
      name: 'ישיבת איילת השחר',
      shortName: 'איילת השחר',
      area: 'דרום',
      areaGroup: 'דרום',
      description: 'ישיבת הסדר באילת, בעלת אופי אידיאליסטי וחלוצי, עם דגש על בניין התורה ושליחות לאומית.',
      profileTags: {
        military: 8,
        social_engagement: 8,
        cultural_openness: 3,
        conservatism_authority: 8,
        classic_study: 8,
        personal_attention: 5,
        physical_conditions: 5
      }
    },
    {
      id: 'yeshiva_4',
      name: 'ישיבת איתמר',
      shortName: 'איתמר',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבה גבוהה בעלת אווירה משפחתית, דיבוק חברים וחיבור בין תורה, עם ישראל וארץ ישראל.',
      profileTags: {
        military: 8,
        social_engagement: 6,
        cultural_openness: 4,
        conservatism_authority: 8,
        classic_study: 8,
        personal_attention: 7,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_5',
      name: 'ישיבת אלון מורה',
      shortName: 'אלון מורה',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבת ברכת יוסף, המשלבת לימוד תורה לאור הרב קוק עם דגש על תורה מעשית, בניין המשפחה והחברה.',
      profileTags: {
        military: 5,
        social_engagement: 5,
        cultural_openness: 3,
        conservatism_authority: 9,
        classic_study: 8,
        personal_attention: 5,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_6',
      name: 'ישיבת בית אל',
      shortName: 'בית אל',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבה גבוהה המזוהה עם תורת הרב קוק והרצי"ה, בדגש על לימוד עיון, הלכה ואמונה.',
      profileTags: {
        military: 6,
        social_engagement: 5,
        cultural_openness: 2,
        conservatism_authority: 9,
        classic_study: 8,
        personal_attention: 4,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_7',
      name: 'ישיבת גבעת אולגה',
      shortName: 'גבעת אולגה',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'ישיבה קהילתית בחדרה, המדגישה דיבוק חברים, התפתחות אישית ופעילות חברתית ענפה.',
      profileTags: {
        military: 8,
        social_engagement: 9,
        cultural_openness: 4,
        conservatism_authority: 5,
        classic_study: 6,
        personal_attention: 8,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_8',
      name: 'ישיבת הגולן',
      shortName: 'הגולן',
      area: 'גולן',
      areaGroup: 'גולן',
      description: 'ישיבת הסדר חלוצית ברמת הגולן, המחברת לימוד תורה, שירות צבאי והתיישבות.',
      profileTags: {
        military: 6,
        social_engagement: 6,
        cultural_openness: 5,
        conservatism_authority: 6,
        classic_study: 9,
        personal_attention: 6,
        physical_conditions: 7
      }
    },
    {
      id: 'yeshiva_9',
      name: 'ישיבת ההסדר ירוחם',
      shortName: 'ההסדר ירוחם',
      area: 'דרום',
      areaGroup: 'דרום',
      description: 'ישיבה המדגישה לימוד גמרא בעיון, לימודי אמונה מעמיקים וחיבור לחברה הישראלית.',
      profileTags: {
        military: 5,
        social_engagement: 7,
        cultural_openness: 6,
        conservatism_authority: 5,
        classic_study: 9,
        personal_attention: 6,
        physical_conditions: 4
      }
    },
    {
      id: 'yeshiva_10',
      name: 'ישיבת ההסדר מאיר הראל',
      shortName: 'ההסדר מאיר הראל',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'ישיבה במודיעין המשלבת לימוד תורה מעמיק, שירות צבאי משמעותי ותודעת שליחות ומנהיגות.',
      profileTags: {
        military: 8,
        social_engagement: 8,
        cultural_openness: 5,
        conservatism_authority: 5,
        classic_study: 6,
        personal_attention: 8,
        physical_conditions: 7
      }
    },
    {
      id: 'yeshiva_11',
      name: 'ישיבת ההסדר נוף הגליל',
      shortName: 'ההסדר נוף הגליל',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבה קהילתית המחברת בין לימוד תורה לבין בניית גרעין תורני ומשפחות בעיר.',
      profileTags: {
        military: 5,
        social_engagement: 9,
        cultural_openness: 5,
        conservatism_authority: 6,
        classic_study: 8,
        personal_attention: 7,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_12',
      name: 'ישיבת ההסדר עכו',
      shortName: 'ההסדר עכו',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבה עירונית המשלבת לימוד תורה עם התיישבות עירונית, חיזוק הזהות היהודית ועשייה קהילתית.',
      profileTags: {
        military: 6,
        social_engagement: 9,
        cultural_openness: 6,
        conservatism_authority: 6,
        classic_study: 7,
        personal_attention: 8,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_13',
      name: 'ישיבת ההסדר צפת',
      shortName: 'ההסדר צפת',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבה בעלת אופי חסידי ורוחני, המדגישה ניגונים, שמחה, עבודת הנפש ולימוד גמרא.',
      profileTags: {
        military: 3,
        social_engagement: 6,
        cultural_openness: 5,
        conservatism_authority: 4,
        classic_study: 5,
        personal_attention: 8,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_14',
      name: 'ישיבת ההסדר קריית שמונה',
      shortName: 'ההסדר קריית שמונה',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבת הסדר צפונית המדגישה לימוד תורה מתוך חיבור לעם ישראל, לעיר ולתושבי הגליל.',
      profileTags: {
        military: 6,
        social_engagement: 8,
        cultural_openness: 5,
        conservatism_authority: 7,
        classic_study: 9,
        personal_attention: 8,
        physical_conditions: 10
      }
    },
    {
      id: 'yeshiva_15',
      name: 'ישיבת ההסדר קרני שומרון',
      shortName: 'ההסדר קרני שומרון',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבה משפחתית המדגישה לימוד גמרא אליבא דהלכתא, עבודת המידות ושירות צבאי משמעותי.',
      profileTags: {
        military: 6,
        social_engagement: 6,
        cultural_openness: 4,
        conservatism_authority: 8,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_16',
      name: 'ישיבת ההסדר ראשון לציון',
      shortName: 'ההסדר ראשון לציון',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'ישיבה עירונית בעלת אוריינטציה חברתית מובהקת, עם פעילות חינוך, רווחה וחסד בקהילה.',
      profileTags: {
        military: 5,
        social_engagement: 8,
        cultural_openness: 5,
        conservatism_authority: 5,
        classic_study: 8,
        personal_attention: 9,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_17',
      name: 'ישיבת ההסדר שעלבים',
      shortName: 'ההסדר שעלבים',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'ישיבה המדגישה הכשרת מנהיגות תורנית, שילוב תורה ודרך ארץ וחיבור בין לימוד לעשייה.',
      profileTags: {
        military: 4,
        social_engagement: 7,
        cultural_openness: 5,
        conservatism_authority: 7,
        classic_study: 9,
        personal_attention: 7,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_18',
      name: 'ישיבת הכותל',
      shortName: 'הכותל',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבת הסדר גדולה בלב הרובע היהודי, המשלבת מצוינות בלימוד עם זיקה עמוקה לירושלים ולעם ישראל.',
      profileTags: {
        military: 4,
        social_engagement: 8,
        cultural_openness: 5,
        conservatism_authority: 8,
        classic_study: 10,
        personal_attention: 6,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_19',
      name: 'ישיבת המאירי',
      shortName: 'המאירי',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבת הסדר משפחתית בירושלים, המדגישה ליווי אישי והכנה רוחנית וערכית לשירות הצבאי ולחיים.',
      profileTags: {
        military: 4,
        social_engagement: 7,
        cultural_openness: 5,
        conservatism_authority: 6,
        classic_study: 5,
        personal_attention: 9,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_20',
      name: 'ישיבת הסדר חולון',
      shortName: 'הסדר חולון',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'ישיבה המדגישה עיון תלמודי והלכתי קלאסי, שילוב מקצועות התורה ועבודת ה\' שמחה ומשפחתית.',
      profileTags: {
        military: 5,
        social_engagement: 5,
        cultural_openness: 3,
        conservatism_authority: 7,
        classic_study: 6,
        personal_attention: 8,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_21',
      name: 'ישיבת הר ברכה',
      shortName: 'הר ברכה',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבה המזוהה עם הרב אליעזר מלמד ועם מפעל פניני הלכה, בדגש על חיבור ההלכה לחיי המעשה.',
      profileTags: {
        military: 5,
        social_engagement: 7,
        cultural_openness: 5,
        conservatism_authority: 9,
        classic_study: 8,
        personal_attention: 7,
        physical_conditions: 9
      }
    },
    {
      id: 'yeshiva_22',
      name: 'ישיבת הר המור',
      shortName: 'הר המור',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבה גבוהה בעלת קו תורני אידיאולוגי מגובש, עם דגש על עיון מעמיק בש"ס, הלכה ואמונה.',
      profileTags: {
        military: 3,
        social_engagement: 2,
        cultural_openness: 1,
        conservatism_authority: 10,
        classic_study: 9,
        personal_attention: 2,
        physical_conditions: 2
      }
    },
    {
      id: 'yeshiva_23',
      name: 'ישיבת הר עציון',
      shortName: 'הר עציון',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבה בעלת מסורת לימודית רחבה, המשלבת עיון תלמודי שיטתי, לימודי תנ"ך, מחשבת ישראל ופתיחות רעיונית.',
      profileTags: {
        military: 5,
        social_engagement: 7,
        cultural_openness: 8,
        conservatism_authority: 4,
        classic_study: 10,
        personal_attention: 7,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_24',
      name: 'ישיבת טפחות',
      shortName: 'טפחות',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבת הסדר בגליל המדגישה התפתחות אישית, מודעות עצמית ושילוב תורה עם עשייה והכנה לשירות הצבאי.',
      profileTags: {
        military: 6,
        social_engagement: 8,
        cultural_openness: 6,
        conservatism_authority: 5,
        classic_study: 8,
        personal_attention: 8,
        physical_conditions: 7
      }
    },
    {
      id: 'yeshiva_25',
      name: 'ישיבת כרם ביבנה',
      shortName: 'כרם ביבנה',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'מישיבות ההסדר הוותיקות והמרכזיות, בעלת מסורת לימוד תורנית רחבה ומעמיקה ומסגרות לרבנות ולדיינות.',
      profileTags: {
        military: 4,
        social_engagement: 7,
        cultural_openness: 5,
        conservatism_authority: 9,
        classic_study: 10,
        personal_attention: 6,
        physical_conditions: 9
      }
    },
    {
      id: 'yeshiva_26',
      name: 'ישיבת מדברה כעדן',
      shortName: 'מדברה כעדן',
      area: 'דרום',
      areaGroup: 'דרום',
      description: 'ישיבה גדולה במצפה רמון, המדגישה עמל תורה, לימוד גמרא בעיון ובבקיאות ולימודי אמונה.',
      profileTags: {
        military: 7,
        social_engagement: 5,
        cultural_openness: 2,
        conservatism_authority: 9,
        classic_study: 9,
        personal_attention: 5,
        physical_conditions: 5
      }
    },
    {
      id: 'machanim',
      name: 'ישיבת מחנים',
      shortName: 'מחנים',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבה המשלבת לימוד תורה מעמיק עם מחשבה יהודית, חסידות ובירור משמעות התורה ביחס לחיים ולעולם.',
      profileTags: {
        military: 7,
        social_engagement: 8,
        cultural_openness: 10,
        conservatism_authority: 3,
        classic_study: 2,
        personal_attention: 8,
        physical_conditions: 9
      }
    },
    {
      id: 'yeshiva_28',
      name: 'ישיבת מעלה אליהו',
      shortName: 'מעלה אליהו',
      area: 'מרכז',
      areaGroup: 'מרכז',
      description: 'ישיבה בלב תל אביב, המחברת לימוד תורה אינטנסיבי עם פעילות חינוכית וחברתית בעיר הגדולה.',
      profileTags: {
        military: 9,
        social_engagement: 7,
        cultural_openness: 3,
        conservatism_authority: 9,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 4
      }
    },
    {
      id: 'yeshiva_29',
      name: 'ישיבת מעלות',
      shortName: 'מעלות',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבת הסדר המזוהה עם תורת ארץ ישראל, בדגש על בניית אישיות, אמונה ואחריות לכלל האומה.',
      profileTags: {
        military: 5,
        social_engagement: 8,
        cultural_openness: 5,
        conservatism_authority: 7,
        classic_study: 8,
        personal_attention: 10,
        physical_conditions: 7
      }
    },
    {
      id: 'yeshiva_30',
      name: 'ישיבת מרכז הרב',
      shortName: 'מרכז הרב',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבת הדגל ההיסטורית של הציונות הדתית, הממשיכה את דרכו של הרב קוק ומשלבת לימוד ש"ס עם מחשבת ישראל.',
      profileTags: {
        military: 5,
        social_engagement: 4,
        cultural_openness: 2,
        conservatism_authority: 10,
        classic_study: 10,
        personal_attention: 2,
        physical_conditions: 4
      }
    },
    {
      id: 'yeshiva_31',
      name: 'ישיבת נהריה',
      shortName: 'נהריה',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבה משפחתית המדגישה קשר אישי, מגוון דעות, בנייה תורנית ועשייה חברתית וחסד.',
      profileTags: {
        military: 6,
        social_engagement: 10,
        cultural_openness: 6,
        conservatism_authority: 5,
        classic_study: 6,
        personal_attention: 8,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_32',
      name: 'ישיבת נוה דקלים',
      shortName: 'נוה דקלים',
      area: 'דרום',
      areaGroup: 'דרום',
      description: 'ישיבת הסדר בעלת מורשת ההתיישבות בימית ובגוש קטיף, המדגישה תורת ארץ ישראל ופעילות קהילתית באשדוד.',
      profileTags: {
        military: 5,
        social_engagement: 8,
        cultural_openness: 5,
        conservatism_authority: 6,
        classic_study: 7,
        personal_attention: 7,
        physical_conditions: 5
      }
    },
    {
      id: 'yeshiva_33',
      name: 'ישיבת עתניאל',
      shortName: 'עתניאל',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'בית מדרש רבגוני ופתוח, המשלב עיון תלמודי עם חסידות, מחשבה, עבודת הנפש ודיון בין השקפות שונות.',
      profileTags: {
        military: 6,
        social_engagement: 8,
        cultural_openness: 9,
        conservatism_authority: 4,
        classic_study: 6,
        personal_attention: 4,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_34',
      name: 'ישיבת קדומים',
      shortName: 'קדומים',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבה קטנה ואינטימית בשומרון, בעלת רמה לימודית גבוהה ואווירה נינוחה עם דגש על התפתחות אישית.',
      profileTags: {
        military: 5,
        social_engagement: 2,
        cultural_openness: 3,
        conservatism_authority: 7,
        classic_study: 8,
        personal_attention: 6,
        physical_conditions: 5
      }
    },
    {
      id: 'yeshiva_35',
      name: 'ישיבת רעותא',
      shortName: 'רעותא',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבה במושב כרמל שבהר חברון, המשלבת מסלול הסדר וישיבה גבוהה, עם דגש על לימוד תורה הנובע מתוך החיים.',
      profileTags: {
        military: 6,
        social_engagement: 6,
        cultural_openness: 5,
        conservatism_authority: 7,
        classic_study: 6,
        personal_attention: 9,
        physical_conditions: 6
      }
    },
    {
      id: 'yeshiva_36',
      name: 'ישיבת שבי חברון',
      shortName: 'שבי חברון',
      area: 'יהודה ושומרון',
      areaGroup: 'יהודה ושומרון',
      description: 'ישיבה גדולה בעיר האבות, המזוהה עם תורת הרב קוק ושואפת להצמיח תלמידי חכמים ומנהיגות תורנית.',
      profileTags: {
        military: 8,
        social_engagement: 7,
        cultural_openness: 3,
        conservatism_authority: 9,
        classic_study: 9,
        personal_attention: 4,
        physical_conditions: 8
      }
    },
    {
      id: 'yeshiva_37',
      name: 'ישיבת שיח יצחק',
      shortName: 'שיח יצחק',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבה המזוהה עם הרב שג"ר, המדגישה חיפוש רוחני, כנות, חסידות ושיח פתוח עם העולם הפנימי והחיצוני.',
      profileTags: {
        military: 4,
        social_engagement: 6,
        cultural_openness: 10,
        conservatism_authority: 3,
        classic_study: 3,
        personal_attention: 8,
        physical_conditions: 3
      }
    },
    {
      id: 'yeshiva_38',
      name: 'ישיבת תקוע',
      shortName: 'תקוע',
      area: 'ירושלים והסביבה',
      areaGroup: 'ירושלים והסביבה',
      description: 'ישיבה בעלת אופי חסידי בהשראת הרב עדין שטיינזלץ, עם דגש על לימוד גמרא בעומק ובהיקף.',
      profileTags: {
        military: 4,
        social_engagement: 5,
        cultural_openness: 8,
        conservatism_authority: 4,
        classic_study: 3,
        personal_attention: 8,
        physical_conditions: 4
      }
    },
    {
      id: 'yeshiva_39',
      name: 'ישיבת מטיבתא',
      shortName: 'מטיבתא',
      area: 'צפון',
      areaGroup: 'צפון',
      description: 'ישיבת הסדר בכרמיאל המדגישה לימוד מעמיק, עבודת מידות, חבורה, אחריות אישית ורגישות לזולת.',
      profileTags: {
        military: 7,
        social_engagement: 9,
        cultural_openness: 8,
        conservatism_authority: 5,
        classic_study: 4,
        personal_attention: 8,
        physical_conditions: 7
      }
    },
    {
      id: 'yeshiva_40',
      name: 'מעלה גבלוע',
      shortName: 'מעלה גבלוע',
      area: 'צפון',
      areaGroup: 'צפון',
      description: '',
      profileTags: {
        military: 8,
        social_engagement: 5,
        cultural_openness: 10,
        conservatism_authority: 2,
        classic_study: 3,
        personal_attention: 6,
        physical_conditions: 7
      }
    }
  ]
};
