import { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import globalApi from "../Configs/globalApi";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { SaleTicket } from "../Configs/AuthContext";
import SingleEntry from "../Components/SingleEntry";
import BulkUpload from "../Components/BulkUpload";
import UserAuth from "../Configs/UserAuth";
import { useNavigation } from "@react-navigation/native";
import PopUpAlert from "../Components/PopUpAlert";

export default function OfflineTicketGeneration() {
  const navigation = useNavigation();
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    event: null,
    Name: "",
    Email: null,
    Phone: "",
    ticket: null,
    Ticket_Status: true,
    Payment: "Cash",
    Agent: "",
    SeatNo: "",
    Note: "",
    Ticket_Id: null,
  });
  const [loading, setLoading] = useState(false);
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
    const fetchUser = async () => {
      try {
        const User = await UserAuth.getUserAuth();
        console.log("User:", User);
        setUser(User.documentId);
      } catch (error) {
        console.error("Error", error);
      }
    };
    fetchUser();
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
        const ticketLimitEntry = ticketLimit.find(
          (item) => item.ticket.documentId == ticketID,
        );
        const limit = ticketLimitEntry.Limit;
        if (!limit) {
          setSoldOut(false);
        } else if (
          resp.data.data.length >= limit &&
          ticketLimitEntry.isLimited
        ) {
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
      !user ||
      (data.Ticket_Status && !data.Ticket_Id)
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
        Ticket_Status: !!data.Ticket_Status,
        Payment: data.Payment,
        Agent: data.Agent,
        SeatNo: data.SeatNo,
        Note: data.Note,
        Ticket_Id: data.Ticket_Id,
        Seller_Id: user,
      },
    };
    setLoading(true);
    try {
      const resp = await globalApi.setBookedTicket(payload.data);
      if (resp.ok) {
        console.log("ticketResp", resp.data.data);
        if (data.Ticket_Status) {
          console.log("offline");
          setData({
            event: data.event,
            Name: "",
            Email: null,
            Phone: "",
            ticket: data.ticket,
            Ticket_Status: true,
            Payment: "Cash",
            Agent: data.Agent,
            SeatNo: "",
            Note: data.Note,
            Ticket_Id: null,
          });
          setSoldOut(false);
          setBuyState(1);
          setSuccessModal(true);
        } else {
          console.log("online");
          console.log("data", resp.data.data);
          const event_Name = events.find((e) => e.documentId == data.event);
          const ticket_Type = avariableTicketType.find(
            (t) => t.documentId == data.ticket,
          );
          setData({
            event: data.event,
            Name: "",
            Email: null,
            Phone: "",
            ticket: data.ticket,
            Ticket_Status: true,
            Payment: "Cash",
            Agent: data.Agent,
            SeatNo: "",
            Note: data.Note,
            Ticket_Id: null,
          });
          setSoldOut(false);
          setBuyState(1);
          navigation.navigate("generateQR", {
            documentId: resp.data.data.documentId,
            ticketType: ticket_Type.Name,
            eventName: event_Name.Name,
          });
        }
      }
    } catch (err) {
      setFailModal(true);
    } finally {
      setLoading(false);
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
          loading,
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

        <SingleEntry />
        <BulkUpload />
        <PopUpAlert
          success={successModal}
          text={"Ticket has been booked successfully."}
          header={"Booking Complete!"}
          ModalCall={() => setSuccessModal(false)}
          status={true}
        />
        <PopUpAlert
          success={failModal}
          text={"Failed to create ticket booking"}
          header={"Failed!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
      </SaleTicket.Provider>
    </ScrollView>
  );
}
