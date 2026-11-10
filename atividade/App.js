
import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Provider as PaperProvider,
  Card,
  Text,
  Button,
  ActivityIndicator
} from "react-native-paper";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const API =
  "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL";

const CHAVE = "favoritos";

// TELA INICIAL
function Inicio({ navigation, favoritos }) {
  const [moedas, setMoedas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  async function carregarMoedas() {
    try {
      setCarregando(true);
      setErro(false);

      const resposta = await fetch(API);
      const dados = await resposta.json();

      setMoedas(Object.values(dados));
    } catch (e) {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMoedas();
  }, []);

  if (carregando) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  if (erro) {
    return (
      <View style={styles.container}>
        <Text>Erro ao carregar as cotações.</Text>
        <Button onPress={carregarMoedas}>Tentar novamente</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cotações de Moedas</Text>

      <Button
        mode="contained"
        onPress={() => navigation.navigate("Favoritos")}
      >
        Meus favoritos
      </Button>

      <FlatList
        data={moedas}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate("Detalhes", { moeda: item })
            }
          >
            <Card.Title
              title={item.name}
              subtitle={"R$ " + Number(item.bid).toFixed(2)}
            />
            <Card.Content>
              <Text>
                {favoritos.includes(item.code) ? "★ Favorito" : ""}
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

// TELA DE DETALHES
function Detalhes({ route, favoritos, alternarFavorito }) {
  const moeda = route.params.moeda;

  return (
    <View style={styles.container}>
      <Card>
        <Card.Title title={moeda.name} />

        <Card.Content>
          <Text>Valor: R$ {Number(moeda.bid).toFixed(2)}</Text>
          <Text>Máxima: R$ {Number(moeda.high).toFixed(2)}</Text>
          <Text>Mínima: R$ {Number(moeda.low).toFixed(2)}</Text>
          <Text>Variação: {moeda.pctChange}%</Text>
        </Card.Content>

        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => alternarFavorito(moeda.code)}
          >
            {favoritos.includes(moeda.code)
              ? "Remover favorito"
              : "Adicionar favorito"}
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

// TELA DE FAVORITOS
function Favoritos({ navigation, favoritos }) {
  const [moedas, setMoedas] = useState([]);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((dados) => setMoedas(Object.values(dados)))
      .catch(() => {});
  }, []);

  const lista = moedas.filter((item) =>
    favoritos.includes(item.code)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus Favoritos</Text>

      {lista.length === 0 ? (
        <Text>Nenhuma moeda favoritada.</Text>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              onPress={() =>
                navigation.navigate("Detalhes", { moeda: item })
              }
            >
              <Card.Title
                title={item.name}
                subtitle={"R$ " + Number(item.bid).toFixed(2)}
              />
            </Card>
          )}
        />
      )}
    </View>
  );
}

// APLICATIVO PRINCIPAL
export default function App() {
  const [favoritos, setFavoritos] = useState([]);

  useEffect(() => {
    async function carregarFavoritos() {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);

        if (salvo) {
          setFavoritos(JSON.parse(salvo));
        }
      } catch (e) {
        console.log(e);
      }
    }

    carregarFavoritos();
  }, []);

  async function alternarFavorito(code) {
    const novaLista = favoritos.includes(code)
      ? favoritos.filter((item) => item !== code)
      : [...favoritos, code];

    setFavoritos(novaLista);

    await AsyncStorage.setItem(
      CHAVE,
      JSON.stringify(novaLista)
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#1565C0" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" }
          }}
        >
          <Stack.Screen name="Inicio" options={{ title: "Cotações" }}>
            {(props) => (
              <Inicio {...props} favoritos={favoritos} />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Detalhes"
            options={{ title: "Detalhes da moeda" }}
          >
            {(props) => (
              <Detalhes
                {...props}
                favoritos={favoritos}
                alternarFavorito={alternarFavorito}
              />
            )}
          </Stack.Screen>

          <Stack.Screen
            name="Favoritos"
            options={{ title: "Meus favoritos" }}
          >
            {(props) => (
              <Favoritos {...props} favoritos={favoritos} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f5f5"
  },

  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15
  },

  card: {
    marginVertical: 8
  }
});
