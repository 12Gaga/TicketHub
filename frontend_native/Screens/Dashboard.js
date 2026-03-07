import { View, Text } from "react-native";
import tw from "twrnc";

export default function DashboardScreen() {
  return (
    <View style={tw`flex-1 bg-white items-center justify-center`}>
      <Text>Dashboard Screen</Text>
    </View>
  );
}
