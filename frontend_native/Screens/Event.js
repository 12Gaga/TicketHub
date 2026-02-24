import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import DateTimePicker from "@react-native-community/datetimepicker";
import tw from "twrnc";
import { useState } from "react";
import Fontisto from "@expo/vector-icons/Fontisto";

export default function EventScreen() {
  const [createEvent, setCreateEvent] = useState(true);
  const [ticket, setTicket] = useState(false);
  const [eventData, setEventData] = useState({ Name: "", Date: new Date() });
  const [show, setShow] = useState(false);
  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      setEventData({ ...eventData, Date: selectedDate });
    }
  };
  return (
    <SafeAreaView style={tw`flex-1 bg-blue-100 `}>
      <View style={tw`flex-row justify-between items-center`}>
        <TouchableOpacity
          style={tw`w-[110px] p-2 bg-blue-500 rounded-xl ml-3 `}
          onPress={() => setTicket(true)}
        >
          <Text style={tw`text-white font-bold text-center`}>Set Tickets</Text>
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
      <Text style={tw`text-[17px] font-bold text-blue-500 underline ml-3 mt-5`}>
        Lived Events
      </Text>
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`text-blue-400 font-bold`}>No Lived Event</Text>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={createEvent}
        onRequestClose={() => setCreateEvent(false)} // Android back button
      >
        <View
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-40`}
        >
          <View style={tw`bg-white w-80 p-5 rounded-xl shadow-lg`}>
            <Text style={tw`text-lg font-bold mb-3`}>Create Event</Text>
            <TextInput
              placeholder="Event Name"
              value={eventData.Name}
              onChangeText={(text) =>
                setEventData({ ...eventData, Name: text })
              }
              style={tw`border border-black rounded-[5px] pl-2 mb-2 text-[13px]`}
            />
            <TouchableOpacity
              style={tw` p-2 rounded-lg`}
              onPress={() => setShow(true)}
            >
              <View style={tw`flex-row items-center`}>
                <Text style={tw`font-semibold mr-2`}>Pick Date</Text>
                <Fontisto name="date" size={24} color="black" />
              </View>
            </TouchableOpacity>

            {show && (
              <DateTimePicker
                value={eventData.Date}
                mode="date"
                display="default"
                onChange={onChange}
              />
            )}

            <TextInput
              placeholder="Event Name"
              value={eventData.Date.toDateString()}
              editable={false}
              style={tw`border border-black rounded-[5px] pl-2 mb-3 text-[13px]`}
            />

            <View style={tw`flex-row items-center justify-end`}>
              <TouchableOpacity
                style={tw`bg-blue-500 p-3 rounded-xl mr-1.5`}
                // onPress={() => setCreateEvent(false)}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  Create
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-blue-500 p-3 rounded-xl`}
                onPress={() => setCreateEvent(false)}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
