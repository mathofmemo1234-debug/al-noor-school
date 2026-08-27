// قاعدة بيانات المنهج الأمريكي المعتمد للمدارس العالمية (American Curriculum - CCSS & NGSS)
// تصنيف صارم ومفصول 100% حسب المراحل: Elementary (Grades 1-5), Middle School (Grades 6-8), High School (Grades 9-12)

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
            "Students will write short narrative pieces recounting a well-elaborated event with temporal words.",
            "Students will demonstrate command of capitalization, end punctuation, and spelling of high-frequency words."
          ]
        },
        {
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 1: Expository Text Structure & Narrative Craft",
          lesson: "Lesson: Main Idea, Supporting Details & Structured Paragraph Writing",
          objectives: [
            "Students will explain what a text says explicitly and draw inferences from the text (CCSS.ELA-LITERACY.RI.4.1).",
            "Students will determine the main idea of an informational text and explain how it is supported by key details.",
            "Students will write informative/explanatory essays introducing a topic clearly, grouping related information in paragraphs.",
            "Students will use relative pronouns, adverbs, and progressive verb tenses correctly in context.",
            "Students will consult reference materials (dictionaries, glossaries) to determine the exact meaning of academic words."
          ]
        }
      ],

      "Mathematics (Common Core Elementary)": [
        {
          grade: "Elementary (Grades 1-3)",
          unit: "Unit 1: Operations in Base Ten & Multiplication Foundations",
          lesson: "Lesson: Place Value to 1,000 & Multiplication Facts (2-10)",
          objectives: [
            "Students will understand that the three digits of a three-digit number represent hundreds, tens, and ones (CCSS.MATH.2.NBT.A.1).",
            "Students will fluently add and subtract within 100 using strategies based on place value and properties of operations.",
            "Students will interpret products of whole numbers (e.g., interpret 5 × 7 as the total number of objects in 5 groups of 7).",
            "Students will represent and solve two-step word problems involving the four arithmetic operations.",
            "Students will recognize and draw shapes having specified attributes (number of angles, equal faces)."
          ]
        },
        {
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 1: Multi-Digit Arithmetic & Fraction Equivalence",
          lesson: "Lesson: Multi-Digit Multiplication & Adding/Subtracting Fractions",
          objectives: [
            "Students will multiply a whole number of up to four digits by a one-digit whole number and multiply two two-digit numbers.",
            "Students will find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors.",
            "Students will explain why a fraction a/b is equivalent to a fraction (n × a)/(n × b) using visual fraction models.",
            "Students will add and subtract fractions and mixed numbers with like and unlike denominators.",
            "Students will read, write, and compare decimals to thousandths using standard and expanded forms."
          ]
        }
      ],

      "Science (NGSS Elementary)": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Earth Systems, Plant & Animal Structures",
          lesson: "Lesson: Plant & Animal Life Cycles, Habitats & Weather Patterns",
          objectives: [
            "Students will develop models to describe that organisms have unique and diverse life cycles (NGSS 3-LS1-1).",
            "Students will construct an argument with evidence that in a particular habitat some organisms can survive well and some cannot.",
            "Students will represent data in tables and graphical displays to describe typical weather conditions expected during a season.",
            "Students will plan and conduct an investigation to provide evidence of the effects of balanced and unbalanced forces on motion.",
            "Students will identify evidence from patterns in rock formations and fossils in rock layers to explain changes in landscapes over time."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "Elementary Comprehensive Subjects": [
        {
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 2: Measurement, Geometry, Ecosystems & Persuasive Writing",
          lesson: "Lesson: Area and Perimeter, States of Matter & Opinion Speeches",
          objectives: [
            "Students will measure and estimate liquid volumes, masses of objects, area, and perimeter of rectilinear shapes.",
            "Students will write opinion pieces supporting a point of view with reasons and factual information.",
            "Students will conduct simple experiments demonstrating physical and chemical changes in matter.",
            "Students will describe the flow of energy in an ecosystem from sunlight through producers to consumers and decomposers.",
            "Students will deliver oral presentations using clear articulation and visual multimedia."
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
          unit: "Unit 1: Literary Analysis & Argumentative Writing",
          lesson: "Lesson: Citing Textual Evidence, Theme Analysis & 5-Paragraph Essays",
          objectives: [
            "Students will cite several pieces of textual evidence to support analysis of what the text says explicitly as well as inferences (CCSS.ELA.RL.7.1).",
            "Students will determine a theme or central idea of a text and analyze its development over the course of the text.",
            "Students will write arguments to support claims with clear reasons, relevant evidence, and credible counterclaims.",
            "Students will analyze how an author's choice of point of view shapes the content, style, and tone of a narrative.",
            "Students will engage effectively in a range of collaborative Socratic discussions with diverse partners."
          ]
        }
      ],

      "Mathematics (Pre-Algebra & Algebra I)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Ratios, Proportions & Solving Linear Equations",
          lesson: "Lesson: Unit Rates, Multi-Step Equations & Slope-Intercept Graphing",
          objectives: [
            "Students will compute unit rates associated with ratios of fractions and analyze proportional relationships (CCSS.MATH.7.RP.A.1).",
            "Students will solve multi-step linear equations and inequalities in one variable with rational number coefficients.",
            "Students will graph proportional relationships, interpreting the unit rate as the slope of the graph (y = mx + b).",
            "Students will apply the Pythagorean Theorem to find missing side lengths in right triangles and distances in coordinate planes.",
            "Students will summarize numerical data sets (Mean, Median, Interquartile Range, Box Plots) in relation to their context."
          ]
        }
      ],

      "Science (NGSS Middle School Integrated Science)": [
        {
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Atoms, Chemical Reactions & Cellular Energetics",
          lesson: "Lesson: Molecular Structures, Photosynthesis & Newton's Laws",
          objectives: [
            "Students will develop models to describe the atomic composition of simple molecules and extended crystal structures (NGSS MS-PS1-1).",
            "Students will analyze and interpret data on the properties of substances before and after substances interact to determine if a reaction occurred.",
            "Students will construct a scientific explanation based on evidence for the role of photosynthesis in the cycling of matter and energy.",
            "Students will apply Newton’s Third Law to design a solution to a problem involving the motion of two colliding objects.",
            "Students will model how genes located in the chromosomes of each cell determine organism traits."
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
            "Students will write structured Python programs using variables, conditionals, loops, and custom functions.",
            "Students will examine macro-geographical patterns, global trade routes, and international governance systems.",
            "Students will design and complete an interdisciplinary STEM capstone project."
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
          unit: "Unit 1: Rhetorical Strategies & Scholarly Research",
          lesson: "Lesson: Rhetorical Appeals (Ethos, Pathos, Logos) & Academic Synthesis",
          objectives: [
            "Students will determine an author’s point of view or purpose in a text and analyze how style and content contribute to the power and persuasiveness (CCSS.ELA.RI.11-12.6).",
            "Students will synthesize findings from multiple authoritative print and digital sources, demonstrating understanding of the subject under investigation.",
            "Students will write analytical research papers adhering to rigorous MLA/APA academic citation formats.",
            "Students will critique the logical validity of premises, inferences, and conclusions in classical and modern political documents.",
            "Students will participate in formal parliamentary debates and deliver persuasive presentations."
          ]
        }
      ],

      "Mathematics (Geometry, Algebra II, Pre-Calculus & AP Calculus)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Quadratic Functions, Geometric Proofs & Trigonometric Identities",
          lesson: "Lesson: Complex Numbers, Coordinate Proofs, Unit Circle & Limits",
          objectives: [
            "Students will solve quadratic equations with real and complex roots using factoring, completing the square, and the Quadratic Formula.",
            "Students will prove formal geometric theorems about lines, angles, triangles, and parallelograms deductively.",
            "Students will evaluate trigonometric functions of any angle using the Unit Circle and prove Pythagorean trigonometric identities.",
            "Students will analyze polynomial, rational, and exponential functions, determining domains, asymptotes, and end behavior.",
            "Students will calculate limits of functions algebraically and define the derivative as the limit of a difference quotient."
          ]
        }
      ],

      "Science (Biology, Chemistry & Physics - NGSS High School)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Cellular Genetics, Chemical Stoichiometry & 2D Kinematics",
          lesson: "Lesson: DNA Replication & Translation / Molar Calculations / Projectile Motion",
          objectives: [
            "Students will construct an explanation based on evidence for how the structure of DNA determines the structure of proteins (NGSS HS-LS1-1).",
            "Students will use mathematical representations of chemical reactions to calculate stoichiometric relationships, limiting reactants, and percent yield.",
            "Students will analyze 2D projectile motion and circular motion using kinematic vector equations and Newton's Universal Law of Gravitation.",
            "Students will model chemical bonding (ionic, covalent, metallic) through Lewis structures, electronegativity differences, and molecular geometry.",
            "Students will plan and conduct advanced laboratory investigations evaluating experimental error and uncertainty."
          ]
        }
      ],

      "Social Studies & World History (High School)": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Global Governance, Economics & Modern World History",
          lesson: "Lesson: Enlightenment Philosophy, Industrialization & Geopolitical Interdependence",
          objectives: [
            "Students will analyze the philosophical roots of modern democratic systems (Locke, Montesquieu, Rousseau).",
            "Students will evaluate the economic, social, and technological transformations brought about by the Industrial Revolution.",
            "Students will assess macroeconomic indicators (GDP, fiscal policy, monetary systems) and their global impacts.",
            "Students will examine the diplomatic treaties, conflicts, and global alliances of the 20th and 21st centuries.",
            "Students will defend historical theses through rigorous primary-source documentary analysis."
          ]
        }
      ]
    },

    "الفصل الدراسي الثاني (Semester 2)": {
      "High School Advanced Electives & AP Standards": [
        {
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Calculus Integrals, Thermodynamics, Electromagnetism & Global Affairs",
          lesson: "Lesson: Derivatives & Integrals / Equilibrium & Le Chatelier / Electromagnetic Induction",
          objectives: [
            "Students will compute definite and indefinite integrals to evaluate areas under curves and physical work done.",
            "Students will apply Le Chatelier’s Principle and thermodynamic Gibbs free energy calculations to chemical equilibrium.",
            "Students will explain electromagnetic induction, Faraday’s Law, Lenz's Law, and modern generator technologies.",
            "Students will conduct an independent scientific research thesis with experimental design and formal defense.",
            "Students will demonstrate global leadership, scholarly writing, and college-ready academic excellence."
          ]
        }
      ]
    }
  }
};

export default AMERICAN_CURRICULUM_STRICT;
