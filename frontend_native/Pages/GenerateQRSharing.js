import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import PopUpAlert from "../Components/PopUpAlert";
import * as MediaLibrary from "expo-media-library";
import { Barcode } from "react-native-svg-barcode";
import { resolveMediaUrl } from "../Configs/eventPosterUtils";
import {
  EVENT_POSTER_RATIO,
  EVENT_POSTER_WIDTH,
} from "../Configs/ticketLayout";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, EVENT_POSTER_WIDTH / 2);
const TICKET_IMAGE_HEIGHT = Math.round(CARD_WIDTH / EVENT_POSTER_RATIO);

const DETAIL_ITEMS = [
  {
    key: "ticketId",
    label: "Ticket ID",
    icon: "document-text-outline",
    column: "left",
  },
  {
    key: "seatNo",
    label: "Seat No",
    icon: "grid-outline",
    column: "right",
  },
  {
    key: "venue",
    label: "Venue",
    icon: "location-outline",
    column: "left",
  },
  {
    key: "time",
    label: "Time",
    icon: "time-outline",
    column: "right",
  },
  {
    key: "date",
    label: "Date",
    icon: "calendar-outline",
    column: "left",
  },
  {
    key: "holder",
    label: "Ticket Holder",
    icon: "person-outline",
    column: "right",
  },
];

export default function GenerateQRScreen({ route }) {
  const navigation = useNavigation();
  const [failModal, setFailModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [text, setText] = useState("");

  const {
    documentId,
    ticketType,
    eventName,
    eventDate,
    eventTime,
    eventVenue,
    customerName,
    seatNo,
    eventImage,
  } = route?.params ?? {
    documentId: "REC-2026-001234",
    ticketType: "VIP",
    eventName: "Rock Night 2026",
    eventDate: "",
    eventTime: "",
    eventVenue: "",
    customerName: "Unknown",
    seatNo: "",
    eventImage: null,
  };

  function formatTime(timeStr) {
    if (!timeStr) return "TBA";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "TBA";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr.replace(/-/g, ".");
    }

    const d = new Date(dateStr);

    if (Number.isNaN(d.getTime())) {
      return dateStr;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}`;
  }

  const barcodeValue = documentId ? String(documentId) : "INVALID";
  const imageUrl = resolveMediaUrl(eventImage);
  const detailValues = {
    ticketId: documentId || "TBA",
    seatNo: seatNo || "Free Seating",
    venue: eventVenue || "TBA",
    time: formatTime(eventTime),
    date: formatDate(eventDate),
    holder: customerName || "Unknown",
  };

  const qrRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = async () => {
    try {
      const uri = await captureRef(qrRef, {
        format: "png",
        quality: 1,
        width: EVENT_POSTER_WIDTH,
      });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setText("Permission denied. Cannot save to gallery.");
        setFailModal(true);
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync("Download");
      if (album == null) {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      setText("✅ Ticket saved to Downloads!");
      setSuccessModal(true);
    } catch (err) {
      setText("Failed to save ticket.");
      setFailModal(true);
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      <ScrollView
        contentContainerStyle={tw`pt-10 pb-12 px-4 items-center`}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#7C3AED", "#4F46E5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`flex-row items-center px-4 py-2 rounded-full`}
        >
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text
            style={tw`text-white text-xs font-semibold tracking-wide ml-1.5`}
          >
            Booking Confirmed
          </Text>
        </LinearGradient>
        {/* ── Ticket Card ── */}
        <Animated.View
          ref={qrRef}
          collapsable={false}
          style={[
            tw`w-full self-center`,
            {
              width: CARD_WIDTH,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 12,
              borderRadius: 16,
              marginTop: 10,
            },
          ]}
        >
          <View
            style={{
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
            }}
          >
            <View
              style={{
                minHeight: 46,
                backgroundColor: "#7A130C",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: "#FFFFFF",
                  fontSize: 17,
                  fontWeight: "800",
                  letterSpacing: 0.2,
                  textAlign: "center",
                }}
              >
                {eventName || "Event Ticket"}
              </Text>
            </View>

            <View
              style={{
                width: "100%",
                height: TICKET_IMAGE_HEIGHT,
                backgroundColor: "#000",
              }}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#30110E", "#915022", "#E0AF6A"]}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                  }}
                >
                  <Ionicons name="musical-notes" size={50} color="#fff" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 20,
                      fontWeight: "800",
                      textAlign: "center",
                      marginTop: 12,
                    }}
                  >
                    {eventName}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.82)",
                      fontSize: 12,
                      fontWeight: "600",
                      marginTop: 8,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                    }}
                  >
                    {ticketType} Ticket
                  </Text>
                </LinearGradient>
              )}
            </View>

            <View
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 18,
                paddingTop: 18,
                paddingBottom: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#FEF4E8",
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#7A130C",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: 0.7,
                    }}
                  >
                    {ticketType}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  rowGap: 18,
                }}
              >
                {DETAIL_ITEMS.map((item) => (
                  <View
                    key={item.key}
                    style={{
                      width: "50%",
                      paddingRight: item.column === "left" ? 16 : 0,
                      paddingLeft: item.column === "right" ? 12 : 0,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color="#6D4A43"
                        style={{ marginTop: 2, marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#5A312A",
                            fontWeight: "800",
                            marginBottom: 4,
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            lineHeight: 17,
                            color: "#3B302E",
                            fontWeight: "500",
                          }}
                        >
                          {detailValues[item.key]}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#E5E5E5",
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                paddingTop: 18,
                paddingBottom: 22,
                paddingHorizontal: 18,
              }}
            >
              <Barcode
                value={barcodeValue}
                format="CODE128"
                height={84}
                lineColor="#000000"
                background="#ffffff"
                maxWidth={CARD_WIDTH - 72}
              />
              <Text
                style={{
                  fontSize: 10,
                  color: "#555555",
                  marginTop: 10,
                  letterSpacing: 1,
                }}
              >
                {barcodeValue}
              </Text>
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  color: "#7A7A7A",
                  marginTop: 8,
                  letterSpacing: 0.4,
                  fontWeight: "600",
                }}
              >
                By K Concert
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Buttons ── */}
        <Animated.View style={[tw`w-full mt-6`, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={tw`rounded-2xl overflow-hidden mb-3`}
          >
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tw`flex-row items-center justify-center py-4 px-8`}
            >
              <Ionicons
                name="download-outline"
                size={20}
                color="#ffffff"
                style={tw`mr-2.5`}
              />
              <Text
                style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}
              >
                Save Ticket
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={tw`items-center py-3.5 rounded-2xl border border-indigo-600`}
          >
            <Text style={tw`text-indigo-600 text-sm font-semibold`}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </Animated.View>

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
    </View>
  );
}
