import { MuscleGroup, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedExercise = {
  name: string;
  equipment?: string;
};

type SeedCategory = {
  slug: string;
  name: string;
  muscleGroup: MuscleGroup;
  exercises: SeedExercise[];
};

const library: SeedCategory[] = [
  {
    slug: "chest",
    name: "Chest",
    muscleGroup: "CHEST",
    exercises: [
      { name: "Barbell Bench Press", equipment: "Barbell" },
      { name: "Incline Bench Press", equipment: "Barbell" },
      { name: "Decline Bench Press", equipment: "Barbell" },
      { name: "Dumbbell Bench Press", equipment: "Dumbbells" },
      { name: "Incline Dumbbell Press", equipment: "Dumbbells" },
      { name: "Dumbbell Fly", equipment: "Dumbbells" },
      { name: "Cable Fly", equipment: "Cable" },
      { name: "Pec Deck", equipment: "Machine" },
      { name: "Push-Up" },
      { name: "Chest Press", equipment: "Machine" },
      { name: "Machine Chest Press", equipment: "Machine" },
      { name: "Smith Machine Bench Press", equipment: "Smith machine" },
    ],
  },
  {
    slug: "back",
    name: "Back",
    muscleGroup: "BACK",
    exercises: [
      { name: "Pull-Up" },
      { name: "Assisted Pull-Up", equipment: "Machine" },
      { name: "Chin-Up" },
      { name: "Lat Pulldown", equipment: "Cable" },
      { name: "Close-Grip Lat Pulldown", equipment: "Cable" },
      { name: "Wide-Grip Lat Pulldown", equipment: "Cable" },
      { name: "Barbell Row", equipment: "Barbell" },
      { name: "Dumbbell Row", equipment: "Dumbbells" },
      { name: "Seated Cable Row", equipment: "Cable" },
      { name: "Chest-Supported Row", equipment: "Machine" },
      { name: "T-Bar Row", equipment: "Barbell" },
      { name: "Machine Row", equipment: "Machine" },
      { name: "Single-Arm Cable Row", equipment: "Cable" },
      { name: "Straight-Arm Pulldown", equipment: "Cable" },
      { name: "Face Pull", equipment: "Cable" },
      { name: "Deadlift", equipment: "Barbell" },
      { name: "Rack Pull", equipment: "Barbell" },
      { name: "Back Extension", equipment: "Bench" },
    ],
  },
  {
    slug: "shoulders",
    name: "Shoulders",
    muscleGroup: "SHOULDERS",
    exercises: [
      { name: "Overhead Press", equipment: "Barbell" },
      { name: "Dumbbell Shoulder Press", equipment: "Dumbbells" },
      { name: "Arnold Press", equipment: "Dumbbells" },
      { name: "Machine Shoulder Press", equipment: "Machine" },
      { name: "Lateral Raise", equipment: "Dumbbells" },
      { name: "Cable Lateral Raise", equipment: "Cable" },
      { name: "Front Raise", equipment: "Dumbbells" },
      { name: "Rear Delt Fly", equipment: "Dumbbells" },
      { name: "Reverse Pec Deck", equipment: "Machine" },
      { name: "Upright Row", equipment: "Barbell" },
      { name: "Landmine Press", equipment: "Barbell" },
    ],
  },
  {
    slug: "biceps",
    name: "Biceps",
    muscleGroup: "BICEPS",
    exercises: [
      { name: "Barbell Curl", equipment: "Barbell" },
      { name: "Dumbbell Curl", equipment: "Dumbbells" },
      { name: "Hammer Curl", equipment: "Dumbbells" },
      { name: "Incline Dumbbell Curl", equipment: "Dumbbells" },
      { name: "Preacher Curl", equipment: "Barbell" },
      { name: "Concentration Curl", equipment: "Dumbbells" },
      { name: "Cable Curl", equipment: "Cable" },
      { name: "EZ-Bar Curl", equipment: "EZ-bar" },
      { name: "Spider Curl", equipment: "Dumbbells" },
    ],
  },
  {
    slug: "triceps",
    name: "Triceps",
    muscleGroup: "TRICEPS",
    exercises: [
      { name: "Tricep Pushdown", equipment: "Cable" },
      { name: "Rope Pushdown", equipment: "Cable" },
      { name: "Overhead Tricep Extension", equipment: "Dumbbells" },
      { name: "Skull Crusher", equipment: "EZ-bar" },
      { name: "Close-Grip Bench Press", equipment: "Barbell" },
      { name: "Dips" },
      { name: "Tricep Kickback", equipment: "Dumbbells" },
    ],
  },
  {
    slug: "forearms",
    name: "Forearms",
    muscleGroup: "FOREARMS",
    exercises: [
      { name: "Wrist Curl", equipment: "Dumbbells" },
      { name: "Reverse Wrist Curl", equipment: "Dumbbells" },
      { name: "Farmer Carry", equipment: "Dumbbells" },
      { name: "Plate Pinch", equipment: "Plates" },
      { name: "Reverse Curl", equipment: "Barbell" },
      { name: "Wrist Roller", equipment: "Wrist roller" },
    ],
  },
  {
    slug: "glutes",
    name: "Glutes",
    muscleGroup: "GLUTES",
    exercises: [
      { name: "Barbell Hip Thrust", equipment: "Barbell" },
      { name: "Dumbbell Hip Thrust", equipment: "Dumbbells" },
      { name: "Glute Bridge" },
      { name: "Bulgarian Split Squat", equipment: "Dumbbells" },
      { name: "Cable Kickback", equipment: "Cable" },
      { name: "Hip Abduction", equipment: "Machine" },
      { name: "Step-Up", equipment: "Dumbbells" },
      { name: "Reverse Lunge", equipment: "Dumbbells" },
      { name: "Sumo Squat", equipment: "Dumbbells" },
      { name: "Single-Leg Romanian Deadlift", equipment: "Dumbbells" },
      { name: "Curtsy Lunge", equipment: "Dumbbells" },
    ],
  },
  {
    slug: "quads",
    name: "Quads",
    muscleGroup: "QUADS",
    exercises: [
      { name: "Back Squat", equipment: "Barbell" },
      { name: "Front Squat", equipment: "Barbell" },
      { name: "Goblet Squat", equipment: "Dumbbells" },
      { name: "Hack Squat", equipment: "Machine" },
      { name: "Leg Press", equipment: "Machine" },
      { name: "Leg Extension", equipment: "Machine" },
      { name: "Walking Lunge", equipment: "Dumbbells" },
      { name: "Smith Machine Squat", equipment: "Smith machine" },
    ],
  },
  {
    slug: "hamstrings",
    name: "Hamstrings",
    muscleGroup: "HAMSTRINGS",
    exercises: [
      { name: "Romanian Deadlift", equipment: "Barbell" },
      { name: "Stiff-Leg Deadlift", equipment: "Barbell" },
      { name: "Leg Curl", equipment: "Machine" },
      { name: "Seated Leg Curl", equipment: "Machine" },
      { name: "Lying Leg Curl", equipment: "Machine" },
      { name: "Good Morning", equipment: "Barbell" },
      { name: "Nordic Curl" },
      { name: "Single-Leg Curl", equipment: "Machine" },
    ],
  },
  {
    slug: "calves",
    name: "Calves",
    muscleGroup: "CALVES",
    exercises: [
      { name: "Standing Calf Raise", equipment: "Machine" },
      { name: "Seated Calf Raise", equipment: "Machine" },
      { name: "Leg Press Calf Raise", equipment: "Machine" },
      { name: "Single-Leg Calf Raise" },
    ],
  },
  {
    slug: "core",
    name: "Core",
    muscleGroup: "CORE",
    exercises: [
      { name: "Crunch" },
      { name: "Cable Crunch", equipment: "Cable" },
      { name: "Reverse Crunch" },
      { name: "Hanging Leg Raise" },
      { name: "Knee Raise" },
      { name: "Plank" },
      { name: "Side Plank" },
      { name: "Russian Twist" },
      { name: "Bicycle Crunch" },
      { name: "Dead Bug" },
      { name: "Ab Wheel Rollout", equipment: "Ab wheel" },
      { name: "Pallof Press", equipment: "Cable" },
      { name: "Mountain Climbers" },
    ],
  },
  {
    slug: "cardio",
    name: "Cardio",
    muscleGroup: "CARDIO",
    exercises: [
      { name: "Walking" },
      { name: "Running" },
      { name: "Treadmill", equipment: "Treadmill" },
      { name: "Incline Walking", equipment: "Treadmill" },
      { name: "Cycling", equipment: "Bike" },
      { name: "Stationary Bike", equipment: "Bike" },
      { name: "Peloton", equipment: "Bike" },
      { name: "Elliptical", equipment: "Elliptical" },
      { name: "Stair Climber", equipment: "Stair climber" },
      { name: "StairMaster", equipment: "Stair climber" },
      { name: "Rowing", equipment: "Rower" },
      { name: "Swimming" },
      { name: "Hiking" },
      { name: "Jump Rope" },
      { name: "HIIT" },
    ],
  },
  {
    slug: "upper-body",
    name: "Upper Body",
    muscleGroup: "UPPER_BODY",
    exercises: [
      { name: "Push Press", equipment: "Barbell" },
      { name: "Bent-Over Reverse Fly", equipment: "Dumbbells" },
      { name: "Chest-Supported Dumbbell Row", equipment: "Dumbbells" },
    ],
  },
  {
    slug: "lower-body",
    name: "Lower Body",
    muscleGroup: "LOWER_BODY",
    exercises: [
      { name: "Trap Bar Deadlift", equipment: "Trap bar" },
      { name: "Split Squat", equipment: "Dumbbells" },
      { name: "Box Squat", equipment: "Barbell" },
    ],
  },
  {
    slug: "full-body",
    name: "Full Body",
    muscleGroup: "FULL_BODY",
    exercises: [
      { name: "Kettlebell Swing", equipment: "Kettlebell" },
      { name: "Thruster", equipment: "Dumbbells" },
      { name: "Burpee" },
      { name: "Clean", equipment: "Barbell" },
      { name: "Wall Ball", equipment: "Medicine ball" },
    ],
  },
  {
    slug: "arms",
    name: "Arms",
    muscleGroup: "ARMS",
    exercises: [
      { name: "Diamond Push-Up" },
      { name: "Bench Dip" },
      { name: "Close-Grip Push-Up" },
    ],
  },
  {
    slug: "mobility",
    name: "Mobility",
    muscleGroup: "MOBILITY",
    exercises: [
      { name: "World's Greatest Stretch" },
      { name: "Cat-Cow" },
      { name: "90/90 Hip Stretch" },
      { name: "Thoracic Rotation" },
      { name: "Hip Flexor Stretch" },
      { name: "Couch Stretch" },
      { name: "Shoulder CARs" },
      { name: "Ankle Rocks" },
    ],
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  for (const category of library) {
    const savedCategory = await prisma.exerciseCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        muscleGroup: category.muscleGroup,
      },
      create: {
        slug: category.slug,
        name: category.name,
        muscleGroup: category.muscleGroup,
      },
    });

    for (const exercise of category.exercises) {
      const slug = slugify(exercise.name);
      const existing = await prisma.exercise.findFirst({
        where: { slug, userId: null },
      });

      if (existing) {
        await prisma.exercise.update({
          where: { id: existing.id },
          data: {
            name: exercise.name,
            equipment: exercise.equipment,
            categoryId: savedCategory.id,
            isCustom: false,
          },
        });
        continue;
      }

      await prisma.exercise.create({
        data: {
          name: exercise.name,
          slug,
          equipment: exercise.equipment,
          categoryId: savedCategory.id,
          isCustom: false,
        },
      });
    }
  }

  console.log("Seeded MUSE exercise library.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
