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
  TICKET_CANVAS_WIDTH,
  TICKET_PREVIEW_HEIGHT,
  TICKET_PREVIEW_WIDTH,
} from "../Configs/ticketLayout";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PREVIEW_HORIZONTAL_PADDING = 32;
const CARD_WIDTH = TICKET_PREVIEW_WIDTH;
const CARD_HEIGHT = TICKET_PREVIEW_HEIGHT;
const PREVIEW_SCALE = Math.min(
  (SCREEN_WIDTH - PREVIEW_HORIZONTAL_PADDING) / CARD_WIDTH,
  1,
);
const PREVIEW_WIDTH = Math.round(CARD_WIDTH * PREVIEW_SCALE);
const PREVIEW_HEIGHT = Math.round(CARD_HEIGHT * PREVIEW_SCALE);

const CARD_RADIUS = 18;
const HEADER_HEIGHT = 48;
const POSTER_HEIGHT = Math.round(CARD_WIDTH / EVENT_POSTER_RATIO);
const BODY_PADDING_HORIZONTAL = 16;
const BODY_PADDING_TOP = 16;
const BODY_PADDING_BOTTOM = 16;
const DETAIL_ROW_GAP = 20;
const DETAIL_COLUMN_GAP = 12;
const DETAIL_ICON_SIZE = 18;
const DETAIL_LABEL_SIZE = 12;
const DETAIL_VALUE_SIZE = 14;
const DETAIL_VALUE_LINE_HEIGHT = 20;
const BARCODE_PANEL_PADDING_HORIZONTAL = 12;
const BARCODE_PANEL_PADDING_TOP = 16;
const BARCODE_PANEL_PADDING_BOTTOM = 14;
const BARCODE_HEIGHT = 74;
const BARCODE_MAX_WIDTH = CARD_WIDTH - 74;
const BARCODE_PANEL_MARGIN_TOP = 20;
const POSTER_PILL_BOTTOM = 14;
const POSTER_PILL_LEFT = 14;
const POSTER_PILL_FONT_SIZE = 11;
const HEADER_FONT_SIZE = 16;
const FALLBACK_ICON_SIZE = 48;
const FALLBACK_TITLE_SIZE = 26;
const FALLBACK_SUBTITLE_SIZE = 12;

const THEME = {
  headerTop: "#800A00",
  headerBottom: "#1A0200",
  cardTop: "#430403",
  cardBottom: "#1F0101",
  bodyTop: "#1A0200",
  bodyBottom: "#810E05",
  ticketPill: "#7D4A12",
  ticketPillBorder: "#B67825",
  goldStrong: "#F2D37C",
  goldSoft: "#D7BA6A",
  goldMuted: "#B99446",
  cream: "#F3E7C6",
  creamText: "#2C1807",
  creamAccent: "#6D1A0F",
  creamBorder: "#DAC685",
  divider: "#DAC685",
};

const DETAIL_ITEMS = [
  {
    key: "ticketId",
    label: "Ticket ID",
    icon: "ticket-outline",
    column: "left",
  },
  {
    key: "seatNo",
    label: "Seat No.",
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

function formatTime(timeStr) {
  if (!timeStr) return "TBA";

  const [h, m] = String(timeStr).split(":");
  const hour = Number.parseInt(h, 10);

  if (Number.isNaN(hour) || !m) {
    return timeStr;
  }

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

function TicketPosterFallback({ eventName, ticketType }) {
  return (
    <LinearGradient
      colors={["#2B0907", "#74110C", "#B43B12"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
      }}
    >
      <View
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          opacity: 0.38,
        }}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.08)", "transparent"]}
          start={{ x: 0, y: 0.25 }}
          end={{ x: 1, y: 0.75 }}
          style={{
            position: "absolute",
            top: -20,
            left: -40,
            right: -40,
            bottom: -20,
            transform: [{ rotate: "24deg" }],
          }}
        />
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.06)", "transparent"]}
          start={{ x: 1, y: 0.2 }}
          end={{ x: 0, y: 0.8 }}
          style={{
            position: "absolute",
            top: -20,
            left: -40,
            right: -40,
            bottom: -20,
            transform: [{ rotate: "-24deg" }],
          }}
        />
      </View>

      <Ionicons
        name="musical-notes"
        size={FALLBACK_ICON_SIZE}
        color={THEME.goldStrong}
      />
      <Text
        numberOfLines={2}
        allowFontScaling={false}
        style={{
          color: THEME.goldStrong,
          fontSize: FALLBACK_TITLE_SIZE,
          fontWeight: "900",
          letterSpacing: 1.1,
          textAlign: "center",
          marginTop: 18,
        }}
      >
        {eventName || "Event Ticket"}
      </Text>
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={{
          color: "rgba(242, 211, 124, 0.88)",
          fontSize: FALLBACK_SUBTITLE_SIZE,
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: 1.8,
          textAlign: "center",
          marginTop: 12,
        }}
      >
        {ticketType || "General Admission"}
      </Text>
    </LinearGradient>
  );
}

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
  }, [fadeAnim, slideAnim]);

  const handleSave = async () => {
    try {
      const uri = await captureRef(qrRef, {
        format: "png",
        quality: 1,
        width: TICKET_CANVAS_WIDTH,
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

        <Animated.View
          style={[
            tw`self-center`,
            {
              width: PREVIEW_WIDTH,
              height: PREVIEW_HEIGHT,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginTop: 10,
            },
          ]}
        >
          <View
            style={{
              position: "absolute",
              top: (PREVIEW_HEIGHT - CARD_HEIGHT) / 2,
              left: (PREVIEW_WIDTH - CARD_WIDTH) / 2,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              transform: [{ scale: PREVIEW_SCALE }],
            }}
          >
            <View
              ref={qrRef}
              collapsable={false}
              style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                shadowColor: "#240101",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.28,
                shadowRadius: 20,
                elevation: 12,
                borderRadius: CARD_RADIUS,
              }}
            >
              <LinearGradient
                colors={[THEME.cardTop, THEME.cardBottom]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={{
                  flex: 1,
                  borderRadius: CARD_RADIUS,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={[THEME.headerTop, THEME.headerBottom]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    height: HEADER_HEIGHT,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 24,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    style={{
                      color: THEME.goldStrong,
                      fontSize: HEADER_FONT_SIZE,
                      fontWeight: "900",
                      textAlign: "center",
                    }}
                  >
                    {eventName || "Event Ticket"}
                  </Text>
                </LinearGradient>

                <View
                  style={{
                    width: "100%",
                    height: POSTER_HEIGHT,
                    backgroundColor: "#0D0000",
                    position: "relative",
                  }}
                >
                  {imageUrl ? (
                    <>
                      <Image
                        source={{ uri: imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                      />
                      <LinearGradient
                        colors={[
                          "rgba(15, 0, 0, 0.1)",
                          "rgba(15, 0, 0, 0.15)",
                          "rgba(15, 0, 0, 0.55)",
                        ]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                        }}
                      />
                    </>
                  ) : (
                    <TicketPosterFallback
                      eventName={eventName}
                      ticketType={ticketType}
                    />
                  )}

                  <View
                    style={{
                      position: "absolute",
                      left: POSTER_PILL_LEFT,
                      bottom: POSTER_PILL_BOTTOM,
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: THEME.ticketPill,
                      borderWidth: 1,
                      borderColor: THEME.ticketPillBorder,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.18,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      allowFontScaling={false}
                      style={{
                        color: THEME.goldStrong,
                        fontSize: POSTER_PILL_FONT_SIZE,
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {ticketType || "General"}
                    </Text>
                  </View>
                </View>

                <LinearGradient
                  colors={[THEME.bodyTop, THEME.bodyBottom]}
                  start={{ x: 0.505, y: 0 }}
                  end={{ x: 0.495, y: 1 }}
                  style={{
                    flexGrow: 1,
                    paddingHorizontal: BODY_PADDING_HORIZONTAL,
                    paddingTop: BODY_PADDING_TOP,
                    paddingBottom: BODY_PADDING_BOTTOM,
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      width: "100%",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        rowGap: DETAIL_ROW_GAP,
                      }}
                    >
                      {DETAIL_ITEMS.map((item) => (
                        <View
                          key={item.key}
                          style={{
                            width: "50%",
                            paddingRight:
                              item.column === "left" ? DETAIL_COLUMN_GAP : 0,
                            paddingLeft:
                              item.column === "right" ? DETAIL_COLUMN_GAP : 0,
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
                              size={DETAIL_ICON_SIZE}
                              color={THEME.goldSoft}
                              style={{
                                marginTop: 1,
                                marginRight: 8,
                              }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                allowFontScaling={false}
                                style={{
                                  color: THEME.goldStrong,
                                  fontSize: DETAIL_LABEL_SIZE,
                                  fontWeight: "900",
                                  letterSpacing: 0.4,
                                  marginBottom: 5,
                                }}
                              >
                                {item.label}
                              </Text>
                              <Text
                                allowFontScaling={false}
                                numberOfLines={2}
                                style={{
                                  color: THEME.goldSoft,
                                  fontSize: DETAIL_VALUE_SIZE,
                                  lineHeight: DETAIL_VALUE_LINE_HEIGHT,
                                  fontWeight: "400",
                                  minHeight: 30,
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
                      marginTop: BARCODE_PANEL_MARGIN_TOP,
                      backgroundColor: THEME.cream,
                      borderRadius: 10,
                      borderTopWidth: 1,
                      borderTopColor: THEME.creamBorder,
                      paddingHorizontal: BARCODE_PANEL_PADDING_HORIZONTAL,
                      paddingTop: BARCODE_PANEL_PADDING_TOP,
                      paddingBottom: BARCODE_PANEL_PADDING_BOTTOM,
                      alignItems: "center",
                    }}
                  >
                    <Barcode
                      value={barcodeValue}
                      format="CODE128"
                      height={BARCODE_HEIGHT}
                      lineColor="#000000"
                      background={THEME.cream}
                      maxWidth={BARCODE_MAX_WIDTH}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 10,
                        color: THEME.creamText,
                        marginTop: 8,
                        letterSpacing: 0.6,
                      }}
                    >
                      {barcodeValue}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        textAlign: "center",
                        fontSize: 9,
                        color: THEME.creamAccent,
                        marginTop: 6,
                        letterSpacing: 0.3,
                        fontWeight: "800",
                      }}
                    >
                      By K Concert
                    </Text>
                  </View>
                </LinearGradient>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

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
