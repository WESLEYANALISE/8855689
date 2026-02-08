// Playlists de videoaulas por área do Direito
export interface AreaPlaylist {
  nome: string;
  playlistId: string;
  playlistUrl: string;
}

// Função para extrair o ID da playlist de uma URL
const extractPlaylistId = (url: string): string => {
  const match = url.match(/[?&]list=([^&]+)/);
  return match ? match[1] : '';
};

export const AREAS_PLAYLISTS: AreaPlaylist[] = [
  {
    nome: "Direito Constitucional",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjPm0avPxNZEQ2Vz4zLCCLV",
    playlistId: "PL8vXuI6zmpdjPm0avPxNZEQ2Vz4zLCCLV"
  },
  {
    nome: "Direito Administrativo",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdhmnwRaWsrvGpy1l0GQyfbze",
    playlistId: "PL8vXuI6zmpdhmnwRaWsrvGpy1l0GQyfbze"
  },
  {
    nome: "Direito Civil",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjH76qE2cZPWh11jwgvItA9",
    playlistId: "PL8vXuI6zmpdjH76qE2cZPWh11jwgvItA9"
  },
  {
    nome: "Direito Processual Civil",
    playlistUrl: "https://youtu.be/a2xbuchfMeg",
    playlistId: "a2xbuchfMeg" // Este é um vídeo único, não playlist
  },
  {
    nome: "Direito Penal",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdh8CF2fer38Uosf1phfUbH8",
    playlistId: "PL8vXuI6zmpdh8CF2fer38Uosf1phfUbH8"
  },
  {
    nome: "Direito Processual Penal",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdi6eQjQBgY0u_VNEl6f9p8Y",
    playlistId: "PL8vXuI6zmpdi6eQjQBgY0u_VNEl6f9p8Y"
  },
  {
    nome: "Direito do Trabalho",
    playlistUrl: "https://youtube.com/playlist?list=PLX-4skTGVrWVvoqVeEOlZIRg3EjYJ6xev",
    playlistId: "PLX-4skTGVrWVvoqVeEOlZIRg3EjYJ6xev"
  },
  {
    nome: "Direito Processual do Trabalho",
    playlistUrl: "https://youtube.com/playlist?list=PLViPh7AHXAPK4dDmjdv-a2CQw-_d8gB6X",
    playlistId: "PLViPh7AHXAPK4dDmjdv-a2CQw-_d8gB6X"
  },
  {
    nome: "Direito Tributário",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdi4O_2o3z6FLQ3b0F4PxhLx",
    playlistId: "PL8vXuI6zmpdi4O_2o3z6FLQ3b0F4PxhLx"
  },
  {
    nome: "Direito Empresarial",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdgVe7xwycNvHPtxLm7kzowJ",
    playlistId: "PL8vXuI6zmpdgVe7xwycNvHPtxLm7kzowJ"
  },
  {
    nome: "Direito do Consumidor",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdh6ZArA4hyd1EEF6b9iXtPS",
    playlistId: "PL8vXuI6zmpdh6ZArA4hyd1EEF6b9iXtPS"
  },
  {
    nome: "Direito Ambiental",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjF0s1ovNzxOkEa_KfW36uA",
    playlistId: "PL8vXuI6zmpdjF0s1ovNzxOkEa_KfW36uA"
  },
  {
    nome: "Direitos Humanos",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjbNcTIE7djtSjSOwnsM5pV",
    playlistId: "PL8vXuI6zmpdjbNcTIE7djtSjSOwnsM5pV"
  },
  {
    nome: "Direito Internacional",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdhuNo11n7argrPtoELeJpSC",
    playlistId: "PL8vXuI6zmpdhuNo11n7argrPtoELeJpSC"
  },
  {
    nome: "Direito Previdenciário",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdgKdvgqV9QVKp7COhTva5cJ",
    playlistId: "PL8vXuI6zmpdgKdvgqV9QVKp7COhTva5cJ"
  },
  {
    nome: "Direito Eleitoral",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdgq9XEO_Wvn_fHuGH-J88nV",
    playlistId: "PL8vXuI6zmpdgq9XEO_Wvn_fHuGH-J88nV"
  },
  {
    nome: "Estatuto da Criança e do Adolescente (ECA)",
    playlistUrl: "https://youtube.com/playlist?list=PL8vXuI6zmpdjLxIns5TqSwJtrm3krojzQ",
    playlistId: "PL8vXuI6zmpdjLxIns5TqSwJtrm3krojzQ"
  },
  {
    nome: "Direito Financeiro",
    playlistUrl: "https://youtube.com/playlist?list=PL2CHFA_bGrZ9HRF4DQ6Y_ct0DwOBAS2cw",
    playlistId: "PL2CHFA_bGrZ9HRF4DQ6Y_ct0DwOBAS2cw"
  }
];

// Função para obter thumbnail de uma playlist (primeiro vídeo)
export const getPlaylistThumbnail = (playlistId: string): string => {
  // Para playlists, usamos uma thumbnail padrão baseada no ID
  return `https://img.youtube.com/vi/${playlistId}/mqdefault.jpg`;
};
