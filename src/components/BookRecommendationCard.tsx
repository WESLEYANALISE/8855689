import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink } from "lucide-react";

interface BookRecommendation {
  id: number;
  title: string;
  author: string;
  cover?: string;
  about?: string;
}

interface BookRecommendationCardProps {
  book: BookRecommendation;
}

const BookRecommendationCard = ({ book }: BookRecommendationCardProps) => {
  const navigate = useNavigate();

  const handleViewBook = () => {
    navigate(`/biblioteca-fora-da-toga/${book.id}`);
  };

  return (
    <div className="my-4 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-lg">
          {book.cover ? (
            <img 
              src={book.cover} 
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground line-clamp-2">
                {book.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {book.author}
              </p>
            </div>
          </div>
          
          {book.about && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {book.about}
            </p>
          )}
          
          <Button
            onClick={handleViewBook}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver livro
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookRecommendationCard;