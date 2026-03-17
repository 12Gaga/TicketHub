import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import LoginPage from "../Pages/Login";
import UserAuth from "./UserAuth";
import HomePage from "../Pages/Home";
import GenerateQRScreenSharing from "../Pages/GenerateQRSharing";
import globalApi from "./globalApi";
import { setNavigator } from "./globalApi";

const Stack = createNativeStackNavigator();

// ✅ Check if JWT token is expired
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const checkUserWithRetry = async (storedUser, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    const resp = await globalApi.checkUser({
      identifier: storedUser.username,
      password: storedUser.password,
    });

    console.log(`Attempt ${i + 1} - status:`, resp.status, "ok:", resp.ok);

    if (resp.ok && resp.data?.jwt) {
      return { valid: true, token: resp.data.jwt }; // ✅ return fresh token
    } else if (resp.status === 401) {
      return { valid: false }; // ❌ wrong password
    } else {
      if (i < retries) {
        console.log(`Cold start or error, retrying in 3s...`);
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
  }
  return { valid: true, coldStart: true }; // cold start — trust stored user
};

export default function Navigations({ navigationRef }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await UserAuth.getUserAuth();
        if (!storedUser) {
          setUser(null);
          return;
        }

        // ✅ Step 1: check token expiry first (no API call needed)
        if (isTokenExpired(storedUser.token)) {
          console.log("Token expired — logging out");
          await UserAuth.logout();
          setUser(null);
          return;
        }

        // ✅ Step 2: token valid — verify password in case it changed
        const { valid, token } = await checkUserWithRetry(storedUser);
        if (valid) {
          // ✅ update token if we got a fresh one
          if (token) {
            const updatedUser = { ...storedUser, token };
            await UserAuth.setUserAuth(updatedUser);
            setUser(updatedUser);
          } else {
            setUser(storedUser);
          }
        } else {
          await UserAuth.logout();
          setUser(null);
        }
      } catch (error) {
        console.error("Error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ── After auth resolves, reset stack to home ──
  useEffect(() => {
    if (!loading && user) {
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: "home" }],
      });
    }
  }, [loading, user]);

  // ── Pass navigator to globalApi for auto logout on 401 ──
  useEffect(() => {
    if (navigationRef.current) {
      setNavigator(navigationRef.current);
    }
  }, [navigationRef.current]);

  // ── When app comes back to foreground ──
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (appState.current === "background" && nextState === "active") {
          try {
            const storedUser = await UserAuth.getUserAuth();

            if (!storedUser) {
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: "login" }],
              });
              return;
            }

            // ✅ token expired — logout immediately without API call
            if (isTokenExpired(storedUser.token)) {
              await UserAuth.logout();
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: "login" }],
              });
              return;
            }

            // ✅ token valid — still verify password in case it changed
            const { valid, token } = await checkUserWithRetry(storedUser);
            if (!valid) {
              await UserAuth.logout();
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: "login" }],
              });
            } else if (token) {
              // ✅ refresh stored token
              await UserAuth.setUserAuth({ ...storedUser, token });
            }
          } catch (err) {
            console.log("AppState auth check error:", err);
          }
        }
        appState.current = nextState;
      },
    );
    return () => subscription.remove();
  }, []);

  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? "home" : "login"}
    >
      <Stack.Screen name="login" component={LoginPage} />
      <Stack.Screen name="home" component={HomePage} />
      <Stack.Screen name="generateQR" component={GenerateQRScreenSharing} />
    </Stack.Navigator>
  );
}
