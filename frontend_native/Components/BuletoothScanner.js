import { View, Text, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "twrnc";
import { useContext, useRef, useState } from "react";
import { ScanContext } from "../Configs/AuthContext";

const DEBOUNCE_DELAY = 1500; // 1.5s after last keystroke — bluetooth scanners type fast

export default function BluetoothScanner() {
  const { activeTab, fetchTicket, loading, scannerInputRef } =
    useContext(ScanContext);
  const [inputValue, setInputValue] = useState("");
  const [waiting, setWaiting] = useState(false);
  const debounceTimer = useRef(null);

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
          <View
            style={tw`flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-white mb-3`}
          >
            <Ionicons
              name="scan-outline"
              size={18}
              color="#6366F1"
              style={tw`mr-3`}
            />
            <TextInput
              ref={scannerInputRef}
              placeholder="Waiting for scan..."
              placeholderTextColor="#9CA3AF"
              value={inputValue}
              onChangeText={handleChange}
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
                <Text style={tw`text-xs text-indigo-400 ml-2`}>Reading...</Text>
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
            {!waiting && !loading && inputValue.length === 0 && (
              <Ionicons name="radio-outline" size={16} color="#9CA3AF" />
            )}
          </View>

          {/* Status Label */}
          <Text style={tw`text-xs text-gray-400 text-center mb-4`}>
            {waiting
              ? `Scanning complete — looking up in ${DEBOUNCE_DELAY / 1000}s...`
              : loading
                ? "Fetching ticket details..."
                : "Ready to scan"}
          </Text>
        </View>
      )}
    </View>
  );
}
