import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import globalApi from "../Configs/globalApi";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

export default function TicketCheck() {
  const navigation = useNavigation();
  //const { documentId } = useRoute().params;
  const documentId = "pi7ej624zljdg3xusjds2sbs";
  const [ticketData, setTicketData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const resp = await globalApi.getTicketByDocumentId(documentId);
      if (resp.ok) {
        console.log("Detail", resp.data.data);
        setTicketData(resp.data.data);
      }
    };
    fetchData();
  }, [documentId]);

  const handleValid = async () => {
    try {
      const resp = await globalApi.changeTicketStatus(ticketData[0].documentId);
      if (resp.ok) {
        setTicketData([]);
        //navigation.goBack();
        navigation.navigate("home");
      } else {
        alert("Failed to update ticket");
        console.log("error", resp.problem);
      }
    } catch (error) {
      console.error(error);
      alert("Error updating ticket");
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-blue-30 items-center justify-center`}>
      {ticketData.length > 0 ? (
        <>
          <Text style={tw`text-4 font-bold mb-2 underline`}>Ticket Detail</Text>
          <Text>Name : {ticketData[0].Name}</Text>
          <Text>Ticket Type : {ticketData[0].ticket.Name}</Text>
        </>
      ) : (
        <Text>Ticket can't found in the database or Used Ticket</Text>
      )}
      <TouchableOpacity
        style={tw`w-[100px] bg-blue-500 p-2 rounded-lg items-center justify-center mt-3`}
        onPress={handleValid}
      >
        <Text style={{ color: "white" }}>Valid</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    width: 100,
    backgroundColor: "#0383CE",
    padding: 10,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    marginTop: 10,
  },
});
