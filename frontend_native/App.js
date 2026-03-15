import { NavigationContainer } from "@react-navigation/native";
import Navigations from "./Configs/Navigations";
import { useRef } from "react";

export default function App() {
  const navigationRef = useRef(null);

  return (
    <NavigationContainer ref={navigationRef}>
      <Navigations navigationRef={navigationRef} />
    </NavigationContainer>
  );
}
