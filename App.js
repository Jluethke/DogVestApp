import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { useNavigation } from '@react-navigation/native';

const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const CHARACTERISTIC_UUIDS = [
  '12345678-1234-5678-1234-56789abcdef1',
  '12345678-1234-5678-1234-56789abcdef2',
  '12345678-1234-5678-1234-56789abcdef3',
  '12345678-1234-5678-1234-56789abcdef4',
  '12345678-1234-5678-1234-56789abcdef5'
];

const App = () => {
  const [bleManager] = useState(new BleManager());
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [characteristics, setCharacteristics] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.warn('Error during device scan', error);
        return;
      }
      // Replace "PicoLEDs" with your device name
      if (device && device.name === 'PicoLEDs') {
        bleManager.stopDeviceScan();
        connectToDevice(device);
      }
    });

    return () => {
      if (connectedDevice) {
        bleManager.cancelDeviceConnection(connectedDevice.id);
      }
      bleManager.destroy();
    };
  }, []);

  const connectToDevice = async (device) => {
    try {
      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      const services = await discovered.services();
      let chars = {};
      for (let service of services) {
        if (service.uuid === SERVICE_UUID) {
          const characteristics = await service.characteristics();
          characteristics.forEach((characteristic) => {
            if (CHARACTERISTIC_UUIDS.includes(characteristic.uuid)) {
              chars[characteristic.uuid] = characteristic;
            }
          });
        }
      }
      setConnectedDevice(device);
      setCharacteristics(chars);
    } catch (error) {
      console.warn('Error connecting to device:', error);
    }
  };

  const sendCommand = async (charUUID, command) => {
    try {
      const characteristic = characteristics[charUUID];
      if (characteristic) {
        await characteristic.writeWithResponse(command);
        console.log(`Command ${command} sent to ${charUUID}`);
      }
    } catch (error) {
      console.warn('Error sending command:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Raspberry Pi Pico W Bluetooth Commands</Text>
      {CHARACTERISTIC_UUIDS.map((charUUID, index) => (
        <TouchableOpacity
          key={charUUID}
          style={styles.button}
          onPress={() => sendCommand(charUUID, '1')}
        >
          <Text style={styles.buttonText}>Send Command {index + 1}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    backgroundColor: '#6200EE',
    margin: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default App;
