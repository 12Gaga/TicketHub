import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import LoginPage from "../Pages/Login";
import UserAuth from "./UserAuth";
import HomePage from "../Pages/Home";
import GenerateQRScreenSharing from "../Pages/GenerateQRSharing";
import globalApi from "./globalApi";

const Stack = createNativeStackNavigator();

export default function Navigations({ navigationRef }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  // ── Shared retry helper ──────────────────────────────────
  const checkUserWithRetry = async (storedUser, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      const resp = await globalApi.checkUser({
        identifier: storedUser.username,
        password: storedUser.password,
      });

      console.log(`Attempt ${i + 1} - status:`, resp.status, "ok:", resp.ok);

      if (resp.ok && resp.data?.jwt) {
        return { valid: true };
      } else if (resp.status === 401) {
        // Explicit wrong credentials — stop retrying
        return { valid: false };
      } else {
        // 500 / cold start / network error — retry after delay
        if (i < retries) {
          console.log(`Cold start or error, retrying in 3s...`);
          await new Promise((res) => setTimeout(res, 3000));
        }
      }
    }
    // All retries exhausted — assume cold start, keep logged in
    return { valid: true, coldStart: true };
  };

  // ── On app open: check stored credentials ────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await UserAuth.getUserAuth();
        if (storedUser) {
          const { valid } = await checkUserWithRetry(storedUser);
          if (valid) {
            setUser(storedUser);
          } else {
            UserAuth.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error:", error);
        try {
          const storedUser = await UserAuth.getUserAuth();
          if (storedUser) setUser(storedUser);
          else setUser(null);
        } catch {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ── After auth resolves, reset stack to home ─────────────
  useEffect(() => {
    if (!loading && user) {
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: "home" }],
      });
    }
  }, [loading, user]);

  // ── When app comes back to foreground ────────────────────
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

            const { valid } = await checkUserWithRetry(storedUser);
            if (!valid) {
              UserAuth.logout();
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: "login" }],
              });
              // if valid — do nothing, user stays on current screen
            }
          } catch (err) {
            console.log("AppState auth check error:", err);
            // network error — do nothing, keep user logged in
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
