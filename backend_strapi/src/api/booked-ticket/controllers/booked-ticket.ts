/**
 * booked-ticket controller
 */

// import { factories } from '@strapi/strapi';

// export default factories.createCoreController('api::booked-ticket.booked-ticket');

import { factories } from "@strapi/strapi";

function normalizeTicketId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAgentName(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export default factories.createCoreController(
  "api::booked-ticket.booked-ticket",
  ({ strapi }) => ({
    async bulkCreate(ctx) {
      const { tickets } = ctx.request.body;

      if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        return ctx.badRequest("No tickets provided");
      }

      const submittedTicketIds = tickets
        .map((ticket) => normalizeTicketId(ticket?.Ticket_Id))
        .filter(Boolean);
      const duplicateTicketIds = submittedTicketIds.filter(
        (ticketId, index) => submittedTicketIds.indexOf(ticketId) !== index,
      );
      const uniqueTicketIds = [...new Set(submittedTicketIds)];
      const duplicateIdsInPayload = [...new Set(duplicateTicketIds)];

      let existingTicketIds: string[] = [];
      if (uniqueTicketIds.length > 0) {
        const existingTickets = await strapi.entityService.findMany(
          "api::booked-ticket.booked-ticket",
          {
            filters: {
              Ticket_Id: {
                $in: uniqueTicketIds,
              },
            },
            fields: ["Ticket_Id"],
            limit: uniqueTicketIds.length,
          },
        );

        existingTicketIds = [
          ...new Set(
            (existingTickets ?? [])
              .map((entry) => normalizeTicketId(entry?.Ticket_Id))
              .filter(Boolean),
          ),
        ];
      }

      if (duplicateIdsInPayload.length > 0 || existingTicketIds.length > 0) {
        return ctx.badRequest("Ticket_Id values must be unique.", {
          duplicateIdsInPayload,
          existingTicketIds,
        });
      }

      const requestedAgentNames = [
        ...new Set(
          tickets.map((ticket) => normalizeAgentName(ticket?.Agent)).filter(Boolean),
        ),
      ];
      const agentDocumentIdByName = new Map<string, string>();
      const missingAgentNames: string[] = [];
      const ambiguousAgentNames: string[] = [];

      if (requestedAgentNames.length > 0) {
        const agents = await strapi.entityService.findMany("api::agent.agent", {
          limit: 100000,
        });
        const matchingAgents = new Map<string, any[]>();

        for (const agent of agents ?? []) {
          const normalizedName = normalizeAgentName(agent?.Name);
          if (!normalizedName || !requestedAgentNames.includes(normalizedName)) {
            continue;
          }

          const matches = matchingAgents.get(normalizedName) ?? [];
          matches.push(agent);
          matchingAgents.set(normalizedName, matches);
        }

        for (const normalizedName of requestedAgentNames) {
          const matches = matchingAgents.get(normalizedName) ?? [];

          if (matches.length === 0) {
            const originalName = tickets.find(
              (ticket) => normalizeAgentName(ticket?.Agent) === normalizedName,
            )?.Agent;
            missingAgentNames.push(
              typeof originalName === "string" ? originalName.trim() : normalizedName,
            );
            continue;
          }

          if (matches.length > 1) {
            ambiguousAgentNames.push(matches[0]?.Name ?? normalizedName);
            continue;
          }

          agentDocumentIdByName.set(normalizedName, matches[0]?.documentId);
        }
      }

      if (missingAgentNames.length > 0 || ambiguousAgentNames.length > 0) {
        return ctx.badRequest("Agent names must match existing agents.", {
          missingAgentNames: [...new Set(missingAgentNames)],
          ambiguousAgentNames: [...new Set(ambiguousAgentNames)],
        });
      }

      const results = [];
      const errors = [];

      for (const ticket of tickets) {
        try {
          const agentDocumentId =
            ticket.agent ?? agentDocumentIdByName.get(normalizeAgentName(ticket.Agent));
          const entry = await strapi.entityService.create(
            "api::booked-ticket.booked-ticket",
            {
              data: {
                Name: ticket.Name,
                Email: ticket.Email,
                Phone: ticket.Phone,
                Payment: ticket.Payment,
                agent: agentDocumentId || null,
                SeatNo: ticket.SeatNo,
                Note: ticket.Note,
                Ticket_Id: ticket.Ticket_Id,
                Ticket_Status: ticket.Ticket_Status ?? true,
                event: ticket.event,
                ticket: ticket.ticket,
                Seller_Id: ticket.Seller_Id,
              },
            },
          );
          results.push(entry);
        } catch (err) {
          errors.push({ ticket, error: err.message });
        }
      }

      return ctx.send({
        created: results.length,
        failed: errors.length,
        errors,
      });
    },
  }),
);
