import { create } from "apisauce";

const api = create({
  baseURL: "http://192.168.1.29:1337/api",
  headers: {
    Authorization:
      "Bearer 78f1beb365ad9cfec86433f28980c3c3199902fc7fdbae1c07a13c39c8c8bc190f9154454cb39fd294233a1582cc787121919df374f58cd3110094661629b78953d7a2dc2a788470a2380083e739712f8e295246686a132fdb57bcfa58925f5501f7189b24dec37ab38c53eac2387c14634eabcf581eec5575064eae4865e0fa",
  },
});

const today = new Date();
today.setHours(0, 0, 0, 0);
const isoDate = today.toISOString();
