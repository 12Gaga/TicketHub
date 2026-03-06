import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { EventContext } from "../Configs/AuthContext";
import CreateEvent from "../Components/CreateEvent";
import SetTicket from "../Components/SetTicket";
import globalApi from "../Configs/globalApi";
import EventCard from "../Components/EventCard";

export default function EventScreen() {
  const [createEvent, setCreateEvent] = useState(false);
  const [ticket, setTicket] = useState(false);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modalEventId, setModalEventId] = useState(null);
  const [createTicketLimit, setCreateTicketLimit] = useState({});
  const handleSearch = (text) => {
    setSearch(text);
    if (text.trim() === "") {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((event) =>
        event.Name.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredEvents(filtered);
    }
  };

  const clickExpired = async (eventDocumentId) => {
    try {
      const resp = await globalApi.changeEventStatus(eventDocumentId);
      if (resp.ok) {
        const livedEvents = events.filter(
          (event) => event.documentId != eventDocumentId,
        );
        setFilteredEvents(livedEvents);
        setEvents(livedEvents);
      } else {
        alert("Failed to update event status");
        console.log("error", resp.problem);
      }
    } catch (error) {
      console.error(error);
      alert("Error updating event status");
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await globalApi.getEvents();
        console.log("Events:", result.data.data);
        setEvents(result.data.data);
        setFilteredEvents(result.data.data);
        // const eventIds = result.data.data.map((e) => e.documentId);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    const fetchTickets = async () => {
      try {
        const result = await globalApi.getTicket();
        console.log("Tickets:", result.data.data);
        setTickets(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    fetchEvents();
    fetchTickets();

    return () => {};
  }, []);
  return (
    <ScrollView style={tw`flex-1 bg-white px-5 pt-10`}>
      <EventContext.Provider
        value={{
          createEvent,
          setCreateEvent,
          ticket,
          events,
          setTicket,
          tickets,
          filteredEvents,
          setFilteredEvents,
          setEvents,
          createTicketLimit,
          setCreateTicketLimit,
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
        <TouchableOpacity
          style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-4`}
          onPress={() => setTicket(true)}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={tw`text-white font-bold text-sm ml-2`}>
            Set Tickets Limit
          </Text>
        </TouchableOpacity>
        <View
          style={tw`flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-white mb-4`}
        >
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            placeholder="Search events by name, ..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={handleSearch}
            style={tw`flex-1 ml-2 text-sm text-gray-700`}
          />
        </View>

        {filteredEvents.length > 0 ? (
          filteredEvents
            .sort((a, b) => new Date(a.Date) - new Date(b.Date))
            .map((event, index) => (
              <EventCard
                key={event.documentId}
                event={event}
                index={index}
                visible={modalEventId === event.documentId}
                onDelete={() => setModalEventId(event.documentId)}
                onComplete={() => {
                  clickExpired(event.documentId);
                  setModalEventId(null);
                }}
                setVisible={() => setModalEventId(null)}
                onPress={(e) => setModalEventId(e.documentId)}
                onEdit={(e) => console.log("Edit:", e.documentId)}
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
        <SetTicket />
      </EventContext.Provider>
    </ScrollView>
  );
}
