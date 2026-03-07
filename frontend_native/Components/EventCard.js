import { useRef, useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, Animated, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import globalApi from "../Configs/globalApi";
import { EventContext } from "../Configs/AuthContext";
import { ActivityIndicator } from "react-native";

const GRAD_PALETTES = [
  ["#7C3AED", "#4F46E5"], // violet → indigo
  ["#0EA5E9", "#6366F1"], // sky → indigo
  ["#EC4899", "#8B5CF6"], // pink → violet
  ["#F59E0B", "#EF4444"], // amber → red
  ["#10B981", "#0EA5E9"], // emerald → sky
];

function formatDate(dateStr) {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "TBA";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getStatus(event) {
  if (!event.On_Live)
    return { label: "Ended", color: "#6B7280", bg: "bg-gray-100" };
  const today = new Date();
  const eventDate = event.Date ? new Date(event.Date) : null;
  if (!eventDate)
    return { label: "Upcoming", color: "#7C3AED", bg: "bg-violet-100" };
  if (eventDate < today)
    return { label: "Ended", color: "#6B7280", bg: "bg-gray-100" };
  return { label: "Upcoming", color: "#7C3AED", bg: "bg-violet-100" };
}

export default function EventCard({
  event,
  onPress,
  visible,
  setVisible,
  onEdit,
  onComplete,
  index = 0,
  onDelete,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const palette = GRAD_PALETTES[index % GRAD_PALETTES.length];
  const status = getStatus(event);
  const [eventBookedTicket, setEventBookedTicket] = useState([]);
  const [eventTicketType, setEventTicketType] = useState([]);
  const { createTicketLimit, loading } = useContext(EventContext);

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
    }).start();

  useEffect(() => {
    const fetchBookedTicketsInEvent = async () => {
      try {
        const result = await globalApi.getBookedTicketByEvent(event.documentId);
        console.log("BookedTickets:", result.data.data);
        setEventBookedTicket(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    const fetchTicketTypeInEvent = async () => {
      try {
        const result = await globalApi.getTicketLimit(event.documentId);
        console.log("EventTikcet", result.data.data);
        let tickets = result.data.data;
        setEventTicketType(tickets);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    fetchTicketTypeInEvent();
    fetchBookedTicketsInEvent();

    return () => {};
  }, [createTicketLimit]);

  return (
    <Animated.View
      style={[
        tw`mb-4`,
        {
          transform: [{ scale: scaleAnim }],
          shadowColor: palette[0],
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress?.(event)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          style={tw`bg-white rounded-3xl overflow-hidden border border-gray-100`}
        >
          {/* ── Header gradient ── */}
          <LinearGradient
            colors={palette}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`px-5 pt-4 pb-5`}
          >
            {/* Status badge + actions row */}
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`bg-white bg-opacity-20 px-3 py-1 rounded-full`}>
                <Text style={tw`text-white text-xs font-bold tracking-wide`}>
                  {status.label}
                </Text>
              </View>

              <View style={tw`flex-row gap-2`}>
                {onEdit && (
                  <TouchableOpacity
                    onPress={() => onEdit?.(event)}
                    style={tw`w-8 h-8 rounded-xl bg-white bg-opacity-20 items-center justify-center`}
                  >
                    <Ionicons name="pencil-outline" size={15} color="#fff" />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    onPress={() => onDelete?.(event)}
                    style={tw`w-8 h-8 rounded-xl bg-white bg-opacity-20 items-center justify-center`}
                  >
                    <Ionicons name="trash-outline" size={15} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Event name */}
            <Text style={tw`text-white text-2xl font-bold tracking-tight`}>
              {event.Name}
            </Text>
          </LinearGradient>

          {/* ── Details ── */}
          <View style={tw`px-5 pt-4 pb-2`}>
            <View style={tw`flex-row items-center mb-2.5`}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color="#7C3AED"
                style={tw`mr-2`}
              />
              <Text style={tw`text-gray-600 text-sm font-medium`}>
                {formatDate(event.Date)}
              </Text>
            </View>
            <View style={tw`flex-row items-center mb-2.5`}>
              <Ionicons
                name="time-outline"
                size={15}
                color="#7C3AED"
                style={tw`mr-2`}
              />
              <Text style={tw`text-gray-600 text-sm font-medium`}>
                {formatTime(event.Time)}
              </Text>
            </View>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons
                name="location-outline"
                size={15}
                color="#7C3AED"
                style={tw`mr-2`}
              />
              <Text style={tw`text-gray-600 text-sm font-medium`}>
                {event.Venue ?? "TBA"}
              </Text>
            </View>

            {/* Description */}
            {event.Description ? (
              <Text
                style={tw`text-gray-400 text-sm leading-5 mb-4`}
                numberOfLines={2}
              >
                {event.Description}
              </Text>
            ) : null}

            {/* ── Stats row ── */}
            <View style={tw`flex-row border-t border-gray-100 pt-3 mb-3`}>
              <View style={tw`flex-1 items-center`}>
                <View style={tw`flex-row items-center mb-0.5`}>
                  <Ionicons
                    name="ticket-outline"
                    size={12}
                    color="#6B7280"
                    style={tw`mr-1`}
                  />
                  <Text
                    style={tw`text-gray-400 text-xs font-semibold tracking-wide`}
                  >
                    Sold
                  </Text>
                </View>
                <Text style={tw`text-gray-800 text-base font-bold`}>
                  {eventBookedTicket.length}
                </Text>
              </View>

              <View style={tw`w-px bg-gray-100`} />

              <View style={tw`w-px bg-gray-100`} />

              <View style={tw`flex-1 items-center`}>
                <View style={tw`flex-row items-center mb-0.5`}>
                  <Ionicons
                    name="people-outline"
                    size={12}
                    color="#6B7280"
                    style={tw`mr-1`}
                  />
                  <Text
                    style={tw`text-gray-400 text-xs font-semibold tracking-wide`}
                  >
                    Types
                  </Text>
                </View>
                <Text style={tw`text-gray-800 text-base font-bold`}>
                  {eventTicketType.length}
                </Text>
              </View>
            </View>

            {/* ── Capacity bars — limited tickets only ── */}
            {eventTicketType
              ?.filter((tl) => tl.isLimited === true)
              .map((tl) => {
                const soldTicket = eventBookedTicket.filter(
                  (booked) => booked.ticket.documentId === tl.ticket.documentId,
                );
                const sold = soldTicket.length ?? 0;
                const limit = tl.Limit ?? 0;
                const pct =
                  limit > 0
                    ? Math.min(100, Math.round((sold / limit) * 100))
                    : 0;

                return (
                  <View key={tl.documentId} style={tw`mb-3`}>
                    <View style={tw`flex-row justify-between mb-1.5`}>
                      <Text style={tw`text-gray-400 text-xs font-semibold`}>
                        Capacity for {tl.ticket?.Name ?? "Ticket"}
                      </Text>
                      <Text style={tw`text-gray-500 text-xs font-semibold`}>
                        {sold} / {limit} ({pct}%)
                      </Text>
                    </View>
                    <View
                      style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}
                    >
                      <LinearGradient
                        colors={palette}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[tw`h-2 rounded-full`, { width: `${pct}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        key={event.Name}
      >
        <View
          style={tw`flex-1 bg-white bg-opacity-50 items-center justify-center px-8`}
        >
          <View style={tw`bg-white rounded-2xl p-6 w-full`}>
            <Text style={tw`text-lg font-bold text-gray-800 mb-2`}>
              Has {event.Name} ended?
            </Text>
            <View style={tw`flex-row gap-3`}>
              {/* Completed */}
              <TouchableOpacity
                onPress={() => onComplete?.(event)}
                style={tw`flex-1 py-3 rounded-xl bg-indigo-600 items-center`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={tw`text-white font-semibold text-sm`}>
                    Ended
                  </Text>
                )}
              </TouchableOpacity>
              {/* Cancel */}
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={tw`flex-1 py-3 rounded-xl border border-gray-200 items-center`}
              >
                <Text style={tw`text-gray-500 font-semibold text-sm`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
