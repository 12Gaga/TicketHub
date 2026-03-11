export default {
  routes: [
    {
      method: "POST",
      path: "/booked-tickets/bulk",
      handler: "booked-ticket.bulkCreate",
      config: {
        auth: false,
      },
    },
  ],
};
