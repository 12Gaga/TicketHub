import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { useContext } from "react";
import { ScanContext } from "../Configs/AuthContext";

export default function QRScanner() {
  const { activeTab, handleSimulateScan, loading } = useContext(ScanContext);
  return (
    <View>
      {activeTab === "scanner" && (
        <View>
          {/* Info box */}
          <View
            style={tw`flex-row bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4`}
          >
            <Ionicons
              name="qr-code-outline"
              size={18}
              color="#6366F1"
              style={tw`mr-3 mt-0.5`}
            />
            <Text style={tw`flex-1 text-gray-500 text-xs leading-5`}>
              In a production environment, this would activate your device
              camera to scan ticket barcodes or QR codes. For this demo, click
              the button below to simulate a scan.
            </Text>
          </View>

          {/* Simulate scan button */}
          <TouchableOpacity
            onPress={handleSimulateScan}
            style={tw`rounded-xl overflow-hidden mb-4`}
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
                    name="qr-code-outline"
                    size={18}
                    color="#fff"
                    style={tw`mr-2`}
                  />
                  <Text style={tw`text-white font-bold text-sm`}>
                    Simulate Ticket Scan
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
