window.APP_DATA = {
  app: {
    title: 'מתאם הישיבות',
    subtitle: 'מצא את ההתאמה הטובה ביותר לישיבה על פי סגנון הלימוד, הערכים והיעדים שלך.'
  },
  questions: [
    {
      id: 'study_style',
      text: 'איזה סגנון לימוד מרגיש לך הכי טבעי?',
      options: [
        {
          id: 'deep_gemara',
          label: 'לימוד מעמיק בגמרא ובשיעורים עם ריכוז אינטלקטואלי רציני',
          tags: ['gemara', 'gavoa', 'intellectual_open', 'serious_learning']
        },
        {
          id: 'traditional_yeshiva',
          label: 'סביבה כשרה יותר, קלאסית וממוקדת בטקסט',
          tags: ['classical_haredi', 'gemara', 'yeshiva_ketana', 'traditional']
        },
        {
          id: 'modern_hesder',
          label: 'סגנון הסדר המשלב לימוד תורני עם שליחות לאומית',
          tags: ['hesder', 'gavoa', 'academic_integration', 'modern_israel']
        },
        {
          id: 'kollel_and_community',
          label: 'אווירה חמה, קהילתית וקצב לימוד יציב',
          tags: ['community', 'kollel', 'warm_thinking', 'torah_values']
        }
      ]
    },
    {
      id: 'learning_priority',
      text: 'מה חשוב לך ביותר בחוויית הישיבה?',
      options: [
        {
          id: 'rigor_and_depth',
          label: 'ריגור אקדמי והבנה עמוקה יותר',
          tags: ['gemara', 'academic', 'gavoa', 'serious_learning']
        },
        {
          id: 'community_and_values',
          label: 'אווירה קהילתית וצמיחה על בסיס ערכים',
          tags: ['community', 'torah_values', 'warm_thinking', 'mishpacha']
        },
        {
          id: 'army_and_civics',
          label: 'מסלול שמשלב לימוד עם שירות ומנהיגות',
          tags: ['hesder', 'academic_integration', 'modern_israel', 'leadership']
        },
        {
          id: 'formal_and_classical',
          label: 'דגם יותר מסודר, קלאסי ומסורתי',
          tags: ['classical_haredi', 'traditional', 'yeshiva_ketana', 'formal']
        }
      ]
    },
    {
      id: 'intellectual_style',
      text: 'איך אתה מעדיף להיחשף לרעיונות ולמקורות?',
      options: [
        {
          id: 'open_discussion',
          label: 'שיח פתוח, שאלות רחבות וסקרנות אינטלקטואלית',
          tags: ['intellectual_open', 'discussion', 'academic', 'modern']
        },
        {
          id: 'textual_precision',
          label: 'לימוד מדויק של הטקסט ושיטות ישיבתיות קלאסיות',
          tags: ['gemara', 'formal', 'traditional', 'serious_learning']
        },
        {
          id: 'practical_relevance',
          label: 'לימוד שמחבר לעולם המעשה ולמטרה אישית',
          tags: ['modern_israel', 'leadership', 'academic_integration', 'purpose']
        },
        {
          id: 'quiet_and_stable',
          label: 'סביבה שקטה ויציבה עם פחות רעש חיצוני',
          tags: ['community', 'kollel', 'quiet', 'warm_thinking']
        }
      ]
    },
    {
      id: 'daily_rhythm',
      text: 'איזה קצב יום מתאים לך יותר?',
      options: [
        {
          id: 'structured_schedule',
          label: 'יום מסודר עם בלוקי לימוד ברורים ואחריות',
          tags: ['gavoa', 'serious_learning', 'academic', 'formal']
        },
        {
          id: 'balanced_and_dynamic',
          label: 'קצב מאוזן שמשלב לימוד, צמיחה וקהילה',
          tags: ['community', 'academic_integration', 'modern_israel', 'leadership']
        },
        {
          id: 'classical_routine',
          label: 'שגרה קלאסית עם דפוסי לימוד מסורתיים',
          tags: ['classical_haredi', 'traditional', 'yeshiva_ketana', 'gemara']
        },
        {
          id: 'flexible_community',
          label: 'לוח זמנים גמיש יותר עם תרבות קהילתית חזקה',
          tags: ['community', 'warm_thinking', 'kollel', 'mishpacha']
        }
      ]
    }
  ],
  yeshivot: [
    {
      id: 'machanaim',
      name: 'ישיבת מכמנים',
      shortName: 'מכמנים',
      tagline: 'הסדר ולימוד רציני עם פתיחות מחשבתית',
      description:
        'דגם הסדר מתקדם שבו לימוד מעמיק בגמרא, רמה אקדמית גבוהה ומעורבות בעולם המודרני מתקיימים יחד באווירה חמימה ורצינית.',
      matchSummary:
        'התאמה טובה לתלמידים שמחפשים לימוד תורני רציני בלי לוותר על רוחב מחשבה, מנהיגות והזדהות עם העולם המודרני.',
      profileTags: {
        gemara: 2.8,
        gavoa: 2.7,
        hesder: 3.4,
        intellectual_open: 2.4,
        academic_integration: 2.6,
        community: 1.9,
        academic: 2.1,
        modern_israel: 2.2,
        serious_learning: 2.5,
        leadership: 1.8
      },
      boostRules: {
        enabled: true,
        baselineTags: ['hesder', 'gavoa', 'gemara', 'intellectual_open', 'community', 'academic_integration'],
        avoidanceTags: ['classical_haredi', 'yeshiva_ketana', 'kollel_only'],
        minMatches: 3,
        bonus: 4
      }
    },
    {
      id: 'merkaz_harav',
      name: 'ישיבת מרכז הרב',
      shortName: 'מרכז הרב',
      tagline: 'לימוד מסורתי עם עומק לאומי ומהותי',
      description:
        'מקום שעוצב על ידי ערכי תורה קלאסיים, מנהיגות מחשבתית וראייה רוחנית ברורה עם הרגלי לימוד עמוקים.',
      matchSummary:
        'התאמה מצוינת לתלמידים שמעריכים לימוד ברמה גבוהה, הכוונה דתית ועמק אידיאולוגי.',
      profileTags: {
        gemara: 3.1,
        gavoa: 2.6,
        traditional: 2.3,
        torah_values: 2.7,
        modern_israel: 1.8,
        leadership: 2.0,
        serious_learning: 2.8,
        academic: 1.7,
        intellectual_open: 1.9,
        community: 1.5
      },
      boostRules: {
        baselineTags: ['gemara', 'torah_values', 'gavoa', 'serious_learning'],
        avoidanceTags: ['quiet', 'kollel', 'modern'],
        minMatches: 3,
        bonus: 4
      }
    },
    {
      id: 'har_etzion',
      name: 'ישיבת הר עציון',
      shortName: 'הר עציון',
      tagline: 'לימוד מחמיר עם מעורבות אינטלקטואלית רחבה',
      description:
        'מכילה לימוד טקסטואלי חזק, תרבות אינטלקטואלית פתוחה, וסביבה מאוזנת ללומדים רציניים.',
      matchSummary:
        'התאמה טובה לתלמידים שרוצים לימוד חד, סביבה אינטלקטואלית עמוקה וקהילה משמעותית.',
      profileTags: {
        gemara: 3.0,
        gavoa: 2.5,
        intellectual_open: 2.8,
        academic: 2.5,
        serious_learning: 2.8,
        community: 2.1,
        discussion: 2.4,
        modern: 1.6,
        academic_integration: 2.1,
        leadership: 1.9
      },
      boostRules: {
        baselineTags: ['gemara', 'intellectual_open', 'academic', 'discussion'],
        avoidanceTags: ['yeshiva_ketana', 'kollel_only'],
        minMatches: 3,
        bonus: 5
      }
    },
    {
      id: 'yeshivat_aderet',
      name: 'ישיבת אדרת',
      shortName: 'אדרת',
      tagline: 'קהילה חמה ולימוד מעמיק',
      description:
        'ישיבה קהילתית ומזמינה, המאזנת בין עומק לימוד לבין צמיחה אישית ותרבות חברתית עשירה.',
      matchSummary:
        'התאמה טובה ללומדים המחפשים חמימות, קהילה וסביבה לימודית משמעותית בלי לוותר על רצינות.',
      profileTags: {
        community: 3.1,
        warm_thinking: 2.8,
        torah_values: 2.8,
        gemara: 2.1,
        gavoa: 1.9,
        kollel: 2.2,
        mishpacha: 2.5,
        quiet: 1.9,
        academic: 1.5,
        modern_israel: 1.4
      },
      boostRules: {
        baselineTags: ['community', 'warm_thinking', 'torah_values', 'kollel'],
        avoidanceTags: ['classical_haredi', 'formal'],
        minMatches: 3,
        bonus: 4
      }
    },
    {
      id: 'yeshiva_ketana',
      name: 'ישיבה קטנה',
      shortName: 'ישיבה קטנה',
      tagline: 'מסגרת לימוד קלאסית ומסורתית',
      description:
        'סביבה מסורתית ויותר מבנית, בנויה על דפוסי לימוד קלאסיים וחשיפה ישירה לטקסט.',
      matchSummary:
        'הכי מתאימה לתלמידים שמעדיפים מסגרת קלאסית, מסורתית וטקסט-ראשונית עם קצב לימוד ברור.',
      profileTags: {
        classical_haredi: 3.3,
        traditional: 3.1,
        yeshiva_ketana: 3.4,
        gemara: 2.5,
        formal: 2.2,
        community: 1.6,
        torah_values: 2.4,
        quiet: 1.7,
        kollel: 1.9
      },
      boostRules: {
        baselineTags: ['classical_haredi', 'traditional', 'yeshiva_ketana', 'formal'],
        avoidanceTags: ['hesder', 'academic_integration', 'modern_israel'],
        minMatches: 3,
        bonus: 5
      }
    }
  ]
};
