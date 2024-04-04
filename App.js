import React, { useState, useEffect, useContext } from 'react';
import { createContext } from 'react';
import { View, Text, SafeAreaView, FlatList, StyleSheet, TouchableOpacity, Button, Switch, Alert } from 'react-native';
import { format, setHours, setMinutes, addDays, differenceInDays, isWithinInterval } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements'

const Stack = createStackNavigator();
const CycleContext = createContext();


// Hook para consumir o contexto
const useCycle = () => {
  return useContext(CycleContext);
};

const App = () => {
  const [currentCycle, setCurrentCycle] = useState(null);
  const [medicationData, setMedicationData] = useState([]);

  return (
    <CycleContext.Provider value={{ currentCycle, setCurrentCycle, medicationData, setMedicationData }}>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen}/>
        <Stack.Screen name="Configure seu ciclo" component={ConfigureCicle} />
        <Stack.Screen
          name="Ciclo atual"
          component={ConfirmScreen}
          options={({ navigation }) => ({
          title: 'Ciclo atual',
          headerLeft: () => (
        <HeaderBackButton
          onPress={() => {
            // Personalize o comportamento do botão Voltar conforme necessário
            navigation.navigate('Home');
          }}
      />
    ),
  })}
/>
      </Stack.Navigator>
    </NavigationContainer>
    </CycleContext.Provider>
  );
};

const HomeScreen = () => {

  const cycle = useCycle();

  const navigation = useNavigation();

  const handleNovoCiclo = () => {
    navigation.navigate('Configure seu ciclo')
  } 

  const checkCycleInfo = () => {
    if (!cycle) {
      return Alert.alert('Você ainda não configurou nenhum ciclo, clique em Novo ciclo');
    }

    // Navegue para a tela do ciclo atual
    navigation.navigate('Ciclo atual');
  }

  return (
    <SafeAreaView style={styles.HomeContainer}>
      <Text style={styles.tituloHome}>
        No Babies
      </Text>
      <View style={styles.HomeButaoContainer}>
      <TouchableOpacity style={styles.butao} onPress={handleNovoCiclo}>
        <Text style={styles.butaoTexto}>Novo ciclo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.butao} onPress={checkCycleInfo}>
        <Text style={styles.butaoTexto}>Ciclo atual</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.butao}>
        <Text style={styles.butaoTexto}>Ciclos anteriores</Text>
      </TouchableOpacity>
      </View>
      
    </SafeAreaView>


  );

};

const ConfigureCicle = () => {
  const cycle = useCycle();
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
    cycle.setCurrentCycle({
      startDate: format(date, 'dd/MM/yyyy'),
      time: format(time, 'HH:mm'),
    });
    // Navegue para a tela de confirmação e passe os dados como parâmetros
    navigation.navigate('Ciclo atual', {
      formattedDate: format(date, 'dd/MM/yyyy'),
      formattedTime: format(time, 'HH:mm'),
    });
  };

  return (
    <SafeAreaView style={styles.configureContainer}>
      <Text style={styles.tituloMain}>
        Insira a data e o horário em que você começou seu ciclo
      </Text>
      <View style={styles.btnConfirmar}>
        <TouchableOpacity onPress={handleConfirm} style={styles.button}>
          <Text style={styles.butaoTexto}>
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={showDatepicker} style={[styles.button, {marginRight: 20}]}>
          <Text style={styles.butaoTexto}>
            Data
          </Text>
        </TouchableOpacity>
          <TouchableOpacity onPress={showTimepicker} style={styles.button}>
          <Text style={styles.butaoTexto}>
            Horário
          </Text>
          </TouchableOpacity>
        </View>
      <Text style={styles.diaHora}>Data: {formattedDate}</Text>
      <Text style={styles.diaHora}>Horário: {format(time, 'HH:mm')}</Text>
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
  const navigation = useNavigation();

  // Retrieve the current cycle information from context
  const { currentCycle, medicationData, setMedicationData } = useCycle();

  let formattedDate, formattedTime;

  // Verifique se o componente foi chamado diretamente da HomeScreen ou através da rota
  if (route.params) {
    formattedDate = route.params.formattedDate;
    formattedTime = route.params.formattedTime;
  } else if (currentCycle) {
    formattedDate = currentCycle.startDate;
    formattedTime = currentCycle.time;
  } else {
    // Se nenhum dos parâmetros ou ciclo atual estiver disponível, exiba uma mensagem de erro
    return (
      <View>
        <Text>Nenhum dado disponível. Configurar um ciclo primeiro.</Text>
        <Button title="Ir para Home" onPress={() => navigation.navigate('Home')} />
      </View>
    );
  }

  // Converta a data formatada para um formato reconhecido pelo construtor Date
  // Verifique se formattedDate é uma string antes de usar o split
  const [day, month, year] = typeof formattedDate === 'string' && /\d{2}\/\d{2}\/\d{4}/.test(formattedDate) ? formattedDate.split('/') : [null, null, null];
  const originalDate = new Date(`${year}-${month}-${day}`);
  const endDate = new Date(originalDate);
  endDate.setDate(endDate.getDate() + 21);
  const startInterval = addDays(endDate, 1)
  const formattedEndDate = format(endDate, 'dd/MM/yyyy');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDayId, setCurrentDayId] = useState(null);
  const today = new Date();
  const endOfInterval = addDays(startInterval, 7); // O final do intervalo é 7 dias após o final do ciclo
  let intervalMessage = '';

  if (isWithinInterval(today, { start: endDate, end: endOfInterval })) {
    // Se a data atual está dentro do intervalo, calcule quantos dias faltam até o final do intervalo
    const daysLeft = differenceInDays(endOfInterval, today);
    const currentIntervalDay = 7 - daysLeft;
    intervalMessage = `Você está no ${currentIntervalDay}° dia do intervalo.`;
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
        love: false,
        loveMessage: '',
        protection: ''
      };
    });
    if (route.params) {
      setMedicationData(data);
    }
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

  const handleLoveSwitchChange = (id, newValue) => {
    // Defina a mensagem com base no valor do switch
    const loveMessage = newValue ? '  Amor foi feito' : '';
  
    // Atualize o estado quando o usuário marcar ou desmarcar o remédio
    setMedicationData((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, love: newValue, loveMessage, style: newValue ? {backgroundColor: 'white', borderRadius: 0} : undefined,} : item,
      )
    );
    if (newValue) {
      // Exibe o pop-up
      showAlert(id);
    }
  };

  const showAlert = (id) => {
    Alert.alert(
      "Com ou sem proteção?",
      "Fez amorzinho né safada? Mas me responde foi com ou sem proteção?",
      [
        {
          text: "Com proteção",
          onPress: () => {
            setMedicationData((prevData) =>
              prevData.map((item) =>
                item.id === id ? { ...item, protection : 'Com Proteção', } : item
              )
            );
          },
        },
        {
          text: "Sem proteção",
          onPress: () => {
            setMedicationData((prevData) =>
              prevData.map((item) =>
                item.id === id ? { ...item, protection : 'Sem proteção', style: {backgroundColor: 'red', borderRadius: 5}, } : item
              ),
            );
            },
          },
        ],
      { cancelable: false } // Opcional: impede que o usuário feche o alerta clicando fora dele
    );
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


const renderItem = ({ item }) => {
  return (
    <View style={[styles.listItem, item.style]}>
      <Text>{item.formattedDate}</Text>
      <Text> </Text>

      {item.taken && <Text>{item.timeTaken}</Text>}
      <Switch
        value={item.taken}
        onValueChange={(newValue) => handleSwitchChange(item.id, newValue)}
      />
      <Switch
        value={item.love}
        onValueChange={(newValue) => handleLoveSwitchChange(item.id, newValue)}
      />
      <Text style={styles.loveText}>{item.loveMessage}</Text>
    </View>
  );
};

return (
  <View style={styles.configureContainer}>
    {intervalMessage ? (
      <Text style={styles.intervalo}>{intervalMessage}</Text>
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
  HomeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'top',
    paddingTop: 50,
  },
  HomeButaoContainer: {
    flex: 1,
    flexDirection: 'colum',
    justifyContent: 'space-between',
    margin: 230,
    bottom: 150,
  },
  tituloHome: {
    left: 113,
    width: 380,
    fontSize: 30,
  },
  butao: {
    width: 200,
    height: 50,
    backgroundColor: '#FF00FF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    backgroundColor: '#FF00FF', // Cor de fundo desejada
    borderRadius: 5, // Borda arredondada (opcional)
    padding: 10, // Espaçamento interno
  },
  butaoTexto: {
    fontSize: 20
  },
  configureContainer: {
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
    justifyContent: 'space-between',
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
    right: 5,
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    top: 50,
  },
  intervalo: {
    top: 100,
    fontSize: 20,
  },
  diaHora: {
    fontSize: 20,
  }
});

export default App;
