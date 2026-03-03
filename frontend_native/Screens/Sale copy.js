import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { useState, useEffect } from "react";
import globalApi from "../Configs/globalApi";
import { useNavigation } from "@react-navigation/native";

export default function SaleScreen() {
  const navigation = useNavigation();
  const [data, setData] = useState({
    Name: "",
    Phone: "",
    Auth_Status: true,
    event: null,
    ticket: null,
  });
  const [events, setEvents] = useState([]);
  const [buyState, setBuyState] = useState(1);
  const [ticketLimit, setTicketLimit] = useState([]);
  const [avariableTicketType, setAvariableTicketType] = useState([]);
  const [soldOut, setSoldOut] = useState(false);
  const [routeData, setRouteData] = useState({
    documentID: "",
    name: "",
    ticket_type: "",
  });
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
    try {
      const resp = await globalApi.getTicketLimit(eventID);
      if (resp.ok) {
        console.log("ticketLimit", resp.data.data);
        setTicketLimit(resp.data.data);
        resp.data.data.map((item) => avariableTicketType.push(item.ticket));
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
        setRouteData({ ...routeData, ticket_type: data.ticket.Name });
        const limit = data.Limit;
        if (resp.data.data.length >= limit) {
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
    console.log("To db...");
    if (!data.event || !data.ticket || !data.Name || !data.Phone) {
      Alert.alert("Please fill all fields");
      return;
    }
    const payload = {
      data: {
        Name: data.Name,
        Phone: data.Phone,
        ticket: data.ticket,
        event: data.event,
        Auth_Status: !!data.Auth_Status,
      },
    };

    const resp = await globalApi.setBookedTicket(payload.data);

    if (resp.ok) {
      console.log("ticketResp", resp.data.data);
      if (data.Auth_Status) {
        console.log("offline");
        setData({
          Name: "",
          Phone: "",
          Auth_Status: true,
          event: null,
          ticket: null,
        });
        setSoldOut(false);
        setBuyState(1);
        setAvariableTicketType([]);
        alert("Ticket Booking complete successfully");
      } else {
        console.log("online");
        setRouteData({
          ...routeData,
          documentID: resp.data.data.documentId,
        });
        navigation.navigate("generateQR", { routeData: routeData });
        setData({
          Name: "",
          Phone: "",
          Auth_Status: true,
          event: null,
          ticket: null,
        });
        setSoldOut(false);
        setBuyState(1);
        setAvariableTicketType([]);
      }
    } else {
      alert("Failed to create booking");
      console.log("Failed to create booking:", resp.data.error);
    }
  };
  return (
    <SafeAreaView style={tw`flex-1 bg-blue-30 items-center justify-center`}>
      <Picker
        selectedValue={buyState}
        onValueChange={(state) => {
          setBuyState(state);
          setData({ ...data, Auth_Status: state == 1 ? true : false });
        }}
        style={tw`bg-white mb-5 w-[150px] absolute right-5 top-35`}
      >
        <Picker.Item label="Offline" value={1} />
        <Picker.Item label="Online" value={2} />
      </Picker>
      <View style={tw`flex-1 items-center justify-center`}>
        {soldOut ? (
          <Text style={tw`text-5 font-bold text-red-500 mb-5`}>
            Ticket Sold Out
          </Text>
        ) : (
          <></>
        )}
        <Picker
          selectedValue={data.event}
          onValueChange={(eventValue) => {
            changeEvent(eventValue);
          }}
          style={tw`bg-white mb-5 w-[300px]`}
        >
          <Picker.Item label="Select event..." value={0} />
          {events.map((event) => {
            return <Picker.Item label={event.Name} value={event.documentId} />;
          })}
        </Picker>
        <Picker
          selectedValue={data.ticket}
          enabled={data.event ? true : false}
          onValueChange={(ticketValue) => {
            changeTicket(ticketValue);
          }}
          style={tw`bg-white mb-5 w-[300px]`}
        >
          <Picker.Item label="Select ticket type..." value={0} />
          {avariableTicketType.map((ticket) => {
            return (
              <Picker.Item label={ticket.Name} value={ticket.documentId} />
            );
          })}
        </Picker>
        <TextInput
          placeholder="Name"
          value={data.Name}
          onChangeText={(name) => {
            setData({ ...data, Name: name });
            setRouteData({ ...routeData, name: name });
          }}
          style={tw`mb-5 p-4 bg-white w-[300px]`}
        />
        <TextInput
          placeholder="Phone Number"
          value={data.Phone}
          onChangeText={(ph) => setData({ ...data, Phone: ph })}
          keyboardType="number-pad"
          style={tw`mb-6 p-4 bg-white w-[300px]`}
        />
        <TouchableOpacity
          style={tw`bg-blue-500 p-3.5 rounded-xl w-[150px]`}
          onPress={handleBooking}
        >
          <Text style={tw`text-white text-center font-semibold`}>Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
