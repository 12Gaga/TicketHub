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
import { useEffect, useState } from "react";
import UserAuth from "../Configs/UserAuth";
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

export default function RegenerateBarcode() {
  const navigation = useNavigation();
  const [failModal, setFailModal] = useState(false);
  const [text, setText] = useState("");

  // ── Barcode Search States ──
  const [showSearch, setShowSearch] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketModal, setTicketModal] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await globalApi.getEvents();
        setEvents(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };
    const fetchUser = async () => {
      const storedUser = await UserAuth.getUserAuth();
      if (storedUser) setUser(storedUser);
    };
    fetchUser();
    fetchEvents();
  }, []);

  const handleSearchByName = async () => {
    if (!searchName.trim()) return;
    setSearching(true);
    try {
      const resp = await globalApi.searchBookedTicketByName(searchName.trim());
      if (resp.ok) {
        setSearchResults(resp.data.data);
      }
    } catch (error) {
      setText("Failed fetching Data");
      setFailModal(true);
      console.error(error);
    } finally {
      setSearching(false);
    }
  };
  return (
    <View>
      <TouchableOpacity
        style={tw`border border-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-4`}
        onPress={() => {
          setShowSearch(!showSearch);
          setSearchName("");
          setSearchResults([]);
        }}
      >
        <Ionicons name="barcode-outline" size={18} color="#4F46E5" />
        <Text style={tw`text-indigo-600 font-bold text-sm ml-2`}>
          Generate Barcode
        </Text>
      </TouchableOpacity>

      {/* ── Search Box + Results ── */}
      {showSearch && (
        <View style={tw`mb-4`}>
          {/* Search Input */}
          <View style={tw`flex-row items-center mb-3`}>
            <TextInput
              value={searchName}
              onChangeText={setSearchName}
              placeholder="Type customer name..."
              style={tw`flex-1 border border-indigo-300 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white mr-2`}
            />
            <TouchableOpacity
              style={tw`bg-indigo-600 px-4 py-3 rounded-xl`}
              onPress={handleSearchByName}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={tw`text-white font-bold text-sm`}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Results Table */}
          {searchResults.length > 0 && (
            <View
              style={tw`bg-white rounded-xl overflow-hidden border border-gray-100`}
            >
              {/* Table Header */}
              <View style={tw`flex-row bg-indigo-600 px-3 py-2`}>
                <Text style={tw`text-white font-bold text-xs w-8`}>No</Text>
                <Text style={tw`text-white font-bold text-xs flex-1`}>
                  Name
                </Text>
                <Text style={tw`text-white font-bold text-xs flex-1`}>
                  Event
                </Text>
                <Text style={tw`text-white font-bold text-xs flex-1`}>
                  Ticket
                </Text>
              </View>

              {/* Table Rows */}
              {searchResults.map((ticket, index) => (
                <TouchableOpacity
                  key={ticket.documentId}
                  onPress={() => {
                    setSelectedTicket(ticket);
                    setTicketModal(true);
                  }}
                  style={[
                    tw`flex-row px-3 py-3 items-center`,
                    { backgroundColor: index % 2 === 0 ? "#fff" : "#F5F3FF" },
                  ]}
                >
                  <Text style={tw`text-xs text-gray-500 w-8`}>{index + 1}</Text>
                  <Text
                    style={tw`text-xs text-gray-800 font-semibold flex-1`}
                    numberOfLines={1}
                  >
                    {ticket.Name}
                  </Text>
                  <Text
                    style={tw`text-xs text-gray-600 flex-1`}
                    numberOfLines={1}
                  >
                    {ticket.event?.Name ?? "—"}
                  </Text>
                  <Text
                    style={tw`text-xs text-indigo-600 font-bold flex-1`}
                    numberOfLines={1}
                  >
                    {ticket.ticket?.Name ?? "—"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* No Results */}
          {!searching && searchName && searchResults.length === 0 && (
            <View style={tw`items-center py-6`}>
              <Ionicons name="search-outline" size={32} color="#A5B4FC" />
              <Text style={tw`text-gray-400 text-sm mt-2`}>
                No tickets found
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

      {/* ── Ticket Detail Modal ── */}
      <Modal
        visible={ticketModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTicketModal(false)}
      >
        <View style={tw`flex-1 justify-end bg-black bg-opacity-40`}>
          <View style={tw`bg-white rounded-t-3xl px-6 pt-6 pb-10`}>
            {/* Handle */}
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
                {/* Detail Rows */}
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

                {/* Generate Barcode Button */}
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

                {/* Close Button */}
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
