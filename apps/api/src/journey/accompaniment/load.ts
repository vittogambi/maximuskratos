import { REVIEW_ESTIMATE_MINUTES } from './vocab';

export type LoadInput = {
  weeklyMinutes: number | null;
  occasions: number | null;
  minutesPerOccasion: number | null;
  maintenanceMinutes: number;
  /** Null uses the visible estimate. Zero is a short review and is allowed. */
  reviewMinutes: number | null;
};

export type LoadFit = {
  occasions: number | null;
  minutesPerOccasion: number | null;
  maintenanceMinutes: number;
  reviewMinutes: number;
  reviewIsEstimate: boolean;
  newWorkMinutes: number | null;
  totalMinutes: number | null;
  fits: boolean | null;
  adaptedReview: boolean;
};

/** New work, maintenance and review together. They never add up past the declared budget. */
export function fitLoad(input: LoadInput): LoadFit {
  const reviewIsEstimate = input.reviewMinutes == null;
  let reviewMinutes = input.reviewMinutes ?? REVIEW_ESTIMATE_MINUTES;
  const occasions = input.occasions;
  const minutesPerOccasion = input.minutesPerOccasion;
  const maintenanceMinutes = Math.max(0, input.maintenanceMinutes);
  const newWorkMinutes = occasions != null && minutesPerOccasion != null ? occasions * minutesPerOccasion : null;
  if (input.weeklyMinutes == null || newWorkMinutes == null) {
    return {
      occasions,
      minutesPerOccasion,
      maintenanceMinutes,
      reviewMinutes,
      reviewIsEstimate,
      newWorkMinutes,
      totalMinutes: null,
      fits: null,
      adaptedReview: false,
    };
  }
  let total = newWorkMinutes + maintenanceMinutes + reviewMinutes;
  let adaptedReview = false;
  if (total > input.weeklyMinutes && reviewIsEstimate) {
    const room = input.weeklyMinutes - newWorkMinutes - maintenanceMinutes;
    reviewMinutes = Math.max(0, room);
    total = newWorkMinutes + maintenanceMinutes + reviewMinutes;
    adaptedReview = true;
  }
  return {
    occasions,
    minutesPerOccasion,
    maintenanceMinutes,
    reviewMinutes,
    reviewIsEstimate,
    newWorkMinutes,
    totalMinutes: total,
    fits: total <= input.weeklyMinutes,
    adaptedReview,
  };
}
