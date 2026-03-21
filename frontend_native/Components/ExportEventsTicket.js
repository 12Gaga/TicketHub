import { Picker } from "@react-native-picker/picker";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { ExportContext } from "../Configs/AuthContext";

export default function ExportEventsTicket() {
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
    checkedInCount,
    notCheckedInCount,
    selectedEventName,
    selectedTicketName,
    handleExportCSV,
    exporting,
    StatusBadge,
  } = useContext(ExportContext);
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
            Note: This export supports up to 20,000 tickets at a time. If your
            total sold tickets exceed 20,000, please contact your administrator
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
            <Text style={tw`text-xs text-gray-400`}>
              {selectedEventName} · {selectedTicketName}
            </Text>
          </View>

          {/* Table */}
          <View
            style={[
              tw`bg-white rounded-2xl overflow-hidden border border-gray-100 mb-5`,
              { elevation: 2 },
            ]}
          >
            {/* Table Head */}
            <View
              style={[tw`flex-row px-4 py-3`, { backgroundColor: "#4F46E5" }]}
            >
              <Text style={tw`text-white text-xs font-bold w-6`}>#</Text>
              <Text style={tw`text-white text-xs font-bold flex-1`}>Name</Text>
              <Text style={tw`text-white text-xs font-bold w-16 text-center`}>
                Seat
              </Text>
              <Text style={tw`text-white text-xs font-bold w-20 text-center`}>
                Payment
              </Text>
              <Text style={tw`text-white text-xs font-bold w-20 text-center`}>
                Status
              </Text>
            </View>

            {/* Rows */}
            {(bookedTickets ?? []).map((ticket, index) => (
              <View key={ticket.documentId}>
                {/* Main Row */}
                <View
                  style={[
                    tw`flex-row items-center px-4 py-3`,
                    {
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                    },
                  ]}
                >
                  <Text style={tw`text-xs text-gray-400 w-6`}>{index + 1}</Text>
                  <View style={tw`flex-1`}>
                    <Text
                      style={tw`text-sm font-semibold text-gray-800`}
                      numberOfLines={1}
                    >
                      {ticket.Name ?? "—"}
                    </Text>
                    <Text style={tw`text-xs text-gray-400`} numberOfLines={1}>
                      {ticket.Phone ?? "—"}
                    </Text>
                  </View>
                  <Text style={tw`text-xs text-gray-600 w-16 text-center`}>
                    {ticket.SeatNo ?? "—"}
                  </Text>
                  <Text
                    style={tw`text-xs text-gray-600 w-20 text-center`}
                    numberOfLines={1}
                  >
                    {ticket.Payment ?? "—"}
                  </Text>
                  <View style={tw`w-20 items-center`}>
                    <StatusBadge checked={ticket.CheckIn_Status} />
                  </View>
                </View>

                {/* Detail Sub-Row */}
                <View
                  style={[
                    tw`px-4 pb-3 flex-row flex-wrap gap-3`,
                    {
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="mail-outline" size={11} color="#9CA3AF" />
                    <Text style={tw`text-xs text-gray-400 ml-1`}>
                      {ticket.Email ?? "—"}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="person-outline" size={11} color="#9CA3AF" />
                    <Text style={tw`text-xs text-gray-400 ml-1`}>
                      Agent: {ticket.Agent ?? "—"}
                    </Text>
                  </View>
                  {ticket.Note ? (
                    <View style={tw`flex-row items-center`}>
                      <Ionicons
                        name="document-text-outline"
                        size={11}
                        color="#9CA3AF"
                      />
                      <Text style={tw`text-xs text-gray-400 ml-1`}>
                        {ticket.Note}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

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
