// Gerador de nomes aleatórios para juízes/juízas

const nomesJuizes = [
  "Carlos Alberto Lima",
  "Roberto Santos Silva",
  "Fernando Costa Oliveira",
  "André Luís Martins",
  "João Pedro Almeida",
  "Marcos Vinícius Rocha",
  "Paulo Ricardo Dias"
];

const nomesJuizas = [
  "Maria Silva Santos",
  "Ana Paula Costa",
  "Juliana Mendes Ribeiro",
  "Carla Rodrigues Souza",
  "Fernanda Lima Araújo",
  "Patrícia Oliveira Campos",
  "Beatriz Santos Pereira",
  "Renata Ferreira Dias"
];

export const gerarNomeJuiz = (): { nome: string; genero: 'masculino' | 'feminino' } => {
  const usarMasculino = Math.random() > 0.5;
  
  if (usarMasculino) {
    const nome = nomesJuizes[Math.floor(Math.random() * nomesJuizes.length)];
    return { nome: `Juiz ${nome}`, genero: 'masculino' };
  } else {
    const nome = nomesJuizas[Math.floor(Math.random() * nomesJuizas.length)];
    return { nome: `Juíza ${nome}`, genero: 'feminino' };
  }
};
