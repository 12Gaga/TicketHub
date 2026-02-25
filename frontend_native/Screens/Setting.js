import { View, Text, TouchableOpacity } from "react-native";
import tw from "twrnc";
import UserAuth from "../Configs/UserAuth";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import globalApi from "../Configs/globalApi";

export default function SettingScreen() {
  const navigation = useNavigation();
  const [expiredEvents, setExpiredEvents] = useState([]);
  useEffect(() => {
    const fetchExpiredEvents = async () => {
      try {
        const result = await globalApi.getExpiredEvents();
        console.log("ExpiredEvents:", result.data.data);
        setExpiredEvents(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    fetchExpiredEvents();
    return () => {};
  }, []);
  return (
    <SafeAreaView style={tw`flex-1 bg-blue-30`}>
      <Text style={tw`text-[17px] font-bold text-blue-500 underline ml-3 mt-5`}>
        Expired Events
      </Text>

      {expiredEvents.length ? (
        expiredEvents
          .sort((a, b) => new Date(a.Date) - new Date(b.Date))
          .map((event) => {
            return (
              <View
                key={event.documentId}
                style={tw`p-5 bg-white mx-3 mt-3 rounded-lg flex-row items-center justify-between`}
              >
                <Text style={tw`text-[14px] font-bold`}>{event.Name}</Text>
                <Text style={tw`text-[12px] mt-1`}>
                  {event.Date.split("-").reverse().join("-")}
                </Text>
              </View>
            );
          })
      ) : (
        <View style={tw`flex-1 items-center justify-center`}>
          <Text style={tw`text-blue-400 font-bold`}>No Expired Event</Text>
        </View>
      )}
      <TouchableOpacity
        style={tw`bg-blue-500 p-3 rounded-lg absolute bottom-0 left-0 right-0 m-4`}
        onPress={() => {
          UserAuth.logout();
          navigation.navigate("login");
        }}
      >
        <Text style={tw`text-white text-center font-semibold text-[11px]`}>
          Log Out
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
