import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useContext, useState } from "react";
import { SaleTicket } from "../Configs/AuthContext";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import globalApi from "../Configs/globalApi";
import PopUpAlert from "./PopUpAlert";
import * as MediaLibrary from "expo-media-library";

/**
 * Get limit info for a ticket type from ticketLimit array.
 * Returns { isLimited: bool, limit: number|null }
 */
function getLimitInfo(ticketDocumentId, ticketLimit) {
  const found = (ticketLimit ?? []).find(
    (tl) => tl.ticket?.documentId === ticketDocumentId,
  );
  if (!found) return { isLimited: false, limit: null };
  return { isLimited: found.isLimited, limit: found.Limit };
}

/**
 * Count already booked tickets for a specific ticket type.
 */
function countBooked(ticketDocumentId, bookedTickets) {
  return (bookedTickets ?? []).filter(
    (bt) => bt.ticket?.documentId === ticketDocumentId,
  ).length;
}

/**
 * Build CSV template string with ### SectionName ### separators.
 * All ticket types columns: Name, Email, Phone, Payment, Agent, Note, Ticket_Id
 * Limited ticket types (isLimited: true) also get: SeatNo
 * Ticket_Status is NOT included — always set to true on import.
 */
function buildTemplateCSV(avariableTicketType, ticketLimit) {
  const sections = (avariableTicketType ?? []).map((ticket) => {
    const { isLimited } = getLimitInfo(ticket.documentId, ticketLimit);

    const columns = isLimited
      ? [
          "Name",
          "Email",
          "Phone",
          "Payment",
          "Agent",
          "Note",
          "Ticket_Id",
          "SeatNo",
        ]
      : ["Name", "Email", "Phone", "Payment", "Agent", "Note", "Ticket_Id"];

    const exampleRow = isLimited
      ? [
          "John Doe",
          "john@example.com",
          "+1 555-0100",
          "Cash",
          "AgentName",
          "Sample Note",
          "TK001",
          "A1",
        ]
      : [
          "John Doe",
          "john@example.com",
          "+1 555-0100",
          "Cash",
          "AgentName",
          "Sample Note",
          "TK001",
        ];

    return [
      `### ${ticket.Name} ###`,
      columns.join(","),
      exampleRow.join(","),
    ].join("\n");
  });

  return sections.join("\n\n");
}

/**
 * Parse a section-separated CSV text.
 * Returns array of { ticketName: string, rows: object[] }
 *
 * Expected format:
 *   ### Normal ###
 *   Name,Email,Phone,Payment,Agent,Note,Ticket_Id
 *   John Doe,john@example.com,...
 *
 *   ### VIP ###
 *   Name,Email,Phone,Payment,Agent,Note,Ticket_Id,SeatNo
 *   Jane Smith,...
 */
function parseSectionedCSV(text) {
  const lines = text.split("\n").map((l) => l.trimEnd());
  const sections = [];
  let currentSection = null;
  let currentHeaders = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect ### SectionName ### marker
    const sectionMatch = line.match(/^###\s*(.+?)\s*###$/);
    if (sectionMatch) {
      if (currentSection) sections.push(currentSection);
      currentSection = { ticketName: sectionMatch[1].trim(), rows: [] };
      currentHeaders = null;
      continue;
    }

    if (!currentSection) continue;

    // First non-empty line after section marker = column headers
    if (!currentHeaders) {
      currentHeaders = line.split(",").map((h) => h.trim().toLowerCase());
      continue;
    }

    // Data rows — skip if all values are empty
    const values = line.split(",").map((v) => v.trim());
    if (values.every((v) => !v)) continue;

    const row = {};
    currentHeaders.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : "";
    });

    currentSection.rows.push({
      Name: row["name"] || "",
      Email: row["email"] || null,
      Phone: row["phone"] || "",
      Payment: row["payment"] || "Cash",
      Agent: row["agent"] || "",
      Note: row["note"] || "",
      Ticket_Id: row["ticket_id"] || null,
      SeatNo: row["seatno"] || "",
      Ticket_Status: true, // always true, never from CSV
    });
  }

  // Push the last section
  if (currentSection) sections.push(currentSection);

  return sections;
}

/**
 * Validate all sections against ticketLimit and bookedTickets.
 * Returns { valid: bool, exceededMessages: string[], skippedMessages: string[] }
 * If ANY section exceeds its limit → valid = false → block entire import.
 * Unlimited ticket types (isLimited: false) are always valid.
 */
function validateSections(
  sections,
  avariableTicketType,
  ticketLimit,
  bookedTickets,
) {
  const exceededMessages = [];
  const skippedMessages = [];

  for (const section of sections) {
    const ticketType = (avariableTicketType ?? []).find(
      (t) => t.Name.toLowerCase() === section.ticketName.toLowerCase(),
    );

    if (!ticketType) {
      skippedMessages.push(
        `⚠️ "${section.ticketName}" does not match any ticket type and will be skipped.`,
      );
      continue;
    }

    const { isLimited, limit } = getLimitInfo(
      ticketType.documentId,
      ticketLimit,
    );

    // Unlimited — no cap, skip validation
    if (!isLimited || limit === null) continue;

    const alreadyBooked = countBooked(ticketType.documentId, bookedTickets);
    const available = limit - alreadyBooked;
    const incoming = section.rows.length;

    if (incoming > available) {
      const exceeded = incoming - available;
      exceededMessages.push(
        `❌ ${section.ticketName}: ${incoming} tickets in file, only ${available} available (${exceeded} ticket${exceeded > 1 ? "s" : ""} exceeded)`,
      );
    }
  }

  return {
    valid: exceededMessages.length === 0,
    exceededMessages,
    skippedMessages,
  };
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function BulkUpload() {
  const {
    activeTab,
    data,
    avariableTicketType,
    soldOut,
    user,
    bookedTickets,
    ticketLimit,
    events, // used to get event name for CSV filename
  } = useContext(SaleTicket);

  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]); // parsed sections from uploaded CSV
  const [preview, setPreview] = useState([]); // first 3 rows across all sections
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [text, setText] = useState("");

  // ── Get current event name for filename ───────────────────
  const getEventName = () => {
    if (!data.event || !events) return "ticket_template";
    const event = events.find((e) => e.documentId === data.event);
    if (!event) return "ticket_template";
    // Sanitize event name for use as filename (remove special chars)
    return event.Name.replace(/[^a-zA-Z0-9_\- ]/g, "")
      .trim()
      .replace(/ /g, "_");
  };

  // ── Download Template ──────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      if (!avariableTicketType || avariableTicketType.length === 0) {
        setText("No ticket types available for this event.");
        setFailModal(true);
        return;
      }

      const csvContent = buildTemplateCSV(avariableTicketType, ticketLimit);
      const eventName = getEventName();
      const fileName = `${eventName}_template.csv`;

      // Request media library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        setText("Permission denied. Cannot save to Downloads.");
        setFailModal(true);
        return;
      }

      // Write to app cache directory first
      const tempUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(tempUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Save from cache to device Downloads via MediaLibrary
      const asset = await MediaLibrary.createAssetAsync(tempUri);
      const album = await MediaLibrary.getAlbumAsync("Download");

      if (album == null) {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      // Clean up temp file
      await FileSystem.deleteAsync(tempUri, { idempotent: true });

      setText(`✅ "${fileName}" saved to Downloads!`);
      setSuccessModal(true);
    } catch (e) {
      console.error("Template download error:", e);
      setText("Could not save template: " + e.message);
      setFailModal(true);
    }
  };

  // ── Pick & Parse File ──────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      console.log("Picked file:", file);

      let content = "";
      try {
        content = await FileSystem.readAsStringAsync(file.uri);
      } catch (readErr) {
        // Fallback for some Android devices
        const destUri = FileSystem.cacheDirectory + "temp_upload.csv";
        await FileSystem.copyAsync({ from: file.uri, to: destUri });
        content = await FileSystem.readAsStringAsync(destUri);
      }

      console.log("File content:", content);

      if (!content || content.trim() === "") {
        setText("File is empty.");
        setFailModal(true);
        return;
      }

      const parsedSections = parseSectionedCSV(content);

      if (parsedSections.length === 0) {
        setText(
          'No valid sections found. Make sure the file uses "### TicketType ###" section headers.',
        );
        setFailModal(true);
        return;
      }

      setSections(parsedSections);

      // Build flat preview — first 3 rows across all sections
      const allRows = parsedSections.flatMap((s) =>
        s.rows.map((r) => ({ ...r, _sectionName: s.ticketName })),
      );
      setPreview(allRows.slice(0, 3));

      const totalRows = parsedSections.reduce(
        (sum, s) => sum + s.rows.length,
        0,
      );
      const sectionSummary = parsedSections
        .map((s) => `${s.ticketName}: ${s.rows.length}`)
        .join(", ");

      setText(`${totalRows} tickets loaded\n${sectionSummary}`);
      setSuccessModal(true);
    } catch (e) {
      console.error("File pick error:", e);
      setText(e.message);
      setFailModal(true);
    }
  };

  // ── Import ─────────────────────────────────────────────────
  const handleImport = async () => {
    if (!data.event) {
      setText("Please select an event first.");
      setFailModal(true);
      return;
    }

    if (sections.length === 0) {
      setText("No tickets to import. Please upload a CSV file first.");
      setFailModal(true);
      return;
    }

    // Step 1: Validate all sections against limits
    const { valid, exceededMessages, skippedMessages } = validateSections(
      sections,
      avariableTicketType,
      ticketLimit,
      bookedTickets,
    );

    // If any section exceeded — block entire import
    if (!valid) {
      const warningText =
        "⛔ Import blocked! Please fix the following issues and re-upload:\n\n" +
        exceededMessages.join("\n") +
        (skippedMessages.length > 0 ? "\n\n" + skippedMessages.join("\n") : "");
      setText(warningText);
      setFailModal(true);
      return;
    }

    // Log skipped sections (unmatched) — not a blocker
    if (skippedMessages.length > 0) {
      console.warn("Skipped sections:", skippedMessages);
    }

    // Step 2: Flatten all sections into one import payload
    const ticketsToImport = [];

    for (const section of sections) {
      const ticketType = (avariableTicketType ?? []).find(
        (t) => t.Name.toLowerCase() === section.ticketName.toLowerCase(),
      );

      if (!ticketType) continue; // already warned above

      const rowsWithMeta = section.rows.map((row) => ({
        ...row,
        event: data.event,
        ticket: ticketType.documentId,
        Ticket_Status: true,
        Seller_Id: user,
      }));

      ticketsToImport.push(...rowsWithMeta);
    }

    if (ticketsToImport.length === 0) {
      setText("No valid tickets to import after matching sections.");
      setFailModal(true);
      return;
    }

    console.log("Importing tickets:", ticketsToImport);

    // Step 3: Send bulk import
    setLoading(true);
    try {
      const resp = await globalApi.bulkCreateTickets(ticketsToImport);
      if (resp.ok) {
        setText(
          `✅ ${resp.data.created} tickets created\n❌ ${resp.data.failed} failed`,
        );
        setSuccessModal(true);
        setSections([]);
        setPreview([]);
      } else {
        setText("Import failed. Please try again.");
        setFailModal(true);
      }
    } catch (e) {
      console.error("Import error:", e);
      setText(e.message);
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <View>
      {activeTab === "bulk" && (
        <>
          {data.event ? (
            <View>
              {/* Sold Out Banner */}
              {soldOut && (
                <Text
                  style={tw`text-4 font-bold text-red-500 mb-5 text-center`}
                >
                  Ticket Sold Out
                </Text>
              )}

              <Text style={tw`text-base font-bold text-gray-900 mb-1`}>
                Bulk Ticket Import
              </Text>
              <Text style={tw`text-gray-400 text-xs mb-4`}>
                Import multiple tickets from a section-separated CSV file
              </Text>

              {/* CSV Format Info Card */}
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
                    {"• One section per ticket type, e.g. ### Normal ###\n"}
                    {
                      "• Columns: Name, Email, Phone, Payment, Agent, Note, Ticket_Id\n"
                    }
                    {"• Limited ticket types also include: SeatNo\n"}
                    {"• Email, Phone, Agent, Note are optional"}
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

              {/* Loaded Sections Summary */}
              {sections.length > 0 && (
                <View style={tw`border border-gray-200 rounded-2xl p-4 mb-4`}>
                  <Text style={tw`text-sm font-bold text-gray-900 mb-3`}>
                    Loaded Sections
                  </Text>

                  {sections.map((section, i) => {
                    const ticketType = (avariableTicketType ?? []).find(
                      (t) =>
                        t.Name.toLowerCase() ===
                        section.ticketName.toLowerCase(),
                    );
                    const { isLimited, limit } = ticketType
                      ? getLimitInfo(ticketType.documentId, ticketLimit)
                      : { isLimited: false, limit: null };
                    const booked = ticketType
                      ? countBooked(ticketType.documentId, bookedTickets)
                      : 0;
                    const available =
                      isLimited && limit !== null ? limit - booked : null;
                    const exceeded =
                      available !== null && section.rows.length > available;

                    return (
                      <View
                        key={i}
                        style={tw`flex-row justify-between items-center py-2 border-b border-gray-100`}
                      >
                        <View style={tw`flex-row items-center`}>
                          <Ionicons
                            name={
                              exceeded
                                ? "warning-outline"
                                : "checkmark-circle-outline"
                            }
                            size={14}
                            color={exceeded ? "#EF4444" : "#10B981"}
                            style={tw`mr-1`}
                          />
                          <Text
                            style={tw`text-xs font-semibold ${
                              exceeded ? "text-red-500" : "text-gray-800"
                            }`}
                          >
                            {section.ticketName}
                          </Text>
                        </View>
                        <Text
                          style={tw`text-xs ${
                            exceeded ? "text-red-400" : "text-gray-400"
                          }`}
                        >
                          {section.rows.length} rows /{" "}
                          {available !== null
                            ? `${available} available`
                            : "unlimited"}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Preview — first 3 rows across all sections */}
                  {preview.length > 0 && (
                    <>
                      <Text
                        style={tw`text-xs font-bold text-gray-700 mt-4 mb-2`}
                      >
                        Preview
                      </Text>
                      {preview.map((row, i) => (
                        <View key={i} style={tw`flex-row justify-between py-1`}>
                          <Text style={tw`text-xs text-gray-500`}>
                            [{row._sectionName}]{"  "}
                            <Text style={tw`font-medium text-gray-800`}>
                              {row.Name}
                            </Text>
                          </Text>
                          <Text style={tw`text-xs text-gray-400`}>
                            {row.Email}
                          </Text>
                        </View>
                      ))}
                      {sections.reduce((sum, s) => sum + s.rows.length, 0) >
                        3 && (
                        <Text
                          style={tw`text-xs text-gray-400 text-center mt-2`}
                        >
                          +
                          {sections.reduce((sum, s) => sum + s.rows.length, 0) -
                            3}{" "}
                          more tickets
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Import Button */}
              <TouchableOpacity
                onPress={handleImport}
                disabled={loading}
                style={tw`bg-indigo-600 rounded-xl py-4 flex-row items-center justify-center mb-15 ${
                  loading ? "opacity-60" : ""
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color="white" />
                    <Text style={tw`text-white font-bold text-sm ml-2`}>
                      Import Tickets
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

      {/* Modals */}
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
