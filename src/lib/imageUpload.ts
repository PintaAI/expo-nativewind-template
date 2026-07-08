import * as ImagePicker from "expo-image-picker";

export type PickedUploadImage = {
  uri: string;
  name: string;
  type: string;
};

export async function pickUploadImage(aspect: [number, number] = [1, 1]): Promise<PickedUploadImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
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
