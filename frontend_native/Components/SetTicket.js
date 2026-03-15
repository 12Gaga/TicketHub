import { Picker } from "@react-native-picker/picker";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { useContext, useState, useEffect } from "react";
import { EventContext } from "../Configs/AuthContext";
import globalApi from "../Configs/globalApi";
import tw from "twrnc";
import Checkbox from "expo-checkbox";
import { ActivityIndicator } from "react-native";
import PopUpAlert from "./PopUpAlert";

export default function SetTicket() {
  const [failModal, setFailModal] = useState(false);
  const [eventTicketData, setEventTicketData] = useState({
    ticket: "",
    event: "",
    Limit: null,
    isLimited: false,
  });
  const {
    ticket,
    setTicket,
    events,
    tickets,
    setCreateTicketLimit,
    loading,
    setLoading,
  } = useContext(EventContext);

  const createEventTicket = async () => {
    const payload = {
      data: {
        event: eventTicketData.event,
        ticket: eventTicketData.ticket,
        isLimited: !!eventTicketData.isLimited,
        Limit: eventTicketData.Limit,
      },
    };
    setLoading(true);
    try {
      const resp = await globalApi.setEventTicketLimit(payload.data);
      console.log("EventTicket", resp.data.data);
      if (resp.ok) {
        setEventTicketData({
          ticket: "",
          event: "",
          Limit: null,
          isLimited: false,
        });
        setCreateTicketLimit(resp.data.data);
        setTicket(false);
      }
    } catch (err) {
      setFailModal(true);
    } finally {
      setLoading(false);
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
            <Text style={tw`text-lg font-bold mb-4 text-center`}>
              Set Ticket Type In Event
            </Text>
            <View>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Event Name <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <Picker
                selectedValue={eventTicketData.event}
                onValueChange={(eventValue) => {
                  setEventTicketData({ ...eventTicketData, event: eventValue });
                }}
                style={tw`bg-[#eee] mb-5 text-gray-700`}
              >
                <Picker.Item label="Select event..." value={0} />
                {(events ?? []).map((event) => {
                  return (
                    <Picker.Item
                      key={event.documentId}
                      label={event.Name}
                      value={event.documentId}
                    />
                  );
                })}
              </Picker>
            </View>

            <View>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Ticket Type <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <Picker
                selectedValue={eventTicketData.ticket}
                onValueChange={(ticketValue) => {
                  setEventTicketData({
                    ...eventTicketData,
                    ticket: ticketValue,
                  });
                }}
                style={tw`bg-[#eee] mb-5 text-gray-700`}
              >
                <Picker.Item label="Select ticket type..." value={0} />
                {(tickets ?? []).map((ticket) => {
                  return (
                    <Picker.Item
                      key={ticket.documentId}
                      label={ticket.Name}
                      value={ticket.documentId}
                    />
                  );
                })}
              </Picker>
            </View>
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
                style={tw`border mb-5 p-2.5 text-gray-700`}
              />
            )}
            <View style={tw`flex-row items-center justify-end`}>
              <TouchableOpacity
                style={tw`bg-indigo-600 p-3 rounded-xl mr-1.5 ${!eventTicketData.event || !eventTicketData.ticket ? "opacity-50" : "opacity-100"}`}
                disabled={!eventTicketData.event || !eventTicketData.ticket}
                onPress={createEventTicket}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={tw`text-white text-center font-semibold`}>
                    Comfirm
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-indigo-600 p-3 rounded-xl`}
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
      <PopUpAlert
        success={failModal}
        text={"Failed to set event ticket."}
        header={"Failed!"}
        ModalCall={() => setFailModal(false)}
        status={false}
      />
    </View>
  );
}
