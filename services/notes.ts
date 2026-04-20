import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const TOKEN_KEY = "auth_token";

export async function createNote(transcript: string, structuredData?: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const response = await api.post(
    "/notes",
    {
      transcript,
      structured_data: structuredData ?? null,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getNotes() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const response = await api.get("/notes", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}