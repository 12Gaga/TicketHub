import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import tw from "twrnc";
import globalApi from "../Configs/globalApi";
import UserAuth from "../Configs/UserAuth";
import PopUpAlert from "../Components/PopUpAlert";

export default function LoginPage() {
  const [data, setData] = useState({ identifier: "", password: "" });
  const [success, setSuccess] = useState(true);
  const [failModal, setFailModal] = useState(false);
  const navigation = useNavigation();

  const loginUser = async () => {
    try {
      if (!data.identifier || !data.password) {
        setFailModal(true);
        return;
      }

      const resp = await globalApi.checkUser(data);

      if (resp.ok) {
        const Login_User = {
          documentId: resp.data.user.documentId,
          email: resp.data.user.email,
          username: resp.data.user.username,
          password: data.password,
        };
        console.log("LogInData", Login_User);
        navigation.navigate("home");
        await UserAuth.setUserAuth(Login_User);
        setSuccess(true);
        setData({ identifier: "", password: "" });
      } else {
        console.log("Failed ❌", resp.data);
        setSuccess(false);
      }
    } catch (error) {
      console.log("Error ❌", error);
      setSuccess(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white items-center justify-center`}>
      <Text
        style={tw`mb-5 text-[25px] italic text-center text-indigo-600 font-bold`}
      >
        Log In
      </Text>
      <TextInput
        placeholder="Username"
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
        style={tw`w-[100px] bg-indigo-600 p-2.5 rounded-lg items-center`}
        onPress={loginUser}
      >
        <Text style={tw`text-white`}>Log In</Text>
      </TouchableOpacity>
      <PopUpAlert
        success={failModal}
        text={"Please fill all required fields"}
        header={"Error!"}
        ModalCall={() => setFailModal(false)}
        status={false}
      />
    </View>
  );
}
