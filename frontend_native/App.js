import { NavigationContainer } from "@react-navigation/native";
import Navigations from "./Configs/Navigations";
import { useRef } from "react";
import { StatusBar } from "react-native";
import { useFonts } from "expo-font";
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function App() {
  const navigationRef = useRef(null);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Navigations navigationRef={navigationRef} />
    </NavigationContainer>
  );
}
