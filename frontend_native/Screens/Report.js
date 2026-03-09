import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import tw from "twrnc";
import UserAuth from "../Configs/UserAuth";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import globalApi from "../Configs/globalApi";
import { Ionicons } from "@expo/vector-icons";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReportScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [expiredEvents, setExpiredEvents] = useState([]);

  useEffect(() => {
    const fetchExpiredEvents = async () => {
      try {
        const result = await globalApi.getExpiredEvents();
        setExpiredEvents(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    const fetchUser = async () => {
      const storedUser = await UserAuth.getUserAuth();
      if (storedUser) {
        setUser(storedUser);
      }
    };

    fetchUser();
    fetchExpiredEvents();
  }, []);

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* ── User Profile Card ── */}
      <View
        style={[
          tw`flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-100`,
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          },
        ]}
      >
        {/* Avatar */}
        <Image
          source={require("../assets/default-avatar.jpg")}
          style={tw`w-12 h-12 rounded-full mr-3`}
        />

        {/* Name */}
        <Text style={tw`flex-1 text-base font-bold text-gray-800`}>
          {user?.username ?? "—"}
        </Text>

        {/* Logout Button */}
        <TouchableOpacity
          style={tw`bg-indigo-700 px-4 py-2 rounded-xl`}
          onPress={() => {
            UserAuth.logout();
            navigation.navigate("login");
          }}
        >
          <Text style={tw`text-white text-xs font-bold tracking-wide`}>
            LOG OUT
          </Text>
        </TouchableOpacity>
      </View>
      {/* ── Header ── */}
      <View style={tw`px-5 pt-4 pb-3 bg-white border-b border-gray-100`}>
        <Text style={tw`text-3xl font-bold text-indigo-600`}>Reports</Text>
        <Text style={tw`text-gray-400 text-sm mt-0.5`}>
          View all ended events
        </Text>
      </View>

      {/* ── Event List ── */}
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-5 pt-5 pb-28`}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <View style={tw`flex-row items-center mb-4`}>
          <View style={tw`w-1 h-5 bg-indigo-500 rounded-full mr-2`} />
          <Text style={tw`text-sm font-bold text-gray-700 tracking-wide`}>
            ENDED EVENTS
          </Text>
          <View style={tw`ml-2 bg-indigo-100 px-2 py-0.5 rounded-full`}>
            <Text style={tw`text-indigo-600 text-xs font-bold`}>
              {expiredEvents.length}
            </Text>
          </View>
        </View>

        {expiredEvents.length > 0 ? (
          expiredEvents
            .sort((a, b) => new Date(b.Date) - new Date(a.Date))
            .map((event) => (
              <View
                key={event.documentId}
                style={[
                  tw`bg-white rounded-2xl px-5 py-4 mb-3 flex-row items-center border border-gray-100`,
                  {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                  },
                ]}
              >
                {/* Icon */}
                <View
                  style={tw`w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-4`}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                </View>

                {/* Info */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-gray-800`}>
                    {event.Name}
                  </Text>
                  <Text style={tw`text-xs text-gray-400 mt-0.5`}>
                    {formatDate(event.Date)}
                  </Text>
                </View>

                {/* Ended badge */}
                <View style={tw`bg-gray-100 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-gray-500 text-xs font-semibold`}>
                    Ended
                  </Text>
                </View>
              </View>
            ))
        ) : (
          <View style={tw`items-center justify-center py-20`}>
            <Ionicons name="calendar-outline" size={48} color="#E0E7FF" />
            <Text style={tw`text-indigo-400 font-bold mt-3`}>
              No Ended Events
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>
              Completed events will appear here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Logout Button ── */}
      {/* <View
        style={[
          tw`absolute bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-white border-t border-gray-100`,
        ]}
      >
        <TouchableOpacity
          style={tw`flex-row items-center justify-center bg-red-50 border border-red-200 rounded-xl py-4`}
          onPress={() => {
            UserAuth.logout();
            navigation.navigate("login");
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#EF4444"
            style={tw`mr-2`}
          />
          <Text style={tw`text-red-500 font-bold text-sm`}>Log Out</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}
