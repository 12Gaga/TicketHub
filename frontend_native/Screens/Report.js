import { Picker } from "@react-native-picker/picker";
import * as MediaLibrary from "expo-media-library";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import globalApi from "../Configs/globalApi";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import UserAuth from "../Configs/UserAuth";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
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

function exportToCSV(tickets) {
  const headers = [
    "No",
    "Name",
    "Email",
    "Phone",
    "Seat No",
    "Payment",
    "Agent",
    "Status",
    "Note",
    "Booked At",
  ];

  const rows = tickets.map((t, i) => [
    i + 1,
    t.Name ?? "",
    t.Email ?? "",
    t.Phone ?? "",
    t.SeatNo ?? "",
    t.Payment ?? "",
    t.Agent ?? "",
    t.CheckIn_Status ? "Checked In" : "Not Checked In",
    t.Note ?? "",
    formatDate(t.createdAt),
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}

function StatusBadge({ checked }) {
  return (
    <View
      style={[
        tw`px-2 py-1 rounded-full`,
        { backgroundColor: checked ? "#D1FAE5" : "#FEE2E2" },
      ]}
    >
      <Text
        style={[
          tw`text-xs font-bold`,
          { color: checked ? "#065F46" : "#991B1B" },
        ]}
      >
        {checked ? "✓ In" : "✗ Out"}
      </Text>
    </View>
  );
}

function SummaryCard({ total, checkedIn, notCheckedIn }) {
  return (
    <View style={tw`flex-row gap-3 mb-5`}>
      <View
        style={[
          tw`flex-1 rounded-2xl p-4 items-center`,
          { backgroundColor: "#EEF2FF" },
        ]}
      >
        <Text style={tw`text-2xl font-bold text-indigo-600`}>{total}</Text>
        <Text style={tw`text-xs text-indigo-400 font-medium mt-1`}>Total</Text>
      </View>
      <View
        style={[
          tw`flex-1 rounded-2xl p-4 items-center`,
          { backgroundColor: "#D1FAE5" },
        ]}
      >
        <Text style={tw`text-2xl font-bold text-emerald-600`}>{checkedIn}</Text>
        <Text style={tw`text-xs text-emerald-400 font-medium mt-1`}>
          Checked In
        </Text>
      </View>
      <View
        style={[
          tw`flex-1 rounded-2xl p-4 items-center`,
          { backgroundColor: "#FEE2E2" },
        ]}
      >
        <Text style={tw`text-2xl font-bold text-red-500`}>{notCheckedIn}</Text>
        <Text style={tw`text-xs text-red-300 font-medium mt-1`}>Not In</Text>
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [avariableTicketType, setAvariableTicketType] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState("");
  const [selectedTicketName, setSelectedTicketName] = useState("");
  const [data, setData] = useState({ event: null, ticket: null });
  const [failModal, setFailModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [text, setText] = useState("");

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

  const changeEvent = async (eventID) => {
    const event = events.find((e) => e.documentId === eventID);
    setSelectedEventName(event?.Name ?? "");
    setData({ event: eventID, ticket: null });
    setAvariableTicketType([]);
    setBookedTickets([]);
    try {
      const resp = await globalApi.getTicketLimit(eventID);
      if (resp.ok) {
        const tickets = resp.data.data.map((item) => item.ticket);
        setAvariableTicketType(tickets);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const resp = await globalApi.getBookedTicket(data.ticket, data.event);
      if (resp.ok) {
        setBookedTickets(resp.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (bookedTickets.length === 0) {
      setText("No Data: No tickets to export.");
      setFailModal(true);
      return;
    }
    setExporting(true);
    try {
      const csv = exportToCSV(bookedTickets);
      const fileName =
        `report_${selectedEventName}_${selectedTicketName}_${Date.now()}.csv`.replace(
          /\s+/g,
          "_",
        );

      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setText("Permission denied. Cannot save to Downloads.");
        setFailModal(true);
        return;
      }

      // Write to cache first
      const tempUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(tempUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Save to Downloads via MediaLibrary
      const asset = await MediaLibrary.createAssetAsync(tempUri);
      const album = await MediaLibrary.getAlbumAsync("Download");

      if (album == null) {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // Clean up temp file
      await FileSystem.deleteAsync(tempUri, { idempotent: true });

      setText(`✅ "${fileName}" saved to Downloads!`);
      // Add success modal state if not already there
      setSuccessModal(true);
    } catch (e) {
      setText(`Failed to export CSV: ${e.message}`);
      setFailModal(true);
    } finally {
      setExporting(false);
    }
  };

  // Sharing
  // const handleExportCSV = async () => {
  //   if (bookedTickets.length === 0) {
  //     setText("No Data : No tickets to export.");
  //     setFailModal(true);
  //     return;
  //   }
  //   setExporting(true);
  //   try {
  //     const csv = exportToCSV(bookedTickets);
  //     const fileName =
  //       `report_${selectedEventName}_${selectedTicketName}_${Date.now()}.csv`.replace(
  //         /\s+/g,
  //         "_",
  //       );
  //     const fileUri = FileSystem.documentDirectory + fileName;
  //     await FileSystem.writeAsStringAsync(fileUri, csv, {
  //       encoding: FileSystem.EncodingType.UTF8,
  //     });
  //     await Sharing.shareAsync(fileUri, {
  //       mimeType: "text/csv",
  //       dialogTitle: "Export Report CSV",
  //     });
  //   } catch (e) {
  //     setText(`Failed to export CSV: ${e.message}`);
  //     setFailModal(true);
  //   } finally {
  //     setExporting(false);
  //   }
  // };

  const checkedInCount = bookedTickets.filter((t) => t.CheckIn_Status).length;
  const notCheckedInCount = bookedTickets.filter(
    (t) => !t.CheckIn_Status,
  ).length;
  const canSearch = !!(data.event && data.ticket);
  console.log("search", canSearch);
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pb-10`}
        showsVerticalScrollIndicator={false}
      >
        {/* ── User Profile Card ── */}
        <View
          style={[
            tw`flex-row items-center bg-white rounded-2xl px-4 py-3 mb-5 border border-gray-100`,
            {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            },
          ]}
        >
          <Image
            source={require("../assets/default-avatar.jpg")}
            style={tw`w-12 h-12 rounded-full mr-3`}
          />
          <Text style={tw`flex-1 text-base font-bold text-gray-800`}>
            {user?.username ?? "—"}
          </Text>
          <TouchableOpacity
            style={tw`bg-indigo-700 px-4 py-2 rounded-xl`}
            onPress={() => {
              UserAuth.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: "login" }],
              });
            }}
          >
            <Text style={tw`text-white text-xs font-bold tracking-wide`}>
              LOG OUT
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Page Title ── */}
        <Text style={tw`text-2xl font-bold text-gray-900 mb-1`}>
          Ticket Report
        </Text>
        <Text style={tw`text-sm text-gray-400 mb-5`}>
          Search and export booked ticket data
        </Text>

        {/* ── Filter Card ── */}
        <View
          style={[
            tw`bg-white rounded-2xl p-4 mb-5 border border-gray-100`,
            { elevation: 2 },
          ]}
        >
          {/* Event Picker */}
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
            <Picker
              selectedValue={data.event}
              onValueChange={(val) => changeEvent(val)}
              style={tw`flex-1 h-13 text-sm text-gray-700`}
            >
              <Picker.Item
                label="Select an event"
                value={null}
                color="#9CA3AF"
              />
              {(events ?? []).map((event) => (
                <Picker.Item
                  key={event.documentId}
                  label={event.Name}
                  value={event.documentId}
                  color="#111827"
                />
              ))}
            </Picker>
          </View>

          {/* Ticket Type Picker */}
          <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
            Ticket Type <Text style={tw`text-red-500`}>*</Text>
          </Text>
          {!data.event ? (
            <View
              style={tw`border border-dashed border-gray-200 rounded-xl px-4 py-3 mb-4`}
            >
              <Text style={tw`text-sm text-gray-400`}>
                Select an event first
              </Text>
            </View>
          ) : (
            <View
              style={tw`border border-gray-200 rounded-xl bg-gray-50 overflow-hidden flex-row items-center px-3 mb-4`}
            >
              <Ionicons
                name="ticket-outline"
                size={16}
                color="#6366F1"
                style={tw`mr-2`}
              />
              <Picker
                selectedValue={data.ticket}
                onValueChange={(val) => {
                  const t = avariableTicketType.find(
                    (tk) => tk.documentId === val,
                  );
                  setSelectedTicketName(t?.Name ?? "");
                  setData({ ...data, ticket: val });
                }}
                style={tw`flex-1 h-13 text-sm text-gray-700`}
              >
                <Picker.Item
                  label="Select ticket type"
                  value={null}
                  color="#9CA3AF"
                />
                {(avariableTicketType ?? []).map((ticket) => (
                  <Picker.Item
                    key={ticket.documentId}
                    label={ticket.Name}
                    value={ticket.documentId}
                    color="#111827"
                  />
                ))}
              </Picker>
            </View>
          )}

          {/* Search Button */}
          <TouchableOpacity
            style={[
              tw`rounded-xl py-4 flex-row items-center justify-center`,
              { backgroundColor: canSearch ? "#4F46E5" : "#E5E7EB" },
            ]}
            onPress={handleSearch}
            disabled={!canSearch || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="search-outline"
                  size={16}
                  color={canSearch ? "#fff" : "#9CA3AF"}
                />
                <Text
                  style={[
                    tw`font-bold text-sm ml-2`,
                    { color: canSearch ? "#fff" : "#9CA3AF" },
                  ]}
                >
                  Search
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Results ── */}
        {bookedTickets.length > 0 && (
          <>
            {/* Summary */}
            <SummaryCard
              total={bookedTickets.length}
              checkedIn={checkedInCount}
              notCheckedIn={notCheckedInCount}
            />

            {/* Table Header Label */}
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-base font-bold text-gray-900`}>
                Results{" "}
                <Text style={tw`text-indigo-500`}>
                  ({bookedTickets.length})
                </Text>
              </Text>
              <Text style={tw`text-xs text-gray-400`}>
                {selectedEventName} · {selectedTicketName}
              </Text>
            </View>

            {/* Table */}
            <View
              style={[
                tw`bg-white rounded-2xl overflow-hidden border border-gray-100 mb-5`,
                { elevation: 2 },
              ]}
            >
              {/* Table Head */}
              <View
                style={[tw`flex-row px-4 py-3`, { backgroundColor: "#4F46E5" }]}
              >
                <Text style={tw`text-white text-xs font-bold w-6`}>#</Text>
                <Text style={tw`text-white text-xs font-bold flex-1`}>
                  Name
                </Text>
                <Text style={tw`text-white text-xs font-bold w-16 text-center`}>
                  Seat
                </Text>
                <Text style={tw`text-white text-xs font-bold w-20 text-center`}>
                  Payment
                </Text>
                <Text style={tw`text-white text-xs font-bold w-20 text-center`}>
                  Status
                </Text>
              </View>

              {/* Rows */}
              {bookedTickets.map((ticket, index) => (
                <View key={ticket.documentId}>
                  {/* Main Row */}
                  <View
                    style={[
                      tw`flex-row items-center px-4 py-3`,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                      },
                    ]}
                  >
                    <Text style={tw`text-xs text-gray-400 w-6`}>
                      {index + 1}
                    </Text>
                    <View style={tw`flex-1`}>
                      <Text
                        style={tw`text-sm font-semibold text-gray-800`}
                        numberOfLines={1}
                      >
                        {ticket.Name ?? "—"}
                      </Text>
                      <Text style={tw`text-xs text-gray-400`} numberOfLines={1}>
                        {ticket.Phone ?? "—"}
                      </Text>
                    </View>
                    <Text style={tw`text-xs text-gray-600 w-16 text-center`}>
                      {ticket.SeatNo ?? "—"}
                    </Text>
                    <Text
                      style={tw`text-xs text-gray-600 w-20 text-center`}
                      numberOfLines={1}
                    >
                      {ticket.Payment ?? "—"}
                    </Text>
                    <View style={tw`w-20 items-center`}>
                      <StatusBadge checked={ticket.CheckIn_Status} />
                    </View>
                  </View>

                  {/* Detail Sub-Row */}
                  <View
                    style={[
                      tw`px-4 pb-3 flex-row flex-wrap gap-3`,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6",
                      },
                    ]}
                  >
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="mail-outline" size={11} color="#9CA3AF" />
                      <Text style={tw`text-xs text-gray-400 ml-1`}>
                        {ticket.Email ?? "—"}
                      </Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons
                        name="person-outline"
                        size={11}
                        color="#9CA3AF"
                      />
                      <Text style={tw`text-xs text-gray-400 ml-1`}>
                        Agent: {ticket.Agent ?? "—"}
                      </Text>
                    </View>
                    {ticket.Note ? (
                      <View style={tw`flex-row items-center`}>
                        <Ionicons
                          name="document-text-outline"
                          size={11}
                          color="#9CA3AF"
                        />
                        <Text style={tw`text-xs text-gray-400 ml-1`}>
                          {ticket.Note}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Export CSV Button */}
            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={exporting}
              style={[
                tw`flex-row items-center justify-center rounded-2xl py-4 mb-6`,
                {
                  backgroundColor: exporting ? "#D1FAE5" : "#059669",
                  shadowColor: "#059669",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={tw`text-white font-bold text-sm ml-2`}>
                    Export CSV
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Empty State */}
        {!loading && bookedTickets.length === 0 && canSearch && (
          <View style={tw`items-center py-16`}>
            <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
            <Text style={tw`text-gray-400 font-semibold mt-3`}>
              No tickets found
            </Text>
            <Text style={tw`text-gray-300 text-xs mt-1`}>
              Try selecting a different event or ticket type
            </Text>
          </View>
        )}
        <PopUpAlert
          success={failModal}
          text={text}
          header={"Error!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
        <PopUpAlert
          success={successModal}
          text={text}
          header={"Success"}
          ModalCall={() => setSuccessModal(false)}
          status={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
