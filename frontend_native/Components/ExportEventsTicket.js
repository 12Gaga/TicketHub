import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { useContext, useEffect, useState } from "react";
import { ExportContext } from "../Configs/AuthContext";

const PREVIEW_BATCH_SIZE = 100;

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSortIcon(sortDirection, isActive) {
  if (!isActive) return "swap-vertical-outline";
  return sortDirection === "asc" ? "arrow-up-outline" : "arrow-down-outline";
}

export default function ExportEventsTicket() {
  const [visibleCount, setVisibleCount] = useState(PREVIEW_BATCH_SIZE);
  const {
    data,
    changeEvent,
    events,
    avariableTicketType,
    setSelectedTicketName,
    setData,
    handleSearch,
    canSearch,
    SummaryCard,
    loading,
    bookedTickets,
    sortedBookedTickets,
    sortConfig,
    toggleSort,
    checkedInCount,
    notCheckedInCount,
    selectedEventName,
    selectedTicketName,
    handleExportCSV,
    exporting,
    StatusBadge,
  } = useContext(ExportContext);

  useEffect(() => {
    setVisibleCount(PREVIEW_BATCH_SIZE);
  }, [bookedTickets]);

  const tableColumns = [
    {
      key: "no",
      label: "No",
      width: 60,
      lines: 1,
      textStyle: tw`text-center`,
      getValue: (_, index) => index + 1,
    },
    {
      key: "ticketId",
      label: "Ticket ID",
      width: 120,
      lines: 1,
      getValue: (ticket) => ticket.Ticket_Id ?? "—",
    },
    {
      key: "name",
      label: "Name",
      width: 150,
      lines: 1,
      sortable: true,
      getValue: (ticket) => ticket.Name ?? "—",
    },
    {
      key: "email",
      label: "Email",
      width: 220,
      lines: 1,
      getValue: (ticket) => ticket.Email ?? "—",
    },
    {
      key: "phone",
      label: "Phone",
      width: 140,
      lines: 1,
      getValue: (ticket) => ticket.Phone ?? "—",
    },
    {
      key: "event",
      label: "Event",
      width: 180,
      lines: 2,
      getValue: (ticket) => ticket.event?.Name ?? "—",
    },
    {
      key: "ticketType",
      label: "Ticket Type",
      width: 150,
      lines: 2,
      getValue: (ticket) => ticket.ticket?.Name ?? "—",
    },
    {
      key: "seatNo",
      label: "Seat No",
      width: 90,
      lines: 1,
      textStyle: tw`text-center`,
      getValue: (ticket) => ticket.SeatNo ?? "—",
    },
    {
      key: "payment",
      label: "Payment",
      width: 120,
      lines: 1,
      textStyle: tw`text-center`,
      getValue: (ticket) => ticket.Payment ?? "—",
    },
    {
      key: "agent",
      label: "Agent",
      width: 150,
      lines: 1,
      sortable: true,
      getValue: (ticket) => ticket.Agent ?? ticket.agent?.Name ?? "—",
    },
    {
      key: "checkIn",
      label: "Check-In",
      width: 110,
      render: (ticket) => <StatusBadge checked={ticket.CheckIn_Status} />,
    },
    {
      key: "note",
      label: "Note",
      width: 220,
      lines: 2,
      getValue: (ticket) => ticket.Note ?? "—",
    },
    {
      key: "bookedAt",
      label: "Booked At",
      width: 150,
      lines: 2,
      sortable: true,
      getValue: (ticket) => formatDate(ticket.createdAt),
    },
  ];

  const tableMinWidth = tableColumns.reduce(
    (total, column) => total + column.width,
    0,
  );
  const previewTickets = sortedBookedTickets ?? [];
  const visibleTickets = previewTickets.slice(0, visibleCount);
  const remainingTickets = previewTickets.length - visibleTickets.length;
  const hasMoreTickets = visibleTickets.length < previewTickets.length;

  return (
    <View>
      {/* ── Page Title ── */}
      <Text style={tw`text-2xl font-bold text-gray-900 mb-1`}>
        Ticket Report
      </Text>
      <Text style={tw`text-sm text-gray-400 mb-5`}>
        Search and export booked ticket data
      </Text>

      {/* ── Filter Card ── */}
      <View
        style={[
          tw`bg-white rounded-2xl p-4 mb-5 border border-gray-100`,
          { elevation: 2 },
        ]}
      >
        {/* Export Limit Note */}
        <View
          style={tw`flex-row items-start bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6`}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#D97706"
            style={tw`mt-0.5 mr-2`}
          />
          <Text style={tw`text-xs text-yellow-700 flex-1 leading-5`}>
            Note: This export supports up to 200,000 tickets at a time. If your
            total sold tickets exceed 200,000, please contact your administrator
            to export in batches.
          </Text>
        </View>
        {/* Event Picker */}
        <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
          Event <Text style={tw`text-red-500`}>*</Text>
        </Text>
        <View
          style={tw`border border-gray-200 rounded-xl bg-gray-50 overflow-hidden flex-row items-center px-3 mb-4`}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color="#6366F1"
            style={tw`mr-2`}
          />
          <Picker
            selectedValue={data.event}
            onValueChange={(val) => changeEvent(val)}
            style={tw`flex-1 h-13 text-sm text-gray-700`}
          >
            <Picker.Item label="Select an event" value={null} color="#9CA3AF" />
            {(events ?? []).map((event) => (
              <Picker.Item
                key={event.documentId}
                label={event.Name}
                value={event.documentId}
                color="#111827"
              />
            ))}
          </Picker>
        </View>

        {/* Ticket Type Picker */}
        <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
          Ticket Type <Text style={tw`text-red-500`}>*</Text>
        </Text>
        {!data.event ? (
          <View
            style={tw`border border-dashed border-gray-200 rounded-xl px-4 py-3 mb-4`}
          >
            <Text style={tw`text-sm text-gray-400`}>Select an event first</Text>
          </View>
        ) : (
          <View
            style={tw`border border-gray-200 rounded-xl bg-gray-50 overflow-hidden flex-row items-center px-3 mb-4`}
          >
            <Ionicons
              name="ticket-outline"
              size={16}
              color="#6366F1"
              style={tw`mr-2`}
            />
            <Picker
              selectedValue={data.ticket}
              onValueChange={(val) => {
                const t = avariableTicketType.find(
                  (tk) => tk.documentId === val,
                );
                setSelectedTicketName(t?.Name ?? "");
                setData({ ...data, ticket: val });
              }}
              style={tw`flex-1 h-13 text-sm text-gray-700`}
            >
              <Picker.Item
                label="Select ticket type"
                value={null}
                color="#9CA3AF"
              />
              <Picker.Item label="All" value="123" color="#111827" />
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

        {/* Search Button */}
        <TouchableOpacity
          style={[
            tw`rounded-xl py-4 flex-row items-center justify-center`,
            { backgroundColor: canSearch ? "#4F46E5" : "#E5E7EB" },
          ]}
          onPress={handleSearch}
          disabled={!canSearch || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name="search-outline"
                size={16}
                color={canSearch ? "#fff" : "#9CA3AF"}
              />
              <Text
                style={[
                  tw`font-bold text-sm ml-2`,
                  { color: canSearch ? "#fff" : "#9CA3AF" },
                ]}
              >
                Search
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Results ── */}
      {(bookedTickets ?? []).length > 0 && (
        <>
          {/* Summary */}
          <SummaryCard
            total={(bookedTickets ?? []).length}
            checkedIn={checkedInCount}
            notCheckedIn={notCheckedInCount}
          />

          {/* Table Header Label */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={tw`text-base font-bold text-gray-900`}>
              Results{" "}
              <Text style={tw`text-indigo-500`}>
                ({(bookedTickets ?? []).length})
              </Text>
            </Text>
            <View style={tw`items-end`}>
              <Text style={tw`text-xs text-gray-400`}>
                {selectedEventName} · {selectedTicketName}
              </Text>
              <Text style={tw`text-xs text-gray-400 mt-1`}>
                Showing {visibleTickets.length} of {(bookedTickets ?? []).length}
              </Text>
            </View>
          </View>

          {/* Table */}
          <View
            style={[
              tw`bg-white rounded-2xl overflow-hidden border border-gray-100 mb-5`,
              { elevation: 2 },
            ]}
          >
            <Text style={tw`text-xs text-gray-400 px-4 pt-3`}>
              Swipe left or right to view all ticket columns
            </Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator
              contentContainerStyle={{ minWidth: tableMinWidth }}
            >
              <View>
                <View
                  style={[
                    tw`flex-row`,
                    { backgroundColor: "#4F46E5", minWidth: tableMinWidth },
                  ]}
                >
                  {tableColumns.map((column, columnIndex) => (
                    <View
                      key={column.key}
                      style={[
                        tw`px-3 py-3 justify-center`,
                        {
                          width: column.width,
                          borderRightWidth:
                            columnIndex === tableColumns.length - 1 ? 0 : 1,
                          borderRightColor: "rgba(255,255,255,0.2)",
                        },
                      ]}
                    >
                      {column.sortable ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => toggleSort(column.key)}
                          style={tw`flex-row items-center justify-between`}
                        >
                          <Text
                            style={[
                              tw`text-white text-xs font-bold flex-1`,
                              column.textStyle,
                            ]}
                          >
                            {column.label}
                          </Text>
                          <Ionicons
                            name={getSortIcon(
                              sortConfig?.direction,
                              sortConfig?.key === column.key,
                            )}
                            size={14}
                            color={
                              sortConfig?.key === column.key
                                ? "#FFFFFF"
                                : "rgba(255,255,255,0.7)"
                            }
                          />
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={[
                            tw`text-white text-xs font-bold`,
                            column.textStyle,
                          ]}
                        >
                          {column.label}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                {visibleTickets.map((ticket, index) => (
                  <View
                    key={ticket.documentId}
                    style={[
                      tw`flex-row`,
                      {
                        minWidth: tableMinWidth,
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                        borderTopWidth: 1,
                        borderTopColor: "#F3F4F6",
                      },
                    ]}
                  >
                    {tableColumns.map((column, columnIndex) => (
                      <View
                        key={`${ticket.documentId}-${column.key}`}
                        style={[
                          tw`px-3 py-3 justify-center`,
                          {
                            width: column.width,
                            minHeight: 60,
                            borderRightWidth:
                              columnIndex === tableColumns.length - 1 ? 0 : 1,
                            borderRightColor: "#F3F4F6",
                          },
                        ]}
                      >
                        {column.render ? (
                          <View style={tw`items-center`}>
                            {column.render(ticket, index)}
                          </View>
                        ) : (
                          <Text
                            style={[
                              tw`text-xs text-gray-700`,
                              column.textStyle,
                              column.key === "name" && tw`font-semibold text-gray-800`,
                            ]}
                            numberOfLines={column.lines ?? 1}
                          >
                            {column.getValue(ticket, index)}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {hasMoreTickets && (
            <TouchableOpacity
              onPress={() =>
                setVisibleCount((current) => current + PREVIEW_BATCH_SIZE)
              }
              style={tw`bg-indigo-50 border border-indigo-200 rounded-2xl py-4 mb-5 items-center justify-center`}
            >
              <Text style={tw`text-indigo-700 font-bold text-sm`}>
                {`Load More (+${Math.min(PREVIEW_BATCH_SIZE, remainingTickets)})`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Export CSV Button */}
          <TouchableOpacity
            onPress={handleExportCSV}
            disabled={exporting}
            style={[
              tw`flex-row items-center justify-center rounded-2xl py-4 mb-6`,
              {
                backgroundColor: exporting ? "#D1FAE5" : "#059669",
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={tw`text-white font-bold text-sm ml-2`}>
                  Export CSV
                </Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Empty State */}
      {!loading && (bookedTickets ?? []).length === 0 && canSearch && (
        <View style={tw`items-center py-16`}>
          <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
          <Text style={tw`text-gray-400 font-semibold mt-3`}>
            No tickets found
          </Text>
          <Text style={tw`text-gray-300 text-xs mt-1`}>
            Try selecting a different event or ticket type
          </Text>
        </View>
      )}
    </View>
  );
}
