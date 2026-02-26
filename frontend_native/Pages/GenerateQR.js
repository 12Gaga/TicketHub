import { useNavigation, useRoute } from "@react-navigation/native";
import { Text, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";

export default function GenerateQR() {
  const { routeData } = useRoute().params;
  const navigation = useNavigation();
  console.log("data", routeData);
  const qrUrl = `ticketapp://qrcheck/${routeData.documentID}`;
  return (
    <SafeAreaView style={tw`flex-1 bg-blue-30 items-center justify-center`}>
      <TouchableOpacity
        style={tw`absolute top-30 left-5`}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      <Text style={tw`mb-3`}>Name : {routeData.name}</Text>
      <Text style={tw`mb-5`}>Ticket Type : {routeData.ticket_type}</Text>
      <QRCode value={qrUrl} size={200} />
    </SafeAreaView>
  );
}
