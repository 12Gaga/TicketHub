import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import globalApi from "../Configs/globalApi";
import PopUpAlert from "./PopUpAlert";

export default function CreateAgent({ createAgent, setCreateAgent }) {
  const [data, setData] = useState({
    Name: "",
    Phone: "",
    Email: null,
    Address: "",
  });
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [failModal, setFailModal] = useState(false);
  const [failText, setFailText] = useState("");

  const handleClose = () => {
    setData({ Name: "", Phone: "", Email: null, Address: "" });
    setCreateAgent(false);
  };

  const handleCreate = async () => {
    if (!data.Name.trim()) return;
    setLoading(true);
    try {
      const payload = {
        Name: data.Name.trim(),
        Phone: data.Phone?.trim() || null,
        Email: data.Email?.trim() || null,
        Address: data.Address?.trim() || null,
      };
      const resp = await globalApi.setAgent(payload);
      console.log("resp.ok:", resp.ok); // ← check response
      console.log("resp.status:", resp.status); // ← check status
      console.log("resp.data:", resp.data); // ← check data
      console.log("resp.problem:", resp.problem);
      if (resp.ok) {
        setSuccessModal(true);
        setData({ Name: "", Phone: "", Email: null, Address: "" }); // ✅
        setSuccessModal(true);
      } else {
        setFailText("Failed to create agent. Please try again.");
        setFailModal(true);
      }
    } catch (err) {
      console.error("Create agent error:", err);
      setFailText("Something went wrong.");
      setFailModal(true);
    } finally {
      setLoading(false);
    }
  };

  const canCreate = data.Name.trim().length > 0;

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={createAgent}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <View
            style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
          >
            <View style={tw`bg-white w-80 p-5 rounded-xl shadow-lg`}>
              {/* ── Header ── */}
              <Text style={tw`text-lg font-bold text-center`}>
                Create New Agent
              </Text>
              <Text style={tw`text-xs text-gray-400 mb-4 text-center`}>
                Add a new agent to the system.
              </Text>

              {/* ── Form ── */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Name */}
                <View>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Agent Name <Text style={tw`text-red-500`}>*</Text>
                  </Text>
                  <TextInput
                    placeholder="Agent Name"
                    value={data.Name}
                    onChangeText={(text) => setData({ ...data, Name: text })}
                    style={tw`border border-black rounded-[5px] pl-2 text-[13px] text-gray-700 mb-3`}
                  />
                </View>

                {/* Phone */}
                <View>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Phone
                  </Text>
                  <TextInput
                    placeholder="Phone number"
                    value={data.Phone}
                    onChangeText={(text) => setData({ ...data, Phone: text })}
                    keyboardType="phone-pad"
                    style={tw`border border-black rounded-[5px] pl-2 text-[13px] text-gray-700 mb-3`}
                  />
                </View>

                {/* Email */}
                <View>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Email
                  </Text>
                  <TextInput
                    placeholder="Email address"
                    value={data.Email ?? ""}
                    onChangeText={(text) =>
                      setData({ ...data, Email: text || null })
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={tw`border border-black rounded-[5px] pl-2 text-[13px] text-gray-700 mb-3`}
                  />
                </View>

                {/* Address */}
                <View>
                  <Text style={tw`text-sm font-semibold text-gray-900 mb-1`}>
                    Address
                  </Text>
                  <TextInput
                    placeholder="Address"
                    value={data.Address}
                    onChangeText={(text) => setData({ ...data, Address: text })}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    style={tw`border border-black rounded-[5px] pl-2 text-[13px] text-gray-700 mb-3`}
                  />
                </View>

                {/* ── Buttons ── */}
                <View style={tw`flex-row items-center justify-end mt-2`}>
                  <TouchableOpacity
                    style={tw`bg-indigo-600 p-3 rounded-xl mr-1.5 ${
                      !canCreate ? "opacity-50" : "opacity-100"
                    }`}
                    disabled={!canCreate || loading}
                    onPress={handleCreate}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={tw`text-white text-center font-semibold`}>
                        Create Agent
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={tw`border border-indigo-600 p-3 rounded-xl`}
                    onPress={handleClose}
                  >
                    <Text style={tw`text-indigo-600 text-center font-semibold`}>
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Modals */}
        <PopUpAlert
          success={failModal}
          text={failText}
          header={"Error!"}
          ModalCall={() => setFailModal(false)}
          status={false}
        />
        <PopUpAlert
          success={successModal}
          text={"Agent created successfully!"}
          header={"Success"}
          ModalCall={() => {
            setSuccessModal(false);
            handleClose();
          }}
          status={true}
        />
      </Modal>
    </>
  );
}
