import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState, useRef } from "react";
import { AppState } from "react-native";
import LoginPage from "../Pages/Login";
import UserAuth from "./UserAuth";
import HomePage from "../Pages/Home";
import GenerateQRScreenSharing from "../Pages/GenerateQRSharing";
import globalApi from "./globalApi";

const Stack = createNativeStackNavigator();

export default function Navigations() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef(null);

  // Initial auth check on cold start
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await UserAuth.getUserAuth();
        if (storedUser) {
          const resp = await globalApi.checkUser({
            identifier: storedUser.username,
            password: storedUser.password,
          });

          if (resp.ok && resp.data?.jwt) {
            // ✅ Valid login
            setUser(storedUser);
          } else if (resp.status === 500) {
            // ✅ Strapi cold-starting — trust stored user
            console.log("Strapi cold start detected, skipping verification");
            setUser(storedUser);
          } else {
            // ❌ Invalid credentials
            UserAuth.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // ✅ On network/parse error, trust stored user
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

  // AppState check — runs when app comes back from background
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (appState.current === "background" && nextState === "active") {
          try {
            const storedUser = await UserAuth.getUserAuth();
            if (!storedUser) {
              navigationRef.current?.navigate("login");
              return;
            }
            const resp = await globalApi.checkUser({
              identifier: storedUser.username,
              password: storedUser.password,
            });

            // ✅ Only force logout on 401/400, not on 500 (cold start)
            if (!resp.ok && resp.status !== 500) {
              UserAuth.logout();
              navigationRef.current?.navigate("login");
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
      ref={navigationRef}
    >
      <Stack.Screen name="login" component={LoginPage} />
      <Stack.Screen name="home" component={HomePage} />
      <Stack.Screen name="generateQR" component={GenerateQRScreenSharing} />
    </Stack.Navigator>
  );
}
