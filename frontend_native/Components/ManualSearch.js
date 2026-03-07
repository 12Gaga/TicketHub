import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { ScanContext } from "../Configs/AuthContext";
import { useContext } from "react";

export default function ManualSearch() {
  const {
    activeTab,
    manualInput,
    setManualInput,
    handleManualSearch,
    loading,
  } = useContext(ScanContext);
  return (
    <View>
      {activeTab === "manual" && (
        <View>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>
            Enter QR code manually
          </Text>

          {/* Input */}
          <View
            style={tw`flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-white mb-3`}
          >
            <TextInput
              placeholder="Paste or type QR code data"
              placeholderTextColor="#9CA3AF"
              value={manualInput}
              onChangeText={setManualInput}
              style={tw`flex-1 text-sm text-gray-700`}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {manualInput.length > 0 && (
              <TouchableOpacity onPress={() => setManualInput("")}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search button */}
          <TouchableOpacity
            onPress={handleManualSearch}
            disabled={!manualInput.trim() || loading}
            style={tw`rounded-xl overflow-hidden ${!manualInput.trim() ? "opacity-50" : ""}`}
          >
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={tw`py-4 flex-row items-center justify-center`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color="#fff"
                    style={tw`mr-2`}
                  />
                  <Text style={tw`text-white font-bold text-sm`}>
                    Search Ticket
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
