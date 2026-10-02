export interface HealthBenefit {
  id: number;
  title: string;
  description: string;
  timeToAchieveHours: number; // Time in hours to unlock this benefit
  icon: any;
}

export const healthBenefits: HealthBenefit[] = [
  {
    id: 1,
    title: "Blood Pressure Drops",
    description: "Your blood pressure and pulse rate start to return to normal.",
    timeToAchieveHours: 0.33, // 20 minutes
    icon: "heart.fill",
  },
  {
    id: 2,
    title: "Oxygen Levels Rise",
    description: "The carbon monoxide level in your blood drops to normal.",
    timeToAchieveHours: 8,
    icon: "lungs.fill",
  },
  {
    id: 3,
    title: "Heart Attack Risk Falls",
    description: "Your risk of having a heart attack begins to decrease.",
    timeToAchieveHours: 24,
    icon: "waveform.path.ecg",
  },
  {
    id: 4,
    title: "Nerve Endings Recover",
    description: "Your ability to smell and taste is enhanced as nerve endings start to regrow.",
    timeToAchieveHours: 48,
    icon: "mouth.fill",
  },
  {
    id: 5,
    title: "Breathing Becomes Easier",
    description: "Lung function improves, making it easier to breathe.",
    timeToAchieveHours: 72,
    icon: "wind",
  },
  {
    id: 6,
    title: "Circulation Improves",
    description: "Your circulation will have improved over the last few weeks.",
    timeToAchieveHours: 2 * 24 * 7, // 2 Weeks
    icon: "arrow.3.trianglepath",
  },
  {
    id: 7,
    title: "Lungs are Healthier",
    description: "Coughing and shortness of breath decrease.",
    timeToAchieveHours: 9 * 30 * 24, // 9 Months
    icon: "lungs.fill",
  },
  {
    id: 8,
    title: "Heart Disease Risk Halved",
    description: "Your risk of coronary heart disease is half that of a smoker.",
    timeToAchieveHours: 365 * 24, // 1 Year
    icon: "heart.slash.circle.fill",
  },
  {
    id: 9,
    title: "Stroke Risk Reduced",
    description: "Your stroke risk is reduced to that of a nonsmoker.",
    timeToAchieveHours: 5 * 365 * 24, // 5 Years
    icon: "brain.head.profile",
  },
  {
    id: 10,
    title: "Lung Cancer Risk Halved",
    description: "Your risk of dying from lung cancer is about half that of a smoker.",
    timeToAchieveHours: 10 * 365 * 24, // 10 Years
    icon: "staroflife.fill",
  },
]; 