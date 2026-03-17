import { NavigationContainer } from "@react-navigation/native";
import Navigations from "./Configs/Navigations";
import { useRef } from "react";
import { StatusBar } from "react-native";

export default function App() {
  const navigationRef = useRef(null);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Navigations navigationRef={navigationRef} />
    </NavigationContainer>
  );
}
