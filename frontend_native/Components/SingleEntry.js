import { useContext } from "react";
import { Picker } from "@react-native-picker/picker";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { SaleTicket } from "../Configs/AuthContext";
import { ActivityIndicator } from "react-native";

export default function SingleEntry() {
  const {
    activeTab,
    changeTicket,
    soldOut,
    avariableTicketType,
    setBuyState,
    setData,
    data,
    buyState,
    handleBooking,
    loading,
    agents,
  } = useContext(SaleTicket);

  const canGenerateTicket =
    data.event &&
    data.ticket &&
    data.Name &&
    data.agent &&
    !soldOut &&
    (!data.Ticket_Status || data.Ticket_Id);

  return (
    <View>
      {activeTab === "single" && (
        <>
          {data.event ? (
            <View>
              {soldOut ? (
                <Text
                  style={tw`text-4 font-bold text-red-500 mb-5 text-center`}
                >
                  Ticket Sold Out
                </Text>
              ) : (
                <></>
              )}
              <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
                Manual Ticket Entry
              </Text>
              <Text style={tw`text-gray-400 text-xs mb-4`}>
                Enter attendee details to generate a single ticket
              </Text>

                            {/* Online / Offline Toggle */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-2`}>
                  Sales Channel
                </Text>
                <View style={tw`flex-row`}>
                  <TouchableOpacity
                    onPress={() => {
                      setBuyState(1);
                      setData({ ...data, Ticket_Status: true });
                    }}
                    style={tw`flex-1 flex-row items-center justify-center py-3 rounded-l-xl border border-gray-200 ${
                      buyState === 1
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white"
                    }`}
                  >
                    <Ionicons
                      name="storefront-outline"
                      size={15}
                      color={buyState === 1 ? "white" : "#6B7280"}
                    />
                    <Text
                      style={tw`ml-1 text-sm font-semibold ${
                        buyState === 1 ? "text-white" : "text-gray-500"
                      }`}
                    >
                      Offline
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setBuyState(2);
                      setData({ ...data, Ticket_Status: false });
                    }}
                    style={tw`flex-1 flex-row items-center justify-center py-3 rounded-r-xl border border-gray-200 ${
                      buyState === 2
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white"
                    }`}
                  >
                    <Ionicons
                      name="globe-outline"
                      size={15}
                      color={buyState === 2 ? "white" : "#6B7280"}
                    />
                    <Text
                      style={tw`ml-1 text-sm font-semibold ${
                        buyState === 2 ? "text-white" : "text-gray-500"
                      }`}
                    >
                      Online
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ticket_Id for offline */}
              {data.Ticket_Status && (
                <View style={tw`mb-4`}>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Ticket Id <Text style={tw`text-red-500`}>*</Text>
                  </Text>
                  <TextInput
                    placeholder="Ticket - 1"
                    value={data.Ticket_Id}
                    style={tw`border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700`}
                    placeholderTextColor="#9CA3AF"
                    onChangeText={(ticketId) =>
                      setData({ ...data, Ticket_Id: ticketId })
                    }
                  />
                </View>
              )}

              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Name <Text style={tw`text-red-500`}>*</Text>
                </Text>
                <TextInput
                  placeholder="Customer Name"
                  value={data.Name}
                  style={tw`border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700`}
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(name) => setData({ ...data, Name: name })}
                />
              </View>

              {/* Email Address */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Email Address
                </Text>
                <TextInput
                  placeholder="example@example.com"
                  value={data.Email}
                  style={tw`border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700`}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  onChangeText={(email) => setData({ ...data, Email: email })}
                />
              </View>

              {/* Phone Number */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Phone Number
                </Text>
                <TextInput
                  placeholder="+959 123456789"
                  value={data.Phone}
                  style={tw`border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700`}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  onChangeText={(ph) => setData({ ...data, Phone: ph })}
                />
              </View>
              {/* Ticket Type */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Ticket Type <Text style={tw`text-red-500`}>*</Text>
                </Text>

                <View
                  style={tw`border border-gray-200 rounded-xl bg-white overflow-hidden flex-row items-center px-3`}
                >
                  <Ionicons
                    name="ticket-outline"
                    size={16}
                    color="#6366F1"
                    style={tw`mr-2`}
                  />
                  <Picker
                    selectedValue={data.ticket}
                    enabled={data.event ? true : false}
                    onValueChange={(ticketValue) => changeTicket(ticketValue)}
                    style={tw`flex-1 h-13 text-sm text-gray-700`}
                  >
                    <Picker.Item
                      label="Select ticket type"
                      value={null}
                      color="#9CA3AF"
                    />
                    {(avariableTicketType ?? []).map((ticket) => (
                      <Picker.Item
                        key={ticket.documentId}
                        label={ticket.Name}
                        value={ticket.documentId}
                        color="#111827"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Payment Method */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Payment Method
                </Text>
                <View
                  style={tw`border border-gray-200 rounded-xl overflow-hidden`}
                >
                  <Picker
                    selectedValue={data.Payment}
                    onValueChange={(payment) =>
                      setData({ ...data, Payment: payment })
                    }
                    style={tw`text-sm text-gray-700`}
                  >
                    <Picker.Item label="Cash" value="Cash" />
                    <Picker.Item
                      label="Mobile Banking"
                      value="Mobile Banking"
                    />
                    <Picker.Item label="Scan" value="Scan" />
                  </Picker>
                </View>
              </View>

              {/* Sales Agent / Counter */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Sales Agent / Counter <Text style={tw`text-red-500`}>*</Text>
                </Text>

                <View
                  style={tw`border border-gray-200 rounded-xl bg-white overflow-hidden flex-row items-center px-3`}
                >
                  <Ionicons
                    name="ticket-outline"
                    size={16}
                    color="#6366F1"
                    style={tw`mr-2`}
                  />
                  <Picker
                    selectedValue={data.agent}
                    onValueChange={(agent) =>
                      setData({ ...data, agent: agent })
                    }
                    style={tw`flex-1 h-13 text-sm text-gray-700`}
                  >
                    <Picker.Item
                      label="Select Agent"
                      value={null}
                      color="#9CA3AF"
                    />
                    {(agents ?? []).map((agent) => (
                      <Picker.Item
                        key={agent.documentId}
                        label={agent.Name}
                        value={agent.documentId}
                        color="#111827"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Seat Number */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Seat Number (Optional)
                </Text>
                <TextInput
                  placeholder="A-15"
                  value={data.SeatNo}
                  style={tw`border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700`}
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(seat) => setData({ ...data, SeatNo: seat })}
                />
              </View>

              {/* Notes / Remarks */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Notes / Remarks
                </Text>
                <TextInput
                  placeholder="Any additional information..."
                  value={data.Note}
                  multiline
                  numberOfLines={4}
                  style={tw`border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 h-24`}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                  onChangeText={(note) => setData({ ...data, Note: note })}
                />
              </View>

              {/* Generate Ticket Button */}
              <TouchableOpacity
                style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-15 ${
                  canGenerateTicket ? "opacity-100" : "opacity-50"
                }`}
                onPress={handleBooking}
                disabled={!canGenerateTicket}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="white" />
                    <Text style={tw`text-white font-bold text-sm ml-2`}>
                      Generate Ticket
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={tw`text-sm text-gray-400 mt-2 mb-1 text-center`}>
              Select an event first
            </Text>
          )}
        </>
      )}
    </View>
  );
}
