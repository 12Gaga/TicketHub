import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import globalApi from "../Configs/globalApi";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import UserAuth from "../Configs/UserAuth";
import * as FileSystem from "expo-file-system/legacy";
import PopUpAlert from "../Components/PopUpAlert";
import * as Sharing from "expo-sharing";
import CreateAgent from "../Components/CreateAgent";
import { ExportContext } from "../Configs/AuthContext";
import ExportEventsTicket from "../Components/ExportEventsTicket";
import RegenerateBarcode from "../Components/RegenerateBarcode";

const EMPTY_SORT_CONFIG = Object.freeze({ key: null, direction: null });

function sanitizeFileName(value) {
  return (value ?? "")
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

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

function getAgentName(ticket) {
  return ticket?.Agent ?? ticket?.agent?.Name ?? "";
}

function normalizeSortText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getBookedAtTimestamp(value) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string" || !value.trim()) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getSortValue(ticket, sortKey) {
  if (!ticket || typeof ticket !== "object") {
    return sortKey === "bookedAt" ? 0 : "";
  }

  switch (sortKey) {
    case "name":
      return normalizeSortText(ticket?.Name);
    case "agent":
      return normalizeSortText(getAgentName(ticket));
    case "bookedAt":
      return getBookedAtTimestamp(ticket?.createdAt);
    default:
      return "";
  }
}

function sortBookedTickets(tickets, sortConfig) {
  if (!Array.isArray(tickets) || !sortConfig.key || !sortConfig.direction) {
    return tickets;
  }

  const sortMultiplier = sortConfig.direction === "asc" ? 1 : -1;

  try {
    return tickets
      .map((ticket, index) => ({ ticket, index }))
      .sort((left, right) => {
        const leftValue = getSortValue(left.ticket, sortConfig.key);
        const rightValue = getSortValue(right.ticket, sortConfig.key);

        if (leftValue < rightValue) {
          return -1 * sortMultiplier;
        }

        if (leftValue > rightValue) {
          return 1 * sortMultiplier;
        }

        return left.index - right.index;
      })
      .map(({ ticket }) => ticket);
  } catch (error) {
    console.error("Failed to sort booked tickets:", error);
    return tickets;
  }
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
    getAgentName(t),
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
      {/* <View
        style={[
          tw`flex-1 rounded-2xl p-4 items-center`,
          { backgroundColor: "#FEE2E2" },
        ]}
      >
        <Text style={tw`text-2xl font-bold text-red-500`}>{notCheckedIn}</Text>
        <Text style={tw`text-xs text-red-300 font-medium mt-1`}>Not In</Text>
      </View> */}
    </View>
  );
}

export default function ReportScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [avariableTicketType, setAvariableTicketType] = useState([]);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [sortConfig, setSortConfig] = useState(EMPTY_SORT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState("");
  const [selectedTicketName, setSelectedTicketName] = useState("");
  const [data, setData] = useState({ event: null, ticket: null });
  const [failModal, setFailModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [text, setText] = useState("");
  const [createAgent, setCreateAgent] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

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

  const sortedBookedTickets = useMemo(
    () => sortBookedTickets(bookedTickets ?? [], sortConfig),
    [bookedTickets, sortConfig],
  );

  const toggleSort = (columnKey) => {
    setSortConfig((current) => {
      if (current.key !== columnKey) {
        return { key: columnKey, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key: columnKey, direction: "desc" };
      }

      if (current.direction === "desc") {
        return EMPTY_SORT_CONFIG;
      }

      return { key: columnKey, direction: "asc" };
    });
  };

  const handleExportAllCSV = async () => {
    setExportingAll(true);
    try {
      const resp = await globalApi.getAllBookedTickets();
      console.log("Total tickets:", resp.data.data.length);
      console.log("Meta:", JSON.stringify(resp.data.meta));
      if (!resp.ok) throw new Error("Failed to fetch tickets");

      const allTickets = resp.data.data;
      if ((allTickets ?? []).length === 0) {
        setText("No Data: No tickets to export.");
        setFailModal(true);
        return;
      }

      const csv = exportToCSV(allTickets);
      const fileName = `report_all_tickets_${Date.now()}.csv`;

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
            FileSystem.StorageAccessFramework.getUriForDirectoryInRoot(
              "Download",
            ),
          );

        if (!permissions.granted)
          throw new Error("Storage permission was not granted.");

        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "text/csv",
        );

        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          fileUri,
          csv,
          {
            encoding: FileSystem.EncodingType.UTF8,
          },
        );

        setText(`"${fileName}" saved successfully.`);
      } else {
        const tempUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(tempUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        await Sharing.shareAsync(tempUri, {
          mimeType: "text/csv",
          dialogTitle: "Save CSV File",
          UTI: "public.comma-separated-values-text",
        });

        await FileSystem.deleteAsync(tempUri, { idempotent: true });
        setText(`"${fileName}" is ready to share.`);
      }

      setSuccessModal(true);
    } catch (e) {
      setText(`Failed to export CSV: ${e.message}`);
      setFailModal(true);
    } finally {
      setExportingAll(false);
    }
  };

  const changeEvent = async (eventID) => {
    const event = events.find((e) => e.documentId === eventID);
    setSelectedEventName(event?.Name ?? "");
    setData({ event: eventID, ticket: null });
    setAvariableTicketType([]);
    setBookedTickets([]);
    setSortConfig(EMPTY_SORT_CONFIG);
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
      let resp;
      if (data.ticket === "123") {
        // All tickets for selected event
        resp = await globalApi.getBookedTicketByEvent(data.event);
      } else {
        resp = await globalApi.getBookedTicket(data.ticket, data.event);
      }
      if (resp.ok) {
        setSortConfig(EMPTY_SORT_CONFIG);
        setBookedTickets(resp.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if ((bookedTickets ?? []).length === 0) {
      setText("No Data: No tickets to export.");
      setFailModal(true);
      return;
    }
    setExporting(true);
    try {
      const csv = exportToCSV(sortedBookedTickets);
      const eventPart = sanitizeFileName(selectedEventName) || "event";
      // if All selected, label as "all_tickets"
      const ticketPart =
        data.ticket === "123"
          ? "all_tickets"
          : sanitizeFileName(selectedTicketName) || "ticket";
      const fileBaseName = `report_${eventPart}_${ticketPart}_${Date.now()}`;
      const fileName = `${fileBaseName}.csv`;

      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
            FileSystem.StorageAccessFramework.getUriForDirectoryInRoot(
              "Download",
            ),
          );

        if (!permissions.granted) {
          throw new Error("Storage permission was not granted.");
        }

        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "text/csv",
        );

        await FileSystem.StorageAccessFramework.writeAsStringAsync(
          fileUri,
          csv,
          {
            encoding: FileSystem.EncodingType.UTF8,
          },
        );

        setText(`"${fileName}" saved successfully.`);
      } else {
        if (!FileSystem.cacheDirectory) {
          throw new Error("Cache directory is not available on this device.");
        }

        const tempUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(tempUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error("Sharing is not available on this device.");
        }

        await Sharing.shareAsync(tempUri, {
          mimeType: "text/csv",
          dialogTitle: "Save CSV File",
          UTI: "public.comma-separated-values-text",
        });

        await FileSystem.deleteAsync(tempUri, { idempotent: true });
        setText(`"${fileName}" is ready to share.`);
      }

      setSuccessModal(true);
    } catch (e) {
      setText(`Failed to export CSV: ${e.message}`);
      setFailModal(true);
    } finally {
      setExporting(false);
    }
  };

  const checkedInCount = (bookedTickets ?? []).filter(
    (t) => t.CheckIn_Status,
  ).length;
  const notCheckedInCount = (bookedTickets ?? []).filter(
    (t) => !t.CheckIn_Status,
  ).length;
  const canSearch = !!(data.event && data.ticket);
  console.log("search", canSearch);
  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ExportContext.Provider
        value={{
          data,
          changeEvent,
          events,
          avariableTicketType,
          setSelectedTicketName,
          setData,
          handleSearch,
          SummaryCard,
          canSearch,
          loading,
          bookedTickets,
          sortedBookedTickets,
          sortConfig,
          toggleSort,
          checkedInCount,
          notCheckedInCount,
          selectedEventName,
          selectedTicketName,
          handleExportCSV,
          exporting,
          StatusBadge,
        }}
      >
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
              onPress={async () => {
                await UserAuth.logout();
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
          <TouchableOpacity
            style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-4`}
            onPress={() => setCreateAgent(true)}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={tw`text-white font-bold text-sm ml-2`}>
              Create Agent
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-4`}
            onPress={handleExportAllCSV}
            disabled={exportingAll}
          >
            {exportingAll ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={tw`text-white font-bold text-sm ml-2`}>
                  Export CSV for all tickets
                </Text>
              </>
            )}
          </TouchableOpacity> */}

          <RegenerateBarcode />

          <ExportEventsTicket />

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

          <CreateAgent
            createAgent={createAgent}
            setCreateAgent={setCreateAgent}
          />
        </ScrollView>
      </ExportContext.Provider>
    </SafeAreaView>
  );
}
