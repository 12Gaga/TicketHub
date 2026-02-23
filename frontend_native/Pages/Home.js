import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import globalApi from "../Configs/globalApi";
import { useNavigation } from "@react-navigation/native";
import UserAuth from "../Configs/UserAuth";

export default function HomePage() {
  const navigation = useNavigation();
  const [data, setData] = useState({
    Name: "",
    Phone: "",
    ticket_type: 0,
    ticket_status: false,
  });
  const [tickets, setTickets] = useState([]);
  const [dailyLimit, setDailyLimit] = useState(false);
  const [ticketData, setTicketData] = useState({
    id: "",
    name: "",
    ticket_type: "",
  });

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const result = await globalApi.getTicket();
        console.log("Tickets:", result.data.data);
        setTickets(result.data.data);
      } catch (error) {
        console.log("Error:", error);
      }
    };

    fetchTickets();

    return () => {};
  }, []);

  const changeTicketType = async (ticketId) => {
    setData({ ...data, ticket_type: ticketId });
    const data = tickets.find((item) => item.id === ticketId);
    const limit = data.DailyLimit;
    setTicketData({ ...ticketData, ticket_type: data.Name });
    console.log("data", limit);
    const resp = await globalApi.getTicketBookingByID(ticketId);
    console.log("resp", resp.data.data);
    if (resp.ok && resp.data.data) {
      if (resp.data.data.length >= limit) {
        setDailyLimit(true);
      } else {
        setDailyLimit(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!data.ticket_type || !data.Name || !data.Phone) {
      Alert.alert("Please fill all fields");
      return;
    }
    const payload = {
      data: {
        Name: data.Name,
        Phone: data.Phone,
        ticket_type: {
          id: data.ticket_type,
        },
        ticket_status: !!data.ticket_status,
      },
    };

    const resp = await globalApi.setTicketBooking(payload.data);
    console.log("ticketResp", resp.data.data);
    if (resp.ok) {
      setTicketData({
        ...ticketData,
        id: resp.data.data.documentId,
      });
      navigation.navigate("qr", { ticketData: ticketData });
      setData({ Name: "", Phone: "", ticket_type: 0 });
    } else {
      alert("Failed to create booking");
      console.log("Failed to create booking:", resp.data.error);
    }
  };

  const [user, setUser] = useState();
  console.log("data2", data);
  useEffect(() => {
    const fetchUser = async () => {
      const storedUser = await UserAuth.getUserAuth(); // if async
      setUser(storedUser);
    };

    fetchUser();
  }, []);
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, { position: "absolute", top: 30, right: 0 }]}
        onPress={() => {
          UserAuth.logout();
          navigation.navigate("login");
        }}
      >
        <Text style={{ color: "white" }}>Log Out</Text>
      </TouchableOpacity>
      {dailyLimit ? (
        <Text
          style={{
            color: "red",
            fontSize: 11,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          Ticket Sold Out
        </Text>
      ) : (
        <></>
      )}
      <Picker
        selectedValue={data.ticket_type}
        onValueChange={(itemValue) => {
          changeTicketType(itemValue);
        }}
        style={{ backgroundColor: "#eee", marginBottom: 20, width: 300 }}
      >
        <Picker.Item label="Select ticket type..." value={0} />
        {tickets.map((item) => {
          return <Picker.Item label={item.Name} value={item.id} />;
        })}
      </Picker>

      <TextInput
        placeholder="Your Name"
        value={data.Name}
        onChangeText={(text) => {
          (setData({ ...data, Name: text }),
            setTicketData({ ...ticketData, name: text }));
        }}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10, width: 300 }}
      />

      <TextInput
        placeholder="Phone Number"
        value={data.Phone}
        onChangeText={(text) => setData({ ...data, Phone: text })}
        keyboardType="phone-pad"
        style={{ borderWidth: 1, marginBottom: 20, padding: 10, width: 300 }}
      />
      <TouchableOpacity
        style={[styles.btn, { opacity: dailyLimit ? 0.5 : 1 }]}
        onPress={handleSubmit}
        disabled={dailyLimit}
      >
        <Text style={{ color: "white" }}>Booking</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("qrcheck")}
      >
        <Text style={{ color: "white" }}>QR Scan</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, { width: 150 }]}
        onPress={() =>
          navigation.navigate("ticketDetail", {
            id: "u3rga6fu5x943fm79y6vfhx0",
          })
        }
      >
        <Text style={{ color: "white" }}>Ticket Detail</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  btn: {
    width: 100,
    backgroundColor: "#0383CE",
    padding: 10,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    marginBottom: 10,
  },
});
