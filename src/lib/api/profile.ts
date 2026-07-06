import { apiPutForm } from "./client";

export type ProfileUpdateResult = {
  status: "success";
  message: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

export function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  return apiPutForm<ProfileUpdateResult>("/profile", formData);
}
