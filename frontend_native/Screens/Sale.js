import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import globalApi from "../Configs/globalApi";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { SaleTicket } from "../Configs/AuthContext";
import SingleTab from "../Components/SingleTab";
import BulkTab from "../Components/BulkTab";

export default function OfflineTicketGeneration() {
  const [activeTab, setActiveTab] = useState("single");
  const [data, setData] = useState({
    event: null,
    Name: "",
    Email: "",
    Phone: "",
    ticket: null,
    Auth_Status: true,
    Agent: "",
    SeatNo: "",
    Note: "",
  });
  const [events, setEvents] = useState([]);
  const [buyState, setBuyState] = useState(1);
  const [ticketLimit, setTicketLimit] = useState([]);
  const [avariableTicketType, setAvariableTicketType] = useState([]);
  const [soldOut, setSoldOut] = useState(false);

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
    fetchEvents();
    return () => {};
  }, []);

  const changeEvent = async (eventID) => {
    setData({ ...data, event: eventID });
    setAvariableTicketType([]);
    try {
      const resp = await globalApi.getTicketLimit(eventID);
      if (resp.ok) {
        console.log("ticketLimit", resp.data.data);
        setTicketLimit(resp.data.data);
        const tickets = resp.data.data.map((item) => item.ticket);
        setAvariableTicketType(tickets);
      } else {
        console.log("error", resp.problem);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const changeTicket = async (ticketID) => {
    setData({ ...data, ticket: ticketID });
    try {
      const resp = await globalApi.getBookedTicket(ticketID, data.event);
      if (resp.ok) {
        console.log("bookedTickets", resp.data.data);
        const data = ticketLimit.find(
          (item) => item.ticket.documentId == ticketID,
        );
        const limit = data.Limit;
        if (!limit) {
          setSoldOut(false);
        } else if (resp.data.data.length >= limit && data.isLimited) {
          setSoldOut(true);
        } else {
          setSoldOut(false);
        }
      } else {
        console.log("error", resp.problem);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleBooking = async () => {
    if (
      !data.event ||
      !data.ticket ||
      !data.Name ||
      !data.Phone ||
      !data.Email
    ) {
      Alert.alert("Please fill required fields");
      return;
    }
    const payload = {
      data: {
        event: data.event,
        Name: data.Name,
        Email: data.Email,
        Phone: data.Phone,
        ticket: data.ticket,
        Auth_Status: !!data.Auth_Status,
        Agent: data.Agent,
        SeatNo: data.SeatNo,
        Note: data.Note,
      },
    };

    const resp = await globalApi.setBookedTicket(payload.data);

    if (resp.ok) {
      console.log("ticketResp", resp.data.data);
      if (data.Auth_Status) {
        console.log("offline");
        setData({
          event: null,
          Name: "",
          Email: "",
          Phone: "",
          ticket: null,
          Auth_Status: true,
          Agent: "",
          SeatNo: "",
          Note: "",
        });
        setSoldOut(false);
        setBuyState(1);
        setAvariableTicketType([]);
        alert("Ticket Booking complete successfully");
      } else {
        console.log("online");
        navigation.navigate("generateQR", {
          documentID: resp.data.data.documentId,
        });
        setData({
          event: null,
          Name: "",
          Email: "",
          Phone: "",
          ticket: null,
          Auth_Status: true,
          Agent: "",
          SeatNo: "",
          Note: "",
        });
        setSoldOut(false);
        setBuyState(1);
        setAvariableTicketType([]);
      }
    } else {
      alert("Failed to create ticket booking");
      console.log("Failed to create ticket booking:", resp.data.error);
    }
  };
  console.log("Sale Ticket Data : ", data);

  return (
    <ScrollView style={tw`flex-1 bg-white px-5 pt-10`}>
      <SaleTicket.Provider
        value={{
          activeTab,
          changeTicket,
          handleBooking,
          soldOut,
          avariableTicketType,
          setBuyState,
          setData,
          data,
          buyState,
        }}
      >
        {/* Header */}
        <Text style={tw`text-3xl font-bold text-indigo-600 leading-tight`}>
          Offline Ticket{"\n"}Generation
        </Text>
        <Text style={tw`text-gray-500 text-sm mt-2 mb-6`}>
          Create tickets for offline sales manually or in bulk
        </Text>

        {/* Select Event*/}
        <View style={tw`bg-white rounded-2xl p-4 mb-5 border border-gray-200`}>
          <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
            Select Event <Text style={tw`text-red-500`}>*</Text>
          </Text>
          <Text style={tw`text-gray-400 text-xs mb-4`}>
            Choose which event to generate tickets for
          </Text>

          <View
            style={tw`border border-gray-200 rounded-xl bg-white overflow-hidden flex-row items-center px-3`}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color="#6366F1"
              style={tw`mr-2`}
            />
            <Picker
              selectedValue={data.event}
              onValueChange={(eventValue) => changeEvent(eventValue)}
              style={tw`flex-1 h-13 text-sm text-gray-700`}
            >
              <Picker.Item
                label="Select an event"
                value={null}
                color="#9CA3AF"
              />
              {events.map((event) => (
                <Picker.Item
                  key={event.documentId}
                  label={event.Name}
                  value={event.documentId}
                  color="#111827"
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Single / Bulk Toggle */}
        <View
          style={tw`flex-row mb-6 border border-gray-200 rounded-xl overflow-hidden`}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("single")}
            style={tw`flex-1 py-3 flex-row items-center justify-center ${
              activeTab === "single" ? "bg-indigo-600" : "bg-white"
            }`}
          >
            <Ionicons
              name="add"
              size={16}
              color={activeTab === "single" ? "white" : "#6B7280"}
            />
            <Text
              style={tw`ml-1 text-sm font-semibold ${
                activeTab === "single" ? "text-white" : "text-gray-500"
              }`}
            >
              Single Entry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("bulk")}
            style={tw`flex-1 py-3 flex-row items-center justify-center ${
              activeTab === "bulk" ? "bg-indigo-600" : "bg-white"
            }`}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={16}
              color={activeTab === "bulk" ? "white" : "#6B7280"}
            />
            <Text
              style={tw`ml-1 text-sm font-semibold ${
                activeTab === "bulk" ? "text-white" : "text-gray-500"
              }`}
            >
              Bulk Upload
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual Ticket Entry Section */}
        <SingleTab />
        <BulkTab />
      </SaleTicket.Provider>
    </ScrollView>
  );
}
