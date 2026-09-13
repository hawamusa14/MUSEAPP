import type { MuscleGroup } from "@prisma/client";
import { titleCaseName } from "@/lib/names";

export type ParsedNoteSet = {
  weight: number;
  reps: number;
  kind: "warmup" | "working";
  notes: string | null;
};

export type ParsedNoteExercise = {
  name: string;
  notes: string | null;
  sets: ParsedNoteSet[];
};

export type ParsedNoteWorkout = {
  date: string;
  title: string;
  muscleGroups: MuscleGroup[];
  exercises: ParsedNoteExercise[];
};

const DATE_LINE = /^\s*(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*$/;
const WEIGHT = /(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg)?/i;
const HAS_WEIGHT = /\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg)\b/i;

export function parseWorkoutNotes(text: string, year = new Date().getFullYear()): ParsedNoteWorkout[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((line) => line.trim());
  const workouts: ParsedNoteWorkout[] = [];
  let current: ParsedNoteWorkout | null = null;
  let lastTitle = "Workout";
  let awaitingTitle = false;
  let pendingName = "";

  for (const line of lines) {
    if (!line) continue;

    const dated = line.match(DATE_LINE);
    if (dated) {
      const month = Number(dated[1]);
      const day = Number(dated[2]);
      const parsedYear = dated[3]
        ? Number(dated[3].length === 2 ? `20${dated[3]}` : dated[3])
        : year;
      if (current?.exercises.length) workouts.push(current);
      current = {
        date: `${parsedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        title: lastTitle,
        muscleGroups: inferMuscleGroups(lastTitle),
        exercises: [],
      };
      awaitingTitle = true;
      pendingName = "";
      continue;
    }

    if (!current) continue;

    if (
      awaitingTitle &&
      looksLikeTitle(line) &&
      !HAS_WEIGHT.test(line) &&
      !looksLikeExercise(line)
    ) {
      current.title = line.replace(/[^\w\s+&/-]/g, "").trim() || lastTitle;
      current.muscleGroups = inferMuscleGroups(current.title);
      lastTitle = current.title;
      awaitingTitle = false;
      continue;
    }

    awaitingTitle = false;
    const exercise = parseExerciseLine(line, pendingName);
    if (exercise) {
      current.exercises.push(exercise);
      pendingName = "";
      continue;
    }
    if (looksLikeNameLine(line)) {
      pendingName = joinNames(pendingName, cleanName(line));
    }
  }

  if (current?.exercises.length) workouts.push(current);
  return workouts.filter((item) => item.exercises.length > 0);
}

function looksLikeExercise(line: string) {
  return /curl|press|extension|pulldown|row|squat|thrust|raise|crusher|fly|lunge|deadlift|pushdown/i.test(
    line
  );
}

function looksLikeTitle(line: string) {
  if (looksLikeExercise(line) || HAS_WEIGHT.test(line)) return false;
  return /\b(day|push|pull|upper|lower|arms?|glutes?|legs?|chest|back|shoulders?|core|full body|cardio|rest|hiit)\b/i.test(
    line
  );
}

function looksLikeNameLine(line: string) {
  if (isDetailsLine(line) || HAS_WEIGHT.test(line)) return false;
  return cleanName(line).length >= 2;
}

function isDetailsLine(line: string) {
  return /^(warm[\s-]*up|working\s*sets?|\d)/i.test(line);
}

function joinNames(left: string, right: string) {
  const first = cleanName(left);
  const second = cleanName(right);
  if (!first) return second;
  if (!second) return first;
  if (second.toLowerCase().includes(first.toLowerCase())) return second;
  if (first.toLowerCase().includes(second.toLowerCase())) return first;
  return `${first} ${second}`;
}

function parseExerciseLine(line: string, pendingName = ""): ParsedNoteExercise | null {
  if (!HAS_WEIGHT.test(line) && !/\d/.test(line)) return null;

  const [rawName, ...rest] = line.split(/\t+/);
  const cut = line.search(/\s+(warm|working|\d)/i);
  const details = rest.join(" ").trim() || (cut > 0 ? line.slice(cut).trim() : "");
  const extracted = cleanName(rest.length ? rawName : nameBeforeDetails(line));
  const detailsOnly = isDetailsLine(line) || /^(warm|working|\d)/i.test(extracted);
  const name = detailsOnly ? cleanName(pendingName) : joinNames(pendingName, extracted);
  const source = detailsOnly ? line : details || line;
  if (!name) return null;

  const notes = leftoverNotes(source);
  const defaultReps = readReps(source);
  const repSequence = readRepSequence(source);
  const workingCount = repSequence ? repSequence.length : readSetCount(source);
  const warmupWeight = readLabeledWeight(source, /warm[\s-]*up(?:\s*sets?)?/i);
  const labeledWorking = readLabeledWeight(source, /working\s*sets?/i);
  let workingWeight = labeledWorking;
  if (workingWeight == null && warmupWeight == null) {
    workingWeight = readFirstWeight(source);
  }

  if (workingWeight == null && warmupWeight == null) return null;

  const sets: ParsedNoteSet[] = [];
  if (warmupWeight != null) {
    sets.push({
      weight: warmupWeight,
      reps: defaultReps,
      kind: "warmup",
      notes: "Warm-up",
    });
  }
  const load = workingWeight != null ? workingWeight : warmupWeight || 0;
  for (let index = 0; index < workingCount; index += 1) {
    const reps = repSequence && repSequence[index] ? repSequence[index] : defaultReps;
    sets.push({ weight: load, reps, kind: "working", notes: null });
  }

  return { name, notes, sets };
}

function nameBeforeDetails(line: string) {
  const cut = line.search(/\s+(warm|working|\d)/i);
  return (cut > 0 ? line.slice(0, cut) : line).trim();
}

function cleanName(value: string) {
  return titleCaseName(value);
}

function readReps(value: string) {
  const match = value.match(/(\d+)\s*reps?\b|x\s*(\d+)\b/i);
  if (!match) return 10;
  return Number(match[1] || match[2]);
}

function readSetCount(value: string) {
  const match = value.match(/(\d+)\s*sets?\b/i);
  if (!match) return 3;
  const count = Number(match[1]);
  return count > 0 && count <= 12 ? count : 3;
}

function readLabeledWeight(value: string, label: RegExp) {
  const withUnit = value.match(
    new RegExp(`${label.source}\\s*(?:=\\s*)?(\\d+(?:\\.\\d+)?)\\s*(?:lbs?|pounds?|kg)`, "i")
  );
  if (withUnit) return Number(withUnit[1]);
  const withEq = value.match(new RegExp(`${label.source}\\s*=\\s*(\\d+(?:\\.\\d+)?)`, "i"));
  return withEq ? Number(withEq[1]) : null;
}

function readFirstWeight(value: string) {
  const match = value.match(WEIGHT);
  return match ? Number(match[1]) : null;
}

function readRepSequence(value: string) {
  const paren = value.match(/\((\d{1,3}(?:\s*,\s*\d{1,3}){1,11})\)/);
  const labeled = value.match(
    /(?:working\s*sets?|lbs?|pounds?|kg)\s*[,:]?\s*(\d{1,3}(?:\s*,\s*\d{1,3}){1,11})\b/i
  );
  const raw = paren ? paren[1] : labeled ? labeled[1] : null;
  if (!raw) return null;
  const nums = raw.split(/\s*,\s*/).map(Number);
  if (nums.some((item) => !Number.isInteger(item) || item < 1 || item > 50)) return null;
  return nums;
}

function leftoverNotes(value: string) {
  let cleaned = value
    .replace(/warm[\s-]*up(?:\s*sets?)?/gi, "")
    .replace(/working\s*sets?/gi, "")
    .replace(/\d+\s*sets?\b/gi, "")
    .replace(/\d+\s*reps?\b/gi, "")
    .replace(/\(\d{1,3}(?:\s*,\s*\d{1,3}){1,11}\)/g, "")
    .replace(/\d{1,3}(?:\s*,\s*\d{1,3}){1,11}/g, " ")
    .replace(/[=,;]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg)\s*/i, "")
    .trim();
  const prose = cleaned
    .replace(/\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg)/gi, "")
    .replace(/[^a-z]+/gi, " ")
    .replace(/\b(lbs?|pounds?|kg|set)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (prose.length < 3) return null;
  return cleaned;
}

export function inferMuscleGroups(title: string): MuscleGroup[] {
  const value = title.toLowerCase();
  if (/arm|bicep|tricep/.test(value)) return ["ARMS"];
  if (/glute|hip/.test(value)) return ["GLUTES"];
  if (/leg|lower|quad|ham/.test(value)) return ["LOWER_BODY"];
  if (/chest|push/.test(value)) return ["CHEST"];
  if (/back|pull/.test(value)) return ["BACK"];
  if (/shoulder/.test(value)) return ["SHOULDERS"];
  if (/core|ab/.test(value)) return ["CORE"];
  if (/full/.test(value)) return ["FULL_BODY"];
  return ["UPPER_BODY"];
}

export function summarizeParsedWorkouts(workouts: ParsedNoteWorkout[]) {
  return workouts.map((workout) => ({
    date: workout.date,
    title: workout.title,
    exerciseCount: workout.exercises.length,
    setCount: workout.exercises.reduce((sum, item) => sum + item.sets.length, 0),
    highlight: workout.exercises
      .slice(0, 3)
      .map((item) => {
        const warmup = item.sets.find((set) => set.kind === "warmup");
        const working = item.sets.filter((set) => set.kind === "working");
        const reps = working.map((set) => set.reps).join(",");
        const load = working[0] ? working[0].weight : item.sets[0]?.weight;
        const warm = warmup ? `warm-up ${warmup.weight}` : "";
        return [item.name, warm, load != null && reps ? `${load} ${reps}` : ""]
          .filter(Boolean)
          .join(" ");
      })
      .join(" · "),
  }));
}
