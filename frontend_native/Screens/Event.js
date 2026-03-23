import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useState, useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { EventContext } from "../Configs/AuthContext";
import CreateEvent from "../Components/CreateEvent";
import globalApi from "../Configs/globalApi";
import EventCard from "../Components/EventCard";
import PopUpAlert from "../Components/PopUpAlert";

const EVENT_TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "ended", label: "Ended" },
];

function parseLocalDate(dateStr) {
  if (!dateStr) return null;

  const [datePart] = String(dateStr).split("T");
  const [year, month, day] = datePart.split("-").map((value) => Number(value));

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function compareEventDateTime(left, right) {
  const leftDate = parseLocalDate(left?.Date);
  const rightDate = parseLocalDate(right?.Date);
  const leftTime = String(left?.Time ?? "");
  const rightTime = String(right?.Time ?? "");
  const leftName = String(left?.Name ?? "").toLowerCase();
  const rightName = String(right?.Name ?? "").toLowerCase();

  if (leftDate && rightDate) {
    const diff = leftDate.getTime() - rightDate.getTime();
    if (diff !== 0) {
      return diff;
    }
  } else if (leftDate || rightDate) {
    return leftDate ? -1 : 1;
  }

  if (leftTime !== rightTime) {
    return leftTime.localeCompare(rightTime);
  }

  return leftName.localeCompare(rightName);
}

export default function EventScreen() {
  const [failModal, setFailModal] = useState(false);
  const [failText, setFailText] = useState("Failed to load events");
  const [createEvent, setCreateEvent] = useState(false);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [modalEventId, setModalEventId] = useState(null);
  const [createTicketLimit, setCreateTicketLimit] = useState({});
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  const refreshEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const result = await globalApi.getEventsByLifecycle(activeTab);
      if (result.ok) {
        setEvents(result.data?.data ?? []);
        return true;
      }

      setFailText("Failed to load events");
      setFailModal(true);
      return false;
    } catch (error) {
      console.log("Error:", error);
      setFailText("Failed to load events");
      setFailModal(true);
      return false;
    } finally {
      setEventsLoading(false);
    }
  }, [activeTab]);

  const clickExpired = useCallback(
    async (eventDocumentId) => {
      setLoading(true);
      try {
        const resp = await globalApi.changeEventStatus(eventDocumentId);
        if (resp.ok) {
          await refreshEvents();
          return true;
        } else {
          setFailText("Failed to update event status");
          setFailModal(true);
          console.log("error", resp.problem);
          return false;
        }
      } catch (error) {
        console.error(error);
        setFailText("Failed to update event status");
        setFailModal(true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshEvents],
  );

  const visibleEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? (events ?? []).filter((event) =>
          String(event?.Name ?? "").toLowerCase().includes(normalizedSearch),
        )
      : events ?? [];

    const sorted = [...filtered].sort((left, right) => {
      const diff = compareEventDateTime(left, right);
      if (activeTab === "upcoming") {
        return diff;
      }

      return diff * -1;
    });

    return sorted;
  }, [activeTab, events, search]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchTickets = async () => {
        try {
          const result = await globalApi.getTicket();
          if (!isActive) return;
          console.log("Tickets:", result.data.data);
          setTickets(result.data.data);
        } catch (error) {
          console.log("Error:", error);
        }
      };

      fetchTickets();

      return () => {
        isActive = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadEvents = async () => {
        setEventsLoading(true);
        try {
          const result = await globalApi.getEventsByLifecycle(activeTab);
          if (!isActive) return;

          if (result.ok) {
            console.log("Events:", result.data?.data);
            setEvents(result.data?.data ?? []);
            return;
          }

          setFailText("Failed to load events");
          setFailModal(true);
        } catch (error) {
          if (!isActive) return;
          console.log("Error:", error);
          setFailText("Failed to load events");
          setFailModal(true);
        } finally {
          if (isActive) {
            setEventsLoading(false);
          }
        }
      };

      loadEvents();

      return () => {
        isActive = false;
      };
    }, [activeTab]),
  );

  return (
    <ScrollView style={tw`flex-1 bg-white px-5 pt-10`}>
      <EventContext.Provider
        value={{
          createEvent,
          setCreateEvent,
          events,
          tickets,
          refreshEvents,
          createTicketLimit,
          setCreateTicketLimit,
          loading,
          setLoading,
        }}
      >
        <Text style={tw`text-3xl font-bold text-indigo-600 mb-1`}>Events</Text>
        <Text style={tw`text-gray-500 text-sm mb-5`}>
          Manage all your events and ticket categories
        </Text>
        <TouchableOpacity
          style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-4`}
          onPress={() => setCreateEvent(true)}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={tw`text-white font-bold text-sm ml-2`}>
            Create Event
          </Text>
        </TouchableOpacity>
        <View
          style={tw`flex-row mb-4 border border-gray-200 rounded-xl overflow-hidden`}
        >
          {EVENT_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={tw`flex-1 py-3 flex-row items-center justify-center ${
                activeTab === tab.key ? "bg-indigo-600" : "bg-white"
              }`}
            >
              <Text
                style={tw`text-sm font-semibold ${
                  activeTab === tab.key ? "text-white" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={tw`flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-white mb-4`}
        >
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Search events by name, ..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            style={tw`flex-1 ml-2 text-sm text-gray-700`}
          />
        </View>

        {eventsLoading ? (
          <View style={tw`items-center justify-center py-16`}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={tw`text-gray-400 text-sm mt-3`}>
              Loading events...
            </Text>
          </View>
        ) : (visibleEvents ?? []).length > 0 ? (
          visibleEvents.map((event, index) => (
              <EventCard
                key={event.documentId}
                event={event}
                index={index}
                visible={modalEventId === event.documentId}
                onComplete={async () => {
                  const ok = await clickExpired(event.documentId);
                  if (ok) {
                    setModalEventId(null);
                  }
                }}
                setVisible={() => setModalEventId(null)}
                onEdit={(e) => setModalEventId(e.documentId)}
              />
            ))
        ) : (
          <View style={tw`items-center justify-center py-16`}>
            <Ionicons name="calendar-outline" size={48} color="#C7D2FE" />
            <Text style={tw`text-indigo-400 font-bold mt-3`}>
              No Events Found
            </Text>
            <Text style={tw`text-gray-400 text-sm mt-1`}>
              Create your first event above
            </Text>
          </View>
        )}

        <View style={tw`h-10`} />
        <CreateEvent />
        <PopUpAlert
          success={failModal}
          text={failText}
          header={"Failed!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
      </EventContext.Provider>
    </ScrollView>
  );
}
