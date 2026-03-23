import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useContext, useState } from "react";
import { SaleTicket } from "../Configs/AuthContext";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import globalApi from "../Configs/globalApi";
import PopUpAlert from "./PopUpAlert";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

const STANDARD_TEMPLATE_COLUMNS = Object.freeze([
  "Name",
  "Email",
  "Phone",
  "Payment",
  "Agent",
  "Note",
  "Ticket_Id",
]);
const LIMITED_TEMPLATE_COLUMNS = Object.freeze([
  ...STANDARD_TEMPLATE_COLUMNS,
  "SeatNo",
]);

async function saveCsvFile(fileName, content) {
  if (Platform.OS === "android") {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
        FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download"),
      );

    if (!permissions.granted) {
      throw new Error("Storage permission was not granted.");
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      "text/csv",
    );

    await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return;
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error("Cache directory is not available on this device.");
  }

  const tempUri = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(tempUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(tempUri, {
    mimeType: "text/csv",
    dialogTitle: "Save CSV File",
    UTI: "public.comma-separated-values-text",
  });

  await FileSystem.deleteAsync(tempUri, { idempotent: true });
}

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

function getTemplateColumns(isLimited) {
  return isLimited ? LIMITED_TEMPLATE_COLUMNS : STANDARD_TEMPLATE_COLUMNS;
}

function splitCsvLine(line) {
  return line.split(",").map((value) => value.trim());
}

function formatColumns(columns) {
  return columns.join(",");
}

function normalizeImportValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAgentName(value) {
  return normalizeImportValue(value).toLowerCase();
}

function buildAgentLookup(agents) {
  const agentLookup = new Map();

  for (const agent of agents ?? []) {
    const normalizedName = normalizeAgentName(agent?.Name);
    if (!normalizedName) continue;

    const matches = agentLookup.get(normalizedName) ?? [];
    matches.push(agent);
    agentLookup.set(normalizedName, matches);
  }

  return agentLookup;
}

function prepareSectionsForImport(sections, agents) {
  const errors = [];
  const ticketIdLines = new Map();
  const agentLookup = buildAgentLookup(agents);

  const normalizedSections = sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => {
      const normalizedTicketId = normalizeImportValue(row.Ticket_Id);
      const ticketIdLineNumbers = ticketIdLines.get(normalizedTicketId) ?? [];
      ticketIdLineNumbers.push(row._lineNumber);
      ticketIdLines.set(normalizedTicketId, ticketIdLineNumbers);

      const normalizedAgentLabel = normalizeImportValue(row.Agent);
      const matchingAgents = normalizedAgentLabel
        ? (agentLookup.get(normalizeAgentName(normalizedAgentLabel)) ?? [])
        : [];
      let agentDocumentId = null;

      if (normalizedAgentLabel && matchingAgents.length === 0) {
        errors.push(
          `Line ${row._lineNumber}: Agent "${normalizedAgentLabel}" does not match any existing agent.`,
        );
      } else if (normalizedAgentLabel && matchingAgents.length > 1) {
        errors.push(
          `Line ${row._lineNumber}: Agent "${normalizedAgentLabel}" matches multiple agents. Use a unique agent name.`,
        );
      } else if (normalizedAgentLabel) {
        agentDocumentId = matchingAgents[0]?.documentId ?? null;
      }

      return {
        ...row,
        Agent: normalizedAgentLabel,
        Ticket_Id: normalizedTicketId,
        agent: agentDocumentId,
      };
    }),
  }));

  for (const [ticketId, lineNumbers] of ticketIdLines.entries()) {
    if (ticketId && lineNumbers.length > 1) {
      errors.push(
        `Ticket_Id "${ticketId}" is duplicated in the file on lines ${lineNumbers.join(", ")}.`,
      );
    }
  }

  return {
    sections: normalizedSections,
    errors,
  };
}

function getImportFailureMessage(response) {
  const defaultMessage = "Import failed. Please try again.";
  const backendError = response?.data?.error;

  if (!backendError) {
    return defaultMessage;
  }

  const details = backendError.details ?? {};
  const detailLines = [];

  if (
    Array.isArray(details.duplicateIdsInPayload) &&
    details.duplicateIdsInPayload.length > 0
  ) {
    detailLines.push(
      `Duplicate Ticket_Id in file: ${details.duplicateIdsInPayload.join(", ")}`,
    );
  }

  if (
    Array.isArray(details.existingTicketIds) &&
    details.existingTicketIds.length > 0
  ) {
    detailLines.push(
      `Ticket_Id already exists: ${details.existingTicketIds.join(", ")}`,
    );
  }

  if (
    Array.isArray(details.missingAgentNames) &&
    details.missingAgentNames.length > 0
  ) {
    detailLines.push(
      `Unknown agent names: ${details.missingAgentNames.join(", ")}`,
    );
  }

  if (
    Array.isArray(details.ambiguousAgentNames) &&
    details.ambiguousAgentNames.length > 0
  ) {
    detailLines.push(
      `Ambiguous agent names: ${details.ambiguousAgentNames.join(", ")}`,
    );
  }

  return [backendError.message || defaultMessage, ...detailLines].join("\n");
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
    const columns = getTemplateColumns(isLimited);

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
 * Returns { sections: { ticketName: string, rows: object[] }[], errors: string[] }
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
function parseSectionedCSV(text, avariableTicketType, ticketLimit) {
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((l) => l.trimEnd());
  const expectedSections = new Map(
    (avariableTicketType ?? []).map((ticket) => {
      const { isLimited } = getLimitInfo(ticket.documentId, ticketLimit);
      return [
        ticket.Name.toLowerCase(),
        {
          ticketName: ticket.Name,
          headers: getTemplateColumns(isLimited),
        },
      ];
    }),
  );
  const sections = [];
  const errors = [];
  const seenSections = new Set();
  let currentSection = null;

  const finalizeSection = () => {
    if (!currentSection) return;

    if (!currentSection.hasHeader) {
      errors.push(
        `Line ${currentSection.lineNumber}: Section "${currentSection.ticketName}" is missing its header row.`,
      );
    }

    sections.push({
      ticketName: currentSection.ticketName,
      rows: currentSection.rows,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    // Detect ### SectionName ### marker
    const sectionMatch = line.match(/^###\s*(.+?)\s*###$/);
    if (sectionMatch) {
      finalizeSection();

      const ticketName = sectionMatch[1].trim();
      const ticketKey = ticketName.toLowerCase();
      const expectedSection = expectedSections.get(ticketKey);

      if (!expectedSection) {
        errors.push(
          `Line ${lineNumber}: Section "${ticketName}" does not match any ticket type for this event.`,
        );
      }

      if (seenSections.has(ticketKey)) {
        errors.push(
          `Line ${lineNumber}: Section "${ticketName}" appears more than once. Use one section per ticket type.`,
        );
      }

      seenSections.add(ticketKey);
      currentSection = {
        ticketName,
        lineNumber,
        rows: [],
        hasHeader: false,
        hasValidHeader: false,
        expectedHeaders: expectedSection?.headers ?? null,
      };
      continue;
    }

    if (!currentSection) {
      errors.push(
        `Line ${lineNumber}: Content must be inside a "### TicketType ###" section.`,
      );
      continue;
    }

    // First non-empty line after section marker = column headers
    if (!currentSection.hasHeader) {
      currentSection.hasHeader = true;

      const headers = splitCsvLine(line);
      const expectedHeaders = currentSection.expectedHeaders;

      if (!expectedHeaders) {
        continue;
      }

      const isExactMatch =
        headers.length === expectedHeaders.length &&
        headers.every((header, idx) => header === expectedHeaders[idx]);

      if (!isExactMatch) {
        errors.push(
          `Line ${lineNumber}: Section "${currentSection.ticketName}" header must be exactly "${formatColumns(expectedHeaders)}". Received "${formatColumns(headers)}".`,
        );
        continue;
      }

      currentSection.hasValidHeader = true;
      continue;
    }

    if (!currentSection.hasValidHeader) {
      continue;
    }

    const values = splitCsvLine(line);
    if (values.every((v) => !v)) continue;

    if (values.length !== currentSection.expectedHeaders.length) {
      errors.push(
        `Line ${lineNumber}: Section "${currentSection.ticketName}" row must contain ${currentSection.expectedHeaders.length} columns. Received ${values.length}.`,
      );
      continue;
    }

    const row = {};
    currentSection.expectedHeaders.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : "";
    });

    if (!row.Name) {
      errors.push(
        `Line ${lineNumber}: Section "${currentSection.ticketName}" requires Name for every row.`,
      );
    }

    if (!row.Ticket_Id) {
      errors.push(
        `Line ${lineNumber}: Section "${currentSection.ticketName}" requires Ticket_Id for every row.`,
      );
    }

    if (!row.Name || !row.Ticket_Id) {
      continue;
    }

    currentSection.rows.push({
      Name: row.Name,
      Email: row.Email || null,
      Phone: row.Phone || "",
      Payment: row.Payment || "Cash",
      Agent: row.Agent || "",
      Note: row.Note || "",
      Ticket_Id: row.Ticket_Id || null,
      SeatNo: row.SeatNo || "",
      _lineNumber: lineNumber,
      Ticket_Status: true, // always true, never from CSV
    });
  }

  finalizeSection();

  return { sections, errors };
}

/**
 * Validate all sections against ticketLimit and bookedTickets.
 * Returns { valid: bool, exceededMessages: string[] }
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

  for (const section of sections) {
    const ticketType = (avariableTicketType ?? []).find(
      (t) => t.Name.toLowerCase() === section.ticketName.toLowerCase(),
    );

    if (!ticketType) continue;

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
    agents,
    refreshEventInventory,
  } = useContext(SaleTicket);

  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]); // parsed sections from uploaded CSV
  const [preview, setPreview] = useState([]); // first 3 rows across all sections
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [text, setText] = useState("");

  const clearLoadedData = () => {
    setSections([]);
    setPreview([]);
  };

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

  const saveToDownloads = async (fileName, content) => {
    await saveCsvFile(fileName, content);
  };

  // ── Download Template ──────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      if (!avariableTicketType || (avariableTicketType ?? []).length === 0) {
        setText("No ticket types available for this event.");
        setFailModal(true);
        return;
      }

      const csvContent = buildTemplateCSV(avariableTicketType, ticketLimit);
      const eventName = getEventName();
      const fileName = `${eventName}_template.csv`;

      await saveToDownloads(fileName, csvContent);

      setText(
        Platform.OS === "android"
          ? `"${fileName}" saved successfully.`
          : `"${fileName}" is ready to share.`,
      );
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
        clearLoadedData();
        setText("File is empty.");
        setFailModal(true);
        return;
      }

      const { sections: parsedSections, errors } = parseSectionedCSV(
        content,
        avariableTicketType,
        ticketLimit,
      );

      if (errors.length > 0) {
        clearLoadedData();
        setText(
          "Import blocked. File must match the template exactly:\n\n" +
            errors.join("\n"),
        );
        setFailModal(true);
        return;
      }

      if (parsedSections.length === 0) {
        clearLoadedData();
        setText(
          'No valid sections found. Make sure the file uses "### TicketType ###" section headers.',
        );
        setFailModal(true);
        return;
      }

      clearLoadedData();
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
      clearLoadedData();
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

    const { sections: preparedSections, errors: rowErrors } =
      prepareSectionsForImport(sections, agents);

    if (rowErrors.length > 0) {
      setText(
        "Import blocked. Please fix the following issues and re-upload:\n\n" +
          rowErrors.join("\n"),
      );
      setFailModal(true);
      return;
    }

    const latestInventory = refreshEventInventory
      ? await refreshEventInventory(data.event, data.ticket)
      : null;

    // Step 1: Validate all sections against limits
    const { valid, exceededMessages } = validateSections(
      preparedSections,
      avariableTicketType,
      latestInventory?.ticketLimit ?? ticketLimit,
      latestInventory?.bookedTickets ?? bookedTickets,
    );

    // If any section exceeded — block entire import
    if (!valid) {
      const warningText =
        "⛔ Import blocked! Please fix the following issues and re-upload:\n\n" +
        exceededMessages.join("\n");
      setText(warningText);
      setFailModal(true);
      return;
    }

    // Step 2: Flatten all sections into one import payload
    const ticketsToImport = [];

    for (const section of preparedSections) {
      const ticketType = (avariableTicketType ?? []).find(
        (t) => t.Name.toLowerCase() === section.ticketName.toLowerCase(),
      );

      if (!ticketType) continue; // already warned above

      const rowsWithMeta = section.rows.map((row) => {
        const { _lineNumber, ...ticketRow } = row;

        return {
          ...ticketRow,
          event: data.event,
          ticket: ticketType.documentId,
          agent: row.agent ?? null,
          Ticket_Status: true,
          Seller_Id: user,
        };
      });

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
        await refreshEventInventory?.(data.event, data.ticket);
        setText(
          `✅ ${resp.data.created} tickets created\n❌ ${resp.data.failed} failed`,
        );
        setSuccessModal(true);
        clearLoadedData();
      } else {
        setText(getImportFailureMessage(resp));
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
                    {"• Name and Ticket_Id are required on every row\n"}
                    {"• Agent must match an existing agent name when provided\n"}
                    {"• Headers must match the template exactly"}
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
                  {(preview ?? []).length > 0 && (
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
