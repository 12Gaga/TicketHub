import { create } from "apisauce";

const api = create({
  baseURL: "http://192.168.1.34:1337/api",
  headers: {
    Authorization:
      "Bearer c3146ba87b6ba5037982297c79aac27f304e19d1cf817cf2ed7ceada5125593b6d0081fc31677a7c1ef4cb553e9a61f70a7465a6c7ad920f143f71b985f6f36e9418b8f1f902b561c097118e8549997b7f7360a7074db5384b41cba3aa80ed21f9db6f406213f0796662bdd25fb343e5a9d9a5c6ba1e3d8bbd9ac00fa41c8122",
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
const setEvent = (event) => api.post("/events", { data: event });
const changeEventStatus = (documentId, status = false) =>
  api.put(`/events/${documentId}?locale=fr`, {
    data: { On_Live: status },
  });

export default {
  checkUser,
  getTicket,
  getEvents,
  getExpiredEvents,
  setEventTicketLimit,
  setEvent,
  changeEventStatus,
};
