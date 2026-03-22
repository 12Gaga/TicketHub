import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import globalApi from "../Configs/globalApi";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import PopUpAlert from "../Components/PopUpAlert";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sortEventsByName(events = []) {
  return [...events].sort((left, right) =>
    String(left?.Name ?? "").localeCompare(String(right?.Name ?? ""), "en", {
      sensitivity: "base",
    }),
  );
}

export default function RegenerateBarcode() {
  const navigation = useNavigation();
  const [failModal, setFailModal] = useState(false);
  const [text, setText] = useState("");
  
  // ── Barcode Search States ──
  const [showSearch, setShowSearch] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketModal, setTicketModal] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const liveResp = await globalApi.getEvents();

        if (!liveResp.ok) {
          throw new Error("Failed to fetch events");
        }

        setEvents(sortEventsByName(liveResp.data?.data ?? []));
      } catch (error) {
        setText("Failed fetching events");
        setFailModal(true);
        console.error(error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.documentId === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const canSearch = !!(selectedEventId && searchName.trim());

  const resetSearchState = () => {
    setSearchName("");
    setSearchResults([]);
    setSearching(false);
    setHasSearched(false);
    setSelectedTicket(null);
    setTicketModal(false);
  };

  const handleToggleSearch = () => {
    setShowSearch((current) => {
      const nextValue = !current;

      if (!nextValue) {
        setSelectedEventId(null);
        resetSearchState();
      }

      return nextValue;
    });
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    resetSearchState();
  };

  const handleChangeSearchName = (value) => {
    setSearchName(value);
    setSearchResults([]);
    setHasSearched(false);
    setSelectedTicket(null);
    setTicketModal(false);
  };

  const handleSearchByName = async () => {
    if (!canSearch) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const resp = await globalApi.searchBookedTicketByEventAndName(
        selectedEventId,
        searchName.trim(),
      );

      if (resp.ok) {
        setSearchResults(resp.data?.data ?? []);
      } else {
        throw new Error("Search request failed");
      }
    } catch (error) {
      setText("Failed fetching Data");
      setFailModal(true);
      setSearchResults([]);
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={tw`border border-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-4`}
        onPress={handleToggleSearch}
      >
        <Ionicons name="barcode-outline" size={18} color="#4F46E5" />
        <Text style={tw`text-indigo-600 font-bold text-sm ml-2`}>
          Generate Barcode
        </Text>
      </TouchableOpacity>

      {showSearch && (
        <View style={tw`mb-4`}>
          <View
            style={tw`bg-white rounded-2xl p-4 mb-4 border border-gray-100`}
          >
            <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
              Event <Text style={tw`text-red-500`}>*</Text>
            </Text>
            <View
              style={tw`border border-gray-200 rounded-xl bg-gray-50 overflow-hidden flex-row items-center px-3 mb-4`}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#6366F1"
                style={tw`mr-2`}
              />
              {eventsLoading ? (
                <View style={tw`flex-1 py-4`}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                </View>
              ) : (
                <Picker
                  selectedValue={selectedEventId}
                  onValueChange={handleSelectEvent}
                  style={tw`flex-1 h-13 text-sm text-gray-700`}
                >
                  <Picker.Item
                    label="Select an event"
                    value={null}
                    color="#9CA3AF"
                  />
                  {events.map((event) => (
                    <Picker.Item
                      key={event.documentId}
                      label={event.Name}
                      value={event.documentId}
                      color="#111827"
                    />
                  ))}
                </Picker>
              )}
            </View>

            <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
              Customer Name <Text style={tw`text-red-500`}>*</Text>
            </Text>
            <TextInput
              value={searchName}
              onChangeText={handleChangeSearchName}
              placeholder="Type customer name..."
              editable={!!selectedEventId}
              style={[
                tw`border rounded-xl px-4 py-3 text-sm bg-white`,
                {
                  borderColor: selectedEventId ? "#A5B4FC" : "#E5E7EB",
                  color: selectedEventId ? "#374151" : "#9CA3AF",
                },
              ]}
            />
            <TouchableOpacity
              style={[
                tw`mt-3 px-4 py-3 rounded-xl items-center`,
                { backgroundColor: canSearch ? "#4F46E5" : "#E5E7EB" },
              ]}
              onPress={handleSearchByName}
              disabled={!canSearch || searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  style={[
                    tw`font-bold text-sm`,
                    { color: canSearch ? "#FFFFFF" : "#9CA3AF" },
                  ]}
                >
                  Search
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {searchResults.length > 0 && (
            <>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text style={tw`text-base font-bold text-gray-900`}>
                  Results{" "}
                  <Text style={tw`text-indigo-500`}>({searchResults.length})</Text>
                </Text>
                <Text style={tw`text-xs text-gray-400`}>
                  {selectedEvent?.Name ?? "—"}
                </Text>
              </View>

              <View
                style={[
                  tw`bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4`,
                  { elevation: 2 },
                ]}
              >
                <View style={[tw`flex-row`, { backgroundColor: "#4F46E5" }]}>
                  <View style={[tw`px-3 py-3 justify-center`, { width: 60 }]}>
                    <Text style={tw`text-white text-xs font-bold`}>No</Text>
                  </View>
                  <View style={[tw`px-3 py-3 justify-center`, { flex: 1 }]}>
                    <Text style={tw`text-white text-xs font-bold`}>Name</Text>
                  </View>
                  <View style={[tw`px-3 py-3 justify-center`, { width: 150 }]}>
                    <Text style={tw`text-white text-xs font-bold`}>
                      Booked At
                    </Text>
                  </View>
                </View>

                {searchResults.map((ticket, index) => (
                  <TouchableOpacity
                    key={ticket.documentId}
                    onPress={() => {
                      setSelectedTicket(ticket);
                      setTicketModal(true);
                    }}
                    style={[
                      tw`flex-row`,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                        borderTopWidth: 1,
                        borderTopColor: "#F3F4F6",
                      },
                    ]}
                  >
                    <View style={[tw`px-3 py-4 justify-center`, { width: 60 }]}>
                      <Text style={tw`text-xs text-gray-500`}>{index + 1}</Text>
                    </View>
                    <View style={[tw`px-3 py-4 justify-center`, { flex: 1 }]}>
                      <Text
                        style={tw`text-xs text-gray-800 font-semibold`}
                        numberOfLines={1}
                      >
                        {ticket.Name ?? "—"}
                      </Text>
                    </View>
                    <View
                      style={[tw`px-3 py-4 justify-center`, { width: 150 }]}
                    >
                      <Text style={tw`text-xs text-gray-600`} numberOfLines={2}>
                        {formatDate(ticket.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {!searching &&
            hasSearched &&
            selectedEventId &&
            searchName.trim() &&
            searchResults.length === 0 && (
              <View style={tw`items-center py-6`}>
                <Ionicons name="search-outline" size={32} color="#A5B4FC" />
                <Text style={tw`text-gray-400 text-sm mt-2`}>
                  No tickets found for {selectedEvent?.Name ?? "this event"}
                </Text>
              </View>
            )}
        </View>
      )}

      <PopUpAlert
        success={failModal}
        text={text}
        header={"Error!"}
        ModalCall={() => setFailModal(false)}
        status={false}
      />

      <Modal
        visible={ticketModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTicketModal(false)}
      >
        <View style={tw`flex-1 justify-end bg-black bg-opacity-40`}>
          <View style={tw`bg-white rounded-t-3xl px-6 pt-6 pb-10`}>
            <View
              style={tw`w-12 h-1 bg-gray-200 rounded-full self-center mb-5`}
            />

            <Text
              style={tw`text-lg font-bold text-indigo-700 mb-4 text-center`}
            >
              Ticket Details
            </Text>

            {selectedTicket && (
              <View>
                {[
                  { label: "NAME", value: selectedTicket.Name },
                  { label: "EVENT", value: selectedTicket.event?.Name },
                  {
                    label: "DATE",
                    value: formatDate(selectedTicket.event?.Date),
                  },
                  { label: "VENUE", value: selectedTicket.event?.Venue },
                  { label: "TICKET TYPE", value: selectedTicket.ticket?.Name },
                  { label: "SEAT NO", value: selectedTicket.SeatNo || "—" },
                  { label: "PAYMENT", value: selectedTicket.Payment },
                  {
                    label: "TICKET ID",
                    value: selectedTicket.Ticket_Id || "—",
                  },
                  {
                    label: "CHECK IN",
                    value: selectedTicket.CheckIn_Status
                      ? "✓ Checked In"
                      : "✗ Not Checked In",
                  },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={tw`flex-row justify-between mb-3`}
                  >
                    <Text
                      style={tw`text-xs text-indigo-400 font-bold tracking-widest w-28`}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={tw`text-sm font-semibold text-gray-800 flex-1 text-right`}
                    >
                      {item.value ?? "—"}
                    </Text>
                  </View>
                ))}

                <View style={tw`h-px bg-gray-100 my-4`} />

                <TouchableOpacity
                  style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-3`}
                  onPress={() => {
                    setTicketModal(false);
                    navigation.navigate("generateQR", {
                      documentId: selectedTicket.Ticket_Id,
                      ticketType: selectedTicket.ticket?.Name,
                      eventName: selectedTicket.event?.Name,
                      eventDate: selectedTicket.event?.Date,
                      eventTime: selectedTicket.event?.Time,
                      eventVenue: selectedTicket.event?.Venue,
                      customerName: selectedTicket.Name,
                      seatNo: selectedTicket.SeatNo,
                      eventImage: selectedTicket.event?.Image?.url,
                    });
                  }}
                >
                  <Ionicons name="barcode-outline" size={18} color="#fff" />
                  <Text style={tw`text-white font-bold text-sm ml-2`}>
                    Generate Barcode
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={tw`border border-indigo-600 rounded-xl py-4 items-center`}
                  onPress={() => setTicketModal(false)}
                >
                  <Text style={tw`text-indigo-600 font-bold text-sm`}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
