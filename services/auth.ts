import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const TOKEN_KEY = "auth_token";

export async function registerUser(fullName: string, email: string, password: string) {
  const response = await api.post("/auth/register", {
    full_name: fullName,
    email,
    password,
  });
  return response.data;
}

export async function loginUser(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await api.post("/auth/login", formData.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const token = response.data.access_token;
  await AsyncStorage.setItem(TOKEN_KEY, token);

  return response.data;
}

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function logoutUser() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getCurrentUser() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const response = await api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}