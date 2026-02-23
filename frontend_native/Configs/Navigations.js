import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import LoginPage from "../Pages/Login";
import UserAuth from "./UserAuth";

const Stack = createNativeStackNavigator();

export default function Navigations() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("user : ", user);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await UserAuth.getUserAuth();
        console.log("storedUser:", storedUser);
        setUser(storedUser || null);
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  console.log("status", loading);
  if (loading) return null;
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? "home" : "login"}
    >
      <Stack.Screen name="login" component={LoginPage} />
    </Stack.Navigator>
  );
}
