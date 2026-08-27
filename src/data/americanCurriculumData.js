// قاعدة بيانات المنهج الأمريكي المعتمد للمدارس العالمية (American Curriculum - CCSS & NGSS)
// تصنيف صارم ومفصول 100% لمناهج العلوم:
// (Biology | Chemistry | Physics | Environmental Science | Middle School Science | Elementary Science)

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
          unit: "Unit 1: Phonics, Decoding & Basic Reading Comprehension",
          lesson: "Lesson: Short & Long Vowels, Sight Words & Story Elements",
          objectives: [
            "Students will decode words with short and long vowel patterns and common vowel teams (CCSS.ELA-LITERACY.RF.2.3).",
            "Students will identify the central message, lesson, or moral in diverse folktales and fables (RL.2.2).",
            "Students will describe characters, settings, and major events in a story using key illustrations and text details.",
            "Students will write short narrative pieces recounting a well-elaborated event with temporal words."
          ]
        },
        {
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 1: Expository Text Structure & Narrative Craft",
          lesson: "Lesson: Main Idea, Supporting Details & Structured Paragraph Writing",
          objectives: [
            "Students will explain what a text says explicitly and draw inferences from the text (CCSS.ELA-LITERACY.RI.4.1).",
            "Students will determine the main idea of an informational text and explain how it is supported by key details.",
            "Students will write informative/explanatory essays introducing a topic clearly, grouping related information in paragraphs."
          ]
        }
      ],

      "Mathematics (Common Core Elementary)": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Operations in Base Ten, Multiplication & Fractions",
          lesson: "Lesson: Place Value to 1,000,000, Multi-Digit Arithmetic & Fraction Equivalence",
          objectives: [
            "Students will understand place value relationships and fluently perform multi-digit operations.",
            "Students will solve multi-step word problems using the four operations with whole numbers and fractions.",
            "Students will explain fraction equivalence and perform addition and subtraction of fractions with unlike denominators."
          ]
        }
      ],

      // فصل العلوم الابتدائية
      "NGSS Elementary Life & Physical Science": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Ecosystems, Organism Structures & Energy Transfer",
          lesson: "Lesson: Plant & Animal Life Cycles, Habitats & Properties of Matter",
          objectives: [
            "Students will develop models to describe that organisms have unique and diverse life cycles (NGSS 3-LS1-1).",
            "Students will construct an argument with evidence that in a particular habitat some organisms can survive well and some cannot.",
            "Students will plan and conduct investigations to describe and classify different kinds of materials by observable properties.",
            "Students will represent data in tables and graphical displays to describe typical weather conditions expected during a season."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "Elementary Comprehensive Subjects": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 2: Measurement, Geometry, Earth Systems & Scientific Inquiry",
          lesson: "Lesson: Earth Landscapes, Forces and Motion & Opinion Speeches",
          objectives: [
            "Students will identify evidence from patterns in rock formations and fossils to explain changes in landscapes over time.",
            "Students will plan investigations to provide evidence of the effects of balanced and unbalanced forces on motion.",
            "Students will deliver oral presentations using clear articulation and visual multimedia."
          ]
        }
      ]
    }
  },

  // =========================================================================
  // 2. Middle School (Grades 6 - 8) - فصل مقررات العلوم
  // =========================================================================
  [AMERICAN_STAGES.MIDDLE]: {
    "الفصل الدراسي الأول (Semester 1)": {
      "English Language Arts (ELA Middle School)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Literary Analysis & Argumentative Writing",
          lesson: "Lesson: Citing Textual Evidence, Theme Analysis & 5-Paragraph Essays",
          objectives: [
            "Students will cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences (CCSS.ELA.RL.7.1).",
            "Students will determine a theme or central idea of a text and analyze its development over the course of the text.",
            "Students will write arguments to support claims with clear reasons, relevant evidence, and credible counterclaims."
          ]
        }
      ],

      "Mathematics (Pre-Algebra & Algebra I)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Ratios, Proportions & Solving Linear Equations",
          lesson: "Lesson: Unit Rates, Multi-Step Equations & Slope-Intercept Graphing",
          objectives: [
            "Students will compute unit rates associated with ratios of fractions and analyze proportional relationships.",
            "Students will solve multi-step linear equations and inequalities in one variable with rational coefficients.",
            "Students will graph proportional relationships, interpreting the unit rate as the slope of the graph (y = mx + b)."
          ]
        }
      ],

      // فصل العلوم للمرحلة المتوسطة
      "NGSS Middle School Life Science (Biology Focus)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: From Molecules to Organisms: Structures and Processes",
          lesson: "Lesson: Cell Theory, Cellular Respiration, Photosynthesis & Human Body Systems",
          objectives: [
            "Students will conduct an investigation to provide evidence that living things are made of cells (NGSS MS-LS1-1).",
            "Students will develop and use a model to describe the function of a cell as a whole and ways parts of cells contribute to the function.",
            "Students will construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and energy.",
            "Students will develop a model to describe how food is rearranged through chemical reactions forming new molecules that support growth.",
            "Students will gather and synthesize information that sensory receptors respond to stimuli by sending messages to the brain."
          ]
        }
      ],

      "NGSS Middle School Physical Science (Physics & Chemistry Focus)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Matter and Its Interactions, Forces and Motion",
          lesson: "Lesson: Atomic Structure, Chemical Reactions, Newton's Laws & Conservation of Energy",
          objectives: [
            "Students will develop models to describe the atomic composition of simple molecules and extended crystal structures (NGSS MS-PS1-1).",
            "Students will analyze and interpret data on the properties of substances before and after substances interact to determine if a reaction occurred.",
            "Students will apply Newton’s Third Law to design a solution to a problem involving the motion of two colliding objects.",
            "Students will plan an investigation to determine the relationships among the energy transferred, the type of matter, the mass, and temperature change."
          ]
        }
      ],

      "NGSS Middle School Earth & Space Science": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Earth's Place in the Universe & Geoscience Systems",
          lesson: "Lesson: Lunar Phases, Solar System Scale, Plate Tectonics & Natural Hazards",
          objectives: [
            "Students will develop and use a model of the Earth-sun-moon system to describe the cyclic patterns of lunar phases, eclipses, and seasons.",
            "Students will construct an explanation based on evidence for how geoscience processes have changed Earth’s surface at varying time and spatial scales.",
            "Students will analyze and interpret data on natural hazards to forecast future catastrophic events and inform the development of technologies to mitigate their effects."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "Middle School Comprehensive Subjects": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 2: Systems of Equations, Genetics, World Geography & Coding",
          lesson: "Lesson: Solving Systems of Linear Equations / Punnett Squares / Python Coding",
          objectives: [
            "Students will solve systems of two linear equations in two variables algebraically and graphically.",
            "Students will develop Punnett square models to describe why asexual reproduction results in offspring with identical genes while sexual reproduction results in genetic variation.",
            "Students will write structured Python programs using variables, conditionals, loops, and custom functions."
          ]
        }
      ]
    }
  },

  // =========================================================================
  // 3. High School (Grades 9 - 12) - فصل صارم وكامل لتخصصات العلوم
  // =========================================================================
  [AMERICAN_STAGES.HIGH]: {
    "الفصل الدراسي الأول (Semester 1)": {
      
      // 1. English Language Arts
      "English Language Arts (High School Literature & AP Capstone)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Rhetorical Strategies & Scholarly Research",
          lesson: "Lesson: Rhetorical Appeals (Ethos, Pathos, Logos) & Academic Synthesis",
          objectives: [
            "Students will determine an author’s point of view or purpose in a text and analyze how style and content contribute to the power and persuasiveness.",
            "Students will synthesize findings from multiple authoritative print and digital sources in academic papers adhering to MLA/APA citations."
          ]
        }
      ],

      // 2. Mathematics
      "Mathematics (Geometry, Algebra II, Pre-Calculus & AP Calculus)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Quadratic Functions, Geometric Proofs & Trigonometric Identities",
          lesson: "Lesson: Complex Numbers, Coordinate Proofs, Unit Circle & Limits",
          objectives: [
            "Students will solve quadratic equations with real and complex roots using factoring, completing the square, and the Quadratic Formula.",
            "Students will prove formal geometric theorems about lines, angles, triangles, and parallelograms deductively.",
            "Students will evaluate trigonometric functions of any angle using the Unit Circle and prove Pythagorean identities."
          ]
        }
      ],

      // 3. Biology (Separated)
      "Biology (NGSS High School & AP Biology)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Cellular Biochemistry, Molecular Genetics & Evolutionary Biology",
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

      // 4. Chemistry (Separated)
      "Chemistry (NGSS High School & AP Chemistry)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Atomic Structure, Chemical Bonding & Stoichiometry",
          lesson: "Lesson: Periodic Trends, Lewis Structures, VSEPR Geometry & Limiting Reactants",
          objectives: [
            "Students will use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level (NGSS HS-PS1-1).",
            "Students will construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms, trends in the periodic table, and knowledge of the patterns of chemical properties.",
            "Students will use mathematical representations to support the claim that atoms, and therefore mass, are conserved during a chemical reaction (stoichiometric mole-to-mole and mass-to-mass calculations).",
            "Students will plan and conduct investigations to gather evidence to compare the structure of substances at the bulk scale to infer the strength of electrical forces between particles.",
            "Students will evaluate experimental laboratory data to determine percent yield, empirical formulas, and titration equivalence points."
          ]
        }
      ],

      // 5. Physics (Separated)
      "Physics (NGSS High School & AP Physics)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: 1D & 2D Kinematics, Dynamics & Conservation of Momentum and Energy",
          lesson: "Lesson: Vector Kinematics, Newton's Laws, Free-Body Diagrams, Work-Energy Theorem & Elastic Collisions",
          objectives: [
            "Students will analyze data to support the claim that Newton’s second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration (NGSS HS-PS2-1).",
            "Students will use mathematical representations to show that the total momentum of a system of objects is conserved when there is no net force on the system.",
            "Students will apply scientific and engineering ideas to design, evaluate, and refine a device that minimizes the force on a macroscopic object during a collision.",
            "Students will create a computational model to calculate the change in the energy of one component in a system when the change in energy of the other component(s) and energy flows in and out of the system are known.",
            "Students will solve multi-step 2D projectile motion problems utilizing kinematic vector equations."
          ]
        }
      ],

      // 6. Environmental Science (Separated)
      "Environmental Science (NGSS & AP Environmental)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Earth Systems, Biomes, Biodiversity & Anthropogenic Impact",
          lesson: "Lesson: Biogeochemical Cycles, Population Ecology, Energy Resources & Climate Change Mitigation",
          objectives: [
            "Students will construct an explanation based on evidence for how geoscience processes have changed Earth's surface and biosphere.",
            "Students will evaluate competing design solutions for developing, managing, and utilizing energy and mineral resources based on cost-benefit ratios (NGSS HS-ESS3-2).",
            "Students will create a computational simulation to illustrate the relationships among management of natural resources, the sustainability of human populations, and biodiversity.",
            "Students will evaluate and synthesize empirical data regarding global carbon emissions, atmospheric feedback loops, and renewable energy transitions."
          ]
        }
      ],

      // 7. Social Studies
      "Social Studies & World History (High School)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Global Governance, Economics & Modern World History",
          lesson: "Lesson: Enlightenment Philosophy, Industrialization & Geopolitical Interdependence",
          objectives: [
            "Students will analyze the philosophical roots of modern democratic systems (Locke, Montesquieu, Rousseau).",
            "Students will evaluate the economic and technological transformations brought about by the Industrial Revolution.",
            "Students will defend historical theses through rigorous primary-source documentary analysis."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "High School Advanced Science & Mathematics Electives": [
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
