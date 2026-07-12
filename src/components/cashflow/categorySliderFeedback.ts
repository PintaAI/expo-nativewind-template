import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

type WheelPickerFeedbackModule = {
  triggerSoundAndImpact: () => void;
};

let wheelPickerFeedbackModule: WheelPickerFeedbackModule | null = null;
let wheelPickerFeedbackLoadPromise: Promise<void> | null = null;

export function loadCategorySliderFeedback() {
  if (Platform.OS !== "ios" || wheelPickerFeedbackLoadPromise) return;

  wheelPickerFeedbackLoadPromise = import("@quidone/react-native-wheel-picker-feedback")
    .then((module) => {
      wheelPickerFeedbackModule = module.default;
    })
    .catch(() => {
      wheelPickerFeedbackModule = null;
    });
}

function triggerNativeCategorySliderFeedback() {
  if (Platform.OS !== "ios") return false;
  if (!wheelPickerFeedbackModule) loadCategorySliderFeedback();

  if (!wheelPickerFeedbackModule) return false;
  wheelPickerFeedbackModule.triggerSoundAndImpact();
  return true;
}

export function playCategorySliderFeedback(feedback: "impact" | "selection" = "impact") {
  if (triggerNativeCategorySliderFeedback()) return;

  const haptic = feedback === "selection"
    ? Haptics.selectionAsync()
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);

  haptic.catch(() => {});
}
