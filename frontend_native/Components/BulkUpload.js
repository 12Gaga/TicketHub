import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useContext, useState } from "react";
import { SaleTicket } from "../Configs/AuthContext";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import globalApi from "../Configs/globalApi";
import PopUpAlert from "./PopUpAlert";

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
  const {
    activeTab,
    data,
    avariableTicketType,
    changeTicket,
    soldOut,
    user,
    bookedTickets,
    ticketLimit,
  } = useContext(SaleTicket);
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [parsed, setParsed] = useState([]);
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [text, setText] = useState("");

  const handleDownloadTemplate = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + "ticket_template.csv";
      await FileSystem.writeAsStringAsync(fileUri, TEMPLATE_CSV); // use FileSystem, not FileSystemWrite
      await Sharing.shareAsync(fileUri);
    } catch (e) {
      setText("Could not download template");
      setFailModal(true);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log("Picked file:", file); // check uri in logs

      // Try reading directly first
      let content = "";
      try {
        content = await FileSystem.readAsStringAsync(file.uri);
      } catch (readErr) {
        // On some Android devices the uri needs to be copied first
        const destUri = FileSystem.cacheDirectory + "temp_upload.csv";
        await FileSystem.copyAsync({ from: file.uri, to: destUri });
        content = await FileSystem.readAsStringAsync(destUri);
      }

      console.log("File content:", content); // check content in logs

      if (!content || content.trim() === "") {
        setText("File is empty");
        setFailModal(true);
        return;
      }

      setCsvText(content);
      const rows = parseCSV(content);
      setParsed(rows);
      setPreview(rows.slice(0, 3));
      setText(`${rows.length} tickets ready to import`);
      setSuccessModal(true);
    } catch (e) {
      console.error("File pick error:", e);
      setText(`${e.message}`);
      setFailModal(true);
    }
  };

  const handlePastePreview = () => {
    if (!csvText.trim()) {
      setText("Please paste CSV data first");
      setFailModal(true);
      return;
    }
    try {
      const rows = parseCSV(csvText);
      setParsed(rows);
      setPreview(rows.slice(0, 3));
      setText(`${rows.length} tickets ready to import`);
      setSuccessModal(true);
    } catch (e) {
      setText(`${e.message}`);
      setFailModal(true);
    }
  };

  const handleImport = async () => {
    if (!data.event) {
      setText("Please select an event first");
      setFailModal(true);
      return;
    }
    if (!data.ticket) {
      setText("Please select a ticket type first");
      setFailModal(true);
      return;
    }
    if (parsed.length === 0) {
      setText("No tickets to import. Paste or upload CSV first.");
      setFailModal(true);
      return;
    }

    setLoading(true);
    try {
      const ticketsWithEvent = parsed.map((t) => ({
        ...t,
        event: data.event,
        ticket: data.ticket,
        Ticket_Status: true,
        Seller_Id: user,
      }));
      console.log("data", ticketsWithEvent);
      const resp = await globalApi.bulkCreateTickets(ticketsWithEvent);
      if (resp.ok) {
        setText(
          `✅ ${resp.data.created} tickets created\n❌ ${resp.data.failed} failed`,
        );
        setSuccessModal(true);
        setCsvText("");
        setParsed([]);
        setPreview([]);
      } else {
        setText("Import failed. Please try again.");
        setFailModal(true);
      }
    } catch (e) {
      setText(`${e.message}`);
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View>
      {activeTab === "bulk" && (
        <>
          {data.event ? (
            <View>
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
              </View>
              <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
                Bulk Ticket Import
              </Text>
              <Text style={tw`text-gray-400 text-xs mb-4`}>
                Import multiple tickets from CSV data
              </Text>
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                  Ticket Type <Text style={tw`text-red-500`}>*</Text>
                </Text>
                {!data.event ? (
                  <Text style={tw`text-sm text-gray-400 mt-1 mb-1`}>
                    Select an event first
                  </Text>
                ) : (
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
                )}
              </View>

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
                    <Ionicons
                      name="document-outline"
                      size={16}
                      color="#374151"
                    />
                    <Text style={tw`text-sm text-gray-700 font-medium ml-1`}>
                      Download Template
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={tw`border-t border-gray-100 pt-3`}>
                  <Text style={tw`text-xs text-gray-400 leading-5`}>
                    Required columns: Name, Email, Phone, Payment, Agent,
                    SeatNo, Note, Ticket_Id {"\n"}
                    Email (optional), Phone (optional), Agent (optional), Note
                    (optional)
                  </Text>
                </View>
              </View>

              {/* Upload CSV File Button */}
              <TouchableOpacity
                onPress={handlePickFile}
                style={tw`flex-row items-center justify-center border border-dashed border-indigo-400 rounded-2xl py-4 mb-5`}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#6366F1"
                />
                <Text style={tw`text-indigo-600 font-semibold text-sm ml-2`}>
                  Upload CSV File
                </Text>
              </TouchableOpacity>

              {/* Paste CSV Data */}
              {/* <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
            Paste CSV Data
          </Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder={`Name,Email,Phone,Payment,Agent,SeatNo,Note,Ticket_Id\nJohn Doe,john@example.com,+1 555-0100,Cash,AgentName,A1,VIP Guest,TK001`}
            placeholderTextColor="#9CA3AF"
            value={csvText}
            onChangeText={setCsvText}
            style={tw`border border-gray-200 rounded-2xl px-4 py-3 text-xs text-gray-600 mb-3 h-28`}
            textAlignVertical="top"
          /> */}

              {/* Preview Button */}
              <TouchableOpacity
                onPress={handlePastePreview}
                style={tw`border border-gray-300 rounded-xl py-3 items-center mb-4`}
              >
                <Text style={tw`text-gray-700 font-semibold text-sm`}>
                  Preview{" "}
                  {parsed.length > 0 ? `(${parsed.length} tickets)` : ""}
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
          ) : (
            <Text style={tw`text-sm text-gray-400 mt-2 mb-1 text-center`}>
              Select an event first
            </Text>
          )}
        </>
      )}
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
    </View>
  );
}

// Phone Camera Scan
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
