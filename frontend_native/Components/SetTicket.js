import { Picker } from "@react-native-picker/picker";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { useContext, useState, useEffect } from "react";
import { EventContext } from "../Configs/AuthContext";
import globalApi from "../Configs/globalApi";
import tw from "twrnc";
import Checkbox from "expo-checkbox";

export default function SetTicket() {
  const [eventTicketData, setEventTicketData] = useState({
    ticket: "",
    event: "",
    Limit: null,
    isLimited: false,
  });
  const { ticket, setTicket, events, tickets } = useContext(EventContext);

  const createEventTicket = async () => {
    const payload = {
      data: {
        event: eventTicketData.event,
        ticket: eventTicketData.ticket,
        isLimited: !!eventTicketData.isLimited,
        Limit: eventTicketData.Limit,
      },
    };

    const resp = await globalApi.setEventTicketLimit(payload.data);
    console.log("EventTicket", resp.data.data);
    if (resp.ok) {
      setEventTicketData({
        ticket: "",
        event: "",
        Limit: null,
        isLimited: false,
      });
      setTicket(false);
    } else {
      alert("Failed to set event ticket");
      console.log("Failed to set event ticket", resp.data.error);
    }
  };

  console.log("data", eventTicketData);
  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={ticket}
        onRequestClose={() => {
          (setTicket(false),
            setEventTicketData({
              ticket: "",
              event: "",
              Limit: null,
              isLimited: false,
            }));
        }}
      >
        <View
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-40`}
        >
          <View style={tw`bg-white w-80 p-5 rounded-xl shadow-lg`}>
            <Text style={tw`text-lg font-bold mb-3`}>Set Ticket In Event</Text>
            <Picker
              setEventTicketData={eventTicketData.event}
              onValueChange={(eventValue) => {
                setEventTicketData({ ...eventTicketData, event: eventValue });
              }}
              style={tw`bg-[#eee] mb-5`}
            >
              <Picker.Item label="Select event..." value={0} />
              {events.map((event) => {
                return (
                  <Picker.Item label={event.Name} value={event.documentId} />
                );
              })}
            </Picker>
            <Picker
              setEventTicketData={eventTicketData.ticket}
              onValueChange={(ticketValue) => {
                setEventTicketData({ ...eventTicketData, ticket: ticketValue });
              }}
              style={tw`bg-[#eee] mb-5`}
            >
              <Picker.Item label="Select ticket type..." value={0} />
              {tickets.map((ticket) => {
                return (
                  <Picker.Item label={ticket.Name} value={ticket.documentId} />
                );
              })}
            </Picker>
            <View style={tw`flex-row items-center mb-3`}>
              <Checkbox
                value={eventTicketData.isLimited}
                onValueChange={(value) => {
                  setEventTicketData({
                    ...eventTicketData,
                    isLimited: value,
                  });
                }}
                color={eventTicketData.isLimited ? "#3b82f6" : undefined}
              />
              <Text style={tw`ml-2 text-[14px]`}>isLimited</Text>
            </View>

            {eventTicketData.isLimited && (
              <TextInput
                placeholder="Ticket Limit"
                value={eventTicketData.Limit}
                onChangeText={(num) =>
                  setEventTicketData({ ...eventTicketData, Limit: num })
                }
                keyboardType="number-pad"
                style={tw`border mb-5 p-2.5`}
              />
            )}
            <View style={tw`flex-row items-center justify-end`}>
              <TouchableOpacity
                style={tw`bg-blue-500 p-3 rounded-xl mr-1.5 ${!eventTicketData.event || !eventTicketData.ticket ? "opacity-50" : "opacity-100"}`}
                disabled={!eventTicketData.event || !eventTicketData.ticket}
                onPress={createEventTicket}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  Comfirm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-blue-500 p-3 rounded-xl`}
                onPress={() => {
                  (setTicket(false),
                    setEventTicketData({
                      ticket: "",
                      event: "",
                      Limit: null,
                      isLimited: false,
                    }));
                }}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
