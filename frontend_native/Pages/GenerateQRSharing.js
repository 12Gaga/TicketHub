import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc"; // adjust path if needed e.g. "../lib/tailwind"
import { useNavigation } from "@react-navigation/native";
import PopUpAlert from "../Components/PopUpAlert";
import * as MediaLibrary from "expo-media-library";

export default function GenerateQRScreen({ route }) {
  const navigation = useNavigation();
  const [failModal, setFailModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [text, setText] = useState("");
  const { documentId, ticketType, eventName } = route?.params ?? {
    documentId: "u52jpr6kwzm8e9fsme397tzm",
    ticketType: "VIP",
    eventName: "Rock Night 2026",
  };

  const qrValue = documentId;

  const qrRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
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
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = async () => {
    try {
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });

      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setText("Permission denied. Cannot save to gallery.");
        setFailModal(true);
        return;
      }

      // Save directly to gallery
      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync("Download");

      if (album == null) {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      setText("✅ QR Code saved to Downloads!");
      setSuccessModal(true); // you'll need to add successModal state too
    } catch (err) {
      console.error("Save error:", err);
      setText("Failed to save QR code.");
      setFailModal(true);
    }
  };

  // Sharing
  // const handleSave = async () => {
  //   try {
  //     const uri = await captureRef(qrRef, { format: "png", quality: 1 });

  //     const fileName = `TicketHub_QR_${documentId}.png`;
  //     const destPath = FileSystem.documentDirectory + fileName;
  //     await FileSystem.copyAsync({ from: uri, to: destPath });

  //     const isAvailable = await Sharing.isAvailableAsync();
  //     if (!isAvailable) {
  //       setText("Not Availabl : Sharing is not supported on this device.");
  //       setFailModal(true);
  //       return;
  //     }

  //     await Sharing.shareAsync(destPath, {
  //       mimeType: "image/png",
  //       dialogTitle: "Save your QR code",
  //       UTI: "public.png",
  //     });
  //   } catch (err) {
  //     console.error("Save error:", err);
  //     setText("Failed to share QR code.");
  //     setFailModal(true);
  //   }
  // };

  const truncate = (str, n) =>
    str && str.length > n ? str.slice(0, n) + "…" : str;

  //   bg-[#0A0A14]
  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A14" />

      {/* Background orbs */}
      <View
        style={tw`absolute w-80 h-80 rounded-full bg-violet-700 opacity-10 -top-20 -right-20`}
      />
      <View
        style={tw`absolute w-60 h-60 rounded-full bg-blue-600 opacity-10 bottom-16 -left-16`}
      />

      <ScrollView
        contentContainerStyle={tw`pt-14 pb-12 px-5 items-center`}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        {/* <Animated.View
          style={[
            tw`flex-row items-center justify-between w-full mb-5`,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            style={tw`w-10 h-10 rounded-xl bg-violet-900 bg-opacity-40 items-center justify-center`}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#A78BFA" />
          </TouchableOpacity>

          <Text style={tw`text-lg font-bold text-violet-100 tracking-wide`}>
            Your Ticket
          </Text>

          <View style={tw`w-10`} />
        </Animated.View> */}

        {/* ── Success Badge ── */}
        <Animated.View
          style={[
            tw`mb-5`,
            {
              opacity: badgeAnim,
              transform: [
                {
                  scale: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
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
        </Animated.View>

        {/* ── Ticket Card ── */}
        <Animated.View
          ref={qrRef}
          collapsable={false}
          style={[
            tw`w-full`,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              shadowColor: "#7C3AED",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 16,
            },
          ]}
        >
          {/* bg-[#13131F] */}
          <View
            style={tw`bg-white rounded-3xl overflow-hidden border border-violet-900 border-opacity-30`}
          >
            {/* Top gradient accent */}
            <LinearGradient
              colors={["#7C3AED", "#4F46E5", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tw`h-1 w-full`}
            />

            {/* ── Info Lines ── */}
            <View style={tw`px-6 pt-6 pb-5`}>
              {/* Line 1 — Ticket Type */}
              <View style={tw`flex-row items-start mb-4`}>
                <View
                  style={tw`w-2 h-2 rounded-full bg-violet-500 mt-1.5 mr-3`}
                />
                <View>
                  <Text
                    style={tw`text-gray-500 font-bold tracking-widest mb-0.5`}
                    allowFontScaling={false}
                  >
                    {"TICKET TYPE"}
                  </Text>
                  <Text style={tw`text-base font-bold text-violet-400`}>
                    {ticketType}
                  </Text>
                </View>
              </View>

              <View style={tw`h-px bg-white bg-opacity-5 ml-5 mb-4`} />

              {/* Line 2 — Event Name */}
              <View style={tw`flex-row items-start mb-4`}>
                <View
                  style={tw`w-2 h-2 rounded-full bg-indigo-500 mt-1.5 mr-3`}
                />
                <View>
                  <Text
                    style={tw`text-gray-500 font-bold tracking-widest mb-0.5`}
                    allowFontScaling={false}
                  >
                    {"EVENT"}
                  </Text>
                  <Text style={tw`text-base font-bold text-violet-400`}>
                    {eventName}
                  </Text>
                </View>
              </View>

              <View style={tw`h-px bg-white bg-opacity-5 ml-5 mb-4`} />

              {/* Line 3 — Document ID */}
              <View style={tw`flex-row items-start`}>
                <View
                  style={tw`w-2 h-2 rounded-full bg-blue-500 mt-1.5 mr-3`}
                />
                <View style={tw`flex-1`}>
                  <Text
                    style={tw`text-gray-500 font-bold tracking-widest mb-0.5`}
                    allowFontScaling={false}
                  >
                    {"BOOKING REF"}
                  </Text>
                  <Text
                    style={tw`text-sm font-semibold text-violet-400`}
                    numberOfLines={1}
                  >
                    {documentId}
                  </Text>
                </View>
              </View>
            </View>

            <View style={tw`h-px bg-gray-100 ml-5 mt-4 mb-3`} />
            <View style={tw`flex-row items-center justify-end`}>
              <Text
                style={tw`text-xs text-gray-400 tracking-widest font-semibold`}
              >
                By K Concert
              </Text>
            </View>

            {/* ── Tear Line ── */}
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-5 h-5 rounded-full bg-[#0A0A14] -ml-2.5`} />
              {Array.from({ length: 18 }).map((_, i) => (
                <View key={i} style={tw`flex-1 h-px bg-violet-900 mx-0.5`} />
              ))}
              <View style={tw`w-5 h-5 rounded-full bg-[#0A0A14] -mr-2.5`} />
            </View>

            {/* ── QR Code ── */}
            <View style={tw`items-center py-7 px-6`}>
              {/* White QR frame with purple corner accents */}
              <View style={tw`relative p-4 bg-violet-50 rounded-2xl`}>
                {/* TL corner */}
                <View
                  style={[
                    tw`absolute top-1.5 left-1.5 w-5 h-5 border-violet-600`,
                    {
                      borderTopWidth: 3,
                      borderLeftWidth: 3,
                      borderTopLeftRadius: 4,
                    },
                  ]}
                />
                {/* TR corner */}
                <View
                  style={[
                    tw`absolute top-1.5 right-1.5 w-5 h-5 border-violet-600`,
                    {
                      borderTopWidth: 3,
                      borderRightWidth: 3,
                      borderTopRightRadius: 4,
                    },
                  ]}
                />
                {/* BL corner */}
                <View
                  style={[
                    tw`absolute bottom-1.5 left-1.5 w-5 h-5 border-violet-600`,
                    {
                      borderBottomWidth: 3,
                      borderLeftWidth: 3,
                      borderBottomLeftRadius: 4,
                    },
                  ]}
                />
                {/* BR corner */}
                <View
                  style={[
                    tw`absolute bottom-1.5 right-1.5 w-5 h-5 border-violet-600`,
                    {
                      borderBottomWidth: 3,
                      borderRightWidth: 3,
                      borderBottomRightRadius: 4,
                    },
                  ]}
                />

                <View style={tw`rounded-lg overflow-hidden`}>
                  <QRCode
                    value={qrValue}
                    size={180}
                    backgroundColor="transparent"
                    color="#0A0A14"
                    quietZone={8}
                  />
                </View>
              </View>

              <Text
                style={tw`mt-3.5 text-xs text-gray-500 tracking-wide font-medium`}
              >
                Scan to verify ticket
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Buttons ── */}
        <Animated.View
          style={[
            tw`w-full mt-7`,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Save to Gallery */}
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
                color="#fff"
                style={tw`mr-2.5`}
              />
              <Text style={tw`text-white text-base font-bold tracking-wide`}>
                Save QR Code
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Home */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={tw`items-center py-3.5 rounded-2xl border border-violet-800`}
          >
            <Text
              style={tw`text-violet-400 text-sm font-semibold tracking-wide`}
            >
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
