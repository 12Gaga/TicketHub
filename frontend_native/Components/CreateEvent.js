import Fontisto from "@expo/vector-icons/Fontisto";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
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
} from "react-native";
import tw from "twrnc";
import { useContext, useState } from "react";
import { EventContext } from "../Configs/AuthContext";
import globalApi from "../Configs/globalApi";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import PopUpAlert from "./PopUpAlert";
import {
  buildTicketLimitPayload,
  createTicketDraft,
  sanitizeTicketLimitInput,
  validateTicketDrafts,
} from "../Configs/eventTicketUtils";
import {
  pickAndPrepareEventPoster,
  uploadEventPoster,
} from "../Configs/eventPosterUtils";
import {
  EVENT_POSTER_RATIO,
} from "../Configs/ticketLayout";

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
  const [ticketRows, setTicketRows] = useState([]);
  const [ticketDraft, setTicketDraft] = useState(createTicketDraft());
  const [createdEventRecord, setCreatedEventRecord] = useState(null);
  const [successfulTicketIds, setSuccessfulTicketIds] = useState([]);

  const {
    createEvent,
    setCreateEvent,
    refreshEvents,
    loading,
    setLoading,
    tickets,
    setCreateTicketLimit,
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
    setTicketRows([]);
    setTicketDraft(createTicketDraft());
    setCreatedEventRecord(null);
    setSuccessfulTicketIds([]);
  };

  const onChange = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      setEventData({ ...eventData, Date: selectedDate });
    }
  };

  const pickImage = async () => {
    try {
      const nextImage = await pickAndPrepareEventPoster();
      if (nextImage) {
        setSelectedImage(nextImage);
      }
    } catch (error) {
      setText("Failed to prepare event image.");
      setFailModal(true);
    }
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const isTicketDraftEmpty = (row) =>
    !row?.ticket && !row?.isLimited && !sanitizeTicketLimitInput(row?.Limit);

  const updateTicketDraft = (patch) => {
    setTicketDraft((current) => ({ ...current, ...patch }));
  };

  const removeTicketRow = (rowId) => {
    setTicketRows((current) => current.filter((row) => row.id !== rowId));
  };

  const addTicketRow = () => {
    const validationError = validateTicketDrafts([ticketDraft], {
      reservedTicketIds: [
        ...successfulTicketIds,
        ...ticketRows.map((row) => row.ticket),
      ],
    });

    if (validationError) {
      setText(validationError);
      setFailModal(true);
      return;
    }

    setTicketRows((current) => [...current, ticketDraft]);
    setTicketDraft(createTicketDraft());
  };

  const getAvailableTicketsForDraft = () => {
    const reservedIds = new Set(successfulTicketIds.map((value) => String(value)));
    ticketRows.forEach((row) => {
      if (row.ticket) {
        reservedIds.add(String(row.ticket));
      }
    });

    return (tickets ?? []).filter((ticket) => {
      const ticketId = String(ticket.documentId);
      return !reservedIds.has(ticketId) || ticketId === String(ticketDraft.ticket || "");
    });
  };

  const getTicketLabel = (ticketId) =>
    tickets?.find((ticket) => ticket.documentId === ticketId)?.Name ??
    "Ticket type";

  const availableDraftTickets = getAvailableTicketsForDraft();

  const createEventPayload = (imageId) => ({
    Name: eventData.Name,
    Date: formatLocalDate(eventData.Date),
    Time: eventData.Time,
    Venue: eventData.Venue,
    Description: eventData.Description,
    Terms: eventData.Terms,
    Entry_Instruction: eventData.Entry_Instruction,
    Image: imageId,
  });

  const persistTicketLinks = async (eventDocumentId, draftRows) => {
    const results = await Promise.allSettled(
      draftRows.map((row) =>
        globalApi.setEventTicketLimit(buildTicketLimitPayload(row, eventDocumentId)),
      ),
    );

    const succeededRows = [];
    const failedRows = [];
    let latestTicketLimit = null;

    results.forEach((result, index) => {
      const row = draftRows[index];
      if (result.status === "fulfilled" && result.value.ok) {
        succeededRows.push(row);
        latestTicketLimit = result.value.data?.data ?? latestTicketLimit;
      } else {
        failedRows.push(row);
      }
    });

    if (latestTicketLimit) {
      setCreateTicketLimit(latestTicketLimit);
    }

    return { succeededRows, failedRows };
  };

  const createTheEvent = async () => {
    if (!selectedImage && !createdEventRecord) {
      setText(
        "Image Required! \n Please select an event image before creating.",
      );
      setFailModal(true);
      return;
    }

    const rowsToSubmit = isTicketDraftEmpty(ticketDraft)
      ? ticketRows
      : [...ticketRows, ticketDraft];

    const ticketValidationError = validateTicketDrafts(rowsToSubmit, {
      minimumCount: 1,
      reservedTicketIds: successfulTicketIds,
    });

    if (ticketValidationError) {
      setText(ticketValidationError);
      setFailModal(true);
      return;
    }

    setLoading(true);
    try {
      let currentEvent = createdEventRecord;

      if (!currentEvent) {
        const imageId = await uploadEventPoster(selectedImage);
        if (!imageId) {
          throw new Error("Failed to upload event image.");
        }

        const eventResp = await globalApi.setEvent(createEventPayload(imageId));
        if (!eventResp.ok) {
          throw new Error("Failed to create event.");
        }

        currentEvent = eventResp.data.data;
        setCreatedEventRecord(currentEvent);
        await refreshEvents?.();
      }

      const { succeededRows, failedRows } = await persistTicketLinks(
        currentEvent.documentId,
        rowsToSubmit,
      );

      if (failedRows.length > 0) {
        setSuccessfulTicketIds((current) => [
          ...new Set([
            ...current,
            ...succeededRows.map((row) => String(row.ticket)),
          ]),
        ]);
        setTicketRows(
          failedRows.length > 0 ? failedRows : [],
        );
        setTicketDraft(createTicketDraft());
        setText(
          "Event created, but some ticket types failed to save. Review the remaining rows and confirm again.",
        );
        setFailModal(true);
        return;
      }

      resetForm();
      setCreateEvent(false);
    } catch (error) {
      setText(error?.message || "Failed to create event");
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  const canSubmitEvent =
    !!eventData.Name &&
    !!eventData.Date &&
    !!eventData.Time &&
    !!eventData.Venue &&
    (!!selectedImage || !!createdEventRecord);

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
            <View style={tw`bg-white w-[92%] rounded-2xl shadow-lg max-h-[88%]`}>
              <ScrollView
                contentContainerStyle={tw`px-4 py-5`}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={tw`text-lg font-bold text-center`}>
                  Create New Event
                </Text>
                <Text style={tw`text-xs text-gray-400 mb-4 text-center`}>
                  Create the event and attach ticket types in one step.
                </Text>

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
                          setEventData({
                            ...eventData,
                            Time: `${hours}:${minutes}:00`,
                          });
                        }
                      }}
                    />
                  )}
                </View>

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

                <View style={tw`mt-2`}>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Entry Instructions
                  </Text>
                  <TextInput
                    placeholder="Instructions for entering for event ..."
                    value={eventData.Entry_Instruction}
                    onChangeText={(text) =>
                      setEventData({
                        ...eventData,
                        Entry_Instruction: text,
                      })
                    }
                    style={tw`border border-black rounded-[5px] pl-2 mb-2 text-[13px] text-gray-700`}
                  />
                </View>

                <View style={tw`mt-2`}>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Event Image <Text style={tw`text-red-500`}>*</Text>
                  </Text>
                  <Text style={tw`text-xs text-gray-400 mb-2`}>
                    Poster will be fixed to 4:5 at 720 x 900 and uploaded as JPEG only.
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={tw`border border-black rounded-[5px] mb-2 items-center justify-center overflow-hidden`}
                  >
                    {selectedImage ? (
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={{
                          width: "100%",
                          aspectRatio: EVENT_POSTER_RATIO,
                          maxHeight: 260,
                        }}
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

                <View style={tw`mt-4 border-t border-gray-200 pt-4`}>
                  <View style={tw`mb-3`}>
                    <Text style={tw`text-sm font-semibold text-gray-900`}>
                      Ticket Types <Text style={tw`text-red-500`}>*</Text>
                    </Text>
                    <Text style={tw`text-xs text-gray-400 mt-1`}>
                      Add ticket types one by one until the event setup is complete.
                    </Text>
                  </View>

                  {createdEventRecord && successfulTicketIds.length > 0 ? (
                    <View style={tw`mb-3 rounded-xl bg-emerald-50 px-3 py-2`}>
                      <Text style={tw`text-xs text-emerald-700`}>
                        Event created. {successfulTicketIds.length} ticket
                        {successfulTicketIds.length > 1 ? " types are" : " type is"}{" "}
                        already linked. Submit again to finish remaining rows.
                      </Text>
                    </View>
                  ) : null}

                  {ticketRows.length > 0 ? (
                    <View style={tw`mb-3`}>
                      <Text style={tw`text-xs font-semibold text-gray-500 mb-2`}>
                        Added Ticket Types
                      </Text>
                      {ticketRows.map((row, index) => (
                        <View
                          key={row.id}
                          style={tw`mb-2 rounded-xl border border-gray-200 px-3 py-3`}
                        >
                          <View style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-1 pr-3`}>
                              <Text style={tw`text-sm font-semibold text-gray-800`}>
                                {index + 1}. {getTicketLabel(row.ticket)}
                              </Text>
                              <Text style={tw`mt-1 text-xs text-gray-500`}>
                                {row.isLimited
                                  ? `Limited seats: ${row.Limit}`
                                  : "Unlimited seats"}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => removeTicketRow(row.id)}
                              style={tw`rounded-lg bg-red-50 px-2 py-1`}
                            >
                              <Text style={tw`text-xs font-semibold text-red-500`}>
                                Remove
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {availableDraftTickets.length > 0 ? (
                    <View style={tw`rounded-xl border border-gray-200 px-3 py-3`}>
                      <View style={tw`flex-row items-center justify-between mb-2`}>
                        <Text style={tw`text-sm font-semibold text-gray-800`}>
                          Next Ticket Type
                        </Text>
                        {!isTicketDraftEmpty(ticketDraft) ? (
                          <Text style={tw`text-xs font-semibold text-indigo-600`}>
                            In progress
                          </Text>
                        ) : null}
                      </View>

                      <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                        Ticket Type <Text style={tw`text-red-500`}>*</Text>
                      </Text>
                      <Picker
                        selectedValue={ticketDraft.ticket}
                        onValueChange={(ticketValue) =>
                          updateTicketDraft({ ticket: ticketValue })
                        }
                        style={tw`bg-[#eee] mb-3 text-gray-700`}
                      >
                        <Picker.Item label="Select ticket type..." value="" />
                        {availableDraftTickets.map((ticket) => (
                          <Picker.Item
                            key={ticket.documentId}
                            label={ticket.Name}
                            value={ticket.documentId}
                          />
                        ))}
                      </Picker>

                      <View style={tw`flex-row items-center mb-3`}>
                        <Checkbox
                          value={ticketDraft.isLimited}
                          onValueChange={(value) =>
                            updateTicketDraft({
                              isLimited: value,
                              Limit: value ? ticketDraft.Limit : "",
                            })
                          }
                          color={ticketDraft.isLimited ? "#3b82f6" : undefined}
                        />
                        <Text style={tw`ml-2 text-[14px] text-gray-700 flex-1`}>
                          Limit seats for this ticket type
                        </Text>
                      </View>

                      {ticketDraft.isLimited ? (
                        <TextInput
                          placeholder="Seat count"
                          value={ticketDraft.Limit}
                          onChangeText={(value) =>
                            updateTicketDraft({
                              Limit: sanitizeTicketLimitInput(value),
                            })
                          }
                          keyboardType="number-pad"
                          style={tw`border p-2.5 text-gray-700 rounded-[5px]`}
                        />
                      ) : null}

                      <TouchableOpacity
                        onPress={addTicketRow}
                        style={tw`mt-3 flex-row items-center justify-center rounded-xl bg-indigo-50 py-3`}
                      >
                        <Ionicons name="add" size={16} color="#4F46E5" />
                        <Text
                          style={tw`ml-2 text-sm font-semibold text-indigo-700`}
                        >
                          Add This Ticket Type
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={tw`mt-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3`}
                    >
                      <Text style={tw`text-center text-xs text-gray-500`}>
                        All available ticket types have already been added for
                        this event.
                      </Text>
                    </View>
                  )}

                </View>

                <View style={tw`flex-row items-center justify-end mt-2`}>
                  <TouchableOpacity
                    style={tw`bg-indigo-600 p-3 rounded-xl mr-1.5 ${
                      canSubmitEvent ? "opacity-100" : "opacity-50"
                    }`}
                    disabled={!canSubmitEvent}
                    onPress={createTheEvent}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={tw`text-white text-center font-semibold`}>
                        Confirm
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
