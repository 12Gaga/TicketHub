import Fontisto from "@expo/vector-icons/Fontisto";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import tw from "twrnc";
import { useContext, useState } from "react";
import { EventContext } from "../Configs/AuthContext";
import globalApi from "../Configs/globalApi";

export default function CreateEvent() {
  const [eventData, setEventData] = useState({ Name: "", Date: new Date() });
  const [show, setShow] = useState(false);
  const { createEvent, setCreateEvent, events, setEvents } =
    useContext(EventContext);
  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      setEventData({ ...eventData, Date: selectedDate });
    }
  };
  const createTheEvent = async () => {
    const payload = {
      data: {
        Name: eventData.Name,
        Date: eventData.Date.toISOString().split("T")[0],
      },
    };
    const resp = await globalApi.setEvent(payload.data);
    console.log("Event", resp.data.data);
    if (resp.ok) {
      setEvents([...events, resp.data.data]);
      setEventData({ Name: "", Date: new Date() });
      setCreateEvent(false);
    } else {
      alert("Failed to create event");
      console.log("Failed to create event:", resp.data.error);
    }
  };
  console.log("eventData", eventData);
  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={createEvent}
        onRequestClose={() => {
          (setCreateEvent(false), setEventData({ Name: "", Date: new Date() }));
        }}
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
                style={tw`bg-blue-500 p-3 rounded-xl mr-1.5 ${!eventData.Name || !eventData.Date ? "opacity-50" : "opacity-100"}`}
                disabled={!eventData.Name || !eventData.Date}
                onPress={createTheEvent}
              >
                <Text style={tw`text-white text-center font-semibold`}>
                  Create
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-blue-500 p-3 rounded-xl`}
                onPress={() => {
                  (setCreateEvent(false),
                    setEventData({ Name: "", Date: new Date() }));
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
