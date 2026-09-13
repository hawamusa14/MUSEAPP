import type { MuscleGroup } from "@prisma/client";

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
      continue;
    }

    if (!current) continue;

    if (awaitingTitle && !HAS_WEIGHT.test(line) && !looksLikeExercise(line)) {
      current.title = line.replace(/[^\w\s+&/-]/g, "").trim() || lastTitle;
      current.muscleGroups = inferMuscleGroups(current.title);
      lastTitle = current.title;
      awaitingTitle = false;
      continue;
    }

    awaitingTitle = false;
    const exercise = parseExerciseLine(line);
    if (exercise) current.exercises.push(exercise);
  }

  if (current?.exercises.length) workouts.push(current);
  return workouts.filter((item) => item.exercises.length > 0);
}

function looksLikeExercise(line: string) {
  return /curl|press|extension|pulldown|row|squat|thrust|raise|crusher|fly|lunge|deadlift|pushdown/i.test(
    line
  );
}

function parseExerciseLine(line: string): ParsedNoteExercise | null {
  if (!HAS_WEIGHT.test(line) && !/\d/.test(line)) return null;

  const [rawName, ...rest] = line.split(/\t+/);
  const details = rest.join(" ").trim() || line.replace(rawName, "").trim();
  const name = cleanName(rest.length ? rawName : nameBeforeDetails(line));
  const source = details || line;
  if (!name) return null;

  const notes = leftoverNotes(source);
  const reps = readReps(source);
  const workingCount = readSetCount(source);
  const warmupWeight = readLabeledWeight(source, /warm[\s-]*up(?:\s*sets?)?/i);
  const labeledWorking = readLabeledWeight(source, /working\s*sets?/i);
  let workingWeight = labeledWorking;
  if (workingWeight == null && warmupWeight == null) {
    workingWeight = readFirstWeight(source);
  }

  if (workingWeight == null && warmupWeight == null) return null;

  const sets: ParsedNoteSet[] = [];
  if (warmupWeight != null) {
    sets.push({ weight: warmupWeight, reps, kind: "warmup", notes: "Warm up" });
  }
  const load = workingWeight ?? warmupWeight ?? 0;
  for (let index = 0; index < workingCount; index += 1) {
    sets.push({ weight: load, reps, kind: "working", notes: null });
  }

  return { name, notes, sets };
}

function nameBeforeDetails(line: string) {
  const cut = line.search(/\s+(warm|working|\d)/i);
  return (cut > 0 ? line.slice(0, cut) : line).trim();
}

function cleanName(value: string) {
  return value.replace(/\s+/g, " ").replace(/[;]+/g, "").trim();
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
  const match = value.match(new RegExp(`${label.source}\\s*(?:=\\s*)?${WEIGHT.source}`, "i"));
  return match ? Number(match[1] ?? match[2]) : null;
}

function readFirstWeight(value: string) {
  const match = value.match(WEIGHT);
  return match ? Number(match[1]) : null;
}

function leftoverNotes(value: string) {
  const comment = value.match(/,\s*(.+)$/i);
  const extra = comment && comment[1] ? comment[1].trim() : "";
  if (extra && !/warm|working/i.test(extra)) return extra;
  const cleaned = value
    .replace(/warm[\s-]*up(?:\s*sets?)?\s*(?:=\s*)?\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg)?/gi, "")
    .replace(/working\s*sets?\s*(?:=\s*)?\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg)?/gi, "")
    .replace(/\d+\s*sets?\b/gi, "")
    .replace(/\d+\s*reps?\b/gi, "")
    .replace(/\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg)/gi, "")
    .replace(/[=,;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 2 ? cleaned : null;
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
      .map((item) => item.name)
      .join(", "),
  }));
}
