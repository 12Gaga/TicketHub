import * as SecureStore from "expo-secure-store";

const USER_KEY = "userData";

const setUserAuth = async (value) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(value));
};

const getUserAuth = async () => {
  const value = await SecureStore.getItemAsync(USER_KEY);
  return value ? JSON.parse(value) : null;
};

const logout = async () => {
  await SecureStore.deleteItemAsync(USER_KEY);
};

export default {
  setUserAuth,
  getUserAuth,
  logout,
};
