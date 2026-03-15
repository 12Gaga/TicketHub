import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import globalApi from "../Configs/globalApi";
import QRScanner from "../Components/QRScanner";
import ManualSearch from "../Components/ManualSearch";
import ScanTicketDetails from "../Components/ScanTicketDetails";
import { ScanContext } from "../Configs/AuthContext";
import CheckInAudience from "../Components/CheckInAudience";
import UserAuth from "../Configs/UserAuth";
import BluetoothScanner from "../Components/BuletoothScanner";
import PopUpAlert from "../Components/PopUpAlert";

export default function CheckInScreen() {
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner" | "manual"
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [text, setText] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (result) {
      fadeAnim.setValue(0);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result]);

  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await UserAuth.getUserAuth();
      if (storedUser) setUser(storedUser);
    };
    fetchUser();
  }, []);

  // ── Fetch ticket by documentId ──
  const fetchTicket = async (documentId) => {
    const id = documentId?.trim();
    console.log("documentid", documentId);
    if (!id) return;
    setLoading(true);
    setResult(null);
    const idLength = id.length;
    console.log("length", idLength);
    try {
      let resp;
      if (idLength === 24) {
        resp = await globalApi.getTicketByDocumentId(id);
      } else {
        resp = await globalApi.getTicketByTicketUniqueId(id);
      }

      if (resp.ok && resp.data?.data) {
        const ticketData = resp.data.data;

        // ✅ handle empty array, null, or undefined
        const isEmpty =
          ticketData === null ||
          ticketData === undefined ||
          (Array.isArray(ticketData) && (ticketData ?? []).length === 0);

        if (isEmpty) {
          setResult({ success: false, message: "Ticket not found." });
        } else {
          setResult({ success: true, ticket: ticketData });
        }
      } else if (resp.status === 404) {
        // ✅ Strapi returns 404 for invalid documentId
        setResult({ success: false, message: "Ticket not found." });
      } else if (!resp.ok) {
        setResult({ success: false, message: "Ticket not found." });
      } else {
        setResult({ success: false, message: "Ticket not found." });
      }
    } catch (err) {
      setResult({ success: false, message: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  // ── QR scan handler ──
  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setCameraOpen(false);
    fetchTicket(data); // data IS the plain documentId
  };

  // ── Open camera ──
  const handleSimulateScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setScanned(false);
    setResult(null);
    setCameraOpen(true);
  };

  // ── Manual search ──
  const handleManualSearch = () => {
    if (!manualInput.trim()) return;
    fetchTicket(manualInput.trim());
  };

  // ── Reset ──
  const handleReset = () => {
    setScanned(false);
    setResult(null);
    setManualInput("");
    setCameraOpen(false);
  };

  // ── Switch tab ──
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    handleReset();
  };

  // ── Mark as checked in ──
  const handleCheckIn = async () => {
    if (!result?.ticket[0]?.documentId) return;
    try {
      const ticket = result.ticket[0];
      // 1. Update CheckIn_Status
      const resp = await globalApi.changeTicketStatus(
        result.ticket[0].documentId,
        user.documentId,
      );
      if (resp.ok) {
        // 2. Create CheckIn record
        const checkInPayload = {
          data: {
            Name: ticket.Name,
            DateTime: new Date().toISOString(),
            event: ticket.event?.documentId,
          },
        };
        await globalApi.createCheckIn(checkInPayload.data);
        // 3. Update local state
        const updatedTickets = result.ticket.map((t, i) =>
          i === 0 ? { ...t, CheckIn_Status: true } : t,
        );
        setResult({ ...result, ticket: updatedTickets });
        setText(
          `✅ Checked In : ${result.ticket[0].Name} has been checked in successfully.`,
        );
        setSuccessModal(true);
      } else {
        setText("Failed to check in ticket.");
        setFailModal(true);
      }
    } catch {
      setText("Something went worng");
      setFailModal(true);
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScanContext.Provider
        value={{
          loading,
          activeTab,
          result,
          fadeAnim,
          handleReset,
          handleCheckIn,
          slideAnim,
          handleSimulateScan,
          manualInput,
          setManualInput,
          handleManualSearch,
          fetchTicket,
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        {/* ── Camera Modal ── */}
        <Modal
          visible={cameraOpen}
          animationType="slide"
          onRequestClose={() => setCameraOpen(false)}
        >
          <View style={tw`flex-1 bg-black`}>
            <CameraView
              style={tw`flex-1`}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            >
              {/* Overlay */}
              <View style={tw`flex-1 items-center justify-center`}>
                {/* Dark overlay top */}
                <View
                  style={tw`absolute top-0 left-0 right-0 h-32 bg-black opacity-50`}
                />
                {/* Dark overlay bottom */}
                <View
                  style={tw`absolute bottom-0 left-0 right-0 h-40 bg-black opacity-50`}
                />

                {/* Scanner frame */}
                <View style={tw`w-64 h-64 relative`}>
                  <View
                    style={[
                      tw`absolute top-0 left-0 w-8 h-8 border-indigo-400`,
                      {
                        borderTopWidth: 3,
                        borderLeftWidth: 3,
                        borderTopLeftRadius: 6,
                      },
                    ]}
                  />
                  <View
                    style={[
                      tw`absolute top-0 right-0 w-8 h-8 border-indigo-400`,
                      {
                        borderTopWidth: 3,
                        borderRightWidth: 3,
                        borderTopRightRadius: 6,
                      },
                    ]}
                  />
                  <View
                    style={[
                      tw`absolute bottom-0 left-0 w-8 h-8 border-indigo-400`,
                      {
                        borderBottomWidth: 3,
                        borderLeftWidth: 3,
                        borderBottomLeftRadius: 6,
                      },
                    ]}
                  />
                  <View
                    style={[
                      tw`absolute bottom-0 right-0 w-8 h-8 border-indigo-400`,
                      {
                        borderBottomWidth: 3,
                        borderRightWidth: 3,
                        borderBottomRightRadius: 6,
                      },
                    ]}
                  />
                </View>

                <Text style={tw`text-white text-sm mt-6 font-medium`}>
                  Point camera at QR code
                </Text>
              </View>

              {/* Close button */}
              <TouchableOpacity
                onPress={() => setCameraOpen(false)}
                style={tw`absolute top-12 left-5 w-10 h-10 bg-black bg-opacity-50 rounded-full items-center justify-center`}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </CameraView>
          </View>
        </Modal>

        <ScrollView
          contentContainerStyle={tw`pt-12 pb-10 px-5`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <Text style={tw`text-3xl font-bold text-indigo-600 mb-1`}>
            Check-In System
          </Text>
          <Text style={tw`text-gray-500 text-sm mb-6`}>
            Scan QR codes or search manually to check in attendees
          </Text>

          {/* ── Tab Selector ── */}
          <View
            style={tw`bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100`}
          >
            <Text style={tw`text-base font-bold text-gray-800 mb-1`}>
              Check-In Options
            </Text>
            <Text style={tw`text-gray-400 text-xs mb-4`}>
              Choose your preferred check-in method
            </Text>

            <View style={tw`flex-row gap-3`}>
              {/* QR Scanner tab */}
              <TouchableOpacity
                onPress={() => handleTabSwitch("scanner")}
                style={tw`flex-1 rounded-xl overflow-hidden`}
              >
                {activeTab === "scanner" ? (
                  <LinearGradient
                    colors={["#4F46E5", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`py-5 items-center justify-center`}
                  >
                    <Ionicons name="qr-code-outline" size={24} color="#fff" />
                    <Text style={tw`text-white text-xs font-bold mt-2`}>
                      Bluetooth Scanner
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={tw`py-5 items-center justify-center border border-gray-200 rounded-xl`}
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={24}
                      color="#9CA3AF"
                    />
                    <Text style={tw`text-gray-400 text-xs font-semibold mt-2`}>
                      Bluetooth Scanner
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Manual Search tab */}
              <TouchableOpacity
                onPress={() => handleTabSwitch("manual")}
                style={tw`flex-1 rounded-xl overflow-hidden`}
              >
                {activeTab === "manual" ? (
                  <LinearGradient
                    colors={["#4F46E5", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`py-5 items-center justify-center`}
                  >
                    <Ionicons name="search-outline" size={24} color="#fff" />
                    <Text style={tw`text-white text-xs font-bold mt-2`}>
                      Manual Search
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={tw`py-5 items-center justify-center border border-gray-200 rounded-xl`}
                  >
                    <Ionicons name="search-outline" size={24} color="#9CA3AF" />
                    <Text style={tw`text-gray-400 text-xs font-semibold mt-2`}>
                      Manual Search
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── QR Scanner Tab Content ── */}
          {/* <QRScanner /> */}
          <BluetoothScanner />

          {/* ── Manual Search Tab Content ── */}
          <ManualSearch />

          {/* Ticket Details */}
          <ScanTicketDetails />
          {/* Check In Audience */}
          <CheckInAudience />
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
      </ScanContext.Provider>
    </View>
  );
}
