-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('LB', 'KG');

-- CreateEnum
CREATE TYPE "HeightUnit" AS ENUM ('IN', 'CM');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('UPPER_BODY', 'LOWER_BODY', 'CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'GLUTES', 'QUADS', 'HAMSTRINGS', 'CALVES', 'CORE', 'FULL_BODY', 'CARDIO', 'MOBILITY');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT', 'STRENGTH', 'STEPS', 'WORKOUT_FREQUENCY', 'PROTEIN', 'CALORIES', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FitnessGoalKind" AS ENUM ('FAT_LOSS', 'WEIGHT_LOSS', 'MAINTENANCE', 'MUSCLE_GAIN', 'RECOMPOSITION', 'STRENGTH', 'ENDURANCE');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "PhotoAngle" AS ENUM ('FRONT', 'SIDE', 'BACK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "CardioIntensity" AS ENUM ('EASY', 'MODERATE', 'HARD', 'MAX');

-- CreateEnum
CREATE TYPE "PersonalRecordType" AS ENUM ('HEAVIEST_WEIGHT', 'MOST_REPS', 'HIGHEST_VOLUME', 'ESTIMATED_1RM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "dateOfBirth" TIMESTAMP(3),
    "sex" "Sex",
    "activityLevel" "ActivityLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'LB',
    "heightUnit" "HeightUnit" NOT NULL DEFAULT 'IN',
    "theme" "ThemePreference" NOT NULL DEFAULT 'LIGHT',
    "calorieTarget" INTEGER,
    "proteinTarget" INTEGER,
    "carbsTarget" INTEGER,
    "fatTarget" INTEGER,
    "fiberTarget" INTEGER,
    "waterTargetMl" INTEGER,
    "stepGoal" INTEGER NOT NULL DEFAULT 8000,
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "equipment" TEXT,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "muscleGroups" "MuscleGroup"[],
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "pausedMs" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER,
    "calories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSet" (
    "id" TEXT NOT NULL,
    "workoutExerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "reps" INTEGER,
    "rpe" DOUBLE PRECISION,
    "restSeconds" INTEGER,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "type" "PersonalRecordType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION,
    "reps" INTEGER,
    "workoutId" TEXT,
    "notes" TEXT,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FitnessGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "kind" "FitnessGoalKind",
    "title" TEXT NOT NULL,
    "startValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "unit" TEXT,
    "targetDate" TIMESTAMP(3),
    "exerciseId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TIMESTAMP(3),
    "mealType" "MealType" NOT NULL,
    "foodName" TEXT NOT NULL,
    "servingSize" TEXT,
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyNutrition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sodium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waterMl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardioSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "durationMin" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "pace" TEXT,
    "calories" INTEGER,
    "heartRate" INTEGER,
    "intensity" "CardioIntensity",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardioSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "steps" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "calories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StepEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" "WeightUnit" NOT NULL DEFAULT 'LB',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'in',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "angle" "PhotoAngle" NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "entry" TEXT NOT NULL,
    "energy" INTEGER,
    "motivation" INTEGER,
    "recovery" INTEGER,
    "stress" INTEGER,
    "sleep" INTEGER,
    "hunger" INTEGER,
    "workoutNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseCategory_slug_key" ON "ExerciseCategory"("slug");

-- CreateIndex
CREATE INDEX "Exercise_userId_idx" ON "Exercise"("userId");

-- CreateIndex
CREATE INDEX "Exercise_categoryId_idx" ON "Exercise"("categoryId");

-- CreateIndex
CREATE INDEX "Exercise_name_idx" ON "Exercise"("name");

-- CreateIndex
CREATE INDEX "Exercise_slug_idx" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");

-- CreateIndex
CREATE INDEX "Workout_userId_status_idx" ON "Workout"("userId", "status");

-- CreateIndex
CREATE INDEX "Workout_userId_createdAt_idx" ON "Workout"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutId_order_idx" ON "WorkoutExercise"("workoutId", "order");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseId_idx" ON "WorkoutExercise"("exerciseId");

-- CreateIndex
CREATE INDEX "WorkoutSet_workoutExerciseId_order_idx" ON "WorkoutSet"("workoutExerciseId", "order");

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_exerciseId_type_idx" ON "PersonalRecord"("userId", "exerciseId", "type");

-- CreateIndex
CREATE INDEX "PersonalRecord_userId_achievedAt_idx" ON "PersonalRecord"("userId", "achievedAt");

-- CreateIndex
CREATE INDEX "FitnessGoal_userId_type_idx" ON "FitnessGoal"("userId", "type");

-- CreateIndex
CREATE INDEX "NutritionEntry_userId_date_idx" ON "NutritionEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "DailyNutrition_userId_date_idx" ON "DailyNutrition"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyNutrition_userId_date_key" ON "DailyNutrition"("userId", "date");

-- CreateIndex
CREATE INDEX "CardioSession_userId_date_idx" ON "CardioSession"("userId", "date");

-- CreateIndex
CREATE INDEX "StepEntry_userId_date_idx" ON "StepEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StepEntry_userId_date_key" ON "StepEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "WeightEntry_userId_date_idx" ON "WeightEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "BodyMeasurement_userId_date_idx" ON "BodyMeasurement"("userId", "date");

-- CreateIndex
CREATE INDEX "BodyMeasurement_userId_name_idx" ON "BodyMeasurement"("userId", "name");

-- CreateIndex
CREATE INDEX "ProgressPhoto_userId_date_idx" ON "ProgressPhoto"("userId", "date");

-- CreateIndex
CREATE INDEX "JournalEntry_userId_date_idx" ON "JournalEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExerciseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutExerciseId_fkey" FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalRecord" ADD CONSTRAINT "PersonalRecord_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessGoal" ADD CONSTRAINT "FitnessGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FitnessGoal" ADD CONSTRAINT "FitnessGoal_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionEntry" ADD CONSTRAINT "NutritionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyNutrition" ADD CONSTRAINT "DailyNutrition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardioSession" ADD CONSTRAINT "CardioSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepEntry" ADD CONSTRAINT "StepEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressPhoto" ADD CONSTRAINT "ProgressPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

