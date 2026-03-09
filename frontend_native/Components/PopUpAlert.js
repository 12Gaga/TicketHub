import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import tw from "twrnc";

export default function PopUpAlert({
  success,
  text,
  header,
  ModalCall,
  status,
}) {
  return (
    <View>
      <Modal visible={success} transparent animationType="fade">
        <View
          style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center px-8`}
        >
          <View style={tw`bg-white rounded-3xl p-6 w-full items-center`}>
            {/* Success icon */}
            <View
              style={tw`w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4`}
            >
              <Ionicons
                name={status ? "checkmark-circle" : "close-circle"}
                size={40}
                color={status ? "#10B981" : "#EF4444"}
              />
            </View>

            <Text style={tw`text-lg font-bold text-gray-800 mb-1`}>
              {header}
            </Text>
            <Text style={tw`text-sm text-gray-400 text-center mb-6`}>
              {text}
            </Text>

            <TouchableOpacity
              onPress={ModalCall}
              style={tw`w-full rounded-xl overflow-hidden`}
            >
              <LinearGradient
                colors={["#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tw`py-3.5 items-center`}
              >
                <Text style={tw`text-white font-bold text-sm`}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
