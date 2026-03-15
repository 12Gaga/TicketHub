import Fontisto from "@expo/vector-icons/Fontisto";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import tw from "twrnc";
import { useContext, useState } from "react";
import { EventContext } from "../Configs/AuthContext";
import globalApi from "../Configs/globalApi";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import PopUpAlert from "./PopUpAlert";

export default function CreateEvent() {
  const [eventData, setEventData] = useState({
    Name: "",
    Date: new Date(),
    Time: "",
    Venue: "",
    Description: "",
    Terms: "",
    Entry_Instruction: "",
  });
  const [show, setShow] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const {
    createEvent,
    setCreateEvent,
    filteredEvents,
    setFilteredEvents,
    events,
    setEvents,
    loading,
    setLoading,
  } = useContext(EventContext);
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
        Time: eventData.Time,
        Venue: eventData.Venue,
        Description: eventData.Description,
        Terms: eventData.Terms,
        Entry_Instruction: eventData.Entry_Instruction,
      },
    };
    setLoading(true);
    try {
      const resp = await globalApi.setEvent(payload.data);
      console.log("Event", resp.data.data);
      if (resp.ok) {
        setFilteredEvents([...filteredEvents, resp.data.data]);
        setEvents([...events, resp.data.data]);
        setEventData({
          Name: "",
          Date: new Date(),
          Time: "",
          Venue: "",
          Description: "",
          Terms: "",
          Entry_Instruction: "",
        });
        setCreateEvent(false);
      }
    } catch (err) {
      setFailModal(true);
    } finally {
      setLoading(false);
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
          (setCreateEvent(false),
            setEventData({
              Name: "",
              Date: new Date(),
              Time: "",
              Venue: "",
              Description: "",
              Terms: "",
              Entry_Instruction: "",
            }));
        }}
      >
        <View
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-40`}
        >
          <View style={tw`bg-white w-80 p-5 rounded-xl shadow-lg`}>
            <Text style={tw`text-lg font-bold text-center`}>
              Create New Event
            </Text>
            <Text style={tw`text-xs text-gray mb-4 text-center`}>
              Add a new event to generate tickets for.
            </Text>
            {/* Name */}
            <View>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Event Name <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                placeholder="Event Name"
                value={eventData.Name}
                onChangeText={(text) =>
                  setEventData({ ...eventData, Name: text })
                }
                style={tw`border border-black rounded-[5px] pl-2 text-[13px] text-gray-700`}
              />
            </View>
            {/* Date */}
            <TouchableOpacity
              style={tw`mt-3 mb-1 rounded-lg`}
              onPress={() => setShow(true)}
            >
              <View style={tw`flex-row items-center`}>
                <Text style={tw`font-semibold mr-2`}>
                  Event Date<Text style={tw`text-red-500`}> *</Text>
                </Text>
                <Fontisto name="date" size={20} color="black" />
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
              value={eventData.Date.toDateString()}
              editable={false}
              style={tw`border border-black rounded-[5px] pl-2 mb-3 text-[13px] text-gray-700`}
            />
            {/* Time */}
            <View>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Event Time <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={tw`border border-black rounded-[5px] pl-3 pr-3 py-2.5 mb-2 flex-row items-center justify-between`}
              >
                <Text style={tw`text-[13px] text-gray-700`}>
                  {eventData.Time ? eventData.Time : "Select time"}
                </Text>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      setSelectedTime(date);
                      // Format to HH:MM:SS for Strapi
                      const hours = date.getHours().toString().padStart(2, "0");
                      const minutes = date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0");
                      const formatted = `${hours}:${minutes}:00`;
                      setEventData({ ...eventData, Time: formatted });
                    }
                  }}
                />
              )}
            </View>
            {/* Venue */}
            <View style={tw`mt-2`}>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Event Venue <Text style={tw`text-red-500`}>*</Text>
              </Text>
              <TextInput
                placeholder="Convention Center"
                value={eventData.Venue}
                onChangeText={(text) =>
                  setEventData({ ...eventData, Venue: text })
                }
                style={tw`border border-black rounded-[5px] pl-2 mb-2 text-[13px] text-gray-700`}
              />
            </View>
            {/* Description */}
            <View style={tw`mt-2`}>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Event Description
              </Text>
              <TextInput
                placeholder="Description of the event ..."
                value={eventData.Description}
                onChangeText={(text) =>
                  setEventData({ ...eventData, Description: text })
                }
                style={tw`border border-black rounded-[5px] pl-2 mb-2 text-[13px] text-gray-700`}
              />
            </View>
            {/* Terms */}
            <View style={tw`mt-2`}>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Terms and Conditions
              </Text>
              <TextInput
                placeholder="Terms and condition for the event ..."
                value={eventData.Terms}
                onChangeText={(text) =>
                  setEventData({ ...eventData, Terms: text })
                }
                style={tw`border border-black rounded-[5px] pl-2 mb-2 text-[13px] text-gray-700`}
              />
            </View>
            {/* Instructions */}
            <View style={tw`mt-2`}>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                Entry Instructions
              </Text>
              <TextInput
                placeholder="Instructions for entering for event ..."
                value={eventData.Entry_Instruction}
                onChangeText={(text) =>
                  setEventData({ ...eventData, Entry_Instruction: text })
                }
                style={tw`border border-black rounded-[5px] pl-2 mb-2 text-[13px] text-gray-700`}
              />
            </View>
            <View style={tw`flex-row items-center justify-end mt-2`}>
              <TouchableOpacity
                style={tw`bg-indigo-600 p-3 rounded-xl mr-1.5 ${!eventData.Name || !eventData.Date ? "opacity-50" : "opacity-100"}`}
                disabled={
                  !eventData.Name ||
                  !eventData.Date ||
                  !eventData.Time ||
                  !eventData.Venue
                }
                onPress={createTheEvent}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={tw`text-white text-center font-semibold`}>
                    Create Event
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-indigo-600 p-3 rounded-xl`}
                onPress={() => {
                  (setCreateEvent(false),
                    setEventData({
                      Name: "",
                      Date: new Date(),
                      Time: "",
                      Venue: "",
                      Description: "",
                      Terms: "",
                      Entry_Instruction: "",
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
        <PopUpAlert
          success={failModal}
          text={"Failed to create event"}
          header={"Failed!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
      </Modal>
    </View>
  );
}
