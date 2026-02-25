import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import tw from "twrnc";
import { useState, useEffect } from "react";
import { EventContext } from "../Configs/AuthContext";
import CreateEvent from "../Components/CreateEvent";
import SetTicket from "../Components/SetTicket";
import globalApi from "../Configs/globalApi";

export default function EventScreen() {
  const [createEvent, setCreateEvent] = useState(false);
  const [ticket, setTicket] = useState(false);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);

  const clickExpired = async (eventDocumentId) => {
    try {
      const resp = await globalApi.changeEventStatus(eventDocumentId);
      if (resp.ok) {
        const livedEvents = events.filter(
          (event) => event.documentId != eventDocumentId,
        );
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
    <SafeAreaView style={tw`flex-1 bg-blue-30 `}>
      <EventContext.Provider
        value={{
          createEvent,
          setCreateEvent,
          ticket,
          setTicket,
          events,
          tickets,
          setEvents,
        }}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <TouchableOpacity
            style={tw`w-[110px] p-2 bg-blue-500 rounded-xl ml-3 `}
            onPress={() => setTicket(true)}
          >
            <Text style={tw`text-white font-bold text-center`}>
              Set Tickets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`p-2 rounded-xl mr-3`}
            onPress={() => setCreateEvent(true)}
          >
            <View style={tw`flex-row justify-center items-center`}>
              <Entypo name="plus" size={24} color="#3B82F6" />
              <Text style={tw`text-blue-500 font-bold`}>Create Event</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text
          style={tw`text-[17px] font-bold text-blue-500 underline ml-3 mt-5`}
        >
          Lived Events
        </Text>

        {events.length ? (
          events
            .sort((a, b) => new Date(a.Date) - new Date(b.Date))
            .map((event) => {
              return (
                <View
                  key={event.documentId}
                  style={tw`p-3 bg-white mx-3 mt-3 rounded-lg flex-row items-center justify-between`}
                >
                  <View>
                    <Text style={tw`text-[15px] font-bold`}>{event.Name}</Text>
                    <Text style={tw`text-[12px] mt-1`}>
                      {event.Date.split("-").reverse().join("-")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={tw`bg-blue-500 p-2 rounded-xl`}
                    onPress={() => clickExpired(event.documentId)}
                  >
                    <Text
                      style={tw`text-white text-center font-semibold text-[11px]`}
                    >
                      Expired
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
        ) : (
          <View style={tw`flex-1 items-center justify-center`}>
            <Text style={tw`text-blue-400 font-bold`}>No Lived Event</Text>
          </View>
        )}
        <CreateEvent />
        <SetTicket />
      </EventContext.Provider>
    </SafeAreaView>
  );
}
