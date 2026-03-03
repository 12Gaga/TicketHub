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
  api.post("/ticket-limits", { data: eventTicket });
const setBookedTicket = (bookingData) =>
  api.post("/booked-tickets", { data: bookingData });
const setEvent = (event) => api.post("/events", { data: event });
const changeEventStatus = (documentId, status = false) =>
  api.put(`/events/${documentId}?locale=fr`, {
    data: { On_Live: status },
  });
const getBookedTicket = (ticketID, eventID) =>
  api.get(
    `/booked-tickets?filters[ticket][documentId][$eq]=${ticketID}&filters[event][documentId][$eq]=${eventID}&filters[createdAt][$gte]=${isoDate}&populate=*`,
  );
const getTicketLimit = (eventID) =>
  api.get(
    `/ticket-limits?filters[event][documentId][$eq]=${eventID}&populate=*`,
  );
const getTicketByDocumentId = (documentID) =>
  api.get(
    `/booked-tickets?filters[documentId][$eq]=${documentID}&filters[Auth_Status][$eq]=false&populate=*`,
  );
const changeTicketStatus = (documentId, status = true) =>
  api.put(`/booked-tickets/${documentId}?locale=fr`, {
    data: { Auth_Status: status },
  });

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
};
