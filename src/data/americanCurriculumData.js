// =========================================================================
// American International Curriculum Standards (CCSS & NGSS)
// Full, comprehensive textbook and standards index for International Schools
// =========================================================================

export const AMERICAN_STAGES = {
  ELEMENTARY: 'Elementary School (Grades 1-5)',
  MIDDLE: 'Middle School (Grades 6-8)',
  HIGH: 'High School (Grades 9-12)'
};

export const AMERICAN_CURRICULUM_STRICT = {
  [AMERICAN_STAGES.ELEMENTARY]: {
    "الفصل الدراسي الأول": {
      "English Language Arts (ELA)": [
        { subject: "English Language Arts (ELA)", grade: "Elementary (Grades 1-3)", unit: "Unit 1: Phonics & Reading", lesson: "Lesson: Short & Long Vowels, Blends, Sight Words & Story Elements" },
        { subject: "English Language Arts (ELA)", grade: "Elementary (Grades 4-5)", unit: "Unit 1: Expository Text Analysis", lesson: "Lesson: Main Idea, Text Evidence & 5-Paragraph Essays" }
      ],
      "Mathematics (Common Core)": [
        { subject: "Mathematics (Common Core)", grade: "Elementary (Grades 1-3)", unit: "Unit 1: Operations in Base Ten", lesson: "Lesson: Place Value to 1,000, Multi-Digit Operations" },
        { subject: "Mathematics (Common Core)", grade: "Elementary (Grades 4-5)", unit: "Unit 1: Multi-Digit Arithmetic", lesson: "Lesson: Multi-Digit Multiplication, Fractions Operations" }
      ],
      "Science (NGSS)": [
        { subject: "Science (NGSS)", grade: "Elementary (Grades 1-5)", unit: "Unit 1: Life Structures & Ecosystems", lesson: "Lesson: Organism Life Cycles, Habitats & Weather Patterns" }
      ]
    },
    "الفصل الدراسي الثاني": {}
  },
  [AMERICAN_STAGES.MIDDLE]: {
    "الفصل الدراسي الأول": {},
    "الفصل الدراسي الثاني": {}
  },
  [AMERICAN_STAGES.HIGH]: {
    "الفصل الدراسي الأول": {},
    "الفصل الدراسي الثاني": {}
  }
};

export default AMERICAN_CURRICULUM_STRICT;


