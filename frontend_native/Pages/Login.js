import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import tw from "twrnc";

export default function LoginPage() {
  const [data, setData] = useState({ identifier: "", password: "" });
  const [success, setSuccess] = useState(true);
  const navigation = useNavigation();

  return (
    <View style={tw`flex-1 bg-blue-100 items-center justify-center`}>
      <Text
        style={tw`mb-5 text-[25px] italic text-center text-[#0383CE] font-bold`}
      >
        Log In
      </Text>
      <TextInput
        placeholder="User Name"
        value={data.identifier}
        onChangeText={(text) => setData({ ...data, identifier: text })}
        style={tw`w-[330px] border border-black rounded-[5px] pl-2 mb-[18px] text-[13px]`}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry={true}
        value={data.password}
        onChangeText={(text) => setData({ ...data, password: text })}
        style={tw`w-[330px] border border-black rounded-[5px] pl-2 mb-[18px] text-[13px]`}
      />
      {!success ? (
        <Text style={tw`text-red-500 text-[11px] font-bold mb-[10px]`}>
          Username or Password invalid.
        </Text>
      ) : (
        <></>
      )}
      <TouchableOpacity
        style={tw`w-[100px] bg-[#0383CE] p-2.5 rounded-lg items-center`}
        // onPress={loginUser}
      >
        <Text style={tw`text-white`}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}
