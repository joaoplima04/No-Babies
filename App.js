// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, StyleSheet, TouchableOpacity, Button, Switch } from 'react-native';
import { format, setHours, setMinutes, addDays, differenceInDays, isWithinInterval } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const HomeScreen = () => {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    setFormattedDate(format(date, 'dd/MM/yyyy'));
  }, [date]);

  const onChange = (event, selectedDate) => {
    setShow(false);

    if (mode === 'date') {
      const currentDate = selectedDate || date;
      setDate(currentDate);
    }

    if (mode === 'time' && selectedDate) {
      const selectedTime = setHours(
        setMinutes(new Date(), selectedDate.getMinutes()),
        selectedDate.getHours()
      );
      setTime(selectedTime);
    }
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };

  const handleConfirm = () => {
    // Navegue para a tela de confirmação e passe os dados como parâmetros
    navigation.navigate('Confirm', {
      formattedDate: format(date, 'dd/MM/yyyy'),
      formattedTime: format(time, 'HH:mm'),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.tituloMain}>
        Insira a data e o horário em que você começou seu ciclo
      </Text>
      <View style={styles.btnConfirmar}>
        <Button onPress={handleConfirm} title="Confirmar" />
      </View>
      <View style={styles.buttonContainer}>
        <Button onPress={showDatepicker} title="Data"/>
        <Button onPress={showTimepicker} title="Hora" />
      </View>
      <Text>Data: {formattedDate}</Text>
      <Text>Horário: {format(time, 'HH:mm')}</Text>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </SafeAreaView>
  );
};

const ConfirmScreen = ({ route }) => {
  const { formattedDate, formattedTime } = route.params;

  // Converta a data formatada para um formato reconhecido pelo construtor Date
  const [day, month, year] = formattedDate.split('/');
  const originalDate = new Date(`${year}-${month}-${day}`);
  const endDate = new Date(originalDate);
  endDate.setDate(endDate.getDate() + 21);
  const startInterval = addDays(endDate, 1)
  const formattedEndDate = format(endDate, 'dd/MM/yyyy');
  const [medicationData, setMedicationData] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDayId, setCurrentDayId] = useState(null);
  const today = new Date();
  const endOfInterval = addDays(startInterval, 7); // O final do intervalo é 7 dias após o final do ciclo
  let intervalMessage = '';

  if (isWithinInterval(today, { start: endDate, end: endOfInterval })) {
    // Se a data atual está dentro do intervalo, calcule quantos dias faltam até o final do intervalo
    const daysLeft = differenceInDays(endOfInterval, today);
    intervalMessage = `Você está no seu intervalo, Faltam ${daysLeft} dias.`;
  }

  useEffect(() => {
    // Crie um array de dados para representar cada dia no período de 21 dias
    const data = Array.from({ length: 22 }, (_, index) => {
      const day = new Date(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate() + index + 1);
      return {
        id: index.toString(),
        date: day,
        formattedDate: format(day, 'dd/MM/yyyy'),
        taken: false, // Inicialmente, o remédio não foi tomado
        time: formattedTime, // Use o mesmo horário para todos os dias, ou ajuste conforme necessário
      };
    });
  
    setMedicationData(data);
  }, []); // Remova as dependências aqui

  const handleSwitchChange = (id, newValue) => {
    // Atualize o estado quando o usuário marcar ou desmarcar o remédio
    setMedicationData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, taken: newValue } : item
      )
    );
    if (newValue) {
      setCurrentDayId(id); // Adicione esta linha
      setShowTimePicker(true);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    setSelectedTime(selectedTime);
  
    // Atualize o horário do medicamento para o dia correspondente
    setMedicationData((prevData) =>
    prevData.map((item) =>
      item.id === currentDayId ? { ...item, timeTaken: format(selectedTime, 'HH:mm') } : item
    )
  );
};

  const renderItem = ({ item }) => (
  <View style={styles.listItem}>
    <Text>{item.formattedDate}</Text>
    <Text>  </Text>
    {item.taken && <Text>{item.timeTaken}</Text>}
    <Switch
      value={item.taken}
      onValueChange={(newValue) => handleSwitchChange(item.id, newValue)}
    />
  </View>
);

return (
  <View style={styles.container}>
    {intervalMessage ? (
      <Text>{intervalMessage}</Text>
    ) : (
      <>
        <Text style={styles.tituloDias}>Seu ciclo começou no dia {formattedDate} e vai até o dia {formattedEndDate}</Text>
        <Text style={styles.horaDias}>Você deve tomar às {formattedTime}</Text>
        <View style={styles.listaContainer}>
          <FlatList
            style={styles.flatList}
            data={medicationData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        </View>
        {showTimePicker && (
          <DateTimePicker
            testID="timePicker"
            value={selectedTime || new Date()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </>
    )}
  </View>
);
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'top',
    paddingTop: 50,
  },
  tituloDias: {
    position: 'relative',
    width: 380,
    fontSize: 20,
  },
  tituloMain: {
    position: 'relative',
    width: 380,
    fontSize: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 40,
  },
  btnConfirmar: {
    position: 'relative',
    top: 250,
  },
  horaDias: {
    top: 20,
    fontSize: 18,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  listaContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    right: 90,
    top: 50,
  },
  listaContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    right: 10,
    top: 50,
  },
});

export default App;
