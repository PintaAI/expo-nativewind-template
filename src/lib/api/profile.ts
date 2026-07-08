import type { PickedUploadImage } from "../imageUpload";
import { apiUploadFile } from "./client";

export type ProfileUpdateResult = {
  status: "success";
  message: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

export function updateProfile(name: string, image: PickedUploadImage): Promise<ProfileUpdateResult> {
  return apiUploadFile<ProfileUpdateResult>("/profile", image, {
    method: "PUT",
    fieldName: "image",
    parameters: { name },
  });
}
