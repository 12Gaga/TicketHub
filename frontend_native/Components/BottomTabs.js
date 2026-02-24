import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Fontisto from "@expo/vector-icons/Fontisto";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import DashboardScreen from "../Screens/Dashboard";
import ScanScreen from "../Screens/Scan";
import SaleScreen from "../Screens/Sale";
import EventScreen from "../Screens/Event";
import SettingScreen from "../Screens/Setting";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1976D2",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Dashboard") {
            return (
              <MaterialCommunityIcons
                name="view-dashboard"
                size={24}
                color="black"
              />
            );
          } else if (route.name === "Scan") {
            return <AntDesign name="scan" size={24} color="black" />;
          } else if (route.name === "Sales") {
            return <Fontisto name="ticket" size={24} color="black" />;
          } else if (route.name === "Events") {
            return <SimpleLineIcons name="event" size={24} color="black" />;
          } else if (route.name === "Settings") {
            return <Ionicons name="settings-sharp" size={24} color="black" />;
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Sales" component={SaleScreen} />
      <Tab.Screen name="Events" component={EventScreen} />
      <Tab.Screen name="Settings" component={SettingScreen} />
    </Tab.Navigator>
  );
}
