import { useEffect, useRef } from "react";
import { Text, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const navigation = useNavigation();
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus the hidden input when page opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScan = (text) => {
    // Only accept your app QR scheme
    if (text.startsWith("ticketapp://qrcheck/")) {
      const ticketId = text.split("/").pop();
      console.log("Scanned Ticket ID:", ticketId);
      navigation.navigate("ticketCheck", { documentId: ticketId });
    } else {
      alert("Invalid QR for this app!");
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-blue-30 items-center justify-center`}>
      <Text style={tw`text-[24px] font-bold mb-[20px]`}>Scan QR Code</Text>
      <Text style={tw`text-[16px] text-gray`}>
        Scan a ticket with your Bluetooth scanner
      </Text>

      <TextInput
        ref={inputRef}
        style={tw`h-0 w-0 opacity-0`}
        autoFocus
        onChangeText={handleScan}
        blurOnSubmit={false}
      />
    </SafeAreaView>
  );
}
