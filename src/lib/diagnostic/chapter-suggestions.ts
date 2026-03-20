import { Subject } from "@prisma/client";

/**
 * Default chapter suggestions per subject.
 * Strong-subject suggestion: high-weightage chapter that's representative.
 * Weak-subject suggestion: high-weightage chapter that is a known JEE pain point.
 */

export const STRONG_SUBJECT_CHAPTER: Record<Subject, string> = {
  PHYSICS: "Electrostatics",
  CHEMISTRY: "Organic Chemistry (GOC)",
  MATH: "Applications of Derivatives",
};

export const WEAK_SUBJECT_CHAPTER: Record<Subject, string> = {
  PHYSICS: "Modern Physics",
  CHEMISTRY: "Coordination Compounds",
  MATH: "Complex Numbers",
};

/**
 * All JEE chapters per subject, used to populate the chapter-change dropdown.
 */
export const JEE_CHAPTERS: Record<Subject, string[]> = {
  PHYSICS: [
    "Kinematics",
    "Laws of Motion",
    "Work, Energy and Power",
    "Rotational Motion",
    "Gravitation",
    "Properties of Matter",
    "Thermodynamics",
    "Kinetic Theory of Gases",
    "Oscillations",
    "Waves",
    "Electrostatics",
    "Current Electricity",
    "Magnetic Effects of Current",
    "Electromagnetic Induction",
    "Alternating Current",
    "Electromagnetic Waves",
    "Ray Optics",
    "Wave Optics",
    "Modern Physics",
    "Semiconductor Devices",
  ],
  CHEMISTRY: [
    "Mole Concept",
    "Atomic Structure",
    "Chemical Bonding",
    "States of Matter",
    "Thermodynamics",
    "Equilibrium",
    "Redox Reactions",
    "Electrochemistry",
    "Chemical Kinetics",
    "Surface Chemistry",
    "Periodic Table",
    "General Organic Chemistry (GOC)",
    "Organic Chemistry (GOC)",
    "Hydrocarbons",
    "Haloalkanes and Haloarenes",
    "Alcohols, Phenols, Ethers",
    "Aldehydes and Ketones",
    "Carboxylic Acids",
    "Amines",
    "Coordination Compounds",
    "p-Block Elements",
    "d and f Block Elements",
    "Biomolecules",
    "Polymers",
  ],
  MATH: [
    "Sets and Relations",
    "Complex Numbers",
    "Quadratic Equations",
    "Sequences and Series",
    "Permutations and Combinations",
    "Binomial Theorem",
    "Straight Lines",
    "Circles",
    "Conic Sections",
    "Limits and Continuity",
    "Differentiation",
    "Applications of Derivatives",
    "Indefinite Integration",
    "Definite Integration",
    "Differential Equations",
    "Vectors",
    "3D Geometry",
    "Matrices and Determinants",
    "Probability",
    "Statistics",
    "Trigonometry",
    "Inverse Trigonometry",
  ],
};

/**
 * Get the suggested chapter for the first test based on the student's strong subjects.
 * Returns the subject and suggested chapter for the strongest subject.
 */
export function getSuggestedStrongChapter(strongSubjects: string[]): {
  subject: Subject;
  chapter: string;
} | null {
  if (!strongSubjects.length) return null;
  const subject = strongSubjects[0] as Subject;
  return {
    subject,
    chapter: STRONG_SUBJECT_CHAPTER[subject] ?? JEE_CHAPTERS[subject][0],
  };
}

/**
 * Get the suggested chapter for the second test based on the student's weak subjects.
 */
export function getSuggestedWeakChapter(weakSubjects: string[]): {
  subject: Subject;
  chapter: string;
} | null {
  if (!weakSubjects.length) return null;
  const subject = weakSubjects[0] as Subject;
  return {
    subject,
    chapter: WEAK_SUBJECT_CHAPTER[subject] ?? JEE_CHAPTERS[subject][0],
  };
}
