import { useState, useEffect, useCallback } from "react";
import { Picker } from "@react-native-picker/picker";
import globalApi from "../Configs/globalApi";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
  Platform,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { SaleTicket } from "../Configs/AuthContext";
import SingleEntry from "../Components/SingleEntry";
import BulkUploadWithSection from "../Components/BulkUploadWithSection";
import UserAuth from "../Configs/UserAuth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import PopUpAlert from "../Components/PopUpAlert";
import { useRef } from "react";

const DUPLICATE_NAME_DEBOUNCE_DELAY = 600;

const normalizeCustomerName = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export default function OfflineTicketGeneration() {
  const scrollRef = useRef(null);
  const duplicateNameDebounceRef = useRef(null);
  const navigation = useNavigation();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [failedText, setFailedText] = useState("");
  const [activeTab, setActiveTab] = useState("single");
  const [user, setUser] = useState(null);
  const [data, setData] = useState({
    event: null,
    Name: "",
    Email: null,
    Phone: "",
    ticket: null,
    Ticket_Status: true,
    Payment: "Cash",
    agent: null,
    SeatNo: "",
    Note: "",
    Ticket_Id: null,
  });
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [buyState, setBuyState] = useState(1);
  const [ticketLimit, setTicketLimit] = useState([]);
  const [avariableTicketType, setAvariableTicketType] = useState([]);
  const [soldOut, setSoldOut] = useState(false);
  const [bookedTickets, setBookedTickets] = useState([]);
  const [duplicateNameMatches, setDuplicateNameMatches] = useState([]);
  const [duplicateNameLoading, setDuplicateNameLoading] = useState(false);
  const [duplicateNameQuery, setDuplicateNameQuery] = useState("");

  const clearDuplicateNameState = useCallback(() => {
    if (duplicateNameDebounceRef.current) {
      clearTimeout(duplicateNameDebounceRef.current);
      duplicateNameDebounceRef.current = null;
    }

    setDuplicateNameMatches([]);
    setDuplicateNameLoading(false);
    setDuplicateNameQuery("");
  }, []);

  const runDuplicateNameLookup = useCallback(
    (rawName) => {
      const normalizedQuery = normalizeCustomerName(rawName);

      if (!normalizedQuery) {
        setDuplicateNameMatches([]);
        return;
      }

      const nextMatches = (bookedTickets ?? []).filter(
        (ticket) => normalizeCustomerName(ticket?.Name) === normalizedQuery,
      );

      setDuplicateNameMatches(nextMatches);
    },
    [bookedTickets],
  );

  const handleSingleEntryNameChange = useCallback(
    (name) => {
      setData((current) => ({ ...current, Name: name }));

      if (duplicateNameDebounceRef.current) {
        clearTimeout(duplicateNameDebounceRef.current);
        duplicateNameDebounceRef.current = null;
      }

      const trimmedName = name?.trim?.() ?? "";

      if (!data.event || !trimmedName) {
        setDuplicateNameQuery("");
        setDuplicateNameMatches([]);
        setDuplicateNameLoading(false);
        return;
      }

      setDuplicateNameQuery("");
      setDuplicateNameMatches([]);
      setDuplicateNameLoading(true);
      duplicateNameDebounceRef.current = setTimeout(() => {
        setDuplicateNameQuery(trimmedName);
        runDuplicateNameLookup(name);
        setDuplicateNameLoading(false);
        duplicateNameDebounceRef.current = null;
      }, DUPLICATE_NAME_DEBOUNCE_DELAY);
    },
    [data.event, runDuplicateNameLookup],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchEvents = async () => {
        try {
          const result = await globalApi.getEvents();
          if (!isActive || !result.ok) return;

          console.log("Events:", result.data?.data);
          setEvents(result.data?.data ?? []);
        } catch (error) {
          if (!isActive) return;
          console.log("Error:", error);
        }
      };

      const fetchAgents = async () => {
        try {
          const agentResp = await globalApi.getAgents();
          if (!isActive || !agentResp.ok) return;

          console.log("Agents:", agentResp.data?.data);
          setAgents(agentResp.data?.data ?? []);
        } catch (error) {
          if (!isActive) return;
          console.log("Error:", error);
        }
      };

      const fetchUser = async () => {
        try {
          const currentUser = await UserAuth.getUserAuth();
          if (!isActive) return;

          console.log("User:", currentUser);
          setUser(currentUser?.documentId ?? null);
        } catch (error) {
          if (!isActive) return;
          console.error("Error", error);
        }
      };

      fetchUser();
      fetchEvents();
      fetchAgents();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const changeEvent = async (eventID) => {
    setData((current) => ({
      ...current,
      event: eventID,
      ticket: null,
    }));
    clearDuplicateNameState();
    setTicketLimit([]);
    setAvariableTicketType([]);
    setBookedTickets([]);
    setSoldOut(false);

    if (!eventID) {
      return;
    }

    await refreshEventInventory(eventID, null);
  };

  const changeTicket = async (ticketID) => {
    setData((current) => ({ ...current, ticket: ticketID }));

    if (!data.event || !ticketID) {
      setSoldOut(false);
      return;
    }

    await refreshEventInventory(data.event, ticketID);
  };

  const generateCode = () => {
    const cryptoObject = globalThis.crypto;

    if (cryptoObject?.getRandomValues) {
      const array = new Uint8Array(11);
      cryptoObject.getRandomValues(array);

      return Array.from(array, (num) => num % 10).join("");
    }

    const timestamp = Date.now().toString();
    const randomPart = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");

    return (timestamp + randomPart).slice(-11);
  };

  const normalizeTicketList = (resp) => {
    const ticketData = resp?.data?.data;

    if (Array.isArray(ticketData)) {
      return ticketData;
    }

    if (ticketData) {
      return [ticketData];
    }

    return [];
  };

  const hasLookupError = (resp) => !resp.ok && resp.status !== 404;

  const deriveSoldOutState = (
    ticketID,
    nextTicketLimit = ticketLimit,
    nextBookedTickets = bookedTickets,
  ) => {
    if (!ticketID) {
      return false;
    }

    const ticketLimitEntry = (nextTicketLimit ?? []).find(
      (item) => item.ticket?.documentId == ticketID,
    );
    const limit = ticketLimitEntry?.Limit;

    if (!ticketLimitEntry?.isLimited || !limit) {
      return false;
    }

    const currentBookedCount = (nextBookedTickets ?? []).filter(
      (ticket) => ticket.ticket?.documentId == ticketID,
    ).length;

    return currentBookedCount >= limit;
  };

  const refreshEventInventory = async (
    eventID,
    selectedTicketId = data.ticket,
  ) => {
    if (!eventID) {
      setTicketLimit([]);
      setAvariableTicketType([]);
      setBookedTickets([]);
      setSoldOut(false);
      return { ticketLimit: [], bookedTickets: [] };
    }

    let nextTicketLimit = [];
    let nextBookedTickets = [];

    try {
      const [ticketLimitResp, bookedResp] = await Promise.all([
        globalApi.getTicketLimit(eventID),
        globalApi.getBookedTicketByEvent(eventID),
      ]);

      if (ticketLimitResp.ok) {
        nextTicketLimit = ticketLimitResp.data?.data ?? [];
        setTicketLimit(nextTicketLimit);
        setAvariableTicketType(nextTicketLimit.map((item) => item.ticket));
      } else {
        console.log("error", ticketLimitResp.problem);
        setTicketLimit([]);
        setAvariableTicketType([]);
      }

      if (bookedResp.ok) {
        nextBookedTickets = bookedResp.data?.data ?? [];
        setBookedTickets(nextBookedTickets);
      } else {
        console.log("error", bookedResp.problem);
        setBookedTickets([]);
      }

      setSoldOut(
        deriveSoldOutState(selectedTicketId, nextTicketLimit, nextBookedTickets),
      );

      return {
        ticketLimit: nextTicketLimit,
        bookedTickets: nextBookedTickets,
      };
    } catch (error) {
      console.error(error);
      return {
        ticketLimit: nextTicketLimit,
        bookedTickets: nextBookedTickets,
      };
    }
  };

  const ensureTicketIdIsAvailable = async (ticketId) => {
    const [uniqueResp, documentResp] = await Promise.all([
      globalApi.getTicketByTicketUniqueId(ticketId),
      globalApi.getTicketByDocumentId(ticketId),
    ]);

    const uniqueTickets = normalizeTicketList(uniqueResp);
    const documentTickets = normalizeTicketList(documentResp);

    if (uniqueTickets.length > 0 || documentTickets.length > 0) {
      return false;
    }

    if (hasLookupError(uniqueResp) || hasLookupError(documentResp)) {
      throw new Error("Could not validate Ticket Id right now.");
    }

    return true;
  };

  const handleBooking = async () => {
    if (
      !data.event ||
      !data.ticket ||
      !data.Name ||
      !data.agent ||
      !user ||
      (data.Ticket_Status && !data.Ticket_Id)
    ) {
      setFailedText("Please fill required fields");
      setFailModal(true);
      return;
    }
    let idOfTicket = data.Ticket_Id?.trim();
    const currentEventId = data.event;
    const currentTicketId = data.ticket;

    if (data.Ticket_Status) {
      if (!idOfTicket) {
        setFailedText("Ticket Id is required for offline booking.");
        setFailModal(true);
        return;
      }

      try {
        const isAvailable = await ensureTicketIdIsAvailable(idOfTicket);
        if (!isAvailable) {
          setFailedText(
            "Ticket Id already exists or conflicts with an existing ticket.",
          );
          setFailModal(true);
          return;
        }
      } catch (validationError) {
        setFailedText(
          validationError?.message || "Could not validate Ticket Id.",
        );
        setFailModal(true);
        return;
      }
    }

    if (!data.Ticket_Status) {
      idOfTicket = generateCode();
    }
    const payload = {
      data: {
        event: data.event,
        Name: data.Name,
        Email: data.Email,
        Phone: data.Phone,
        ticket: data.ticket,
        Ticket_Status: !!data.Ticket_Status,
        Payment: data.Payment,
        agent: data.agent,
        SeatNo: data.SeatNo,
        Note: data.Note,
        Ticket_Id: idOfTicket,
        Seller_Id: user,
      },
    };
    setLoading(true);
    try {
      const resp = await globalApi.setBookedTicket(payload.data);
      if (resp.ok) {
        console.log("ticketResp", resp.data.data);
        await refreshEventInventory(currentEventId, currentTicketId);
        clearDuplicateNameState();
        if (data.Ticket_Status) {
          console.log("offline");
          setData({
            event: currentEventId,
            Name: "",
            Email: null,
            Phone: "",
            ticket: currentTicketId,
            Ticket_Status: true,
            Payment: "Cash",
            agent: data.agent,
            SeatNo: "",
            Note: data.Note,
            Ticket_Id: null,
          });
          setBuyState(1);
          setSuccessModal(true);
        } else {
          console.log("online");
          console.log("data", resp.data.data);
          const event = events.find((e) => e.documentId == data.event);
          const ticket_Type = avariableTicketType.find(
            (t) => t.documentId == data.ticket,
          );
          const customerName = data.Name;
          const seatNo = data.SeatNo;
          setData({
            event: currentEventId,
            Name: "",
            Email: null,
            Phone: "",
            ticket: currentTicketId,
            Ticket_Status: true,
            Payment: "Cash",
            agent: data.agent,
            SeatNo: "",
            Note: data.Note,
            Ticket_Id: null,
          });
          setBuyState(1);
          navigation.navigate("generateQR", {
            documentId: idOfTicket,
            ticketType: ticket_Type.Name,
            eventName: event.Name,
            eventDate: event.Date,
            eventVenue: event.Venue,
            eventTime: event.Time,
            customerName: customerName,
            seatNo: seatNo,
            eventImage: event.Image?.url,
          });
        }
      }
    } catch (err) {
      setFailedText("Failed to create ticket booking");
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (activeTab === "single") {
      return;
    }

    clearDuplicateNameState();
  }, [activeTab, clearDuplicateNameState]);

  useEffect(() => {
    return () => {
      if (duplicateNameDebounceRef.current) {
        clearTimeout(duplicateNameDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      activeTab !== "single" ||
      !data.event ||
      !duplicateNameQuery.trim() ||
      duplicateNameLoading
    ) {
      return;
    }

    runDuplicateNameLookup(duplicateNameQuery);
  }, [
    activeTab,
    bookedTickets,
    data.event,
    duplicateNameLoading,
    duplicateNameQuery,
    runDuplicateNameLookup,
  ]);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "android" ? -500 : 0}
      style={tw`flex-1`}
    >
      <ScrollView
        ref={scrollRef}
        style={tw`flex-1 bg-white px-5 pt-10`}
        contentContainerStyle={{
          paddingBottom: keyboardHeight > 0 ? keyboardHeight : 5,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <SaleTicket.Provider
          value={{
            activeTab,
            changeTicket,
            handleBooking,
            soldOut,
            avariableTicketType,
            setBuyState,
            setData,
            data,
            buyState,
            loading,
            user,
            bookedTickets,
            duplicateNameMatches,
            duplicateNameLoading,
            duplicateNameQuery,
            handleSingleEntryNameChange,
            ticketLimit,
            events,
            agents,
            refreshEventInventory,
          }}
        >
          {/* Header */}
          <Text style={tw`text-3xl font-bold text-indigo-600 leading-tight`}>
            Ticket Generate
          </Text>
          <Text style={tw`text-gray-500 text-sm mt-2 mb-6`}>
            Create tickets for offline sales manually or in bulk
          </Text>

          {/* Select Event*/}
          <View
            style={tw`bg-white rounded-2xl p-4 mb-5 border border-gray-200`}
          >
            <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
              Select Event <Text style={tw`text-red-500`}>*</Text>
            </Text>
            <Text style={tw`text-gray-400 text-xs mb-4`}>
              Choose which event to generate tickets for
            </Text>

            <View
              style={tw`border border-gray-200 rounded-xl bg-white overflow-hidden flex-row items-center px-3`}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#6366F1"
                style={tw`mr-2`}
              />
              <Picker
                selectedValue={data.event}
                onValueChange={(eventValue) => changeEvent(eventValue)}
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
          </View>

          {/* Single / Bulk Toggle */}
          <View
            style={tw`flex-row mb-6 border border-gray-200 rounded-xl overflow-hidden`}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("single")}
              style={tw`flex-1 py-3 flex-row items-center justify-center ${
                activeTab === "single" ? "bg-indigo-600" : "bg-white"
              }`}
            >
              <Ionicons
                name="add"
                size={16}
                color={activeTab === "single" ? "white" : "#6B7280"}
              />
              <Text
                style={tw`ml-1 text-sm font-semibold ${
                  activeTab === "single" ? "text-white" : "text-gray-500"
                }`}
              >
                Single Entry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("bulk")}
              style={tw`flex-1 py-3 flex-row items-center justify-center ${
                activeTab === "bulk" ? "bg-indigo-600" : "bg-white"
              }`}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={activeTab === "bulk" ? "white" : "#6B7280"}
              />
              <Text
                style={tw`ml-1 text-sm font-semibold ${
                  activeTab === "bulk" ? "text-white" : "text-gray-500"
                }`}
              >
                Import Tickets
              </Text>
            </TouchableOpacity>
          </View>

          <SingleEntry />
          {/* <BulkUpload /> */}
          <BulkUploadWithSection />
          <PopUpAlert
            success={successModal}
            text={"Ticket has been booked successfully."}
            header={"Booking Complete!"}
            ModalCall={() => setSuccessModal(false)}
            status={true}
          />
          <PopUpAlert
            success={failModal}
            text={failedText}
            header={"Failed!"}
            ModalCall={() => setFailModal(false)}
            status={false}
          />
        </SaleTicket.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
