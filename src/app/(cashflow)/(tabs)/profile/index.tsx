import { Stack } from "expo-router";
import { ProfileContent } from "@/components/profile/ProfileContent";

export default function ProfileScreen() {
  return (
    <>
      <Stack.Title>Profile</Stack.Title>
      <ProfileContent />
    </>
  );
}
