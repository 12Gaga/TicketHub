import { useState, useEffect } from "react";
import { useContext } from "react";
import { Picker } from "@react-native-picker/picker";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import globalApi from "../Configs/globalApi";
import PopUpAlert from "./PopUpAlert";
import { ScanContext } from "../Configs/AuthContext";

function formatDateTime(isoString) {
  if (!isoString) return { time: "—", date: "—" };
  const d = new Date(isoString);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return { time, date };
}

export default function CheckInAudience() {
  const { recentCheckIn, setRecentCheckIn } = useContext(ScanContext);
  const [events, setEvents] = useState([]);
  const [checkInAudience, setCheckInAudience] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failModal, setFailModal] = useState(false);

  useEffect(() => {
    if (!recentCheckIn?.event?.documentId) return;
    if (selectedEvent !== recentCheckIn.event.documentId) return;

    setCheckInAudience((current) => {
      const next = [
        recentCheckIn,
        ...(current ?? []).filter(
          (item) =>
            item.Name !== recentCheckIn.Name ||
            item.DateTime !== recentCheckIn.DateTime,
        ),
      ];
      return next;
    });
    setRecentCheckIn(null);
  }, [recentCheckIn, selectedEvent]);

  const changeEvent = async (eventId) => {
    setSelectedEvent(eventId);
    setRecentCheckIn(null);
    if (!eventId) {
      setCheckInAudience([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await globalApi.getCheckInAudience(eventId);
      if (resp.ok && resp.data?.data) {
        setCheckInAudience(resp.data.data);
      }
    } catch (err) {
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await globalApi.getEvents();
        setEvents(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    fetchEvents();
  }, []);

  return (
    <View style={tw`flex-1 mt-3`}>
      {/* ── Event Picker ── */}
      <View
        style={tw`border border-gray-200 rounded-xl bg-white overflow-hidden flex-row items-center px-3 mb-5`}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color="#6366F1"
          style={tw`mr-2`}
        />
        <Picker
          selectedValue={selectedEvent}
          onValueChange={(eventValue) => changeEvent(eventValue)}
          style={tw`flex-1 h-13 text-sm text-gray-700`}
        >
          <Picker.Item label="Select an event" value={null} color="#9CA3AF" />
          {(events ?? []).map((event) => (
            <Picker.Item
              key={event.documentId}
              label={event.Name}
              value={event.documentId}
              color="#111827"
            />
          ))}
        </Picker>
      </View>

      {/* ── Recent Check-ins Card ── */}
      <View
        style={tw`bg-white rounded-2xl border border-gray-100 overflow-hidden`}
      >
        {/* Card header */}
        <View style={tw`px-5 pt-5 pb-3`}>
          <Text style={tw`text-base font-bold text-gray-800`}>
            Recent Check-ins
          </Text>
          <Text style={tw`text-xs text-gray-400 mt-0.5`}>
            Latest attendees who have checked in
          </Text>
        </View>

        {/* Divider */}
        <View style={tw`h-px bg-gray-100 mx-5`} />

        {/* ── List ── */}
        {loading ? (
          <View style={tw`items-center py-10`}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={tw`text-gray-400 text-xs mt-2`}>Loading...</Text>
          </View>
        ) : !selectedEvent ? (
          <View style={tw`items-center py-10`}>
            <Ionicons name="calendar-outline" size={32} color="#E0E7FF" />
            <Text style={tw`text-gray-400 text-sm mt-2`}>
              Select an event to view check-ins
            </Text>
          </View>
        ) : (checkInAudience ?? []).length === 0 ? (
          <View style={tw`items-center py-10`}>
            <Ionicons name="people-outline" size={32} color="#E0E7FF" />
            <Text style={tw`text-gray-400 text-sm mt-2`}>No check-ins yet</Text>
          </View>
        ) : (
          <ScrollView style={tw`max-h-96`} showsVerticalScrollIndicator={false}>
            {(checkInAudience ?? []).map((item, index) => {
              const { time, date } = formatDateTime(item.DateTime);
              const isLast = index === (checkInAudience ?? []).length - 1;

              return (
                <View key={item.documentId ?? index}>
                  <View
                    style={tw`flex-row items-center justify-between px-5 py-4`}
                  >
                    {/* Left — name + event-ticket */}
                    <View style={tw`flex-1 mr-4`}>
                      <Text style={tw`text-sm font-bold text-gray-800 mb-0.5`}>
                        {item.Name ?? "—"}
                      </Text>
                      <Text style={tw`text-xs text-gray-400`} numberOfLines={1}>
                        {item.event?.Name ?? item.Event?.Name ?? "—"}
                      </Text>
                    </View>

                    {/* Right — time + date */}
                    <View style={tw`items-end`}>
                      <Text style={tw`text-sm font-semibold text-gray-700`}>
                        {time}
                      </Text>
                      <Text style={tw`text-xs text-gray-400 mt-0.5`}>
                        {date}
                      </Text>
                    </View>
                  </View>

                  {/* Divider between rows */}
                  {!isLast && <View style={tw`h-px bg-gray-50 mx-5`} />}
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={tw`h-2`} />
        <PopUpAlert
          success={failModal}
          text={"Error fetching check-ins audience"}
          header={"Error!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
      </View>
    </View>
  );
}
