import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useContext, useEffect, useRef, useState } from "react";
import { ScanContext } from "../Configs/AuthContext";

const DEBOUNCE_DELAY = 1500; // 1.5s after last keystroke — bluetooth scanners type fast

export default function BluetoothScanner() {
  const { activeTab, fetchTicket, loading, scannerInputRef } =
    useContext(ScanContext);
  const [inputValue, setInputValue] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef(null);
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.96)).current;
  const pulseLoopRef = useRef(null);
  const isReady =
    activeTab === "scanner" &&
    isFocused &&
    !waiting &&
    !loading &&
    inputValue.length === 0;

  useEffect(() => {
    if (isReady) {
      pulseOpacity.setValue(0.28);
      pulseScale.setValue(0.97);
      pulseLoopRef.current?.stop?.();
      pulseLoopRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.08,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.28,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.03,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 0.97,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop?.();
      pulseOpacity.stopAnimation();
      pulseScale.stopAnimation();
      pulseOpacity.setValue(0);
      pulseScale.setValue(0.96);
    }

    return () => {
      pulseLoopRef.current?.stop?.();
    };
  }, [isReady, pulseOpacity, pulseScale]);

  useEffect(() => {
    if (activeTab !== "scanner") {
      setIsFocused(false);
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleChange = (text) => {
    setInputValue(text);

    // Clear previous timer on every keystroke
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!text.trim()) {
      setWaiting(false);
      return;
    }

    // Show waiting indicator while debouncing
    setWaiting(true);

    // Start new timer — fires after user stops typing
    debounceTimer.current = setTimeout(async () => {
      setWaiting(false);
      await fetchTicket(text.trim());
      setInputValue(""); // clear input after scan so next ticket can be scanned
    }, DEBOUNCE_DELAY);
  };

  return (
    <View>
      {activeTab === "scanner" && (
        <View>
          {/* Info Box */}
          <View
            style={tw`flex-row bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4`}
          >
            <Ionicons
              name="bluetooth-outline"
              size={18}
              color="#6366F1"
              style={tw`mr-3 mt-0.5`}
            />
            <Text style={tw`flex-1 text-gray-500 text-xs leading-5`}>
              Connect your Bluetooth scanner and scan a ticket barcode or QR
              code. The ID will be captured automatically and looked up after{" "}
              {DEBOUNCE_DELAY / 1000}s.
            </Text>
          </View>

          {/* Hidden/Visible Input — bluetooth scanner types into this */}
          <View style={tw`mb-4`}>
            <View style={tw`relative`}>
              <Animated.View
                pointerEvents="none"
                style={[
                  tw`absolute`,
                  {
                    top: -6,
                    right: -6,
                    bottom: -6,
                    left: -6,
                    borderRadius: 18,
                    backgroundColor: "#C7D2FE",
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />

              <View
                style={[
                  tw`flex-row items-center rounded-xl px-4 py-3 bg-white border`,
                  isReady
                    ? tw`border-indigo-400 bg-indigo-50`
                    : waiting || loading
                      ? tw`border-indigo-200`
                      : tw`border-gray-200`,
                ]}
              >
                <Ionicons
                  name={isReady ? "scan-circle-outline" : "scan-outline"}
                  size={isReady ? 22 : 18}
                  color={isReady ? "#4F46E5" : "#6366F1"}
                  style={tw`mr-3`}
                />
                <TextInput
                  ref={scannerInputRef}
                  placeholder="Waiting for scan..."
                  placeholderTextColor={isReady ? "#6366F1" : "#9CA3AF"}
                  value={inputValue}
                  onChangeText={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  style={tw`flex-1 text-sm text-gray-700`}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true} // auto-focus so bluetooth scanner types here immediately
                  showSoftInputOnFocus={false} // hide keyboard — bluetooth scanner handles input
                />

                {/* Status indicator */}
                {waiting && (
                  <View style={tw`flex-row items-center`}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text style={tw`text-xs text-indigo-400 ml-2`}>
                      Reading...
                    </Text>
                  </View>
                )}
                {loading && !waiting && (
                  <View style={tw`flex-row items-center`}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text style={tw`text-xs text-indigo-400 ml-2`}>
                      Looking up...
                    </Text>
                  </View>
                )}
                {isReady && (
                  <View
                    style={tw`flex-row items-center bg-indigo-100 border border-indigo-200 rounded-full px-2.5 py-1`}
                  >
                    <Animated.View
                      style={[
                        tw`w-2 h-2 rounded-full bg-indigo-500 mr-2`,
                        {
                          opacity: pulseOpacity.interpolate({
                            inputRange: [0, 0.28],
                            outputRange: [0.55, 1],
                          }),
                          transform: [{ scale: pulseScale }],
                        },
                      ]}
                    />
                    <Text style={tw`text-xs font-semibold text-indigo-700`}>
                      Armed
                    </Text>
                  </View>
                )}
                {!isReady && !waiting && !loading && inputValue.length === 0 && (
                  <Ionicons name="radio-outline" size={16} color="#9CA3AF" />
                )}
              </View>
            </View>

            <View style={tw`flex-row items-center justify-between mt-3`}>
              {isReady ? (
                <View
                  style={tw`flex-row items-center bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5`}
                >
                  <Ionicons
                    name="flash-outline"
                    size={14}
                    color="#4F46E5"
                    style={tw`mr-2`}
                  />
                  <Text style={tw`text-xs font-semibold text-indigo-700`}>
                    Scanner armed
                  </Text>
                </View>
              ) : (
                <View />
              )}

              <Text
                style={[
                  tw`text-xs`,
                  isReady ? tw`text-indigo-500` : tw`text-gray-400`,
                ]}
              >
                {waiting
                  ? `Scanning complete — looking up in ${DEBOUNCE_DELAY / 1000}s...`
                  : loading
                    ? "Fetching ticket details..."
                    : isReady
                      ? "Ready for barcode scan"
                      : "Tap field or scan to begin"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
