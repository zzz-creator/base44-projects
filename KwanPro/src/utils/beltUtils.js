export const BELT_ORDER = ["White", "Yellow", "Orange", "Green", "Blue", "Red", "Black"];

export const BELT_COLORS = {
  White: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300", hex: "#f3f4f6", dot: "bg-gray-400" },
  Yellow: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-400", hex: "#fef08a", dot: "bg-yellow-400" },
  Orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-400", hex: "#fed7aa", dot: "bg-orange-400" },
  Green: { bg: "bg-green-100", text: "text-green-800", border: "border-green-500", hex: "#bbf7d0", dot: "bg-green-500" },
  Blue: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-500", hex: "#bfdbfe", dot: "bg-blue-500" },
  Red: { bg: "bg-red-100", text: "text-red-800", border: "border-red-500", hex: "#fecaca", dot: "bg-red-500" },
  Black: { bg: "bg-gray-900", text: "text-white", border: "border-gray-900", hex: "#111827", dot: "bg-gray-900" },
};

export const DEFAULT_BELT_REQUIREMENTS = {
  White: { required_classes: 20, minimum_months: 2, required_skills: ["Basic Stances", "Front Kick", "Bow & Etiquette"] },
  Yellow: { required_classes: 25, minimum_months: 2, required_skills: ["Walking Stance", "Round Kick", "Taegeuk 1 Jang"] },
  Orange: { required_classes: 30, minimum_months: 3, required_skills: ["Back Stance", "Side Kick", "Taegeuk 2 Jang", "Basic Sparring"] },
  Green: { required_classes: 30, minimum_months: 3, required_skills: ["Tiger Stance", "Turning Kick", "Taegeuk 3 Jang", "1-Step Sparring"] },
  Blue: { required_classes: 35, minimum_months: 4, required_skills: ["Taegeuk 4 Jang", "Free Sparring", "Board Breaking"] },
  Red: { required_classes: 40, minimum_months: 4, required_skills: ["Taegeuk 5 Jang", "Advanced Sparring", "Double Board Breaking", "Self Defense"] },
  Black: { required_classes: 0, minimum_months: 0, required_skills: [] },
};

export function getBeltIndex(belt) {
  return BELT_ORDER.indexOf(belt);
}

export function getNextBelt(belt) {
  const idx = getBeltIndex(belt);
  return idx < BELT_ORDER.length - 1 ? BELT_ORDER[idx + 1] : null;
}

export function calculateMonthsInBelt(beltStartDate) {
  if (!beltStartDate) return 0;
  const start = new Date(beltStartDate);
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30.44));
}

export function checkEligibility(student, requirements) {
  if (!requirements) return { eligible: false, reasons: ["No requirements set"] };
  const req = requirements[student.current_belt];
  if (!req) return { eligible: false, reasons: ["Requirements not configured"] };
  const reasons = [];
  const classesOk = (student.classes_in_current_belt || 0) >= req.required_classes;
  const months = calculateMonthsInBelt(student.belt_start_date);
  const timeOk = months >= req.minimum_months;
  if (!classesOk) reasons.push(`Need ${req.required_classes - (student.classes_in_current_belt || 0)} more classes`);
  if (!timeOk) reasons.push(`Need ${req.minimum_months - months} more months`);
  return { eligible: classesOk && timeOk, reasons };
}