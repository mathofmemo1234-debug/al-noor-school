// =========================================================================
// American International Curriculum Standards (CCSS & NGSS)
// Full, comprehensive textbook and standards index for International Schools
// Segregated strictly into Elementary (Grades 1-5), Middle (Grades 6-8), and High School (Grades 9-12 / AP)
// =========================================================================

export const AMERICAN_STAGES = {
  ELEMENTARY: 'Elementary School (Grades 1-5)',
  MIDDLE: 'Middle School (Grades 6-8)',
  HIGH: 'High School (Grades 9-12)'
};

export const AMERICAN_CURRICULUM_STRICT = {
  // =========================================================================
  // 1. Elementary School (Grades 1 - 5)
  // =========================================================================
  [AMERICAN_STAGES.ELEMENTARY]: {
    "الفصل الدراسي الأول (Semester 1)": {
      "English Language Arts (ELA Elementary)": [
        {
          grade: "Elementary (Grades 1-3)",
          unit: "Unit 1: Phonics, Decoding, Fluency & Basic Reading Comprehension",
          lesson: "Lesson: Short & Long Vowels, Blends, Digraphs, Sight Words & Story Elements",
          objectives: [
            "Students will decode regularly spelled one- and two-syllable words with short and long vowel patterns (CCSS.ELA-LITERACY.RF.2.3).",
            "Students will identify key story elements (characters, setting, conflict, plot resolution) in diverse literary texts.",
            "Students will recount stories, including fables and folktales, and determine their central message or moral.",
            "Students will write narrative pieces recounting an event with temporal transition words and descriptive sensory details.",
            "Students will demonstrate standard command of capitalization, end punctuation, and spelling of high-frequency words."
          ]
        },
        {
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 1: Expository Text Analysis, Structural Writing & Grammar",
          lesson: "Lesson: Main Idea, Text Evidence, Inferences & Structured 5-Paragraph Essays",
          objectives: [
            "Students will cite textual evidence to explain what the text says explicitly and draw logical inferences (CCSS.ELA-LITERACY.RI.4.1).",
            "Students will determine the main idea of an informational text and explain how it is supported by key details.",
            "Students will write informative/explanatory texts to examine a topic and convey ideas and information clearly.",
            "Students will use progressive verb tenses, relative pronouns, and prepositional phrases accurately in academic prose.",
            "Students will consult print and digital reference materials to verify pronunciation and precise word definitions."
          ]
        }
      ],

      "Mathematics (Common Core Elementary)": [
        {
          grade: "Elementary (Grades 1-3)",
          unit: "Unit 1: Operations in Base Ten, Place Value & Foundations of Multiplication",
          lesson: "Lesson: Place Value to 1,000, Multi-Digit Addition/Subtraction & Multiplication Arrays",
          objectives: [
            "Students will understand that the digits of a three-digit number represent amounts of hundreds, tens, and ones (CCSS.MATH.2.NBT.A.1).",
            "Students will fluently add and subtract within 1,000 using strategies based on place value, properties, and algorithms.",
            "Students will interpret products of whole numbers (e.g., 5 × 7 as the total number of objects in 5 equal groups of 7).",
            "Students will solve two-step real-world word problems using addition, subtraction, multiplication, and estimation.",
            "Students will recognize and categorize 2D geometric shapes based on their attributes (angles, vertices, parallel sides)."
          ]
        },
        {
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 1: Multi-Digit Arithmetic, Factors, Multiples & Fraction Operations",
          lesson: "Lesson: Multi-Digit Multiplication & Division, Fraction Equivalence & Operations",
          objectives: [
            "Students will multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers using standard algorithms.",
            "Students will find whole-number quotients and remainders with up to four-digit dividends and two-digit divisors.",
            "Students will explain why a fraction a/b is equivalent to (n × a)/(n × b) using visual fraction models.",
            "Students will add and subtract fractions and mixed numbers with unlike denominators by replacing them with equivalent fractions.",
            "Students will read, write, compare, and round decimals to thousandths using standard, word, and expanded forms."
          ]
        }
      ],

      "NGSS Elementary Science": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Life Structures, Ecosystems, Forces and Motion & Earth Systems",
          lesson: "Lesson: Organism Life Cycles, Habitats, Balanced/Unbalanced Forces & Weather Patterns",
          objectives: [
            "Students will develop models to describe that organisms have unique and diverse life cycles and inherited traits (NGSS 3-LS1-1).",
            "Students will construct an evidence-based argument that in a particular habitat some organisms can survive well and some cannot.",
            "Students will plan and conduct an investigation to provide evidence of the effects of balanced and unbalanced forces on an object's motion.",
            "Students will represent meteorological data in tables and graphical displays to describe typical weather conditions expected during a season.",
            "Students will identify evidence from rock formations and fossils in rock layers to explain historical changes in landscapes over geological time."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "Elementary Comprehensive Electives": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 2: Measurement, Volume, Geometry, Ecosystem Energy Flow & Opinion Speeches",
          lesson: "Lesson: Perimeter and Area / Food Chains and Decomposers / Persuasive Presentations",
          objectives: [
            "Students will apply perimeter and area formulas for rectangles in real-world mathematical problems.",
            "Students will trace the flow of energy in an ecosystem from sunlight through producers, primary/secondary consumers, to decomposers.",
            "Students will write opinion pieces on topics or texts, supporting a point of view with reasons and factual information.",
            "Students will deliver oral multimedia presentations speaking clearly at an understandable pace."
          ]
        }
      ]
    }
  },

  // =========================================================================
  // 2. Middle School (Grades 6 - 8)
  // =========================================================================
  [AMERICAN_STAGES.MIDDLE]: {
    "الفصل الدراسي الأول (Semester 1)": {
      "English Language Arts (ELA Middle School)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Literary Analysis, Argumentation, Rhetorical Devices & Research Writing",
          lesson: "Lesson: Textual Evidence, Thematic Analysis, Counterclaims & Formal MLA Essays",
          objectives: [
            "Students will cite several pieces of textual evidence to support analysis of explicit and inferential meaning in texts (CCSS.ELA-LITERACY.RL.7.1).",
            "Students will determine a theme or central idea of a text and analyze its development over the course of the text.",
            "Students will write arguments to support claims with clear reasons, relevant empirical evidence, and credible counterclaims.",
            "Students will analyze how an author's choice of point of view shapes the content, style, and tone of a narrative.",
            "Students will engage collaboratively in Socratic seminars, presenting arguments with poise, clarity, and active listening."
          ]
        }
      ],

      "Mathematics (Pre-Algebra & Algebra I)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: The Number System, Ratios, Proportions & Solving Linear Equations",
          lesson: "Lesson: Unit Rates, Multi-Step Equations, Inequalities & Slope-Intercept Form",
          objectives: [
            "Students will compute unit rates associated with ratios of fractions and analyze proportional relationships in tables and graphs (CCSS.MATH.7.RP.A.1).",
            "Students will solve multi-step linear equations and inequalities in one variable with rational coefficients using inverse operations.",
            "Students will graph proportional linear relationships, interpreting the unit rate as the slope of the graph (y = mx + b).",
            "Students will apply the Pythagorean Theorem to find missing side lengths in right triangles and distances on coordinate planes.",
            "Students will summarize numerical data sets (Mean, Median, Interquartile Range, Box Plots) in relation to their context."
          ]
        }
      ],

      "Biology Focus (NGSS Middle School Life Science)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: From Molecules to Organisms: Structures and Processes",
          lesson: "Lesson: Cell Organelles, Photosynthesis, Cellular Respiration & Human Body Systems",
          objectives: [
            "Students will conduct an investigation to provide evidence that living things are made of cells (NGSS MS-LS1-1).",
            "Students will develop and use a model to describe the function of a cell as a whole and ways parts of cells contribute to the function.",
            "Students will construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and energy.",
            "Students will develop a model to describe how food is rearranged through chemical reactions forming new molecules that support growth.",
            "Students will gather and synthesize information that sensory receptors respond to stimuli by sending messages to the brain."
          ]
        }
      ],

      "Physical Science Focus (NGSS Middle School Physics & Chemistry)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Matter and Its Interactions, Forces and Motion",
          lesson: "Lesson: Atomic Models, Chemical Reactions, Newton's Laws of Motion & Energy Conservation",
          objectives: [
            "Students will develop models to describe the atomic composition of simple molecules and extended crystal structures (NGSS MS-PS1-1).",
            "Students will analyze and interpret data on the properties of substances before and after substances interact to determine if a reaction occurred.",
            "Students will apply Newton’s Third Law to design a solution to a problem involving the motion of two colliding objects.",
            "Students will plan an investigation to determine the relationships among energy transferred, mass, and temperature change."
          ]
        }
      ],

      "Earth & Space Science Focus (NGSS Middle School)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Earth's Place in the Universe & Geoscience Systems",
          lesson: "Lesson: Lunar Cycles, Solar System Scale, Plate Tectonics & Natural Hazard Forecasting",
          objectives: [
            "Students will develop and use a model of the Earth-sun-moon system to describe the cyclic patterns of lunar phases, eclipses, and seasons.",
            "Students will construct an explanation based on evidence for how geoscience processes have changed Earth’s surface at varying time and spatial scales.",
            "Students will analyze and interpret data on natural hazards to forecast future catastrophic events and inform technological mitigation."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "Middle School Comprehensive STEM & Humanities": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 2: Systems of Linear Equations, Genetics, World Geography & Python Coding",
          lesson: "Lesson: Solving Linear Systems / Punnett Squares / Structured Python Programming",
          objectives: [
            "Students will solve systems of two linear equations in two variables algebraically and graphically.",
            "Students will develop Punnett square models to explain how genetic variation results from sexual reproduction.",
            "Students will write structured Python programs using variables, conditionals, loops, and custom functions.",
            "Students will design and defend an interdisciplinary STEM capstone project."
          ]
        }
      ]
    }
  },

  // =========================================================================
  // 3. High School (Grades 9 - 12)
  // =========================================================================
  [AMERICAN_STAGES.HIGH]: {
    "الفصل الدراسي الأول (Semester 1)": {
      "English Language Arts (High School Literature & AP Capstone)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Rhetorical Analysis, World Literature & Scholarly Synthesis",
          lesson: "Lesson: Rhetorical Appeals (Ethos, Pathos, Logos), Literary Criticism & AP Research Essays",
          objectives: [
            "Students will determine an author’s point of view or purpose in a text and analyze how style and content contribute to the power and persuasiveness (CCSS.ELA-LITERACY.RI.11-12.6).",
            "Students will synthesize findings from multiple authoritative print and digital sources in academic papers adhering to MLA/APA citations.",
            "Students will write analytical research papers defending a nuanced thesis with contextualized textual evidence.",
            "Students will critique the logical validity of premises, inferences, and conclusions in classical and modern political documents.",
            "Students will participate in formal parliamentary debates and deliver persuasive presentations."
          ]
        }
      ],

      "Mathematics (Geometry, Algebra II, Pre-Calculus & AP Calculus)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Quadratic Functions, Geometric Proofs, Unit Circle Trigonometry & Limits",
          lesson: "Lesson: Complex Numbers, Coordinate Proofs, Trigonometric Identities & Differential Calculus",
          objectives: [
            "Students will solve quadratic equations with real and complex roots using factoring, completing the square, and the Quadratic Formula.",
            "Students will prove formal geometric theorems about lines, angles, triangles, and parallelograms deductively.",
            "Students will evaluate trigonometric functions of any angle using the Unit Circle and prove Pythagorean trigonometric identities.",
            "Students will analyze polynomial, rational, and exponential functions, determining domains, asymptotes, and end behavior.",
            "Students will calculate limits of functions algebraically and define the derivative as the limit of a difference quotient."
          ]
        }
      ],

      "Biology (NGSS High School & AP Biology)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Cellular Biochemistry, Molecular Genetics & Evolutionary Dynamics",
          lesson: "Lesson: Macromolecules, Enzyme Kinetics, DNA Replication, Transcription & Translation",
          objectives: [
            "Students will construct an explanation based on evidence for how the structure of DNA determines the structure of proteins (NGSS HS-LS1-1).",
            "Students will develop and use a model to illustrate the hierarchical organization of interacting systems that provide specific functions within multicellular organisms.",
            "Students will explain the catalytic mechanisms of enzymes and how environmental factors (pH, temperature, substrate concentration) alter reaction rates.",
            "Students will simulate the processes of transcription, RNA processing, and translation in eukaryotic vs. prokaryotic cells.",
            "Students will analyze genetic pedigrees and apply the Hardy-Weinberg equilibrium equation to calculate allele frequencies in populations."
          ]
        }
      ],

      "Chemistry (NGSS High School & AP Chemistry)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Atomic Structure, Chemical Bonding, Stoichiometry & Molecular Geometry",
          lesson: "Lesson: Periodic Trends, Lewis Structures, VSEPR Geometry & Stoichiometric Calculations",
          objectives: [
            "Students will use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level (NGSS HS-PS1-1).",
            "Students will construct and revise an explanation for the outcome of a simple chemical reaction based on outermost electron states, trends in the periodic table, and chemical properties.",
            "Students will use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction (stoichiometric mole-to-mole and mass-to-mass calculations).",
            "Students will plan and conduct investigations to gather evidence to compare the structure of substances at the bulk scale to infer the strength of electrical forces between particles.",
            "Students will evaluate experimental laboratory data to determine percent yield, empirical formulas, and titration equivalence points."
          ]
        }
      ],

      "Physics (NGSS High School & AP Physics)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: 1D & 2D Kinematics, Dynamics, Momentum & Conservation of Energy",
          lesson: "Lesson: Vector Kinematics, Newton's Laws, Free-Body Diagrams, Work-Energy Theorem & Collisions",
          objectives: [
            "Students will analyze data to support the claim that Newton’s second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration (NGSS HS-PS2-1).",
            "Students will use mathematical representations to show that the total momentum of a system of objects is conserved when there is no net force on the system.",
            "Students will apply scientific and engineering ideas to design, evaluate, and refine a device that minimizes the force on a macroscopic object during a collision.",
            "Students will create a computational model to calculate the change in the energy of one component in a system when the change in energy of the other component(s) and energy flows in and out of the system are known.",
            "Students will solve multi-step 2D projectile motion problems utilizing kinematic vector equations."
          ]
        }
      ],

      "Environmental Science (NGSS & AP Environmental)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Earth Systems, Biogeochemical Cycles, Population Dynamics & Sustainability",
          lesson: "Lesson: Biogeochemical Cycles, Population Ecology, Energy Resources & Climate Mitigation",
          objectives: [
            "Students will construct an explanation based on evidence for how geoscience processes have changed Earth's surface and biosphere.",
            "Students will evaluate competing design solutions for developing, managing, and utilizing energy and mineral resources based on cost-benefit ratios (NGSS HS-ESS3-2).",
            "Students will create a computational simulation to illustrate the relationships among management of natural resources, the sustainability of human populations, and biodiversity.",
            "Students will evaluate and synthesize empirical data regarding global carbon emissions, atmospheric feedback loops, and renewable energy transitions."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "High School Advanced Electives & AP Standards": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Calculus Integrals, Thermodynamics, Chemical Equilibrium & Electromagnetism",
          lesson: "Lesson: Derivatives & Integrals / Le Chatelier's Principle / Faraday's Induction & Optics",
          objectives: [
            "Students will apply Le Chatelier’s Principle and thermodynamic Gibbs free energy calculations to chemical equilibrium.",
            "Students will explain electromagnetic induction, Faraday’s Law, Lenz's Law, and modern electrical grid technologies.",
            "Students will compute definite integrals to evaluate areas under curves and physical work done.",
            "Students will conduct an independent scientific research thesis with experimental design and formal defense."
          ]
        }
      ]
    }
  }
};

export default AMERICAN_CURRICULUM_STRICT;
