import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useContext } from "react";
import { SaleTicket } from "../Configs/AuthContext";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";

export default function BulkUpload() {
  const { activeTab } = useContext(SaleTicket);
  return (
    <View>
      {activeTab === "bulk" && (
        <View>
          <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
            Bulk Ticket Import
          </Text>
          <Text style={tw`text-gray-400 text-xs mb-4`}>
            Import multiple tickets from CSV data
          </Text>

          {/* CSV Format Card */}
          <View style={tw`border border-gray-200 rounded-2xl p-4 mb-5`}>
            {/* Top Row */}
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-sm font-bold text-gray-900`}>
                CSV Format
              </Text>
              <TouchableOpacity
                style={tw`flex-row items-center border border-gray-200 rounded-xl px-3 py-2`}
              >
                <Ionicons name="document-outline" size={16} color="#374151" />
                <Text style={tw`text-sm text-gray-700 font-medium ml-1`}>
                  Download Template
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={tw`border-t border-gray-100 pt-3`}>
              <Text style={tw`text-xs text-gray-400 leading-5`}>
                Required columns: Name, Email, Phone, Type,{"\n"}
                Payment (optional), Agent (optional)
              </Text>
            </View>
          </View>

          {/* Paste CSV Data */}
          <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
            Paste CSV Data
          </Text>

          <TextInput
            multiline
            numberOfLines={5}
            placeholder={`Name,Email,Phone,Type,Payment,Agent\nJohn Doe,john@example.com,+1 555-0100,General Adm...`}
            placeholderTextColor="#9CA3AF"
            style={tw`border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-600 mb-6 h-28`}
            textAlignVertical="top"
          />

          {/* Import Button */}
          <TouchableOpacity
            style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-15`}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={tw`text-white font-bold text-sm ml-2`}>
              Import Ticket
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
