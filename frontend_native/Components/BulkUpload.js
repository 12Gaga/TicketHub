import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useContext, useState } from "react";
import { SaleTicket } from "../Configs/AuthContext";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as FileSystemWrite from "expo-file-system";
import globalApi from "../Configs/globalApi";

// Parse CSV text into array of ticket objects
function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2)
    throw new Error("CSV must have a header and at least one row");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });

    return {
      Name: row["name"] || "",
      Email: row["email"] || null,
      Phone: row["phone"] || "",
      Payment: row["payment"] || "Cash",
      Agent: row["agent"] || "",
      SeatNo: row["seatno"] || "",
      Note: row["note"] || "",
      Ticket_Id: row["ticket_id"] || null,
      Ticket_Status: true,
    };
  });
}

const TEMPLATE_CSV =
  "Name,Email,Phone,Payment,Agent,SeatNo,Note,Ticket_Id\nJohn Doe,john@example.com,+1 555-0100,Cash,AgentName,A1,VIP Guest,TK001";

export default function BulkUpload() {
  const { activeTab, data } = useContext(SaleTicket);
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [parsed, setParsed] = useState([]);

  const handleDownloadTemplate = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + "ticket_template.csv";
      await FileSystemWrite.writeAsStringAsync(fileUri, TEMPLATE_CSV);
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      Alert.alert("Error", "Could not download template");
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setCsvText(content);
      const rows = parseCSV(content);
      setParsed(rows);
      setPreview(rows.slice(0, 3));
      Alert.alert("Success", `${rows.length} tickets ready to import`);
    } catch (e) {
      Alert.alert("Error", "Could not read file. Make sure it's a valid CSV.");
    }
  };

  const handlePastePreview = () => {
    if (!csvText.trim()) {
      Alert.alert("Error", "Please paste CSV data first");
      return;
    }
    try {
      const rows = parseCSV(csvText);
      setParsed(rows);
      setPreview(rows.slice(0, 3));
      Alert.alert("Parsed", `${rows.length} tickets ready to import`);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleImport = async () => {
    if (!data.event) {
      Alert.alert("Error", "Please select an event first");
      return;
    }
    if (!data.ticket) {
      Alert.alert("Error", "Please select a ticket type first");
      return;
    }
    if (parsed.length === 0) {
      Alert.alert("Error", "No tickets to import. Paste or upload CSV first.");
      return;
    }

    setLoading(true);
    try {
      const ticketsWithEvent = parsed.map((t) => ({
        ...t,
        event: data.event, // from parent screen selected event
        ticket: data.ticket, // from parent screen selected ticket type
        Ticket_Status: true,
      }));

      const resp = await globalApi.bulkCreateTickets(ticketsWithEvent);
      if (resp.ok) {
        Alert.alert(
          "Import Complete",
          `✅ ${resp.data.created} tickets created\n❌ ${resp.data.failed} failed`,
        );
        setCsvText("");
        setParsed([]);
        setPreview([]);
      } else {
        Alert.alert("Error", "Import failed. Please try again.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };
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
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-sm font-bold text-gray-900`}>
                CSV Format
              </Text>
              <TouchableOpacity
                onPress={handleDownloadTemplate}
                style={tw`flex-row items-center border border-gray-200 rounded-xl px-3 py-2`}
              >
                <Ionicons name="document-outline" size={16} color="#374151" />
                <Text style={tw`text-sm text-gray-700 font-medium ml-1`}>
                  Download Template
                </Text>
              </TouchableOpacity>
            </View>
            <View style={tw`border-t border-gray-100 pt-3`}>
              <Text style={tw`text-xs text-gray-400 leading-5`}>
                Required columns: Name, Email, Phone{"\n"}
                Payment (optional), Agent (optional)
              </Text>
            </View>
          </View>

          {/* Upload CSV File Button */}
          <TouchableOpacity
            onPress={handlePickFile}
            style={tw`flex-row items-center justify-center border border-dashed border-indigo-400 rounded-2xl py-4 mb-5`}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#6366F1" />
            <Text style={tw`text-indigo-600 font-semibold text-sm ml-2`}>
              Upload CSV File
            </Text>
          </TouchableOpacity>

          {/* Paste CSV Data */}
          <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
            Paste CSV Data
          </Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder={`Name,Email,Phone,Payment,Agent\nJohn Doe,john@example.com,+1 555-0100,Cash,Agent`}
            placeholderTextColor="#9CA3AF"
            value={csvText}
            onChangeText={setCsvText}
            style={tw`border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-600 mb-3 h-28`}
            textAlignVertical="top"
          />

          {/* Preview Button */}
          <TouchableOpacity
            onPress={handlePastePreview}
            style={tw`border border-gray-300 rounded-xl py-3 items-center mb-4`}
          >
            <Text style={tw`text-gray-700 font-semibold text-sm`}>
              Preview {parsed.length > 0 ? `(${parsed.length} tickets)` : ""}
            </Text>
          </TouchableOpacity>

          {/* Preview List */}
          {preview.length > 0 && (
            <View style={tw`border border-gray-200 rounded-2xl p-4 mb-5`}>
              <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>
                Preview
              </Text>
              {preview.map((row, i) => (
                <View
                  key={i}
                  style={tw`flex-row justify-between py-2 border-b border-gray-100`}
                >
                  <Text style={tw`text-xs font-medium text-gray-800`}>
                    {row.Name}
                  </Text>
                  <Text style={tw`text-xs text-gray-400`}>{row.Email}</Text>
                </View>
              ))}
              {parsed.length > 3 && (
                <Text style={tw`text-xs text-gray-400 text-center mt-2`}>
                  +{parsed.length - 3} more tickets
                </Text>
              )}
            </View>
          )}

          {/* Import Button */}
          <TouchableOpacity
            onPress={handleImport}
            disabled={loading}
            style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-15 ${loading ? "opacity-60" : ""}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add" size={18} color="white" />
                <Text style={tw`text-white font-bold text-sm ml-2`}>
                  Import Ticket
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// import { View, Text, TouchableOpacity, TextInput } from "react-native";
// import { useContext } from "react";
// import { SaleTicket } from "../Configs/AuthContext";
// import tw from "twrnc";
// import { Ionicons } from "@expo/vector-icons";

// export default function BulkUpload() {
//   const { activeTab } = useContext(SaleTicket);
//   return (
//     <View>
//       {activeTab === "bulk" && (
//         <View>
//           <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
//             Bulk Ticket Import
//           </Text>
//           <Text style={tw`text-gray-400 text-xs mb-4`}>
//             Import multiple tickets from CSV data
//           </Text>

//           {/* CSV Format Card */}
//           <View style={tw`border border-gray-200 rounded-2xl p-4 mb-5`}>
//             {/* Top Row */}
//             <View style={tw`flex-row items-center justify-between mb-3`}>
//               <Text style={tw`text-sm font-bold text-gray-900`}>
//                 CSV Format
//               </Text>
//               <TouchableOpacity
//                 style={tw`flex-row items-center border border-gray-200 rounded-xl px-3 py-2`}
//               >
//                 <Ionicons name="document-outline" size={16} color="#374151" />
//                 <Text style={tw`text-sm text-gray-700 font-medium ml-1`}>
//                   Download Template
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             {/* Divider */}
//             <View style={tw`border-t border-gray-100 pt-3`}>
//               <Text style={tw`text-xs text-gray-400 leading-5`}>
//                 Required columns: Name, Email, Phone, Type,{"\n"}
//                 Payment (optional), Agent (optional)
//               </Text>
//             </View>
//           </View>

//           {/* Paste CSV Data */}
//           <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
//             Paste CSV Data
//           </Text>

//           <TextInput
//             multiline
//             numberOfLines={5}
//             placeholder={`Name,Email,Phone,Type,Payment,Agent\nJohn Doe,john@example.com,+1 555-0100,General Adm...`}
//             placeholderTextColor="#9CA3AF"
//             style={tw`border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-600 mb-6 h-28`}
//             textAlignVertical="top"
//           />

//           {/* Import Button */}
//           <TouchableOpacity
//             style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-15`}
//           >
//             <Ionicons name="add" size={18} color="white" />
//             <Text style={tw`text-white font-bold text-sm ml-2`}>
//               Import Ticket
//             </Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// }
