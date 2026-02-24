import { View, Text } from "react-native";
import tw from "twrnc";

export default function DashboardScreen() {
  return (
    <View style={tw`flex-1 bg-blue-100 items-center justify-center`}>
      <Text>Dashboard Screen</Text>
    </View>
  );
}
