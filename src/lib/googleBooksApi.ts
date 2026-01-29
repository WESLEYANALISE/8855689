// API pública do Google Books - não requer autenticação
export interface GoogleBookInfo {
  title?: string;
  authors?: string[];
  description?: string;
  thumbnail?: string;
  pageCount?: number;
  publishedDate?: string;
  publisher?: string;
  categories?: string[];
  previewLink?: string;
  infoLink?: string;
}

export async function buscarCapaLivro(titulo: string, autor?: string): Promise<string | null> {
  try {
    const query = autor ? `${titulo}+inauthor:${autor}` : titulo;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=pt`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Erro ao buscar capa:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      // Retornar versão maior e HTTPS da imagem
      return data.items[0].volumeInfo.imageLinks.thumbnail
        .replace('zoom=1', 'zoom=2')
        .replace('http://', 'https://');
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar capa do livro:', error);
    return null;
  }
}

export async function buscarDetalhesLivro(titulo: string, autor?: string): Promise<GoogleBookInfo | null> {
  try {
    const query = autor ? `${titulo}+inauthor:${autor}` : titulo;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=pt`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Erro ao buscar detalhes:', response.status);
      return null;
    }
    
    const data = await response.json();
    const volume = data.items?.[0]?.volumeInfo;
    
    if (!volume) return null;
    
    return {
      title: volume.title,
      authors: volume.authors,
      description: volume.description,
      thumbnail: volume.imageLinks?.thumbnail?.replace('http://', 'https://').replace('zoom=1', 'zoom=3'),
      pageCount: volume.pageCount,
      publishedDate: volume.publishedDate,
      publisher: volume.publisher,
      categories: volume.categories,
      previewLink: volume.previewLink,
      infoLink: volume.infoLink,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do livro:', error);
    return null;
  }
}
