import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";

/**
 * EventCard
 * Props:
 *   - event      : object  (single event from Strapi)
 *   - onPress    : func    (called with event when card is tapped)
 *   - onEdit     : func    (optional edit handler)
 *   - onDelete   : func    (optional delete handler)
 *   - index      : number  (for staggered animation delay)
 */

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

function formatRevenue(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M MMK`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K MMK`;
  return `${n} MMK`;
}

export default function EventCard({
  event,
  onPress,
  onEdit,
  onDelete,
  index = 0,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const palette = GRAD_PALETTES[index % GRAD_PALETTES.length];
  const status = getStatus(event);

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
                  Get sold ticket
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
                  Get Ticket Type
                </Text>
              </View>
            </View>

            {/* ── Capacity bar ── */}

            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between mb-1.5`}>
                <Text style={tw`text-gray-400 text-xs font-semibold`}>
                  Capacity
                </Text>
                <Text style={tw`text-gray-500 text-xs font-semibold`}>
                  do percent
                </Text>
              </View>
              {/* <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
                  <LinearGradient
                    colors={palette}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[tw`h-2 rounded-full`, { width: `${capacityPct}%` }]}
                  />
                </View> */}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
