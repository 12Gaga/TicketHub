import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";
import { ScanContext } from "../Configs/AuthContext";
import { useContext } from "react";

export default function ScanTicketDetails() {
  const {
    loading,
    activeTab,
    result,
    checkingIn,
    fadeAnim,
    handleReset,
    handleCheckIn,
    slideAnim,
  } = useContext(ScanContext);
  return (
    <View>
      {/* ── Loading indicator (scanner mode) ── */}
      {loading && activeTab === "scanner" && (
        <View style={tw`items-center py-8`}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={tw`text-gray-400 text-sm mt-3`}>
            Looking up ticket...
          </Text>
        </View>
      )}

      {/* ── Result Card ── */}
      {!loading && result && (
        <Animated.View
          style={[
            tw`rounded-2xl overflow-hidden border mt-5`,
            result.success ? tw`border-green-200` : tw`border-red-200`,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: result.success ? "#10B981" : "#EF4444",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            },
          ]}
        >
          {/* Result header */}
          <LinearGradient
            colors={
              result.success ? ["#10B981", "#059669"] : ["#EF4444", "#DC2626"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`px-5 py-4 flex-row items-center`}
          >
            <Ionicons
              name={result.success ? "checkmark-circle" : "close-circle"}
              size={24}
              color="#fff"
              style={tw`mr-3`}
            />
            <View>
              <Text style={tw`text-white font-bold text-base`}>
                {result.success ? "Ticket Found" : "Not Found"}
              </Text>
              <Text style={tw`text-white text-xs opacity-80`}>
                {result.success
                  ? result.ticket[0].CheckIn_Status
                    ? "Already checked in"
                    : "Ready to check in"
                  : result.message}
              </Text>
            </View>
          </LinearGradient>

          {/* Ticket details */}
          {result.success && (
            <View style={tw`bg-white px-5 py-4`}>
              <Row label="Name" value={result.ticket[0].Name} />
              <Row label="Email" value={result.ticket[0].Email} />
              <Row label="Phone" value={result.ticket[0].Phone} />
              <Row label="Ticket Type" value={result.ticket[0].ticket?.Name} />
              <Row label="Event" value={result.ticket[0].event?.Name} />
              <Row label="Seat No" value={result.ticket[0].SeatNo} />
              <Row label="Payment" value={result.ticket[0].Payment} />
              <Row
                label="Status"
                value={
                  result.ticket[0].CheckIn_Status
                    ? "✅ Checked In"
                    : "⏳ Pending"
                }
                highlight={!result.ticket[0].CheckIn_Status}
              />

              {/* Check in button */}
              {!result.ticket[0].CheckIn_Status && (
                <TouchableOpacity
                  onPress={handleCheckIn}
                  disabled={checkingIn}
                  style={tw`mt-4 rounded-xl overflow-hidden`}
                >
                  <LinearGradient
                    colors={["#4F46E5", "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={tw`py-4 flex-row items-center justify-center ${checkingIn ? "opacity-70" : ""}`}
                  >
                    {checkingIn ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-done-outline"
                          size={18}
                          color="#fff"
                          style={tw`mr-2`}
                        />
                        <Text style={tw`text-white font-bold text-sm`}>
                          Mark as Checked In
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Scan/search again */}
              <TouchableOpacity
                onPress={handleReset}
                style={tw`mt-3 py-3 rounded-xl border border-gray-200 items-center`}
              >
                <Text style={tw`text-gray-500 text-sm font-semibold`}>
                  {activeTab === "scanner" ? "Scan Another" : "Search Another"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error reset */}
          {!result.success && (
            <View style={tw`bg-white px-5 py-4`}>
              <TouchableOpacity
                onPress={handleReset}
                style={tw`py-3 rounded-xl border border-gray-200 items-center`}
              >
                <Text style={tw`text-gray-500 text-sm font-semibold`}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ── Helper row component ──
function Row({ label, value, highlight }) {
  return (
    <View style={tw`flex-row justify-between py-2 border-b border-gray-50`}>
      <Text style={tw`text-gray-400 text-xs font-semibold`}>{label}</Text>
      <Text
        style={tw`text-sm font-semibold ${highlight ? "text-indigo-600" : "text-gray-700"}`}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}
