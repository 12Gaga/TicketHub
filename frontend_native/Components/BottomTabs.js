import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "../Screens/Dashboard";
import ScanScreen from "../Screens/Scan";
import SaleScreen from "../Screens/Sale";
import EventScreen from "../Screens/Event";
import SettingScreen from "../Screens/Setting";
import { Image, View } from "react-native";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#0000FF",
        tabBarInactiveTintColor: "black",
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Dashboard") {
            return (
              <Image
                source={require("../assets/BottomTabIcons/Dashboard.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: "contain",
                }}
              />
            );
          } else if (route.name === "Tickets") {
            return (
              <Image
                source={require("../assets/BottomTabIcons/Ticket.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: "contain",
                }}
              />
            );
          } else if (route.name === "Scan") {
            return (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#1A3FFF",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#1A3FFF",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Image
                  source={require("../assets/BottomTabIcons/Barcode.png")}
                  style={{
                    width: 28,
                    height: 28,
                    tintColor: "#FFFFFF",
                    resizeMode: "contain",
                  }}
                />
              </View>
            );
          } else if (route.name === "Event") {
            return (
              <Image
                source={require("../assets/BottomTabIcons/Bell.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: "contain",
                }}
              />
            );
          } else if (route.name === "Report") {
            return (
              <Image
                source={require("../assets/BottomTabIcons/Scroll.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: color,
                  resizeMode: "contain",
                }}
              />
            );
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tickets" component={SaleScreen} />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIconStyle: {
            marginTop: 7,
          },
        }}
      />
      <Tab.Screen name="Event" component={EventScreen} />
      <Tab.Screen name="Report" component={SettingScreen} />
    </Tab.Navigator>
  );
}
