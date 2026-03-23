import { useEffect, useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import globalApi from "../Configs/globalApi";
import { EventContext } from "../Configs/AuthContext";
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
  resolveMediaUrl,
  uploadEventPoster,
} from "../Configs/eventPosterUtils";
import { EVENT_POSTER_RATIO } from "../Configs/ticketLayout";

const GRAD_PALETTES = [
  ["#7C3AED", "#4F46E5"],
  ["#0EA5E9", "#6366F1"],
  ["#EC4899", "#8B5CF6"],
  ["#F59E0B", "#EF4444"],
  ["#10B981", "#0EA5E9"],
];

function formatDate(dateStr) {
  if (!dateStr) return "TBA";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "TBA";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null;

  const [datePart] = String(dateStr).split("T");
  const [year, month, day] = datePart.split("-").map((value) => Number(value));

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getStatus(event) {
  if (!event.On_Live) {
    return { label: "Ended" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = parseLocalDate(event.Date);
  if (!eventDate) {
    return { label: "Upcoming" };
  }
  if (eventDate > today) {
    return { label: "Upcoming" };
  }

  return { label: "Ongoing" };
}

export default function EventCard({
  event,
  visible,
  setVisible,
  onEdit,
  onComplete,
  index = 0,
}) {
  const palette = GRAD_PALETTES[index % GRAD_PALETTES.length];
  const status = getStatus(event);
  const [eventBookedTicket, setEventBookedTicket] = useState([]);
  const [eventTicketType, setEventTicketType] = useState([]);
  const [limitDrafts, setLimitDrafts] = useState({});
  const [newTicketRows, setNewTicketRows] = useState([]);
  const [newTicketDraft, setNewTicketDraft] = useState(createTicketDraft());
  const [selectedImage, setSelectedImage] = useState(null);
  const [failModal, setFailModal] = useState(false);
  const [failText, setFailText] = useState("");
  const [saving, setSaving] = useState(false);
  const [markEnded, setMarkEnded] = useState(false);
  const {
    createTicketLimit,
    loading,
    refreshEvents,
    setCreateTicketLimit,
    tickets,
  } = useContext(EventContext);

  const refreshEventData = async () => {
    const [ticketResp, bookedResp] = await Promise.all([
      globalApi.getTicketLimit(event.documentId),
      globalApi.getBookedTicketByEvent(event.documentId),
    ]);

    if (ticketResp.ok) {
      setEventTicketType(ticketResp.data.data);
    }
    if (bookedResp.ok) {
      setEventBookedTicket(bookedResp.data.data);
    }
  };

  useEffect(() => {
    refreshEventData();

    return () => {};
  }, [createTicketLimit, event.documentId]);

  useEffect(() => {
    if (!visible) return;

    refreshEventData();
  }, [visible, event.documentId]);

  const soldCountByTicketId = useMemo(() => {
    return (eventBookedTicket ?? []).reduce((acc, bookedTicket) => {
      const ticketId = bookedTicket.ticket?.documentId;
      if (!ticketId) return acc;
      acc[ticketId] = (acc[ticketId] ?? 0) + 1;
      return acc;
    }, {});
  }, [eventBookedTicket]);

  const existingTicketIds = useMemo(
    () =>
      (eventTicketType ?? [])
        .map((ticketLimit) => String(ticketLimit.ticket?.documentId || ""))
        .filter(Boolean),
    [eventTicketType],
  );

  const editableTicketLimits = useMemo(
    () =>
      (eventTicketType ?? []).filter((ticketLimit) => ticketLimit.isLimited),
    [eventTicketType],
  );

  useEffect(() => {
    if (!visible) return;

    setNewTicketRows([]);
    setNewTicketDraft(createTicketDraft());
    setSelectedImage(null);
    setMarkEnded(false);
  }, [visible, event.documentId]);

  useEffect(() => {
    if (!visible) return;

    const nextDrafts = editableTicketLimits.reduce((acc, ticketLimit) => {
      acc[ticketLimit.documentId] = String(ticketLimit.Limit ?? 0);
      return acc;
    }, {});

    setLimitDrafts(nextDrafts);
  }, [editableTicketLimits, visible]);

  const updateSeatDraft = (documentId, value) => {
    setLimitDrafts((current) => ({
      ...current,
      [documentId]: sanitizeTicketLimitInput(value),
    }));
  };

  const isTicketDraftEmpty = (row) =>
    !row?.ticket && !row?.isLimited && !sanitizeTicketLimitInput(row?.Limit);

  const addNewTicketRow = () => {
    const validationError = validateTicketDrafts([newTicketDraft], {
      reservedTicketIds: [
        ...existingTicketIds,
        ...newTicketRows.map((row) => row.ticket),
      ],
    });

    if (validationError) {
      setFailText(validationError);
      setFailModal(true);
      return;
    }

    setNewTicketRows((current) => [...current, newTicketDraft]);
    setNewTicketDraft(createTicketDraft());
  };

  const updateNewTicketDraft = (patch) => {
    setNewTicketDraft((current) => ({ ...current, ...patch }));
  };

  const removeNewTicketRow = (rowId) => {
    setNewTicketRows((current) => current.filter((row) => row.id !== rowId));
  };

  const getAvailableTicketsForDraft = () => {
    const reservedIds = new Set(existingTicketIds);
    newTicketRows.forEach((row) => {
      if (row.ticket) {
        reservedIds.add(String(row.ticket));
      }
    });
    return (tickets ?? []).filter((ticket) => {
      const ticketId = String(ticket.documentId);
      return (
        !reservedIds.has(ticketId) ||
        ticketId === String(newTicketDraft.ticket || "")
      );
    });
  };

  const getTicketLabel = (ticketId) =>
    tickets?.find((ticket) => ticket.documentId === ticketId)?.Name ??
    "Ticket type";

  const availableDraftTickets = getAvailableTicketsForDraft();
  const previewImageUri =
    selectedImage?.uri ?? resolveMediaUrl(event.Image?.url);

  const createEventUpdatePayload = (imageId) => ({
    Name: event.Name,
    Date: event.Date,
    Time: event.Time,
    Venue: event.Venue,
    Description: event.Description,
    Terms: event.Terms,
    Entry_Instruction: event.Entry_Instruction,
    On_Live: event.On_Live,
    ...(imageId ? { Image: imageId } : {}),
  });

  const pickImage = async () => {
    try {
      const nextImage = await pickAndPrepareEventPoster();
      if (nextImage) {
        setSelectedImage(nextImage);
      }
    } catch (error) {
      setFailText("Failed to prepare event image.");
      setFailModal(true);
    }
  };

  const saveExistingSeatCounts = async () => {
    const updates = [];

    for (const ticketLimit of editableTicketLimits) {
      const rawValue = limitDrafts[ticketLimit.documentId];
      const soldCount =
        soldCountByTicketId[ticketLimit.ticket?.documentId] ?? 0;

      if (rawValue === undefined || rawValue === "") {
        setFailText(
          `Seat count is required for ${ticketLimit.ticket?.Name ?? "this ticket type"}.`,
        );
        setFailModal(true);
        return false;
      }

      const nextLimit = Number.parseInt(rawValue, 10);
      if (!Number.isFinite(nextLimit)) {
        setFailText(
          `Seat count must be a valid number for ${ticketLimit.ticket?.Name ?? "this ticket type"}.`,
        );
        setFailModal(true);
        return false;
      }

      if (nextLimit < soldCount) {
        setFailText(
          `You cannot reduce ${ticketLimit.ticket?.Name ?? "this ticket type"} below ${soldCount} sold tickets.`,
        );
        setFailModal(true);
        return false;
      }

      if (nextLimit !== Number(ticketLimit.Limit ?? 0)) {
        updates.push({
          ticketLimit,
          request: globalApi.updateEventTicketLimit(ticketLimit.documentId, {
            Limit: nextLimit,
            isLimited: true,
            event: event.documentId,
            ticket: ticketLimit.ticket?.documentId,
          }),
        });
      }
    }

    if (updates.length === 0) {
      return true;
    }

    const results = await Promise.allSettled(
      updates.map((update) => update.request),
    );
    let latestUpdatedLimit = null;
    const hasFailure = results.some(
      (result) => result.status !== "fulfilled" || !result.value.ok,
    );

    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.ok) {
        latestUpdatedLimit = result.value.data?.data ?? latestUpdatedLimit;
      }
    });

    if (latestUpdatedLimit) {
      setCreateTicketLimit(latestUpdatedLimit);
    }

    if (hasFailure) {
      await refreshEventData();
      setFailText(
        "Some seat counts failed to update. Review the latest values and confirm again.",
      );
      setFailModal(true);
      return false;
    }

    return true;
  };

  const saveNewTicketRows = async () => {
    const rowsToSubmit = isTicketDraftEmpty(newTicketDraft)
      ? newTicketRows
      : [...newTicketRows, newTicketDraft];

    const validationError = validateTicketDrafts(rowsToSubmit, {
      reservedTicketIds: existingTicketIds,
    });

    if (validationError) {
      setFailText(validationError);
      setFailModal(true);
      return false;
    }

    if (rowsToSubmit.length === 0) {
      return true;
    }

    const results = await Promise.allSettled(
      rowsToSubmit.map((row) =>
        globalApi.setEventTicketLimit(
          buildTicketLimitPayload(row, event.documentId),
        ),
      ),
    );

    const failedRows = [];
    let latestCreatedLimit = null;

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.ok) {
        latestCreatedLimit = result.value.data?.data ?? latestCreatedLimit;
      } else {
        failedRows.push(rowsToSubmit[index]);
      }
    });

    if (latestCreatedLimit) {
      setCreateTicketLimit(latestCreatedLimit);
    }

    if (failedRows.length > 0) {
      await refreshEventData();
      setNewTicketRows(failedRows);
      setNewTicketDraft(createTicketDraft());
      setFailText(
        "Some new ticket types failed to save. Review the remaining rows and confirm again.",
      );
      setFailModal(true);
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (selectedImage) {
        const imageId = await uploadEventPoster(selectedImage);
        if (!imageId) {
          throw new Error("Failed to upload event image.");
        }

        const eventResponse = await globalApi.updateEvent(
          event.documentId,
          createEventUpdatePayload(imageId),
        );

        if (!eventResponse.ok) {
          throw new Error("Failed to update event image.");
        }

        await refreshEvents?.();
      }

      const seatCountsSaved = await saveExistingSeatCounts();
      if (!seatCountsSaved) return;

      const newRowsSaved = await saveNewTicketRows();
      if (!newRowsSaved) return;

      await refreshEventData();
      await refreshEvents?.();

      if (markEnded) {
        await onComplete?.(event);
        return;
      }

      setVisible(false);
    } catch (error) {
      setFailText(error?.message || "Failed to update event.");
      setFailModal(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Animated.View
      style={[
        tw`mb-4`,
        {
          shadowColor: palette[0],
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
        },
      ]}
    >
      <View
        style={tw`bg-white rounded-3xl overflow-hidden border border-gray-100`}
      >
        <LinearGradient
          colors={palette}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`px-5 pt-5 pb-2`}
        >
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={tw`text-white text-2xl font-bold tracking-tight`}>
              {event.Name}
            </Text>
            <View style={tw`bg-white bg-opacity-20 px-3 py-1 rounded-full`}>
              <Text style={tw`text-white text-xs font-bold tracking-wide`}>
                {status.label}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={tw`px-5 pt-4 pb-2`}>
          <View style={tw`flex-row items-center mb-2.5`}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color="#7C3AED"
              style={tw`mr-2`}
            />
            <Text style={tw`text-gray-600 text-sm font-medium`}>
              {formatDate(event.Date)}
            </Text>
          </View>
          <View style={tw`flex-row items-center mb-2.5`}>
            <Ionicons
              name="time-outline"
              size={15}
              color="#7C3AED"
              style={tw`mr-2`}
            />
            <Text style={tw`text-gray-600 text-sm font-medium`}>
              {formatTime(event.Time)}
            </Text>
          </View>
          <View style={tw`flex-row items-center mb-3`}>
            <Ionicons
              name="location-outline"
              size={15}
              color="#7C3AED"
              style={tw`mr-2`}
            />
            <Text style={tw`text-gray-600 text-sm font-medium`}>
              {event.Venue ?? "TBA"}
            </Text>
          </View>

          {event.Description ? (
            <Text
              style={tw`text-gray-400 text-sm leading-5 mb-4`}
              numberOfLines={2}
            >
              {event.Description}
            </Text>
          ) : null}

          <View style={tw`flex-row border-t border-gray-100 pt-3 mb-3`}>
            <View style={tw`flex-1 items-center`}>
              <View style={tw`flex-row items-center mb-0.5`}>
                <Ionicons
                  name="ticket-outline"
                  size={12}
                  color="#6B7280"
                  style={tw`mr-1`}
                />
                <Text
                  style={tw`text-gray-400 text-xs font-semibold tracking-wide`}
                >
                  Sold
                </Text>
              </View>
              <Text style={tw`text-gray-800 text-base font-bold`}>
                {(eventBookedTicket ?? []).length}
              </Text>
            </View>

            <View style={tw`w-px bg-gray-100`} />
            <View style={tw`w-px bg-gray-100`} />

            <View style={tw`flex-1 items-center`}>
              <View style={tw`flex-row items-center mb-0.5`}>
                <Ionicons
                  name="people-outline"
                  size={12}
                  color="#6B7280"
                  style={tw`mr-1`}
                />
                <Text
                  style={tw`text-gray-400 text-xs font-semibold tracking-wide`}
                >
                  Types
                </Text>
              </View>
              <Text style={tw`text-gray-800 text-base font-bold`}>
                {(eventTicketType ?? []).length}
              </Text>
            </View>
          </View>

          {(eventTicketType ?? [])
            .filter((ticketLimit) => ticketLimit.isLimited === true)
            .map((ticketLimit) => {
              const sold =
                soldCountByTicketId[ticketLimit.ticket?.documentId] ?? 0;
              const limit = ticketLimit.Limit ?? 0;
              const pct =
                limit > 0 ? Math.min(100, Math.round((sold / limit) * 100)) : 0;

              return (
                <View key={ticketLimit.documentId} style={tw`mb-3`}>
                  <View style={tw`flex-row justify-between mb-1.5`}>
                    <Text style={tw`text-gray-400 text-xs font-semibold`}>
                      Capacity for {ticketLimit.ticket?.Name ?? "Ticket"}
                    </Text>
                    <Text style={tw`text-gray-500 text-xs font-semibold`}>
                      {sold} / {limit} ({pct}%)
                    </Text>
                  </View>
                  <View
                    style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}
                  >
                    <LinearGradient
                      colors={palette}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[tw`h-2 rounded-full`, { width: `${pct}%` }]}
                    />
                  </View>
                </View>
              );
            })}

          <TouchableOpacity
            onPress={() => onEdit?.(event)}
            style={tw`mt-2 mb-2 flex-row items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 py-3`}
          >
            <Ionicons name="create-outline" size={16} color="#4F46E5" />
            <Text style={tw`ml-2 text-sm font-semibold text-indigo-700`}>
              Edit Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        key={event.Name}
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <View
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-40`}
          >
            <View
              style={tw`bg-white w-[92%] rounded-2xl shadow-lg max-h-[88%]`}
            >
              <ScrollView
                contentContainerStyle={tw`px-4 py-5`}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={tw`text-lg font-bold text-gray-800 mb-1`}>
                  Edit Event
                </Text>
                <Text style={tw`text-sm text-gray-500 mb-4`}>
                  Update the event poster, adjust ticket limits, add ticket
                  types, or mark the event ended.
                </Text>

                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-semibold text-gray-800 mb-1`}>
                    Ticket Poster
                  </Text>
                  <Text style={tw`text-xs text-gray-500 mb-2`}>
                    Poster will be fixed to 4:5 at 720 x 900 and uploaded as
                    JPEG only.
                  </Text>
                  <View
                    style={tw`overflow-hidden rounded-xl border border-gray-200 bg-gray-50`}
                  >
                    {previewImageUri ? (
                      <Image
                        source={{ uri: previewImageUri }}
                        style={{
                          width: "100%",
                          aspectRatio: EVENT_POSTER_RATIO,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={tw`items-center justify-center py-8 px-4`}>
                        <Ionicons
                          name="image-outline"
                          size={28}
                          color="#6B7280"
                        />
                        <Text style={tw`mt-2 text-sm font-medium text-gray-600`}>
                          No poster selected
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={tw`mt-3 flex-row items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 py-3`}
                    disabled={saving || loading}
                  >
                    <Ionicons name="image-outline" size={16} color="#4F46E5" />
                    <Text style={tw`ml-2 text-sm font-semibold text-indigo-700`}>
                      {selectedImage ? "Change Selected Poster" : "Change Poster"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-semibold text-gray-800 mb-2`}>
                    Existing Limited Ticket Types
                  </Text>

                  {editableTicketLimits.length > 0 ? (
                    editableTicketLimits.map((ticketLimit) => {
                      const ticketName = ticketLimit.ticket?.Name ?? "Ticket";
                      const soldCount =
                        soldCountByTicketId[ticketLimit.ticket?.documentId] ??
                        0;

                      return (
                        <View
                          key={ticketLimit.documentId}
                          style={tw`mb-3 rounded-xl border border-gray-200 px-4 py-3`}
                        >
                          <Text
                            style={tw`text-base font-semibold text-gray-800`}
                          >
                            {ticketName}
                          </Text>
                          <Text style={tw`mt-1 text-xs text-gray-500`}>
                            Sold: {soldCount} | Current limit:{" "}
                            {ticketLimit.Limit ?? 0}
                          </Text>
                          <TextInput
                            value={limitDrafts[ticketLimit.documentId] ?? ""}
                            onChangeText={(value) =>
                              updateSeatDraft(ticketLimit.documentId, value)
                            }
                            keyboardType="number-pad"
                            placeholder="Seat count"
                            style={tw`mt-3 rounded-xl border border-gray-300 px-3 py-2.5 text-gray-800`}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <View
                      style={tw`rounded-xl border border-dashed border-gray-300 px-4 py-4`}
                    >
                      <Text style={tw`text-sm text-gray-500`}>
                        No limited ticket types are attached yet.
                      </Text>
                    </View>
                  )}
                </View>

                {availableDraftTickets.length > 0 ? (
                  <View style={tw`mb-4 border-t border-gray-200 pt-4`}>
                    <View style={tw`mb-2`}>
                      <Text style={tw`text-sm font-semibold text-gray-800`}>
                        Add Ticket Types
                      </Text>
                      <Text style={tw`mt-1 text-xs text-gray-500`}>
                        Add ticket types one by one. Existing linked ticket
                        types are excluded.
                      </Text>
                    </View>

                    {newTicketRows.length > 0 ? (
                      <View style={tw`mb-3`}>
                        <Text
                          style={tw`text-xs font-semibold text-gray-500 mb-2`}
                        >
                          Added Ticket Types
                        </Text>
                        {newTicketRows.map((row, index) => (
                          <View
                            key={row.id}
                            style={tw`mb-2 rounded-xl border border-gray-200 px-3 py-3`}
                          >
                            <View
                              style={tw`flex-row items-center justify-between`}
                            >
                              <View style={tw`flex-1 pr-3`}>
                                <Text
                                  style={tw`text-sm font-semibold text-gray-800`}
                                >
                                  {index + 1}. {getTicketLabel(row.ticket)}
                                </Text>
                                <Text style={tw`mt-1 text-xs text-gray-500`}>
                                  {row.isLimited
                                    ? `Limited seats: ${row.Limit}`
                                    : "Unlimited seats"}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => removeNewTicketRow(row.id)}
                                style={tw`rounded-lg bg-red-50 px-2 py-1`}
                              >
                                <Text
                                  style={tw`text-xs font-semibold text-red-500`}
                                >
                                  Remove
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View
                        style={tw`mb-3 rounded-xl border border-dashed border-gray-300 px-4 py-4`}
                      >
                        <Text style={tw`text-sm text-gray-500`}>
                          No new ticket types added yet.
                        </Text>
                      </View>
                    )}

                    <View
                      style={tw`rounded-xl border border-gray-200 px-3 py-3`}
                    >
                      <View
                        style={tw`flex-row items-center justify-between mb-2`}
                      >
                        <Text style={tw`text-sm font-semibold text-gray-800`}>
                          Next Ticket Type
                        </Text>
                        {!isTicketDraftEmpty(newTicketDraft) ? (
                          <Text
                            style={tw`text-xs font-semibold text-indigo-600`}
                          >
                            In progress
                          </Text>
                        ) : null}
                      </View>

                      <Text
                        style={tw`text-sm font-semibold text-gray-900 mb-1`}
                      >
                        Ticket Type <Text style={tw`text-red-500`}>*</Text>
                      </Text>
                      <Picker
                        selectedValue={newTicketDraft.ticket}
                        onValueChange={(ticketValue) =>
                          updateNewTicketDraft({ ticket: ticketValue })
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
                          value={newTicketDraft.isLimited}
                          onValueChange={(value) =>
                            updateNewTicketDraft({
                              isLimited: value,
                              Limit: value ? newTicketDraft.Limit : "",
                            })
                          }
                          color={
                            newTicketDraft.isLimited ? "#3b82f6" : undefined
                          }
                        />
                        <Text style={tw`ml-2 text-[14px] text-gray-700 flex-1`}>
                          Limit seats for this ticket type
                        </Text>
                      </View>

                      {newTicketDraft.isLimited ? (
                        <TextInput
                          placeholder="Seat count"
                          value={newTicketDraft.Limit}
                          onChangeText={(value) =>
                            updateNewTicketDraft({
                              Limit: sanitizeTicketLimitInput(value),
                            })
                          }
                          keyboardType="number-pad"
                          style={tw`border p-2.5 text-gray-700 rounded-[5px]`}
                        />
                      ) : null}

                      <TouchableOpacity
                        onPress={addNewTicketRow}
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
                  </View>
                ) : (
                  <View
                    style={tw`mb-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3`}
                  >
                    <Text style={tw`text-center text-xs text-gray-500`}>
                      All available ticket types have already been added for
                      this event.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setMarkEnded((current) => !current)}
                  style={tw`mb-4 flex-row items-center justify-between rounded-xl border px-4 py-3 ${
                    markEnded
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                  disabled={saving || loading}
                >
                  <View style={tw`flex-1 pr-3`}>
                    <Text style={tw`text-sm font-semibold text-gray-800`}>
                      Mark Event Ended
                    </Text>
                    <Text style={tw`mt-1 text-xs text-gray-500`}>
                      When confirmed, this event will move to the ended events
                      tab.
                    </Text>
                  </View>
                  <View
                    style={tw`h-7 w-12 rounded-full px-1 ${
                      markEnded ? "bg-red-500" : "bg-gray-300"
                    } justify-center`}
                  >
                    <View
                      style={tw`h-5 w-5 rounded-full bg-white ${
                        markEnded ? "self-end" : "self-start"
                      }`}
                    />
                  </View>
                </TouchableOpacity>

                <View style={tw`flex-row gap-3`}>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    style={tw`flex-1 py-3 rounded-xl bg-indigo-600 items-center`}
                    disabled={saving || loading}
                  >
                    {saving || loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={tw`text-white font-semibold text-sm`}>
                        Confirm
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setVisible(false)}
                    style={tw`flex-1 py-3 rounded-xl border border-gray-200 items-center`}
                    disabled={saving}
                  >
                    <Text style={tw`text-gray-500 font-semibold text-sm`}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PopUpAlert
        success={failModal}
        text={failText}
        header={"Failed!"}
        ModalCall={() => setFailModal(false)}
        status={false}
      />
    </Animated.View>
  );
}
