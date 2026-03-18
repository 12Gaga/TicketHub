import Fontisto from "@expo/vector-icons/Fontisto";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Alert,
} from "react-native";
import tw from "twrnc";
import { useContext, useState } from "react";
import { EventContext } from "../Configs/AuthContext";
import globalApi from "../Configs/globalApi";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import PopUpAlert from "./PopUpAlert";
import * as ImagePicker from "expo-image-picker";

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
  const [text, setText] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState(null);

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

  const resetForm = () => {
    setEventData({
      Name: "",
      Date: new Date(),
      Time: "",
      Venue: "",
      Description: "",
      Terms: "",
      Entry_Instruction: "",
    });
    setSelectedImage(null);
  };

  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      setEventData({ ...eventData, Date: selectedDate });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1000, 1234],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // Verify dimensions
      // if (asset.width !== 1000 || asset.height !== 1234) {
      //   setText(
      //     `Invalid Image Size \n Image must be exactly 1000 x 1234 px.\nYour image is ${asset.width} x ${asset.height} px.`,
      //   );
      //   setFailModal(true);
      //   return;
      // }

      setSelectedImage(asset);
    }
  };

  const uploadImage = async (imageAsset) => {
    const formData = new FormData();
    formData.append("files", {
      uri: imageAsset.uri,
      name: imageAsset.fileName || "photo.jpg",
      type: imageAsset.mimeType || "image/jpeg",
    });

    console.log("Uploading image...", imageAsset);
    const response = await globalApi.uploadFile(formData);
    console.log("Upload response:", JSON.stringify(response));

    if (response.ok) {
      return response.data[0].id;
    }
    console.log("Upload failed:", response.status, response.data);
    return null;
  };

  const createTheEvent = async () => {
    // Check image first before loading starts
    if (!selectedImage) {
      setText(
        "Image Required! \n Please select an event image before creating.",
      );
      setFailModal(true);
      return;
    }

    setLoading(true);
    try {
      const imageId = await uploadImage(selectedImage);
      console.log("Image ID:", imageId);

      const payload = {
        Name: eventData.Name,
        Date: eventData.Date.toISOString().split("T")[0],
        Time: eventData.Time,
        Venue: eventData.Venue,
        Description: eventData.Description,
        Terms: eventData.Terms,
        Entry_Instruction: eventData.Entry_Instruction,
        Image: imageId,
      };

      const resp = await globalApi.setEvent(payload);
      console.log("Create event response:", JSON.stringify(resp.data));
      if (resp.ok) {
        setFilteredEvents([...filteredEvents, resp.data.data]);
        setEvents([...events, resp.data.data]);
        resetForm();
        setCreateEvent(false);
      } else {
        setText("Failed to create event");
        setFailModal(true);
      }
    } catch (err) {
      setText("Failed to create event");
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={createEvent}
        onRequestClose={() => {
          resetForm();
          setCreateEvent(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <View
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-40`}
          >
            <View style={tw`bg-white w-80 rounded-xl shadow-lg`}>
              <ScrollView
                contentContainerStyle={tw`p-5`}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Title */}
                <Text style={tw`text-lg font-bold text-center`}>
                  Create New Event
                </Text>
                <Text style={tw`text-xs text-gray-400 mb-4 text-center`}>
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
                          const hours = date
                            .getHours()
                            .toString()
                            .padStart(2, "0");
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

                {/* Event Image */}
                <View style={tw`mt-2`}>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Event Image <Text style={tw`text-red-500`}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={tw`border border-black rounded-[5px] mb-2 items-center justify-center overflow-hidden`}
                  >
                    {selectedImage ? (
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={tw`w-full h-32`}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={tw`items-center py-5`}>
                        <Ionicons
                          name="image-outline"
                          size={28}
                          color="#6B7280"
                        />
                        <Text style={tw`text-xs text-gray-400 mt-1`}>
                          Tap to select image
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View style={tw`flex-row items-center justify-end mt-2`}>
                  <TouchableOpacity
                    style={tw`bg-indigo-600 p-3 rounded-xl mr-1.5 ${
                      !eventData.Name ||
                      !eventData.Date ||
                      !eventData.Time ||
                      !eventData.Venue
                        ? "opacity-50"
                        : "opacity-100"
                    }`}
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
                    style={tw`border border-indigo-600 p-3 rounded-xl`}
                    onPress={() => {
                      resetForm();
                      setCreateEvent(false);
                    }}
                  >
                    <Text style={tw`text-indigo-600 text-center font-semibold`}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        <PopUpAlert
          success={failModal}
          text={text}
          header={"Error!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
      </Modal>
    </View>
  );
}
