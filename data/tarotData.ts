export interface TarotGroup {
  name: string;
  cards: string[];
}

export const TAROT_DECK: TarotGroup[] = [
  {
    name: "Arcanos Maiores",
    cards: [
      "O Louco", "O Mago", "A Sacerdotisa", "A Imperatriz", "O Imperador", 
      "O Hierofante", "Os Enamorados", "O Carro", "A Força", "O Eremita", 
      "A Roda da Fortuna", "A Justiça", "O Enforcado", "A Morte", "A Temperança", 
      "O Diabo", "A Torre", "A Estrela", "A Lua", "O Sol", "O Julgamento", "O Mundo"
    ]
  },
  {
    name: "Paus (Fogo)",
    cards: [
      "Ás de Paus", "Dois de Paus", "Três de Paus", "Quatro de Paus", "Cinco de Paus",
      "Seis de Paus", "Sete de Paus", "Oito de Paus", "Nove de Paus", "Dez de Paus",
      "Pajem de Paus", "Cavaleiro de Paus", "Rainha de Paus", "Rei de Paus"
    ]
  },
  {
    name: "Copas (Água)",
    cards: [
      "Ás de Copas", "Dois de Copas", "Três de Copas", "Quatro de Copas", "Cinco de Copas",
      "Seis de Copas", "Sete de Copas", "Oito de Copas", "Nove de Copas", "Dez de Copas",
      "Pajem de Copas", "Cavaleiro de Copas", "Rainha de Copas", "Rei de Copas"
    ]
  },
  {
    name: "Espadas (Ar)",
    cards: [
      "Ás de Espadas", "Dois de Espadas", "Três de Espadas", "Quatro de Espadas", "Cinco de Espadas",
      "Seis de Espadas", "Sete de Espadas", "Oito de Espadas", "Nove de Espadas", "Dez de Espadas",
      "Pajem de Espadas", "Cavaleiro de Espadas", "Rainha de Espadas", "Rei de Espadas"
    ]
  },
  {
    name: "Ouros (Terra)",
    cards: [
      "Ás de Ouros", "Dois de Ouros", "Três de Ouros", "Quatro de Ouros", "Cinco de Ouros",
      "Seis de Ouros", "Sete de Ouros", "Oito de Ouros", "Nove de Ouros", "Dez de Ouros",
      "Pajem de Ouros", "Cavaleiro de Ouros", "Rainha de Ouros", "Rei de Ouros"
    ]
  }
];