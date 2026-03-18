import { create } from "apisauce";
import UserAuth from "./UserAuth";

const api = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let _navigator;

export const setNavigator = (nav) => {
  _navigator = nav;
};

api.addAsyncResponseTransform(async (response) => {
  if (response.status === 401) {
    await UserAuth.logout();
    _navigator?.navigate("login");
  }
});

// ✅ Dynamically attach JWT token from logged in user
api.addAsyncRequestTransform(async (request) => {
  const user = await UserAuth.getUserAuth();
  if (user?.token) {
    request.headers["Authorization"] = `Bearer ${user.token}`;
  }
});

const today = new Date();
today.setHours(0, 0, 0, 0);
const isoDate = today.toISOString();

const checkUser = (userData) => api.post("/auth/local", userData);
const getTicket = () => api.get("/tickets");
const getAgents = () => api.get("/agents");
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
const setAgent = (agent) => api.post("/agents", { data: agent });
const changeEventStatus = (documentId, status = false) =>
  api.put(`/events/${documentId}?locale=fr`, {
    data: { On_Live: status },
  });
const getBookedTicket = (ticketID, eventID) =>
  api.get(
    `/booked-tickets?filters[ticket][documentId][$eq]=${ticketID}&filters[event][documentId][$eq]=${eventID}&populate=*`,
  );
const getAllBookedTickets = () =>
  api.get(
    "/booked-tickets?populate=*&pagination[start]=0&pagination[limit]=10000",
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
const uploadFile = (formData) =>
  api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
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
  getBookedTicketByEvent,
  createCheckIn,
  getCheckInAudience,
  getTicketByTicketUniqueId,
  bulkCreateTickets,
  getAgents,
  setAgent,
  uploadFile,
  getAllBookedTickets,
};
