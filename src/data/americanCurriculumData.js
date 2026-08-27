// قاعدة بيانات المنهج الأمريكي المعتمد للمدارس والمجمعات التعليمية العالمية (American Curriculum - International Schools)
// متوافق مع معايير Common Core State Standards (CCSS) ومعايير العلوم للجيل القادم (NGSS)
// تشمل: English Language Arts, Mathematics, Science, Social Studies, Computer Science, Arabic & Islamic Studies, Saudi History

export const AMERICAN_CURRICULUM_DATA = {
  // -------------------------------------------------------------
  // 1. الفصل الأول / Semester 1 (Fall)
  // -------------------------------------------------------------
  "الفصل الدراسي الأول (Semester 1)": {
    "English Language Arts (ELA & Literature)": [
      {
        grade: "Elementary School (Grades 1-5)",
        unit: "Unit 1: Foundations of Reading & Narrative Craft",
        lesson: "Lesson: Central Idea, Character Analysis & Narrative Writing",
        objectives: [
          "Students will identify the main idea and key supporting details in informational and literary texts.",
          "Students will analyze character traits, motivations, and conflicts using direct text evidence (CCSS.ELA-LITERACY.RL.3.3).",
          "Students will write structured narrative paragraphs featuring a clear beginning, middle, climax, and resolution.",
          "Students will apply conventions of standard English grammar, including irregular verbs and pronoun-antecedent agreement.",
          "Students will decode multi-syllabic vocabulary words using context clues, prefixes, and root words."
        ]
      },
      {
        grade: "Middle School (Grades 6-8)",
        unit: "Unit 1: Expository Synthesis & Literary Devices",
        lesson: "Lesson: Theme Development, Figurative Language & Argumentative Claims",
        objectives: [
          "Students will cite strong and thorough textual evidence to support explicit inferences drawn from complex texts.",
          "Students will determine figurative, connotative, and technical meanings of words and phrases in literature.",
          "Students will construct a 5-paragraph argumentative essay stating a defensible claim, counterclaims, and solid evidence.",
          "Students will analyze how an author develops and contrasts the points of view of different characters or narrators.",
          "Students will participate collaboratively in structured academic discussions (Socratic Seminars) with evidence."
        ]
      },
      {
        grade: "High School (Grades 9-12 / AP Capstone)",
        unit: "Unit 1: Rhetorical Analysis & World Literature",
        lesson: "Lesson: Rhetorical Appeals (Ethos, Pathos, Logos) & Synthesis Essays",
        objectives: [
          "Students will evaluate rhetorical strategies, logical fallacies, and structural choices employed by classical and modern authors.",
          "Students will synthesize multiple primary and secondary sources to construct sophisticated academic research papers (MLA/APA format).",
          "Students will analyze seminal historical documents and literary masterworks for thematic coherence and stylistic mastery.",
          "Students will demonstrate command of advanced syntactic structures, voice, tone, and nuanced academic vocabulary.",
          "Students will defend or challenge philosophical perspectives in formal debate settings."
        ]
      }
    ],

    "Mathematics (Common Core Math)": [
      {
        grade: "Elementary School (Grades 1-5)",
        unit: "Unit 1: Numbers & Operations in Base Ten & Algebraic Thinking",
        lesson: "Lesson: Place Value Multi-Digit Operations & Fraction Foundations",
        objectives: [
          "Students will read, write, and compare decimals to thousandths using base-ten numerals and expanded form (CCSS.MATH.5.NBT.A.3).",
          "Students will fluently multiply and divide multi-digit whole numbers using standard algorithmic strategies.",
          "Students will generate equivalent fractions, simplify expressions, and locate fractions on number lines.",
          "Students will solve multi-step real-world word problems using arithmetic operations and algebraic bar models.",
          "Students will classify two-dimensional figures based on the presence or absence of parallel or perpendicular lines."
        ]
      },
      {
        grade: "Middle School (Pre-Algebra & Algebra I)",
        unit: "Unit 1: Ratios, Proportions & Linear Equations",
        lesson: "Lesson: Solving Multi-Step Linear Equations & Slope-Intercept Graphing",
        objectives: [
          "Students will solve linear equations and inequalities in one variable involving absolute values and fractional coefficients.",
          "Students will calculate the slope of a line from graphs, coordinates, and equations, interpreting the rate of change.",
          "Students will graph linear functions in slope-intercept (y = mx + b) and standard forms accurately.",
          "Students will model real-life proportional relationships with constant rates of proportionality.",
          "Students will evaluate algebraic expressions containing integer exponents and scientific notation."
        ]
      },
      {
        grade: "High School (Geometry, Algebra II & Pre-Calculus)",
        unit: "Unit 1: Coordinate Geometry, Polynomial Functions & Matrix Operations",
        lesson: "Lesson: Quadratic Equations, Transformations & Geometric Proofs",
        objectives: [
          "Students will solve quadratic equations using factoring, completing the square, and the Quadratic Formula with complex roots.",
          "Students will write formal deductive geometric proofs establishing congruency (SSS, SAS, ASA, AAS) and similarity.",
          "Students will graph and analyze polynomial and rational functions, determining end behavior, zeroes, and asymptotes.",
          "Students will perform matrix additions, multiplications, and determinant evaluations to solve systems of linear equations.",
          "Students will apply trigonometric ratios to solve right and oblique triangles using the Law of Sines and Law of Cosines."
        ]
      }
    ],

    "Science (NGSS - Next Generation Science Standards)": [
      {
        grade: "Elementary & Middle School (Integrated Sciences)",
        unit: "Unit 1: Matter, Energy Dynamics & Cell Structures",
        lesson: "Lesson: Cellular Organelles, Photosynthesis & States of Matter",
        objectives: [
          "Students will develop and use models to describe the atomic composition of simple molecules and extended structures (NGSS MS-PS1-1).",
          "Students will contrast plant and animal cell organelles and explain their specialized biological functions.",
          "Students will trace the flow of energy and matter through ecosystems via photosynthesis and cellular respiration.",
          "Students will design and execute controlled scientific investigations, recording quantitative and qualitative data.",
          "Students will formulate evidence-based explanations connecting thermal energy transfer to phase changes."
        ]
      },
      {
        grade: "High School (Biology, Chemistry & Physics)",
        unit: "Unit 1: Cellular Energetics, Chemical Bonding & Newtonian Mechanics",
        lesson: "Lesson: Molecular Genetics / Stoichiometric Calculations / Kinematics",
        objectives: [
          "Students will explain the mechanisms of DNA replication, transcription, and translation leading to protein synthesis (HS-LS1-1).",
          "Students will calculate molar mass, percent yield, and limiting reactants in complex chemical reactions.",
          "Students will model ionic, covalent, and metallic bonding through Lewis structures and VSEPR geometry.",
          "Students will analyze 1D and 2D kinematic motion using vectors, velocity-time graphs, and projectile trajectories.",
          "Students will verify Newton's Laws of Motion through laboratory experiments and mathematical force diagrams."
        ]
      }
    ],

    "Social Studies & World History": [
      {
        grade: "Elementary, Middle & High School",
        unit: "Unit 1: World Geography, Ancient Civilizations & Global Governance",
        lesson: "Lesson: Geographical Systems, Cradle of Civilizations & Global Trade",
        objectives: [
          "Students will analyze the physical and human geography of world regions using thematic maps, GIS, and demographic charts.",
          "Students will examine the political, economic, and cultural contributions of ancient civilizations (Mesopotamia, Nile Valley, Indus).",
          "Students will evaluate the causes and global impacts of historical trade networks (The Silk Road, Maritime Routes).",
          "Students will compare different systems of government (Constitutional Republics, Monarchies, Democracies).",
          "Students will assess global economic interdependence and contemporary geopolitical challenges."
        ]
      }
    ],

    "Computer Science & ICT (Digital Literacy)": [
      {
        grade: "All Grades (K-12)",
        unit: "Unit 1: Computational Thinking, Coding & Cybersecurity",
        lesson: "Lesson: Python Algorithms, Object-Oriented Programming & Web Tech",
        objectives: [
          "Students will write clean, documented code in Python using data structures, loops, functions, and conditional logic.",
          "Students will design responsive web pages incorporating HTML5 semantics, modern CSS styling, and JavaScript event handlers.",
          "Students will evaluate cybersecurity threats, encryption techniques, and best practices for personal data protection.",
          "Students will decompose complex computational problems into reusable algorithmic components.",
          "Students will explore ethical considerations surrounding Artificial Intelligence, automation, and digital privacy."
        ]
      }
    ],

    "Arabic & Islamic Studies for International Schools (البرامج المعتمدة)": [
      {
        grade: "International School Program",
        unit: "الوحدة الأولى: اللغة العربية والدراسات الإسلامية للمدارس العالمية",
        lesson: "درس: مهارات القراءة والكتابة العربية والقيم الأخلاقية الإسلامية",
        objectives: [
          "Students will read Arabic literary texts fluently with accurate pronunciation and phonetic awareness.",
          "Students will formulate correct Arabic nominal and verbal sentences adhering to standard grammar.",
          "Students will articulate core Islamic pillars, moral values, and tolerance from prophetic traditions.",
          "Students will write concise essays in Arabic demonstrating proper vocabulary and grammatical structures.",
          "Students will appreciate the rich cultural and literary heritage of the Arab and Islamic world."
        ]
      }
    ],

    "Saudi History & Cultural Studies in English (تاريخ المملكة للمدارس العالمية)": [
      {
        grade: "International Curriculum",
        unit: "Unit 1: Heritage & History of the Kingdom of Saudi Arabia",
        lesson: "Lesson: Unification of Saudi Arabia, Vision 2030 & Giga-Projects",
        objectives: [
          "Students will outline the key historical milestones in the unification of Saudi Arabia under King Abdulaziz.",
          "Students will identify the geographical landmarks, strategic waterways, and natural resources of the Kingdom.",
          "Students will analyze the economic and cultural transformation pillars outlined in Saudi Vision 2030 (NEOM, Red Sea, Qiddiya).",
          "Students will showcase the Kingdom's leadership in global energy markets and humanitarian international initiatives.",
          "Students will present research on UNESCO World Heritage Sites across Saudi Arabia (Al-Ula, Diriyah, Historic Jeddah)."
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // 2. الفصل الثاني / Semester 2 (Spring)
  // -------------------------------------------------------------
  "الفصل الدراسي الثاني (Semester 2)": {
    "English Language Arts (ELA & Literature)": [
      {
        grade: "Elementary & Middle School",
        unit: "Unit 2: Poetry, Informational Synthesis & Persuasive Writing",
        lesson: "Lesson: Poetic Structures, Author's Purpose & Persuasive Speeches",
        objectives: [
          "Students will analyze sound devices (alliteration, onomatopoeia, rhythm, rhyme) in diverse poetic forms.",
          "Students will synthesize information from multiple digital and print sources to answer complex research questions.",
          "Students will write an effective persuasive speech with credible supporting arguments and emotional appeals.",
          "Students will deliver oral presentations using clear articulation, visual aids, and interactive digital media.",
          "Students will edit written work for syntactic variety, punctuation, transitions, and academic register."
        ]
      },
      {
        grade: "High School (AP Literature & Composition)",
        unit: "Unit 2: Dramatic Analysis, Modernist Prose & Literary Research",
        lesson: "Lesson: Shakespearean Drama, Symbolism & Comparative Research Paper",
        objectives: [
          "Students will perform in-depth literary analysis of classical drama (Shakespeare, Arthur Miller) exploring subtext and tragedy.",
          "Students will trace universal archetypes, motifs, and symbols across various multicultural literary traditions.",
          "Students will construct a comprehensive 8-page literary research paper adhering to rigorous scholarly citation standards.",
          "Students will defend interpretive theses through close textual analysis during formal round-table critiques.",
          "Students will critique contemporary media and journalistic pieces for bias, rhetoric, and visual messaging."
        ]
      }
    ],

    "Mathematics (Common Core Math)": [
      {
        grade: "Elementary & Middle School",
        unit: "Unit 2: Geometry, Measurement, Data & Probability",
        lesson: "Lesson: Area, Volume, Coordinate Graphing & Statistical Measures",
        objectives: [
          "Students will calculate the surface area and volume of rectangular prisms, cylinders, and composite 3D solids.",
          "Students will plot points, interpret distances, and perform translations on Cartesian coordinate grids.",
          "Students will summarize numerical data sets in relation to their context (Mean, Median, Mode, Interquartile Range, Box Plots).",
          "Students will determine the experimental and theoretical probability of independent and dependent compound events.",
          "Students will solve real-world geometry problems involving angle relationships (complementary, supplementary, vertical)."
        ]
      },
      {
        grade: "High School (Pre-Calculus & AP Calculus / Statistics)",
        unit: "Unit 2: Limits, Derivatives, Integrals & Inferential Statistics",
        lesson: "Lesson: Derivatives, Optimization, Integrals & Hypothesis Testing",
        objectives: [
          "Students will evaluate limits algebraically and determine the continuity of piecewise and rational functions.",
          "Students will compute derivatives using power, product, quotient, and chain rules to solve optimization and rate problems.",
          "Students will evaluate definite and indefinite integrals to determine areas under curves and physical displacements.",
          "Students will perform statistical hypothesis testing (Z-test, T-test, Chi-Square) and interpret p-values and confidence intervals.",
          "Students will apply mathematical modeling to real-world engineering, financial, and physical scenarios."
        ]
      }
    ],

    "Science (NGSS - Next Generation Science Standards)": [
      {
        grade: "All Grades (K-12 Sciences)",
        unit: "Unit 2: Waves, Thermodynamics, Genetics & Environmental Sustainability",
        lesson: "Lesson: Electromagnetic Spectrum, Inheritance Patterns & Ecology",
        objectives: [
          "Students will model wave properties (frequency, wavelength, amplitude) and behavior (reflection, refraction, diffraction).",
          "Students will predict genetic inheritance outcomes using Punnett squares and analyze human pedigree charts.",
          "Students will evaluate the human impact on global climate systems and propose engineering solutions for carbon reduction.",
          "Students will construct thermodynamic arguments relating enthalpy, entropy, and Gibbs free energy to reaction spontaneity.",
          "Students will design and test an engineering prototype that mitigates an environmental challenge."
        ]
      }
    ],

    "Social Studies, ICT & World Languages": [
      {
        grade: "International Curriculum",
        unit: "Unit 2: Modern Global Affairs, Innovation & Cultural Diplomacy",
        lesson: "Lesson: Model United Nations, Cloud Technologies & Global Economy",
        objectives: [
          "Students will simulate international diplomacy through Model United Nations (MUN) caucus debates and resolutions.",
          "Students will deploy cloud-based software architectures and explore modern database management systems.",
          "Students will examine macro-economic indicators (GDP, Inflation, Trade Balance) shaping 21st-century globalization.",
          "Students will synthesize learning across multiple disciplines in a capstone interdisciplinary portfolio.",
          "Students will demonstrate global citizenship, cross-cultural competence, and collaborative leadership."
        ]
      }
    ]
  }
};

export default AMERICAN_CURRICULUM_DATA;
