// =========================================================================
// American International Curriculum Standards (CCSS & NGSS)
// Full, comprehensive textbook and standards index for American Diploma Schools
// Strictly segregated from the Saudi National Curriculum
// =========================================================================

export const AMERICAN_STAGES = {
  ELEMENTARY: 'Elementary School (Grades 1-5)',
  MIDDLE: 'Middle School (Grades 6-8)',
  HIGH: 'High School (Grades 9-12)'
};

export const AMERICAN_CURRICULUM_STRICT = {
  // =========================================================================
  // 1. Elementary School (Grades 1-5)
  // =========================================================================
  [AMERICAN_STAGES.ELEMENTARY]: {
    "الفصل الدراسي الأول": {
      "English Language Arts (ELA)": [
        {
          subject: "English Language Arts (ELA)",
          grade: "Elementary (Grades 1-3)",
          unit: "Unit 1: Phonics, Reading & Story Elements",
          lesson: "Lesson 1: Short & Long Vowels, Blends, Sight Words & Character Traits",
          objectives: ["Decode short and long vowel words with accuracy", "Identify main characters and central themes in grade-level narratives", "Write complete declarative and interrogative sentences"]
        },
        {
          subject: "English Language Arts (ELA)",
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 2: Expository Text Analysis & Narrative Writing",
          lesson: "Lesson 2: Main Idea, Text Evidence, Cause & Effect, and 5-Paragraph Essays",
          objectives: ["Extract supporting evidence and central ideas from informational texts", "Construct multi-paragraph narrative essays using sensory details", "Apply standard grammar and punctuation conventions"]
        }
      ],
      "Mathematics (Common Core)": [
        {
          subject: "Mathematics (Common Core)",
          grade: "Elementary (Grades 1-3)",
          unit: "Unit 1: Operations, Algebraic Thinking & Place Value",
          lesson: "Lesson 1: Place Value to 1,000, Multi-Digit Addition and Subtraction",
          objectives: ["Model three-digit numbers using base-ten representations", "Compute multi-digit sums and differences with regrouping", "Solve two-step word problems involving real-world contexts"]
        },
        {
          subject: "Mathematics (Common Core)",
          grade: "Elementary (Grades 4-5)",
          unit: "Unit 2: Multi-Digit Multiplication, Division & Fractions",
          lesson: "Lesson 2: Multi-Digit Multiplication, Long Division, and Fraction Equivalence",
          objectives: ["Multiply multi-digit whole numbers using the standard algorithm", "Divide 4-digit dividends by 2-digit divisors", "Compare and generate equivalent fractions with unlike denominators"]
        }
      ],
      "Science (NGSS)": [
        {
          subject: "Science (NGSS)",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Life Structures, Ecosystems & Earth Systems",
          lesson: "Lesson 1: Plant & Animal Life Cycles, Habitats, Weather Patterns & Landforms",
          objectives: ["Trace the life cycles of organisms and analyze environmental adaptations", "Construct models showing interactions between earth's spheres", "Formulate scientific questions based on observable natural phenomena"]
        }
      ],
      "Social Studies & World Cultures": [
        {
          subject: "Social Studies & World Cultures",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Communities, Geography & Global Heritage",
          lesson: "Lesson 1: Maps & Hemispheres, Ancient Civilizations & Global Citizens",
          objectives: ["Utilize map scales, legends, and grid coordinates", "Compare ancient civilizations with modern community structures", "Demonstrate principles of civic responsibility and cultural empathy"]
        }
      ],
      "Visual Arts & Physical Education": [
        {
          subject: "Visual Arts & Physical Education",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 1: Fundamentals of Fine Arts, Movement & Wellness",
          lesson: "Lesson 1: Color Theory, Spatial Composition, Locomotor Skills & Cardiovascular Health",
          objectives: ["Apply color theory principles to create balanced visual artwork", "Perform foundational locomotor movements with rhythm and spatial awareness", "Understand the relationship between physical fitness and nutritional health"]
        }
      ]
    },

    "الفصل الدراسي الثاني": {
      "English Language Arts (ELA)": [
        {
          subject: "English Language Arts (ELA)",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 3: Persuasive Writing, Research & Poetry",
          lesson: "Lesson 1: Opinion Essays, Research Citations, Figurative Language & Public Speaking",
          objectives: ["Draft a persuasive opinion essay backed by factual reasons and linking words", "Conduct short research projects gathering information from print and digital sources", "Analyze poetic devices including metaphors, similes, and alliteration"]
        }
      ],
      "Mathematics (Common Core)": [
        {
          subject: "Mathematics (Common Core)",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 3: Decimals, Measurement, Geometry & Data",
          lesson: "Lesson 1: Decimal Operations, Coordinate Planes, Area, Perimeter & Volume",
          objectives: ["Read, write, and perform arithmetic operations on decimals to hundredths", "Plot coordinates and analyze geometric figures in quadrant 1", "Calculate the volume of rectangular prisms using unit cubes and formulas"]
        }
      ],
      "Science (NGSS)": [
        {
          subject: "Science (NGSS)",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 2: Energy, Matter, Forces & Space Systems",
          lesson: "Lesson 1: States of Matter, Electrical Circuits, Magnetism & Solar System Dynamics",
          objectives: ["Investigate chemical and physical changes in everyday matter", "Build functional series and parallel circuits demonstrating energy transfer", "Describe planetary orbits and the gravitational interactions of the sun and moon"]
        }
      ],
      "Social Studies & Global Citizenship": [
        {
          subject: "Social Studies & Global Citizenship",
          grade: "Elementary (Grades 1-5)",
          unit: "Unit 2: Economics, Government & World Trade",
          lesson: "Lesson 1: Supply and Demand, Goods and Services, and Democratic Foundations",
          objectives: ["Analyze market dynamics of supply, demand, and scarcity", "Identify fundamental structures and branches of national and global governments", "Examine international trade routes and economic interdependencies"]
        }
      ]
    }
  },

  // =========================================================================
  // 2. Middle School (Grades 6-8)
  // =========================================================================
  [AMERICAN_STAGES.MIDDLE]: {
    "الفصل الدراسي الأول": {
      "English Language Arts (ELA - Middle)": [
        {
          subject: "English Language Arts (ELA - Middle)",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Literary Analysis, Argumentative Writing & Rhetoric",
          lesson: "Lesson 1: Theme Development, Rhetorical Devices (Ethos, Pathos, Logos) & Argument Essays",
          objectives: ["Cite strong textual evidence to analyze explicit and inferential meaning", "Construct persuasive essays integrating counterclaims and credible sources", "Evaluate rhetorical techniques used in historical and modern speeches"]
        }
      ],
      "Mathematics (Pre-Algebra & Algebra 1)": [
        {
          subject: "Mathematics (Pre-Algebra & Algebra 1)",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Rational Numbers, Linear Equations & Functions",
          lesson: "Lesson 1: Multi-Step Linear Equations, Slope-Intercept Form & Systems of Equations",
          objectives: ["Solve complex linear equations and inequalities with variables on both sides", "Graph linear relations using slopes, intercepts, and rate of change", "Solve systems of linear equations using graphing, substitution, and elimination"]
        }
      ],
      "Integrated Science (NGSS - Middle)": [
        {
          subject: "Integrated Science (NGSS - Middle)",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Cellular Processes, Heredity & Newton's Laws",
          lesson: "Lesson 1: Cellular Respiration, Photosynthesis, Genetics (Punnett Squares) & Classical Mechanics",
          objectives: ["Model energy flow through photosynthesis and cellular respiration", "Predict phenotypic ratios using Mendelian genetics and Punnett squares", "Design experiments validating Newton's three laws of motion"]
        }
      ],
      "World Geography & Ancient Civilizations": [
        {
          subject: "World Geography & Ancient Civilizations",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Physical Geography, River Valley Civilizations & Classical Antiquity",
          lesson: "Lesson 1: Mesopotamia, Ancient Egypt, Greece, Rome & Human-Environment Interaction",
          objectives: ["Analyze geographical catalysts enabling agricultural and urban revolutions", "Examine governmental and philosophical legacies of Greece and the Roman Republic", "Synthesize primary historical sources to evaluate historical developments"]
        }
      ],
      "Computer Science & Digital Literacy": [
        {
          subject: "Computer Science & Digital Literacy",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 1: Computational Thinking & Python Programming",
          lesson: "Lesson 1: Algorithms, Data Types, Control Structures & Web Design (HTML/CSS)",
          objectives: ["Design flowcharts and algorithmic solutions to mathematical problems", "Write robust Python programs using lists, loops, and custom functions", "Build accessible and responsive web pages utilizing modern HTML5 and CSS3"]
        }
      ]
    },

    "الفصل الدراسي الثاني": {
      "English Language Arts (ELA - Middle)": [
        {
          subject: "English Language Arts (ELA - Middle)",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 2: Informational Synthesis, Research & Dramatic Literature",
          lesson: "Lesson 1: Synthesizing Multiple Sources, MLA Research Papers & Shakespearean Drama Analysis",
          objectives: ["Synthesize conflicting viewpoints from multiple digital and print texts", "Produce an MLA-formatted research paper with in-text citations and works cited", "Analyze dramatic staging, dialogue, and character conflict in classical plays"]
        }
      ],
      "Mathematics (Geometry & Statistics)": [
        {
          subject: "Mathematics (Geometry & Statistics)",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 2: Geometric Transformations, Pythagorean Theorem & Probability",
          lesson: "Lesson 1: Congruence, Similarity, 3D Surface Area/Volume, Scatter Plots & Bivariate Data",
          objectives: ["Apply geometric transformations (translations, reflections, rotations, dilations)", "Utilize the Pythagorean Theorem to find distances in 3D coordinate space", "Interpret scatter plots, lines of best fit, and bivariate statistical distributions"]
        }
      ],
      "Integrated Science (Earth & Space NGSS)": [
        {
          subject: "Integrated Science (Earth & Space NGSS)",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 2: Plate Tectonics, Climate Change & Astronomy",
          lesson: "Lesson 1: Continental Drift, Earthquakes, Atmospheric Dynamics & Galactic Evolution",
          objectives: ["Explain geological formations via mantle convection and plate boundary dynamics", "Analyze empirical data demonstrating climate changes and human impact", "Trace stellar lifecycles and evaluate cosmological models"]
        }
      ],
      "US History & Civics": [
        {
          subject: "US History & Civics",
          grade: "Middle School (Grades 6-8)",
          unit: "Unit 2: The American Revolution, Constitution & Democratic Systems",
          lesson: "Lesson 1: The Declaration of Independence, US Constitution, Bill of Rights & Landmark Law",
          objectives: ["Analyze foundational principles of liberty in the Declaration of Independence", "Examine constitutional checks and balances and federalism", "Evaluate landmark legal cases establishing fundamental civil liberties"]
        }
      ]
    }
  },

  // =========================================================================
  // 3. High School (Grades 9-12) - American Diploma Standards & AP Courses
  // =========================================================================
  [AMERICAN_STAGES.HIGH]: {
    "الفصل الدراسي الأول": {
      "English Literature & Composition": [
        {
          subject: "English Literature & Composition",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: World Literature, Critical Theory & Analytical Writing",
          lesson: "Lesson 1: Epic Traditions, Modernist Novels, Literary Criticism & Thesis-Driven Essays",
          objectives: ["Deconstruct complex narrative architectures, symbolism, and psychological archetypes", "Formulate sophisticated, defensible literary arguments in thesis-driven essays", "Critique socio-historical contexts using varied critical literary lenses"]
        }
      ],
      "Algebra 2 & Trigonometry": [
        {
          subject: "Algebra 2 & Trigonometry",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Polynomials, Rational Functions, Exponential/Logarithmic Models & Matrices",
          lesson: "Lesson 1: Complex Numbers, Fundamental Theorem of Algebra, Logarithmic Equations & Matrix Systems",
          objectives: ["Analyze polynomial functions and identify roots using the Fundamental Theorem of Algebra", "Solve exponential and logarithmic models simulating natural growth and decay", "Perform matrix transformations and solve multivariable systems using determinants and inverses"]
        }
      ],
      "Pre-Calculus & AP Calculus AB": [
        {
          subject: "Pre-Calculus & AP Calculus AB",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Limits, Continuity, Differential Calculus & Derivatives",
          lesson: "Lesson 1: Epsilon-Delta Definition of Limits, Power/Product/Quotient Rules, Chain Rule & Implicit Differentiation",
          objectives: ["Evaluate analytical, graphical, and numerical limits of continuous and piecewise functions", "Compute derivatives using advanced differentiation rules and implicit differentiation", "Apply Mean Value Theorem and optimize dynamic models via Related Rates"]
        }
      ],
      "AP Biology (NGSS)": [
        {
          subject: "AP Biology (NGSS)",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Chemistry of Life, Cell Energetics, Molecular Genetics & Biotechnology",
          lesson: "Lesson 1: Macromolecular Structure, Enzyme Kinetics, DNA Replication, CRISPR & Gene Expression",
          objectives: ["Quantify enzyme kinetics and thermodynamic properties of metabolic reactions", "Model molecular mechanisms of transcription, translation, and epigenetic regulation", "Evaluate recombinant DNA technology, gel electrophoresis, and CRISPR-Cas9 genome editing"]
        }
      ],
      "Chemistry (Honors / AP)": [
        {
          subject: "Chemistry (Honors / AP)",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Atomic Structure, Thermochemistry, Chemical Bonding & Stoichiometry",
          lesson: "Lesson 1: Quantum Mechanical Models, Hess's Law, Calorimetry, VSEPR & Hybridization",
          objectives: ["Calculate thermodynamic enthalpies, entropies, and Gibbs Free Energy changes", "Predict geometric bond angles and dipole moments utilizing VSEPR and hybridization theory", "Execute stoichiometric calculations involving limiting reactants and gas law deviations"]
        }
      ],
      "Physics (Honors / AP Physics C)": [
        {
          subject: "Physics (Honors / AP Physics C)",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Kinematics, Dynamics, Rotational Motion & Energy Conservation",
          lesson: "Lesson 1: Calculus-Based Motion, Newton's Laws with Friction, Torque, Moment of Inertia & Angular Momentum",
          objectives: ["Derive kinematic equations using differential and integral calculus", "Solve rotational dynamics problems computing moments of inertia and angular momentum conservation", "Analyze work-energy theorem applications in non-conservative conservative force fields"]
        }
      ],
      "AP Computer Science A (Java)": [
        {
          subject: "AP Computer Science A (Java)",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Object-Oriented Design, Data Structures & Algorithms",
          lesson: "Lesson 1: Java Classes, Encapsulation, Inheritance, Polymorphism, 2D Arrays & Recursion",
          objectives: ["Architect modular object-oriented software utilizing encapsulation and class hierarchies", "Implement sorting and searching algorithms (MergeSort, BinarySearch) and analyze Big-O complexity", "Design recursive algorithms to manipulate multi-dimensional arrays and linked data structures"]
        }
      ],
      "World History & Economics": [
        {
          subject: "World History & Economics",
          grade: "High School (Grades 9-12)",
          unit: "Unit 1: Global Interactions, Revolutions & Macroeconomics",
          lesson: "Lesson 1: Enlightenment Philosophy, Industrialization, Imperialism, GDP & Monetary Policy",
          objectives: ["Analyze ideological, political, and socio-economic causes of global revolutions", "Evaluate long-term impacts of the Industrial Revolution and imperialist expansion", "Model macroeconomic indicators: Fiscal Policy, Federal Reserve operations, and international exchange rates"]
        }
      ]
    },

    "الفصل الدراسي الثاني": {
      "English Literature & Rhetoric": [
        {
          subject: "English Literature & Rhetoric",
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Post-Colonial Literature, Seminal Speeches & Advanced Research",
          lesson: "Lesson 1: Post-Colonial Narratives, Rhetorical Analysis, Synthesis Essays & Senior Thesis",
          objectives: ["Conduct advanced rhetorical analysis identifying authorial tone, diction, and syntax", "Synthesize multiple contradictory source documents into a cohesive research thesis", "Defend an original scholarly academic thesis before a peer panel"]
        }
      ],
      "AP Calculus AB / BC": [
        {
          subject: "AP Calculus AB / BC",
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Integral Calculus, Differential Equations & Taylor Series",
          lesson: "Lesson 1: Riemann Sums, Fundamental Theorem of Calculus, U-Substitution, Volumes by Cross-Sections & Taylor Series",
          objectives: ["Calculate definite and indefinite integrals applying substitution and integration by parts", "Determine areas between curves and volumes of solids of revolution (disk/washer methods)", "Construct Taylor and Maclaurin polynomial series and determine radius of convergence"]
        }
      ],
      "AP Chemistry (Thermodynamics & Equilibrium)": [
        {
          subject: "AP Chemistry (Thermodynamics & Equilibrium)",
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Chemical Kinetics, Equilibrium, Acid-Base Systems & Electrochemistry",
          lesson: "Lesson 1: Rate Laws, Le Chatelier's Principle, Titration Curves, Buffers & Galvanic/Electrolytic Cells",
          objectives: ["Determine reaction orders and activation energies from differential and integrated rate laws", "Calculate equilibrium concentrations, pH of buffer solutions, and titration equivalence points", "Compute standard cell potentials (E°cell), Gibbs Free Energy, and apply the Nernst Equation"]
        }
      ],
      "AP Physics (Electricity & Magnetism)": [
        {
          subject: "AP Physics (Electricity & Magnetism)",
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Electrostatics, Circuits, Magnetic Fields & Electromagnetic Induction",
          lesson: "Lesson 1: Gauss's Law, Electric Potential, RC/LR Circuits, Ampère's Law, Faraday's Law & Maxwell's Equations",
          objectives: ["Apply Gauss's Law to calculate electric fields of symmetrical charge distributions", "Analyze RC, RL, and RLC transient circuits using Kirchhoff's rules and differential equations", "Calculate induced EMF and magnetic flux using Faraday's and Lenz's Laws"]
        }
      ],
      "US Government & Global Politics": [
        {
          subject: "US Government & Global Politics",
          grade: "High School (Grades 9-12)",
          unit: "Unit 2: Comparative Politics, International Law & Supreme Court Precedents",
          lesson: "Lesson 1: Constitutional Interpretation, Electoral Systems, Foreign Policy & Global Treaties",
          objectives: ["Evaluate judicial philosophies (Originalism vs Living Constitution) in Supreme Court jurisprudence", "Compare electoral and parliamentary systems across democratic and non-democratic states", "Analyze international diplomatic frameworks, security treaties, and humanitarian interventions"]
        }
      ]
    }
  }
};

export default AMERICAN_CURRICULUM_STRICT;
