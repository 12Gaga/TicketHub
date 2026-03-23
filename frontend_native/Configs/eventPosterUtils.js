import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import globalApi from "./globalApi";
import {
  EVENT_POSTER_HEIGHT,
  EVENT_POSTER_PICKER_ASPECT,
  EVENT_POSTER_WIDTH,
} from "./ticketLayout";

const MEDIA_URL_FALLBACK_BASE = "https://loved-kindness-ad57dad94c.strapiapp.com";

const getMediaBaseUrl = () => {
  const apiBaseUrl = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (!apiBaseUrl) {
    return MEDIA_URL_FALLBACK_BASE;
  }

  return apiBaseUrl.replace(/\/api\/?$/, "");
};

export const resolveMediaUrl = (mediaPath) => {
  if (!mediaPath) {
    return null;
  }

  if (String(mediaPath).startsWith("http")) {
    return mediaPath;
  }

  const baseUrl = getMediaBaseUrl();
  const normalizedPath = String(mediaPath).startsWith("/")
    ? mediaPath
    : `/${mediaPath}`;

  return `${baseUrl}${normalizedPath}`;
};

export const pickAndPrepareEventPoster = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: EVENT_POSTER_PICKER_ASPECT,
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  const pickedAsset = result.assets[0];
  const normalizedImage = await ImageManipulator.manipulateAsync(
    pickedAsset.uri,
    [
      {
        resize: {
          width: EVENT_POSTER_WIDTH,
          height: EVENT_POSTER_HEIGHT,
        },
      },
    ],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    ...pickedAsset,
    uri: normalizedImage.uri,
    width: normalizedImage.width,
    height: normalizedImage.height,
    fileName: pickedAsset.fileName || `event-poster-${Date.now()}.jpg`,
    mimeType: "image/jpeg",
  };
};

export const uploadEventPoster = async (imageAsset) => {
  const formData = new FormData();
  formData.append("files", {
    uri: imageAsset.uri,
    name: imageAsset.fileName || "photo.jpg",
    type: imageAsset.mimeType || "image/jpeg",
  });

  const response = await globalApi.uploadFile(formData);
  if (response.ok) {
    return response.data?.[0]?.id ?? null;
  }

  return null;
};
