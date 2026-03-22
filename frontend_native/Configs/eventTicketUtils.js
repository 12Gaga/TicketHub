export function createTicketDraft(overrides = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ticket: "",
    isLimited: false,
    Limit: "",
    ...overrides,
  };
}

export function sanitizeTicketLimitInput(value) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

function normalizeTicketId(value) {
  return value ? String(value) : "";
}

export function validateTicketDrafts(
  rows,
  { minimumCount = 0, reservedTicketIds = [] } = {},
) {
  const draftRows = rows ?? [];
  const takenTicketIds = new Set(
    (reservedTicketIds ?? []).map((value) => normalizeTicketId(value)),
  );

  if (draftRows.length + takenTicketIds.size < minimumCount) {
    return "Add at least one ticket type.";
  }

  for (let index = 0; index < draftRows.length; index += 1) {
    const row = draftRows[index];
    const ticketId = normalizeTicketId(row?.ticket);
    const label = `Ticket row ${index + 1}`;

    if (!ticketId) {
      return `${label}: select a ticket type.`;
    }

    if (takenTicketIds.has(ticketId)) {
      return `${label}: this ticket type is already added.`;
    }

    takenTicketIds.add(ticketId);

    if (!row?.isLimited) {
      continue;
    }

    const sanitizedLimit = sanitizeTicketLimitInput(row?.Limit);
    const parsedLimit = Number.parseInt(sanitizedLimit, 10);

    if (!sanitizedLimit || !Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return `${label}: limited ticket types need a seat count greater than 0.`;
    }
  }

  return null;
}

export function buildTicketLimitPayload(row, eventId) {
  const sanitizedLimit = sanitizeTicketLimitInput(row?.Limit);

  return {
    event: eventId,
    ticket: row.ticket,
    isLimited: !!row.isLimited,
    Limit:
      row?.isLimited && sanitizedLimit
        ? Number.parseInt(sanitizedLimit, 10)
        : null,
  };
}
