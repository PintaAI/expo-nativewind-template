import * as ImagePicker from "expo-image-picker";

export type PickedUploadImage = {
  uri: string;
  name: string;
  type: string;
};

export async function pickUploadImage(aspect: [number, number] = [1, 1]): Promise<PickedUploadImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error("Photo library permission is required to upload an image.");

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect,
    quality: 0.85,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  const type = asset.mimeType ?? "image/jpeg";
  const extension = type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";

  return {
    uri: asset.uri,
    name: asset.fileName ?? `upload.${extension}`,
    type,
  };
}

export function appendUploadImage(formData: FormData, field: string, image: PickedUploadImage) {
  formData.append(field, {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);
}
