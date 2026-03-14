import { create } from "apisauce";

const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_API_TOKEN}`,
  },
});

const today = new Date();
today.setHours(0, 0, 0, 0);
const isoDate = today.toISOString();

const checkUser = (userData) => api.post("/auth/local", userData);
const getTicket = () => api.get("/tickets");
const getEvents = () =>
  api.get("/events?filters[On_Live][$eq]=true&populate=*");
const getExpiredEvents = () =>
  api.get("/events?filters[On_Live][$eq]=false&populate=*");
const setEventTicketLimit = (eventTicket) =>
  api.post("/ticket-limits?populate=*", { data: eventTicket });
const setBookedTicket = (bookingData) =>
  api.post("/booked-tickets", { data: bookingData });
const createCheckIn = (checkInData) =>
  api.post("/check-ins", { data: checkInData });
const setEvent = (event) => api.post("/events", { data: event });
const changeEventStatus = (documentId, status = false) =>
  api.put(`/events/${documentId}?locale=fr`, {
    data: { On_Live: status },
  });
const getBookedTicket = (ticketID, eventID) =>
  api.get(
    `/booked-tickets?filters[ticket][documentId][$eq]=${ticketID}&filters[event][documentId][$eq]=${eventID}&populate=*`,
  );
const getBookedTicketByEvent = (eventID) =>
  api.get(
    `/booked-tickets?filters[event][documentId][$eq]=${eventID}&populate=*`,
  );
const getTicketLimit = (eventID) =>
  api.get(
    `/ticket-limits?filters[event][documentId][$eq]=${eventID}&populate=*`,
  );
const getCheckInAudience = (eventID) =>
  api.get(`/check-ins?filters[event][documentId][$eq]=${eventID}&populate=*`);
const getTicketByDocumentId = (documentID) =>
  api.get(`/booked-tickets?filters[documentId][$eq]=${documentID}&populate=*`);
const getTicketByTicketUniqueId = (id) =>
  api.get(`/booked-tickets?filters[Ticket_Id][$eq]=${id}&populate=*`);
const changeTicketStatus = (documentId, scannerId, status = true) =>
  api.put(`/booked-tickets/${documentId}?locale=fr`, {
    data: { CheckIn_Status: status, Scanner_Id: scannerId },
  });

const bulkCreateTickets = (tickets) =>
  api.post("/booked-tickets/bulk", { tickets });

export default {
  checkUser,
  getTicket,
  getEvents,
  getExpiredEvents,
  setEventTicketLimit,
  setEvent,
  changeEventStatus,
  getBookedTicket,
  getTicketLimit,
  setBookedTicket,
  getTicketByDocumentId,
  changeTicketStatus,
  getBookedTicketByEvent,
  createCheckIn,
  getCheckInAudience,
  getTicketByTicketUniqueId,
  bulkCreateTickets,
};
