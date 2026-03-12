/**
 * booked-ticket controller
 */

// import { factories } from '@strapi/strapi';

// export default factories.createCoreController('api::booked-ticket.booked-ticket');

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::booked-ticket.booked-ticket",
  ({ strapi }) => ({
    async bulkCreate(ctx) {
      const { tickets } = ctx.request.body;

      if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
        return ctx.badRequest("No tickets provided");
      }

      const results = [];
      const errors = [];

      for (const ticket of tickets) {
        try {
          const entry = await strapi.entityService.create(
            "api::booked-ticket.booked-ticket",
            {
              data: {
                Name: ticket.Name,
                Email: ticket.Email,
                Phone: ticket.Phone,
                Payment: ticket.Payment,
                Agent: ticket.Agent,
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
