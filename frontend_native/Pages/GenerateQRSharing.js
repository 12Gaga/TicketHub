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

const SCREEN_WIDTH = Dimensions.get("window").width;
const STRAPI_URL = "https://loved-kindness-ad57dad94c.strapiapp.com";

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
    documentId: "u52jpr6kwzm8e9fsme397tzm",
    ticketType: "VIP",
    eventName: "Rock Night 2026",
    eventDate: "",
    eventVenue: "",
    customerName: "Unknown",
    seatNo: "",
    ticketId: "",
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
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const barcodeValue = documentId ? String(documentId) : "INVALID";
  console.log("eventImage:", eventImage);
  const imageUrl = eventImage
    ? eventImage.startsWith("http")
      ? eventImage
      : `https://loved-kindness-ad57dad94c.strapiapp.com${eventImage}`
    : null;

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
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
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
            tw`w-full`,
            {
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
          <View style={{ borderRadius: 16, overflow: "hidden" }}>
            {/* ── TOP: Portrait Event Image ── */}
            <View
              style={{
                width: "100%",
                aspectRatio: 1000 / 1234,
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
                  colors={["#8349e8", "#e2e2ea"]}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="musical-notes" size={50} color="#fff" />
                  <Text style={tw`text-white text-base mt-2 font-bold`}>
                    {eventName}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* ── BOTTOM: Ticket Details ── */}
            <View style={{ backgroundColor: "#FFFFFF", padding: 16 }}>
              {/* Customer Name */}
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  TICKET HOLDER NAME
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#151415",
                    fontWeight: "800",
                  }}
                >
                  {customerName?.toUpperCase()}
                </Text>
              </View>

              {/* Event Name */}
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  EVENT NAME
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#151415",
                    fontWeight: "700",
                  }}
                >
                  {eventName}
                </Text>
              </View>

              {/* Date + Time Row */}
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  EVENT DATE
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#1a0a00",
                    fontWeight: "700",
                  }}
                >
                  {formatDate(eventDate)}
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  EVENT TIME
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#1a0a00",
                    fontWeight: "700",
                  }}
                >
                  {formatTime(eventTime)}
                </Text>
              </View>

              {/* Venue */}
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  EVENT VENUE
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#1a0a00",
                    fontWeight: "700",
                  }}
                >
                  {eventVenue?.toUpperCase()}
                </Text>
              </View>

              {/* Ticket Type + Seat Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#888",
                      fontWeight: "700",
                      letterSpacing: 1,
                    }}
                  >
                    TICKET TYPE
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#1a0a00",
                      fontWeight: "700",
                    }}
                  >
                    {ticketType}
                  </Text>
                </View>
                {/* Seat No */}
                {seatNo ? (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 9,
                        color: "#888",
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      SEAT No.
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#1a0a00",
                        fontWeight: "800",
                      }}
                    >
                      {seatNo.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Ticket No */}
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  BOOKING REFERENCE No.
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#1a0a00",
                    fontWeight: "700",
                  }}
                >
                  {documentId}
                </Text>
              </View>

              {/* Tear Line */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 12,
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: "#F3F4F6",
                    marginLeft: -24,
                  }}
                />
                {Array.from({ length: 22 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: "#C9A84C",
                      marginHorizontal: 2,
                    }}
                  />
                ))}
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: "#F3F4F6",
                    marginRight: -24,
                  }}
                />
              </View>

              {/* Barcode */}
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                  borderRadius: 8,
                }}
              >
                <Barcode
                  value={barcodeValue}
                  format="CODE128"
                  height={70}
                  lineColor="#000000"
                  background="#ffffff"
                  maxWidth={SCREEN_WIDTH - 80}
                />
                <Text
                  style={{
                    fontSize: 9,
                    color: "#888",
                    marginTop: 4,
                    letterSpacing: 2,
                  }}
                >
                  {barcodeValue}
                </Text>
              </View>

              {/* Footer */}
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  color: "#aaa",
                  marginTop: 10,
                  letterSpacing: 2,
                  fontWeight: "600",
                }}
              >
                BY K CONCERT
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
