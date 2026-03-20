import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import globalApi from "../Configs/globalApi";

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ title, icon, iconBg, iconColor, children }) {
  return (
    <View
      style={[
        tw`bg-white rounded-3xl p-5 mb-4 border border-gray-100`,
        {
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 3,
        },
      ]}
    >
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-sm font-semibold text-gray-500`}>{title}</Text>
        <View
          style={[
            tw`w-9 h-9 rounded-full items-center justify-center`,
            { backgroundColor: iconBg },
          ]}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      </View>
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────
function ProgressBar({ value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden mt-2 mb-1`}>
      <View
        style={[
          tw`h-full rounded-full`,
          { width: `${pct}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [checkIn, setCheckIn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch events on mount ──
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const result = await globalApi.getEvents();
      setEvents(result.data.data);
    } catch (error) {
      console.log("Error fetching events:", error);
    }
  };

  // ── Fetch tickets + check-in for selected event ──
  const fetchData = async (eventID) => {
    if (!eventID) return;
    setLoading(true);
    try {
      const resp = await globalApi.getBookedTicketByEvent(eventID);
      if (resp.ok) {
        setBookedTickets(resp.data.data);
      }
      const checkResp = await globalApi.getCheckInAudience(eventID);
      if (checkResp.ok) {
        setCheckIn(checkResp.data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeEvent = (eventID) => {
    setSelectedEvent(eventID);
    setBookedTickets([]);
    setCheckIn([]);
    fetchData(eventID);
  };

  // ── Refresh button ──
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    if (selectedEvent) {
      await fetchData(selectedEvent);
    }
    setRefreshing(false);
  };

  // ── Derived stats ──
  const totalTickets = (bookedTickets ?? []).length;

  // Online = Ticket_Status is false, Offline = Ticket_Status is true
  const onlineTickets = (bookedTickets ?? []).filter(
    (t) => !t.Ticket_Status,
  ).length;
  const offlineTickets = (bookedTickets ?? []).filter(
    (t) => t.Ticket_Status,
  ).length;

  // Check-in rate = checkIn count / totalTickets
  const checkInCount = (checkIn ?? []).length;
  const checkInRate =
    totalTickets > 0 ? ((checkInCount / totalTickets) * 100).toFixed(1) : "0.0";

  const hasData = totalTickets > 0;

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pb-10`}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={tw`flex-row items-center justify-between pt-4 mb-6`}>
          <View>
            <Text style={tw`text-2xl font-bold text-indigo-600`}>
              Analytics
            </Text>
            <Text style={tw`text-2xl font-bold text-indigo-600`}>
              Dashboard
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing}
            style={[
              tw`w-12 h-12 rounded-full items-center justify-center`,
              { backgroundColor: "#4F46E5" },
            ]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Event Picker ── */}
        <View
          style={[
            tw`bg-white rounded-2xl border border-gray-100 overflow-hidden flex-row items-center px-3 mb-6`,
            { elevation: 2 },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color="#6366F1"
            style={tw`mr-2`}
          />
          <Picker
            selectedValue={selectedEvent}
            onValueChange={(val) => changeEvent(val)}
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

        {/* ── Loading ── */}
        {loading && (
          <View style={tw`items-center py-12`}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={tw`text-gray-400 text-sm mt-3`}>Loading data...</Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!loading && !selectedEvent && (
          <View style={tw`items-center py-16`}>
            <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
            <Text style={tw`text-gray-400 font-semibold mt-3`}>
              Select an event to view analytics
            </Text>
          </View>
        )}

        {/* ── Stats Cards ── */}
        {!loading && selectedEvent && (
          <>
            {/* Total Tickets Sold */}
            <StatCard
              title="Total Tickets Sold"
              icon="ticket-outline"
              iconBg="#EEF2FF"
              iconColor="#6366F1"
            >
              <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>
                {totalTickets.toLocaleString()}
              </Text>
              <Text style={tw`text-xs text-gray-400`}>
                Online: {onlineTickets} | Offline: {offlineTickets}
              </Text>
            </StatCard>

            {/* Check-in Rate */}
            <StatCard
              title="Check-in Rate"
              icon="checkmark-circle-outline"
              iconBg="#FDF2F8"
              iconColor="#EC4899"
            >
              <Text style={tw`text-4xl font-bold text-gray-900 mb-1`}>
                {checkInRate}%
              </Text>
              <Text style={tw`text-xs text-gray-400`}>
                {checkInCount} of {totalTickets} tickets checked in
              </Text>
              {/* Progress bar */}
              <ProgressBar
                value={checkInCount}
                total={totalTickets}
                color="#EC4899"
              />
            </StatCard>

            {/* Sales Channels */}
            <View
              style={[
                tw`bg-white rounded-3xl p-5 mb-4 border border-gray-100`,
                {
                  shadowColor: "#6366F1",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.07,
                  shadowRadius: 12,
                  elevation: 3,
                },
              ]}
            >
              <Text style={tw`text-base font-bold text-gray-900 mb-4`}>
                Sales Channels
              </Text>

              {/* Online */}
              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-sm text-gray-600 font-medium`}>
                    Online Sales
                  </Text>
                  <Text style={tw`text-sm font-bold text-gray-800`}>
                    {onlineTickets} tickets
                  </Text>
                </View>
                <ProgressBar
                  value={onlineTickets}
                  total={totalTickets}
                  color="#4F46E5"
                />
              </View>

              {/* Offline */}
              <View>
                <View style={tw`flex-row justify-between items-center`}>
                  <Text style={tw`text-sm text-gray-600 font-medium`}>
                    Offline Sales
                  </Text>
                  <Text style={tw`text-sm font-bold text-gray-800`}>
                    {offlineTickets} tickets
                  </Text>
                </View>
                <ProgressBar
                  value={offlineTickets}
                  total={totalTickets}
                  color="#8B5CF6"
                />
              </View>
            </View>

            {/* No data state */}
            {!hasData && (
              <View style={tw`items-center py-8`}>
                <Ionicons name="ticket-outline" size={40} color="#D1D5DB" />
                <Text style={tw`text-gray-400 font-semibold mt-2`}>
                  No tickets found for this event
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
