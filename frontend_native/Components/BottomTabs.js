import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import DashboardScreen from "../Screens/Dashboard";
import ScanScreen from "../Screens/Scan";
import EventScreen from "../Screens/Event";
import OfflineTicketGeneration from "../Screens/Ticket";
import ReportScreen from "../Screens/Report";

import GaugeIcon from "../assets/BottomTabIcons/Gauge.svg";
import TicketIcon from "../assets/BottomTabIcons/Ticket.svg";
import BarcodeIcon from "../assets/BottomTabIcons/Barcode.svg";
import BellIcon from "../assets/BottomTabIcons/Bell.svg";
import ScrollIcon from "../assets/BottomTabIcons/Scroll.svg";

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
              <GaugeIcon
                width={size}
                height={size}
                fill={color}
                color={color}
              />
            );
          } else if (route.name === "Tickets") {
            return (
              <TicketIcon
                width={size}
                height={size}
                fill={color}
                color={color}
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
                <BarcodeIcon
                  width={28}
                  height={28}
                  color="#ffffff"
                  fill={color}
                />
              </View>
            );
          } else if (route.name === "Event") {
            return (
              <BellIcon width={size} height={size} fill={color} color={color} />
            );
          } else if (route.name === "Report") {
            return (
              <ScrollIcon
                width={size}
                height={size}
                fill={color}
                color={color}
              />
            );
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tickets" component={OfflineTicketGeneration} />
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
      <Tab.Screen name="Report" component={ReportScreen} />
    </Tab.Navigator>
  );
}
